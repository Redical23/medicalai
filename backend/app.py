"""
MediVue ML Prediction Backend
Flask API for health data prediction using multiple ML models
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import AdaBoostClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Store trained models
models = {}
scaler = StandardScaler()

# Expanded disease categories with specific symptom patterns
DISEASE_CATEGORIES = {
    'oncology': {
        'symptoms': ['lump', 'mass', 'growth', 'tumor', 'swelling', 'painless_lump', 'weight_loss', 'night_sweats'],
        'keywords': ['lump', 'mass', 'growth', 'tumor', 'growing', 'painless', 'hard', 'slowly growing', 'lymph', 'node'],
        'metrics': [],
        'diseases': ['Lymphoma', 'Thyroid Cancer', 'Hodgkin Disease', 'Non-Hodgkin Lymphoma', 'Metastatic Cancer'],
        'urgency': 'high',
        'recommendation': 'Please consult an oncologist or ENT specialist for proper evaluation. A biopsy may be needed.'
    },
    'thyroid': {
        'symptoms': ['neck_lump', 'swelling', 'fatigue', 'weight_change', 'difficulty_swallowing'],
        'keywords': ['neck', 'throat', 'thyroid', 'swallowing', 'goiter', 'lump in neck'],
        'metrics': [],
        'diseases': ['Thyroid Nodule', 'Goiter', 'Thyroiditis', 'Hyperthyroidism', 'Hypothyroidism', 'Thyroid Cancer'],
        'urgency': 'moderate',
        'recommendation': 'Thyroid function tests (TSH, T3, T4) and ultrasound recommended.'
    },
    'lymphatic': {
        'symptoms': ['swollen_lymph_nodes', 'night_sweats', 'fatigue', 'fever'],
        'keywords': ['lymph', 'node', 'swollen', 'gland', 'armpit', 'groin', 'neck swelling'],
        'metrics': [],
        'diseases': ['Lymphadenopathy', 'Lymphoma', 'Mononucleosis', 'HIV/AIDS', 'Tuberculosis'],
        'urgency': 'high',
        'recommendation': 'Complete blood count and lymph node biopsy may be needed.'
    },
    'infectious': {
        'symptoms': ['fever', 'infection', 'swelling', 'pain'],
        'keywords': ['infection', 'fever', 'pus', 'red', 'warm', 'tender'],
        'metrics': [],
        'diseases': ['Bacterial Infection', 'Viral Infection', 'Abscess', 'Cellulitis'],
        'urgency': 'moderate',
        'recommendation': 'May require antibiotics. Consult a doctor if symptoms persist.'
    },
    'respiratory': {
        'symptoms': ['cough', 'breathing_difficulty', 'sore_throat', 'shortness_of_breath'],
        'keywords': ['cough', 'breath', 'wheeze', 'chest', 'lung', 'respiratory'],
        'metrics': ['breathing_rate', 'spo2'],
        'diseases': ['Common Cold', 'Flu', 'Asthma', 'Bronchitis', 'Pneumonia', 'COVID-19'],
        'urgency': 'moderate',
        'recommendation': 'Monitor oxygen levels. Seek care if breathing worsens.'
    },
    'cardiac': {
        'symptoms': ['chest_pain', 'palpitations', 'shortness_of_breath'],
        'keywords': ['heart', 'chest pain', 'palpitation', 'irregular', 'racing'],
        'metrics': ['heart_rate', 'hrv'],
        'diseases': ['Hypertension', 'Arrhythmia', 'Heart Disease', 'Angina'],
        'urgency': 'high',
        'recommendation': 'ECG and cardiac evaluation recommended.'
    },
    'neurological': {
        'symptoms': ['headache', 'dizziness', 'numbness', 'weakness'],
        'keywords': ['headache', 'dizzy', 'numb', 'weak', 'tremor', 'seizure', 'vision'],
        'metrics': ['facial_symmetry', 'head_tremor'],
        'diseases': ['Migraine', 'Tension Headache', 'Stroke Risk', 'Neuropathy'],
        'urgency': 'moderate',
        'recommendation': 'Neurological examination recommended if symptoms persist.'
    },
    'gastrointestinal': {
        'symptoms': ['nausea', 'vomiting', 'abdominal_pain', 'diarrhea'],
        'keywords': ['stomach', 'nausea', 'vomit', 'diarrhea', 'constipation', 'abdomen'],
        'metrics': [],
        'diseases': ['Gastritis', 'GERD', 'IBS', 'Food Poisoning', 'Appendicitis'],
        'urgency': 'moderate',
        'recommendation': 'Stay hydrated. Seek care if severe pain or blood present.'
    },
    'dermatological': {
        'symptoms': ['rash', 'skin_discoloration', 'itching', 'lesion'],
        'keywords': ['rash', 'skin', 'itch', 'red', 'spot', 'lesion', 'mole'],
        'metrics': ['skin_status'],
        'diseases': ['Allergic Reaction', 'Eczema', 'Psoriasis', 'Skin Infection', 'Skin Cancer'],
        'urgency': 'low',
        'recommendation': 'Dermatologist consultation for persistent skin changes.'
    }
}


def initialize_models():
    """Train base models with sample data for demonstration"""
    global models, scaler
    
    # Create sample training data (in production, use real medical data)
    np.random.seed(42)
    n_samples = 500
    
    # Features: [heart_rate, spo2, breathing_rate, symmetry, distress, fatigue, symptom_count]
    X = np.random.randn(n_samples, 7)
    
    # Binary labels (0 = healthy, 1 = needs attention)
    y = (X[:, 0] > 0.5) | (X[:, 1] < -0.5) | (X[:, 4] > 0.7)
    y = y.astype(int)
    
    # Scale features
    X_scaled = scaler.fit_transform(X)
    
    # Train multiple models
    models['logistic'] = LogisticRegression(max_iter=1000)
    models['decision_tree'] = DecisionTreeClassifier(max_depth=5)
    models['knn'] = KNeighborsClassifier(n_neighbors=5)
    models['naive_bayes'] = GaussianNB()
    models['adaboost'] = AdaBoostClassifier(n_estimators=50)
    models['random_forest'] = RandomForestClassifier(n_estimators=100)
    
    for name, model in models.items():
        model.fit(X_scaled, y)
        print(f"✓ Trained {name} model")
    
    print("All models initialized!")


def prepare_features(data):
    """Convert health data to feature vector"""
    face_metrics = data.get('face_metrics', {})
    symptoms = data.get('symptoms', {})
    
    # Count active symptoms
    symptom_count = 0
    physical = symptoms.get('physical', {})
    internal = symptoms.get('internal', {})
    
    for v in physical.values():
        if v: symptom_count += 1
    for v in internal.values():
        if v: symptom_count += 1
    
    # Build feature vector
    features = [
        face_metrics.get('heart_rate') or 72,  # Default normal values
        face_metrics.get('spo2') or 98,
        face_metrics.get('breathing_rate') or 16,
        face_metrics.get('facial_symmetry') or 95,
        face_metrics.get('distress_score') or 0.1,
        face_metrics.get('fatigue_perclos') or 10,
        symptom_count
    ]
    
    return np.array(features).reshape(1, -1)


def analyze_symptoms(symptoms, raw_text=""):
    """Determine disease categories based on symptoms and raw text analysis"""
    physical = symptoms.get('physical', {})
    internal = symptoms.get('internal', {})
    all_symptoms = {**physical, **internal}
    
    # Get raw text from symptoms
    if not raw_text:
        raw_text = symptoms.get('raw_text', '')
    
    raw_text_lower = raw_text.lower()
    
    category_scores = {}
    
    for category, info in DISEASE_CATEGORIES.items():
        score = 0
        matched_keywords = []
        matched_symptoms = []
        
        # Check structured symptoms
        for symptom in info['symptoms']:
            if all_symptoms.get(symptom):
                score += 1
                matched_symptoms.append(symptom)
        
        # Check keywords in raw text (NLP-like matching)
        keywords = info.get('keywords', [])
        for keyword in keywords:
            if keyword.lower() in raw_text_lower:
                score += 2  # Keywords in raw text are more important
                if keyword not in matched_keywords:
                    matched_keywords.append(keyword)
        
        if score > 0:
            # Calculate how many diseases to show based on score
            num_diseases = min(score + 1, len(info['diseases']))
            
            category_scores[category] = {
                'score': score,
                'matched_symptoms': matched_symptoms,
                'matched_keywords': matched_keywords,
                'possible_diseases': info['diseases'][:num_diseases],
                'urgency': info.get('urgency', 'moderate'),
                'recommendation': info.get('recommendation', 'Consult a healthcare provider.')
            }
    
    # Sort by score (highest first)
    category_scores = dict(sorted(
        category_scores.items(), 
        key=lambda x: x[1]['score'], 
        reverse=True
    ))
    
    return category_scores


def get_risk_level(probability):
    """Convert probability to risk level"""
    if probability < 0.3:
        return {'level': 'Low', 'color': '#22c55e', 'description': 'No immediate concerns'}
    elif probability < 0.6:
        return {'level': 'Moderate', 'color': '#f59e0b', 'description': 'Monitor symptoms'}
    else:
        return {'level': 'High', 'color': '#ef4444', 'description': 'Consult a doctor'}


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'models_loaded': len(models),
        'version': '1.0.0'
    })


@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.json
        print(f"📥 Received data: {data is not None}")
        
        if not data:
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        # Prepare features
        print("🔧 Preparing features...")
        features = prepare_features(data)
        print(f"   Features: {features}")
        features_scaled = scaler.transform(features)
        
        # Get predictions from all models
        print("🤖 Running predictions...")
        predictions = {}
        probabilities = []
        
        for name, model in models.items():
            try:
                pred = model.predict(features_scaled)[0]
                if hasattr(model, 'predict_proba'):
                    prob = model.predict_proba(features_scaled)[0][1]
                else:
                    prob = float(pred)
                predictions[name] = {
                    'prediction': int(pred),
                    'probability': float(prob)
                }
                probabilities.append(prob)
                print(f"   ✓ {name}: {prob:.3f}")
            except Exception as model_error:
                print(f"   ✗ {name} error: {model_error}")
                predictions[name] = {'prediction': 0, 'probability': 0.5}
                probabilities.append(0.5)
        
        # Ensemble prediction (average probability)
        avg_probability = float(np.mean(probabilities))
        print(f"📊 Ensemble probability: {avg_probability:.3f}")
        
        # Analyze symptoms with NLP on raw text
        symptoms = data.get('symptoms', {})
        raw_text = symptoms.get('raw_text', '')
        print(f"📝 Raw text: {raw_text[:100] if raw_text else 'None'}...")
        category_analysis = analyze_symptoms(symptoms, raw_text)
        
        # Get risk level
        risk = get_risk_level(avg_probability)
        
        # Build response
        response = {
            'success': True,
            'ensemble': {
                'probability': avg_probability,
                'needs_attention': avg_probability > 0.5,
                'risk': risk
            },
            'individual_models': predictions,
            'category_analysis': category_analysis,
            'recommendations': get_recommendations(category_analysis, risk['level']),
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
        print("✅ Prediction successful!")
        return jsonify(response)
    
    except Exception as e:
        import traceback
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500


def get_recommendations(categories, risk_level):
    """Generate recommendations based on analysis"""
    recommendations = []
    
    if risk_level == 'High':
        recommendations.append({
            'priority': 'urgent',
            'text': 'Consider consulting a healthcare professional soon',
            'icon': '🏥'
        })
    
    if 'respiratory' in categories:
        recommendations.append({
            'priority': 'moderate',
            'text': 'Monitor breathing and oxygen levels. Stay hydrated.',
            'icon': '🫁'
        })
    
    if 'cardiac' in categories:
        recommendations.append({
            'priority': 'high',
            'text': 'Track heart rate patterns. Avoid strenuous activity.',
            'icon': '❤️'
        })
    
    if 'neurological' in categories:
        recommendations.append({
            'priority': 'moderate',
            'text': 'Get adequate rest. Monitor for recurring symptoms.',
            'icon': '🧠'
        })
    
    if 'mental_health' in categories:
        recommendations.append({
            'priority': 'moderate',
            'text': 'Practice relaxation techniques. Consider talking to someone.',
            'icon': '🧘'
        })
    
    if not recommendations:
        recommendations.append({
            'priority': 'low',
            'text': 'No specific concerns detected. Maintain healthy habits.',
            'icon': '✅'
        })
    
    return recommendations


@app.route('/models', methods=['GET'])
def list_models():
    """List available models"""
    return jsonify({
        'models': list(models.keys()),
        'disease_categories': list(DISEASE_CATEGORIES.keys())
    })


if __name__ == '__main__':
    import os
    print("🏥 MediVue ML Backend Starting...")
    initialize_models()
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Server running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
