let map, marker;
let currentMarkers = [];

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initBottomNav();
    if (typeof renderRouteDirectory === 'function') {
        renderRouteDirectory();
    }
});

function initMap() {
    const mapDiv = document.getElementById('leaflet-map-div');
    if (!mapDiv) return;

    map = L.map('leaflet-map-div').setView([34.0837, 74.7973], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: 'SAFAR System Core'
    }).addTo(map);

    marker = L.marker([34.0837, 74.7973]).addTo(map);
}

function toggleTheme() {
    const shell = document.querySelector('.app-shell') || document.body;
    shell.style.filter = shell.style.filter === 'invert(1) hue-rotate(180deg)' ? 'none' : 'invert(1) hue-rotate(180deg)';
}

let searchTimeout;
function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        filterRouteDirectory();
    }, 300);
}

function fillInput(origin, dest) {
    const origEl = document.getElementById('trip-origin');
    const destEl = document.getElementById('trip-dest');
    if (origEl) origEl.value = origin;
    if (destEl) destEl.value = dest;
    calculateTrip();
}

function swapStops() {
    const origin = document.getElementById('trip-origin');
    const dest = document.getElementById('trip-dest');
    if (origin && dest) {
        const temp = origin.value;
        origin.value = dest.value;
        dest.value = temp;
    }
}

function calculateTrip() {
    const origin = document.getElementById('trip-origin');
    const dest = document.getElementById('trip-dest');
    
    if (origin && dest && (!origin.value || !dest.value)) {
        if (!origin.value) origin.parentElement?.classList.add('shake');
        if (!dest.value) dest.parentElement?.classList.add('shake');
        setTimeout(() => {
            origin?.parentElement?.classList.remove('shake');
            dest?.parentElement?.classList.remove('shake');
        }, 400);
        showToast("Requires both origin and destination.", "toast-error");
        return;
    }

    const fareCard = document.getElementById('fare-card');
    if (fareCard) {
        const distance = Math.floor(Math.random() * 50) + 5;
        const fare = Math.ceil(distance * 1.8);
        const time = Math.ceil(distance * 1.4);

        const priceEl = document.getElementById('fare-price');
        const routeEl = document.getElementById('fare-route');
        const distEl = document.getElementById('fare-dist');
        const timeEl = document.getElementById('fare-time');
        const waitEl = document.getElementById('fare-wait');

        if (priceEl) priceEl.innerText = `₹${fare}`;
        if (routeEl && origin && dest) routeEl.innerText = `${origin.value} ➔ ${dest.value}`;
        if (distEl) distEl.innerText = `${distance} km`;
        if (timeEl) timeEl.innerText = `${time} mins`;
        if (waitEl) waitEl.innerText = `${Math.floor(Math.random() * 15) + 1} mins`;

        fareCard.style.display = 'block';
        showToast("Fare calculated via standard SRO parameters.", "toast-success");
    }
}

function bookTicket() {
    showToast("Ticket allocated. Verification required upon boarding.", "toast-info");
}

function findStopsNearMe() {
    showToast("Accessing geolocation hardware...", "toast-info");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            console.log(position.coords.latitude, position.coords.longitude);
            showToast("Coordinates established. Searching nearest zone...", "toast-success");
        }, () => {
            showToast("Geolocation access denied or unavailable.", "toast-error");
        });
    } else {
        showToast("Geolocation not supported by device.", "toast-error");
    }
}

const routeDatabase = [
    { id: '1', type: 'Govt Bus', name: 'Srinagar ➔ Budgam', stops: ['Lal Chowk', 'Batamaloo', 'Bemina', 'Ompora', 'Budgam Stand'] },
    { id: '2', type: 'Minibus', name: 'Budgam ➔ Sonmarg', stops: ['Budgam', 'Srinagar Bypass', 'Ganderbal', 'Kangan', 'Sonmarg'] },
    { id: '3', type: 'Tata Magic', name: 'Batamaloo ➔ Baramulla', stops: ['Batamaloo', 'Parimpora', 'Pattan', 'Sangrama', 'Baramulla'] },
    { id: '4', type: 'E-Bus', name: 'Lal Chowk ➔ Anantnag', stops: ['Lal Chowk', 'Pantha Chowk', 'Pampore', 'Awantipora', 'Anantnag'] }
];

function renderRouteDirectory(filter = "") {
    const container = document.getElementById('route-directory-container');
    if (!container) return;
    
    const term = filter.toLowerCase();
    const html = routeDatabase.filter(r => 
        r.name.toLowerCase().includes(term) || 
        r.stops.some(s => s.toLowerCase().includes(term))
    ).map(r => `
        <div class="route-directory-card" style="background:#FFF;border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;margin-bottom:10px;">
            <div class="route-dir-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span class="vehicle-badge" style="background:var(--accent);color:#FFF;padding:2px 6px;border-radius:4px;font-size:0.7rem;font-weight:700;">${r.type}</span>
                    <span style="font-size:0.85rem;font-weight:700;">${r.name}</span>
                </div>
            </div>
            <div class="landmark-stops-flow" style="display:flex;flex-wrap:wrap;gap:4px;">
                ${r.stops.map(s => `<span class="stop-chip" style="background:#F3F4F6;padding:2px 6px;border-radius:4px;font-size:0.75rem;">${s}</span>`).join('')}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html || '<div style="padding:10px;text-align:center;font-size:0.8rem;">No routes found matching query.</div>';
}

function filterRouteDirectory() {
    const searchInput = document.getElementById('route-dir-search');
    if (searchInput) {
        renderRouteDirectory(searchInput.value);
    }
}

function switchCorridor(corridorId, element) {
    document.querySelectorAll('.corridor-pill').forEach(el => el.classList.remove('active'));
    if (element) {
        element.classList.add('active');
        const titleEl = document.getElementById('corridor-title-txt');
        if (titleEl) titleEl.innerText = element.innerText + ' Corridor';
    }
    
    if (typeof map !== 'undefined' && map) {
        currentMarkers.forEach(m => map.removeLayer(m));
        currentMarkers = [];

        const points = corridorId === 'SRN-BUD-01' ? 
            [[34.0836, 74.7973], [34.0500, 74.7500], [34.0167, 74.7167]] : 
            [[34.0167, 74.7167], [34.2000, 74.9000], [34.3000, 75.3000]];

        points.forEach(pt => {
            const markerInstance = L.circleMarker(pt, {
                radius: 6,
                fillColor: "var(--primary, #FF7B00)",
                color: "#FFFFFF",
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(map);
            currentMarkers.push(markerInstance);
        });
        
        map.fitBounds(points, { padding: [30, 30] });
    }
}

function initBottomNav() {
    const tabs = document.querySelectorAll('.nav-item');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            if (panes[index]) panes[index].classList.add('active');
            if (index === 1 && map) {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });
    });
}

function showToast(message, type = 'toast-info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:350px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = 'background:rgba(12,59,46,0.95);color:#fff;padding:12px 18px;border-radius:12px;font-size:0.85rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.15);backdrop-filter:blur(8px);transition:all 0.3s;';
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let shiftInterval;
let shiftSeconds = 0;

function activateDriverShift() {
    const btn = document.querySelector('#pane-driver .btn-primary');
    const badge = document.querySelector('.driver-status-badge span:first-child');
    const statusTxt = document.getElementById('shift-status') || document.getElementById('shift-status-msg');
    const currentMsg = document.getElementById('shift-status')?.innerText || 'Shift status initialized.';
    
    if (shiftInterval) {
        clearInterval(shiftInterval);
        shiftInterval = null;
        shiftSeconds = 0;
        if (btn) {
            btn.innerText = "Activate Shift (₹0 Fee)";
            btn.style.background = "var(--accent)";
        }
        if (badge) badge.innerText = "⚫ Shift Inactive";
        const timerTxt = document.getElementById('shift-timer-txt');
        if (timerTxt) timerTxt.innerText = "00:00:00";
        if (statusTxt) statusTxt.innerText = "System ready. Awaiting driver initialization.";
    } else {
        if (btn) {
            btn.innerText = "End Shift";
            btn.style.background = "#EF4444";
        }
        if (badge) badge.innerText = "🟢 Shift Active (GPS On)";
        if (statusTxt) statusTxt.innerText = "GPS Telemetry broadcasting to RTO.";
        
        shiftInterval = setInterval(() => {
            shiftSeconds++;
            const h = String(Math.floor(shiftSeconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((shiftSeconds % 3600) / 60)).padStart(2, '0');
            const s = String(shiftSeconds % 60).padStart(2, '0');
            const timerTxt = document.getElementById('shift-timer-txt');
            if (timerTxt) timerTxt.innerText = `${h}:${m}:${s}`;
        }, 1000);
        
        showToast("Shift authorized. Tracking initiated.", "toast-success");
    }
}

function submitReport() {
    const details = document.getElementById('report-details');
    if (!details || !details.value) {
        details?.classList.add('shake');
        setTimeout(() => details?.classList.remove('shake'), 400);
        showToast("Details field is mandatory.", "toast-error");
        return;
    }
    showToast("Report transmitted to Authority database.", "toast-success");
    details.value = '';
    const vehicleInput = document.getElementById('report-vehicle');
    if (vehicleInput) vehicleInput.value = '';
}
