"""
Flask Application Entry Point
==============================
Fake Website Detection System — REST API

Run:
    python app.py
    OR
    flask run --host=0.0.0.0 --port=5000
"""

import os
from flask import Flask
from flask_cors import CORS

from utils.db import init_db
from routes.predict import predict_bp
from routes.history import history_bp

# ── Create Flask app ───────────────────────────────────────────────────────────
app = Flask(__name__)

# ── CORS — allow React dev server (port 5173) and production ──────────────────
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:3000", "*"]}})

# ── Register Blueprints ────────────────────────────────────────────────────────
app.register_blueprint(predict_bp)
app.register_blueprint(history_bp)


# ── Health check ───────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return {"status": "ok", "service": "Fake Website Detection API"}


# ── Error handlers ─────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return {"error": "Endpoint not found"}, 404


@app.errorhandler(405)
def method_not_allowed(e):
    return {"error": "Method not allowed"}, 405


@app.errorhandler(500)
def server_error(e):
    return {"error": "Internal server error"}, 500


# ── Startup ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🔧 Initializing database...")
    init_db()
    print("✅ Database ready.")
    print("🚀 Starting Flask API on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
