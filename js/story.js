/* ═══════════════════════════════════════════════════════
   NAILS BY SHANAYA — home page scroll story
   Builds the scenes from the catalog and exposes
   window.SHANAYA_STORY = { layout(), update(y, vh, mx, my) },
   which main.js calls from its Lenis-driven frame loop.
     1. hero    — a shuffling 3D deck of sets that fans into a row
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

  /* ─── 1. HERO: the deck ───
     A 3D stack of sets that shuffles on its own (front card flies out and
     tucks in at the back), tilts with the mouse, and fans into a row as you
     scroll. Cards ease toward their target pose every frame. */
  const hero = $('[data-scene="hero"]');
  if (hero) {
    const deck = $('.deck', hero);
    const picks = [101, 109, 104, 107, 111, 103].map(byId);
    deck.innerHTML = picks.map((p, i) => `
      <button class="deck__card" data-quick="${p.id}" data-cursor="View set" aria-label="Quick look: ${esc(p.name)}, $${p.price}" tabindex="${i ? -1 : 0}">
        <img src="${p.thumb}" srcset="${p.thumb} 480w, ${p.img} 900w" sizes="(max-width: 900px) 52vw, 22vw" alt=""${i === 0 ? ' fetchpriority="high"' : ''}>
        <span class="deck__tag"><b>${esc(p.name)}</b><span>$${p.price}</span></span>
      </button>`).join('');
    const cards = $$('.deck__card', deck);
    const n = cards.length;
    const loader = $('#loader');
    const fade = $$('.fh__lines, .fh__side, .fh__ctas', hero);
    const word = $('.fh__word', hero);
    let slot = cards.map((_, i) => i); // slot[i] = depth of card i (0 = front)
    let out = -1, p = 0, mx = 0, my = 0, visible = true, hover = false;
    const pose = cards.map(() => ({ x: 0, y: window.innerHeight * 0.7, z: 0, ry: -24, rz: 10, s: 0.9, o: 0 }));
    const mix = (a, b, t) => a + (b - a) * t;

    const target = (k, i) => {
      const mobile = mqMobile.matches, vw = window.innerWidth, e = easeOut(p);
      const c = k - (n - 1) / 2;
      const t = {
        x: mix(k * (mobile ? 22 : 54), c * vw * (mobile ? 0.36 : 0.155), e),
        y: mix(-k * (mobile ? 10 : 16), Math.abs(c) * (mobile ? 10 : 18), e),
        z: mix(-k * (mobile ? 90 : 150), 0, e),
        ry: mix(-24, 0, e) + mx * 10,
        rz: mix(0, c * 3.5, e) - my * 2,
        s: mix(1, mobile ? 0.8 : 0.86, e),
        o: k < 5 || e > 0.2 ? 1 : 0,
      };
      if (i === out) Object.assign(t, { x: -vw * (mobile ? 0.75 : 0.36), y: 60, z: 60, ry: 12, rz: -16, o: 1 });
      return t;
    };

    const frame = () => {
      const ready = !loader || loader.classList.contains('is-open') || loader.classList.contains('is-done');
      if (visible && ready) {
        cards.forEach((card, i) => {
          const t = target(slot[i], i), q = pose[i];
          Object.keys(t).forEach((key) => { q[key] += (t[key] - q[key]) * 0.09; });
          card.style.transform = `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,${q.z.toFixed(1)}px) rotateY(${q.ry.toFixed(2)}deg) rotateZ(${q.rz.toFixed(2)}deg) scale(${q.s.toFixed(3)})`;
          card.style.opacity = q.o.toFixed(3);
          card.style.zIndex = String(i === out ? n + 1 : n - slot[i]);
        });
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    const shuffle = () => {
      if (!visible || hover || p > 0.02 || document.hidden || out !== -1) return;
      out = slot.indexOf(0);
      setTimeout(() => {
        slot = slot.map((s) => (s === 0 ? n - 1 : s - 1));
        out = -1;
        cards.forEach((card, i) => { card.tabIndex = slot[i] === 0 ? 0 : -1; });
      }, 700);
    };
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(shuffle, 3000);
    deck.addEventListener('mouseenter', () => { hover = true; });
    deck.addEventListener('mouseleave', () => { hover = false; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);

    const sc = pinned(hero);
    sc.update = (y, vh, mxx, myy) => {
      p = sc.progress(y); mx = mxx; my = myy;
      const e = easeOut(p);
      word.style.transform = `translate3d(0,${(-e * vh * 0.2).toFixed(1)}px,0)`;
      word.style.opacity = String(clamp(1 - p * 1.5));
      fade.forEach((el) => { el.style.opacity = String(clamp(1 - p * 2.6)); });
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
