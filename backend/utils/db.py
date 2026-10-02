"""
Database Utility
================
SQLite connection helper and schema initialization for the
Fake Website Detection System.
"""

import os
import sqlite3
from contextlib import contextmanager

# Resolve DB path relative to project root
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(_BASE_DIR, "..", "..", "database", "phishing.db")


def get_db_path() -> str:
    """Return the absolute path to the SQLite database file."""
    return os.path.abspath(DB_PATH)


def init_db():
    """Create the database schema if it does not already exist."""
    db_file = get_db_path()
    os.makedirs(os.path.dirname(db_file), exist_ok=True)

    with sqlite3.connect(db_file) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                url         TEXT    NOT NULL,
                prediction  TEXT    NOT NULL,
                confidence  REAL    NOT NULL,
                risk_level  TEXT    NOT NULL,
                reasons     TEXT    NOT NULL,
                scan_date   TEXT    NOT NULL,
                scan_time   TEXT    NOT NULL,
                features    TEXT,
                model_used  TEXT
            )
            """
        )
        existing = {
            row[1] for row in conn.execute("PRAGMA table_info(predictions)").fetchall()
        }
        if "features" not in existing:
            conn.execute("ALTER TABLE predictions ADD COLUMN features TEXT")
        if "model_used" not in existing:
            conn.execute("ALTER TABLE predictions ADD COLUMN model_used TEXT")
        conn.commit()


@contextmanager
def get_connection():
    """Context manager for a SQLite connection (auto-commit / rollback)."""
    db_file = get_db_path()
    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row   # access columns by name
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
