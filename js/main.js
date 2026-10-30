/* Velora — loader timeline and entrance animations.
   Loader frames follow the Figma storyboard (Loading Animation, 635:8074):
   01 blank → 02–04 mark strokes L / C / R → 05–06 rays grow out of the mark
   → 07 rays fold into the V fan, the wordmark appears → page is revealed. */
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
  // Line endpoints in loader-canvas coordinates (1440 × 860), from Figma frames 06 and 07.
  // Each line: [x1, y1, x2, y2]; point 1 is the outer end, point 2 the inner end.
  var RAYS = [
    [118.16, -92.54, 695.83, 469.54],
    [434.07, -142.01, 713.43, 455.51],
    [1005.39, -135.66, 708.11, 453.16],
    [1356.4, -107.52, 759.88, 431.52],
    [1571, 468.93, 767, 469.21],
    [-161, 469.21, 643, 468.93]
  ];
  var FAN = [
    [11.98, 179, 710, 582],
    [375.5, 13.5, 710, 582],
    [1044, 13.5, 709.5, 582],
    [1406.28, 180, 710, 582],
    [1406.28, 180, 710, 582],
    [1406.28, 180, 710, 582]
  ];
  // Extend the outer ends so the lines still reach the edges on screens taller or wider than 1440 × 860.
  function extend(l, k) {
    var dx = l[0] - l[2], dy = l[1] - l[3];
    return [l[2] + dx * k, l[3] + dy * k, l[2], l[3]];
  }
  RAYS = RAYS.map(function (l) { return extend(l, 3); });
  FAN = FAN.map(function (l) { return extend(l, 3); });

  function runLoader(loader, done) {
    var q = function (s) { return loader.querySelector(s); };
    var lines = loader.querySelectorAll('.loader__lines line');
    var counter = q('.loader__counter');
    var logo = q('.loader__logo');
    var lineSvg = q('.loader__lines');

    function setLines(t) {
      lines.forEach(function (line, i) {
        var a = RAYS[i], b = FAN[i];
        line.setAttribute('x1', a[0] + (b[0] - a[0]) * t);
        line.setAttribute('y1', a[1] + (b[1] - a[1]) * t);
        line.setAttribute('x2', a[2] + (b[2] - a[2]) * t);
        line.setAttribute('y2', a[3] + (b[3] - a[3]) * t);
        if (i >= 4) line.style.opacity = 1 - t;
      });
    }
    setLines(0);

    var anim = function (el, frames, opts) {
      return el.animate(frames, Object.assign({ fill: 'both', easing: EASE_OUT }, opts));
    };
    var strokeIn = [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }];

    // 02–04: the mark draws in, stroke by stroke
    anim(q('.loader__mark-l'), strokeIn, { delay: 350, duration: 500 });
    anim(q('.loader__mark-c'), strokeIn, { delay: 750, duration: 500 });
    anim(q('.loader__mark-r'), strokeIn, { delay: 1150, duration: 500 });

    // 05–06: rays grow out of the mark
    anim(lineSvg, [
      { clipPath: 'circle(0px at 710px 431px)' },
      { clipPath: 'circle(2600px at 710px 431px)' }
    ], { delay: 1500, duration: 1100, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' });

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

    // 07: wait for the page to finish loading, then fold the rays and show the wordmark
    var pageReady = new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });
    var minTime = new Promise(function (resolve) { setTimeout(resolve, 2500); });

    Promise.all([pageReady, minTime]).then(function () {
      anim(counter, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 300 });
      anim(logo, [{ transform: 'none' }, { transform: 'translateX(-159px)' }], { delay: 100, duration: 800, easing: EASE_IN_OUT });
      loader.querySelectorAll('.loader__letter').forEach(function (el, i) {
        anim(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { delay: 350 + i * 60, duration: 500 });
      });

      var start = performance.now(), dur = 800;
      (function morph(now) {
        var p = Math.min(1, (now - start) / dur);
        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        setLines(e);
        if (p < 1) requestAnimationFrame(morph);
      })(start);

      // Hand over to the page
      setTimeout(function () {
        root.classList.remove('is-loading');
        done();
        anim(loader, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease' })
          .finished.then(function () { loader.remove(); });
      }, 1400);
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
