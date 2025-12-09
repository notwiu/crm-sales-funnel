import json
import os
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import hashlib

# Get the absolute path to the directory containing this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, 
            static_folder=BASE_DIR,
            static_url_path='')
CORS(app)

# File paths
LEADS_FILE = os.path.join(BASE_DIR, 'leads.json')
USERS_FILE = os.path.join(BASE_DIR, 'users.json')

# Demo users
DEMO_USERS = {
    'admin@crm.com': {'password': hashlib.md5('admin123'.encode()).hexdigest(), 'name': 'Admin User', 'role': 'admin'},
    'sales@crm.com': {'password': hashlib.md5('sales123'.encode()).hexdigest(), 'name': 'Sales Rep', 'role': 'sales'}
}

def load_json(filename):
    """Load JSON file, return empty dict/list if not exists"""
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return json.load(f)
    return {} if filename == USERS_FILE else []

def save_json(filename, data):
    """Save data to JSON file"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

def hash_password(password):
    """Hash password using MD5"""
    return hashlib.md5(password.encode()).hexdigest()

def init_demo_data():
    """Initialize demo data if files don't exist"""
    if not os.path.exists(USERS_FILE):
        save_json(USERS_FILE, DEMO_USERS)
    
    if not os.path.exists(LEADS_FILE):
        demo_leads = [
            {'id': 1, 'name': 'Acme Corp', 'company': 'Acme Inc', 'email': 'contact@acme.com', 'stage': 'Prospect', 'value': 50000, 'createdAt': datetime.now().isoformat()},
            {'id': 2, 'name': 'Tech Solutions', 'company': 'Tech LLC', 'email': 'info@tech.com', 'stage': 'Qualified', 'value': 75000, 'createdAt': datetime.now().isoformat()},
            {'id': 3, 'name': 'Global Industries', 'company': 'Global Inc', 'email': 'sales@global.com', 'stage': 'Negotiation', 'value': 120000, 'createdAt': datetime.now().isoformat()},
            {'id': 4, 'name': 'Enterprise Solutions', 'company': 'Enterprise Ltd', 'email': 'contact@enterprise.com', 'stage': 'Closed', 'value': 200000, 'createdAt': datetime.now().isoformat()},
        ]
        save_json(LEADS_FILE, demo_leads)

# Initialize demo data
init_demo_data()

# ==================== Authentication Routes ====================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user"""
    data = request.json
    email = data.get('email', '').lower()
    password = data.get('password', '')
    
    users = load_json(USERS_FILE)
    if email in users and users[email]['password'] == hash_password(password):
        user = users[email]
        return jsonify({
            'success': True,
            'user': {
                'email': email,
                'name': user['name'],
                'role': user['role']
            },
            'token': email  # Simple token (use JWT in production)
        })
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Create new user account"""
    data = request.json
    email = data.get('email', '').lower()
    password = data.get('password', '')
    name = data.get('name', '')
    
    if not email or not password or not name:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    users = load_json(USERS_FILE)
    if email in users:
        return jsonify({'success': False, 'message': 'Email already exists'}), 400
    
    users[email] = {
        'password': hash_password(password),
        'name': name,
        'role': 'sales'
    }
    save_json(USERS_FILE, users)
    
    return jsonify({
        'success': True,
        'user': {
            'email': email,
            'name': name,
            'role': 'sales'
        },
        'token': email
    })

# ==================== Lead Routes ====================

@app.route('/api/leads', methods=['GET'])
def get_leads():
    """Get all leads"""
    leads = load_json(LEADS_FILE)
    return jsonify(leads)

@app.route('/api/leads', methods=['POST'])
def create_lead():
    """Create new lead"""
    data = request.json
    leads = load_json(LEADS_FILE)
    
    new_id = max([l['id'] for l in leads], default=0) + 1
    new_lead = {
        'id': new_id,
        'name': data.get('name', ''),
        'company': data.get('company', ''),
        'email': data.get('email', ''),
        'stage': data.get('stage', 'Prospect'),
        'value': data.get('value', 0),
        'createdAt': datetime.now().isoformat()
    }
    
    leads.append(new_lead)
    save_json(LEADS_FILE, leads)
    
    return jsonify({'success': True, 'lead': new_lead})

@app.route('/api/leads/<int:lead_id>', methods=['GET'])
def get_lead(lead_id):
    """Get specific lead"""
    leads = load_json(LEADS_FILE)
    lead = next((l for l in leads if l['id'] == lead_id), None)
    
    if not lead:
        return jsonify({'success': False, 'message': 'Lead not found'}), 404
    
    return jsonify(lead)

@app.route('/api/leads/<int:lead_id>', methods=['PUT'])
def update_lead(lead_id):
    """Update lead"""
    data = request.json
    leads = load_json(LEADS_FILE)
    
    lead = next((l for l in leads if l['id'] == lead_id), None)
    if not lead:
        return jsonify({'success': False, 'message': 'Lead not found'}), 404
    
    lead.update({
        'name': data.get('name', lead['name']),
        'company': data.get('company', lead['company']),
        'email': data.get('email', lead['email']),
        'stage': data.get('stage', lead['stage']),
        'value': data.get('value', lead['value'])
    })
    
    save_json(LEADS_FILE, leads)
    return jsonify({'success': True, 'lead': lead})

@app.route('/api/leads/<int:lead_id>', methods=['DELETE'])
def delete_lead(lead_id):
    """Delete lead"""
    leads = load_json(LEADS_FILE)
    leads = [l for l in leads if l['id'] != lead_id]
    save_json(LEADS_FILE, leads)
    
    return jsonify({'success': True})

# ==================== Analytics Routes ====================

@app.route('/api/analytics/metrics', methods=['GET'])
def get_metrics():
    """Get key metrics"""
    leads = load_json(LEADS_FILE)
    
    total_leads = len(leads)
    pipeline_value = sum(l['value'] for l in leads if l['stage'] != 'Closed')
    closed_deals = sum(l['value'] for l in leads if l['stage'] == 'Closed')
    conversion_rate = (len([l for l in leads if l['stage'] == 'Closed']) / total_leads * 100) if total_leads > 0 else 0
    
    return jsonify({
        'totalLeads': total_leads,
        'pipelineValue': pipeline_value,
        'closedDeals': closed_deals,
        'conversionRate': round(conversion_rate, 2)
    })

@app.route('/api/analytics/funnel', methods=['GET'])
def get_funnel_stats():
    """Get funnel statistics"""
    leads = load_json(LEADS_FILE)
    stages = ['Prospect', 'Qualified', 'Negotiation', 'Closed']
    
    stats = {}
    for stage in stages:
        count = len([l for l in leads if l['stage'] == stage])
        value = sum(l['value'] for l in leads if l['stage'] == stage)
        stats[stage] = {'count': count, 'value': value}
    
    return jsonify(stats)

@app.route('/api/analytics/export', methods=['GET'])
def export_csv():
    """Export leads as CSV"""
    leads = load_json(LEADS_FILE)
    
    csv_content = "Name,Company,Email,Stage,Value,Created\n"
    for lead in leads:
        csv_content += f"{lead['name']},{lead['company']},{lead['email']},{lead['stage']},{lead['value']},{lead['createdAt']}\n"
    
    return csv_content, 200, {'Content-Disposition': 'attachment; filename=leads.csv', 'Content-Type': 'text/csv'}

# ==================== Health Check ====================

# ==================== Static Routes ====================

@app.route('/', methods=['GET'])
def index():
    """Serve main dashboard"""
    with open(os.path.join(BASE_DIR, 'index.html'), 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/login', methods=['GET'])
def login_page():
    """Serve login page"""
    with open(os.path.join(BASE_DIR, 'login.html'), 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files"""
    return send_from_directory(os.path.join(BASE_DIR, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files"""
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)

# ==================== Health Check ====================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
