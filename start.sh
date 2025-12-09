#!/bin/bash

echo
echo "============================================"
echo "  ProCRM - Sales Funnel Management"
echo "============================================"
echo

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found"
    exit 1
fi

echo "✓ Python detected: $(python3 --version)"

# Create venv
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

# Start
echo
echo "============================================"
echo "✓ Setup Complete!"
echo "============================================"
echo
echo "🚀 Starting ProCRM Backend..."
echo "   Backend: http://localhost:5001"
echo "   Frontend: http://localhost:8081"
echo
echo "In another terminal run:"
echo "   python -m http.server 8081"
echo

python app.py
