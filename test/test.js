/* Akaryakıt Patronu — başsız motor testi */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const A = require('path').join(__dirname, '..', 'app', 'src', 'main', 'assets', 'js') + '/';

/* --- tarayıcı taklidi --- */
const depo = {};
const sandbox = {
  console,
  performance: { now: () => Date.now() },
  localStorage: {
    getItem: k => (k in depo ? depo[k] : null),
    setItem: (k, v) => { depo[k] = String(v); },
    removeItem: k => { delete depo[k]; }
  },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  setTimeout: () => 0,
  document: { getElementById: () => null, querySelectorAll: () => [], body: { classList: { toggle(){} } }, createElement: () => ({ classList:{}, style:{} }), addEventListener(){} },
};
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);

/* UI yerine sayaç */
const bildirimler = [];
vm.runInContext('var UI={bildir:function(a,b,c){__bld(a,b,c)},ciz:function(){},modal:function(){},tikCiz:function(){}};', ctx);
sandbox.__bld = (a, b, c) => bildirimler.push({ a, b, c });

['veri.js', 'durum.js', 'sim.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(A, f), 'utf8'), ctx, { filename: f });
});

/* const ile tanımlı global'ler sandbox nesnesinde görünmez; bağlamdan çek */
const D = vm.runInContext('D', ctx);
const SIM = vm.runInContext('SIM', ctx);
const VERI = vm.runInContext('VERI', ctx);

/* --- doğrulama yardımcıları --- */
let hata = 0;
/* hücreyi inşaya hazırla (gerekiyorsa beton dök) */
function hazir(sb, i) { if (!sb.beton[i]) return SIM.betonDok(sb, i); return true; }
function kontrol(kosul, mesaj) {
  if (!kosul) { console.log('  ✗ ' + mesaj); hata++; }
}
function sayiMi(n, ad) {
  if (typeof n !== 'number' || !isFinite(n)) { console.log('  ✗ ' + ad + ' sayı değil: ' + n); hata++; }
}

/* ======================= TEST 1: yeni oyun ======================= */
console.log('TEST 1 — yeni oyun kurulumu');
D.yeni();
kontrol(D.s.subeler.length === 1, 'tek şube olmalı');
kontrol(D.pompalar().length === 2, '2 pompa olmalı, var: ' + D.pompalar().length);
kontrol(D.s.para > 0, 'başlangıç parası');
kontrol(D.sube().tank.benzin.dolu === 2500, 'benzin tankı yarım dolu');
kontrol(D.sube().w === 5 && D.sube().h === 4, 'şube 5x4 başlamalı: ' + D.sube().w + 'x' + D.sube().h);
kontrol(SIM.yakitVar(D.sube(), 'benzin'), 'benzin satılabilir olmalı');
kontrol(SIM.yakitVar(D.sube(), 'dizel'), 'dizel satılabilir olmalı');
kontrol(!SIM.yakitVar(D.sube(), 'lpg'), 'LPG tankı boşken satılamaz');
kontrol(!SIM.yakitVar(D.sube(), 'ev'), 'EV pompası yokken satılamaz');

/* çok tabancalı pompa mantığı */
console.log('TEST 2 — pompa/yakıt uygunluğu');
const pBenzin = { t:'pompa', yakit:'benzin' }, pLpg = { t:'pompa', yakit:'lpg' }, pEv = { t:'pompa', yakit:'ev' };
kontrol(SIM.pompaUygun(pBenzin, 'dizel'), 'benzin pompası dizel verebilmeli');
kontrol(SIM.pompaUygun(pBenzin, 'benzin'), 'benzin pompası benzin verebilmeli');
kontrol(SIM.pompaUygun(pBenzin, 'lpg'), 'karma satış: benzin pompası LPG de vermeli');
kontrol(!SIM.pompaUygun(pBenzin, 'ev'), 'benzin pompası elektrik vermemeli');
kontrol(SIM.pompaUygun(pLpg, 'lpg') && SIM.pompaUygun(pLpg, 'benzin'), 'LPG pompası da karma satar');
kontrol(SIM.pompaUygun(pEv, 'ev') && !SIM.pompaUygun(pEv, 'dizel'), 'EV pompası yalnız elektrik');

/* ======================= TEST 3: müşteri üretimi ======================= */
console.log('TEST 3 — müşteri üretimi (2000 deneme)');
let uretilen = 0, yakitDagilim = {};
for (let i = 0; i < 2000; i++) {
  const m = SIM.musteriYap(D.sube());
  if (!m) continue;
  uretilen++;
  yakitDagilim[m.yakit] = (yakitDagilim[m.yakit] || 0) + 1;
  sayiMi(m.hedef, 'hedef');
  kontrol(m.hedef > 0, 'hedef pozitif olmalı');
  kontrol(['litre','tutar','depo'].indexOf(m.tip) >= 0, 'istek tipi geçerli');
  kontrol(!!m.etiket, 'etiket var');
  kontrol(SIM.yakitVar(D.sube(), m.yakit), 'istenen yakıt satılabilir: ' + m.yakit);
}
kontrol(uretilen > 1500, 'müşteri üretimi çalışıyor: ' + uretilen);
console.log('  yakıt dağılımı:', JSON.stringify(yakitDagilim));

/* ======================= TEST 4: satış matematiği ======================= */
console.log('TEST 4 — satış kapama senaryoları');
function senaryo(ad, kur) {
  D.yeni();
  const sb = D.sube();
  sb.tank.benzin.dolu = 5000;
  const paraOnce = D.s.para;
  const m = {
    id:'t1', arac:'Otomobil', emoji:'🚗', yakit:'benzin', hedef:40, tip:'litre',
    etiket:'40 L', bahsis:1, sabir:70, sabirKalan:70, pompa:0, verilen:0, durum:'servis'
  };
  var pi0 = D.pompalar(sb)[0].i;
  m.pompa = pi0;
  sb.kuyruk.push(m);
  sb.yapi[pi0].mesgul = m.id;
  kur(m, sb);
  const r = SIM.satisTamamla(sb, m, true, !!m.__yanlis);
  return { r, paraFark: D.s.para - paraOnce, sb };
}

let t = senaryo('tam isabet', m => { m.verilen = 40.0; });
kontrol(t.r.isabet === 'tam', 'tam isabet bekleniyor, gelen: ' + t.r.isabet);
kontrol(t.r.bahsis > 0, 'tam isabette bahşiş olmalı');
kontrol(t.r.dokulen === 0, 'tam isabette dökülme olmamalı');
sayiMi(t.paraFark, 'para farkı');
kontrol(t.paraFark > 0, 'kasa artmalı');

t = senaryo('taşma', m => { m.verilen = 45.0; });
kontrol(t.r.isabet === 'tasma', 'taşma bekleniyor: ' + t.r.isabet);
kontrol(Math.abs(t.r.dokulen - 5) < 0.001, 'dökülen 5 L olmalı: ' + t.r.dokulen);
kontrol(t.r.bahsis === 0, 'taşmada bahşiş olmamalı');
kontrol(Math.abs(t.r.satilan - 40) < 0.001, 'yalnız hedef kadar satılmalı');

t = senaryo('eksik', m => { m.verilen = 30.0; });
kontrol(t.r.isabet === 'eksik', 'eksik bekleniyor: ' + t.r.isabet);
kontrol(Math.abs(t.r.satilan - 30) < 0.001, 'verilen kadar satılmalı');

t = senaryo('iyi', m => { m.verilen = 40.25; });
kontrol(t.r.isabet === 'iyi', 'iyi bekleniyor: ' + t.r.isabet);

t = senaryo('yanlış yakıt', m => { m.verilen = 20; m.__yanlis = true; });
kontrol(t.r.tip === 'yanlis', 'yanlış yakıt bekleniyor');
kontrol(t.paraFark < 0, 'yanlış yakıtta kasa azalmalı: ' + t.paraFark);

/* pompa serbest kaldı mı */
kontrol(D.pompalar(t.sb)[0].p.mesgul === null, 'satış sonrası pompa boşalmalı');
kontrol(t.sb.kuyruk.length === 0, 'satış sonrası müşteri kuyruktan çıkmalı');

console.log('TEST 4b — akış hızları');
D.yeni();
const p0 = D.pompalar(D.sube())[0].p;
kontrol(D.akis(p0) > 3, 'tam akış hızlı olmalı: ' + D.akis(p0));
kontrol(D.yavasAkis(p0) < D.akis(p0) / 5, 'yavaş akış belirgin kısık olmalı');
kontrol(D.yavasAkis(p0) > 0.1, 'yavaş akış sıfır olmamalı');
p0.sv = 5;
kontrol(D.akis(p0) > 8, 'sv5 akışı yüksek olmalı: ' + D.akis(p0));
p0.bakim = 0;
kontrol(D.akis(p0) < 8, 'bakımsız pompa yavaşlamalı');
p0.sv = 1; p0.bakim = 100;

/* ======================= TEST 5: inşa / yükseltme / ekonomi ======================= */
console.log('TEST 5 — inşa, yükseltme, bakım, yıkım');
D.yeni();
D.s.para = 50000000;
D.s.seviye = 20;
let sb = D.sube();
kontrol(SIM.betonDok(sb, 2), 'beton dökülmeli');
kontrol(!SIM.betonDok(sb, 2), 'aynı hücreye ikinci kez beton dökülmemeli');
kontrol(SIM.pompaKur(sb, 2, 'lpg'), 'LPG pompası kurulmalı');
kontrol(SIM.yakitVar(sb, 'lpg') === false, 'LPG tankı boşken satılamaz');
sb.tank.lpg.dolu = 1000;
kontrol(SIM.yakitVar(sb, 'lpg') === true, 'LPG tankı dolunca satılabilir');
function bosHucre(sb) { for (let i = 0; i < sb.yapi.length; i++) if (!sb.yapi[i]) return i; return -1; }
const cMarket = bosHucre(sb);
kontrol(hazir(sb, cMarket) && SIM.binaKur(sb, cMarket, 'market'), 'market kurulmalı');
const cDepo = bosHucre(sb);
kontrol(hazir(sb, cDepo) && SIM.binaKur(sb, cDepo, 'depo'), 'depo kurulmalı');
const kapOnce = D.tankKap(sb, 'benzin');
SIM.yukselt(sb, cDepo);
kontrol(D.tankKap(sb, 'benzin') > kapOnce, 'depo yükseltmesi tank kapasitesini artırmalı');
const cGunes = bosHucre(sb);
kontrol(hazir(sb, cGunes) && SIM.binaKur(sb, cGunes, 'gunes'), 'güneş paneli kurulmalı');
D.s.saat = 12;
kontrol(D.gucUretim(sb) > 0, 'öğlen güneş üretmeli');
D.s.saat = 2;
kontrol(D.gucUretim(sb) === 0, 'gece güneş üretmemeli');
const pIdx = D.pompalar(sb)[0].i;
const akisOnce = D.akis(sb.yapi[pIdx]);
SIM.yukselt(sb, pIdx);
kontrol(D.akis(sb.yapi[pIdx]) > akisOnce, 'pompa yükseltmesi akışı artırmalı');
sb.yapi[pIdx].bakim = 20; sb.yapi[pIdx].arizali = true;
kontrol(SIM.bakimYap(sb, pIdx), 'bakım yapılmalı');
kontrol(sb.yapi[pIdx].bakim === 100 && !sb.yapi[pIdx].arizali, 'bakım sonrası arıza gitmeli');
const pompaSayiOnce = D.pompalar(sb).length;
kontrol(SIM.yik(sb, D.pompalar(sb)[0].i), 'yıkım çalışmalı');
kontrol(D.pompalar(sb).length === pompaSayiOnce - 1, 'pompa sayısı azalmalı');

/* pompa sınırı */
D.yeni(); D.s.para = 50000000; sb = D.sube();
const lok = D.lok(sb);
for (let i = 0; i < sb.beton.length; i++) sb.beton[i] = true;
let kurulan = D.pompalar(sb).length;
for (let i = 0; i < sb.yapi.length; i++) { if (!sb.yapi[i] && SIM.pompaKur(sb, i, 'benzin')) kurulan++; }
kontrol(kurulan === lok.maxPompa, 'pompa sınırı ' + lok.maxPompa + ' olmalı, kurulan: ' + kurulan);

/* arsa genişletme indeks korumalı mı */
console.log('TEST 6 — arsa genişletme indeks kayması');
D.yeni(); D.s.para = 50000000; sb = D.sube();
const pompaIdx6 = D.pompalar(sb)[0].i;
const aday = SIM.adayUret('pompaci');
SIM.iseAl(sb, aday);
SIM.pompaAta(sb, aday.id, pompaIdx6);
const genisOnce = sb.w;
kontrol(SIM.arsaGenislet(sb), 'arsa genişlemeli');
kontrol(sb.w >= genisOnce + 2 || sb.h > 4, 'arsa tek alımda belirgin büyümeli: ' + sb.w + 'x' + sb.h);
const atanan = sb.personel[0];
kontrol(sb.yapi[atanan.pompa] && sb.yapi[atanan.pompa].t === 'pompa',
  'genişleme sonrası pompacının pompası hâlâ pompa olmalı (idx ' + atanan.pompa + ')');
kontrol(D.pompalar(sb).length >= 1, 'eski pompalar korunmalı');

/* ======================= TEST 7: sipariş akışı ======================= */
console.log('TEST 7 — sipariş ve teslim');
D.yeni(); D.s.para = 5000000; sb = D.sube();
sb.tank.benzin.dolu = 0;
kontrol(SIM.siparisVer(sb, 'benzin', 3000), 'sipariş verilmeli');
kontrol(sb.siparis.length === 1, 'sipariş kuyrukta');
for (let i = 0; i < 200; i++) SIM.siparisIsle(sb, 1);
kontrol(sb.siparis.length === 0, 'sipariş teslim edilmeli');
kontrol(Math.abs(sb.tank.benzin.dolu - 3000) < 1, 'tanka 3000 L girmeli: ' + sb.tank.benzin.dolu);
/* kapasite aşımı */
sb.tank.benzin.dolu = D.tankKap(sb, 'benzin') - 100;
SIM.siparisVer(sb, 'benzin', 1000);
for (let i = 0; i < 200; i++) SIM.siparisIsle(sb, 1);
kontrol(sb.tank.benzin.dolu <= D.tankKap(sb, 'benzin') + 0.001, 'tank kapasitesi aşılmamalı');

/* ======================= TEST 8: uzun simülasyon ======================= */
console.log('TEST 8 — 60 oyun günü otomatik simülasyon');
D.yeni();
D.s.para = 400000;
let enDusukPara = Infinity, ariza = 0, kacan0 = 0;
let elleSatis = 0;

function otoOyna() {
  const sb = D.sube();
  /* tank doldur */
  ['benzin','dizel','lpg'].forEach(y => {
    const kap = D.tankKap(sb, y);
    if (kap <= 0) return;
    if (!SIM.yakitVar(sb, y) && y !== 'benzin' && y !== 'dizel') return;
    const varPompa = D.pompalar(sb).some(p => SIM.pompaUygun(p.p, y));
    if (!varPompa) return;
    if (sb.tank[y].dolu < kap * 0.45 && !sb.siparis.some(o => o.yakit === y)) {
      let mik = Math.floor(kap - sb.tank[y].dolu);
      const butce = Math.max(0, D.s.para - 20000);
      const alinabilir = Math.floor(butce / D.toptanFiyat(y));
      mik = Math.min(mik, alinabilir);
      if (mik > 200) SIM.siparisVer(sb, y, mik);
    }
  });
  /* bekleyen müşterileri elle doldur (±0.1 L hatayla) */
  for (let i = sb.kuyruk.length - 1; i >= 0; i--) {
    const m = sb.kuyruk[i];
    if (m.durum !== 'pompada') continue;
    const y = m.yakit;
    let ver = m.hedef + (Math.random() - 0.5) * 0.3;   /* iyi oyuncu: ±0,15 L */
    if (y !== 'ev') { ver = Math.min(ver, sb.tank[y].dolu); sb.tank[y].dolu -= ver; }
    m.verilen = ver;
    const r = SIM.satisTamamla(sb, m, true, false);
    sayiMi(r.ciro, 'ciro'); sayiMi(r.kar, 'kar');
    elleSatis++;
  }
  /* arıza tamir */
  for (let i = 0; i < sb.yapi.length; i++) {
    const y = sb.yapi[i];
    if (y && (y.arizali || y.bakim < 40)) { if (SIM.bakimYap(sb, i)) ariza++; }
  }
  if (sb.temizlik < 50) SIM.temizlikYap(sb);
  /* büyüme */
  if (D.s.para > 900000) {
    const bos = [];
    for (let i = 0; i < sb.yapi.length; i++) if (sb.beton[i] && !sb.yapi[i]) bos.push(i);
    if (bos.length) {
      if (D.pompalar(sb).length < D.lok(sb).maxPompa) SIM.pompaKur(sb, bos[0], Math.random() < .5 ? 'benzin' : 'dizel');
      else if (D.s.seviye >= 2 && D.binaSayisi(sb, 'market') < 1) SIM.binaKur(sb, bos[0], 'market');
      else if (D.s.seviye >= 1 && D.binaSayisi(sb, 'depo') < 2) SIM.binaKur(sb, bos[0], 'depo');
      else if (D.s.seviye >= 2 && D.binaSayisi(sb, 'gunes') < 2) SIM.binaKur(sb, bos[0], 'gunes');
      else if (D.s.seviye >= 3 && D.binaSayisi(sb, 'kafe') < 1) SIM.binaKur(sb, bos[0], 'kafe');
    } else {
      let bosArsa = -1;
      for (let i = 0; i < sb.beton.length; i++) if (!sb.beton[i]) { bosArsa = i; break; }
      if (bosArsa >= 0) SIM.betonDok(sb, bosArsa);
      else SIM.arsaGenislet(sb);
    }
  }
  /* personel */
  if (D.s.para > 1500000 && sb.personel.length < 4) {
    const a = SIM.adayUret('pompaci');
    if (SIM.iseAl(sb, a)) {
      const bosPompa = D.pompalar(sb).find(p => !sb.personel.some(pr => pr.pompa === p.i));
      if (bosPompa) SIM.pompaAta(sb, a.id, bosPompa.i);
    }
  }
  /* yeni şube */
  VERI.lokasyonlar.forEach(l => {
    if (D.s.subeler.some(s2 => s2.lok === l.id)) return;
    if (D.s.seviye >= l.seviyeSart && D.s.para > l.fiyat * 1.35) SIM.subeAc(l.id);
  });
  /* rafineri */
  if (!D.s.rafineri.aktif && D.s.seviye >= VERI.rafineri.seviyeSart && D.s.para > VERI.rafineri.fiyat * 1.6) SIM.rafineriKur();
}

const dakikaSayisi = 60 * 24 * 60;
for (let i = 0; i < dakikaSayisi; i++) {
  try {
    SIM.dakika();
  } catch (e) {
    console.log('  ✗ dakika ' + i + ' hata: ' + e.message + '\n' + e.stack.split('\n')[1]);
    hata++;
    break;
  }
  if (i % 3 === 0) otoOyna();
  const s = D.s, sb2 = D.sube();
  if (s.para < enDusukPara) enDusukPara = s.para;
  /* tutarlılık denetimleri */
  if (!isFinite(s.para)) { console.log('  ✗ para NaN oldu, dakika ' + i); hata++; break; }
  if (sb2.tank.benzin.dolu < -0.01 || sb2.tank.dizel.dolu < -0.01 || sb2.tank.lpg.dolu < -0.01) {
    console.log('  ✗ tank eksiye düştü, dakika ' + i); hata++; break;
  }
  if (sb2.kuyruk.length > 60) { console.log('  ✗ kuyruk patladı: ' + sb2.kuyruk.length); hata++; break; }
  /* meşgul pompa tutarlılığı */
  for (const p of D.pompalar(sb2)) {
    if (p.p.mesgul && !SIM.musteriBul(sb2, p.p.mesgul)) {
      console.log('  ✗ hayalet müşteri pompada, dakika ' + i); hata++; i = dakikaSayisi; break;
    }
  }
}

const s = D.s;
console.log('  gün: ' + s.gun + ' · seviye: ' + s.seviye + ' · kasa: ' + Math.round(s.para).toLocaleString('tr-TR') + ' ₺');
console.log('  şube: ' + s.subeler.length + ' · müşteri: ' + s.ist.musteri + ' · elle satış: ' + elleSatis + ' · tamir: ' + ariza);
console.log('  ciro: ' + Math.round(s.ist.ciro).toLocaleString('tr-TR') + ' · kâr: ' + Math.round(s.ist.kar).toLocaleString('tr-TR'));
console.log('  dökülen: ' + s.ist.dokulen.toFixed(1) + ' L · mutlu/mutsuz: ' + s.ist.mutlu + '/' + s.ist.mutsuz);
console.log('  en düşük kasa: ' + Math.round(enDusukPara).toLocaleString('tr-TR') + ' ₺');
console.log('  satış L:', JSON.stringify(Object.keys(s.ist.satisL).reduce((o,k)=>(o[k]=Math.round(s.ist.satisL[k]),o),{})));
console.log('  olay sayısı (bildirim): ' + bildirimler.length);

kontrol(s.gun >= 59, '60 gün tamamlanmalı, gelen: ' + s.gun);
kontrol(s.ist.musteri > 500, 'yeterli müşteri işlenmeli: ' + s.ist.musteri);
kontrol(s.seviye > 3, 'seviye ilerlemeli: ' + s.seviye);
kontrol(s.ist.ciro > 0 && isFinite(s.ist.ciro), 'ciro tutarlı');
kontrol(s.ist.kar > 0, 'oyun kârlı oynanabilir olmalı: ' + Math.round(s.ist.kar));
kontrol(s.subeler.length >= 2, 'yeni şube açılabilmeli: ' + s.subeler.length);
VERI.yakitSira.forEach(y => sayiMi(s.toptan[y], 'toptan ' + y));
kontrol(s.marka >= 0 && s.marka <= 100, 'marka puanı aralıkta: ' + s.marka);
kontrol(D.sube().memnuniyet >= 0 && D.sube().memnuniyet <= 100, 'memnuniyet aralıkta');

/* ======================= TEST 9: kayıt / yükleme ======================= */
console.log('TEST 9 — kayıt, yükleme, eski kayıt onarımı');
kontrol(D.kaydet(), 'kaydedilmeli');
const paraOnce2 = D.s.para, gunOnce = D.s.gun, subeOnce = D.s.subeler.length;
D.s = null;
kontrol(D.yukle(), 'yüklenmeli');
kontrol(D.s.para === paraOnce2 && D.s.gun === gunOnce && D.s.subeler.length === subeOnce, 'kayıt birebir dönmeli');
kontrol(typeof D.sube().memnuniyet === 'number', 'şube alanları yerinde');

/* eksik alanlı eski kayıt */
const eski = JSON.parse(depo['akaryakit_kayit_v1']);
delete eski.rafineri; delete eski.olaylar; delete eski.ist.gunluk; delete eski.pasifGelir;
eski.subeler.forEach(sx => { delete sx.rakip; delete sx.temizlik; delete sx.siparis; delete sx.tank.lpg; });
depo['akaryakit_kayit_v1'] = JSON.stringify(eski);
kontrol(D.yukle(), 'eksik alanlı kayıt da yüklenmeli');
kontrol(!!D.s.rafineri && !!D.s.olaylar && !!D.sube().rakip && !!D.sube().tank.lpg, 'onar() eksikleri tamamlamalı');
let yeniHata = 0;
try { for (let i = 0; i < 2000; i++) SIM.dakika(); } catch (e) { yeniHata++; console.log('  ✗ onarım sonrası hata: ' + e.message); }
kontrol(yeniHata === 0, 'onarılmış kayıtla simülasyon sürmeli');

/* ======================= TEST 10: devretme ve pasif gelir ======================= */
console.log('TEST 10 — devretme, pasif gelir, müdür');
D.yeni(); D.s.para = 90000000; D.s.seviye = 20;
SIM.subeAc('cevreyolu');
let s2 = D.s.subeler[1];
s2.beton.fill(true);
SIM.pompaKur(s2, 2, 'benzin');
s2.tank.benzin.dolu = 4000;
const mudur = SIM.adayUret('mudur'); mudur.beceri = 90;
SIM.iseAl(s2, mudur);
const paraOnce3 = D.s.para;
for (let i = 0; i < 600; i++) SIM.pasifSubeler(1);
kontrol(D.s.para > paraOnce3, 'müdürlü şube kazanç getirmeli');
kontrol(s2.tank.benzin.dolu < 4000, 'pasif şube tankından yakıt gitmeli');
/* ikinci müdür engeli */
kontrol(!SIM.iseAl(s2, SIM.adayUret('mudur')), 'ikinci müdür alınamamalı');
/* devretme şartı */
s2.memnuniyet = 50;
kontrol(!SIM.devret(1), 'puan yetersizken devredilmemeli');
s2.memnuniyet = 100; s2.temizlik = 100;
s2.yapi.forEach(y => { if (y) y.bakim = 100; });
kontrol(SIM.devret(1), 'puan yeterliyken devredilmeli');
kontrol(D.s.pasifGelir > 0, 'pasif gelir eklenmeli');
kontrol(s2.devredildi, 'şube devredildi işaretlenmeli');
const paraOnce4 = D.s.para;
SIM.gunSonu();
kontrol(isFinite(D.s.para), 'gün sonu hesapları tutarlı');

/* ======================= TEST 11: rafineri ======================= */
console.log('TEST 11 — rafineri indirimi');
D.yeni(); D.s.para = 90000000; D.s.seviye = 20;
const toptanOnce = D.toptanFiyat('benzin');
kontrol(SIM.rafineriKur(), 'rafineri kurulmalı');
kontrol(D.toptanFiyat('benzin') < toptanOnce, 'rafineri toptan fiyatı düşürmeli');
kontrol(SIM.rafineriYukselt(), 'rafineri yükseltilmeli');
kontrol(D.s.rafineri.sv === 2, 'seviye 2 olmalı');
kontrol(SIM.tankerAl(), 'tanker alınmalı');

/* ======================= TEST 12: güç ve kesinti ======================= */
console.log('TEST 12 — güç dengesi ve kesinti');
D.yeni(); D.s.para = 90000000; D.s.seviye = 20; sb = D.sube();
sb.beton.fill(true);
SIM.binaKur(sb, 5, 'jenerator');
D.s.saat = 3;
kontrol(D.binalar(sb, 'jenerator')[0].b.depo > 0, 'jeneratör kurulunca deposu dolmalı');
kontrol(D.gucUretim(sb) > 0, 'jeneratör gece de üretmeli');
sb.kesinti = true;
kontrol(D.gucYeterli(sb) === (D.gucUretim(sb) >= D.gucTuketim(sb) * 0.9), 'kesintide güç yeterliliği hesaplanmalı');
sb.tank.dizel.dolu = 0;
D.binalar(sb, 'jenerator')[0].b.depo = 0;
SIM.saatBasi();
kontrol(D.binalar(sb, 'jenerator')[0].b.calismiyor, 'deposu bitince jeneratör durmalı');
kontrol(D.gucUretim(sb) === 0, 'durmuş jeneratör üretmemeli');
sb.tank.dizel.dolu = 400;
kontrol(SIM.jeneratorDoldur(sb, 5), 'jeneratör deposu doldurulmalı');
kontrol(!D.binalar(sb, 'jenerator')[0].b.calismiyor, 'dolunca tekrar çalışmalı');

/* ======================= TEST 13: rakip istasyon ve fiyat savaşı ======================= */
console.log('TEST 13 — rakip istasyon ve fiyat savaşı');
D.yeni();
D.s.para = 5000000;
{
  const sbr = D.sube();
  const r = SIM.rakipKur(sbr);
  kontrol(!!r.ad, 'rakip istasyonun adı olmalı');
  kontrol(r.guc === 1 && r.savas === 0 && r.indirim === 0, 'rakip dengeli başlamalı');

  /* eski kayıtta rakip yoksa onarılmalı */
  delete sbr.rakipIst;
  kontrol(!!SIM.rakipKur(sbr).ad, 'eski kayıtta rakip kurulmalı');

  /* fiyat oranı */
  VERI.yakitSira.forEach(y => { sbr.rakip[y] = 50; sbr.fiyat[y] = 50; });
  kontrol(Math.abs(SIM.rakipFiyatOrani(sbr) - 1) < 0.001, 'aynı fiyatta oran 1 olmalı');
  VERI.yakitSira.forEach(y => { sbr.fiyat[y] = 45; });
  kontrol(SIM.rakipFiyatOrani(sbr) < 0.95, 'ucuzken oran 1 altına inmeli');

  /* güç müşteri akışını etkilemeli */
  sbr.rakipIst.guc = 1.45;
  const guclu = SIM.rakipCekim(sbr);
  sbr.rakipIst.guc = 0.55;
  const zayif = SIM.rakipCekim(sbr);
  kontrol(zayif > 1 && guclu < 1, 'zayıf rakip trafiği artırmalı, güçlü rakip azaltmalı');
  kontrol(zayif <= 1.22 && guclu >= 0.78, 'rakip etkisi sınırlar içinde kalmalı');
  sbr.rakipIst.guc = 1;

  /* pazar payı 0-100 arasında ve rakip güçlenince düşmeli */
  const payDengeli = SIM.pazarPayi(sbr);
  sbr.rakipIst.guc = 1.45;
  const payZor = SIM.pazarPayi(sbr);
  kontrol(payDengeli > 0 && payDengeli < 100, 'pazar payı yüzde olmalı: ' + payDengeli);
  kontrol(payZor < payDengeli, 'rakip güçlenince payın düşmeli');
  sbr.rakipIst.guc = 1;

  /* kışkırtma: ucuz kalırsan rakip er geç fiyat savaşı açar */
  let savasBasladi = 0, deneme = 0;
  while (!savasBasladi && deneme < 200) {
    deneme++;
    sbr.rakipIst.savas = 0; sbr.rakipIst.indirim = 0;
    VERI.yakitSira.forEach(y => { sbr.rakip[y] = 50; sbr.fiyat[y] = 45; });
    SIM.rakipGunSonu(sbr);
    if (sbr.rakipIst.savas > 0) savasBasladi = 1;
  }
  kontrol(savasBasladi === 1, 'ucuz kalınca rakip fiyat savaşı açmalı (' + deneme + ' denemede)');
  kontrol(sbr.rakipIst.indirim > 0 && sbr.rakipIst.indirim <= VERI.rakip.savasTavan, 'savaş indirimi tavanı aşmamalı');

  /* savaş sırasında ucuz kalırsan rakip yıpranır ve sonunda biter */
  const gucOnce = sbr.rakipIst.guc;
  let bitti = false, bitisIndirimi = -1;
  for (let g = 0; g < 12 && !bitti; g++) {
    VERI.yakitSira.forEach(y => { sbr.fiyat[y] = 45; });
    SIM.rakipGunSonu(sbr);
    if (sbr.rakipIst.savas === 0) { bitti = true; bitisIndirimi = sbr.rakipIst.indirim; }
  }
  kontrol(bitti, 'fiyat savaşı en geç 12 günde bitmeli');
  kontrol(bitisIndirimi === 0, 'savaş bitince indirim kalkmalı: ' + bitisIndirimi);
  kontrol(sbr.rakipIst.guc < gucOnce, 'ucuz kalınca rakip güç kaybetmeli');
  kontrol(sbr.rakipIst.kazanilanSavas >= 1, 'kazanılan savaş sayılmalı');

  /* pahalı kalırsan rakip güçlenir */
  sbr.rakipIst.guc = 1; sbr.rakipIst.savas = 0; sbr.rakipIst.indirim = 0; sbr.rakipIst.olay = null;
  VERI.yakitSira.forEach(y => { sbr.rakip[y] = 50; sbr.fiyat[y] = 58; });
  for (let g = 0; g < 6; g++) { sbr.rakipIst.olay = null; SIM.rakipGunSonu(sbr); }
  kontrol(sbr.rakipIst.guc > 1, 'pahalı kalınca rakip güçlenmeli: ' + sbr.rakipIst.guc.toFixed(2));

  /* güç her durumda sınırda kalmalı, pay güncellenmeli */
  for (let g = 0; g < 400; g++) SIM.rakipGunSonu(sbr);
  kontrol(sbr.rakipIst.guc >= VERI.rakip.gucSinir[0] - 1e-9 && sbr.rakipIst.guc <= VERI.rakip.gucSinir[1] + 1e-9,
    'rakip gücü sınırları aşmamalı: ' + sbr.rakipIst.guc);
  kontrol(sbr.rakipIst.pay >= 0 && sbr.rakipIst.pay <= 100, 'pazar payı kaydedilmeli');
  sayiMi(sbr.rakipIst.guc, 'rakip gücü');

  /* rakip indirimi pompa fiyatına yansımalı */
  sbr.rakipIst.indirim = 0.1;
  const indirimli = SIM.rakipIndirim(sbr);
  kontrol(Math.abs(indirimli - 0.1) < 1e-9, 'rakip indirimi okunmalı');
  sbr.rakipIst.indirim = 0.9;
  kontrol(SIM.rakipIndirim(sbr) === VERI.rakip.savasTavan, 'indirim tavanda kırpılmalı');
  sbr.rakipIst.indirim = 0;

  /* devredilen şubede rakip işlenmemeli */
  sbr.devredildi = true;
  const payEski = sbr.rakipIst.pay;
  sbr.rakipIst.pay = -1;
  SIM.rakipGunSonu(sbr);
  kontrol(sbr.rakipIst.pay === -1, 'devredilen şubede rakip işlenmemeli');
  sbr.rakipIst.pay = payEski;
  sbr.devredildi = false;

  /* rakip olayı tanımı bulunabilmeli */
  sbr.rakipIst.olay = { id: 'kuru', kalan: 2 };
  const ol = SIM.rakipOlayi(sbr);
  kontrol(ol && ol.id === 'kuru' && ol.guc < 0, 'rakip olayı tanımı okunmalı');
  sbr.rakipIst.olay = { id: 'yokbole', kalan: 2 };
  kontrol(SIM.rakipOlayi(sbr) === null, 'tanımsız olay null dönmeli');
  sbr.rakipIst.olay = null;
  kontrol(SIM.rakipOlayi(sbr) === null, 'olay yoksa null dönmeli');
}

/* ======================= SONUÇ ======================= */
console.log('');
if (hata === 0) console.log('✅ TÜM TESTLER GEÇTİ (13 başlık)');
else console.log('❌ ' + hata + ' HATA VAR');
process.exit(hata ? 1 : 0);
