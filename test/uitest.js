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
  ['js/ekler.js', ['EK']],
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
calistir('açılış animasyonu', () => OYUN.intro());
kontrol(w.document.getElementById('intro').innerHTML.indexOf('kmYazi') > 0 && w.document.getElementById('intro').innerHTML.indexOf('PATRONU') > 0, 'açılış animasyonu yapımcı ve oyun logosunu içermeli');
calistir('animasyonu geç', () => w.document.getElementById('intro').onclick());
kontrol(w.document.getElementById('intro').className === 'kapaniyor', 'dokununca animasyon kapanmalı');
calistir('acilisCiz', () => OYUN.acilisCiz());
kontrol(w.document.getElementById('acilis').innerHTML.indexOf('olAmblem') > 0 && w.document.getElementById('acilis').innerHTML.indexOf('KAMİLRDNN') > 0, 'menüde oyun logosu ve yapımcı imzası olmalı');
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
SIM._dilimZorla = 1000;
SIM.etkinlikKur(1000, 0);                       /* ürün türü etkinlik */
const kmp = SIM.kampanya();
kontrol(!!kmp && !!kmp.tanim && kmp.tanim.hedef > 0 && kmp.tanim.tip === 'urun', 'etkinlik tanımı gelmeli');
/* market yokken ürün etkinliği ilerlememeli */
let once = D.s.kampanya.sayac;
for (let i = 0; i < 200; i++) SIM.kampanyaIlerlet(D.sube());
kontrol(D.s.kampanya.sayac === once, 'market yokken ürün etkinliği ilerlememeli');
/* market kurunca ilerlemeli */
D.s.para = 9000000; D.s.seviye = 20;
let bosHucre = -1;
for (let i = 0; i < D.sube().yapi.length; i++) if (D.sube().beton[i] && !D.sube().yapi[i]) { bosHucre = i; break; }
if (bosHucre < 0) { for (let i = 0; i < D.sube().beton.length; i++) if (!D.sube().beton[i]) { SIM.betonDok(D.sube(), i); bosHucre = i; break; } }
SIM.binaKur(D.sube(), bosHucre, 'market');
for (let i = 0; i < 400 && D.s.kampanya.sayac === 0; i++) SIM.kampanyaIlerlet(D.sube());
kontrol(D.s.kampanya.sayac > 0, 'marketli şubede ürün etkinliği ilerlemeli');
/* tamamlanınca kart kalkmalı, ödül gelmeli */
{ const p0 = D.s.para; for (let i = 0; i < 5000 && SIM.kampanya(); i++) SIM.kampanyaIlerlet(D.sube());
  kontrol(SIM.kampanya() === null, 'tamamlanan etkinlik kalkmalı');
  kontrol(D.s.para > p0, 'etkinlik ödülü verilmeli');
  kontrol(UI.kampanyaHtml().indexOf('kampanya') < 0, 'tamamlanınca kart görünmemeli'); }
/* dilim değişince yeni ve farklı etkinlik gelmeli */
{ const eski = D.s.kampanya.idx; SIM._dilimZorla = 1001; const y = SIM.kampanya();
  kontrol(!!y && y.sayac === 0 && D.s.kampanya.idx !== eski, '2 saat sonra yeni etkinlik gelmeli'); }
/* litre ve satış türleri marketsiz de ilerlemeli */
{ SIM.etkinlikKur(1001, 3); SIM.kampanyaIlerlet(D.sube(), null, 40, 2000); kontrol(D.s.kampanya.sayac === 40, 'litre etkinliği litreyle ilerlemeli');
  SIM.etkinlikKur(1001, 1); SIM.kampanyaIlerlet(D.sube(), null, 40, 2000); kontrol(D.s.kampanya.sayac === 1, 'satış etkinliği araçla ilerlemeli');
  SIM.etkinlikKur(1001, 5); SIM.kampanyaIlerlet(D.sube(), null, 40, 2000); kontrol(D.s.kampanya.sayac === 2000, 'ciro etkinliği ciroyla ilerlemeli'); }
{ SIM.etkinlikKur(1001, 5); D.s.kampanya.sayac = 1234; calistir('ciro etkinliği kartı', () => UI.kampanyaHtml()); calistir('ciro etkinliği bilgisi', () => UI.kampanyaBilgi()); UI.modalKapat(); calistir('başarım sekmesi', () => UI.sekmeGec('daha')); }
delete SIM._dilimZorla;

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
/* --- karşı istasyon kartı --- */
{
  const sbr = D.sube(), r = SIM.rakipKur(sbr);
  UI.sekmeGec('fiyat');
  let govde = w.document.getElementById('govde').innerHTML;
  kontrol(govde.indexOf(r.ad) >= 0, 'fiyat ekranında rakibin adı görünmeli');
  kontrol(govde.indexOf('payCubuk') >= 0, 'pazar payı çubuğu çizilmeli');
  /* savaş hâli */
  r.savas = 4; r.indirim = 0.08; r.olay = null;
  calistir('rakip savaş kartı', () => UI.sekmeGec('fiyat'));
  govde = w.document.getElementById('govde').innerHTML;
  kontrol(govde.indexOf('Fiyat savaşı sürüyor') >= 0, 'savaşta uyarı yazısı çıkmalı');
  /* olay hâli */
  r.savas = 0; r.indirim = 0; r.olay = { id: 'kuru', kalan: 2 };
  calistir('rakip olay kartı', () => UI.sekmeGec('fiyat'));
  govde = w.document.getElementById('govde').innerHTML;
  kontrol(govde.indexOf('Rakibin tankı boş') >= 0, 'rakip olayı kartta görünmeli');
  /* kazanılmış savaş sayacı */
  r.olay = null; r.kazanilanSavas = 2;
  calistir('rakip kazanç kartı', () => UI.sekmeGec('fiyat'));
  govde = w.document.getElementById('govde').innerHTML;
  kontrol(govde.indexOf('Kazandığın fiyat savaşı') >= 0, 'kazanılan savaş sayısı görünmeli');
  r.kazanilanSavas = 0;
  /* "rakibin %3 altına in" düğmesi gerçekten indirmeli */
  calistir('rakip altı düğmesi', () => UI.fiyatOtomatik(-0.03));
  kontrol(sbr.fiyat.dizel < sbr.rakip.dizel, 'düğme fiyatı rakibin altına çekmeli');
}
UI.sekmeGec('siparis');
const tankOnce = D.sube().tank.benzin.dolu;
calistir('siparis', () => UI.siparis('benzin', 1000));
kontrol(D.sube().siparis.length === 1, 'sipariş oluşmalı');
for (let i = 0; i < 300; i++) SIM.siparisIsle(D.sube(), 1);
kontrol(D.sube().tank.benzin.dolu > tankOnce, 'tank dolmalı');

/* --- tanker filosu ekranı --- */
{
  const sbt = D.sube();
  D.s.para = 20000000; D.s.seviye = 10;
  UI.tasiyici = null;
  calistir('tanker paneli', () => UI.sekmeGec('siparis'));
  let g = w.document.getElementById('govde').innerHTML;
  kontrol(g.indexOf('Tanker filon') >= 0, 'sipariş ekranında filo kartı olmalı');
  kontrol(g.indexOf('Tedarikçi tankeri') >= 0, 'taşıyıcı seçimi görünmeli');

  calistir('tanker al', () => UI.tankerAl('orta'));
  kontrol(D.s.tankerler.length === 1, 'düğmeyle tanker alınmalı');
  const tk = D.s.tankerler[0];
  g = w.document.getElementById('govde').innerHTML;
  kontrol(g.indexOf(tk.ad) >= 0, 'alınan tanker listede görünmeli');

  /* taşıyıcı seçimi ve siparişin tankere bağlanması */
  calistir('taşıyıcı seç', () => UI.tasiyiciSec(tk.id));
  kontrol(UI.tasiyici === tk.id, 'taşıyıcı seçilmeli');
  sbt.tank.dizel.dolu = 0;
  calistir('tankerle sipariş', () => UI.siparis('dizel', 2000));
  const sonSip = sbt.siparis[sbt.siparis.length - 1];
  kontrol(sonSip && sonSip.tanker === tk.id, 'sipariş seçilen tankere bağlanmalı');
  kontrol(tk.durum === 'yolda', 'tanker yola çıkmalı');

  /* yoldayken yeni sipariş uyarı vermeli, tedarikçiye düşmemeli */
  const sipSayi = sbt.siparis.length;
  calistir('yoldaki tankerle sipariş', () => UI.siparis('benzin', 500));
  kontrol(sbt.siparis.length === sipSayi, 'tanker yoldayken sipariş verilmemeli');

  /* teslimat sonrası serbest kalmalı */
  for (let i = 0; i < 400 && tk.durum === 'yolda'; i++) SIM.siparisIsle(sbt, 1);
  kontrol(tk.durum === 'bos', 'teslimat sonrası tanker boşa dönmeli');
  kontrol(UI.gecerliTasiyici(1000) === tk.id, 'boş tanker yeniden seçilebilir olmalı');
  kontrol(UI.gecerliTasiyici(999999) === null, 'kapasiteyi aşan yükte tedarikçiye düşmeli');

  /* bakım ve satış düğmeleri */
  tk.bakim = 40;
  calistir('tanker bakım', () => UI.tankerBakim(tk.id));
  kontrol(tk.bakim === 100, 'bakım düğmesi çalışmalı');
  calistir('tanker sat', () => UI.tankerSat(tk.id));
  kontrol(D.s.tankerler.length === 0, 'satış düğmesi çalışmalı');
  kontrol(UI.tasiyici === null, 'satılan tanker seçili kalmamalı');
  calistir('filo boş panel', () => UI.sekmeGec('siparis'));
}

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

console.log('UI TEST 9c — ek sistemler');
{
  const EK = w.EK;
  kontrol(!!EK && EK._kuruldu, 'ek sistemler kurulmalı');
  D.s.para = 5e8; D.s.seviye = 20; D.s.marka = 70;
  const sbe = D.sube();
  /* günlük giriş */
  const T0 = Date.UTC(2026, 10, 26, 9);
  D.s.ek = undefined;
  kontrol(!EK.girisDurumu(T0).alindi && EK.girisDurumu(T0).seri === 1, 'ilk gün serisi 1 olmalı');
  let p0 = D.s.para; kontrol(EK.girisAl(T0) > 0 && D.s.para > p0, 'giriş ödülü verilmeli');
  kontrol(EK.girisAl(T0 + 3600e3) === 0, 'aynı gün ikinci ödül olmamalı');
  kontrol(EK.girisDurumu(T0 + 86400e3).seri === 2, 'ertesi gün seri 2 olmalı');
  kontrol(EK.girisDurumu(T0 + 3 * 86400e3).seri === 1, 'gün atlanınca seri sıfırlanmalı');
  D.s.ek.giris.gun = '';
  calistir('giriş penceresi', () => EK.girisGoster()); calistir('giriş al', () => EK.girisTikla());
  /* Ar-Ge */
  kontrol(!EK.argeAl('vip'), 'ön koşulsuz Ar-Ge alınmamalı');
  const kira0 = SIM.kiraGunluk(sbe), ms0 = SIM.saatlikMusteri(sbe);
  EK.arge.forEach(a => { if (!a.on) EK.argeAl(a.id); }); EK.arge.forEach(a => EK.argeAl(a.id));
  kontrol(EK.arge.every(a => EK.argeVar(a.id)), 'bütün Ar-Ge alınabilmeli');
  kontrol(SIM.kiraGunluk(sbe) < kira0, 'kira Ar-Ge ile düşmeli');
  kontrol(!ms0 || SIM.saatlikMusteri(sbe) > ms0, 'pazarlama müşteriyi artırmalı');
  calistir('Ar-Ge sayfası', () => UI.altSekmeGec('daha', 'arge'));
  /* personel gelişimi */
  sbe.personel = []; const pp = SIM.adayUret('temizlik'); sbe.personel.push(pp);
  const bec0 = pp.beceri; for (let g = 0; g < 8; g++) EK.personelGun();
  kontrol(pp.kidem >= 2 && pp.beceri >= bec0, 'personel kıdem kazanmalı');
  D.s.ek.zam = { pid: pp.id, sube: D.s.aktif, oran: 0.1, gun: D.s.gun }; const m0 = pp.maas;
  calistir('personel sayfası (zam kartı)', () => UI.sekmeGec('personel'));
  kontrol(w.document.getElementById('govde').innerHTML.indexOf('Zam isteği') > 0, 'zam isteği kartı görünmeli');
  EK.zamYanit(true); kontrol(pp.maas > m0 && !D.s.ek.zam, 'zam kabul edilince maaş artmalı');
  pp.moral = 40; kontrol(EK.primVer(pp.id) && pp.moral > 40, 'prim morali yükseltmeli');
  pp.moral = 2; let gitti = false; for (let g = 0; g < 60 && !gitti; g++) { if (sbe.personel.indexOf(pp) < 0) gitti = true; else { pp.moral = 2; EK.personelGun(); } }
  kontrol(gitti, 'morali dibe vuran personel istifa etmeli');
  /* bayilik */
  kontrol(EK.bayiVer() && D.s.ek.bayi === 1 && EK.bayiGunluk() > 0, 'bayilik verilebilmeli');
  calistir('bayilik sayfası', () => UI.altSekmeGec('daha', 'bayi'));
  /* rakip */
  kontrol(EK.rakipAl(sbe) && SIM.rakipCekim(sbe) === 1.22 && SIM.rakipIndirim(sbe) === 0, 'rakip satın alınabilmeli');
  calistir('fiyat sayfası (rakip kartı)', () => UI.sekmeGec('fiyat'));
  /* vergi */
  D.s.ek.vergi.sonKar = D.s.ist.kar - 100000; p0 = D.s.para;
  kontrol(EK.vergiKes() === 10000 && D.s.para === p0 - 10000, 'vergi dönem kârının %10\'u olmalı');
  calistir('muhasebe (vergi kartı)', () => { UI.sekmeGec('daha'); UI.altSekmeGec('daha', 'muhasebe'); });
  /* olaylar */
  D.s.olaylar = []; kontrol(EK.olayBaslat('bayram') && SIM.olayVar('bayram') && EK.olayKat() > 1, 'bayram olayı başlamalı');
  calistir('olaylı üst şerit', () => { UI.sekmeGec('istasyon'); UI.ciz(); });
  D.s.olaylar = [];
  sbe.tank.benzin.dolu = 5000; for (let i = 0; i < sbe.yapi.length; i++) if (sbe.yapi[i] && sbe.yapi[i].t === 'kamera') sbe.yapi[i] = null;
  { const tp = sbe.tank.benzin.dolu + sbe.tank.dizel.dolu + sbe.tank.lpg.dolu; kontrol(EK.hirsizlik(sbe) > 0 && sbe.tank.benzin.dolu + sbe.tank.dizel.dolu + sbe.tank.lpg.dolu < tp, 'kamerasız istasyonda yakıt çalınmalı'); }
  /* VIP */
  EK._vipSirada = true; let vm2 = null; for (let i = 0; i < 80 && !(vm2 && vm2.vip); i++) { EK._vipSirada = true; vm2 = SIM.musteriYap(sbe); }
  kontrol(vm2 && vm2.vip, 'VIP müşteri üretilmeli');
  /* piyasa */
  for (let i = 0; i < 6; i++) EK.piyasaKaydet();
  calistir('sipariş (piyasa kartı)', () => UI.sekmeGec('siparis'));
  kontrol(w.document.getElementById('govde').innerHTML.indexOf('Toptan piyasa') > 0, 'piyasa kartı görünmeli');
  /* yeni tesisler */
  ['motel', 'oyunparki', 'cicek', 'bayrak'].forEach(t => {
    kontrol(!!VERI.binalar[t] && VERI.binaSira.indexOf(t) >= 0, t + ' tesis listesinde olmalı');
    const yer = SIM.yerAc(sbe, 'bina');
    kontrol(yer >= 0 && SIM.binaKur(sbe, yer, t), t + ' kurulabilmeli');
  });
  calistir('yeni tesislerle sahne', () => { UI.sekmeGec('istasyon'); IZO.ciz(); });
  /* vardiya */
  { sbe.personel = []; const g1 = SIM.adayUret('pompaci'), g2 = SIM.adayUret('pompaci'), ks = SIM.adayUret('kasiyer'); sbe.personel.push(g1, g2, ks);
    kontrol(EK.vardiyaDegis(g1.id, 'gunduz') && EK.vardiyaDegis(g2.id, 'gece'), 'vardiya atanabilmeli');
    kontrol(!EK.vardiyaDegis(ks.id, 'gece'), 'kasiyere vardiya atanmamalı');
    D.s.saat = 12; kontrol(EK.gorevde(g1) && !EK.gorevde(g2) && EK.gorevdekiler(sbe).length === 2, 'gündüz yalnız gündüzcü çalışmalı');
    D.s.saat = 23; kontrol(!EK.gorevde(g1) && EK.gorevde(g2), 'gece yalnız gececi çalışmalı');
    kontrol(EK.vardiyaTasarrufu() > 0, 'vardiya maaş tasarrufu sağlamalı');
    calistir('personel sayfası (vardiya kartı)', () => UI.sekmeGec('personel'));
    kontrol(w.document.getElementById('govde').innerHTML.indexOf('vardiyaSec') > 0, 'vardiya düğmeleri personel ekranında olmalı');
    calistir('vardiya seç', () => EK.vardiyaTikla(g1.id, 'gece')); kontrol(EK.vardiya(g1) === 'gece', 'düğmeyle vardiya değişmeli');
    EK.vardiyaDegis(g1.id, 'gunduz');
    { const pk0 = D.pompalar(sbe)[0].i; g1.pompa = pk0; g2.pompa = null; g1.vardiya = 'tam'; g2.vardiya = 'tam';
      calistir('otomatik dağıt', () => EK.vardiyaOtoTikla());
      kontrol(g1.pompa === pk0 && g2.pompa === pk0 && g1.vardiya === 'gunduz' && g2.vardiya === 'gece', 'otomatik dağıtım pompayı iki vardiyaya bölmeli'); }
    calistir('vardiya düğmesi', () => EK.vardiyaSirala(g1.id));
    calistir('oto servis (vardiyalı)', () => SIM.otoServis(sbe, 1));
    kontrol(sbe.personel.length === 3, 'hesap sonrası personel listesi eksilmemeli');
    D.s.saat = 13; }
  /* aynı pompada iki vardiya */
  { const pk = D.pompalar(sbe)[0].i; sbe.personel = []; const a1 = SIM.adayUret('pompaci'), a2 = SIM.adayUret('pompaci'), a3 = SIM.adayUret('pompaci'); sbe.personel.push(a1, a2, a3);
    kontrol(SIM.personelSiniri(sbe, 'pompaci') === D.pompalar(sbe).length * 2, 'pompacı sınırı pompa başına 2 olmalı');
    EK.pompayaEkle(sbe, a1.id, pk); EK.pompayaEkle(sbe, a2.id, pk);
    kontrol(a1.pompa === pk && a2.pompa === pk && !EK.vardiyaCakisir(a1, a2), 'aynı pompada gündüz ve gece pompacısı durabilmeli');
    calistir('pompa kartı (iki vardiya)', () => UI.yapiModal(pk));
    kontrol(w.document.getElementById('modalIc').innerHTML.indexOf('2/2 vardiya') > 0, 'pompa kartı iki vardiyayı göstermeli');
    UI.modalKapat();
    D.s.saat = 12; kontrol(EK.gorevdekiler(sbe).filter(p => p.pompa === pk).length === 1, 'aynı anda yalnız biri görevde olmalı');
    EK.vardiyaDegis(a2.id, 'tam'); kontrol(a1.pompa === null && a2.pompa === pk, 'vardiya çakışınca diğeri pompadan alınmalı');
    D.s.saat = 13; }
  /* yapılarım listesinden yükseltme */
  { D.s.para = 5e8; const pk = D.pompalar(sbe)[0]; pk.p.sv = 1; const p0 = D.s.para, bd = SIM.yukseltmeBedeli(pk.p);
    calistir('listeden yükselt', () => UI.yukseltListe(pk.i));
    kontrol(pk.p.sv === 2 && D.s.para === p0 - bd, 'listeden yükseltme çalışmalı ve yazan bedeli kesmeli');
    kontrol(UI.yapilarHtml(sbe).indexOf('yukseltListe') > 0, 'yapılarım listesinde yükselt düğmesi olmalı');
    const bn = D.binalar(sbe).find(x => VERI.binalar[x.b.t].sv > x.b.sv);
    if (bn) { const p1 = D.s.para, b1 = SIM.yukseltmeBedeli(bn.b); SIM.yukselt(sbe, bn.i); kontrol(D.s.para === p1 - b1, 'bina yükseltme bedeli ekrandakiyle aynı olmalı'); } }
  /* arsa: büyük adım ve tıklım tıklım arsada düzenleme */
  { D.s.para = 5e9; const sbz = D.sube(); const a0 = sbz.w * sbz.h, ad = SIM.arsaAdim(sbz), lk = D.lok(sbz);
    if (sbz.w < lk.w || sbz.h < lk.h) { kontrol(ad.kazanc >= 12 || (ad.w === lk.w && ad.h === lk.h), 'arsa adımı en az 12 hücre vermeli: ' + ad.kazanc);
      kontrol(SIM.arsaGenislet(sbz) && sbz.w * sbz.h === a0 + ad.kazanc, 'arsa yazan kadar büyümeli'); }
    for (let g = 0; g < 20; g++) SIM.arsaGenislet(sbz);
    kontrol(sbz.w === lk.w && sbz.h === lk.h && lk.w >= 10, 'arsa lokasyon sınırına kadar büyüyebilmeli: ' + sbz.w + 'x' + sbz.h);
    const yedekY = sbz.yapi.slice(), yedekB = sbz.beton.slice();
    for (let i = 0; i < sbz.yapi.length; i++) { sbz.beton[i] = true; if (!sbz.yapi[i]) sbz.yapi[i] = { t: 'cicek', sv: 1, bakim: 100 }; }
    const say0 = sbz.yapi.filter(Boolean).length;
    kontrol(SIM.duzenlemeOnizle(sbz).length === say0, 'dolu arsada da bütün yapılar plana girmeli');
    kontrol(SIM.istasyonDuzenle(sbz) && sbz.yapi.filter(Boolean).length === say0, 'dolu arsada düzenleme hata vermemeli');
    for (let i = 0; i < sbz.yapi.length; i++) if (sbz.yapi[i] && sbz.yapi[i].t === 'cicek' && !yedekY.includes(sbz.yapi[i])) sbz.yapi[i] = null;
    calistir('büyük arsada sahne', () => { UI.sekmeGec('istasyon'); IZO._sahneAnahtar = null; IZO.guncelle(0.016); IZO.ciz(); }); }
  /* jeneratör: yapılarım listesinden doldurma */
  { D.s.para = 5e8; let jy = D.binalar(sbe, 'jenerator')[0];
    if (!jy) { const yer = SIM.yerAc(sbe, 'bina'); SIM.binaKur(sbe, yer, 'jenerator'); jy = D.binalar(sbe, 'jenerator')[0]; }
    kontrol(!!jy, 'jeneratör kurulabilmeli');
    if (jy) { jy.b.depo = 0; sbe.tank.dizel.dolu = 5000;
      kontrol(UI.yapilarHtml(sbe).indexOf('jeneratorDoldurListe') > 0 && UI.yapilarHtml(sbe).indexOf('jeneratorHepsiniDoldur') > 0, 'yapılarım listesinde doldur düğmeleri olmalı');
      calistir('listeden jeneratör doldur', () => UI.jeneratorHepsiniDoldur());
      kontrol(jy.b.depo > 0 && sbe.tank.dizel.dolu < 5000, 'jeneratör listeden doldurulmalı'); } }
  /* pompa sınırı arsayla büyür */
  { const lk = D.lok(sbe); const eskiW = sbe.w, eskiH = sbe.h;
    kontrol(SIM.pompaSiniri(sbe) >= lk.maxPompa, 'pompa sınırı taban sınırın altına inmemeli');
    kontrol(sbe.w * sbe.h <= SIM.POMPA_TABAN_ALAN[lk.id] || SIM.pompaSiniri(sbe) > lk.maxPompa, 'büyük arsada pompa sınırı artmalı: ' + SIM.pompaSiniri(sbe)); }
  /* sözleşme ve toplu anlaşma: fesih, şubeye alma, başka şubede yürütme */
  { D.s.para = 5e8;
    D.s.sozlesmeler = [{ id: 'sz1', ad: 'Deneme Sözleşme', emoji: '🚌', yakit: 'dizel', gun: 10, kalanGun: 6, gunlukL: 500, fiyat: 50, prim: 100000, ceza: 80000, basarili: 0, kacirilan: 0, sube: D.s.aktif }];
    D.s.filolar = [{ id: 'fl1', tanim: 'x', ad: 'Deneme Filo', emoji: '🚛', arac: 'Tır', yakit: 'dizel', aracSayi: 2, aracL: 200, saatler: [9], iskonto: 0.05, gun: 10, kalanGun: 10, gunlukL: 400, prim: 90000, ceza: 60000, sube: D.s.aktif, bugunTeslim: 0, toplamTeslim: 0, kacirilan: 0, sonSaat: -1 }];
    calistir('sözleşme sayfası (yönetim kartı)', () => { UI.sekmeGec('daha'); UI.altSekmeGec('daha', 'sozlesme'); });
    kontrol(w.document.getElementById('govde').innerHTML.indexOf('Feshet') > 0, 'sözleşmede feshet düğmesi olmalı');
    calistir('toplu anlaşma sayfası (yönetim kartı)', () => UI.altSekmeGec('daha', 'filo'));
    kontrol(w.document.getElementById('govde').innerHTML.indexOf('Feshet') > 0, 'toplu anlaşmada feshet düğmesi olmalı');
    calistir('fesih penceresi', () => EK.fesihSor('filo', 'fl1')); UI.modalKapat();
    const bd = EK.fesihBedeli(D.s.sozlesmeler[0]), p0 = D.s.para;
    kontrol(bd > 0 && EK.fesih('sozlesme', 'sz1') && D.s.sozlesmeler.length === 0 && D.s.para === p0 - bd, 'sözleşme bedeli ödenerek feshedilmeli');
    /* başka şubedeki filo: ceza yazmamalı */
    D.s.filolar[0].sube = D.s.aktif + 1;
    D.s.subeler.push(D.yeniSube('cevreyolu', false)); D.s.subeler[D.s.subeler.length - 1].personel = [{ id: 'm1', tip: 'mudur', ad: 'M', beceri: 90, maas: 40000, pompa: null }];
    D.s.filolar[0].sube = D.s.subeler.length - 1;
    const kac0 = D.s.filolar[0].kacirilan; calistir('gün sonu (başka şubede filo)', () => SIM.gunSonu());
    kontrol(D.s.filolar[0] && D.s.filolar[0].kacirilan === kac0, 'müdürlü şubedeki anlaşma ceza yazmamalı');
    kontrol(EK.subeyeAl('filo', 'fl1') && D.s.filolar[0].sube === D.s.aktif, 'anlaşma bulunduğun şubeye alınabilmeli');
    kontrol(EK.fesih('filo', 'fl1') && D.s.filolar.length === 0, 'toplu anlaşma feshedilebilmeli');
    D.s.subeler.pop(); }
  /* şarj ünitesi sınırı pompadan ayrı */
  { D.s.para = 5e9; D.s.seviye = 20; for (let i = 0; i < sbe.beton.length; i++) sbe.beton[i] = true;
    let kurulan = 0; for (let g = 0; g < 60; g++) { const yer = SIM.yerAc(sbe, 'pompa'); if (yer < 0 || !SIM.pompaKur(sbe, yer, 'benzin')) break; kurulan++; }
    kontrol(SIM.yakitPompaSayisi(sbe) === SIM.pompaSiniri(sbe) || SIM.yerAc(sbe, 'pompa') < 0, 'yakıt pompaları kendi sınırına kadar kurulmalı');
    const sj0 = SIM.sarjSayisi(sbe), yer2 = SIM.yerAc(sbe, 'pompa');
    if (yer2 >= 0 && sj0 < SIM.sarjSiniri(sbe)) kontrol(SIM.pompaKur(sbe, yer2, 'ev') && SIM.sarjSayisi(sbe) === sj0 + 1, 'pompa sınırı doluyken şarj ünitesi kurulabilmeli');
    D.s.seviye = 2; const az = SIM.sarjSiniri(sbe); D.s.seviye = 20; kontrol(SIM.sarjSiniri(sbe) > az, 'şarj sınırı seviyeyle artmalı');
    calistir('inşaat sayfası (iki sınır)', () => UI.sekmeGec('insa')); }
  /* VIP önceliği */
  { sbe.kuyruk = []; const po = D.pompalar(sbe).filter(q => q.p.yakit !== 'ev'); po.forEach(q => { q.p.mesgul = null; q.p.arizali = false; });
    sbe.tank.benzin.dolu = 9000;
    po.forEach((q, n) => { const m = { id: 'n' + n, arac: 'Otomobil', emoji: '🚗', yakit: 'benzin', hedef: 40, tip: 'litre', etiket: '40 L', bahsis: 1, sabir: 60, sabirKalan: 60, pompa: q.i, verilen: 10 + n, durum: 'pompada' }; q.p.mesgul = m.id; sbe.kuyruk.push(m); });
    const bekleyen = { id: 'b1', arac: 'Otomobil', emoji: '🚗', yakit: 'benzin', hedef: 30, tip: 'litre', etiket: '30 L', bahsis: 1, sabir: 60, sabirKalan: 60, pompa: null, verilen: 0, durum: 'bekliyor' };
    const vipm = { id: 'v1', arac: 'Lüks Araç', emoji: '🚘', yakit: 'benzin', hedef: 50, tip: 'litre', etiket: '50 L', bahsis: 3, sabir: 40, sabirKalan: 40, pompa: null, verilen: 0, durum: 'bekliyor', vip: true };
    sbe.kuyruk.push(bekleyen, vipm);
    calistir('VIP ataması', () => SIM.atama(sbe));
    kontrol(vipm.pompa !== null && vipm.durum === 'pompada', 'VIP için pompa boşaltılıp ona verilmeli');
    kontrol(bekleyen.pompa === null, 'sıradaki normal müşteri VIP\'in önüne geçmemeli');
    sbe.kuyruk = []; po.forEach(q => { q.p.mesgul = null; }); }
  /* yolun karşısındaki arsa */
  { D.s.para = 5e9; D.s.seviye = 20; const n0 = D.s.subeler.length, lk = sbe.lok;
    calistir('şubeler sayfası (karşı yaka kartı)', () => UI.sekmeGec('subeler'));
    kontrol(w.document.getElementById('govde').innerHTML.indexOf('Yolun karşısı') > 0, 'karşı yaka kartı görünmeli');
    kontrol(EK.karsiAc(lk) && D.s.subeler.length === n0 + 1 && EK.karsiVar(lk), 'karşı arsa alınıp şube açılabilmeli');
    kontrol(!EK.karsiAc(lk), 'aynı lokasyonda ikinci karşı şube açılmamalı');
    const ks = D.s.subeler[D.s.subeler.length - 1];
    kontrol(D.lok(ks).ad.indexOf('Karşı Yaka') > 0 && D.lok(sbe).ad.indexOf('Karşı Yaka') < 0, 'karşı şubenin adı ayrı görünmeli');
    kontrol(SIM.rakipCekim(ks) === 1.05 && SIM.rakipIndirim(ks) === 0, 'karşı şubede rakip olmamalı');
    const a0 = ks.w * ks.h; kontrol(SIM.arsaGenislet(ks) && ks.w * ks.h > a0, 'karşı şubenin arsası büyüyebilmeli');
    const eski = D.s.aktif;
    /* aynı ekranda karşı yaka */
    kontrol(EK.karsiEsi(sbe) && EK.karsiEsi(sbe).sb === ks && EK.karsiEsi(ks).sb === sbe, 'iki yaka birbirini bulmalı');
    calistir('karşı yakalı sahne', () => { UI.sekmeGec('istasyon'); IZO._sahneAnahtar = null; IZO.guncelle(0.016); IZO.ciz(); IZO.ciz(); });
    kontrol(IZO.vurus.some(v => v.i === -1000), 'karşı yaka sahnede çizilmeli ve dokunulabilmeli');
    calistir('karşı yakaya dokun', () => UI.hucreTik(-1000));
    kontrol(w.document.getElementById('modalIc').innerHTML.indexOf('şubesine geç') > 0, 'karşı yakaya dokununca geçiş penceresi açılmalı');
    UI.modalKapat();
    calistir('karşı şubeye geç', () => UI.subeGec(D.s.subeler.length - 1));
    calistir('karşı şubede sahne', () => { UI.sekmeGec('istasyon'); IZO.guncelle(0.016); IZO.ciz(); });
    calistir('karşı şubede fiyat', () => UI.sekmeGec('fiyat'));
    calistir('karşı şubede gün sonu', () => SIM.gunSonu());
    calistir('geri dön', () => UI.subeGec(eski));
    D.s.subeler.pop(); D.s.aktif = eski; }
  /* bakım sekmesi */
  { D.s.para = 5e8; const ys = sbe.yapi.filter(Boolean); ys[0].arizali = true; ys[0].bakim = 20; ys[1].bakim = 50; sbe.temizlik = 30;
    calistir('bakım sekmesi', () => { UI.sekmeGec('insa'); UI.altSekmeGec('insa', 'bakim'); });
    const gv = w.document.getElementById('govde').innerHTML;
    kontrol(gv.indexOf('Bakım ve tamir') > 0 && gv.indexOf('Arızaları onar') > 0 && gv.indexOf('Temizlet') > 0, 'bakım sekmesi arıza, toplu bakım ve temizliği göstermeli');
    kontrol(EK.bakimRozet(sbe) >= 1, 'bakım sekmesi rozeti arızayı saymalı');
    calistir('arızaları onar', () => EK.bakimTikla(0, true)); kontrol(!ys[0].arizali && ys[1].bakim === 50, 'yalnız arızalılar onarılmalı');
    calistir('%60 altını yap', () => EK.bakimTikla(60, false)); kontrol(ys[1].bakim === 100, 'eşiğin altındakiler bakımdan geçmeli');
    calistir('temizlet', () => EK.temizlikTikla()); kontrol(sbe.temizlik === 100, 'bakım sekmesinden temizlik yapılmalı');
    UI.altSekmeGec('insa', 'istasyon'); }
  /* genel müdür */
  { D.s.ek.gm = null; D.s.para = 5e8; D.s.seviye = 20;
    calistir('genel müdür sayfası (adaylar)', () => { UI.sekmeGec('daha'); UI.altSekmeGec('daha', 'gm'); });
    kontrol(EK.gmIseAl({ ad: 'Deneme Müdür', beceri: 90, maas: 180000 }) && !!EK.gm(), 'genel müdür işe alınabilmeli');
    sbe.personel = []; sbe.temizlik = 20; sbe.sikayetler = [];
    const pmp = D.pompalar(sbe); pmp[0].p.arizali = true; pmp[0].p.bakim = 20;
    SIM.sikayet(sbe, 'bekleme', null); SIM.sikayet(sbe, 'kirli', null); SIM.sikayet(sbe, 'wcYok', null);
    sbe.tank.benzin.dolu = 10; sbe.siparis = [];
    for (let t = 0; t < 12; t++) EK.gmSaat();
    kontrol(!pmp[0].p.arizali, 'genel müdür arızayı tamir ettirmeli');
    kontrol(sbe.temizlik === 100, 'genel müdür istasyonu temizletmeli');
    kontrol(pmp.every(q => sbe.personel.some(p => p.pompa === q.i)), 'genel müdür boş pompalara pompacı almalı');
    kontrol(sbe.sikayetler.every(x => x.okundu), 'genel müdür şikâyetleri incelemeli');
    kontrol(sbe.siparis.some(x => x.yakit === 'benzin'), 'genel müdür biten yakıtı sipariş etmeli');
    const bostaki = SIM.adayUret('pompaci'); sbe.personel.push(bostaki); EK.gmSaat();
    kontrol(bostaki.pompa !== null, 'genel müdür boştaki pompacıyı görevlendirmeli');
    const pg = D.s.para; EK.gm().rezerv = 1e12; sbe.temizlik = 10; EK.gmSaat();
    kontrol(sbe.temizlik === 10 && D.s.para === pg, 'rezervin altına inecekse harcama yapmamalı');
    EK.gm().rezerv = 500000;
    /* jeneratör yakıtı */
    { let jy = D.binalar(sbe, 'jenerator')[0]; if (!jy) { const yer = SIM.yerAc(sbe, 'bina'); SIM.binaKur(sbe, yer, 'jenerator'); jy = D.binalar(sbe, 'jenerator')[0]; }
      if (jy) { jy.b.depo = 0; jy.b.calismiyor = true; sbe.tank.dizel.dolu = 6000; EK.gmSaat();
        kontrol(jy.b.depo > 0 && !jy.b.calismiyor && sbe.tank.dizel.dolu < 6000, 'genel müdür jeneratörü doldurmalı'); } }
    /* taşma: eğitim ve otomatik kesme */
    { const zayif = sbe.personel.filter(p => p.tip === 'pompaci').sort((a, b) => a.beceri - b.beceri)[0]; zayif.beceri = 40; sbe.otoKesme = false; sbe._tasmaSay = 0;
      for (let q = 0; q < 6; q++) SIM.sikayet(sbe, 'tasma', null);
      EK.gmSaat();
      kontrol(zayif.beceri > 40, 'genel müdür taşıran pompacıyı eğitmeli');
      kontrol(sbe.otoKesme === true, 'taşma sürünce otomatik kesmeli tabanca taktırmalı');
      kontrol(EK.gm().rapor.some(r => r.metin.indexOf('eğitime') > 0), 'eğitim rapora yazılmalı'); }
    /* market */
    { if (!SIM.marketVar(sbe)) { const yer = SIM.yerAc(sbe, 'bina'); SIM.binaKur(sbe, yer, 'market'); }
      for (const k in sbe.market.stok) sbe.market.stok[k] = 0;
      kontrol(EK.gmMarket(sbe) > 0 && SIM.marketDoluluk(sbe) > 0, 'genel müdür market raflarını doldurmalı');
      for (const k in sbe.market.stok) sbe.market.stok[k] = 0; const pm = D.s.para; EK.gm().rezerv = 1e12; EK.gmMarket(sbe);
      kontrol(D.s.para === pm, 'market alımı rezervi delmemeli'); EK.gm().rezerv = 500000; }
    calistir('geri bildirim (taşma kartı)', () => { UI.sekmeGec('daha'); UI.altSekmeGec('daha', 'sikayet'); });
    kontrol(w.document.getElementById('govde').innerHTML.indexOf('Taşma önlemi') > 0, 'taşma önlemi kartı görünmeli');
    calistir('genel müdür gün sonu', () => EK.gmGun());
    kontrol(SIM.personelSayisi(sbe, 'temizlik') >= 1, 'genel müdür eksik temizlikçiyi almalı');
    kontrol(EK.gm().rapor.length > 3, 'genel müdür rapor tutmalı');
    calistir('genel müdür sayfası', () => UI.altSekmeGec('daha', 'gm'));
    kontrol(w.document.getElementById('govde').innerHTML.indexOf('Yetkiler') > 0, 'genel müdür sayfası yetkileri göstermeli');
    calistir('yetki kapat', () => EK.gmAyarTikla('alim')); kontrol(EK.gm().ayar.alim === false, 'yetki kapatılabilmeli');
    calistir('rezerv', () => EK.gmRezervTikla());
    calistir('çıkar penceresi', () => EK.gmCikarTikla()); UI.modalKapat();
    kontrol(EK.gmCikar() && !EK.gm(), 'genel müdür işten çıkarılabilmeli'); }
  /* bölge kapışması */
  { D.s.ek.bolge = undefined; const bg = EK.bolge();
    kontrol(bg.liste.length === 8 && bg.liste.every(b => Math.abs(b.sen + b.r[0] + b.r[1] + b.r[2] - 100) < 0.5), 'bölge payları 100 etmeli');
    let tur = 0; while (!EK.bolgeSenin(bg.liste[1]) && tur++ < 20) { bg.liste[1].bekle = 0; EK.bolgeReklam(1, true); }
    kontrol(EK.bolgeSenin(bg.liste[1]) && EK.bolgeSayisi() >= 1 && EK.bolgeGunluk() > 0 && EK.bolgeCarpan() > 1, 'kampanyayla bölge alınabilmeli');
    bg.liste[2].bekle = 3; kontrol(!EK.bolgeReklam(2, false), 'bekleme süresinde kampanya yapılamamalı');
    for (let g = 0; g < 40; g++) EK.bolgeGun();
    kontrol(bg.liste.every(b => b.sen >= 0 && b.sen <= 100 && Math.abs(b.sen + b.r[0] + b.r[1] + b.r[2] - 100) < 0.5), '40 gün sonra paylar tutarlı kalmalı');
    calistir('bölge sayfası', () => { UI.sekmeGec('daha'); UI.altSekmeGec('daha', 'bolge'); });
    kontrol(w.document.getElementById('govde').innerHTML.indexOf('bolgeHarita') > 0, 'bölge haritası görünmeli'); }
  /* yeni tesisler 2 */
  ['kuafor', 'sarjpark'].forEach(t => {
    const yer = SIM.yerAc(sbe, 'bina');
    kontrol(!!VERI.binalar[t] && yer >= 0 && SIM.binaKur(sbe, yer, t), t + ' kurulabilmeli');
  });
  kontrol(SIM.ekTesisGeliri(sbe, { arac: 'Elektrikli', bahsis: 1 }) > 0, 'şarj parkı elektrikli araçtan gelir getirmeli');
  calistir('yeni tesislerle sahne 2', () => { UI.sekmeGec('istasyon'); IZO.ciz(); });
  /* gün sonu bütün ekleriyle çalışmalı */
  calistir('gün sonu', () => SIM.gunSonu());
  /* fotoğraf modu */
  calistir('fotoğraf modu', () => { EK.foto(true); });
  kontrol(w.document.body.classList.contains('foto'), 'fotoğraf modu açılmalı');
  EK.foto(false); kontrol(!w.document.body.classList.contains('foto'), 'fotoğraf modu kapanmalı');
  UI.sekmeGec('istasyon');
}

console.log('UI TEST 10 — bildirimler ve konsol hataları');
calistir('bildir', () => { for (let i = 0; i < 8; i++) UI.bildir('Başlık ' + i, 'metin', 'iyi'); });
kontrol(w.document.getElementById('bildirimler').children.length <= 4, 'en fazla 4 bildirim durmalı');
kontrol(konsolHatalari.length === 0, 'yakalanmamış JS hatası olmamalı: ' + konsolHatalari.join(' | '));

console.log('');
if (hata === 0) console.log('✅ ARAYÜZ TESTLERİ GEÇTİ (11 başlık)');
else console.log('❌ ' + hata + ' ARAYÜZ HATASI');
process.exit(hata ? 1 : 0);
