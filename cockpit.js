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
    /* het beeld per koe; wie niet genoemd is, zit op haar optimum */
    var PROFIEL = { 'Sietske 4': 'zuur', 'Doutzen 25': 'zuur', 'Afke 33': 'zuur',
        'Femke 19': 'hoog', 'Teatske 6': 'hoog', 'Baukje 28': 'hoog',
        'Marijke 8': 'laag', 'Grytsje 9': 'laag', 'Hylkje 21': 'ketose', 'Jantsje 40': 'kreupel' };

    /* zone op de lat: kg krachtvoer boven (+) of onder (-) haar optimum */
    function zone(afst) { return afst < -0.3 ? 'laag' : (afst <= 0.3 ? 'ok' : (afst <= 0.8 ? 'hoog' : 'zuur')); }

    function maakKoppel() {
        var koeien = [];
        for (var i = 0; i < NAMEN.length; i++) {
            var r = rng(20260926 + i * 7919), p = PROFIEL[NAMEN[i]] || 'ok';
            var lactatie = 1 + Math.floor(r() * 4);
            var dim = p === 'zuur' ? 45 + Math.floor(r() * 70)
                : p === 'ketose' ? 9 + Math.floor(r() * 14)
                : p === 'kreupel' ? 60 + Math.floor(r() * 200) : 20 + Math.floor(r() * 270);
            var basis = 37 - dim * 0.035 - (lactatie === 1 ? 4 : 0) + (r() - 0.5) * 6;   // haar eigen norm, kg/dag
            var normH = 480 + r() * 80;                                                   // herkauwen, min/dag
            var vetN = p === 'zuur' ? 4.0 + r() * 0.3 : (p === 'ketose' ? 4.6 : 4.1 + r() * 0.5);
            var eiwN = p === 'laag' ? 3.15 + r() * 0.1 : 3.4 + r() * 0.25;
            var afst = p === 'zuur' ? 0.85 + r() * 0.6 : p === 'hoog' ? 0.4 + r() * 0.3
                : (p === 'laag' || p === 'ketose' || p === 'kreupel') ? -(0.4 + r() * 0.6) : (r() - 0.5) * 0.5;
            var melk = [], herkauw = [], vet = [], eiwit = [], act = [];
            for (var d = 0; d < 14; d++) {
                var t = Math.max(0, d - 8), th = Math.max(0, d - 10);   // afwijking vanaf dag 9 (hoog: dag 11)
                melk.push(basis + Math.sin(d * 1.7 + i) * 0.6 + (r() - 0.5) * 1.0
                    - (p === 'zuur' ? 1.1 * t : p === 'ketose' || p === 'kreupel' ? 0.9 * t : p === 'hoog' ? 0.4 * th : 0));
                herkauw.push(normH + Math.sin(d * 1.1 + i * 2) * 14 + (r() - 0.5) * 24
                    - (p === 'zuur' ? 24 * t : p === 'ketose' ? 12 * t : p === 'kreupel' ? 7 * t : p === 'hoog' ? 8 * th : 0));
                vet.push(vetN + (r() - 0.5) * 0.14
                    - (p === 'zuur' ? 0.22 * t : p === 'hoog' ? 0.06 * th : 0) + (p === 'ketose' ? 0.22 * t : 0));
                eiwit.push(eiwN + (r() - 0.5) * 0.06 - (p === 'ketose' ? 0.03 * t : 0));
                act.push(100 + (r() - 0.5) * 8 - (p === 'zuur' ? 4 * t : p === 'ketose' ? 3 * t : p === 'kreupel' ? 7 * t : 0));
            }
            koeien.push({
                naam: NAMEN[i], profiel: p, zone: zone(afst), afst: afst,
                lactatie: lactatie, dim: dim, leeftijd: Math.floor(2.1 + (lactatie - 1) * 1.15 + dim / 365),
                basis: basis, normH: normH, vetN: vetN,
                melk: melk, herkauw: herkauw, vet: vet, eiwit: eiwit, act: act,
                kv: 3 + r() * 5, rest: p === 'hoog' || p === 'kreupel' ? 0.6 + r() * 0.6 : r() * 0.2
            });
        }
        var orde = { zuur: 0, kreupel: 1, ketose: 1, hoog: 2, laag: 3, ok: 4 };
        koeien.sort(function (a, b) { return orde[a.profiel] - orde[b.profiel] || a.naam.localeCompare(b.naam); });
        return koeien;
    }

    /* ---------- signalen: de laatste 3 dagen t.o.v. haar eigen norm ---------- */
    function gem3(a) { return (a[11] + a[12] + a[13]) / 3; }
    function nl(v, n) { return v.toFixed(n == null ? 1 : n).replace('.', ','); }
    function pct(v) { return (v >= 0 ? '+' : '−') + Math.abs(Math.round(v)) + '%'; }

    function signalen(k) {
        var dM = gem3(k.melk) - k.basis, dH = (gem3(k.herkauw) / k.normH - 1) * 100, dA = gem3(k.act) - 100;
        var v = gem3(k.vet), e = gem3(k.eiwit), ratio = v / e;
        var ve = ratio > 1.5 ? 'ratio ' + nl(ratio, 2) : (v < e ? 'inversie' : (v - k.vetN < -0.3 ? 'vet daalt' : ''));
        return {
            melk: { af: dM < -1.5, tekst: dM < -1.5 ? '−' + nl(-dM) + ' kg t.o.v. norm' : 'binnen haar norm' },
            herkauw: { af: dH < -8, pct: dH, tekst: Math.round(gem3(k.herkauw)) + ' min/dag · ' + pct(dH) },
            vet: { af: !!ve, v: v, e: e, ratio: ratio, tekst: nl(v, 2) + ' / ' + nl(e, 2) + (ve ? ' · ' + ve : '') },
            act: { af: dA < -12, pct: dA, tekst: dA < -12 ? pct(dA) + ' t.o.v. norm' : 'binnen haar norm' }
        };
    }

    /* ---------- conclusie en advies, met de reden erbij ---------- */
    var MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
        'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    function maand(offset) {
        var d = new Date();
        var naam = MAANDEN[(d.getMonth() + (offset || 0)) % 12];
        return naam.charAt(0).toUpperCase() + naam.slice(1);
    }

    function advies(k, s) {
        var h = Math.round(-s.herkauw.pct), a = Math.round(-s.act.pct);
        switch (k.profiel) {
        case 'zuur': return {
            conclusie: '<b>Verdenking pensverzuring.</b> Herkauwen −' + h + '%, vet onder eiwit (inversie) en minder actief, op dag ' + k.dim +
                ': midden in de risicoperiode van dag 40 tot 120.',
            kv: { delta: -0.8, titel: 'Opbouw pauzeren',
                  actie: 'Vandaag −0,8 kg via de robot, daarna in kleine stappen terug. Heeft ze energie nodig, dan liever pensbestendig vet dan krachtvoer.' },
            kaart: { kl: 'rood', kop: '&#9888; Apart zetten', titel: 'Zet haar vandaag apart',
                  tekst: 'In het strohok met onbeperkt hooi en pensbuffer; terug bij de koppel zodra het herkauwen herstelt.' } };
        case 'kreupel': return {
            conclusie: '<b>Eerder kreupel dan verzuurd.</b> Activiteit −' + a + '%, maar vet en eiwit normaal en herkauwen maar licht lager. ' +
                'Ze komt minder aan de robot en laat daardoor krachtvoer liggen.',
            kv: { delta: 0, titel: 'Voer handhaven', actie: 'Geen voeraanpassing: eerst de oorzaak.' },
            kaart: { kl: 'oranje', kop: 'Klauwen', titel: 'Laat haar vandaag nakijken',
                  tekst: 'Haal haar op voor de robot tot ze weer goed loopt; bij klauwproblemen de bekapper of dierenarts.' } };
        case 'ketose': return {
            conclusie: '<b>Let op ketose.</b> Vet/eiwit ' + nl(s.vet.ratio, 2) + ' op dag ' + k.dim +
                ': ze teert in op haar reserves. Melkgift en herkauwen zakken mee.',
            kv: { delta: 0.3, titel: 'Energie erbij, in kleine stappen',
                  actie: '+0,3 kg; niet sneller opbouwen, dat vergroot het verzuringsrisico.' },
            kaart: { kl: 'oranje', kop: 'Propyleenglycol', titel: '300 ml per dag, 3 tot 5 dagen',
                  tekst: 'Via de robot of als drench. Na drie dagen vet/eiwit opnieuw bekijken; zakt ze verder, bel de dierenarts.' } };
        case 'hoog': return {
            conclusie: '<b>Portie loopt vóór op haar opname.</b> Ze laat drie dagen op rij krachtvoer liggen (rest ' + nl(k.rest) +
                ' kg) en haar vetgehalte zakt licht. Nog geen verzuring, wel die richting.',
            kv: { delta: -1.0, titel: 'Portie verlagen', actie: 'Vandaag −1,0 kg: voorkomt restvoer in de box en uitzoeken.' } };
        case 'laag': return {
            conclusie: '<b>Ruimte voor meer energie.</b> Herkauwen, vet en activiteit zijn goed; alleen het eiwitgehalte (' +
                nl(s.vet.e, 2) + '%) blijft laag, een teken van energietekort.',
            kv: { delta: 0.6, titel: 'Bijvoeren, in twee stappen', actie: 'Vandaag +0,6 kg boven op haar standaardportie.' } };
        default: return {
            conclusie: 'Alle vier de signalen liggen binnen haar eigen norm.',
            kv: { delta: 0, titel: 'Handhaven', actie: 'Vandaag de standaardportie; herweging bij de melkcontrole.' } };
        }
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
        '.ck-kpis{margin-left:auto;display:flex;gap:16px;flex-wrap:wrap;font-family:"JetBrains Mono",monospace;font-size:11px;color:rgba(212,207,191,.6)}',
        '.ck-kpis b{font-weight:400} .ck-kpis b.laag{color:#e9bd4f} .ck-kpis b.ok{color:#7ba58a} .ck-kpis b.hoog{color:#e59a52} .ck-kpis b.zuur{color:#e0847d}',
        '.ck-romp{display:grid;grid-template-columns:minmax(250px,330px) minmax(0,1fr)}',
        '.ck-lijst{border-right:1px solid rgba(212,207,191,.14);display:flex;flex-direction:column}',
        '.ck-filters{display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid rgba(212,207,191,.1)}',
        '.ck-filters button{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;',
        '    background:none;border:1px solid rgba(212,207,191,.25);border-radius:99px;color:rgba(212,207,191,.6);padding:5px 12px;cursor:pointer}',
        '.ck-filters button.aan{background:#d4cfbf;color:#101a11;border-color:#d4cfbf}',
        '.ck-rijen{overflow-y:auto;max-height:560px;flex:1}',
        '.ck-rij{display:grid;grid-template-columns:10px 1fr auto;gap:12px;align-items:center;width:100%;text-align:left;',
        '    background:none;border:0;border-bottom:1px solid rgba(212,207,191,.07);color:inherit;padding:9px 14px;cursor:pointer;font:inherit}',
        '.ck-rij:hover{background:rgba(212,207,191,.05)}',
        '.ck-rij.aan{background:rgba(200,82,74,.1)}',
        /* stip = kleur van haar zone op de lat */
        '.ck-dot{width:9px;height:9px;border-radius:50%}',
        '.ck-dot.laag{background:#e9bd4f}.ck-dot.ok{background:#7ba58a}.ck-dot.hoog{background:#e59a52}.ck-dot.zuur{background:#c8524a;box-shadow:0 0 8px rgba(200,82,74,.7)}',
        '.ck-rij .n{font-size:14.5px;color:#e8e4d6} .ck-rij .n small{display:block;margin-top:1px;font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.03em;color:rgba(212,207,191,.42)}',
        '.ck-rij .n small em{font-style:normal;color:#e59a52}',
        '.ck-rij .m{font-family:"JetBrains Mono",monospace;font-size:12px;color:rgba(212,207,191,.65);text-align:right}',
        '.ck-detail{padding:18px 22px;display:flex;flex-direction:column;gap:13px}',
        '.ck-dkop{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
        '.ck-dkop h4{font-family:"Baloo 2",sans-serif;font-weight:600;font-size:22px;line-height:1.1;color:#e8e4d6;margin:0 4px 0 0}',
        '.ck-dsub{margin-top:-9px;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.03em;color:rgba(212,207,191,.55)}',
        '.ck-badge{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:99px}',
        '.ck-badge.laag{background:rgba(233,189,79,.14);color:#e9bd4f}.ck-badge.ok{background:rgba(123,165,138,.18);color:#7ba58a}',
        '.ck-badge.hoog{background:rgba(229,154,82,.16);color:#e59a52}.ck-badge.zuur{background:rgba(200,82,74,.2);color:#e0847d}',
        '.ck-badge.vlag{background:none;border:1px solid rgba(229,154,82,.6);color:#e59a52}',
        /* voeradvies: kaarten */
        '.ck-voer{display:grid;grid-template-columns:1fr 1fr;gap:13px}',
        '.ck-vkaart{border-radius:9px;padding:13px 15px;border:1px solid rgba(212,207,191,.22);background:rgba(212,207,191,.04)}',
        '.ck-vkaart.rood{border-color:rgba(200,82,74,.7);background:rgba(200,82,74,.1)}',
        '.ck-vkaart.oranje{border-color:rgba(229,154,82,.6);background:rgba(229,154,82,.08)}',
        '.ck-vkaart h5{margin:0 0 7px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(212,207,191,.55)}',
        '.ck-vkaart.rood h5{color:#e0847d}.ck-vkaart.oranje h5{color:#e59a52}',
        '.ck-vkaart .cijfer{display:flex;align-items:baseline;gap:8px;margin-bottom:5px}',
        '.ck-vkaart .cijfer b{font-family:"Baloo 2",sans-serif;font-weight:600;font-size:21px;color:#e8e4d6}',
        '.ck-vkaart .cijfer .pijl{color:rgba(212,207,191,.45);font-size:14px}',
        '.ck-vkaart .cijfer .delta{font-family:"JetBrains Mono",monospace;font-size:11px;padding:2px 8px;border-radius:99px}',
        '.ck-vkaart .cijfer .delta.min{background:rgba(200,82,74,.22);color:#e0847d}',
        '.ck-vkaart .cijfer .delta.plus{background:rgba(233,189,79,.18);color:#e9bd4f}',
        '.ck-vkaart .cijfer .delta.nul{background:rgba(123,165,138,.18);color:#7ba58a}',
        '.ck-vkaart .titel{font-size:14.5px;color:#e8e4d6;line-height:1.35}',
        '.ck-vkaart p{margin:5px 0 0;font-size:12.5px;line-height:1.5;color:rgba(212,207,191,.62)}',
        /* onderbouwing: conclusie + vier signalen t.o.v. haar norm */
        '.ck-grond{border:1px solid rgba(212,207,191,.12);border-radius:9px;padding:12px 13px;background:rgba(212,207,191,.03)}',
        '.ck-grond h5,.ck-gauge h5{margin:0 0 8px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(212,207,191,.5)}',
        '.ck-conclusie{margin:0 0 11px;font-size:13.5px;line-height:1.5;color:rgba(212,207,191,.78)}',
        '.ck-conclusie b{font-weight:400;color:#e8e4d6}',
        '.ck-sig{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}',
        '.ck-sig > div{min-width:0;border-top:1px dashed rgba(212,207,191,.16);padding-top:7px}',
        '.ck-sig h6{margin:0;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(212,207,191,.5)}',
        '.ck-sig .w{display:block;margin-top:2px;font-size:13px;color:#7ba58a}',
        '.ck-sig .af .w{color:#e0847d}',
        '.ck-sig svg{display:block;width:100%;height:38px;margin-top:4px}',
        '.ck-sig-voet{margin-top:9px;font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:.04em;color:rgba(212,207,191,.4)}',
        /* koppeladvies en inkooplijst */
        '.ck-week{padding:9px 0;border-top:1px dashed rgba(212,207,191,.18)}',
        '.ck-week:first-of-type{border-top:0;padding-top:2px}',
        '.ck-week-kop{display:flex;align-items:center;gap:9px}',
        '.ck-week-kop .wk{font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#101a11;background:#b8a472;border-radius:99px;padding:3px 9px;white-space:nowrap}',
        '.ck-week-kop b{font-weight:400;font-size:13.5px;color:#e8e4d6}',
        '.ck-week p{margin:5px 0 7px}',
        '.ck-inkoop{margin-top:12px;border:1px solid rgba(212,207,191,.14);border-radius:9px;padding:12px 14px;background:rgba(212,207,191,.03)}',
        '.ck-inkoop h6{margin:0 0 8px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(212,207,191,.5)}',
        '.ck-inkoop-rij{display:grid;grid-template-columns:1fr auto auto;gap:14px;align-items:baseline;padding:8px 0;border-top:1px dashed rgba(212,207,191,.15)}',
        '.ck-inkoop-rij:first-of-type{border-top:0;padding-top:2px}',
        '.ck-inkoop-rij .wat{font-size:13.5px;color:#e8e4d6}',
        '.ck-inkoop-rij .wat small{display:block;font-size:11px;color:rgba(212,207,191,.45)}',
        '.ck-inkoop-rij .kg{font-family:"JetBrains Mono",monospace;font-size:13px;color:#e9bd4f;white-space:nowrap}',
        '.ck-inkoop-rij .eenheid{font-size:12px;color:rgba(212,207,191,.6);white-space:nowrap}',
        '.ck-inkoop .noot{margin:8px 0 0;padding-top:8px;border-top:1px dashed rgba(212,207,191,.15);font-size:12px;line-height:1.5;color:rgba(212,207,191,.55)}',
        '@media (max-width:640px){.ck-inkoop-rij{grid-template-columns:1fr auto}.ck-inkoop-rij .eenheid{grid-column:1/-1;margin-top:-4px}}',
        '.ck-inkoop.volgt{border-style:dashed;background:none}',
        '.ck-inkoop.volgt p{margin:0;font-size:12.5px;line-height:1.5;color:rgba(212,207,191,.55);font-style:italic}',
        /* doorzetten: delen en (toekomstige) leveranciers-integraties */
        '.ck-deel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:1px dashed rgba(212,207,191,.25);border-radius:9px;padding:10px 13px;margin-top:12px}',
        '.ck-deelknop{font-family:"Jost",system-ui,sans-serif;font-weight:400;font-size:12.5px;color:#e8e4d6;background:rgba(212,207,191,.08);border:1px solid rgba(212,207,191,.3);border-radius:99px;padding:6px 14px;cursor:pointer;transition:background .2s ease-out,border-color .2s ease-out}',
        '.ck-deelknop:hover{background:rgba(212,207,191,.16);border-color:rgba(212,207,191,.5)}',
        '.ck-toast{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);background:#e8e4d6;color:#101a11;font-size:12.5px;padding:8px 18px;border-radius:99px;box-shadow:0 10px 30px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .25s ease-out;z-index:5;white-space:nowrap}',
        '.ck-toast.aan{opacity:1}',
        '.ck-chip{display:inline-block;font-family:"JetBrains Mono",monospace;font-size:10.5px;letter-spacing:.04em;padding:4px 10px;border-radius:99px;border:1px solid rgba(212,207,191,.25);color:rgba(212,207,191,.8);white-space:nowrap}',
        '.ck-chip.goud{border-color:rgba(184,164,114,.5);color:#b8a472}',
        /* hitte-alert bovenin */
        '.ck-alert{display:flex;gap:10px;align-items:center;padding:11px 18px;border-bottom:1px solid rgba(233,189,79,.4);border-left:3px solid #e9bd4f;background:rgba(233,189,79,.09);font-size:13px;line-height:1.5;color:rgba(212,207,191,.85)}',
        '.ck-alert .ico{flex:none;font-size:15px;line-height:1;color:#e9bd4f}',
        '.ck-alert b{font-weight:400;color:#e9bd4f}',
        '.ck-actie{margin-top:9px;border-top:1px dashed rgba(212,207,191,.25);padding-top:8px}',
        /* optimum-staaf per koe: geel | groen | oranje | rood */
        '.ck-gauge{border:1px solid rgba(212,207,191,.12);border-radius:9px;padding:11px 13px;background:rgba(212,207,191,.03)}',
        '.ck-gauge svg{display:block;width:100%;height:auto}',
        '.ck-gauge-legende{display:grid;grid-template-columns:1.3fr .6fr .5fr .8fr;margin-top:6px;font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;text-align:center}',
        '.ck-gauge-legende .lg-laag{color:rgba(233,189,79,.85)}',
        '.ck-gauge-legende .lg-ok{color:rgba(123,165,138,.9)}',
        '.ck-gauge-legende .lg-hoog{color:rgba(229,154,82,.9)}',
        '.ck-gauge-legende .lg-zuur{color:rgba(224,132,125,.9)}',
        /* koppeladvies onderin */
        '.ck-koppel{padding:16px 18px;display:flex;gap:12px;align-items:flex-start}',
        '.ck-koppel .ico{flex:none;font-size:15px;line-height:1.5}',
        '.ck-koppel div{font-size:13.5px;line-height:1.55;color:rgba(212,207,191,.75)}',
        '.ck-koppel h6{margin:0 0 3px;font-family:"JetBrains Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#b8a472}',
        '.ck-voetnoot{padding:9px 18px;border-top:1px solid rgba(212,207,191,.12);font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.08em;color:rgba(212,207,191,.38)}',
        '@media (max-width:760px){.ck-romp{grid-template-columns:minmax(0,1fr)}.ck-lijst{border-right:0;border-bottom:1px solid rgba(212,207,191,.14)}.ck-rijen{max-height:210px}.ck-voer{grid-template-columns:1fr}.ck-kpis{width:100%;margin-left:0}}',
        '@media (max-width:520px){.ck-sig{grid-template-columns:1fr}.ck-detail{padding:16px}.ck-kpis{gap:11px}.ck-gauge-legende{font-size:9px;letter-spacing:0;white-space:nowrap}}'
    ].join('\n');

    var KLEUR = { laag: '#e9bd4f', ok: '#7ba58a', hoog: '#e59a52', zuur: '#c8524a' };

    /* mini-grafiek: 14 dagen, stippellijn = haar norm */
    function spark(reeksen, norm, min, max) {
        var W = 260, H = 38, n = 14;
        function X(i) { return 3 + i * (W - 6) / (n - 1); }
        function Y(v) { return H - 4 - (Math.max(min, Math.min(max, v)) - min) / (max - min) * (H - 8); }
        var b = norm == null ? '' : '<line x1="3" x2="' + (W - 3) + '" y1="' + Y(norm).toFixed(1) + '" y2="' + Y(norm).toFixed(1) +
            '" stroke="rgba(212,207,191,.35)" stroke-dasharray="3 5" stroke-width="1" vector-effect="non-scaling-stroke"/>';
        return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + b +
            reeksen.map(function (s) {
                var d = s.data.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
                return '<path d="' + d + '" fill="none" stroke="' + s.kleur + '" stroke-width="1.8" stroke-linecap="round"' +
                    (s.streep ? ' stroke-dasharray="4 3"' : '') + ' vector-effect="non-scaling-stroke"/>';
            }).join('') + '</svg>';
    }

    /* de lat per koe: geel | groen | oranje | rood met haar positie t.o.v. haar optimum */
    function gauge(k) {
        var W = 560, links = 10, rechts = W - 10;
        function X(afst) { var t = (afst + 1.6) / 3.2; return links + Math.max(0, Math.min(1, t)) * (rechts - links); }
        var g1 = X(-0.3), g2 = X(0.3), g3 = X(0.8), x = X(k.afst);
        function vak(x1, x2, kleur) { return '<rect x="' + x1.toFixed(1) + '" y="12" width="' + (x2 - x1).toFixed(1) + '" height="22" rx="4" fill="' + kleur + '"/>'; }
        return '<svg viewBox="0 0 ' + W + ' 46" aria-hidden="true">' +
            vak(links, g1 - 1, 'rgba(233,189,79,.3)') + vak(g1, g2 - 1, 'rgba(123,165,138,.42)') +
            vak(g2, g3 - 1, 'rgba(229,154,82,.34)') + vak(g3, rechts, 'rgba(200,82,74,.34)') +
            '<line x1="' + ((g1 + g2) / 2) + '" y1="6" x2="' + ((g1 + g2) / 2) + '" y2="40" stroke="rgba(212,207,191,.5)" stroke-dasharray="3 4" stroke-width="1"/>' +
            '<circle cx="' + x.toFixed(1) + '" cy="23" r="8" fill="' + KLEUR[k.zone] + '" stroke="#e8e4d6" stroke-width="2"/>' +
            '</svg>' +
            '<div class="ck-gauge-legende"><span class="lg-laag">Te weinig</span><span class="lg-ok">Optimum</span>' +
            '<span class="lg-hoog">Te veel</span><span class="lg-zuur">Verzuurt</span></div>';
    }

    var ZONE_LBL = { laag: 'te weinig krachtvoer', ok: 'op haar optimum', hoog: 'te veel krachtvoer', zuur: 'verzuringsrisico' };
    var VLAG = { kreupel: 'klauwen?', ketose: 'ketose?' };
    function rangtel(n) { return n + 'e'; }

    function init() {
        var wortel = document.getElementById('cockpit');
        if (!wortel) return;
        var stijl = document.createElement('style'); stijl.textContent = css; document.head.appendChild(stijl);

        var koeien = maakKoppel(), filter = 'alle', huidig = koeien[0];
        var tel = { laag: 0, ok: 0, hoog: 0, zuur: 0 };
        koeien.forEach(function (k) { tel[k.zone]++; });

        wortel.innerHTML =
            '<div class="ck" role="application" aria-label="Ruminate cockpit">' +
            '  <div class="ck-kop">' +
            '    <span class="ck-merk">rum<i>&#305;</i>nate</span><span class="ck-tag">cockpit &middot; demobedrijf &middot; ' + koeien.length + ' koeien</span>' +
            '    <span class="ck-kpis"><span>optimum <b class="ok">' + tel.ok + '</b></span><span>te weinig <b class="laag">' + tel.laag + '</b></span>' +
            '<span>te veel <b class="hoog">' + tel.hoog + '</b></span><span>risico <b class="zuur">' + tel.zuur + '</b></span></span>' +
            '  </div>' +
            '  <div class="ck-alert" role="note"><span class="ico">&#9888;</span>' +
            '<span><b>Hitte-alert &middot; wo &gt;30&nbsp;&deg;C.</b> Check ventilatoren en drinkwater; energie via pensbestendig vet, niet via extra ruwvoer.</span></div>' +
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
                var aandacht = k.zone !== 'ok' || VLAG[k.profiel];
                return filter === 'alle' || (filter === 'ok' ? !aandacht : aandacht);
            }).map(function (k) {
                return '<button class="ck-rij' + (k === huidig ? ' aan' : '') + '" data-i="' + koeien.indexOf(k) + '">' +
                    '<span class="ck-dot ' + k.zone + '"></span>' +
                    '<span class="n">' + k.naam + '<small>L' + k.lactatie + ' &middot; dag ' + k.dim +
                    (VLAG[k.profiel] ? ' &middot; <em>' + VLAG[k.profiel] + '</em>' : '') + '</small></span>' +
                    '<span class="m">' + nl(k.melk[13]) + ' kg</span></button>';
            }).join('');
        }

        function tegel(titel, sig, grafiek) {
            return '<div' + (sig.af ? ' class="af"' : '') + '><h6>' + titel + '</h6><span class="w">' + sig.tekst + '</span>' + grafiek + '</div>';
        }

        function tekenDetail() {
            var k = huidig, s = signalen(k), a = advies(k, s);
            var groen = '#7ba58a', rood = '#e0847d';
            function lijn(sig) { return sig.af ? rood : groen; }
            function bereik(r, norm, marge) { var all = r.concat([norm]); return [Math.min.apply(null, all) - marge, Math.max.apply(null, all) + marge]; }
            var bm = bereik(k.melk, k.basis, 1), bh = bereik(k.herkauw, k.normH, 15), ba = bereik(k.act, 100, 4);

            var doel = k.kv + a.kv.delta;
            var cijfer = a.kv.delta === 0
                ? '<b>' + nl(k.kv) + ' kg/dag</b><span class="delta nul">=</span>'
                : '<b>' + nl(k.kv) + '</b><span class="pijl">&rarr;</span><b>' + nl(doel) + ' kg/dag</b>' +
                  '<span class="delta ' + (a.kv.delta < 0 ? 'min' : 'plus') + '">' + (a.kv.delta > 0 ? '+' : '−') + nl(Math.abs(a.kv.delta)) + ' kg</span>';
            var kvKaart = '<div class="ck-vkaart"><h5>Advies &middot; krachtvoer aan de robot</h5>' +
                '<div class="cijfer">' + cijfer + '</div><div class="titel">' + a.kv.titel + '</div><p>' + a.kv.actie + '</p></div>';
            var extra = a.kaart ? '<div class="ck-vkaart ' + a.kaart.kl + '"><h5>' + a.kaart.kop + '</h5>' +
                '<div class="titel">' + a.kaart.titel + '</div><p>' + a.kaart.tekst + '</p></div>' : '';

            detail.innerHTML =
                '<div class="ck-dkop"><h4>' + k.naam + '</h4>' +
                '<span class="ck-badge ' + k.zone + '">' + ZONE_LBL[k.zone] + '</span>' +
                (VLAG[k.profiel] ? '<span class="ck-badge vlag">' + VLAG[k.profiel] + '</span>' : '') + '</div>' +
                '<div class="ck-dsub">' + rangtel(k.lactatie) + ' lactatie &middot; dag ' + k.dim + ' in lactatie &middot; ' + k.leeftijd + ' jaar</div>' +
                '<div class="ck-gauge"><h5>Krachtvoer t.o.v. haar eigen optimum</h5>' + gauge(k) + '</div>' +
                '<div class="ck-grond"><h5>Waarop gebaseerd</h5>' +
                '<p class="ck-conclusie">' + a.conclusie + '</p>' +
                '<div class="ck-sig">' +
                tegel('Melkgift', s.melk, spark([{ data: k.melk, kleur: lijn(s.melk) }], k.basis, bm[0], bm[1])) +
                tegel('Herkauwen', s.herkauw, spark([{ data: k.herkauw, kleur: lijn(s.herkauw) }], k.normH, bh[0], bh[1])) +
                tegel('Vet / eiwit %', s.vet, spark([{ data: k.vet, kleur: lijn(s.vet) }, { data: k.eiwit, kleur: 'rgba(212,207,191,.55)', streep: true }], null, 2.8, 5.8)) +
                tegel('Activiteit', s.act, spark([{ data: k.act, kleur: lijn(s.act) }], 100, ba[0], ba[1])) +
                '</div><div class="ck-sig-voet">14 dagen &middot; stippellijn = haar eigen norm &middot; vet/eiwit: eiwit gestreept</div></div>' +
                (extra ? '<div class="ck-voer">' + kvKaart + extra + '</div>' : kvKaart);
        }

        /* koppeladvies: eigen blok buiten de cockpit, voor de hele koppel */
        (function () {
            var doel = document.getElementById('koppeladvies');
            if (!doel) return;
            var N = koeien.length, dagen = 30;
            var vers = koeien.filter(function (k) { return k.dim < 120; }).length;
            var nZuur = koeien.filter(function (k) { return k.zone === 'zuur'; }).length;
            var TAL = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes'];
            var plan = [
                { maand: maand(1), titel: 'Energie zonder extra zetmeel',
                  tekst: (TAL[nZuur] || nZuur).replace(/^./, function (c) { return c.toUpperCase(); }) +
                      ' koeien met verzuringssignalen tegelijk: kijk eerst naar het rantsoen. Wordt het goed gemengd, of zoeken koeien het krachtvoer eruit aan het voerhek? ' +
                      'Geef de ' + vers + ' koeien onder dag 120 energie via pensbestendig vet in plaats van extra krachtvoer.' },
                { maand: maand(2), titel: 'Herbeoordelen met je voeradviseur',
                  tekst: 'Bij herstel terug naar het basisrantsoen; neem de melkcontrole en dit overzicht mee in het maandbezoek.' }
            ];
            /* inkooplijst: het advies doorgerekend naar bestelbare volumes voor deze koppel */
            function rond(kg, stap) { return Math.ceil(kg / stap) * stap; }
            var inkoop = [
                { wat: 'Pensbestendig vet (verzadigd, palmvetbasis)', basis: '300 g per koe per dag · ' + vers + ' koeien onder dag 120',
                  kg: rond(vers * 0.3 * dagen, 5), eenheid: Math.ceil(vers * 0.3 * dagen / 25) + ' zakken (à 25 kg)' },
                { wat: 'Pensbuffer (natriumbicarbonaat)', basis: '150 g per koe per dag · zelfde groep',
                  kg: rond(vers * 0.15 * dagen, 5), eenheid: Math.ceil(vers * 0.15 * dagen / 25) + ' zakken (à 25 kg)' }
            ];
            var hitte = rond(N * 0.3 * 5, 5);
            var hitteTekst = 'Hittegolf? Dan tijdelijk vet voor de hele koppel: ±' + hitte + ' kg extra per 5 warme dagen. Geen extra ruwvoer: bij hitte vreet ze daar juist minder van.';
            var inkoopHtml = '<div class="ck-inkoop"><h6>Inkooplijst &middot; ' + maand(1) + ' &middot; ' + N + ' koeien</h6>' +
                inkoop.map(function (r) {
                    return '<div class="ck-inkoop-rij"><span class="wat">' + r.wat + '<small>' + r.basis + '</small></span>' +
                        '<span class="kg">±' + r.kg + ' kg</span><span class="eenheid">' + r.eenheid + '</span></div>';
                }).join('') + '<p class="noot">' + hitteTekst + '</p></div>';
            /* de lijst hoort bij de eerstvolgende maand; de maand erna kondigt de zijne aan */
            var volgtHtml = '<div class="ck-inkoop volgt"><h6>Inkooplijst &middot; ' + maand(2) + '</h6>' +
                '<p>Volgt medio ' + maand(1).toLowerCase() + ', twee weken voor het maandbezoek van je voeradviseur.</p></div>';
            doel.innerHTML = '<div class="ck"><div class="ck-koppel"><span class="ico">&#127807;</span><div style="flex:1">' +
                '<h6>Koppeladvies &middot; rantsoen aan het voerhek</h6>' +
                plan.map(function (w, i) {
                    return '<div class="ck-week"><div class="ck-week-kop"><span class="wk">' + w.maand + '</span><b>' + w.titel + '</b></div>' +
                        '<p>' + w.tekst + '</p>' + (i === 0 ? inkoopHtml : volgtHtml) + '</div>';
                }).join('') +
                '<div class="ck-deel">' +
                '<button class="ck-deelknop" type="button" data-actie="kopieer">Kopieer inkooplijst</button>' +
                '<button class="ck-deelknop" type="button">Deel met je voeradviseur</button>' +
                '<span class="ck-chip goud">integraties &middot; binnenkort</span></div>' +
                '</div></div></div>';
            doel.querySelector('.ck').addEventListener('click', function (e) {
                var b = e.target.closest('.ck-deelknop'); if (!b) return;
                if (b.getAttribute('data-actie') === 'kopieer') {
                    var tekst = 'Inkooplijst ' + maand(1) + ' · ' + N + ' koeien (Ruminate)\n' +
                        inkoop.map(function (r) { return '- ' + r.wat + ': ±' + r.kg + ' kg (' + r.eenheid + ')'; }).join('\n') +
                        '\n' + hitteTekst;
                    try { navigator.clipboard.writeText(tekst).catch(function () {}); } catch (err) {}
                    toast.textContent = 'Inkooplijst gekopieerd';
                } else {
                    toast.textContent = 'Demo · deze koppeling bouwen we samen met de pilotbedrijven';
                }
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
