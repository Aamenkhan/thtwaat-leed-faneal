# THTWAAT Lead Funnel (Launchpad)

A premium, highly-converting lead generation platform designed for **THTWAAT**—a hyperlocal multi-vendor marketplace and delivery network operating in Bhopal, MP, India. 

This funnel serves as the onboarding portal for three core user paths:
1. **Merchants (Shops & Kiranas)**: To sell online and utilize THTWAAT logistics.
2. **Delivery Partners (Riders)**: To apply for weekly payout shifts.
3. **Customers**: To gain early access and invite links to download the user app.

---

## Folder Structure

```text
thtwaat-leed-funnel/
├── index.html            # Core landing page featuring 3-in-1 tabbed lead forms
├── css/
│   └── style.css         # Modern, high-performance styling using Outfit & Plus Jakarta Sans
├── js/
│   └── app.js            # Validation, tab routing, and localStorage lead recording
├── pages/
│   ├── portfolio.html    # Partner success stories and case studies in Bhopal
│   ├── pricing.html      # Merchant commission details & Rider weekly incentives
│   └── thankyou.html     # Dynamic lead thank-you page with role-specific next steps
├── assets/
│   ├── images/           # Graphic assets
│   ├── videos/           # Promo videos
│   └── logos/            # Official brand logos
└── README.md             # Project documentation
```

---

## Key Features

- **High-Impact Aesthetic**: Modern deep slate dark mode theme with floating radial glows, neon borders, and glassmorphic card wrappers.
- **Client-Side Form Validation**: Real-time error messages for missing items and mobile number verification (verifies standard 10-digit Indian numbers).
- **Lead Tracking**: Submissions are automatically parsed and written to the browser's `localStorage` (key: `thtwaat_leads`) to simulate database ingestion during staging testing.
- **Dynamic Redirection**: Saves submission details in `sessionStorage` to render custom personalized messages in [thankyou.html](file:///c:/thtwaat-leed-funnel/pages/thankyou.html).
- **Mobile Menu Responsive Support**: Fully responsive hamburger nav menu on smaller viewports.

---

## Local Development & Testing

1. Open [index.html](file:///c:/thtwaat-leed-funnel/index.html) directly in any browser, or run a local HTTP server inside the root directory:
   ```bash
   npx serve .
   ```
2. Fill out any of the onboarding forms (Merchant, Rider, or Customer).
3. Once submitted, you'll be redirected to the personalized thank you screen.
4. To check saved leads, open your browser Console (`F12`) and run:
   ```javascript
   console.log(JSON.parse(localStorage.getItem('thtwaat_leads')));
   ```
