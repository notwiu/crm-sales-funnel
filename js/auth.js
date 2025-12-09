// ==================== Authentication Module ====================

const API_URL = 'http://localhost:5000/api';

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // Login user
    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Is the backend running on port 5000?' };
        }
    }

    // Signup user
    async signup(name, email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Signup failed' };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Logout user
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.token && this.user;
    }

    // Get current user
    getUser() {
        return this.user;
    }

    // Get token
    getToken() {
        return this.token;
    }
}

// Initialize auth manager
const auth = new AuthManager();

// ==================== Login Page Script ====================

// Only run on login page
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleLinks = document.querySelectorAll('.toggle-form');

    // Toggle between login and signup forms
    toggleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.toggle('active');
            signupForm.classList.toggle('active');
        });
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const result = await auth.login(email, password);
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = result.message;
            errorDiv.classList.add('show');
            setTimeout(() => errorDiv.classList.remove('show'), 3000);
        }
    });

    // Handle signup form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        if (password.length < 6) {
            const errorDiv = document.getElementById('signupError');
            errorDiv.textContent = 'Password must be at least 6 characters';
            errorDiv.classList.add('show');
            return;
        }

        const result = await auth.signup(name, email, password);
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            const errorDiv = document.getElementById('signupError');
            errorDiv.textContent = result.message;
            errorDiv.classList.add('show');
            setTimeout(() => errorDiv.classList.remove('show'), 3000);
        }
    });
}

// ==================== Dashboard Protection ====================

// Redirect to login if not authenticated
if (!auth.isAuthenticated() && window.location.pathname.endsWith('index.html')) {
    window.location.href = 'login.html';
}
