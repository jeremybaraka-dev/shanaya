/* ═══════════════════════════════════════════════════════
   LOCAL CURRENCY — shows prices in the visitor's own money.

   Every price on the site is written as <span data-usd="38">$38</span>
   (use SHANAYA_FX.tag(38) to make one). This file converts them all, and any
   added later, to the visitor's currency: the one for the country they're
   browsing from (api/fx.js), or the one they pick in the footer.
   Checkout always charges in US dollars; converted prices are estimates.
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var BASE = (window.SHANAYA_PAY && window.SHANAYA_PAY.currency) || 'USD';
  var DATA_KEY = 'shanaya-fx';        // last answer from /api/fx (rates + detected currency)
  var PICK_KEY = 'shanaya-currency';  // the currency the visitor chose in the footer
  var FRESH_MS = 12 * 60 * 60 * 1000;
  // Offered in the footer picker (plus the visitor's own, if it isn't here).
  var LIST = ['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'JMD', 'TTD', 'BSD', 'MXN', 'BRL', 'ZAR', 'NGN', 'GHS',
    'KES', 'AED', 'SAR', 'INR', 'PHP', 'SGD', 'JPY', 'KRW', 'CNY', 'HKD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN'];

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
  };

  var data = store.get(DATA_KEY);     // { at, currency, rates }
  var code = BASE, rate = 1;
  var listeners = [];
  var formats = {};

  function formatter(c, cents) {
    var k = c + (cents ? '.' : '');
    if (!formats[k]) {
      try {
        formats[k] = new Intl.NumberFormat('en-US', cents
          ? { style: 'currency', currency: c }
          : { style: 'currency', currency: c, minimumFractionDigits: 0, maximumFractionDigits: 0 });
      } catch (e) {
        formats[k] = { format: function (n) { return c + ' ' + (cents ? n.toFixed(2) : Math.round(n)); } };
      }
    }
    return formats[k];
  }
  // 38 → "$38" / "CA$52" / "€33"; with cents → "$38.00" / "CA$52.41"
  function fmt(usd, cents) { return formatter(code, cents).format(usd * rate); }
  function inBase(usd, cents) { return formatter(BASE, cents).format(usd); }
  function tag(usd, cents) {
    return '<span data-usd="' + usd + '"' + (cents ? ' data-cents' : '') + '>' + fmt(usd, cents) + '</span>';
  }

  function paintOne(el) {
    var usd = Number(el.getAttribute('data-usd'));
    if (!isFinite(usd)) return;
    var cents = el.hasAttribute('data-cents');
    var text = fmt(usd, cents);
    if (el.textContent !== text) el.textContent = text;
    if (code === BASE) el.removeAttribute('title');
    else el.title = 'About ' + text + ' — you pay ' + inBase(usd, cents) + ' ' + BASE + ' at checkout';
  }
  function paint(root) {
    root = root || document;
    if (root.nodeType === 1 && root.hasAttribute('data-usd')) paintOne(root);
    if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll('[data-usd]'), paintOne);
  }

  function use(c) {
    var rates = (data && data.rates) || {};
    if (c !== BASE && !rates[c]) c = BASE;
    code = c;
    rate = c === BASE ? 1 : rates[c];
    document.documentElement.setAttribute('data-currency', code);
    paint(document);
    fillPickers();
    listeners.forEach(function (fn) { try { fn(code); } catch (e) { /* keep going */ } });
  }
  function wanted() {
    var q = (location.search.match(/[?&]currency=([A-Za-z]{3})/) || [])[1];
    if (q) store.set(PICK_KEY, q.toUpperCase());
    return store.get(PICK_KEY) || (data && data.currency) || BASE;
  }

  // ── footer picker(s): <select data-fx-select> ──
  var names = null;
  try { names = new Intl.DisplayNames(['en'], { type: 'currency' }); } catch (e) { /* older browsers: codes only */ }
  function fillPickers() {
    var rates = (data && data.rates) || {};
    var options = LIST.filter(function (c) { return c === BASE || rates[c]; });
    if (options.indexOf(code) < 0) options.splice(1, 0, code);
    if (data && data.currency && rates[data.currency] && options.indexOf(data.currency) < 0) options.splice(1, 0, data.currency);
    Array.prototype.forEach.call(document.querySelectorAll('[data-fx-select]'), function (sel) {
      var html = options.map(function (c) {
        var label = c + (names ? ' · ' + names.of(c) : '');
        return '<option value="' + c + '"' + (c === code ? ' selected' : '') + '>' + label + '</option>';
      }).join('');
      if (sel.innerHTML !== html) sel.innerHTML = html;
      sel.value = code;
      sel.closest('[data-fx-picker]') && sel.closest('[data-fx-picker]').toggleAttribute('hidden', options.length < 2);
    });
  }
  document.addEventListener('change', function (e) {
    var sel = e.target.closest && e.target.closest('[data-fx-select]');
    if (!sel) return;
    store.set(PICK_KEY, sel.value);
    use(sel.value);
  });

  // Prices added to the page later (product grids, the bag, quick look…) get converted as they appear.
  new MutationObserver(function (list) {
    if (code === BASE) return;
    list.forEach(function (m) {
      Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) paint(n); });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  function load() {
    if (data && data.rates && Date.now() - data.at < FRESH_MS) return;
    fetch('/api/fx', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.rates) return;
        data = { at: Date.now(), currency: d.currency, rates: d.rates };
        store.set(DATA_KEY, data);
        use(wanted());
      })
      .catch(function () { /* offline or no server: keep dollars */ });
  }

  window.SHANAYA_FX = {
    base: BASE,
    get code() { return code; },
    fmt: fmt,
    inBase: inBase,
    tag: tag,
    paint: paint,
    onChange: function (fn) { listeners.push(fn); },
  };

  if (data && data.rates) { var c = wanted(); code = c; rate = c === BASE ? 1 : (data.rates[c] || 1); if (!data.rates[c]) code = BASE; }
  document.addEventListener('DOMContentLoaded', function () { use(code); });
  load();
})();
