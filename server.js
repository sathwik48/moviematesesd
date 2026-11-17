const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");
const CITIES = ["Warangal", "Hyderabad", "Bengaluru", "Chennai", "Mumbai", "Delhi"];
const CINEMAS = [
  { id: "pvr-warangal", city: "Warangal", name: "PVR Cinemas", address: "Hanamkonda, Warangal", facilities: ["Dolby Atmos", "Parking", "Luxury Lounge"], price: 260 },
  { id: "asian-sridevi-mall", city: "Warangal", name: "Asian Sridevi Mall", address: "Kazipet Road, Warangal", facilities: ["IMAX", "Parking", "Café"], price: 220 },
  { id: "kakatiya-theatre", city: "Warangal", name: "Kakatiya Theatre", address: "Station Road, Warangal", facilities: ["3D", "Air Conditioning", "Snack Bar"], price: 200 },
  { id: "gemini-theatre", city: "Warangal", name: "Gemini Theatre", address: "M G Road, Warangal", facilities: ["Recliner", "Parking", "Accessibility"], price: 240 },
  { id: "pvr-hyderabad", city: "Hyderabad", name: "PVR Cinemas", address: "Banjara Hills, Hyderabad", facilities: ["Dolby Atmos", "Premium Seating", "Parking"], price: 280 },
  { id: "inox-hyderabad", city: "Hyderabad", name: "INOX", address: "Madhapur, Hyderabad", facilities: ["4K Projection", "Luxury Seats", "Food Court"], price: 260 },
  { id: "amb-cinemas", city: "Hyderabad", name: "AMB Cinemas", address: "Gachibowli, Hyderabad", facilities: ["VIP Lounge", "Parking", "Snack Bar"], price: 240 },
  { id: "cinepolis-hyderabad", city: "Hyderabad", name: "Cinepolis", address: "Kukatpally, Hyderabad", facilities: ["Dolby 7.1", "Parking", "Family Seats"], price: 250 },
  { id: "pvr-bengaluru", city: "Bengaluru", name: "PVR Cinemas", address: "Koramangala, Bengaluru", facilities: ["IMAX", "Parking", "All Access"], price: 310 },
  { id: "inox-bengaluru", city: "Bengaluru", name: "INOX", address: "Indiranagar, Bengaluru", facilities: ["4K", "Luxury Seats", "Lounge"], price: 290 },
  { id: "pvr-chennai", city: "Chennai", name: "PVR Cinemas", address: "Anna Nagar, Chennai", facilities: ["Dolby Atmos", "Parking", "Premium Seating"], price: 300 },
  { id: "mayajaal-chennai", city: "Chennai", name: "Mayajaal Multiplex", address: "Thoraipakkam, Chennai", facilities: ["VIP", "Parking", "Café"], price: 280 },
  { id: "pvr-mumbai", city: "Mumbai", name: "PVR Cinemas", address: "Andheri West, Mumbai", facilities: ["4DX", "Parking", "Luxury Lounge"], price: 340 },
  { id: "inox-mumbai", city: "Mumbai", name: "INOX", address: "Lower Parel, Mumbai", facilities: ["Dolby Atmos", "Premium Seats", "Food Court"], price: 320 },
  { id: "delhi-cineplex", city: "Delhi", name: "Delhi Cineplex", address: "Dwarka, Delhi", facilities: ["4K", "Parking", "Luxury Recliner"], price: 290 },
  { id: "pvr-delhi", city: "Delhi", name: "PVR Cinemas", address: "Saket, Delhi", facilities: ["IMAX", "Parking", "Accessibility"], price: 330 }
];
const SHOW_TIMES = ["10:00", "13:30", "16:45", "19:30", "22:15"];
const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const SEATS_PER_ROW = 10;
const BANK_NAMES = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"];
const FOOD_ITEMS = [
  { id: "regular-tea", category: "TEA AND COFFEE", name: "Regular Tea", price: 20 },
  { id: "ginger-tea", category: "TEA AND COFFEE", name: "Ginger Tea", price: 30 },
  { id: "coffee", category: "TEA AND COFFEE", name: "Coffee", price: 40 },
  { id: "cold-coffee", category: "TEA AND COFFEE", name: "Cold Coffee", price: 90 },
  { id: "small-popcorn", category: "POPCORN", name: "Small Popcorn", price: 80 },
  { id: "medium-popcorn", category: "POPCORN", name: "Medium Popcorn", price: 120 },
  { id: "large-popcorn", category: "POPCORN", name: "Large Popcorn", price: 180 },
  { id: "cheese-popcorn", category: "POPCORN", name: "Cheese Popcorn", price: 150 },
  { id: "caramel-popcorn", category: "POPCORN", name: "Caramel Popcorn", price: 170 },
  { id: "french-fries", category: "SNACKS", name: "French Fries", price: 100 },
  { id: "veg-burger", category: "SNACKS", name: "Veg Burger", price: 120 },
  { id: "sandwich", category: "SNACKS", name: "Sandwich", price: 100 },
  { id: "pizza", category: "SNACKS", name: "Pizza", price: 180 },
  { id: "samosa", category: "SNACKS", name: "Samosa", price: 40 },
  { id: "nachos", category: "SNACKS", name: "Nachos", price: 130 },
  { id: "orange-juice", category: "JUICES AND DRINKS", name: "Orange Juice", price: 80 },
  { id: "apple-juice", category: "JUICES AND DRINKS", name: "Apple Juice", price: 90 },
  { id: "mango-juice", category: "JUICES AND DRINKS", name: "Mango Juice", price: 80 },
  { id: "sprite", category: "JUICES AND DRINKS", name: "Sprite", price: 60 },
  { id: "coke", category: "JUICES AND DRINKS", name: "Coke", price: 60 },
  { id: "water-bottle", category: "JUICES AND DRINKS", name: "Water Bottle", price: 30 }
];

async function readJson(filename) {
  return JSON.parse(await fs.readFile(path.join(DATA_DIR, filename), "utf8"));
}

async function writeJson(filename, value) {
  const destination = path.join(DATA_DIR, filename);
  const temporary = `${destination}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(temporary, destination);
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const lastDate = new Date(today);
  lastDate.setUTCDate(lastDate.getUTCDate() + 60);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value &&
    date >= today && date <= lastDate;
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Please log in to continue." });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Administrator access is required." });
  }
  next();
}

function validMovie(movie) {
  return movie && typeof movie.title === "string" && movie.title.trim().length > 0 &&
    (movie.genre === null || typeof movie.genre === "string") &&
    typeof movie.language === "string" && movie.language.trim().length > 0 &&
    (movie.city == null || movie.city === "" || CITIES.includes(movie.city)) &&
    (movie.duration === "" || movie.duration == null ||
      Number.isInteger(Number(movie.duration)) && Number(movie.duration) > 0) &&
    (movie.rating === "" || movie.rating == null ||
      Number.isFinite(Number(movie.rating)) && Number(movie.rating) >= 0 && Number(movie.rating) <= 10) &&
    ["now", "upcoming"].includes(movie.releaseType) &&
    typeof movie.description === "string" && movie.description.trim().length > 0 &&
    typeof movie.poster === "string" &&
    (/^https?:\/\//i.test(movie.poster) || /^\/images\/posters\/[a-z0-9-]+\.svg$/i.test(movie.poster));
}

function normalizedMovie(movie, id) {
  return {
    ...movie,
    id,
    genre: typeof movie.genre === "string" && movie.genre.trim() ? movie.genre.trim() : null,
    city: typeof movie.city === "string" && CITIES.includes(movie.city) ? movie.city : null,
    duration: movie.duration === "" || movie.duration == null ? null : Number(movie.duration),
    rating: movie.rating === "" || movie.rating == null ? null : Number(movie.rating)
  };
}

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(session({
  name: "cinema.sid",
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }
}));

app.get("/api/movies", async (req, res, next) => {
  try {
    let movies = await readJson("movies.json");
    const { search, genre, language, releaseType } = req.query;
    if (search) {
      const term = String(search).trim().toLowerCase();
      movies = movies.filter(movie => `${movie.title} ${movie.genre || ""} ${movie.language}`.toLowerCase().includes(term));
    }
    if (genre) movies = movies.filter(movie => movie.genre && movie.genre.toLowerCase() === String(genre).toLowerCase());
    if (language) movies = movies.filter(movie => movie.language.toLowerCase() === String(language).toLowerCase());
    if (releaseType) movies = movies.filter(movie => movie.releaseType === releaseType);
    res.json(movies);
  } catch (error) { next(error); }
});

app.get("/api/cities", (req, res) => res.json(CITIES));
app.get("/api/cinemas", (req, res) => {
  const { city } = req.query;
  const list = city ? CINEMAS.filter(cinema => cinema.city === city) : CINEMAS;
  res.json(list);
});
app.get("/api/showtimes", (req, res) => res.json(SHOW_TIMES));
app.get("/api/food-items", (req, res) => res.json(FOOD_ITEMS));

app.get("/api/availability", async (req, res, next) => {
  try {
    const { movieId, cinemaId, date, time } = req.query;
    const cinema = CINEMAS.find(item => item.id === cinemaId);
    if (!movieId || !cinema ||
      !validDate(date) || !SHOW_TIMES.includes(time)) {
      return res.status(400).json({ error: "Choose a valid movie, cinema, date and show time." });
    }
    const movie = (await readJson("movies.json")).find(item => item.id === movieId && item.releaseType === "now");
    if (!movie || (movie.city && movie.city !== cinema.city)) {
      return res.status(400).json({ error: "This movie is not showing at the selected cinema." });
    }
    const bookings = await readJson("bookings.json");
    const booked = bookings.filter(booking => booking.movieId === movieId &&
      booking.cinemaId === cinemaId && booking.date === date && booking.time === time &&
      booking.status === "confirmed").flatMap(booking => booking.seats);
    res.json({ bookedSeats: [...new Set(booked)] });
  } catch (error) { next(error); }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (name.length < 2 || name.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: "Enter a name, valid email and password of 8–72 characters." });
    }
    const users = await readJson("users.json");
    if (users.some(user => user.email === email)) return res.status(409).json({ error: "An account with this email already exists." });
    const user = { id: crypto.randomUUID(), name, email, passwordHash: await bcrypt.hash(password, 12), role: "user" };
    users.push(user);
    await writeJson("users.json", users);
    req.session.user = publicUser(user);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const users = await readJson("users.json");
    const user = users.find(item => item.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    req.session.regenerate(error => {
      if (error) return next(error);
      req.session.user = publicUser(user);
      res.json({ user: publicUser(user) });
    });
  } catch (error) { next(error); }
});

app.post("/api/auth/logout", (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie("cinema.sid", { httpOnly: true, sameSite: "lax" });
    res.json({ message: "You have been logged out." });
  });
});

function loyaltyPointsFor(bookings, userId) {
  const earned = bookings
    .filter(booking => booking.userId === userId && booking.status === "confirmed")
    .reduce((sum, booking) => sum + (booking.pointsEarned === undefined
      ? Math.floor(Number(booking.total || 0) / 10)
      : Number(booking.pointsEarned) || 0) -
      (Number(booking.pointsRedeemed) || 0), 0);
  return Math.max(0, 100 + earned);
}

app.get("/api/auth/me", async (req, res, next) => {
  if (!req.session.user) return res.json({ user: null });
  try {
    const bookings = await readJson("bookings.json");
    res.json({ user: { ...req.session.user, loyaltyPoints: loyaltyPointsFor(bookings, req.session.user.id) } });
  } catch (error) { next(error); }
});

let bookingQueue = Promise.resolve();
function serializeBookingWrite(action) {
  const task = bookingQueue.then(action);
  bookingQueue = task.catch(() => {});
  return task;
}

app.post("/api/bookings/checkout", requireAuth, (req, res, next) => {
  const task = serializeBookingWrite(async () => {
    const { movieId, cinemaId, date, time, seats, paymentMethod, foodItems } = req.body;
    const bankName = typeof req.body.bankName === "string" ? req.body.bankName : "";
    const couponCode = typeof req.body.couponCode === "string" ? req.body.couponCode.trim().toUpperCase() : "";
    const redeemPoints = req.body.redeemPoints === undefined ? 0 : Number(req.body.redeemPoints);
    const movies = await readJson("movies.json");
    const movie = movies.find(item => item.id === movieId && item.releaseType === "now");
    const cinema = CINEMAS.find(item => item.id === cinemaId);
    const normalizedFoodItems = Array.isArray(foodItems) ? foodItems.map(item => ({
      id: typeof item?.id === "string" ? item.id : "",
      quantity: Number.isInteger(Number(item?.quantity)) ? Number(item.quantity) : 0
    })).filter(item => item.id && item.quantity > 0) : [];
    const validFoodIds = new Set(FOOD_ITEMS.map(food => food.id));
    const foodSummary = normalizedFoodItems.map(item => {
      const food = FOOD_ITEMS.find(entry => entry.id === item.id);
      return food ? { ...food, quantity: item.quantity } : null;
    }).filter(Boolean);
    const foodTotal = foodSummary.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (!movie || !cinema || (movie.city && movie.city !== cinema.city) || !validDate(date) || !SHOW_TIMES.includes(time) ||
      !["upi", "card", "netbanking", "debit-card", "credit-card"].includes(paymentMethod) ||
      (paymentMethod === "netbanking" && !BANK_NAMES.includes(bankName)) ||
      !Number.isInteger(redeemPoints) || redeemPoints < 0 ||
      (couponCode !== "" && !["REEL10", "MOVIE50"].includes(couponCode)) ||
      !Array.isArray(seats) || seats.length < 1 || seats.length > 8 ||
      seats.some(seat => typeof seat !== "string" || !/^[A-H](?:10|[1-9])$/.test(seat)) ||
      new Set(seats).size !== seats.length ||
      normalizedFoodItems.some(item => !validFoodIds.has(item.id)) ||
      normalizedFoodItems.some(item => item.quantity < 1 || item.quantity > 10)) {
      return res.status(400).json({ error: "Booking details are invalid. Please review your selections." });
    }
    const bookings = await readJson("bookings.json");
    const loyaltyPoints = loyaltyPointsFor(bookings, req.session.user.id);
    if (redeemPoints > loyaltyPoints) {
      return res.status(400).json({ error: "You do not have enough loyalty points for this redemption." });
    }
    const subtotal = Number((cinema.price * seats.length + foodTotal).toFixed(2));
    if (couponCode === "MOVIE50" && subtotal < 500) {
      return res.status(400).json({ error: "MOVIE50 is valid on orders of ₹500 or more." });
    }
    const couponDiscount = couponCode === "REEL10"
      ? Number(Math.min(200, subtotal * 0.1).toFixed(2))
      : couponCode === "MOVIE50" ? 50 : 0;
    if (redeemPoints > subtotal - couponDiscount) {
      return res.status(400).json({ error: "The selected points exceed the amount remaining after your coupon." });
    }
    const pointsDiscount = redeemPoints;
    const total = Number((subtotal - couponDiscount - pointsDiscount).toFixed(2));
    const taken = new Set(bookings.filter(booking => booking.movieId === movieId &&
      booking.cinemaId === cinemaId && booking.date === date && booking.time === time &&
      booking.status === "confirmed").flatMap(booking => booking.seats));
    const conflicts = seats.filter(seat => taken.has(seat));
    if (conflicts.length) {
      return res.status(409).json({ error: `These seats were just booked: ${conflicts.join(", ")}. Choose different seats.` });
    }
    const booking = {
      id: `CIN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      userId: req.session.user.id,
      userName: req.session.user.name,
      movieId: movie.id,
      movieTitle: movie.title,
      poster: movie.poster,
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      cinemaLocation: cinema.city,
      date,
      time,
      seats: [...seats].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      foodItems: foodSummary,
      foodTotal: Number(foodTotal.toFixed(2)),
      ticketTotal: Number((cinema.price * seats.length).toFixed(2)),
      subtotal,
      couponCode,
      couponDiscount,
      pointsRedeemed: redeemPoints,
      pointsDiscount,
      pointsEarned: Math.floor(total / 10),
      total,
      paymentMethod,
      bankName: paymentMethod === "netbanking" ? bankName : "",
      status: "confirmed",
      createdAt: new Date().toISOString()
    };
    bookings.push(booking);
    await writeJson("bookings.json", bookings);
    return res.status(201).json({ booking });
  });
  task.catch(next);
});

app.get("/api/bookings/mine", requireAuth, async (req, res, next) => {
  try {
    const bookings = await readJson("bookings.json");
    res.json(bookings.filter(booking => booking.userId === req.session.user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  } catch (error) { next(error); }
});

app.get("/api/bookings/:id", requireAuth, async (req, res, next) => {
  try {
    const bookings = await readJson("bookings.json");
    const booking = bookings.find(item => item.id === req.params.id);
    if (!booking || (booking.userId !== req.session.user.id && req.session.user.role !== "admin")) {
      return res.status(404).json({ error: "Booking not found." });
    }
    const qrCode = await QRCode.toDataURL(`CINEBOOK:TICKET:${booking.id}`, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 220
    });
    res.json({ booking, qrCode });
  } catch (error) { next(error); }
});

app.post("/api/bookings/:id/cancel", requireAuth, (req, res, next) => {
  serializeBookingWrite(async () => {
    const bookings = await readJson("bookings.json");
    const booking = bookings.find(item => item.id === req.params.id);
    if (!booking || (booking.userId !== req.session.user.id && req.session.user.role !== "admin")) {
      const error = new Error("Booking not found.");
      error.status = 404;
      throw error;
    }
    if (booking.status !== "confirmed") {
      const error = new Error("This booking is already cancelled.");
      error.status = 409;
      throw error;
    }
    booking.status = "cancelled";
    booking.cancelledAt = new Date().toISOString();
    await writeJson("bookings.json", bookings);
    return booking;
  }).then(booking => res.json({ booking })).catch(error => {
    if (error.status === 404 || error.status === 409) return res.status(error.status).json({ error: error.message });
    next(error);
  });
});

app.get("/api/admin/bookings", requireAdmin, async (req, res, next) => {
  try { res.json((await readJson("bookings.json")).sort((a, b) => b.createdAt.localeCompare(a.createdAt))); }
  catch (error) { next(error); }
});

app.post("/api/admin/movies", requireAdmin, async (req, res, next) => {
  try {
    if (!validMovie(req.body)) return res.status(400).json({ error: "Complete every movie field with valid values." });
    const movies = await readJson("movies.json");
    const movie = normalizedMovie(req.body, crypto.randomUUID());
    movies.push(movie);
    await writeJson("movies.json", movies);
    res.status(201).json({ movie });
  } catch (error) { next(error); }
});

app.put("/api/admin/movies/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!validMovie(req.body)) return res.status(400).json({ error: "Complete every movie field with valid values." });
    const movies = await readJson("movies.json");
    const index = movies.findIndex(movie => movie.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: "Movie not found." });
    movies[index] = normalizedMovie(req.body, req.params.id);
    await writeJson("movies.json", movies);
    res.json({ movie: movies[index] });
  } catch (error) { next(error); }
});

app.delete("/api/admin/movies/:id", requireAdmin, async (req, res, next) => {
  try {
    const movies = await readJson("movies.json");
    const updated = movies.filter(movie => movie.id !== req.params.id);
    if (updated.length === movies.length) return res.status(404).json({ error: "Movie not found." });
    await writeJson("movies.json", updated);
    res.json({ message: "Movie deleted." });
  } catch (error) { next(error); }
});

app.use(express.static(PUBLIC_DIR));
app.get("*", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

async function start() {
  for (const filename of ["movies.json", "users.json", "bookings.json"]) {
    try { await fs.access(path.join(DATA_DIR, filename)); }
    catch { await writeJson(filename, []); }
  }
  const users = await readJson("users.json");
  if (!users.some(user => user.email === "admin@cinema.local")) {
    users.push({
      id: crypto.randomUUID(),
      name: "Cinema Admin",
      email: "admin@cinema.local",
      passwordHash: await bcrypt.hash("Admin123!", 12),
      role: "admin"
    });
    await writeJson("users.json", users);
  }
  app.listen(PORT, () => console.log(`Cinema booking app is running at http://localhost:${PORT}`));
}

start().catch(error => {
  console.error("Could not start the application:", error);
  process.exitCode = 1;
});
