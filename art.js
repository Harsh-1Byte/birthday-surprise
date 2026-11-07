/* Drawings (inline SVG), option catalogues and sound for the birthday surprise. */
(function () {
  const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
  let uid = 0;
  const id = (p) => `${p}${++uid}`;

  const heart = (fill = 'currentColor', cls = '') =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${HEART}" fill="${fill}"/></svg>`;

  const CAKES = {
    classic:    { label: 'Vanilla Classic',  sponge: '#f7dcaa', stripe: '#fff6e6', frost: '#fffaf2', plate: '#efe6f3', sprinkles: ['#ff8fb1', '#7fd1c7', '#ffd166'] },
    chocolate:  { label: 'Choco Truffle',    sponge: '#7a4632', stripe: '#f3d9c6', frost: '#40211a', plate: '#f1e6ea', sprinkles: ['#ffd6e0', '#ffffff', '#ffb3c6'] },
    strawberry: { label: 'Strawberry Dream', sponge: '#ffd3de', stripe: '#fff3f6', frost: '#ff86a8', plate: '#f6e8ef', sprinkles: ['#ffffff', '#ffe066', '#c9f2e7'] },
    galaxy:     { label: 'Galaxy Classic',   sponge: '#4c3a90', stripe: '#c4b5fd', frost: '#a78bfa', plate: '#e9e3f7', sprinkles: ['#ffffff', '#fde68a', '#93c5fd'] },
  };

  const FRIENDS = {
    bunny:     { label: 'Bunny',        a: '🐰', b: '🐰' },
    bearpanda: { label: 'Bear & Panda', a: '🐻', b: '🐼' },
    kitty:     { label: 'Kitty',        a: '🐱', b: '🐱' },
    puppy:     { label: 'Puppy',        a: '🐶', b: '🐶' },
    bearbunny: { label: 'Bear & Bunny', a: '🐻', b: '🐰' },
  };

  function cake(type, { candle = true } = {}) {
    const c = CAKES[type] || CAKES.classic;
    let sprinkles = '';
    for (let i = 0; i < 16; i++) {
      const x = 40 + ((i * 37) % 118), y = 132 + ((i * 23) % 30);
      sprinkles += `<rect x="${x}" y="${y}" width="7" height="2.6" rx="1.3" fill="${c.sprinkles[i % 3]}" transform="rotate(${(i * 47) % 180} ${x + 3} ${y + 1})"/>`;
    }
    let drip = 'M30 116 Q30 100 46 100 H154 Q170 100 170 116 V121';
    const depths = [10, 18, 8, 14, 22, 9, 16, 12, 20, 10];
    for (let k = 0, x = 170; x > 30; x -= 14, k++) {
      const d = 121 + depths[k % depths.length];
      drip += ` Q${x - 2} ${d} ${x - 7} ${d} Q${x - 12} ${d} ${x - 14} 121`;
    }
    drip += ' Z';
    const galaxyStars = type === 'galaxy'
      ? [[52, 150], [88, 160], [128, 146], [150, 162], [70, 136]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".9"/>`).join('')
      : '';
    const candleSvg = candle ? `
      <rect x="95" y="62" width="10" height="40" rx="3" fill="#ff7aa2"/>
      <path d="M95 70 L105 64 M95 80 L105 74 M95 90 L105 84" stroke="#fff" stroke-width="2.4" opacity=".85"/>
      <path d="M100 62 V55" stroke="#4a3528" stroke-width="2" stroke-linecap="round"/>
      <g class="flame">
        <ellipse class="glow" cx="100" cy="42" rx="20" ry="24" fill="#ffd166" opacity=".35"/>
        <path d="M100 24 C109 38 112 47 100 56 C88 47 91 38 100 24Z" fill="#ffb703"/>
        <path d="M100 36 C105 43 106 49 100 53 C94 49 95 43 100 36Z" fill="#fff3b0"/>
      </g>
      <g class="smoke" fill="none" stroke="#d8cfd6" stroke-width="3" stroke-linecap="round">
        <path d="M100 52 C92 42 108 34 100 22 C94 14 104 6 100 -2"/>
      </g>` : '';
    return `<svg class="cake-svg" viewBox="0 -6 200 196" aria-hidden="true">
      <ellipse cx="100" cy="172" rx="88" ry="12" fill="${c.plate}"/>
      <rect x="30" y="104" width="140" height="66" rx="10" fill="${c.sponge}"/>
      <rect x="30" y="146" width="140" height="6" fill="${c.stripe}" opacity=".85"/>
      ${galaxyStars}
      <path d="${drip}" fill="${c.frost}"/>
      ${sprinkles}
      ${candleSvg}
    </svg>`;
  }

  const BALLOON_COLORS = [
    ['#ffc2d6', '#f06292'], ['#bdf0d8', '#3fb68b'], ['#d9ccff', '#8f6bea'], ['#ffd9b8', '#f08a4b'],
  ];
  function balloon(i) {
    const [light, dark] = BALLOON_COLORS[i % BALLOON_COLORS.length];
    const g = id('bl');
    return `<svg class="balloon-svg" viewBox="0 0 100 165" aria-hidden="true">
      <defs><radialGradient id="${g}" cx="35%" cy="30%" r="75%">
        <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
        <stop offset=".28" stop-color="${light}"/>
        <stop offset="1" stop-color="${dark}"/>
      </radialGradient></defs>
      <path d="M50 112 C40 126 60 136 47 164" stroke="#caa7d6" fill="none" stroke-width="1.5"/>
      <path d="M50 6 C76 6 92 28 92 52 C92 80 70 100 52 104 L48 104 C30 100 8 80 8 52 C8 28 24 6 50 6Z" fill="url(#${g})" opacity=".9"/>
      <ellipse cx="34" cy="34" rx="8" ry="14" fill="#fff" opacity=".45" transform="rotate(-25 34 34)"/>
      <path d="M45 103 L55 103 L50 112Z" fill="${dark}"/>
    </svg>`;
  }

  function rose(x, y, r) {
    return `<g transform="translate(${x} ${y})">
      <circle r="${r}" fill="#a4161a"/>
      <circle r="${(r * 0.8).toFixed(1)}" cx="${(-r * 0.08).toFixed(1)}" cy="${(-r * 0.06).toFixed(1)}" fill="#d62839"/>
      <path d="M${-r * 0.5} 0 a${r * 0.5} ${r * 0.5} 0 1 1 ${r * 0.5} ${r * 0.5} a${r * 0.32} ${r * 0.32} 0 1 1 ${-r * 0.2} ${-r * 0.55} a${r * 0.15} ${r * 0.15} 0 1 1 ${r * 0.18} ${r * 0.15}"
        fill="none" stroke="#7a0b12" stroke-width="${(r * 0.12).toFixed(1)}" stroke-linecap="round"/>
    </g>`;
  }
  function bouquet() {
    const spots = [[100, 52, 17], [72, 62, 15], [128, 62, 15], [86, 82, 16], [114, 82, 16], [56, 86, 13], [144, 86, 13], [100, 102, 15], [70, 104, 13], [130, 104, 13], [100, 30, 13], [78, 40, 12], [122, 40, 12]];
    const leaves = [[48, 70, -40], [152, 70, 40], [60, 112, -20], [140, 112, 20], [100, 18, 0], [40, 98, -60], [160, 98, 60]]
      .map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="20" fill="#3f8f4f" transform="rotate(${a} ${x} ${y})"/>`).join('');
    const baby = [[60, 48], [140, 48], [92, 20], [112, 22], [46, 112], [154, 112], [84, 116], [118, 116]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/><circle cx="${x + 4}" cy="${y + 3}" r="2.4" fill="#fff"/>`).join('');
    return `<svg class="bouquet-svg" viewBox="0 0 200 230" aria-hidden="true">
      ${leaves}
      ${spots.map(([x, y, r]) => rose(x, y, r)).join('')}
      ${baby}
      <path d="M36 104 L100 222 L164 104 Q132 124 100 120 Q68 124 36 104Z" fill="#f3e6d6"/>
      <path d="M36 104 L100 222 L84 126 Q60 122 36 104Z" fill="#e6d2bd"/>
      <path d="M164 104 L100 222 L116 126 Q140 122 164 104Z" fill="#ead9c6"/>
      <g transform="translate(100 168)">
        <path d="M0 0 C-22 -18 -34 -2 -20 6 C-10 10 -4 4 0 0Z" fill="#c8102e"/>
        <path d="M0 0 C22 -18 34 -2 20 6 C10 10 4 4 0 0Z" fill="#c8102e"/>
        <path d="M-2 2 L-14 34 L-6 30 L0 36Z M2 2 L14 32 L6 29 L0 36Z" fill="#a50d26"/>
        <circle r="6" fill="#e01e3c"/>
      </g>
    </svg>`;
  }

  function heartTree() {
    const pinks = ['#f48fb1', '#f06292', '#f8bbd0', '#ec407a', '#ffcdd2'];
    let hearts = '';
    for (let i = 0; i < 34; i++) {
      const a = i * 2.39996, r = 36 * Math.sqrt((i + 0.5) / 34);
      const x = 60 + Math.cos(a) * r, y = 46 + Math.sin(a) * r * 0.8;
      const s = 0.42 + (i % 4) * 0.1;
      hearts += `<path d="${HEART}" fill="${pinks[i % pinks.length]}" transform="translate(${(x - 12 * s).toFixed(1)} ${(y - 12 * s).toFixed(1)}) scale(${s.toFixed(2)})"/>`;
    }
    return `<svg class="tree-svg" viewBox="0 0 120 140" aria-hidden="true">
      <path d="M56 140 C58 112 54 96 44 80 M60 140 C60 108 64 92 76 76 M58 110 C50 100 40 96 32 90 M60 100 C70 92 82 90 92 84"
        stroke="#9b6b5a" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${hearts}
    </svg>`;
  }

  function bunting() {
    const cols = ['#f06292', '#ffd166', '#7fd1c7', '#b39ddb', '#ff8a65', '#81c784'];
    let flags = '';
    for (let i = 0; i < 9; i++) {
      const x = 8 + i * 21, y = 6 + Math.sin((i / 8) * Math.PI) * 10;
      flags += `<path d="M${x} ${y} L${x + 16} ${y + 1} L${x + 8} ${y + 18}Z" fill="${cols[i % cols.length]}"/>`;
    }
    return `<svg class="bunting-svg" viewBox="0 0 200 34" aria-hidden="true">
      <path d="M2 6 Q100 30 198 6" stroke="#b07a93" stroke-width="1.4" fill="none"/>${flags}</svg>`;
  }

  function gift() {
    return `<svg class="gift-svg" viewBox="0 0 120 130" aria-hidden="true">
      <rect x="18" y="58" width="84" height="66" rx="6" fill="#f8a5c2"/>
      <rect x="18" y="58" width="84" height="66" rx="6" fill="none" stroke="#e8799f" stroke-width="2"/>
      <rect x="54" y="58" width="12" height="66" fill="#fff4f8"/>
      <g class="lid">
        <rect x="12" y="44" width="96" height="18" rx="5" fill="#f48fb1" stroke="#e8799f" stroke-width="2"/>
        <rect x="54" y="44" width="12" height="18" fill="#fff4f8"/>
        <path d="M60 44 C44 22 26 34 40 44Z" fill="#fff4f8" stroke="#f0b8cc" stroke-width="2"/>
        <path d="M60 44 C76 22 94 34 80 44Z" fill="#fff4f8" stroke="#f0b8cc" stroke-width="2"/>
      </g>
    </svg>`;
  }

  /* Real QR code (when the library loaded); otherwise a decorative stand-in. */
  function qr(text, dark = '#3a1424') {
    let n, isDark;
    try {
      if (window.qrcode.stringToBytesFuncs && window.qrcode.stringToBytesFuncs['UTF-8']) {
        window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
      }
      const q = window.qrcode(0, 'M');
      q.addData(text);
      q.make();
      n = q.getModuleCount();
      isDark = (r, c) => q.isDark(r, c);
    } catch (e) {
      n = 25;
      let seed = 7;
      for (const ch of String(text)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
      const rnd = [];
      for (let i = 0; i < n * n; i++) { seed = (seed * 16807) % 2147483647; rnd.push(seed % 2); }
      const finder = (r, c) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([fr, fc]) => {
        const y = r - fr, x = c - fc;
        if (y < 0 || x < 0 || y > 6 || x > 6) return false;
        return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
      });
      isDark = (r, c) => finder(r, c) || rnd[r * n + c] === 1;
    }
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return `<svg class="qr-svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="${dark}"/></svg>`;
  }

  const ICON = {
    soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  };

  /* Music box: a looping "Happy Birthday" melody plus small sound effects, all synthesized. */
  const MELODY = [
    [67, .75], [67, .25], [69, 1], [67, 1], [72, 1], [71, 2],
    [67, .75], [67, .25], [69, 1], [67, 1], [74, 1], [72, 2],
    [67, .75], [67, .25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2],
    [77, .75], [77, .25], [76, 1], [72, 1], [74, 1], [72, 2], [0, 2],
  ];
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  class Music {
    constructor() { this.ctx = null; this.muted = false; this.playing = false; this.timer = null; }
    ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    tone(f, t, dur, vol = 0.5, type = 'sine') {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    }
    play() {
      if (this.playing || !this.ensure()) return;
      this.playing = true;
      this.loop();
    }
    loop() {
      if (!this.playing) return;
      const beat = 0.42;
      const t0 = this.ctx.currentTime + 0.06;
      let t = t0;
      for (const [m, b] of MELODY) {
        if (m) {
          const len = Math.min(b * beat * 1.8, 1.6);
          this.tone(freq(m), t, len, 0.42, 'sine');
          this.tone(freq(m) * 2, t, len * 0.6, 0.08, 'triangle');
        }
        t += b * beat;
      }
      this.timer = setTimeout(() => this.loop(), (t - t0 - 0.1) * 1000);
    }
    stop() { this.playing = false; clearTimeout(this.timer); }
    setMuted(m) {
      this.muted = m;
      if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.22, this.ctx.currentTime, 0.05);
    }
    sfx(kind) {
      if (!this.ensure() || this.muted) return;
      const t = this.ctx.currentTime;
      if (kind === 'pop') {
        const len = 0.12, buf = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3);
        const src = this.ctx.createBufferSource(), bp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        bp.type = 'bandpass'; bp.frequency.value = 1400; g.gain.value = 1.6;
        src.buffer = buf; src.connect(bp); bp.connect(g); g.connect(this.master); src.start(t);
      } else if (kind === 'chime') {
        [84, 88, 91, 96].forEach((m, i) => this.tone(freq(m), t + i * 0.08, 0.9, 0.18));
      } else if (kind === 'tap') {
        this.tone(freq(88), t, 0.25, 0.15);
      }
    }
  }

  window.Art = { HEART, heart, CAKES, FRIENDS, cake, balloon, bouquet, heartTree, bunting, gift, qr, ICON, Music };
})();
