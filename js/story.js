/* ═══════════════════════════════════════════════════════
   NAILS BY SHANAYA — home page scroll story
   Builds the scenes from the catalog and exposes
   window.SHANAYA_STORY = { layout(), update(y, vh, mx, my) },
   which main.js calls from its Lenis-driven frame loop.
     1. hero    — one star set in a nail-shaped frame, stickers drift away
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

  /* ─── 1. HERO: one star set, editorial ───
     A tall nail-shaped photo of the star set, a calm headline, and three
     small sticker cards at the edges. On scroll the stickers drift away,
     the headline lifts and the star set eases up. */
  const hero = $('[data-scene="hero"]');
  if (hero) {
    const copy = $('.fw__copy', hero), star = $('.fw__hero', hero), badge = $('.fw__badge', hero);
    const stickers = $$('.fw__stk', hero).map((el, i) => ({ el, dir: [-1, 1, 1][i], lift: [0.55, 0.7, 0.4][i], depth: [14, 22, 18][i] }));
    const sc = pinned(hero);
    sc.update = (y, vh, mx, my) => {
      const p = sc.progress(y), e = easeOut(p);
      copy.style.transform = `translate3d(0,${(-e * vh * 0.16).toFixed(1)}px,0)`;
      copy.style.opacity = String(clamp(1 - p * 1.8));
      star.style.transform = `translate3d(${(mx * -8).toFixed(1)}px,${(-e * vh * 0.07 + my * -6).toFixed(1)}px,0) scale(${(1 + e * 0.06).toFixed(3)})`;
      badge.style.transform = `translate3d(${(mx * 10).toFixed(1)}px,${(-e * vh * 0.3).toFixed(1)}px,0)`;
      stickers.forEach((s) => {
        s.el.style.transform = `translate3d(${(s.dir * e * 160 + mx * s.depth).toFixed(1)}px,${(-e * vh * s.lift + my * s.depth).toFixed(1)}px,0) rotate(${(s.dir * e * 12).toFixed(2)}deg)`;
      });
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
