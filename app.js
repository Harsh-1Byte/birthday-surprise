/* Creator UI, live preview, share links, and the recipient view. */
(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const STORE_KEY = 'bday-surprise-draft-v1';

  const LETTER = `Dear {name} {emoji},

Happy Birthday to someone truly special! 🎂

You are {bond}, and I'm so grateful to have you in my life.

You fill my days with warmth and sweetness, and every moment with you feels precious.

On your special day, I wish you all the happiness, love and joy you deserve. May this year bring you endless beautiful moments and wonderful memories.

Here's to celebrating you today and always! 🎉

With love and best wishes,
{signoff}`;

  const DEFAULTS = {
    v: 1,
    theme: 'sweet',
    name: 'Laado',
    emoji: '😘',
    cake: 'galaxy',
    bond: 'Always There, Kind Heart, Sweet Soul',
    friend: 'bunny',
    timer: { on: false, date: '' },
    passcode: { on: false, code: '', hint: '' },
    balloons: ['You', 'are', 'so', 'special'],
    notes: ['Forever yours 🤍', 'You make my world beautiful', 'You are my sunshine ☀️', 'Happy Birthday {name} {emoji}', "I'm lucky to have you", 'My favorite person 💕'],
    letter: LETTER,
    signoff: 'Your Special Someone 💝',
    finalLine: 'Lots of love for you ❤️',
    finalSub: 'Once again, Happy Birthday {name} {emoji}!',
    photos: [],
  };

  const EMOJIS = ['😘', '🥰', '💖', '🎉', '👑', '🌸', '✨', '🦋', '🤍', '😊', '🌻', '💫'];
  const BONDS = [
    'Always There, Kind Heart, Sweet Soul',
    'My Partner in Crime and My Safe Place',
    'Brave, Brilliant and Beautiful',
    'My Best Friend and My Forever Person',
    'Pure Sunshine in Human Form',
    'The Calm in My Storm',
  ];
  const THEMES = [
    { id: 'sweet', label: 'Cute & Sweet', icon: '💗' },
    { id: 'night', label: 'Starry Night', icon: '🌙' },
  ];

  const clone = (o) => JSON.parse(JSON.stringify(o));
  function merge(base, extra) {
    const out = clone(base);
    if (!extra || typeof extra !== 'object') return out;
    for (const k of Object.keys(base)) {
      if (!(k in extra)) continue;
      const b = base[k], e = extra[k];
      if (Array.isArray(b)) out[k] = Array.isArray(e) ? e.map(String) : b;
      else if (b && typeof b === 'object') out[k] = { ...b, ...(e && typeof e === 'object' ? e : {}) };
      else if (typeof b === typeof e) out[k] = e;
    }
    out.photos = (out.photos || []).filter((p) => /^data:image\/(jpeg|png|webp);base64,/.test(p)).slice(0, 5);
    return out;
  }

  /* ---------- link encoding: JSON → deflate → base64url ---------- */
  const b64url = (bytes) => {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const unb64url = (s) => {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };
  async function encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    if ('CompressionStream' in window) {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return 'z' + b64url(new Uint8Array(await new Response(stream).arrayBuffer()));
    }
    return 'j' + b64url(bytes);
  }
  async function decode(s) {
    const kind = s[0], bytes = unb64url(s.slice(1));
    let raw = bytes;
    if (kind === 'z') {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      raw = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    return JSON.parse(new TextDecoder().decode(raw));
  }

  const music = new Art.Music();
  let exp = null;

  function mountExperience(stage, cfg, opts) {
    if (exp) exp.destroy();
    exp = new Experience(stage, cfg, { music, ...opts });
    exp.start(opts.scene);
    return exp;
  }

  /* =====================================================================
     Recipient view
     ===================================================================== */
  async function renderRecipient(data) {
    let cfg;
    try {
      cfg = merge(DEFAULTS, typeof data === 'string' ? await decode(data) : data);
    } catch (e) {
      $('#app').innerHTML = `<div class="broken"><div class="broken-card"><h1>Hmm, this surprise link looks broken 💔</h1><p>Ask the sender to copy the link again. Long links sometimes get cut off when pasted.</p><a class="btn primary" href="${location.pathname}">Make your own surprise</a></div></div>`;
      return;
    }
    document.title = `A surprise for ${cfg.name} 🎂`;
    $('#app').innerHTML = `
      <div class="recipient">
        <div class="phone ${cfg.theme === 'night' ? 'phone-night' : ''}"><div class="notch"></div><div class="screen" id="stage"></div></div>
      </div>`;
    const phone = $('.recipient .phone');
    mountExperience($('#stage'), cfg, { fullscreenTarget: phone });
  }

  /* =====================================================================
     Creator
     ===================================================================== */
  function loadDraft() {
    try { return merge(DEFAULTS, JSON.parse(localStorage.getItem(STORE_KEY) || 'null')); } catch (e) { return clone(DEFAULTS); }
  }
  function saveDraft(cfg) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cfg)); return true; } catch (e) { return false; }
  }

  const fmtDate = (s) => {
    const d = new Date(s);
    if (isNaN(d)) return 'Off';
    return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  };
  const fillPreview = (s, c) => String(s || '').replaceAll('{name}', c.name).replaceAll('{emoji}', c.emoji).replaceAll('{bond}', c.bond).replaceAll('{signoff}', c.signoff);

  const ROWS = [
    { key: 'name', icon: '🎉', label: 'Name', scene: 'greeting', value: (c) => `${c.name} ${c.emoji}` },
    { key: 'cake', icon: '🎂', label: 'Cake', scene: 'candle', value: (c) => (Art.CAKES[c.cake] || Art.CAKES.classic).label },
    { key: 'bond', icon: '🤝', label: 'Bond', scene: 'letter', value: (c) => c.bond },
    { key: 'friend', icon: '🧸', label: 'Friend', scene: 'greeting', value: (c) => (Art.FRIENDS[c.friend] || Art.FRIENDS.bunny).label },
    { key: 'timer', icon: '⏰', label: 'Birthday Timer', optional: true, scene: 'countdown', value: (c) => (c.timer.on && c.timer.date ? `Countdown to ${fmtDate(c.timer.date)}` : 'Off') },
    { key: 'passcode', icon: '🔒', label: 'Passcode', optional: true, scene: 'passcode', value: (c) => (c.passcode.on ? 'On · 4-digit code' : 'Add a 4-digit code'), toggle: (c) => c.passcode.on },
    { key: 'balloons', icon: '🎈', label: 'Balloons', scene: 'balloons', value: (c) => c.balloons.join(' ') },
    { key: 'notes', icon: '🌹', label: 'Bouquet notes', scene: 'bouquet', value: (c) => c.notes.map((n) => fillPreview(n, c)).join(' · ') },
    { key: 'letter', icon: '💌', label: 'Letter', scene: 'letter', value: (c) => fillPreview(c.letter, c).replace(/\s+/g, ' ') },
    { key: 'gift', icon: '🎁', label: 'Final surprise', scene: 'gift', value: (c) => (c.photos.length ? `${c.photos.length} photo${c.photos.length > 1 ? 's' : ''} · ${fillPreview(c.finalLine, c)}` : fillPreview(c.finalLine, c)) },
  ];

  function renderCreator() {
    let cfg = loadDraft();
    let currentScene = 'intro';

    $('#app').innerHTML = `
      <div class="creator" data-step="edit">
        <header class="top">
          <button class="icon-btn back only-mobile" aria-label="Back to editing">←</button>
          <h1>Customize</h1>
          <span class="brand">🎂 Birthday Surprise</span>
        </header>
        <main class="grid">
          <section class="panel editor">
            <h2>Make it personal</h2>
            <p class="sub">Choose the details that make it special.</p>
            <div class="rows"></div>
            <div class="tip"><span>📸</span><span>Add up to 5 photos in <b>Final surprise</b></span></div>
            <button class="btn primary wide only-mobile to-preview">Preview <span aria-hidden="true">›</span></button>
          </section>
          <section class="preview">
            <div class="phone"><div class="notch"></div><div class="screen" id="stage"></div></div>
            <div class="dock">
              <div class="chips" role="radiogroup" aria-label="Theme"></div>
              <div class="dock-actions">
                <button class="btn ghost replay">${Art.ICON.replay} Replay</button>
                <button class="btn primary share">Get shareable link</button>
              </div>
            </div>
          </section>
        </main>
        <div class="sheet-bd" aria-hidden="true">
          <form class="sheet" role="dialog" aria-modal="true" novalidate></form>
        </div>
      </div>`;

    const root = $('.creator');
    const rowsEl = $('.rows', root);
    const chipsEl = $('.chips', root);
    const phone = $('.phone', root);
    const stage = $('#stage');
    const sheetBd = $('.sheet-bd', root);
    const sheet = $('.sheet', root);

    const paintRows = () => {
      rowsEl.innerHTML = ROWS.map((r) => `
        <button class="row" data-key="${r.key}">
          ${r.optional ? '<span class="opt">Optional</span>' : ''}
          <span class="ico" aria-hidden="true">${r.icon}</span>
          <span class="lbl">${esc(r.label)}:</span>
          <span class="val">${esc(r.value(cfg))}</span>
          ${r.toggle ? `<span class="mini-toggle ${r.toggle(cfg) ? 'on' : ''}" aria-hidden="true"></span>` : '<span class="chev" aria-hidden="true">›</span>'}
        </button>`).join('');
    };
    const paintChips = () => {
      chipsEl.innerHTML = THEMES.map((t) => `<button class="chip ${cfg.theme === t.id ? 'on' : ''}" role="radio" aria-checked="${cfg.theme === t.id}" data-theme="${t.id}"><span>${t.icon}</span>${t.label}</button>`).join('');
      phone.classList.toggle('phone-night', cfg.theme === 'night');
    };
    const play = (scene) => {
      mountExperience(stage, cfg, { preview: true, scene, fullscreenTarget: phone, onScene: (s) => { currentScene = s; } });
    };
    const commit = (scene) => {
      if (!saveDraft(cfg) && cfg.photos.length) toast('Photos are too big to keep in this browser’s draft. They’ll still be in your link.');
      paintRows();
      paintChips();
      play(scene);
    };

    paintRows();
    paintChips();
    play('intro');

    rowsEl.addEventListener('click', (e) => {
      const row = e.target.closest('.row');
      if (row) openSheet(row.dataset.key);
    });
    chipsEl.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip || chip.dataset.theme === cfg.theme) return;
      cfg.theme = chip.dataset.theme;
      commit(currentScene);
    });
    $('.replay', root).addEventListener('click', () => play('intro'));
    $('.share', root).addEventListener('click', () => openShare(cfg));
    $('.to-preview', root).addEventListener('click', () => { root.dataset.step = 'preview'; window.scrollTo(0, 0); play('intro'); });
    $('.back', root).addEventListener('click', () => { root.dataset.step = 'edit'; });

    /* ---------- edit sheets ---------- */
    let editing = null;
    let draft = null;

    function closeSheet() {
      sheetBd.classList.remove('open');
      sheetBd.setAttribute('aria-hidden', 'true');
      editing = null;
    }
    sheetBd.addEventListener('mousedown', (e) => { if (e.target === sheetBd) closeSheet(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && editing) closeSheet(); });

    function openSheet(key) {
      editing = key;
      draft = clone(cfg);
      const row = ROWS.find((r) => r.key === key);
      sheet.innerHTML = `
        <div class="sheet-head">
          <h3><span aria-hidden="true">${row.icon}</span> ${esc(row.label)}</h3>
          <button type="button" class="icon-btn close" aria-label="Close">✕</button>
        </div>
        <div class="sheet-body">${sheetBody(key, draft)}</div>
        <p class="form-error" role="alert"></p>
        <div class="sheet-foot">
          <button type="button" class="btn ghost cancel">Cancel</button>
          <button type="submit" class="btn primary">Done</button>
        </div>`;
      sheetBd.classList.add('open');
      sheetBd.setAttribute('aria-hidden', 'false');
      $('.close', sheet).onclick = closeSheet;
      $('.cancel', sheet).onclick = closeSheet;
      wireSheet(key, draft);
      const first = sheet.querySelector('input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea');
      if (first && window.matchMedia('(min-width: 900px)').matches) first.focus();
    }

    sheet.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!editing) return;
      const err = readSheet(editing, draft);
      if (err) { $('.form-error', sheet).textContent = err; return; }
      const row = ROWS.find((r) => r.key === editing);
      cfg = draft;
      closeSheet();
      commit(row.scene);
    });

    function sheetBody(key, c) {
      switch (key) {
        case 'name':
          return `
            <label class="field"><span>Their name</span><input name="name" maxlength="24" value="${esc(c.name)}" placeholder="e.g. Laado" required></label>
            <div class="field"><span>Pick an emoji</span>
              <div class="emoji-grid">${EMOJIS.map((em) => `<label class="emo"><input type="radio" name="emoji" value="${em}" ${c.emoji === em ? 'checked' : ''}><span>${em}</span></label>`).join('')}</div>
            </div>`;
        case 'cake':
          return `<div class="choices">${Object.entries(Art.CAKES).map(([k, v]) => `
            <label class="choice"><input type="radio" name="cake" value="${k}" ${c.cake === k ? 'checked' : ''}>
              <span class="choice-art">${Art.cake(k, { candle: true })}</span><span class="choice-lbl">${v.label}</span></label>`).join('')}</div>`;
        case 'bond':
          return `
            <label class="field"><span>How would you describe them?</span><input name="bond" maxlength="70" value="${esc(c.bond)}"></label>
            <div class="sugg">${BONDS.map((b) => `<button type="button" class="sugg-chip" data-v="${esc(b)}">${esc(b)}</button>`).join('')}</div>
            <p class="help">This goes into the letter wherever it says <code>{bond}</code>.</p>`;
        case 'friend':
          return `<div class="choices">${Object.entries(Art.FRIENDS).map(([k, v]) => `
            <label class="choice"><input type="radio" name="friend" value="${k}" ${c.friend === k ? 'checked' : ''}>
              <span class="choice-art emoji-pair">${v.a}${v.b}</span><span class="choice-lbl">${v.label}</span></label>`).join('')}</div>
            <p class="help">These little friends show up throughout the surprise.</p>`;
        case 'timer':
          return `
            <label class="switch-row"><span><b>Lock until their birthday</b><small>They’ll see a countdown until the time you pick.</small></span>
              <input type="checkbox" name="on" class="switch" ${c.timer.on ? 'checked' : ''}></label>
            <label class="field"><span>Birthday date & time</span><input type="datetime-local" name="date" value="${esc(c.timer.date)}"></label>`;
        case 'passcode':
          return `
            <label class="switch-row"><span><b>Protect with a passcode</b><small>They’ll need to enter it before the surprise opens.</small></span>
              <input type="checkbox" name="on" class="switch" ${c.passcode.on ? 'checked' : ''}></label>
            <label class="field"><span>4-digit code</span><input name="code" inputmode="numeric" pattern="\\d{4}" autocomplete="off" value="${esc(c.passcode.code)}" placeholder="e.g. 1402"></label>
            <label class="field"><span>Hint (optional)</span><input name="hint" maxlength="50" value="${esc(c.passcode.hint)}" placeholder="e.g. The day we first met"></label>`;
        case 'balloons':
          return `<p class="help top">Each balloon hides one word. Popping all four reveals your line.</p>
            <div class="two-col">${c.balloons.map((w, i) => `<label class="field"><span>Balloon ${i + 1}</span><input name="b${i}" maxlength="14" value="${esc(w)}"></label>`).join('')}</div>`;
        case 'notes':
          return `<p class="help top">Six little notes that bloom around the bouquet. You can use <code>{name}</code> and <code>{emoji}</code>.</p>
            ${c.notes.map((n, i) => `<label class="field"><span>Note ${i + 1}</span><input name="n${i}" maxlength="40" value="${esc(n)}"></label>`).join('')}`;
        case 'letter':
          return `
            <label class="field"><span>Your letter</span><textarea name="letter" rows="13" maxlength="2000">${esc(c.letter)}</textarea></label>
            <p class="help">Shortcuts: <code>{name}</code> <code>{emoji}</code> <code>{bond}</code> <code>{signoff}</code> <button type="button" class="link-btn reset-letter">Reset to template</button></p>
            <label class="field"><span>Signed by</span><input name="signoff" maxlength="40" value="${esc(c.signoff)}"></label>`;
        case 'gift':
          return `
            <div class="field"><span>Photos (up to 5)</span>
              <div class="photo-grid"></div>
              <p class="help">Photos are shrunk and packed into the link, so more photos means a longer link.</p>
            </div>
            <label class="field"><span>Big line</span><input name="finalLine" maxlength="40" value="${esc(c.finalLine)}"></label>
            <label class="field"><span>Small line</span><input name="finalSub" maxlength="60" value="${esc(c.finalSub)}"></label>`;
      }
      return '';
    }

    function wireSheet(key, c) {
      if (key === 'bond') {
        sheet.querySelectorAll('.sugg-chip').forEach((b) => b.addEventListener('click', () => { sheet.elements.bond.value = b.dataset.v; }));
      }
      if (key === 'letter') {
        $('.reset-letter', sheet).addEventListener('click', () => { sheet.elements.letter.value = LETTER; });
      }
      if (key === 'passcode') {
        sheet.elements.code.addEventListener('input', (e) => {
          e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
          if (e.target.value) sheet.elements.on.checked = true;
        });
      }
      if (key === 'timer') {
        sheet.elements.date.addEventListener('change', () => { if (sheet.elements.date.value) sheet.elements.on.checked = true; });
      }
      if (key === 'gift') {
        const grid = $('.photo-grid', sheet);
        const paint = () => {
          grid.innerHTML = c.photos.map((p, i) => `<div class="ph"><img src="${p}" alt=""><button type="button" data-i="${i}" aria-label="Remove photo">✕</button></div>`).join('') +
            (c.photos.length < 5 ? `<label class="ph add"><input type="file" accept="image/*" multiple hidden><span>＋<small>Add</small></span></label>` : '');
          const input = grid.querySelector('input[type=file]');
          if (input) input.addEventListener('change', async () => {
            const files = [...input.files].slice(0, 5 - c.photos.length);
            for (const f of files) {
              try { c.photos.push(await shrink(f)); } catch (e) { toast('Couldn’t read one of those images.'); }
            }
            paint();
          });
        };
        grid.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-i]');
          if (b) { c.photos.splice(+b.dataset.i, 1); paint(); }
        });
        paint();
      }
    }

    function readSheet(key, c) {
      const f = sheet.elements;
      const v = (n) => (f[n] ? f[n].value.trim() : '');
      switch (key) {
        case 'name':
          if (!v('name')) return 'Please add their name.';
          c.name = v('name');
          c.emoji = (sheet.querySelector('input[name=emoji]:checked') || {}).value || c.emoji;
          break;
        case 'cake': c.cake = sheet.querySelector('input[name=cake]:checked').value; break;
        case 'bond':
          if (!v('bond')) return 'Add a few words about them.';
          c.bond = v('bond');
          break;
        case 'friend': c.friend = sheet.querySelector('input[name=friend]:checked').value; break;
        case 'timer':
          c.timer.on = f.on.checked;
          c.timer.date = v('date');
          if (c.timer.on && !c.timer.date) return 'Pick a date and time for the countdown.';
          if (c.timer.on && new Date(c.timer.date).getTime() <= Date.now()) return 'That time has already passed. Pick a time in the future.';
          break;
        case 'passcode':
          c.passcode.on = f.on.checked;
          c.passcode.code = v('code');
          c.passcode.hint = v('hint');
          if (c.passcode.on && !/^\d{4}$/.test(c.passcode.code)) return 'The passcode needs exactly 4 digits.';
          break;
        case 'balloons': c.balloons = [0, 1, 2, 3].map((i) => v('b' + i)); break;
        case 'notes': c.notes = [0, 1, 2, 3, 4, 5].map((i) => v('n' + i)).filter(Boolean); if (!c.notes.length) return 'Add at least one note.'; break;
        case 'letter':
          if (!v('letter')) return 'The letter can’t be empty.';
          c.letter = f.letter.value.replace(/\r/g, '').trim();
          c.signoff = v('signoff');
          break;
        case 'gift':
          c.finalLine = v('finalLine') || DEFAULTS.finalLine;
          c.finalSub = v('finalSub');
          break;
      }
      return '';
    }
  }

  /* Downscale an image file to a small JPEG data URL so it fits in a link. */
  function shrink(file, max = 520, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      img.src = url;
    });
  }

  /* ---------- share dialog ---------- */
  async function openShare(cfg) {
    const data = await encode(cfg);
    const url = `${location.origin}${location.pathname}#s=${data}`;
    const local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    const short = url.length < 2300;
    const bd = document.createElement('div');
    bd.className = 'sheet-bd open';
    bd.innerHTML = `
      <div class="sheet share-sheet" role="dialog" aria-modal="true" aria-label="Share your surprise">
        <div class="sheet-head"><h3>🎁 Your surprise is ready</h3><button class="icon-btn close" aria-label="Close">✕</button></div>
        <p class="help top">Send this link to ${esc(cfg.name)}. Everything is inside the link itself, so there’s nothing to sign up for.</p>
        ${local ? '<p class="warn">You’re running this on your own computer, so the link only opens here. Put the folder online (Netlify, Vercel, GitHub Pages…) and the links will work for anyone.</p>' : ''}
        <div class="link-box"><input readonly value="${esc(url)}" aria-label="Share link"><button class="btn primary copy">Copy</button></div>
        <p class="help">${url.length.toLocaleString()} characters${cfg.photos.length ? ` · includes ${cfg.photos.length} photo${cfg.photos.length > 1 ? 's' : ''}` : ''}</p>
        <div class="share-actions">
          <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`🎂 I made something for you! Open it: ${url}`)}">Send on WhatsApp</a>
          ${navigator.share ? '<button class="btn ghost native">More options…</button>' : ''}
          <a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">Open it</a>
        </div>
        ${short ? `<div class="share-qr"><div>${Art.qr(url, '#1b0f1f')}</div><p class="help">Or let them scan this</p></div>` : (cfg.photos.length ? '<p class="help">The link is too long for a QR code because of the photos.</p>' : '')}
      </div>`;
    document.body.appendChild(bd);
    const close = () => bd.remove();
    bd.addEventListener('mousedown', (e) => { if (e.target === bd) close(); });
    bd.querySelector('.close').onclick = close;
    const input = bd.querySelector('input');
    bd.querySelector('.copy').onclick = async (e) => {
      try { await navigator.clipboard.writeText(url); } catch (err) { input.select(); document.execCommand('copy'); }
      e.target.textContent = 'Copied ✓';
      setTimeout(() => { e.target.textContent = 'Copy'; }, 1800);
    };
    const native = bd.querySelector('.native');
    if (native) native.onclick = () => navigator.share({ title: `A surprise for ${cfg.name}`, text: '🎂 I made something for you!', url }).catch(() => {});
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3700);
  }

  /* ---------- routing ---------- */
  function route() {
    if (exp) { exp.destroy(); exp = null; }
    music.stop();
    const m = location.hash.match(/^#s=(.+)$/);
    const baked = window.BAKED_SURPRISE;
    document.body.classList.toggle('is-recipient', !!(m || baked));
    if (m) renderRecipient(m[1]);
    else if (baked) renderRecipient(baked);
    else renderCreator();
  }
  window.addEventListener('hashchange', route);
  route();
})();
