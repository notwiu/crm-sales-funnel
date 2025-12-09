// State management
let leads = [];
let filteredLeads = [];
let editingLeadId = null;

// API Base URL
const API_BASE = 'http://localhost:5001/api';

// ============================================
// USER PROFILE
// ============================================

function loadUserProfile() {
    const user = getCurrentUser();
    if (user) {
        // Update sidebar with user info
        document.getElementById('userName').textContent = user.name || 'User';
        document.getElementById('userRole').textContent = user.role === 'admin' ? 'Admin' : 'Sales Rep';
        
        // Generate avatar from name
        const initials = user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
        document.getElementById('userAvatar').textContent = initials;
    }
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Load user profile
    loadUserProfile();
    
    // Load leads data
    loadLeads();
    renderDashboard();
    loadLeadsFromLocalStorage();
});

// ============================================
// LOCAL STORAGE MANAGEMENT
// ============================================

function saveLeadsToLocalStorage() {
    localStorage.setItem('leads', JSON.stringify(leads));
}

function loadLeadsFromLocalStorage() {
    const saved = localStorage.getItem('leads');
    if (saved) {
        leads = JSON.parse(saved);
    }
}

// ============================================
// API FUNCTIONS
// ============================================

async function loadLeads() {
    try {
        const response = await fetch(`${API_BASE}/leads`);
        const data = await response.json();
        leads = data.leads || [];
        saveLeadsToLocalStorage();
        renderAllPages();
    } catch (error) {
        console.log('Loading from local storage...');
        loadLeadsFromLocalStorage();
        renderAllPages();
    }
}

async function saveLead(leadData) {
    try {
        const method = editingLeadId ? 'PUT' : 'POST';
        const url = editingLeadId ? `${API_BASE}/leads/${editingLeadId}` : `${API_BASE}/leads`;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
        });

        const result = await response.json();

        if (editingLeadId) {
            const index = leads.findIndex(l => l.id === editingLeadId);
            if (index !== -1) leads[index] = result.lead;
        } else {
            leads.push(result.lead);
        }

        saveLeadsToLocalStorage();
        renderAllPages();
        showToast(editingLeadId ? 'Lead updated successfully' : 'Lead added successfully', 'success');

    } catch (error) {
        showToast('Error saving lead', 'error');
    }
}

async function deleteLead(id) {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
        await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
        leads = leads.filter(l => l.id !== id);
        saveLeadsToLocalStorage();
        renderAllPages();
        showToast('Lead deleted successfully', 'success');
    } catch (error) {
        showToast('Error deleting lead', 'error');
    }
}

// ============================================
// PAGE NAVIGATION
// ============================================

function switchPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));

    // Show selected page
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    // Mark the active nav link
    const navLink = document.querySelector(`.nav-link[onclick*="'${pageId}'"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        funnel: 'Sales Funnel',
        contacts: 'Contacts',
        analytics: 'Analytics',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[pageId];

    // Render page specific content
    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'funnel') renderFunnel();
    if (pageId === 'contacts') renderContacts();
}

// ============================================
// DASHBOARD RENDERING
// ============================================

function renderDashboard() {
    updateKPIs();
    renderFunnelChart();
    renderActivityList();
}

function updateKPIs() {
    const totalLeads = leads.length;
    const closedDeals = leads.filter(l => l.stage === 'closed').length;
    const pipelineValue = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
    const conversionRate = totalLeads > 0 ? ((closedDeals / totalLeads) * 100).toFixed(1) : 0;

    document.getElementById('totalLeads').textContent = totalLeads;
    document.getElementById('closedDeals').textContent = closedDeals;
    document.getElementById('pipelineValue').textContent = `$${pipelineValue.toLocaleString()}`;
    document.getElementById('conversionRate').textContent = `${conversionRate}%`;
}

function renderFunnelChart() {
    const stages = ['prospect', 'qualified', 'negotiation', 'closed'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    const html = stages.map((stage, index) => {
        const count = leads.filter(l => l.stage === stage).length;
        const percentage = leads.length > 0 ? ((count / leads.length) * 100) : 0;

        return `
            <div class="funnel-stage">
                <span class="funnel-label">${stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
                <div class="funnel-bar" style="width: ${percentage}%; background: ${colors[index]}; min-width: 50px;">
                </div>
                <span class="funnel-label">${count}</span>
            </div>
        `;
    }).join('');

    document.getElementById('funnelChart').innerHTML = html;
}

function renderActivityList() {
    const recent = leads.slice(-5).reverse();

    const html = recent.map(lead => `
        <div class="activity-item">
            <div class="activity-time">${new Date(lead.createdAt).toLocaleDateString()}</div>
            <div class="activity-text">
                <strong>${lead.firstName} ${lead.lastName}</strong> added to ${lead.stage}
            </div>
        </div>
    `).join('');

    document.getElementById('activityList').innerHTML = html || '<p style="color: var(--text-secondary); text-align: center;">No activity yet</p>';
}

// ============================================
// SALES FUNNEL (KANBAN) RENDERING
// ============================================

function renderFunnel() {
    const stages = ['prospect', 'qualified', 'negotiation', 'closed'];

    stages.forEach(stage => {
        const stageLeads = leads.filter(l => l.stage === stage);
        const container = document.getElementById(`stage-${stage}`);

        container.innerHTML = stageLeads.map(lead => `
            <div class="lead-card" draggable="true" data-id="${lead.id}">
                <div class="lead-card-title">${lead.firstName} ${lead.lastName}</div>
                <div class="lead-card-company">${lead.company}</div>
                ${lead.dealValue ? `<div class="lead-card-value">$${lead.dealValue.toLocaleString()}</div>` : ''}
                <div class="lead-card-footer">
                    <span class="lead-card-date">${new Date(lead.createdAt).toLocaleDateString()}</span>
                    <div class="card-actions">
                        <button class="card-btn" onclick="viewLeadDetails('${lead.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="card-btn" onclick="editLead('${lead.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="card-btn" onclick="deleteLead('${lead.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById(`count-${stage}`).textContent = stageLeads.length;
    });

    setupDragAndDrop();
}

// ============================================
// DRAG AND DROP
// ============================================

function setupDragAndDrop() {
    const cards = document.querySelectorAll('.lead-card');
    const containers = document.querySelectorAll('.cards-container');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    });

    containers.forEach(container => {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            container.style.background = 'rgba(99, 102, 241, 0.05)';
        });

        container.addEventListener('dragleave', () => {
            container.style.background = '';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.style.background = '';

            const draggingCard = document.querySelector('.lead-card.dragging');
            if (draggingCard) {
                const leadId = draggingCard.dataset.id;
                const newStage = container.parentElement.dataset.stage;

                // Update lead stage
                const lead = leads.find(l => l.id === leadId);
                if (lead) {
                    lead.stage = newStage;
                    saveLeadsToLocalStorage();
                    renderFunnel();
                    showToast('Lead moved to ' + newStage, 'success');
                }
            }
        });
    });
}

// ============================================
// CONTACTS PAGE
// ============================================

function renderContacts() {
    const tbody = document.getElementById('contactsTableBody');

    const html = leads.map(lead => `
        <tr>
            <td><strong>${lead.firstName} ${lead.lastName}</strong></td>
            <td>${lead.company}</td>
            <td>${lead.email}</td>
            <td>${lead.phone || '-'}</td>
            <td class="stage-badge">
                <span class="badge-stage badge-${lead.stage}">${lead.stage}</span>
            </td>
            <td>${lead.dealValue ? '$' + lead.dealValue.toLocaleString() : '-'}</td>
            <td class="actions">
                <button class="action-btn" onclick="editLead('${lead.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteLead('${lead.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = html || '<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-secondary);">No contacts yet</td></tr>';
}

function searchContacts() {
    const query = document.getElementById('searchContacts').value.toLowerCase();
    const tbody = document.getElementById('contactsTableBody');

    const filtered = leads.filter(lead =>
        lead.firstName.toLowerCase().includes(query) ||
        lead.lastName.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query)
    );

    const html = filtered.map(lead => `
        <tr>
            <td><strong>${lead.firstName} ${lead.lastName}</strong></td>
            <td>${lead.company}</td>
            <td>${lead.email}</td>
            <td>${lead.phone || '-'}</td>
            <td class="stage-badge">
                <span class="badge-stage badge-${lead.stage}">${lead.stage}</span>
            </td>
            <td>${lead.dealValue ? '$' + lead.dealValue.toLocaleString() : '-'}</td>
            <td class="actions">
                <button class="action-btn" onclick="editLead('${lead.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteLead('${lead.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
}

// ============================================
// FILTER AND SORT
// ============================================

function filterByStage() {
    const stage = document.getElementById('stageFilter').value;
    if (stage) {
        filteredLeads = leads.filter(l => l.stage === stage);
    } else {
        filteredLeads = leads;
    }
    renderFunnel();
}

function sortLeads(sortBy) {
    let sorted = [...leads];

    if (sortBy === 'name') {
        sorted.sort((a, b) => a.firstName.localeCompare(b.firstName));
    } else if (sortBy === 'value') {
        sorted.sort((a, b) => (b.dealValue || 0) - (a.dealValue || 0));
    } else {
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    leads = sorted;
    saveLeadsToLocalStorage();
    renderFunnel();
}

// ============================================
// MODAL OPERATIONS
// ============================================

function openAddLead() {
    editingLeadId = null;
    document.getElementById('modalTitle').textContent = 'Add New Lead';
    document.getElementById('leadForm').reset();
    document.getElementById('leadModal').classList.add('open');
}

function editLead(id) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    editingLeadId = id;
    document.getElementById('modalTitle').textContent = 'Edit Lead';

    document.getElementById('firstName').value = lead.firstName;
    document.getElementById('lastName').value = lead.lastName;
    document.getElementById('company').value = lead.company;
    document.getElementById('position').value = lead.position || '';
    document.getElementById('email').value = lead.email;
    document.getElementById('phone').value = lead.phone || '';
    document.getElementById('dealValue').value = lead.dealValue || '';
    document.getElementById('stage').value = lead.stage;
    document.getElementById('notes').value = lead.notes || '';

    document.getElementById('leadModal').classList.add('open');
}

function closeLead() {
    document.getElementById('leadModal').classList.remove('open');
    editingLeadId = null;
}

function handleSaveLead(e) {
    e.preventDefault();

    const leadData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        company: document.getElementById('company').value,
        position: document.getElementById('position').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        dealValue: parseInt(document.getElementById('dealValue').value) || 0,
        stage: document.getElementById('stage').value,
        notes: document.getElementById('notes').value
    };

    saveLead(leadData);
    closeLead();
}

function viewLeadDetails(id) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    const html = `
        <div style="display: grid; gap: 15px;">
            <div>
                <p style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Name</p>
                <p style="font-size: 16px; font-weight: 600;">${lead.firstName} ${lead.lastName}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Company</p>
                <p style="font-size: 14px;">${lead.company}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Contact</p>
                <p style="font-size: 14px;">${lead.email}</p>
                ${lead.phone ? `<p style="font-size: 14px;">${lead.phone}</p>` : ''}
            </div>
            <div>
                <p style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Stage</p>
                <span class="badge-stage badge-${lead.stage}">${lead.stage}</span>
            </div>
            <div>
                <p style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Deal Value</p>
                <p style="font-size: 16px; font-weight: 600; color: var(--primary);">$${lead.dealValue.toLocaleString()}</p>
            </div>
            ${lead.notes ? `<div><p style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Notes</p><p>${lead.notes}</p></div>` : ''}
            <div>
                <p style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Created</p>
                <p>${new Date(lead.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
    `;

    document.getElementById('detailsContent').innerHTML = html;
    document.getElementById('detailsModal').classList.add('open');
}

function closeDetails() {
    document.getElementById('detailsModal').classList.remove('open');
}

// ============================================
// EXPORT FUNCTION
// ============================================

function exportFunnel() {
    const csv = [
        ['First Name', 'Last Name', 'Company', 'Email', 'Phone', 'Stage', 'Deal Value', 'Notes']
    ];

    leads.forEach(lead => {
        csv.push([
            lead.firstName,
            lead.lastName,
            lead.company,
            lead.email,
            lead.phone || '',
            lead.stage,
            lead.dealValue || '',
            lead.notes || ''
        ]);
    });

    const csvContent = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().getTime()}.csv`;
    a.click();

    showToast('Funnel exported as CSV', 'success');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function renderAllPages() {
    renderDashboard();
    renderFunnel();
    renderContacts();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
