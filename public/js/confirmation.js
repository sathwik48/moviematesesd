document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("ticket-content");
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    container.innerHTML = `<div class="empty-panel"><i class="fa-solid fa-ticket"></i><h3>No ticket selected</h3><p>Complete a booking to view your confirmation.</p><a class="btn btn-primary" href="/movies.html">Browse movies</a></div>`;
    return;
  }
  try {
    const { booking, qrCode } = await api(`/api/bookings/${encodeURIComponent(id)}`);
    const foodSummary = Array.isArray(booking.foodItems) && booking.foodItems.length ? `<div class="ticket-detail"><span>Snacks</span><strong>${escapeHtml(booking.foodItems.map(item => `${item.name} x${item.quantity}`).join(", "))}</strong></div>` : "";
    const discountSummary = `${booking.couponDiscount ? `<div class="ticket-detail"><span>Coupon ${escapeHtml(booking.couponCode)}</span><strong>−${money(booking.couponDiscount)}</strong></div>` : ""}${booking.pointsDiscount ? `<div class="ticket-detail"><span>Points redeemed</span><strong>−${money(booking.pointsDiscount)}</strong></div>` : ""}`;
    const paymentLabel = booking.paymentMethod.replace("-", " ") + (booking.bankName ? ` · ${booking.bankName}` : "");
    const qrSection = qrCode
      ? `<div class="ticket-qr"><img src="${escapeHtml(qrCode)}" alt="Scannable QR code for ticket ${escapeHtml(booking.id)}"><div><strong>Scan for ticket ID</strong><span>Present this QR code at the cinema</span></div></div>`
      : "";
    container.innerHTML = `<div class="confirmation-head"><div class="success-mark"><i class="fa-solid fa-check"></i></div><span class="eyebrow">IT'S OFFICIAL</span><h1>Your night is booked.</h1><p>Your ticket is ready. See you at the movies!</p></div><article class="ticket"><div class="ticket-top"><img src="${escapeHtml(booking.poster)}" alt="${escapeHtml(booking.movieTitle)} poster"><div class="ticket-title"><span class="ticket-id">${escapeHtml(booking.id)}</span><h2>${escapeHtml(booking.movieTitle)}</h2><p>${escapeHtml(booking.cinemaName)} · ${escapeHtml(booking.cinemaLocation)}</p></div></div><div class="ticket-divider"></div><div class="ticket-details"><div class="ticket-detail"><span>Date</span><strong>${escapeHtml(formatDate(booking.date))}</strong></div><div class="ticket-detail"><span>Showtime</span><strong>${escapeHtml(formatTime(booking.time))}</strong></div><div class="ticket-detail"><span>Seats</span><strong>${escapeHtml(booking.seats.join(", "))}</strong></div><div class="ticket-detail"><span>Tickets</span><strong>${booking.seats.length}</strong></div>${foodSummary}${discountSummary}<div class="ticket-detail"><span>Paid</span><strong>${money(booking.total)}</strong></div><div class="ticket-detail"><span>Payment</span><strong>${escapeHtml(paymentLabel)}</strong></div></div>${qrSection}</article><div class="ticket-actions no-print"><button class="btn btn-ghost" onclick="window.print()"><i class="fa-solid fa-print"></i> Print ticket</button><a class="btn btn-primary" href="/mybookings.html">My bookings <i class="fa-solid fa-arrow-right"></i></a></div>`;
  } catch (error) {
    container.innerHTML = `<div class="empty-panel"><i class="fa-solid fa-triangle-exclamation"></i><h3>Ticket unavailable</h3><p>${escapeHtml(error.message)}</p><a class="btn btn-ghost" href="/mybookings.html">Go to my bookings</a></div>`;
  }
});
