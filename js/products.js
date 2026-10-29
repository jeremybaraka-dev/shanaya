/* ═══════════════════════════════════════════════════════
   NAILS BY SHANAYA — catalog + nail-art illustrations
   Photos live in images/press-ons/, images/nail-charms/,
   images/nail-polish/ and images/basket/ as <slug>.webp
   (with a -sm.webp thumbnail and a .jpg copy for Pinterest).
═══════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  // ─── CATALOG ───  (prices here are what the checkout server charges)
  const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  const set = (id, slug, name, category, price, extra) => Object.assign({
    id, slug, name, category, price, type: 'set', group: 'press-ons', sizes: SIZES, optionLabel: 'Size', stars: 5,
    img: `images/press-ons/${slug}.webp`,
    thumb: `images/press-ons/${slug}-sm.webp`,
  }, extra);

  // Nail charms and nail polish. `sizes` holds the buyable options (the
  // checkout server checks against it); `optionLabel` names them ("Pack",
  // "Shade"). An item with `soon: true` shows as Coming soon and can't be
  // bought until it has a real price, photo and options.
  // Prices for the charm boxes and polish bottles (in dollars), a little under
  // what the market charges. Set one to null and those items show as "Coming
  // soon" and can't be bought. Each polish is priced by its brand (POLISH_BRAND
  // below); POLISH_PRICE is for bottles with no brand listed.
  const CHARM_PRICE = 10;
  const POLISH_PRICE = 8;
  const item = (type, category, folder, optionLabel, option, price) => (id, slug, name, desc) => Object.assign({
    id, slug, name, category, type, group: category, price, desc, sizes: [option], optionLabel, stars: 0,
    img: `images/${folder}/${slug}.webp`,
    thumb: `images/${folder}/${slug}-sm.webp`,
  }, price == null ? { soon: true, badge: 'Soon' } : {});
  const charm = item('charm', 'nail-charms', 'nail-charms', 'Box', 'Full box', CHARM_PRICE);
  const polish = item('polish', 'polish', 'nail-polish', 'Bottle', 'One bottle', POLISH_PRICE);

  const PRODUCTS = [
    set(101, 'merlot-garden', 'Merlot Garden', 'floral', 32, { badge: 'Bestseller', art: 'rosegold', shape: 'Stiletto',
      desc: 'Burgundy marble, sculpted pink blossoms, a touch of leopard and gold charms. Set of 10 stiletto nails.' }),
    set(102, 'downtown-charm', 'Downtown Charm', 'charms', 30, { badge: 'New', isNew: true, art: 'y2k', shape: 'Almond',
      desc: 'Nude French tips with cocoa stars, cherries, an NY charm and leopard and zebra accents. Set of 10.' }),
    set(103, 'polka-blossom', 'Polka Blossom', 'floral', 28, { art: 'floral', shape: 'Stiletto',
      desc: 'Pink and burgundy polka dots with hand-sculpted 3D blossoms and soft French tips. Set of 10.' }),
    set(104, 'mocha-chrome', 'Mocha Chrome', 'chrome', 28, { badge: 'New', isNew: true, art: 'midnight', shape: 'Almond',
      desc: 'Rich chocolate with liquid silver chrome swirls and a tortoiseshell accent. Set of 10.' }),
    set(105, 'safari-butterfly', 'Safari Butterfly', 'animal', 30, { art: 'y2k', shape: 'Almond',
      desc: 'Leopard and zebra on a nude base, finished with gold chains and a butterfly charm. Set of 10.' }),
    set(106, 'tropic-wild', 'Tropic Wild', 'animal', 28, { badge: 'New', isNew: true, art: 'ombre', shape: 'Almond',
      desc: 'Leopard, zebra and painted hibiscus with bold orange and black tips. Set of 10.' }),
    set(107, 'rose-gold-swirl', 'Rose Gold Swirl', 'chrome', 30, { badge: 'Limited', art: 'rosegold', shape: 'Almond',
      desc: 'Blush pink with sculpted gold swirls, chrome lines and soft ombre. Set of 10.' }),
    set(108, 'scarlet-lily', 'Scarlet Lily', 'floral', 28, { art: 'gel', shape: 'Coffin',
      desc: 'Hand-painted red lilies, leopard and gold star charms on a pink coffin shape. Set of 10.' }),
    set(109, 'bow-and-cherry', 'Bow & Cherry', 'charms', 32, { badge: 'Bestseller', art: 'stickers', shape: 'Stiletto',
      desc: 'Sculpted 3D bows, cherries, a spider charm and cow print in pink and burgundy. Set of 10.' }),
    set(110, 'berry-leopard', 'Berry Leopard', 'animal', 28, { art: 'gel', shape: 'Stiletto',
      desc: 'Berry marble, pink leopard and zebra with a white chrome flower. Set of 10.' }),
    set(111, 'big-apple-eight', 'Big Apple Eight', 'charms', 32, { badge: 'New', isNew: true, art: 'y2k', shape: 'Almond',
      desc: 'Leopard, cherries, an NY charm, 8-ball art and gold chains. Set of 10.' }),
    set(112, 'orchid-tortoise', 'Orchid Tortoise', 'floral', 30, { art: 'floral', shape: 'Almond',
      desc: 'Sculpted orchids, magenta marble, tortoiseshell and leopard with gold charms. Set of 10.' }),

    // ─── nail charms (photos in images/nail-charms/) ───
    charm(201, 'silver-bow-charms', 'Silver Bow Charms', 'Silver-tone bows and ribbons, sorted in a 24-slot box.'),
    charm(202, 'bow-and-pearl-mix', 'Bow & Pearl Mix', '3D bows in cream, red, lilac, sky blue, pink and black, with pearls.'),
    charm(203, 'flower-garden-mix', 'Flower Garden Mix', 'Resin flowers in every colour: pastels, brights, black and white.'),
    charm(204, 'bunny-babes-mix', 'Bunny Babes Mix', 'Cute character charms in pink, lilac and black.'),
    charm(205, 'sweet-treats-mix', 'Sweet Treats Mix', 'Bears, puppies, strawberries and blooms in one mixed box.'),
    charm(206, 'cute-critters-mix', 'Cute Critters Mix', 'Bears, bunnies, berries and flowers in a compact mixed box.'),
    charm(207, 'gold-gem-charms', 'Gold & Gem Charms', 'Gold-tone charms set with emerald, sapphire and ruby-coloured stones.'),
    charm(208, 'kitty-flower-wheel', 'Kitty Flower Wheel', 'Character charms in pink, lilac and black, in a flower-shaped case.'),
    charm(209, 'pink-and-black-bows', 'Pink & Black Bows', 'Bows and flowers in blush pink, black and gold.'),
    charm(210, 'character-party-mix', 'Character Party Mix', 'A big mixed box of character charms in pastels and black.'),

    // ─── nail polish (photos in images/nail-polish/) ───
    polish(301, 'deep-merlot', 'Deep Merlot', 'A rich burgundy wine shade.'),
    polish(302, 'ballet-pink', 'Ballet Pink', 'A sheer, soft pink.'),
    polish(303, 'storm-blue', 'Storm Blue', 'A dusty blue-grey.'),
    polish(304, 'gold-leaf', 'Gold Leaf', 'A metallic gold.'),
    polish(305, 'emerald', 'Emerald', 'A deep jewel green.'),
    polish(306, 'blush-nude', 'Blush Nude', 'A warm pink nude.'),
    polish(307, 'slate', 'Slate', 'A cool denim grey.'),
    polish(308, 'rose-shimmer', 'Rose Shimmer', 'Pink with a soft shimmer.'),
    polish(309, 'candy-pink', 'Candy Pink', 'A bright bubblegum pink.'),
    polish(310, 'milky-sheer', 'Milky Sheer', 'A sheer milky white.'),
    polish(311, 'black-cherry', 'Black Cherry', 'A deep, dark cherry.'),
    polish(312, 'pink-glitter', 'Pink Glitter', 'Pink and red glitter.'),
    polish(313, 'mint', 'Mint', 'A fresh aqua mint.'),
    polish(314, 'pure-white', 'Pure White', 'A clean, opaque white.'),
    polish(315, 'hot-pink', 'Hot Pink', 'A loud, vivid pink.'),
    polish(316, 'peach-nude', 'Peach Nude', 'A soft peachy nude.'),
    polish(317, 'cherry-red', 'Cherry Red', 'A classic glossy red.'),
    polish(318, 'bronze', 'Bronze', 'A warm bronze shimmer.'),
    polish(319, 'jet-black', 'Jet Black', 'A glossy true black.'),
    polish(320, 'butter-yellow', 'Butter Yellow', 'A pastel butter yellow.'),
  ];

  // ─── TEST ITEM ─── a hidden $0.01 item (PayPal's smallest amount) for trying a real payment end to end.
  // It never shows in the shop: open it with shop.html?test=1. It ships free.
  // Delete this line once checkout is confirmed working.
  PRODUCTS.push({
    id: 999, slug: 'payment-test', name: 'Payment test', category: 'test', type: 'test', group: 'test', hidden: true, freeShip: true,
    price: 0.01, desc: 'A 1 cent item for testing checkout. Nothing is shipped.', sizes: ['Test'], optionLabel: 'Option', stars: 0,
    img: 'images/nail-polish/ballet-pink.webp', thumb: 'images/nail-polish/ballet-pink-sm.webp',
  });

  // ─── POLISH BRANDS ─── the bottle in each photo, and its price: a little under
  // the brand's usual US price (Chanel Le Vernis $34, Essie Gel Couture $12.99,
  // OPI and Olive & June about $12, Essie about $11, Sally Hansen $7-8).
  const BRAND = {
    chanel: ['Chanel Le Vernis', 30], essieGel: ['Essie Gel Couture', 11], essie: ['Essie', 9], opi: ['OPI', 10],
    oliveJune: ['Olive & June', 10], sallyGel: ['Sally Hansen Miracle Gel', 7], sally: ['Sally Hansen Insta-Dri', 6], bellavita: ['Bellavita', 7],
  };
  const POLISH_BRAND = {
    301: 'chanel', 302: 'sally', 303: 'oliveJune', 304: 'chanel', 305: 'essieGel', 307: 'essie', 308: 'essie',
    310: 'chanel', 311: 'chanel', 312: 'essie', 313: 'sallyGel', 314: 'chanel', 316: 'opi', 318: 'oliveJune', 319: 'bellavita', 320: 'opi',
  };
  PRODUCTS.forEach((p) => {
    const b = p.type === 'polish' && !p.soon && BRAND[POLISH_BRAND[p.id]];
    if (!b) return;
    p.brand = b[0];
    p.price = b[1];
    p.desc = `${b[0]}. ${p.desc}`;
  });

  // ─── BASKETS: bundles of press-ons, charms and polish at a bundle price ───
  // `tint` is the background colour of its photo; `has` lists the product ids inside. The price is worked out from them:
  // BASKET_SAVING off the separate prices, rounded down to end in 4 or 9.
  // The press-on size the customer picks applies to every set in the basket.
  const BASKET_SAVING = 0.15;
  const basket = (id, key, colour, tint, has) => {
    const items = has.map((i) => PRODUCTS.find((p) => p.id === i));
    const worth = items.reduce((t, p) => t + p.price, 0);
    const price = Math.floor((worth * (1 - BASKET_SAVING) + 1) / 5) * 5 - 1;
    const names = (type) => items.filter((p) => p.type === type).map((p) => p.name);
    const list = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0]);
    const slug = `${colour.toLowerCase()}-basket`;
    return {
      id, slug, name: `The ${colour} Basket`, category: 'baskets', type: 'basket', group: 'baskets', colour, tint, has,
      price, oldPrice: worth, badge: 'Bundle', sizes: SIZES, optionLabel: 'Size', stars: 0,
      desc: `${items.length} picks: ${list(names('set'))} press-ons, ${list(names('charm'))} ${names('charm').length > 1 ? 'charm boxes' : 'charm box'}, `
        + `and ${list(names('polish'))} polish. Pick your press-on size.`,
      cutout: `images/basket/basket-${key}.webp`,
      img: `images/basket/${slug}.webp`,
      thumb: `images/basket/${slug}-sm.webp`,
    };
  };
  PRODUCTS.push(
    basket(401, 'a', 'Pink', '#F7DCE5', [109, 103, 202, 209, 302, 309, 315]),
    basket(402, 'b', 'Cocoa', '#ECDDD1', [104, 102, 205, 306, 318]),
    basket(403, 'c', 'Emerald', '#DCE8DF', [112, 207, 203, 305, 304, 310]),
    basket(404, 'd', 'Slate', '#E0E4EA', [105, 201, 303, 307, 314]),
    basket(405, 'e', 'Cherry', '#F3D9D8', [108, 111, 208, 317, 311]),
    basket(406, 'f', 'Noir', '#E6E1E1', [104, 111, 209, 210, 319, 314]),
    basket(407, 'g', 'Merlot', '#EDD8DD', [101, 110, 202, 301, 311, 308]),
    basket(408, 'h', 'Butter', '#F6EED2', [107, 205, 203, 320, 316, 302]),
    basket(409, 'i', 'Olive', '#E7E7D5', [106, 105, 206, 318, 304]),
    basket(410, 'j', 'Toffee', '#F0E1D1', [102, 112, 204, 207, 316, 306, 318]),
  );

  // The nail sets on their own (the home-page scenes and "12 sets" copy use these).
  const SETS = PRODUCTS.filter((p) => p.type === 'set' && !p.soon);

  const BASKETS = PRODUCTS.filter((p) => p.type === 'basket');

  const CATEGORY_LABELS = {
    floral: 'Florals', animal: 'Animal Print', chrome: 'Chrome & Gold', charms: 'Charms & 3D',
    'nail-charms': 'Nail Charms', polish: 'Nail Polish', baskets: 'Baskets',
  };
  // The shop's four sections.
  const GROUP_LABELS = { 'press-ons': 'Press-Ons', 'nail-charms': 'Nail Charms', polish: 'Nail Polish', baskets: 'Baskets' };

  // Everything mixed together for "All": each section spread evenly through
  // the list, so press-ons, charms, polish and baskets alternate.
  const MIXED = (() => {
    const keyed = [];
    Object.keys(GROUP_LABELS).forEach((g, gi) => {
      const list = PRODUCTS.filter((p) => p.group === g && !p.soon);
      list.forEach((p, i) => keyed.push({ p, k: i / list.length + gi * 1e-3 }));
    });
    return keyed.sort((a, b) => a.k - b.k).map((x) => x.p).concat(PRODUCTS.filter((p) => p.soon));
  })();

  // ─── NAIL ART GENERATOR ───
  // Palette: Powder Pink #FCB5D0 · Dolphin #626283 · Artichoke #929073 · Pearl #E7E0C1
  const FINISHES = {
    classic:      { bg: ['#FDEEF3', '#F9CADC'], base: ['#FDC9DC', '#F094B9'] },
    gel:          { bg: ['#EDEDF4', '#CDCDDE'], base: ['#8B8BAE', '#4E4E6E'] },
    french:       { bg: ['#F8F5E8', '#E7E0C1'], base: ['#F8E4E8', '#EFCFD8'], tip: '#ffffff' },
    french2:      { bg: ['#F3F0E0', '#DED7B8'], base: ['#F1DDD3', '#E3C7BC'], tip: '#FFFDF6', thin: true },
    glazed:       { bg: ['#F8F5EA', '#E7E0C1'], base: ['#ffffff', '#EFEBDD'], pearl: true, shape: 'almond' },
    chrome:       { bg: ['#EEEEF5', '#D3D3E3'], chrome: ['#ffffff', '#C5C5DA', '#FCB5D0', '#ffffff', '#8A8AAE'] },
    midnight:     { bg: ['#4C4C69', '#23233A'], chrome: ['#3B3B58', '#D0D0E4', '#23233A', '#9494B9', '#30304A'], sparkle: '#FCB5D0' },
    y2k:          { bg: ['#F8F5E8', '#FCDCE8'], rainbow: true, leopard: true },
    'y2k-chrome': { bg: ['#EFEFF6', '#FCE2EC'], chrome: ['#E7E0C1', '#ffffff', '#FCB5D0', '#A6A6C4', '#F4F0E1'] },
    floral:       { bg: ['#FBF4EE', '#FCD8E6'], base: ['#FDE8F0', '#FBC6D9'], flowers: true, shape: 'almond' },
    lilac:        { bg: ['#F0F0F6', '#D7D7E7'], base: ['#C2C2DA', '#8E8EB2'], stickers: true },
    stickers:     { bg: ['#FBF1F4', '#FCCADD'], base: ['#ffffff', '#F7EEF1'], stickers: true },
    ombre:        { bg: ['#F8F6EC', '#F7DFE7'], ombre: ['#FBF8EE', '#F5A3C3'], shape: 'almond' },
    rosegold:     { bg: ['#F4F0E1', '#E2D8B4'], chrome: ['#F4D9D2', '#ffffff', '#D7B2A6', '#EFE3CF', '#B39486'], foil: true },
  };

  const RAINBOW = [['#FCB5D0', '#F08CB4'], ['#9A9ABB', '#626283'], ['#B8B696', '#929073'], ['#EFE9D1', '#D2C89D'], ['#FDD3E2', '#A6A6C4']];

  function rng(seed) {
    let s = 7;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function nailPath(shape, w, H) {
    if (shape === 'almond') {
      return `M${-w},0 C${-w},${-H * 0.62} ${-w * 0.38},${-H} 0,${-H} C${w * 0.38},${-H} ${w},${-H * 0.62} ${w},0 Q${w},20 0,20 Q${-w},20 ${-w},0Z`;
    }
    return `M${-w},0 L${-w * 0.8},${-H + 16} L${-w * 0.5},${-H} L${w * 0.5},${-H} L${w * 0.8},${-H + 16} L${w},0 Q${w},20 0,20 Q${-w},20 ${-w},0Z`;
  }

  function sparkle(x, y, r, fill, op) {
    const k = r * 0.22;
    const n = (v) => v.toFixed(1);
    return `<path d="M${n(x)},${n(y - r)} Q${n(x + k)},${n(y - k)} ${n(x + r)},${n(y)} Q${n(x + k)},${n(y + k)} ${n(x)},${n(y + r)} Q${n(x - k)},${n(y + k)} ${n(x - r)},${n(y)} Q${n(x - k)},${n(y - k)} ${n(x)},${n(y - r)}Z" fill="${fill}" opacity="${op}"/>`;
  }

  function heart(x, y, s, fill) {
    return `<path transform="translate(${x} ${y}) scale(${s})" d="M0,4 C-6,-3 -10,2 -6,6 L0,11 L6,6 C10,2 6,-3 0,4Z" fill="${fill}"/>`;
  }

  function buildSVG(key) {
    const f = FINISHES[key] || FINISHES.classic;
    const rand = rng(key);
    const shape = f.shape || 'coffin';
    const w = 25;
    const angles = [-30, -15, 0, 15, 30];
    const lengths = [138, 162, 178, 162, 138];
    const cx = 200, cy = 482, r = 212;
    let defs = '';
    let body = '';

    defs += `<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${f.bg[0]}"/><stop offset="1" stop-color="${f.bg[1]}"/></radialGradient>`;
    defs += `<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>`;
    defs += `<linearGradient id="gloss" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
    if (f.pearl) defs += `<linearGradient id="pearl" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffd1ea" stop-opacity=".55"/><stop offset=".5" stop-color="#d5ecff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;

    // Background + floating sparkles
    body += `<rect width="400" height="400" fill="url(#bg)"/>`;
    body += `<circle cx="200" cy="215" r="150" fill="#fff" opacity=".28"/>`;
    for (let i = 0; i < 9; i++) {
      const sx = 30 + rand() * 340, sy = 26 + rand() * 120 + (i % 3) * 80;
      body += sparkle(sx, sy, 4 + rand() * 9, f.sparkle || '#ffffff', (0.55 + rand() * 0.45).toFixed(2));
    }

    angles.forEach((deg, i) => {
      const H = lengths[i];
      const rad = (deg * Math.PI) / 180;
      const bx = cx + r * Math.sin(rad);
      const by = cy - r * Math.cos(rad);
      const d = nailPath(shape, w, H);
      const id = `n${i}`;
      defs += `<clipPath id="c${i}"><path d="${d}"/></clipPath>`;

      // Fill per finish
      let fill;
      if (f.chrome) {
        const c = f.chrome;
        const o = i * 0.07;
        defs += `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${c.map((col, k) => `<stop offset="${Math.min(1, k / (c.length - 1) + (k ? o : 0)).toFixed(2)}" stop-color="${col}"/>`).join('')}</linearGradient>`;
        fill = `url(#${id})`;
      } else if (f.rainbow) {
        const c = RAINBOW[i % RAINBOW.length];
        defs += `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>`;
        fill = `url(#${id})`;
      } else if (f.ombre) {
        defs += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.ombre[0]}"/><stop offset="1" stop-color="${f.ombre[1]}"/></linearGradient>`;
        fill = `url(#${id})`;
      } else {
        defs += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.base[0]}"/><stop offset="1" stop-color="${f.base[1]}"/></linearGradient>`;
        fill = `url(#${id})`;
      }

      let deco = '';
      if (f.tip) {
        if (f.thin) {
          deco += `<path d="M${-w - 4},${-H + H * 0.24} Q0,${-H + H * 0.1} ${w + 4},${-H + H * 0.24}" stroke="${f.tip}" stroke-width="5" fill="none"/>`;
        } else {
          deco += `<path d="M${-w - 4},${-H + H * 0.32} Q0,${-H + H * 0.12} ${w + 4},${-H + H * 0.32} L${w + 4},${-H - 4} L${-w - 4},${-H - 4}Z" fill="${f.tip}"/>`;
        }
      }
      if (f.leopard) {
        for (let s = 0; s < 7; s++) {
          const x = (rand() - 0.5) * w * 1.7, y = -H * (0.12 + rand() * 0.8);
          const rx = 4 + rand() * 4, ry = 3 + rand() * 3, rot = rand() * 180;
          deco += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})"><ellipse rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="#23233A" opacity=".85"/><ellipse rx="${(rx * 0.5).toFixed(1)}" ry="${(ry * 0.45).toFixed(1)}" fill="#FCB5D0"/></g>`;
        }
      }
      if (f.flowers) {
        for (let s = 0; s < 2; s++) {
          const x = (rand() - 0.5) * w * 1.1, y = -H * (0.3 + s * 0.35 + rand() * 0.1);
          let petals = '';
          for (let p = 0; p < 5; p++) {
            const a = (p * 72 * Math.PI) / 180;
            petals += `<circle cx="${(Math.cos(a) * 5).toFixed(1)}" cy="${(Math.sin(a) * 5).toFixed(1)}" r="4.4" fill="#fff"/>`;
          }
          deco += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${petals}<circle r="2.8" fill="#D9CC94"/></g>`;
        }
      }
      if (f.stickers) {
        const col = key === 'lilac' ? '#ffffff' : '#F08CB4';
        deco += heart(0, -H * 0.55, 1.15, col);
        deco += sparkle(-w * 0.35, -H * 0.82, 5, col, 0.95);
        deco += sparkle(w * 0.4, -H * 0.3, 4, col, 0.9);
      }
      if (f.foil) {
        for (let s = 0; s < 6; s++) {
          const x = (rand() - 0.5) * w * 1.6, y = -H * (0.1 + rand() * 0.8);
          deco += `<path d="M${x.toFixed(1)},${y.toFixed(1)} l${(3 + rand() * 5).toFixed(1)},${(-2 - rand() * 3).toFixed(1)} l${(1 + rand() * 3).toFixed(1)},${(4 + rand() * 4).toFixed(1)}Z" fill="#FBF9F1" opacity=".9"/>`;
        }
      }
      if (f.pearl) deco += `<rect x="${-w - 4}" y="${-H - 4}" width="${2 * w + 8}" height="${H + 28}" fill="url(#pearl)"/>`;

      body += `<g transform="translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${deg})">`;
      body += `<path d="${d}" fill="#23233A" opacity=".2" transform="translate(5 12)" filter="url(#sh)"/>`;
      body += `<path d="${d}" fill="${fill}"/>`;
      body += `<g clip-path="url(#c${i})">${deco}<rect x="${-w * 0.75}" y="${-H}" width="${w * 0.5}" height="${H}" fill="url(#gloss)" opacity=".8"/></g>`;
      body += `<path d="M${-w * 0.42},${-H * 0.2} L${-w * 0.34},${-H * 0.72}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;
      body += `<circle cx="${w * 0.2}" cy="${-H * 0.84}" r="2.6" fill="#fff" opacity=".7"/>`;
      body += `</g>`;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;
  }

  const cache = {};
  function nailArt(key) {
    if (!cache[key]) cache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(buildSVG(key));
    return cache[key];
  }

  const api = { PRODUCTS, SETS, BASKETS, MIXED, CATEGORY_LABELS, GROUP_LABELS, nailArt, FINISHES };
  // The same file feeds the checkout server (api/), so prices only live here.
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SHANAYA = api;
})(this);
