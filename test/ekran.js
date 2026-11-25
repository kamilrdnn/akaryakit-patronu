/* Mağaza ekran görüntülerini gerçek oyundan üretir (Chromium + Playwright).
   Çıktı: magaza/ekran-1..6.png (1080x1920)
   Kullanım: node ekran.js */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const { uret } = require('./kayit.js');

const KOK = path.join(__dirname, '..');
const VARLIK = path.join(KOK, 'app', 'src', 'main', 'assets');
const CIKTI = path.join(KOK, 'magaza');
const EN = 540, BOY = 960;          /* ×2 piksel oranı = 1080x1920 */

const TIP = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json' };

function sunucu() {
  return new Promise(res => {
    const s = http.createServer((istek, yanit) => {
      let p = decodeURIComponent(istek.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const dosya = path.join(VARLIK, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
      if (!dosya.startsWith(VARLIK) || !fs.existsSync(dosya)) { yanit.writeHead(404); yanit.end('yok'); return; }
      yanit.writeHead(200, { 'Content-Type': TIP[path.extname(dosya)] || 'application/octet-stream' });
      yanit.end(fs.readFileSync(dosya));
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

const bekle = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(CIKTI)) fs.mkdirSync(CIKTI, { recursive: true });
  process.stdout.write('kayıt üretiliyor... ');
  const D = uret();
  D.s.saat = 13; D.s.dakika = 25;
  const kayit = JSON.stringify(D.s);
  console.log('tamam (gün ' + D.s.gun + ')');

  const sun = await sunucu();
  const kok = 'http://127.0.0.1:' + sun.address().port + '/';
  const tarayici = await chromium.launch();
  const baglam = await tarayici.newContext({ viewport: { width: EN, height: BOY }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const sayfa = await baglam.newPage();
  const hatalar = [];
  sayfa.on('pageerror', e => hatalar.push(String(e.message)));
  sayfa.on('console', m => { if (m.type() === 'error') hatalar.push(m.text()); });
  await sayfa.addInitScript(({ k, v }) => { try { localStorage.setItem(k, v); } catch (e) {} }, { k: 'akaryakit_kayit_v1', v: kayit });
  await sayfa.goto(kok, { waitUntil: 'load' });
  await sayfa.evaluate(() => OYUN.devamEt());
  await bekle(600);
  await sayfa.evaluate(() => { try { UI.modalKapat(); } catch (e) {} try { UI.rehberKapat(); } catch (e) {} });

  /* bildirim balonlarını temizle (ekran görüntüsünü kapatmasın) */
  const temizle = () => sayfa.evaluate(() => {
    var k = document.getElementById('bildirimler');
    if (k) while (k.firstChild) k.removeChild(k.firstChild);
  });

  /* kamerayı istasyona yakınlaştır ve ortala */
  const odakla = (yakinlik, dikey) => sayfa.evaluate(({ y, d }) => {
    IZO.kameraSifirla();
    var sb = D.sube(), m = IZO.izo((sb.w - 1) / 2, (sb.h + 1) / 2);
    var o = IZO.kam.holcek * y;
    IZO.kam.olcek = o;
    IZO.kam.x = IZO.kam.hx = IZO.en / 2 - m.x * o;
    IZO.kam.y = IZO.kam.hy = IZO.boy * d - m.y * o;
    IZO.kam.vx = IZO.kam.vy = 0;
  }, { y: yakinlik, d: dikey });

  const cek = async (ad, not) => {
    await temizle();
    await bekle(250);
    const hedef = path.join(CIKTI, ad);
    await sayfa.screenshot({ path: hedef, animations: 'disabled' });
    console.log('  ✓ ' + ad + (not ? ' — ' + not : ''));
  };

  /* --- 1: istasyon (gündüz, dolu sahne) --- */
  await sayfa.evaluate(() => { D.s.hiz = 5; });
  await bekle(20000);                              /* pompalar müşteriyle dolsun */
  await sayfa.evaluate(() => {
    D.s.hiz = 1; D.s.saat = 13; D.s.dakika = 40;
    var sb = D.sube(); sb.memnuniyet = 94; sb.temizlik = 96;
    UI.sekmeGec('istasyon');
  });
  await odakla(1.26, 0.47);
  await bekle(700);
  await cek('ekran-1.png', 'istasyon · gündüz');

  /* --- 2: servis ekranı (elle dolum) --- */
  const servisAcildi = await sayfa.evaluate(() => {
    var sb = D.sube();
    var m = sb.kuyruk.find(function (x) { return x.durum === 'pompada'; });
    if (!m) {
      var p = D.pompalar(sb)[0];
      if (!p) return false;
      m = sb.kuyruk[0];
      if (!m) return false;
      m.durum = 'pompada'; m.pompa = p.i;
    }
    SERVIS.ac(m.pompa);
    if (SERVIS.acik) { try { SERVIS.nozulSec(m.yakit); } catch (e) {} }
    return !!SERVIS.acik;
  });
  if (servisAcildi) {
    await sayfa.evaluate(() => { try { SERVIS.bas(true); } catch (e) {} });
    await bekle(1700);
    await sayfa.evaluate(() => { try { SERVIS.bas(false); } catch (e) {} });
    await cek('ekran-2.png', 'servis · elle dolum');
    await sayfa.evaluate(() => { try { SERVIS.kapat(); } catch (e) {} });
  } else { console.log('  ! servis ekranı açılamadı'); }

  /* --- 3: inşaat paneli --- */
  await sayfa.evaluate(() => { UI.sekmeGec('insa'); });
  await cek('ekran-3.png', 'inşaat');

  /* --- 4: muhasebe / ciro grafiği --- */
  await sayfa.evaluate(() => { UI.sekmeGec('daha'); UI.altSekmeGec('daha', 'muhasebe'); });
  await cek('ekran-4.png', 'muhasebe');

  /* --- 5: mini oyun (oto yıkama) --- */
  const miniAcildi = await sayfa.evaluate(() => {
    UI.sekmeGec('istasyon');
    var sb = D.sube();
    var m = sb.kuyruk[0] || { arac: { ad: 'Otomobil' }, renk: '#d64545', yakit: 'benzin' };
    try { MINI.yikamaBaslat(m, function () {}); } catch (e) { return String(e.message); }
    try { MINI.yikamaProgram(1); } catch (e) {}
    return true;
  });
  if (miniAcildi === true) { await bekle(900); await cek('ekran-5.png', 'mini oyun · oto yıkama'); await sayfa.evaluate(() => { try { MINI.kapat(); } catch (e) {} }); }
  else { console.log('  ! mini oyun açılamadı: ' + miniAcildi); }

  /* --- 6: gece --- */
  await sayfa.evaluate(() => {
    UI.sekmeGec('istasyon');
    D.s.saat = 21; D.s.dakika = 10; D.s.hiz = 5;
  });
  await bekle(6000);
  await sayfa.evaluate(() => {
    D.s.hiz = 1; D.s.saat = 21; D.s.dakika = 30;
    var sb = D.sube(); sb.memnuniyet = 92; sb.temizlik = 95;
    UI.ciz();
  });
  await odakla(1.26, 0.47);
  await bekle(700);
  await cek('ekran-6.png', 'istasyon · gece');

  /* --- 7: fiyat ekranı ve karşı istasyon --- */
  await sayfa.evaluate(() => {
    D.s.saat = 14; D.s.dakika = 5;
    var sb = D.sube(), r = SIM.rakipKur(sb);
    r.savas = 4; r.indirim = 0.07; r.kazanilanSavas = 2; r.olay = null;
    UI.sekmeGec('fiyat');
  });
  await cek('ekran-7.png', 'fiyat · karşı istasyon');

  await tarayici.close();
  sun.close();

  const gercek = hatalar.filter(h => !/favicon|update\.json|Failed to load resource/i.test(h));
  if (gercek.length) { console.log('✗ sayfa hataları:\n  ' + gercek.slice(0, 8).join('\n  ')); process.exit(1); }
  console.log('✅ ekran görüntüleri hazır (' + EN * 2 + 'x' + BOY * 2 + ')');
}

main().catch(e => { console.error(e); process.exit(1); });
