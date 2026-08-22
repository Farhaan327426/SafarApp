# Safar — Smallest Usable Brand Kit (Internal Reference)

---

### 1. Core Message
> **"Safar gives J&K passengers the exact fare and live location of every verified local bus."**

---

### 2. Colors
| Role | Hex | Usage |
| :--- | :--- | :--- |
| **Primary** | `#0d9488` | Buttons, links, active states, header accents, map pins |
| **Accent** | `#f59e0b` | Live indicators, warnings, fare highlights, SOS |
| **Base/Background** | `#0f172a` | Dark navy background |
| **Text** | `#f8fafc` | Off-white body text |

---

### 3. Font Pairing (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
```

```css
body { font-family: "Inter", sans-serif; }
h1, h2, h3, .brand, .fare-amount, .btn { font-family: "Outfit", sans-serif; }
```

- **Headings / Brand / Numbers:** `Outfit` (weights 600, 700)
- **Body / UI / Inputs:** `Inter` (weights 400, 500)

---

### 4. Minimal Logo Concept
- **Wordmark:** `SAFAR` in `Outfit` Bold (`700`), uppercase, color `#f8fafc`.
- **SVG Switchback Line:**

```xml
<svg width="120" height="28" viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 22 C18 22, 22 10, 32 10 C42 10, 46 22, 56 22 C66 22, 70 10, 80 10 C90 10, 94 22, 104 22"
        stroke="#0d9488" stroke-width="3" stroke-linecap="round"/>
  <circle cx="112" cy="22" r="3" fill="#f59e0b"/>
</svg>
```

---

### 5. Strict Exclusions (Do NOT Create)
- ❌ No brand guidelines / brand books
- ❌ No logo variations or light mode overhauls
- ❌ No social media templates or mascot assets
- ❌ No favicon variants beyond one SVG/PNG
