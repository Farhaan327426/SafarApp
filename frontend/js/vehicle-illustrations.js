// SafarApp - High-Definition Original Vector Vehicle Illustrations (Copyright-free, SVG)
// Designed specifically for J&K transit ecosystem with crisp, standardized 200x90 viewBox

window.VEHICLE_ILLUSTRATIONS = {
  "shared-cab": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="sumoBody" x1="0" y1="20" x2="0" y2="70" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <linearGradient id="sumoTarp" x1="0" y1="10" x2="0" y2="25" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
    <linearGradient id="sumoGlass" x1="0" y1="25" x2="0" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="84" ry="4" fill="#0f172a" opacity="0.22"/>
  <!-- Roof Rack & Orange Luggage Tarp -->
  <rect x="52" y="11" width="76" height="13" rx="3" fill="url(#sumoTarp)"/>
  <path d="M 66 11 L 66 24 M 82 11 L 82 24 M 98 11 L 98 24 M 114 11 L 114 24" stroke="#fed7aa" stroke-width="1.2"/>
  <rect x="46" y="21" width="90" height="4" rx="1.5" fill="#334155"/>
  <path d="M 52 25 L 52 29 M 80 25 L 80 29 M 108 25 L 108 29 M 132 25 L 132 29" stroke="#334155" stroke-width="1.8" stroke-linecap="round"/>
  <!-- Main Sumo / Bolero Body -->
  <path d="M 24 44 L 32 30 C 34 29 37 28 41 28 L 138 28 C 143 28 147 31 150 36 L 163 51 L 176 54 C 180 55 182 58 182 62 L 182 68 C 182 71 180 73 176 73 L 157 73 A 14 14 0 0 1 129 73 L 69 73 A 14 14 0 0 1 41 73 L 24 73 C 21 73 19 71 19 68 L 19 49 C 19 46 21 44 24 44 Z" fill="url(#sumoBody)" stroke="#94a3b8" stroke-width="0.8"/>
  <!-- Rear Spare Wheel Mounted -->
  <rect x="14" y="42" width="7" height="25" rx="3.5" fill="#1e293b"/>
  <!-- Windows -->
  <path d="M 40 32 L 67 32 L 67 48 L 33 48 L 33 37 C 33 34 36 32 40 32 Z" fill="url(#sumoGlass)"/>
  <rect x="71" y="32" width="34" height="16" rx="1" fill="url(#sumoGlass)"/>
  <path d="M 109 32 L 135 32 C 138 32 141 34 143 37 L 151 48 L 109 48 Z" fill="url(#sumoGlass)"/>
  <!-- Windshield Reflection -->
  <path d="M 132 34 L 145 46" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
  <!-- Door Cuts & Handles -->
  <line x1="70" y1="32" x2="70" y2="67" stroke="#94a3b8" stroke-width="1"/>
  <line x1="108" y1="32" x2="108" y2="67" stroke="#94a3b8" stroke-width="1"/>
  <rect x="73" y="52" width="7" height="2" rx="1" fill="#475569"/>
  <rect x="111" y="52" width="7" height="2" rx="1" fill="#475569"/>
  <!-- Dark Side Protective Cladding -->
  <path d="M 20 64 L 41 64 A 14 14 0 0 1 69 64 L 129 64 A 14 14 0 0 1 157 64 L 180 64 L 180 69 L 157 69 A 14 14 0 0 1 129 69 L 69 69 A 14 14 0 0 1 41 69 L 20 69 Z" fill="#334155"/>
  <!-- Headlamp & Grille Front -->
  <path d="M 178 55 L 182 55 L 182 62 L 178 62 Z" fill="#fef08a" stroke="#eab308" stroke-width="0.5"/>
  <rect x="178" y="63" width="3" height="3" rx="0.5" fill="#f97316"/>
  <rect x="172" y="66" width="10" height="5" rx="1" fill="#1e293b"/>
  <!-- Wheels -->
  <g>
    <circle cx="55" cy="73" r="13" fill="#1e293b"/>
    <circle cx="55" cy="73" r="8" fill="#64748b"/>
    <circle cx="55" cy="73" r="4" fill="#cbd5e1"/>
    <circle cx="55" cy="73" r="1.5" fill="#1e293b"/>
  </g>
  <g>
    <circle cx="143" cy="73" r="13" fill="#1e293b"/>
    <circle cx="143" cy="73" r="8" fill="#64748b"/>
    <circle cx="143" cy="73" r="4" fill="#cbd5e1"/>
    <circle cx="143" cy="73" r="1.5" fill="#1e293b"/>
  </g>
</svg>`,

  "mini-bus": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="matadorCream" x1="0" y1="20" x2="0" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fffdf5"/>
      <stop offset="100%" stop-color="#ede4c8"/>
    </linearGradient>
    <linearGradient id="matadorBlue" x1="0" y1="48" x2="0" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="60%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="88" ry="4" fill="#0f172a" opacity="0.22"/>
  <!-- Destination Header Board -->
  <rect x="70" y="14" width="56" height="8" rx="2" fill="#1e3a8a" stroke="#dbeafe" stroke-width="0.8"/>
  <text x="75" y="20" fill="#fef08a" font-size="5" font-weight="900" font-family="sans-serif" letter-spacing="0.5">TATA 407 MATADOR</text>
  <!-- Upper Cream Body -->
  <path d="M 22 30 C 22 24 28 20 36 20 L 152 20 C 162 20 171 25 174 34 L 178 48 L 22 48 Z" fill="url(#matadorCream)"/>
  <!-- Lower Royal Blue Body -->
  <path d="M 22 48 L 178 48 L 183 56 C 185 62 182 70 176 72 L 160 72 A 13 13 0 0 1 134 72 L 76 72 A 13 13 0 0 1 50 72 L 22 72 Z" fill="url(#matadorBlue)"/>
  <!-- Red Transit Accent Stripe -->
  <rect x="22" y="47" width="158" height="3" fill="#dc2626"/>
  <!-- Bus Windows Row -->
  <g fill="#1e293b">
    <rect x="26" y="24" width="16" height="20" rx="1.5"/>
    <rect x="46" y="24" width="22" height="20" rx="1.5"/>
    <rect x="72" y="24" width="22" height="20" rx="1.5"/>
    <rect x="98" y="24" width="22" height="20" rx="1.5"/>
    <rect x="124" y="24" width="22" height="20" rx="1.5"/>
    <!-- Curved Driver Cab Windshield -->
    <path d="M 150 24 L 165 24 C 170 27 172 32 174 42 L 150 42 Z"/>
  </g>
  <!-- Window Dividers -->
  <line x1="57" y1="24" x2="57" y2="44" stroke="#94a3b8" stroke-width="0.8"/>
  <line x1="83" y1="24" x2="83" y2="44" stroke="#94a3b8" stroke-width="0.8"/>
  <line x1="109" y1="24" x2="109" y2="44" stroke="#94a3b8" stroke-width="0.8"/>
  <line x1="135" y1="24" x2="135" y2="44" stroke="#94a3b8" stroke-width="0.8"/>
  <!-- Grille & Headlamp -->
  <rect x="179" y="54" width="4" height="8" rx="1.5" fill="#fef08a" stroke="#ca8a04" stroke-width="0.6"/>
  <rect x="176" y="63" width="6" height="3" rx="1" fill="#475569"/>
  <!-- Rear Wheels (Dual Heavy-Duty) -->
  <g>
    <circle cx="61" cy="72" r="13" fill="#1e293b"/>
    <circle cx="65" cy="72" r="13" fill="#1e293b"/>
    <circle cx="63" cy="72" r="8" fill="#64748b"/>
    <circle cx="63" cy="72" r="4" fill="#cbd5e1"/>
    <circle cx="63" cy="72" r="1.5" fill="#1e293b"/>
  </g>
  <!-- Front Steering Wheel -->
  <g>
    <circle cx="147" cy="72" r="13" fill="#1e293b"/>
    <circle cx="147" cy="72" r="8" fill="#64748b"/>
    <circle cx="147" cy="72" r="4" fill="#cbd5e1"/>
    <circle cx="147" cy="72" r="1.5" fill="#1e293b"/>
  </g>
</svg>`,

  "vikram-tempo": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="tempoBody" x1="0" y1="40" x2="0" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#9a3412"/>
    </linearGradient>
    <linearGradient id="tempoRoof" x1="0" y1="18" x2="0" y2="34" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#e4d9b8"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="78" ry="4" fill="#0f172a" opacity="0.22"/>
  <!-- Khaki Canvas Canopy -->
  <path d="M 32 24 C 32 20 40 18 52 18 L 136 18 C 144 18 150 21 150 26 L 148 36 L 32 36 Z" fill="url(#tempoRoof)"/>
  <line x1="55" y1="18" x2="55" y2="36" stroke="#9a3412" stroke-width="1.2"/>
  <line x1="88" y1="18" x2="88" y2="36" stroke="#9a3412" stroke-width="1.2"/>
  <line x1="120" y1="18" x2="120" y2="36" stroke="#9a3412" stroke-width="1.2"/>
  <!-- Canopy Support Struts -->
  <line x1="36" y1="36" x2="36" y2="60" stroke="#334155" stroke-width="2"/>
  <line x1="80" y1="36" x2="80" y2="60" stroke="#334155" stroke-width="2"/>
  <line x1="120" y1="36" x2="120" y2="60" stroke="#334155" stroke-width="2"/>
  <line x1="148" y1="36" x2="148" y2="52" stroke="#334155" stroke-width="2"/>
  <!-- Driver Cab Windshield -->
  <polygon points="123,36 146,36 144,52 123,52" fill="#385263" opacity="0.9"/>
  <!-- Front Snout Diesel Body -->
  <path d="M 32 58 L 122 58 L 146 50 L 172 60 C 176 62 178 66 176 71 L 172 73 L 158 73 A 12 12 0 0 1 134 73 L 74 73 A 13 13 0 0 1 48 73 L 32 73 Z" fill="url(#tempoBody)"/>
  <!-- Rear Passenger Safety Rail -->
  <line x1="35" y1="48" x2="120" y2="48" stroke="#cbd5e1" stroke-width="1.8"/>
  <!-- Large Round Front Snout Headlamp -->
  <circle cx="174" cy="65" r="4.5" fill="#fef08a" stroke="#fff" stroke-width="1"/>
  <circle cx="174" cy="65" r="1.5" fill="#fff"/>
  <!-- Side Branding -->
  <rect x="52" y="61" width="58" height="7" rx="1.5" fill="#431407" opacity="0.7"/>
  <text x="56" y="66.5" fill="#fef08a" font-size="5" font-weight="bold" font-family="sans-serif">VIKRAM JAMMU</text>
  <!-- Rear Wheel -->
  <g>
    <circle cx="61" cy="73" r="13" fill="#1e293b"/>
    <circle cx="61" cy="73" r="8" fill="#64748b"/>
    <circle cx="61" cy="73" r="4" fill="#cbd5e1"/>
    <circle cx="61" cy="73" r="1.5" fill="#1e293b"/>
  </g>
  <!-- Front Wheel (Snout Mounted) -->
  <g>
    <circle cx="160" cy="74" r="11" fill="#1e293b"/>
    <circle cx="160" cy="74" r="6" fill="#64748b"/>
    <circle cx="160" cy="74" r="3" fill="#cbd5e1"/>
  </g>
</svg>`,

  "e-rickshaw": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="erickGreen" x1="0" y1="40" x2="0" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="74" ry="4" fill="#0f172a" opacity="0.2"/>
  <!-- Curved Yellow Weather Canopy -->
  <path d="M 40 25 C 40 19 60 16 100 16 C 140 16 156 20 156 26 L 154 32 L 40 32 Z" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
  <!-- Canopy Steel Tubular Frame -->
  <line x1="44" y1="32" x2="44" y2="60" stroke="#1f2937" stroke-width="1.8"/>
  <line x1="88" y1="32" x2="88" y2="60" stroke="#1f2937" stroke-width="1.8"/>
  <line x1="136" y1="32" x2="136" y2="52" stroke="#1f2937" stroke-width="1.8"/>
  <!-- Transparent Passenger Windscreen -->
  <polygon points="133,32 148,32 145,52 133,52" fill="#38bdf8" fill-opacity="0.3" stroke="#1f2937" stroke-width="1"/>
  <!-- Passenger Body Shell -->
  <path d="M 41 58 L 118 58 L 128 50 L 152 50 L 158 65 L 158 72 L 144 72 A 12 12 0 0 1 120 72 L 78 72 A 12 12 0 0 1 54 72 L 41 72 Z" fill="url(#erickGreen)"/>
  <!-- Passenger Cushions -->
  <rect x="50" y="48" width="34" height="10" rx="2" fill="#1e293b"/>
  <rect x="88" y="52" width="28" height="8" rx="1.5" fill="#1e293b"/>
  <!-- EV Battery Emblem on Side -->
  <circle cx="68" cy="65" r="4.5" fill="#fef08a"/>
  <path d="M 68 62 L 66 65 L 68 65 L 67 68 L 70 64 L 68 64 Z" fill="#047857"/>
  <!-- Front Bright Round LED -->
  <circle cx="158" cy="58" r="3.5" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
  <!-- Wheels with Clean Wire Spokes -->
  <g>
    <circle cx="66" cy="74" r="11" fill="#111827"/>
    <circle cx="66" cy="74" r="7" fill="#9ca3af"/>
    <circle cx="66" cy="74" r="3" fill="#111827"/>
    <line x1="66" y1="67" x2="66" y2="81" stroke="#4b5563" stroke-width="0.8"/>
    <line x1="59" y1="74" x2="73" y2="74" stroke="#4b5563" stroke-width="0.8"/>
  </g>
  <g>
    <circle cx="150" cy="74" r="11" fill="#111827"/>
    <circle cx="150" cy="74" r="7" fill="#9ca3af"/>
    <circle cx="150" cy="74" r="3" fill="#111827"/>
    <line x1="150" y1="67" x2="150" y2="81" stroke="#4b5563" stroke-width="0.8"/>
    <line x1="143" y1="74" x2="157" y2="74" stroke="#4b5563" stroke-width="0.8"/>
  </g>
</svg>`,

  "e-auto": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="eautoGradient" x1="0" y1="24" x2="0" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="60%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="76" ry="4" fill="#0f172a" opacity="0.2"/>
  <!-- Aerodynamic Green Body Shell -->
  <path d="M 38 56 C 38 34 52 24 92 24 L 125 24 C 146 24 158 34 162 50 L 165 65 L 158 73 L 142 73 A 12 12 0 0 1 118 73 L 82 73 A 12 12 0 0 1 58 73 L 38 73 Z" fill="url(#eautoGradient)"/>
  <!-- Contrasting White Passenger Cutout Door -->
  <path d="M 68 44 L 118 44 C 122 44 126 48 125 54 L 120 70 L 68 70 Z" fill="#f8fafc"/>
  <!-- Cabin Glass & Panoramic Front Windshield -->
  <path d="M 123 26 L 153 32 C 158 38 160 48 158 55 L 130 55 Z" fill="#1e3a4a"/>
  <line x1="143" y1="55" x2="151" y2="36" stroke="#94a3b8" stroke-width="1"/>
  <!-- Interior Passenger Seat -->
  <rect x="70" y="32" width="46" height="20" rx="3" fill="#0f172a" opacity="0.85"/>
  <rect x="75" y="48" width="34" height="6" rx="1.5" fill="#334155"/>
  <!-- Emerald Green EV Badge -->
  <circle cx="94" cy="58" r="6.5" fill="#047857"/>
  <text x="90" y="60.5" fill="#ffffff" font-size="5.5" font-weight="900" font-family="sans-serif">EV</text>
  <!-- Modern Sleek Headlight -->
  <rect x="162" y="58" width="4" height="8" rx="1.5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="0.8"/>
  <!-- Wheels -->
  <g>
    <circle cx="70" cy="73" r="12" fill="#1e293b"/>
    <circle cx="70" cy="73" r="7.5" fill="#64748b"/>
    <circle cx="70" cy="73" r="3" fill="#10b981"/>
  </g>
  <g>
    <circle cx="150" cy="73" r="12" fill="#1e293b"/>
    <circle cx="150" cy="73" r="7.5" fill="#64748b"/>
    <circle cx="150" cy="73" r="3" fill="#10b981"/>
  </g>
</svg>`,

  "auto": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="autoYellow" x1="0" y1="20" x2="0" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="74" ry="4" fill="#0f172a" opacity="0.2"/>
  <!-- Yellow Hood Canopy -->
  <path d="M 40 48 C 40 30 58 22 104 22 C 132 22 146 28 152 40 L 150 50 L 40 50 Z" fill="url(#autoYellow)"/>
  <!-- Black Metallic Lower Chassis -->
  <path d="M 40 50 L 150 50 L 156 62 L 158 73 L 142 73 A 12 12 0 0 1 118 73 L 82 73 A 12 12 0 0 1 58 73 L 39 73 Z" fill="#1e2429"/>
  <!-- Windshield & Front Glass -->
  <polygon points="120,28 148,32 144,48 120,48" fill="#334e68"/>
  <line x1="136" y1="30" x2="132" y2="46" stroke="#94a3b8" stroke-width="0.8"/>
  <!-- Fare Meter Box (Red LED) -->
  <rect x="124" y="44" width="7" height="4.5" rx="1" fill="#dc2626"/>
  <circle cx="127.5" cy="46" r="0.8" fill="#fef08a"/>
  <!-- Passenger Compartment Opening -->
  <rect x="68" y="31" width="46" height="23" rx="2" fill="#0f172a" opacity="0.9"/>
  <line x1="68" y1="51" x2="114" y2="51" stroke="#f59e0b" stroke-width="1.8"/>
  <!-- Front Round Headlamp -->
  <circle cx="155" cy="61" r="4.5" fill="#fef08a" stroke="#d1d5db" stroke-width="0.8"/>
  <!-- Yellow Number Plate Strip -->
  <rect x="44" y="62" width="14" height="4.5" rx="1" fill="#facc15"/>
  <text x="45.5" y="65.5" fill="#000" font-size="3.5" font-weight="bold" font-family="sans-serif">JK 01</text>
  <!-- Wheels -->
  <g>
    <circle cx="70" cy="73" r="12" fill="#111827"/>
    <circle cx="70" cy="73" r="7" fill="#6b7280"/>
    <circle cx="70" cy="73" r="2.5" fill="#111827"/>
  </g>
  <g>
    <circle cx="146" cy="73" r="12" fill="#111827"/>
    <circle cx="146" cy="73" r="7" fill="#6b7280"/>
    <circle cx="146" cy="73" r="2.5" fill="#111827"/>
  </g>
</svg>`,

  "tata-magic": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="magicWhite" x1="0" y1="24" x2="0" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="84" ry="4" fill="#0f172a" opacity="0.2"/>
  <!-- Minivan Body Contour -->
  <path d="M 28 34 C 28 28 35 25 44 25 L 140 25 C 152 25 161 31 165 44 L 169 60 C 170 66 169 72 165 73 L 150 73 A 12 12 0 0 1 126 73 L 74 73 A 12 12 0 0 1 50 73 L 28 73 Z" fill="url(#magicWhite)" stroke="#94a3b8" stroke-width="0.8"/>
  <!-- Dark Rocker Panel Skirt -->
  <rect x="28" y="68" width="138" height="4" fill="#334155"/>
  <!-- Slanted Front Windshield -->
  <path d="M 126 28 L 154 32 L 160 50 L 126 50 Z" fill="#294354"/>
  <!-- Side Passenger Windows -->
  <rect x="80" y="29" width="41" height="21" rx="1.5" fill="#294354"/>
  <rect x="34" y="29" width="41" height="21" rx="1.5" fill="#294354"/>
  <!-- Sliding Door Rail & Handle -->
  <line x1="66" y1="56" x2="126" y2="56" stroke="#94a3b8" stroke-width="1.2"/>
  <rect x="116" y="52" width="6" height="2" rx="0.8" fill="#334155"/>
  <!-- Headlamp & Signal -->
  <rect x="166" y="52" width="4" height="9" rx="1.5" fill="#fef08a" stroke="#cbd5e1" stroke-width="0.6"/>
  <rect x="166" y="61" width="4" height="3" rx="0.8" fill="#f59e0b"/>
  <!-- Wheels -->
  <g>
    <circle cx="62" cy="73" r="12" fill="#1e293b"/>
    <circle cx="62" cy="73" r="7.5" fill="#64748b"/>
    <circle cx="62" cy="73" r="3" fill="#cbd5e1"/>
  </g>
  <g>
    <circle cx="138" cy="73" r="12" fill="#1e293b"/>
    <circle cx="138" cy="73" r="7.5" fill="#64748b"/>
    <circle cx="138" cy="73" r="3" fill="#cbd5e1"/>
  </g>
</svg>`,

  "private-bus": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="busRed" x1="0" y1="20" x2="0" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="50%" stop-color="#b91c1c"/>
      <stop offset="100%" stop-color="#7f1d1d"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="92" ry="4" fill="#0f172a" opacity="0.22"/>
  <!-- Main Coach Body -->
  <path d="M 16 28 C 16 23 22 19 31 19 L 168 19 C 178 19 184 25 186 35 L 187 62 C 187 69 183 73 177 73 L 162 73 A 12 12 0 0 1 138 73 L 70 73 A 12 12 0 0 1 46 73 L 16 73 Z" fill="url(#busRed)"/>
  <!-- Cream Roof Trim -->
  <rect x="16" y="19" width="170" height="4.5" fill="#fef3c7"/>
  <!-- J&K STAGE Destination Placard -->
  <rect x="148" y="22" width="34" height="6.5" rx="1" fill="#0f172a"/>
  <text x="151" y="27" fill="#facc15" font-size="4" font-weight="900" font-family="sans-serif" letter-spacing="0.5">J&K STAGE</text>
  <!-- Touring Windows Row -->
  <g fill="#1e293b">
    <rect x="22" y="26" width="16" height="23" rx="1.5"/>
    <rect x="41" y="26" width="18" height="23" rx="1.5"/>
    <rect x="62" y="26" width="18" height="23" rx="1.5"/>
    <rect x="83" y="26" width="18" height="23" rx="1.5"/>
    <rect x="104" y="26" width="18" height="23" rx="1.5"/>
    <rect x="125" y="26" width="18" height="23" rx="1.5"/>
    <!-- Front Panoramic Driver Screen -->
    <path d="M 146 26 L 180 26 C 184 31 185 38 185 49 L 146 49 Z"/>
  </g>
  <!-- Underfloor Luggage Compartments -->
  <rect x="70" y="59" width="28" height="10" rx="1" fill="#581c1c" stroke="#991b1b" stroke-width="0.6"/>
  <rect x="101" y="59" width="28" height="10" rx="1" fill="#581c1c" stroke="#991b1b" stroke-width="0.6"/>
  <!-- Front Headlamp Unit -->
  <rect x="184" y="54" width="3.5" height="10" rx="1" fill="#fef08a" stroke="#d97706" stroke-width="0.6"/>
  <!-- Heavy Dual Rear Wheels -->
  <g>
    <circle cx="58" cy="73" r="13" fill="#111827"/>
    <circle cx="58" cy="73" r="8" fill="#4b5563"/>
    <circle cx="58" cy="73" r="3.5" fill="#9ca3af"/>
  </g>
  <!-- Front Steering Wheel -->
  <g>
    <circle cx="150" cy="73" r="13" fill="#111827"/>
    <circle cx="150" cy="73" r="8" fill="#4b5563"/>
    <circle cx="150" cy="73" r="3.5" fill="#9ca3af"/>
  </g>
</svg>`,

  "force-traveler": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="travellerBody" x1="0" y1="20" x2="0" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="65%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="88" ry="4" fill="#0f172a" opacity="0.22"/>
  <!-- High-Roof AC Condenser Unit -->
  <rect x="72" y="13" width="40" height="6" rx="2" fill="#334155"/>
  <line x1="80" y1="16" x2="104" y2="16" stroke="#64748b" stroke-width="0.8"/>
  <!-- High-Roof Tourist Van Body -->
  <path d="M 24 33 C 24 24 32 19 43 19 L 148 19 C 159 19 168 25 172 37 L 178 59 C 179 66 176 73 170 73 L 155 73 A 12 12 0 0 1 131 73 L 75 73 A 12 12 0 0 1 51 73 L 24 73 Z" fill="url(#travellerBody)" stroke="#94a3b8" stroke-width="0.8"/>
  <!-- Full-Length Privacy Tint Glass Band -->
  <path d="M 30 28 L 142 28 L 170 34 L 174 50 L 30 50 Z" fill="#0f172a"/>
  <line x1="62" y1="28" x2="62" y2="50" stroke="#f1f5f9" stroke-width="1.5"/>
  <line x1="95" y1="28" x2="95" y2="50" stroke="#f1f5f9" stroke-width="1.5"/>
  <line x1="128" y1="28" x2="128" y2="50" stroke="#f1f5f9" stroke-width="1.5"/>
  <!-- Royal Blue Alpine Swoosh Graphic -->
  <path d="M 30 58 L 132 58 L 148 64 L 30 64 Z" fill="#2563eb" opacity="0.85"/>
  <!-- Front Headlamp & Grille Details -->
  <rect x="175" y="53" width="4" height="9" rx="1.5" fill="#fef08a" stroke="#cbd5e1" stroke-width="0.6"/>
  <line x1="173" y1="65" x2="178" y2="65" stroke="#94a3b8" stroke-width="1.5"/>
  <!-- Wheels -->
  <g>
    <circle cx="63" cy="73" r="13" fill="#1e293b"/>
    <circle cx="63" cy="73" r="8" fill="#64748b"/>
    <circle cx="63" cy="73" r="3.5" fill="#e2e8f0"/>
  </g>
  <g>
    <circle cx="143" cy="73" r="13" fill="#1e293b"/>
    <circle cx="143" cy="73" r="8" fill="#64748b"/>
    <circle cx="143" cy="73" r="3.5" fill="#e2e8f0"/>
  </g>
</svg>`,

  "taxi": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="taxiBody" x1="0" y1="32" x2="0" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="65%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="80" ry="4" fill="#0f172a" opacity="0.2"/>
  <!-- Yellow TAXI Roof Sign -->
  <rect x="90" y="26" width="20" height="5.5" rx="1.5" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
  <text x="93" y="30.5" fill="#000000" font-size="3.8" font-weight="900" font-family="sans-serif" letter-spacing="0.5">TAXI</text>
  <!-- Three-Box Sedan Profile -->
  <path d="M 26 56 L 38 46 L 70 32 L 126 32 L 154 47 L 176 53 L 179 66 C 179 71 175 73 169 73 L 152 73 A 12 12 0 0 1 128 73 L 74 73 A 12 12 0 0 1 50 73 L 26 73 Z" fill="url(#taxiBody)" stroke="#64748b" stroke-width="0.8"/>
  <!-- Windows -->
  <polygon points="44,46 71,35 71,50 41,50" fill="#1e293b"/>
  <rect x="74" y="35" width="28" height="15" rx="1" fill="#1e293b"/>
  <polygon points="105,35 124,35 146,48 105,50" fill="#1e293b"/>
  <!-- Chrome Waistline Strip & Handles -->
  <line x1="41" y1="54" x2="166" y2="54" stroke="#cbd5e1" stroke-width="0.8"/>
  <rect x="108" y="52" width="6" height="2" rx="0.6" fill="#334155"/>
  <rect x="78" y="52" width="6" height="2" rx="0.6" fill="#334155"/>
  <!-- Headlamp and Tail Lamp -->
  <path d="M 170 51 L 178 52 L 175 59 L 165 58 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="0.6"/>
  <rect x="25" y="54" width="3" height="6" rx="1" fill="#ef4444"/>
  <!-- Sedan Multi-Spoke Wheels -->
  <g>
    <circle cx="62" cy="73" r="12" fill="#0f172a"/>
    <circle cx="62" cy="73" r="7.5" fill="#64748b"/>
    <circle cx="62" cy="73" r="3" fill="#f8fafc"/>
  </g>
  <g>
    <circle cx="140" cy="73" r="12" fill="#0f172a"/>
    <circle cx="140" cy="73" r="7.5" fill="#64748b"/>
    <circle cx="140" cy="73" r="3" fill="#f8fafc"/>
  </g>
</svg>`,

  "suv-taxi": `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="vehicle-illustration-svg">
  <defs>
    <linearGradient id="suvTitanium" x1="0" y1="28" x2="0" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="100" cy="80" rx="84" ry="4" fill="#0f172a" opacity="0.22"/>
  <!-- Silver Alpine Roof Rails -->
  <rect x="54" y="22" width="82" height="3.5" rx="1.5" fill="#0f172a"/>
  <line x1="62" y1="25" x2="62" y2="29" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="98" y1="25" x2="98" y2="29" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="130" y1="25" x2="130" y2="29" stroke="#94a3b8" stroke-width="1.5"/>
  <!-- Muscular SUV Profile (Innova Crysta / Scorpio) -->
  <path d="M 24 51 L 30 40 C 33 31 41 29 51 29 L 130 29 L 157 44 L 176 53 L 177 66 C 177 72 173 73 166 73 L 152 73 A 13 13 0 0 1 126 73 L 74 73 A 13 13 0 0 1 48 73 L 24 73 Z" fill="url(#suvTitanium)" stroke="#64748b" stroke-width="0.8"/>
  <!-- Dark Privacy Tapered Glasshouse -->
  <polygon points="37,42 62,32 62,49 33,49" fill="#0f172a"/>
  <rect x="66" y="32" width="33" height="17" rx="1" fill="#0f172a"/>
  <polygon points="102,32 128,32 152,46 102,49" fill="#0f172a"/>
  <!-- Chrome Shoulder Crease & Handles -->
  <line x1="33" y1="51" x2="156" y2="51" stroke="#94a3b8" stroke-width="1"/>
  <rect x="105" y="53" width="6.5" height="2" rx="0.6" fill="#e2e8f0"/>
  <rect x="72" y="53" width="6.5" height="2" rx="0.6" fill="#e2e8f0"/>
  <!-- Projector LED Headlamp Unit -->
  <polygon points="166,53 176,55 174,62 163,60" fill="#e0f2fe" stroke="#38bdf8" stroke-width="0.8"/>
  <!-- Premium Machined Alloy Wheels -->
  <g>
    <circle cx="61" cy="73" r="13" fill="#0f172a"/>
    <circle cx="61" cy="73" r="8" fill="#64748b"/>
    <circle cx="61" cy="73" r="3.5" fill="#f8fafc"/>
  </g>
  <g>
    <circle cx="139" cy="73" r="13" fill="#0f172a"/>
    <circle cx="139" cy="73" r="8" fill="#64748b"/>
    <circle cx="139" cy="73" r="3.5" fill="#f8fafc"/>
  </g>
</svg>`
};

window.VEHICLE_VISUAL_META = {
  "shared-cab": {
    name: "Tata Sumo / Bolero",
    categoryLabel: "Shared Maxi-Cab",
    hallmark: "Boxy White 4x4 with Roof Luggage Carrier & Tarpaulin",
    howToSpot: "Found at dedicated Sumo Stands (TRC, Batamaloo, Pantha Chowk, Jewel Chowk).",
    luggage: "Heavy Rooftop Luggage",
    idealFor: "Mountain Passes, Alpine Corridors & Inter-District Routes",
    tagline: "The lifeline of J&K mountain highways"
  },
  "mini-bus": {
    name: "Matador (Tata 407 / Swaraj Mazda)",
    categoryLabel: "Stage Carriage Mini-Bus",
    hallmark: "Iconic Blue & Cream or Green/White Tata 407 with curved nose",
    howToSpot: "General Bus Stands, Lal Chowk, Batamaloo & arterial district stops.",
    luggage: "Medium (Under-seat & rear space)",
    idealFor: "Intra-District Arterials & Suburban Stages (5–45 km)",
    tagline: "Universal high-frequency transit across Kashmir & Jammu plains"
  },
  "vikram-tempo": {
    name: "Vikram 3-Wheeler Tempo",
    categoryLabel: "Jammu Urban Stage Shuttle",
    hallmark: "Front-snout 3-wheeler diesel tempo with longitudinal benches",
    howToSpot: "Exclusively across Jammu Urban (Satwari, Gandhi Nagar, Canal Rd, Jewel).",
    luggage: "Light Hand Baggage only",
    idealFor: "Jammu City Intra-Urban Hubs (0–15 km)",
    tagline: "Jammu's iconic multi-passenger shared 3-wheeler"
  },
  "e-rickshaw": {
    name: "E-Rickshaw (Battery Toto)",
    categoryLabel: "Zero-Emission Local Feeder",
    hallmark: "Bright Green lightweight electric toto with weather canopy",
    howToSpot: "Srinagar SMC, Jammu JMC, Katra town, and Baramulla markets.",
    luggage: "Handbags & Grocery Bags only",
    idealFor: "Short Market Hops, Hospital Feeder & Inner City Streets (1–6 km)",
    tagline: "Quiet, non-polluting local point-to-point hop"
  },
  "e-auto": {
    name: "E-Auto (Mahindra Treo / Piaggio)",
    categoryLabel: "Metered Electric Auto",
    hallmark: "Aerodynamic emerald & white closed cabin with 'EV' emblem",
    howToSpot: "Srinagar & Jammu auto stands and key intersections.",
    luggage: "1-2 Small Suitcases or Duffel Bags behind rear seat",
    idealFor: "Intra-City Trips up to 12 km within municipal bounds",
    tagline: "Modern statutory metered clean electric mobility"
  },
  "auto": {
    name: "Auto Rickshaw (Bajaj RE)",
    categoryLabel: "Standard 3-Wheeler Auto",
    hallmark: "Classic Yellow canopy with Black metal chassis",
    howToSpot: "Municipal Auto Stands near railway stations, hospitals, and markets.",
    luggage: "Up to 2 Medium Duffel Bags",
    idealFor: "City-Wide Point-to-Point Transit (1–15 km)",
    tagline: "Reliable statutory metered transport across J&K towns"
  },
  "tata-magic": {
    name: "Tata Magic / Maruti Eeco",
    categoryLabel: "Suburban Feeder Van",
    hallmark: "White compact passenger minivan with sliding side door",
    howToSpot: "Feeder routes in Baramulla, Sopore, Kupwara, Outer Jammu & ring roads.",
    luggage: "Medium (Under seat & boot storage)",
    idealFor: "Semi-Urban & Rural Connector Routes (3–20 km)",
    tagline: "Comfortable high-frequency suburban shared shuttle"
  },
  "private-bus": {
    name: "Private Stage Bus (32+ Seater)",
    categoryLabel: "Trunk Highway Stage Carriage",
    hallmark: "Large 32+ passenger coach with front destination placard",
    howToSpot: "District General Bus Stands connecting major towns via national highways.",
    luggage: "Full Luggage Hold (Underbelly cargo bays & overhead racks)",
    idealFor: "Inter-District Trunk Highways (Srinagar-Jammu-Katra-Poonch)",
    tagline: "Economical high-capacity corridor transportation"
  },
  "force-traveler": {
    name: "Force Traveller (14-Seater)",
    categoryLabel: "Tourist & Group Maxi-Cab",
    hallmark: "High-roof white van with panoramic dark tinted windows",
    howToSpot: "TRC Srinagar, Airport, Katra SMVD stands & Gulmarg/Pahalgam stands.",
    luggage: "Large Rear Cargo Compartment (10+ full suitcases)",
    idealFor: "Tourist Circuits, Family Charters & Highland Highway Hops",
    tagline: "Premium group travel for J&K alpine destinations"
  },
  "taxi": {
    name: "Sedan Taxi (Dzire / Etios)",
    categoryLabel: "Private Contract Tourist Cab",
    hallmark: "White/Silver compact sedan with yellow commercial plate",
    howToSpot: "Airport Taxi stands, tourist taxi unions, hotels, pre-paid counters.",
    luggage: "Full Sedan Boot (3-4 suitcases comfortably)",
    idealFor: "Airport Transfers, Point-to-Point City Rides & Family Tours",
    tagline: "Private point-to-point comfort with official government tariff"
  },
  "suv-taxi": {
    name: "SUV Taxi (Innova / Scorpio)",
    categoryLabel: "Alpine Tourist SUV",
    hallmark: "Silver/Graphite Toyota Innova Crysta or Scorpio with roof rack",
    howToSpot: "Premium Tourist Taxi Stands (TRC Srinagar, Jammu Airport, Katra).",
    luggage: "Heavy Baggage (Spacious boot + rooftop carrier)",
    idealFor: "All-Weather Alpine Passes, Gulmarg, Sonmarg, Sinthan Top, Leh Road",
    tagline: "Robust all-terrain alpine comfort for mountain highways"
  }
};

window.getVehicleIllustrationSvg = function(vehicleKey) {
  if (window.VEHICLE_ILLUSTRATIONS && window.VEHICLE_ILLUSTRATIONS[vehicleKey]) {
    return window.VEHICLE_ILLUSTRATIONS[vehicleKey];
  }
  return window.VEHICLE_ILLUSTRATIONS ? window.VEHICLE_ILLUSTRATIONS["shared-cab"] : "";
};
