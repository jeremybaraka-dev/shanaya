// GET /api/paypal/config — tells the website which PayPal Client ID to load.
// The Client ID is public by design; the Secret never leaves the server.
const { paypalEnv, send } = require('../_paypal');

module.exports = (req, res) => {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { error: 'Method not allowed.' }); }
  const env = paypalEnv();
  if (!env.ready) return send(res, 503, { error: 'Checkout is not set up yet.' });
  return send(res, 200, { clientId: env.id, mode: env.live ? 'live' : 'sandbox' });
};
