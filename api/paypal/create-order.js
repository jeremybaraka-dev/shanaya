// POST /api/paypal/create-order  body: { items: [{ id, size, qty }] }
// Prices, shipping and totals are worked out here from the catalog.
const { endpoint, readBody, priceCart, accessToken, send, orderToken } = require('../_paypal');

module.exports = endpoint(async (req, res, env) => {
  const order = priceCart(readBody(req).items);
  const token = await accessToken(env);
  const r = await fetch(`${env.base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  const data = await r.json();
  if (!r.ok || !data.id) throw new Error(`create order failed (${r.status}): ${JSON.stringify(data).slice(0, 500)}`);
  return send(res, 200, { id: data.id, pass: orderToken(data.id, env) });
});
