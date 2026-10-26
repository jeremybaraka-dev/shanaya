/* ═══════════════════════════════════════════════════════
   RECEIPTS — shared by the checkout server and the website.
   toReceipt():  PayPal order → simple receipt object
   receiptPdf(): receipt object → PDF file bytes (no libraries)
═══════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  const num = (v) => Number(v || 0);

  // Normalise a PayPal v2 order (from the server's GET, or a practice capture).
  function toReceipt(order) {
    const pu = (order.purchase_units || [])[0] || {};
    const amount = pu.amount || {};
    const breakdown = amount.breakdown || {};
    const capture = ((pu.payments || {}).captures || [])[0] || {};
    const payer = order.payer || {};
    const shipping = pu.shipping || {};
    const addr = shipping.address || {};
    const items = (pu.items || []).map((it) => ({
      name: it.name || 'Item',
      size: String(it.description || '').replace(/^Size\s*/i, ''),
      qty: num(it.quantity) || 1,
      unit: num((it.unit_amount || {}).value),
    }));
    const subtotal = breakdown.item_total ? num(breakdown.item_total.value) : items.reduce((s, it) => s + it.unit * it.qty, 0);
    return {
      orderId: order.id || '',
      captureId: capture.id || '',
      status: capture.status || order.status || '',
      date: capture.create_time || order.update_time || order.create_time || new Date().toISOString(),
      currency: amount.currency_code || 'USD',
      items,
      subtotal,
      shipping: breakdown.shipping ? num(breakdown.shipping.value) : 0,
      total: num(amount.value),
      buyer: {
        name: [((payer.name || {}).given_name || ''), ((payer.name || {}).surname || '')].join(' ').trim(),
        email: payer.email_address || '',
      },
      shipTo: {
        name: (shipping.name || {}).full_name || '',
        lines: [
          addr.address_line_1,
          addr.address_line_2,
          [addr.admin_area_2, addr.admin_area_1, addr.postal_code].filter(Boolean).join(', '),
          addr.country_code,
        ].filter(Boolean),
      },
    };
  }

  const money = (n, cur) => `$${num(n).toFixed(2)}${cur && cur !== 'USD' ? ' ' + cur : ''}`;
  const prettyDate = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return String(iso || '');
    const m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${m[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  };

  /* ─── Minimal PDF writer (Helvetica, one A4-ish page) ─── */
  // Helvetica widths (per 1000 em) for the characters we right-align.
  const W = { '$': 556, '.': 278, ',': 278, ' ': 278, '-': 333, '×': 584 };
  for (let c = 48; c <= 57; c++) W[String.fromCharCode(c)] = 556;
  const widthOf = (s, size) => [...s].reduce((w, ch) => w + (W[ch] || 556), 0) * size / 1000;

  // PDF standard fonts use WinAnsi: keep Latin-1, swap common symbols, drop the rest.
  function pdfText(s) {
    return String(s == null ? '' : s)
      .replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
      .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
  const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 3) + '...' : String(s));

  function receiptPdf(r) {
    const PW = 595, PH = 842, L = 50, R = PW - 50;
    const ops = [];
    const rgb = (hex) => [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3)).join(' ');
    const text = (x, y, s, { size = 11, bold = false, color = '#401F28', align = 'left' } = {}) => {
      const str = String(s);
      const tx = align === 'right' ? x - widthOf(str, size) : x;
      ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${rgb(color)} rg ${tx.toFixed(2)} ${y.toFixed(2)} Td (${pdfText(str)}) Tj ET`);
    };
    const rect = (x, y, w, h, color) => ops.push(`${rgb(color)} rg ${x} ${y} ${w} ${h} re f`);
    const line = (y, color = '#E6D2C2') => ops.push(`${rgb(color)} RG 1 w ${L} ${y} m ${R} ${y} l S`);

    // header band
    rect(0, PH - 130, PW, 130, '#D38492');
    text(L, PH - 62, 'NAILS BY SHANAYA', { size: 22, bold: true });
    text(L, PH - 84, 'Handcrafted press-on nails & stick-ons', { size: 10 });
    text(R, PH - 62, 'RECEIPT', { size: 22, bold: true, align: 'right' });
    text(R, PH - 84, 'nailsbyshanaya.vercel.app', { size: 10, align: 'right' });

    // order meta
    let y = PH - 175;
    const meta = [
      ['Order number', r.orderId], ['Payment ID', r.captureId || '-'], ['Date', prettyDate(r.date)], ['Status', r.status === 'COMPLETED' ? 'Paid' : (r.status || '-')],
    ];
    meta.forEach(([k, v], i) => {
      const x = i % 2 ? 320 : L;
      if (i && i % 2 === 0) y -= 34;
      text(x, y, k.toUpperCase(), { size: 8, bold: true, color: '#8F3F54' });
      text(x, y - 14, v, { size: 11 });
    });

    // billed / ship to
    y -= 52;
    text(L, y, 'BILLED TO', { size: 8, bold: true, color: '#8F3F54' });
    text(320, y, 'SHIP TO', { size: 8, bold: true, color: '#8F3F54' });
    const billed = [r.buyer.name, r.buyer.email].filter(Boolean);
    const ship = [r.shipTo.name, ...r.shipTo.lines].filter(Boolean);
    for (let i = 0; i < Math.max(billed.length, ship.length, 1); i++) {
      if (billed[i]) text(L, y - 15 - i * 14, clip(billed[i], 42));
      if (ship[i]) text(320, y - 15 - i * 14, clip(ship[i], 40));
    }
    y -= 20 + Math.max(billed.length, ship.length, 1) * 14 + 24;

    // items table
    rect(L, y - 8, R - L, 24, '#F2E4D7');
    text(L + 10, y, 'ITEM', { size: 8, bold: true, color: '#8F3F54' });
    text(340, y, 'QTY', { size: 8, bold: true, color: '#8F3F54' });
    text(430, y, 'PRICE', { size: 8, bold: true, color: '#8F3F54', align: 'right' });
    text(R - 10, y, 'TOTAL', { size: 8, bold: true, color: '#8F3F54', align: 'right' });
    y -= 30;
    r.items.forEach((it) => {
      text(L + 10, y, clip(it.name, 44), { size: 11, bold: true });
      if (it.size) text(L + 10, y - 13, `Size ${it.size}`, { size: 9, color: '#755961' });
      text(340, y, String(it.qty));
      text(430, y, money(it.unit), { align: 'right' });
      text(R - 10, y, money(it.unit * it.qty), { align: 'right' });
      y -= it.size ? 32 : 24;
      line(y + 10);
    });

    // totals
    y -= 10;
    const totals = [['Subtotal', money(r.subtotal)], ['Shipping', r.shipping ? money(r.shipping) : 'Free']];
    totals.forEach(([k, v]) => { text(400, y, k, { size: 10, color: '#755961' }); text(R - 10, y, v, { size: 10, align: 'right' }); y -= 18; });
    y -= 14;
    rect(380, y - 12, R - 380, 30, '#401F28');
    text(392, y, 'TOTAL PAID', { size: 9, bold: true, color: '#D38492' });
    text(R - 10, y - 2, money(r.total, r.currency), { size: 14, bold: true, color: '#FAF3EC', align: 'right' });

    // footer
    text(L, 92, 'Thank you for your order!', { size: 12, bold: true });
    text(L, 76, 'Questions? DM @nailsbyshanaya_ on TikTok or reply to your PayPal receipt email.', { size: 9, color: '#755961' });
    text(L, 62, 'Shipping & returns: nailsbyshanaya.vercel.app/policies.html', { size: 9, color: '#755961' });

    // assemble the file
    const stream = ops.join('\n');
    const objs = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      `<< /Title (${pdfText('Nails by Shanaya receipt ' + r.orderId)}) /Producer (Nails by Shanaya) >>`,
    ];
    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [];
    objs.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = pdf.length;
    pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
    pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return bytes;
  }

  const api = { toReceipt, receiptPdf, money, prettyDate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SHANAYA_RECEIPT = api;
})(this);
