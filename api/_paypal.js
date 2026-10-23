/* Shared PayPal helpers for the checkout functions (the leading "_" keeps
   Vercel from exposing this file as an endpoint).

   Prices always come from js/products.js — the browser only says which
   product, size and quantity, so nobody can change what they pay. */
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

async function accessToken(env) {
  const res = await fetch(`${env.base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${env.id}:${env.secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  return (await res.json()).access_token;
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
    if (!p) throw new CheckoutError('A product in your bag is no longer available.');
    const size = String(line.size);
    if (!p.sizes.includes(size)) throw new CheckoutError(`Please pick a valid size for ${p.name}.`);
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
      description: `Size ${size}`,
      sku: `${p.id}-${size}`.slice(0, 120),
      unit_amount: { currency_code: cur, value: money(cents(p.price)) },
      quantity: String(qty),
      category: 'PHYSICAL_GOODS',
    };
  });
  const shipCents = itemCents < cents(settings.freeShippingOver) ? cents(settings.shippingFee) : 0;

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
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { throw new CheckoutError('Bad request.'); }
}

function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(data);
}

// Wraps a handler: POST only, keys configured, friendly errors, details logged server-side.
function endpoint(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Method not allowed.' }); }
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

module.exports = { paypalEnv, accessToken, priceCart, readBody, send, endpoint, CheckoutError };
