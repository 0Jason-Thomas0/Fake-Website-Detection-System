"""
Prediction Route
================
POST /api/predict        — single URL
POST /api/predict/batch  — up to 25 URLs
POST /api/compare        — RF / DT / LR on one URL
GET  /api/model-info     — training metrics
"""

import os
import json
import datetime
import numpy as np
import joblib
from flask import Blueprint, request, jsonify

from utils.feature_extractor import (
    extract_features,
    get_feature_names,
    get_risk_reasons,
    SUSPICIOUS_KEYWORDS,
)
from utils.db import get_connection

predict_bp = Blueprint("predict", __name__)

_ML_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "machine_learning")
_MODEL = None
_SCALER = None
_FEAT_NAMES = get_feature_names()
_MODEL_NAME = "Unknown"
_COMPARE_MODELS = None


def _load_model():
    global _MODEL, _SCALER, _MODEL_NAME
    if _MODEL is None:
        model_path = os.path.join(_ML_DIR, "phishing_model.pkl")
        scaler_path = os.path.join(_ML_DIR, "scaler.pkl")
        metrics_path = os.path.join(_ML_DIR, "model_metrics.json")

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                "Trained model not found. Please run: "
                "cd machine_learning && python train_model.py"
            )

        _MODEL = joblib.load(model_path)
        _SCALER = joblib.load(scaler_path) if os.path.exists(scaler_path) else None

        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                data = json.load(f)
            _MODEL_NAME = data.get("best_model", "Unknown")


def _load_compare_models():
    """Load RF, DT, and LR pickles for the Model Lab."""
    global _COMPARE_MODELS, _SCALER
    if _COMPARE_MODELS is not None:
        return _COMPARE_MODELS

    paths = {
        "Random Forest": os.path.join(_ML_DIR, "rf_model.pkl"),
        "Decision Tree": os.path.join(_ML_DIR, "dt_model.pkl"),
        "Logistic Regression": os.path.join(_ML_DIR, "lr_model.pkl"),
    }
    missing = [name for name, path in paths.items() if not os.path.exists(path)]
    if missing:
        raise FileNotFoundError(
            "Comparison models not found (" + ", ".join(missing) + "). "
            "Please re-run: cd machine_learning && python train_model.py"
        )

    if _SCALER is None:
        scaler_path = os.path.join(_ML_DIR, "scaler.pkl")
        if os.path.exists(scaler_path):
            _SCALER = joblib.load(scaler_path)

    _COMPARE_MODELS = {name: joblib.load(path) for name, path in paths.items()}
    return _COMPARE_MODELS


def _risk_level(confidence: float, prediction: str) -> str:
    if prediction == "Legitimate":
        if confidence >= 85:
            return "Low"
        if confidence >= 65:
            return "Medium"
        return "High"
    if confidence >= 85:
        return "High"
    if confidence >= 65:
        return "Medium"
    return "Low"


def _validate_url(url: str) -> tuple[bool, str]:
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


def _score_vector(model, feat_vector, scaled=False):
    x = feat_vector
    if scaled and _SCALER is not None:
        x = _SCALER.transform(feat_vector)
    label_idx = int(model.predict(x)[0])
    proba = model.predict_proba(x)[0]
    classes = list(model.classes_)
    proba_by_label = {int(cls): float(p) for cls, p in zip(classes, proba)}
    proba_legit = round(proba_by_label.get(0, 0.0) * 100, 2)
    proba_fake = round(proba_by_label.get(1, 0.0) * 100, 2)
    confidence = round(float(max(proba)) * 100, 2)
    prediction = "Fake" if label_idx == 1 else "Legitimate"
    return {
        "prediction": prediction,
        "confidence": confidence,
        "risk": _risk_level(confidence, prediction),
        "proba_legit": proba_legit,
        "proba_fake": proba_fake,
    }


def _score_url(url: str) -> dict:
    _load_model()
    features = extract_features(url)
    feat_vector = np.array([[features[k] for k in _FEAT_NAMES]])
    use_scaler = _MODEL_NAME == "Logistic Regression"
    scored = _score_vector(_MODEL, feat_vector, scaled=use_scaler)
    reasons = get_risk_reasons(url, features, scored["prediction"])
    return {
        "url": url,
        "prediction": scored["prediction"],
        "confidence": scored["confidence"],
        "risk": scored["risk"],
        "reasons": reasons,
        "features": features,
        "model_used": _MODEL_NAME,
    }


def _save_prediction(result: dict) -> int:
    now = datetime.datetime.now()
    scan_date = now.strftime("%Y-%m-%d")
    scan_time = now.strftime("%H:%M:%S")
    with get_connection() as conn:
        cur = conn.execute(
            """
            INSERT INTO predictions
              (url, prediction, confidence, risk_level, reasons, scan_date, scan_time,
               features, model_used)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result["url"],
                result["prediction"],
                result["confidence"],
                result["risk"],
                json.dumps(result["reasons"]),
                scan_date,
                scan_time,
                json.dumps(result["features"]),
                result.get("model_used") or _MODEL_NAME,
            ),
        )
        return int(cur.lastrowid)


@predict_bp.route("/api/predict", methods=["POST"])
def predict():
    try:
        _load_model()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503

    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()

    valid, err_msg = _validate_url(url)
    if not valid:
        return jsonify({"error": err_msg}), 400

    result = _score_url(url)
    scan_id = _save_prediction(result)
    result["id"] = scan_id
    return jsonify(result)


@predict_bp.route("/api/predict/batch", methods=["POST"])
def predict_batch():
    try:
        _load_model()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503

    data = request.get_json(silent=True) or {}
    urls = data.get("urls")
    if not isinstance(urls, list):
        return jsonify({"error": "urls must be an array of strings."}), 400

    cleaned = []
    for item in urls:
        if isinstance(item, str) and item.strip():
            cleaned.append(item.strip())
    if not cleaned:
        return jsonify({"error": "Provide at least one URL."}), 400
    if len(cleaned) > 25:
        return jsonify({"error": "Batch is limited to 25 URLs."}), 400

    results = []
    failed = []
    for url in cleaned:
        valid, err_msg = _validate_url(url)
        if not valid:
            failed.append({"url": url, "error": err_msg})
            continue
        result = _score_url(url)
        result["id"] = _save_prediction(result)
        results.append(result)
    return jsonify({"results": results, "failed": failed})


@predict_bp.route("/api/compare", methods=["POST"])
def compare():
    try:
        models = _load_compare_models()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503

    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    valid, err_msg = _validate_url(url)
    if not valid:
        return jsonify({"error": err_msg}), 400

    features = extract_features(url)
    feat_vector = np.array([[features[k] for k in _FEAT_NAMES]])
    compared = []
    for name, model in models.items():
        scaled = name == "Logistic Regression"
        scored = _score_vector(model, feat_vector, scaled=scaled)
        compared.append({
            "name": name,
            "prediction": scored["prediction"],
            "confidence": scored["confidence"],
            "risk": scored["risk"],
            "proba_legit": scored["proba_legit"],
            "proba_fake": scored["proba_fake"],
        })
    return jsonify({"url": url, "features": features, "models": compared})


def _feature_baselines():
    import csv
    csv_path = os.path.abspath(os.path.join(_ML_DIR, "..", "dataset", "phishing.csv"))
    if not os.path.exists(csv_path):
        return None
    sums = {"legitimate": {c: 0.0 for c in _FEAT_NAMES}, "fake": {c: 0.0 for c in _FEAT_NAMES}}
    counts = {"legitimate": 0, "fake": 0}
    try:
        with open(csv_path, newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                try:
                    label = int(float(row.get("label", "")))
                except (TypeError, ValueError):
                    continue
                bucket = "fake" if label == 1 else "legitimate"
                counts[bucket] += 1
                for col in _FEAT_NAMES:
                    if col not in row:
                        continue
                    try:
                        sums[bucket][col] += float(row[col])
                    except (TypeError, ValueError):
                        continue
    except OSError:
        return None
    if not counts["legitimate"] or not counts["fake"]:
        return None
    return {
        key: {col: round(sums[key][col] / counts[key], 2) for col in _FEAT_NAMES}
        for key in ("legitimate", "fake")
    }


def _strip_bait_keywords(url: str) -> str:
    import re
    import urllib.parse
    parsed = urllib.parse.urlparse(url)
    path, query = parsed.path, parsed.query
    for kw in SUSPICIOUS_KEYWORDS:
        path = re.sub(re.escape(kw), "", path, flags=re.IGNORECASE)
        query = re.sub(re.escape(kw), "", query, flags=re.IGNORECASE)
    path = re.sub(r"/{2,}", "/", path) or "/"
    query = re.sub(r"&{2,}", "&", query).strip("&")
    rebuilt = urllib.parse.urlunparse(parsed._replace(path=path, query=query))
    return rebuilt


def _whatif_urls(url: str) -> list:
    import re
    import urllib.parse
    parsed = urllib.parse.urlparse(url)
    variants = []
    if parsed.scheme == "http":
        variants.append(("Use HTTPS", url.replace("http://", "https://", 1)))
    elif parsed.scheme == "https":
        variants.append(("Drop HTTPS", url.replace("https://", "http://", 1)))

    host = parsed.hostname or ""
    if re.search(r"^(\d{1,3}\.){3}\d{1,3}$", host):
        netloc = parsed.netloc.replace(host, "account.example.com", 1)
        variants.append(("Replace IP with a hostname", urllib.parse.urlunparse(parsed._replace(netloc=netloc))))

    stripped = _strip_bait_keywords(url)
    if stripped.rstrip("/") != url.rstrip("/"):
        variants.append(("Strip bait keywords from path", stripped))
    return variants


@predict_bp.route("/api/whatif", methods=["POST"])
def whatif():
    try:
        _load_model()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503

    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    valid, err_msg = _validate_url(url)
    if not valid:
        return jsonify({"error": err_msg}), 400

    original = _score_url(url)
    variants = []
    for label, alt in _whatif_urls(url):
        ok, _ = _validate_url(alt)
        if not ok or alt == url:
            continue
        scored = _score_url(alt)
        variants.append({
            "label": label,
            "url": alt,
            "prediction": scored["prediction"],
            "confidence": scored["confidence"],
            "risk": scored["risk"],
            "changed": scored["prediction"] != original["prediction"],
        })
    return jsonify({
        "original": {
            "prediction": original["prediction"],
            "confidence": original["confidence"],
            "risk": original["risk"],
        },
        "variants": variants,
    })


@predict_bp.route("/api/model-info", methods=["GET"])
def model_info():
    metrics_path = os.path.join(_ML_DIR, "model_metrics.json")
    if not os.path.exists(metrics_path):
        return jsonify({"error": "Model metrics not found. Run train_model.py first."}), 404

    with open(metrics_path) as f:
        data = json.load(f)
    data["baselines"] = _feature_baselines()
    return jsonify(data)
