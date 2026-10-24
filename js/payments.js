/* ═══════════════════════════════════════════════════════
   SHOP SETTINGS — read by both the website and the checkout server.

   PayPal keys do NOT go in this file. One-time setup on Vercel:
   Project → Settings → Environment Variables, add:
     PAYPAL_CLIENT_ID      your Live Client ID
     PAYPAL_CLIENT_SECRET  your Live Secret
     PAYPAL_MODE           live
   then redeploy. After that, payments run on their own 24/7.
═══════════════════════════════════════════════════════ */
(function (root) {
  var SETTINGS = {
    currency: 'USD',          // what customers are charged in
    freeShippingOver: 50,     // orders of this amount or more ship free
    shippingFee: 10,          // flat shipping charged on orders under the free-shipping amount
  };
  if (typeof module === 'object' && module.exports) module.exports = SETTINGS;
  else root.SHANAYA_PAY = SETTINGS;
})(this);
