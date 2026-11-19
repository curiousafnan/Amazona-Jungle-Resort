# Changelog

## November 2026

### Logos (19 November)
- Client logo artwork in place: green logo in the header on every page, cream logo in the footer and the pop-up menu.
- New favicon and app icons from the logo's "A" (cream on brand green), and a new share image (cream logo on the palm photo) for WhatsApp, Facebook and other link previews.
- Stylesheet version bumped so visitors get the new styles.

### Support email (18 November)
- booking@amazonajungleresort.com added as the support and reservations email: Contact page, footer on every page, next to the Register Interest form, Privacy Policy, Terms, resort details for Google, and the fallback message when a form fails to send.

### Live availability on the booking page (18 November)
- Step 2 now checks the chosen residence, dates and guests with the booking system as soon as they're set: "Available for these dates" (with the number of residences for a group), or the reason it isn't and a WhatsApp link. Nothing is held until payment. Quick changes wait a moment and repeat answers aren't asked again.
- "Continue to payment" stays on step 2 when the dates are known to be taken.
- When the booking system can't price the stay, the payment button stays off with "Try again" and a WhatsApp link. It no longer says "you can still continue".

### Two-step staff sign-in and lighter page loads (18 November)
- Booking admin: the owner and staff who can move money (refunds, commission payouts, fee settings) now enter a code from their email after the password. "Trust this browser" skips it for 30 days.
- Prices and exchange rates are now kept by the visitor's browser for 5 and 15 minutes, so browsing the site costs about 2 server requests per visit instead of 2 per page.

### Security (18 November)
- New `.htaccess`: HTTPS forced, HSTS, no framing by other sites, no folder listings, and `.git`, notes and settings files are never served.
- Booking API hardened: caps on unpaid bookings holding rooms (per email and per visitor), password guessing limited across connections, sessions ended when staff are reset or switched off, strict Content-Security-Policy on signed-in pages, safer spreadsheet exports, and a pre-launch `amazona:security-check`.

### Booking open, stays from 15 December (18 November)
- Booking is open now. Guests can book any stay that starts on or after 15 December 2026, the opening day. The date pickers start there, earlier days are greyed out, and a typed-in earlier date gets a clear message. The booking API refuses earlier stays too.
- The green top bar now says "Now booking stays from 15 December 2026" with a "Book your stay" link. It removes itself on the opening day.
- Terms (Reservations) updated to match.

### Group bookings (18 November)
- A group bigger than one residence can now book several of the same type in one booking and one payment, as at Coco: 5 guests in Cabanas get 3 Cabanas. The guest picker goes up to 4 residences' worth (shown as "5 Guests (3 residences)"), and the price, summary and payment step show the count.
- If not enough are free for the dates, the page says how many are left.

### Codes and live prices (16 November)
- Booking page: a "Code (optional)" field for ambassador discount codes. Links like `booking.html?code=MARINE10` fill it in. The price at step 3 shows the code's discount; a code that doesn't work says why and the guest fixes or clears it before paying.
- Prices now come from the booking API (`/api/residences`), so a rate change on the server shows everywhere on the site without editing the pages.
- The summary bar on the payment step shows the server's final total (code and fee included).

### Prices in euros (16 November)
- All rates are now set in euros: Cabana €113, Azoria €148, Kartika €191, Kartika Extended €164 a night. The currency switcher opens on EUR, with IDR and USD as options.
- IDR and USD now use the booking API's live rates instead of fixed ones, so the rupiah price shown is the rupiah price charged.
- The payment step shows the price in euros and, when a few more nights would cost less (27 to 29 nights against the 30-night rate), offers the longer stay with one button.
- Booking API address changed to `book.amazonajungleresort.com`.
- The payment result page no longer passes the booking link on to other sites (no-referrer).
- Terms, Privacy and the booking page copy updated for euros. Lead fields `rate_usd` / `total_usd` are now `rate_eur` / `total_eur`: update the Zapier mapping.

### Online booking (16 November)
- Booking page now books for real through the new booking API: live availability from Guesty, the exact price shown before paying, and card payment on DOKU's secure page. Bank transfer and "Hold my dates" are gone from the payment step.
- Phone / WhatsApp is now required on the booking form, with the country code, because DOKU needs it.
- New `booking-status.html`: where DOKU sends the guest back. It checks the real payment status and shows confirmed, payment received, not completed (with Pay now) or expired.
- Terms (Rates and Payment) and Privacy Policy (DOKU and Guesty named) updated to match.

### Booking and forms
- New brand-coloured date picker for Arrival and Departure on the Register Interest and booking forms, replacing the browser's blue calendar. Works with the keyboard, shades the nights between the two dates, and stays on screen on phones.
- Register Interest and booking request forms now send leads through `api/lead.php` to Zapier, which passes them on to GoHighLevel. If sending fails, the visitor gets a WhatsApp link with their details filled in.
- Spam protection on the form handler: honeypot, minimum time on page, same-domain check, rate limit.

### Reservations
- Reservations are shown as closed until 15 December 2026 (Bali time): top bar, Register Interest form on the booking page, and calculator buttons that lead to it. The site switches to the full booking flow by itself on the opening date.

### Legal
- Wrote the Privacy Policy (Indonesian PDP Law 27/2022, GDPR rights, HighLevel and Zapier named) and the Terms (under construction notice, reservations, rates and currency, payment, cancellations, liability, Indonesian law).
- Removed the "Indicative visuals / front-end demonstration" note from the footer.

### Production readiness
- Canonical links, Open Graph and Twitter share tags, share image, favicon set and web manifest on every page.
- Resort details for Google (JSON-LD) on the home page.
- `robots.txt`, `sitemap.xml` and a branded 404 page.
- Heading order and link labels fixed for screen readers.
- Phone audit scores after the fixes: home page Performance 91, Accessibility 100, Best Practices 96, SEO 100.

### Photos and speed
- Photos placed per the client's Canva mock-up, using the new photos from the Drive folders (palm hero, singing bowls, outdoor cinema and others).
- All photos converted to WebP and compressed. The home hero has a lighter 780px crop for phones.
- Photos below the fold load as you scroll, and the hero and first residence photo are preloaded.
- Azoria page: the main photo now loads in 2.6s on phones, down from 5.1s.

### Design
- Dark overlay on the home page hero so the text reads clearly.
- Hero subtitle: "Water" now sits on the same line as the second sentence (the break is hidden on phones).

### Repository
- Kept the main (non-Minimal) design live. The Minimal version that had been pushed was overridden with `git merge -s ours`.
