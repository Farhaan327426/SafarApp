const TRANSLATIONS = {
  en: {
    appName: "SAFAR",
    tagline: "J&K Local Transit Companion",
    offlineStatus: "Offline Ready",
    onlineStatus: "Live Online",
    navCommuter: "Commuter",
    navConductor: "Conductor",
    navAdmin: "Admin",
    navSettings: "Settings",

    // Commuter View
    commuterTitle: "Local Bus Transit & Fare Guide",
    commuterSubtitle: "Verify exact Transport Department fares offline & track live local buses in Jammu & Kashmir.",
    fareCalcTitle: "Instant Fare Calculator",
    selectRegion: "Select Region",
    regionKashmir: "Kashmir Division",
    regionJammu: "Jammu Division",
    selectTerrain: "Select Terrain",
    terrainPlain: "Plain Terrain",
    terrainHilly: "Hilly / Mountainous",
    selectVehicle: "Vehicle Type",
    vehicleMiniBus: "Mini-Bus (25-35 seater)",
    vehicleTataMagic: "Tata Magic / Eco",
    vehicleSharedVan: "Shared Van / Sumo",
    enterDistance: "Distance (in Km)",
    calcFromRoute: "Or Pick Route Points",
    selectOrigin: "From (Origin)",
    selectDestination: "To (Destination)",
    concessionLabel: "Concession Category",
    concessionNone: "General (No Discount)",
    concessionStudent: "Student (50% Off)",
    concessionSenior: "Senior Citizen (25% Off)",
    concessionDisabled: "Specially Abled (50% Off)",
    calculateBtn: "Calculate Standard Fare",
    fareBreakdownTitle: "Official Fare Breakdown",
    baseFare: "Base Fare (Transport Department Slab)",
    perKmApplied: "Distance Rate",
    terrainSurcharge: "Terrain / Vehicle Surcharge",
    discountApplied: "Concession Discount",
    totalFare: "Total Verified Fare",
    disputeNotice: "This fare is calculated from official J&K Transport Department SRO notifications. Show this screen to resolve conductor disputes.",

    // Pass Purchase & Wallet
    passTitle: "Digital Transit Pass & Wallet",
    buyPassBtn: "Buy Digital Pass",
    walletBalance: "Wallet Balance",
    topupWalletBtn: "Add Credits (UPI)",
    dailyPass: "Daily Unlimited Pass (₹50)",
    weeklyPass: "Weekly Commuter Pass (₹250)",
    monthlyPass: "Monthly Student/Commuter Pass (₹800)",
    payUpiBtn: "Pay via UPI Intent",

    // Live Map
    liveMapTitle: "Live Buses Near You",
    searchRoutePlaceholder: "Search by Route (e.g. Srinagar, Anantnag, Jammu)",
    filterActiveOnly: "Active Trips Only",
    busNoLabel: "Vehicle No:",
    routeLabel: "Route:",
    etaLabel: "Est. Arrival:",
    lastUpdated: "Last Ping:",
    staleWarning: "Location >2 min old (Intermittent network)",
    trackOnMap: "Track Bus",
    followBusBtn: "Follow Bus Camera",

    // Conductor View
    conductorTitle: "Conductor & Driver Terminal",
    conductorSubtitle: "Broadcast live route location & resolve fare queries instantly.",
    startTripTitle: "Start New Trip",
    assignedRoute: "Select Assigned Route",
    vehicleRegNo: "Vehicle Reg. Number",
    startGpsBtn: "Start GPS Broadcast",
    stopGpsBtn: "End Trip & Stop Broadcast",
    tripActiveStatus: "LIVE TRIP BROADCASTING",
    pingsSent: "Location Pings Sent",
    passengersCarried: "Estimated Trip Earnings",
    quickDisputeResolver: "Quick Fare Lookup",
    tripHistory: "Daily Trip Log",
    todayEarnings: "Today's Earnings",
    weekEarnings: "Weekly Earnings",
    monthEarnings: "Monthly Earnings",

    // Admin View
    adminTitle: "Transit Regulatory Council Admin & Fare Management",
    adminSubtitle: "Edit fare slabs, manage routes & push updates to client apps.",
    fareSlabEditor: "Fare Slab Configuration",
    kmRatePlain: "Plain Rate (₹ / km)",
    kmRateHilly: "Hilly Rate (₹ / km)",
    minSlab3km: "0 - 3 km Slab (₹)",
    publishVersion: "Publish Fare Table Update",
    currentVersion: "Active Version:",
    publishedSuccess: "New fare slabs cached successfully across all offline clients!",
    routeCompletenessTitle: "Route Data Completeness Dashboard",
    gtfsImportTitle: "GTFS Feed Ingestion",

    // Settings & i18n
    settingsTitle: "App Settings & Preferences",
    languageSetting: "Interface Language",
    textSizeSetting: "Text Size Scaling",
    smallText: "Small (14px)",
    normalText: "Normal (16px)",
    largeText: "Large (18px)",
    aboutApp: "About SAFAR J&K"
  },
  hi: {
    appName: "सफ़र",
    tagline: "जम्मू व कश्मीर लोकल बस साथी",
    offlineStatus: "ऑफ़लाइन तैयार",
    onlineStatus: "लाइव ऑनलाइन",
    navCommuter: "यात्री",
    navConductor: "कंडक्टर/ड्राइवर",
    navAdmin: "एडमिन",
    navSettings: "सेटिंग्स",

    // Commuter View
    commuterTitle: "लोकल बस किराया एवं लाइव ट्रैकिंग",
    commuterSubtitle: "जम्मू-कश्मीर ट्रांजिट काउंसिल आधिकारिक किराया जांचें और लोकल बसें लाइव ट्रैक करें।",
    fareCalcTitle: "तुरंत किराया कैलकुलेटर",
    selectRegion: "क्षेत्र चुनें",
    regionKashmir: "कश्मीर संभाग",
    regionJammu: "जम्मू संभाग",
    selectTerrain: "मार्ग प्रकार चुनें",
    terrainPlain: "मैदानी क्षेत्र",
    terrainHilly: "पहाड़ी / दुर्गम",
    selectVehicle: "वाहन प्रकार",
    vehicleMiniBus: "मिनी-बस (25-35 सीटर)",
    vehicleTataMagic: "टाटा मैजिक / इको",
    vehicleSharedVan: "शेयर्ड वैन / सूमो",
    enterDistance: "दूरी (किलोमीटर में)",
    calcFromRoute: "या रूट चुनें",
    selectOrigin: "कहां से (प्रस्थान)",
    selectDestination: "कहां तक (गंतव्य)",
    concessionLabel: "छूट श्रेणी",
    concessionNone: "सामान्य (कोई छूट नहीं)",
    concessionStudent: "छात्र (50% छूट)",
    concessionSenior: "वरिष्ठ नागरिक (25% छूट)",
    concessionDisabled: "दिव्यांग (50% छूट)",
    calculateBtn: "किराया गणना करें",
    fareBreakdownTitle: "आधिकारिक किराया विवरण",
    baseFare: "मूल किराया (एसआरटीए स्लैब)",
    perKmApplied: "प्रति किमी दर",
    terrainSurcharge: "पहाड़ी/वाहन प्रभार",
    discountApplied: "छूट (डिस्काउंट)",
    totalFare: "कुल देय किराया",
    disputeNotice: "यह किराया आधिकारिक J&K Transit Regulatory Council नियमों से परिकलित है।",

    // Pass Purchase & Wallet
    passTitle: "डिजिटल बस पास एवं वॉलेट",
    buyPassBtn: "डिजिटल पास खरीदें",
    walletBalance: "वॉलेट बैलेंस",
    topupWalletBtn: "क्रेडिट जोड़ें (UPI)",
    dailyPass: "दैनिक असीमित पास (₹50)",
    weeklyPass: "साप्ताहिक पास (₹250)",
    monthlyPass: "मासिक पास (₹800)",
    payUpiBtn: "UPI द्वारा भुगतान करें",

    // Live Map
    liveMapTitle: "आपके पास लाइव बसें",
    searchRoutePlaceholder: "रूट खोजें (जैसे श्रीनगर, अनंतनाग, जम्मू)",
    filterActiveOnly: "केवल सक्रिय बसें",
    busNoLabel: "गाड़ी संख्या:",
    routeLabel: "मार्ग:",
    etaLabel: "अनुमानित समय:",
    lastUpdated: "अंतिम स्थिति:",
    staleWarning: "स्थान 2 मिनट से पुराना (धीमा नेटवर्क)",
    trackOnMap: "मैप पर देखें",
    followBusBtn: "बस कैमरा फॉलो करें",

    // Conductor View
    conductorTitle: "कंडक्टर व ड्राइवर टर्मिनल",
    conductorSubtitle: "लाइव बस लोकेशन प्रसारित करें और किराया विवाद तुरंत सुलझाएं।",
    startTripTitle: "नई यात्रा शुरू करें",
    assignedRoute: "निर्धारित रूट चुनें",
    vehicleRegNo: "गाड़ी नंबर दर्ज करें",
    startGpsBtn: "जीपीएस ब्रॉडकास्ट शुरू करें",
    stopGpsBtn: "यात्रा समाप्त करें",
    tripActiveStatus: "लाइव यात्रा प्रसारित हो रही है",
    passengersCarried: "अनुमानित आज की कमाई",
    quickDisputeResolver: "त्वरित किराया खोज",
    tripHistory: "दैनिक ट्रिप लॉग",
    todayEarnings: "आज की कमाई",
    weekEarnings: "इस सप्ताह की कमाई",
    monthEarnings: "इस महीने की कमाई",

    // Admin View
    adminTitle: "ट्रांजिट काउंसिल एडमिन एवं किराया प्रबंधन",
    adminSubtitle: "किराया स्लैब संपादित करें और अपडेट प्रकाशित करें।",
    fareSlabEditor: "किराया स्लैब कॉन्फ़िगरेशन",
    publishVersion: "नया किराया अपडेट प्रकाशित करें",
    currentVersion: "सक्रिय संस्करण:",
    publishedSuccess: "नया किराया स्लैब सहेज दिया गया!",
    routeCompletenessTitle: "रूट डेटा पूर्णता डैशबोर्ड",
    gtfsImportTitle: "GTFS फ़ीड आयात",

    // Settings
    settingsTitle: "ऐप सेटिंग्स एवं प्राथमिकताएं",
    languageSetting: "इंटरफेस भाषा / Language",
    textSizeSetting: "अक्षर आकार (Text Size)",
    smallText: "छोटा (14px)",
    normalText: "सामान्य (16px)",
    largeText: "बड़ा (18px)",
    aboutApp: "सफ़र J&K के बारे में"
  },
  ur: {
    appName: "سفر",
    tagline: "جموں و کشمیر لوکل ٹرانزٹ گائیڈ",
    offlineStatus: "آف لائن تیار",
    onlineStatus: "لائیو آن لائن",
    navCommuter: "مسافر",
    navConductor: "کنڈکٹر",
    navAdmin: "ایڈمن",
    navSettings: "سیٹنگز",

    commuterTitle: "مقامی بس کرایہ اور لائیو ٹریکنگ",
    commuterSubtitle: "آف لائن درست کرایہ چیک کریں اور بسیں لائیو ٹریک کریں۔",
    fareCalcTitle: "فوری کرایہ کیلکولیٹر",
    selectRegion: "علاقہ منتخب کریں",
    regionKashmir: "کشمیر ڈویژن",
    regionJammu: "جموں ڈویژن",
    selectTerrain: "علاقہ کی نوعیت",
    terrainPlain: "میدانی علاقہ",
    terrainHilly: "پہاڑی علاقہ",
    selectVehicle: "گاڑی کی قسم",
    enterDistance: "فاصلہ (کلومیٹر میں)",
    calculateBtn: "کرایہ معلوم کریں",
    totalFare: "کل منظور شدہ کرایہ",
    disputeNotice: "یہ کرایہ آفیشل محکمہ ٹرانسپورٹ کے قوانین کے مطابق ہے۔",

    passTitle: "ڈیجیٹل بس پاس اور والٹ",
    buyPassBtn: "ڈیجیٹل پاس خریدیں",
    walletBalance: "والٹ بیلنس",
    payUpiBtn: "UPI ادائیگی",

    liveMapTitle: "قریب ترین بسیں",
    followBusBtn: "بس ٹریک کریں",
    conductorTitle: "کنڈکٹر و ڈرائیور پورٹل",
    todayEarnings: "آج کی کل آمدنی",
    routeCompletenessTitle: "روٹ کا مکمل جائزہ",

    settingsTitle: "ایپ سیٹنگز",
    languageSetting: "زبان منتخب کریں",
    textSizeSetting: "تحریر کا سائز",
    smallText: "چھوٹا (14px)",
    normalText: "نارمل (16px)",
    largeText: "بڑا (18px)",
    aboutApp: "سفر جموں و کشمیر"
  }
};

let currentLanguage = localStorage.getItem("safar_lang") || "en";
if (currentLanguage !== "en" && currentLanguage !== "ur" && currentLanguage !== "hi") {
  currentLanguage = "en";
}
let currentTextSize = localStorage.getItem("safar_text_size") || "normal";

function applyTranslations(lang) {
  if (!TRANSLATIONS[lang]) lang = "en";
  currentLanguage = lang;
  localStorage.setItem("safar_lang", lang);

  // Update HTML lang attribute and font family class
  const root = document.documentElement;
  root.lang = lang;

  // Remove existing lang font classes
  root.classList.remove("lang-en", "lang-hi", "lang-ur");
  root.classList.add(`lang-${lang}`);

  // Set RTL strictly for Urdu
  if (lang === "ur") {
    root.dir = "rtl";
  } else {
    root.dir = "ltr";
  }

  // Update all elements with data-i18n
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
        el.placeholder = TRANSLATIONS[lang][key];
      } else {
        el.textContent = TRANSLATIONS[lang][key];
      }
    }
  });
}

function setTextSize(size) {
  currentTextSize = size;
  localStorage.setItem("safar_text_size", size);
  const root = document.documentElement;
  
  if (size === "small") {
    root.style.fontSize = "14px";
  } else if (size === "large") {
    root.style.fontSize = "18px";
  } else {
    root.style.fontSize = "16px";
  }
}

// Auto Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  applyTranslations(currentLanguage);
  setTextSize(currentTextSize);
});
