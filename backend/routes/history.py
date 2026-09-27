"""
History Route
=============
GET    /api/history        — fetch all prediction records
DELETE /api/history/<id>   — delete one prediction by ID
DELETE /api/history        — clear all prediction records
"""

import json
from flask import Blueprint, jsonify

from utils.db import get_connection

history_bp = Blueprint("history", __name__)


def _row_to_dict(row) -> dict:
    """Convert a sqlite3.Row to a JSON-serialisable dict."""
    return {
        "id":         row["id"],
        "url":        row["url"],
        "prediction": row["prediction"],
        "confidence": row["confidence"],
        "risk_level": row["risk_level"],
        "reasons":    json.loads(row["reasons"]),
        "scan_date":  row["scan_date"],
        "scan_time":  row["scan_time"],
    }


@history_bp.route("/api/history", methods=["GET"])
def get_history():
    """Return all predictions, newest first."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM predictions ORDER BY id DESC"
        ).fetchall()
    return jsonify([_row_to_dict(r) for r in rows])


@history_bp.route("/api/history/<int:prediction_id>", methods=["DELETE"])
def delete_one(prediction_id: int):
    """Delete a single prediction record."""
    with get_connection() as conn:
        result = conn.execute(
            "DELETE FROM predictions WHERE id = ?", (prediction_id,)
        )
    if result.rowcount == 0:
        return jsonify({"error": "Record not found"}), 404
    return jsonify({"message": "Deleted successfully", "id": prediction_id})


@history_bp.route("/api/history", methods=["DELETE"])
def clear_history():
    """Delete all prediction records."""
    with get_connection() as conn:
        conn.execute("DELETE FROM predictions")
    return jsonify({"message": "All history cleared"})
