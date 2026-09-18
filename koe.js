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
        '.koe .kop{transform-box:fill-box;transform-origin:10% 85%;transition:transform .9s cubic-bezier(.45,0,.2,1);}',
        '.koe.graast .kop{transform:rotate(50deg);}',
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
  // achterpoten
'  <g class="poot p1"><path d="M64 91 L62 112 L63 131 M58 131 h11"/></g>' +
'  <g class="poot p2"><path d="M80 92 L79 113 L80 131 M75 131 h11"/></g>' +
  // voorpoten
'  <g class="poot p3"><path d="M136 92 L137 113 L137 131 M132 131 h11"/></g>' +
'  <g class="poot p4"><path d="M152 90 L154 112 L154 131 M149 131 h11"/></g>' +
'  <g class="lijf">' +
     // staart met pluim
'    <g class="staart"><path d="M52 46 C 45 60 43 78 46 96 M46 96 c -2 5 -1 10 2 14"/></g>' +
     // romp: kruis, rug met lichte deuk, schoft, nek, borst, buik, achterhand
'    <path d="M52 44 C 54 37 63 33 74 32 C 96 29 122 29 142 32 C 152 33 162 34 172 33 L 178 44 C 172 56 166 66 162 76 C 158 85 150 90 138 92 C 116 96 94 96 78 93 C 64 90 55 82 53 70 C 51 60 51 51 52 44 Z"/>' +
     // heupbot
'    <path d="M62 35 l 4 6" stroke-width="3.2"/>' +
     // uier met spenen
'    <path d="M98 93 C 100 104 118 105 122 94" stroke-width="3.4"/>' +
'    <path d="M104 103 l 0 5 M113 104 l 0 5" stroke-width="2.8"/>' +
     // vlekken
'    <path d="M96 32 C 87 48 95 63 115 61 C 133 59 138 44 128 31 Z" fill="var(--koe-lijn,#192b1b)" opacity=".16" stroke="none"/>' +
'    <path d="M60 50 C 55 62 59 74 71 72 C 80 70 80 56 74 47 Z" fill="var(--koe-lijn,#192b1b)" opacity=".16" stroke="none"/>' +
'    <path d="M148 40 C 143 48 146 57 155 56 C 162 55 163 45 158 39 Z" fill="var(--koe-lijn,#192b1b)" opacity=".12" stroke="none"/>' +
     // kop (draait bij grazen)
'    <g class="kop">' +
       // schedel en neusrug naar snuit
'      <path d="M172 30 C 180 26 188 26 194 31 C 203 36 211 44 216 51"/>' +
'      <g class="snuit">' +
'        <path d="M216 51 C 218 55 215 59 209 59 C 202 60 196 57 192 52"/>' +
'        <path d="M211 53 l 0 .1" stroke-width="4.5"/>' +
'      </g>' +
       // kaaklijn terug naar de nek
'      <path d="M192 52 C 186 49 181 45 178 40"/>' +
       // oog
'      <circle cx="193" cy="37" r="1.8" fill="var(--koe-lijn,#192b1b)" stroke="none"/>' +
       // twee oren
'      <path d="M176 29 C 171 24 164 23 159 26 C 163 30 170 31 176 29 Z"/>' +
'      <path d="M185 27 C 183 21 177 17 172 19 C 175 24 180 27 185 27 Z"/>' +
       // tittel-vlek (knipoog naar het logo)
'      <circle cx="192" cy="27" r="4" fill="var(--koe-accent,#c8524a)" stroke="none"/>' +
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
