# Photography Booking System

A web-based booking system for photographers to manage client appointments. Built with HTML, CSS, and JavaScript, this system runs entirely on the client-side and uses localStorage for data persistence.

## Features

### Client Side
- Interactive calendar-based booking system
- Time slot selection with automatic availability checking
- Client details form with validation
- View and manage personal bookings
- Cancel pending bookings
- Responsive design for all devices
- Keyboard navigation support
- Animated notifications for actions

### Admin Side
- Complete overview of all bookings
- Filter bookings by status and date
- Approve or reject booking requests
- Delete any booking
- Export all bookings as JSON
- Sort bookings by date and time

## Setup

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. No additional setup required - the system works out of the box!

## Usage

### For Clients
1. Select a date from the calendar
2. Choose an available time slot
3. Fill in your details in the booking form
4. Submit the booking
5. View your bookings in the "My Bookings" section
6. Cancel bookings if needed (only pending bookings can be cancelled)

### For Administrators
1. Click "Admin Panel" in the navigation
2. View all bookings in the system
3. Use filters to find specific bookings:
   - Filter by status (pending/approved/rejected)
   - Filter by date
4. Manage bookings:
   - Approve or reject pending bookings
   - Delete any booking
   - Export all bookings data
5. Return to client view by clicking "Client Booking"

## Technical Details

- Built with vanilla JavaScript (no frameworks)
- Uses CSS Grid and Flexbox for layouts
- Responsive design with mobile-first approach
- Data stored in browser's localStorage
- Modular JavaScript architecture with separate concerns:
  - `calendar.js`: Calendar and time slot management
  - `bookings.js`: Booking data management
  - `admin.js`: Admin panel functionality
  - `app.js`: Application initialization and shared utilities

## Browser Support

Supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Customization

The system can be easily customized by modifying:
- CSS variables in `style.css` for colors and themes
- Time slots in `calendar.js`
- Session types in `index.html`
- Booking form fields in `index.html`

## Security Notes

- This is a client-side only application
- All data is stored in localStorage
- For production use, consider adding:
  - Server-side validation
  - User authentication
  - Database storage
  - Data encryption

## License

MIT License - feel free to use this project for any purpose. 