class AdminPanel {
    constructor() {
        // Check admin access
        if (!AuthManager.checkAdminAccess()) {
            return;
        }

        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        // Set up admin info
        const admin = AuthManager.getCurrentUser();
        document.querySelector('.admin-name').textContent = admin.name;
        document.querySelector('.admin-email').textContent = admin.email;

        // Initialize navigation
        this.initNavigation();

        // Initialize event listeners
        this.initEventListeners();

        // Load initial data
        this.loadDashboardStats();
        this.loadBookings();
        this.loadUsers();
    }

    initNavigation() {
        // Handle navigation clicks
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });
    }

    initEventListeners() {
        // Booking filters
        document.getElementById('adminBookingStatusFilter')?.addEventListener('change', () => this.loadBookings());
        document.getElementById('adminBookingDateFilter')?.addEventListener('change', () => this.loadBookings());

        // User search
        document.getElementById('userSearch')?.addEventListener('input', (e) => this.filterUsers(e.target.value));

        // Export buttons
        document.getElementById('exportBookings')?.addEventListener('click', () => this.exportBookings());
        document.getElementById('exportUsers')?.addEventListener('click', () => this.exportUsers());
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        document.getElementById(sectionId)?.classList.remove('hidden');
        this.currentSection = sectionId;

        // Update navigation
        document.querySelectorAll('.nav-links a').forEach(link => {
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    async loadDashboardStats() {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const users = AuthManager.getAllUsers();

        // Calculate stats
        const stats = {
            pending: bookings.filter(b => b.status === 'pending').length,
            approved: bookings.filter(b => b.status === 'approved').length,
            rejected: bookings.filter(b => b.status === 'rejected').length,
            totalUsers: users.length
        };

        // Update stats display
        document.querySelector('.pending-count').textContent = stats.pending;
        document.querySelector('.approved-count').textContent = stats.approved;
        document.querySelector('.rejected-count').textContent = stats.rejected;
        document.querySelector('.users-count').textContent = stats.totalUsers;
    }

    loadBookings() {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const statusFilter = document.getElementById('adminBookingStatusFilter').value;
        const dateFilter = document.getElementById('adminBookingDateFilter').value;

        let filteredBookings = [...bookings];

        // Apply status filter
        if (statusFilter !== 'all') {
            filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter);
        }

        // Apply date sort
        filteredBookings.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
        });

        // Render bookings
        const container = document.querySelector('.admin-bookings-list');
        container.innerHTML = filteredBookings.map(booking => this.createBookingCard(booking)).join('');

        // Add event listeners to booking actions
        this.initBookingActionListeners();
    }

    createBookingCard(booking) {
        const user = AuthManager.getAllUsers().find(u => u.id === booking.userId);
        const statusClass = booking.status.toLowerCase();
        const date = new Date(booking.date + ' ' + booking.time);

        return `
            <div class="admin-booking-card ${statusClass}" data-booking-id="${booking.id}">
                <div class="admin-booking-header">
                    <div class="admin-booking-user">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-info">
                            <h3>${user?.name || 'Unknown User'}</h3>
                            <p>${user?.email || 'No email'}</p>
                        </div>
                    </div>
                    <span class="booking-status">${booking.status}</span>
                </div>
                <div class="admin-booking-details">
                    <div class="booking-main-info">
                        <p><i class="fas fa-calendar"></i> ${booking.date}</p>
                        <p><i class="fas fa-clock"></i> ${booking.time}</p>
                        <p><i class="fas fa-camera"></i> ${booking.sessionType}</p>
                    </div>
                    <div class="booking-secondary-info">
                        <p><i class="fas fa-hourglass"></i> ${booking.duration} hours</p>
                        <p><i class="fas fa-users"></i> ${booking.guests} people</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${booking.location}</p>
                    </div>
                </div>
                ${booking.notes ? `
                    <div class="booking-notes">
                        <p><i class="fas fa-sticky-note"></i> ${booking.notes}</p>
                    </div>
                ` : ''}
                <div class="admin-booking-actions">
                    ${booking.status === 'pending' ? `
                        <button class="btn-primary approve-booking">Approve</button>
                        <button class="btn-danger reject-booking">Reject</button>
                    ` : ''}
                    <button class="btn-danger delete-booking">Delete</button>
                </div>
            </div>
        `;
    }

    initBookingActionListeners() {
        // Approve booking
        document.querySelectorAll('.approve-booking').forEach(button => {
            button.addEventListener('click', (e) => {
                const bookingId = e.target.closest('.admin-booking-card').dataset.bookingId;
                this.updateBookingStatus(bookingId, 'approved');
            });
        });

        // Reject booking
        document.querySelectorAll('.reject-booking').forEach(button => {
            button.addEventListener('click', (e) => {
                const bookingId = e.target.closest('.admin-booking-card').dataset.bookingId;
                this.updateBookingStatus(bookingId, 'rejected');
            });
        });

        // Delete booking
        document.querySelectorAll('.delete-booking').forEach(button => {
            button.addEventListener('click', (e) => {
                const bookingId = e.target.closest('.admin-booking-card').dataset.bookingId;
                this.deleteBooking(bookingId);
            });
        });
    }

    updateBookingStatus(bookingId, status) {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);

        if (bookingIndex !== -1) {
            bookings[bookingIndex].status = status;
            localStorage.setItem('bookings', JSON.stringify(bookings));
            this.loadBookings();
            this.loadDashboardStats();
        }
    }

    deleteBooking(bookingId) {
        if (confirm('Are you sure you want to delete this booking?')) {
            const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const updatedBookings = bookings.filter(b => b.id !== bookingId);
            localStorage.setItem('bookings', JSON.stringify(updatedBookings));
            this.loadBookings();
            this.loadDashboardStats();
        }
    }

    loadUsers() {
        const users = AuthManager.getAllUsers();
        const container = document.querySelector('.users-list');
        
        container.innerHTML = users.map(user => this.createUserCard(user)).join('');
        this.initUserActionListeners();
    }

    createUserCard(user) {
        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-header">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-info">
                        <h3>${user.name}</h3>
                        <p>${user.email}</p>
                    </div>
                </div>
                <div class="user-details">
                    <p><i class="fas fa-calendar-alt"></i> Joined: ${new Date(user.createdAt).toLocaleDateString()}</p>
                    <p><i class="fas fa-shield-alt"></i> Role: ${user.isAdmin ? 'Admin' : 'User'}</p>
                </div>
                <div class="user-actions">
                    ${!user.isAdmin ? `
                        <button class="btn-primary make-admin">Make Admin</button>
                    ` : user.id !== AuthManager.getCurrentUser().id ? `
                        <button class="btn-danger remove-admin">Remove Admin</button>
                    ` : ''}
                    ${user.id !== AuthManager.getCurrentUser().id ? `
                        <button class="btn-danger delete-user">Delete User</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    initUserActionListeners() {
        // Make admin
        document.querySelectorAll('.make-admin').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.closest('.user-card').dataset.userId;
                this.makeUserAdmin(userId);
            });
        });

        // Remove admin
        document.querySelectorAll('.remove-admin').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.closest('.user-card').dataset.userId;
                this.removeUserAdmin(userId);
            });
        });

        // Delete user
        document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.closest('.user-card').dataset.userId;
                this.deleteUser(userId);
            });
        });
    }

    makeUserAdmin(userId) {
        if (confirm('Are you sure you want to make this user an admin?')) {
            try {
                AuthManager.makeAdmin(userId);
                this.loadUsers();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    removeUserAdmin(userId) {
        if (confirm('Are you sure you want to remove admin privileges from this user?')) {
            try {
                AuthManager.removeAdmin(userId);
                this.loadUsers();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                AuthManager.deleteUser(userId);
                this.loadUsers();
                this.loadDashboardStats();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    filterUsers(searchTerm) {
        const users = AuthManager.getAllUsers();
        const filteredUsers = users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const container = document.querySelector('.users-list');
        container.innerHTML = filteredUsers.map(user => this.createUserCard(user)).join('');
        this.initUserActionListeners();
    }

    exportBookings() {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const users = AuthManager.getAllUsers();

        const csvData = bookings.map(booking => {
            const user = users.find(u => u.id === booking.userId);
            return {
                'Booking ID': booking.id,
                'User Name': user?.name || 'Unknown',
                'User Email': user?.email || 'Unknown',
                'Date': booking.date,
                'Time': booking.time,
                'Session Type': booking.sessionType,
                'Duration': booking.duration,
                'Guests': booking.guests,
                'Location': booking.location,
                'Status': booking.status,
                'Notes': booking.notes || ''
            };
        });

        this.downloadCSV(csvData, 'bookings_export.csv');
    }

    exportUsers() {
        const users = AuthManager.getAllUsers();
        const csvData = users.map(user => ({
            'User ID': user.id,
            'Name': user.name,
            'Email': user.email,
            'Role': user.isAdmin ? 'Admin' : 'User',
            'Created At': user.createdAt
        }));

        this.downloadCSV(csvData, 'users_export.csv');
    }

    downloadCSV(data, filename) {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(header => 
                JSON.stringify(row[header] || '')).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize admin panel when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
}); 