# -*- coding: utf-8 -*-
"""
Model Training Script
=====================
Trains Random Forest, Decision Tree, and Logistic Regression on the
phishing dataset. Evaluates all three, selects the best, and saves
the model + scaler as .pkl files.

Usage:
    cd machine_learning
    python train_model.py
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")   # non-interactive backend for saving figures
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(SCRIPT_DIR, "..", "dataset", "phishing.csv")
MODEL_OUT    = os.path.join(SCRIPT_DIR, "phishing_model.pkl")
SCALER_OUT   = os.path.join(SCRIPT_DIR, "scaler.pkl")
METRICS_OUT  = os.path.join(SCRIPT_DIR, "model_metrics.json")
DOCS_DIR     = os.path.join(SCRIPT_DIR, "..", "docs")


def load_dataset() -> pd.DataFrame:
    """Load phishing dataset; generate synthetic one if not found."""
    if not os.path.exists(DATASET_PATH):
        print("⚠  Real dataset not found. Generating synthetic dataset...")
        # Run the generator as a module
        sys.path.insert(0, SCRIPT_DIR)
        import generate_dataset  # noqa: F401
        generate_dataset.build_dataset().to_csv(DATASET_PATH, index=False)

    df = pd.read_csv(DATASET_PATH)
    print(f"[OK] Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    return df


def evaluate_model(name: str, model, X_test, y_test, X_train, y_train) -> dict:
    """Evaluate a trained model and return metrics dict."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics = {
        "name": name,
        "accuracy":  round(accuracy_score(y_test, y_pred) * 100, 2),
        "precision": round(precision_score(y_test, y_pred) * 100, 2),
        "recall":    round(recall_score(y_test, y_pred) * 100, 2),
        "f1_score":  round(f1_score(y_test, y_pred) * 100, 2),
        "roc_auc":   round(roc_auc_score(y_test, y_prob) * 100, 2),
    }

    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="accuracy")
    metrics["cv_mean"] = round(cv_scores.mean() * 100, 2)
    metrics["cv_std"]  = round(cv_scores.std() * 100, 2)

    print(f"\n{'='*50}")
    print(f"  Model     : {name}")
    print(f"  Accuracy  : {metrics['accuracy']:.2f}%")
    print(f"  Precision : {metrics['precision']:.2f}%")
    print(f"  Recall    : {metrics['recall']:.2f}%")
    print(f"  F1 Score  : {metrics['f1_score']:.2f}%")
    print(f"  ROC-AUC   : {metrics['roc_auc']:.2f}%")
    print(f"  CV (5-fold): {metrics['cv_mean']:.2f}% +/- {metrics['cv_std']:.2f}%")
    print(f"\n{classification_report(y_test, y_pred, target_names=['Legitimate','Phishing'])}")

    return metrics


def plot_confusion_matrix(model, X_test, y_test, name: str):
    """Save confusion matrix plot for the best model."""
    os.makedirs(DOCS_DIR, exist_ok=True)
    cm = confusion_matrix(y_test, model.predict(X_test))
    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(cm, cmap="Blues")
    plt.colorbar(im, ax=ax)
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(["Legitimate", "Phishing"])
    ax.set_yticklabels(["Legitimate", "Phishing"])
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title(f"Confusion Matrix — {name}")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                    color="white" if cm[i, j] > cm.max() / 2 else "black",
                    fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(os.path.join(DOCS_DIR, "confusion_matrix.png"), dpi=150)
    plt.close()
    print(f"\n[OK] Confusion matrix saved to docs/confusion_matrix.png")


def main():
    print("=" * 60)
    print("  Fake Website Detection — Model Training")
    print("=" * 60)

    # ── Load data ──────────────────────────────────────────────────
    df = load_dataset()

    feature_cols = [c for c in df.columns if c != "label"]
    X = df[feature_cols].values
    y = df["label"].values

    # ── Train/Test Split ───────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Feature Scaling ────────────────────────────────────────────
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    # ── Define Models ──────────────────────────────────────────────
    models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=None,
            min_samples_split=2, random_state=42, n_jobs=-1
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=10, min_samples_split=5, random_state=42
        ),
        "Logistic Regression": LogisticRegression(
            max_iter=1000, C=1.0, random_state=42
        ),
    }

    # ── Train & Evaluate ───────────────────────────────────────────
    all_metrics = []
    trained_models = {}

    print("\n>>> Training models...\n")
    for name, model in models.items():
        # Logistic Regression benefits from scaling; RF/DT don't require it
        if name == "Logistic Regression":
            model.fit(X_train_s, y_train)
            metrics = evaluate_model(name, model, X_test_s, y_test, X_train_s, y_train)
        else:
            model.fit(X_train, y_train)
            metrics = evaluate_model(name, model, X_test, y_test, X_train, y_train)

        all_metrics.append(metrics)
        trained_models[name] = model

    # ── Select Best Model ──────────────────────────────────────────
    best = max(all_metrics, key=lambda m: m["f1_score"])
    best_name  = best["name"]
    best_model = trained_models[best_name]

    print("\n" + "=" * 60)
    print(f"  [BEST] Best Model: {best_name}")
    print(f"     F1 Score : {best['f1_score']:.2f}%")
    print(f"     Accuracy : {best['accuracy']:.2f}%")
    print("=" * 60)

    # ── Save Model & Scaler ────────────────────────────────────────
    joblib.dump(best_model, MODEL_OUT)
    joblib.dump(scaler, SCALER_OUT)

    # Save feature column names for validation
    feature_names_path = os.path.join(SCRIPT_DIR, "feature_names.json")
    with open(feature_names_path, "w") as f:
        json.dump(feature_cols, f)

    print(f"\n[OK] Model saved  : {MODEL_OUT}")
    print(f"[OK] Scaler saved : {SCALER_OUT}")

    # ── Save Metrics JSON for Frontend ────────────────────────────
    summary = {
        "best_model": best_name,
        "models": all_metrics,
        "feature_count": len(feature_cols),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
    }
    with open(METRICS_OUT, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"[OK] Metrics saved: {METRICS_OUT}")

    # ── Confusion Matrix ──────────────────────────────────────────
    if best_name == "Logistic Regression":
        plot_confusion_matrix(best_model, X_test_s, y_test, best_name)
    else:
        plot_confusion_matrix(best_model, X_test, y_test, best_name)

    print("\n[DONE] Training complete!\n")


if __name__ == "__main__":
    main()
