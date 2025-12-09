from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import os
import uuid

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Database file for leads
LEADS_FILE = 'leads.json'

# ============================================
# FRONTEND ROUTES
# ============================================

@app.route('/', methods=['GET'])
def index():
    """Serve the main dashboard"""
    return send_from_directory('.', 'index.html')

@app.route('/login', methods=['GET'])
def login():
    """Serve the login page"""
    return send_from_directory('.', 'login.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS)"""
    return send_from_directory('.', path)

# ============================================
# DATABASE FUNCTIONS
# ============================================

def load_leads():
    """Load all leads from JSON file"""
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_leads(leads):
    """Save leads to JSON file"""
    with open(LEADS_FILE, 'w') as f:
        json.dump(leads, f, indent=2)

# ============================================
# API ENDPOINTS
# ============================================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'ProCRM API is running',
        'version': '1.0.0'
    }), 200

@app.route('/api/leads', methods=['GET'])
def get_leads():
    """Get all leads with optional filtering"""
    try:
        leads = load_leads()
        
        # Optional filters
        stage = request.args.get('stage')
        search = request.args.get('search', '').lower()

        if stage:
            leads = [l for l in leads if l.get('stage') == stage]

        if search:
            leads = [l for l in leads if 
                    search in l.get('firstName', '').lower() or
                    search in l.get('lastName', '').lower() or
                    search in l.get('company', '').lower() or
                    search in l.get('email', '').lower()]

        return jsonify({
            'success': True,
            'count': len(leads),
            'leads': leads
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leads/stage/<stage>', methods=['GET'])
def get_leads_by_stage(stage):
    """Get leads filtered by stage"""
    try:
        valid_stages = ['prospect', 'qualified', 'negotiation', 'closed']
        
        if stage not in valid_stages:
            return jsonify({'error': 'Invalid stage'}), 400

        leads = load_leads()
        filtered = [l for l in leads if l.get('stage') == stage]

        return jsonify({
            'success': True,
            'stage': stage,
            'count': len(filtered),
            'leads': filtered
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leads/<lead_id>', methods=['GET'])
def get_lead(lead_id):
    """Get a specific lead by ID"""
    try:
        leads = load_leads()
        lead = next((l for l in leads if l['id'] == lead_id), None)

        if not lead:
            return jsonify({'error': 'Lead not found'}), 404

        return jsonify({
            'success': True,
            'lead': lead
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leads', methods=['POST'])
def create_lead():
    """Create a new lead"""
    try:
        data = request.json

        # Validate required fields
        if not all(key in data for key in ['firstName', 'lastName', 'company', 'email']):
            return jsonify({'error': 'Missing required fields'}), 400

        # Create lead object
        lead = {
            'id': str(uuid.uuid4()),
            'firstName': data['firstName'],
            'lastName': data['lastName'],
            'company': data['company'],
            'position': data.get('position', ''),
            'email': data['email'],
            'phone': data.get('phone', ''),
            'dealValue': data.get('dealValue', 0),
            'stage': data.get('stage', 'prospect'),
            'notes': data.get('notes', ''),
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }

        # Save lead
        leads = load_leads()
        leads.append(lead)
        save_leads(leads)

        print(f"✓ Lead created: {lead['firstName']} {lead['lastName']}")

        return jsonify({
            'success': True,
            'message': 'Lead created successfully',
            'lead': lead
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leads/<lead_id>', methods=['PUT'])
def update_lead(lead_id):
    """Update an existing lead"""
    try:
        data = request.json
        leads = load_leads()
        lead = next((l for l in leads if l['id'] == lead_id), None)

        if not lead:
            return jsonify({'error': 'Lead not found'}), 404

        # Update fields
        lead.update({
            'firstName': data.get('firstName', lead['firstName']),
            'lastName': data.get('lastName', lead['lastName']),
            'company': data.get('company', lead['company']),
            'position': data.get('position', lead.get('position', '')),
            'email': data.get('email', lead['email']),
            'phone': data.get('phone', lead.get('phone', '')),
            'dealValue': data.get('dealValue', lead.get('dealValue', 0)),
            'stage': data.get('stage', lead.get('stage', 'prospect')),
            'notes': data.get('notes', lead.get('notes', '')),
            'updatedAt': datetime.now().isoformat()
        })

        save_leads(leads)
        print(f"✓ Lead updated: {lead['firstName']} {lead['lastName']}")

        return jsonify({
            'success': True,
            'message': 'Lead updated successfully',
            'lead': lead
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leads/<lead_id>', methods=['DELETE'])
def delete_lead(lead_id):
    """Delete a lead"""
    try:
        leads = load_leads()
        lead = next((l for l in leads if l['id'] == lead_id), None)

        if not lead:
            return jsonify({'error': 'Lead not found'}), 404

        leads.remove(lead)
        save_leads(leads)

        print(f"✓ Lead deleted: {lead['firstName']} {lead['lastName']}")

        return jsonify({
            'success': True,
            'message': 'Lead deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get CRM analytics"""
    try:
        leads = load_leads()

        # Calculate metrics
        total_leads = len(leads)
        closed_deals = len([l for l in leads if l.get('stage') == 'closed'])
        pipeline_value = sum(l.get('dealValue', 0) for l in leads)
        avg_deal_value = pipeline_value / total_leads if total_leads > 0 else 0

        # Stage breakdown
        stages = {
            'prospect': len([l for l in leads if l.get('stage') == 'prospect']),
            'qualified': len([l for l in leads if l.get('stage') == 'qualified']),
            'negotiation': len([l for l in leads if l.get('stage') == 'negotiation']),
            'closed': closed_deals
        }

        # Conversion rate
        conversion_rate = (closed_deals / total_leads * 100) if total_leads > 0 else 0

        return jsonify({
            'success': True,
            'analytics': {
                'totalLeads': total_leads,
                'closedDeals': closed_deals,
                'pipelineValue': pipeline_value,
                'avgDealValue': round(avg_deal_value, 2),
                'conversionRate': round(conversion_rate, 2),
                'stageBreakdown': stages
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats/funnel', methods=['GET'])
def get_funnel_stats():
    """Get funnel conversion statistics"""
    try:
        leads = load_leads()

        stages = ['prospect', 'qualified', 'negotiation', 'closed']
        stats = {}

        for stage in stages:
            count = len([l for l in leads if l.get('stage') == stage])
            stats[stage] = {
                'count': count,
                'percentage': round((count / len(leads) * 100), 1) if leads else 0
            }

        return jsonify({
            'success': True,
            'funnel': stats
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

# ============================================
# APP INITIALIZATION
# ============================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 ProCRM - Sales Funnel API")
    print("="*50)
    print("📊 Professional CRM & Sales Funnel Management")
    print("🌐 Running on http://localhost:5001")
    print("\n📝 Available Endpoints:")
    print("  GET  /api/health              - Health check")
    print("  GET  /api/leads               - Get all leads")
    print("  POST /api/leads               - Create new lead")
    print("  GET  /api/leads/<id>          - Get specific lead")
    print("  PUT  /api/leads/<id>          - Update lead")
    print("  DELETE /api/leads/<id>        - Delete lead")
    print("  GET  /api/leads/stage/<stage> - Get leads by stage")
    print("  GET  /api/analytics           - Get analytics")
    print("  GET  /api/stats/funnel        - Get funnel stats")
    print("\n💾 Database: leads.json")
    print("="*50 + "\n")

    app.run(debug=True, port=5001, use_reloader=False)
