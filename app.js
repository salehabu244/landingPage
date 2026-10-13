/* ============================================================
   📚 Book Bouquets | 🎀 Custom Gifts
   The bouquet renderer and the counter.
   ============================================================ */

'use strict';

/* ── 1. Everything the shop can edit lives here ───────────── */

const CONFIG = {
  currency: 'USD',
  locale: 'en-US',
  shopName: 'Book Bouquets',
  // Replace with the shop's Facebook page URL.
  facebookUrl: 'https://www.facebook.com/',
  leadTime: '3 days',
  contact: {
    // Where the emailed orders arrive.
    email: 'fazlamijotosob@gmail.com',
    // WhatsApp wants the country code with no leading zero or plus:
    // 01701008038 becomes 8801701008038.
    whatsapp: '8801701008038',
    whatsappLabel: '+880 1701 008038',
    // Optional. Paste a Web3Forms access key (free at web3forms.com) and every
    // order is emailed to you quietly in the background. Leave it empty and the
    // email button hands the order to the customer's own mail app instead.
    web3formsKey: ''
  },
  prices: {
    wrap:      { kraft: 12, blush: 14, ivory: 14, sage: 14, charcoal: 16 },
    book:      9,
    bloom:     2.5,
    ribbon:    { satin: 0, velvet: 4, twine: 0, none: 0 },
    extras:    { card: 4, lights: 6, lavender: 5, chocolate: 8 }
  },
  limits: { books: [0, 8], flowers: [0, 24] }
};

function defaultState() {
  return {
    books: 3,
    flowers: 7,
    wrap: 'kraft',
    ribbon: 'satin',
    bloom: 'rose',
    theme: 'Romance',
    extras: [],
    note: ''
  };
}

/* ── 2. Palette for the drawing ───────────────────────────── */

const WRAPS = {
  kraft:    { face: 'oklch(84% 0.05 74)',  shade: 'oklch(70% 0.07 66)',  lip: 'oklch(88% 0.045 76)' },
  blush:    { face: 'oklch(92% 0.04 15)',  shade: 'oklch(82% 0.06 12)',  lip: 'oklch(95% 0.03 15)' },
  ivory:    { face: 'oklch(96.5% 0.014 85)', shade: 'oklch(87% 0.022 80)', lip: 'oklch(98.5% 0.01 85)' },
  sage:     { face: 'oklch(86% 0.04 148)', shade: 'oklch(72% 0.055 148)', lip: 'oklch(90% 0.035 148)' },
  charcoal: { face: 'oklch(45% 0.012 60)', shade: 'oklch(33% 0.012 60)', lip: 'oklch(52% 0.012 60)' }
};

const BLOOMS = {
  rose:       { petal: 'oklch(78% 0.095 8)',  edge: 'oklch(70% 0.12 4)',   core: 'oklch(56% 0.13 18)' },
  ivory:      { petal: 'oklch(96% 0.014 85)', edge: 'oklch(89% 0.03 80)',  core: 'oklch(80% 0.055 78)' },
  terracotta: { petal: 'oklch(70% 0.13 45)',  edge: 'oklch(61% 0.14 42)',  core: 'oklch(50% 0.12 40)' },
  lilac:      { petal: 'oklch(80% 0.075 305)',edge: 'oklch(71% 0.095 302)',core: 'oklch(58% 0.11 300)' },
  sunflower:  { petal: 'oklch(85% 0.145 90)', edge: 'oklch(78% 0.15 85)',  core: 'oklch(48% 0.09 55)' }
};

const BOOKS_PALETTE = [
  { body: 'oklch(40% 0.06 155)',   spine: 'oklch(31% 0.055 155)', title: 'oklch(82% 0.05 150)' },
  { body: 'oklch(38% 0.07 258)',   spine: 'oklch(29% 0.065 258)', title: 'oklch(84% 0.04 250)' },
  { body: 'oklch(42% 0.115 15)',   spine: 'oklch(33% 0.10 15)',   title: 'oklch(86% 0.06 20)'  },
  { body: 'oklch(76% 0.12 85)',    spine: 'oklch(66% 0.12 80)',   title: 'oklch(40% 0.06 75)'  },
  { body: 'oklch(43% 0.09 322)',   spine: 'oklch(34% 0.08 322)',  title: 'oklch(85% 0.05 320)' },
  { body: 'oklch(37% 0.012 60)',   spine: 'oklch(28% 0.012 60)',  title: 'oklch(80% 0.01 60)'  },
  { body: 'oklch(47% 0.06 202)',   spine: 'oklch(38% 0.058 202)', title: 'oklch(84% 0.04 200)' },
  { body: 'oklch(91% 0.02 85)',    spine: 'oklch(83% 0.03 82)',   title: 'oklch(45% 0.03 70)'  }
];

const RIBBONS = {
  satin:  { main: 'oklch(46% 0.15 12)',  shade: 'oklch(36% 0.13 12)'  },
  velvet: { main: 'oklch(40% 0.14 8)',   shade: 'oklch(30% 0.12 8)'   },
  twine:  { main: 'oklch(72% 0.06 72)',  shade: 'oklch(62% 0.07 70)'  }
};

const SAGE = 'oklch(58% 0.075 148)';
const SAGE_DARK = 'oklch(48% 0.07 150)';

/* ── 3. Geometry ──────────────────────────────────────────── */

const VIEW = { w: 460, h: 470 };
const CX = 230;
const TIE_Y = 300;          // where the fan of books meets the paper
const WRAP_TOP = 258;
const WRAP_BOTTOM = 448;
const BOOK = { w: 50, h: 200 };

const RAD = Math.PI / 180;

function qpoint(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
  };
}

function bloomShape(cx, cy, r, colors, seed) {
  let petals = '';
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 + seed) * RAD;
    const px = cx + Math.cos(a) * r * 0.6;
    const py = cy + Math.sin(a) * r * 0.6;
    petals += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(r * 0.52).toFixed(1)}" fill="${colors.petal}" stroke="${colors.edge}" stroke-width="0.8"/>`;
  }
  return `<g>${petals}<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.36).toFixed(1)}" fill="${colors.core}"/></g>`;
}

function bookShape(i) {
  const c = BOOKS_PALETTE[i % BOOKS_PALETTE.length];
  const { w, h } = BOOK;
  return `
    <rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="3" fill="${c.body}"/>
    <rect x="${w / 2 - 8}" y="${-h + 4}" width="6" height="${h - 8}" rx="2" fill="oklch(94% 0.02 85)" opacity="0.75"/>
    <rect x="${-w / 2}" y="${-h}" width="10" height="${h}" rx="3" fill="${c.spine}"/>
    <rect x="${-w / 2 + 16}" y="${-h + 26}" width="${w * 0.46}" height="4" rx="2" fill="${c.title}"/>
    <rect x="${-w / 2 + 16}" y="${-h + 38}" width="${w * 0.3}" height="4" rx="2" fill="${c.title}" opacity="0.65"/>
    <rect x="${-w / 2 + 16}" y="${-h + 96}" width="${w * 0.24}" height="3" rx="1.5" fill="${c.title}" opacity="0.4"/>`;
}

/* ── 4. The renderer ──────────────────────────────────────── */

function renderBouquet(s, opts) {
  const o = opts || {};
  const wrap = WRAPS[s.wrap] || WRAPS.kraft;
  const bloomColors = BLOOMS[s.bloom] || BLOOMS.rose;
  const nBooks = clamp(s.books, CONFIG.limits.books[0], CONFIG.limits.books[1]);
  const nBlooms = clamp(s.flowers, CONFIG.limits.flowers[0], CONFIG.limits.flowers[1]);

  const parts = [];

  /* ground shadow */
  parts.push(`<ellipse cx="${CX}" cy="${WRAP_BOTTOM + 10}" rx="112" ry="11" fill="oklch(30% 0.03 60)" opacity="0.07"/>`);

  /* Bloom anchor points. The radius pulls in whenever the ring
     would otherwise crowd or clip the top or sides of the frame. */
  const bloomR = clamp(30 - nBlooms * 0.42, 17, 29);
  const petalReach = bloomR * 1.12;
  const PAD = 22;
  const bloomsAt = [];
  if (nBlooms > 0) {
    const spread = nBlooms <= 6 ? 42 : nBlooms <= 14 ? 48 : 50;
    for (let i = 0; i < nBlooms; i++) {
      const t = nBlooms === 1 ? 0.5 : i / (nBlooms - 1);
      const a = (-spread + 2 * spread * t) * RAD;
      const sin = Math.sin(a);
      const cos = Math.cos(a);
      const wanted = 250 + (i % 2) * 26;
      const sideRoom = sin === 0 ? Infinity : (VIEW.w - PAD - CX - petalReach) / Math.abs(sin);
      const topRoom = cos <= 0 ? Infinity : (TIE_Y - PAD - petalReach) / (0.94 * cos);
      const radius = Math.min(wanted, sideRoom, topRoom);
      bloomsAt.push({
        x: CX + sin * radius,
        y: TIE_Y - cos * radius * 0.94,
        seed: (i % 6) * 11
      });
    }
  }

  /* stems and foliage, behind the paper */
  if (nBlooms > 0) {
    let stems = '';
    bloomsAt.forEach((b, i) => {
      const p0 = { x: CX, y: TIE_Y + 6 };
      const p2 = { x: b.x, y: b.y };
      const p1 = { x: CX + (b.x - CX) * 0.3, y: TIE_Y - (TIE_Y - b.y) * 0.52 };
      stems += `<path d="M${p0.x} ${p0.y} Q${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}" fill="none" stroke="${SAGE_DARK}" stroke-width="${nBlooms > 16 ? 1.6 : 2.2}" stroke-linecap="round" opacity="0.85"/>`;

      const leafT = 0.42 + (i % 3) * 0.13;
      const lp = qpoint(p0, p1, p2, leafT);
      const lp2 = qpoint(p0, p1, p2, Math.min(0.99, leafT + 0.04));
      const ang = Math.atan2(lp2.y - lp.y, lp2.x - lp.x) / RAD;
      const side = i % 2 === 0 ? 1 : -1;
      const leafW = nBlooms > 16 ? 16 : 20;
      stems += `<ellipse cx="${lp.x.toFixed(1)}" cy="${lp.y.toFixed(1)}" rx="${leafW}" ry="${(leafW * 0.42).toFixed(1)}" fill="${SAGE}" opacity="0.92" transform="rotate(${(ang + side * 34).toFixed(1)} ${lp.x.toFixed(1)} ${lp.y.toFixed(1)})"/>`;
    });
    parts.push(`<g data-layer="stems">${stems}</g>`);
  }

  /* books, fanning from the tie point, widest drawn first */
  if (nBooks > 0) {
    const spread = nBooks <= 2 ? 13 : nBooks <= 4 ? 26 : 34;
    const list = [];
    for (let i = 0; i < nBooks; i++) {
      const t = nBooks === 1 ? 0.5 : i / (nBooks - 1);
      const angle = -spread + 2 * spread * t;
      list.push({ i, angle });
    }
    list.sort((a, b) => Math.abs(b.angle) - Math.abs(a.angle));
    let books = '';
    list.forEach((item) => {
      const isNewest = o.popBooks && item.i === nBooks - 1;
      books += `<g transform="translate(${CX} ${TIE_Y}) rotate(${item.angle.toFixed(2)})"><g class="${isNewest ? 'pop' : ''}">${bookShape(item.i)}</g></g>`;
    });
    parts.push(`<g data-layer="books">${books}</g>`);
  }

  /* blooms, on top of the fan */
  if (nBlooms > 0) {
    let blooms = '';
    bloomsAt.forEach((b, i) => {
      const isNewest = o.popFlowers && i === nBlooms - 1;
      blooms += `<g class="${isNewest ? 'pop bloom' : ''}">${bloomShape(b.x, b.y, bloomR, bloomColors, b.seed)}</g>`;
    });
    parts.push(`<g data-layer="blooms">${blooms}</g>`);
  }

  /* dried lavender tucked along the arc */
  if (s.extras.includes('lavender')) {
    let lav = '';
    for (let i = 0; i < 5; i++) {
      const a = (-40 + i * 20) * RAD;
      const r = 232 + (i % 2) * 18;
      const bx = CX + Math.sin(a) * r;
      const by = TIE_Y - Math.cos(a) * r * 0.94 - 26;
      lav += `<g><path d="M${CX} ${TIE_Y} Q${(CX + (bx - CX) * 0.3).toFixed(1)} ${(TIE_Y - 90).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}" fill="none" stroke="${SAGE_DARK}" stroke-width="1.4" opacity="0.7"/>`;
      for (let k = 0; k < 6; k++) {
        lav += `<circle cx="${(bx + (k % 2 ? 3 : -3)).toFixed(1)}" cy="${(by + k * 5).toFixed(1)}" r="3.2" fill="oklch(58% 0.09 300)" opacity="0.85"/>`;
      }
      lav += `</g>`;
    }
    parts.push(`<g data-layer="lavender" opacity="0.95">${lav}</g>`);
  }

  /* the paper */
  parts.push(`
    <path d="M74 ${WRAP_TOP}
      C142 ${WRAP_TOP - 12} 318 ${WRAP_TOP - 12} 386 ${WRAP_TOP}
      C374 336 352 398 306 ${WRAP_BOTTOM}
      Q230 ${WRAP_BOTTOM + 8} 154 ${WRAP_BOTTOM}
      C108 398 86 336 74 ${WRAP_TOP} Z" fill="${wrap.face}"/>
    <path d="M74 ${WRAP_TOP} C108 340 132 400 154 ${WRAP_BOTTOM} L232 ${WRAP_BOTTOM}
      C222 386 214 316 212 ${WRAP_TOP - 4} Z" fill="${wrap.shade}" opacity="0.28"/>
    <path d="M386 ${WRAP_TOP} C352 340 330 400 306 ${WRAP_BOTTOM} L230 ${WRAP_BOTTOM}
      C240 386 248 316 250 ${WRAP_TOP - 4} Z" fill="${wrap.shade}" opacity="0.16"/>
    <path d="M74 ${WRAP_TOP} C142 ${WRAP_TOP - 12} 318 ${WRAP_TOP - 12} 386 ${WRAP_TOP}"
      fill="none" stroke="${wrap.lip}" stroke-width="5" stroke-linecap="round"/>`);

  /* fairy lights strung across the paper */
  if (s.extras.includes('lights')) {
    let lights = '';
    for (let i = 0; i <= 13; i++) {
      const t = i / 13;
      const x = 96 + t * 268;
      const y = WRAP_TOP + 46 + Math.sin(t * Math.PI) * 74;
      lights += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="oklch(85% 0.14 88)" opacity="0.28"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="oklch(93% 0.13 92)"/>`;
    }
    parts.push(`<g data-layer="lights">${lights}</g>`);
  }

  /* ribbon band and bow */
  if (s.ribbon !== 'none' && RIBBONS[s.ribbon]) {
    const rb = RIBBONS[s.ribbon];
    const y1 = 352, y2 = 378;
    const w1 = 118, w2 = 128;
    parts.push(`
      <path d="M${CX - w1} ${y1} L${CX + w1} ${y1} L${CX + w2} ${y2} L${CX - w2} ${y2} Z" fill="${rb.main}"/>
      <path d="M${CX - w1} ${y1} L${CX + w1} ${y1} L${CX + w1} ${y1 + 7} L${CX - w1} ${y1 + 7} Z" fill="${rb.shade}" opacity="0.5"/>
      <g transform="translate(${CX} ${y1})">
        <ellipse cx="-30" cy="-4" rx="30" ry="19" fill="${rb.main}" transform="rotate(-14)"/>
        <ellipse cx="-30" cy="-4" rx="16" ry="9" fill="${rb.shade}" opacity="0.45" transform="rotate(-14)"/>
        <ellipse cx="30" cy="-4" rx="30" ry="19" fill="${rb.main}" transform="rotate(14)"/>
        <ellipse cx="30" cy="-4" rx="16" ry="9" fill="${rb.shade}" opacity="0.45" transform="rotate(14)"/>
        <circle cx="0" cy="0" r="11" fill="${rb.main}" stroke="${rb.shade}" stroke-width="1.5"/>
      </g>`);
  }

  /* a card tucked behind the ribbon */
  if (s.extras.includes('card')) {
    parts.push(`<g transform="translate(150 344) rotate(-9)">
      <rect x="-38" y="-52" width="76" height="104" rx="4" fill="oklch(97% 0.014 85)" stroke="oklch(86% 0.02 80)"/>
      <rect x="-26" y="-38" width="52" height="3" rx="1.5" fill="oklch(70% 0.03 70)"/>
      <rect x="-26" y="-28" width="40" height="3" rx="1.5" fill="oklch(78% 0.025 70)"/>
      <rect x="-26" y="-18" width="46" height="3" rx="1.5" fill="oklch(78% 0.025 70)"/>
    </g>`);
  }

  /* hang tag, the shop's signature */
  if (o.tag) {
    const label = [
      `${nBooks} ${nBooks === 1 ? 'book' : 'books'}`,
      `${nBlooms} ${nBlooms === 1 ? 'bloom' : 'blooms'}`
    ];
    parts.push(`<g>
      <path d="M244 350 Q286 342 306 336" fill="none" stroke="${s.ribbon !== 'none' && RIBBONS[s.ribbon] ? RIBBONS[s.ribbon].shade : 'oklch(60% 0.03 70)'}" stroke-width="1.6"/>
      <g transform="translate(352 340) rotate(9)">
        <rect x="-48" y="-30" width="96" height="60" rx="5" fill="oklch(97% 0.014 85)" stroke="oklch(85% 0.02 80)"/>
        <rect x="-50" y="-31" width="5" height="62" rx="2.5" fill="oklch(46% 0.15 12)"/>
        <circle cx="-40" cy="-20" r="3" fill="oklch(85% 0.02 80)"/>
        <text x="6" y="-5" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="10" fill="oklch(30% 0.02 55)">${label[0]}</text>
        <text x="6" y="11" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="10" fill="oklch(46% 0.15 12)">${label[1]}</text>
      </g>
    </g>`);
  }

  return parts.join('\n');
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ── 5. Money and the bill ────────────────────────────────── */

const money = new Intl.NumberFormat(CONFIG.locale, {
  style: 'currency', currency: CONFIG.currency
});
const fmt = (n) => money.format(Math.round(n * 100) / 100);

const WRAP_NAMES = { kraft: 'Kraft', blush: 'Blush', ivory: 'Ivory', sage: 'Sage', charcoal: 'Charcoal' };
const RIBBON_NAMES = { satin: 'Satin', velvet: 'Velvet', twine: 'Twine', none: 'No ribbon' };
const BLOOM_NAMES = { rose: 'dusty rose', ivory: 'ivory', terracotta: 'terracotta', lilac: 'lilac', sunflower: 'sunflower' };
const EXTRA_NAMES = { card: 'Handwritten card', lights: 'Fairy lights', lavender: 'Dried lavender', chocolate: 'Chocolate box' };

function priceOf(s) {
  const p = CONFIG.prices;
  const books = s.books * p.book;
  const blooms = s.flowers * p.bloom;
  const wrap = p.wrap[s.wrap] || 0;
  const ribbon = p.ribbon[s.ribbon] || 0;
  const extras = s.extras.reduce((sum, key) => sum + (p.extras[key] || 0), 0);
  return { books, blooms, wrap, ribbon, extras, total: books + blooms + wrap + ribbon + extras };
}

function billLines(s) {
  const p = CONFIG.prices;
  if (s.books === 0 && s.flowers === 0) return [['Nothing selected yet', '—']];
  const lines = [];
  if (s.books > 0) lines.push([`${s.books} ${s.books === 1 ? 'book' : 'books'} · ${s.theme}`, fmt(s.books * p.book)]);
  if (s.flowers > 0) lines.push([`${s.flowers} ${s.flowers === 1 ? 'bloom' : 'blooms'} · ${BLOOM_NAMES[s.bloom]}`, fmt(s.flowers * p.bloom)]);
  lines.push([`${WRAP_NAMES[s.wrap]} paper`, fmt(p.wrap[s.wrap] || 0)]);
  if (s.ribbon !== 'none') lines.push([`${RIBBON_NAMES[s.ribbon]} ribbon`, p.ribbon[s.ribbon] ? fmt(p.ribbon[s.ribbon]) : 'Included']);
  s.extras.forEach((key) => lines.push([EXTRA_NAMES[key], fmt(p.extras[key] || 0)]));
  return lines;
}

function orderText(s, customer) {
  const price = priceOf(s);
  const who = customer || { name: '', phone: '', email: '' };
  const out = [`${CONFIG.shopName} · new order`, ''];

  if (who.name) out.push(`Name: ${who.name}`);
  if (who.phone) out.push(`WhatsApp: ${who.phone}`);
  if (who.email) out.push(`Email: ${who.email}`);
  if (who.name || who.phone || who.email) out.push('');

  out.push(
    `Reads: ${s.theme}`,
    `Books: ${s.books}`,
    `Blooms: ${s.flowers} (${BLOOM_NAMES[s.bloom]})`,
    `Paper: ${WRAP_NAMES[s.wrap]}`,
    `Ribbon: ${RIBBON_NAMES[s.ribbon]}`,
    `Extras: ${s.extras.length ? s.extras.map((k) => EXTRA_NAMES[k]).join(', ') : 'none'}`
  );
  if (s.note.trim()) out.push(`Card message: "${s.note.trim()}"`);
  out.push('', `Estimated total: ${fmt(price.total)}`);
  return out.join('\n');
}

/* ── 6. State ─────────────────────────────────────────────── */

let state = defaultState();
let previousCounts = { books: state.books, flowers: state.flowers };
let toastTimer = null;

function limitsFor(field) { return CONFIG.limits[field]; }

function adjustCount(field, delta) {
  const [min, max] = limitsFor(field);
  const next = clamp(state[field] + delta, min, max);
  if (next === state[field]) return;
  previousCounts[field] = state[field];
  state[field] = next;
  update({ animateCount: true, field });
}

function selectValue(field, value) {
  state[field] = value;
  update({});
}

function update(opts) {
  const o = opts || {};
  const grew = {
    books: o.animateCount && state.books > previousCounts.books,
    flowers: o.animateCount && state.flowers > previousCounts.flowers
  };

  drawPreview({ popBooks: grew.books, popFlowers: grew.flowers });
  syncControls();
  renderBill();
  refreshOrderLinks();
  previousCounts = { books: state.books, flowers: state.flowers };
}

function withA11y(title, desc, inner) {
  return `<title id="${title.id}">${esc(title.text)}</title>` +
    `<desc id="${desc.id}">${esc(desc.text)}</desc>` + inner;
}

function drawPreview(opts) {
  const svg = document.getElementById('preview-bouquet');
  const empty = document.getElementById('preview-empty');
  const isEmpty = state.books === 0 && state.flowers === 0;

  const desc = isEmpty
    ? 'An empty sheet of paper waiting for books and blooms.'
    : `${state.books} ${state.books === 1 ? 'book' : 'books'} and ${state.flowers} ${state.flowers === 1 ? 'bloom' : 'blooms'} in ${WRAP_NAMES[state.wrap]} paper with a ${RIBBON_NAMES[state.ribbon]} ribbon.`;

  svg.innerHTML = withA11y(
    { id: 'preview-bouquet-title', text: 'Your bouquet' },
    { id: 'preview-bouquet-desc', text: desc },
    renderBouquet(state, Object.assign({ tag: true }, opts))
  );

  empty.hidden = !isEmpty;

  document.getElementById('preview-spec').textContent = isEmpty
    ? 'Nothing wrapped yet'
    : `${state.books} ${state.books === 1 ? 'book' : 'books'} · ${state.flowers} ${state.flowers === 1 ? 'bloom' : 'blooms'} · ${WRAP_NAMES[state.wrap]} paper · ${RIBBON_NAMES[state.ribbon]} ribbon`;
}

/* ── 7. Controls ──────────────────────────────────────────── */

function syncControls() {
  ['books', 'flowers'].forEach((field) => {
    const [min, max] = limitsFor(field);
    const value = state[field];
    document.getElementById(field === 'books' ? 'books-value' : 'flowers-value').textContent = value;
    document.querySelectorAll(`[data-count="${field}"]`).forEach((btn) => {
      const step = Number(btn.dataset.step);
      const dead = (step < 0 && value <= min) || (step > 0 && value >= max);
      btn.disabled = dead;
    });
  });

  document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((input) => {
    if (input.name === 'extras') {
      input.checked = state.extras.includes(input.value);
    } else {
      input.checked = state[input.name] === input.value;
    }
  });

  const noteField = document.getElementById('note-field');
  const wantsCard = state.extras.includes('card');
  noteField.hidden = !wantsCard;

  countMessage();
  noteMessage();
}

function countMessage() {
  const msg = document.getElementById('count-msg');
  const bMax = limitsFor('books')[1];
  const fMax = limitsFor('flowers')[1];
  let text = '';
  if (state.books === bMax) text = `${bMax} books is the widest fan the paper holds. Beyond that the wrap will not close.`;
  else if (state.flowers === fMax) text = `${fMax} blooms is as many as we can fit before the titles disappear.`;
  else if (state.flowers === 0 && state.books > 0) text = 'No blooms means a plain book bundle. Three or more helps the wrap hold its shape.';
  else if (state.flowers > 0 && state.flowers < 3) text = 'Fewer than three blooms leaves a lot of bare paper. It can work.';

  msg.hidden = !text;
  msg.textContent = text;
}

function noteMessage() {
  const note = document.getElementById('note');
  const meter = document.getElementById('note-meter');
  const msg = document.getElementById('note-msg');
  const len = note.value.length;
  meter.textContent = `${len} of 160 characters`;
  meter.dataset.near = len >= 130 && len < 160 ? 'true' : 'false';
  meter.dataset.max = len >= 160 ? 'true' : 'false';

  const error = state.extras.includes('card') && len > 0 && len < 4
    ? 'A card needs at least a few words. Otherwise leave it blank and we will write nothing.'
    : '';
  msg.hidden = !error;
  msg.textContent = error;
  return !error;
}

/* ── 8. The bill ──────────────────────────────────────────── */

function renderBill() {
  const ul = document.getElementById('line-items');
  ul.innerHTML = billLines(state).map(([label, value]) =>
    `<li class="line-item"><span>${esc(label)}</span><span>${esc(value)}</span></li>`
  ).join('');

  const isEmpty = state.books === 0 && state.flowers === 0;
  const totalEl = document.getElementById('total');
  const next = isEmpty ? fmt(0) : fmt(priceOf(state).total);
  if (totalEl.textContent !== next) {
    totalEl.textContent = next;
    totalEl.classList.remove('is-bumped');
    void totalEl.offsetWidth;
    totalEl.classList.add('is-bumped');
  }

  document.getElementById('total-note').textContent = isEmpty
    ? 'Add a book or a bloom and the estimate appears here.'
    : `Final price is confirmed on Facebook once we check what is in the flower market that week. Ready in ${CONFIG.leadTime}.`;
}

/* ── 9. Your details, and getting the order to the shop ───── */

const FIELDS = {
  name:  { input: 'customer-name',  err: 'customer-name-err'  },
  phone: { input: 'customer-phone', err: 'customer-phone-err' },
  email: { input: 'customer-email', err: 'customer-email-err' }
};

function readCustomer() {
  return {
    name:  document.getElementById('customer-name').value.trim(),
    phone: document.getElementById('customer-phone').value.trim(),
    email: document.getElementById('customer-email').value.trim()
  };
}

function setFieldError(key, message) {
  const field = FIELDS[key];
  const input = document.getElementById(field.input);
  const note = document.getElementById(field.err);
  note.textContent = message || '';
  note.hidden = !message;
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function customerProblems(who) {
  const problems = {};
  if (who.name.length < 2) problems.name = 'We need a name so we know who the order is for.';
  if (who.phone.replace(/\D/g, '').length < 8) {
    problems.phone = 'Add a number we can reach you on. Include the country code if you are outside the country.';
  }
  if (who.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(who.email)) {
    problems.email = 'That does not look like an email address. Leave it blank if you would rather not give one.';
  }
  return problems;
}

function setOrderStatus(kind, message) {
  const el = document.getElementById('order-status');
  el.classList.remove('is-ok', 'is-bad');
  el.hidden = !message;
  el.textContent = message || '';
  if (message) {
    el.classList.add(kind === 'ok' ? 'is-ok' : 'is-bad');
    el.setAttribute('role', kind === 'ok' ? 'status' : 'alert');
  }
}

/* The WhatsApp message follows the order as it is built. */
function refreshOrderLinks() {
  document.getElementById('order-whatsapp').href =
    `https://wa.me/${CONFIG.contact.whatsapp}?text=${encodeURIComponent(orderText(state, readCustomer()))}`;
}

/* Everything that must be true before an order can leave the page. */
function orderIssues() {
  const issues = [];
  if (state.books === 0 && state.flowers === 0) {
    issues.push({ key: 'counts', message: 'Nothing to order yet. Add a book or a bloom under Counts.' });
  }
  if (!noteMessage()) {
    issues.push({ key: 'note', message: 'Write the card message, or untick the handwritten card.' });
  }
  const problems = customerProblems(readCustomer());
  Object.keys(FIELDS).forEach((key) => {
    if (problems[key]) issues.push({ key, message: problems[key] });
  });
  return issues;
}

function guardOrder() {
  const problems = customerProblems(readCustomer());
  Object.keys(FIELDS).forEach((key) => setFieldError(key, problems[key]));

  const issues = orderIssues();
  if (!issues.length) {
    setOrderStatus(null, '');
    return true;
  }

  const first = issues[0];
  if (first.key === 'counts') {
    const msg = document.getElementById('count-msg');
    msg.hidden = false;
    msg.textContent = first.message;
  } else {
    document.getElementById(FIELDS[first.key].input).focus();
  }
  setOrderStatus('bad', first.message);
  toast('A couple of things still need filling in.');
  return false;
}

function onWhatsAppClick(event) {
  if (!guardOrder()) {
    event.preventDefault();
    return;
  }
  refreshOrderLinks();
  setOrderStatus('ok', `WhatsApp is opening with your order. Press send there and we will reply with the blooms we found.`);
}

function sendOrderEmail() {
  if (!guardOrder()) return;

  const who = readCustomer();
  const text = orderText(state, who);
  const button = document.getElementById('order-email');
  const key = CONFIG.contact.web3formsKey;

  if (!key) {
    /* No service configured, so hand the order to the customer's own mail app. */
    const a = document.createElement('a');
    a.href = `mailto:${CONFIG.contact.email}`
      + `?subject=${encodeURIComponent(`Book bouquet order from ${who.name}`)}`
      + `&body=${encodeURIComponent(text)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setOrderStatus('ok', `Your mail app is opening with the order addressed to ${CONFIG.contact.email}. Press send there.`);
    toast('Opening your mail app with the order filled in.');
    return;
  }

  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  const original = button.textContent;
  button.textContent = 'Sending the order';

  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: key,
      subject: `Book bouquet order from ${who.name}`,
      from_name: CONFIG.shopName,
      email: who.email || CONFIG.contact.email,
      message: text
    })
  })
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then((result) => {
      if (!result.ok || !result.data.success) {
        throw new Error(result.data.message || 'The send failed.');
      }
      setOrderStatus('ok', `Order sent to ${CONFIG.contact.email}. We will confirm the price and a delivery day shortly.`);
      toast('Order sent. We will be in touch.');
    })
    .catch(() => {
      setOrderStatus('bad', `The email did not send. Use WhatsApp above, or copy the summary and send it to ${CONFIG.contact.email}.`);
      toast('Email did not send. WhatsApp is the sure way to reach us.');
    })
    .finally(() => {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = original;
    });
}

function toast(text) {
  const el = document.getElementById('toast');
  document.getElementById('toast-text').textContent = text;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

function copyOrder() {
  const issues = orderIssues();
  if (issues.length) {
    setOrderStatus('bad', issues[0].message);
    toast('A couple of things still need filling in.');
    if (FIELDS[issues[0].key]) document.getElementById(FIELDS[issues[0].key].input).focus();
    else if (issues[0].key === 'counts') document.getElementById('builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const text = orderText(state, readCustomer());
  const done = () => {
    toast('Order summary copied. Paste it anywhere you like.');
    setOrderStatus('ok', 'Order summary copied.');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => legacyCopy(text, done));
  } else {
    legacyCopy(text, done);
  }
}

function legacyCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); }
  catch (_) { toast('Copy did not work. Select the total and copy it by hand.'); }
  document.body.removeChild(ta);
}

/* ── 10. Presets and the gallery ──────────────────────────── */

const PRESETS = [
  { name: 'Petite', books: 2, flowers: 5, wrap: 'blush', ribbon: 'satin', bloom: 'rose', theme: 'Romance',
    note: 'Two reads and a small ring of blooms. Good for a thank you.' },
  { name: 'Signature', books: 3, flowers: 7, wrap: 'kraft', ribbon: 'satin', bloom: 'rose', theme: 'Romance',
    note: 'The default. Three reads, seven blooms, kraft paper.', isDefault: true },
  { name: 'Grand', books: 5, flowers: 12, wrap: 'charcoal', ribbon: 'velvet', bloom: 'ivory', theme: 'Fantasy',
    note: 'Five reads, a full collar of blooms. For the big ones.' }
];

const GALLERY = [
  { name: 'Dusty rose on kraft', config: { books: 3, flowers: 7, wrap: 'kraft', ribbon: 'satin', bloom: 'rose', theme: 'Romance' } },
  { name: 'Ivory and gold for an anniversary', config: { books: 4, flowers: 9, wrap: 'ivory', ribbon: 'twine', bloom: 'ivory', theme: 'Romance' } },
  { name: 'Terracotta with poetry', config: { books: 2, flowers: 11, wrap: 'blush', ribbon: 'satin', bloom: 'terracotta', theme: 'Self-growth' } },
  { name: 'Lilac for a new baby', config: { books: 1, flowers: 9, wrap: 'sage', ribbon: 'twine', bloom: 'lilac', theme: "Children's" } },
  { name: 'Charcoal and velvet', config: { books: 5, flowers: 6, wrap: 'charcoal', ribbon: 'velvet', bloom: 'rose', theme: 'Mystery' } },
  { name: 'Sunflowers, thank you gift', config: { books: 3, flowers: 12, wrap: 'kraft', ribbon: 'satin', bloom: 'sunflower', theme: 'Fantasy' } }
];

function fullState(partial) {
  return Object.assign(defaultState(), partial, { extras: [], note: '' });
}

function renderPackages() {
  const list = document.getElementById('package-list');
  list.innerHTML = PRESETS.map((p, i) => {
    const s = fullState(p);
    const from = priceOf(s).total;
    return `<li class="package${p.isDefault ? ' is-default' : ''}">
      <div class="package-head">
        <h3 class="package-name">${esc(p.name)}</h3>
        ${p.isDefault ? '<span class="package-flag">Most ordered</span>' : `<span class="package-price">from ${esc(fmt(from))}</span>`}
      </div>
      <p class="package-counts"><b>${p.books}</b> books · <b>${p.flowers}</b> blooms</p>
      ${p.isDefault ? `<p class="package-price">from ${esc(fmt(from))}</p>` : ''}
      <p class="package-note">${esc(p.note)}</p>
      <button type="button" class="btn ${p.isDefault ? 'btn-primary' : 'btn-ghost'}" data-preset="${i}">Start from this</button>
    </li>`;
  }).join('');
}

function renderGallery() {
  const list = document.getElementById('gallery-list');
  list.innerHTML = GALLERY.map((item, i) => {
    const s = fullState(item.config);
    return `<li>
      <button type="button" class="gallery-card" data-gallery="${i}">
        <svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" aria-hidden="true" focusable="false">${renderBouquet(s, {})}</svg>
        <span class="gallery-meta">
          <span class="gallery-name">${esc(item.name)}</span>
          <span class="gallery-spec">${item.config.books} books · ${item.config.flowers} blooms · ${esc(WRAP_NAMES[item.config.wrap])} paper</span>
          <span class="gallery-pick">Load these counts</span>
        </span>
      </button>
    </li>`;
  }).join('');
}

function loadConfig(config) {
  state = fullState(config);
  previousCounts = { books: state.books, flowers: state.flowers };
  document.getElementById('note').value = '';
  update({});
  document.getElementById('builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('Counts loaded. Change anything you like.');
}

/* ── 11. Wiring ───────────────────────────────────────────── */

function init() {
  document.getElementById('hero-bouquet').innerHTML = withA11y(
    { id: 'hero-bouquet-title', text: 'Our default book bouquet' },
    { id: 'hero-bouquet-desc', text: 'Three books fanned inside kraft paper with seven dusty rose blooms and a ribbon bow.' },
    renderBouquet(defaultState(), { tag: true })
  );

  document.getElementById('messenger-link').href = CONFIG.facebookUrl;
  document.getElementById('foot-facebook').href = CONFIG.facebookUrl;
  document.getElementById('hero-from').textContent =
    fmt(Math.min.apply(null, PRESETS.map((p) => priceOf(fullState(p)).total)));

  const footWa = document.getElementById('foot-whatsapp');
  footWa.href = `https://wa.me/${CONFIG.contact.whatsapp}`;
  footWa.textContent = `WhatsApp ${CONFIG.contact.whatsappLabel}`;
  const footMail = document.getElementById('foot-email');
  footMail.href = `mailto:${CONFIG.contact.email}`;
  footMail.textContent = CONFIG.contact.email;

  renderPackages();
  renderGallery();
  update({});

  document.querySelectorAll('.step').forEach((btn) => {
    btn.addEventListener('click', () => {
      adjustCount(btn.dataset.count, Number(btn.dataset.step));
    });
  });

  document.getElementById('controls').addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'extras') {
      const idx = state.extras.indexOf(input.value);
      if (input.checked && idx === -1) state.extras.push(input.value);
      if (!input.checked && idx !== -1) state.extras.splice(idx, 1);
      if (input.value === 'card' && input.checked) {
        document.getElementById('note-field').hidden = false;
        document.getElementById('note').focus();
      }
      update({});
      return;
    }
    if (input.name === 'bloom' || input.name === 'wrap' || input.name === 'ribbon' || input.name === 'theme') {
      selectValue(input.name, input.value);
    }
  });

  const note = document.getElementById('note');
  note.addEventListener('input', () => {
    state.note = note.value;
    noteMessage();
  });

  /* Clear a field's complaint as soon as the customer starts fixing it. */
  Object.keys(FIELDS).forEach((key) => {
    document.getElementById(FIELDS[key].input).addEventListener('input', () => {
      setFieldError(key, '');
      setOrderStatus(null, '');
      refreshOrderLinks();
    });
  });

  document.getElementById('reset-bouquet').addEventListener('click', () => {
    state = defaultState();
    previousCounts = { books: state.books, flowers: state.flowers };
    note.value = '';
    syncControls();
    update({});
    toast('Back to the default: 3 books, 7 blooms, kraft paper.');
  });

  document.getElementById('copy-order').addEventListener('click', copyOrder);
  document.getElementById('order-whatsapp').addEventListener('click', onWhatsAppClick);
  document.getElementById('order-email').addEventListener('click', sendOrderEmail);

  document.getElementById('messenger-link').addEventListener('click', (event) => {
    if (!guardOrder()) {
      event.preventDefault();
      return;
    }
    setOrderStatus('ok', 'Facebook is opening. Paste the summary into a message there.');
  });

  document.getElementById('package-list').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-preset]');
    if (btn) loadConfig(PRESETS[Number(btn.dataset.preset)]);
  });

  document.getElementById('gallery-list').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-gallery]');
    if (btn) loadConfig(GALLERY[Number(btn.dataset.gallery)].config);
  });
}

document.addEventListener('DOMContentLoaded', init);
