/* ═══════════════════════════════════════════════════════
   NAILS BY SHANAYA — interactions & motion
   Lenis drives the smooth scroll; one rAF loop drives
   every scroll-linked effect so they stay in sync.
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  // Prices go out as <span data-usd> so js/fx.js can show them in the visitor's currency.
  const FX = window.SHANAYA_FX;
  const usd = (n) => (FX ? FX.tag(n, n % 1 !== 0) : `$${n}`);
  const money = (n) => (FX ? FX.tag(n, true) : '$' + n.toFixed(2));
  // Look up "#section" links by id, never as a CSS selector (odd hashes would throw).
  const byHash = (hash) => {
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return null; }
  };

  const S = window.SHANAYA;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mqMobile = matchMedia('(max-width: 900px)');
  const PAY = Object.assign({ currency: 'USD', freeShippingOver: 45, shippingFee: 8 }, window.SHANAYA_PAY);
  const FREE_SHIP = PAY.freeShippingOver;

  const ICON = {
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    upRight: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    left: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
    eye: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>',
  };

  // static <img data-art="key"> placeholders → generated nail-art
  $$('img[data-art]').forEach((img) => { img.src = S.nailArt(img.dataset.art); });

  const byId = (id) => S.PRODUCTS.find((p) => p.id === Number(id));
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  /* ─────────────── LENIS ─────────────── */
  let lenis = null;
  if (!reduce && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
  }
  const HEADER_OFFSET = -96;
  function scrollToTarget(target, opts = {}) {
    if (lenis) {
      lenis.scrollTo(target, { offset: typeof target === 'number' ? 0 : HEADER_OFFSET, duration: 1.6, force: true, ...opts });
    } else if (typeof target === 'number') {
      window.scrollTo(0, target);
    } else {
      const y = target.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET;
      window.scrollTo(0, y);
    }
  }

  /* scroll locking for overlays */
  const openLayers = new Set();
  function lock(name) {
    openLayers.add(name);
    document.body.classList.add('is-locked');
    if (lenis) lenis.stop();
  }
  function unlock(name) {
    openLayers.delete(name);
    if (openLayers.size) return;
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
  }

  /* ─────────────── TEXT SPLITTING ─────────────── */
  function splitWords(el, cls) {
    let i = 0;
    (function walk(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = cls;
            if (cls === 'sw') {
              const inner = document.createElement('span');
              inner.textContent = part;
              inner.style.setProperty('--i', i++);
              outer.appendChild(inner);
            } else {
              outer.textContent = part;
              i++;
            }
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(el);
  }
  $$('[data-split]').forEach((el) => splitWords(el, 'sw'));
  $$('[data-words]').forEach((el) => splitWords(el, 'wd'));
  $$('[data-letters]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split('').map((ch, i) => `<span class="lt"><span style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span></span>`).join('');
  });

  // Giant words that run edge to edge: size the font to the parent's width.
  function fitWords() {
    $$('[data-fit]').forEach((el) => {
      el.style.fontSize = '100px';
      const box = el.parentElement, cs = getComputedStyle(box);
      const w = el.scrollWidth, room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (w) el.style.fontSize = `${((100 * room) / w).toFixed(2)}px`;
    });
  }

  // Live catalog numbers used in copy
  $$('[data-total-sets]').forEach((el) => { el.textContent = S.SETS.length; });
  $$('[data-total-products]').forEach((el) => { el.textContent = S.PRODUCTS.filter((p) => !p.soon && !p.hidden).length; });
  $$('[data-total-of]').forEach((el) => {
    const n = S.PRODUCTS.filter((p) => p.group === el.dataset.totalOf && !p.soon).length;
    el.textContent = n; el.dataset.count = n;
  });
  $$('[data-total-styles]').forEach((el) => { el.textContent = new Set(S.SETS.map((p) => p.category)).size; });
  $$('[data-from-price]').forEach((el) => { el.innerHTML = usd(Math.min(...S.PRODUCTS.filter((p) => !p.soon && !p.hidden).map((p) => p.price))); });

  /* ─────────────── REVEALS ─────────────── */
  const REVEAL_SEL = '[data-reveal], [data-split], [data-count], [data-letters]';
  const ftrEl = $('.ftr'), mainEl = $('main');
  function initReveals() {
    // A clip-path'd element is invisible to IntersectionObserver, so clip
    // reveals watch their parent and reveal the child.
    const proxies = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const els = (proxies.get(en.target) || []).slice();
        if (en.target.matches(REVEAL_SEL) && en.target.dataset.reveal !== 'clip') els.push(en.target);
        els.forEach((el) => {
          el.classList.add('is-in');
          if (el.hasAttribute('data-count')) countUp(el);
        });
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.12 });
    $$(REVEAL_SEL).forEach((el) => {
      if (ftrEl && ftrEl.contains(el)) return;   // revealed by showFooter()
      if (el.dataset.reveal !== 'clip') { io.observe(el); return; }
      const host = el.parentElement;
      if (!proxies.has(host)) proxies.set(host, []);
      proxies.get(host).push(el);
      io.observe(host);
    });
  }
  function countUp(el) {
    const end = Number(el.dataset.count);
    if (reduce) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1800;
    (function step(t) {
      const p = clamp((t - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ─────────────── LOADER / PAGE TRANSITIONS ───────────────
     First visit: "NAILS BY SHANAYA" → HANAYA falls away → the pieces lock into a
     monogram (small NAILS BY on a giant S) → a pearl line draws across and the
     screen splits open onto the page. Every other load and page change uses a
     short close/open of the same split. The scene is rendered twice — once in
     each half — so the split tears the type cleanly in two. */
  const loader = $('#loader');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const twoFrames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const LOADER_STATES = ['is-in', 'is-drop', 'is-slide', 'is-lock', 'is-line', 'is-open', 'is-done', 'is-quick'];

  function buildStage() {
    const letters = (txt, cls) => txt.split('').map((ch) => (ch === ' '
      ? '<span class="lc lc--sp"> </span>'
      : `<span class="lc${cls || ''}"><span>${ch}</span></span>`)).join('');
    const html = `
      <span class="loader__tag loader__tag--tl">Press-ons &amp; stick-ons</span>
      <span class="loader__tag loader__tag--r">Every girl is beautiful ♡</span>
      <span class="loader__tag loader__tag--bl">@nailsbyshanaya_</span>
      <span class="loader__count"><b>0</b>%</span>
      <div class="loader__word"><span class="loader__grp loader__grp--a">${letters('NAILS BY')}</span><span class="lc lc--sp"> </span><span class="loader__name"><span class="loader__grp loader__grp--s">${letters('S')}</span><span class="loader__grp">${letters('HANAYA', ' lc--drop')}</span></span></div>
      <div class="loader__mono"><small>Nails by</small><b>S</b></div>`;
    $$('.loader__stage', loader).forEach((stage) => {
      stage.innerHTML = html;
      $$('.lc:not(.lc--sp)', stage).forEach((l, i) => l.style.setProperty('--i', i));
      $$('.lc--drop', stage).forEach((l, i) => l.style.setProperty('--j', i));
    });
  }
  // same transform on both halves' copies
  const setGroup = (sel, x, y, s) => $$(sel, loader).forEach((g) => {
    g.style.setProperty('--x', `${x}px`);
    g.style.setProperty('--y', `${y}px`);
    g.style.setProperty('--s', s);
  });

  // Where "NAILS BY" and "S" go: first slid together, then locked into the monogram.
  // Works for the one-line desktop name and the stacked phone name.
  function measureLockup() {
    const stage = $('.loader__half--top .loader__stage', loader);
    const A = $('.loader__grp--a', stage), Sg = $('.loader__grp--s', stage);
    const ra = A.getBoundingClientRect(), rs = Sg.getBoundingClientRect();
    const capS = parseFloat(getComputedStyle(Sg).fontSize) * 0.72;
    const capA = parseFloat(getComputedStyle(A).fontSize) * 0.72;
    const aCx = ra.left + ra.width / 2, aCy = ra.top + ra.height / 2;
    const sCx = rs.left + rs.width / 2, sCy = rs.top + rs.height / 2;
    const cx = innerWidth / 2, cy = innerHeight / 2;
    const stacked = Math.abs(aCy - sCy) > 4;

    // 1. slide: one line → "NAILS BY" + "S" close the gap; stacked → both centre up
    let slideA, slideS;
    if (stacked) {
      slideA = cx - aCx;
      slideS = cx - sCx;
    } else {
      const gap = rs.left - ra.right, total = ra.width + gap + rs.width;
      slideA = cx - total / 2 - ra.left;
      slideS = cx - total / 2 + ra.width + gap - rs.left;
    }

    // 2. lock: S grows, NAILS BY shrinks into a superscript on its top-left
    const k = Math.min(5.5, Math.max(1.6, Math.min(innerHeight * 0.34, innerWidth * 0.5) / capS));
    const supCap = Math.max(9, 0.13 * k * capS); // superscript ≈ 13% of the S
    const m = supCap / capA;
    const wA = ra.width * m, wS = rs.width * k, gapL = capS * k * 0.07;
    const left = cx - (wA + gapL + wS) / 2;
    const capTop = cy - (k * capS) / 2;
    return {
      slide: { a: slideA, s: slideS },
      lock: {
        a: { x: left + wA / 2 - aCx, y: capTop + supCap / 2 - aCy, s: m },
        s: { x: left + wA + gapL + wS / 2 - sCx, y: cy - sCy, s: k },
      },
    };
  }

  function countUpLoader(ms) {
    const nums = $$('.loader__count b', loader);
    const t0 = performance.now();
    (function step(t) {
      const p = clamp((t - t0) / ms);
      const v = String(Math.round(100 * (1 - Math.pow(1 - p, 2.2))));
      nums.forEach((n) => { n.textContent = v; });
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  async function openLoader(lineMs) {
    loader.classList.add('is-line');
    await wait(lineMs);
    loader.classList.add('is-open');
    unlock('loader');
    setTimeout(() => loader.classList.add('is-done'), 1200);
  }

  async function runLoader() {
    if (!loader) return;
    if (reduce) { loader.classList.add('is-done'); return; }
    buildStage();
    lock('loader');
    // js/boot.js already chose (before the first paint) between the intro and the quick open
    const first = !document.documentElement.classList.contains('ld-quick');
    try { sessionStorage.setItem('shanaya-intro', '1'); } catch (e) { /* storage blocked */ }

    if (!first) {
      loader.classList.add('is-quick');
      await twoFrames();
      await openLoader(260);
      return;
    }

    if (document.fonts) await Promise.race([document.fonts.ready, wait(2500)]);
    await twoFrames();
    loader.classList.add('is-in');
    countUpLoader(3000);
    await wait(1250);
    loader.classList.add('is-drop');
    await wait(800);
    const L = measureLockup();
    setGroup('.loader__grp--a', L.slide.a, 0, 1);
    setGroup('.loader__grp--s', L.slide.s, 0, 1);
    loader.classList.add('is-slide');
    await wait(750);
    setGroup('.loader__grp--a', L.lock.a.x, L.lock.a.y, L.lock.a.s);
    setGroup('.loader__grp--s', L.lock.s.x, L.lock.s.y, L.lock.s.s);
    loader.classList.add('is-lock');
    await wait(1000);
    await openLoader(600);
  }

  // Leaving: the halves close over the page, then the next page opens them again.
  function leaveTo(href) {
    loader.classList.add('no-anim');
    LOADER_STATES.forEach((c) => loader.classList.remove(c));
    loader.classList.add('is-quick', 'is-open', 'is-line');
    void loader.offsetWidth;
    loader.classList.remove('no-anim');
    loader.classList.remove('is-open');
    setTimeout(() => { location.href = href; }, 760);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.protocol !== location.protocol || url.host !== location.host) return;

    const samePage = url.pathname === location.pathname && url.search === location.search;
    if (samePage && url.hash) {
      e.preventDefault();
      const target = url.hash === '#top' ? 0 : byHash(url.hash);
      if (openLayers.has('menu')) setMenu(false);
      if (target !== null) scrollToTarget(target);
      return;
    }
    if (samePage && openLayers.has('menu')) { e.preventDefault(); setMenu(false); return; }
    if (samePage || !loader || reduce) return;
    e.preventDefault();
    leaveTo(url.href);
  });
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted || !loader) return;
    LOADER_STATES.forEach((c) => loader.classList.remove(c));
    loader.classList.add('is-quick', 'is-line', 'is-open', 'is-done');
    unlock('loader');
  });

  /* ─────────────── HEADER + MENU ─────────────── */
  const hdr = $('#hdr');
  const burger = $('#burger');
  const menu = $('#menu');
  function setMenu(open) {
    if (!menu) return;
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    open ? lock('menu') : unlock('menu');
  }
  if (burger) burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('.menu__link').forEach((a, i) => a.style.setProperty('--i', i));

  // active nav link by section
  const navLinks = $$('.hdr__link[href^="#"]');
  if (navLinks.length) {
    const map = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const link = map.get(en.target.id);
        if (link) link.classList.toggle('is-active', en.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ─────────────── TOAST ─────────────── */
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  let toastTimer;
  function showToast(msg, art) {
    toast.textContent = '';
    if (art) {
      const img = document.createElement('img');
      img.src = art;
      img.alt = '';
      toast.appendChild(img);
    }
    const span = document.createElement('span');
    span.textContent = msg;
    toast.appendChild(span);
    toast.style.paddingLeft = art ? '' : '20px';
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2800);
  }

  /* ─────────────── CART ─────────────── */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay" id="overlay"></div>
    <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true">
      <div class="drawer__head">
        <div><h2 class="drawer__title" id="drawer-title">Your <em>bag</em></h2><p class="drawer__count" id="drawer-count">0 items</p></div>
        <button class="drawer__close" data-close-drawer aria-label="Close bag">${ICON.close}</button>
      </div>
      <div class="drawer__body" id="drawer-body" data-lenis-prevent>
      <div class="drawer__ship"><span id="ship-text"></span><div class="drawer__ship-bar"><span id="ship-bar"></span></div></div>
      <div class="drawer__items" id="drawer-items"></div>
      <div class="drawer__foot">
        <div class="drawer__sub"><span>Subtotal</span><b id="drawer-sub">$0.00</b></div>
        <p class="drawer__shipline" id="drawer-shipline" hidden></p>
        <p class="drawer__fx" id="drawer-fx" hidden></p>
        <div class="drawer__pay" id="paypal-buttons"></div>
        <button class="btn btn--pink" id="checkout" hidden><span class="roll"><span>Checkout</span><span>Checkout</span></span><span class="btn__icon">${ICON.arrow}</span></button>
        <p class="drawer__secure">${ICON.lock} Secure checkout with PayPal or any debit/credit card<span class="drawer__test" id="pay-test" hidden>Test mode</span></p>
        <p class="drawer__terms">By paying you agree to our <a href="policies.html#shipping">shipping</a> &amp; <a href="policies.html#returns">returns</a> policy.</p>
        <button class="drawer__continue" data-close-drawer>Continue shopping</button>
      </div>
      </div>
    </aside>
    <div class="qv" id="qv" role="dialog" aria-modal="true" aria-labelledby="qv-name" aria-hidden="true" data-lenis-prevent>
      <div class="qv__media" id="qv-media"></div>
      <button class="qv__close" data-close-qv aria-label="Close quick look">${ICON.close}</button>
      <div class="qv__nav">
        <button class="round-btn" id="qv-prev" aria-label="Previous product">${ICON.left}</button>
        <button class="round-btn" id="qv-next" aria-label="Next product">${ICON.right}</button>
      </div>
      <div class="qv__body">
        <p class="pcard__cat" id="qv-cat"></p>
        <h2 class="qv__name" id="qv-name"></h2>
        <p class="qv__price" id="qv-price"></p>
        <p class="qv__desc" id="qv-desc"></p>
        <p class="qv__label" id="qv-label">Choose your size</p>
        <div class="qv__sizes" id="qv-sizes"></div>
        <button class="btn btn--pink" id="qv-add"><span class="roll"><span>Add to bag</span><span>Add to bag</span></span><span class="btn__icon">${ICON.plus}</span></button>
        <ul class="qv__perks"><li>Handcrafted by Shanaya</li><li>Free shipping on orders ${usd(FREE_SHIP)}+</li><li>Lasts up to 2 weeks</li></ul>
      </div>
    </div>`);

  const overlay = $('#overlay');
  const drawer = $('#drawer');
  // Saved bag comes from browser storage, which anyone can edit — only keep
  // known products, known sizes and sane quantities.
  const MAX_QTY = 20;
  const cleanSize = (p, size) => (p.sizes.includes(size) ? size : p.sizes.includes('M') ? 'M' : p.sizes[0]);
  const optLabel = (p) => (p && p.optionLabel) || 'Size';
  // "Size M" for nail sets; charms and polish just show their option ("Pack of 10").
  const optText = (p, v) => (optLabel(p) === 'Size' ? `Size ${v}` : v);
  const savedCart = store.get('shanaya-cart', []);
  let cart = (Array.isArray(savedCart) ? savedCart : [])
    .filter((it) => it && byId(it.id) && !byId(it.id).soon)
    .map((it) => {
      const p = byId(it.id);
      return { id: p.id, size: cleanSize(p, it.size), qty: Math.min(MAX_QTY, Math.max(1, Math.floor(Number(it.qty)) || 1)) };
    });
  store.set('shanaya-cart', cart);

  const cartCount = () => cart.reduce((s, it) => s + it.qty, 0);
  const cartTotal = () => cart.reduce((s, it) => s + byId(it.id).price * it.qty, 0);
  // free over the threshold, or when everything in the bag ships free (the hidden test item)
  const shippingFor = (total) => (total > 0 && total < FREE_SHIP && !cart.every((it) => byId(it.id).freeShip) ? PAY.shippingFee : 0);

  function renderCart() {
    const count = cartCount(), total = cartTotal();
    const ship = shippingFor(total);
    const shipLine = $('#drawer-shipline');
    shipLine.hidden = !ship;
    shipLine.innerHTML = ship ? `+ ${money(ship)} shipping` : '';
    const payBox = $('#paypal-buttons');
    if (payBox) payBox.hidden = !count;
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.toggleAttribute('data-zero', count === 0);
    });
    $('#drawer-count').textContent = `${count} item${count === 1 ? '' : 's'}`;
    $('#drawer-sub').innerHTML = money(total);
    const fxNote = $('#drawer-fx');
    fxNote.hidden = !FX || FX.code === FX.base || !count;
    if (!fxNote.hidden) fxNote.textContent = `Prices in ${FX.code} are estimates. PayPal charges ${FX.inBase(total + ship, true)} ${FX.base}; your bank or PayPal converts it.`;
    const left = FREE_SHIP - total;
    $('#ship-text').innerHTML = left > 0 ? `You're ${money(left)} away from free shipping ✦` : 'Yay — you unlocked free shipping ♡';
    $('#ship-bar').style.width = `${clamp(total / FREE_SHIP) * 100}%`;

    const box = $('#drawer-items');
    if (!cart.length) {
      box.innerHTML = `<div class="drawer__empty"><img src="${S.SETS[8].thumb}" alt=""><p>Your bag is empty.</p><span>Add something beautiful!</span><a href="shop.html" class="btn btn--ghost btn--sm">Browse the shop</a></div>`;
      return;
    }
    box.innerHTML = cart.map((it) => {
      const p = byId(it.id);
      const key = `${it.id}|${it.size}`;
      return `<div class="citem">
        <div class="citem__img"><img src="${p.thumb}" alt=""></div>
        <div>
          <p class="citem__name">${p.name}</p>
          <p class="citem__meta">${optText(byId(it.id), it.size)}</p>
          <div class="citem__qty">
            <button data-qty="-1" data-key="${key}" aria-label="Decrease quantity">−</button>
            <span>${it.qty}</span>
            <button data-qty="1" data-key="${key}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="citem__right"><span class="citem__price">${money(p.price * it.qty)}</span><button class="citem__remove" data-remove="${key}">Remove</button></div>
      </div>`;
    }).join('');
  }
  // a new currency picked in the footer: redraw the bag (its note names the currency)
  if (FX) FX.onChange(renderCart);

  function saveCart() { store.set('shanaya-cart', cart); renderCart(); }

  function addToCart(id, size) {
    const p = byId(id);
    if (!p) return;
    if (!p || p.soon || !p.sizes.length) return;
    size = cleanSize(p, size);
    const found = cart.find((it) => it.id === p.id && it.size === size);
    if (found) found.qty = Math.min(MAX_QTY, found.qty + 1); else cart.push({ id: p.id, size, qty: 1 });
    saveCart();
    showToast(`${p.name} added to your bag`, p.thumb);
    $$('.hdr__bag, .tabbar__bag').forEach((b) => { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); });
  }

  $('#drawer-items').addEventListener('click', (e) => {
    const q = e.target.closest('[data-qty]');
    const r = e.target.closest('[data-remove]');
    const key = (q && q.dataset.key) || (r && r.dataset.remove);
    if (!key) return;
    const [id, size] = key.split('|');
    const it = cart.find((c) => c.id === Number(id) && c.size === size);
    if (!it) return;
    if (r) cart = cart.filter((c) => c !== it);
    else {
      it.qty = Math.min(MAX_QTY, it.qty + Number(q.dataset.qty));
      if (it.qty <= 0) cart = cart.filter((c) => c !== it);
    }
    saveCart();
  });

  let lastFocus = null;
  function openDrawer() {
    loadPayPal();
    lastFocus = document.activeElement;
    if (openLayers.has('menu')) setMenu(false);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-open');
    lock('drawer');
    setTimeout(() => $('.drawer__close', drawer).focus(), 300);
  }
  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (!qv.classList.contains('is-open')) overlay.classList.remove('is-open');
    unlock('drawer');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $$('[data-cart-open]').forEach((b) => b.addEventListener('click', openDrawer));
  $$('[data-close-drawer]').forEach((b) => b.addEventListener('click', closeDrawer));
  /* ─────────────── PAYPAL CHECKOUT ───────────────
     Live site: orders are created and captured by the server functions in
     api/paypal/, which price everything from js/products.js — the browser only
     sends product, size and quantity. Money goes to the PayPal account whose
     keys are set in Vercel. On a local preview (no server) it falls back to
     PayPal's practice mode so the flow can still be tried. */
  $('#checkout').addEventListener('click', () => {
    showToast('Checkout is unavailable right now — please DM @nailsbyshanaya_ 💅');
  });

  const isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  let paypalState = 'idle';
  let payMode = null; // 'server' | 'practice'

  function payFallback() {
    paypalState = 'failed';
    const box = $('#paypal-buttons');
    if (box) box.remove();
    $('#checkout').hidden = false;
  }

  async function loadPayPal() {
    if (paypalState !== 'idle') return;
    paypalState = 'loading';
    let clientId = null;
    try {
      const r = await fetch('/api/paypal/config', { cache: 'no-store' });
      if (r.ok) {
        const cfg = await r.json();
        clientId = cfg.clientId;
        payMode = 'server';
        $('#pay-test').hidden = cfg.mode === 'live';
      }
    } catch (e) { /* no server on a local preview */ }
    if (!clientId && isLocal) {
      clientId = 'test';
      payMode = 'practice';
      $('#pay-test').hidden = false;
    }
    if (!clientId) { payFallback(); return; }

    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${PAY.currency}&intent=capture&components=buttons`;
    s.async = true;
    s.onload = renderPayPal;
    s.onerror = payFallback;
    document.head.appendChild(s);
  }

  async function postJSON(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let data = {};
    try { data = await r.json(); } catch (e) { /* empty body */ }
    return { ok: r.ok, status: r.status, data };
  }

  // Practice mode only (local preview): PayPal sandbox order built in the browser.
  function practiceOrder() {
    const cur = PAY.currency;
    const itemTotal = cartTotal();
    const ship = shippingFor(itemTotal);
    return {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: cur,
          value: (itemTotal + ship).toFixed(2),
          breakdown: {
            item_total: { currency_code: cur, value: itemTotal.toFixed(2) },
            shipping: { currency_code: cur, value: ship.toFixed(2) },
          },
        },
        items: cart.map((it) => ({
          name: byId(it.id).name, description: optText(byId(it.id), it.size), quantity: String(it.qty),
          unit_amount: { currency_code: cur, value: byId(it.id).price.toFixed(2) },
        })),
      }],
    };
  }

  // Receipt PDF, built from PayPal's confirmed order (see js/receipt.js).
  function downloadReceipt(receipt) {
    const R = window.SHANAYA_RECEIPT;
    if (!R || !receipt) return;
    const blob = new Blob([R.receiptPdf(receipt)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nails-by-Shanaya-receipt-${String(receipt.orderId).replace(/[^A-Z0-9]/gi, '') || 'order'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function showThanks(firstName, receipt) {
    cart = [];
    saveCart();
    $('#drawer-items').innerHTML = `<div class="drawer__empty drawer__done">
      <img src="${S.SETS[0].thumb}" alt="">
      <p></p>
      <span>Your order is confirmed. PayPal is emailing you a receipt too, and your set ships to the address on your PayPal.</span>
      <small class="drawer__order"></small>
      <button class="btn btn--pink btn--sm" id="receipt-dl" hidden><span class="roll"><span>Download receipt (PDF)</span><span>Download receipt (PDF)</span></span></button>
      <a href="shop.html" class="btn btn--ghost btn--sm">Keep shopping</a>
    </div>`;
    $('.drawer__done p').textContent = `Thank you${firstName ? ', ' + firstName : ''}! ♡`;
    if (receipt && receipt.orderId) {
      $('.drawer__order').textContent = `Order ${receipt.orderId}`;
      const dl = $('#receipt-dl');
      dl.hidden = false;
      dl.addEventListener('click', () => downloadReceipt(receipt));
    }
    showToast('Payment received — thank you! 💅');
  }
  const notCompleted = () => showToast("Payment didn't complete — please try again or DM @nailsbyshanaya_");

  let payError = ''; // the server's reason, shown instead of PayPal's generic message
  let orderPass = null; // proof this browser created the order (checked by capture-order)
  async function serverCreateOrder() {
    payError = '';
    const r = await postJSON('/api/paypal/create-order', { items: cart.map(({ id, size, qty }) => ({ id, size, qty })) });
    if (!r.ok || !r.data.id) {
      payError = r.data.error || "Couldn't start checkout. Please try again.";
      throw new Error(payError);
    }
    orderPass = { id: r.data.id, pass: r.data.pass };
    return r.data.id;
  }
  async function serverApprove(data, actions) {
    const pass = orderPass && orderPass.id === data.orderID ? orderPass.pass : '';
    const r = await postJSON('/api/paypal/capture-order', { orderID: data.orderID, pass });
    if (r.status === 422 && r.data.declined) return actions.restart(); // card declined → pick another method
    if (!r.ok || r.data.status !== 'COMPLETED') {
      if (r.data && r.data.error) payError = r.data.error;
      return notCompleted();
    }
    showThanks(r.data.firstName, r.data.receipt);
  }

  function renderPayPal() {
    if (!window.paypal || !window.paypal.Buttons) { payFallback(); return; }
    paypalState = 'ready';
    const server = payMode === 'server';
    window.paypal.Buttons({
      style: { layout: 'vertical', shape: 'pill', color: 'black', label: 'checkout', height: 48 },
      onClick: (data, actions) => (cart.length ? actions.resolve() : actions.reject()),
      createOrder: server ? serverCreateOrder : (data, actions) => actions.order.create(practiceOrder()),
      onApprove: server ? serverApprove : (data, actions) => actions.order.capture().then((d) => (
        d && d.status === 'COMPLETED'
          ? showThanks(d.payer && d.payer.name ? d.payer.name.given_name : '', window.SHANAYA_RECEIPT && window.SHANAYA_RECEIPT.toReceipt(d))
          : notCompleted()
      )),
      onCancel: () => showToast('Payment cancelled — your bag is saved ♡'),
      onError: () => showToast(payError || "Payment didn't go through. Please try again."),
    }).render('#paypal-buttons').catch(payFallback);
  }

  /* ─────────────── WISHLIST ─────────────── */
  const savedWish = store.get('shanaya-wishlist', []);
  let wishlist = (Array.isArray(savedWish) ? savedWish : []).filter((id) => byId(id)).map(Number);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-wish]');
    if (!b) return;
    e.stopPropagation();
    const id = Number(b.dataset.wish);
    const on = !wishlist.includes(id);
    wishlist = on ? wishlist.concat(id) : wishlist.filter((w) => w !== id);
    store.set('shanaya-wishlist', wishlist);
    $$(`[data-wish="${id}"]`).forEach((w) => { w.classList.toggle('is-on', on); w.setAttribute('aria-pressed', String(on)); });
    if (on) showToast('Saved to your wishlist ♡', byId(id).thumb);
  });

  /* ─────────────── QUICK VIEW ─────────────── */
  const qv = $('#qv');
  let qvList = [], qvIndex = 0, qvSize = 'M';
  function fillQuick(p) {
    $('#qv-media').innerHTML = `<img src="${p.thumb}" alt="" class="qv__blur"><img src="${p.img}" alt="${p.name}">`;
    $('#qv-cat').innerHTML = kindLabel(p);
    $('#qv-name').textContent = p.name;
    $('#qv-price').innerHTML = `${usd(p.price)}${p.oldPrice ? `<s>${usd(p.oldPrice)}</s>` : ''}`;
    $('#qv-desc').textContent = p.desc;
    qvSize = p.sizes.includes('M') ? 'M' : p.sizes[0];
    $('#qv-sizes').innerHTML = p.sizes.map((s) => `<button class="size${s === qvSize ? ' is-on' : ''}" data-size="${s}" aria-pressed="${s === qvSize}">${s}</button>`).join('');
    // charms, polish and coming-soon items
    qv.classList.toggle('is-soon', !!p.soon);
    if (p.soon) $('#qv-price').textContent = 'Coming soon';
    $('#qv-label').textContent = p.soon ? 'DM @nailsbyshanaya_ to be first to know' : `Choose your ${optLabel(p).toLowerCase()}`;
    const add = $('#qv-add');
    add.disabled = !!p.soon;
    $$('.roll > span', add).forEach((t) => { t.textContent = p.soon ? 'Coming soon' : 'Add to bag'; });
    $('.qv__perks', qv).hidden = p.type !== 'set';
  }
  function openQuick(id, list) {
    qvList = list && list.length ? list : S.PRODUCTS.filter((p) => !p.hidden || p.id === Number(id)).map((p) => p.id);
    qvIndex = Math.max(0, qvList.indexOf(Number(id)));
    fillQuick(byId(qvList[qvIndex]));
    lastFocus = document.activeElement;
    qv.classList.add('is-open');
    qv.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-open');
    lock('qv');
    setTimeout(() => $('.qv__close', qv).focus({ preventScroll: true }), 300);
  }
  function closeQuick() {
    if (!qv.classList.contains('is-open')) return;
    qv.classList.remove('is-open');
    qv.setAttribute('aria-hidden', 'true');
    if (!drawer.classList.contains('is-open')) overlay.classList.remove('is-open');
    unlock('qv');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  function stepQuick(d) {
    qvIndex = (qvIndex + d + qvList.length) % qvList.length;
    fillQuick(byId(qvList[qvIndex]));
  }
  $('#qv-sizes').addEventListener('click', (e) => {
    const b = e.target.closest('.size');
    if (!b) return;
    qvSize = b.dataset.size;
    $$('.size', $('#qv-sizes')).forEach((s) => { s.classList.toggle('is-on', s === b); s.setAttribute('aria-pressed', String(s === b)); });
  });
  $('#qv-add').addEventListener('click', () => { addToCart(qvList[qvIndex], qvSize); closeQuick(); });
  $('#qv-prev').addEventListener('click', () => stepQuick(-1));
  $('#qv-next').addEventListener('click', () => stepQuick(1));
  $$('[data-close-qv]').forEach((b) => b.addEventListener('click', closeQuick));
  overlay.addEventListener('click', () => { closeQuick(); closeDrawer(); });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-quick]');
    if (!t || e.target.closest('[data-wish]')) return;
    e.preventDefault();
    const scope = t.closest('[data-list]');
    const list = scope ? $$('[data-product]', scope).map((el) => Number(el.dataset.product)) : null;
    openQuick(t.dataset.quick, list);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (qv.classList.contains('is-open')) closeQuick();
      else if (drawer.classList.contains('is-open')) closeDrawer();
      else if (document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); }
    }
    if (qv.classList.contains('is-open') && e.key === 'ArrowRight') stepQuick(1);
    if (qv.classList.contains('is-open') && e.key === 'ArrowLeft') stepQuick(-1);
  });

  // simple swipe-down to dismiss sheets on phones
  // (only when the sheet's content is scrolled to the top, so scrolling up never closes it)
  [[drawer, $('#drawer-body')], [qv, qv]].forEach(([sheet, scroller]) => {
    let y0 = null;
    sheet.addEventListener('touchstart', (e) => { y0 = scroller.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    sheet.addEventListener('touchend', (e) => {
      if (y0 === null || !mqMobile.matches || scroller.scrollTop > 0) return;
      if (e.changedTouches[0].clientY - y0 > 90) (sheet === qv ? closeQuick : closeDrawer)();
      y0 = null;
    }, { passive: true });
  });

  // When PayPal's card form opens inside the bag, bring it into view.
  const payBoxEl = $('#paypal-buttons');
  if (payBoxEl && 'ResizeObserver' in window) {
    let lastH = 0;
    new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      if (h > 200 && h > lastH + 60) {
        const body = $('#drawer-body');
        body.scrollTo({ top: payBoxEl.offsetTop - 12, behavior: reduce ? 'auto' : 'smooth' });
      }
      lastH = h;
    }).observe(payBoxEl);
  }

  /* ─────────────── PRODUCT CARDS ─────────────── */
  function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
  // "Press-Ons · Florals" for sets; the section name for everything else
  const kindLabel = (p) => (p.type === 'set' ? `Press-Ons · ${S.CATEGORY_LABELS[p.category]}`
    : p.type === 'basket' ? `Basket · Save ${usd(p.oldPrice - p.price)}` : S.GROUP_LABELS[p.group] || p.category);
  function cardHTML(p, shop, i) {
    const label = kindLabel(p);
    const wished = wishlist.includes(p.id);
    const badge = p.badge ? `<span class="pcard__badge pcard__badge--${p.badge.toLowerCase()}">${p.badge}</span>` : '';
    const def = p.sizes.includes('M') ? 'M' : p.sizes[0];
    const foot = p.soon
      ? `<a class="pcard__add pcard__add--soon" href="https://www.tiktok.com/@nailsbyshanaya_" target="_blank" rel="noopener noreferrer">${ICON.heart}<span>DM to pre-order</span></a>`
      : `<div class="pcard__sizes" role="group" aria-label="${optLabel(p)}">${p.sizes.map((s) => `<button class="size${s === def ? ' is-on' : ''}" data-size="${s}" aria-pressed="${s === def}">${s}</button>`).join('')}</div>
          <button class="pcard__add" data-add="${p.id}">${ICON.plus}<span>Add to bag</span></button>`;
    const shopBits = shop ? `
        <p class="pcard__desc">${p.desc}</p>
        <div class="pcard__foot">
          ${foot}
        </div>` : '';
    const price = p.soon ? 'Coming soon' : `${usd(p.price)}${p.oldPrice ? `<s>${usd(p.oldPrice)}</s>` : ''}`;
    return `<article class="pcard" data-product="${p.id}" style="--i:${i};--d:${(i * 0.08).toFixed(2)}s"${shop ? '' : ' data-reveal'}>
      <div class="pcard__media" data-quick="${p.id}" data-cursor="Quick look">
        <img src="${p.thumb}" srcset="${p.thumb} 480w, ${p.img} 900w" sizes="(max-width: 900px) 46vw, 25vw" alt="${p.name}" loading="lazy">
        ${badge}
        <button class="pcard__wish${wished ? ' is-on' : ''}" data-wish="${p.id}" aria-pressed="${wished}" aria-label="Save ${p.name} to wishlist">${ICON.heart}</button>
        <button class="pcard__quick" data-quick="${p.id}" aria-label="Quick look: ${p.name}">${ICON.eye}<span>Quick look</span></button>
      </div>
      <div class="pcard__body">
        <p class="pcard__cat">${label}</p>
        <h3 class="pcard__name">${p.name}</h3>
        <div class="pcard__row"><span class="pcard__price">${price}</span>${p.stars ? `<span class="pcard__stars" aria-label="${p.stars} out of 5 stars">${stars(p.stars)}</span>` : ''}<button class="pcard__plus" data-quick="${p.id}" aria-label="Quick look: ${p.name}">${ICON.plus}</button></div>
        ${shopBits}
      </div>
    </article>`;
  }

  // Shop hero: one big photo that cycles through the products — press-ons,
  // charms, polish and baskets taking turns (the first 16 of the mixed list)
  const sxPhoto = $('.sx__photo');
  if (sxPhoto) {
    const reel = S.MIXED.filter((p) => !p.soon).slice(0, 16);
    const frames = $('.sx__frames', sxPhoto);
    // baskets are tall photos: show the whole cut-out on its tint instead of cropping it
    frames.innerHTML = reel.map((p, i) => `<img src="${p.cutout || p.img}" alt=""${p.cutout ? ` class="is-basket" style="background-color:${p.tint}"` : ''}${i ? ' loading="lazy"' : ' fetchpriority="high"'}>`).join('');
    const imgs = $$('img', frames);
    const cap = $('.sx__caption', sxPhoto);
    let at = -1;
    const showSet = (i) => {
      at = i % reel.length;
      const p = reel[at];
      imgs.forEach((im, k) => im.classList.toggle('is-on', k === at));
      $('b', cap).textContent = p.name;
      $('span', cap).innerHTML = `${p.type === 'set' ? S.CATEGORY_LABELS[p.category] : S.GROUP_LABELS[p.group]} · ${usd(p.price)}`;
      sxPhoto.dataset.quick = p.id;
      sxPhoto.setAttribute('aria-label', `Quick look: ${p.name}, ${FX ? FX.fmt(p.price) : `$${p.price}`}`);
    };
    showSet(0);
    if (!reduce) setInterval(() => { if (!document.hidden) showSet(at + 1); }, 2600);
  }

  // Shop page
  const shopGrid = $('#shop-grid');
  if (shopGrid) {
    const chips = $('#chips');
    const sortSel = $('#sort');
    const params = new URLSearchParams(location.search);
    let filter = params.get('cat') || 'all';
    if (S.SETS.some((p) => p.category === filter)) filter = 'press-ons'; // old style links (?cat=floral …)
    if (!$$('.chip', chips).some((c) => c.dataset.filter === filter)) filter = 'all';
    const inGroup = (f) => (f === 'all' ? S.MIXED.slice() : S.PRODUCTS.filter((p) => p.group === f));

    $$('.chip', chips).forEach((c) => {
      c.insertAdjacentHTML('beforeend', `<sup>${inGroup(c.dataset.filter).length}</sup>`);
    });

    function list() {
      let l = inGroup(filter);
      const s = sortSel.value;
      if (s === 'price-asc') l.sort((a, b) => a.price - b.price);
      if (s === 'price-desc') l.sort((a, b) => b.price - a.price);
      if (s === 'new') l = l.filter((p) => p.isNew).concat(l.filter((p) => !p.isNew));
      return l;
    }
    function renderShop(scroll) {
      const l = list();
      $$('.chip', chips).forEach((c) => { const on = c.dataset.filter === filter; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
      shopGrid.innerHTML = l.map((p, i) => cardHTML(p, true, i)).join('');
      $('#shop-empty').classList.toggle('is-on', !l.length);
      $('#shop-showing').textContent = `Showing ${l.length} ${l.length === 1 ? 'item' : 'items'}`;
      if (scroll) {
        const top = $('#shop-top');
        if (top.getBoundingClientRect().top < 0) scrollToTarget(top, { duration: 1 });
      }
      if (lenis) lenis.resize();
    }
    chips.addEventListener('click', (e) => {
      const c = e.target.closest('.chip');
      if (!c) return;
      filter = c.dataset.filter;
      const u = new URL(location.href);
      if (filter === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', filter);
      history.replaceState(null, '', u);
      c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      renderShop(true);
    });
    sortSel.addEventListener('change', () => renderShop(true));

    shopGrid.addEventListener('click', (e) => {
      const size = e.target.closest('.size');
      if (size) {
        const wrap = size.parentElement;
        $$('.size', wrap).forEach((s) => { s.classList.toggle('is-on', s === size); s.setAttribute('aria-pressed', String(s === size)); });
        return;
      }
      const add = e.target.closest('[data-add]');
      if (add) {
        const card = add.closest('.pcard');
        const sel = $('.size.is-on', card);
        addToCart(add.dataset.add, sel ? sel.dataset.size : 'M');
        add.classList.add('is-added');
        add.innerHTML = `${ICON.check}<span>Added!</span>`;
        setTimeout(() => { add.classList.remove('is-added'); add.innerHTML = `${ICON.plus}<span>Add to bag</span>`; }, 1800);
      }
    });
    renderShop(false);
  }

  /* ─────────────── MARQUEES ─────────────── */
  const marquees = $$('[data-marquee]').map((m) => {
    const track = $('.marquee__track', m);
    const group = $('.marquee__group', track);
    return { m, track, group, x: 0, w: 0, dir: Number(m.dataset.dir || 1), speed: Number(m.dataset.mspeed || 1), visible: true };
  });
  function layoutMarquees() {
    marquees.forEach((q) => {
      $$('.marquee__group', q.track).slice(1).forEach((g) => g.remove());
      q.w = q.group.offsetWidth;
      if (!q.w) return;
      const need = Math.ceil((q.m.offsetWidth * 1.2) / q.w) + 1;
      for (let i = 0; i < Math.min(need, 12); i++) {
        const c = q.group.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        q.track.appendChild(c);
      }
    });
  }
  const mio = new IntersectionObserver((entries) => entries.forEach((en) => {
    const q = marquees.find((m) => m.m === en.target);
    if (q) q.visible = en.isIntersecting;
  }));
  marquees.forEach((q) => mio.observe(q.m));

  /* ─────────────── SCROLL-LINKED FX ───────────────
     Home-page scenes live in js/story.js; this loop drives them. */
  const story = window.SHANAYA_STORY || null;
  const parallax = $$('[data-speed]').map((el) => ({ el, speed: parseFloat(el.dataset.speed) || 0, depth: parseFloat(el.dataset.depth) || 0 }));
  const quote = $('[data-words]');
  const quoteWords = quote ? $$('.wd', quote) : [];
  let litCount = -1;
  // mouse for hero depth + cursor
  let mx = 0, my = 0, smx = 0, smy = 0;
  let lastY = -1, dirSign = 1, hdrHidden = false;

  function tick() {
    const y = lenis ? lenis.animatedScroll : window.scrollY;
    const vh = window.innerHeight;
    const v = lenis ? lenis.velocity : y - (lastY < 0 ? y : lastY);
    if (lenis && lenis.direction) dirSign = lenis.direction;
    else if (!lenis && v) dirSign = Math.sign(v);

    // marquees: base drift + scroll velocity boost, direction follows scroll
    marquees.forEach((q) => {
      if (!q.visible || !q.w) return;
      const boost = reduce ? 0 : Math.min(Math.abs(v) * 0.5, 26);
      q.x -= ((reduce ? 0 : q.speed * 0.55) + boost) * q.dir * dirSign;
      if (q.x <= -q.w) q.x += q.w;
      if (q.x > 0) q.x -= q.w;
      q.track.style.transform = `translate3d(${q.x.toFixed(2)}px,0,0)`;
    });

    smx = lerp(smx, mx, 0.06);
    smy = lerp(smy, my, 0.06);
    const moved = Math.abs(smx - mx) > 0.001 || Math.abs(smy - my) > 0.001;

    if (y !== lastY || moved) {
      // header: see-through at the very top, hides while scrolling down
      if (hdr) hdr.classList.toggle('is-top', y < 80);
      if (hdr && !openLayers.size) {
        const hide = y > 160 && dirSign > 0;
        if (hide !== hdrHidden && (Math.abs(v) > 0.5 || y < 160)) {
          hdrHidden = hide;
          hdr.classList.toggle('is-hidden', hide);
          document.body.classList.toggle('hdr-hidden', hide);
        }
      }

      if (!reduce) {
        parallax.forEach((p) => {
          const r = p.el.parentElement.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const off = (r.top + r.height / 2 - vh / 2) * p.speed;
          p.el.style.transform = `translate3d(${(smx * p.depth).toFixed(2)}px,${(off + smy * p.depth).toFixed(2)}px,0)`;
        });
      }

      if (quote && quoteWords.length) {
        const r = quote.getBoundingClientRect();
        const p = reduce ? 1 : clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25));
        const n = Math.round(p * quoteWords.length);
        if (n !== litCount) {
          litCount = n;
          quoteWords.forEach((w, i) => w.classList.toggle('is-lit', i < n));
        }
      }

      if (story) story.update(y, vh, smx, smy);
      showFooter(vh);
    }
    lastY = y;
  }

  function raf(t) {
    if (lenis) lenis.raf(t);
    tick();
    requestAnimationFrame(raf);
  }

  /* ─────────────── CURSOR + MAGNETIC + PREVIEW ─────────────── */
  if (finePointer && !reduce) {
    const cursor = $('.cursor');
    const label = cursor ? $('.cursor__label', cursor) : null;
    let cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      if (cursor) cursor.classList.add('is-visible');
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor && cursor.classList.remove('is-visible'));
    document.addEventListener('mouseover', (e) => {
      if (!cursor) return;
      const big = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, select, input, label');
      cursor.classList.toggle('is-big', !!big && !(link && link !== big && big.contains(link)));
      cursor.classList.toggle('is-link', !big && !!link);
      if (big) label.textContent = big.dataset.cursor;
    });

    (function follow() {
      cx = lerp(cx, tx, 0.2); cy = lerp(cy, ty, 0.2);
      if (cursor) cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(follow);
    })();

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.25}px,${y * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ─────────────── FOOTER CURTAIN ───────────────
     When the footer fits on screen it sits fixed behind the page and main
     scrolls up off it; main gets a bottom margin of the footer's height so the
     page can scroll far enough. Taller footers (phones) stay in the flow. */
  function layoutFooter() {
    if (!ftrEl || !mainEl) return;
    const root = document.documentElement;
    root.classList.remove('ftr-reveal');
    mainEl.style.marginBottom = '';
    // with min-height: 100svh the footer is exactly one screen unless its
    // content is taller (phones); only then does it stay in the flow
    const fits = ftrEl.offsetHeight <= window.innerHeight + 1;
    root.classList.toggle('ftr-reveal', fits);
    if (fits) mainEl.style.marginBottom = `${ftrEl.offsetHeight}px`;
  }
  let ftrShown = false;
  function showFooter(vh) {
    if (ftrShown || !ftrEl || !mainEl) return;
    if (mainEl.getBoundingClientRect().bottom > vh * 0.95) return;
    ftrShown = true;
    ftrEl.classList.add('is-shown');
    $$(REVEAL_SEL, ftrEl).forEach((el) => {
      el.classList.add('is-in');
      if (el.hasAttribute('data-count')) countUp(el);
    });
  }

  /* ─────────────── MISC ─────────────── */

  function onResize() {
    fitWords();
    requestAnimationFrame(fitWords);   // again once fonts/letters have settled
    layoutMarquees();
    layoutFooter();
    if (story) story.layout();
    lastY = -1;
  }
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(onResize, 150); });
  mqMobile.addEventListener && mqMobile.addEventListener('change', onResize);

  /* ─────────────── BOOT ─────────────── */
  renderCart();
  fitWords();
  layoutMarquees();
  layoutFooter();
  if (story) story.layout();
  requestAnimationFrame(raf);
  if (document.fonts) document.fonts.ready.then(onResize);
  window.addEventListener('load', onResize);

  runLoader().then(() => {
    initReveals();
    if (location.hash && location.hash.length > 1) {
      const t = byHash(location.hash);
      if (t) setTimeout(() => scrollToTarget(t, { duration: 1.2 }), 200);
    }
  });
})();
