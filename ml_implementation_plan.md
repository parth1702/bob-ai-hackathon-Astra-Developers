# 🤖 ML Implementation Plan — Supply Chain AI Assistant
## Team Astra | IBM Bob Hackathon

---

## Overview: What ML Components Does This Project Need?

Based on the L2 problem statement and the existing codebase, there are **4 distinct ML/AI components** needed:

| # | ML Component | Purpose | Current State | ML Approach |
|---|---|---|---|---|
| **ML-1** | 🌡️ Cold Chain Anomaly Detection | Detect temperature excursions from IoT sensor data before delivery | Rule-based thresholds in `cold_chain_service.py` | **Time-Series Anomaly Detection** (Isolation Forest + LSTM Autoencoder) |
| **ML-2** | 🔴 Disruption Impact & Risk Classification | Predict disruption severity and which shipments are at risk | Hardcoded haversine proximity check in `disruption_service.py` | **Multi-class Classification** (XGBoost / Random Forest / LightGBM) |
| **ML-3** | 🤖 Bob AI Copilot (NLP) | Natural language supply chain assistant with context-aware recommendations | Keyword-matching `if/elif` in `bob_copilot_service.py` | **Free LLM API** (Groq / Google Gemini — no training needed) |
| **ML-4** | 🚛 Fleet Rebalancing Optimizer | Score & rank idle asset redeployment opportunities | Hardcoded `if "Antwerp"` rules in `fleet_service.py` | **Scoring Model** (Gradient Boosted Regressor or heuristic optimization) |

---

## 🟢 ML-3: Bob AI Copilot — FREE LLM API (No Training Needed!)

> [!TIP]
> This is the **quickest win** — replace the hardcoded keyword matching in `bob_copilot_service.py` with a real LLM API. No training, no dataset, no model files. Just API integration.

### Available Free LLM APIs (Confirmed Working)

| Provider | Model | Free Tier | Speed | Best For |
|---|---|---|---|---|
| **Groq** ⭐ | `llama-3.3-70b-versatile` | 14,400 req/day, 6K tokens/min | Ultra-fast (<500ms) | Primary chatbot engine |
| **Google Gemini** | `gemini-2.0-flash` | 15 RPM, 1M tokens/day | Fast | Backup / large context tasks |
| **Hugging Face Serverless** | `mistralai/Mistral-7B-Instruct-v0.3` | Rate-limited free tier | Medium | Fallback |
| **OpenRouter** | Multiple models | $0 free credits on signup | Varies | Multi-model failover |

### Implementation Plan (ML-3)

```
1. Sign up at https://console.groq.com → Get free API key
2. pip install groq
3. Create `src/backend/services/llm_service.py`
4. Build system prompt with supply chain context injection
5. Replace keyword matching in bob_copilot_service.py with LLM call
6. Add fallback to Gemini if Groq rate-limited
```

#### Architecture:
```
User Prompt → Inject Context (disruptions, shipments, fleet, cold-chain data)
           → Send to Groq LLM API (llama-3.3-70b)
           → Parse structured response (answer + recommendations)
           → Return to frontend
```

#### System Prompt Template:
```
You are Bob, an autonomous AI supply chain operations copilot.
You have access to the following real-time operational data:

ACTIVE DISRUPTIONS: {json_disruptions}
AT-RISK SHIPMENTS: {json_shipments}
IDLE FLEET ASSETS: {json_fleet}
COLD CHAIN ALERTS: {json_cold_chain}

Based on the user's query, provide:
1. Situational intelligence analysis
2. Specific actionable recommendations with shipment/asset IDs
3. Risk quantification in USD

Respond in structured markdown format.
```

### Files to Create/Modify:
- **[NEW]** `src/backend/services/llm_service.py` — Groq/Gemini API wrapper with failover
- **[MODIFY]** `src/backend/services/bob_copilot_service.py` — Replace keyword matching with LLM calls
- **[MODIFY]** `src/backend/requirements.txt` — Add `groq`, `google-generativeai`
- **[MODIFY]** `src/.env.example` — Add `GROQ_API_KEY`, `GEMINI_API_KEY`

---

## 🌡️ ML-1: Cold Chain Anomaly Detection (Full ML Pipeline)

### Step 1: Problem Statement

**Goal:** Detect temperature excursions in cold-chain shipments (vaccines, biologics, perishables) **before delivery** using IoT sensor time-series data, replacing the current static threshold-based approach with a predictive model that can identify **subtle drift patterns and silent failures** that simple rules miss.

**Business Impact:** 
- $35B/year in cold-chain pharmaceutical losses globally
- A single missed excursion on a $680K vaccine shipment = total cargo loss
- Current system only catches breaches **after** they exceed hard thresholds; ML can predict breaches **30-60 minutes before** they happen

**ML Task Type:** Binary Classification + Time-Series Anomaly Detection
- **Input:** Rolling window of IoT telemetry (temperature, humidity, vibration, ambient temp, battery %, shock, door-open events)
- **Output:** `failure` (0/1) + `silent_failure` (0/1) + `time_to_breach_minutes` (regression)

---

### Step 2: Collect Dataset

#### Primary Dataset (Kaggle — Free)
| Dataset | Source | Size | Key Features |
|---|---|---|---|
| **Cold Chain Shipment Silent Failure Dataset** ⭐ | [Kaggle](https://www.kaggle.com/datasets) — Search: "Cold Chain Shipment Silent Failure" | 8,000 shipments, 24 columns | temp_mean, temp_max, temp_min, temp_std, humidity stats, vibration_index, transit_duration, door_open_count, carrier_id, product_volume, `label`, `silent_failure` |
| **IoT-Based Healthcare Cold-Chain Monitoring** | [Kaggle](https://www.kaggle.com/datasets) — Search: "IoT Healthcare Cold Chain" | Time-series sensor logs | Continuous temperature readings for medical products |
| **Cold Supply Chain Data** | [Kaggle](https://www.kaggle.com/datasets) — Search: "Cold_Supply_Chain_Data" | Temperature prediction focus | Route info + temp logs |

#### Download Commands:
```bash
# Install Kaggle CLI
pip install kaggle

# Download primary dataset (after placing kaggle.json in ~/.kaggle/)
kaggle datasets download -d <dataset-slug>/cold-chain-shipment-silent-failure
unzip cold-chain-shipment-silent-failure.zip -d src/ml/data/cold_chain/
```

> [!NOTE]
> If Kaggle CLI isn't set up, download manually from the Kaggle website and place CSV in `src/ml/data/cold_chain/`

---

### Step 3: Understand Dataset

```python
import pandas as pd

df = pd.read_csv("src/ml/data/cold_chain/cold_chain_data.csv")

# Basic exploration
print(f"Shape: {df.shape}")
print(f"\nColumns:\n{df.columns.tolist()}")
print(f"\nData Types:\n{df.dtypes}")
print(f"\nFirst 5 Rows:\n{df.head()}")
print(f"\nStatistics:\n{df.describe()}")
print(f"\nNull Counts:\n{df.isnull().sum()}")
print(f"\nTarget Distribution:\n{df['label'].value_counts(normalize=True)}")
print(f"\nSilent Failure Rate:\n{df['silent_failure'].value_counts(normalize=True)}")
```

**Expected Schema (Cold Chain Silent Failure Dataset):**
| Column | Type | Description |
|---|---|---|
| `temp_mean` | float | Average temperature during transit |
| `temp_max` | float | Maximum recorded temperature |
| `temp_min` | float | Minimum recorded temperature |
| `temp_std` | float | Temperature standard deviation |
| `temp_recovery_rate` | float | Rate of temperature recovery after excursion |
| `humidity_mean` | float | Average humidity |
| `humidity_std` | float | Humidity variation |
| `vibration_index` | float | Composite vibration score |
| `transit_duration_hrs` | float | Total transit time |
| `door_open_count` | int | Number of door-open events |
| `package_type` | categorical | Type of packaging |
| `product_volume` | float | Volume of cargo |
| `fill_ratio` | float | Container fill ratio |
| `carrier_id` | categorical | Carrier identifier |
| `route_id` | categorical | Route taken |
| `label` | binary (0/1) | Failure occurred? |
| `silent_failure` | binary (0/1) | Silent failure (no alarm triggered)? |

---

### Step 4: Data Cleaning

```python
# Handle missing values
df = df.dropna(subset=['label', 'silent_failure'])  # Never drop target rows

# Impute numerical nulls with median (robust to outliers)
num_cols = df.select_dtypes(include=['float64', 'int64']).columns
df[num_cols] = df[num_cols].fillna(df[num_cols].median())

# Impute categorical nulls with mode
cat_cols = df.select_dtypes(include=['object']).columns
for col in cat_cols:
    df[col] = df[col].fillna(df[col].mode()[0])

# Remove exact duplicates
df = df.drop_duplicates()

# Fix data types
df['door_open_count'] = df['door_open_count'].astype(int)
df['label'] = df['label'].astype(int)
df['silent_failure'] = df['silent_failure'].astype(int)

# Sanity checks
assert df['label'].isin([0, 1]).all(), "Target must be binary"
assert df.isnull().sum().sum() == 0, "No nulls should remain"

print(f"Cleaned dataset: {df.shape[0]} rows, {df.shape[1]} columns")
```

---

### Step 5: Data Analysis

```python
import matplotlib.pyplot as plt
import seaborn as sns

# 1. Target class distribution
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
df['label'].value_counts().plot.bar(ax=axes[0], color=['#10b981', '#f43f5e'])
axes[0].set_title('Failure Distribution')
df['silent_failure'].value_counts().plot.bar(ax=axes[1], color=['#3b82f6', '#f59e0b'])
axes[1].set_title('Silent Failure Distribution')
plt.tight_layout()
plt.savefig('src/ml/outputs/target_distribution.png')

# 2. Temperature statistics by failure status
fig, ax = plt.subplots(figsize=(10, 5))
df.groupby('label')[['temp_mean', 'temp_max', 'temp_min', 'temp_std']].mean().plot.bar(ax=ax)
ax.set_title('Temperature Stats: Normal vs Failed Shipments')
plt.savefig('src/ml/outputs/temp_by_failure.png')

# 3. Correlation heatmap
plt.figure(figsize=(14, 10))
corr = df.select_dtypes(include='number').corr()
sns.heatmap(corr, annot=True, cmap='coolwarm', center=0, fmt='.2f')
plt.title('Feature Correlation Matrix')
plt.savefig('src/ml/outputs/correlation_heatmap.png')

# 4. Key insight: silent failures vs triggered failures
print("Silent failure characteristics:")
print(df[df['silent_failure'] == 1][['temp_mean', 'temp_max', 'temp_std', 'vibration_index']].describe())
```

---

### Step 6: Preprocessing + EDA + Feature Engineering + Feature Selection

```python
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder

# --- Feature Engineering ---

# Thermal risk score: how close to threshold limits
df['temp_range'] = df['temp_max'] - df['temp_min']
df['temp_excursion_risk'] = np.where(
    (df['temp_max'] > 8.0) | (df['temp_min'] < 2.0), 1, 0
)

# Transit stress: combination of duration and vibration
df['transit_stress'] = df['transit_duration_hrs'] * df['vibration_index']

# Door exposure ratio: door opens per hour of transit
df['door_exposure_rate'] = df['door_open_count'] / (df['transit_duration_hrs'] + 0.01)

# Humidity-temperature interaction
df['humidity_temp_interaction'] = df['humidity_mean'] * df['temp_std']

# Container efficiency
df['volume_efficiency'] = df['product_volume'] * df['fill_ratio']

# --- Encode Categoricals ---
le_dict = {}
for col in ['package_type', 'carrier_id', 'route_id']:
    if col in df.columns:
        le = LabelEncoder()
        df[col + '_encoded'] = le.fit_transform(df[col].astype(str))
        le_dict[col] = le

# --- Feature Selection ---
# Drop raw categoricals and identifiers
drop_cols = ['package_type', 'carrier_id', 'route_id']
drop_cols = [c for c in drop_cols if c in df.columns]

feature_cols = [c for c in df.columns if c not in drop_cols + ['label', 'silent_failure']]

X = df[feature_cols]
y_failure = df['label']
y_silent = df['silent_failure']

# --- Scale Features ---
scaler = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=X.columns)

print(f"Features: {len(feature_cols)}")
print(f"Feature list:\n{feature_cols}")
```

---

### Step 7: Split Dataset

```python
from sklearn.model_selection import train_test_split

# Primary target: failure detection
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_failure, test_size=0.2, random_state=42, stratify=y_failure
)

# Secondary target: silent failure (subset of failures)
X_train_sf, X_test_sf, y_train_sf, y_test_sf = train_test_split(
    X_scaled, y_silent, test_size=0.2, random_state=42, stratify=y_silent
)

print(f"Training set: {X_train.shape[0]} samples")
print(f"Test set: {X_test.shape[0]} samples")
print(f"Train failure rate: {y_train.mean():.3f}")
print(f"Test failure rate: {y_test.mean():.3f}")
```

---

### Step 8: Train Multiple Models

```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.metrics import classification_report, roc_auc_score

models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
    "Random Forest": RandomForestClassifier(n_estimators=200, random_state=42, class_weight='balanced'),
    "XGBoost": XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.1, 
                              scale_pos_weight=len(y_train[y_train==0])/len(y_train[y_train==1]),
                              random_state=42, eval_metric='logloss'),
    "LightGBM": LGBMClassifier(n_estimators=200, learning_rate=0.1, random_state=42,
                                 is_unbalance=True, verbose=-1),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=200, random_state=42),
}

results = {}
for name, model in models.items():
    print(f"\n{'='*50}")
    print(f"Training: {name}")
    print(f"{'='*50}")
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
    
    report = classification_report(y_test, y_pred, output_dict=True)
    auc = roc_auc_score(y_test, y_prob) if y_prob is not None else 0
    
    results[name] = {
        'accuracy': report['accuracy'],
        'precision_1': report['1']['precision'],
        'recall_1': report['1']['recall'],
        'f1_1': report['1']['f1-score'],
        'auc_roc': auc,
        'model': model
    }
    
    print(f"Accuracy: {report['accuracy']:.4f}")
    print(f"Failure Recall: {report['1']['recall']:.4f}")
    print(f"AUC-ROC: {auc:.4f}")

# Also train Isolation Forest for unsupervised anomaly detection
iso_forest = IsolationForest(contamination=y_train.mean(), random_state=42)
iso_forest.fit(X_train)
```

---

### Step 9: Evaluate Models

```python
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, roc_curve

# Comparison table
results_df = pd.DataFrame(results).T.drop(columns='model')
results_df = results_df.sort_values('f1_1', ascending=False)
print("\n" + "="*70)
print("MODEL COMPARISON (Sorted by F1 for Failure Class)")
print("="*70)
print(results_df.to_string())

# Select best model
best_model_name = results_df.index[0]
best_model = results[best_model_name]['model']
print(f"\n🏆 Best Model: {best_model_name}")

# Confusion Matrix for best model
y_pred_best = best_model.predict(X_test)
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

cm = confusion_matrix(y_test, y_pred_best)
ConfusionMatrixDisplay(cm, display_labels=['Normal', 'Failure']).plot(ax=axes[0])
axes[0].set_title(f'{best_model_name} — Confusion Matrix')

# ROC Curve
y_prob_best = best_model.predict_proba(X_test)[:, 1]
fpr, tpr, _ = roc_curve(y_test, y_prob_best)
axes[1].plot(fpr, tpr, color='#3b82f6', lw=2)
axes[1].plot([0,1], [0,1], 'k--', lw=1)
axes[1].set_xlabel('False Positive Rate')
axes[1].set_ylabel('True Positive Rate')
axes[1].set_title(f'{best_model_name} — ROC Curve (AUC: {results[best_model_name]["auc_roc"]:.4f})')
plt.tight_layout()
plt.savefig('src/ml/outputs/best_model_evaluation.png')

# Feature Importance (if tree-based)
if hasattr(best_model, 'feature_importances_'):
    fi = pd.Series(best_model.feature_importances_, index=feature_cols).sort_values(ascending=True)
    fi.tail(15).plot.barh(figsize=(10, 6), color='#3b82f6')
    plt.title(f'Top 15 Feature Importances — {best_model_name}')
    plt.tight_layout()
    plt.savefig('src/ml/outputs/feature_importance.png')
```

---

### Step 10: Hyperparameter Tuning (If Required)

```python
from sklearn.model_selection import RandomizedSearchCV

# Only tune if F1 < 0.85
if results[best_model_name]['f1_1'] < 0.85:
    print("F1 below 0.85 — Running hyperparameter tuning...")
    
    if 'XGBoost' in best_model_name or 'LightGBM' in best_model_name:
        param_grid = {
            'n_estimators': [100, 200, 300, 500],
            'max_depth': [3, 5, 7, 10],
            'learning_rate': [0.01, 0.05, 0.1, 0.2],
            'subsample': [0.7, 0.8, 0.9, 1.0],
            'colsample_bytree': [0.7, 0.8, 0.9, 1.0],
            'min_child_weight': [1, 3, 5, 7]
        }
    else:  # Random Forest
        param_grid = {
            'n_estimators': [100, 200, 300, 500],
            'max_depth': [5, 10, 15, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
        }
    
    search = RandomizedSearchCV(
        best_model, param_grid, n_iter=50, cv=5,
        scoring='f1', random_state=42, n_jobs=-1, verbose=1
    )
    search.fit(X_train, y_train)
    
    best_model = search.best_estimator_
    print(f"Best params: {search.best_params_}")
    print(f"Best CV F1: {search.best_score_:.4f}")
else:
    print(f"F1 = {results[best_model_name]['f1_1']:.4f} — No tuning needed ✓")
```

---

### Step 11: Save Model

```python
import joblib
import json

# Save the best model
MODEL_DIR = "src/ml/saved_models/"
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(best_model, f"{MODEL_DIR}cold_chain_failure_model.joblib")
joblib.dump(scaler, f"{MODEL_DIR}cold_chain_scaler.joblib")
joblib.dump(iso_forest, f"{MODEL_DIR}cold_chain_anomaly_detector.joblib")

# Save feature list and metadata
metadata = {
    "model_name": best_model_name,
    "features": feature_cols,
    "metrics": {
        "accuracy": results[best_model_name]['accuracy'],
        "f1_failure": results[best_model_name]['f1_1'],
        "auc_roc": results[best_model_name]['auc_roc'],
        "recall_failure": results[best_model_name]['recall_1']
    },
    "target_temp_range": {"min_c": 2.0, "max_c": 8.0},
    "trained_on": "Cold Chain Shipment Silent Failure Dataset (Kaggle)"
}

with open(f"{MODEL_DIR}cold_chain_model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

# Save label encoders
for col, le in le_dict.items():
    joblib.dump(le, f"{MODEL_DIR}le_{col}.joblib")

print(f"✅ Model saved to {MODEL_DIR}")
print(f"   - cold_chain_failure_model.joblib ({best_model_name})")
print(f"   - cold_chain_scaler.joblib")
print(f"   - cold_chain_anomaly_detector.joblib (Isolation Forest)")
```

---

### Step 12: FastAPI Model API

```python
# File: src/backend/api/routes/ml_predictions.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import joblib
import numpy as np
import os

router = APIRouter(prefix="/api/ml", tags=["ML Predictions"])

# Load models at startup
MODEL_DIR = os.path.join(os.path.dirname(__file__), "../../ml/saved_models/")
failure_model = joblib.load(os.path.join(MODEL_DIR, "cold_chain_failure_model.joblib"))
scaler = joblib.load(os.path.join(MODEL_DIR, "cold_chain_scaler.joblib"))
anomaly_detector = joblib.load(os.path.join(MODEL_DIR, "cold_chain_anomaly_detector.joblib"))

class ColdChainPredictionRequest(BaseModel):
    temp_mean: float
    temp_max: float
    temp_min: float
    temp_std: float
    humidity_mean: float
    vibration_index: float
    transit_duration_hrs: float
    door_open_count: int
    fill_ratio: float
    product_volume: float

class ColdChainPredictionResponse(BaseModel):
    failure_probability: float
    is_failure_predicted: bool
    is_anomaly_detected: bool
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    recommended_action: str

@router.post("/cold-chain/predict", response_model=ColdChainPredictionResponse)
def predict_cold_chain_failure(request: ColdChainPredictionRequest):
    # Feature engineering (must match training pipeline)
    features = {
        'temp_mean': request.temp_mean,
        'temp_max': request.temp_max,
        'temp_min': request.temp_min,
        'temp_std': request.temp_std,
        'temp_range': request.temp_max - request.temp_min,
        'temp_excursion_risk': 1 if (request.temp_max > 8.0 or request.temp_min < 2.0) else 0,
        'humidity_mean': request.humidity_mean,
        'vibration_index': request.vibration_index,
        'transit_duration_hrs': request.transit_duration_hrs,
        'transit_stress': request.transit_duration_hrs * request.vibration_index,
        'door_open_count': request.door_open_count,
        'door_exposure_rate': request.door_open_count / (request.transit_duration_hrs + 0.01),
        'humidity_temp_interaction': request.humidity_mean * request.temp_std,
        'fill_ratio': request.fill_ratio,
        'product_volume': request.product_volume,
        'volume_efficiency': request.product_volume * request.fill_ratio,
    }
    
    X = np.array([list(features.values())])
    X_scaled = scaler.transform(X)
    
    # Predict
    failure_prob = failure_model.predict_proba(X_scaled)[0][1]
    is_failure = failure_prob >= 0.5
    anomaly_score = anomaly_detector.decision_function(X_scaled)[0]
    is_anomaly = anomaly_score < 0
    
    # Risk classification
    if failure_prob >= 0.8:
        risk = "CRITICAL"
        action = "IMMEDIATE: Quarantine shipment. Initiate emergency re-icing or transfer to backup reefer."
    elif failure_prob >= 0.6:
        risk = "HIGH"
        action = "URGENT: Inspect reefer compressor. Consider rerouting to nearest cold storage facility."
    elif failure_prob >= 0.3:
        risk = "MEDIUM"
        action = "MONITOR: Increase telemetry polling frequency. Alert operations team."
    else:
        risk = "LOW"
        action = "NOMINAL: Continue standard monitoring protocols."
    
    return ColdChainPredictionResponse(
        failure_probability=round(failure_prob, 4),
        is_failure_predicted=is_failure,
        is_anomaly_detected=is_anomaly,
        risk_level=risk,
        recommended_action=action
    )
```

---

## 🔴 ML-2: Disruption Impact & Risk Classification (Full ML Pipeline)

### Step 1: Problem Statement

**Goal:** Given a supply chain disruption event (weather, strike, geopolitical, infrastructure), predict:
- **Disruption severity** (Low / Medium / High / Critical)
- **Probability of shipment delay** (binary classification)
- **Estimated delay in days** (regression)

**Business Impact:** Proactive risk classification enables logistics teams to trigger mitigation plans **before** the disruption cascade reaches downstream shipments.

---

### Step 2: Collect Dataset

| Dataset | Source | Key Features |
|---|---|---|
| **Global Supply Chain Risk & Logistics (2024–2026)** ⭐ | [Kaggle](https://www.kaggle.com/) — Search title | Geopolitical risk score, weather conditions, fuel price index, carrier reliability %, `Disruption_Occurred` (binary), `Lead_Time_Days` |
| **Supply Chain Order Delay Risk Analysis** | [Kaggle](https://www.kaggle.com/) — Search title | Supplier reliability, inventory levels, shipping distance, demand urgency |
| **Supply Chain Risk and Performance Indicators** | [Kaggle](https://www.kaggle.com/) — Search title | 113K+ entries, delay probabilities, disruption likelihood scores |

```bash
kaggle datasets download -d <slug>/global-supply-chain-risk-logistics
unzip global-supply-chain-risk-logistics.zip -d src/ml/data/disruption/
```

---

### Steps 3-11: Follow Same Pipeline as ML-1

The pipeline structure (understand → clean → analyze → preprocess → split → train → evaluate → tune → save) is **identical** to ML-1 above, with these differences:

| Aspect | ML-1 (Cold Chain) | ML-2 (Disruption) |
|---|---|---|
| **Target variable** | `label` (failure) | `Disruption_Occurred` (binary) + `Lead_Time_Days` (regression) |
| **Key features** | Temperature, humidity, vibration | Geopolitical risk, weather, fuel price, carrier reliability |
| **Models to try** | XGBoost, RF, LGBM, Isolation Forest | XGBoost, RF, LGBM, Logistic Regression, SVR (for regression) |
| **Key metric** | F1 + Recall (minimize missed failures) | F1 + Recall (minimize missed disruptions) |
| **Imbalance handling** | `class_weight='balanced'` | SMOTE or `scale_pos_weight` |

### Step 12: FastAPI Endpoint

```python
@router.post("/disruption/predict")
def predict_disruption_risk(
    geopolitical_risk_score: float,  # 0-10
    weather_severity: str,           # Clear/Rain/Storm/Severe
    fuel_price_index: float,
    carrier_reliability_pct: float,
    shipping_distance_km: float,
    transport_mode: str
):
    # ... model inference ...
    return {
        "disruption_probability": 0.73,
        "predicted_severity": "HIGH",
        "estimated_delay_days": 3.2,
        "recommended_action": "Pre-authorize alternate carrier and reroute via Wilhelmshaven corridor"
    }
```

---

## 🚛 ML-4: Fleet Rebalancing Optimizer

### Approach: Heuristic Scoring + Optional ML

For the hackathon scope, a **weighted scoring model** is more practical than full ML here:

```python
def calculate_rebalance_score(idle_asset, disrupted_hub):
    """Score = weighted combination of proximity, ROI, urgency, and capability match"""
    distance_score = 1.0 / (1.0 + haversine_km(idle_asset, disrupted_hub) / 500)
    roi_score = min(disrupted_hub.cargo_value_at_risk / (reposition_cost + 1), 100) / 100
    urgency_score = min(idle_asset.hours_idle / 48.0, 1.0)
    capability_match = 1.0 if cold_chain_match(idle_asset, disrupted_hub) else 0.5
    
    return (0.3 * distance_score + 0.35 * roi_score + 
            0.2 * urgency_score + 0.15 * capability_match)
```

> [!NOTE]
> If you want full ML here, you can frame it as: "Given (idle_asset_features, disrupted_hub_features) → predict `redeployment_success_rate`" and train on synthetic data generated from our scoring function. This is optional for hackathon scope.

---

## 📁 Project Structure for ML Components

```
src/
├── ml/                                    # [NEW] ML pipeline directory
│   ├── data/
│   │   ├── cold_chain/                    # Cold chain datasets
│   │   └── disruption/                    # Disruption datasets
│   ├── notebooks/
│   │   ├── 01_cold_chain_eda.ipynb        # EDA notebook
│   │   ├── 02_cold_chain_training.ipynb   # Training notebook
│   │   ├── 03_disruption_eda.ipynb
│   │   └── 04_disruption_training.ipynb
│   ├── outputs/                           # Charts, confusion matrices
│   ├── saved_models/                      # Trained model files (.joblib)
│   │   ├── cold_chain_failure_model.joblib
│   │   ├── cold_chain_scaler.joblib
│   │   ├── cold_chain_anomaly_detector.joblib
│   │   ├── disruption_risk_model.joblib
│   │   └── disruption_scaler.joblib
│   └── scripts/
│       ├── train_cold_chain.py            # Standalone training script
│       └── train_disruption.py            # Standalone training script
├── backend/
│   ├── api/routes/
│   │   └── ml_predictions.py             # [NEW] ML prediction endpoints
│   ├── services/
│   │   ├── llm_service.py                # [NEW] Groq/Gemini LLM wrapper
│   │   └── bob_copilot_service.py        # [MODIFY] Use LLM instead of keywords
│   └── requirements.txt                  # [MODIFY] Add ML deps
└── frontend/
    └── src/components/
        └── ColdChainMonitor.jsx          # [MODIFY] Show ML predictions
```

---

## 📦 Dependencies to Add

```txt
# ML & Data Science
scikit-learn>=1.4.0
xgboost>=2.0.0
lightgbm>=4.3.0
pandas>=2.2.0
numpy>=1.26.0
matplotlib>=3.8.0
seaborn>=0.13.0
joblib>=1.3.0

# LLM APIs (Free tier)
groq>=0.4.0
google-generativeai>=0.4.0

# Model serving
joblib>=1.3.0
```

---

## ⏱️ Execution Priority & Timeline

| Priority | Component | Effort | Dependencies |
|---|---|---|---|
| 🔴 **P0** | ML-3: LLM API Integration (Groq/Gemini) | ~2 hours | Just need API key signup |
| 🔴 **P1** | ML-1: Cold Chain Anomaly Detection (full pipeline) | ~4-5 hours | Download Kaggle dataset first |
| 🟡 **P2** | ML-2: Disruption Risk Classification | ~3-4 hours | Download Kaggle dataset first |
| 🟢 **P3** | ML-4: Fleet Rebalancing Scoring | ~1 hour | None (uses weighted heuristic) |

> [!IMPORTANT]
> **Start with ML-3 (LLM API)** — it gives the biggest "wow factor" improvement to judges with the least effort. A single API call replaces 160 lines of hardcoded keyword matching in `bob_copilot_service.py` with genuinely intelligent responses.

> [!TIP]
> **Sign up for Groq immediately:** https://console.groq.com — The free tier gives you 14,400 requests/day which is more than enough for the hackathon demo and judging.
