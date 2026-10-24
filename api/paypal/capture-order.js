// POST /api/paypal/capture-order  body: { orderID, pass }
// Takes the payment after the customer approves it in PayPal and returns a
// receipt built from PayPal's confirmed order. (PayPal emails the shop owner
// and the customer about each sale on its own.)
// Safety: only orders this server created (valid pass) are captured, and the
// order is re-priced from the catalog before any money is taken.
const { endpoint, readBody, accessToken, send, CheckoutError, checkOrderToken, verifyOrder } = require('../_paypal');
const { toReceipt } = require('../../js/receipt.js');

async function getOrder(env, token, orderID) {
  const r = await fetch(`${env.base}/v2/checkout/orders/${orderID}`, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) throw new CheckoutError('Order not found.', 404);
  if (!r.ok) throw new Error(`get order failed (${r.status})`);
  return r.json();
}

module.exports = endpoint(async (req, res, env) => {
  const body = readBody(req);
  const orderID = String(body.orderID || '');
  if (!/^[A-Z0-9]{8,32}$/.test(orderID)) throw new CheckoutError('Bad order reference.');
  checkOrderToken(orderID, body.pass, env);

  const token = await accessToken(env);
  const before = await getOrder(env, token, orderID);
  verifyOrder(before);

  let status = before.status;
  if (status === 'APPROVED') {
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
    status = data.status;
  } else if (status !== 'COMPLETED') {
    throw new CheckoutError('This payment was not approved yet.', 409);
  }

  const result = { status };
  if (status === 'COMPLETED') {
    let order = before;
    try { order = await getOrder(env, token, orderID); } catch (e) { /* fall back to the pre-capture copy */ }
    result.firstName = order.payer && order.payer.name ? order.payer.name.given_name : '';
    result.receipt = toReceipt(order);
  }
  return send(res, 200, result);
});
