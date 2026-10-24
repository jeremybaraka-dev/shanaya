// GET /pinterest-catalog.csv — product feed for Pinterest Catalogs.
// Built from js/products.js on every request, so prices and products stay in
// sync with the shop. Only products whose photo exists are listed: Pinterest
// rejects items without a real image.
const catalog = require('../js/products.js');
const settings = require('../js/payments.js');

const SITE_URL = 'https://nailsbyshanaya.vercel.app';
const COLUMNS =['id', 'title', 'description', 'link', 'image_link', 'price', 'sale_price', 'availability', 'condition', 'brand', 'product_type'];
const TYPES = {
  'press-on': 'Beauty > Nails > Press-On Nails',
  gel: 'Beauty > Nails > Press-On Nails',
  french: 'Beauty > Nails > Press-On Nails',
  chrome: 'Beauty > Nails > Press-On Nails',
  limited: 'Beauty > Nails > Press-On Nails',
  custom: 'Beauty > Nails > Custom Nail Art',
  'stick-on': 'Beauty > Nails > Nail Stickers',
};

const cell = (v) => {
  const s = String(v == null ? '' : v).replace(/\r?\n/g, ' ');
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const money = (n) => `${Number(n).toFixed(2)} ${settings.currency}`;

async function photoExists(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok && /^image\//.test(r.headers.get('content-type') || '');
  } catch (e) {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Method not allowed');
  }
  // Links and photo checks always use the real shop address — never a
  // request header, which a visitor could fake to point us at another site.
  const host = String(req.headers.host || '');
  const local = !process.env.VERCEL && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const base = local ? `http://${host}` : SITE_URL;

  const items = await Promise.all(catalog.PRODUCTS.map(async (p) => {
    const image = `${base}/${p.img}`;
    if (!(await photoExists(image))) return null;
    const onSale = p.oldPrice && p.oldPrice > p.price;
    return {
      id: `SHANAYA-${p.id}`,
      title: `${p.name} — Nails by Shanaya`,
      description: `${p.desc} Handcrafted by Shanaya. Sizes: ${p.sizes.join(', ')}.`,
      link: `${base}/shop.html?cat=${encodeURIComponent(p.category)}`,
      image_link: image,
      price: money(onSale ? p.oldPrice : p.price),
      sale_price: onSale ? money(p.price) : '',
      availability: 'in stock',
      condition: 'new',
      brand: 'Nails by Shanaya',
      product_type: TYPES[p.category] || 'Beauty > Nails',
    };
  }));

  const rows = items.filter(Boolean).map((it) => COLUMNS.map((c) => cell(it[c])).join(','));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
  res.setHeader('X-Products-Listed', String(rows.length));
  return res.status(200).send([COLUMNS.join(','), ...rows].join('\n') + '\n');
};
