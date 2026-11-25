/* Akaryakıt Patronu — arayüz (DOM) testi */
'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');

const KOK = require('path').join(__dirname, '..', 'app', 'src', 'main', 'assets') + '/';
let hata = 0;
const konsolHatalari = [];

const dom = new JSDOM(fs.readFileSync(KOK + 'index.html', 'utf8'), {
  runScripts: 'dangerously',
  url: 'https://appassets.androidplatform.net/assets/index.html',
  pretendToBeVisual: true,
  resources: undefined,
  beforeParse(w) {
    w.AndroidKabuk = { titret() {}, cik() {}, surum: () => '1.0', surumKodu: () => '1', guncelle() {} };
    w.fetch = () => Promise.reject(new Error('ağ yok'));
    w.confirm = () => true;
    w.onerror = (m) => { konsolHatalari.push(String(m)); };
  }
});
const w = dom.window;

/* scriptler <script src> ile geliyor; jsdom resources kapalı olduğu için elle yükle */
/* jsdom'da her eval ayrı sözcüksel kapsam açıyor; tarayıcıda <script> etiketleri
   tek global kapsamı paylaşır. Testte aynı davranışı elde etmek için her dosyanın
   tanımlarını window'a bağlıyoruz. */
const dosyalar = [
  ['js/veri.js', ['VERI']],
  ['js/durum.js', ['D', 'KAYIT_ANAHTAR', 'tl', 'tlTam', 'say', 'litre', 'yuzde', 'ikiHane', 'rastgele', 'rastgeleTam', 'secRast', 'kisitla', 'id']],
  ['js/sim.js', ['SIM']],
  ['js/servis.js', ['SERVIS']],
  ['js/arayuz.js', ['UI']],
  ['js/guncelle.js', ['GUNCELLE']],
  ['js/main.js', ['OYUN']]
];
dosyalar.forEach(([f, adlar]) => {
  const src = fs.readFileSync(KOK + f, 'utf8') +
    '\n;' + adlar.map(a => 'window.' + a + '=' + a + ';').join('');
  try { w.eval(src); }
  catch (e) { console.log('  ✗ ' + f + ' yüklenemedi: ' + e.message); hata++; }
});

function kontrol(k, m) { if (!k) { console.log('  ✗ ' + m); hata++; } }
function calistir(ad, fn) {
  try { fn(); } catch (e) { console.log('  ✗ ' + ad + ' hata: ' + e.message + ' | ' + (e.stack || '').split('\n')[1]); hata++; }
}

const { D, SIM, UI, SERVIS, VERI, GUNCELLE, OYUN } = w;

console.log('UI TEST 1 — açılış ekranı');
calistir('acilisCiz', () => OYUN.acilisCiz());
kontrol(w.document.getElementById('acilis').innerHTML.indexOf('BAŞLA') > 0, 'BAŞLA butonu çizilmeli');

console.log('UI TEST 2 — oyunu başlat ve tüm sekmeleri çiz');
calistir('basla', () => OYUN.basla(true));
kontrol(w.document.getElementById('alt').children.length === 7, '7 sekme olmalı');
kontrol(w.document.getElementById('govde').innerHTML.length > 500, 'istasyon ekranı dolu olmalı');

/* para ve seviye ver, her şey açılsın */
D.s.para = 90000000; D.s.seviye = 20;
UI.sekmeler.forEach(sk => {
  calistir('sekme ' + sk.id, () => { UI.sekmeGec(sk.id); });
  const g = w.document.getElementById('govde').innerHTML;
  kontrol(g.length > 200, sk.id + ' ekranı boş kalmamalı (' + g.length + ')');
  kontrol(g.indexOf('undefined') < 0, sk.id + ' ekranında "undefined" geçmemeli');
  kontrol(g.indexOf('NaN') < 0, sk.id + ' ekranında "NaN" geçmemeli');
});

console.log('UI TEST 3 — hücre tıklama ve modallar');
UI.sekmeGec('istasyon');
const sb = D.sube();
/* boş arsa → beton modalı */
let bosArsa = -1;
for (let i = 0; i < sb.beton.length; i++) if (!sb.beton[i]) { bosArsa = i; break; }
if (bosArsa >= 0) {
  calistir('betonModal', () => UI.hucreTik(bosArsa));
  kontrol(w.document.getElementById('modal').classList.contains('ac'), 'beton modalı açılmalı');
  kontrol(w.document.getElementById('modalIc').innerHTML.indexOf('Beton dök') > 0, 'beton dök butonu olmalı');
  calistir('betonDok', () => UI.betonDok(bosArsa));
  kontrol(sb.beton[bosArsa], 'beton dökülmeli');
  kontrol(w.document.getElementById('modalIc').innerHTML.indexOf('İnşa') >= 0 ||
          w.document.getElementById('modalIc').innerHTML.indexOf('Pompa') > 0, 'inşa modalı açılmalı');
  calistir('binaKur', () => UI.binaKur(bosArsa, 'market'));
  kontrol(sb.yapi[bosArsa] && sb.yapi[bosArsa].t === 'market', 'market kurulmalı');
  calistir('yapiModal', () => UI.hucreTik(bosArsa));
  const mi = w.document.getElementById('modalIc').innerHTML;
  kontrol(mi.indexOf('Yükselt') > 0 && mi.indexOf('Bakım') > 0, 'yükselt/bakım butonları olmalı');
  calistir('yukselt', () => UI.yukselt(bosArsa));
  kontrol(sb.yapi[bosArsa].sv === 2, 'seviye 2 olmalı');
  calistir('modalKapat', () => UI.modalKapat());
  kontrol(!w.document.getElementById('modal').classList.contains('ac'), 'modal kapanmalı');
}
/* pompa modalı + pompacı ataması */
calistir('pompaModal', () => UI.hucreTik(0));
calistir('aday', () => { UI.adaylarYenile(); });
const pompaci = UI.adaylar.find(a => a.tip === 'pompaci');
calistir('iseAl', () => SIM.iseAl(sb, pompaci));
calistir('pompaAta', () => UI.pompaAta(pompaci.id, 0, 0));
kontrol(pompaci.pompa === 0, 'pompacı pompa 0 a atanmalı');
calistir('kaldir', () => UI.pompaAta(pompaci.id, null, 0));
kontrol(pompaci.pompa === null, 'pompacı kaldırılmalı');
UI.modalKapat();

console.log('UI TEST 4 — fiyat ve sipariş etkileşimi');
UI.sekmeGec('fiyat');
calistir('fiyatKaydir', () => UI.fiyatKaydir('benzin', '55.50'));
kontrol(D.sube().fiyat.benzin === 55.5, 'fiyat güncellenmeli');
calistir('fiyatOtomatik', () => UI.fiyatOtomatik(-0.02));
kontrol(D.sube().fiyat.benzin < D.sube().rakip.benzin, 'rakip altı fiyat uygulanmalı');
const rangeler = w.document.querySelectorAll('input[type=range]');
kontrol(rangeler.length === 4, '4 yakıt için kaydırıcı olmalı, var: ' + rangeler.length);
UI.sekmeGec('siparis');
const tankOnce = D.sube().tank.benzin.dolu;
calistir('siparis', () => UI.siparis('benzin', 1000));
kontrol(D.sube().siparis.length === 1, 'sipariş oluşmalı');
for (let i = 0; i < 300; i++) SIM.siparisIsle(D.sube(), 1);
kontrol(D.sube().tank.benzin.dolu > tankOnce, 'tank dolmalı');

console.log('UI TEST 5 — servis ekranı (elle dolum)');
UI.sekmeGec('istasyon');
/* müşteri yarat ve pompaya ata */
const sb2 = D.sube();
sb2.kuyruk.length = 0;
sb2.yapi.forEach(y => { if (y && y.t === 'pompa') y.mesgul = null; });
sb2.tank.benzin.dolu = 4000;
let m = null;
for (let i = 0; i < 400 && !m; i++) { const c = SIM.musteriYap(sb2); if (c && c.yakit === 'benzin') m = c; }
kontrol(!!m, 'benzin müşterisi üretilmeli');
m.hedef = 40; m.tip = 'litre'; m.etiket = '40 L';
sb2.kuyruk.push(m);
SIM.atama(sb2);
kontrol(m.pompa !== null, 'müşteri pompaya atanmalı');
calistir('servis aç', () => SERVIS.ac(m.pompa));
kontrol(SERVIS.acik, 'servis ekranı açılmalı');
kontrol(w.document.getElementById('servis').innerHTML.indexOf('TAM AKIŞ') > 0, 'tam akış tetiği olmalı');
kontrol(w.document.getElementById('servis').innerHTML.indexOf('YAVAŞ') > 0, 'yavaş tetiği olmalı');
/* nozul seçmeden akıtma denemesi */
calistir('nozulsuz bas', () => { SERVIS.bas(true, 'tam'); SERVIS.akit(1); });
kontrol(m.verilen === 0, 'nozul seçmeden yakıt akmamalı');
calistir('nozul seç', () => SERVIS.nozulSec('benzin'));
kontrol(SERVIS.nozul === 'benzin', 'nozul seçilmeli');
/* tam akışla 35 L, sonra yavaşla hedefe */
calistir('tam akış', () => { SERVIS.bas(true, 'tam'); for (let i = 0; i < 100 && m.verilen < 38; i++) SERVIS.akit(0.1); });
kontrol(m.verilen > 35 && m.verilen < 40, 'tam akış 38 L civarına getirmeli: ' + m.verilen.toFixed(2));
calistir('yavaş akış', () => { SERVIS.bas(true, 'yavas'); let n = 0; while (m.verilen < 39.95 && n++ < 500) SERVIS.akit(0.05); SERVIS.bas(false, 'yavas'); });
kontrol(Math.abs(m.verilen - 40) < 0.2, 'yavaş akışla hedefe yakın durulabilmeli: ' + m.verilen.toFixed(3));
const paraOnce = D.s.para;
calistir('bitir', () => SERVIS.bitir());
kontrol(D.s.para > paraOnce, 'satıştan para kazanılmalı');
kontrol(w.document.getElementById('servis').innerHTML.indexOf('Sonuç') > 0, 'sonuç ekranı gelmeli');
kontrol(D.s.ist.tamIsabet >= 1, 'tam isabet sayılmalı');
calistir('servis kapat', () => SERVIS.kapat());
kontrol(!SERVIS.acik, 'servis kapanmalı');

console.log('UI TEST 6 — yanlış tabanca');
sb2.kuyruk.length = 0;
sb2.yapi.forEach(y => { if (y && y.t === 'pompa') y.mesgul = null; });
let m2 = null;
for (let i = 0; i < 400 && !m2; i++) { const c = SIM.musteriYap(sb2); if (c && c.yakit === 'benzin') m2 = c; }
m2.hedef = 30;
sb2.kuyruk.push(m2); SIM.atama(sb2);
sb2.tank.dizel.dolu = 3000;
calistir('servis aç 2', () => SERVIS.ac(m2.pompa));
calistir('yanlış nozul', () => { SERVIS.nozulSec('dizel'); SERVIS.bas(true, 'tam'); for (let i = 0; i < 40; i++) SERVIS.akit(0.1); });
const paraOnce2 = D.s.para;
calistir('bitir 2', () => SERVIS.bitir());
kontrol(D.s.para < paraOnce2, 'yanlış yakıtta para kaybedilmeli');
kontrol(w.document.getElementById('servis').innerHTML.indexOf('Yanlış') > 0, 'yanlış yakıt sonucu gösterilmeli');
SERVIS.kapat();

console.log('UI TEST 7 — geri tuşu davranışı');
UI.sekmeGec('fiyat');
kontrol(w.oyunGeriTusu() === true, 'sekmedeyken geri tuşu istasyona dönmeli');
kontrol(UI.sekme === 'istasyon', 'istasyona dönülmeli');
kontrol(w.oyunGeriTusu() === false, 'istasyondayken geri tuşu uygulamayı kapatmalı');
UI.modal('Test', 'içerik');
kontrol(w.oyunGeriTusu() === true, 'modal açıkken geri tuşu modalı kapatmalı');
kontrol(!UI.modalAcik, 'modal kapanmalı');

console.log('UI TEST 8 — şube geçişi, devretme modalı, sıfırlama');
D.s.para = 90000000; D.s.seviye = 20;
calistir('şube aç', () => { UI.sekmeGec('subeler'); UI.subeAc('cevreyolu'); });
kontrol(D.s.subeler.length === 2, 'ikinci şube açılmalı');
calistir('şube geç', () => UI.subeGec(1));
kontrol(D.s.aktif === 1, 'aktif şube değişmeli');
calistir('devret modalı', () => UI.devretModal(1));
kontrol(w.document.getElementById('modalIc').innerHTML.indexOf('Devret') > 0, 'devret modalı açılmalı');
UI.modalKapat();
calistir('şube geç 0', () => UI.subeGec(0));

console.log('UI TEST 9 — döngü, kayıt, güncelleme denetimi');
calistir('tik', () => { for (let i = 0; i < 300; i++) { SIM.tik(D.s.hiz); UI.tikCiz(); } });
kontrol(D.kaydet(), 'kayıt çalışmalı');
calistir('guncelleme', () => GUNCELLE.kontrol(true));
calistir('hız', () => { UI.hizDegis(); UI.hizDegis(); });
kontrol([1,2,3].indexOf(D.s.hiz) >= 0, 'hız geçerli olmalı');
calistir('istatistik', () => UI.sekmeGec('daha'));
const daha = w.document.getElementById('govde').innerHTML;
kontrol(daha.indexOf('İstatistik') > 0, 'istatistik bölümü olmalı');
kontrol(daha.indexOf('Rafineri') > 0, 'rafineri bölümü olmalı');
calistir('sıfırla', () => { UI.sifirlaOnay(); UI.sifirla(); });
kontrol(D.s.gun === 1 && D.s.subeler.length === 1, 'sıfırlama yeni oyun başlatmalı');

console.log('UI TEST 10 — bildirimler ve konsol hataları');
calistir('bildir', () => { for (let i = 0; i < 8; i++) UI.bildir('Başlık ' + i, 'metin', 'iyi'); });
kontrol(w.document.getElementById('bildirimler').children.length <= 4, 'en fazla 4 bildirim durmalı');
kontrol(konsolHatalari.length === 0, 'yakalanmamış JS hatası olmamalı: ' + konsolHatalari.join(' | '));

console.log('');
if (hata === 0) console.log('✅ ARAYÜZ TESTLERİ GEÇTİ (10 başlık)');
else console.log('❌ ' + hata + ' ARAYÜZ HATASI');
process.exit(hata ? 1 : 0);
