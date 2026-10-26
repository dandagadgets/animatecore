// Procedural Minecraft-style pixel art for the Soul Launcher ads.
// Every block and flame is drawn from code, so no game textures are shipped.
(function () {
  const SQ = Math.sqrt(3) / 2;
  const TEXEL = 8; // canvas pixels per texel, so faces stay sharp when scaled

  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, list) => list[Math.floor(r() * list.length)];
  const grid = (fn) => Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => fn(x, y)));

  const PAL = {
    grass: ['#5d9a35', '#6cae3e', '#548c2f', '#7bbf4a', '#4b7f29', '#66a63b'],
    dirt: ['#7a5536', '#8a6141', '#6b4a2f', '#966d4a', '#5e402a'],
    stone: ['#7d7f82', '#8a8c8f', '#717376', '#96989b', '#66686b'],
    bark: ['#6b5032', '#5a432a', '#7a5c3a', '#4c3923'],
    ring: ['#bd9a63', '#a5834f', '#c9a870'],
    leaves: ['#3c7a24', '#2f6a1c', '#4a8c2c', '#25561a', '#1f4a16'],
    soul: ['#4a382c', '#3d2f25', '#56443a', '#33271f', '#5f4c40'],
    flame: [null, '#0d6b78', '#14a7b8', '#3fdde9', '#a4f5fb', '#effeff'],
  };

  const TEX = {
    grass_top: (r) => grid(() => pick(r, PAL.grass)),
    grass_side: (r) => {
      const depth = Array.from({ length: 16 }, () => 3 + Math.floor(r() * 2) + (r() < 0.25 ? 1 : 0));
      return grid((x, y) => (y < depth[x] ? pick(r, PAL.grass) : pick(r, PAL.dirt)));
    },
    dirt: (r) => grid(() => pick(r, PAL.dirt)),
    stone: (r) => grid(() => pick(r, PAL.stone)),
    log_side: (r) => {
      const col = Array.from({ length: 16 }, () => pick(r, PAL.bark));
      return grid((x) => (r() < 0.8 ? col[x] : pick(r, PAL.bark)));
    },
    log_top: (r) => grid((x, y) => {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      if (d > 6.5) return pick(r, PAL.bark);
      return Math.floor(d) % 2 ? PAL.ring[1] : (r() < 0.5 ? PAL.ring[0] : PAL.ring[2]);
    }),
    leaves: (r) => grid(() => pick(r, PAL.leaves)),
    soul: (r) => grid(() => pick(r, PAL.soul)),
  };

  const BLOCKS = {
    grass: { top: 'grass_top', side: 'grass_side' },
    dirt: { top: 'dirt', side: 'dirt' },
    stone: { top: 'stone', side: 'stone' },
    log: { top: 'log_top', side: 'log_side' },
    leaves: { top: 'leaves', side: 'leaves' },
    soul: { top: 'soul', side: 'soul' },
  };

  function shadeHex(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
    return `rgb(${c.join(',')})`;
  }

  const texCache = new Map();
  function textureURL(name, variant, shade) {
    const key = `${name}:${variant}:${shade}`;
    if (texCache.has(key)) return texCache.get(key);
    let seed = variant * 9973;
    for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
    const tex = TEX[name](rng(seed));
    const cv = document.createElement('canvas');
    cv.width = cv.height = 16 * TEXEL;
    const g = cv.getContext('2d');
    tex.forEach((row, y) => row.forEach((col, x) => {
      g.fillStyle = shadeHex(col, shade);
      g.fillRect(x * TEXEL, y * TEXEL, TEXEL, TEXEL);
    }));
    const url = cv.toDataURL();
    texCache.set(key, url);
    return url;
  }

  // Soul flame: three tongues, colored by distance to the edge so the core burns white.
  function flameGrid() {
    const W = 16, H = 22;
    const tongues = [{ cx: 8.1, ty: 0, w: 4.9 }, { cx: 4.3, ty: 6, w: 3.3 }, { cx: 11.8, ty: 3, w: 3.1 }];
    const inside = (x, y) => {
      if (y < 0 || y >= H || x < 0 || x >= W) return false;
      for (const t of tongues) {
        if (y < t.ty) continue;
        const k = (y - t.ty + 0.5) / (H - t.ty);
        const wob = Math.sin(y * 0.85 + t.cx) * 0.45 * (1 - k);
        let w = t.w * Math.pow(k, 0.62);
        if (y === H - 2) w *= 0.88;
        if (y === H - 1) w *= 0.74;
        if (Math.abs(x + 0.5 - (t.cx + wob)) <= w) return true;
      }
      return false;
    };
    const out = [];
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        if (!inside(x, y)) { row.push(0); continue; }
        let r = 1;
        search: for (; r < 5; r++) {
          for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) + Math.abs(dy) > r || y + dy >= H) continue;
            if (!inside(x + dx, y + dy)) break search;
          }
        }
        row.push(Math.min(5, r));
      }
      out.push(row);
    }
    return out;
  }

  class Scene {
    constructor(size) {
      this.s = size;
      this.back = [];
      this.parts = [];
      this.min = [Infinity, Infinity];
      this.max = [-Infinity, -Infinity];
      this.id = 'sc' + Math.floor(Math.random() * 1e9).toString(36);
    }
    P(x, y, z) {
      return [(x - y) * SQ * this.s, (x + y) * 0.5 * this.s - z * this.s];
    }
    grow(x, y) {
      this.min = [Math.min(this.min[0], x), Math.min(this.min[1], y)];
      this.max = [Math.max(this.max[0], x), Math.max(this.max[1], y)];
    }
    face(tex, variant, shade, m, origin, corners) {
      const url = textureURL(tex, variant, shade);
      const [e, f] = origin;
      corners.forEach((c) => this.grow(...c));
      this.parts.push(`<image href="${url}" x="-0.12" y="-0.12" width="16.24" height="16.24" preserveAspectRatio="none" transform="matrix(${m.join(' ')} ${e.toFixed(2)} ${f.toFixed(2)})"/>`);
    }
    blocks(list) {
      const key = (x, y, z) => `${x},${y},${z}`;
      const occ = new Set(list.map((b) => key(b.x, b.y, b.z)));
      const k = this.s / 16;
      const sorted = [...list].sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z) || a.z - b.z);
      for (const b of sorted) {
        const def = BLOCKS[b.t];
        const v = Math.abs(b.x * 7 + b.y * 13 + b.z * 5) % 3;
        const P = (dx, dy, dz) => this.P(b.x + dx, b.y + dy, b.z + dz);
        if (!occ.has(key(b.x, b.y, b.z + 1)))
          this.face(def.top, v, b.lit || 1, [SQ * k, 0.5 * k, -SQ * k, 0.5 * k], P(0, 0, 1), [P(0, 0, 1), P(1, 0, 1), P(0, 1, 1), P(1, 1, 1)]);
        if (!occ.has(key(b.x, b.y + 1, b.z)))
          this.face(def.side, v, 0.8 * (b.lit || 1), [SQ * k, 0.5 * k, 0, k], P(0, 1, 1), [P(0, 1, 1), P(0, 1, 0), P(1, 1, 0)]);
        if (!occ.has(key(b.x + 1, b.y, b.z)))
          this.face(def.side, v, 0.6 * (b.lit || 1), [SQ * k, -0.5 * k, 0, k], P(1, 1, 1), [P(1, 0, 1), P(1, 0, 0), P(1, 1, 0)]);
      }
      return this;
    }
    // A soft halo drawn behind everything, centred on a block's top face.
    halo(x, y, z, radius, color, opacity) {
      const [cx, cy] = this.P(x + 0.5, y + 0.5, z);
      const gid = this.id + 'h' + this.back.length;
      this.back.push(`<radialGradient id="${gid}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="0.45" stop-color="${color}" stop-opacity="${opacity * 0.35}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient><circle cx="${cx}" cy="${cy}" r="${radius * this.s}" fill="url(#${gid})"/>`);
      return this;
    }
    // Soul fire standing on the top face of the block at (x, y, z - 1).
    flame(x, y, z, width = 0.78, embers = true) {
      const g = flameGrid();
      const px = (width * this.s) / g[0].length;
      const [cx, cy] = this.P(x + 0.5, y + 0.5, z);
      const left = cx - (g[0].length * px) / 2;
      const top = cy - g.length * px + px * 1.2;
      const gid = this.id + 'f';
      let out = `<radialGradient id="${gid}"><stop offset="0" stop-color="#5eead4" stop-opacity="0.55"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></radialGradient>`;
      out += `<ellipse cx="${cx}" cy="${cy}" rx="${this.s * 0.8}" ry="${this.s * 0.42}" fill="url(#${gid})" style="mix-blend-mode:screen"/>`;
      out += `<g shape-rendering="crispEdges">`;
      g.forEach((row, j) => row.forEach((v, i) => {
        if (v) out += `<rect x="${(left + i * px).toFixed(2)}" y="${(top + j * px).toFixed(2)}" width="${(px + 0.4).toFixed(2)}" height="${(px + 0.4).toFixed(2)}" fill="${PAL.flame[v]}"/>`;
      }));
      if (embers) {
        const r = rng(x * 31 + y * 17 + z);
        for (let n = 0; n < 7; n++) {
          const ex = cx + (r() - 0.5) * this.s * 1.1;
          const ey = top - r() * this.s * 0.9 - px;
          const sz = px * (r() < 0.5 ? 1 : 1.5);
          out += `<rect x="${ex.toFixed(1)}" y="${ey.toFixed(1)}" width="${sz}" height="${sz}" fill="${n % 2 ? '#a4f5fb' : '#3fdde9'}" opacity="${(0.35 + r() * 0.55).toFixed(2)}"/>`;
        }
      }
      out += `</g>`;
      this.grow(left, top - this.s);
      this.grow(left + g[0].length * px, cy);
      this.parts.push(out);
      return this;
    }
    // Numbered step marker floating `lift` blocks above the top face of (x, y, z - 1).
    badge(x, y, z, label, lift = 0.75) {
      const [cx, cy0] = this.P(x + 0.5, y + 0.5, z + lift);
      const r = this.s * 0.34;
      const cy = cy0 - r;
      this.parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0d1016" stroke="#5eead4" stroke-width="${this.s * 0.035}"/>` +
        `<text x="${cx}" y="${cy + r * 0.36}" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="${r * 1.15}" fill="#5eead4">${label}</text>`);
      this.grow(cx - r, cy - r);
      this.grow(cx + r, cy + r);
      return this;
    }
    svg(pad = 8) {
      const [x0, y0] = this.min, [x1, y1] = this.max;
      const vb = [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2].map((n) => n.toFixed(1)).join(' ');
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" style="overflow:visible">${this.back.join('')}${this.parts.join('')}</svg>`;
    }
  }

  // Shapes reused across ads.
  const SHAPES = {
    island() {
      const b = [];
      const top = [[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2],[1,3],[2,3]];
      for (const [x, y] of top) b.push({ x, y, z: 0, t: x === 2 && y === 2 ? 'soul' : 'grass' });
      for (const [x, y] of [[1,0],[2,0],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[1,3],[2,3]]) b.push({ x, y, z: -1, t: 'dirt' });
      for (const [x, y] of [[1,1],[2,1],[1,2],[2,2]]) b.push({ x, y, z: -2, t: 'stone' });
      b.push({ x: 2, y: 2, z: -3, t: 'stone' });
      b.push({ x: 1, y: 0, z: 1, t: 'log' }, { x: 1, y: 0, z: 2, t: 'log' });
      for (const [x, y] of [[0,0],[1,0],[2,0],[1,-1],[1,1]]) b.push({ x, y, z: 3, t: 'leaves' });
      b.push({ x: 1, y: 0, z: 4, t: 'leaves' }, { x: 3, y: 1, z: 1, t: 'stone' });
      return b;
    },
    stairs() {
      const b = [];
      for (let x = 0; x < 3; x++) for (let y = 0; y < 4; y++) b.push({ x, y, z: 0, t: 'grass' });
      for (let x = 0; x < 3; x++) for (let y = 0; y < 4; y++) if (x + y > 0 && x + y < 5) b.push({ x, y, z: -1, t: 'dirt' });
      b.push({ x: 1, y: 2, z: -2, t: 'stone' }, { x: 1, y: 1, z: -2, t: 'stone' });
      // Two-wide steps rising toward the back right: one, two, then three blocks with soul soil on top.
      for (const x of [1, 2]) {
        b.push({ x, y: 2, z: 1, t: 'stone' });
        b.push({ x, y: 1, z: 1, t: 'stone' }, { x, y: 1, z: 2, t: 'stone' });
        b.push({ x, y: 0, z: 1, t: 'stone' }, { x, y: 0, z: 2, t: 'stone' }, { x, y: 0, z: 3, t: x === 2 ? 'soul' : 'stone' });
      }
      return b;
    },
  };

  window.Pixel = { Scene, SHAPES };
})();
