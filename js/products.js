/* ═══════════════════════════════════════════════════════
   NAILS BY SHANAYA — catalog + nail-art illustrations
   Each product's photo lives in images/products/<slug>.webp
   (with a -sm.webp thumbnail and a .jpg copy for Pinterest).
═══════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  // ─── CATALOG ───  (prices here are what the checkout server charges)
  const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  const set = (id, slug, name, category, price, extra) => Object.assign({
    id, slug, name, category, price, sizes: SIZES, stars: 5,
    img: `images/products/${slug}.webp`,
    thumb: `images/products/${slug}-sm.webp`,
  }, extra);

  const PRODUCTS = [
    set(101, 'merlot-garden', 'Merlot Garden', 'floral', 38, { badge: 'Bestseller', art: 'rosegold', shape: 'Stiletto',
      desc: 'Burgundy marble, sculpted pink blossoms, a touch of leopard and gold charms. Set of 10 stiletto nails.' }),
    set(102, 'downtown-charm', 'Downtown Charm', 'charms', 36, { badge: 'New', isNew: true, art: 'y2k', shape: 'Almond',
      desc: 'Nude French tips with cocoa stars, cherries, an NY charm and leopard and zebra accents. Set of 10.' }),
    set(103, 'polka-blossom', 'Polka Blossom', 'floral', 34, { art: 'floral', shape: 'Stiletto',
      desc: 'Pink and burgundy polka dots with hand-sculpted 3D blossoms and soft French tips. Set of 10.' }),
    set(104, 'mocha-chrome', 'Mocha Chrome', 'chrome', 34, { badge: 'New', isNew: true, art: 'midnight', shape: 'Almond',
      desc: 'Rich chocolate with liquid silver chrome swirls and a tortoiseshell accent. Set of 10.' }),
    set(105, 'safari-butterfly', 'Safari Butterfly', 'animal', 36, { art: 'y2k', shape: 'Almond',
      desc: 'Leopard and zebra on a nude base, finished with gold chains and a butterfly charm. Set of 10.' }),
    set(106, 'tropic-wild', 'Tropic Wild', 'animal', 34, { badge: 'New', isNew: true, art: 'ombre', shape: 'Almond',
      desc: 'Leopard, zebra and painted hibiscus with bold orange and black tips. Set of 10.' }),
    set(107, 'rose-gold-swirl', 'Rose Gold Swirl', 'chrome', 36, { badge: 'Limited', art: 'rosegold', shape: 'Almond',
      desc: 'Blush pink with sculpted gold swirls, chrome lines and soft ombre. Set of 10.' }),
    set(108, 'scarlet-lily', 'Scarlet Lily', 'floral', 34, { art: 'gel', shape: 'Coffin',
      desc: 'Hand-painted red lilies, leopard and gold star charms on a pink coffin shape. Set of 10.' }),
    set(109, 'bow-and-cherry', 'Bow & Cherry', 'charms', 38, { badge: 'Bestseller', art: 'stickers', shape: 'Stiletto',
      desc: 'Sculpted 3D bows, cherries, a spider charm and cow print in pink and burgundy. Set of 10.' }),
    set(110, 'berry-leopard', 'Berry Leopard', 'animal', 34, { art: 'gel', shape: 'Stiletto',
      desc: 'Berry marble, pink leopard and zebra with a white chrome flower. Set of 10.' }),
    set(111, 'big-apple-eight', 'Big Apple Eight', 'charms', 38, { badge: 'New', isNew: true, art: 'y2k', shape: 'Almond',
      desc: 'Leopard, cherries, an NY charm, 8-ball art and gold chains. Set of 10.' }),
    set(112, 'orchid-tortoise', 'Orchid Tortoise', 'floral', 36, { art: 'floral', shape: 'Almond',
      desc: 'Sculpted orchids, magenta marble, tortoiseshell and leopard with gold charms. Set of 10.' }),
  ];

  const CATEGORY_LABELS = {
    floral: 'Florals', animal: 'Animal Print', chrome: 'Chrome & Gold', charms: 'Charms & 3D',
  };

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

  const api = { PRODUCTS, CATEGORY_LABELS, nailArt, FINISHES };
  // The same file feeds the checkout server (api/), so prices only live here.
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SHANAYA = api;
})(this);
