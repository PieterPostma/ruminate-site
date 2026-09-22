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

    /* ---------- voeradvies: reden erbij, ruwvoer als weekplan ---------- */
    function weeknr(offset) {
        var d = new Date(); d.setDate(d.getDate() + (offset || 0) * 7);
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d - start) / 864e5 + 1) / 7);
    }

    function advies(k) {
        var md = k.melk[13] - k.basis, lh = Math.round(k.herkauw[13]);
        function chip(t, kl) { return { t: t, kl: kl }; }
        var signalen = [
            chip('melk ' + (md >= 0 ? '+' : '−') + Math.abs(md).toFixed(1).replace('.', ',') + ' kg t.o.v. basislijn', md < -1 ? 'rood' : (md < -0.3 ? 'geel' : 'groen')),
            chip('herkauw ' + lh + ' min', lh < 460 ? 'rood' : (lh < 490 ? 'geel' : 'groen')),
            chip('rest ' + k.rest.toFixed(1).replace('.', ',') + ' kg', k.rest > 0.3 ? 'geel' : 'groen')
        ];
        if (k.status === 'zuur') return { signalen: signalen,
            kv: { delta: -0.8, titel: 'Opbouw pauzeren',
                  reden: 'Melkgift onder haar basislijn en herkauwtijd gezakt: het patroon van beginnende pensverzuring. Eerst de pens tot rust, dan stapsgewijs terug.' },
            actie: 'Vandaag −0,8 kg via de robot; daarna in kleine stappen terug opbouwen.',
            apart: {
                titel: 'Zet haar vandaag apart',
                tekst: 'In het strohok krijgt ze onbeperkt hooi en pensbuffer; terug bij de koppel zodra het herkauwen herstelt.'
            }
        };
        if (k.status === 'let-op' && k.afst > 0) return { signalen: signalen,
            kv: { delta: -1.0, titel: 'Portie verlagen',
                  reden: 'Ze laat drie dagen op rij krachtvoer liggen: de portie loopt vóór op haar opname. Verlagen voorkomt vervuiling in de box en selectief vreten.' },
            actie: 'Vandaag −1,0 kg: ze laat 3 dagen op rij krachtvoer liggen.'
        };
        if (k.status === 'let-op') return { signalen: signalen,
            kv: { delta: 0.6, titel: 'Bijvoeren, in twee stappen',
                  reden: 'Haar gezondheidssignalen zijn goed, maar de melkgift blijft achter bij haar kunnen: er is ruimte voor meer energie.' },
            actie: 'Vandaag +0,6 kg boven op haar standaardportie.'
        };
        return { signalen: signalen,
            kv: { delta: 0, titel: 'Handhaven',
                  reden: 'Melkgift en herkauwtijd bewegen binnen haar eigen bandbreedte.' },
            actie: 'Vandaag de standaardportie; herweging bij de melkcontrole.'
        };
    }

    /* ---------- opmaak ---------- */
    var css = [
        '.ck{position:relative;background:#101a11;color:#d4cfbf;border:1px solid rgba(212,207,191,.16);border-radius:14px;overflow:hidden;',
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
        '.ck-vkaart.apart{border-color:rgba(200,82,74,.7);background:rgba(200,82,74,.1)}',
        '.ck-vkaart.apart h5{color:#e0847d}',
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
        '.ck-vkaart p.reden{margin-top:7px}',
        /* groepslabels: status en advies gescheiden */
        '.ck-groep{margin:0 0 -4px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(212,207,191,.45)}',
        '.ck-groep.advies{border-top:1px solid rgba(212,207,191,.14);padding-top:13px;margin-top:3px}',
        /* weekplan in de ruwvoerkaart */
        '.ck-week{padding:9px 0;border-top:1px dashed rgba(212,207,191,.18)}',
        '.ck-week:first-of-type{border-top:0;padding-top:2px}',
        '.ck-week-kop{display:flex;align-items:center;gap:9px}',
        '.ck-week-kop .wk{font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#101a11;background:#b8a472;border-radius:99px;padding:3px 9px;white-space:nowrap}',
        '.ck-week-kop b{font-weight:400;font-size:13.5px;color:#e8e4d6}',
        '.ck-week p{margin:5px 0 7px}',
        /* doorzetten: delen en (toekomstige) leveranciers-integraties */
        '.ck-deel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:1px dashed rgba(212,207,191,.25);border-radius:9px;padding:10px 13px;margin-top:12px}',
        '.ck-deel h6{margin:0 8px 0 0;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(212,207,191,.5)}',
        '.ck-deelknop{font-family:"Jost",system-ui,sans-serif;font-weight:400;font-size:12.5px;color:#e8e4d6;background:rgba(212,207,191,.08);border:1px solid rgba(212,207,191,.3);border-radius:99px;padding:6px 14px;cursor:pointer;transition:background .2s ease-out,border-color .2s ease-out}',
        '.ck-deelknop:hover{background:rgba(212,207,191,.16);border-color:rgba(212,207,191,.5)}',
        '.ck-deelknop.lev{border-style:dashed;color:rgba(212,207,191,.7)}',
        '.ck-toast{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);background:#e8e4d6;color:#101a11;font-size:12.5px;padding:8px 18px;border-radius:99px;box-shadow:0 10px 30px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .25s ease-out;z-index:5;white-space:nowrap}',
        '.ck-toast.aan{opacity:1}',
        '.ck-grafieken{display:grid;grid-template-columns:1fr 1fr;gap:13px}',
        '.ck-paneel{border:1px solid rgba(212,207,191,.12);border-radius:9px;padding:11px 13px;background:rgba(212,207,191,.03)}',
        '.ck-paneel h5{margin:0 0 7px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(212,207,191,.5)}',
        '.ck-paneel svg{display:block;width:100%;height:64px}',
        /* datachips: de reden en de actiepunten als meetwaarden */
        '.ck-chips{display:flex;flex-wrap:wrap;gap:6px}',
        '.ck-chip{display:inline-block;font-family:"JetBrains Mono",monospace;font-size:10.5px;letter-spacing:.04em;padding:4px 10px;border-radius:99px;border:1px solid rgba(212,207,191,.25);color:rgba(212,207,191,.8);white-space:nowrap}',
        '.ck-chip.groen{border-color:rgba(123,165,138,.55);color:#7ba58a}',
        '.ck-chip.geel{border-color:rgba(233,189,79,.55);color:#e9bd4f}',
        '.ck-chip.rood{border-color:rgba(200,82,74,.6);color:#e0847d}',
        '.ck-chip.goud{border-color:rgba(184,164,114,.5);color:#b8a472;margin-top:8px}',
        /* hitte-alert bovenin */
        '.ck-alert{display:flex;gap:10px;align-items:center;padding:11px 18px;border-bottom:1px solid rgba(233,189,79,.4);border-left:3px solid #e9bd4f;background:rgba(233,189,79,.09);font-size:13px;line-height:1.5;color:rgba(212,207,191,.85)}',
        '.ck-alert .ico{flex:none;font-size:15px;line-height:1;color:#e9bd4f}',
        '.ck-alert b{font-weight:400;color:#e9bd4f}',
        /* actie van vandaag in de krachtvoerkaart */
        '.ck-actie{margin-top:9px;border-top:1px dashed rgba(212,207,191,.25);padding-top:8px}',
        '.ck-actie h6{margin:0 0 3px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#7ba58a}',
        '.ck-actie p{margin:0;font-size:13px;line-height:1.5;color:#e8e4d6}',
        /* optimum-staaf per koe */
        '.ck-gauge{border:1px solid rgba(212,207,191,.12);border-radius:9px;padding:11px 13px;background:rgba(212,207,191,.03)}',
        '.ck-gauge h5{margin:0 0 8px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(212,207,191,.5)}',
        '.ck-gauge svg{display:block;width:100%;height:auto}',
        '.ck-gauge-legende{display:flex;justify-content:space-between;margin-top:6px;font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase}',
        '.ck-gauge-legende .lg-geel{color:rgba(233,189,79,.85)}',
        '.ck-gauge-legende .lg-groen{color:rgba(123,165,138,.9)}',
        '.ck-gauge-legende .lg-rood{color:rgba(224,132,125,.9)}',
        /* koppeladvies onderin */
        '.ck-koppel{padding:16px 18px;display:flex;gap:12px;align-items:flex-start}',
        '.ck-koppel .ico{flex:none;font-size:15px;line-height:1.5}',
        '.ck-koppel div{font-size:13.5px;line-height:1.55;color:rgba(212,207,191,.75)}',
        '.ck-koppel h6{margin:0 0 3px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#b8a472}',
        '.ck-koppel small{display:block;margin-top:7px;font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:.06em;color:rgba(212,207,191,.5)}',
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
        var H2 = 46;
        var g1 = X(-0.3), g2 = X(0.3), x = X(k.afst);
        var kleur = k.afst > 0.8 ? '#c8524a' : (Math.abs(k.afst) <= 0.3 ? '#7ba58a' : '#e9bd4f');
        return '<svg viewBox="0 0 ' + W + ' ' + H2 + '">' +
            '<rect x="' + links + '" y="12" width="' + (g1 - links) + '" height="22" rx="4" fill="rgba(233,189,79,.28)"/>' +
            '<rect x="' + g1 + '" y="12" width="' + (g2 - g1) + '" height="22" rx="4" fill="rgba(123,165,138,.4)"/>' +
            '<rect x="' + g2 + '" y="12" width="' + (rechts - g2) + '" height="22" rx="4" fill="rgba(200,82,74,.3)"/>' +
            '<line x1="' + ((g1 + g2) / 2) + '" y1="6" x2="' + ((g1 + g2) / 2) + '" y2="40" stroke="rgba(212,207,191,.5)" stroke-dasharray="3 4" stroke-width="1"/>' +
            '<circle cx="' + x.toFixed(1) + '" cy="23" r="8" fill="' + kleur + '" stroke="#e8e4d6" stroke-width="2"/>' +
            '</svg>' +
            /* labels als HTML, zodat ze op elk schermformaat leesbaar blijven */
            '<div class="ck-gauge-legende">' +
            '<span class="lg-geel">Te weinig</span><span class="lg-groen">Optimum</span>' +
            '<span class="lg-rood">Te veel &middot; verzuurt</span></div>';
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
            '  <div class="ck-alert" role="note"><span class="ico">&#9888;</span>' +
            '<span><b>Hitte-alert &middot; wo &gt;30&nbsp;&deg;C.</b> Check de ventilatoren; het voeradvies houdt er rekening mee.</span></div>' +
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
                    '<span class="n">' + k.naam + '</span>' +
                    '<span class="m">' + k.melk[13].toFixed(1) + ' kg</span></button>';
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
            var chips = a.signalen.map(function (c) { return '<span class="ck-chip ' + c.kl + '">' + c.t + '</span>'; }).join('');
            detail.innerHTML =
                '<div class="ck-dkop"><h4>' + k.naam + '</h4>' +
                '<span class="ck-badge ' + k.status + '">' + lbl[k.status] + '</span></div>' +
                '<div class="ck-chips">' + chips + '</div>' +
                '<div class="ck-gauge"><h5>Haar positie t.o.v. haar eigen optimum</h5>' + gauge(k) + '</div>' +
                '<div class="ck-paneel"><h5>Melkgift &middot; 14 dagen &middot; stippellijn = basislijn</h5>' + spark(k.melk, k.basis, k.status === 'zuur' ? '#c8524a' : '#7ba58a', mMin, mMax) + '</div>' +
                (function () {
                    var kvKaart = '<div class="ck-vkaart"><h5>Advies &middot; krachtvoer aan de robot</h5>' +
                        '  <div class="cijfer">' + cijfer + '</div>' +
                        '  <div class="titel">' + a.kv.titel + '</div>' +
                        '  <p>' + a.actie + '</p></div>';
                    if (!a.apart) return kvKaart;
                    var apartKaart = '<div class="ck-vkaart apart"><h5>&#9888; Apart zetten</h5>' +
                        '  <div class="titel">' + a.apart.titel + '</div>' +
                        '  <p>' + a.apart.tekst + '</p></div>';
                    return '<div class="ck-voer">' + kvKaart + apartKaart + '</div>';
                })();
        }

        /* koppeladvies: eigen blok buiten de cockpit, voor de hele koppel */
        (function () {
            var doel = document.getElementById('koppeladvies');
            if (!doel) return;
            var plan = [
                { week: weeknr(0), titel: 'Structuur omhoog én klaar voor de hitte',
                  tekst: '+1 kg hooi of stro per koe per dag en pensbuffer erbij. Met de hitte van woensdag: licht verteerbaar ruwvoer, zoals luzerne of vroeg gemaaide kuil.' },
                { week: weeknr(1), titel: 'Herbeoordelen',
                  tekst: 'Bij herstel terug naar het basisrantsoen; neem de melkcontrole mee.' }
            ];
            doel.innerHTML = '<div class="ck"><div class="ck-koppel"><span class="ico">&#127807;</span><div style="flex:1">' +
                '<h6>Koppeladvies &middot; ruwvoer &amp; basisrantsoen &middot; aan het voerhek</h6>' +
                plan.map(function (w) {
                    return '<div class="ck-week"><div class="ck-week-kop"><span class="wk">Week ' + w.week + '</span><b>' + w.titel + '</b></div>' +
                        '<p>' + w.tekst + '</p></div>';
                }).join('') +
                '<div class="ck-deel">' +
                '<button class="ck-deelknop" type="button">Deel met je voeradviseur</button>' +
                '<span class="ck-chip goud">integraties &middot; binnenkort</span></div>' +
                '</div></div></div>';
            doel.querySelector('.ck').addEventListener('click', function (e) {
                var b = e.target.closest('.ck-deelknop'); if (!b) return;
                toast.textContent = 'Demo · deze koppeling bouwen we samen met de pilotbedrijven';
                toast.classList.add('aan');
                clearTimeout(toastTimer);
                toastTimer = setTimeout(function () { toast.classList.remove('aan'); }, 2400);
            });
        })();

        function alles() { tekenLijst(); tekenDetail(); }

        rijen.addEventListener('click', function (e) {
            var b = e.target.closest('.ck-rij'); if (!b) return;
            huidig = koeien[+b.getAttribute('data-i')]; alles();
        });

        /* doorzetten-knoppen: nette demo-melding */
        var toast = document.createElement('div');
        toast.className = 'ck-toast';
        wortel.querySelector('.ck').appendChild(toast);
        var toastTimer;
        wortel.querySelector('.ck').addEventListener('click', function (e) {
            var b = e.target.closest('.ck-deelknop'); if (!b) return;
            toast.textContent = 'Demo · deze koppeling bouwen we samen met de pilotbedrijven';
            toast.classList.add('aan');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(function () { toast.classList.remove('aan'); }, 2400);
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
