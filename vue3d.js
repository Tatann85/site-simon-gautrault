// Vue 3D filaire de la page d'accueil. Aucune dependance : trois modeles generes
// par le calcul (bride, vis sans fin, engrenage), projetes sur un canvas 2D.
// Ce sont des illustrations, pas des etudes realisees pour un client.
(function () {
  var canvas = document.getElementById('vue3d');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var TAU = Math.PI * 2;

  function cercle(cx, cy, r, z, n) {
    var p = [], i, a;
    for (i = 0; i <= n; i++) { a = i / n * TAU; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); }
    return p;
  }
  function pt(a, r, z) { return [r * Math.cos(a), r * Math.sin(a), z]; }

  // Bride a collerette : disque diam. 240, moyeu diam. 120, alesage diam. 90, 6 trous diam. 22 sur diam. 170
  function bride() {
    var L = [], k, a;
    [[120, -30], [120, -6], [60, -6], [60, 40], [45, 40], [45, -30]].forEach(function (c) { L.push(cercle(0, 0, c[0], c[1], 72)); });
    for (k = 0; k < 12; k++) {
      a = k / 12 * TAU;
      L.push([pt(a, 120, -30), pt(a, 120, -6)], [pt(a, 60, -6), pt(a, 60, 40)], [pt(a, 45, -30), pt(a, 45, 40)]);
    }
    for (k = 0; k < 6; k++) {
      a = k / 6 * TAU;
      L.push(cercle(85 * Math.cos(a), 85 * Math.sin(a), 11, -30, 24), cercle(85 * Math.cos(a), 85 * Math.sin(a), 11, -6, 24));
    }
    return { lignes: L, rayon: 132 };
  }

  // Vis sans fin : spire helicoidale sur un arbre, axe horizontal
  function vis() {
    var L = [], n = 240, tours = 5, long = 300, R = 58, r = 14, ext = [], inte = [], i, t, a, x;
    for (i = 0; i <= n; i++) {
      t = i / n; a = t * tours * TAU; x = -long / 2 + long * t;
      ext.push([x, R * Math.cos(a), R * Math.sin(a)]);
      inte.push([x, r * Math.cos(a), r * Math.sin(a)]);
      if (i % 4 === 0) L.push([inte[i], ext[i]]);
    }
    L.push(ext, inte);
    [-long / 2 - 34, long / 2 + 34].forEach(function (x0) {
      var c = [];
      for (i = 0; i <= 32; i++) { a = i / 32 * TAU; c.push([x0, r * Math.cos(a), r * Math.sin(a)]); }
      L.push(c);
    });
    for (i = 0; i < 6; i++) {
      a = i / 6 * TAU;
      L.push([[-long / 2 - 34, r * Math.cos(a), r * Math.sin(a)], [long / 2 + 34, r * Math.cos(a), r * Math.sin(a)]]);
    }
    return { lignes: L, rayon: 178 };
  }

  // Engrenage droit : 18 dents, profil simplifie
  function engrenage() {
    var L = [], z = 18, pas = TAU / z, pied = 78, tete = 100, e = 16, av = [], ar = [], k, a;
    for (k = 0; k < z; k++) {
      a = k * pas;
      [[0, pied], [0.22, pied], [0.36, tete], [0.64, tete], [0.78, pied]].forEach(function (d) {
        av.push(pt(a + d[0] * pas, d[1], e));
        ar.push(pt(a + d[0] * pas, d[1], -e));
      });
    }
    av.push(av[0]); ar.push(ar[0]);
    L.push(av, ar);
    for (k = 0; k < av.length - 1; k++) L.push([av[k], ar[k]]);
    L.push(cercle(0, 0, 26, e, 40), cercle(0, 0, 26, -e, 40), cercle(0, 0, 46, e, 48), cercle(0, 0, 46, -e, 48));
    for (k = 0; k < 8; k++) { a = k / 8 * TAU; L.push([pt(a, 26, e), pt(a, 26, -e)]); }
    return { lignes: L, rayon: 112 };
  }

  var modeles = { bride: bride(), vis: vis(), engrenage: engrenage() };
  var courant = modeles.bride;
  var lacet = 0.7, tangage = 0.55, glisse = false, dernierX = 0, dernierY = 0, visible = true, W = 0, H = 0;
  var calme = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function taille() {
    var r = canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * d); canvas.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  function dessiner() {
    var k = Math.min(W, H) / (courant.rayon * 2.2), R = courant.rayon;
    var cl = Math.cos(lacet), sl = Math.sin(lacet), ct = Math.cos(tangage), st = Math.sin(tangage);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.strokeStyle = '#f2b233';
    courant.lignes.forEach(function (ligne) {
      var i, p, x1, z1, y2, z2, X, Y, px, py, pz;
      for (i = 0; i < ligne.length; i++) {
        p = ligne[i];
        x1 = p[0] * cl + p[2] * sl; z1 = -p[0] * sl + p[2] * cl;
        y2 = p[1] * ct - z1 * st; z2 = p[1] * st + z1 * ct;
        X = W / 2 + x1 * k; Y = H / 2 - y2 * k;
        if (i) {
          ctx.globalAlpha = 0.25 + 0.75 * Math.max(0, Math.min(1, ((pz + z2) / 2 + R) / (2 * R)));
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(X, Y); ctx.stroke();
        }
        px = X; py = Y; pz = z2;
      }
    });
    // Triedre X, Y, Z en bas a gauche, comme dans un logiciel de CAO
    ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.font = '600 11px sans-serif';
    [[1, 0, 0, '#ff6b5e', 'X'], [0, 1, 0, '#6fd08c', 'Y'], [0, 0, 1, '#6aa9ff', 'Z']].forEach(function (ax) {
      var x1 = ax[0] * cl + ax[2] * sl, z1 = -ax[0] * sl + ax[2] * cl, y2 = ax[1] * ct - z1 * st;
      ctx.strokeStyle = ax[3]; ctx.fillStyle = ax[3];
      ctx.beginPath(); ctx.moveTo(36, H - 36); ctx.lineTo(36 + x1 * 22, H - 36 - y2 * 22); ctx.stroke();
      ctx.fillText(ax[4], 36 + x1 * 31 - 3, H - 36 - y2 * 31 + 4);
    });
  }

  function boucle() {
    if (visible) {
      if (!glisse && !calme) lacet += 0.0045;
      dessiner();
    }
    window.requestAnimationFrame(boucle);
  }

  canvas.addEventListener('pointerdown', function (e) {
    glisse = true; dernierX = e.clientX; dernierY = e.clientY;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!glisse) return;
    lacet += (e.clientX - dernierX) * 0.01;
    tangage = Math.max(-1.5, Math.min(1.5, tangage + (e.clientY - dernierY) * 0.01));
    dernierX = e.clientX; dernierY = e.clientY;
  });
  ['pointerup', 'pointercancel'].forEach(function (nom) {
    canvas.addEventListener(nom, function () { glisse = false; canvas.style.cursor = 'grab'; });
  });

  var boutons = document.querySelectorAll('[data-modele]');
  Array.prototype.forEach.call(boutons, function (b) {
    b.addEventListener('click', function () {
      courant = modeles[b.getAttribute('data-modele')] || courant;
      Array.prototype.forEach.call(boutons, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);
  }
  window.addEventListener('resize', taille);
  taille();
  window.requestAnimationFrame(boucle);
})();
