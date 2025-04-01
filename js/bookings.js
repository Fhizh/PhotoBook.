class BookingManager {
    constructor() {
        this.bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        this.form = document.getElementById('photographyBookingForm');
        this.bookingsList = document.querySelector('.bookings-list');
        this.basePrice = 150; // Base price per hour
        this.sessionTypes = {
            'wedding': { minHours: 4, maxHours: 8, priceMultiplier: 1.5 },
            'portrait': { minHours: 1, maxHours: 2, priceMultiplier: 1 },
            'event': { minHours: 2, maxHours: 6, priceMultiplier: 1.2 },
            'family': { minHours: 1, maxHours: 3, priceMultiplier: 1.1 }
        };
    }

    init() {
        if (!this.form || !this.bookingsList) {
            console.error('Required booking elements not found');
            return;
        }

        this.form.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        
        // Add event listeners for form controls
        const sessionTypeSelect = document.getElementById('sessionType');
        const durationInput = document.getElementById('duration');
        const locationSelect = document.getElementById('location');
        
        if (sessionTypeSelect) {
            sessionTypeSelect.addEventListener('change', () => this.updateDurationLimits());
        }
        
        if (durationInput) {
            durationInput.addEventListener('change', () => this.updatePriceSummary());
        }
        
        if (locationSelect) {
            locationSelect.addEventListener('change', () => this.updatePriceSummary());
        }

        this.renderBookings();
        this.updateDashboardStats();
    }

    updateDurationLimits() {
        const sessionType = document.getElementById('sessionType').value;
        const durationInput = document.getElementById('duration');
        const durationHint = document.querySelector('.duration-hint');
        
        if (sessionType && this.sessionTypes[sessionType]) {
            const { minHours, maxHours } = this.sessionTypes[sessionType];
            durationInput.min = minHours;
            durationInput.max = maxHours;
            durationInput.value = minHours;
            durationHint.textContent = `Recommended: ${minHours}-${maxHours} hours for ${sessionType.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
        } else {
            durationInput.min = 1;
            durationInput.max = 8;
            durationInput.value = 1;
            durationHint.textContent = 'Select a session type first';
        }
        
        this.updatePriceSummary();
    }

    updatePriceSummary() {
        const sessionType = document.getElementById('sessionType').value;
        const duration = parseInt(document.getElementById('duration').value);
        const location = document.getElementById('location').value;
        
        let basePrice = this.basePrice;
        let multiplier = sessionType ? this.sessionTypes[sessionType].priceMultiplier : 1;
        
        // Location adjustments
        if (location === 'outdoor') {
            multiplier *= 1.2; // 20% extra for outdoor sessions
        } else if (location === 'client') {
            multiplier *= 1.3; // 30% extra for client location
        }
        
        const hourlyRate = Math.round(basePrice * multiplier);
        const totalPrice = hourlyRate * duration;
        
        // Update price summary
        document.querySelector('.base-price').textContent = `$${hourlyRate}/hour`;
        document.querySelector('.duration-price').textContent = `$${hourlyRate} × ${duration}`;
        document.querySelector('.total-price').textContent = `$${totalPrice}`;
    }

    handleBookingSubmit(e) {
        e.preventDefault();

        // Check if user is logged in
        const user = AuthManager.getCurrentUser();
        if (!user) {
            alert('Please log in to book a session');
            return;
        }

        // Get form data
        const formData = new FormData(this.form);
        const booking = {
            id: Date.now().toString(),
            userId: user.id,
            userEmail: user.email,
            type: formData.get('sessionType'),
            date: formData.get('date'),
            time: formData.get('time'),
            duration: parseInt(formData.get('duration')),
            guests: parseInt(formData.get('guests')),
            location: formData.get('location'),
            notes: formData.get('notes') || '',
            price: parseInt(document.querySelector('.total-price').textContent.replace('$', '')),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Check if all required fields are filled
        if (!booking.type || !booking.date || !booking.time || !booking.duration || !booking.location || !booking.guests) {
            return; // Just return without showing any error message
        }

        // Validate session type and duration
        if (booking.type && this.sessionTypes[booking.type]) {
            const { minHours, maxHours } = this.sessionTypes[booking.type];
            if (booking.duration < minHours || booking.duration > maxHours) {
                return; // Just return without showing any error message
            }
        }

        // Add booking
        this.bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(this.bookings));

        // Reset form and update UI
        this.form.reset();
        
        // Update bookings list and stats
        this.renderBookings();
        this.updateDashboardStats();

        // Show detailed success message
        this.showBookingSuccess(booking);
    }

    showBookingSuccess(booking) {
        // Create and show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h3>Booking Successfully Confirmed!</h3>
                <p>Great! Your ${booking.type} session has been scheduled.</p>
                <div class="booking-confirmation">
                    <p><i class="fas fa-calendar"></i> ${new Date(booking.date).toLocaleDateString('default', { 
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                    <p><i class="fas fa-clock"></i> ${booking.time} (${booking.duration} hour${booking.duration > 1 ? 's' : ''})</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${booking.location}</p>
                    <p><i class="fas fa-users"></i> ${booking.guests} people</p>
                    <p><i class="fas fa-dollar-sign"></i> Total: $${booking.price}</p>
                    ${booking.notes ? `
                        <p><i class="fas fa-sticky-note"></i> Notes: ${booking.notes}</p>
                    ` : ''}
                </div>
                <p class="confirmation-note">A confirmation email will be sent to ${booking.userEmail}</p>
                <button onclick="this.parentElement.parentElement.remove(); showSection('bookings');" class="btn-primary">
                    View My Bookings
                </button>
            </div>
        `;
        document.body.appendChild(successMessage);
    }

    renderBookings() {
        if (!this.bookingsList) return;

        const user = AuthManager.getCurrentUser();
        if (!user) return;

        // Filter user's bookings and sort by date
        const userBookings = this.bookings
            .filter(booking => booking.userId === user.id)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (userBookings.length === 0) {
            this.bookingsList.innerHTML = `
                <p class="no-bookings">
                    <i class="fas fa-calendar-plus"></i>
                    <br>
                    No bookings found
                    <br>
                    <button onclick="showSection('calendar')" class="btn-primary" style="margin-top: 1rem;">
                        Book Your First Session
                    </button>
                </p>
            `;
            return;
        }

        // Group bookings by status
        const upcoming = userBookings.filter(b => new Date(b.date) > new Date() && b.status === 'pending');
        const past = userBookings.filter(b => new Date(b.date) <= new Date() || b.status === 'cancelled');

        this.bookingsList.innerHTML = `
            ${upcoming.length ? `
                <h3 class="bookings-section-title">Upcoming Sessions</h3>
                <div class="bookings-grid">
                    ${this.renderBookingCards(upcoming)}
                </div>
            ` : ''}
            
            ${past.length ? `
                <div class="bookings-grid">
                    ${this.renderBookingCards(past)}
                </div>
            ` : ''}
        `;
    }

    renderBookingCards(bookings) {
        // Group bookings by month
        const groupedBookings = bookings.reduce((groups, booking) => {
            const date = new Date(booking.date);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(booking);
            return groups;
        }, {});

        // Sort bookings within each month by date and time
        Object.values(groupedBookings).forEach(monthBookings => {
            monthBookings.sort((a, b) => {
                const dateA = new Date(a.date + ' ' + a.time);
                const dateB = new Date(b.date + ' ' + b.time);
                return dateA - dateB;
            });
        });

        // Generate HTML for each month's bookings
        return Object.entries(groupedBookings).map(([monthYear, monthBookings]) => `
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

    cancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) return;

        this.bookings[bookingIndex].status = 'cancelled';
        localStorage.setItem('bookings', JSON.stringify(this.bookings));
        
        this.renderBookings();
        this.updateDashboardStats();
    }

    updateDashboardStats() {
        const user = AuthManager.getCurrentUser();
        if (!user) return;

        const userBookings = this.bookings.filter(booking => booking.userId === user.id);
        const now = new Date();

        // Calculate stats
        const upcomingBookings = userBookings.filter(booking => 
            booking.status === 'pending' && new Date(booking.date) > now
        );
        
        const pastBookings = userBookings.filter(booking => 
            new Date(booking.date) < now || booking.status === 'cancelled'
        );

        const totalHours = userBookings
            .filter(booking => booking.status === 'pending')
            .reduce((total, booking) => total + booking.duration, 0);

        // Update dashboard
        document.querySelector('.upcoming-sessions').textContent = upcomingBookings.length;
        document.querySelector('.past-sessions').textContent = pastBookings.length;
        document.querySelector('.total-hours').textContent = totalHours;
    }
}

// Helper functions for duration control
window.incrementDuration = function() {
    const input = document.getElementById('duration');
    const max = parseInt(input.max);
    const current = parseInt(input.value);
    if (current < max) {
        input.value = current + 1;
        bookingManager.updatePriceSummary();
    }
};

window.decrementDuration = function() {
    const input = document.getElementById('duration');
    const min = parseInt(input.min);
    const current = parseInt(input.value);
    if (current > min) {
        input.value = current - 1;
        bookingManager.updatePriceSummary();
    }
};

// Initialize booking manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookingManager = new BookingManager();
    bookingManager.init();
}); 