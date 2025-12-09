# ProCRM - Professional Sales Funnel CRM

A powerful, professional Customer Relationship Management (CRM) system with Sales Funnel management, built with modern technologies. Clean, modern CRM for managing leads and moving them through a sales funnel with a lightweight frontend and simple Flask backend.

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

4. **Open the application**
   - Navigate to `http://localhost:8080/login.html`
   - Use demo credentials (see below)

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@crm.com` | `admin123` |
| Sales | `sales@crm.com` | `sales123` |

## 📁 Project Structure

```
crm-sales-funnel/
├─ index.html          # Main CRM UI (requires login)
├─ login.html          # Login and signup page
├─ app.py              # Flask backend (leads stored in leads.json)
├─ js/
│  ├─ app.js           # Frontend app logic
│  └─ auth.js          # Auth helpers
├─ css/
│  ├─ style.css        # Styles for the CRM
│  └─ login.css        # Login page styles
├─ requirements.txt    # Python dependencies
├─ start.bat           # Windows startup script
├─ start.sh            # Unix startup script
├─ leads.json          # Lead data storage
└─ README.md           # This file
```

## 🚀 Deployment

### Backend
- **Heroku**: Set the Flask port to environment `PORT` variable
- **PythonAnywhere**: Simple Python web hosting
- **Cloud VMs**: DigitalOcean, AWS, Azure (set `PORT` env variable)

### Frontend
- **Netlify**: Drag & drop static files
- **Vercel**: Perfect for static hosting
- **GitHub Pages**: Client-only hosting (static files)

## 📝 Important Notes

- **Local-First Design**: Leads are stored in `leads.json` and LocalStorage for quick access
- **For Production**: Consider upgrading to a proper database (PostgreSQL, MySQL, MongoDB)
- **Security**: Authentication is intentionally simple for demo usage. Replace with proper auth (OAuth, JWT, or session-based) before public deployment
- **Easy to Extend**: Clean codebase designed for easy customization and feature additions

## 🤝 Contributing

We welcome contributions! Feel free to:
- Open an issue for bug reports or feature requests
- Submit a pull request with improvements
- Ask for help with deployment to specific platforms (Heroku, Vercel, DigitalOcean, etc.)

## 📄 License

This project is provided as-is for learning and demonstration purposes.

## 🙏 Thank You

Built with care for sales teams and CRM enthusiasts. If you find this helpful, please consider starring the repository!

