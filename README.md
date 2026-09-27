# 🛡 PhishGuard AI — Fake Website Detection System

> **B.Tech 3rd Year Project | AI & Data Science | Cybersecurity**

An AI-powered web application that uses Machine Learning to detect phishing and fraudulent websites in real-time, with confidence scores and explainable risk analysis.

---

## 🚀 Live Demo Features

| Feature | Description |
|---|---|
| 🔍 URL Analysis | Analyzes any HTTP/HTTPS URL instantly |
| 🤖 AI Prediction | Random Forest model with 95%+ accuracy |
| 📊 Confidence Score | Probability score for the prediction |
| ⚠ Risk Levels | Low / Medium / High risk classification |
| ⚡ Explainable AI | Human-readable reasons for each prediction |
| 📋 Scan History | All scans saved with search & delete |
| 🧪 Model Comparison | Random Forest vs Decision Tree vs Logistic Regression |

---

## 🧰 Technology Stack

```
Frontend:         React 18, React Router 6, Axios, Vite
Backend:          Python 3.11, Flask 3, Flask-CORS
Machine Learning: Scikit-learn, Pandas, NumPy, Joblib, Matplotlib
Database:         SQLite
```

---

## 📁 Project Structure

```
fake-website-detector/
│
├── frontend/              # React.js application
│   ├── src/
│   │   ├── api/          # Axios API client
│   │   ├── components/   # Navbar, ResultCard, RiskBadge, ConfidenceBar
│   │   ├── pages/        # Home, Detection, History, About
│   │   └── index.css     # Global design system
│   ├── index.html
│   └── package.json
│
├── backend/               # Flask REST API
│   ├── app.py            # Entry point
│   ├── routes/
│   │   ├── predict.py    # POST /api/predict
│   │   └── history.py    # GET/DELETE /api/history
│   └── utils/
│       ├── db.py         # SQLite helper
│       └── feature_extractor.py
│
├── machine_learning/      # ML pipeline
│   ├── train_model.py    # Train & evaluate models
│   ├── generate_dataset.py
│   ├── feature_extractor.py
│   ├── phishing_model.pkl  (generated)
│   ├── scaler.pkl          (generated)
│   └── model_metrics.json  (generated)
│
├── dataset/
│   └── phishing.csv       # Training dataset
│
├── database/
│   └── phishing.db        # SQLite database (auto-created)
│
├── docs/
│   └── confusion_matrix.png
│
├── requirements.txt
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm 8+

---

### Step 1 — Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

### Step 2 — Train the Machine Learning Model

```bash
cd machine_learning
python train_model.py
```

This will:
1. Generate a synthetic phishing dataset (if no real dataset exists)
2. Train 3 models: Random Forest, Decision Tree, Logistic Regression
3. Compare performance metrics (Accuracy, Precision, Recall, F1, ROC-AUC)
4. Save the best model as `phishing_model.pkl`

> 💡 **Using a real dataset?** Download the [UCI Phishing Dataset](https://archive.ics.uci.edu/dataset/327/phishing+websites) or [Kaggle Phishing URLs](https://www.kaggle.com/datasets/taruntiwarihp/phishing-site-urls), extract URL features with `feature_extractor.py`, and save as `dataset/phishing.csv`.

---

### Step 3 — Start the Flask Backend

```bash
cd backend
python app.py
```

API will run on `http://localhost:5000`

---

### Step 4 — Start the React Frontend

```bash
cd frontend
npm install     # Only first time
npm run dev
```

App will run on `http://localhost:5173`

---

## 🔌 REST API Reference

### POST `/api/predict`

Analyze a URL for phishing.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "prediction": "Fake",
  "confidence": 94.8,
  "risk": "High",
  "reasons": [
    "No HTTPS detected — connection is not encrypted",
    "URL contains an IP address instead of a domain name",
    "Suspicious keywords found in URL"
  ],
  "features": {
    "url_length": 52,
    "has_https": 0,
    "has_ip": 1
  },
  "model_used": "Random Forest"
}
```

---

### GET `/api/history`

Returns all prediction records (newest first).

---

### DELETE `/api/history/{id}`

Delete a specific prediction record.

---

### DELETE `/api/history`

Clear all prediction history.

---

### GET `/api/model-info`

Returns model performance metrics for the About page.

---

## 🧬 Extracted URL Features

| # | Feature | Description |
|---|---|---|
| 1 | URL Length | Total character count of the URL |
| 2 | Domain Length | Character count of the domain |
| 3 | Dot Count | Number of `.` in the URL |
| 4 | Hyphen Count | Number of `-` in the URL |
| 5 | Digit Count | Number of numeric digits |
| 6 | Slash Count | Number of `/` in the URL |
| 7 | Subdomain Count | Number of subdomains (beyond domain.tld) |
| 8 | Has HTTPS | Whether URL uses HTTPS (1/0) |
| 9 | Has IP | Whether domain is an IP address (1/0) |
| 10 | Has @ | Presence of `@` symbol (1/0) |
| 11 | Domain Hyphen | Hyphen present in domain (1/0) |
| 12 | Suspicious Keywords | Count of phishing-related keywords |
| 13 | Prefix-Suffix | Hyphen in domain prefix/suffix (1/0) |

---

## 🎯 Risk Classification

| Prediction | Confidence | Risk Level |
|---|---|---|
| Legitimate | ≥ 85% | 🟢 Low |
| Legitimate | 65–84% | 🟡 Medium |
| Fake | 65–84% | 🟡 Medium |
| Fake | ≥ 85% | 🔴 High |

---

## 📊 Model Performance (Sample Results)

| Model | Accuracy | F1 Score | ROC-AUC |
|---|---|---|---|
| 🏆 Random Forest | ~97% | ~97% | ~99% |
| Decision Tree | ~95% | ~95% | ~95% |
| Logistic Regression | ~89% | ~89% | ~95% |

> Actual metrics depend on dataset and will be shown live on the **About** page after training.

---

## 🔒 Security Considerations

- All URLs are validated before processing
- SQL injection prevented via parameterized queries
- CORS configured for frontend-only access
- Input sanitization on all API endpoints

---

## 🚀 Future Enhancements

- Browser Extension integration
- Google Safe Browsing API
- VirusTotal API integration
- WHOIS domain lookup
- Deep Learning models (LSTM for URL sequences)
- Cloud deployment (AWS/GCP)
- Mobile application

---

## 📄 License

This project is developed for academic purposes.

---

*Built with ❤ for B.Tech AI & Data Science Project Presentation*
