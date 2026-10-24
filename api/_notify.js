/* New-sale email to the shop owner, sent through Resend (resend.com).
   Needs two Vercel environment variables:
     RESEND_API_KEY  — from resend.com → API Keys
     NOTIFY_EMAIL    — where sale emails go (must be your Resend sign-up
                       email until you verify a domain in Resend)
   Optional: NOTIFY_FROM (defaults to Resend's shared test sender).
   If they're missing, sales still work — just no email. */
const { money, prettyDate } = require('../js/receipt.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function saleEmail(r) {
  const rows = r.items.map((it) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #E7E0C1"><b>${esc(it.name)}</b><br><span style="color:#5F5D49;font-size:13px">Size ${esc(it.size || '-')}</span></td>
      <td style="padding:10px 0;border-bottom:1px solid #E7E0C1;text-align:center">${esc(it.qty)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #E7E0C1;text-align:right">${esc(money(it.unit * it.qty))}</td>
    </tr>`).join('');
  const ship = [r.shipTo.name, ...r.shipTo.lines].filter(Boolean).map(esc).join('<br>') || 'See PayPal';
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#23233A">
    <div style="background:#FCB5D0;padding:24px 28px;border-radius:16px 16px 0 0">
      <div style="font-size:13px;font-weight:bold;letter-spacing:1px">NAILS BY SHANAYA</div>
      <div style="font-size:26px;font-weight:bold;margin-top:6px">New order — ${esc(money(r.total, r.currency))} 💅</div>
    </div>
    <div style="background:#FBF9F1;padding:24px 28px;border-radius:0 0 16px 16px">
      <p style="margin:0 0 16px"><b>${esc(r.buyer.name || 'A customer')}</b> just paid on ${esc(prettyDate(r.date))}.</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        <tr style="color:#626283;font-size:12px"><th align="left">ITEM</th><th>QTY</th><th align="right">TOTAL</th></tr>
        ${rows}
        <tr><td colspan="2" style="padding-top:10px;color:#5F5D49">Subtotal</td><td style="padding-top:10px;text-align:right">${esc(money(r.subtotal))}</td></tr>
        <tr><td colspan="2" style="color:#5F5D49">Shipping</td><td style="text-align:right">${r.shipping ? esc(money(r.shipping)) : 'Free'}</td></tr>
        <tr><td colspan="2" style="padding-top:6px"><b>Total paid</b></td><td style="padding-top:6px;text-align:right"><b>${esc(money(r.total, r.currency))}</b></td></tr>
      </table>
      <h3 style="margin:24px 0 6px;font-size:14px">📦 Ship to</h3>
      <p style="margin:0;line-height:1.5">${ship}</p>
      <h3 style="margin:20px 0 6px;font-size:14px">Customer</h3>
      <p style="margin:0">${esc(r.buyer.email || '-')}</p>
      <p style="margin:20px 0 0;font-size:12px;color:#5F5D49">PayPal order ${esc(r.orderId)} · payment ${esc(r.captureId)}<br>
      Check it in PayPal → Activity before shipping.</p>
    </div>
  </div>`;
  const text = [
    `New order — ${money(r.total, r.currency)}`,
    `${r.buyer.name || 'A customer'} (${r.buyer.email || '-'}) paid on ${prettyDate(r.date)}.`,
    '',
    ...r.items.map((it) => `• ${it.name} (Size ${it.size || '-'}) × ${it.qty} — ${money(it.unit * it.qty)}`),
    '',
    `Subtotal ${money(r.subtotal)} · Shipping ${r.shipping ? money(r.shipping) : 'Free'} · Total ${money(r.total, r.currency)}`,
    '',
    'Ship to:', r.shipTo.name, ...r.shipTo.lines,
    '',
    `PayPal order ${r.orderId} · payment ${r.captureId}`,
  ].filter((l) => l !== undefined).join('\n');
  return { html, text };
}

// Never throws: a failed email must not break the customer's checkout.
async function notifySale(receipt) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return { sent: false, reason: 'not configured' };
  const { html, text } = saleEmail(receipt);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || 'Nails by Shanaya <onboarding@resend.dev>',
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        subject: `New order ${money(receipt.total, receipt.currency)} — ${receipt.buyer.name || 'Nails by Shanaya'}`,
        html,
        text,
      }),
    });
    if (!r.ok) {
      console.error('[notify] Resend error', r.status, (await r.text()).slice(0, 300));
      return { sent: false, reason: `resend ${r.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error('[notify] failed', err && err.message);
    return { sent: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { notifySale, saleEmail };
