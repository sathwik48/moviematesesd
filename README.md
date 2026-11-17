# MOVIEMATE — Movie Ticket Booking

MOVIEMATE is a movie ticket booking demo built with Node.js, Express, and a responsive browser-based frontend. It includes a featured movie carousel, movie discovery, account registration and login, seat selection, demo checkout, and booking tickets.

## Features

- **Featured movie carousel:** Shows one movie at a time, starts with Ramayana, and advances every 5.5 seconds. Use the arrows or dots to navigate; autoplay pauses while the carousel is hovered or focused.
- **Movie catalogue:** Browse, search, and filter movies by genre, language, and release status.
- **Accounts:** Register and sign in to manage bookings.
- **Booking flow:** Select a movie, city, cinema, date, showtime, and seats. Seat availability is checked before booking.
- **Snacks and checkout:** Add snacks, apply available demo coupons, redeem loyalty points, and complete the simulated payment flow.
- **Tickets and bookings:** View booking confirmations and ticket QR codes, review past bookings, and cancel eligible bookings.
- **Admin tools:** Manage movies and view bookings with an account that has the `admin` role.
- **JSON data files:** Movie, user, and booking records are stored in the `data` directory.

The featured carousel uses the existing movie records in `data/movies.json`. Its order is Ramayana, DNK, Jayanth & the Jingo Pen, Chandrayan, Scene, followed by the other available movies. Missing movie metadata is shown as “Not Available.”

## Requirements

- Node.js 18 or later
- npm

No separate database installation is required.

## Run locally

From the project directory:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For development with Node's file watcher:

```bash
npm run dev
```

The server uses port `3000` by default. Set the `PORT` environment variable to use another port. For example, in PowerShell:

```powershell
$env:PORT = 3001
npm start
```

## Main pages

| Page | Path |
| --- | --- |
| Home and featured carousel | `/` |
| Movie catalogue | `/movies.html` |
| Booking and seat selection | `/booking.html` |
| Snacks | `/snacks.html` |
| Demo payment | `/payment.html` |
| My bookings | `/mybookings.html` |
| Sign in / registration | `/login.html` and `/register.html` |
| Admin | `/admin.html` |

## Project layout

```text
.
├── data/                 JSON movie, user, and booking records
├── public/
│   ├── css/style.css     Shared styles
│   ├── images/posters/   Movie poster artwork
│   ├── js/               Frontend page scripts
│   └── *.html            Website pages
├── package.json
└── server.js             Express server and API
```

## Data and demo notes

- The movie catalogue is served from `GET /api/movies`.
- Movie posters are stored under `public/images/posters/`.
- New users and bookings are written to `data/users.json` and `data/bookings.json`.
- The payment flow is simulated; it does not charge a real payment method.
- The app uses JSON-file storage and the default in-memory Express session store. It is intended for local demos and coursework, not production deployment without replacing those storage and session components and configuring a persistent `SESSION_SECRET`.

## Useful API routes

- `GET /api/movies` — list movies; supports search and filter query parameters.
- `GET /api/cities`, `GET /api/cinemas`, `GET /api/showtimes` — booking options.
- `GET /api/availability` — booked seats for a selected show.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` — account actions.
- `POST /api/bookings/checkout`, `GET /api/bookings/mine` — create and list bookings.
- `/api/admin/*` — admin-only movie and booking operations.