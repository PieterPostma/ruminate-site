/* cockpit.js - het Ruminate-productinterface, live op de site.
   Zelfstandige widget met eigen (ck-) stijlen; rendert in #cockpit.
   Draait op deterministische voorbeelddata (geen echte bedrijfsdata). */
(function () {
    'use strict';

    /* ---------- deterministische voorbeelddata ---------- */
    function rng(seed) { return function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }
    var NAMEN = ['Berta 12', 'Sietske 4', 'Nynke 27', 'Marijke 8', 'Aaltje 31', 'Femke 19', 'Rixt 3', 'Tsjerkje 22',
        'Boukje 15', 'Willemke 7', 'Jantsje 40', 'Hiske 11', 'Doutzen 25', 'Grytsje 9', 'Afke 33', 'Lysbeth 17',
        'Antsje 2', 'Baukje 28', 'Wypkje 14', 'Sjoukje 36', 'Teatske 6', 'Hylkje 21', 'Romkje 30', 'Idske 13'];

    function maakKoppel() {
        var r = rng(20260917), koeien = [];
        for (var i = 0; i < NAMEN.length; i++) {
            var basis = 24 + r() * 14;                       // haar eigen basislijn, kg/dag
            var toestand = r();
            // afst: kg krachtvoer boven (+) of onder (-) haar optimum
            var status, afst;
            if (toestand < 0.13) { status = 'zuur'; afst = 0.8 + r() * 0.7; }
            else if (toestand < 0.24) { status = 'let-op'; afst = 0.35 + r() * 0.4; }
            else if (toestand < 0.33) { status = 'let-op'; afst = -(0.35 + r() * 0.5); }
            else { status = 'ok'; afst = (r() - 0.5) * 0.55; }
            var melk = [], herkauw = [];
            var dip = status === 'zuur' ? 9 + Math.floor(r() * 3) : -1;
            for (var d = 0; d < 14; d++) {
                var m = basis + Math.sin(d * 1.7 + i) * 0.8 + (r() - 0.5) * 1.2;
                var h = 505 + Math.sin(d * 1.1 + i * 2) * 22 + (r() - 0.5) * 30;
                if (dip >= 0 && d >= dip) { m -= (d - dip + 1) * 1.1; h -= (d - dip + 1) * 26; }
                if (status === 'let-op' && afst > 0 && d > 10) { m -= (d - 10) * 0.5; h -= (d - 10) * 12; }
                if (status === 'let-op' && afst < 0 && d > 8) { m -= (d - 8) * 0.25; }
                melk.push(m); herkauw.push(h);
            }
            koeien.push({
                naam: NAMEN[i], lactatie: 1 + Math.floor(r() * 4), dim: 12 + Math.floor(r() * 280),
                basis: basis, melk: melk, herkauw: herkauw,
                kv: 3 + r() * 5, rest: status === 'ok' ? r() * 0.2 : 0.3 + r() * 1.1,
                status: status, afst: afst
            });
        }
        var orde = { zuur: 0, 'let-op': 1, ok: 2 };
        koeien.sort(function (a, b) { return orde[a.status] - orde[b.status] || a.naam.localeCompare(b.naam); });
        return koeien;
    }

    /* ---------- voeradvies: krachtvoer per koe, ruwvoer per groep ---------- */
    function advies(k) {
        var lh = Math.round(k.herkauw[13]);
        var voornaam = k.naam;
        if (k.status === 'zuur') return {
            kv: { delta: -0.8, titel: 'Terug naar ' + (k.kv - 0.8).toFixed(1).replace('.', ',') + ' kg/dag, opbouw pauzeren',
                  uitleg: 'Melkgift onder haar basislijn, herkauwtijd gezakt naar ' + lh + ' min/dag: patroon van beginnende pensverzuring.' },
            actie: 'Vandaag krijgt ' + voornaam + ' 0,8 kg minder dan haar standaardportie; de robot bouwt daarna in kleinere stappen weer op.',
            rv: { titel: 'Extra structuur aan het voerhek',
                  uitleg: 'Vandaag structuurrijk ruwvoer (hooi of stro) bijmengen; buffer overwegen zolang zij in de rode zone zit.' }
        };
        if (k.status === 'let-op' && k.afst > 0) return {
            kv: { delta: -1.0, titel: 'Portie verlagen: −1,0 kg/dag',
                  uitleg: 'Ze laat al drie dagen op rij zo’n ' + k.rest.toFixed(1).replace('.', ',') + ' kg krachtvoer liggen; de portie loopt vóór op wat zij opneemt.' },
            actie: 'Vandaag krijgt ' + voornaam + ' 1,0 kg minder, omdat ze al 3 dagen op rij krachtvoer laat liggen.',
            rv: { titel: 'Zetmeel niet verhogen',
                  uitleg: 'Structuuraandeel van het basisrantsoen handhaven tot zij terug in de groene zone is.' }
        };
        if (k.status === 'let-op') return {
            kv: { delta: 0.6, titel: 'Bijvoeren: +0,6 kg/dag, in twee stappen',
                  uitleg: 'Melkgift blijft onder wat zij aankan; er ligt melk op tafel.' },
            actie: 'Vandaag krijgt ' + voornaam + ' 0,6 kg extra boven op haar standaardportie krachtvoer.',
            rv: { titel: 'Energiedichtheid controleren',
                  uitleg: 'Check of het basisrantsoen genoeg energie biedt voor de hoogproductieve groep.' }
        };
        return {
            kv: { delta: 0, titel: 'Handhaven: ' + k.kv.toFixed(1).replace('.', ',') + ' kg/dag',
                  uitleg: 'Melkgift en herkauwtijd binnen haar bandbreedte; herweging bij de melkcontrole.' },
            actie: 'Geen wijziging: de robot verstrekt ' + voornaam + ' haar standaardportie.',
            rv: { titel: 'Geen wijziging',
                  uitleg: 'Basisrantsoen past bij deze groep.' }
        };
    }

    /* ---------- opmaak ---------- */
    var css = [
        '.ck{background:#101a11;color:#d4cfbf;border:1px solid rgba(212,207,191,.16);border-radius:14px;overflow:hidden;',
        '    font-family:"Jost",system-ui,sans-serif;font-weight:300;box-shadow:0 24px 70px rgba(0,0,0,.28);text-align:left}',
        '.ck *{box-sizing:border-box}',
        '.ck-kop{display:flex;align-items:center;gap:14px;padding:13px 18px;border-bottom:1px solid rgba(212,207,191,.14);flex-wrap:wrap}',
        '.ck-merk{font-family:"Baloo 2",sans-serif;font-weight:600;font-size:18px;line-height:1;color:#e8e4d6}',
        '.ck-merk i{font-style:normal;position:relative;display:inline-block}',
        '.ck-merk i::after{content:"";position:absolute;left:50%;transform:translateX(-50%);top:.09em;width:.17em;height:.17em;border-radius:50%;background:#c8524a}',
        '.ck-tag{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(212,207,191,.45)}',
        '.ck-kpis{margin-left:auto;display:flex;gap:18px;font-family:"JetBrains Mono",monospace;font-size:11px;color:rgba(212,207,191,.6)}',
        '.ck-kpis b{color:#7ba58a;font-weight:400} .ck-kpis b.g{color:#b8a472} .ck-kpis b.r{color:#e0847d}',
        '.ck-romp{display:grid;grid-template-columns:minmax(250px,330px) 1fr}',
        '.ck-lijst{border-right:1px solid rgba(212,207,191,.14);display:flex;flex-direction:column}',
        '.ck-filters{display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid rgba(212,207,191,.1)}',
        '.ck-filters button{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;',
        '    background:none;border:1px solid rgba(212,207,191,.25);border-radius:99px;color:rgba(212,207,191,.6);padding:5px 12px;cursor:pointer}',
        '.ck-filters button.aan{background:#d4cfbf;color:#101a11;border-color:#d4cfbf}',
        '.ck-rijen{overflow-y:auto;max-height:432px;flex:1}',
        '.ck-rij{display:grid;grid-template-columns:10px 1fr auto;gap:12px;align-items:center;width:100%;text-align:left;',
        '    background:none;border:0;border-bottom:1px solid rgba(212,207,191,.07);color:inherit;padding:10px 14px;cursor:pointer;font:inherit}',
        '.ck-rij:hover{background:rgba(212,207,191,.05)}',
        '.ck-rij.aan{background:rgba(200,82,74,.1)}',
        '.ck-dot{width:9px;height:9px;border-radius:50%}',
        '.ck-dot.ok{background:#7ba58a}.ck-dot.let-op{background:#b8a472}.ck-dot.zuur{background:#c8524a;box-shadow:0 0 8px rgba(200,82,74,.7)}',
        '.ck-rij .n{font-size:14.5px;color:#e8e4d6} .ck-rij .n small{display:block;font-size:11px;color:rgba(212,207,191,.42)}',
        '.ck-rij .m{font-family:"JetBrains Mono",monospace;font-size:12px;color:rgba(212,207,191,.65);text-align:right}',
        '.ck-detail{padding:18px 22px;display:flex;flex-direction:column;gap:13px}',
        '.ck-dkop{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}',
        '.ck-dkop h4{font-family:"Baloo 2",sans-serif;font-weight:600;font-size:22px;color:#e8e4d6;margin:0}',
        '.ck-dkop span{font-family:"JetBrains Mono",monospace;font-size:11px;color:rgba(212,207,191,.5)}',
        '.ck-badge{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:99px}',
        '.ck-badge.ok{background:rgba(123,165,138,.18);color:#7ba58a}.ck-badge.let-op{background:rgba(184,164,114,.16);color:#b8a472}.ck-badge.zuur{background:rgba(200,82,74,.2);color:#e0847d}',
        /* voeradvies: twee kaarten */
        '.ck-voer{display:grid;grid-template-columns:1fr 1fr;gap:13px}',
        '.ck-vkaart{border-radius:9px;padding:13px 15px;border:1px solid rgba(200,82,74,.5);background:rgba(200,82,74,.07)}',
        '.ck-vkaart.rv{border-color:rgba(184,164,114,.45);background:rgba(184,164,114,.07)}',
        '.ck-vkaart h5{margin:0 0 7px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#e0847d}',
        '.ck-vkaart.rv h5{color:#b8a472}',
        '.ck-vkaart .cijfer{display:flex;align-items:baseline;gap:8px;margin-bottom:5px}',
        '.ck-vkaart .cijfer b{font-family:"Baloo 2",sans-serif;font-weight:600;font-size:21px;color:#e8e4d6}',
        '.ck-vkaart .cijfer .pijl{color:rgba(212,207,191,.45);font-size:14px}',
        '.ck-vkaart .cijfer .delta{font-family:"JetBrains Mono",monospace;font-size:11px;padding:2px 8px;border-radius:99px}',
        '.ck-vkaart .cijfer .delta.min{background:rgba(200,82,74,.22);color:#e0847d}',
        '.ck-vkaart .cijfer .delta.plus{background:rgba(184,164,114,.2);color:#b8a472}',
        '.ck-vkaart .cijfer .delta.nul{background:rgba(123,165,138,.18);color:#7ba58a}',
        '.ck-vkaart .titel{font-size:14.5px;color:#e8e4d6;line-height:1.35}',
        '.ck-vkaart p{margin:5px 0 0;font-size:12.5px;line-height:1.5;color:rgba(212,207,191,.62)}',
        '.ck-grafieken{display:grid;grid-template-columns:1fr 1fr;gap:13px}',
        '.ck-paneel{border:1px solid rgba(212,207,191,.12);border-radius:9px;padding:11px 13px;background:rgba(212,207,191,.03)}',
        '.ck-paneel h5{margin:0 0 7px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(212,207,191,.5)}',
        '.ck-paneel svg{display:block;width:100%;height:64px}',
        /* hitte-alert bovenin */
        '.ck-alert{display:flex;gap:12px;align-items:flex-start;padding:10px 18px;border-bottom:1px solid rgba(233,189,79,.35);background:rgba(233,189,79,.1);font-size:13px;line-height:1.5;color:rgba(212,207,191,.85)}',
        '.ck-alert .ico{flex:none;font-size:15px;line-height:1.4}',
        '.ck-alert b{font-weight:400;color:#e9bd4f}',
        /* actie van vandaag in de krachtvoerkaart */
        '.ck-actie{margin-top:9px;border-top:1px dashed rgba(212,207,191,.25);padding-top:8px}',
        '.ck-actie h6{margin:0 0 3px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#7ba58a}',
        '.ck-actie p{margin:0;font-size:13px;line-height:1.5;color:#e8e4d6}',
        /* optimum-staaf per koe */
        '.ck-gauge{border:1px solid rgba(212,207,191,.12);border-radius:9px;padding:11px 13px;background:rgba(212,207,191,.03)}',
        '.ck-gauge h5{margin:0 0 8px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(212,207,191,.5)}',
        '.ck-gauge svg{display:block;width:100%;height:auto}',
        /* koppeladvies onderin */
        '.ck-koppel{border-top:1px solid rgba(212,207,191,.14);padding:14px 18px;display:flex;gap:12px;align-items:flex-start}',
        '.ck-koppel .ico{flex:none;font-size:15px;line-height:1.5}',
        '.ck-koppel div{font-size:13.5px;line-height:1.55;color:rgba(212,207,191,.75)}',
        '.ck-koppel h6{margin:0 0 3px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#b8a472}',
        '.ck-koppel b{font-weight:400;color:#e8e4d6}',
        '.ck-voetnoot{padding:9px 18px;border-top:1px solid rgba(212,207,191,.12);font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.08em;color:rgba(212,207,191,.38)}',
        '@media (max-width:760px){.ck-romp{grid-template-columns:1fr}.ck-lijst{border-right:0;border-bottom:1px solid rgba(212,207,191,.14)}.ck-rijen{max-height:210px}.ck-grafieken,.ck-voer{grid-template-columns:1fr}.ck-kpis{width:100%;margin-left:0}}'
    ].join('\n');

    function spark(reeks, basis, kleur, min, max) {
        var W = 260, H = 64, n = reeks.length;
        function X(i) { return 6 + i * (W - 12) / (n - 1); }
        function Y(v) { return H - 7 - (v - min) / (max - min) * (H - 15); }
        var d = reeks.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
        var b = basis == null ? '' : '<line x1="6" x2="' + (W - 6) + '" y1="' + Y(basis).toFixed(1) + '" y2="' + Y(basis).toFixed(1) +
            '" stroke="rgba(212,207,191,.3)" stroke-dasharray="3 5" stroke-width="1"/>';
        return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + b +
            '<path d="' + d + '" fill="none" stroke="' + kleur + '" stroke-width="2" stroke-linecap="round"/></svg>';
    }

    /* de lat per koe: geel | groen | rood met haar positie t.o.v. haar optimum */
    function gauge(k) {
        var W = 560, H = 74, links = 10, rechts = W - 10;
        function X(afst) { var t = (afst + 1.6) / 3.2; return links + Math.max(0, Math.min(1, t)) * (rechts - links); }
        var g1 = X(-0.3), g2 = X(0.3), g3 = X(0.8), x = X(k.afst);
        var kleur = k.afst > 0.8 ? '#c8524a' : (Math.abs(k.afst) <= 0.3 ? '#7ba58a' : '#e9bd4f');
        return '<svg viewBox="0 0 ' + W + ' ' + H + '">' +
            '<rect x="' + links + '" y="18" width="' + (g1 - links) + '" height="22" rx="4" fill="rgba(233,189,79,.28)"/>' +
            '<rect x="' + g1 + '" y="18" width="' + (g2 - g1) + '" height="22" rx="4" fill="rgba(123,165,138,.4)"/>' +
            '<rect x="' + g2 + '" y="18" width="' + (g3 - g2) + '" height="22" rx="4" fill="rgba(233,189,79,.28)"/>' +
            '<rect x="' + g3 + '" y="18" width="' + (rechts - g3) + '" height="22" rx="4" fill="rgba(200,82,74,.3)"/>' +
            '<line x1="' + ((g1 + g2) / 2) + '" y1="12" x2="' + ((g1 + g2) / 2) + '" y2="46" stroke="rgba(212,207,191,.5)" stroke-dasharray="3 4" stroke-width="1"/>' +
            '<circle cx="' + x.toFixed(1) + '" cy="29" r="8" fill="' + kleur + '" stroke="#e8e4d6" stroke-width="2"/>' +
            '<text x="' + links + '" y="62" fill="rgba(233,189,79,.85)" font-family="JetBrains Mono,monospace" font-size="10" letter-spacing="1.5">TE WEINIG</text>' +
            '<text x="' + ((g1 + g2) / 2) + '" y="62" fill="rgba(123,165,138,.9)" font-family="JetBrains Mono,monospace" font-size="10" letter-spacing="1.5" text-anchor="middle">OPTIMUM</text>' +
            '<text x="' + ((g2 + g3) / 2) + '" y="62" fill="rgba(233,189,79,.85)" font-family="JetBrains Mono,monospace" font-size="10" letter-spacing="1.5" text-anchor="middle">TE VEEL</text>' +
            '<text x="' + rechts + '" y="62" fill="rgba(224,132,125,.9)" font-family="JetBrains Mono,monospace" font-size="10" letter-spacing="1.5" text-anchor="end">VERZUURT</text>' +
            '</svg>';
    }

    function init() {
        var wortel = document.getElementById('cockpit');
        if (!wortel) return;
        var stijl = document.createElement('style'); stijl.textContent = css; document.head.appendChild(stijl);

        var koeien = maakKoppel(), filter = 'alle', huidig = koeien[0];
        var nOk = 0, nLet = 0, nZuur = 0;
        koeien.forEach(function (k) { if (k.status === 'ok') nOk++; else if (k.status === 'zuur') nZuur++; else nLet++; });

        wortel.innerHTML =
            '<div class="ck" role="application" aria-label="Ruminate cockpit">' +
            '  <div class="ck-kop">' +
            '    <span class="ck-merk">rum<i>&#305;</i>nate</span><span class="ck-tag">cockpit &middot; demobedrijf &middot; ' + koeien.length + ' koeien</span>' +
            '    <span class="ck-kpis"><span>optimum <b>' + nOk + '</b></span><span>aandacht <b class="g">' + nLet + '</b></span><span>risico <b class="r">' + nZuur + '</b></span></span>' +
            '  </div>' +
            '  <div class="ck-alert" role="note"><span class="ico">&#9888;</span><span><b>Hitte-alert:</b> volgende week woensdag stijgt de temperatuur tot boven de 30&nbsp;&deg;C. ' +
            'Controleer of de ventilatoren werken en bestel vast goed verteerbaar, smakelijk ruwvoer (bijv. luzerne of jong gemaaide kuil): bij hitte daalt de opname en stijgt het verzuringsrisico. Overweeg extra pensbuffer.</span></div>' +
            '  <div class="ck-romp">' +
            '    <div class="ck-lijst">' +
            '      <div class="ck-filters">' +
            '        <button data-f="alle" class="aan">Alle</button>' +
            '        <button data-f="aandacht">Aandacht</button>' +
            '        <button data-f="ok">Op optimum</button>' +
            '      </div>' +
            '      <div class="ck-rijen" id="ckRijen"></div>' +
            '    </div>' +
            '    <div class="ck-detail" id="ckDetail"></div>' +
            '  </div>' +
            '  <div class="ck-koppel"><span class="ico">&#127807;</span><div><h6>Koppeladvies &middot; basisrantsoen &middot; o.b.v. alle datapunten</h6>' +
            '<span id="ckKoppelTekst"></span></div></div>' +
            '  <div class="ck-voetnoot">demo-omgeving met voorbeelddata &middot; in productie gekoppeld aan melkrobot, halsband en CRV</div>' +
            '</div>';

        var rijen = wortel.querySelector('#ckRijen'), detail = wortel.querySelector('#ckDetail');

        function tekenLijst() {
            rijen.innerHTML = koeien.filter(function (k) {
                if (filter === 'alle') return true;
                if (filter === 'ok') return k.status === 'ok';
                return k.status !== 'ok';
            }).map(function (k) {
                var i = koeien.indexOf(k);
                return '<button class="ck-rij' + (k === huidig ? ' aan' : '') + '" data-i="' + i + '">' +
                    '<span class="ck-dot ' + k.status + '"></span>' +
                    '<span class="n">' + k.naam + '<small>lactatie ' + k.lactatie + ' &middot; ' + k.dim + ' dagen in melk</small></span>' +
                    '<span class="m">' + k.melk[13].toFixed(1) + ' kg<br>' + Math.round(k.herkauw[13]) + ' min</span></button>';
            }).join('');
        }

        function tekenDetail() {
            var k = huidig, a = advies(k);
            var mMin = Math.min.apply(null, k.melk.concat([k.basis])) - 1, mMax = Math.max.apply(null, k.melk.concat([k.basis])) + 1;
            var hMin = Math.min.apply(null, k.herkauw) - 15, hMax = Math.max.apply(null, k.herkauw) + 15;
            var lbl = { ok: 'op haar optimum', 'let-op': 'aandacht', zuur: 'risico op verzuring' };
            var doel = k.kv + a.kv.delta;
            var deltaKlasse = a.kv.delta < 0 ? 'min' : (a.kv.delta > 0 ? 'plus' : 'nul');
            var deltaTekst = a.kv.delta === 0 ? '=' : (a.kv.delta > 0 ? '+' : '') + a.kv.delta.toFixed(1).replace('.', ',') + ' kg';
            var cijfer = a.kv.delta === 0
                ? '<b>' + k.kv.toFixed(1).replace('.', ',') + ' kg/dag</b><span class="delta nul">=</span>'
                : '<b>' + k.kv.toFixed(1).replace('.', ',') + '</b><span class="pijl">&rarr;</span><b>' + doel.toFixed(1).replace('.', ',') + ' kg/dag</b>' +
                  '<span class="delta ' + deltaKlasse + '">' + deltaTekst + '</span>';
            detail.innerHTML =
                '<div class="ck-dkop"><h4>' + k.naam + '</h4><span>krachtvoerrest ' + k.rest.toFixed(1).replace('.', ',') + ' kg</span>' +
                '<span class="ck-badge ' + k.status + '">' + lbl[k.status] + '</span></div>' +
                '<div class="ck-gauge"><h5>Haar positie t.o.v. haar eigen optimum</h5>' + gauge(k) + '</div>' +
                '<div class="ck-voer">' +
                '  <div class="ck-vkaart"><h5>Krachtvoer &middot; per koe &middot; aan de robot</h5>' +
                '    <div class="cijfer">' + cijfer + '</div>' +
                '    <div class="titel">' + a.kv.titel + '</div><p>' + a.kv.uitleg + '</p>' +
                '    <div class="ck-actie"><h6>Vandaag &middot; automatisch uitgevoerd door de melkrobot</h6><p>' + a.actie + '</p></div></div>' +
                '  <div class="ck-vkaart rv"><h5>Ruwvoer &middot; per groep &middot; aan het voerhek</h5>' +
                '    <div class="titel">' + a.rv.titel + '</div><p>' + a.rv.uitleg + '</p></div>' +
                '</div>' +
                '<div class="ck-grafieken">' +
                '  <div class="ck-paneel"><h5>Melkgift &middot; 14 dagen &middot; stippellijn = basislijn</h5>' + spark(k.melk, k.basis, k.status === 'zuur' ? '#c8524a' : '#7ba58a', mMin, mMax) + '</div>' +
                '  <div class="ck-paneel"><h5>Herkauwtijd &middot; min/dag</h5>' + spark(k.herkauw, null, '#b8a472', hMin, hMax) + '</div>' +
                '</div>';
        }

        /* koppeladvies: een overkoepelend rantsoenadvies o.b.v. de hele koppel */
        (function () {
            var el = wortel.querySelector('#ckKoppelTekst');
            var teLaag = koeien.filter(function (k) { return k.status === 'let-op' && k.afst < 0; }).length;
            el.innerHTML = 'Gezien de staat van de koppel (' + nOk + ' op optimum, ' + nZuur + ' met verzuringsrisico, ' + teLaag + ' onder haar kunnen): ' +
                'zorg voor voldoende <b>structuur (prikkelend NDF)</b> en een <b>stabiel zetmeelaandeel</b> in het ruwvoer, en houd een <b>pensbuffer</b> achter de hand. ' +
                'De energiedichtheid kan iets omhoog voor de hoogproductieve groep. Bespreek dit met je voeradviseur bij het eerstvolgende rantsoenoverleg.';
        })();

        function alles() { tekenLijst(); tekenDetail(); }

        rijen.addEventListener('click', function (e) {
            var b = e.target.closest('.ck-rij'); if (!b) return;
            huidig = koeien[+b.getAttribute('data-i')]; alles();
        });
        wortel.querySelector('.ck-filters').addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return;
            filter = b.getAttribute('data-f');
            wortel.querySelectorAll('.ck-filters button').forEach(function (x) { x.classList.toggle('aan', x === b); });
            tekenLijst();
        });

        alles();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
