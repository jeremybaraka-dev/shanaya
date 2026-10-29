/* Custom orders page: card names and prices from the catalog, the hero
   photos taking turns, the giant word drifting as you scroll, and the
   style tabs on phones. */
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

  // phones: the style tabs swap the post below them
  const POSTS = [
    { id: 108, text: 'Hand-painted lilies on a soft nude base. Want them in your colours?' },
    { id: 104, text: 'Liquid chrome swirls in mocha and silver. Any colour you like.' },
    { id: 109, text: 'Bows, cherries and pearls in 3D. Pick your charms, we place them.' },
    { id: 110, text: 'Leopard and zebra in berry tones. Your print, your palette.' },
  ];
  const tabs = $$('.cz-tabs [data-tab]'), post = $('.cz-post');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    const d = POSTS[Number(tab.dataset.tab)], p = byId(d.id);
    if (!p || tab.classList.contains('is-on')) return;
    tabs.forEach((t) => { const on = t === tab; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', String(on)); });
    $('.cz-post__text', post).textContent = d.text;
    const img = $('.cz-post__img', post);
    img.src = p.img; img.alt = `${p.name} press-on nails`;
    $('.cz-post__look', post).dataset.quick = p.id;
    post.classList.remove('is-swap'); void post.offsetWidth; post.classList.add('is-swap');
  }));
})();
