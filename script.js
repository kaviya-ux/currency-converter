// script.js
// Handles fetching currency list + exchange rates from the free Frankfurter
// API (no API key required, CORS enabled), converting amounts, and keeping
// a local history of past conversions.

// ELEMENTS
const amountInput = document.getElementById("amountInput");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const swapBtn = document.getElementById("swapBtn");
const convertBtn = document.getElementById("convertBtn");
const errorMessage = document.getElementById("errorMessage");
const loadingState = document.getElementById("loadingState");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");
const rateText = document.getElementById("rateText");
const rateDate = document.getElementById("rateDate");
const historyList = document.getElementById("historyList");
const historyEmptyState = document.getElementById("historyEmptyState");

const HISTORY_KEY = "currency-converter-history";
const API_BASE = "https://api.frankfurter.dev/v1";

// FALLBACK CURRENCY LIST
// Used immediately so the dropdowns are never empty, and as a backup if the
// live /currencies endpoint fails for any reason. Frankfurter itself covers
// this same set of major currencies.
const FALLBACK_CURRENCIES = {
    USD: "United States Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    INR: "Indian Rupee",
    AUD: "Australian Dollar",
    CAD: "Canadian Dollar",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    SGD: "Singapore Dollar",
    NZD: "New Zealand Dollar",
    ZAR: "South African Rand",
    BRL: "Brazilian Real",
    MXN: "Mexican Peso",
    HKD: "Hong Kong Dollar",
    SEK: "Swedish Krona",
    NOK: "Norwegian Krone",
    DKK: "Danish Krone",
    KRW: "South Korean Won",
    THB: "Thai Baht",
    IDR: "Indonesian Rupiah",
    MYR: "Malaysian Ringgit",
    PHP: "Philippine Peso",
    PLN: "Polish Zloty",
    TRY: "Turkish Lira",
    CZK: "Czech Koruna",
    HUF: "Hungarian Forint",
    ILS: "Israeli New Shekel",
    RON: "Romanian Leu",
    ISK: "Icelandic Krona"
};

// SHOW / HIDE HELPERS
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}

function hideError() {
    errorMessage.classList.add("hidden");
    errorMessage.textContent = "";
}

function setLoading(isLoading) {
    if (isLoading) {
        loadingState.classList.remove("hidden");
        loadingState.classList.add("flex");
        convertBtn.disabled = true;
    } else {
        loadingState.classList.add("hidden");
        loadingState.classList.remove("flex");
        convertBtn.disabled = false;
    }
}

// POPULATE THE FROM/TO DROPDOWNS
function populateCurrencyDropdowns(currencies, defaultFrom, defaultTo) {
    fromCurrency.innerHTML = "";
    toCurrency.innerHTML = "";

    Object.keys(currencies).sort().forEach(function (code) {
        const label = code + " — " + currencies[code];

        const fromOption = document.createElement("option");
        fromOption.value = code;
        fromOption.textContent = label;
        fromCurrency.appendChild(fromOption);

        const toOption = document.createElement("option");
        toOption.value = code;
        toOption.textContent = label;
        toCurrency.appendChild(toOption);
    });

    fromCurrency.value = currencies[defaultFrom] ? defaultFrom : Object.keys(currencies)[0];
    toCurrency.value = currencies[defaultTo] ? defaultTo : Object.keys(currencies)[1];
}

// LOAD THE FULL CURRENCY LIST FROM THE API (falls back silently on failure)
async function loadCurrencies() {
    // populate immediately with the fallback list so the UI is usable right away
    populateCurrencyDropdowns(FALLBACK_CURRENCIES, "USD", "EUR");

    try {
        const response = await fetch(API_BASE + "/currencies");
        const data = await response.json();

        if (data && Object.keys(data).length > 0) {
            populateCurrencyDropdowns(data, "USD", "EUR");
        }
    } catch (error) {
        // silently keep the fallback list — conversion still works fine
        // since Frankfurter supports all of these codes either way
    }
}

// SWAP FROM / TO CURRENCIES
function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
}

// MAIN CONVERT HANDLER
async function handleConvert() {
    hideError();

    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || amount <= 0) {
        showError("Please enter an amount greater than 0.");
        return;
    }

    if (!from || !to) {
        showError("Please select both currencies.");
        return;
    }

    if (from === to) {
        showError("Please choose two different currencies.");
        return;
    }

    setLoading(true);
    resultBox.classList.add("hidden");

    try {
        // Official Frankfurter v1 pattern: fetch the rate with base/symbols,
        // then multiply by the amount ourselves (see https://frankfurter.dev/v1/)
        const url = API_BASE + "/latest?base=" + from + "&symbols=" + to;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.rates || data.rates[to] === undefined) {
            throw new Error("Unexpected response from the exchange rate service.");
        }

        const unitRate = data.rates[to];
        const convertedAmount = amount * unitRate;

        displayResult(amount, from, convertedAmount, to, unitRate, data.date);
        saveToHistory(amount, from, convertedAmount, to);
        renderHistory();
    } catch (error) {
        showError(
            "Couldn't fetch exchange rates right now (the free rates service may be unavailable). Please try again in a moment."
        );
    } finally {
        setLoading(false);
    }
}

// DISPLAY RESULT
function displayResult(amount, from, convertedAmount, to, unitRate, date) {
    resultText.textContent = formatNumber(amount) + " " + from + " = " + formatNumber(convertedAmount) + " " + to;
    rateText.textContent = "1 " + from + " = " + formatNumber(unitRate) + " " + to;
    rateDate.textContent = "Rates as of " + date;
    resultBox.classList.remove("hidden");
}

function formatNumber(value) {
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    });
}

// LOCAL STORAGE HISTORY
function getHistory() {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveToHistory(amount, from, convertedAmount, to) {
    const history = getHistory();

    history.unshift({
        amount: amount,
        from: from,
        convertedAmount: convertedAmount,
        to: to,
        createdAt: new Date().toISOString()
    });

    // keep the last 15 entries only
    const trimmed = history.slice(0, 15);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

function renderHistory() {
    const history = getHistory();
    historyList.innerHTML = "";

    if (history.length === 0) {
        historyEmptyState.classList.remove("hidden");
        return;
    }

    historyEmptyState.classList.add("hidden");

    history.forEach(function (item) {
        const row = document.createElement("div");
        row.className = "flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3 text-sm";

        row.innerHTML =
            '<span class="text-gray-700">' +
                formatNumber(item.amount) + " " + item.from + " → " + formatNumber(item.convertedAmount) + " " + item.to +
            '</span>' +
            '<span class="text-gray-400 text-xs">' + new Date(item.createdAt).toLocaleDateString() + '</span>';

        historyList.appendChild(row);
    });
}

function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
}

// ALLOW PRESSING ENTER IN THE AMOUNT FIELD
amountInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        handleConvert();
    }
});

// INITIAL LOAD
loadCurrencies();
renderHistory();

