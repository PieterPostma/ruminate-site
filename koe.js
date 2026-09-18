/* koe.js - de grazende koe die meeloopt met het scrollen.
   Gedeeld door de drie versies; kleur en maat via CSS-variabelen:
     --koe-lijn   lijnkleur (verplicht)
     --koe-accent accentkleur voor de tittel-vlek (standaard: rood)
     --koe-breedte  breedte in px (standaard 150px)
     --koe-bodem    afstand tot de onderrand (standaard 10px)      */
(function () {
    'use strict';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var css = [
        '.koe-wrap{position:fixed;left:0;right:0;bottom:0;height:0;pointer-events:none;z-index:60;}',
        '.koe{position:absolute;bottom:var(--koe-bodem,10px);left:0;width:var(--koe-breedte,150px);will-change:transform;}',
        '.koe svg{display:block;width:100%;height:auto;overflow:visible;}',
        '.koe .spiegel{transform-box:fill-box;transform-origin:50% 50%;}',
        '.koe.kijkt-links .spiegel{transform:scaleX(-1);}',
        '.koe .poot{transform-box:fill-box;transform-origin:50% 0%;}',
        '.koe.loopt .p1,.koe.loopt .p3{animation:koe-stap .5s ease-in-out infinite;}',
        '.koe.loopt .p2,.koe.loopt .p4{animation:koe-stap .5s ease-in-out infinite -.25s;}',
        '.koe.loopt .lijf{animation:koe-bob .25s ease-in-out infinite;}',
        '.koe .kop{transform-box:fill-box;transform-origin:3% 62%;transition:transform 1.1s cubic-bezier(.45,0,.2,1);}',
        '.koe.graast .kop{transform:translate(2px,10px) rotate(68deg);}',
        '.koe.graast .snuit{animation:koe-kauw 1.05s ease-in-out infinite;}',
        '.koe .staart{transform-box:fill-box;transform-origin:85% 8%;animation:koe-staart 3.4s ease-in-out infinite;}',
        '@keyframes koe-stap{0%,100%{transform:rotate(12deg)}50%{transform:rotate(-12deg)}}',
        '@keyframes koe-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(1.6px)}}',
        '@keyframes koe-kauw{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(1.4px) rotate(-2.5deg)}}',
        '@keyframes koe-staart{0%,100%{transform:rotate(0)}50%{transform:rotate(7deg)}}',
        '@media (max-width:640px){.koe{width:calc(var(--koe-breedte,150px)*.66);}}',
        '@media print{.koe-wrap{display:none;}}'
    ].join('\n');

    var svg =
'<svg viewBox="0 0 230 150" xmlns="http://www.w3.org/2000/svg">' +
'<g class="spiegel">' +
'<g fill="none" stroke="var(--koe-lijn,#192b1b)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' +
  // achterpoten (iets korter, zodat de kop bij het grazen de grond haalt)
'  <g class="poot p1"><path d="M64 91 L62 108 L63 124 M58 124 h11"/></g>' +
'  <g class="poot p2"><path d="M80 92 L79 109 L80 124 M75 124 h11"/></g>' +
  // voorpoten
'  <g class="poot p3"><path d="M136 92 L137 109 L137 124 M132 124 h11"/></g>' +
'  <g class="poot p4"><path d="M152 90 L154 108 L154 124 M149 124 h11"/></g>' +
'  <g class="lijf">' +
     // staart met pluim
'    <g class="staart"><path d="M52 46 C 45 58 43 74 46 90 M46 90 c -2 5 -1 9 2 13"/></g>' +
     // romp: kruis, rug met lichte deuk, schoft, borst, buik, achterhand
'    <path d="M52 44 C 54 37 63 33 74 32 C 96 29 122 29 142 32 C 150 33 158 34 165 34 L 172 45 C 168 56 164 66 162 76 C 158 85 150 90 138 92 C 116 96 94 96 78 93 C 64 90 55 82 53 70 C 51 60 51 51 52 44 Z"/>' +
     // heupbot
'    <path d="M62 35 l 4 6" stroke-width="3.2"/>' +
     // uier met spenen
'    <path d="M98 93 C 100 104 118 105 122 94" stroke-width="3.4"/>' +
'    <path d="M104 103 l 0 5 M113 104 l 0 5" stroke-width="2.8"/>' +
     // vlekken
'    <path d="M96 32 C 87 48 95 63 115 61 C 133 59 138 44 128 31 Z" fill="var(--koe-lijn,#192b1b)" opacity=".16" stroke="none"/>' +
'    <path d="M60 50 C 55 62 59 74 71 72 C 80 70 80 56 74 47 Z" fill="var(--koe-lijn,#192b1b)" opacity=".16" stroke="none"/>' +
'    <path d="M148 40 C 143 48 146 57 155 56 C 162 55 163 45 158 39 Z" fill="var(--koe-lijn,#192b1b)" opacity=".12" stroke="none"/>' +
     // hals + kop (draait vanaf de schoft bij het grazen)
'    <g class="kop">' +
       // halslijnen vanaf de schoft
'      <path d="M158 35 C 165 31 171 28 177 26"/>' +
'      <path d="M170 60 C 178 56 186 53 194 51"/>' +
       // schedel en neusrug naar de snuit
'      <path d="M177 26 C 186 22 194 23 200 28 C 210 35 219 45 224 53"/>' +
'      <g class="snuit">' +
'        <path d="M224 53 C 226 58 222 62 215 62 C 207 62 201 58 197 53"/>' +
'        <path d="M218 56 l 0 .1" stroke-width="4.5"/>' +
'        <path d="M213 60 C 209 61 205 60 202 58" stroke-width="2.8"/>' +
'      </g>' +
       // kaaklijn en wang
'      <path d="M197 53 C 190 50 184 44 180 38"/>' +
       // oog
'      <circle cx="197" cy="36" r="2" fill="var(--koe-lijn,#192b1b)" stroke="none"/>' +
       // horens (lier-vormig omhoog)
'      <path d="M187 25 C 185 18 188 12 195 10" stroke-width="3.3"/>' +
'      <path d="M197 26 C 198 18 204 13 211 13" stroke-width="3.3"/>' +
       // oor opzij onder de horens
'      <path d="M184 27 C 179 21 172 19 167 22 C 171 27 178 29 184 27 Z"/>' +
       // tittel-vlek tussen de horens (knipoog naar het logo)
'      <circle cx="192" cy="20" r="3.5" fill="var(--koe-accent,#c8524a)" stroke="none"/>' +
'    </g>' +
'  </g>' +
'</g></g></svg>';

    function init() {
        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        var wrap = document.createElement('div');
        wrap.className = 'koe-wrap';
        wrap.setAttribute('aria-hidden', 'true');
        var koe = document.createElement('div');
        koe.className = 'koe';
        koe.innerHTML = svg;
        wrap.appendChild(koe);
        document.body.appendChild(wrap);

        var x = 24, idleSince = 0, lastT = 0;

        function target() {
            var max = Math.max(1, document.body.scrollHeight - window.innerHeight);
            var p = Math.min(1, Math.max(0, window.scrollY / max));
            var w = koe.getBoundingClientRect().width || 150;
            return 20 + p * (window.innerWidth - w - 40);
        }

        if (reduced) {
            koe.classList.add('graast');
            koe.style.transform = 'translateX(' + target() + 'px)';
            window.addEventListener('scroll', function () {
                koe.style.transform = 'translateX(' + target() + 'px)';
            }, { passive: true });
            return;
        }

        x = target();
        function frame(t) {
            var dt = Math.min(50, t - lastT); lastT = t;
            var tg = target();
            var d = tg - x;
            x += d * Math.min(1, 0.0035 * dt);
            koe.style.transform = 'translateX(' + x + 'px)';
            var moving = Math.abs(d) > 2;
            koe.classList.toggle('loopt', moving);
            if (moving) {
                idleSince = t;
                koe.classList.remove('graast');
                koe.classList.toggle('kijkt-links', d < 0);
            } else if (t - idleSince > 900) {
                koe.classList.add('graast');
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();
