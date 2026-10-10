# StaySmart – Static Student Housing Site

A fully static version of the PHP + MySQL "StaySmart" student housing project. No PHP, database or server is needed: open `index.html` in a browser (or host the folder on any static host such as GitHub Pages / Netlify).

## Pages
| File | What it is |
|---|---|
| `index.html` (+ `js/app.js`) | Student site: home with filters, property cards, details modal with gallery, favorites, my bookings, reviews, feedback, about, offline Ask AI |
| `vendor.html` (+ `js/vendor.js`) | Owner dashboard: stats, my properties (edit / toggle availability / delete), bookings with status tabs and actions, reviews (reply), notifications, add property, profile |
| `admin.html` (+ `js/admin.js`) | Admin panel: dashboard, owners (approve/reject), properties, students, bookings, review moderation, feedback, earnings |
| `js/panel.js` | Shared core: localStorage state, demo login, modal/toast helpers |
| `js/data.js` | All seed data (converted from the SQL dump) |
| `css/style.css` | Original CSS extracted from the PHP pages, scoped per side (`body.student`, `body.vendor`, `body.admin`) plus a small built-in utility layer (no Bootstrap/CDN needed) |
| `images/properties/` | 14 compressed JPGs (max 1200 px) |

## Demo accounts (also shown on every login screen)
| Role | Email | Password |
|---|---|---|
| Student | student@demo.com | student123 |
| Owner (Pune listings, Rajesh Kumar) | owner@demo.com | owner123 |
| Owner (Ratnagiri listings, Tehseen) | owner2@demo.com | owner123 |
| Admin | admin@demo.com | admin123 |

These are invented demo logins. The original password hashes were NOT copied.

## How data works
Everything is kept in the browser's `localStorage` (keys `sh_db_v1`, `sh_session_v1`): login, favorites, bookings, reviews, feedback, and every owner/admin action. Browsing works without logging in. Use **Reset demo data** (student menu / admin top bar) to restore the original seed.

## Running tests locally

Requires Node.js 18 or newer; no package installation is needed.
Run this command from the project root:
```powershell
node tests\staysmart.test.js
```
The suite checks project files, JavaScript syntax, seed data, and shared UI helpers.
Exit code `0` means all tests passed; `1` means a test failed.

## Jenkins CI
The `Jenkinsfile` checks out the project and runs on a Jenkins agent with PowerShell and Node.js 18 or newer. Each build verifies the required app files, syntax-checks the JavaScript, and runs `node tests/staysmart.test.js`.

The automated suite checks page assets, seed data structure, demo accounts, property and booking relationships, booking statuses/dates/totals, review data, local property images, and shared UI status/escaping/storage helpers. These are static-app and Node-based checks; the pipeline does not claim browser-based end-to-end coverage or test an online backend.

## Real vs invented data
**Real (from your SQL dump / PHP files)**
- Properties 1–5 (Pune, Mumbai, Bangalore sample listings) and 42 (Panjari hostel, Ratnagiri): title, description, address, rent, deposit, type, beds, baths, area, occupants, amenities, rules, dates, featured flag.
- Property 49: real record, but its title/description/city were test gibberish ("Dydidkh", city "Ddf"), so I cleaned them (marked `real (cleaned test data)`).
- Owners (7 landlords incl. company, license, rating), students (Muaaz, Muaaz Panjari, yusuf, Tehseen, Yusuf Panjari), bookings 1, 2, 3, 15, 16, favorites (3), non-login notifications (43), commission rate 5%, contact email, minimum lease.
- Owner approval status is as in the dump: owners 7 and 13 approved, the other five pending.
- Ratnagiri sub-area list, filter options, price steps, amenity names and the "Full / Under Maintenance / Available" labels come from the PHP pages.
- Images: 14 usable photos from `uploads/properties` (exterior, street, interiors, hostel rooms, kitchens, bedroom).

**Invented to fill gaps (marked `src:"invented"` in data.js)**
- Listings 101, 102, 103 (Nachane, Kuwarbav, Shivaji Nagar) – titles, rent and descriptions are made up; they only reuse real photos.
- Photo-to-listing assignment: the dump's image rows for 42/49 pointed to files that are not in the zip, and listings 1–5 all used one placeholder image. I assigned the real photos that exist to listings sensibly; the pairing is mine.
- "Nearby" places for every listing.
- Bookings 101–107 (various statuses so every tab has content).
- All reviews (10) – the dump has no review rows.
- All platform feedback (6) – the dump has no feedback rows.
- All earnings: the dump has no payments. Student fee ₹499 per paid booking is invented; owner fee = 5% of booking total (real rate, applied to invented paid bookings).
- Demo logins, and the About page wording.

## Left out on purpose
node_modules, ID/property document uploads, personal/profile photos, screenshots, flowcharts, watermarked (OLX) images, config files, API keys, payment (Razorpay) config, AI config/cache, SQL dump and password hashes.

## Privacy note
`data.js` still contains the real names, emails and phone numbers from your dump (family members and the five sample owners). Remove or mask them before hosting publicly.

## Deploying

No build step or backend is required for static hosting.
Publish the project root so the HTML files remain together.
Keep the `js/`, `css/`, and `images/` folders in their original locations.
After deployment, open `index.html`, `vendor.html`, and `admin.html` to check each page.
Each browser keeps its own app data in local storage.
Clearing the site's browser storage removes locally saved changes.
Demo credentials are public; do not use real passwords for these accounts.

## Notes
- Icons are emoji and the layout CSS is self-contained, so the site works fully offline.
- Ask AI is a rule-based offline assistant (city, area, type, budget, bedrooms, amenities).
- Registration, online payment and email flows from the PHP app are not part of the static demo.

## Notes
- Icons are emoji and the layout CSS is self-contained, so the site works fully offline.
- Ask AI is a rule-based offline assistant (city, area, type, budget, bedrooms, amenities).
- Registration, online payment and email flows from the PHP app are not part of the static demo.
