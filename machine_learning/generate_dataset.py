"""
Synthetic Phishing Dataset Generator
=====================================
Generates a realistic phishing/legitimate URL dataset (~5000 samples).
Run this only if you don't have a real dataset in dataset/phishing.csv.

Usage:
    python generate_dataset.py
"""

import os
import numpy as np
import pandas as pd
from feature_extractor import extract_features

# ── Seed for reproducibility ──────────────────────────────────────────────────
np.random.seed(42)

# ── Sample URL pools ──────────────────────────────────────────────────────────

LEGITIMATE_URLS = [
    "https://www.google.com/search?q=python",
    "https://github.com/openai/gpt-4",
    "https://stackoverflow.com/questions/tagged/python",
    "https://www.wikipedia.org/wiki/Machine_learning",
    "https://www.amazon.com/dp/B09G3HRMVB",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://twitter.com/home",
    "https://www.linkedin.com/in/example",
    "https://docs.python.org/3/library/os.html",
    "https://flask.palletsprojects.com/en/2.3.x/",
    "https://scikit-learn.org/stable/modules/tree.html",
    "https://www.microsoft.com/en-us/windows",
    "https://developer.mozilla.org/en-US/docs/Web",
    "https://www.coursera.org/learn/machine-learning",
    "https://www.kaggle.com/datasets",
    "https://pytorch.org/tutorials/",
    "https://www.bbc.com/news/technology",
    "https://www.nytimes.com/section/technology",
    "https://medium.com/towards-data-science",
    "https://arxiv.org/abs/2303.08774",
]

PHISHING_URLS = [
    "http://192.168.1.100/paypal-login/verify.php",
    "http://paypal-secure-login.com/account/confirm",
    "http://amazon-update-account.xyz/signin?redirect=billing",
    "http://google-account-verify.tk/login.html",
    "http://secure-banking-update.info/wells-fargo/login",
    "http://apple-id-suspended.com/verify-now",
    "http://ebay-customer-support.net/signin@ebay",
    "http://123.45.67.89/phishing/bank-login",
    "http://free-winner-prize.click/claim-now",
    "http://account-suspended-alert.com/recover",
    "http://192.0.2.1/paypal/login/verify?user=1234",
    "http://secure-paypal-confirm.top/update-billing",
    "http://www.microsoft-alert.xyz/windows-support-warning",
    "http://urgent-account-update.pw/banking/wells-fargo",
    "http://validate-amazon-prime.tk/account?session=abc123",
    "http://support-google-recovery.ml/verify-identity",
    "http://login-secure-verify-paypal.info/confirm.php",
    "http://10.0.0.1/bank/login/secure@credentials",
    "http://limited-offer-free-iphone.click/winner?id=9",
    "http://apple-account-suspended.ga/id/recover",
]


def generate_legitimate_url() -> str:
    """Generate a synthetic legitimate URL."""
    base = np.random.choice(LEGITIMATE_URLS)
    # Occasionally add minor path variations
    if np.random.random() > 0.6:
        base += f"/page/{np.random.randint(1, 100)}"
    return base


def generate_phishing_url() -> str:
    """Generate a synthetic phishing URL with random variations."""
    base = np.random.choice(PHISHING_URLS)

    # Randomly mutate to add variety
    mutations = [
        lambda u: u.replace("login", f"login{np.random.randint(10, 999)}"),
        lambda u: u + f"?id={np.random.randint(1000, 9999)}",
        lambda u: u + f"&token={np.random.randint(100000, 999999)}",
        lambda u: u,  # keep as-is
    ]
    mutate = np.random.choice(mutations)
    return mutate(base)


def build_dataset(n_legitimate: int = 2500, n_phishing: int = 2500) -> pd.DataFrame:
    """Build a balanced dataset of legitimate (0) and phishing (1) samples."""
    print(f"Generating {n_legitimate} legitimate URLs...")
    legit_records = []
    for _ in range(n_legitimate):
        url = generate_legitimate_url()
        feats = extract_features(url)
        feats["label"] = 0  # 0 = Legitimate
        legit_records.append(feats)

    print(f"Generating {n_phishing} phishing URLs...")
    phish_records = []
    for _ in range(n_phishing):
        url = generate_phishing_url()
        feats = extract_features(url)
        feats["label"] = 1  # 1 = Phishing / Fake
        phish_records.append(feats)

    df = pd.DataFrame(legit_records + phish_records)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"\nDataset Summary:")
    print(f"  Total samples : {len(df)}")
    print(f"  Legitimate    : {(df['label'] == 0).sum()}")
    print(f"  Phishing      : {(df['label'] == 1).sum()}")
    print(f"  Features      : {df.shape[1] - 1}")
    return df


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(script_dir, "..", "dataset")
    os.makedirs(dataset_dir, exist_ok=True)
    output_path = os.path.join(dataset_dir, "phishing.csv")

    df = build_dataset(n_legitimate=2500, n_phishing=2500)
    df.to_csv(output_path, index=False)
    print(f"\n✅ Dataset saved to: {output_path}")
