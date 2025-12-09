// ============================================
// AUTHENTICATION SYSTEM
// ============================================

const API_BASE = 'http://localhost:5001/api';

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    setupLoginForm();
    checkAuthStatus();
});

// ============================================
// LOGIN FORM SETUP
// ============================================

function setupLoginForm() {
    const toggleLink = document.getElementById('toggleLink');
    const toggleText = document.getElementById('toggleText');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    let isSignupMode = false;

    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isSignupMode = !isSignupMode;

        if (isSignupMode) {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            toggleText.innerHTML = 'Already have an account? <a href="#" id="toggleLink">Sign in</a>';
        } else {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleLink">Sign up</a>';
        }

        setupLoginForm();
    });
}

// ============================================
// LOGIN HANDLER
// ============================================

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            // Fallback to local authentication
            if (authenticateLocalUser(email, password)) {
                saveAuthToken({
                    id: generateId(),
                    email: email,
                    name: email.split('@')[0],
                    role: 'user'
                }, rememberMe);
                showToast('Login successful!', 'success');
                redirectToDashboard();
            } else {
                showToast('Invalid email or password', 'error');
            }
            return;
        }

        // Backend authentication successful
        saveAuthToken(data.user, rememberMe);
        showToast('Login successful!', 'success');
        redirectToDashboard();

    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
    }
}

// ============================================
// SIGNUP HANDLER
// ============================================

async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirm').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            // Fallback to local registration
            if (registerLocalUser(email, password, name)) {
                showToast('Account created successfully!', 'success');
                // Reset form and switch back to login
                document.getElementById('signupForm').reset();
                setTimeout(() => {
                    document.getElementById('toggleLink').click();
                }, 1500);
            } else {
                showToast('Email already registered', 'error');
            }
            return;
        }

        // Backend registration successful
        saveAuthToken(data.user, false);
        showToast('Account created successfully!', 'success');
        redirectToDashboard();

    } catch (error) {
        console.error('Signup error:', error);
        showToast('Signup failed. Please try again.', 'error');
    }
}

// ============================================
// DEMO LOGIN
// ============================================

function demoLogin(email, password) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
    
    // Auto-login with demo credentials
    authenticateLocalUser(email, password);
    saveAuthToken({
        id: generateId(),
        email: email,
        name: email.split('@')[0],
        role: email === 'admin@crm.com' ? 'admin' : 'sales'
    }, false);
    showToast('Demo login successful!', 'success');
    redirectToDashboard();
}

// ============================================
// LOCAL AUTHENTICATION (FALLBACK)
// ============================================

// Demo user database
const demoUsers = [
    { email: 'admin@crm.com', password: 'admin123', name: 'Admin User', role: 'admin' },
    { email: 'sales@crm.com', password: 'sales123', name: 'Sales Team', role: 'sales' }
];

function authenticateLocalUser(email, password) {
    const user = demoUsers.find(u => u.email === email && u.password === password);
    return user ? user : false;
}

function registerLocalUser(email, password, name) {
    // Check if user exists
    if (demoUsers.find(u => u.email === email)) {
        return false;
    }

    // Add new user to local storage
    const users = getStoredUsers();
    users.push({
        email: email,
        password: password,
        name: name,
        role: 'user',
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('crm_users', JSON.stringify(users));
    return true;
}

function getStoredUsers() {
    const stored = localStorage.getItem('crm_users');
    return stored ? JSON.parse(stored) : [];
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

function saveAuthToken(user, rememberMe) {
    const token = {
        user: user,
        token: generateToken(),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Save to session storage (always)
    sessionStorage.setItem('auth_token', JSON.stringify(token));

    // Save to local storage if remember me is checked
    if (rememberMe) {
        localStorage.setItem('auth_token', JSON.stringify(token));
    }
}

function getAuthToken() {
    // Check session storage first
    let token = sessionStorage.getItem('auth_token');
    if (token) {
        return JSON.parse(token);
    }

    // Check local storage
    token = localStorage.getItem('auth_token');
    if (token) {
        const parsed = JSON.parse(token);
        // Restore to session storage
        sessionStorage.setItem('auth_token', JSON.stringify(parsed));
        return parsed;
    }

    return null;
}

function clearAuthToken() {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
}

// ============================================
// AUTH STATUS CHECK
// ============================================

function checkAuthStatus() {
    const token = getAuthToken();
    
    // If user is logged in and on login page, redirect to dashboard
    if (token && window.location.pathname.endsWith('login.html')) {
        redirectToDashboard();
    }
}

// ============================================
// REDIRECT FUNCTIONS
// ============================================

function redirectToDashboard() {
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

function redirectToLogin() {
    clearAuthToken();
    window.location.href = 'login.html';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function generateToken() {
    return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// EXPORT FUNCTIONS FOR USE IN MAIN APP
// ============================================

function getCurrentUser() {
    const token = getAuthToken();
    return token ? token.user : null;
}

function isAuthenticated() {
    return getAuthToken() !== null;
}

function logoutUser() {
    clearAuthToken();
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        redirectToLogin();
    }, 1000);
}
