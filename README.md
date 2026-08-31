# 💱 Currency Converter

A live currency converter built with HTML, Tailwind CSS, and vanilla JavaScript, split into separate structure, style, and logic files. Convert between 30+ world currencies using real exchange rate data — no API key, no signup, no backend.

## Live Demo

Keep `index.html`, `style.css`, and `script.js` in the same folder and open `index.html` in any browser. Nothing to configure.

## Features

- Convert between 30+ major world currencies
- Live exchange rates pulled from a free, no-key public API
- Swap button to instantly flip the "From" and "To" currencies
- Shows both the converted total and the 1-unit exchange rate (e.g. "1 USD = 0.92 EUR")
- Shows the date the displayed rates are from
- Input validation with clear error messages (zero/invalid amount, same currency picked twice, API failure)
- Loading state while rates are being fetched
- Local history of your last 15 conversions, saved with `localStorage` and persisted across sessions
- "Clear All" button to wipe history
- Works even if the live currency list briefly fails to load — a built-in fallback list of 30 currencies keeps the dropdowns usable immediately, and conversion still works normally

## Tech Stack

- HTML5
- [Tailwind CSS](https://tailwindcss.com/) (via CDN, for layout and styling)
- Plain CSS (`style.css`, for the loading spinner and scrollbar styling)
- Vanilla JavaScript (`script.js`, no frameworks, no build tools)
- [Frankfurter API](https://frankfurter.dev/) — free, open-source exchange rate data sourced from the European Central Bank, no API key required, CORS enabled for direct browser use

## How It Works

- On page load, the currency dropdowns are populated instantly from a built-in fallback list of 30 major currencies, then upgraded with the live list from Frankfurter's `/currencies` endpoint if it responds successfully. This means the app is always usable immediately, even on a slow connection.
- Conversion follows Frankfurter's own recommended pattern: fetch the exchange rate with `?base=FROM&symbols=TO`, then multiply the amount client-side — rather than relying on a server-side "amount" parameter.
- The result shows the total converted amount, the 1-unit rate, and the date the rate was published (rates update once a day; on weekends/holidays the most recent business day's rate is shown).
- Every successful conversion is saved as `{ amount, from, convertedAmount, to, createdAt }` in `localStorage` under the key `currency-converter-history`, capped at the 15 most recent entries.

## Project Structure

```
currency-converter/
├── index.html   # markup only — structure and Tailwind utility classes
├── style.css    # small custom styles (spinner animation, scrollbar)
├── script.js    # all logic: validation, API calls, conversion math, history
└── README.md
```

## Possible Improvements

- Historical rate lookup (Frankfurter supports this out of the box)
- A simple line chart of a currency pair's rate over time
- Offline-friendly caching of the last fetched rates
- Dark mode toggle

## License

Free to use for learning or personal projects.
