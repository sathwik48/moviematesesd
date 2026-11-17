document.addEventListener("DOMContentLoaded", async () => {
  const alertBox = document.getElementById("payment-alert");
  const form = document.getElementById("payment-form");
  const button = document.getElementById("pay-button");
  const methodDetails = document.getElementById("payment-method-details");
  const summary = document.getElementById("payment-summary");
  const couponInput = document.getElementById("coupon-code");
  const couponMessage = document.getElementById("coupon-message");
  const pointsInput = document.getElementById("redeem-points");
  const pointsMessage = document.getElementById("points-message");
  const pointsBalance = document.getElementById("available-points");
  let draft;
  let couponCode = "";
  let redeemPoints = 0;
  let availablePoints = 0;
  let subtotal = 0;
  let couponDiscount = 0;
  let pointsDiscount = 0;

  function setAlert(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("hidden");
  }

  function clearAlert() {
    alertBox.textContent = "";
    alertBox.classList.add("hidden");
  }

  function selectedMethod() {
    return new FormData(form).get("paymentMethod");
  }

  function renderFakeQr() {
    const size = 25;
    const cells = [];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const inFinder = [[0, 0], [size - 7, 0], [0, size - 7]].some(([left, top]) =>
          x >= left && x < left + 7 && y >= top && y < top + 7);
        let filled;
        if (inFinder) {
          const finder = [[0, 0], [size - 7, 0], [0, size - 7]].find(([left, top]) =>
            x >= left && x < left + 7 && y >= top && y < top + 7);
          const dx = x - finder[0];
          const dy = y - finder[1];
          filled = dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
        } else {
          filled = ((x * 17 + y * 31 + x * y * 7) % 11) < 5;
        }
        if (filled) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
      }
    }
    return `<svg class="fake-qr" viewBox="0 0 ${size} ${size}" role="img" aria-label="Fake UPI QR code for demo only">${cells.join("")}</svg>`;
  }

  function renderMethodDetails() {
    const method = selectedMethod();
    if (method === "upi") {
      methodDetails.innerHTML = `<div class="upi-demo"><div class="qr-frame">${renderFakeQr()}</div><div><h3>Scan to pay with UPI</h3><p>Demo UPI ID: <strong>cinema.demo@upi</strong></p><p class="small-muted">This sample QR is not scannable and will not make a real payment.</p></div></div>`;
      button.innerHTML = `Done — next <i class="fa-solid fa-arrow-right"></i>`;
    } else if (method === "card") {
      methodDetails.innerHTML = `<div class="method-fields"><label for="cardholder">Name on card</label><input id="cardholder" name="cardholder" autocomplete="cc-name" placeholder="Cardholder name"><label for="card-number">Card number</label><input id="card-number" name="cardNumber" inputmode="numeric" autocomplete="cc-number" maxlength="19" placeholder="1234 5678 9012 3456"><div class="form-grid"><label for="card-expiry">Expiry date<input id="card-expiry" name="cardExpiry" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5"></label><label for="card-cvv">CVV<input id="card-cvv" name="cardCvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></label></div><p class="small-muted">Demo only: use any 16-digit number, a future expiry and a 3–4 digit CVV.</p></div>`;
      button.innerHTML = `Pay now <i class="fa-solid fa-arrow-right"></i>`;
    } else {
      methodDetails.innerHTML = `<div class="method-fields"><label for="bank-select">Choose your bank</label><select id="bank-select" name="bankName"><option value="">Select a bank</option><option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Kotak Mahindra Bank</option></select><p class="small-muted">You’ll see a demo confirmation. No bank account will be contacted.</p></div>`;
      button.innerHTML = `Continue to bank <i class="fa-solid fa-arrow-right"></i>`;
    }
  }

  function updateSummary() {
    const due = Math.max(0, subtotal - couponDiscount - pointsDiscount);
    const discountLines = `${couponDiscount ? `<div><span>Coupon ${escapeHtml(couponCode)}</span><strong>−${money(couponDiscount)}</strong></div>` : ""}${pointsDiscount ? `<div><span>Points (${redeemPoints})</span><strong>−${money(pointsDiscount)}</strong></div>` : ""}`;
    const movieDetails = [draft.movie.genre, draft.movie.duration == null ? "" : `${draft.movie.duration} min`, draft.movie.language].filter(Boolean).join(" · ");
    summary.innerHTML = `<div class="payment-summary-card"><img src="${escapeHtml(draft.movie.poster)}" alt=""><div><h3>${escapeHtml(draft.movie.title)}</h3><p>${escapeHtml(movieDetails)}</p><p>${escapeHtml(draft.cinema.name)} · ${escapeHtml(draft.cinema.city)}</p></div></div><div class="booking-detail-list"><div><span>Date</span><strong>${escapeHtml(formatDate(draft.date))}</strong></div><div><span>Showtime</span><strong>${escapeHtml(formatTime(draft.time))}</strong></div><div><span>Seats</span><strong>${escapeHtml([...draft.seats].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(", "))}</strong></div><div><span>Tickets</span><strong>${draft.seats.length}</strong></div>${draft.foodItems.length ? `<div><span>Snacks</span><strong>${escapeHtml(draft.foodItems.map(item => `${item.name} x${item.quantity}`).join(", "))}</strong></div>` : ""}<div><span>Subtotal</span><strong>${money(subtotal)}</strong></div>${discountLines}</div><div class="summary-total"><span>Total to pay</span><strong>${money(due)}</strong></div>`;
  }

  function updateDiscountPreview() {
    couponDiscount = couponCode === "REEL10"
      ? Math.min(200, subtotal * 0.1)
      : couponCode === "MOVIE50" ? 50 : 0;
    redeemPoints = Math.min(redeemPoints, availablePoints, Math.max(0, subtotal - couponDiscount));
    pointsInput.value = String(redeemPoints);
    pointsDiscount = redeemPoints;
    updateSummary();
  }

  function applyCoupon() {
    const entered = couponInput.value.trim().toUpperCase();
    if (!entered) {
      couponCode = "";
      couponDiscount = 0;
      couponMessage.textContent = "Enter a coupon code to apply.";
      couponMessage.classList.remove("success-message");
      updateSummary();
      return;
    }
    if (entered === "REEL10") {
      couponCode = entered;
      couponMessage.textContent = "REEL10 applied — 10% off (up to ₹200).";
    } else if (entered === "MOVIE50" && subtotal >= 500) {
      couponCode = entered;
      couponMessage.textContent = "MOVIE50 applied — ₹50 off.";
    } else {
      couponCode = "";
      couponMessage.textContent = entered === "MOVIE50"
        ? "MOVIE50 requires an order subtotal of ₹500 or more."
        : "That coupon code is not valid.";
    }
    couponMessage.classList.toggle("success-message", Boolean(couponCode));
    updateDiscountPreview();
  }

  function applyPoints() {
    const amount = Number(pointsInput.value);
    const maxRedeemable = Math.max(0, subtotal - couponDiscount);
    if (!Number.isInteger(amount) || amount < 0 || amount > availablePoints) {
      redeemPoints = 0;
      pointsInput.value = "0";
      pointsMessage.textContent = `Enter a whole number from 0 to ${availablePoints}.`;
      pointsMessage.classList.remove("success-message");
    } else if (amount > maxRedeemable) {
      redeemPoints = 0;
      pointsInput.value = "0";
      pointsMessage.textContent = "You can’t redeem more points than the remaining total.";
      pointsMessage.classList.remove("success-message");
    } else {
      redeemPoints = amount;
      pointsMessage.textContent = amount ? `${amount} points redeemed for ${money(amount)} off.` : "No points redeemed.";
      pointsMessage.classList.toggle("success-message", amount > 0);
    }
    updateDiscountPreview();
  }

  function validateMethod(method) {
    if (method === "upi") return true;
    if (method === "netbanking") {
      const bank = document.getElementById("bank-select").value;
      if (!bank) {
        setAlert("Choose a bank to continue.");
        document.getElementById("bank-select").focus();
        return false;
      }
      return true;
    }
    const name = document.getElementById("cardholder").value.trim();
    const number = document.getElementById("card-number").value.replace(/\s/g, "");
    const expiry = document.getElementById("card-expiry").value.trim();
    const cvv = document.getElementById("card-cvv").value.trim();
    const expiryMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    const expiryIsFuture = expiryMatch && (Number(expiryMatch[2]) > currentYear ||
      (Number(expiryMatch[2]) === currentYear && Number(expiryMatch[1]) >= currentMonth));
    if (!name || !/^\d{16}$/.test(number) || !expiryIsFuture || !/^\d{3,4}$/.test(cvv)) {
      setAlert("Enter a cardholder name, 16-digit card number, valid future expiry (MM/YY) and 3–4 digit CVV.");
      return false;
    }
    return true;
  }

  try {
    draft = JSON.parse(sessionStorage.getItem("reelTimeDraft") || "null");
    if (!draft || !Array.isArray(draft.seats) || !draft.seats.length) {
      throw new Error("Your booking selection has expired. Please choose your seats again.");
    }
    const { user } = await api("/api/auth/me");
    if (!user) {
      window.location.href = `/login.html?next=${encodeURIComponent("/payment.html")}`;
      return;
    }
    const [movies, cinemas] = await Promise.all([api("/api/movies"), api("/api/cinemas")]);
    const movie = movies.find(item => item.id === draft.movieId);
    const cinema = cinemas.find(item => item.id === draft.cinemaId);
    if (!movie || !cinema) throw new Error("Your selected movie or cinema is no longer available.");
    draft.movie = movie;
    draft.cinema = cinema;
    draft.foodItems = Array.isArray(draft.foodItems) ? draft.foodItems : [];
    const foodTotal = draft.foodItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    subtotal = cinema.price * draft.seats.length + foodTotal;
    availablePoints = Number(user.loyaltyPoints) || 0;
    pointsBalance.textContent = String(availablePoints);
    pointsInput.max = String(availablePoints);
    renderMethodDetails();
    updateSummary();

    form.querySelectorAll('input[name="paymentMethod"]').forEach(input => input.addEventListener("change", () => {
      clearAlert();
      renderMethodDetails();
    }));
    document.getElementById("apply-coupon").addEventListener("click", applyCoupon);
    couponInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCoupon();
      }
    });
    document.getElementById("apply-points").addEventListener("click", applyPoints);

    form.addEventListener("submit", async event => {
      event.preventDefault();
      clearAlert();
      const paymentMethod = selectedMethod();
      if (!validateMethod(paymentMethod)) return;
      button.disabled = true;
      button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing…`;
      try {
        const bankName = paymentMethod === "netbanking" ? document.getElementById("bank-select").value : "";
        const { booking } = await api("/api/bookings/checkout", {
          method: "POST",
          body: JSON.stringify({
            ...draft,
            paymentMethod,
            bankName,
            couponCode,
            redeemPoints,
            foodItems: draft.foodItems.map(item => ({ id: item.id, quantity: item.quantity }))
          })
        });
        sessionStorage.removeItem("reelTimeDraft");
        window.location.href = `/confirmation.html?id=${encodeURIComponent(booking.id)}`;
      } catch (error) {
        setAlert(error.message);
        button.disabled = false;
        renderMethodDetails();
      }
    });
  } catch (error) {
    setAlert(error.message);
    const back = document.createElement("a");
    back.href = "/booking.html";
    back.className = "btn btn-ghost";
    back.textContent = "Choose seats";
    form.replaceWith(back);
  }
});
