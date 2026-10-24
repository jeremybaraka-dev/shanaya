// POST /api/paypal/capture-order  body: { orderID }
// Takes the payment after the customer approves it in PayPal and returns a
// receipt built from PayPal's confirmed order. (PayPal emails the shop owner
// and the customer about each sale on its own.)
const { endpoint, readBody, accessToken, send, CheckoutError } = require('../_paypal');
const { toReceipt } = require('../../js/receipt.js');

module.exports = endpoint(async (req, res, env) => {
  const orderID = String(readBody(req).orderID || '');
  if (!/^[A-Z0-9]{8,32}$/.test(orderID)) throw new CheckoutError('Bad order reference.');

  const token = await accessToken(env);
  const r = await fetch(`${env.base}/v2/checkout/orders/${orderID}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `capture-${orderID}`, // makes retries safe: never charges twice
    },
  });
  const data = await r.json();

  // Card declined: let the customer try another card or method.
  const issue = data && data.details && data.details[0] && data.details[0].issue;
  if (r.status === 422 && issue === 'INSTRUMENT_DECLINED') return send(res, 422, { declined: true });
  if (!r.ok) throw new Error(`capture failed (${r.status}): ${JSON.stringify(data).slice(0, 500)}`);

  const capture = data.purchase_units && data.purchase_units[0] && data.purchase_units[0].payments
    && data.purchase_units[0].payments.captures && data.purchase_units[0].payments.captures[0];
  const result = {
    status: data.status,
    captureStatus: capture ? capture.status : null,
    firstName: data.payer && data.payer.name ? data.payer.name.given_name : '',
  };

  if (data.status === 'COMPLETED') {
    // The capture reply can leave out the item list, so read the full order back.
    let order = data;
    try {
      const full = await fetch(`${env.base}/v2/checkout/orders/${orderID}`, { headers: { Authorization: `Bearer ${token}` } });
      if (full.ok) order = await full.json();
    } catch (e) { /* fall back to the capture reply */ }
    result.receipt = toReceipt(order);
  }
  return send(res, 200, result);
});
