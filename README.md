# MOVIEMATE Movie Ticket Booking

A responsive movie-booking demo built with HTML, CSS, browser JavaScript, Node.js, Express, and local JSON files. It includes account registration, a hashed-password login, live seat availability, demo checkout, printable tickets, booking cancellation, and an admin movie catalogue.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

Open the project folder in VS Code, then run these commands in its terminal:

```powershell
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). For automatic server restarts while editing, use `npm run dev`.

The server creates the demo administrator account on first startup:

- Email: `admin@cinema.local`
- Password: `Admin123!`

Register a regular account to make customer bookings. Passwords are hashed with bcrypt before they are stored. Sessions use an HTTP-only cookie. Set `SESSION_SECRET` to a long, random value when running outside a local demo; set `PORT` to change the default port.

## Project structure

```text
movie-ticket-booking/
├── data/
│   ├── bookings.json
│   ├── movies.json
│   └── users.json
├── public/
│   ├── css/style.css
│   ├── js/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── booking.js
│   │   ├── confirmation.js
│   │   ├── main.js
│   │   ├── movies.js
│   │   ├── mybookings.js
│   │   └── payment.js
│   ├── admin.html
│   ├── booking.html
│   ├── confirmation.html
│   ├── index.html
│   ├── login.html
│   ├── movies.html
│   ├── mybookings.html
│   ├── payment.html
│   └── register.html
├── package.json
└── server.js
```

## How it works

- The Express API serves the static pages and reads/writes movies, user accounts, and bookings in `data/*.json`.
- The sample catalogue is a snapshot of movies listed as now showing in Warangal; poster files are stored in `public/images/posters/`. These entries are limited to Warangal cinemas for booking. Refresh the catalogue as local listings change.
- The home page features the nine current Warangal movies, starting with Ramayana, then DNK, Jayanth & the Jingo Pen, Chandrayan, and Scene. Movie details and the poster change together every 5.5 seconds; arrows, dots, and hover pause are available. Booking opens the selected movie's existing booking flow, while View Details jumps to its listing card. Missing catalogue fields display as Not Available.
- Movie listings support text search and genre, language, and release filters. Cinemas and showtimes are supplied by the API.
- A booking draft is held in the browser's session storage while the customer selects seats and reaches checkout. The server independently checks the date, movie, cinema, showtime, seat format, payment method, and current seat availability at checkout.
- Seat selection and booking writes are serialized on the server to prevent concurrent checkouts from selling the same seats. Prices are in Indian rupees (INR) and come from the server's cinema list, not the browser.
- The payment methods are demo-only. Confirmed tickets have a unique booking ID and can be printed from the confirmation page.
- Customers can see and cancel their bookings. Cancelled seats become available again. Admins can add, edit, and delete movies and view all bookings.

This is a local learning project, not a production payment service. The default Express in-memory session store and JSON-file persistence are intended for a single-process demo, not a multi-instance deployment. Font Awesome and Google Fonts are loaded from their public CDNs; movie imagery uses remote image URLs.
