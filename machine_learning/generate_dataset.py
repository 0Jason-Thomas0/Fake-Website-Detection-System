"""
Synthetic Phishing Dataset Generator
=====================================
Builds a balanced set with overlapping feature space so models
cannot score a perfect 100% on the hold-out set.

Usage:
    python generate_dataset.py
"""

import os
import numpy as np
import pandas as pd
from feature_extractor import extract_features

np.random.seed(42)

# Easy legitimate: HTTPS, known brands, clean hostnames
EASY_LEGIT = [
    "https://www.google.com/search?q=python",
    "https://github.com/openai/gpt-4",
    "https://stackoverflow.com/questions/tagged/python",
    "https://www.wikipedia.org/wiki/Machine_learning",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://docs.python.org/3/library/os.html",
    "https://scikit-learn.org/stable/modules/tree.html",
    "https://developer.mozilla.org/en-US/docs/Web",
    "https://www.bbc.com/news/technology",
    "https://arxiv.org/abs/2303.08774",
]

# Hard legitimate: hyphens, digits, login paths, occasional HTTP
HARD_LEGIT = [
    "https://accounts.google.com/signin/v2/identifier",
    "https://www.paypal.com/signin",
    "https://secure.bankofamerica.com/login/sign-in/signOnV2Screen.go",
    "http://neverssl.com/",
    "https://en.wikipedia.org/wiki/Two-factor_authentication",
    "https://support.apple.com/en-us/HT204658",
    "https://www.amazon.com/gp/your-account/order-history",
    "https://login.microsoftonline.com/",
    "https://github.com/login",
    "https://www.irs.gov/payments/pay-your-taxes",
]

# Easy phishing: IP, no HTTPS, bait keywords
EASY_PHISH = [
    "http://192.168.1.100/paypal-login/verify.php",
    "http://123.45.67.89/phishing/bank-login",
    "http://10.0.0.1/bank/login/secure@credentials",
    "http://free-winner-prize.click/claim-now",
    "http://limited-offer-free-iphone.click/winner?id=9",
    "http://account-suspended-alert.com/recover",
    "http://login-secure-verify-paypal.info/confirm.php",
    "http://urgent-account-update.pw/banking/wells-fargo",
]

# Hard phishing: HTTPS, no IP, looks closer to real sites
HARD_PHISH = [
    "https://paypal-secure-login.com/account/confirm",
    "https://www.paypa1.com/signin",
    "https://apple-id-support.help/verify",
    "https://accounts.g00gle.com/signin",
    "https://login.micros0ftonline.com/",
    "https://secure-amazon-update.net/billing",
    "https://www.bankofamerica-secure.com/login",
    "https://github-security-alert.com/session",
    "https://www.wikipedia-reset.org/wiki/login",
    "https://docs-python.org/account/recover",
]


def _jitter_legit(url: str) -> str:
    if np.random.random() > 0.55:
        url += f"/page/{np.random.randint(1, 400)}"
    if np.random.random() > 0.8:
        url += f"?ref={np.random.randint(10, 9999)}"
    return url


def _jitter_phish(url: str) -> str:
    roll = np.random.random()
    if roll < 0.25:
        url = url.replace("login", f"login{np.random.randint(10, 99)}", 1)
    elif roll < 0.5:
        url += f"?id={np.random.randint(1000, 9999)}"
    elif roll < 0.7:
        url += f"&session={np.random.randint(100000, 999999)}"
    return url


def generate_legitimate_url() -> str:
    # ~35% hard legit so features overlap with phishing
    pool = HARD_LEGIT if np.random.random() < 0.35 else EASY_LEGIT
    return _jitter_legit(np.random.choice(pool))


def generate_phishing_url() -> str:
    # ~45% hard phishing so HTTPS / clean hosts appear in the fake class
    pool = HARD_PHISH if np.random.random() < 0.45 else EASY_PHISH
    return _jitter_phish(np.random.choice(pool))


def build_dataset(n_legitimate: int = 2500, n_phishing: int = 2500) -> pd.DataFrame:
    """Build a balanced dataset of legitimate (0) and phishing (1) samples."""
    print(f"Generating {n_legitimate} legitimate URLs...")
    records = []
    for _ in range(n_legitimate):
        feats = extract_features(generate_legitimate_url())
        feats["label"] = 0
        records.append(feats)

    print(f"Generating {n_phishing} phishing URLs...")
    for _ in range(n_phishing):
        feats = extract_features(generate_phishing_url())
        feats["label"] = 1
        records.append(feats)

    df = pd.DataFrame(records)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Small label noise so the problem is not linearly perfect
    flip_n = max(1, int(len(df) * 0.04))
    flip_idx = np.random.choice(df.index, size=flip_n, replace=False)
    df.loc[flip_idx, "label"] = 1 - df.loc[flip_idx, "label"]

    print("\nDataset Summary:")
    print(f"  Total samples : {len(df)}")
    print(f"  Legitimate    : {(df['label'] == 0).sum()}")
    print(f"  Phishing      : {(df['label'] == 1).sum()}")
    print(f"  Features      : {df.shape[1] - 1}")
    print(f"  Label flips   : {flip_n}")
    return df


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(script_dir, "..", "dataset")
    os.makedirs(dataset_dir, exist_ok=True)
    output_path = os.path.join(dataset_dir, "phishing.csv")

    df = build_dataset(n_legitimate=2500, n_phishing=2500)
    df.to_csv(output_path, index=False)
    print(f"\n[OK] Dataset saved to: {output_path}")
