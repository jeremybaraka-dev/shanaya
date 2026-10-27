/* ═══════════════════════════════════════════════════════
   NAILS BY SHANAYA — home page scroll story
   Builds the scenes from the catalog and exposes
   window.SHANAYA_STORY = { layout(), update(y, vh, mx, my) },
   which main.js calls from its Lenis-driven frame loop.
     1. hero    — a huge staggered wordmark; the two lines drift apart on scroll
     2. craft   — one set pinned centre stage, callouts change per step
     3. coll    — all twelve sets roll past, details swap per set
     4. about   — the product highlights rotate through the catalog
     5. how     — giant faded words with three steps in oversized type
     7. cta     — product photos trail behind the cursor (shop page)
     8. next    — the sets roll past sideways, magazine style (home)
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
  // Scrubbed motion: eases toward the scroll position over ~`seconds`,
  // like GSAP's `scrub: n`, so the scene trails the scroll softly.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function scrubber(seconds, apply) {
    let cur = null, target = 0, raf = 0, last = 0;
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      cur += (target - cur) * (1 - Math.exp(-dt * 4 / seconds));
      if (Math.abs(target - cur) < 0.0004) cur = target;
      apply(cur);
      raf = cur === target ? 0 : requestAnimationFrame(step);
    };
    return (t) => {
      target = t;
      if (cur === null || reduceMotion) { cur = t; apply(cur); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    };
  }

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

  /* ─── 4. ABOUT: product highlights rotate ───
     Every few seconds the four cards wipe out one after another and come
     back with the next four sets (paused while hovered or off screen). */
  const about = $('.ab');
  if (about) {
    const cards = $$('.ab__card', about);
    const count = $('.ab__count', about);
    const KIND = { floral: 'Floral', charms: 'Charms & 3D', chrome: 'Chrome', animal: 'Animal print' };
    const first = cards.map((c) => byId(Number(c.dataset.quick))).filter(Boolean);
    const list = first.concat(S.PRODUCTS.filter((p) => !first.includes(p)));
    const per = cards.length;
    const groups = [];
    for (let i = 0; i < list.length; i += per) {
      const g = list.slice(i, i + per);
      while (g.length < per) g.push(list[g.length]);
      groups.push(g);
    }
    const label = (gi) => `${pad(gi * per + 1)}—${pad(Math.min((gi + 1) * per, list.length))} / ${list.length}`;
    const fill = (card, p) => {
      card.dataset.quick = p.id;
      card.setAttribute('aria-label', `Quick look: ${p.name}`);
      const img = $('img', card);
      img.src = p.img; img.alt = `${p.name} press-on nails`;
      $('.ab__name', card).textContent = p.name;
      $('.ab__tag', card).textContent = [KIND[p.category] || p.category, p.shape].filter(Boolean).join(' · ');
      $('.ab__desc', card).textContent = `${(p.desc || '').split('. ')[0].replace(/\.$/, '')}.`;
    };
    const preload = (g) => Promise.all(g.map((p) => new Promise((res) => {
      const im = new Image(); im.onload = im.onerror = res; im.src = p.img;
    })));
    let gi = 0, busy = false, visible = false, hovered = false;
    const next = () => {
      if (busy || hovered || !visible || document.hidden || groups.length < 2) return;
      busy = true;
      const ni = (gi + 1) % groups.length;
      preload(groups[ni]).then(() => {
        cards.forEach((card, i) => setTimeout(() => {
          card.classList.add('is-out');
          setTimeout(() => {
            fill(card, groups[ni][i]);
            card.classList.remove('is-out');
            if (i === per - 1) { gi = ni; busy = false; }
          }, reduceMotion ? 0 : 480);
        }, reduceMotion ? 0 : i * 130));
        if (count) count.textContent = label(ni);
      });
    };
    if (count) count.textContent = label(0);
    const grid = $('.ab__grid', about);
    grid.addEventListener('pointerenter', () => { hovered = true; });
    grid.addEventListener('pointerleave', () => { hovered = false; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.25 }).observe(grid);
    setInterval(next, 6000);
  }

  /* ─── 5. HOW: giant type, three steps ───
     One scrubbed timeline from "section top at 60% of the screen" to
     "section bottom at the top": every background row rises 150px, each
     starting a beat after the one above; the lettering rises 400px and the
     rule 200px in the first half. The rule and letters animate in once. */
  const how = $('[data-scene="how"]');
  if (how) {
    const rows = $$('.how__row', how);
    const fg = $('.how__fg', how);
    const rule = $('.how__rule', how);
    const TL = 0.05 * (rows.length - 1) + 0.5;   // timeline length: staggered rows
    const seg = (t, start) => clamp((t - start) / 0.5);
    const render = scrubber(1, (p) => {
      const t = p * TL, k = mqMobile.matches ? 0.5 : 1;
      rows.forEach((row, i) => { row.style.transform = `translate3d(0,${(-150 * k * seg(t, i * 0.05)).toFixed(1)}px,0)`; });
      fg.style.transform = `translate3d(0,${(-400 * k * seg(t, 0)).toFixed(1)}px,0)`;
      rule.style.transform = `translate3d(0,${(-200 * k * seg(t, 0)).toFixed(1)}px,0)`;
    });
    const sc = { el: how, measure() {} };
    sc.update = (y, vh) => {
      const r = how.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      if (!how.classList.contains('is-in') && r.top < vh * 0.75) how.classList.add('is-in');
      render(clamp((vh * 0.6 - r.top) / (r.height + vh * 0.6)));
    };
    scenes.push(sc);
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

  /* ─── 7. NEXT: the sets roll past, magazine style ───
     The panel pins while the cards slide left (scrubbed), then holds for a
     beat before the page carries on. Cards open the quick look. */
  const next = $('[data-scene="next"]');
  if (next) {
    const cards = $('.nx__cards', next);
    const end = $('.nx__end', next);
    cards.insertAdjacentHTML('afterbegin', S.PRODUCTS.map((p, i) => {
      const [first, ...rest] = p.name.split(' ');
      const blurb = (p.desc || '').split('. ')[0];
      return `<button type="button" class="nx__card" data-quick="${p.id}" data-cursor="Quick look" aria-label="Quick look: ${esc(p.name)}">
        <img src="${p.img}" alt="${esc(p.name)} press-on nails" loading="lazy" decoding="async" />
        <span class="nx__card-head"><span class="nx__name">${esc(first)}${rest.length ? ` <em>${esc(rest.join(' ').toLowerCase())}</em>` : ''}</span></span>
        <span class="nx__card-foot"><span class="nx__meta">${esc(p.shape || '')} · ${esc(p.category)} · $${p.price}<br>${esc(blurb)}<br>Sizes XS – XL · set of 10</span><span class="nx__tag">${i + 1}</span></span>
      </button>`;
    }).join(''));

    const HOLD = 300;   // px of scroll the panel stays pinned after the last card
    const sc = { el: next, top: 0, dist: 0 };
    const render = scrubber(0.6, (x) => { cards.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`; });
    sc.measure = () => {
      if (reduceMotion) { next.classList.add('is-static'); return; }
      const vw = window.innerWidth;
      const gap = parseFloat(getComputedStyle(end).marginRight) || 0;   // room after the last panel
      sc.dist = Math.max(0, end.offsetLeft + end.offsetWidth + gap - vw);
      next.style.height = `${window.innerHeight + sc.dist + HOLD}px`;
      sc.top = next.getBoundingClientRect().top + window.scrollY;
    };
    sc.update = (y) => {
      if (reduceMotion || !sc.dist) return;
      const travelled = clamp(y - sc.top, 0, sc.dist + HOLD);
      render(Math.min(travelled, sc.dist));
    };
    scenes.push(sc);
  }

  window.SHANAYA_STORY = {
    layout() { scenes.forEach((s) => s.measure()); },
    update(y, vh, mx, my) { scenes.forEach((s) => s.update(y, vh, mx, my)); },
  };
})();
