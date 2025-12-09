#!/bin/bash

# ProCRM Start Script for Unix/Linux/macOS
# This script starts both the backend and frontend servers

echo "========================================"
echo " ProCRM - Professional Sales Funnel CRM"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Install dependencies
echo "Checking dependencies..."
pip3 install -r requirements.txt --quiet

# Start backend
echo ""
echo "Starting backend server on http://localhost:5000..."
python3 app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
echo "Starting frontend server on http://localhost:8080..."
python3 -m http.server 8080 &
FRONTEND_PID=$!

# Wait for servers
sleep 2

# Open browser if possible
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080/login.html
elif command -v open &> /dev/null; then
    open http://localhost:8080/login.html
fi

echo ""
echo "========================================"
echo "Servers are running!"
echo "Frontend:  http://localhost:8080"
echo "Backend:   http://localhost:5000"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop the servers"
echo "Demo accounts:"
echo "   Admin: admin@crm.com / admin123"
echo "   Sales: sales@crm.com / sales123"
echo ""

# Keep script running
wait $BACKEND_PID $FRONTEND_PID
