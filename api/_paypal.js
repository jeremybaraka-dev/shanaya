/* Shared PayPal helpers for the checkout functions (the leading "_" keeps
   Vercel from exposing this file as an endpoint).

   Prices always come from js/products.js — the browser only says which
   product, size and quantity, so nobody can change what they pay. */
const crypto = require('crypto');
const catalog = require('../js/products.js');
const settings = require('../js/payments.js');

const MAX_QTY = 20;
const MAX_LINES = 30;

class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function paypalEnv() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const live = String(process.env.PAYPAL_MODE || '').trim().toLowerCase() === 'live';
  return {
    id, secret, live,
    ready: Boolean(id && secret),
    base: live ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
  };
}

// The PayPal token lasts hours: reuse it while this server instance stays warm
// (and share one request when many checkouts start at once) instead of asking
// PayPal for a new one on every call, which it rate-limits under heavy traffic.
let tokenCache = null; // { key, value, until, pending }
async function accessToken(env) {
  const key = `${env.base}|${env.id}`;
  if (tokenCache && tokenCache.key === key) {
    if (tokenCache.value && Date.now() < tokenCache.until) return tokenCache.value;
    if (tokenCache.pending) return tokenCache.pending;
  }
  const pending = fetchToken(env).then((t) => {
    tokenCache = { key, value: t.access_token, until: Date.now() + Math.max(60, (t.expires_in || 3600) - 300) * 1000 };
    return t.access_token;
  }, (err) => { tokenCache = null; throw err; });
  tokenCache = { key, pending };
  return pending;
}
async function fetchToken(env) {
  const res = await fetch(`${env.base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${env.id}:${env.secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  return res.json();
}

const cents = (n) => Math.round(n * 100);
const money = (c) => (c / 100).toFixed(2);

// Turns [{ id, size, qty }] from the browser into a PayPal order priced from the catalog.
function priceCart(lines) {
  if (!Array.isArray(lines) || lines.length === 0) throw new CheckoutError('Your bag is empty.');
  if (lines.length > MAX_LINES) throw new CheckoutError('Your bag has too many items.');

  const merged = new Map();
  for (const line of lines) {
    const p = catalog.PRODUCTS.find((x) => x.id === Number(line && line.id));
    if (!p || p.soon) throw new CheckoutError('A product in your bag is no longer available.');
    const size = String(line.size);
    if (!p.sizes.includes(size)) throw new CheckoutError(`Please pick a valid ${(p.optionLabel || 'size').toLowerCase()} for ${p.name}.`);
    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new CheckoutError('Please check the quantities in your bag.');
    const key = `${p.id}|${size}`;
    const prev = merged.get(key);
    merged.set(key, { p, size, qty: Math.min(MAX_QTY, (prev ? prev.qty : 0) + qty) });
  }

  const cur = settings.currency;
  let itemCents = 0;
  const items = [...merged.values()].map(({ p, size, qty }) => {
    itemCents += cents(p.price) * qty;
    return {
      name: p.name.slice(0, 120),
      description: (p.optionLabel && p.optionLabel !== 'Size' ? size : `Size ${size}`).slice(0, 127),
      sku: `${p.id}-${size}`.slice(0, 120),
      unit_amount: { currency_code: cur, value: money(cents(p.price)) },
      quantity: String(qty),
      category: 'PHYSICAL_GOODS',
    };
  });
  const allFree = [...merged.values()].every(({ p }) => p.freeShip);
  const shipCents = allFree || itemCents >= cents(settings.freeShippingOver) ? 0 : cents(settings.shippingFee);

  return {
    intent: 'CAPTURE',
    purchase_units: [{
      description: 'Nails by Shanaya order',
      amount: {
        currency_code: cur,
        value: money(itemCents + shipCents),
        breakdown: {
          item_total: { currency_code: cur, value: money(itemCents) },
          shipping: { currency_code: cur, value: money(shipCents) },
        },
      },
      items,
    }],
    application_context: { brand_name: 'Nails by Shanaya', shipping_preference: 'GET_FROM_FILE', user_action: 'PAY_NOW' },
  };
}

function readBody(req) {
  // Vercel parses JSON lazily and throws on malformed bodies — treat that as a bad request.
  try {
    const body = req.body;
    if (body && typeof body === 'object') return body;
    return JSON.parse(body || '{}');
  } catch (e) {
    throw new CheckoutError('Bad request.');
  }
}

/* Order pass: create-order hands the buyer's browser an HMAC of the order ID.
   capture-order only works with it, so nobody can complete an order this
   server didn't create, or read someone else's receipt from an order number. */
function orderToken(orderID, env) {
  return crypto.createHmac('sha256', env.secret).update(`shanaya-order:${orderID}`).digest('base64url');
}
function checkOrderToken(orderID, token, env) {
  const want = Buffer.from(orderToken(orderID, env));
  const got = Buffer.from(String(token || ''));
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) throw new CheckoutError('This checkout session has expired. Please try again.', 403);
}

// Re-prices a PayPal order from the catalog; throws if anything doesn't match.
function verifyOrder(order) {
  const pu = (order.purchase_units || [])[0];
  if (!pu || !pu.amount || pu.amount.currency_code !== settings.currency) throw new CheckoutError('Order does not match our prices.', 409);
  const items = pu.items || [];
  if (!items.length) throw new CheckoutError('Order does not match our prices.', 409);
  let itemCents = 0, allFree = true;
  for (const it of items) {
    const [idPart, ...sizeParts] = String(it.sku || '').split('-');
    const p = catalog.PRODUCTS.find((x) => x.id === Number(idPart));
    const size = sizeParts.join('-');
    const qty = Number(it.quantity);
    if (!p || p.soon || !p.sizes.includes(size) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY
      || cents(Number((it.unit_amount || {}).value)) !== cents(p.price)) {
      throw new CheckoutError('Order does not match our prices.', 409);
    }
    itemCents += cents(p.price) * qty;
    if (!p.freeShip) allFree = false;
  }
  const shipCents = allFree || itemCents >= cents(settings.freeShippingOver) ? 0 : cents(settings.shippingFee);
  if (cents(Number(pu.amount.value)) !== itemCents + shipCents) throw new CheckoutError('Order does not match our prices.', 409);
}

function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(data);
}

// A light brake per visitor (per server instance): stops one browser or script
// from flooding checkout with orders. Real shoppers never come close.
const HITS = new Map();
const LIMIT = 30, WINDOW_MS = 60 * 1000;
function tooMany(req) {
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const h = HITS.get(ip);
  if (!h || now - h.start > WINDOW_MS) { HITS.set(ip, { start: now, n: 1 }); }
  else if (++h.n > LIMIT) return true;
  if (HITS.size > 5000) for (const [k, v] of HITS) if (now - v.start > WINDOW_MS) HITS.delete(k);
  return false;
}
// Checkout calls come from our own pages: a browser on another site gets turned away.
function foreignOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host !== req.headers.host; } catch (e) { return true; }
}

// Wraps a handler: POST only, our own pages only, rate-braked, keys configured,
// friendly errors, details logged server-side.
function endpoint(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Method not allowed.' }); }
    if (foreignOrigin(req)) return send(res, 403, { error: 'Forbidden.' });
    if (tooMany(req)) { res.setHeader('Retry-After', '60'); return send(res, 429, { error: 'Too many tries. Please wait a minute and try again.' }); }
    const env = paypalEnv();
    if (!env.ready) return send(res, 503, { error: 'Checkout is not set up yet.' });
    try {
      return await fn(req, res, env);
    } catch (err) {
      if (err instanceof CheckoutError) return send(res, err.status, { error: err.message });
      console.error('[checkout]', err);
      return send(res, 502, { error: 'Payment service is unavailable. Please try again.' });
    }
  };
}

module.exports = { paypalEnv, accessToken, priceCart, readBody, send, endpoint, CheckoutError, orderToken, checkOrderToken, verifyOrder };
