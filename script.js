/* ──────────────────────────────────────────────────────────────
   GIBRAN ALCOCER — small, considered.
   - serve mobile-sized video on small screens
   - sound toggle for the hero film
   - film time counter
   - soft fade-in on first paint, soft reveal on scroll
   ────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const film    = document.getElementById('film');
  const filmSrc = document.getElementById('filmSrc');
  const sound   = document.getElementById('sound');
  const timeEl  = document.getElementById('time');

  /* ─── pick the right video size for the device ─── */
  if (window.innerWidth <= 760 && filmSrc) {
    filmSrc.src = 'media/gibran-720.mp4';
    film.load();
  }

  /* ─── reveal body once first frame paints (or after 700ms safety) ─── */
  const ready = () => document.body.classList.add('is-ready');
  if (film && film.readyState >= 2) ready();
  else if (film) film.addEventListener('loadeddata', ready, { once:true });
  setTimeout(ready, 1200);

  /* ─── sound toggle ─── */
  if (sound && film) {
    sound.addEventListener('click', () => {
      const on = film.muted;
      film.muted = !on;
      sound.setAttribute('aria-pressed', String(on));
      // some browsers pause-then-resume on unmute; ensure playing
      if (film.paused) film.play().catch(()=>{});
    });
  }

  /* ─── film time counter ─── */
  function fmt(t){
    if (!isFinite(t)) t = 0;
    const m = String(Math.floor(t / 60)).padStart(2, '0');
    const s = String(Math.floor(t % 60)).padStart(2, '0');
    return `${m}:${s}`;
  }
  if (film && timeEl) {
    const updateTime = () => {
      timeEl.textContent = `${fmt(film.currentTime)} / ${fmt(film.duration)}`;
    };
    film.addEventListener('loadedmetadata', updateTime);
    film.addEventListener('timeupdate', updateTime);
  }

  /* ─── soft reveal on scroll (no per-letter, no blur, no will-change) ─── */
  const targets = document.querySelectorAll('.prelude__line, .quote__text, .quote__cite, .work__head, .idea, .work__foot, .end__line, .end__mail, .end__marks, .end__imprint');
  targets.forEach(el => el.classList.add('fade-in'));

  if (reduced) {
    targets.forEach(el => el.classList.add('is-revealed'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          // small per-element stagger inside .ideas only
          if (e.target.classList.contains('idea')) {
            const i = [...e.target.parentNode.children].indexOf(e.target);
            e.target.style.transitionDelay = (i * 60) + 'ms';
          }
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    targets.forEach(el => io.observe(el));
  }

  /* ─── handle iOS autoplay quirk: try playing on first user interaction if needed ─── */
  const tryPlay = () => {
    if (film && film.paused) film.play().catch(()=>{});
  };
  document.addEventListener('touchstart', tryPlay, { once:true, passive:true });
  document.addEventListener('click', tryPlay, { once:true });

  /* ─── console mark ─── */
  console.info('%cGibran Alcocer %c· a film at the piano · MMXXVI',
    'font:600 13px Instrument Serif, serif;color:#0A0908;background:#F2EBE0;padding:4px 8px;letter-spacing:0.04em',
    'font:italic 11px Instrument Serif, serif;color:#F2EBE0;background:#0A0908;padding:4px 8px;letter-spacing:0.18em');
})();
