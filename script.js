/* ─────────────────────────────────────────────────────────────────────
   GIBRAN ALCOCER — IDEA XIX, A LISTENING ROOM.
   The music conducts the page.
   ─────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body    = document.body;

  const film     = document.getElementById('film');
  const filmSrc  = document.getElementById('filmSrc');
  const track    = document.getElementById('track');
  const enterBtn = document.getElementById('enter');
  const skipLink = document.getElementById('skip');
  const replayBt = document.getElementById('replay');
  const timeEl   = document.getElementById('time');
  const wave     = document.getElementById('wave');

  // serve smaller video on mobile
  if (window.innerWidth <= 760 && filmSrc) {
    filmSrc.src = 'media/gibran-720.mp4';
    film.load();
  }

  // give ideas list staggered indexes for transition delay
  document.querySelectorAll('.ideaslist li').forEach((li, i) => {
    li.style.setProperty('--idx', i);
  });

  /* ────────────────────────────────────────────────
     CUE LIST — pegged to the music's 207s duration.
     Each cue is one intertitle slot; only ONE visible
     at a time during listening.
     ──────────────────────────────────────────────── */
  // [start, end, cue-name, optional fadeOut-grace]
  const cues = [
    [   8,   28, 'masthead'   ],   // corner masthead + counter (latch on)
    [  28,   60, 'dedication' ],   // "For one listener."
    [  62,  108, 'bio'        ],   // bio sentence
    [ 110,  168, 'ideas'      ],   // ideas list (10 items, staggered)
    [ 170,  198, 'quote'      ],   // the quote
    [ 200,  207, 'silence'    ],   // closing
  ];

  // masthead is a "latch" — once on, stays on
  const latchCues = new Set(['masthead']);

  function applyCue(name) {
    document.querySelectorAll('.intertitle').forEach(el => {
      el.classList.toggle('is-on', el.dataset.cue === name);
    });
  }
  function setLatched(currentTime) {
    // turn on any latch cue whose start has passed
    cues.forEach(([s, , n]) => {
      if (latchCues.has(n) && currentTime >= s) {
        document.querySelectorAll(`[data-cue="${n}"]`).forEach(el => el.classList.add('is-on'));
      }
    });
  }

  function tickCues() {
    if (!body.classList.contains('state-listening')) return;
    const t = track.currentTime;
    setLatched(t);

    // active intertitle (excluding latch cues, which are not intertitles here)
    let activeName = null;
    for (const [s, e, n] of cues) {
      if (latchCues.has(n)) continue;
      if (t >= s && t < e) { activeName = n; break; }
    }
    applyCue(activeName); // null → all intertitles fade out
  }

  /* ────────────────────────────────────────────────
     TIME COUNTER
     ──────────────────────────────────────────────── */
  function fmt(t){
    if (!isFinite(t)) t = 0;
    const m = String(Math.floor(t / 60)).padStart(2, '0');
    const s = String(Math.floor(t % 60)).padStart(2, '0');
    return `${m}:${s}`;
  }
  function updateTime() {
    if (!timeEl) return;
    const dur = isFinite(track.duration) ? track.duration : 207;
    timeEl.textContent = `${fmt(track.currentTime)} / ${fmt(dur)}`;
  }

  /* ────────────────────────────────────────────────
     LIVE WAVEFORM — WebAudio FFT into canvas hairline
     ──────────────────────────────────────────────── */
  let audioCtx, analyser, dataArr;
  const ctxCanvas = wave.getContext('2d', { alpha:true });
  let dpr = Math.min(2, window.devicePixelRatio || 1);

  function sizeCanvas() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    wave.width  = wave.clientWidth  * dpr;
    wave.height = wave.clientHeight * dpr;
  }
  window.addEventListener('resize', sizeCanvas);

  function setupAudioGraph() {
    if (audioCtx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
      const src = audioCtx.createMediaElementSource(track);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      dataArr = new Uint8Array(analyser.fftSize);
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch (e) {
      // analyser not available; carry on without waveform viz
      console.warn('AudioContext unavailable', e);
    }
  }

  function drawWave() {
    if (!ctxCanvas) return;
    const w = wave.width, h = wave.height;
    ctxCanvas.clearRect(0, 0, w, h);

    if (!analyser || !dataArr) return;
    if (!body.classList.contains('state-listening')) return;

    analyser.getByteTimeDomainData(dataArr);

    ctxCanvas.lineWidth = 1 * dpr;
    ctxCanvas.strokeStyle = 'rgba(242, 235, 224, 0.78)';
    ctxCanvas.shadowColor = 'rgba(242, 235, 224, 0.25)';
    ctxCanvas.shadowBlur = 8 * dpr;
    ctxCanvas.beginPath();

    const slice = w / dataArr.length;
    let x = 0;
    for (let i = 0; i < dataArr.length; i++) {
      const v = dataArr[i] / 128.0;        // 0..2
      const y = (v * h) / 2;
      if (i === 0) ctxCanvas.moveTo(x, y);
      else         ctxCanvas.lineTo(x, y);
      x += slice;
    }
    ctxCanvas.stroke();
  }

  function loop() {
    drawWave();
    if (timeEl) updateTime();
    tickCues();
    requestAnimationFrame(loop);
  }

  /* ────────────────────────────────────────────────
     STATE TRANSITIONS
     ──────────────────────────────────────────────── */
  function setState(name) {
    body.classList.remove('state-foyer', 'state-listening', 'state-resolved');
    body.classList.add('state-' + name);
    document.getElementById('auditorium').setAttribute('aria-hidden', name !== 'listening');
    document.getElementById('room').setAttribute('aria-hidden', name !== 'resolved');

    if (name === 'resolved') {
      // unlock scroll & scroll to top of room
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    }
  }

  function startListening() {
    setupAudioGraph();
    sizeCanvas();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    track.currentTime = 0;
    track.volume = 0;
    const target = 1.0;
    // soft fade-in over 1.6s
    const start = performance.now();
    function fade(now) {
      const t = Math.min(1, (now - start) / 1600);
      track.volume = target * t;
      if (t < 1) requestAnimationFrame(fade);
    }
    track.play().then(() => {
      requestAnimationFrame(fade);
      setState('listening');
    }).catch(err => {
      console.warn('autoplay blocked', err);
      // graceful fallback — go straight to resolved
      setState('resolved');
    });
  }

  function endListening() {
    setState('resolved');
  }

  function skipToRoom() {
    if (track && !track.paused) track.pause();
    setState('resolved');
  }

  function replay() {
    setState('foyer');
    // small delay to allow foyer to render before pressing-in again would be aesthetic;
    // scroll to top
    window.scrollTo({ top: 0 });
  }

  /* ────────────────────────────────────────────────
     EVENTS
     ──────────────────────────────────────────────── */
  enterBtn?.addEventListener('click', () => {
    startListening();
  });

  skipLink?.addEventListener('click', (e) => {
    e.preventDefault();
    skipToRoom();
  });

  replayBt?.addEventListener('click', () => {
    replay();
  });

  // when the music ends, transition into the room
  track?.addEventListener('ended', endListening);

  // keep stage video looping silently regardless
  if (film) {
    film.addEventListener('loadeddata', () => {
      film.play().catch(()=>{});
    }, { once:true });
  }

  // initial size & loop
  sizeCanvas();
  if (!reduced) requestAnimationFrame(loop);

  // accessibility: ESC to skip
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (body.classList.contains('state-listening')) skipToRoom();
    }
    if (e.key === ' ' && body.classList.contains('state-foyer')) {
      e.preventDefault();
      startListening();
    }
  });

  /* ────────────────────────────────────────────────
     CONSOLE MARK
     ──────────────────────────────────────────────── */
  console.info('%cIdea XIX %ca listening room, for one — Mérida MMXXVI',
    'font:600 13px Instrument Serif, serif;color:#0A0908;background:#F2EBE0;padding:4px 8px;letter-spacing:0.04em',
    'font:italic 11px Instrument Serif, serif;color:#F2EBE0;background:#0A0908;padding:4px 8px;letter-spacing:0.18em');
})();
