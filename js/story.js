/* ═══════════════════════════════════════════════════════
   NAILS BY SHANAYA — home page scroll story
   Builds the scenes from the catalog and exposes
   window.SHANAYA_STORY = { layout(), update(y, vh, mx, my) },
   which main.js calls from its Lenis-driven frame loop.
     1. hero    — a cut-out case with seven sets orbiting it on a 3D ring
     2. craft   — one set pinned centre stage, callouts change per step
     3. coll    — all twelve sets roll past, details swap per set
     4. words   — giant words glide behind a changing photo card
     5. how     — a ribbon draws itself through three steps
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

  /* ─── 1. HERO: the case, with sets orbiting it ───
     A cut-out case sits centre stage, bleeding off the bottom. Seven sets
     orbit it on a tilted 3D ring: on the back half they pass behind the case
     (and show through its clear lid), on the front half in front of it.
     Each frame, any card that drifts near the text fades out, so the copy
     is never covered at any screen size. Scrolling speeds the ring up and
     widens it while the copy lifts away. On phones the ring is hidden and
     the case floats on its own. */
  const hero = $('[data-scene="hero"]');
  if (hero) {
    const ring = $('.wk__ring', hero), subject = $('.wk__subject', hero);
    const copy = $('.wk__copy', hero), note = $('.wk__note', hero), badge = $('.wk__badge', hero);
    const loader = $('#loader');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const picks = [109, 104, 103, 111, 101, 106, 110].map(byId);
    ring.innerHTML = picks.map((p) => `
      <button class="wk__card" data-quick="${p.id}" data-cursor="View set" tabindex="-1" aria-label="Quick look: ${esc(p.name)}">
        <img src="${p.thumb}" alt="" loading="lazy">
      </button>`).join('');
    const cards = $$('.wk__card', ring);
    const N = cards.length;
    const TILT = -12 * Math.PI / 180;
    let speed = 0.11, p = 0, mx = 0, my = 0, last = performance.now(), born = 0, visible = true, hovered = false;
    let geo = null;

    // Everything is measured in the pinned panel's own coordinates (the cards
    // are positioned inside it). offsetLeft/Top ignore the CSS translate and
    // the rise animation, so the ring centres on the case's resting spot.
    const stage = $('.wk__sticky', hero);
    const measure = () => {
      const vw = stage.clientWidth, vh = stage.clientHeight, mobile = mqMobile.matches;
      const w = subject.offsetWidth, h = subject.offsetHeight;
      const top = subject.offsetTop;
      geo = {
        cx: subject.offsetLeft, // left is the centre: the case is shifted back by translate -50%
        // the ring wraps the lower part of the case, so the front pass runs
        // along its bottom edge instead of across the nails
        cy: mobile ? top + h * 0.8 : Math.min(top + h * 0.72, vh * 0.78),
        rx: mobile ? vw * 0.56 : Math.min(vw * 0.42, w * 1.02),
        ry: mobile ? vh * 0.06 : vh * 0.125,
        cw: cards[0].offsetWidth, ch: cards[0].offsetHeight,
      };
    };

    // Cards are spaced by distance along the ring as it appears on screen (not
    // by angle), so they stay evenly apart instead of bunching at the ends.
    const SAMPLES = 360;
    const path = { th: new Float32Array(SAMPLES + 1), len: new Float32Array(SAMPLES + 1), total: 1 };
    const buildPath = (rx, ry) => {
      let px = rx, py = 0, acc = 0;
      for (let k = 0; k <= SAMPLES; k++) {
        const th = (k / SAMPLES) * Math.PI * 2;
        const x = Math.cos(th) * rx, y = Math.sin(th) * ry;
        acc += Math.hypot(x - px, y - py);
        path.th[k] = th; path.len[k] = acc;
        px = x; py = y;
      }
      path.total = acc;
    };
    const thetaAt = (s) => {
      let lo = 0, hi = SAMPLES;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (path.len[mid] < s) lo = mid; else hi = mid; }
      const span = path.len[hi] - path.len[lo] || 1;
      return path.th[lo] + ((s - path.len[lo]) / span) * (path.th[hi] - path.th[lo]);
    };
    let travel = 0; // how far along the ring the first card has moved, as a fraction of a lap

    const overlap = (a, b) => {
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      return w > 0 && h > 0 ? w * h : 0;
    };
    const rectOf = (el, pad, origin) => {
      const r = el.getBoundingClientRect();
      return { l: r.left - origin.left - pad, t: r.top - origin.top - pad, r: r.right - origin.left + pad, b: r.bottom - origin.top + pad };
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const ready = !loader || loader.classList.contains('is-open') || loader.classList.contains('is-done');
      // the ring is desktop-only (hidden by CSS on phones), so skip the work there
      if (visible && ready && geo && ring.offsetParent !== null) {
        if (!born) born = now;
        const intro = clamp((now - born) / 1600);
        if (!reduceMotion && !hovered) travel = (travel + dt * (speed + p * 0.45) / (Math.PI * 2)) % 1;
        const e = easeOut(p);
        const rx = geo.rx * (1 + e * 0.25), ry = geo.ry * (1 + e * 0.6);
        buildPath(rx, ry);
        const origin = stage.getBoundingClientRect();
        const avoid = [copy, note, badge]
          .filter((el) => el.offsetParent !== null)
          .map((el) => rectOf(el, el === copy ? 28 : 40, origin));
        const sh = stage.clientHeight;
        const cx = geo.cx + mx * 18, cy = geo.cy - e * sh * 0.08 + my * 10;
        cards.forEach((card, i) => {
          const th = thetaAt((((travel + i / N) % 1) + 1) % 1 * path.total);
          const ex = Math.cos(th) * rx, ey = Math.sin(th) * ry;
          const x = cx + ex * Math.cos(TILT) - ey * Math.sin(TILT);
          const y = cy + ex * Math.sin(TILT) + ey * Math.cos(TILT);
          const depth = Math.sin(th); // +1 front, -1 back
          const s = 0.72 + 0.28 * (depth + 1) / 2;
          // fly in from below on load, one after another
          const k = clamp(intro * 1.6 - i * 0.08);
          const yIn = (1 - easeOut(k)) * sh * 0.5;
          const w = geo.cw * s, h = geo.ch * s;
          const box = { l: x - w / 2, r: x + w / 2, t: y + yIn - h / 2, b: y + yIn + h / 2 };
          let o = k;
          avoid.forEach((a) => { o *= 1 - clamp((overlap(box, a) / (w * h)) * 10); });
          const rotY = clamp(-Math.cos(th) * 58, -58, 58);
          const rotZ = (TILT * 180 / Math.PI) + Math.cos(th) * -6;
          card.style.transform = `translate3d(${(x - geo.cw / 2).toFixed(1)}px,${(y + yIn - geo.ch / 2).toFixed(1)}px,0) perspective(900px) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${s.toFixed(3)})`;
          card.style.opacity = o.toFixed(3);
          card.style.zIndex = depth > 0 ? String(40 + Math.round(depth * 10)) : String(10 + Math.round((depth + 1) * 10));
          card.style.pointerEvents = o > 0.6 ? '' : 'none';
          card.style.filter = depth < 0 ? `brightness(${(0.82 + 0.18 * (depth + 1)).toFixed(3)})` : '';
        });
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    ring.addEventListener('mouseover', (e) => { hovered = !!e.target.closest('.wk__card'); });
    ring.addEventListener('mouseleave', () => { hovered = false; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);

    const sc = pinned(hero);
    sc.measure = ((m) => () => {
      m();
      subject.style.transform = '';
      measure();
    })(sc.measure);
    sc.update = (y, vh, mxx, myy) => {
      p = sc.progress(y); mx = mxx; my = myy;
      const e = easeOut(p);
      copy.style.transform = `translate3d(0,${(-e * vh * 0.22).toFixed(1)}px,0)`;
      copy.style.opacity = String(clamp(1 - p * 1.7));
      note.style.opacity = String(clamp(1 - p * 2.5));
      subject.style.transform = `translate3d(${(mx * -10).toFixed(1)}px,${(-e * vh * 0.1 + my * -6).toFixed(1)}px,0) scale(${(1 + e * 0.08).toFixed(3)})`;
      badge.style.transform = `translate3d(${(mx * 12).toFixed(1)}px,${(-e * vh * 0.35).toFixed(1)}px,0)`;
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

  window.SHANAYA_STORY = {
    layout() { scenes.forEach((s) => s.measure()); },
    update(y, vh, mx, my) { scenes.forEach((s) => s.update(y, vh, mx, my)); },
  };
})();
