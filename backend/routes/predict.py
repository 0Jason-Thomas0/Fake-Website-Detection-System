"""
Prediction Route
================
POST /api/predict — accepts a URL, extracts features, runs the ML
model, and returns prediction + confidence + risk level + reasons.
"""

import os
import json
import datetime
import numpy as np
import joblib
from flask import Blueprint, request, jsonify

from utils.feature_extractor import extract_features, get_feature_names, get_risk_reasons
from utils.db import get_connection

predict_bp = Blueprint("predict", __name__)

# ── Load model & scaler at import time (cached for performance) ────────────────
_ML_DIR   = os.path.join(os.path.dirname(__file__), "..", "..", "machine_learning")
_MODEL    = None
_SCALER   = None
_FEAT_NAMES = get_feature_names()
_MODEL_NAME = "Unknown"


def _load_model():
    global _MODEL, _SCALER, _MODEL_NAME
    if _MODEL is None:
        model_path  = os.path.join(_ML_DIR, "phishing_model.pkl")
        scaler_path = os.path.join(_ML_DIR, "scaler.pkl")
        metrics_path = os.path.join(_ML_DIR, "model_metrics.json")

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                "Trained model not found. Please run: "
                "cd machine_learning && python train_model.py"
            )

        _MODEL  = joblib.load(model_path)
        _SCALER = joblib.load(scaler_path)

        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                data = json.load(f)
            _MODEL_NAME = data.get("best_model", "Unknown")


def _risk_level(confidence: float, prediction: str) -> str:
    """Map confidence + prediction to Low / Medium / High risk."""
    if prediction == "Legitimate":
        if confidence >= 85:
            return "Low"
        elif confidence >= 65:
            return "Medium"
        else:
            return "High"
    else:  # Fake
        if confidence >= 85:
            return "High"
        elif confidence >= 65:
            return "Medium"
        else:
            return "Low"


def _validate_url(url: str) -> tuple[bool, str]:
    """Basic URL validation. Returns (is_valid, error_message)."""
    import urllib.parse
    if not url or not isinstance(url, str):
        return False, "URL is required."
    url = url.strip()
    if len(url) < 4:
        return False, "URL is too short."
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False, "URL must start with http:// or https://"
        if not parsed.netloc:
            return False, "URL must contain a valid domain."
    except Exception:
        return False, "Invalid URL format."
    return True, ""


@predict_bp.route("/api/predict", methods=["POST"])
def predict():
    """
    Analyze a URL for phishing.

    Request body:
        {"url": "https://example.com"}

    Response:
        {
            "prediction": "Fake" | "Legitimate",
            "confidence": 94.8,
            "risk": "High" | "Medium" | "Low",
            "reasons": [...],
            "features": {...}
        }
    """
    try:
        _load_model()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503

    data = request.get_json(silent=True) or {}
    url  = (data.get("url") or "").strip()

    # Validate URL
    valid, err_msg = _validate_url(url)
    if not valid:
        return jsonify({"error": err_msg}), 400

    # Extract features
    features = extract_features(url)
    feat_vector = np.array([[features[k] for k in _FEAT_NAMES]])

    # Predict
    label_idx   = int(_MODEL.predict(feat_vector)[0])
    proba       = _MODEL.predict_proba(feat_vector)[0]
    confidence  = round(float(max(proba)) * 100, 2)
    prediction  = "Fake" if label_idx == 1 else "Legitimate"
    risk        = _risk_level(confidence, prediction)
    reasons     = get_risk_reasons(url, features, prediction)

    # Persist to history
    now       = datetime.datetime.now()
    scan_date = now.strftime("%Y-%m-%d")
    scan_time = now.strftime("%H:%M:%S")

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO predictions
              (url, prediction, confidence, risk_level, reasons, scan_date, scan_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (url, prediction, confidence, risk, json.dumps(reasons), scan_date, scan_time),
        )

    return jsonify({
        "prediction":  prediction,
        "confidence":  confidence,
        "risk":        risk,
        "reasons":     reasons,
        "features":    features,
        "model_used":  _MODEL_NAME,
    })


@predict_bp.route("/api/model-info", methods=["GET"])
def model_info():
    """Return model performance metrics for the About page."""
    metrics_path = os.path.join(_ML_DIR, "model_metrics.json")
    if not os.path.exists(metrics_path):
        return jsonify({"error": "Model metrics not found. Run train_model.py first."}), 404

    with open(metrics_path) as f:
        data = json.load(f)
    return jsonify(data)
