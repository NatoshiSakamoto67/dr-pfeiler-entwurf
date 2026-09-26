/* Privatpraxis Dr. Pfeiler — Verhalten ohne Framework, Fassung 2 (26.09.2026). */
(function () {
  'use strict';
  var doc = document.documentElement;
  var body = document.body;
  var wenigerBewegung = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Interne Hinweise nur mit ?intern
  try { if (new URLSearchParams(location.search).has('intern')) doc.classList.add('intern'); } catch (e) {}

  // Große Schrift: eine Einstellung, vom Nutzer ausdrücklich gewählt, lokal gemerkt
  var schrift = document.querySelector('.schrift');
  var grossGesetzt = function (an) {
    doc.classList.toggle('gross', an);
    if (schrift) schrift.setAttribute('aria-pressed', an ? 'true' : 'false');
    try { an ? localStorage.setItem('pfeiler-gross', '1') : localStorage.removeItem('pfeiler-gross'); } catch (e) {}
  };
  try { if (localStorage.getItem('pfeiler-gross') === '1') grossGesetzt(true); } catch (e) {}
  if (schrift) schrift.addEventListener('click', function () { grossGesetzt(!doc.classList.contains('gross')); });

  // Menü (schmal): Fokus hinein, Rest inert, Escape schließt und gibt den Fokus zurück
  var knopf = document.querySelector('.menue');
  var flaeche = document.getElementById('menue');
  var hinterMenue = [document.querySelector('main'), document.querySelector('footer'), document.querySelector('.ruf')];
  if (knopf && flaeche) {
    var setzeInert = function (an) {
      hinterMenue.forEach(function (el) { if (el) { if (an) el.setAttribute('inert', ''); else el.removeAttribute('inert'); } });
    };
    var oeffnen = function () {
      body.classList.add('menue-offen');
      knopf.setAttribute('aria-expanded', 'true');
      setzeInert(true);
      var erster = flaeche.querySelector('a, button');
      if (erster) setTimeout(function () { erster.focus(); }, 50);
    };
    var schliessen = function (fokusZurueck) {
      if (!body.classList.contains('menue-offen')) return;
      body.classList.remove('menue-offen');
      knopf.setAttribute('aria-expanded', 'false');
      setzeInert(false);
      if (fokusZurueck) knopf.focus();
    };
    knopf.addEventListener('click', function () {
      body.classList.contains('menue-offen') ? schliessen(true) : oeffnen();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') schliessen(true); });
    Array.prototype.forEach.call(flaeche.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () { schliessen(false); });
    });
    // Fokus im offenen Menü halten (Tab am Ende → Anfang), Kopfknopf bleibt erreichbar
    flaeche.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var ziele = flaeche.querySelectorAll('a, button');
      var erstes = ziele[0], letztes = ziele[ziele.length - 1];
      if (e.shiftKey && document.activeElement === erstes) { e.preventDefault(); knopf.focus(); }
      else if (!e.shiftKey && document.activeElement === letztes) { e.preventDefault(); knopf.focus(); }
    });
    knopf.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && !e.shiftKey && body.classList.contains('menue-offen')) {
        e.preventDefault(); var erster = flaeche.querySelector('a, button'); if (erster) erster.focus();
      }
    });
  }

  // Kopf: über dem Titelbild durchsichtig; beim Runterscrollen verstecken, beim Hochscrollen zeigen
  var kopf = document.querySelector('.kopf');
  var titel = document.querySelector('.titel');
  var ruf = document.querySelector('.ruf');
  var kontaktEnde = document.querySelector('[data-ruf-ende]');
  var titelSichtbar = !!titel;
  var kontaktSichtbar = false;
  var zeigeRuf = function () {
    if (!ruf) return;
    ruf.classList.toggle('sichtbar', !titelSichtbar && !kontaktSichtbar && !body.classList.contains('menue-offen'));
  };
  if (kopf && titel) kopf.classList.add('oben');
  if ('IntersectionObserver' in window) {
    if (titel) {
      new IntersectionObserver(function (ein) {
        titelSichtbar = ein[0].isIntersecting;
        if (kopf) kopf.classList.toggle('oben', titelSichtbar);
        zeigeRuf();
      }, { rootMargin: '-60px 0px 0px 0px', threshold: 0 }).observe(titel);
    } else {
      // Seiten ohne Titelbild: Leiste ab dem ersten Scroll
      titelSichtbar = false; zeigeRuf();
    }
    if (kontaktEnde) {
      new IntersectionObserver(function (ein) { kontaktSichtbar = ein[0].isIntersecting; zeigeRuf(); }, { threshold: 0.2 }).observe(kontaktEnde);
    }
  } else { titelSichtbar = false; zeigeRuf(); }

  var letztesY = window.pageYOffset;
  var hatSprung = !!document.querySelector('.sprung');
  var tick = false;
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset;
      if (kopf && !hatSprung && !body.classList.contains('menue-offen')) {
        var runter = y > letztesY + 6, hoch = y < letztesY - 6;
        if (runter && y > 160) kopf.classList.add('versteckt');
        else if (hoch || y < 80) kopf.classList.remove('versteckt');
      }
      letztesY = y; tick = false;
    });
  }, { passive: true });
  // Sobald ein Element im Kopf Fokus bekommt, muss der Kopf sichtbar sein (WCAG 2.4.11)
  if (kopf) kopf.addEventListener('focusin', function () { kopf.classList.remove('versteckt'); });

  // Einblenden
  var elemente = document.querySelectorAll('.zeig');
  if (wenigerBewegung || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(elemente, function (el) { el.classList.add('in'); });
  } else {
    var beobachter = new IntersectionObserver(function (ein) {
      ein.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); beobachter.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(elemente, function (el) { beobachter.observe(el); });
  }

  // Sprungleiste der Leistungsseite
  var leiste = document.querySelector('.sprung .wrap');
  var sprungLinks = document.querySelectorAll('.sprung a');
  if (leiste && sprungLinks.length && 'IntersectionObserver' in window) {
    var markiere = function (id) {
      Array.prototype.forEach.call(sprungLinks, function (a) {
        var aktiv = a.getAttribute('href') === '#' + id;
        a.classList.toggle('aktiv', aktiv);
        if (aktiv) leiste.scrollTo({ left: a.offsetLeft - leiste.clientWidth / 2 + a.offsetWidth / 2, behavior: wenigerBewegung ? 'auto' : 'smooth' });
      });
    };
    var bereichBeobachter = new IntersectionObserver(function (ein) {
      ein.forEach(function (e) { if (e.isIntersecting) markiere(e.target.id); });
    }, { rootMargin: '-40% 0px -50% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.bereich[id]'), function (b) { bereichBeobachter.observe(b); });
  }

  // Google-Karte auf Wunsch (Zwei-Klick): erst der Klick baut die Verbindung zu Google auf
  var karteLaden = document.getElementById('karte-laden');
  var karte = document.getElementById('karte-bild');
  var status = document.getElementById('karte-status');
  if (karteLaden && karte) {
    karteLaden.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = karteLaden.getAttribute('data-src');
      iframe.title = 'Google Maps: Praxis Dr. Pfeiler, Hamburger Straße 277, 38114 Braunschweig';
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.tabIndex = -1;
      karte.replaceChildren(iframe);
      var zurueck = document.createElement('button');
      zurueck.type = 'button'; zurueck.className = 'knopf knopf--glas karte-schliessen';
      zurueck.textContent = 'Google-Karte wieder schließen';
      zurueck.addEventListener('click', function () { location.reload(); });
      karte.parentNode.appendChild(zurueck);
      if (status) status.textContent = 'Die Google-Karte wurde geladen.';
      iframe.addEventListener('load', function () { iframe.focus(); }, { once: true });
    });
  }
  // Apple-Karten-Knopf nur auf Apple-Geräten
  var apple = document.querySelector('[data-apple]');
  if (apple && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) apple.hidden = false;
})();
