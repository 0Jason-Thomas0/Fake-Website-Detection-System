"""
History Route
=============
GET    /api/history        — list (optional q, prediction, risk, limit)
GET    /api/history/<id>   — one scan
GET    /api/stats          — dashboard aggregates
DELETE /api/history/<id>   — delete one
DELETE /api/history        — clear all
"""

import json
from flask import Blueprint, jsonify, request

from utils.db import get_connection

history_bp = Blueprint("history", __name__)


def _parse_json_field(value, default):
    if not value:
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return default


def _row_to_dict(row) -> dict:
    keys = row.keys()
    return {
        "id": row["id"],
        "url": row["url"],
        "prediction": row["prediction"],
        "confidence": row["confidence"],
        "risk_level": row["risk_level"],
        "reasons": _parse_json_field(row["reasons"], []),
        "scan_date": row["scan_date"],
        "scan_time": row["scan_time"],
        "features": _parse_json_field(row["features"], None) if "features" in keys else None,
        "model_used": (row["model_used"] if "model_used" in keys else None) or None,
    }


@history_bp.route("/api/stats", methods=["GET"])
def get_stats():
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) AS n FROM predictions").fetchone()["n"]
        fake = conn.execute(
            "SELECT COUNT(*) AS n FROM predictions WHERE prediction = 'Fake'"
        ).fetchone()["n"]
        legit = total - fake
        risk_rows = conn.execute(
            "SELECT risk_level, COUNT(*) AS n FROM predictions GROUP BY risk_level"
        ).fetchall()
        last = conn.execute(
            "SELECT * FROM predictions ORDER BY id DESC LIMIT 10"
        ).fetchall()

    by_risk = {"Low": 0, "Medium": 0, "High": 0}
    for row in risk_rows:
        level = row["risk_level"]
        if level in by_risk:
            by_risk[level] = row["n"]

    return jsonify({
        "total": total,
        "fake": fake,
        "legit": legit,
        "by_risk": by_risk,
        "last_scans": [_row_to_dict(r) for r in last],
    })


@history_bp.route("/api/history", methods=["GET"])
def get_history():
    q = (request.args.get("q") or "").strip().lower()
    prediction = (request.args.get("prediction") or "").strip()
    risk = (request.args.get("risk") or "").strip()
    try:
        limit = int(request.args.get("limit") or 0)
    except ValueError:
        limit = 0

    sql = "SELECT * FROM predictions WHERE 1=1"
    params = []
    if prediction in ("Fake", "Legitimate"):
        sql += " AND prediction = ?"
        params.append(prediction)
    if risk in ("Low", "Medium", "High"):
        sql += " AND risk_level = ?"
        params.append(risk)
    sql += " ORDER BY id DESC"
    if limit > 0:
        sql += " LIMIT ?"
        params.append(limit)

    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()

    records = [_row_to_dict(r) for r in rows]
    if q:
        records = [
            r for r in records
            if q in r["url"].lower()
            or q in r["prediction"].lower()
            or q in r["risk_level"].lower()
        ]
    return jsonify(records)


@history_bp.route("/api/history/<int:prediction_id>", methods=["GET"])
def get_one(prediction_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM predictions WHERE id = ?", (prediction_id,)
        ).fetchone()
    if row is None:
        return jsonify({"error": "Record not found"}), 404
    return jsonify(_row_to_dict(row))


@history_bp.route("/api/history/<int:prediction_id>", methods=["DELETE"])
def delete_one(prediction_id):
    with get_connection() as conn:
        result = conn.execute(
            "DELETE FROM predictions WHERE id = ?", (prediction_id,)
        )
    if result.rowcount == 0:
        return jsonify({"error": "Record not found"}), 404
    return jsonify({"message": "Deleted successfully", "id": prediction_id})


@history_bp.route("/api/history", methods=["DELETE"])
def clear_history():
    with get_connection() as conn:
        conn.execute("DELETE FROM predictions")
    return jsonify({"message": "All history cleared"})
