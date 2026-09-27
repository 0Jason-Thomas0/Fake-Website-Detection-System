"""
Feature Extractor Module
========================
Extracts 13 URL-based features for phishing detection.
This module is reusable across training and Flask API.
"""

import re
import urllib.parse


# Suspicious keywords commonly found in phishing URLs
SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "secure", "account", "update",
    "banking", "paypal", "ebay", "amazon", "apple", "google",
    "confirm", "password", "credential", "wallet", "transfer",
    "suspend", "alert", "click", "free", "winner", "prize",
    "limited", "urgent", "validate", "recovery", "support"
]


def extract_features(url: str) -> dict:
    """
    Extract phishing-detection features from a URL.

    Parameters
    ----------
    url : str
        The URL to analyze.

    Returns
    -------
    dict
        A dictionary of 13 extracted features.
    """
    features = {}

    try:
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc or ""
        path = parsed.path or ""
        full_url = url.lower()

        # 1. URL Length
        features["url_length"] = len(url)

        # 2. Domain Length
        features["domain_length"] = len(domain)

        # 3. Number of Dots in URL
        features["num_dots"] = url.count(".")

        # 4. Number of Hyphens in URL
        features["num_hyphens"] = url.count("-")

        # 5. Number of Digits in URL
        features["num_digits"] = sum(c.isdigit() for c in url)

        # 6. Number of Slashes in URL
        features["num_slashes"] = url.count("/")

        # 7. Number of Subdomains
        #    Strip 'www.' and count remaining parts minus domain + TLD
        domain_clean = re.sub(r"^www\.", "", domain)
        parts = domain_clean.split(".")
        features["num_subdomains"] = max(0, len(parts) - 2)

        # 8. Has HTTPS (1 = yes, 0 = no)
        features["has_https"] = 1 if parsed.scheme == "https" else 0

        # 9. Has IP Address in domain
        ip_pattern = re.compile(
            r"(\d{1,3}\.){3}\d{1,3}"
        )
        features["has_ip"] = 1 if ip_pattern.search(domain) else 0

        # 10. Has '@' symbol
        features["has_at"] = 1 if "@" in url else 0

        # 11. Has '-' in domain (common in phishing: paypal-secure.com)
        features["has_hyphen_domain"] = 1 if "-" in domain else 0

        # 12. Suspicious Keyword Count
        keyword_count = sum(
            1 for kw in SUSPICIOUS_KEYWORDS if kw in full_url
        )
        features["suspicious_keyword_count"] = keyword_count

        # 13. Prefix/Suffix '-' in domain
        features["prefix_suffix"] = 1 if "-" in domain else 0

    except Exception:
        # Return zero-filled features on parse failure
        features = {
            "url_length": 0,
            "domain_length": 0,
            "num_dots": 0,
            "num_hyphens": 0,
            "num_digits": 0,
            "num_slashes": 0,
            "num_subdomains": 0,
            "has_https": 0,
            "has_ip": 0,
            "has_at": 0,
            "has_hyphen_domain": 0,
            "suspicious_keyword_count": 0,
            "prefix_suffix": 0,
        }

    return features


def get_feature_names() -> list:
    """Return the ordered list of feature names used by the model."""
    return [
        "url_length",
        "domain_length",
        "num_dots",
        "num_hyphens",
        "num_digits",
        "num_slashes",
        "num_subdomains",
        "has_https",
        "has_ip",
        "has_at",
        "has_hyphen_domain",
        "suspicious_keyword_count",
        "prefix_suffix",
    ]


def get_risk_reasons(url: str, features: dict, prediction: str) -> list:
    """
    Generate human-readable explanations for the prediction.

    Parameters
    ----------
    url : str
        The analyzed URL.
    features : dict
        Extracted features dictionary.
    prediction : str
        'Fake' or 'Legitimate'.

    Returns
    -------
    list
        List of reason strings.
    """
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
        reasons.append(
            f"Multiple subdomains detected ({features['num_subdomains']}) — a deception technique"
        )

    if features.get("suspicious_keyword_count", 0) > 0:
        reasons.append(
            f"Suspicious keywords found in URL (e.g., login, verify, secure, paypal)"
        )

    if features.get("num_digits", 0) > 8:
        reasons.append(f"High number of digits in URL ({features['num_digits']})")

    if prediction == "Legitimate" and not reasons:
        reasons.append("URL passed all safety checks")
        reasons.append("Valid HTTPS encryption detected")
        reasons.append("No suspicious patterns found")

    if prediction == "Fake" and not reasons:
        reasons.append("URL pattern matches known phishing signatures")

    return reasons
