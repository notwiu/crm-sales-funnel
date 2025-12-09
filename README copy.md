# ProCRM - Professional Sales Funnel CRM

A powerful, professional Customer Relationship Management (CRM) system with Sales Funnel management, built with modern technologies.

## ✨ Features

### 📊 Dashboard
- **KPI Cards**: Real-time metrics (Total Leads, Pipeline Value, Closed Deals, Conversion Rate)
- **Funnel Breakdown**: Visual representation of leads across stages
- **Recent Activity**: Track all lead updates and changes
- **Professional Design**: Clean, modern interface with smooth animations

### 🎯 Sales Funnel (Kanban Board)
- **Drag & Drop**: Move leads between stages seamlessly
- **4 Stages**: Prospect → Qualified → Negotiation → Closed
- **Stage Counts**: Real-time count of leads in each stage
- **Lead Cards**: Display name, company, deal value, and creation date
- **Quick Actions**: View, edit, delete leads directly from cards

### 👥 Contacts Management
- **Contact Table**: Complete directory of all leads
- **Advanced Search**: Find contacts by name, company, or email
- **Stage Badges**: Color-coded stage indicators
- **Batch Actions**: Edit, delete, or export contacts

### 📈 Analytics
- **Key Metrics**: Sales, deal size, sales cycle, win rate
- **Funnel Statistics**: Conversion rates at each stage
- **Trend Analysis**: Monitor performance over time
- **Export Reports**: Download data as CSV

### ⚙️ Settings
- **Profile Management**: Update user information
- **Notification Preferences**: Customize alerts
- **Security Options**: Password and account settings

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python Flask with Flask-CORS
- **Database**: JSON file storage
- **API**: RESTful endpoints
- **Design**: Modern UI with gradient backgrounds and smooth animations

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- Modern web browser

### Quick Start

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the backend** (Terminal 1)
   ```bash
   python app.py
   ```
   Backend runs on: `http://localhost:5000`

3. **Start the frontend** (Terminal 2)
   ```bash
   python -m http.server 8080
   ```
   Frontend runs on: `http://localhost:8080`

## procrm - sales funnel crm

clean, modern crm for managing leads and moving them through a sales funnel. this repo contains a lightweight frontend (html/css/js) and a simple flask backend for storing leads in a json file. it's designed to be easy to run locally and to publish to github or a small cloud vm.

features

- simple dashboard with kpi cards and recent activity
- kanban-style sales funnel with drag-and-drop
- contacts table with search and quick actions
- basic analytics and funnel breakdown
- authentication (simple demo/local) and user profile
- export leads to csv

quick start (local)

1. install dependencies

```powershell
python -m pip install -r requirements.txt
```

2. start the backend (runs on port 5001)

```powershell
python app.py
```

3. serve the frontend (runs on port 8081)

```powershell
python -m http.server 8081
```

open `http://localhost:8081/login.html` to sign in. demo accounts are available on the login page.

deployment notes

- backend can be deployed to heroku, pythonanywhere, or a small cloud vm. set the flask port to environment PORT if required.
- frontend is static and works well with netlify, vercel, or github pages (for client-only hosting).

demo accounts

- admin: admin@crm.com / admin123
- sales: sales@crm.com / sales123

project structure

```
crm-sales-funnel/
├─ index.html          # main crm ui (requires login)
├─ login.html          # login and signup page
├─ app.py              # flask backend (leads stored in leads.json)
├─ js/
│  ├─ app.js           # frontend app logic
│  └─ auth.js          # auth helpers
├─ css/
│  ├─ style.css        # styles for the crm
│  └─ login.css        # login page styles
├─ requirements.txt
├─ start.bat
├─ start.sh
└─ README.md
```

notes

- this is intended as a lean, local-first crm. leads are stored in `leads.json` and in localstorage for quick access. consider swapping to a proper database for production (postgres, mysql, mongodb).
- authentication is intentionally simple for quick demo usage. replace with real auth (oauth, jwt, or session-based) before public deployment.

contributing

feel free to open an issue, or submit a pull request. if you want help deploying to a platform (heroku, vercel, digitalocean), i can add deployment files and instructions.

license

this project is provided as-is for learning and demonstration purposes.

thank you

if you'd like, i can make a short linkedin-ready blurb for you to copy/paste when posting this project.

