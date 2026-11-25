/* Ekran görüntüleri ve denge ölçümü için gelişmiş bir kayıt üretir.
   Kullanım: node kayit.js [cikti.json] */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'js') + '/';

function ortam() {
  const depo = {};
  const sandbox = {
    console: { log(){}, warn(){}, error(){} },
    performance: { now: () => Date.now() },
    localStorage: {
      getItem: k => (k in depo ? depo[k] : null),
      setItem: (k, v) => { depo[k] = String(v); },
      removeItem: k => { delete depo[k]; }
    },
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    setTimeout: () => 0,
    document: { getElementById: () => null, querySelectorAll: () => [],
      body: { classList: { toggle(){}, add(){}, remove(){} } },
      createElement: () => ({ classList: {}, style: {} }), addEventListener(){} }
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext('var UI={bildir:function(){},ciz:function(){},modal:function(){},tikCiz:function(){},basarimToast:function(){}};', ctx);
  ['veri.js', 'durum.js', 'sim.js'].forEach(f => vm.runInContext(fs.readFileSync(A + f, 'utf8'), ctx, { filename: f }));
  return {
    D: vm.runInContext('D', ctx),
    SIM: vm.runInContext('SIM', ctx),
    VERI: vm.runInContext('VERI', ctx)
  };
}

/* zengin, bakımlı ve kalabalık bir şube kurar */
function uret() {
  const { D, SIM, VERI } = ortam();
  D.yeni();
  D.s.para = 60000000;
  D.s.seviye = 9;
  D.s.tabela.ad = 'Yıldız Petrol';

  const sb = D.sube();
  /* arsayı birkaç kez genişlet */
  for (let i = 0; i < 4; i++) SIM.arsaGenislet(sb);
  /* her hücreye beton */
  for (let i = 0; i < sb.beton.length; i++) if (!sb.beton[i]) SIM.betonDok(sb, i);

  const bos = () => { const l = []; for (let i = 0; i < sb.yapi.length; i++) if (sb.beton[i] && !sb.yapi[i]) l.push(i); return l; };
  /* pompalar */
  const yakitlar = ['benzin', 'dizel', 'benzin', 'dizel', 'lpg', 'ev'];
  yakitlar.forEach(y => { const b = bos(); if (b.length) SIM.pompaKur(sb, b[Math.floor(b.length / 2)], y); });
  /* tesisler */
  ['market', 'kafe', 'wc', 'havasu', 'depo', 'depo', 'gunes', 'gunes', 'yikama', 'yag', 'mescit', 'atm', 'totem', 'kamera', 'yangin', 'lastikci', 'adblue', 'ofis']
    .forEach(t => { const b = bos(); if (b.length) SIM.binaKur(sb, b[0], t); });
  /* yükselt */
  for (let i = 0; i < sb.yapi.length; i++) { for (let k = 0; k < 2; k++) SIM.yukselt(sb, i); }
  /* tankları doldur */
  ['benzin', 'dizel', 'lpg'].forEach(y => { const kap = D.tankKap(sb, y); if (kap > 0) sb.tank[y].dolu = kap * 0.82; });
  /* personel */
  ['pompaci', 'pompaci', 'temizlik', 'teknisyen'].forEach(t => {
    const a = SIM.adayUret(t);
    if (SIM.iseAl(sb, a) && t === 'pompaci') {
      const p = D.pompalar(sb).find(p => !sb.personel.some(pr => pr.pompa === p.i));
      if (p) SIM.pompaAta(sb, a.id, p.i);
    }
  });
  sb.temizlik = 96;
  /* pazarlama programları açıksa aç */
  try { (VERI.programlar || []).forEach(p => SIM.programAc(sb, p.id)); } catch (e) {}
  /* biraz oyna: ciro geçmişi, müşteri, başarım dolsun */
  for (let g = 0; g < 14 * 24 * 60; g++) {
    SIM.dakika();
    if (g % 3 === 0) {
      for (let i = sb.kuyruk.length - 1; i >= 0; i--) {
        const m = sb.kuyruk[i];
        if (m.durum !== 'pompada') continue;
        let ver = m.hedef;
        if (m.yakit !== 'ev') { ver = Math.min(ver, sb.tank[m.yakit].dolu); sb.tank[m.yakit].dolu -= ver; }
        m.verilen = ver;
        SIM.satisTamamla(sb, m, true, false);
      }
      ['benzin', 'dizel', 'lpg'].forEach(y => {
        const kap = D.tankKap(sb, y);
        if (kap > 0 && sb.tank[y].dolu < kap * 0.6) sb.tank[y].dolu = kap * 0.85;
      });
      for (let i = 0; i < sb.yapi.length; i++) { const y = sb.yapi[i]; if (y && (y.arizali || y.bakim < 70)) SIM.bakimYap(sb, i); }
      if (sb.temizlik < 80) SIM.temizlikYap(sb);
    }
  }
  D.s.para = 8450000;
  D.s.hiz = 1;
  return D;
}

module.exports = { ortam, uret };

if (require.main === module) {
  const D = uret();
  D.s.saat = 13; D.s.dakika = 20;
  const hedef = process.argv[2] || path.join(__dirname, 'kayit.json');
  fs.writeFileSync(hedef, JSON.stringify(D.s));
  console.log('kayıt yazıldı:', hedef, '· gün', D.s.gun, '· para', Math.round(D.s.para), '· yapı', D.sube().yapi.filter(Boolean).length);
}
