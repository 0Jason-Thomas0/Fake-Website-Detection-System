"""
Feature Extractor — Backend Copy
=================================
Mirrors machine_learning/feature_extractor.py so the Flask API
does not depend on the ML folder at runtime.
"""

import re
import urllib.parse

SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "secure", "account", "update",
    "banking", "paypal", "ebay", "amazon", "apple", "google",
    "confirm", "password", "credential", "wallet", "transfer",
    "suspend", "alert", "click", "free", "winner", "prize",
    "limited", "urgent", "validate", "recovery", "support"
]


def extract_features(url: str) -> dict:
    """Extract 13 phishing-detection features from a URL."""
    features = {}
    try:
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc or ""
        full_url = url.lower()

        features["url_length"]             = len(url)
        features["domain_length"]          = len(domain)
        features["num_dots"]               = url.count(".")
        features["num_hyphens"]            = url.count("-")
        features["num_digits"]             = sum(c.isdigit() for c in url)
        features["num_slashes"]            = url.count("/")

        domain_clean = re.sub(r"^www\.", "", domain)
        parts = domain_clean.split(".")
        features["num_subdomains"]         = max(0, len(parts) - 2)

        features["has_https"]              = 1 if parsed.scheme == "https" else 0
        features["has_ip"]                 = 1 if re.search(r"(\d{1,3}\.){3}\d{1,3}", domain) else 0
        features["has_at"]                 = 1 if "@" in url else 0
        features["has_hyphen_domain"]      = 1 if "-" in domain else 0
        features["suspicious_keyword_count"] = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in full_url)
        features["prefix_suffix"]          = 1 if "-" in domain else 0

    except Exception:
        features = {k: 0 for k in [
            "url_length", "domain_length", "num_dots", "num_hyphens",
            "num_digits", "num_slashes", "num_subdomains", "has_https",
            "has_ip", "has_at", "has_hyphen_domain",
            "suspicious_keyword_count", "prefix_suffix",
        ]}

    return features


def get_feature_names() -> list:
    return [
        "url_length", "domain_length", "num_dots", "num_hyphens",
        "num_digits", "num_slashes", "num_subdomains", "has_https",
        "has_ip", "has_at", "has_hyphen_domain",
        "suspicious_keyword_count", "prefix_suffix",
    ]


def get_risk_reasons(url: str, features: dict, prediction: str) -> list:
    """Generate human-readable risk explanation strings."""
    reasons = []

    if features.get("has_https") == 0:
        reasons.append("No HTTPS detected — connection is not encrypted")
    if features.get("has_ip") == 1:
        reasons.append("URL contains an IP address instead of a domain name")
    if features.get("has_at") == 1:
        reasons.append("'@' symbol detected — browser ignores text before '@'")
    if features.get("has_hyphen_domain") == 1:
        reasons.append("Domain contains hyphens — common in phishing domains")
    if features.get("url_length", 0) > 75:
        reasons.append(f"URL is unusually long ({features['url_length']} characters)")
    if features.get("num_subdomains", 0) > 2:
        reasons.append(f"Multiple subdomains detected ({features['num_subdomains']}) — a deception technique")
    if features.get("suspicious_keyword_count", 0) > 0:
        reasons.append("Suspicious keywords found in URL (e.g., login, verify, secure, paypal)")
    if features.get("num_digits", 0) > 8:
        reasons.append(f"High number of digits in URL ({features['num_digits']})")

    if prediction == "Legitimate" and not reasons:
        reasons.append("URL passed all safety checks")
        reasons.append("Valid HTTPS encryption detected")
        reasons.append("No suspicious patterns found")

    if prediction == "Fake" and not reasons:
        reasons.append("URL pattern matches known phishing signatures")

    return reasons
