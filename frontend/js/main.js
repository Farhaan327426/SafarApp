/**
 * SAFAR — Kashmir Bus Transit Unified Application Controller
 * Modern, Offline-Resilient, RTL-Aware, SRO Legal Fare Engine
 */

// ─── TRANSLATIONS & I18N DICTIONARY ──────────────────────────────────────────
const I18N = {
  en: {
    dir: 'ltr',
    brandTagline: 'سفر — Legal SRO Transit Fare',
    networkOnline: 'Online',
    networkOffline: 'Offline (2G Mode)',
    searchPlaceholder: 'Search Amar Singh College, Lal Chowk, Hazratbal…',
    scanQrBtn: 'Scan Bus QR Code',
    popularRoutes: 'Popular Kashmir Corridors',
    nearbyHeading: 'Nearby Buses & Stops',
    tapMap: 'Tap to launch live corridor radar ➔',
    planJourney: 'Plan Journey & SRO Legal Fare',
    boarding: 'Boarding Stop',
    destination: 'Destination Stop',
    calculate: 'Calculate Legal Fare',
    nearby: 'Near Me',
    sroBadge: 'SAFAR SRO TICKET PASS',
    distance: 'Distance',
    estArrival: 'Est. Time',
    concessionTitle: 'Passenger Category / Concession',
    fareBreakdown: 'Official SRO Fare Breakdown',
    baseSlab: 'Base Slab (First 3 Km)',
    distCharge: 'Distance Charge',
    concessionApplied: 'Concession Discount',
    totalPayable: 'Total Legal Fare',
    sroDisclaimer: 'Calculated as per J&K Motor Vehicles Department SRO notification. Zero surcharge or platform fee.',
    payBtn: (amount) => `Book & Pay ₹${amount} via UPI (GPay / PhonePe)`,
    payOfflineMsg: 'Offline Mode: Present cash ₹{amount} to conductor with SRO ticket receipt.',
    disputeTitle: 'Report Fare Overcharging',
    disputeSuccess: 'Grievance submitted! Logged locally and sent to J&K Transport Grievance Cell.',
    ticketSuccess: 'Ticket Confirmed! Pass stored in your offline wallet.',
    live: 'LIVE',
    navHome: 'Home',
    navMap: 'Map',
    navTrips: 'Passes',
    navSettings: 'Help'
  },
  ur: {
    dir: 'rtl',
    brandTagline: 'سفر — باوقار اور قانونی کِرایہٕ',
    networkOnline: 'آن لائن',
    networkOffline: 'آف لائن (2G موڈ)',
    searchPlaceholder: 'امر سنگھ کالج، لال چوک، حضرت بل تلاش کریں…',
    scanQrBtn: 'بس کا QR کوڈ اسکین کریں',
    popularRoutes: 'اہم بس کوریڈورز',
    nearbyHeading: 'قریبی بسیں اور اسٹاپس',
    tapMap: 'لائیو ٹرانزٹ ریڈار دیکھیں ➔',
    planJourney: 'سفر اور قانونی کرایہ چیک کریں',
    boarding: 'روانگی اسٹاپ',
    destination: 'منزل کا اسٹاپ',
    calculate: 'قانونی کرایہ کا حساب',
    nearby: 'میرے قریب',
    sroBadge: 'سرکاری SRO ٹریول پاس',
    distance: 'فاصلہ',
    estArrival: 'پہنچنے کا وقت',
    concessionTitle: 'مسافر کا زمرہ / رعایت',
    fareBreakdown: 'سرکاری کرایہ کی تفصیل',
    baseSlab: 'بنیادی کرایہ (پہلے 3 کلومیٹر)',
    distCharge: 'فاصلہ چارج',
    concessionApplied: 'رعایت',
    totalPayable: 'کل قانونی کرایہ',
    sroDisclaimer: 'محکمہ ٹرانسپورٹ جموں و کشمیر کے نوٹیفکیشن کے مطابق۔ کوئی اضافی چارج نہیں۔',
    payBtn: (amount) => `UPI کے ذریعے ₹${amount} ادا کریں`,
    payOfflineMsg: 'آف لائن موڈ: کنڈکٹر کو نقد رقم دیں۔',
    disputeTitle: 'زیادہ کرایہ وصولی کی شکایت',
    disputeSuccess: 'شکایت درج ہو گئی! محکمہ ٹرانسپورٹ کو بھیج دی جائے گی۔',
    ticketSuccess: 'ٹکٹ جاری کر دیا گیا! آپ کے بٹوے میں محفوظ ہے۔',
    live: 'لائیو',
    navHome: 'ہوم',
    navMap: 'نقشہ',
    navTrips: 'پاسز',
    navSettings: 'مدد'
  },
  ks: {
    dir: 'rtl',
    brandTagline: 'سفر — باوقار کِرایہٕ نظام',
    networkOnline: 'آن لائن',
    networkOffline: 'آف لائن (2G موڈ)',
    searchPlaceholder: 'امر سنگھ کالج، لال چوک، حضرت بل ژھانڈِو…',
    scanQrBtn: 'بسُک QR کوڈ اسکین کٔرِو',
    popularRoutes: 'مشہور روٹ',
    nearbyHeading: 'نزدیٖکی بَسہٕ تہٕ اڈّہٕ',
    tapMap: 'سٲری نَقشہٕ وُچھِو ➔',
    planJourney: 'سفر تہٕ کِرایہٕ تفصیل',
    boarding: 'چڑھنُک جاے',
    destination: 'منزل',
    calculate: 'کِرایہٕ حِساب',
    nearby: 'نزدیٖک',
    sroBadge: 'سرکٲری SRO کِرایہٕ پاس',
    distance: 'دوری',
    estArrival: 'واتنُک وقت',
    concessionTitle: 'مسافر کٹگری / رعایت',
    fareBreakdown: 'کِرایہٕ تفصیل',
    baseSlab: 'بنیٲدی کِرایہٕ (۳ کلو میٹر تام)',
    distCharge: 'دوری چارج',
    concessionApplied: 'رعایت',
    totalPayable: 'کُل قونوٗنی کِرایہٕ',
    sroDisclaimer: 'محکمہ ٹرانسپورٹ کشمیرِک قونوٗنی کِرایہٕ۔',
    payBtn: (amount) => `UPI ذٔریعہٕ ₹${amount} دیِو`,
    payOfflineMsg: 'آف لائن موڈ: ڈرائیورس دِیو روپیہٕ۔',
    disputeTitle: 'زیٛادہٕ کِرایہٕ چہِ شکایت',
    disputeSuccess: 'شکایت سپُز درٕج!',
    ticketSuccess: 'ٹکٹ سپُز تصدیٖق! خۄش سفر۔',
    live: 'لائیو',
    navHome: 'گھرٕ',
    navMap: 'نقشہٕ',
    navTrips: 'سفر',
    navSettings: 'مدد'
  },
  hi: {
    dir: 'ltr',
    brandTagline: 'सफ़र — वैधानिक SRO बस किराया',
    networkOnline: 'ऑनलाइन',
    networkOffline: 'ऑफलाइन (2G मोड)',
    searchPlaceholder: 'अमर सिंह कॉलेज, लाल चौक, हज़रतबल खोजें…',
    scanQrBtn: 'बस QR कोड स्कैन करें',
    popularRoutes: 'प्रमुख कश्मीर कॉरिडोर',
    nearbyHeading: 'निकटतम बसें और स्टॉप',
    tapMap: 'लाइव कॉरिडोर मैप देखें ➔',
    planJourney: 'यात्रा योजना एवं SRO किराया',
    boarding: 'प्रस्थान स्टॉप',
    destination: 'गंतव्य स्टॉप',
    calculate: 'वैधानिक किराया गणना',
    nearby: 'मेरे पास',
    sroBadge: 'SAFAR SRO ई-टिकट पास',
    distance: 'दूरी',
    estArrival: 'अनुमानित समय',
    concessionTitle: 'यात्री श्रेणी / छूट',
    fareBreakdown: 'आधिकारिक किराया विवरण',
    baseSlab: 'मूल किराया (प्रथम 3 किमी)',
    distCharge: 'दूरी शुल्क',
    concessionApplied: 'रियायत छूट',
    totalPayable: 'कुल वैधानिक किराया',
    sroDisclaimer: 'जम्मू-कश्मीर परिवहन विभाग SRO अधिसूचना के अनुसार। कोई छिपा शुल्क नहीं।',
    payBtn: (amount) => `UPI से ₹${amount} भुगतान करें`,
    payOfflineMsg: 'ऑफलाइन मोड: कंडक्टर को वैध टिकट पर्ची हेतु नकद दें।',
    disputeTitle: 'अतिरिक्त किराया वसूली की शिकायत',
    disputeSuccess: 'शिकायत दर्ज! SRTA विभाग को भेजी जाएगी।',
    ticketSuccess: 'टिकट प्राप्त हुआ! पास आपके वॉलेट में सुरक्षित है।',
    live: 'लाइव',
    navHome: 'होम',
    navMap: 'मैप',
    navTrips: 'पास',
    navSettings: 'सहायता'
  }
};

// ─── MASTER ROUTE & STOP DATASET ─────────────────────────────────────────────
const KASHMIR_ROUTES = [
  {
    id: 'srn-hazratbal',
    name: 'Lal Chowk ➔ Hazratbal Dargah',
    origin: 'Lal Chowk',
    destination: 'Hazratbal',
    distanceKm: 9.8,
    via: 'TRC, Dalgate, Boulevard, University Gate',
    stops: ['Lal Chowk', 'TRC', 'Dalgate', 'Nehru Park', 'Naseem Bagh', 'Hazratbal'],
    baseFare: 10,
    perKmRate: 1.5,
    busReg: 'JK01-1402',
    speedKm: '34 km/h',
    etaMins: 4,
    occupancy: 'Moderate (14 seats available)',
    corridor: 'SRN-HAZ-03',
    lat: 34.0837,
    lng: 74.8100
  },
  {
    id: 'srn-asc-soura',
    name: 'Amar Singh College ➔ Soura (SKIMS)',
    origin: 'Amar Singh College',
    destination: 'Soura',
    distanceKm: 11.4,
    via: 'Gogji Bagh, Lal Chowk, Khanyar, Rainawari',
    stops: ['Amar Singh College', 'Jahangir Chowk', 'Lal Chowk', 'Khanyar', 'Rainawari', 'Soura'],
    baseFare: 10,
    perKmRate: 1.5,
    busReg: 'JK01-8841',
    speedKm: '28 km/h',
    etaMins: 6,
    occupancy: 'High (6 seats available)',
    corridor: 'SRN-HAZ-03',
    lat: 34.0621,
    lng: 74.8115
  },
  {
    id: 'SRN-BUD-01',
    name: 'Srinagar (Lal Chowk) ➔ Budgam Stand',
    origin: 'Lal Chowk',
    destination: 'Budgam Bus Stand',
    distanceKm: 14.2,
    via: 'Rambagh, Hyderpora, Ompora',
    stops: ['Lal Chowk', 'Rambagh', 'Hyderpora', 'Ompora Crossing', 'Budgam Bus Stand'],
    baseFare: 10,
    perKmRate: 1.4,
    busReg: 'JK04-5561',
    speedKm: '40 km/h',
    etaMins: 8,
    occupancy: 'Moderate (11 seats available)',
    corridor: 'SRN-BUD-01',
    lat: 34.0211,
    lng: 74.7745
  },
  {
    id: 'SRN-SNM-02',
    name: 'Budgam ➔ Sonmarg Tourist Corridor',
    origin: 'Budgam Bus Stand',
    destination: 'Sonmarg',
    distanceKm: 84.0,
    via: 'Ganderbal, Kangan, Gund, Gagangeer, Sonmarg',
    stops: ['Budgam Bus Stand', 'Srinagar Bypass', 'Ganderbal', 'Kangan', 'Sonmarg'],
    baseFare: 20,
    perKmRate: 1.35,
    busReg: 'JK01-SNM-101',
    speedKm: '48 km/h',
    etaMins: 12,
    occupancy: 'Low (22 seats available)',
    corridor: 'SRN-SNM-02',
    lat: 34.2250,
    lng: 74.9200
  },
  {
    id: 'srn-baramulla',
    name: 'Batamaloo ➔ Baramulla Highway',
    origin: 'Batamaloo',
    destination: 'Baramulla',
    distanceKm: 52.0,
    via: 'Parimpora, Narbal, Pattan, Sangrama, Baramulla',
    stops: ['Batamaloo', 'Parimpora', 'Narbal', 'Pattan', 'Sangrama', 'Baramulla'],
    baseFare: 15,
    perKmRate: 1.35,
    busReg: 'JK05-3211',
    speedKm: '45 km/h',
    etaMins: 9,
    occupancy: 'Moderate (16 seats available)',
    corridor: 'SRN-BAR-04',
    lat: 34.1200,
    lng: 74.6500
  },
  {
    id: 'srn-anantnag',
    name: 'Pantha Chowk ➔ Anantnag (Khanabal)',
    origin: 'Pantha Chowk',
    destination: 'Anantnag',
    distanceKm: 48.5,
    via: 'Pampore (Saffron Town), Awantipora, Bijbehara',
    stops: ['Pantha Chowk', 'Pampore', 'Awantipora', 'Bijbehara', 'Khanabal'],
    baseFare: 15,
    perKmRate: 1.35,
    busReg: 'JK03-9122',
    speedKm: '42 km/h',
    etaMins: 14,
    occupancy: 'Moderate (15 seats available)',
    corridor: 'SRN-BUD-01',
    lat: 33.9500,
    lng: 74.9800
  }
];

// ─── STATE ───────────────────────────────────────────────────────────────────
let currentLang = localStorage.getItem('safar_lang') || 'en';
let currentTheme = localStorage.getItem('safar_theme') || 'light';
let isOnline = navigator.onLine;
let leafletMap = null;
let miniMap = null;
let mapMarkers = [];
let shiftInterval = null;
let shiftSeconds = 0;
let currentActiveCorridor = 'all';

// ─── INITIALIZATION ON DOM READY ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initI18n();
  initNetwork();
  renderRoutes();
  renderTripsWallet();
  initEventHandlers();
  initMiniMapPreview();
  startSimulatedTelemetry();
});

// ─── THEME CONTROLLER ────────────────────────────────────────────────────────
function initTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('safar_theme', currentTheme);
  initTheme();
  showToast(`Switched to ${currentTheme} mode`, 'info');
}

// ─── I18N CONTROLLER ─────────────────────────────────────────────────────────
function initI18n() {
  const langSelect = document.getElementById('lang-switcher');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
  }
  applyTranslations();
}

function setLanguage(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  localStorage.setItem('safar_lang', lang);
  applyTranslations();
  renderRoutes();
}

function applyTranslations() {
  const t = I18N[currentLang] || I18N.en;
  document.documentElement.setAttribute('lang', currentLang);
  document.documentElement.setAttribute('dir', t.dir);

  const netText = document.getElementById('network-text');
  if (netText) netText.textContent = isOnline ? t.networkOnline : t.networkOffline;

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      if (typeof t[key] === 'string') el.textContent = t[key];
    }
  });
}

// ─── NETWORK MONITOR ─────────────────────────────────────────────────────────
function initNetwork() {
  const updateNet = () => {
    isOnline = navigator.onLine;
    const netStatus = document.getElementById('network-status');
    const netText = document.getElementById('network-text');
    const t = I18N[currentLang] || I18N.en;
    if (netStatus && netText) {
      if (isOnline) {
        netStatus.classList.remove('offline');
        netText.textContent = t.networkOnline;
      } else {
        netStatus.classList.add('offline');
        netText.textContent = t.networkOffline;
        showToast('Running in 2G Offline Mode (Local SRO Fare Active)', 'info');
      }
    }
  };
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);
  updateNet();
}

// ─── ROUTE LIST & CARDS ──────────────────────────────────────────────────────
function renderRoutes() {
  const container = document.getElementById('route-list');
  if (!container) return;

  container.innerHTML = '';
  KASHMIR_ROUTES.forEach((route) => {
    const card = document.createElement('div');
    card.className = 'route-item-card';
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="route-top-row">
        <span class="route-title">${route.name}</span>
        <span class="route-fare-badge">₹${route.baseFare}–₹${Math.round(route.baseFare + route.distanceKm * route.perKmRate)}</span>
      </div>
      <div class="route-sub-row">
        <span class="route-stops-via">📍 via ${route.via.substring(0, 38)}…</span>
        <span class="route-eta-tag">⚡ ${route.etaMins}m (${route.busReg})</span>
      </div>
    `;
    card.addEventListener('click', () => selectRoute(route));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectRoute(route);
      }
    });
    container.appendChild(card);
  });
}

function selectRoute(route) {
  document.getElementById('trip-origin').value = route.origin;
  document.getElementById('trip-dest').value = route.destination;
  calculateFare();
  const plannerCard = document.querySelector('.trip-planner-card');
  if (plannerCard) {
    plannerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ─── SRO FARE CALCULATION ENGINE ─────────────────────────────────────────────
function calculateFare() {
  const origin = (document.getElementById('trip-origin').value || '').trim();
  const dest = (document.getElementById('trip-dest').value || '').trim();
  const concession = document.getElementById('journey-concession').value;

  if (!origin || !dest) {
    showToast('Please enter both origin and destination stops', 'error');
    return;
  }

  // Find matching route or estimate distance
  let matched = KASHMIR_ROUTES.find(
    (r) =>
      r.origin.toLowerCase().includes(origin.toLowerCase()) ||
      r.destination.toLowerCase().includes(dest.toLowerCase()) ||
      (r.stops && r.stops.some(s => s.toLowerCase().includes(origin.toLowerCase())))
  );

  const distance = matched ? matched.distanceKm : 9.4;
  const baseSlabFare = 10;
  const perKmRate = matched ? matched.perKmRate : 1.5;
  
  // SRO Formula: First 3km base fare + per km beyond 3km
  let totalFare = baseSlabFare;
  if (distance > 3) {
    totalFare += Math.round((distance - 3) * perKmRate);
  }

  let discountRate = 0;
  let discountLabel = 'None';
  if (concession === 'student') {
    discountRate = 0.5;
    discountLabel = 'Student (50%)';
  } else if (concession === 'senior') {
    discountRate = 0.25;
    discountLabel = 'Senior (25%)';
  } else if (concession === 'disabled') {
    discountRate = 0.5;
    discountLabel = 'Specially Abled (50%)';
  }

  const finalPayable = Math.max(5, Math.round(totalFare * (1 - discountRate)));
  const estMins = Math.max(4, Math.round(distance * 2.2));
  const busReg = matched ? matched.busReg : 'JK01-A-4482';

  // Update E-Ticket UI
  document.getElementById('ticket-total-fare').textContent = `₹${finalPayable}`;
  document.getElementById('ticket-route-name').textContent = `${origin} ➔ ${dest}`;
  document.getElementById('ticket-dist').textContent = `${distance} km`;
  document.getElementById('ticket-time').textContent = `${estMins} min`;
  document.getElementById('ticket-bus-no').textContent = busReg;
  document.getElementById('ticket-discount-tag').textContent = discountLabel;
  document.getElementById('ticket-timestamp').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const ticket = document.getElementById('fare-ticket');
  if (ticket) {
    ticket.style.display = 'block';
  }

  const upiBtn = document.getElementById('lbl-pay-upi-text');
  if (upiBtn) {
    upiBtn.textContent = `Book & Pay ₹${finalPayable} via UPI (GPay / PhonePe)`;
  }
}

// ─── TICKET BOOKING & WALLET ─────────────────────────────────────────────────
function bookTicketPass() {
  const origin = document.getElementById('trip-origin').value || 'Lal Chowk';
  const dest = document.getElementById('trip-dest').value || 'Hazratbal';
  const fare = document.getElementById('ticket-total-fare').textContent || '₹14';
  const busNo = document.getElementById('ticket-bus-no').textContent || 'JK01-A-4482';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const ticketObj = {
    id: 'TKT-' + Math.floor(100000 + Math.random() * 900000),
    origin,
    dest,
    fare,
    busNo,
    time,
    date: new Date().toLocaleDateString(),
    status: 'ACTIVE / SRO-VERIFIED'
  };

  const currentTrips = JSON.parse(localStorage.getItem('safar_trips') || '[]');
  currentTrips.unshift(ticketObj);
  localStorage.setItem('safar_trips', JSON.stringify(currentTrips));

  renderTripsWallet();
  showToast(`🎉 E-Ticket Confirmed (${fare})! Added to Passes Wallet`, 'success');
}

function renderTripsWallet() {
  const container = document.getElementById('trips-list');
  if (!container) return;

  const trips = JSON.parse(localStorage.getItem('safar_trips') || '[]');
  if (trips.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:28px 16px;">
        <div style="font-size:2.5rem; margin-bottom:8px;">🎫</div>
        <h4 style="font-family:var(--font-hero); font-size:1.1rem; color:var(--text-main); margin-bottom:4px;">No Active Passes</h4>
        <p style="font-size:0.8rem; color:var(--text-muted);">Plan a trip and book your legal SRO verified ticket.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = trips
    .slice(0, 8)
    .map(
      (t) => `
    <div class="ticket" style="margin-top:0;">
      <div class="ticket-hole l"></div>
      <div class="ticket-hole r"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; font-weight:700;">
        <span>${t.id}</span>
        <span class="stamp">${t.status}</span>
      </div>
      <div class="ticket-fare">${t.fare}</div>
      <div style="font-size:0.95rem; font-weight:700; text-align:center;">${t.origin} ➔ ${t.dest}</div>
      <div class="ticket-grid">
        <div>Bus: <b>${t.busNo}</b></div>
        <div>Time: <b>${t.time}</b></div>
        <div>Date: <b>${t.date}</b></div>
        <div>Verification: <b>Legal SRO</b></div>
      </div>
      <div class="ticket-footer">
        <div class="barcode"></div>
        <div style="font-size:0.7rem; color:var(--gold); font-weight:700;">CONDUCTOR INSPECTED</div>
      </div>
    </div>
  `
    )
    .join('');
}

// ─── LEAFLET LIVE RADAR MAP ──────────────────────────────────────────────────
function initMiniMapPreview() {
  const miniEl = document.getElementById('mini-map');
  if (!miniEl || typeof L === 'undefined') return;

  try {
    miniMap = L.map('mini-map', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false
    }).setView([34.0837, 74.7973], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
    
    // Add pulsing bus markers
    KASHMIR_ROUTES.forEach((r) => {
      L.circleMarker([r.lat, r.lng], {
        radius: 6,
        fillColor: '#FF7B00',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 1
      }).addTo(miniMap);
    });
  } catch (err) {
    console.warn('MiniMap init warning:', err);
  }
}

function initFullRadarMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined' || leafletMap) return;

  try {
    leafletMap = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([34.0837, 74.7973], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap);
    updateRadarMapMarkers();
  } catch (err) {
    console.warn('FullMap init warning:', err);
  }
}

function updateRadarMapMarkers() {
  if (!leafletMap) return;

  // Clear existing markers
  mapMarkers.forEach((m) => leafletMap.removeLayer(m));
  mapMarkers = [];

  const filtered = currentActiveCorridor === 'all'
    ? KASHMIR_ROUTES
    : KASHMIR_ROUTES.filter((r) => r.corridor === currentActiveCorridor || r.id === currentActiveCorridor);

  filtered.forEach((r) => {
    const marker = L.circleMarker([r.lat, r.lng], {
      radius: 8,
      fillColor: '#FF7B00',
      color: '#0C3B2E',
      weight: 2,
      fillOpacity: 1
    }).addTo(leafletMap);

    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <b style="color:#0C3B2E;">${r.name}</b><br>
        <span>Bus: <b>${r.busReg}</b> (${r.speedKm})</span><br>
        <span>Next arrival: <b>${r.etaMins} mins</b></span><br>
        <span style="color:#10B981; font-weight:700;">${r.occupancy}</span>
      </div>
    `);
    mapMarkers.push(marker);
  });

  renderActiveBusesFeed(filtered);
}

function renderActiveBusesFeed(routes) {
  const feed = document.getElementById('active-buses-feed');
  if (!feed) return;

  const countBadge = document.getElementById('active-bus-count');
  if (countBadge) countBadge.textContent = `${routes.length} Buses Online`;

  feed.innerHTML = routes
    .map(
      (r) => `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px;">
      <div>
        <div style="font-family:var(--font-hero); font-weight:700; font-size:0.95rem; color:var(--text-main);">${r.name}</div>
        <div style="font-size:0.78rem; color:var(--text-muted);">Bus: <b>${r.busReg}</b> • ${r.speedKm} • ${r.occupancy}</div>
      </div>
      <div style="text-align:right;">
        <div class="eta-num" style="font-size:1.25rem;">${r.etaMins}m</div>
        <div class="eta-label">Arrival</div>
      </div>
    </div>
  `
    )
    .join('');
}

function startSimulatedTelemetry() {
  // Jitter coordinates slightly to simulate live moving buses
  setInterval(() => {
    KASHMIR_ROUTES.forEach((r) => {
      r.lat += (Math.random() - 0.5) * 0.001;
      r.lng += (Math.random() - 0.5) * 0.001;
    });
    if (leafletMap && currentTab === 'map') {
      updateRadarMapMarkers();
    }
  }, 4000);
}

// ─── EVENT HANDLERS & MODAL BINDINGS ─────────────────────────────────────────
function initEventHandlers() {
  // Theme Toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Tab Navigation
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Quick Hub Chips
  document.querySelectorAll('.quick-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const from = chip.getAttribute('data-from');
      const to = chip.getAttribute('data-to');
      document.getElementById('trip-origin').value = from;
      document.getElementById('trip-dest').value = to;
      calculateFare();
    });
  });

  // Swap Stops
  const swapBtn = document.getElementById('btn-swap-stops');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const orig = document.getElementById('trip-origin');
      const dest = document.getElementById('trip-dest');
      const temp = orig.value;
      orig.value = dest.value;
      dest.value = temp;
      calculateFare();
    });
  }

  // Calculate Button
  const calcBtn = document.getElementById('btn-calculate-fare');
  if (calcBtn) calcBtn.addEventListener('click', calculateFare);

  // Concession Change
  const concessionSelect = document.getElementById('journey-concession');
  if (concessionSelect) concessionSelect.addEventListener('change', calculateFare);

  // Near Me Button
  const nearMeBtn = document.getElementById('btn-near-me');
  if (nearMeBtn) {
    nearMeBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            document.getElementById('trip-origin').value = 'Amar Singh College (Gogji Bagh)';
            calculateFare();
            showToast('📍 Nearest stop detected: Amar Singh College', 'success');
          },
          (err) => {
            document.getElementById('trip-origin').value = 'Lal Chowk';
            calculateFare();
            showToast('📍 Set to central hub: Lal Chowk', 'info');
          }
        );
      } else {
        document.getElementById('trip-origin').value = 'Lal Chowk';
        calculateFare();
      }
    });
  }

  // Map Preview Tap
  const mapPreviewBtn = document.getElementById('map-preview-btn');
  if (mapPreviewBtn) {
    mapPreviewBtn.addEventListener('click', () => switchTab('map'));
  }

  // Corridor Filter Pills in Map Screen
  document.querySelectorAll('.corridor-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.corridor-pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentActiveCorridor = btn.getAttribute('data-corridor');
      updateRadarMapMarkers();
    });
  });

  // Search Input Autocomplete & Clear
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear-btn');
  if (searchInput && searchClear) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      searchClear.classList.toggle('active', val.length > 0);
      filterRoutesLive(val);
    });
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.classList.remove('active');
      renderRoutes();
    });
  }

  // QR Modal
  const scanQrBtn = document.getElementById('scan-qr-btn');
  const qrModal = document.getElementById('qr-modal');
  const qrModalClose = document.getElementById('qr-modal-close');
  if (scanQrBtn && qrModal) {
    scanQrBtn.addEventListener('click', () => (qrModal.hidden = false));
  }
  if (qrModalClose && qrModal) {
    qrModalClose.addEventListener('click', () => (qrModal.hidden = true));
  }
  document.querySelectorAll('.test-qr-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const routeId = btn.getAttribute('data-route');
      const found = KASHMIR_ROUTES.find((r) => r.id === routeId);
      if (found) {
        selectRoute(found);
        if (qrModal) qrModal.hidden = true;
        showToast(`⚡ Scanned Bus: ${found.busReg} (${found.name})`, 'success');
      }
    });
  });

  // Pay via UPI Button
  const payUpiBtn = document.getElementById('btn-pay-upi');
  if (payUpiBtn) payUpiBtn.addEventListener('click', bookTicketPass);

  // Dispute Modals
  const disputeModal = document.getElementById('dispute-modal');
  const disputeModalClose = document.getElementById('dispute-modal-close');
  const openDisputeBtn = document.getElementById('btn-open-dispute-modal');
  const ticketDisputeBtn = document.getElementById('btn-ticket-dispute');
  const disputeForm = document.getElementById('dispute-form');

  const openDispute = () => {
    const busNo = document.getElementById('ticket-bus-no')?.textContent || 'JK01-A-4482';
    const fare = document.getElementById('ticket-total-fare')?.textContent || '₹10.00';
    document.getElementById('dispute-bus-no').value = busNo;
    document.getElementById('dispute-legal-fare').value = fare;
    if (disputeModal) disputeModal.hidden = false;
  };

  if (openDisputeBtn) openDisputeBtn.addEventListener('click', openDispute);
  if (ticketDisputeBtn) ticketDisputeBtn.addEventListener('click', openDispute);
  if (disputeModalClose && disputeModal) {
    disputeModalClose.addEventListener('click', () => (disputeModal.hidden = true));
  }
  if (disputeForm) {
    disputeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const busNo = document.getElementById('dispute-bus-no').value;
      const legalFare = document.getElementById('dispute-legal-fare').value;
      const charged = document.getElementById('dispute-charged-fare').value;
      const notes = document.getElementById('dispute-notes').value;

      const grievance = { id: 'GRP-' + Date.now(), busNo, legalFare, charged, notes, date: new Date().toISOString() };
      const grievances = JSON.parse(localStorage.getItem('safar_disputes') || '[]');
      grievances.push(grievance);
      localStorage.setItem('safar_disputes', JSON.stringify(grievances));

      if (disputeModal) disputeModal.hidden = true;
      const t = I18N[currentLang] || I18N.en;
      showToast(t.disputeSuccess, 'success');
      disputeForm.reset();
    });
  }

  // Missing Stop Modal
  const missingStopModal = document.getElementById('missing-stop-modal');
  const missingStopClose = document.getElementById('missing-stop-close');
  const openMissingBtn = document.getElementById('btn-open-stop-report-modal');
  const missingForm = document.getElementById('missing-stop-form');
  const useGpsBtn = document.getElementById('btn-use-current-gps');

  if (openMissingBtn && missingStopModal) {
    openMissingBtn.addEventListener('click', () => (missingStopModal.hidden = false));
  }
  if (missingStopClose && missingStopModal) {
    missingStopClose.addEventListener('click', () => (missingStopModal.hidden = true));
  }
  if (useGpsBtn) {
    useGpsBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            document.getElementById('missing-stop-lat').value = pos.coords.latitude.toFixed(4);
            document.getElementById('missing-stop-lng').value = pos.coords.longitude.toFixed(4);
            showToast('GPS Coordinates Attached', 'success');
          },
          () => {
            document.getElementById('missing-stop-lat').value = '34.0837';
            document.getElementById('missing-stop-lng').value = '74.7973';
            showToast('Attached Central Srinagar Coordinates', 'info');
          }
        );
      }
    });
  }
  if (missingForm) {
    missingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const stopEn = document.getElementById('missing-stop-en').value;
      if (missingStopModal) missingStopModal.hidden = true;
      showToast(`Stop "${stopEn}" submitted for verification!`, 'success');
      missingForm.reset();
    });
  }

  // Driver Shift & OTP Controls
  const driverStartBtn = document.getElementById('btn-driver-start');
  const driverStopBtn = document.getElementById('btn-driver-stop');
  const driverOtpBtn = document.getElementById('btn-driver-otp');
  const driverOtpBox = document.getElementById('driver-otp-box');

  if (driverStartBtn) {
    driverStartBtn.addEventListener('click', () => {
      if (!shiftInterval) {
        shiftSeconds = 0;
        shiftInterval = setInterval(() => {
          shiftSeconds++;
          const hrs = String(Math.floor(shiftSeconds / 3600)).padStart(2, '0');
          const mins = String(Math.floor((shiftSeconds % 3600) / 60)).padStart(2, '0');
          const secs = String(shiftSeconds % 60).padStart(2, '0');
          const timerEl = document.getElementById('driver-shift-timer');
          if (timerEl) timerEl.textContent = `${hrs}:${mins}:${secs}`;
        }, 1000);
        showToast('Shift started! Fare ledger active at ₹0 fee.', 'success');
      }
    });
  }

  if (driverStopBtn) {
    driverStopBtn.addEventListener('click', () => {
      if (shiftInterval) {
        clearInterval(shiftInterval);
        shiftInterval = null;
        showToast('Shift concluded. Summary exported.', 'info');
      }
    });
  }

  if (driverOtpBtn && driverOtpBox) {
    driverOtpBtn.addEventListener('click', () => {
      const otp = Math.floor(100000 + Math.random() * 900000);
      driverOtpBox.textContent = otp;
      driverOtpBox.style.display = 'block';
      showToast('Dynamic SRO Inspector Token Generated (Valid 5 mins)', 'success');
    });
  }

  // Cache Sync Button
  const syncCacheBtn = document.getElementById('btn-sync-cache');
  if (syncCacheBtn) {
    syncCacheBtn.addEventListener('click', () => {
      localStorage.setItem('safar_routes_cache', JSON.stringify(KASHMIR_ROUTES));
      showToast('✅ 2G Offline SRO Route Matrix Synced!', 'success');
    });
  }
}

// ─── TAB SWITCHER ────────────────────────────────────────────────────────────
function switchTab(tabName) {
  currentTab = tabName;

  // Update Nav items
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
  });

  // Hide all screens
  document.querySelectorAll('.screen-view').forEach((screen) => {
    screen.hidden = true;
  });

  // Show target screen
  const target = document.getElementById(`${tabName}-screen`);
  if (target) {
    target.hidden = false;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Map special handling
  if (tabName === 'map') {
    setTimeout(() => {
      initFullRadarMap();
      if (leafletMap) {
        leafletMap.invalidateSize();
        updateRadarMapMarkers();
      }
    }, 100);
  }
}

// ─── SEARCH FILTERING ────────────────────────────────────────────────────────
function filterRoutesLive(query) {
  const container = document.getElementById('route-list');
  if (!container) return;

  if (!query) {
    renderRoutes();
    return;
  }

  const filtered = KASHMIR_ROUTES.filter(
    (r) =>
      r.name.toLowerCase().includes(query) ||
      r.origin.toLowerCase().includes(query) ||
      r.destination.toLowerCase().includes(query) ||
      r.via.toLowerCase().includes(query) ||
      (r.stops && r.stops.some((s) => s.toLowerCase().includes(query)))
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:18px;">
        <p style="color:var(--text-muted); font-size:0.85rem;">No direct corridor found for "${query}".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  filtered.forEach((route) => {
    const card = document.createElement('div');
    card.className = 'route-item-card';
    card.innerHTML = `
      <div class="route-top-row">
        <span class="route-title">${route.name}</span>
        <span class="route-fare-badge">₹${route.baseFare}–₹${Math.round(route.baseFare + route.distanceKm * route.perKmRate)}</span>
      </div>
      <div class="route-sub-row">
        <span class="route-stops-via">📍 via ${route.via.substring(0, 38)}…</span>
        <span class="route-eta-tag">⚡ ${route.etaMins}m (${route.busReg})</span>
      </div>
    `;
    card.addEventListener('click', () => selectRoute(route));
    container.appendChild(card);
  });
}

// ─── TOAST NOTIFICATIONS ─────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
