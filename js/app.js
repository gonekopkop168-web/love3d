(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app'), body = document.body;
  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem('mkh_' + k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem('mkh_' + k, JSON.stringify(v)); } catch {} }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const find = id => MANGA.find(m => m.id === id);
  const progress = () => store.get('progress', {});   // {mangaId:{ch,page}}
  const readSet = () => store.get('read', {});        // {mangaId:[ch,...]}
  let cleanup = null;

  /* ---------- theme ---------- */
  const themeBtn = $('#theme');
  const setTheme = t => { document.documentElement.dataset.theme = t; themeBtn.textContent = t === 'light' ? '☀️' : '🌙'; store.set('theme', t); };
  setTheme(store.get('theme', matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  themeBtn.onclick = () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- scroll-to-top ---------- */
  const fab = $('#toTop');
  addEventListener('scroll', () => fab.classList.toggle('show', scrollY > 600), { passive: true });
  fab.onclick = () => scrollTo({ top: 0 });

  /* ---------- home ---------- */
  function card(m) {
    const last = m.chapters[m.chapters.length - 1];
    return `<a class="card" href="#/manga/${m.id}"><div class="im"><img src="${m.cover}" alt="${esc(m.title)}" loading="lazy"><span class="badge">ជំពូក ${last.n}</span></div>
      <div class="in"><h3>${esc(m.title)}</h3><small>⭐ ${m.rating} · ${esc(m.status)}</small></div></a>`;
  }
  function home(query = '') {
    const q = query.trim().toLowerCase();
    const list = MANGA.filter(m => !q || (m.title + m.genre.join(' ')).toLowerCase().includes(q));
    const f = MANGA[0], p = progress()[f.id];
    const hero = !q && f ? `<section class="hero"><img src="${f.cover}" alt="${esc(f.title)}">
      <div><div class="tags">${f.genre.map(g => `<span class="tag">${esc(g)}</span>`).join('')}</div>
      <h1>${esc(f.title)}</h1><p>${esc(f.desc)}</p>
      <div class="row"><a class="btn" href="#/read/${f.id}/${p ? p.ch : f.chapters[0].n}">▶ ${p ? 'អានបន្ត' : 'ចាប់ផ្តើមអាន'}</a>
      <a class="btn ghost" href="#/manga/${f.id}">ព័ត៌មានលម្អិត</a></div></div></section>` : '';
    const soon = !q ? `<div class="card soon"><div class="im">⏳</div><div class="in"><h3>ឆាប់ៗនេះ...</h3><small>មង់ហ្គាថ្មី</small></div></div>` : '';
    app.innerHTML = hero + `<h2 class="sec">${q ? 'លទ្ធផលស្វែងរក' : 'មង់ហ្គាថ្មីៗ'}</h2>` +
      (list.length ? `<div class="grid">${list.map(card).join('')}${soon}</div>` : `<p class="empty">រកមិនឃើញលទ្ធផលទេ 😢</p>`);
  }

  /* ---------- detail ---------- */
  function detail(id) {
    const m = find(id); if (!m) return home();
    const done = readSet()[id] || [], p = progress()[id];
    const chs = [...m.chapters].reverse().map(c => `<a class="ch ${done.includes(c.n) ? 'read' : ''}" href="#/read/${id}/${c.n}">
      <span>ជំពូកទី ${c.n} — ${esc(c.title)}</span><small>${c.pages.length} ទំព័រ · ${c.date}</small></a>`).join('');
    document.title = m.title + ' — MangaKH';
    app.innerHTML = `<section class="detail"><img src="${m.cover}" alt="${esc(m.title)}"><div>
      <h1>${esc(m.title)}</h1><div class="tags">${m.genre.map(g => `<span class="tag">${esc(g)}</span>`).join('')}</div>
      <div class="meta"><span>✍️ ${esc(m.author)}</span><span>⭐ ${m.rating}</span><span>📌 ${esc(m.status)}</span><span>📚 ${m.chapters.length} ជំពូក</span></div>
      <p style="color:var(--mute);margin-bottom:18px">${esc(m.desc)}</p>
      <div class="row"><a class="btn" href="#/read/${id}/${m.chapters[0].n}">▶ អានជំពូកដំបូង</a>
      ${p ? `<a class="btn ghost" href="#/read/${id}/${p.ch}">អានបន្ត (ជំពូក ${p.ch})</a>` : ''}</div></div></section>
      <h2 class="sec">បញ្ជីជំពូក</h2><div class="chs">${chs}</div>`;
  }

  /* ---------- reader ---------- */
  function reader(id, n) {
    const m = find(id), idx = m ? m.chapters.findIndex(c => c.n === n) : -1;
    if (idx < 0) return (location.hash = '#/');
    const ch = m.chapters[idx], prev = m.chapters[idx - 1], next = m.chapters[idx + 1], total = ch.pages.length;
    let mode = store.get('mode', 'scroll'), width = store.get('width', 800), cur = 0, hidden = false;
    const saved = progress()[id];
    if (saved && saved.ch === n) cur = Math.min(saved.page, total - 1);
    body.classList.add('reading');
    document.title = `${m.title} · ជំពូក ${n}`;

    app.innerHTML = `<div class="prog" id="prog"></div>
      <div class="rbar t" id="tb"><a class="rb" href="#/manga/${id}">←</a><span class="ttl">${esc(m.title)} · ជំពូក ${n}</span></div>
      <div id="view"></div>
      <div class="end" id="end"><h3>${next ? '✅ ចប់ជំពូកទី ' + n : '🎉 ចប់ជំពូកចុងក្រោយ'}</h3>
        <div class="row" style="justify-content:center">${next ? `<a class="btn" href="#/read/${id}/${next.n}">ជំពូកបន្ទាប់ →</a>` : '<span style="color:var(--mute)">ជំពូកថ្មីៗនឹងមកដល់ឆាប់ៗនេះ</span>'}
        <a class="btn ghost" href="#/manga/${id}">បញ្ជីជំពូក</a></div></div>
      <div class="rbar b" id="bb">
        <button class="rb" id="bp" ${prev ? '' : 'disabled'}>⏮ ជំពូក</button>
        <button class="rb" id="pp">◀</button><span class="pg" id="pg"></span><button class="rb" id="pn">▶</button>
        <button class="rb" id="bn" ${next ? '' : 'disabled'}>ជំពូក ⏭</button>
        <button class="rb" id="md"></button>
        <button class="rb wbtn" id="wm">➖</button><button class="rb wbtn" id="wp">➕</button>
        <button class="rb" id="fs">⛶</button></div>`;

    const view = $('#view'), pg = $('#pg'), tb = $('#tb'), bb = $('#bb'), end = $('#end');
    const applyWidth = () => document.documentElement.style.setProperty('--w', width + 'px');
    const go = c => location.hash = `#/read/${id}/${c.n}`;
    const save = () => {
      const p = progress(); p[id] = { ch: n, page: cur }; store.set('progress', p);
      if (cur >= total - 1) { const r = readSet(); r[id] = [...new Set([...(r[id] || []), n])]; store.set('read', r); }
    };
    const label = () => { pg.textContent = `${cur + 1} / ${total}`; $('#md').textContent = mode === 'scroll' ? '📜 រមូរ' : '📄 ទំព័រ'; };
    const toggleBars = v => { hidden = v ?? !hidden; tb.classList.toggle('hide', hidden); bb.classList.toggle('hide', hidden); };

    let io;
    function draw() {
      io && io.disconnect(); applyWidth();
      end.style.display = mode === 'scroll' ? '' : 'none';
      if (mode === 'scroll') {
        view.className = 'reader';
        view.innerHTML = ch.pages.map((s, i) => `<img data-i="${i}" src="${s}" alt="ទំព័រ ${i + 1}" ${i > 1 ? 'loading="lazy"' : ''} decoding="async">`).join('');
        view.querySelectorAll('img').forEach(im => im.onload = () => im.classList.add('ok'));
        io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { cur = +e.target.dataset.i; label(); save(); } }), { rootMargin: '-45% 0px -45% 0px' });
        view.querySelectorAll('img').forEach(im => io.observe(im));
        const t = view.children[cur]; if (t && cur > 0) t.scrollIntoView();
      } else {
        view.className = 'reader paged';
        show();
      }
      label();
    }
    function show() {
      view.innerHTML = `<img class="ok" src="${ch.pages[cur]}" alt="ទំព័រ ${cur + 1}">`;
      [cur + 1, cur + 2].forEach(i => { if (ch.pages[i]) new Image().src = ch.pages[i]; });
      scrollTo({ top: 0 }); label(); save();
    }
    const step = d => {
      if (mode === 'scroll') { const t = view.children[Math.max(0, Math.min(total - 1, cur + d))]; t && t.scrollIntoView({ behavior: 'smooth' }); return; }
      const nx = cur + d;
      if (nx < 0) return prev && go(prev);
      if (nx >= total) return next ? go(next) : toggleBars(false);
      cur = nx; show();
    };
    const setW = d => { width = Math.max(400, Math.min(1400, width + d)); store.set('width', width); applyWidth(); };

    $('#pp').onclick = () => step(-1); $('#pn').onclick = () => step(1);
    $('#bp').onclick = () => prev && go(prev); $('#bn').onclick = () => next && go(next);
    $('#wm').onclick = () => setW(-100); $('#wp').onclick = () => setW(100);
    $('#md').onclick = () => { mode = mode === 'scroll' ? 'page' : 'scroll'; store.set('mode', mode); draw(); };
    $('#fs').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
    view.onclick = e => {
      if (mode === 'scroll') return toggleBars();
      const x = e.clientX / innerWidth;
      x < .33 ? step(-1) : x > .67 ? step(1) : toggleBars();
    };
    const onKey = e => {
      if (e.key === 'ArrowRight') mode === 'page' ? step(1) : next && e.shiftKey && go(next);
      else if (e.key === 'ArrowLeft') mode === 'page' ? step(-1) : prev && e.shiftKey && go(prev);
      else if (e.key === 'f') $('#fs').click();
    };
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      $('#prog').style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
    };
    let lastY = 0;
    const autoHide = () => { if (mode !== 'scroll') return; const y = scrollY; if (Math.abs(y - lastY) > 40) { toggleBars(y > lastY); lastY = y; } };
    addEventListener('keydown', onKey); addEventListener('scroll', onScroll, { passive: true }); addEventListener('scroll', autoHide, { passive: true });
    cleanup = () => {
      removeEventListener('keydown', onKey); removeEventListener('scroll', onScroll); removeEventListener('scroll', autoHide);
      io && io.disconnect(); body.classList.remove('reading'); document.documentElement.style.removeProperty('--w');
    };
    draw(); scrollTo({ top: 0 }); if (mode === 'scroll' && cur > 0) view.children[cur]?.scrollIntoView();
  }

  /* ---------- router ---------- */
  function route() {
    cleanup && (cleanup(), cleanup = null);
    const [, page, a, b] = location.hash.split('/');
    document.title = 'MangaKH — អានកំប្លែងខ្មែរ';
    if (page === 'manga') detail(a);
    else if (page === 'read') reader(a, +b);
    else home($('#q').value);
    if (page !== 'read') scrollTo({ top: 0 });
  }
  $('#q').addEventListener('input', () => { if (location.hash && location.hash !== '#/') location.hash = '#/'; else home($('#q').value); });
  addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) { /* optional: add a service worker for offline */ }
})();
