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
        '.koe .kop{transform-box:fill-box;transform-origin:14% 78%;transition:transform .9s cubic-bezier(.45,0,.2,1);}',
        '.koe.graast .kop{transform:rotate(47deg);}',
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
'<g fill="none" stroke="var(--koe-lijn,#192b1b)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">' +
  // achterpoten
'  <g class="poot p1"><path d="M60 88 L58 118 L59 134 M59 134 L66 134"/></g>' +
'  <g class="poot p2"><path d="M78 90 L77 119 L78 134 M78 134 L85 134"/></g>' +
  // voorpoten
'  <g class="poot p3"><path d="M138 90 L139 119 L139 134 M139 134 L146 134"/></g>' +
'  <g class="poot p4"><path d="M155 88 L157 118 L157 134 M157 134 L164 134"/></g>' +
'  <g class="lijf">' +
     // staart
'    <g class="staart"><path d="M46 50 C 34 58 30 76 35 92 M35 92 l-3 7" /></g>' +
     // romp
'    <path d="M47 62 C 44 42 62 33 88 32 L 142 31 C 160 30 172 38 176 50 L 179 60 C 182 75 172 88 155 89 L 72 92 C 56 92 49 78 47 62 Z"/>' +
     // uier
'    <path d="M116 90 c 1.5 7 13 7 15 -1" stroke-width="3.6"/>' +
     // rugvlek
'    <path d="M92 33 C 88 46 96 58 112 57 C 126 56 130 44 126 32 Z" fill="var(--koe-lijn,#192b1b)" opacity=".14" stroke="none"/>' +
'    <path d="M150 66 C 144 72 146 82 155 84 C 163 85 168 78 166 70 Z" fill="var(--koe-lijn,#192b1b)" opacity=".14" stroke="none"/>' +
     // kop (draait bij grazen)
'    <g class="kop">' +
'      <path d="M170 52 C 178 44 186 40 196 40"/>' +
'      <g class="snuit">' +
'        <path d="M196 40 C 208 40 214 46 215 55 C 216 63 210 68 202 68 C 193 68 188 62 188 54"/>' +
'        <path d="M209 63 l0 .1" stroke-width="5"/>' +
'        <circle cx="196" cy="48" r="1.6" fill="var(--koe-lijn,#192b1b)" stroke="none"/>' +
'      </g>' +
       // oor + tittel-vlek (knipoog naar het logo)
'      <path d="M192 38 C 189 31 182 29 177 32 C 181 36 186 39 192 38 Z"/>' +
'      <circle cx="199" cy="33" r="4" fill="var(--koe-accent,#c8524a)" stroke="none"/>' +
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
