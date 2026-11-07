/* The surprise itself: a sequence of interactive scenes rendered into a container. */
(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const rand = (a, b) => a + Math.random() * (b - a);
  const ORDER = ['countdown', 'passcode', 'intro', 'greeting', 'balloons', 'candle', 'bouquet', 'letter', 'gift'];
  const CONFETTI = ['#ff5c9a', '#ffd166', '#7fd1c7', '#b39ddb', '#ff8a65', '#ffffff', '#f06292'];

  class Experience {
    /**
     * @param {HTMLElement} root   container (should establish a size container)
     * @param {object} cfg         the surprise configuration
     * @param {object} opts        { music, preview, onScene(name) }
     */
    constructor(root, cfg, opts = {}) {
      this.root = root;
      this.cfg = cfg;
      this.opts = opts;
      this.music = opts.music;
      this.timers = new Set();
      this.cleanups = [];
      this.token = 0;

      root.innerHTML = `
        <div class="xp theme-${cfg.theme === 'night' ? 'night' : 'sweet'}">
          <div class="xp-bg"></div>
          <div class="xp-scene"></div>
          <div class="xp-fx"></div>
          <div class="xp-controls">
            <button class="xp-ic" data-act="sound" aria-label="Mute music">${this.music && this.music.muted ? Art.ICON.soundOff : Art.ICON.soundOn}</button>
            <button class="xp-ic" data-act="full" aria-label="Fullscreen">${Art.ICON.full}</button>
          </div>
        </div>`;
      this.xp = root.firstElementChild;
      this.sceneEl = this.xp.querySelector('.xp-scene');
      this.fx = this.xp.querySelector('.xp-fx');
      this.bg = this.xp.querySelector('.xp-bg');

      this.xp.querySelector('[data-act=sound]').addEventListener('click', (e) => {
        if (!this.music) return;
        this.music.setMuted(!this.music.muted);
        if (!this.music.muted) this.music.play();
        e.currentTarget.innerHTML = this.music.muted ? Art.ICON.soundOff : Art.ICON.soundOn;
        e.currentTarget.setAttribute('aria-label', this.music.muted ? 'Unmute music' : 'Mute music');
      });
      this.xp.querySelector('[data-act=full]').addEventListener('click', () => {
        const target = this.opts.fullscreenTarget || this.root;
        if (document.fullscreenElement) document.exitFullscreen();
        else if (target.requestFullscreen) target.requestFullscreen().catch(() => {});
      });

      const now = Date.now();
      this.order = ORDER.filter((s) => {
        if (s === 'countdown') return cfg.timer && cfg.timer.on && cfg.timer.date && new Date(cfg.timer.date).getTime() > now;
        if (s === 'passcode') return cfg.passcode && cfg.passcode.on && /^\d{4}$/.test(cfg.passcode.code || '');
        return true;
      });

      this.bgTimer = setInterval(() => this.floatHeart(), 650);
      for (let i = 0; i < 6; i++) this.floatHeart(true);
    }

    /* ---------- lifecycle ---------- */
    start(scene) {
      this.go(this.order.includes(scene) ? scene : this.order[0]);
    }
    destroy() {
      this.clearScene();
      clearInterval(this.bgTimer);
      this.root.innerHTML = '';
    }
    clearScene() {
      this.token++;
      this.timers.forEach(clearTimeout);
      this.timers.clear();
      this.cleanups.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
    }
    later(fn, ms) {
      const tok = this.token;
      const t = setTimeout(() => { this.timers.delete(t); if (tok === this.token) fn(); }, ms);
      this.timers.add(t);
    }
    go(name) {
      this.clearScene();
      this.current = name;
      if (this.opts.onScene) this.opts.onScene(name);
      const el = document.createElement('div');
      el.className = `sc sc-${name}`;
      this.sceneEl.replaceChildren(el);
      this.scene = el;
      this['s_' + name](el);
    }
    next() {
      const i = this.order.indexOf(this.current);
      if (i < 0 || i >= this.order.length - 1) return;
      const nextName = this.order[i + 1];
      this.scene.classList.add('leaving');
      const tok = this.token;
      setTimeout(() => { if (tok === this.token) this.go(nextName); }, 420);
    }
    nextButton(el, label = 'Next', delay = 0) {
      this.later(() => {
        const b = document.createElement('button');
        b.className = 'xp-next';
        b.innerHTML = `${esc(label)} <span aria-hidden="true">›</span>`;
        b.addEventListener('click', () => { this.music && this.music.sfx('tap'); this.next(); }, { once: true });
        el.appendChild(b);
      }, delay);
    }

    /* ---------- helpers ---------- */
    fill(s) {
      const c = this.cfg;
      return String(s || '')
        .replaceAll('{name}', c.name || '')
        .replaceAll('{emoji}', c.emoji || '')
        .replaceAll('{bond}', c.bond || '')
        .replaceAll('{signoff}', c.signoff || '');
    }
    get who() { return `${esc(this.cfg.name)} ${esc(this.cfg.emoji)}`.trim(); }
    point(e) {
      const r = this.xp.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    centerOf(node) {
      const r = this.xp.getBoundingClientRect(), b = node.getBoundingClientRect();
      return [b.left - r.left + b.width / 2, b.top - r.top + b.height / 2];
    }
    floatHeart(initial = false) {
      if (document.hidden || this.bg.childElementCount > 26) return;
      const h = document.createElement('div');
      h.className = 'fh';
      const size = rand(0.6, 1.6);
      const dur = rand(7, 12);
      h.style.left = rand(-2, 96) + '%';
      h.style.fontSize = size + 'em';
      h.style.opacity = rand(0.35, 0.85).toFixed(2);
      h.style.setProperty('--dx', rand(-30, 30).toFixed(0) + 'px');
      h.style.animationDuration = dur + 's';
      if (initial) h.style.animationDelay = -rand(0, dur) + 's';
      h.innerHTML = Art.heart();
      h.addEventListener('animationend', () => h.remove());
      this.bg.appendChild(h);
    }
    confetti(x, y, n = 40, power = 1) {
      for (let i = 0; i < n; i++) {
        const p = document.createElement('i');
        p.className = 'cf';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.background = CONFETTI[i % CONFETTI.length];
        if (i % 3 === 0) p.style.borderRadius = '50%';
        this.fx.appendChild(p);
        const a = rand(0, Math.PI * 2), v = rand(60, 170) * power;
        const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 60 * power;
        const anim = p.animate([
          { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rand(-360, 360)}deg)`, opacity: 1, offset: 0.55 },
          { transform: `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy + 180}px)) rotate(${rand(-720, 720)}deg)`, opacity: 0 },
        ], { duration: rand(1100, 1900), easing: 'cubic-bezier(.2,.7,.4,1)' });
        anim.onfinish = () => p.remove();
      }
    }
    confettiRain(n = 70) {
      const w = this.xp.clientWidth, h = this.xp.clientHeight;
      for (let i = 0; i < n; i++) {
        const p = document.createElement('i');
        p.className = 'cf';
        p.style.left = rand(0, w) + 'px';
        p.style.top = '-12px';
        p.style.background = CONFETTI[i % CONFETTI.length];
        this.fx.appendChild(p);
        const anim = p.animate([
          { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
          { transform: `translate(${rand(-40, 40)}px, ${h + 30}px) rotate(${rand(-540, 540)}deg)`, opacity: 0.9 },
        ], { duration: rand(2200, 3800), delay: rand(0, 900), easing: 'linear', fill: 'backwards' });
        anim.onfinish = () => p.remove();
      }
    }
    mascots(withCake) {
      const f = Art.FRIENDS[this.cfg.friend] || Art.FRIENDS.bunny;
      return `<div class="mascots">
        <span class="m m1">${f.a}<i class="hat"></i></span>
        ${withCake ? `<span class="m-cake">${Art.cake(this.cfg.cake, { candle: true })}</span>` : ''}
        <span class="m m2">${f.b}<i class="hat"></i></span>
      </div>`;
    }

    /* ---------- scenes ---------- */
    s_countdown(el) {
      const target = new Date(this.cfg.timer.date).getTime();
      el.innerHTML = `
        <div class="stack center">
          ${this.mascots(false)}
          <h2 class="script sm">Something special is on its way…</h2>
          <div class="cd">
            ${['days', 'hours', 'mins', 'secs'].map((u) => `<div class="cd-cell"><b data-u="${u}">00</b><span>${u}</span></div>`).join('')}
          </div>
          <p class="muted">Come back on your birthday, ${this.who}</p>
          ${this.opts.preview ? '<button class="xp-link" data-skip>Skip countdown (preview only)</button>' : ''}
        </div>`;
      const cells = {};
      el.querySelectorAll('[data-u]').forEach((b) => { cells[b.dataset.u] = b; });
      const tick = () => {
        const left = Math.max(0, target - Date.now());
        const s = Math.floor(left / 1000);
        const vals = { days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, mins: Math.floor(s / 60) % 60, secs: s % 60 };
        for (const k in vals) cells[k].textContent = String(vals[k]).padStart(2, '0');
        if (left <= 0) { this.music && this.music.sfx('chime'); this.next(); return; }
        this.later(tick, 1000);
      };
      tick();
      const skip = el.querySelector('[data-skip]');
      if (skip) skip.addEventListener('click', () => this.next());
    }

    s_passcode(el) {
      const code = this.cfg.passcode.code;
      const hint = this.cfg.passcode.hint;
      let entry = '';
      el.innerHTML = `
        <div class="stack center">
          <div class="lock">${Art.heart('var(--accent2)')}<span>🔒</span></div>
          <h2 class="serif md">Enter the secret code</h2>
          ${hint ? `<p class="muted">Hint: ${esc(hint)}</p>` : '<p class="muted">Only you would know it 💭</p>'}
          <div class="dots">${'<i></i>'.repeat(4)}</div>
          <div class="keypad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-k="${d}">${d}</button>`).join('')}
            <span></span><button data-k="0">0</button><button data-k="del" aria-label="Delete">⌫</button>
          </div>
          ${this.opts.preview ? `<p class="muted tiny">Preview: the code is ${esc(code)}</p>` : ''}
        </div>`;
      const dots = [...el.querySelectorAll('.dots i')];
      const dotsWrap = el.querySelector('.dots');
      const paint = () => dots.forEach((d, i) => d.classList.toggle('on', i < entry.length));
      el.querySelector('.keypad').addEventListener('click', (e) => {
        const k = e.target.closest('button')?.dataset.k;
        if (!k) return;
        this.music && this.music.sfx('tap');
        if (k === 'del') entry = entry.slice(0, -1);
        else if (entry.length < 4) entry += k;
        paint();
        if (entry.length === 4) {
          if (entry === code) {
            dotsWrap.classList.add('ok');
            this.music && this.music.sfx('chime');
            this.later(() => this.next(), 500);
          } else {
            dotsWrap.classList.remove('shake');
            void dotsWrap.offsetWidth;
            dotsWrap.classList.add('shake');
            this.later(() => { entry = ''; paint(); }, 450);
          }
        }
      });
    }

    s_intro(el) {
      el.innerHTML = `
        <button class="qr-card" aria-label="Tap to open your surprise">
          <div class="qr-title">${this.who}'s Birthday!</div>
          <div class="qr-heart">
            <svg class="big-heart" viewBox="0 0 24 24" aria-hidden="true">
              <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4d6d"/><stop offset="1" stop-color="#c9184a"/></linearGradient></defs>
              <path d="${Art.HEART}" fill="url(#hg)"/>
            </svg>
            <div class="qr-box">${Art.qr(`Happy Birthday, ${this.cfg.name}! ${this.cfg.emoji}`)}</div>
            <div class="scan"></div>
          </div>
        </button>
        <p class="tap-hint">Tap to open</p>`;
      const card = el.querySelector('.qr-card');
      const hint = el.querySelector('.tap-hint');
      card.addEventListener('click', () => {
        if (card.dataset.opening) return;
        card.dataset.opening = '1';
        this.music && this.music.play();
        card.classList.add('opening');
        hint.innerHTML = '<span class="spin"></span> Opening…';
        hint.classList.add('busy');
        this.later(() => this.next(), 1500);
      });
    }

    s_greeting(el) {
      let trail = '';
      for (let i = 0; i < 16; i++) {
        const x = 18 + 26 * Math.sin(i / 2.4) + i * 3.6;
        trail += `<span class="trail" style="left:${x}%;top:${i * 6}%;font-size:${(0.7 + (i % 3) * 0.35).toFixed(2)}em;animation-delay:${i * 90}ms">${Art.heart()}</span>`;
      }
      el.innerHTML = `
        <div class="trail-wrap">${trail}</div>
        <div class="greet">
          <h1 class="script xl write">Happy Birthday,<br>${this.who}</h1>
          <div class="party hidden">
            <div class="bunting">${Art.bunting()}</div>
            ${this.mascots(true)}
          </div>
          <div class="ask hidden">
            <p class="serif q">Are you excited for what's next?</p>
            <div class="ask-btns"><button class="pill yes">Yes</button><button class="pill no">No</button></div>
          </div>
        </div>`;
      const greet = el.querySelector('.greet');
      const party = el.querySelector('.party');
      const ask = el.querySelector('.ask');
      this.later(() => { greet.classList.add('up'); party.classList.remove('hidden'); }, 1900);
      this.later(() => { ask.classList.remove('hidden'); }, 2900);

      const yes = el.querySelector('.yes');
      const no = el.querySelector('.no');
      const quips = ['No', 'Are you sure?', 'Nope 🙈', 'Try again', 'Not happening', 'Just say yes 💕'];
      let dodges = 0;
      const dodge = (e) => {
        if (e) e.preventDefault();
        dodges++;
        no.textContent = quips[dodges % quips.length];
        const area = el.getBoundingClientRect();
        const b = no.getBoundingClientRect();
        const y = yes.getBoundingClientRect();
        let left, top, tries = 0;
        do {
          left = rand(8, area.width - b.width - 8);
          top = rand(area.height * 0.18, area.height - b.height - 24);
          tries++;
        } while (tries < 20 && left + area.left < y.right + 10 && left + area.left + b.width > y.left - 10 && top + area.top < y.bottom + 10 && top + area.top + b.height > y.top - 10);
        if (!no.classList.contains('loose')) {
          no.classList.add('loose');
          el.appendChild(no);
        }
        no.style.left = left + 'px';
        no.style.top = top + 'px';
        if (dodges >= 7) yes.classList.add('grow');
      };
      no.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') dodge(); });
      no.addEventListener('pointerdown', dodge);
      no.addEventListener('click', dodge);
      yes.addEventListener('click', () => {
        const [x, y] = this.centerOf(yes);
        this.confetti(x, y, 50);
        this.music && this.music.sfx('chime');
        yes.disabled = true;
        this.later(() => this.next(), 900);
      });
    }

    s_balloons(el) {
      const words = (this.cfg.balloons || []).slice(0, 4);
      while (words.length < 4) words.push('');
      const spots = [[28, 38], [72, 34], [30, 66], [72, 63]];
      el.innerHTML = `
        <div class="pop-count"><b>0</b>/4 popped</div>
        <h2 class="title-sans">Pop all 4 balloons</h2>
        <div class="balloon-field">
          ${words.map((w, i) => `
            <span class="word" style="left:${spots[i][0]}%;top:${spots[i][1]}%">${esc(w)}</span>
            <button class="balloon" style="left:${spots[i][0]}%;top:${spots[i][1]}%;animation-delay:${-i * 0.7}s" aria-label="Pop balloon ${i + 1}">${Art.balloon(i)}</button>`).join('')}
        </div>
        <p class="phrase script lg"></p>`;
      let popped = 0;
      const count = el.querySelector('.pop-count b');
      const wordsEls = [...el.querySelectorAll('.word')];
      el.querySelectorAll('.balloon').forEach((b, i) => {
        b.addEventListener('click', () => {
          if (b.classList.contains('popped')) return;
          b.classList.add('popped');
          const [x, y] = this.centerOf(b);
          this.confetti(x, y - 10, 22, 0.6);
          this.music && this.music.sfx('pop');
          wordsEls[i].classList.add('show');
          popped++;
          count.textContent = popped;
          if (popped === 4) {
            this.later(() => {
              el.querySelector('.balloon-field').classList.add('fade');
              const phrase = el.querySelector('.phrase');
              phrase.textContent = words.filter(Boolean).join(' ');
              phrase.classList.add('show');
              this.music && this.music.sfx('chime');
            }, 900);
            this.nextButton(el, 'Next', 2200);
          }
        });
      });
    }

    s_candle(el) {
      el.innerHTML = `
        <h2 class="serif md candle-title">Blow the candle</h2>
        <button class="cake-wrap" aria-label="Blow out the candle">${Art.cake(this.cfg.cake, { candle: true })}</button>
        <p class="mic-hint"><span class="mic-ico">🎤</span> <span class="mic-text">Blow into the mic</span></p>
        <p class="muted tiny alt-hint">or tap the flame</p>
        <div class="dim"></div>
        <p class="wish serif">Close your eyes<br>&amp; make a wish</p>`;
      const flame = el.querySelector('.flame');
      const micText = el.querySelector('.mic-text');
      let out = false;
      let stopMic = () => {};
      const blow = () => {
        if (out) return;
        out = true;
        stopMic();
        flame.style.scale = '';
        el.classList.add('blown');
        this.music && this.music.sfx('chime');
        this.later(() => el.classList.add('wishing'), 900);
        this.later(() => this.confettiRain(80), 1400);
        this.later(() => this.next(), 5200);
      };
      el.querySelector('.cake-wrap').addEventListener('click', blow);

      const tok = this.token;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext) {
        navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
          .then((stream) => {
            if (tok !== this.token || out) { stream.getTracks().forEach((t) => t.stop()); return; }
            const AC = window.AudioContext || window.webkitAudioContext;
            const ctx = new AC();
            const src = ctx.createMediaStreamSource(stream);
            const an = ctx.createAnalyser();
            an.fftSize = 1024;
            src.connect(an);
            const buf = new Float32Array(an.fftSize);
            let hot = 0, raf = 0, stopped = false;
            stopMic = () => {
              if (stopped) return;
              stopped = true;
              cancelAnimationFrame(raf);
              stream.getTracks().forEach((t) => t.stop());
              ctx.close();
            };
            this.cleanups.push(stopMic);
            micText.textContent = 'Blow into the mic';
            const tick = () => {
              an.getFloatTimeDomainData(buf);
              let sum = 0;
              for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
              const rms = Math.sqrt(sum / buf.length);
              flame.style.scale = `${(1 - Math.min(rms * 3, 0.45)).toFixed(3)} ${(1 + Math.min(rms * 2, 0.3)).toFixed(3)}`;
              hot = rms > 0.08 ? hot + 1 : Math.max(0, hot - 1);
              if (hot > 9) { blow(); return; }
              raf = requestAnimationFrame(tick);
            };
            tick();
          })
          .catch(() => { if (tok === this.token) { micText.textContent = 'Tap the flame to blow it out'; el.querySelector('.alt-hint').remove(); } });
      } else {
        micText.textContent = 'Tap the flame to blow it out';
        el.querySelector('.alt-hint').remove();
      }
    }

    s_bouquet(el) {
      const notes = (this.cfg.notes || []).slice(0, 6);
      const pos = ['tl', 'tr', 'ml', 'mr', 'bl', 'br'];
      el.innerHTML = `
        <h2 class="script lg bq-title">Your Rose Bouquet 🌹</h2>
        <div class="bq-stage">
          <div class="bouquet">${Art.bouquet()}</div>
          <div class="tree t1">${Art.heartTree()}</div>
          <div class="tree t2">${Art.heartTree()}</div>
          ${notes.map((n, i) => `<div class="note n-${pos[i]}" style="animation-delay:${0.9 + i * 0.55}s">${esc(this.fill(n))}</div>`).join('')}
        </div>`;
      this.nextButton(el, 'Next', 1200 + notes.length * 550 + 600);
    }

    s_letter(el) {
      const f = Art.FRIENDS[this.cfg.friend] || Art.FRIENDS.bunny;
      el.innerHTML = `
        <div class="env-phase">
          <h2 class="serif md">A Message From My Heart</h2>
          <button class="envelope" aria-label="Open the envelope">
            <span class="env-letter"></span>
            <span class="env-back"></span>
            <span class="env-front"></span>
            <span class="env-flap"></span>
            <span class="env-seal">${Art.heart('#e5386d')}</span>
          </button>
          <p class="tap-hint serif">Tap the envelope</p>
        </div>`;
      const env = el.querySelector('.envelope');
      env.addEventListener('click', () => {
        if (env.classList.contains('open')) return;
        env.classList.add('open');
        this.music && this.music.sfx('tap');
        this.later(() => showLetter(), 1300);
      });

      const showLetter = () => {
        el.innerHTML = `
          <h2 class="serif sm letter-head">A Message From My Heart ${Art.heart('#e5386d', 'inline-heart')}</h2>
          <div class="paper">
            <span class="paper-badge">${Art.heart('#fff')}</span>
            <div class="paper-body"><p class="ink"></p></div>
            <span class="paper-friend">${f.a}</span>
          </div>`;
        const body = el.querySelector('.paper-body');
        const ink = el.querySelector('.ink');
        const text = this.fill(this.cfg.letter);
        let i = 0, done = false;
        const finish = () => {
          if (done) return;
          done = true;
          ink.textContent = text;
          ink.classList.add('done');
          body.scrollTop = body.scrollHeight;
          this.nextButton(el, 'Next', 700);
        };
        const type = () => {
          if (done) return;
          const step = Math.max(1, Math.round(text.length / 900));
          i = Math.min(text.length, i + step);
          ink.textContent = text.slice(0, i);
          body.scrollTop = body.scrollHeight;
          if (i >= text.length) { finish(); return; }
          const ch = text[i - 1];
          this.later(type, ch === '\n' ? 260 : /[.!?,]/.test(ch) ? 160 : 26);
        };
        this.later(type, 400);
        el.querySelector('.paper').addEventListener('click', finish);
      };
    }

    s_gift(el) {
      el.innerHTML = `
        <div class="gift-phase">
          <h2 class="script lg">One Last Thing…</h2>
          <p class="serif sub">Tap the gift</p>
          <button class="gift" aria-label="Open the gift">${Art.gift()}<span class="badge">1</span></button>
        </div>`;
      const g = el.querySelector('.gift');
      g.addEventListener('click', () => {
        if (g.classList.contains('shaking')) return;
        g.classList.add('shaking');
        this.music && this.music.sfx('tap');
        this.later(() => {
          g.classList.add('open');
          const [x, y] = this.centerOf(g);
          this.confetti(x, y, 70, 1.3);
          this.music && this.music.sfx('chime');
        }, 800);
        this.later(() => reveal(), 1600);
      });

      const reveal = () => {
        const photos = (this.cfg.photos || []).slice(0, 5);
        const f = Art.FRIENDS[this.cfg.friend] || Art.FRIENDS.bunny;
        const art = photos.length
          ? `<div class="polaroids">${photos.map((p, i) => `<figure class="pol" style="--r:${[-6, 4, -2, 7, -4][i]}deg"><img src="${p}" alt="Memory ${i + 1}"></figure>`).join('')}</div>`
          : `<div class="sticker-card"><span>${f.a}</span><span class="cake-mini">🎂</span><span>${f.b}</span></div>`;
        el.innerHTML = `
          <div class="final">
            <div class="final-art">${art}<span class="final-badge">${Art.heart('#fff')}</span></div>
            <h2 class="script lg">${esc(this.fill(this.cfg.finalLine))}</h2>
            <p class="serif sub">${esc(this.fill(this.cfg.finalSub))}</p>
          </div>`;
        if (photos.length > 1) {
          const pols = [...el.querySelectorAll('.pol')];
          let top = pols.length - 1;
          const cycle = () => {
            const card = pols[top];
            card.classList.add('flick');
            this.later(() => {
              card.classList.remove('flick');
              card.parentNode.prepend(card);
              pols.unshift(pols.pop());
              cycle2();
            }, 600);
          };
          const cycle2 = () => this.later(cycle, 2600);
          cycle2();
        }
        this.later(() => {
          const b = document.createElement('button');
          b.className = 'xp-next';
          b.innerHTML = `${Art.ICON.replay} Watch again`;
          b.addEventListener('click', () => this.start(this.order.includes('intro') ? 'intro' : this.order[0]));
          el.appendChild(b);
        }, 2600);
      };
    }
  }

  window.Experience = Experience;
})();
