# Amazona Jungle Resort website

The website for Amazona Jungle Resort, a COCO Development Group resort in Kaba-Kaba, Cepaka, Tabanan, Bali.

- Live site: https://amazonajungleresort.com
- Repository: `curiousafnan/Amazona-Jungle-Resort`
- Type: static HTML, CSS and JavaScript, plus one PHP file that handles the forms

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| About | `about.html` |
| Residences (overview) | `residences.html` |
| Cabana, Azoria, Kartika, Kartika Extended | `residences/*.html` |
| Wellness (ĀYLA, Prána) | `wellness.html` |
| Dining (Raíz, Embér) | `dining.html` |
| Pool & Garden (Lago, Aluna Garden) | `pool-garden.html` |
| Tierra Spa | `spa.html` |
| Booking | `booking.html` |
| Booking result (where DOKU sends guests back) | `booking-status.html` |
| Contact | `contact.html` |
| Privacy Policy, Terms | `privacy.html`, `terms.html` |
| Not found | `404.html` |

## Folders

```
api/lead.php            form handler (sends leads to Zapier)
api/config.sample.php   template for the server-only settings file
assets/css/style.css    all styles
assets/js/main.js       all scripts
assets/img/             photos (WebP) and the share image og.jpg
assets/icons/           favicon and app icons
robots.txt, sitemap.xml, site.webmanifest, favicon.ico
```

## Deploying

1. Make the change and commit it.
2. Run `git push`. The host serves the files from the repository.
3. Open the live site with a hard refresh (Ctrl + F5) to check it.

The host must run PHP 8 or newer with the cURL extension, because `api/lead.php` needs it. Everything else is plain static files.

## Lead forms (Zapier to GoHighLevel)

Both forms send their data to `api/lead.php`, which checks it and forwards it to a Zapier Catch Hook. Zapier then creates or updates the contact in GoHighLevel.

- **Register interest** form: on `booking.html#register` while reservations are closed.
- **Booking request**: the last step of the booking flow once reservations are open.

### One-time setup on the server

1. In Zapier, create a Zap with the trigger **Webhooks by Zapier > Catch Hook** and copy the hook URL.
2. On the server, copy `api/config.sample.php` to `api/config.php`.
3. Paste the hook URL into `zapier_hook` in `config.php`.
4. Send a test from the live site, then map the fields in Zapier to the GoHighLevel action (Create/Update Contact, add tags, and an opportunity if you want one).

`api/config.php` is in `.gitignore`, so the hook URL never goes into GitHub. If the host supports environment variables, setting `AMZ_ZAPIER_HOOK` works instead of the file.

Until `config.php` exists, the form answers "The form is not connected yet" and offers the visitor a WhatsApp message with their details filled in. Nothing is lost, but nothing reaches GoHighLevel either.

### Fields sent to Zapier

| Group | Fields |
|---|---|
| Contact | `first_name`, `last_name`, `full_name`, `email`, `phone`, `marketing_opt_in` (yes/no) |
| Stay | `residence`, `residence_id`, `guests`, `check_in`, `check_out`, `nights`, `message` |
| Booking only | `rate_eur`, `discount_pct`, `total_eur`, `payment_method`, `booking_ref` (only used if the booking API is not set) |
| Tracking | `form_type`, `source`, `tags`, `page_url`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `fbclid`, `display_currency`, `timezone` |
| Server | `received_at`, `ip`, `user_agent` |

`tags` is "Amazona website, Register interest" or "Amazona website, Booking request", so you can split the two in GoHighLevel.

### Spam protection

A hidden honeypot field, a minimum time on the page before sending, a check that the form was sent from this domain, and a limit of 6 sends per visitor every 10 minutes (change `rate_limit` in `config.php`).

## Online booking and payment

Bookings are handled by the booking API, a separate Laravel app in `amazona-booking-api` (its own README covers the server). The website only talks to it from the browser:

1. **Step 2 to 3:** `booking.html` asks `POST /api/availability`. The API checks the dates in Guesty and returns the exact price. If the dates don't work (taken, minimum stay, no arrivals that day), the guest goes back to step 2 with a sentence saying what to change.
2. **Pay:** `POST /api/bookings` holds the dates in Guesty and returns DOKU's payment page. The browser goes straight there. Card only.
3. **Back from DOKU:** DOKU sends the guest to `booking-status.html?ref=...&t=...`. That page asks the API what really happened (a return from DOKU proves nothing) and shows confirmed, payment received, not completed (with a Pay now button) or expired.

The API's address is the `data-api` attribute on the `<body>` of `booking.html` and `booking-status.html`. If you remove it, the booking page falls back to the old "booking request" form that goes to `api/lead.php`.

Prices: the residence cards and the calculator still work out prices in the browser, but the amount charged always comes from the API, and step 3 shows that figure before the guest pays. If a rate changes, change it in the API's `config/amazona.php` and on the website.

Guests no longer go to `api/lead.php` when they book. The API sends bookings to the same Zapier hook (if `ZAPIER_BOOKING_HOOK` is set) tagged "Amazona website, Booking started" and "Amazona website, Booking paid".

`booking.html`, `booking-status.html`, `assets/js/main.js` and `assets/css/style.css` were edited by hand for this (16 Nov 2026). If the pages are ever rebuilt with the Python generator, carry these changes into it first or they will be lost.

## Booking open, stays from 15 December 2026

Booking is open now, for stays that start on or after the opening day. Every page has `<body data-earliest="2026-12-15">`:

- the date pickers start at 15 December 2026 (or today, once that is later), and an earlier check-in is refused with a clear message,
- a green bar at the top says "Now booking stays from 15 December 2026"; it removes itself on the opening day (Bali time),
- the booking API refuses earlier check-ins too (`BOOKING_EARLIEST_CHECK_IN` in its `.env`), and `/api/residences` sends the date, which the page uses in place of the HTML value.

To move the opening day, change `BOOKING_EARLIEST_CHECK_IN` on the API and `data-earliest` on every page (and the date text in the bar and the Terms).

The old "reservations closed" switch (`res-closed`, `.when-closed`) is still in the CSS and markup but no page turns it on.

## Security (.htaccess)

`.htaccess` in the site root (Hostinger reads it): forces HTTPS with HSTS, stops other sites framing the pages, turns off folder listings, and never serves `.git`, `.md` notes, `api/config.php` or other settings files. Upload it with the pages. Tested on Apache: pages, scripts and the lead form still load.

## Brand rules

- Colours: Ivory `#F1F0EB`, Ink `#23201A`, Ink Deep `#1B1813`, Old Money Green `#2F3B31`, Offwhite `#F8F7F3`. Do not use Clay `#8B7360`.
- Fonts: Cormorant Garamond (headings), Poppins (text), EB Garamond (ritual lines).
- Facility names, spelled exactly: Aluna Garden, Lago, ĀYLA, Prána, Embér, Raíz, Tierra Spa.
- Rates are set in euros (EUR). IDR and USD are shown at the booking API's live rates (`/api/fx/rates`); the IDR rate is the one a card is actually charged at. If the API can't be reached, backup rates in `main.js` are used (IDR 20,400 and USD 1.16 per euro).
- Prices come from the booking API: `main.js` reads `/api/residences` and rewrites every price tagged `data-res` / `data-n` (and the booking buttons and calculator). The figures in the HTML are only what shows if the API can't be reached, so keep them close to `config/amazona.php`.
- Groups: the guest picker goes up to 4 residences' worth of guests; a bigger group than one residence books several of the same type in one payment (the API decides how many and checks they are free).
- Ambassador codes: the booking page has a "Code (optional)" field, and a link like `booking.html?code=MARINE10` fills it in. The code is checked by the API at step 3.
- Long-stay discounts: 10% from 7 nights, 11% from 10, 16% from 14, 26% from 30.

## Rates and capacity

| Residence | Type | Guests | From (EUR / night) |
|---|---|---|---|
| Cabana | Jungle Studio | 2 | 113 |
| Azoria | Jungle Residence | 3 | 148 |
| Kartika | Two-Bedroom Home | 4 | 191 |
| Kartika Extended | | 5 | 164 (to confirm, see below) |

## How the pages are made

The HTML pages are generated by a Python build script and then committed here, so the same header, footer and styles stay identical on every page. Small text fixes can be made directly in the HTML. Larger changes (a new section, a new page, a layout change) are better made in the generator and rebuilt, otherwise the next rebuild will undo them.

## Still to confirm before launch

- Zapier hook in `api/config.php` on the server (forms go to WhatsApp until then).
- Kartika Extended is priced at $177, which is lower than Kartika at $206.
- Eight photos from the Canva mock-up were not in the Drive folders.
- Licence for the Adobe Stock spa photo (tierra-09).
- Azoria's main photo (res-13) shows a TV brand logo.
- Instagram handle, email address and map pin.
- Privacy Policy and Terms should be checked by a lawyer.
