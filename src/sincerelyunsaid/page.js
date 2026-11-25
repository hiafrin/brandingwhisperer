/* Sincerely Unsaid page behaviour. Runs against the markup in markup.html once
   it is in the page; returns a function that undoes everything it set up. */
export function initPage(root, SU) {
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, RM ? 0 : ms); }); }
  function $(id) { return document.getElementById(id); }
  var M = SU.messages, ac = new AbortController(), dead = false, observers = [];

  /* episodes and questions are written in content.js */
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  SU.episodes.forEach(function (ep, i) {
    var a = el('a', 'ep'); a.href = ep.link;
    if (/^https?:/.test(ep.link)) { a.target = '_blank'; a.rel = 'noopener'; }
    a.appendChild(el('span', 'n', i + 1)); a.appendChild(el('span', 'who', ep.who)); a.appendChild(el('span', 'what', ep.what));
    $('eps').appendChild(a);
  });
  SU.questions.forEach(function (it, i) {
    var d = el('details'); d.open = !i;
    d.appendChild(el('summary', '', it.q)); d.appendChild(el('p', '', it.a));
    $('qs').appendChild(d);
  });

  /* keep the page at the top on load, and move between studies without touching the address */
  var restore = null;
  try { if ('scrollRestoration' in history) { restore = history.scrollRestoration; history.scrollRestoration = 'manual'; } } catch (e) {}
  function toTop() { if (!touched && !dead) window.scrollTo(0, 0); }
  var touched = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true, signal: ac.signal });
  });
  toTop(); window.addEventListener('load', toTop, { signal: ac.signal }); setTimeout(toTop, 400); setTimeout(toTop, 1200);
  document.querySelectorAll('[data-jump]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); touched = true;
      var t = document.querySelector(a.getAttribute('href'));
      if (t && t.tagName === 'DETAILS') t.open = true;
      if (t) t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* opening: sealed letter */
  var intro = $('top'), opening = $('opening'), env = $('env'), letter = $('letter'), flap = $('flap'), seal = $('seal'), lword = $('lword'), lword2 = $('lword2');
  var og = 0;
  function openFinal() { intro.classList.add('opened'); opening.classList.add('done'); root.classList.add('opened'); try { sessionStorage.setItem('su-opened', '1'); } catch (e) {} if (heroVid && !RM) { try { heroVid.currentTime = 0; } catch (e) {} } heroPlay(); }
  async function playOpening() {
    var g = ++og, alive = function () { return og === g; };
    if (letter.getAnimations) { letter.getAnimations().forEach(function (a) { a.cancel(); }); lword.getAnimations().forEach(function (a) { a.cancel(); }); lword2.getAnimations().forEach(function (a) { a.cancel(); }); }
    letter.style.zIndex = ''; flap.style.zIndex = ''; seal.style.opacity = '';
    env.classList.remove('open', 'pulse', 'leaving', 'in');
    intro.classList.remove('opened'); opening.classList.remove('done'); root.classList.remove('opened');
    if (RM || !letter.animate) { openFinal(); return; }
    void env.offsetWidth;
    env.classList.add('in');
    await sleep(1000); if (!alive()) return;
    env.classList.add('pulse');
    await sleep(1150); if (!alive()) return;
    env.classList.add('open');
    await sleep(430); if (!alive()) return;
    flap.style.zIndex = '1'; seal.style.opacity = '0';
    await sleep(600); if (!alive()) return;
    var ease = 'cubic-bezier(.6,0,.2,1)';
    letter.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-55%)' }], { duration: 800, easing: ease, fill: 'forwards' });
    lword2.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 550, delay: 200, easing: 'ease-out', fill: 'forwards' });
    await sleep(1300); if (!alive()) return;
    var o = opening.getBoundingClientRect(), r = letter.getBoundingClientRect();
    var dx = (o.left + o.width / 2) - (r.left + r.width / 2), dy = (o.top + o.height / 2) - (r.top + r.height / 2);
    var sc = Math.max(o.width / r.width, o.height / r.height) * 1.2;
    letter.style.zIndex = '6';
    env.classList.add('leaving');
    lword.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-in', fill: 'forwards' });
    letter.animate([{ transform: 'translateY(-55%)' }, { transform: 'translate(' + dx + 'px,' + (-0.55 * r.height + dy) + 'px) scale(' + sc + ')' }], { duration: 950, easing: ease, fill: 'forwards' });
    await sleep(950); if (!alive()) return;
    openFinal();
  }
  var heroVid = $('herovid'), heroBtn = $('herobtn'), heroSeen = true, heroOff = false;
  function heroPlay() {
    if (!heroVid || RM) return;
    if (heroSeen && !heroOff && root.classList.contains('opened')) { heroVid.muted = true; var pr = heroVid.play(); if (pr && pr.catch) pr.catch(function () {}); }
    else heroVid.pause();
  }
  if (heroBtn) {
    if (RM || !heroVid) heroBtn.hidden = true;
    heroBtn.addEventListener('click', function () {
      heroOff = !heroOff; heroBtn.classList.toggle('off', heroOff);
      heroBtn.setAttribute('aria-label', heroOff ? 'Play video' : 'Pause video'); heroPlay();
    });
  }
  if (heroVid && 'IntersectionObserver' in window) { var hio = new IntersectionObserver(function (es) { heroSeen = es[es.length - 1].isIntersecting; heroPlay(); }); hio.observe(heroVid); observers.push(hio); }
  opening.addEventListener('click', function () { og++; openFinal(); });
  document.querySelector('.intro .title').addEventListener('click', playOpening);
  var seenOpening = false;
  try { seenOpening = sessionStorage.getItem('su-opened') === '1'; } catch (e) {}
  if (seenOpening) openFinal(); else playOpening();

  /* segment transitions: build a flap on each segment in the colour of the one above, then open it with scroll */
  var bands = [].slice.call(document.querySelectorAll('.band, .ftr'));
  var flapped = [];
  bands.forEach(function (b, i) {
    if (!i) return;
    var f = document.createElement('div');
    f.className = 'sflap'; f.setAttribute('aria-hidden', 'true');
    f.innerHTML = '<div class="shape"></div>';
    f.firstChild.style.background = getComputedStyle(bands[i - 1]).backgroundColor;
    b.insertBefore(f, b.firstChild);
    flapped.push(b);
  });
  var ticking = false;
  function setProgress() {
    ticking = false;
    setWhy();
    var vh = window.innerHeight;
    flapped.forEach(function (b) {
      var top = b.getBoundingClientRect().top;
      var span = Math.min(vh * 0.62, b.offsetHeight * 0.9);
      var v = RM ? 1 : Math.max(0, Math.min(1, (vh - top) / span));
      b.style.setProperty('--p', v.toFixed(3));
    });
  }
  /* why this exists: the sequence is tied to how far the pinned section has been scrolled */
  var whyEl = $('why'), eF = [].slice.call($('e-lines').querySelectorAll('.f')), eFinal = $('e-final'), eWhy = $('e-why');
  var pinned = !RM && !!(window.CSS && CSS.supports && CSS.supports('position', 'sticky'));
  if (pinned) root.classList.add('pin');
  var steps = [[0.05, 0.10], [0.14, 0.19], [0.23, 0.28], [0.30, 0.35], [0.37, 0.47]];
  function ramp(q, a, b) { return Math.max(0, Math.min(1, (q - a) / (b - a))); }
  function setWhy() {
    if (!pinned) return;
    var r = whyEl.getBoundingClientRect(), total = r.height - window.innerHeight;
    var q = total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 1;
    var out = 1 - ramp(q, 0.52, 0.58);
    eF.forEach(function (el, i) {
      var o = ramp(q, steps[i][0], steps[i][1]);
      el.style.opacity = (o * out).toFixed(3);
      if (el.tagName === 'P') el.style.transform = 'translateY(' + ((1 - o) * 12).toFixed(1) + 'px)';
    });
    var fi = ramp(q, 0.61, 0.68);
    eFinal.style.opacity = (fi * (1 - ramp(q, 0.77, 0.83))).toFixed(3);
    eFinal.style.transform = 'translateY(' + ((1 - fi) * 12).toFixed(1) + 'px)';
    var wo = ramp(q, 0.86, 0.94);
    eWhy.style.opacity = wo.toFixed(3);
    eWhy.style.transform = 'translateY(' + ((1 - wo) * 12).toFixed(1) + 'px)';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(setProgress); } }
  window.addEventListener('scroll', onScroll, { passive: true, signal: ac.signal });
  window.addEventListener('resize', onScroll, { signal: ac.signal });
  setProgress();

  /* submit section: tabs, word count, voice file, sending */
  (function () {
    var tabs = [].slice.call(document.querySelectorAll('.tab'));
    function select(t) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        $(x.getAttribute('aria-controls')).hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (j === null) return; j = (j + tabs.length) % tabs.length; tabs[j].focus(); select(tabs[j]);
      });
    });
    var body = $('l-body'), count = $('l-count');
    body.addEventListener('input', function () { count.textContent = body.value.trim().split(/\s+/).filter(Boolean).length; });
    var file = $('v-file'), drop = $('v-drop'), ft = $('v-file-text');
    var promptHTML = ft.innerHTML;
    function refuse(msg) { file.value = ''; drop.classList.remove('has'); drop.classList.add('bad'); ft.textContent = msg; }
    file.addEventListener('change', function () {
      var f = file.files[0];
      drop.classList.remove('has', 'bad');
      if (!f) { ft.innerHTML = promptHTML; return; }
      var isAudio = /^audio\//.test(f.type) || (!f.type && /\.(m4a|mp3|wav|aac|ogg|oga|opus|amr|flac|caf)$/i.test(f.name));
      if (!isAudio) { refuse(M.notAudio); return; }
      if (f.size > SU.maxAudioBytes) { refuse(M.tooBig); return; }
      drop.classList.add('has'); ft.textContent = f.name + ' is ready to send.';
      /* length check, when the browser can read it */
      try {
        var url = URL.createObjectURL(f), probe = new Audio();
        probe.preload = 'metadata';
        probe.onloadedmetadata = function () {
          URL.revokeObjectURL(url);
          if (file.files[0] === f && isFinite(probe.duration) && probe.duration > SU.maxAudioSeconds + 5) refuse(M.tooLong);
        };
        probe.onerror = function () { URL.revokeObjectURL(url); };
        probe.src = url;
      } catch (e) {}
    });
    ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); }); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files.length) { file.files = e.dataTransfer.files; file.dispatchEvent(new Event('change')); } });
    function readAudio(file) {
      return new Promise(function (ok, no) {
        var fr = new FileReader();
        fr.onload = function () { ok(String(fr.result).split(',')[1] || ''); };
        fr.onerror = no; fr.readAsDataURL(file);
      });
    }
    /* sending: each form posts to SU.endpoint and shows its result inside the card */
    [].slice.call(document.querySelectorAll('.card form')).forEach(function (f) {
      var kind = f.getAttribute('data-kind'), btn = f.querySelector('.send'), status = f.querySelector('.status');
      var label = btn.textContent, busy = false, sent = null;
      var nameIn = f.querySelector('input[name="name"]'), hint = f.querySelector('[data-namehint]');
      function syncName() {
        var s = f.querySelector('input[name="sign"]:checked');
        if (!s || !hint) return;
        var anon = s.value === 'anon';
        nameIn.required = !anon; hint.hidden = !anon; hint.textContent = M.nameOptional;
      }
      [].slice.call(f.querySelectorAll('input[name="sign"]')).forEach(function (r) { r.addEventListener('change', syncName); });
      syncName();
      function showSent() {
        if (!sent) {
          sent = document.createElement('div'); sent.className = 'sent'; sent.tabIndex = -1;
          var h = document.createElement('h3'), p = document.createElement('p'), b = document.createElement('button');
          h.textContent = M.sent[kind].title; p.textContent = M.sent[kind].body;
          b.type = 'button'; b.textContent = M.again;
          b.addEventListener('click', function () {
            f.reset(); syncName(); count.textContent = '0';
            drop.classList.remove('has', 'bad'); ft.innerHTML = promptHTML;
            sent.hidden = true; f.hidden = false;
          });
          sent.appendChild(h); sent.appendChild(p); sent.appendChild(b);
          f.parentNode.appendChild(sent);
        }
        f.hidden = true; sent.hidden = false; sent.focus();
      }
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;
        var data = { kind: kind, consent_at: new Date().toISOString() };
        [].slice.call(f.elements).forEach(function (c) {
          if (!c.name || c.type === 'file' || c.type === 'submit') return;
          if (c.type === 'checkbox') data[c.name] = c.checked ? 'yes' : 'no';
          else if (c.type !== 'radio' || c.checked) data[c.name] = c.value;
        });
        var picker = f.querySelector('input[type=file]'), audio = picker && picker.files[0];
        busy = true; btn.disabled = true; btn.textContent = M.sending; status.hidden = true;
        (audio ? readAudio(audio) : Promise.resolve(null)).then(function (b64) {
          if (b64) { data.audio_name = audio.name; data.audio_type = audio.type; data.audio_base64 = b64; }
          return fetch(SU.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        }).then(function (r) {
          if (!r.ok) { var er = new Error('send failed'); er.status = r.status; throw er; }
          showSent();
        }).catch(function (er) {
          /* the form is left exactly as typed */
          status.textContent = er && er.status === 429 ? M.tooMany : M.failed; status.hidden = false;
        }).then(function () { busy = false; btn.disabled = false; btn.textContent = label; });
      });
    });
  })();

  /* unveil */
  root.classList.add('js');
  [].slice.call(document.querySelectorAll('.seg .h2')).forEach(function (h) {
    var m = document.createElement('span'); m.className = 'hm';
    while (h.firstChild) m.appendChild(h.firstChild);
    h.appendChild(m); h.classList.add('rv', 'rv-h');
  });
  var rvEls = [].slice.call(document.querySelectorAll('.seg .subhead, .ep, .card, .qs details, .ftr .listen, .copyr'));
  rvEls.forEach(function (el) { el.classList.add('rv'); });
  rvEls = rvEls.concat([].slice.call(document.querySelectorAll('.rv-h')));
  if ('IntersectionObserver' in window && !RM) {
    var rio = new IntersectionObserver(function (entries) {
      var k = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--d', k + 'ms');
        k += 90;
        e.target.classList.add('in'); rio.unobserve(e.target);
      });
    }, { threshold: 0.05 });
    rvEls.forEach(function (el) { rio.observe(el); });
    observers.push(rio);
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  return function cleanup() {
    dead = true; og++; ac.abort();
    observers.forEach(function (o) { o.disconnect(); });
    try { if (restore) history.scrollRestoration = restore; } catch (e) {}
  };
}
