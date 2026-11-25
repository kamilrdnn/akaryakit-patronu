/* Akaryakıt Patronu — izometrik sahne render testi
   Gerçek bir canvas üstünde çizim yapar, hata var mı bakar ve PNG üretir. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createCanvas } = require('@napi-rs/canvas');

const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'js') + '/';
const EN = 420, BOY = 760;

let hata = 0;
function kontrol(k, m) { if (!k) { console.log('  ✗ ' + m); hata++; } }

/* ---- sahte tarayıcı ---- */
const tuval = createCanvas(EN * 2, BOY * 2);
tuval.parentNode = { clientWidth: EN, clientHeight: BOY };
tuval.style = {};
tuval.addEventListener = function () {};

const depo = {};
const sandbox = {
  console,
  performance: { now: () => Date.now() },
  localStorage: {
    getItem: k => (k in depo ? depo[k] : null),
    setItem: (k, v) => { depo[k] = String(v); },
    removeItem: k => { delete depo[k]; }
  },
  devicePixelRatio: 2,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  setTimeout: (f) => { return 0; },
  addEventListener: () => {},
  document: {
    getElementById: (id) => (id === 'tuval' ? tuval : null),
    querySelectorAll: () => [],
    createElement: (et) => {
      if (et === 'canvas') {
        const t = createCanvas(8, 8);
        /* width/height atanınca @napi-rs yeniden boyutlanır */
        return t;
      }
      return { classList: { add() {}, remove() {}, toggle() {} }, style: {} };
    },
    body: { classList: { toggle() {}, add() {}, remove() {} }, appendChild() {} },
    addEventListener: () => {}
  }
};
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);
vm.runInContext('var UI={bildir:function(){},ciz:function(){},modal:function(){},tikCiz:function(){},basarimToast:function(){}};' +
                'var OYUN={duruyor:false};', ctx);
['veri.js', 'durum.js', 'sim.js', 'izo.js','model.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(A + f, 'utf8'), ctx, { filename: f });
});
const D = vm.runInContext('D', ctx);
const SIM = vm.runInContext('SIM', ctx);
const IZO = vm.runInContext('IZO', ctx);
const VERI = vm.runInContext('VERI', ctx);

/* ---- zengin bir istasyon kur ---- */
D.yeni();
D.s.para = 90000000;
D.s.seviye = 20;
const sb = D.sube();
/* arsayı büyüt */
while (sb.w < 5 || sb.h < 5) SIM.arsaGenislet(sb);
for (let i = 0; i < sb.beton.length; i++) sb.beton[i] = true;
/* pompalar */
SIM.pompaKur(sb, SIM.yerAc(sb, 'pompa'), 'lpg');
SIM.pompaKur(sb, SIM.yerAc(sb, 'pompa'), 'ev');
var _pl = D.pompalar(sb); if (_pl[0]) _pl[0].p.sv = 3; if (_pl[1]) _pl[1].p.sv = 2;
/* tesisler */
const yerlesim = [[4, 'totem'], [5, 'market'], [6, 'kafe'], [7, 'depo'], [8, 'gunes'],
                  [9, 'wc'], [10, 'mescit'], [11, 'havasu'], [12, 'atm'], [13, 'yangin'],
                  [14, 'kamera'], [15, 'lastikci'], [16, 'adblue'], [17, 'yikama'],
                  [18, 'jenerator'], [19, 'restoran'], [20, 'tirpark'], [21, 'yag'],
                  [22, 'ofis'], [23, 'smr'], [24, 'market']];
yerlesim.forEach(([i, t]) => { const yer = SIM.yerAc(sb, 'bina'); if (yer >= 0) SIM.binaKur(sb, yer, t); });
sb.tank.benzin.dolu = 4000; sb.tank.dizel.dolu = 3500; sb.tank.lpg.dolu = 1800;
/* arızalı bir yapı */
const _bl = D.binalar(sb); if (_bl[2]) { _bl[2].b.arizali = true; _bl[2].b.bakim = 20; }

/* personel: pompacı, temizlikçi, teknisyen, müdür */
['pompaci', 'temizlik', 'teknisyen', 'mudur'].forEach(tip => {
  const a = SIM.adayUret(tip);
  if (SIM.iseAl(sb, a) && tip === 'pompaci') SIM.pompaAta(sb, a.id, D.pompalar(sb)[0].i);
});
kontrol(sb.personel.length === 4, '4 personel işe alınmalı');

/* müşteriler */
for (let i = 0; i < 40 && sb.kuyruk.length < 4; i++) {
  const m = SIM.musteriYap(sb);
  if (m) sb.kuyruk.push(m);
}
SIM.atama(sb);

console.log('SAHNE TEST 1 — kurulum');
kontrol(IZO.kur() === true, 'IZO gerçek canvas üstünde kurulmalı');
kontrol(IZO.cz !== null, '2B bağlam alınmalı');
kontrol(IZO.en === EN && IZO.boy === BOY, 'tuval boyutu okunmalı');

console.log('SAHNE TEST 2 — araç ve efektler');
IZO.guncelle(0.016);
kontrol(IZO.arabalar.length >= sb.kuyruk.length, 'her müşteri için araç olmalı: ' + IZO.arabalar.length);
kontrol((IZO.susler || []).length > 0, 'süs nesneleri üretilmeli');
IZO.personelGuncelle(sb, 0.016);
kontrol(IZO.personeller.length === 4, 'personel sahnede konumlanmalı: ' + IZO.personeller.length);
kontrol(IZO.personeller.some(p => p.tip === 'pompaci'), 'pompacı figürü olmalı');
IZO.ucur(1.5, 1.5, '+₺750');
IZO.ucur(2.5, 0.5, '+₺1.240', '#6ee2a0');
for (let i = 0; i < 600; i++) IZO.guncelle(0.05);   /* araçlar pompaya yanaşsın */
const parkEden = IZO.arabalar.filter(a => a.mid && a.durum === 'park').length;
kontrol(parkEden > 0, 'en az bir araç pompaya park etmeli (park: ' + parkEden + ')');

console.log('SAHNE TEST 3 — çizim (gündüz / gece / kış)');
function cizDene(ad) {
  try { IZO.ciz(); return true; }
  catch (e) { console.log('  ✗ ' + ad + ' çizimi hata verdi: ' + e.message + ' | ' + (e.stack || '').split('\n')[1]); hata++; return false; }
}
D.s.saat = 13;
kontrol(cizDene('gündüz'), 'gündüz çizimi');
kontrol(IZO.vurus.length > 0, 'dokunma sınama çokgenleri üretilmeli: ' + IZO.vurus.length);
fs.writeFileSync(path.join(__dirname, 'sahne-gunduz.png'), tuval.toBuffer('image/png'));

D.s.saat = 22;
kontrol(cizDene('gece'), 'gece çizimi');
fs.writeFileSync(path.join(__dirname, 'sahne-gece.png'), tuval.toBuffer('image/png'));

D.s.saat = 11; D.s.sezonIdx = 3;   /* kış */
kontrol(cizDene('kış'), 'kış çizimi');
fs.writeFileSync(path.join(__dirname, 'sahne-kis.png'), tuval.toBuffer('image/png'));
D.s.sezonIdx = 1;

/* zemin önbelleği: kapanırsa her karede ~1500 karo çizilir, oyun kasar */
kontrol(!IZO._zDestekYok, 'zemin önbelleği devrede olmalı (hata: ' + (IZO._zHata || '-') + ')');
kontrol(!!IZO._zOnbellek, 'zemin önbelleği üretilmeli');
if (IZO._zOnbellek) {
  kontrol(IZO._zOnbellek.en * IZO._zOnbellek.boy <= 7.5e6,
    'önbellek boyutu sınırda kalmalı: ' + IZO._zOnbellek.en + 'x' + IZO._zOnbellek.boy);
}

console.log('SAHNE TEST 4 — dokunma isabeti');
D.s.saat = 13;
IZO.ciz();
let bulunan = 0;
const vurusKopya = IZO.vurus.slice();
/* her yapının silueti içinden bir nokta seç ve doğru hücreye düşsün */
const hucreler = {};
vurusKopya.forEach(v => { hucreler[v.i] = v; });
Object.keys(hucreler).forEach(k => {
  const v = hucreler[k];
  const mx = v.poly.reduce((t, p) => t + p.x, 0) / v.poly.length;
  const my = v.poly.reduce((t, p) => t + p.y, 0) / v.poly.length;
  if (IZO.noktaIcinde(mx, my, v.poly)) bulunan++;
});
kontrol(bulunan > 0, 'siluet merkezleri kendi çokgeninin içinde olmalı');

/* --- uçtan uca: her yapının gövdesine dokunmak kendi hücresini açmalı --- */
{
  const eskiTik = vm.runInContext('UI.hucreTik', ctx);
  let gelen = null;
  vm.runInContext('UI.hucreTik = function (k) { globalThis.__sonTik = k; };', ctx);
  let isabet = 0, kayip = [];
  for (let i = 0; i < sb.yapi.length; i++) {
    const y = sb.yapi[i];
    if (!y) continue;
    const gx = i % sb.w, gy = Math.floor(i / sb.w);
    /* görünen gövde üzerinde birkaç nokta dene: en az biri kendi hücresini açmalı */
    const yukseklikler = y.t === 'totem' ? [70, 80, 90, 100] : [2, 6, 11, 17, 25, 34, 46, 60, 76];
    const kaydir = [[0.5, 0.5], [0.3, 0.3], [0.7, 0.7], [0.3, 0.7], [0.7, 0.3]];
    let tuttu = false, sonGelen = null;
    for (const [ox, oy2] of kaydir) {
      for (const z of yukseklikler) {
        const p = IZO.ekran(gx + ox, gy + oy2, z);
        vm.runInContext('globalThis.__sonTik = null;', ctx);
        IZO.dokunuldu(p.x, p.y);
        gelen = vm.runInContext('globalThis.__sonTik', ctx);
        if (gelen !== null) sonGelen = gelen;
        if (gelen === i) { tuttu = true; break; }
      }
      if (tuttu) break;
    }
    if (tuttu) isabet++;
    else kayip.push(i + '(' + y.t + ')→' + sonGelen);
  }
  /* bu test istasyonu kasıtlı olarak tıka basa dolu; bir iki yapı öndekinin
     tamamen arkasında kalabilir (gerçek oyunda da öyle). Bunlar "Yapılarım"
     listesinden yönetilir. Çoğunluk doğrudan dokunulabilir olmalı. */
  kontrol(kayip.length <= 2, 'yapıların neredeyse tamamı dokunulabilmeli, kaçanlar: ' + kayip.join(', '));
  kontrol(isabet > 5, 'yeterli yapı sınanmalı: ' + isabet);
  vm.runInContext('UI.hucreTik = function () {};', ctx);
}

/* boş araziye dokunma karo hesabına düşmeli */
const hedef = IZO.ekran(0.5, 0.5, 0);
const karo = IZO.karo(hedef.x, hedef.y);
kontrol(Math.abs(karo.gx - 0.5) < 0.01 && Math.abs(karo.gy - 0.5) < 0.01, 'karo dönüşümü tutarlı');

/* marka tabelası farklı biçimlerde çizilmeli */
['klasik','genis','kule','tente'].forEach(sk => {
  D.s.tabela = { ad: 'KAMİL PETROL', renk: 'mavi', sekil: sk, logo: '🦅', fiyat: true, kanopi: true };
  let hataVar = false;
  try { IZO.ciz(); } catch (e) { hataVar = true; console.log('  ✗ tabela ' + sk + ': ' + e.message); }
  kontrol(!hataVar, 'tabela biçimi çizilmeli: ' + sk);
});
D.s.tabela = { ad: 'PETROL', renk: 'turuncu', sekil: 'klasik', logo: '⛽', fiyat: true, kanopi: false };
IZO.ciz();
fs.writeFileSync(path.join(__dirname, 'sahne-tabela.png'), tuval.toBuffer('image/png'));

/* araçlar kapıdan girip kapıdan çıkmalı, hemen yok olmamalı */
{
  const kp = IZO.kapilar(sb);
  kontrol(kp.giris < kp.cikis, 'giriş kapısı çıkıştan solda olmalı');
  const yeniM = sb.kuyruk.filter(m => m.pompa !== null)[0];
  if (yeniM) {
    const taze = IZO.arabaYap(sb, yeniM, 0);
    kontrol(taze.yol.length >= 5, 'araç kapıdan geçen çok adımlı yol izlemeli: ' + taze.yol.length);
    kontrol(Math.abs(taze.yol[0].gx - kp.giris) < 0.01, 'ilk durak giriş kapısı olmalı');
  }
  const arac = IZO.arabalar.filter(a => a.mid)[0];
  if (arac) {
    /* müşteri kuyruktan çıkınca araç bekleyip çıkış kapısına yönelmeli */
    const mid = arac.mid;
    sb.kuyruk = sb.kuyruk.filter(m => m.id !== mid);
    IZO.musteriArabalari(sb);
    kontrol(arac.durum === 'gidiyor', 'araç gidiyor durumuna geçmeli');
    kontrol(arac.bekle > 0, 'ödeme molası olmalı');
    const sonNokta = arac.yol[arac.yol.length - 1];
    kontrol(sonNokta.gx > sb.w, 'araç sahadan çıkmalı');
    /* mola bitmeden hareket etmemeli */
    const x0 = arac.gx, y0 = arac.gy;
    IZO.arabaIlerlet(arac, 0.1);
    kontrol(arac.gx === x0 && arac.gy === y0, 'mola sırasında araç beklemeli');
    arac.bekle = 0;
    IZO.arabaIlerlet(arac, 0.2);
    kontrol(arac.gx !== x0 || arac.gy !== y0, 'mola bitince araç hareket etmeli');
  }
}

/* markete uğrayan müşteri otoparka geçmeli */
{
  const cepler = IZO.otoparkYerleri(sb);
  kontrol(cepler.length > 0, 'otopark cebi olmalı');
  const ar2 = IZO.arabalar.filter(a => a.mid && a.durum !== 'gidiyor')[0];
  if (ar2) {
    IZO.marketNiyeti(ar2.mid);
    sb.kuyruk = sb.kuyruk.filter(m => m.id !== ar2.mid);
    IZO.musteriArabalari(sb);
    kontrol(ar2.durum === 'parkta', 'market müşterisi otoparka yönelmeli: ' + ar2.durum);
    kontrol(ar2.parkSuresi > 0, 'markette geçireceği süre olmalı');
    /* park edip yaya çıkarmalı, süre dolunca çıkışa gitmeli */
    ar2.bekle = 0; ar2.yol = [];
    IZO.yayaGuncelle(sb, 0.1);
    const yayaVar = (IZO.yayalar || []).some(y => y.aracId === ar2.mid);
    kontrol(yayaVar, 'park eden araçtan müşteri inmeli');
    ar2.parkSuresi = 0.01;
    IZO.guncelle(0.2);
    kontrol(ar2.durum === 'gidiyor', 'market dönüşü araç çıkışa geçmeli: ' + ar2.durum);
  }
}

console.log('SAHNE TEST 5 — tek pompalı yeni şube ve boş arsa');
D.yeni();
IZO._sahneAnahtar = '';
IZO.guncelle(0.016);
kontrol(cizDene('yeni oyun'), 'yeni oyun sahnesi çizilmeli');
fs.writeFileSync(path.join(__dirname, 'sahne-baslangic.png'), tuval.toBuffer('image/png'));

console.log('SAHNE TEST 6 — uzun süreli çizim kararlılığı');
D.yeni(); D.s.para = 9000000; D.s.seviye = 20;
IZO._sahneAnahtar = '';
let cizimHatasi = 0;
for (let i = 0; i < 400; i++) {
  try {
    SIM.dakika();
    IZO.guncelle(0.05);
    IZO.ciz();
  } catch (e) { cizimHatasi++; if (cizimHatasi === 1) console.log('  ✗ ' + e.message + ' | ' + (e.stack || '').split('\n')[1]); }
}
kontrol(cizimHatasi === 0, '400 karede çizim hatası olmamalı: ' + cizimHatasi);
kontrol(IZO.arabalar.length < 40, 'araç listesi şişmemeli: ' + IZO.arabalar.length);
kontrol(IZO.ucanlar.length <= 14, 'uçan yazı listesi sınırlı olmalı');

console.log('');
if (hata === 0) console.log('✅ SAHNE TESTLERİ GEÇTİ (6 başlık) — PNG çıktıları test/ klasöründe');
else console.log('❌ ' + hata + ' SAHNE HATASI');
process.exit(hata ? 1 : 0);
