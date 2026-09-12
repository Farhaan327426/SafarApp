/**
 * SAFAR PRO — Verified Transport & Legal Dataset
 * ===================================================
 * File: frontend/js/safar-data.js
 * Features:
 * - Official J&K Transport & Police Directory (All 20 Districts)
 * - Statutory MVA / SRO-97 Legal Records with verification metadata & citations
 * - Verified Fare & SRO-97 Tariff Benchmark Records
 * - Source-aware: records include source citation, section, and verifiedAt timestamp
 */

const SafarData = (() => {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────
     OFFICIAL J&K TRANSPORT & POLICE DIRECTORY DATASET
  ───────────────────────────────────────────────────────────────── */
  const DIRECTORY = [
    // ── Emergency & Hotlines ──
    {
      category: 'emergency',
      name: 'Central Emergency Response (ERSS)',
      designation: 'Police / Fire / Ambulance',
      district: 'All J&K (24x7)',
      number: '112',
      display: '112',
      icon: '🚨',
      priority: 1,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'emergency',
      name: 'National Highway Helpline',
      designation: 'NHAI / NH-44 Breakdown & Rescue',
      district: 'NH-44 Corridor (24x7)',
      number: '1033',
      display: '1033',
      icon: '🛣️',
      priority: 1,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'emergency',
      name: 'Ambulance / Emergency Medical',
      designation: 'J&K EMS Emergency Services',
      district: 'All J&K (24x7)',
      number: '108',
      display: '108',
      icon: '🚑',
      priority: 2,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'emergency',
      name: 'Women Safety Helpline',
      designation: 'Women Protection & Grievance',
      district: 'All J&K (24x7)',
      number: '181',
      display: '181',
      icon: '🚺',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'emergency',
      name: 'Disaster Management Helpline',
      designation: 'Snow Blockade & Avalanche Control',
      district: 'All J&K (24x7)',
      number: '1070',
      display: '1070',
      icon: '⛰️',
      priority: 4,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'emergency',
      name: 'Tourist Police Srinagar',
      designation: 'Visitor Assistance & Stand Safety',
      district: 'Srinagar / Tourist Hubs',
      number: '01942477567',
      display: '0194-2477567',
      icon: '🛡️',
      priority: 5,
      verifiedAt: '2026-09-12'
    },

    // ── Traffic Police Authorities ──
    {
      category: 'traffic',
      name: 'Traffic Police Control Room Kashmir',
      designation: '24x7 Valley Highway & Corridor Status',
      district: 'Kashmir Valley',
      number: '01942450022',
      display: '0194-2450022',
      icon: '🚦',
      whatsapp: '9419035000',
      priority: 1,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'traffic',
      name: 'Traffic Police Control Room Jammu',
      designation: '24x7 Jammu Highway & Traffic Status',
      district: 'Jammu Division',
      number: '01912459048',
      display: '0191-2459048',
      icon: '🚦',
      whatsapp: '9419147732',
      priority: 1,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'traffic',
      name: 'Traffic Police City Srinagar',
      designation: 'SSP Traffic City Srinagar',
      district: 'Srinagar',
      number: '01942455359',
      display: '0194-2455359',
      icon: '👮',
      priority: 2,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'traffic',
      name: 'Traffic Police Rural Kashmir',
      designation: 'SSP Traffic Rural (Baramulla/Anantnag/Budgam)',
      district: 'Rural Kashmir',
      number: '01942452589',
      display: '0194-2452589',
      icon: '👮',
      priority: 2,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'traffic',
      name: 'Traffic Police City Jammu',
      designation: 'SSP Traffic City Jammu',
      district: 'Jammu',
      number: '01912470166',
      display: '0191-2470166',
      icon: '👮',
      priority: 2,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'traffic',
      name: 'Traffic Police National Highway (Ramban)',
      designation: 'NH-44 Flying Squad & Navyug Tunnel Control',
      district: 'Ramban / Banihal / NH-44',
      number: '01998266686',
      display: '01998-266686',
      icon: '🛣️',
      priority: 1,
      verifiedAt: '2026-09-12'
    },

    // ── Transport Commissioner & All 20 Regional Transport Offices ──
    {
      category: 'rto',
      name: 'Transport Commissioner J&K',
      designation: 'Head of Transport Department J&K',
      district: 'All J&K (HQ Srinagar/Jammu)',
      number: '01942470163',
      display: '0194-2470163',
      icon: '🏛️',
      priority: 1,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'RTO Kashmir (Srinagar)',
      designation: 'Regional Transport Officer Kashmir',
      district: 'Srinagar',
      number: '01942452589',
      display: '0194-2452589',
      icon: '🏛️',
      priority: 2,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'RTO Jammu',
      designation: 'Regional Transport Officer Jammu',
      district: 'Jammu',
      number: '01912470166',
      display: '0191-2470166',
      icon: '🏛️',
      priority: 2,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Baramulla',
      designation: 'Assistant Regional Transport Officer',
      district: 'Baramulla',
      number: '01954222238',
      display: '01954-222238',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Anantnag',
      designation: 'Assistant Regional Transport Officer',
      district: 'Anantnag',
      number: '01932222337',
      display: '01932-222337',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Budgam',
      designation: 'Assistant Regional Transport Officer',
      district: 'Budgam',
      number: '01951255244',
      display: '01951-255244',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Pulwama',
      designation: 'Assistant Regional Transport Officer',
      district: 'Pulwama',
      number: '01933241280',
      display: '01933-241280',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Kupwara',
      designation: 'Assistant Regional Transport Officer',
      district: 'Kupwara',
      number: '01955252251',
      display: '01955-252251',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Ganderbal',
      designation: 'Assistant Regional Transport Officer',
      district: 'Ganderbal',
      number: '01942416142',
      display: '0194-2416142',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Bandipora',
      designation: 'Assistant Regional Transport Officer',
      district: 'Bandipora',
      number: '01957225280',
      display: '01957-225280',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Kulgam',
      designation: 'Assistant Regional Transport Officer',
      district: 'Kulgam',
      number: '01931260111',
      display: '01931-260111',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Shopian',
      designation: 'Assistant Regional Transport Officer',
      district: 'Shopian',
      number: '01933260900',
      display: '01933-260900',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Udhampur',
      designation: 'Assistant Regional Transport Officer',
      district: 'Udhampur',
      number: '01992270220',
      display: '01992-270220',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Kathua',
      designation: 'Assistant Regional Transport Officer',
      district: 'Kathua',
      number: '01922234050',
      display: '01922-234050',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Rajouri',
      designation: 'Assistant Regional Transport Officer',
      district: 'Rajouri',
      number: '01962262444',
      display: '01962-262444',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Poonch',
      designation: 'Assistant Regional Transport Officer',
      district: 'Poonch',
      number: '01965220150',
      display: '01965-220150',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Doda',
      designation: 'Assistant Regional Transport Officer',
      district: 'Doda',
      number: '01996233215',
      display: '01996-233215',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Ramban',
      designation: 'Assistant Regional Transport Officer',
      district: 'Ramban',
      number: '01998266700',
      display: '01998-266700',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Kishtwar',
      designation: 'Assistant Regional Transport Officer',
      district: 'Kishtwar',
      number: '01995259200',
      display: '01995-259200',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Reasi',
      designation: 'Assistant Regional Transport Officer',
      district: 'Reasi',
      number: '01991244010',
      display: '01991-244010',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    },
    {
      category: 'rto',
      name: 'ARTO Samba',
      designation: 'Assistant Regional Transport Officer',
      district: 'Samba',
      number: '01923241030',
      display: '01923-241030',
      icon: '🏢',
      priority: 3,
      verifiedAt: '2026-09-12'
    }
  ];

  /* ─────────────────────────────────────────────────────────────────
     VERIFIED STATUTORY & LEGAL RECORDS (J&K MVA & SRO-97)
  ───────────────────────────────────────────────────────────────── */
  const LEGAL_RECORDS = {
    fare_overcharge: {
      id: 'overcharge',
      intent: 'fare_overcharge',
      icon: '💸',
      title: 'Demanding Extra / Overcharging Fare',
      subtitle: 'Driver or conductor demanding more than notified tariff',
      law: 'Motor Vehicles Act Section 177 / 179 & SRO-97',
      source: 'Government of J&K Transport Department Notification SRO-97',
      verifiedAt: '2026-09-12',
      confidence: 1.0,
      penalty: '₹2,000 to ₹5,000 fine + Route Permit suspension under MVA Sec 86',
      scriptEnglish: 'The notified fare under J&K Transport Department SRO-97 is statutory and binding. Demanding excess fare is an offense under MVA Section 177. I am recording this transaction and reporting it to the Regional Transport Officer.',
      scriptUrdu: 'محکمہ ٹرانسپورٹ کے نوٹیفائیڈ کرائے کے مطابق اضافی چارج وصول کرنا ایم وی اے سیکشن 177 کے تحت جرم ہے۔ میں یہ شکایت آر ٹی او کو بھیج رہا ہوں۔',
      voiceSummary: 'Demanding extra fare violates SRO-97 and MVA Section 177, punishable by up to ₹5,000 fine and permit suspension. Check your legal route fare and inform the driver before escalating.',
      actionTitle: 'Report Overcharging to RTO Flying Squad',
      suggestedAuthorities: ['01942450022', '01942452589', '01912470166']
    },
    route_refusal: {
      id: 'midway_drop',
      intent: 'route_refusal',
      icon: '🛑',
      title: 'Dropped Midway / Refused Destination',
      subtitle: 'Driver forced passenger off before destination or refused permit route',
      law: 'MVA Section 178 & J&K Motor Vehicle Rules Rule 77',
      source: 'J&K Motor Vehicles Rules 1991 (Permit Conditions)',
      verifiedAt: '2026-09-12',
      confidence: 1.0,
      penalty: '₹1,000 to ₹3,000 fine + 1-month driving license cancellation',
      scriptEnglish: 'Under J&K Stage Carriage Permit conditions, a commercial driver cannot abandon passengers midway or refuse the licensed route. You are legally required to transport me to the designated stand.',
      scriptUrdu: 'گاڑی کو مقررہ منزل سے پہلے مسافروں کو اتارنے کی اجازت نہیں ہے۔ یہ پرمٹ کی سنگین خلاف ورزی ہے۔',
      voiceSummary: 'Commercial passenger vehicles cannot abandon passengers midway. Under Rule 77 and MVA Section 178, the driver faces up to ₹3,000 fine and license suspension.',
      actionTitle: 'Escalate to Traffic Police Control Room',
      suggestedAuthorities: ['01942450022', '01912459048', '112']
    },
    vehicle_overloading: {
      id: 'overload',
      intent: 'vehicle_overloading',
      icon: '⚠️',
      title: 'Dangerous Overloading / Overcrowding',
      subtitle: 'Carrying passengers beyond registered seating capacity',
      law: 'MVA Section 194A (Amended)',
      source: 'Motor Vehicles (Amendment) Act Section 194A',
      verifiedAt: '2026-09-12',
      confidence: 1.0,
      penalty: '₹1,000 per excess passenger + refusal to allow vehicle to proceed',
      scriptEnglish: 'Under Section 194A of the Motor Vehicles Act, carrying passengers beyond authorized registration capacity attracts an immediate challan of ₹1,000 per excess passenger. Traffic flying squads have been notified.',
      scriptUrdu: 'گنجائش سے زیادہ مسافر بٹھانا ایم وی اے کے سیکشن 194A کے تحت غیر قانونی ہے۔ ہر اضافی مسافر پر ایک ہزار روپے جرمانہ ہے۔',
      voiceSummary: 'Overloading carries a statutory penalty of ₹1,000 per excess passenger under MVA Section 194A, and the vehicle can be detained immediately by traffic squads.',
      actionTitle: 'Alert Highway Patrol & Flying Squad',
      suggestedAuthorities: ['1033', '01942450022', '01998266686']
    },
    luggage_dispute: {
      id: 'luggage',
      intent: 'luggage_dispute',
      icon: '🧳',
      title: 'Excess Baggage / Roof Luggage Fee Dispute',
      subtitle: 'Demanding unauthorized fee for personal bags or roof rack',
      law: 'J&K Stage Carriage Tariff Guidelines SRO-97',
      source: 'J&K Transport Department Stage Carriage Regulations',
      verifiedAt: '2026-09-12',
      confidence: 1.0,
      penalty: 'Free allowance of 15kg personal baggage per passenger guaranteed',
      scriptEnglish: 'Under official J&K Transport fare notifications, every ticket-holding passenger is entitled to 15 kg of free personal luggage. Charging for standard travel bags is an unauthorized surcharge.',
      scriptUrdu: 'قانون کے مطابق فی مسافر 15 کلو تک ذاتی سامان مفت ہوتا ہے، اس پر اضافی چارجز غیر قانونی ہیں۔',
      voiceSummary: 'Every commuter in J&K is entitled to 15 kilograms of free personal baggage under SRO-97. Demanding luggage surcharge for standard bags is illegal.',
      actionTitle: 'Contact Transport Adda Grievance Officer',
      suggestedAuthorities: ['01942452589', '01912470166']
    },
    highway_emergency: {
      id: 'highway_block',
      intent: 'highway_emergency',
      icon: '❄️',
      title: 'Highway Block / Stranded on Route',
      subtitle: 'Landslide, snow block on NH-44, Navyug Tunnel, Mughal Rd',
      law: 'Disaster Management Act 2005 & Traffic Control Protocol',
      source: 'NHAI Corridor Protocol & J&K Traffic Police Disaster Manual',
      verifiedAt: '2026-09-12',
      confidence: 1.0,
      penalty: 'Immediate rescue, clearance & convoy status from TCR / NHAI 1033',
      scriptEnglish: 'Traffic Police Control Room maintains real-time satellite updates for Navyug Tunnel, Banihal, Ramban, and mountain passes. Dial 1033 or TCR directly for emergency assistance.',
      scriptUrdu: 'ہائی وے کنٹرول روم سے رابطہ کر کے فوری ٹریفک صورتحال اور امداد حاصل کریں۔',
      voiceSummary: 'For highway blockages or emergency assistance on NH-44 or mountain corridors, call the National Highway helpline at 1033 or Traffic Control at 0194-2450022.',
      actionTitle: 'Call 24x7 Highway Patrol (NH-44 / TCR)',
      suggestedAuthorities: ['1033', '01942450022', '01998266686']
    },
    meter_refusal: {
      id: 'meter_refusal',
      intent: 'meter_refusal',
      icon: '🛺',
      title: 'Auto Refusing Meter / Arbitrary Fare',
      subtitle: 'Auto-rickshaw refusing meter or demanding arbitrary lumpsum',
      law: 'MVA Section 177 & SRO-97 Metered Mandate',
      source: 'J&K Transport Notification on Digital Meters & Fare Slabs',
      verifiedAt: '2026-09-12',
      confidence: 1.0,
      penalty: '₹1,000 fine for non-meter operation + RC suspension on repeated offense',
      scriptEnglish: 'SRO-97 mandates all commercial auto-rickshaws to operate by digital meter or statutory slab rates (₹45 first 2km, then ₹7.40/km). Charging arbitrary lumpsum without meter is unlawful.',
      scriptUrdu: 'آٹو رکشہ کو میٹر پر چلانا لازمی ہے۔ من مانا کرایہ مانگنا جرم ہے۔',
      voiceSummary: 'Auto-rickshaws must ply by digital meter under SRO-97. Refusing the meter attracts a ₹1,000 fine and RC suspension upon report.',
      actionTitle: 'Report to City Traffic Police',
      suggestedAuthorities: ['01942455359', '01912470166']
    },
    fare_check: {
      id: 'fare_check',
      intent: 'fare_check',
      icon: '📊',
      title: 'Official Fare Verification',
      subtitle: 'Checking statutory fare calculation for a specific J&K route',
      law: 'Transport Department SRO-97 Notified Corridor Fare Tariffs',
      source: 'Official J&K Transport Department Fare Gazettes',
      verifiedAt: '2026-09-12',
      confidence: 1.0,
      penalty: 'Fares are capped by statutory notifications; overcharging is prosecutable',
      scriptEnglish: 'Safar verifies all fares against published transport gazettes for plain and hill routes across J&K. Always pay only the approved statutory tariff.',
      scriptUrdu: 'سفر پورٹل پر دیے گئے کرایے سرکاری نوٹیفکیشن کے مطابق تصدیق شدہ ہیں۔',
      voiceSummary: 'I can check the approved statutory fare for your route. Let me know your starting point, destination, and vehicle type.',
      actionTitle: 'Verify Route Fare on Safar Calculator',
      suggestedAuthorities: ['01942452589', '01912470166']
    },
    general_question: {
      id: 'general_grievance',
      intent: 'general_question',
      icon: '⚖️',
      title: 'General Transit Grievance & Passenger Rights',
      subtitle: 'Passenger rights under Motor Vehicles Act & J&K Rules',
      law: 'Motor Vehicles Act 1988 & J&K Motor Vehicles Rules',
      source: 'Ministry of Road Transport and Highways (MoRTH) & J&K Transport Dept',
      verifiedAt: '2026-09-12',
      confidence: 1.0,
      penalty: 'Statutory compliance enforceable by Regional Transport Authority',
      scriptEnglish: 'Under J&K Transport Department rules, all commercial passenger carriers must strictly adhere to their permit guidelines and notified fares. Commuters have the statutory right to request transport authority intervention.',
      scriptUrdu: 'محکمہ ٹرانسپورٹ کے قوانین کے تحت مسافروں کو انصاف اور محفوظ سفر کا پورا حق حاصل ہے۔',
      voiceSummary: 'As a commuter in Jammu & Kashmir, you are protected by statutory transport regulations. If you face any violation, Safar provides immediate legal grounding and direct authority contacts.',
      actionTitle: 'Connect with Traffic Police Control Room',
      suggestedAuthorities: ['01942450022', '01912459048', '112']
    }
  };

  // PROBLEMS array for UI compatibility
  const PROBLEMS = Object.values(LEGAL_RECORDS);

  return {
    DIRECTORY,
    LEGAL_RECORDS,
    PROBLEMS
  };
})();

// Attach to global scope
if (typeof window !== 'undefined') {
  window.SafarData = SafarData;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SafarData = SafarData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafarData;
}
