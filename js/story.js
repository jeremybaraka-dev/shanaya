/* ═══════════════════════════════════════════════════════
   NAILS BY SHANAYA — home page scroll story
   Builds the scenes from the catalog and exposes
   window.SHANAYA_STORY = { layout(), update(y, vh, mx, my) },
   which main.js calls from its Lenis-driven frame loop.
     1. hero    — a huge staggered wordmark; the two lines drift apart on scroll
     2. craft   — one set pinned centre stage, callouts change per step
     3. coll    — all twelve sets roll past, details swap per set
     4. words   — giant words glide behind a changing photo card
     5. how     — a ribbon draws itself through three steps
     6. shade   — a swatch fan of skin tones opens as it scrolls in
     7. cta     — product photos trail behind the cursor
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const S = window.SHANAYA;
  if (!S || !document.querySelector('[data-scene]')) return;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const byId = (id) => S.PRODUCTS.find((p) => p.id === id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const mqMobile = matchMedia('(max-width: 900px)');
  const pad = (n) => String(n).padStart(2, '0');

  const scenes = [];
  // Sticky scenes: progress runs 0 → 1 while the scene's inner panel is pinned.
  function pinned(el) {
    const sc = { el, top: 0, len: 1, p: -1 };
    sc.measure = () => {
      sc.top = el.getBoundingClientRect().top + window.scrollY;
      sc.len = Math.max(1, el.offsetHeight - window.innerHeight);
    };
    sc.progress = (y) => clamp((y - sc.top) / sc.len);
    return sc;
  }

  /* ─── 1. HERO: brand wordmark ───
     "Nails by" / "Shanaya" set huge and staggered over two soft circles.
     As you scroll past, the two lines drift apart sideways; the photos and
     circles get their parallax from main.js ([data-speed]). */
  const hero = $('[data-scene="hero"]');
  if (hero) {
    const l1 = $('.sm__line--1', hero), l2 = $('.sm__line--2', hero);
    const sc = { el: hero, h: 1, measure() { sc.h = hero.offsetHeight || window.innerHeight; } };
    sc.update = (y, vh, mx, my) => {
      const e = easeOut(clamp(y / sc.h));
      const vw = window.innerWidth;
      l1.style.transform = `translate3d(${(-e * vw * 0.14 + mx * -8).toFixed(1)}px,${(my * -4).toFixed(1)}px,0)`;
      l2.style.transform = `translate3d(${(e * vw * 0.14 + mx * 8).toFixed(1)}px,${(my * 4).toFixed(1)}px,0)`;
    };
    scenes.push(sc);
  }

  /* ─── 2. CRAFT: one set centre stage ─── */
  const craft = $('[data-scene="craft"]');
  if (craft) {
    const steps = $$('.craft__step', craft);
    const shots = [101, 104, 109, 107].map(byId);
    $('.craft__nail', craft).innerHTML = shots.map((p, i) =>
      `<img class="craft__shot" src="${p.img}" alt="${esc(p.name)} press-on set" loading="lazy" style="--k:${i}">`).join('');
    const imgs = $$('.craft__shot', craft);
    const count = $('.craft__count b', craft);
    const word = $('.craft__word', craft), stage = $('.craft__stage', craft), bar = $('.craft__bar span', craft);
    const n = steps.length;
    let active = -1;
    const sc = pinned(craft);
    sc.measure = ((m) => () => { m(); sc.wordW = word.scrollWidth; })(sc.measure);
    sc.update = (y, vh, mx, my) => {
      const p = sc.progress(y);
      const f = p * n;
      const a = Math.min(n - 1, Math.floor(f));
      if (a !== active) {
        active = a;
        steps.forEach((s, i) => s.classList.toggle('is-on', i === a));
        imgs.forEach((img, i) => img.classList.toggle('is-on', i <= a));
        count.textContent = pad(a + 1);
        craft.style.setProperty('--step', a);
        craft.dataset.step = String(a);
      }
      const local = f - a; // 0 → 1 within the step
      word.style.transform = `translate3d(${(-p * Math.max(0, sc.wordW - window.innerWidth)).toFixed(1)}px,-50%,0)`;
      stage.style.transform = `rotate(${((local - 0.5) * 7 + mx * 3).toFixed(2)}deg) translate3d(${(mx * 12).toFixed(1)}px,${(my * 10).toFixed(1)}px,0)`;
      bar.style.transform = `scaleY(${p.toFixed(4)})`;
    };
    scenes.push(sc);
  }

  /* ─── 3. COLLECTION: every set rolls past ─── */
  const coll = $('[data-scene="coll"]');
  if (coll) {
    const track = $('.coll__track', coll);
    const list = S.PRODUCTS;
    track.innerHTML = list.map((p, i) => `
      <button class="coll__card" data-product="${p.id}" data-quick="${p.id}" data-cursor="Choose size" aria-label="${esc(p.name)}, $${p.price}. Choose a size">
        <img src="${p.thumb}" srcset="${p.thumb} 480w, ${p.img} 900w" sizes="(max-width: 900px) 60vw, 26vw" alt="${esc(p.name)} press-on nail set" loading="lazy">
        <span class="coll__num">${pad(i + 1)}</span>
      </button>`).join('');
    const cards = $$('.coll__card', track);
    const info = $('.coll__info', coll);
    const out = {
      name: $('.coll__name', info), cat: $('.coll__cat', info), price: $('.coll__price', info),
      desc: $('.coll__desc', info), btn: $('.coll__btn', info), now: $('.coll__now', coll), bar: $('.coll__bar span', coll),
    };
    $('.coll__total', coll).textContent = pad(list.length);
    let active = -1;
    const show = (i) => {
      const p = list[i];
      info.classList.remove('is-swap');
      void info.offsetWidth; // restart the swap animation
      info.classList.add('is-swap');
      out.name.textContent = p.name;
      out.cat.textContent = `${S.CATEGORY_LABELS[p.category]} · ${p.shape}`;
      out.price.textContent = `$${p.price}`;
      out.desc.textContent = p.desc;
      out.btn.dataset.quick = p.id;
      out.btn.setAttribute('aria-label', `Choose a size for ${p.name}`);
      out.now.textContent = pad(i + 1);
    };
    const sc = pinned(coll);
    sc.update = (y) => {
      const p = sc.progress(y);
      const f = p * (list.length - 1);
      const mobile = mqMobile.matches;
      const w = cards[0].offsetWidth || 300;
      const gap = w * (mobile ? 0.78 : 0.86);
      cards.forEach((c, i) => {
        const d = i - f, ad = Math.abs(d);
        if (ad > 4.5) { c.style.visibility = 'hidden'; return; }
        c.style.visibility = '';
        const x = d * gap;
        const yOff = ad * ad * (mobile ? 10 : 16);
        const s = 1 - Math.min(ad, 3) * 0.14;
        c.style.transform = `translate3d(${x.toFixed(1)}px,${yOff.toFixed(1)}px,0) rotate(${(d * 6).toFixed(2)}deg) scale(${s.toFixed(3)})`;
        c.style.opacity = String(clamp(1 - Math.max(0, ad - 2.6)));
        c.style.zIndex = String(100 - Math.round(ad * 10));
        c.classList.toggle('is-active', ad < 0.5);
        c.tabIndex = ad < 0.5 ? 0 : -1;
      });
      const a = Math.round(f);
      if (a !== active) { active = a; show(a); }
      out.bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    scenes.push(sc);
  }

  /* ─── 4. WORDS: giant words behind a changing card ─── */
  const words = $('[data-scene="words"]');
  if (words) {
    const line = $('.words__line', words);
    const items = $$('.words__item', line);
    const card = $('.words__card', words);
    card.innerHTML = `<span class="words__shape">${items.map((w) => {
      const p = byId(Number(w.dataset.product));
      return `<img src="${p.img}" alt="" loading="lazy">`;
    }).join('')}</span>`;
    const imgs = $$('img', card);
    let active = -1, centers = [];
    const sc = pinned(words);
    sc.measure = ((m) => () => {
      m();
      sc.lineW = line.scrollWidth;
      centers = items.map((w) => w.offsetLeft + w.offsetWidth / 2);
    })(sc.measure);
    sc.update = (y) => {
      const p = sc.progress(y);
      const vw = window.innerWidth;
      const from = vw * 0.55, to = -(sc.lineW - vw * 0.45);
      const x = from + (to - from) * p;
      line.style.transform = `translate3d(${x.toFixed(1)}px,-50%,0)`;
      let best = 0, bd = Infinity;
      centers.forEach((c, i) => { const d = Math.abs(c + x - vw / 2); if (d < bd) { bd = d; best = i; } });
      if (best !== active) {
        active = best;
        imgs.forEach((im, i) => im.classList.toggle('is-on', i === best));
        items.forEach((w, i) => w.classList.toggle('is-on', i === best));
        card.dataset.quick = items[best].dataset.product;
      }
      card.style.transform = `translate(-50%,-50%) rotate(${((p - 0.5) * -10).toFixed(2)}deg)`;
    };
    scenes.push(sc);
  }

  /* ─── 5. HOW: the ribbon ─── */
  const how = $('[data-scene="how"]');
  if (how) {
    const path = $('.how__ribbon path', how);
    const steps = $$('.how__step', how);
    const marks = [0.14, 0.5, 0.86];
    const sc = { el: how, measure() {} };
    sc.update = (y, vh) => {
      const r = how.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = clamp((vh * 0.7 - r.top) / (r.height * 0.95));
      path.style.strokeDashoffset = String((1 - p).toFixed(4));
      steps.forEach((s, i) => s.classList.toggle('is-on', p >= marks[i] - 0.06));
    };
    scenes.push(sc);
  }

  /* ─── 6. SHADE: the swatch fan opens as it scrolls in ─── */
  const shade = $('[data-scene="shade"]');
  if (shade) {
    const deck = $('.shade__deck', shade);
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = -1;
    const sc = { el: shade, measure() {} };
    sc.update = (y, vh) => {
      const r = deck.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = still ? 1 : easeOut(clamp((vh - r.top) / (vh * 0.7)));
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      deck.style.setProperty('--open', p.toFixed(3));
    };
    scenes.push(sc);

    // one shade at a time steps forward; the pin and caption take its colour and name
    const tips = $$('.shade__tip', deck);
    const pin = $('.shade__pin', deck);
    const now = $('.shade__now', shade);
    let lit = -1, timer = 0, held = 0;
    const light = (i) => {
      if (i === lit) return;
      lit = i;
      const t = tips[i];
      tips.forEach((el) => el.classList.toggle('is-lit', el === t));
      deck.style.setProperty('--pin', t.style.getPropertyValue('--c'));
      deck.style.setProperty('--pin-fg', i < 4 ? 'var(--wine)' : 'var(--beige)');
      now.textContent = $('b', t).textContent;
      now.classList.remove('is-swap');
      void now.offsetWidth; // restart the swap animation
      now.classList.add('is-swap');
    };
    tips.forEach((t, i) => {
      const pick = () => { held = performance.now(); light(i); };
      $('i', t).addEventListener('pointerenter', pick);
      $('i', t).addEventListener('click', pick);
    });
    if (!still) {
      new IntersectionObserver(([en]) => {
        clearInterval(timer);
        if (!en.isIntersecting) return;
        timer = setInterval(() => {
          if (document.hidden || last < 0.95 || performance.now() - held < 3500) return;
          light((lit + 1) % tips.length);
        }, 1500);
      }, { threshold: 0.3 }).observe(deck);
    }
  }

  /* ─── 7. CTA: sets trail behind the cursor ───
     Moving the mouse drops a photo every ~110px. When the pointer is still
     (and on touch screens) photos pop up on their own around the headline. */
  const cta = $('[data-scene="cta"]');
  if (cta && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const layer = $('.cta__trail', cta);
    const inner = $('.cta__inner', cta);
    let pool = null, k = 0, lx = -999, ly = -999, lastMove = 0, timer = 0;

    const build = () => {
      pool = S.PRODUCTS.map((p) => {
        const im = document.createElement('img');
        im.src = p.thumb; im.alt = ''; im.decoding = 'async';
        layer.appendChild(im);
        return im;
      });
    };
    const spawn = (x, y) => {
      const im = pool[k % pool.length];
      k++;
      const rot = (Math.random() * 14 - 7).toFixed(1);
      const at = `translate3d(${x.toFixed(0)}px,${y.toFixed(0)}px,0) translate(-50%,-50%)`;
      im.getAnimations().forEach((a) => a.cancel());
      im.style.zIndex = String(k);
      im.animate([
        { opacity: 0, transform: `${at} scale(0.5) rotate(${rot}deg)` },
        { opacity: 1, transform: `${at} scale(1) rotate(${rot}deg)`, offset: 0.16 },
        { opacity: 1, transform: `${at} scale(1) rotate(${rot}deg)`, offset: 0.72 },
        { opacity: 0, transform: `${at} scale(0.86) rotate(${rot}deg)` },
      ], { duration: 1700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
    };
    // somewhere in the section that isn't on top of the headline
    const autoSpawn = () => {
      if (performance.now() - lastMove < 1400) return;
      const box = cta.getBoundingClientRect(), t = inner.getBoundingClientRect();
      const pad = 40;
      for (let n = 0; n < 12; n++) {
        const x = pad + Math.random() * (box.width - pad * 2);
        const y = pad + Math.random() * (box.height - pad * 2);
        const ax = x + box.left, ay = y + box.top;
        if (ax > t.left - 60 && ax < t.right + 60 && ay > t.top - 60 && ay < t.bottom + 60) continue;
        spawn(x, y);
        return;
      }
    };
    cta.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !pool) return;
      const r = cta.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      lastMove = performance.now();
      if (Math.hypot(x - lx, y - ly) < 110) return;
      lx = x; ly = y;
      spawn(x, y);
    });
    new IntersectionObserver(([en]) => {
      clearInterval(timer);
      if (!en.isIntersecting) return;
      if (!pool) build();
      timer = setInterval(() => { if (!document.hidden) autoSpawn(); }, 520);
    }, { rootMargin: '0px 0px -10% 0px' }).observe(cta);
  }

  window.SHANAYA_STORY = {
    layout() { scenes.forEach((s) => s.measure()); },
    update(y, vh, mx, my) { scenes.forEach((s) => s.update(y, vh, mx, my)); },
  };
})();
