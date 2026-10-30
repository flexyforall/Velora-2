/* Velora — loader timeline and entrance animations.
   Loader frames follow the Figma storyboard (Loading Animation, 635:8074):
   01 blank, 0% → 02–04 mark strokes L / C / R → 05–06 hold while the counter
   reaches 100% → 07 the mark slides left and the wordmark appears → the
   wordmark fades away on an empty white screen → page. */
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
  var EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';

  /* ---------- Entrance animations ---------- */
  function startReveals() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Loader ---------- */
  function runLoader(loader, done) {
    var q = function (s) { return loader.querySelector(s); };
    var counter = q('.loader__counter');
    var anim = function (el, frames, opts) {
      return el.animate(frames, Object.assign({ fill: 'both', easing: EASE_OUT }, opts));
    };
    var riseIn = [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }];

    // 02–04: the mark draws in, stroke by stroke (each rises 10px into place)
    anim(q('.loader__mark-l'), riseIn, { delay: 350, duration: 500 });
    anim(q('.loader__mark-c'), riseIn, { delay: 750, duration: 500 });
    anim(q('.loader__mark-r'), riseIn, { delay: 1150, duration: 500 });

    // Counter: 0 → 18 → 56 → 78 → 100, in step with the frames
    var stops = [[0, 0], [350, 0], [850, 18], [1250, 56], [1900, 78], [2400, 100]];
    var t0 = performance.now();
    (function tick(now) {
      var t = now - t0, v = 100;
      for (var i = 1; i < stops.length; i++) {
        if (t < stops[i][0]) {
          var a = stops[i - 1], b = stops[i];
          v = a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
          break;
        }
      }
      counter.textContent = Math.round(v) + '%';
      if (t < stops[stops.length - 1][0]) requestAnimationFrame(tick);
    })(t0);

    // 07: once the page has loaded, slide the mark left and bring in the wordmark
    var pageReady = new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });
    var minTime = new Promise(function (resolve) { setTimeout(resolve, 2600); });

    Promise.all([pageReady, minTime]).then(function () {
      anim(counter, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 300 });
      anim(q('.loader__logo'), [{ transform: 'none' }, { transform: 'translateX(-159px)' }], { delay: 100, duration: 800, easing: EASE_IN_OUT });
      loader.querySelectorAll('.loader__letter').forEach(function (el, i) {
        anim(el, riseIn, { delay: 350 + i * 60, duration: 500 });
      });

      // Let the wordmark sit for a beat, fade it away, and only then reveal the page
      anim(q('.loader__canvas'), [
        { opacity: 1, transform: 'none', filter: 'blur(0)' },
        { opacity: 0, transform: 'translateY(-12px)', filter: 'blur(6px)' }
      ], { delay: 1750, duration: 550, easing: 'cubic-bezier(0.4, 0, 1, 1)' })
        .finished.then(function () {
          root.classList.remove('is-loading');
          done();
          anim(loader, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease' })
            .finished.then(function () { loader.remove(); });
        });
    });
  }

  function init() {
    var loader = document.querySelector('.loader');
    if (!loader || reduceMotion || !Element.prototype.animate) {
      if (loader) loader.remove();
      root.classList.remove('is-loading');
      startReveals();
      return;
    }
    runLoader(loader, startReveals);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
