class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
    }

    init() {
        this.calendarGrid = document.getElementById('calendarGrid');
        this.timeSlotsContainer = document.querySelector('.time-slots-container');
        this.timeSlots = document.querySelector('.time-slots');
        this.monthDisplay = document.querySelector('.current-month');

        if (!this.calendarGrid || !this.timeSlotsContainer || !this.timeSlots || !this.monthDisplay) {
            console.error('Required calendar elements not found');
            return;
        }

        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        this.render();
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month display
        this.monthDisplay.textContent = `${this.monthNames[month]} ${year}`;

        // Clear previous calendar
        this.calendarGrid.innerHTML = '';

        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day header';
            dayHeader.textContent = day;
            this.calendarGrid.appendChild(dayHeader);
        });

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        // Add empty cells for days before first of month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            this.calendarGrid.appendChild(emptyDay);
        }

        // Add days of month
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const date = new Date(year, month, day);
            
            // Check if this is today's date
            if (date.getDate() === today.getDate() && 
                date.getMonth() === today.getMonth() && 
                date.getFullYear() === today.getFullYear()) {
                dayElement.classList.add('today');
            }

            // Check if this is the selected date
            if (this.selectedDate && 
                date.getDate() === this.selectedDate.getDate() && 
                date.getMonth() === this.selectedDate.getMonth() && 
                date.getFullYear() === this.selectedDate.getFullYear()) {
                dayElement.classList.add('selected');
            }

            // Disable past dates
            if (date < new Date().setHours(0, 0, 0, 0)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => this.selectDate(date));
            }

            this.calendarGrid.appendChild(dayElement);
        }
    }

    selectDate(date) {
        // Remove previous selection
        const previousSelected = this.calendarGrid.querySelector('.calendar-day.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Add selection to new date
        const selectedDay = Array.from(this.calendarGrid.children)
            .find(day => !day.classList.contains('header') && 
                        !day.classList.contains('empty') && 
                        parseInt(day.textContent) === date.getDate());
        
        if (selectedDay) {
            selectedDay.classList.add('selected');
            this.selectedDate = date;
            
            // Update booking form date
            const dateInput = document.querySelector('input[name="date"]');
            if (dateInput) {
                dateInput.value = date.toISOString().split('T')[0];
            }

            this.renderTimeSlots();
        }
    }

    renderTimeSlots() {
        if (!this.selectedDate) {
            this.timeSlotsContainer.classList.add('hidden');
            return;
        }

        this.timeSlotsContainer.classList.remove('hidden');
        this.timeSlots.innerHTML = '';

        // Generate time slots from 9 AM to 5 PM
        for (let hour = 9; hour <= 17; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            
            const time = `${hour.toString().padStart(2, '0')}:00`;
            timeSlot.textContent = time;

            // Check if this time slot is already booked
            const isBooked = this.isTimeSlotBooked(this.selectedDate, time);
            if (isBooked) {
                timeSlot.classList.add('disabled');
            } else {
                timeSlot.addEventListener('click', () => this.selectTimeSlot(time));
            }

            if (this.selectedTimeSlot === time) {
                timeSlot.classList.add('selected');
            }

            this.timeSlots.appendChild(timeSlot);
        }
    }

    selectTimeSlot(time) {
        // Remove previous selection
        const previousSelected = this.timeSlots.querySelector('.time-slot.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Add selection to new time slot
        const selectedSlot = Array.from(this.timeSlots.children)
            .find(slot => slot.textContent === time);
        
        if (selectedSlot) {
            selectedSlot.classList.add('selected');
            this.selectedTimeSlot = time;
            
            // Update booking form time
            const timeInput = document.querySelector('input[name="time"]');
            if (timeInput) {
                timeInput.value = time;
            }
        }
    }

    isTimeSlotBooked(date, time) {
        // Get bookings from local storage
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        
        // Check if there's a booking for this date and time
        return bookings.some(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate.getDate() === date.getDate() &&
                   bookingDate.getMonth() === date.getMonth() &&
                   bookingDate.getFullYear() === date.getFullYear() &&
                   booking.time === time;
        });
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calendar = new Calendar();
    calendar.init();
}); 