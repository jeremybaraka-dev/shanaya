# Nails by Shanaya

Shop site for handcrafted press-on nails and stick-ons — static pages plus a small
PayPal checkout API, hosted on Vercel.

## Pages

- `index.html` — home
- `shop.html` — all products, filters, bag
- `policies.html` — shipping, returns, privacy, contact
- `404.html` — page not found

## Editing the shop

- **Products and prices:** `js/products.js` (the checkout server charges these prices)
- **Shipping and currency:** `js/payments.js`
- **Photos:** each set has web-sized photos in `images/products/` (see
  `_PHOTO-NAMES.txt` there); originals stay on your computer only
- **Home page story:** the scroll scenes are built in `js/story.js`

## Payments (one-time setup)

Checkout runs through the functions in `api/paypal/`, which price every order from
`js/products.js`. Add these in Vercel → Project → Settings → Environment Variables,
then redeploy:

| Name | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | your Live Client ID |
| `PAYPAL_CLIENT_SECRET` | your Live Secret |
| `PAYPAL_MODE` | `live` |

Never commit the Secret. Without these variables the site shows a
"checkout unavailable" message instead of the payment buttons.

## Receipts and sale emails

After every completed payment the customer can download a PDF receipt, built
from PayPal's confirmed order in `js/receipt.js`. PayPal itself emails both the
shop owner and the customer about every sale.

## Pinterest

`/pinterest-catalog.csv` is a product feed for Pinterest Catalogs, built from
`js/products.js`. Only products with a photo are listed.

Smooth scrolling uses [Lenis](https://github.com/darkroomengineering/lenis) (MIT).
