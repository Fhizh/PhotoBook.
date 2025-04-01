// Dashboard initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!AuthManager.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    // Show/hide admin link based on user role
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        if (AuthManager.isAdmin()) {
            adminLink.classList.remove('hidden');
        } else {
            adminLink.classList.add('hidden');
        }
    }

    // Initialize booking manager
    bookingManager.init();

    // Set user information
    const currentUser = AuthManager.getCurrentUser();
    const userEmailElement = document.querySelector('.user-email');
    const userNameElement = document.querySelector('.user-name');
    if (userEmailElement) {
        userEmailElement.textContent = currentUser.email;
    }
    if (userNameElement) {
        userNameElement.textContent = currentUser.name || currentUser.email;
    }

    // Initialize profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');

        if (profileName) profileName.value = currentUser.name || '';
        if (profileEmail) profileEmail.value = currentUser.email || '';
        if (profilePhone) profilePhone.value = currentUser.phone || '';

        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateProfile();
        });
    }

    // Initialize booking filters with default values
    const statusFilter = document.getElementById('bookingStatusFilter');
    const dateFilter = document.getElementById('bookingDateFilter');
    
    if (statusFilter) {
        statusFilter.value = 'pending'; // Set default to pending (upcoming)
        statusFilter.addEventListener('change', () => {
            filterBookings();
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            filterBookings();
        });
    }

    // Initialize booking tabs
    const bookingTabs = document.querySelectorAll('.booking-tab');
    bookingTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            bookingTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update status filter to match tab
            if (statusFilter) {
                statusFilter.value = tab.dataset.status;
                filterBookings();
            }
        });
    });

    // Set the "Upcoming" tab as active by default
    const upcomingTab = document.querySelector('.booking-tab[data-status="pending"]');
    if (upcomingTab) {
        upcomingTab.classList.add('active');
    }

    // Section navigation
    const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').slice(1);
            showSection(targetId);
        });
    });

    // Quick action cards navigation
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetSection = card.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(targetSection);
        });
    });

    // Show default section (home)
    showSection('home');

    // Initialize dashboard stats
    updateDashboardStats();

    // Trigger initial filtering to show upcoming bookings
    filterBookings();
});

// Function to show specific section and hide others
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }

    // Update active navigation link
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Make showSection available globally
window.showSection = showSection;

// Update profile
function updateProfile() {
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();

    if (AuthManager.updateProfile({ name, phone })) {
        showSuccessMessage('Profile updated successfully!');
    } else {
        showErrorMessage('Failed to update profile');
    }
}

// Add success message functionality
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => {
            successDiv.remove();
        }, 300);
    }, 3000);
}

// Add error message functionality
function showErrorMessage(message) {
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
            errorDiv.remove();
        }, 300);
    }, 3000);
}

// Update dashboard statistics
function updateDashboardStats() {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) return;

    const now = new Date();

    // Filter user's bookings
    const userBookings = bookings.filter(booking => booking.userId === currentUser.id);

    // Calculate statistics
    const upcomingSessions = userBookings.filter(booking => 
        booking.status === 'pending' && new Date(booking.date) > now
    ).length;
    
    const pastSessions = userBookings.filter(booking => 
        new Date(booking.date) < now || booking.status === 'cancelled'
    ).length;
    
    const totalHours = userBookings
        .filter(booking => booking.status === 'pending')
        .reduce((total, booking) => total + (booking.duration || 1), 0);

    // Update statistics display
    const upcomingElement = document.querySelector('.upcoming-sessions');
    const pastElement = document.querySelector('.past-sessions');
    const hoursElement = document.querySelector('.total-hours');

    if (upcomingElement) upcomingElement.textContent = upcomingSessions;
    if (pastElement) pastElement.textContent = pastSessions;
    if (hoursElement) hoursElement.textContent = totalHours;

    // Update booking counts in tabs
    updateBookingCounts(userBookings);
}

// Update booking counts in tabs
function updateBookingCounts(userBookings) {
    const now = new Date();
    
    const counts = {
        pending: userBookings.filter(booking => 
            booking.status === 'pending' && new Date(booking.date) > now
        ).length,
        completed: userBookings.filter(booking => 
            booking.status === 'completed' || new Date(booking.date) < now
        ).length,
        cancelled: userBookings.filter(booking => 
            booking.status === 'cancelled'
        ).length
    };

    // Update count displays
    document.querySelector('.upcoming-count').textContent = counts.pending;
    document.querySelector('.completed-count').textContent = counts.completed;
    document.querySelector('.cancelled-count').textContent = counts.cancelled;
}

// Filter bookings based on selected status and date order
function filterBookings() {
    const statusFilter = document.getElementById('bookingStatusFilter').value;
    const dateFilter = document.getElementById('bookingDateFilter').value;
    const bookingsList = document.querySelector('.bookings-list');
    const noBookingsMessage = document.querySelector('.no-bookings');
    
    // Get current user's bookings
    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) return;
    
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    let userBookings = bookings.filter(booking => booking.userId === currentUser.id);
    const now = new Date();

    // Filter by status
    if (statusFilter !== 'all') {
        userBookings = userBookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            if (statusFilter === 'pending') {
                // Only show pending bookings that are in the future and not cancelled
                return booking.status === 'pending' && bookingDate > now;
            } else if (statusFilter === 'completed') {
                // Show completed bookings or past pending bookings
                return booking.status === 'completed' || 
                       (booking.status === 'pending' && bookingDate < now);
            } else if (statusFilter === 'cancelled') {
                // Only show cancelled bookings
                return booking.status === 'cancelled';
            }
            return false;
        });
    } else {
        // For "all" status, sort bookings into categories
        userBookings = userBookings.map(booking => {
            const bookingDate = new Date(booking.date);
            if (booking.status === 'cancelled') {
                return { ...booking, displayStatus: 'cancelled' };
            } else if (booking.status === 'completed') {
                return { ...booking, displayStatus: 'completed' };
            } else if (booking.status === 'pending') {
                if (bookingDate > now) {
                    return { ...booking, displayStatus: 'upcoming' };
                } else {
                    return { ...booking, displayStatus: 'completed' };
                }
            }
            return booking;
        });
    }

    // Sort by date
    userBookings.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Show/hide no bookings message
    if (userBookings.length === 0) {
        if (bookingsList) bookingsList.innerHTML = '';
        if (noBookingsMessage) {
            noBookingsMessage.classList.remove('hidden');
            noBookingsMessage.querySelector('p').textContent = 
                `No ${statusFilter === 'all' ? '' : statusFilter} bookings found.`;
        }
        return;
    }

    // Hide no bookings message and show filtered bookings
    if (noBookingsMessage) noBookingsMessage.classList.add('hidden');
    if (bookingsList) {
        // Group bookings by status first (for "all" view)
        let groupedContent = '';
        
        if (statusFilter === 'all') {
            // Group by status first, then by month
            const statusGroups = {
                upcoming: userBookings.filter(b => b.displayStatus === 'upcoming'),
                completed: userBookings.filter(b => b.displayStatus === 'completed'),
                cancelled: userBookings.filter(b => b.displayStatus === 'cancelled')
            };

            // Generate content for each status group
            if (statusGroups.upcoming.length > 0) {
                groupedContent += `<div class="status-group">
                    <h3 class="status-header">Upcoming Sessions</h3>
                    ${generateMonthGroups(statusGroups.upcoming)}
                </div>`;
            }

            if (statusGroups.completed.length > 0) {
                groupedContent += `<div class="status-group">
                    <h3 class="status-header">Completed Sessions</h3>
                    ${generateMonthGroups(statusGroups.completed)}
                </div>`;
            }

            if (statusGroups.cancelled.length > 0) {
                groupedContent += `<div class="status-group">
                    <h3 class="status-header">Cancelled Sessions</h3>
                    ${generateMonthGroups(statusGroups.cancelled)}
                </div>`;
            }

            bookingsList.innerHTML = groupedContent;
        } else {
            // Regular month grouping for filtered views
            bookingsList.innerHTML = generateMonthGroups(userBookings);
        }
    }

    // Update booking counts
    updateBookingCounts(userBookings);
}

// Helper function to generate month groups HTML
function generateMonthGroups(bookings) {
    const groupedBookings = bookings.reduce((groups, booking) => {
        const date = new Date(booking.date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }
        groups[monthYear].push(booking);
        return groups;
    }, {});

    return Object.entries(groupedBookings)
        .map(([monthYear, monthBookings]) => `
            <div class="month-group">
                <h4 class="month-header">${monthYear}</h4>
                <div class="month-bookings">
                    ${monthBookings.map(booking => `
                        <div class="booking-card ${booking.status}">
                            <div class="booking-header">
                                <div class="booking-type">
                                    <i class="fas fa-camera"></i>
                                    <h3>${booking.type}</h3>
                                </div>
                                <span class="booking-status">${booking.status}</span>
                            </div>
                            <div class="booking-details">
                                <div class="booking-main-info">
                                    <p class="booking-date">
                                        <i class="fas fa-calendar"></i>
                                        ${new Date(booking.date).toLocaleDateString('default', { 
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p class="booking-time">
                                        <i class="fas fa-clock"></i>
                                        ${booking.time} (${booking.duration} hour${booking.duration > 1 ? 's' : ''})
                                    </p>
                                </div>
                                <div class="booking-secondary-info">
                                    <p><i class="fas fa-users"></i> ${booking.guests} people</p>
                                    <p><i class="fas fa-map-marker-alt"></i> ${booking.location}</p>
                                    <p><i class="fas fa-dollar-sign"></i> $${booking.price}</p>
                                </div>
                                ${booking.notes ? `
                                    <div class="booking-notes">
                                        <p><i class="fas fa-sticky-note"></i> ${booking.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                            ${booking.status === 'pending' && new Date(booking.date) > new Date() ? `
                                <div class="booking-actions">
                                    <button onclick="bookingManager.cancelBooking('${booking.id}')" class="btn-secondary">
                                        <i class="fas fa-times"></i> Cancel Booking
                                    </button>
                                    <button onclick="showSection('calendar')" class="btn-primary">
                                        <i class="fas fa-plus"></i> Book Another
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
}

// Initialize booking manager
const bookingManager = new BookingManager();

// Add CSS for messages
const style = document.createElement('style');
style.textContent = `
    .success-message, .error-message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        z-index: 1000;
    }
    
    .success-message {
        background-color: #4CAF50;
    }
    
    .error-message {
        background-color: #f44336;
    }
    
    .success-message.show, .error-message.show {
        opacity: 1;
        transform: translateX(0);
    }

    .hidden {
        display: none;
    }

    .nav-links a.active {
        color: var(--primary-color);
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// Make functions globally available
window.showSuccessMessage = showSuccessMessage;
window.showErrorMessage = showErrorMessage;
window.updateDashboardStats = updateDashboardStats;
window.filterBookings = filterBookings;
window.bookingManager = bookingManager; // Make bookingManager globally available