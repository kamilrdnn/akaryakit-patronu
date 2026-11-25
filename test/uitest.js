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
  ['js/izo.js', ['IZO']],
  ['js/model.js', []],
  ['js/ses.js', ['SES']],
  ['js/servis.js', ['SERVIS']],
  ['js/mini.js', ['MINI']],
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

const { D, SIM, UI, SERVIS, VERI, GUNCELLE, OYUN, IZO, MINI, SES } = w;

console.log('UI TEST 1 — açılış ekranı');
calistir('acilisCiz', () => OYUN.acilisCiz());
kontrol(w.document.getElementById('acilis').innerHTML.indexOf('Yeni oyun') > 0, 'Yeni oyun düğmesi çizilmeli');
['yeniOnay', 'yedek', 'hakkinda'].forEach(e => calistir('açılış ' + e, () => OYUN.acilisCiz(e)));
calistir('yeni oyun onayı', () => OYUN.yeniOyunOnay());
kontrol(w.document.getElementById('acilis').innerHTML.indexOf('sıfırdan başla') > 0, 'sayfa içi onay ekranı gelmeli (confirm kullanılmamalı)');
kontrol(fs.readFileSync(KOK + 'js/main.js', 'utf8').indexOf('confirm(') < 0, 'confirm() WebView\'da çalışmaz, kullanılmamalı');
calistir('açılış ana', () => OYUN.acilisCiz());

console.log('UI TEST 2 — oyunu başlat ve tüm sekmeleri çiz');
calistir('basla', () => OYUN.basla(true));
kontrol(w.document.getElementById('fab').querySelectorAll('.fabOge').length === 8, 'yelpaze menüde 8 öğe olmalı');
kontrol(!!w.document.querySelector('.fabAna'), 'ana menü düğmesi olmalı');
kontrol(w.document.getElementById('hud').innerHTML.length > 400, 'istasyon HUD dolu olmalı');
kontrol(w.document.getElementById('hud').classList.contains('ac'), 'istasyonda HUD açık olmalı');
kontrol(!w.document.getElementById('govde').classList.contains('ac'), 'istasyonda panel kapalı olmalı');

/* para ve seviye ver, her şey açılsın */
D.s.para = 90000000; D.s.seviye = 20;
UI.sekmeler.forEach(sk => {
  calistir('sekme ' + sk.id, () => { UI.sekmeGec(sk.id); });
  const kap = sk.id === 'istasyon' ? 'hud' : 'govde';
  const g = w.document.getElementById(kap).innerHTML;
  kontrol(g.length > 200, sk.id + ' ekranı boş kalmamalı (' + g.length + ')');
  kontrol(g.indexOf('undefined') < 0, sk.id + ' ekranında "undefined" geçmemeli');
  kontrol(g.indexOf('NaN') < 0, sk.id + ' ekranında "NaN" geçmemeli');
  if (sk.id !== 'istasyon') kontrol(g.indexOf('panelBas') > 0, sk.id + ' panelinde geri başlığı olmalı');
});

console.log('UI TEST 2a — yelpaze menü');
calistir('menü aç', () => UI.fabAc());
kontrol(UI.fabAcik === true, 'menü açılmalı');
kontrol(w.document.getElementById('fab').classList.contains('ac'), 'menüye ac sınıfı gelmeli');
const ilkOge = w.document.querySelector('.fabOge');
kontrol(ilkOge.style.transform.indexOf('scale(1)') > 0, 'öğeler yayılmalı');
calistir('menüden seç', () => UI.fabSec('market'));
kontrol(UI.sekme === 'market', 'menüden market açılmalı');
kontrol(UI.fabAcik === false, 'seçimden sonra menü kapanmalı');
UI.sekmeGec('istasyon');

console.log('UI TEST 2b — HUD bileşenleri');
UI.sekmeGec('istasyon');
let hud = w.document.getElementById('hud').innerHTML;
kontrol(hud.indexOf('yakitKart') > 0, 'yakıt göstergesi olmalı');
kontrol(hud.indexOf('SIRADAKİ') > 0 || hud.indexOf('ZİNCİR') > 0, 'sıradaki lokasyon kartı olmalı');
kontrol(hud.indexOf('kampanya') > 0, 'sezon kampanyası kartı olmalı');
kontrol(hud.indexOf('kamBtn') > 0, 'kamera butonları olmalı');
calistir('hızlı sipariş', () => UI.hizliSiparis('benzin'));
kontrol(w.document.getElementById('modalIc').innerHTML.indexOf('Tankı doldur') > 0, 'hızlı sipariş modalı açılmalı');
UI.modalKapat();
calistir('kampanya bilgisi', () => UI.kampanyaBilgi());
kontrol(w.document.getElementById('modalIc').innerHTML.indexOf('Kampanya') >= 0 ||
        w.document.getElementById('modalIc').innerHTML.indexOf('İlerleme') > 0, 'kampanya modalı açılmalı');
UI.modalKapat();

console.log('UI TEST 2c — kampanya ve başarım mantığı');
const kmp = SIM.kampanya();
kontrol(!!kmp && !!kmp.tanim && kmp.tanim.hedef > 0, 'kampanya tanımı gelmeli');
D.s.kampanya.sayac = 0;
/* market yokken ilerlememeli */
let once = D.s.kampanya.sayac;
for (let i = 0; i < 200; i++) SIM.kampanyaIlerlet(D.sube());
kontrol(D.s.kampanya.sayac === once, 'market yokken kampanya ilerlememeli');
/* market kurunca ilerlemeli */
D.s.para = 9000000; D.s.seviye = 20;
let bosHucre = -1;
for (let i = 0; i < D.sube().yapi.length; i++) if (D.sube().beton[i] && !D.sube().yapi[i]) { bosHucre = i; break; }
if (bosHucre < 0) { for (let i = 0; i < D.sube().beton.length; i++) if (!D.sube().beton[i]) { SIM.betonDok(D.sube(), i); bosHucre = i; break; } }
SIM.binaKur(D.sube(), bosHucre, 'market');
for (let i = 0; i < 400 && D.s.kampanya.sayac === 0; i++) SIM.kampanyaIlerlet(D.sube());
kontrol(D.s.kampanya.sayac > 0, 'marketli şubede kampanya ilerlemeli');
/* sezon değişince sıfırlanmalı */
D.s.sezonIdx = (D.s.sezonIdx + 1) % 4;
kontrol(SIM.kampanya().sayac === 0, 'sezon değişince kampanya sıfırlanmalı');

D.s.basarimlar = [];
D.s.ist.ciro = 20000;
const paraB = D.s.para;
calistir('başarım', () => SIM.basarimKontrol());
kontrol(D.s.basarimlar.indexOf('ilk10k') >= 0, 'ciro başarımı açılmalı');
kontrol(D.s.para > paraB, 'başarım ödülü verilmeli');
const sayiB = D.s.basarimlar.length;
SIM.basarimKontrol();
kontrol(D.s.basarimlar.length === sayiB, 'aynı başarım iki kez verilmemeli');

console.log('UI TEST 2d — izometrik hesaplar');
kontrol(typeof IZO.izo === 'function', 'IZO yüklenmeli');
const pz = IZO.izo(2, 3);
kontrol(pz.x === (2 - 3) * IZO.TW / 2 && pz.y === (2 + 3) * IZO.TH / 2, 'izo izdüşümü doğru olmalı');
IZO.kam = { x: 100, y: 50, olcek: 1, kuruldu: true };
const geri = IZO.karo(IZO.izo(4, 2).x + 100, IZO.izo(4, 2).y + 50);
kontrol(Math.abs(geri.gx - 4) < 0.001 && Math.abs(geri.gy - 2) < 0.001, 'ekran→karo dönüşümü tersine çalışmalı');
kontrol(IZO.ton('#808080', 1).indexOf('rgb(') === 0, 'ton() rgb döndürmeli');
D.s.saat = 12; kontrol(IZO.isik() === 1, 'öğlen tam ışık');
D.s.saat = 2;  kontrol(IZO.isik() < 0.6 && IZO.gece(), 'gece karanlık');
D.s.saat = 10;
kontrol(IZO.noktaIcinde(5, 5, [{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}]), 'nokta içinde sınaması doğru');
kontrol(!IZO.noktaIcinde(20, 5, [{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}]), 'dışarıdaki nokta yakalanmamalı');
IZO.ucur(1, 1, '+100 ₺');
kontrol(IZO.ucanlar.length === 1, 'uçan yazı eklenmeli');
calistir('araba üretimi', () => {
  IZO.arabalar = [];
  const sbx = D.sube();
  sbx.kuyruk.length = 0;
  let mm = null;
  for (let i = 0; i < 300 && !mm; i++) mm = SIM.musteriYap(sbx);
  if (mm) { sbx.kuyruk.push(mm); SIM.atama(sbx); IZO.musteriArabalari(sbx); }
});
kontrol(IZO.arabalar.length >= 1, 'müşteri için araç oluşmalı');
calistir('araba ilerleme', () => { for (let i = 0; i < 300; i++) IZO.arabalar.forEach(a => IZO.arabaIlerlet(a, 0.05)); });
kontrol(true, 'araç ilerletme hata vermemeli');

console.log('UI TEST 2e — market sistemi');
D.s.para = 90000000; D.s.seviye = 20;
const sbm = D.sube();
UI.sekmeGec('market');
kontrol(w.document.getElementById('govde').innerHTML.indexOf('market yok') > 0 ||
        w.document.getElementById('govde').innerHTML.indexOf('Raf') > 0, 'market paneli çizilmeli');
/* market kur */
let bosM = -1;
for (let i = 0; i < sbm.beton.length; i++) if (!sbm.beton[i]) { SIM.betonDok(sbm, i); bosM = i; break; }
if (bosM < 0) for (let i = 0; i < sbm.yapi.length; i++) if (sbm.beton[i] && !sbm.yapi[i]) { bosM = i; break; }
calistir('market kur', () => SIM.binaKur(sbm, bosM, 'market'));
kontrol(SIM.marketVar(sbm), 'market kurulmalı');
kontrol(SIM.marketRafKapasite(sbm) > 0, 'raf kapasitesi olmalı');
UI.sekmeGec('market');
kontrol(w.document.getElementById('govde').innerHTML.indexOf('Ürünler') > 0, 'ürün listesi çizilmeli');
const paraM = D.s.para;
calistir('stok al', () => UI.marketAl('su', 25));
kontrol((sbm.market.stok.su || 0) === 25, 'stok eklenmeli: ' + (sbm.market.stok.su || 0));
kontrol(D.s.para < paraM, 'stok parası düşmeli');
calistir('fiyat değiştir', () => UI.marketFiyat('su', 22));
kontrol(SIM.marketSatisFiyati(sbm, 'su') === 22, 'market fiyatı güncellenmeli');
calistir('rafları doldur', () => UI.marketDoldur());
kontrol(SIM.marketDoluluk(sbm) > 25, 'raflar dolmalı: ' + SIM.marketDoluluk(sbm));
/* raf sınırı aşılmamalı */
for (let i = 0; i < 60; i++) SIM.marketStokAl(sbm, 'motoryag', 50);
kontrol(SIM.marketDoluluk(sbm) <= SIM.marketRafKapasite(sbm), 'raf kapasitesi aşılmamalı');
/* satış */
sbm.market.stok.su = 50;
let marketGeliri = 0;
const mTest = { arac: 'Otomobil', emoji: '🚗', yakit: 'benzin', bahsis: 1 };
for (let i = 0; i < 400; i++) marketGeliri += SIM.marketSatis(sbm, mTest);
kontrol(marketGeliri > 0, 'market satış geliri olmalı');
kontrol(sbm.market.ciro > 0, 'market cirosu birikmeli');

console.log('UI TEST 2f — banka ve finans');
UI.sekmeGec('banka');
const bg = w.document.getElementById('govde').innerHTML;
kontrol(bg.indexOf('Net değer') > 0, 'net değer gösterilmeli');
kontrol(bg.indexOf('Neyim var') > 0, 'varlık dökümü olmalı');
kontrol(bg.indexOf('Kredi teklifleri') > 0, 'kredi teklifleri olmalı');
const v = SIM.varliklar();
kontrol(v.toplam > 0 && isFinite(v.toplam), 'varlık toplamı tutarlı');
kontrol(v.nakit === D.s.para, 'nakit kasayla aynı olmalı');
const teklifler = SIM.krediTeklifleri();
kontrol(teklifler.length === 4, '4 kredi ürünü olmalı');
const uygunT = teklifler.filter(t => t.uygun);
kontrol(uygunT.length > 0, 'en az bir kredi uygun olmalı');
const paraK = D.s.para;
calistir('kredi çek', () => SIM.krediCek(uygunT[0]));
kontrol(D.s.para > paraK, 'kredi parası kasaya geçmeli');
kontrol(D.s.krediler.length === 1, 'kredi kaydedilmeli');
kontrol(SIM.borcToplam() > 0, 'borç görünmeli');
/* taksit ödemesi */
const kredi = D.s.krediler[0];
const taksitOnce = kredi.kalanTaksit;
D.s.gun = kredi.sonrakiGun;
calistir('taksit', () => SIM.kredileriIsle());
kontrol(D.s.krediler.length === 0 || D.s.krediler[0].kalanTaksit === taksitOnce - 1, 'taksit işlenmeli');
/* parasız gecikme */
if (D.s.krediler.length) {
  D.s.para = 0;
  D.s.gun = D.s.krediler[0].sonrakiGun;
  const notOnce = D.s.krediNotu;
  SIM.kredileriIsle();
  kontrol(D.s.krediNotu < notOnce, 'ödenmeyince kredi notu düşmeli');
  kontrol(D.s.krediler[0].gecikme > 0, 'gecikme faizi işlemeli');
}
D.s.para = 90000000;
/* erken kapatma */
if (D.s.krediler.length) {
  calistir('erken kapat', () => SIM.krediKapat(D.s.krediler[0].id));
  kontrol(D.s.krediler.length === 0, 'kredi kapanmalı');
}

console.log('UI TEST 2g — tank uyarıları');
const sbu = D.sube();
sbu.uyari = {};
sbu.siparis.length = 0;
sbu.tank.benzin.dolu = D.tankKap(sbu, 'benzin') * 0.1;
UI.bildirimGecmisi.length = 0;
calistir('uyarı', () => SIM.seviyeUyarilari(sbu));
kontrol(sbu.uyari.benzin === true, 'benzin uyarısı verilmeli');
kontrol(UI.bildirimGecmisi.some(b => b.baslik.indexOf('Benzin') > 0),
  'benzin bildirimi düşmeli (' + UI.bildirimGecmisi.map(b => b.baslik).join('|') + ')');
const uyariSayi = UI.bildirimGecmisi.length;
SIM.seviyeUyarilari(sbu);
kontrol(UI.bildirimGecmisi.length === uyariSayi, 'aynı uyarı tekrarlanmamalı');
/* yolda tanker varken uyarma */
sbu.uyari = {}; UI.bildirimGecmisi.length = 0;
['benzin', 'dizel', 'lpg'].forEach(y => sbu.siparis.push({ id: 'x' + y, yakit: y, miktar: 1000, kalan: 50, birim: 40 }));
SIM.seviyeUyarilari(sbu);
kontrol(!UI.bildirimGecmisi.some(b => b.baslik.indexOf('azaldı') > 0), 'tanker yoldayken yakıt uyarısı verilmemeli');
sbu.siparis.length = 0;
sbu.tank.benzin.dolu = D.tankKap(sbu, 'benzin') * 0.9;
SIM.seviyeUyarilari(sbu);
kontrol(sbu.uyari.benzin === false, 'tank dolunca uyarı sıfırlanmalı');

console.log('UI TEST 2h — karma pompa satışı');
const sbk = D.sube();
const pompaK = D.pompalar(sbk)[0].p;
kontrol(SIM.pompaUygun(pompaK, 'benzin') && SIM.pompaUygun(pompaK, 'dizel') && SIM.pompaUygun(pompaK, 'lpg'),
  'tek pompa benzin+dizel+LPG vermeli');
kontrol(!SIM.pompaUygun(pompaK, 'ev'), 'yakıt pompası elektrik vermemeli');
const nozullar = SERVIS.nozullar(pompaK, sbk);
kontrol(nozullar.length === 3, 'serviste üç tabanca olmalı: ' + nozullar.join(','));

console.log('UI TEST 2i — görevler, sözleşmeler, tedarikçi, sipariş adımları');
D.s.para = 90000000; D.s.seviye = 20;
calistir('görev üret', () => SIM.gorevleriYenile());
kontrol(D.s.gorevler.length === 3, 'günlük 3 görev olmalı: ' + D.s.gorevler.length);
const gv = D.s.gorevler[0];
kontrol(gv.hedef > 0 && gv.odul > 0, 'görev hedefi ve ödülü olmalı');
/* ilerleme ve ödül */
const sbG = D.sube();
sbG.bugun = { musteri: 9999, isabet: 9999, litre: 999999, marketUrun: 9999, ciro: 9999999, bakim: 99, kacan: 0, tankBos: 0, kuyrukDolu: 0 };
kontrol(SIM.gorevIlerleme(gv) >= gv.hedef, 'görev ilerlemesi okunmalı');
const paraG = D.s.para;
calistir('görev ödülü', () => SIM.gorevOdulAl(gv.id));
kontrol(D.s.para > paraG && gv.alindi, 'görev ödülü verilmeli');
kontrol(SIM.gorevOdulAl(gv.id) === false, 'aynı görev iki kez ödenmemeli');

calistir('sözleşme teklifi', () => SIM.sozlesmeTeklifleriUret());
kontrol(D.s.sozlesmeTeklif.length > 0, 'sözleşme teklifi üretilmeli');
const tk1 = D.s.sozlesmeTeklif[0];
calistir('sözleşme imzala', () => SIM.sozlesmeImzala(tk1.id));
kontrol(D.s.sozlesmeler.length === 1, 'sözleşme imzalanmalı');
/* taahhüt tutulunca teşvik, tutulmayınca kesinti */
const sz = D.s.sozlesmeler[0];
const sbS = D.s.subeler[sz.sube];
sbS.gunlukYakit[sz.yakit] = sz.gunlukL + 10;
const paraS = D.s.para;
calistir('sözleşme günü', () => SIM.sozlesmeleriIsle());
kontrol(D.s.para > paraS, 'taahhüt tutunca teşvik gelmeli');
if (D.s.sozlesmeler.length) {
  D.s.subeler[D.s.sozlesmeler[0].sube].gunlukYakit[D.s.sozlesmeler[0].yakit] = 0;
  const paraS2 = D.s.para;
  SIM.sozlesmeleriIsle();
  kontrol(D.s.para < paraS2, 'taahhüt tutmayınca kesinti olmalı');
}

/* tedarikçi sipariş fiyatını ve süresini değiştirmeli */
const sbT = D.sube();
sbT.tank.benzin.dolu = 0;
sbT.siparis.length = 0;
sbT.tedarikci = 'hizli';
D.s.rafineri.aktif = false;
calistir('hızlı tedarik', () => SIM.siparisVer(sbT, 'benzin', 1000));
const hizliSure = sbT.siparis[0].kalan, hizliBirim = sbT.siparis[0].birim;
sbT.siparis.length = 0;
sbT.tedarikci = 'toptanci';
calistir('toptancı tedarik', () => SIM.siparisVer(sbT, 'benzin', 1000));
const yavasSure = sbT.siparis[0].kalan, yavasBirim = sbT.siparis[0].birim;
kontrol(hizliBirim > yavasBirim, 'hızlı tedarikçi daha pahalı olmalı');
kontrol(hizliSure < yavasSure, 'hızlı tedarikçi daha çabuk gelmeli');
sbT.siparis.length = 0;
sbT.tedarikci = 'standart';

/* sipariş paneli adım düğmeleri */
UI.sekmeGec('siparis');
const sp = w.document.getElementById('govde').innerHTML;
kontrol(sp.indexOf('MAX') > 0 && sp.indexOf('FULL') > 0, 'sipariş kısayolları olmalı');
kontrol(sp.indexOf('Tedarikçi') > 0, 'tedarikçi seçimi olmalı');
calistir('MAX', () => UI.siparisOran('benzin', 1));
const kapB = D.tankKap(D.sube(), 'benzin');
kontrol(UI.siparisMiktar.benzin > 0, 'MAX miktarı doldurmalı');
calistir('adım', () => UI.siparisAdim('benzin', -200));
kontrol(UI.siparisMiktar.benzin <= kapB, 'adım kapasiteyi aşmamalı');

/* inşaat otomatik yerleşim */
UI.sekmeGec('insa');
kontrol(w.document.getElementById('govde').innerHTML.indexOf('cipSerit') > 0, 'inşaat kategorileri olmalı');
const oncekiBina = D.binalar(D.sube()).length;
calistir('otomatik kur', () => UI.otoKur('wc'));
kontrol(D.binalar(D.sube()).length === oncekiBina + 1, 'tesis otomatik yerleşmeli');
['istasyon', 'tesisler', 'enerji', 'arsa', 'yapilar'].forEach(alt => {
  calistir('inşa sekme ' + alt, () => UI.altSekmeGec('insa', alt));
  kontrol(w.document.getElementById('govde').innerHTML.length > 300, alt + ' kategorisi dolu olmalı');
});
UI.sekmeGec('istasyon');

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
calistir('hız', () => { UI.hizDegis(2); UI.hizDegis(5); });
kontrol([1,2,3,5].indexOf(D.s.hiz) >= 0, 'hız geçerli olmalı');
calistir('hız döngüsü', () => { UI.hizDegis(); UI.hizDegis(); });
kontrol([1,2,3,5].indexOf(D.s.hiz) >= 0, 'argümansız hız geçerli kalmalı: ' + D.s.hiz);
kontrol(w.document.getElementById('ust').innerHTML.indexOf('undefined') < 0, 'üst barda undefined olmamalı');
calistir('yönetim', () => UI.sekmeGec('daha'));
const daha = w.document.getElementById('govde').innerHTML;
kontrol(daha.indexOf('cipSerit') > 0, 'alt sekme şeridi olmalı');
kontrol(daha.indexOf('Ömür boyu') > 0, 'özet istatistikleri olmalı');
kontrol(daha.indexOf('Rafineri') > 0, 'rafineri bölümü olmalı');

/* alt sekmeler */
['muhasebe', 'gorevler', 'sozlesme', 'basarim', 'ayarlar'].forEach(alt => {
  calistir('alt sekme ' + alt, () => UI.altSekmeGec('daha', alt));
  const ic = w.document.getElementById('govde').innerHTML;
  kontrol(ic.length > 400, alt + ' sekmesi dolu olmalı');
  kontrol(ic.indexOf('undefined') < 0, alt + ' sekmesinde undefined olmamalı');
  kontrol(ic.indexOf('NaN') < 0, alt + ' sekmesinde NaN olmamalı');
});
calistir('muhasebe', () => UI.altSekmeGec('daha', 'muhasebe'));
kontrol(w.document.getElementById('govde').innerHTML.indexOf('darboğaz') > 0 ||
        w.document.getElementById('govde').innerHTML.indexOf('Darboğaz') >= 0, 'darboğaz listesi olmalı');
UI.altSekmeGec('daha', 'ozet');
calistir('sıfırla', () => { UI.sifirlaOnay(); UI.sifirla(); });
kontrol(D.s.gun === 1 && D.s.subeler.length === 1, 'sıfırlama yeni oyun başlatmalı');

console.log('UI TEST 9b — mini oyunlar, filo, taşıma, jeneratör');
{
  let sbm = D.sube();
  D.s.para = 90000000; D.s.seviye = 20;
  for (let i = 0; i < sbm.beton.length; i++) sbm.beton[i] = true;

  /* --- oto yıkama --- */
  const yerY = SIM.yerAc(sbm, 'bina');
  SIM.binaKur(sbm, yerY, 'yikama');
  const mus = { id: 'mx', arac: 'Otomobil', emoji: '🚗', yakit: 'benzin' };
  calistir('yıkama başlat', () => MINI.yikamaBaslat(mus, null));
  kontrol(w.document.getElementById('mini').classList.contains('ac'), 'mini katmanı açılmalı');
  calistir('yıkama program', () => MINI.yikamaProgram(1));
  calistir('yıkama durdur', () => MINI.yikamaDurdur());
  kontrol(w.document.getElementById('mini').innerHTML.indexOf('Sonuç') > 0, 'yıkama sonucu çizilmeli');
  calistir('mini kapat', () => MINI.kapat());

  /* --- yağ değişimi --- */
  SIM.binaKur(sbm, SIM.yerAc(sbm, 'bina'), 'yag');
  calistir('yağ başlat', () => MINI.yagBaslat(mus, null));
  calistir('yağ seç', () => MINI.yagSec(0));
  calistir('filtre seç', () => MINI.yagFiltre(true));
  calistir('yağ bitir', () => MINI.yagBitir());
  calistir('mini kapat', () => MINI.kapat());

  /* --- market kasası --- */
  SIM.binaKur(sbm, SIM.yerAc(sbm, 'bina'), 'market');
  SIM.marketTumunuDoldur(sbm);
  calistir('kasa başlat', () => MINI.kasaBaslat());
  if (MINI.acik && MINI.veri && MINI.veri.sepet) {
    const ilk = MINI.veri.sepet[0].u.id;
    calistir('ürün okut', () => MINI.kasaOkut(ilk));
    calistir('kasa bitir', () => MINI.kasaBitir());
  }
  calistir('mini kapat', () => MINI.kapat());

  /* --- LPG güvenlik --- */
  let lpgSonuc = null;
  calistir('lpg onay', () => MINI.lpgOnay(v => { lpgSonuc = v; }));
  calistir('lpg adım', () => { MINI.lpgIlerle(); MINI.lpgIlerle(); MINI.lpgIlerle(); });
  kontrol(lpgSonuc === true, 'lpg adımları tamamlanınca devam edilmeli');

  /* --- ses motoru (AudioContext yok: çökmemeli) --- */
  calistir('ses çağrıları', () => { SES.cal('kasa'); SES.cal('hata'); SES.dolumBasla(); SES.dolumDur(); SES.ayar(false); SES.ayar(true); });

  /* --- filo anlaşması --- */
  sbm.tank.dizel.dolu = 20000;
  calistir('filo teklif', () => SIM.filoTeklifleriUret());
  kontrol(D.s.filoTeklif.length > 0, 'filo teklifi üretilmeli');
  const ft = D.s.filoTeklif[0];
  calistir('filo imzala', () => SIM.filoImzala(ft.id));
  kontrol(D.s.filolar.length === 1, 'filo anlaşması listeye girmeli');
  D.s.saat = D.s.filolar[0].saatler[0];
  const kuyrukOnce = sbm.kuyruk.length;
  calistir('konvoy', () => SIM.filoKonvoy(sbm));
  kontrol(sbm.kuyruk.length > kuyrukOnce, 'konvoy araçları kuyruğa girmeli');
  calistir('filo paneli', () => { UI.altSekmeGec('daha', 'filo'); UI.sekmeGec('daha'); });
  kontrol(w.document.getElementById('govde').innerHTML.indexOf('Toplu') > 0, 'filo paneli çizilmeli');
  calistir('filo gün sonu', () => SIM.filolariIsle());

  /* --- yapı taşıma --- */
  const pomp = D.pompalar(sbm)[0].i;
  let bosHedef = -1;
  for (let i = 0; i < sbm.yapi.length; i++) if (!sbm.yapi[i] && sbm.beton[i]) { bosHedef = i; break; }
  if (bosHedef >= 0) {
    sbm.yapi[pomp].mesgul = null;
    calistir('yapı taşı', () => SIM.yapiTasi(sbm, pomp, bosHedef));
    kontrol(sbm.yapi[bosHedef] && sbm.yapi[bosHedef].t === 'pompa', 'pompa yeni hücrede olmalı');
    kontrol(!sbm.yapi[pomp], 'eski hücre boşalmalı');
  }

  /* --- jeneratör deposu --- */
  const jy = SIM.yerAc(sbm, 'bina');
  sbm.tank.dizel.dolu = 5000;
  SIM.binaKur(sbm, jy, 'jenerator');
  kontrol(sbm.yapi[jy].depo > 0, 'jeneratör kurulunca dolmalı');
  sbm.yapi[jy].depo = 0;
  calistir('jeneratör doldur', () => SIM.jeneratorDoldur(sbm, jy));
  kontrol(sbm.yapi[jy].depo > 0, 'jeneratör elle doldurulabilmeli');
  calistir('jeneratör kartı', () => UI.yapiModal(jy));
  kontrol(w.document.getElementById('modalIc').innerHTML.indexOf('yakıt deposu') > 0, 'jeneratör deposu kartta görünmeli');
  calistir('modal kapat', () => UI.modalKapat());

  /* --- istasyon düzenleme --- */
  {
    const sbd = D.sube();
    D.s.para = 90000000;
    /* yapıları kasten dağınık yerleştir */
    const pompaIdx = D.pompalar(sbd).map(p => p.i);
    const binaIdx = D.binalar(sbd).map(b => b.i);
    const toplamOnce = pompaIdx.length + binaIdx.length;
    const pomp0 = D.pompalar(sbd)[0];
    const pers = SIM.adayUret('pompaci');
    SIM.iseAl(sbd, pers);
    SIM.pompaAta(sbd, pers.id, pomp0.i);
    calistir('düzenle', () => SIM.istasyonDuzenle(sbd));
    const toplamSonra = D.pompalar(sbd).length + D.binalar(sbd).length;
    kontrol(toplamSonra === toplamOnce, 'düzenleme yapı kaybetmemeli: ' + toplamOnce + ' -> ' + toplamSonra);
    const atanan = sbd.personel.filter(x => x.id === pers.id)[0];
    kontrol(atanan && atanan.pompa !== null && sbd.yapi[atanan.pompa] && sbd.yapi[atanan.pompa].t === 'pompa',
      'pompacı ataması yeni pompaya taşınmalı');
    /* pompalar ön şeritte olmalı */
    const onSerit = D.pompalar(sbd).every(p => Math.floor(p.i / sbd.w) <= sbd.h - 2);
    kontrol(onSerit, 'pompalar ön şeride yerleşmeli');
    calistir('düzenleme onayı', () => { UI.duzenleOnay(); UI.modalKapat(); });
  }

  /* --- yedekleme --- */
  D.s.para = 1234567;
  calistir('yedek al', () => UI.yedekAl());
  const yedekKod = w.document.getElementById('yedekMetin') ? w.document.getElementById('yedekMetin').value : '';
  kontrol(yedekKod.length > 50, 'yedek kodu üretilmeli');
  calistir('modal kapat', () => UI.modalKapat());
  D.s.para = 1;
  calistir('yedek ekranı', () => UI.yedekYukleEkrani());
  const giris = w.document.getElementById('yedekGiris');
  if (giris) { giris.value = yedekKod; calistir('yedek yükle', () => UI.yedekYukle()); }
  kontrol(D.s.para === 1234567, 'yedekten kasa geri gelmeli');
  const sbm2 = D.sube();

  /* --- rehber --- */
  D.s.rehber = { adim: 0, kapali: false };
  D.s.ist.elleServis = 5;
  calistir('rehber kontrol', () => UI.rehberKontrol());
  kontrol(D.s.rehber.adim === 1, 'rehber ilk adımı tamamlanmalı');
  kontrol(UI.rehberHtml().indexOf('rehber') > 0, 'rehber şeridi çizilmeli');
  calistir('rehber kapat', () => UI.rehberKapat());
  kontrol(D.s.rehber.kapali === true, 'rehber kapatılabilmeli');
  D.s.rehber.kapali = false;

  /* --- üst şerit kaydırması yeniden çizimde korunmalı --- */
  {
    calistir('üst çiz', () => UI.ustCiz());
    const serit = w.document.querySelector('#ust .ustsatir.ikinci');
    if (serit) {
      serit.scrollLeft = 80;
      UI._ustDokunuyor = false;
      calistir('üst yeniden çiz', () => UI.ustCiz());
      const yeni = w.document.querySelector('#ust .ustsatir.ikinci');
      kontrol(yeni && yeni.scrollLeft === 80, 'şerit kaydırma konumu korunmalı: ' + (yeni ? yeni.scrollLeft : '-'));
      /* dokunurken yeniden çizilmemeli */
      UI._ustDokunuyor = true;
      const onceki = w.document.getElementById('ust').firstChild;
      calistir('dokunurken çiz', () => UI.ustCiz());
      kontrol(w.document.getElementById('ust').firstChild === onceki, 'dokunurken üst bar yeniden çizilmemeli');
      UI._ustDokunuyor = false;
    }
  }

  /* --- hayalet click: modal hemen kapanmamalı --- */
  calistir('modal aç', () => UI.modal('Deneme', '<div>içerik</div>'));
  kontrol(UI.modalAcik === true, 'modal açılmalı');
  calistir('hayalet click', () => UI.perdeTik({ target: { id: 'modal' } }));
  kontrol(UI.modalAcik === true, 'dokunuştan hemen sonraki click modalı kapatmamalı');
  UI._modalAcilis = Date.now() - 2000;
  calistir('gerçek perde tıklaması', () => UI.perdeTik({ target: { id: 'modal' } }));
  kontrol(UI.modalAcik === false, 'sonraki tıklama modalı kapatmalı');
  calistir('iç tıklama', () => { UI.modal('X', 'y'); UI._modalAcilis = Date.now() - 2000; UI.perdeTik({ target: { id: 'modalIc' } }); });
  kontrol(UI.modalAcik === true, 'modal içine tıklamak kapatmamalı');
  calistir('kapat', () => UI.modalKapat());

  /* --- marka / tabela --- */
  calistir('marka paneli', () => { UI.altSekmeGec('daha', 'marka'); UI.sekmeGec('daha'); });
  kontrol(w.document.getElementById('govde').innerHTML.indexOf('Marka adı') > 0, 'marka paneli çizilmeli');
  calistir('marka adı', () => UI.markaAdDegis('KAMİL PETROL'));
  kontrol(D.s.tabela.ad === 'KAMİL PETROL', 'marka adı kaydedilmeli');
  calistir('marka rengi', () => UI.markaAyar('renk', 'mavi'));
  kontrol(D.s.tabela.renk === 'mavi', 'renk değişmeli');
  calistir('marka şekli', () => UI.markaAyar('sekil', 'kule'));
  calistir('logo', () => UI.markaAyar('logo', '🦅'));
  calistir('kanopi', () => UI.markaAyar('kanopi', true));
  kontrol(IZO.tabelaStili().ad === 'KAMİL PETROL', 'izo tabela stilini okumalı');
  calistir('uzun ad kırpma', () => UI.markaAdDegis('ÇOKÇOKÇOKUZUNBIRMARKAADI'));
  kontrol(D.s.tabela.ad.length === 14, 'ad 14 karaktere kırpılmalı');
  calistir('ad geri', () => UI.markaAdDegis('KAMİL PETROL'));

  /* --- pazarlama programları --- */
  sbm = D.sube();
  D.s.seviye = 20; D.s.para = 90000000;
  calistir('sadakat aç', () => SIM.programAc(sbm, 'sadakat'));
  kontrol(sbm.program.sadakat === true, 'sadakat programı açılmalı');
  calistir('premium aç', () => SIM.programAc(sbm, 'premium'));
  kontrol(sbm.program.premium === true, 'katkılı yakıt açılmalı');
  calistir('program paneli', () => { UI.sekmeGec('fiyat'); });
  kontrol(w.document.getElementById('govde').innerHTML.indexOf('Pazarlama') > 0, 'program paneli çizilmeli');
  const paraP = D.s.para;
  calistir('program gideri', () => SIM.programlariIsle());
  kontrol(D.s.para !== paraP, 'program gider/gelir işlemeli');
  calistir('sadakat kapat', () => SIM.programAc(sbm, 'sadakat'));
  kontrol(sbm.program.sadakat === false, 'program kapatılabilmeli');

  /* --- ciro grafiği --- */
  calistir('grafik', () => UI.ciroGrafigi([{gun:1,ciro:100,gider:50},{gun:2,ciro:200,gider:90}]));
  kontrol(UI.ciroGrafigi([{gun:1,ciro:100,gider:50},{gun:2,ciro:200,gider:90}]).indexOf('<svg') > 0, 'grafik svg üretmeli');

  /* --- çevrimdışı kazanç --- */
  D.s.ist.gunluk = [{ gun: 1, ciro: 120000, gider: 40000 }, { gun: 2, ciro: 150000, gider: 50000 }];
  D.s.kapanis = Date.now() - 2 * 3600 * 1000;
  const cd = SIM.cevrimdisiHesapla();
  kontrol(cd && cd.kazanc > 0, 'çevrimdışı kazanç hesaplanmalı');
  const paraOnceCd = D.s.para;
  calistir('çevrimdışı modal', () => UI.cevrimdisiModal(cd));
  calistir('çevrimdışı al', () => UI.cevrimdisiAl());
  kontrol(D.s.para > paraOnceCd, 'çevrimdışı kazanç kasaya girmeli');
  D.s.kapanis = Date.now();
  kontrol(SIM.cevrimdisiHesapla() === null, 'kısa sürede çevrimdışı kazanç olmamalı');

  /* --- ayar anahtarları --- */
  calistir('ses anahtarı', () => { UI.sesDegis(); UI.sesDegis(); });
  calistir('lpg anahtarı', () => { UI.lpgGuvenlikDegis(); UI.lpgGuvenlikDegis(); });
}

console.log('UI TEST 10 — bildirimler ve konsol hataları');
calistir('bildir', () => { for (let i = 0; i < 8; i++) UI.bildir('Başlık ' + i, 'metin', 'iyi'); });
kontrol(w.document.getElementById('bildirimler').children.length <= 4, 'en fazla 4 bildirim durmalı');
kontrol(konsolHatalari.length === 0, 'yakalanmamış JS hatası olmamalı: ' + konsolHatalari.join(' | '));

console.log('');
if (hata === 0) console.log('✅ ARAYÜZ TESTLERİ GEÇTİ (11 başlık)');
else console.log('❌ ' + hata + ' ARAYÜZ HATASI');
process.exit(hata ? 1 : 0);
