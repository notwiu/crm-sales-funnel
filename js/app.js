// ==================== Main CRM Application ====================

// ==================== Theme Management ====================
const ThemeManager = {
    THEME_KEY: 'crm-theme',
    
    init() {
        // Load saved theme or use system preference
        const savedTheme = localStorage.getItem(this.THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        this.setTheme(theme);
        this.setupToggleButton();
    },
    
    setTheme(theme) {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem(this.THEME_KEY, 'dark');
            this.updateToggleIcon('dark');
        } else {
            html.removeAttribute('data-theme');
            localStorage.setItem(this.THEME_KEY, 'light');
            this.updateToggleIcon('light');
        }
    },
    
    updateToggleIcon(theme) {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.textContent = theme === 'dark' ? '☀️' : '🌙';
            btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        }
    },
    
    toggle() {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        this.setTheme(isDark ? 'light' : 'dark');
    },
    
    setupToggleButton() {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    }
};

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    // Initialize theme first
    ThemeManager.init();
    
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    initializeApp();
});

// Initialize the app
async function initializeApp() {
    // Set user info
    const user = auth.getUser();
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role;
    document.getElementById('settingsEmail').textContent = user.email;
    document.getElementById('settingsName').textContent = user.name;
    document.getElementById('settingsRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    // Load initial data
    await loadLeads();
    updateDashboard();

    // Setup navigation
    setupNavigation();

    // Setup modal handling
    setupModals();

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.logout();
        window.location.href = 'login.html';
    });

    // Setup search
    const searchInput = document.getElementById('contactSearch');
    searchInput.addEventListener('input', filterContacts);

    // Reload data every 5 seconds
    setInterval(loadLeads, 5000);
}

// ==================== Data Management ====================

let leads = [];

// Load leads from API
async function loadLeads() {
    try {
        const response = await fetch(`${API_URL}/leads`);
        leads = await response.json();
        renderKanban();
        renderContactsTable();
        updateDashboard();
    } catch (error) {
        console.error('Failed to load leads:', error);
    }
}

// Add new lead
async function addLead(leadData) {
    try {
        const response = await fetch(`${API_URL}/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
        });

        const result = await response.json();
        if (result.success) {
            await loadLeads();
            return { success: true };
        }
    } catch (error) {
        console.error('Failed to add lead:', error);
    }
    return { success: false };
}

// Update lead
async function updateLead(leadId, leadData) {
    try {
        const response = await fetch(`${API_URL}/leads/${leadId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
        });

        const result = await response.json();
        if (result.success) {
            await loadLeads();
            return { success: true };
        }
    } catch (error) {
        console.error('Failed to update lead:', error);
    }
    return { success: false };
}

// Delete lead
async function deleteLead(leadId) {
    try {
        const response = await fetch(`${API_URL}/leads/${leadId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            await loadLeads();
            return { success: true };
        }
    } catch (error) {
        console.error('Failed to delete lead:', error);
    }
    return { success: false };
}

// ==================== Dashboard ====================

async function updateDashboard() {
    // Calculate metrics
    const totalLeads = leads.length;
    const pipelineValue = leads
        .filter(l => l.stage !== 'Closed')
        .reduce((sum, l) => sum + l.value, 0);
    const closedDeals = leads
        .filter(l => l.stage === 'Closed')
        .reduce((sum, l) => sum + l.value, 0);
    const conversionRate = totalLeads > 0 
        ? (leads.filter(l => l.stage === 'Closed').length / totalLeads * 100).toFixed(1)
        : 0;

    // Update KPI cards
    document.getElementById('totalLeads').textContent = totalLeads;
    document.getElementById('pipelineValue').textContent = formatCurrency(pipelineValue);
    document.getElementById('closedDeals').textContent = formatCurrency(closedDeals);
    document.getElementById('conversionRate').textContent = conversionRate + '%';

    // Update funnel breakdown
    const stages = ['Prospect', 'Qualified', 'Negotiation', 'Closed'];
    stages.forEach(stage => {
        const count = leads.filter(l => l.stage === stage).length;
        const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
        
        const element = document.getElementById(`funnel${stage}`);
        if (element) {
            element.style.width = percentage + '%';
            document.getElementById(`funnel${stage}Count`).textContent = count;
        }
    });

    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const activity = leads
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const activityList = document.getElementById('recentActivity');
    if (activity.length === 0) {
        activityList.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }

    activityList.innerHTML = activity.map(lead => `
        <div class="activity-item">
            <div class="activity-icon">📌</div>
            <div class="activity-details">
                <div class="activity-title">${lead.name}</div>
                <div class="activity-subtitle">${lead.company} • ${lead.stage}</div>
                <div class="activity-time">${new Date(lead.createdAt).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

// ==================== Kanban Board ====================

function renderKanban() {
    const stages = ['Prospect', 'Qualified', 'Negotiation', 'Closed'];
    
    stages.forEach(stage => {
        const stageLeads = leads.filter(l => l.stage === stage);
        const container = document.getElementById(`cards${stage}`);
        
        // Update count
        document.getElementById(`count${stage}`).textContent = stageLeads.length;

        // Render cards
        container.innerHTML = stageLeads.map(lead => `
            <div class="kanban-card" draggable="true" data-id="${lead.id}">
                <div class="card-header">
                    <h4>${lead.name}</h4>
                    <button class="card-menu-btn" onclick="openCardMenu(event, ${lead.id})">⋮</button>
                </div>
                <div class="card-body">
                    <p class="card-company">${lead.company}</p>
                    <p class="card-email">${lead.email}</p>
                    <div class="card-value">${formatCurrency(lead.value)}</div>
                </div>
            </div>
        `).join('');

        // Setup drag and drop
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });

        container.addEventListener('dragleave', () => {
            container.classList.remove('drag-over');
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            const leadId = parseInt(e.dataTransfer.getData('text/plain'));
            const lead = leads.find(l => l.id === leadId);
            if (lead && lead.stage !== stage) {
                updateLead(leadId, { ...lead, stage });
            }
        });
    });

    // Setup drag start
    document.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.id);
        });
    });
}

// ==================== Contacts Table ====================

function renderContactsTable() {
    const tbody = document.getElementById('contactsTableBody');
    
    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No contacts found</td></tr>';
        return;
    }

    tbody.innerHTML = leads.map(lead => `
        <tr>
            <td><strong>${lead.name}</strong></td>
            <td>${lead.company}</td>
            <td><a href="mailto:${lead.email}">${lead.email}</a></td>
            <td><span class="stage-badge stage-${lead.stage.toLowerCase()}">${lead.stage}</span></td>
            <td>${formatCurrency(lead.value)}</td>
            <td>
                <button class="action-btn" onclick="openEditModal(${lead.id})">Edit</button>
                <button class="action-btn action-danger" onclick="openDeleteConfirm(${lead.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function filterContacts() {
    const searchTerm = document.getElementById('contactSearch').value.toLowerCase();
    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm) ||
        lead.company.toLowerCase().includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm)
    );

    const tbody = document.getElementById('contactsTableBody');
    if (filteredLeads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No contacts found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredLeads.map(lead => `
        <tr>
            <td><strong>${lead.name}</strong></td>
            <td>${lead.company}</td>
            <td><a href="mailto:${lead.email}">${lead.email}</a></td>
            <td><span class="stage-badge stage-${lead.stage.toLowerCase()}">${lead.stage}</span></td>
            <td>${formatCurrency(lead.value)}</td>
            <td>
                <button class="action-btn" onclick="openEditModal(${lead.id})">Edit</button>
                <button class="action-btn action-danger" onclick="openDeleteConfirm(${lead.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// ==================== Analytics ====================

function updateAnalytics() {
    const stages = ['Prospect', 'Qualified', 'Negotiation', 'Closed'];
    const statsContainer = document.getElementById('funnelStats');

    let html = '';
    stages.forEach(stage => {
        const stageLeads = leads.filter(l => l.stage === stage);
        const count = stageLeads.length;
        const value = stageLeads.reduce((sum, l) => sum + l.value, 0);
        const percentage = leads.length > 0 ? ((count / leads.length) * 100).toFixed(1) : 0;

        html += `
            <div class="stat-item">
                <div class="stat-label">${stage}</div>
                <div class="stat-value">${count} leads • ${formatCurrency(value)}</div>
                <div class="stat-bar" style="width: ${percentage}%"></div>
            </div>
        `;
    });

    statsContainer.innerHTML = html;
}

// ==================== Modal Management ====================

let currentLeadId = null;
let currentLeadStage = null;

function setupModals() {
    const leadForm = document.getElementById('leadForm');
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const leadData = {
            name: document.getElementById('leadName').value,
            company: document.getElementById('leadCompany').value,
            email: document.getElementById('leadEmail').value,
            stage: document.getElementById('leadStage').value,
            value: parseInt(document.getElementById('leadValue').value)
        };

        if (currentLeadId) {
            await updateLead(currentLeadId, leadData);
        } else {
            await addLead(leadData);
        }

        closeAddLeadModal();
    });
}

function openAddLeadModal(stage = null) {
    currentLeadId = null;
    document.getElementById('modalTitle').textContent = 'Add New Lead';
    document.getElementById('leadForm').reset();
    
    if (stage) {
        document.getElementById('leadStage').value = stage;
    }
    
    document.getElementById('leadModal').classList.add('active');
}

function openEditModal(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    currentLeadId = leadId;
    document.getElementById('modalTitle').textContent = 'Edit Lead';
    document.getElementById('leadName').value = lead.name;
    document.getElementById('leadCompany').value = lead.company;
    document.getElementById('leadEmail').value = lead.email;
    document.getElementById('leadStage').value = lead.stage;
    document.getElementById('leadValue').value = lead.value;
    
    document.getElementById('leadModal').classList.add('active');
}

function closeAddLeadModal() {
    document.getElementById('leadModal').classList.remove('active');
}

function openDeleteConfirm(leadId) {
    document.getElementById('confirmTitle').textContent = 'Delete Lead';
    document.getElementById('confirmMessage').textContent = 'Are you sure you want to delete this lead? This action cannot be undone.';
    document.getElementById('confirmBtn').textContent = 'Delete';
    document.getElementById('confirmBtn').className = 'btn btn-danger';
    
    const modal = document.getElementById('confirmModal');
    modal.classList.add('active');
    
    window.currentDeleteId = leadId;
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

function confirmAction() {
    if (window.currentDeleteId) {
        deleteLead(window.currentDeleteId);
        closeConfirmModal();
    }
}

function openCardMenu(event, leadId) {
    event.stopPropagation();
    // Simple menu - expand with more options as needed
    const actions = confirm('Actions: Click OK to edit, Cancel to delete');
    if (actions) {
        openEditModal(leadId);
    } else {
        openDeleteConfirm(leadId);
    }
}

// Close modal on background click
document.addEventListener('click', (e) => {
    const leadModal = document.getElementById('leadModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (e.target === leadModal) leadModal.classList.remove('active');
    if (e.target === confirmModal) confirmModal.classList.remove('active');
});

// ==================== Navigation ====================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show selected page
            const pageId = link.dataset.page;
            document.getElementById(pageId).classList.add('active');
            
            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'kanban': 'Sales Funnel',
                'contacts': 'Contacts',
                'analytics': 'Analytics',
                'settings': 'Settings'
            };
            document.getElementById('pageTitle').textContent = titles[pageId] || 'Dashboard';
            
            // Update analytics when navigating to analytics
            if (pageId === 'analytics') {
                updateAnalytics();
            }
        });
    });
}

// ==================== CSV Export ====================

function exportToCSV() {
    let csv = 'Name,Company,Email,Stage,Value,Created\n';
    
    leads.forEach(lead => {
        const date = new Date(lead.createdAt).toLocaleDateString();
        csv += `"${lead.name}","${lead.company}","${lead.email}","${lead.stage}",${lead.value},"${date}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// ==================== Utility Functions ====================

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(value);
}
