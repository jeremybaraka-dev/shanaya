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

  /* ─── 3. COLLECTION: the sets as spinning discs (after A24's film index) ───
     The discs sit on a rising diagonal, growing to the right. Scrolling
     slides them along it and spins each one; the disc in the middle is the
     featured set, whose details fill the panel top left. */
  const coll = $('[data-scene="coll"]');
  if (coll) {
    const stage = $('[data-cd-stage]', coll);
    const list = S.PRODUCTS;
    stage.innerHTML = list.map((p, i) => `
      <button class="cd__disc" data-product="${p.id}" data-quick="${p.id}" data-cursor="Choose size" aria-label="${esc(p.name)}, $${p.price}. Choose a size" tabindex="-1">
        <span class="cd__tilt"><span class="cd__spin"><img src="${p.img}" alt="" loading="lazy" decoding="async"><span class="cd__hole"></span></span></span>
      </button>`).join('');
    const discs = $$('.cd__disc', stage);
    const info = $('.coll__info', coll);
    const out = {
      name: $('.coll__name', info), cat: $('.cd__cat', info), shape: $('.cd__shape', info), price: $('.coll__price', info),
      desc: $('.coll__desc', info), btn: $('.coll__btn', info), now: $('.coll__now', coll),
    };
    $('.coll__total', coll).textContent = pad(list.length);
    let active = -1;
    const show = (i) => {
      const p = list[i];
      info.classList.remove('is-swap');
      void info.offsetWidth; // restart the swap animation
      info.classList.add('is-swap');
      out.name.textContent = p.name;
      out.cat.textContent = S.CATEGORY_LABELS[p.category];
      out.shape.textContent = p.shape;
      out.price.textContent = `$${p.price}`;
      out.desc.textContent = p.desc;
      out.btn.dataset.quick = p.id;
      out.btn.setAttribute('aria-label', `Choose a size for ${p.name}`);
      out.now.textContent = pad(i + 1);
    };
    const sc = pinned(coll);
    let W = 1, H = 1;
    sc.measure = ((m) => () => { m(); W = stage.clientWidth || 1; H = stage.clientHeight || 1; })(sc.measure);
    const render = scrubber(0.6, (f) => {
      const D = Math.min(W * 0.3, H * 0.62);           // featured disc size
      const cx = W * 0.5, cy = H * 0.56;
      discs.forEach((c, i) => {
        const d = i - f;
        if (d < -3.6 || d > 2.2) { c.style.visibility = 'hidden'; return; }
        c.style.visibility = '';
        const s = Math.pow(1.32, d);                    // grows to the right
        const along = D * 1.04 * (s - 1) / 0.32;         // spacing scales with size
        const x = cx + along, y = cy - along * 0.27;
        c.style.width = `${D.toFixed(1)}px`;
        c.style.transform = `translate3d(${(x - D / 2).toFixed(1)}px,${(y - D / 2).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
        c.style.zIndex = String(50 + Math.round(d * 10));
        c.style.opacity = String(clamp(Math.min(d + 3.6, 2.2 - d)));
        c.firstElementChild.firstElementChild.style.transform = `rotate(${(f * 140 + i * 37).toFixed(1)}deg)`;
        const on = Math.abs(d) < 0.5;
        c.classList.toggle('is-active', on);
        c.tabIndex = on ? 0 : -1;
      });
      const a = Math.round(clamp(f, 0, list.length - 1));
      if (a !== active) { active = a; show(a); }
    });
    sc.update = (y) => {
      if (mqMobile.matches) return;
      render(sc.progress(y) * (list.length - 1));
    };
    scenes.push(sc);
  }

  /* ─── 4. ABOUT: product highlights rotate ───
     Every three seconds the four cards wipe out one after another and come
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
    setInterval(next, 3000);
  }

  /* ─── 5. HOW: giant type, three steps ───
     One scrubbed timeline from "section top at 60% of the screen" to
     "section bottom at the top": every background row rises 150px, each
     starting a beat after the one above; the lettering glides 400px (resting
     in place as the section arrives, so its top line is never cut) and the
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
      fg.style.transform = `translate3d(0,${(400 * k * (0.55 - seg(t, 0))).toFixed(1)}px,0)`;
      rule.style.transform = `translate3d(0,${(200 * k * (0.55 - seg(t, 0))).toFixed(1)}px,0)`;
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
      if (mqMobile.matches) { next.style.height = ''; sc.dist = 0; return; }   // phones get .mx instead
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

  /* ─── PHONES: trending rail (filterable) + craft rail dots ─── */
  const mtRail = $('[data-mt-rail]');
  if (mtRail) {
    const KIND = { floral: 'Floral', charms: 'Charms & 3D', chrome: 'Chrome', animal: 'Animal print' };
    const render = (cat) => {
      const list = cat === 'all' ? S.PRODUCTS : S.PRODUCTS.filter((p) => p.category === cat);
      mtRail.innerHTML = list.map((p, i) => `<button type="button" class="mt__card" data-quick="${p.id}" aria-label="Quick look: ${esc(p.name)}" style="--i:${i}">
          <span class="mt__media"><img src="${p.img}" alt="" loading="lazy" decoding="async" />${p.badge ? `<span class="mt__badge">${esc(p.badge)}</span>` : ''}</span>
          <span class="mt__name">${esc(p.name)}</span><span class="mt__meta">${esc(KIND[p.category] || p.category)} · ${esc(p.shape || '')}</span>
          <span class="mt__row"><b>$${p.price}</b><span class="mt__plus" aria-hidden="true">+</span></span>
        </button>`).join('');
      mtRail.scrollLeft = 0;
    };
    render('all');
    const chips = $('[data-mt-chips]');
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cat]');
      if (!b || b.classList.contains('is-on')) return;
      $$('button', chips).forEach((x) => x.classList.toggle('is-on', x === b));
      render(b.dataset.cat);
    });
  }
  const mcRail = $('[data-mc-rail]');
  if (mcRail) {
    const dots = $$('.mc__dots i');
    mcRail.addEventListener('scroll', () => {
      const cards = $$('.mc__card', mcRail);
      const w = cards[0] ? cards[0].offsetWidth + 14 : 1;
      const i = Math.min(dots.length - 1, Math.round(mcRail.scrollLeft / w));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
    }, { passive: true });
  }

  window.SHANAYA_STORY = {
    layout() { scenes.forEach((s) => s.measure()); },
    update(y, vh, mx, my) { scenes.forEach((s) => s.update(y, vh, mx, my)); },
  };
})();
