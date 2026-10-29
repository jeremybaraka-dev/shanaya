/* Custom orders page: card names and prices from the catalog, the hero
   photos taking turns, the giant word drifting as you scroll, and the
   category tiles that filter the sets on phones. */
(() => {
  const S = window.SHANAYA, FX = window.SHANAYA_FX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const byId = (id) => S.PRODUCTS.find((p) => p.id === Number(id));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cards: name, price (in the visitor's currency) and badge from the catalog
  $$('.cz-card').forEach((card) => {
    const p = byId(card.dataset.quick);
    if (!p) return;
    $('[data-name]', card).textContent = p.name;
    $('[data-price]', card).innerHTML = FX ? FX.tag(p.price) : `$${p.price}`;
    $('[data-badge]', card).textContent = p.isNew ? 'New' : (p.badge || 'Idea');
    card.setAttribute('aria-label', `Quick look: ${p.name}`);
  });

  // hero photos take turns every few seconds, the dots following
  const pic = $('.cz-hero__pic');
  if (pic && !reduceMotion) {
    const imgs = $$('img', pic), dots = $$('.cz-dots i', pic);
    let at = 0;
    setInterval(() => {
      if (document.hidden) return;
      const next = (at + 1) % imgs.length;
      imgs[at].classList.remove('is-on'); dots[at] && dots[at].classList.remove('is-on');
      imgs[next].classList.add('is-on'); dots[next] && dots[next].classList.add('is-on');
      at = next;
    }, 3800);
  }

  // the giant word slides a little as the page scrolls; the photo drifts the other way
  const word = $('.cz-word');
  if (word && !reduceMotion) {
    let ticking = false;
    const move = () => {
      ticking = false;
      const y = Math.min(window.scrollY, window.innerHeight);
      word.style.transform = `translate3d(${(-y * 0.12).toFixed(1)}px,0,0)`;
      if (pic && innerWidth > 900) pic.style.translate = `0 ${(y * 0.06).toFixed(1)}px`;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
  }

  // phones: the category tiles filter the starting-point sets below them
  const grid = $('[data-czm-grid]');
  if (grid) {
    const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const SETS = S.SETS.filter((p) => !p.soon);
    const MIX = [112, 111, 110, 107].map(byId).filter(Boolean);
    const LABEL = { floral: 'Florals', chrome: 'Chrome', charms: '3D charms', animal: 'Animal print' };
    const BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>';
    const render = (cat) => {
      const list = cat === 'all' ? MIX : SETS.filter((p) => p.category === cat).slice(0, 4);
      grid.innerHTML = list.map((p, i) => `
        <button type="button" class="czm-prod" data-quick="${p.id}" style="--i:${i}" aria-label="Quick look: ${esc(p.name)}">
          <span class="czm-prod__img"><img src="${p.thumb}" alt="" loading="lazy" decoding="async"><i>${p.isNew ? 'New' : 'Hand<br>painted'}</i></span>
          <b>${esc(p.name)}</b><small>${esc(LABEL[p.category] || 'Press-ons')} · By Shanaya</small>
          <span class="czm-prod__row"><span class="czm-prod__price">${FX ? FX.tag(p.price) : `$${p.price}`}</span><span class="czm-prod__bag" aria-hidden="true">${BAG}</span></span>
        </button>`).join('');
    };
    render('all');
    const cats = $$('.czm-cats [data-cat]');
    cats.forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('is-on')) return;
      cats.forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
      render(b.dataset.cat);
    }));
  }
})();
