/**
 * SAFAR — Multilingual & RTL Translation Engine
 * Zero-dependency internationalization module for English, Hindi (Devanagari),
 * Urdu (Nastaliq RTL), and Kashmiri (Koshur Nastaliq RTL).
 */

const SUPPORTED_LANGS = ['en', 'hi', 'ur', 'ks'];
const RTL_LANGS = ['ur', 'ks'];
const STORAGE_KEY = 'safar_lang';

let currentLang = 'en';
let translations = {};

// Fallback embedded English dictionary
const defaultTranslations = {
  app_name: "SAFAR",
  app_tagline: "Verified Fares & Live Bus Tracking (J&K)",
  home_title: "Find your bus",
  route_list: "Routes",
  fare_calculator: "Fare Calculator",
  live_tracking: "Live Tracking",
  pay_fare: "Pay Fare",
  offline_banner: "Offline — showing cached transit schedules",
  last_updated_ago: "updated {{minutes}} min ago",
  language: "Language",
  select_route: "Select Route",
  boarding_stop: "Boarding Stop",
  destination_stop: "Destination Stop",
  fare: "Fare",
  fare_amount: "Fare: ₹{{amount}}",
  confirm_payment: "Confirm Payment",
  otp_verification: "OTP Verification",
  enter_otp: "Enter 4-Digit OTP",
  verify: "Verify & Board",
  driver_shift_start: "Start Shift",
  driver_shift_end: "End Shift",
  earnings: "Earnings",
  withdraw: "Withdraw",
  admin_dashboard: "Admin Dashboard",
  alerts: "Alerts",
  no_alerts: "No active alerts",
  retry: "Retry",
  cancel: "Cancel",
  sro_badge: "Official SRO Verified Fare",
  distance_km: "{{distance}} km",
  student_concession: "Student Concession (50%)",
  general_fare: "General Commuter",
  emergency_sos: "Emergency SOS",
  passenger_count: "Passengers: {{count}}"
};

async function loadTranslations(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'en';

  try {
    const res = await fetch(`/locales/${lang}.json`);
    if (res && res.ok) {
      translations = await res.json();
    } else {
      translations = { ...defaultTranslations };
    }
  } catch (err) {
    translations = { ...defaultTranslations };
  }

  currentLang = lang;
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }
}

function t(key, params = {}) {
  let template = translations[key] || defaultTranslations[key] || key;
  for (const [param, value] of Object.entries(params)) {
    template = template.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), String(value));
  }
  return template;
}

function applyStaticTranslations() {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key));
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (key) el.setAttribute('aria-label', t(key));
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(key));
  });
}

async function setLanguage(lang) {
  await loadTranslations(lang);
  applyStaticTranslations();

  if (typeof document !== 'undefined') {
    const switcher = document.getElementById('lang-switcher');
    if (switcher) switcher.value = currentLang;
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
  }
}

async function initI18n() {
  let savedLang = 'en';
  if (typeof localStorage !== 'undefined') {
    try {
      savedLang = localStorage.getItem(STORAGE_KEY) || 'en';
    } catch (e) {}
  }

  await setLanguage(savedLang);

  if (typeof document !== 'undefined') {
    const switcher = document.getElementById('lang-switcher');
    if (switcher) {
      switcher.value = currentLang;
      switcher.addEventListener('change', (e) => {
        setLanguage(e.target.value);
      });
    }
  }
}

function getCurrentLang() {
  return currentLang;
}

function isRTL() {
  return RTL_LANGS.includes(currentLang);
}

function injectTranslationsForTest(lang, customDict) {
  currentLang = lang;
  translations = { ...customDict };
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  }
}

export {
  t,
  setLanguage,
  initI18n,
  loadTranslations,
  applyStaticTranslations,
  getCurrentLang,
  isRTL,
  injectTranslationsForTest,
  SUPPORTED_LANGS,
  RTL_LANGS
};
