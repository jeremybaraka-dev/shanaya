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
  let itemCents = 0;
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
  }
  const shipCents = itemCents < cents(settings.freeShippingOver) ? cents(settings.shippingFee) : 0;
  if (cents(Number(pu.amount.value)) !== itemCents + shipCents) throw new CheckoutError('Order does not match our prices.', 409);
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

module.exports = { paypalEnv, accessToken, priceCart, readBody, send, endpoint, CheckoutError, orderToken, checkOrderToken, verifyOrder };
