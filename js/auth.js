document.addEventListener('DOMContentLoaded', function() {
    // Create default admin account if it doesn't exist
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.some(user => user.isAdmin);
    
    if (!adminExists) {
        const adminUser = {
            id: 'admin-' + Date.now(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            isAdmin: true,
            createdAt: new Date().toISOString()
        };
        
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Default admin account created successfully');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
    }
});

class AuthManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        
        // Create default admin user if no users exist
        if (this.users.length === 0) {
            this.createDefaultAdmin();
        }
        
        this.init();
    }

    init() {
        this.attachEventListeners();
        
        // Redirect to dashboard if already logged in
        if (this.currentUser) {
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            } else if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
                // Allow access to landing page even when logged in
                return;
            }
        } else {
            // If not logged in and trying to access protected pages, redirect to login
            if (window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'login.html';
            }
        }
    }

    createDefaultAdmin() {
        const adminUser = {
            id: 'admin',
            name: 'Admin User',
            email: 'admin@example.com',
            phone: '1234567890',
            password: this.hashPassword('admin123'),
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        this.users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        console.log('Default admin user created. Email: admin@example.com, Password: admin123');
    }

    attachEventListeners() {
        // Tab switching
        const tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetForm = tab.dataset.tab;
                this.switchForm(targetForm);
            });
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Password strength indicator
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
            });
        }
    }

    switchForm(formType) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const tabs = document.querySelectorAll('.auth-tab');

        if (formType === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }

        // Update active tab
        tabs.forEach(tab => {
            if (tab.dataset.tab === formType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user || !this.verifyPassword(password, user.password)) {
            this.showError('Invalid email or password');
            return;
        }

        // Set current user
        const currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.location.href = 'dashboard.html';
    }

    handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validation
        if (!name || !email || !phone || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        if (this.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            this.showError('Email already registered');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            password: this.hashPassword(password),
            role: 'client', // Default role
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));

        // Auto login after registration
        const currentUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role
        };

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.location.href = 'dashboard.html';
    }

    hashPassword(password) {
        // In a real application, use a proper hashing algorithm
        // This is just for demonstration
        return btoa(password);
    }

    verifyPassword(password, hashedPassword) {
        return btoa(password) === hashedPassword;
    }

    updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.password-strength-bar');
        if (!strengthBar) return;

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;

        strengthBar.className = 'password-strength-bar';
        if (strength === 1) strengthBar.classList.add('strength-weak');
        if (strength === 2) strengthBar.classList.add('strength-medium');
        if (strength === 3) strengthBar.classList.add('strength-strong');
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 300);
        }, 3000);
    }

    static logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    static getCurrentUser() {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    }

    static isLoggedIn() {
        return !!this.getCurrentUser();
    }

    static isAdmin() {
        const user = this.getCurrentUser();
        return user && (user.role === 'admin' || user.isAdmin === true);
    }

    static async login(email, password) {
        // For demo purposes, we'll use a simple check
        if (email && password) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            // Find user by email and check hashed password
            const user = users.find(u => 
                u.email === email && 
                (u.password === btoa(password) || u.password === password)  // Check both hashed and unhashed
            );
            
            if (user) {
                const { password, ...userWithoutPassword } = user;
                localStorage.setItem('currentUser', JSON.stringify({
                    ...userWithoutPassword,
                    isAdmin: user.role === 'admin' || user.isAdmin // Support both role and isAdmin
                }));
                
                // Redirect based on user role
                if (user.role === 'admin' || user.isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
                return true;
            }
        }
        throw new Error('Invalid credentials');
    }

    static async register(userData) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.some(user => user.email === userData.email)) {
            throw new Error('Email already registered');
        }

        // Create new user
        const newUser = {
            ...userData,
            id: Date.now().toString(),
            isAdmin: false, // New users are never admins by default
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Log in the new user
        const { password, ...userWithoutPassword } = newUser;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        window.location.href = 'dashboard.html';
        return true;
    }

    static updateProfile(userData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new Error('No user logged in');
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // Update user data
        const updatedUser = {
            ...users[userIndex],
            ...userData,
            isAdmin: users[userIndex].isAdmin // Preserve admin status
        };

        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));

        // Update current user in localStorage
        const { password, ...userWithoutPassword } = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

        return true;
    }

    static checkAdminAccess() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }

        if (!this.isAdmin()) {
            window.location.href = 'dashboard.html';
            return false;
        }

        return true;
    }

    static getAllUsers() {
        if (!this.isAdmin()) {
            throw new Error('Unauthorized access');
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.map(({ password, ...user }) => user);
    }

    static deleteUser(userId) {
        if (!this.isAdmin()) {
            throw new Error('Unauthorized access');
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(user => user.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
    }

    static makeAdmin(userId) {
        if (!this.isAdmin()) {
            throw new Error('Unauthorized access');
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex].isAdmin = true;
        localStorage.setItem('users', JSON.stringify(users));
    }

    static removeAdmin(userId) {
        if (!this.isAdmin()) {
            throw new Error('Unauthorized access');
        }

        const currentUser = this.getCurrentUser();
        if (userId === currentUser.id) {
            throw new Error('Cannot remove admin status from yourself');
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex].isAdmin = false;
        localStorage.setItem('users', JSON.stringify(users));
    }

    static createDefaultAdminIfNeeded() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if there's already an admin user
        const hasAdmin = users.some(user => user.isAdmin);
        
        if (!hasAdmin) {
            // Create default admin account
            const adminUser = {
                id: 'admin-' + Date.now(),
                name: 'Admin User',
                email: 'admin@photobook.com',
                password: 'admin123',
                isAdmin: true,
                createdAt: new Date().toISOString()
            };
            
            users.push(adminUser);
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Default admin account created');
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Make AuthManager available globally
window.AuthManager = AuthManager;

// Create default admin account when the script loads
AuthManager.createDefaultAdminIfNeeded(); 