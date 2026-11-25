# Moin Mutton Mart website

Static one-page site for Moin Mutton Mart, Mallepally X Road, Hyderabad. No build step: plain HTML and CSS.

## Files
- `index.html` the page (search for `TODO` to find what still needs real content)
- `styles.css` styling
- `images/logo.png` shop logo
- `robots.txt`, `sitemap.xml` search engine files (update the domain in both)

## Still to fill in
1. Real domain in `index.html` (canonical, og:image, JSON-LD), `robots.txt` and `sitemap.xml`
2. Opening hours
3. Rates (replace "Today's rate: ask")
4. Google Maps embed and directions link, after the Google Business Profile is verified
5. Real shop photos in `images/`

## Preview locally
Open `index.html` in a browser, or run `python3 -m http.server` in this folder.

## Deploy
Connect this repo to Netlify or Cloudflare Pages (free). Build command: none. Publish directory: the repo root. Then point the domain to it.

## Rules
- Do not commit passwords, logins or API keys.
- Keep the domain and hosting logins safe until the project balance is cleared, then transfer ownership to the shop owner.
