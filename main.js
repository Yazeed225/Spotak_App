/* ================================================================
   SPOTAK — Main JavaScript
   Handles login, search, filters, booking flow, and persistence.
   ================================================================ */

/* ----------------------------------------------------------------
   Spot data store — used to populate the detail page and to
   simulate a small "database" of available work/study spots.
---------------------------------------------------------------- */
const SPOTS = {
  ristretto: {
    name: 'Ristretto Cafe',
    location: 'Al Khobar, Eastern Province',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000',
    description: 'A modern, minimalist cafe designed for focused work and study. Features comfortable seating, excellent natural lighting, and a strict quiet-hours policy from 9 AM to 5 PM. Perfect for deep work sessions, group study, or remote meetings in our dedicated meeting rooms.'
  },
  greenhouse: {
    name: 'Greenhouse Coffee',
    location: 'Dammam, Eastern Province',
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1000',
    description: 'An airy cafe filled with plants and natural light. Known for its calm atmosphere, reliable Wi-Fi, and dedicated power outlets at every table. Open 24 hours for late-night work sessions.'
  },
  mocha: {
    name: 'Mocha Hub',
    location: 'Dhahran, Eastern Province',
    image: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=1000',
    description: 'A modern co-working cafe with private meeting rooms, high-speed fiber Wi-Fi, and ergonomic seating. Ideal for team meetings and freelancers who need a professional environment.'
  },
  palm: {
    name: 'Palm Reads Cafe',
    location: 'Qatif, Eastern Province',
    image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=1000',
    description: 'A cozy bookshop-cafe with reading nooks, quiet study tables, and excellent Arabic coffee. Loved by students for its peaceful environment and friendly staff.'
  }
};

/* ----------------------------------------------------------------
   Page boot — runs once the DOM is ready. Decides which page
   we're on by checking the body's class and runs only the logic
   relevant to that page.
---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const main = document.querySelector('.app');
  if (!main) return;

  if (main.classList.contains('spot-page')) {
    initSpotPage();
  } else if (main.classList.contains('booking-page')) {
    requireLogin();
    initBookingPage();
  } else if (main.classList.contains('login-page')) {
    initLoginPage();
  } else if (main.classList.contains('confirmation-page')) {
    initConfirmationPage();
  } else {
    initHomePage();
  }
});

/* ================================================================
   AUTH HELPERS
   ================================================================ */

/* ----------------------------------------------------------------
   Returns true when a user session is stored in localStorage.
---------------------------------------------------------------- */
function isLoggedIn() {
  return localStorage.getItem('spotak_user') !== null;
}

/* ----------------------------------------------------------------
   Redirects the visitor to the login page if no active session
   exists. Used to gate pages that require authentication.
---------------------------------------------------------------- */
function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

/* ================================================================
   HOME PAGE
   ================================================================ */

/* ----------------------------------------------------------------
   Wires up the search box and filter chips on the home page so
   visitors can narrow the spot list by name or amenity.
---------------------------------------------------------------- */
function initHomePage() {
  const searchInput = document.getElementById('searchInput');
  const chips = document.querySelectorAll('.chip');
  let activeFilter = null;

  // Search filter: react to typing in real time
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters(searchInput.value, activeFilter);
    });
  }

  // Filter chips: toggle the active amenity filter
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.classList.contains('active')) {
        chip.classList.remove('active');
        activeFilter = null;
      } else {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.filter;
      }
      applyFilters(searchInput ? searchInput.value : '', activeFilter);
    });
  });
}

/* ----------------------------------------------------------------
   Shows or hides each spot card based on the current search text
   and the currently selected amenity filter.
---------------------------------------------------------------- */
function applyFilters(searchText, amenityFilter) {
  const query = (searchText || '').trim().toLowerCase();
  const cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    const name = (card.dataset.name || '').toLowerCase();
    const tags = (card.dataset.tags || '').toLowerCase();
    const matchesText = !query || name.includes(query);
    const matchesAmenity = !amenityFilter || tags.includes(amenityFilter);

    if (matchesText && matchesAmenity) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

/* ================================================================
   SPOT DETAIL PAGE
   ================================================================ */

/* ----------------------------------------------------------------
   Reads the `id` query param, looks up the matching spot in
   the SPOTS catalog, and fills the page with that spot's data.
   Falls back to Ristretto Cafe if no id is provided.
---------------------------------------------------------------- */
function initSpotPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'ristretto';
  const spot = SPOTS[id] || SPOTS.ristretto;

  document.getElementById('spotTitle').textContent = spot.name;
  document.getElementById('spotLocation').textContent = spot.location;
  document.getElementById('spotDescription').textContent = spot.description;

  const hero = document.getElementById('heroImage');
  if (hero) hero.style.backgroundImage = `url('${spot.image}')`;

  // Remember which spot the user is about to book
  localStorage.setItem('spotak_current_spot', JSON.stringify(spot));
}

/* ================================================================
   BOOKING PAGE
   ================================================================ */

/* ----------------------------------------------------------------
   Sets the date input's default to today, sensible defaults
   for time and people, and wires up the submit handler that
   validates and saves the booking.
---------------------------------------------------------------- */
function initBookingPage() {
  const dateInput = document.getElementById('bookingDate');
  const timeInput = document.getElementById('bookingTime');
  const peopleInput = document.getElementById('bookingPeople');
  const form = document.getElementById('bookingForm');
  const errorBox = document.getElementById('formError');

  // Default date is today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${yyyy}-${mm}-${dd}`;
  dateInput.min = `${yyyy}-${mm}-${dd}`;
  timeInput.value = '10:00';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorBox.textContent = '';

    const date = dateInput.value;
    const time = timeInput.value;
    const people = parseInt(peopleInput.value, 10);

    // Field presence checks
    if (!date || !time || !people) {
      errorBox.textContent = 'Please fill out every field.';
      return;
    }

    // Date-not-in-the-past check
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const chosen = new Date(date + 'T' + time);
    if (chosen < todayStart) {
      errorBox.textContent = 'You cannot book a date in the past.';
      return;
    }

    // Group-size sanity check
    if (people < 1 || people > 20) {
      errorBox.textContent = 'Number of people must be between 1 and 20.';
      return;
    }

    // Persist booking and redirect to the confirmation page
    const spot = JSON.parse(localStorage.getItem('spotak_current_spot') || '{}');
    const booking = {
      spotName: spot.name || 'Ristretto Cafe',
      date,
      time,
      people,
      fee: 25,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('spotak_last_booking', JSON.stringify(booking));
    window.location.href = 'confirmation.html';
  });
}

/* ================================================================
   LOGIN PAGE
   ================================================================ */

/* ----------------------------------------------------------------
   Wires up the login form. Accepts a Gmail address + password of
   8+ chars (this is a client-side demo) and stores the session
   in localStorage so other pages can detect it.
---------------------------------------------------------------- */
function initLoginPage() {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  const errorBox = document.getElementById('loginError');
  const signupLink = document.getElementById('signupLink');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorBox.textContent = '';

    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!email || !password) {
      errorBox.textContent = 'Please enter both email and password.';
      return;
    }

    if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
      errorBox.textContent = 'Please enter a valid email address (e.g., forexample@gmail.com).';
      return;
    }

    if (password.length < 8) {
      errorBox.textContent = 'Password must be at least 8 characters.';
      return;
    }

    localStorage.setItem('spotak_user', JSON.stringify({ email, loggedInAt: Date.now() }));
    window.location.href = 'index.html';
  });

  // "Sign up" simply auto-creates an account in this demo
  if (signupLink) {
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      errorBox.textContent = 'Fill in the form above and press Login to create an account.';
    });
  }
}

/* ================================================================
   CONFIRMATION PAGE
   ================================================================ */

/* ----------------------------------------------------------------
   Pulls the most recent booking from localStorage and renders
   the summary on the confirmation page.
---------------------------------------------------------------- */
function initConfirmationPage() {
  const raw = localStorage.getItem('spotak_last_booking');
  if (!raw) return;
  try {
    const b = JSON.parse(raw);
    document.getElementById('sumSpot').textContent = b.spotName || '—';
    document.getElementById('sumDate').textContent = formatDate(b.date);
    document.getElementById('sumTime').textContent = formatTime(b.time);
    document.getElementById('sumPeople').textContent = b.people;
  } catch (err) {
    // Bad JSON in storage — leave defaults and move on.
  }
}

/* ----------------------------------------------------------------
   Turns a YYYY-MM-DD string into a friendly "Month D, YYYY"
   format for display in the confirmation summary.
---------------------------------------------------------------- */
function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ----------------------------------------------------------------
   Turns a 24-hour HH:MM string into a 12-hour AM/PM display.
---------------------------------------------------------------- */
function formatTime(t) {
  if (!t) return '—';
  const [hStr, m] = t.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
