// GET /api/fx — the visitor's likely currency (from the country Vercel sees
// their request coming from) and today's exchange rates from US dollars.
// The website uses it to *show* prices in local money; checkout still
// charges in US dollars (see js/payments.js).
const settings = require('../js/payments.js');

const RATES_URL = 'https://open.er-api.com/v6/latest/' + settings.currency; // free, daily, no key
const FRESH_MS = 6 * 60 * 60 * 1000;
let cache = null;   // { at, rates } — reused while this server instance stays warm
let inflight = null; // one shared fetch when many visitors arrive at once

// Country (ISO 3166) → currency (ISO 4217). Countries not listed see US dollars.
const EURO = 'AT BE CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES HR AD MC SM VA ME XK';
const OTHER = 'US:USD CA:CAD GB:GBP AU:AUD NZ:NZD JP:JPY CN:CNY HK:HKD TW:TWD KR:KRW SG:SGD MY:MYR '
  + 'TH:THB ID:IDR PH:PHP VN:VND IN:INR PK:PKR BD:BDT LK:LKR NP:NPR AE:AED SA:SAR QA:QAR KW:KWD BH:BHD '
  + 'OM:OMR IL:ILS TR:TRY EG:EGP MA:MAD DZ:DZD TN:TND NG:NGN GH:GHS KE:KES UG:UGX TZ:TZS RW:RWF ET:ETB '
  + 'ZA:ZAR NA:NAD BW:BWP ZM:ZMW MW:MWK MZ:MZN AO:AOA CM:XAF GA:XAF CI:XOF SN:XOF MX:MXN BR:BRL AR:ARS '
  + 'CL:CLP CO:COP PE:PEN UY:UYU PY:PYG BO:BOB CR:CRC GT:GTQ HN:HNL NI:NIO DO:DOP JM:JMD TT:TTD BS:BSD '
  + 'BB:BBD CH:CHF LI:CHF NO:NOK SE:SEK DK:DKK IS:ISK PL:PLN CZ:CZK HU:HUF RO:RON BG:BGN RS:RSD UA:UAH '
  + 'KZ:KZT GE:GEL AM:AMD AZ:AZN JO:JOD MM:MMK KH:KHR MN:MNT FJ:FJD BA:BAM MK:MKD AL:ALL MD:MDL';
const CURRENCY = Object.fromEntries(EURO.split(' ').map((c) => [c, 'EUR'])
  .concat(OTHER.split(' ').map((p) => p.split(':'))));

async function rates() {
  if (cache && Date.now() - cache.at < FRESH_MS) return cache.rates;
  if (!inflight) inflight = fetchRates().finally(() => { inflight = null; });
  return inflight;
}
async function fetchRates() {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(RATES_URL, { signal: ctl.signal });
    clearTimeout(timer);
    const data = await r.json();
    if (!r.ok || data.result !== 'success' || !data.rates) throw new Error('bad rates response');
    cache = { at: Date.now(), rates: data.rates };
  } catch (e) {
    console.error('[fx]', e.message);
    if (!cache) return { [settings.currency]: 1 }; // no rates yet: everyone sees dollars
  }
  return cache.rates;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2);
  const all = await rates();
  const currency = CURRENCY[country] && all[CURRENCY[country]] ? CURRENCY[country] : settings.currency;
  // The answer depends on the visitor's country, so only their browser may keep it.
  res.setHeader('Cache-Control', 'private, max-age=3600');
  return res.status(200).json({ base: settings.currency, country: country || null, currency, rates: all });
};
