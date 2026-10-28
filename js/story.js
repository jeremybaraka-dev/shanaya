/* ═══════════════════════════════════════════════════════
   NAILS BY SHANAYA — home page scroll story
   Builds the scenes from the catalog and exposes
   window.SHANAYA_STORY = { layout(), update(y, vh, mx, my) },
   which main.js calls from its Lenis-driven frame loop.
     1. cover   — the nail-shaped window opens into the statement (desktop)
     2. craft   — one set pinned centre stage, callouts change per step
     3. coll    — the baskets slide along a rising diagonal, details swap per basket
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
  const usd = (n) => (window.SHANAYA_FX ? window.SHANAYA_FX.tag(n) : `$${n}`); // local currency (js/fx.js)

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

  /* ─── 1. COVER (desktop): the nail-shaped window opens to fill the screen ───
     0 → .30   the window grows until its photos fill the screen; the wordmark,
               cards and cover lines drift away
     .20 → .60 the photos darken and the statement writes itself in
     .67 → 1   the lime section slides up over it all (CSS: .ab margin-top) */
  const cover = $('[data-scene="cover"]');
  if (cover) {
    $$('[data-hx-card]', cover).forEach((btn) => {
      const p = byId(Number(btn.dataset.hxCard));
      if (!p) return;
      btn.dataset.quick = p.id;
      btn.setAttribute('aria-label', `Quick look: ${p.name}`);
      const kick = p.type === 'basket' ? `Bundle · save ${usd(p.oldPrice - p.price)}` : esc(p.badge || 'New in');
      const price = p.oldPrice ? `${usd(p.price)} <s>${usd(p.oldPrice)}</s>` : `${usd(p.price)} · ${esc(p.shape || '')}`;
      btn.innerHTML = `<span class="hx__pic"><img src="${p.thumb}" alt="" decoding="async"></span>
        <span class="hx__txt"><span class="hx__kick">${kick}</span><span class="hx__nm">${esc(p.name)}</span><span class="hx__pr">${price}</span></span>`;
    });
    const portal = $('.hx__portal', cover), trip = $('.hx__trip', cover), shade = $('.hx__shade', cover);
    const masts = $$('.hx__mast', cover), ui = $$('.hx__ui', cover);
    const sticky = $('.hx__sticky', cover), layout = $('.hx__layout', cover), mid = $('.hx__mid', cover);
    const ghost = $('.hx__mast--ghost', cover);
    const flyA = $('.hx__float--a .hx__fly', cover), flyB = $('.hx__float--b .hx__fly', cover);
    const words = $$('.hx__w', cover), small = $('.hx__small', cover);
    const seg = (p, a, b) => clamp((p - a) / (b - a));
    const smooth = (t) => t * t * (3 - 2 * t);
    const sc = pinned(cover);
    let W = 1, H = 1, h0 = 1, cy = 0;
    sc.measure = ((m) => () => {
      m();
      W = window.innerWidth; H = window.innerHeight;
      // The window sits centred in the middle band (between the cover lines and the tagline)
      const top = layout.offsetTop + mid.offsetTop;
      cy = top + mid.offsetHeight / 2;
      h0 = Math.min(mid.offsetHeight * 1.08, W * 0.22 * 1.7); // its height at rest (the nail shape is 1 : 1.7)
      // The outline wordmark inside the window lines up with the real one (both sit on the band's floor)
      const floor = top + mid.offsetHeight - parseFloat(getComputedStyle(mid).paddingBottom);
      ghost.style.bottom = `${(sticky.clientHeight - floor).toFixed(1)}px`;
    })(sc.measure);
    const render = scrubber(0.45, (p) => {
      const o = smooth(seg(p, 0, 0.3));
      // 2.8× the screen in each direction is enough for the nail shape to cover every corner
      const mh = h0 + (H * 2.8 - h0) * o;
      portal.style.setProperty('--mw', `${(h0 / 1.7 + (W * 2.8 - h0 / 1.7) * o).toFixed(1)}px`);
      portal.style.setProperty('--mh', `${mh.toFixed(1)}px`);
      portal.style.setProperty('--my', `${(cy - mh / 2).toFixed(1)}px`);
      portal.classList.toggle('is-open', o > 0.999);
      const cv = smooth(seg(p, 0.67, 1));                    // being covered by the next section
      trip.style.transform = `scale(${(1.14 - 0.14 * o - 0.06 * cv).toFixed(4)})`;
      const m = seg(p, 0.02, 0.22);
      masts.forEach((el) => {
        el.style.opacity = String(1 - m);
        el.style.transform = `translate3d(0,${(-m * 14).toFixed(2)}vh,0) scale(${(1 + m * 0.12).toFixed(4)})`;
      });
      flyA.style.transform = `translate3d(${(-m * 30).toFixed(2)}vw,${(-m * 6).toFixed(2)}vh,0) rotate(${(-m * 10).toFixed(2)}deg)`;
      flyB.style.transform = `translate3d(${(m * 30).toFixed(2)}vw,${(-m * 6).toFixed(2)}vh,0) rotate(${(m * 10).toFixed(2)}deg)`;
      flyA.style.opacity = flyB.style.opacity = String(1 - seg(p, 0.08, 0.22));
      ui.forEach((el) => { el.style.opacity = String(1 - seg(p, 0, 0.1)); });
      shade.style.opacity = String(seg(p, 0.2, 0.36) * 0.9 + cv * 0.1);
      words.forEach((w, i) => {
        const t = smooth(seg(p, 0.3 + i * 0.03, 0.38 + i * 0.03));
        w.style.opacity = String(t);
        w.style.transform = `translate3d(0,${((1 - t) * 0.5).toFixed(3)}em,0) rotate(${((1 - t) * 4).toFixed(2)}deg)`;
      });
      const t = smooth(seg(p, 0.52, 0.6));
      small.style.opacity = String(t);
      small.style.transform = `translate3d(0,${((1 - t) * 24).toFixed(1)}px,0)`;
    });
    sc.update = (y) => { if (!mqMobile.matches) render(sc.progress(y)); };
    scenes.push(sc);
  }

  /* ─── 2. CRAFT: one set centre stage ─── */
  const craft = $('[data-scene="craft"]');
  if (craft) {
    const steps = $$('.craft__step', craft);
    // one hand-painted nail per step (cut-out photos in images/home/)
    const NAILS = [['nail-1', 'Hand-painted pink flower nail with gold beads'], ['nail-2', 'Pink nail with a sculpted bow'],
      ['nail-3', 'Pink and blue flower nail with crystals'], ['nail-4', 'Chocolate nail with an NY charm and gold beads']];
    $('.craft__nail', craft).innerHTML = NAILS.map(([f, alt], i) =>
      `<img class="craft__shot" src="images/home/${f}.webp" alt="${alt}" loading="lazy" style="--k:${i}">`).join('');
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

  /* ─── 3. COLLECTION: the baskets on a rising diagonal (after A24's film index) ───
     Each basket (a cut-out photo) grows as it moves right along the line;
     scrolling slides them along it with a slight lean. The basket in the
     middle is featured, with what's inside listed in the panel top left. */
  const coll = $('[data-scene="coll"]');
  if (coll) {
    const stage = $('[data-cd-stage]', coll);
    const BASKETS = [401, 402, 403, 405, 408].map(byId); // five of the ten: Pink, Cocoa, Emerald, Cherry, Butter
    const inside = (b, type) => b.has.filter((id) => S.PRODUCTS.find((p) => p.id === id).type === type);
    stage.innerHTML = BASKETS.map((b) => `
      <a class="bk" href="shop.html?cat=baskets" tabindex="-1" aria-label="Shop ${esc(b.name)}">
        <img src="${b.cutout}" alt="" loading="lazy" decoding="async">
      </a>`).join('');
    const items = $$('.bk', stage);
    const info = $('.coll__info', coll);
    const out = {
      name: $('.coll__name', info), sets: $('.bk__sets', info), charms: $('.bk__charms', info),
      polish: $('.bk__polish', info), price: $('.bk__price', info), desc: $('.coll__desc', info),
      btn: $('.cd__btn', info), now: $('.coll__now', coll),
    };
    $('.coll__total', coll).textContent = pad(BASKETS.length);
    const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
    let active = -1;
    const show = (i) => {
      const b = BASKETS[i];
      info.classList.remove('is-swap');
      void info.offsetWidth; // restart the swap animation
      info.classList.add('is-swap');
      out.name.textContent = b.name;
      out.sets.textContent = n(inside(b, 'set').length, 'set', 'sets');
      out.charms.textContent = n(inside(b, 'charm').length, 'box', 'boxes');
      out.polish.textContent = n(inside(b, 'polish').length, 'shade', 'shades');
      out.price.innerHTML = `${usd(b.price)} <s>${usd(b.oldPrice)}</s>`;
      out.desc.textContent = b.desc;
      out.btn.dataset.quick = b.id;
      out.now.textContent = pad(i + 1);
    };
    const sc = pinned(coll);
    // The baskets travel along a row that grows to the right (after A24's
    // film index): smaller ones behind on the left, bigger ones coming in on
    // the right. They all stand on one floor just above the quotes, and the
    // row is placed so no basket ever sits on the panel, the links or the quotes.
    const top = $('.cd__top', coll), quotes = $('.cd__quotes', coll);
    const G = 1.3, K = 0.92;                                  // size step between baskets; spacing (a touch of overlap)
    const along = (d) => K * (1 + G) / 2 * (Math.pow(G, d) - 1) / (G - 1); // centre offset of basket d, in featured widths
    let L = { cx: 0, floor: 1, w0: 1, h0: 1, dmin: 0 };
    sc.measure = ((m) => () => {
      m();
      const W = stage.clientWidth, H = stage.clientHeight;
      const floor = quotes.offsetTop - 16, ceil = top.offsetTop + top.offsetHeight + 16;
      const h0 = Math.min(H * 0.62, (floor - ceil) / G);    // the next (bigger) basket still clears the links
      const w0 = h0 * 0.78;                                  // the photos are about 4:5
      const panel = { r: info.offsetLeft + info.offsetWidth + 24, b: info.offsetTop + info.offsetHeight + 16 };
      const cx = Math.max(W * 0.5, panel.r + w0 * 0.55);    // the featured basket clears the panel
      let dmin = 0;                                          // the smaller baskets fade out before they reach it
      while (dmin > -3.6) {
        const d = dmin - 0.05, s = Math.pow(G, d), left = cx + along(d) * w0 - s * w0 / 2;
        if (left < 8 || (floor - s * h0 < panel.b && left < panel.r)) break;
        dmin = d;
      }
      L = { cx, floor, w0, h0, dmin };
    })(sc.measure);
    const render = scrubber(0.9, (f) => {
      const { cx, floor, w0, h0, dmin } = L;
      items.forEach((c, i) => {
        const d = i - f;
        if (d < dmin || d > 2.6) { c.style.visibility = 'hidden'; return; }
        c.style.visibility = '';
        const s = Math.pow(G, d);
        const x = cx + along(d) * w0 - w0 / 2;
        c.style.width = `${w0.toFixed(1)}px`;
        c.style.height = `${h0.toFixed(1)}px`;
        c.style.transform = `translate3d(${x.toFixed(1)}px,${(floor - h0).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
        c.style.zIndex = String(50 + Math.round(d * 10));
        c.style.opacity = String(clamp(Math.min((d - dmin) / 0.6, 2.6 - d)));
        const on = Math.abs(d) < 0.5;
        c.classList.toggle('is-active', on);
        c.tabIndex = on ? 0 : -1;
      });
      const a = Math.round(clamp(f, 0, BASKETS.length - 1));
      if (a !== active) { active = a; show(a); }
    });
    sc.update = (y) => {
      if (mqMobile.matches) return;
      render(sc.progress(y) * (BASKETS.length - 1));
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
    const list = first.concat(S.SETS.filter((p) => !first.includes(p)));
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
    cards.insertAdjacentHTML('afterbegin', S.SETS.map((p, i) => {
      const [first, ...rest] = p.name.split(' ');
      const blurb = (p.desc || '').split('. ')[0];
      return `<button type="button" class="nx__card" data-quick="${p.id}" data-cursor="Quick look" aria-label="Quick look: ${esc(p.name)}">
        <img src="${p.img}" alt="${esc(p.name)} press-on nails" loading="lazy" decoding="async" />
        <span class="nx__card-head"><span class="nx__name">${esc(first)}${rest.length ? ` <em>${esc(rest.join(' ').toLowerCase())}</em>` : ''}</span></span>
        <span class="nx__card-foot"><span class="nx__meta">${esc(p.shape || '')} · ${esc(p.category)} · ${usd(p.price)}<br>${esc(blurb)}<br>Sizes XS – XL · set of 10</span><span class="nx__tag">${i + 1}</span></span>
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
    const meta = (p) => (p.type === 'set' ? `${KIND[p.category]} · ${p.shape}` : p.type === 'basket' ? `${p.has.length} picks · bundle` : S.GROUP_LABELS[p.group]);
    const render = (cat) => {
      const list = cat === 'all' ? S.MIXED.filter((p) => !p.soon) : S.PRODUCTS.filter((p) => p.group === cat);
      mtRail.innerHTML = list.map((p, i) => `<button type="button" class="mt__card" data-quick="${p.id}" aria-label="Quick look: ${esc(p.name)}" style="--i:${i}">
          <span class="mt__media"><img src="${p.img}" alt="" loading="lazy" decoding="async" />${p.badge ? `<span class="mt__badge">${esc(p.badge)}</span>` : ''}</span>
          <span class="mt__name">${esc(p.name)}</span><span class="mt__meta">${esc(meta(p))}</span>
          <span class="mt__row"><b>${p.soon ? 'Soon' : usd(p.price)}${p.oldPrice ? ` <s>${usd(p.oldPrice)}</s>` : ''}</b><span class="mt__plus" aria-hidden="true">+</span></span>
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
