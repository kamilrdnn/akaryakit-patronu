/* Akaryakıt Patronu — ek sistemler
   Günlük giriş ödülü · personel gelişimi · Ar-Ge · yeni olaylar · VIP müşteri
   yeni tesisler ve süsler · fotoğraf modu · bayilik · rakibi satın alma · vergi · piyasa takibi
   Çekirdeğe (sim.js / arayuz.js) sarmalayarak bağlanır. */
'use strict';

var EK = (function () {
  var E = {};

  /* ---------------------------------------------------------
     VERİ
     --------------------------------------------------------- */
  E.girisOdulleri = [8000, 12000, 18000, 25000, 35000, 50000, 90000];      /* 7 günlük döngü, seviyeyle büyür */

  E.arge = [
    { id: 'pazarlama', ad: 'Bölgesel Reklam',       emoji: '📣', fiyat: 400000,  sv: 3, etki: 'Müşteri +%6' },
    { id: 'sabir',     ad: 'Bekleme Konforu',       emoji: '🛋️', fiyat: 350000,  sv: 3, etki: 'Müşteri sabrı +%20' },
    { id: 'bakim',     ad: 'Önleyici Bakım',        emoji: '🧰', fiyat: 500000,  sv: 4, etki: 'Bakım ve tamir bedeli −%25' },
    { id: 'tedarik',   ad: 'Toplu Alım Anlaşması',  emoji: '📦', fiyat: 900000,  sv: 5, etki: 'Yakıt siparişinde %4 iade' },
    { id: 'egitim',    ad: 'Personel Akademisi',    emoji: '🎓', fiyat: 700000,  sv: 5, etki: 'Personel 1,5 kat hızlı tecrübe kazanır, moral daha yüksek' },
    { id: 'kira',      ad: 'Uzun Vadeli Kira',      emoji: '📝', fiyat: 1200000, sv: 6, etki: 'Kira −%15' },
    { id: 'vip',       ad: 'VIP Salonu',            emoji: '⭐', fiyat: 1500000, sv: 7, on: 'sabir', etki: 'VIP müşteri 2 kat sık gelir, ödülü +%50' },
    { id: 'dijital',   ad: 'Dijital Pazarlama',     emoji: '📱', fiyat: 2400000, sv: 9, on: 'pazarlama', etki: 'Müşteri +%8, marka her gün +0,3' }
  ];

  /* çekirdek olay üreticisi bunları seçmez (olasilik 0); saat başında buradan tetiklenir */
  E.olaylar = [
    { id: 'bayram',     ad: 'Bayram Trafiği',  emoji: '🎉', olasilik: 0, sure: [150, 300], aciklama: 'Herkes yola çıktı, istasyon dolup taşacak.', kat: 1.6, iyi: true },
    { id: 'yolcalisma', ad: 'Yol Çalışması',   emoji: '🚧', olasilik: 0, sure: [120, 240], aciklama: 'Yolun bir şeridi kapalı; önünden geçen araç azaldı.', kat: 0.62 },
    { id: 'festival',   ad: 'Yerel Festival',  emoji: '🎪', olasilik: 0, sure: [90, 180],  aciklama: 'Kasabada festival var, ziyaretçiler yakıt alıyor.', kat: 1.3, iyi: true }
  ];

  E.yeniBinalar = {
    motel:     { ad: 'Motel',        emoji: '🏨', fiyat: 880000, guc: 16, gelir: 260, cekim: 0.06, sv: 3, svFiyat: 560000, seviyeSart: 7, konfor: 6, aciklama: 'Uzun yol sürücüleri geceler. Tır ve otobüs yolcusundan yüksek gelir.' },
    oyunparki: { ad: 'Çocuk Parkı',  emoji: '🛝', fiyat: 120000, guc: 1,  gelir: 0,   cekim: 0.09, sv: 2, svFiyat: 80000,  seviyeSart: 3, konfor: 7, aciklama: 'Aileler mola için burayı seçer; memnuniyeti artırır.' },
    cicek:     { ad: 'Peyzaj',       emoji: '🌷', fiyat: 45000,  guc: 0,  gelir: 0,   cekim: 0.02, sv: 2, svFiyat: 30000,  seviyeSart: 1, konfor: 3, sus: true, aciklama: 'Çiçeklik ve çim. İstasyonu güzelleştirir, marka puanını her gün biraz artırır.' },
    bayrak:    { ad: 'Bayrak Direği', emoji: '🚩', fiyat: 60000,  guc: 0,  gelir: 0,   cekim: 0.03, sv: 1, svFiyat: 0,      seviyeSart: 2, konfor: 1, sus: true, aciklama: 'Uzaktan görünür. İstasyonu güzelleştirir, marka puanını her gün biraz artırır.' }
  };

  /* ---------------------------------------------------------
     DURUM
     --------------------------------------------------------- */
  E.d = function () {
    var s = D.s;
    if (!s.ek) s.ek = {};
    var e = s.ek;
    if (!e.giris) e.giris = { gun: '', seri: 0 };
    if (!e.arge) e.arge = {};
    if (typeof e.bayi !== 'number') e.bayi = 0;
    if (!e.vergi) e.vergi = { sonKar: s.ist ? s.ist.kar : 0, sonTutar: 0 };
    if (!e.gecmis) e.gecmis = [];
    return e;
  };
  E.argeVar = function (idv) { return !!E.d().arge[idv]; };

  function bugunYazi(t) {
    var d = new Date(t === undefined ? Date.now() : t);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* =========================================================
     1) GÜNLÜK GİRİŞ ÖDÜLÜ (gerçek güne göre)
     ========================================================= */
  E.girisDurumu = function (simdi) {
    var g = E.d().giris, bugun = bugunYazi(simdi), dun = bugunYazi((simdi === undefined ? Date.now() : simdi) - 86400000);
    if (g.gun === bugun) return { alindi: true, seri: g.seri };
    return { alindi: false, seri: g.gun === dun ? g.seri + 1 : 1 };
  };
  E.girisOdulTutar = function (seri) {
    var taban = E.girisOdulleri[(seri - 1) % E.girisOdulleri.length];
    return Math.round(taban * (1 + (D.s.seviye || 1) * 0.25) / 500) * 500;
  };
  E.girisAl = function (simdi) {
    var du = E.girisDurumu(simdi);
    if (du.alindi) return 0;
    var g = E.d().giris, tutar = E.girisOdulTutar(du.seri);
    g.gun = bugunYazi(simdi); g.seri = du.seri;
    D.s.para += tutar;
    D.s.ist.bugunCiro += tutar;
    D.xpEkle(60 + du.seri * 15);
    D.kaydet();
    return tutar;
  };
  E.girisGoster = function () {
    var du = E.girisDurumu();
    if (du.alindi) return false;
    var h = '<div class="not">Her gün girersen seri büyür, ödül artar. Bir gün atlarsan seri baştan başlar.</div>';
    h += '<div class="girisSerit">';
    for (var i = 1; i <= 7; i++) {
      var gunNo = ((du.seri - 1) % 7) + 1;
      var sinif = i < gunNo ? ' gecti' : (i === gunNo ? ' bugun' : '');
      h += '<div class="girisGun' + sinif + '"><b>' + i + '</b><span>' + (i === 7 ? '🎁' : '💰') + '</span></div>';
    }
    h += '</div>';
    h += '<div class="kv" style="margin-top:10px"><span>Seri</span><b>' + du.seri + '. gün</b></div>';
    h += '<div class="kv"><span>Bugünün ödülü</span><b class="yesilY">' + tl(E.girisOdulTutar(du.seri)) + '</b></div>';
    h += '<button class="btn genis" style="margin-top:12px" onclick="EK.girisTikla()">Ödülü al</button>';
    UI.modal('🎁 Günlük ödül', h);
    return true;
  };
  E.girisTikla = function () {
    var t = E.girisAl();
    UI.modalKapat();
    if (t) UI.bildir('🎁 Günlük ödül', tl(t) + ' kasana eklendi.', 'iyi');
    UI.ciz();
  };

  /* =========================================================
     2) PERSONEL GELİŞİMİ: kıdem, moral, zam isteği, istifa
     ========================================================= */
  E.kidemEsik = [0, 5, 12, 22, 36];                 /* çalışılan gün */
  E.kidemAd = ['Çaylak', 'Tecrübeli', 'Usta', 'Kıdemli', 'Efsane'];
  E.pHazirla = function (p) {
    if (typeof p.moral !== 'number') p.moral = 70;
    if (typeof p.gunSay !== 'number') p.gunSay = 0;
    if (typeof p.kidem !== 'number') p.kidem = 1;
    return p;
  };
  E.personelGun = function () {
    var e = E.d(), s = D.s;
    s.subeler.forEach(function (sb, si) {
      if (sb.devredildi) return;
      var kacan = (sb.bugun && sb.bugun.kacan) || 0;
      for (var i = sb.personel.length - 1; i >= 0; i--) {
        var p = E.pHazirla(sb.personel[i]);
        p.gunSay += E.argeVar('egitim') ? 1.5 : 1;
        /* kıdem */
        var yeni = 1;
        for (var k = 0; k < E.kidemEsik.length; k++) if (p.gunSay >= E.kidemEsik[k]) yeni = k + 1;
        if (yeni > p.kidem) {
          p.kidem = yeni;
          p.beceri = Math.min(99, p.beceri + 4);
          if (si === s.aktif) UI.bildir('🎖️ Terfi', p.ad + ' artık ' + E.kidemAd[yeni - 1] + ' · beceri ' + p.beceri, 'iyi');
        }
        /* moral: 68'e doğru süzülür; iyi gün yükseltir, kaçan müşteri yorar */
        var hedef = 66 + (E.argeVar('egitim') ? 8 : 0) + (sb.memnuniyet > 75 ? 6 : 0) - Math.min(18, kacan * 1.2);
        var dipte = p.moral < 16;                       /* güne dipte başladıysa istifa edebilir */
        p.moral = kisitla(p.moral + (hedef - p.moral) * 0.18, 0, 100);
        if (dipte && Math.random() < 0.35) {
          if (si === s.aktif) UI.bildir('🚪 İstifa', p.ad + ' morali bozuk olduğu için işi bıraktı.', 'kotu');
          sb.personel.splice(i, 1);
          continue;
        }
        /* zam isteği */
        if (!e.zam && p.kidem >= 2 && si === s.aktif && Math.random() < 0.05 && (p.sonZam || 0) + 8 < s.gun) {
          e.zam = { pid: p.id, sube: si, oran: rastgeleTam(8, 15) / 100, gun: s.gun };
          UI.bildir('💬 Zam isteği', p.ad + ' %' + Math.round(e.zam.oran * 100) + ' zam istiyor. Personel ekranından yanıtla.', 'uyari');
        }
      }
    });
    /* yanıtsız zam isteği 3 gün sonra reddedilmiş sayılır */
    if (e.zam && s.gun - e.zam.gun >= 3) E.zamYanit(false, true);
  };
  E.zamPersonel = function () {
    var e = E.d();
    if (!e.zam) return null;
    var sb = D.s.subeler[e.zam.sube];
    if (!sb) { e.zam = null; return null; }
    for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].id === e.zam.pid) return sb.personel[i];
    e.zam = null;
    return null;
  };
  E.zamYanit = function (kabul, sessiz) {
    var e = E.d(), p = E.zamPersonel();
    if (!p) return false;
    E.pHazirla(p);
    if (kabul) {
      p.maas = Math.round(p.maas * (1 + e.zam.oran) / 500) * 500;
      p.moral = kisitla(p.moral + 18, 0, 100);
      UI.bildir('✅ Zam verildi', p.ad + ' yeni maaş: ' + tl(p.maas) + '/ay', 'iyi');
    } else {
      p.moral = kisitla(p.moral - 22, 0, 100);
      if (!sessiz) UI.bildir('Zam reddedildi', p.ad + ' bundan hoşlanmadı; morali düştü.', 'uyari');
      else UI.bildir('Zam isteği yanıtsız kaldı', p.ad + ' kırıldı; morali düştü.', 'uyari');
    }
    p.sonZam = D.s.gun;
    e.zam = null;
    return true;
  };
  E.primBedeli = function (p) { return Math.round(p.maas * 0.25 / 500) * 500; };
  E.primVer = function (pid) {
    var sb = D.sube();
    for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].id === pid) {
      var p = E.pHazirla(sb.personel[i]);
      if (!D.harca(E.primBedeli(p))) return false;
      p.moral = kisitla(p.moral + 22, 0, 100);
      UI.bildir('🎁 Prim verildi', p.ad + ' çok sevindi.', 'iyi');
      return true;
    }
    return false;
  };
  E.personelKart = function () {
    var sb = D.sube(), e = E.d(), h = '';
    var zp = E.zamPersonel();
    if (zp && e.zam.sube === D.s.aktif) {
      h += '<div class="kart" style="border-color:var(--sari)"><div class="baslik">💬 Zam isteği</div>';
      h += '<div class="not"><b>' + zp.ad + '</b> maaşına %' + Math.round(e.zam.oran * 100) + ' zam istiyor (' + tl(zp.maas) + ' → ' + tl(Math.round(zp.maas * (1 + e.zam.oran) / 500) * 500) + '). Reddedersen morali düşer; morali çok düşen personel istifa eder.</div>';
      h += '<div class="btngrup" style="margin-top:8px"><button class="btn kucuk" onclick="EK.zamTikla(true)">Zam ver</button>';
      h += '<button class="btn kucuk ikincil" onclick="EK.zamTikla(false)">Reddet</button></div></div>';
    }
    if (!sb.personel.length) return h;
    h += '<div class="kart"><div class="baslik">Ekip durumu</div>';
    h += '<div class="not">Çalıştıkça kıdem kazanır, becerileri artar. Moral düşerse istifa ederler; prim morali yükseltir.</div>';
    for (var i = 0; i < sb.personel.length; i++) {
      var p = E.pHazirla(sb.personel[i]);
      var renk = p.moral > 60 ? 'var(--yesil)' : (p.moral > 30 ? 'var(--sari)' : 'var(--kirmizi)');
      h += '<div class="satir"><div class="sol"><div class="ikon">' + VERI.personel[p.tip].emoji + '</div><div><div class="ad">' + p.ad + '</div>';
      h += '<div class="alt">' + '★'.repeat(p.kidem) + ' ' + E.kidemAd[p.kidem - 1] + ' · moral ' + Math.round(p.moral) + '</div>';
      h += '<div class="cubuk" style="width:140px"><i style="width:' + p.moral + '%;background:' + renk + '"></i></div></div></div>';
      h += '<button class="btn minik ikincil" onclick="EK.primTikla(\'' + p.id + '\')">Prim<br><span class="mini">' + tl(E.primBedeli(p)) + '</span></button></div>';
    }
    return h + '</div>';
  };
  E.zamTikla = function (k) { E.zamYanit(k); UI.panelYenile(); };
  E.primTikla = function (pid) { if (E.primVer(pid)) UI.panelYenile(); };

  /* =========================================================
     3) AR-GE
     ========================================================= */
  E.argeAl = function (idv) {
    var t = null;
    for (var i = 0; i < E.arge.length; i++) if (E.arge[i].id === idv) t = E.arge[i];
    if (!t || E.argeVar(idv)) return false;
    if (D.s.seviye < t.sv) { UI.bildir('Kilitli', 'Seviye ' + t.sv + ' gerekli.', 'kotu'); return false; }
    if (t.on && !E.argeVar(t.on)) { UI.bildir('Kilitli', 'Önce bağlı olduğu geliştirmeyi al.', 'kotu'); return false; }
    if (!D.harca(t.fiyat)) return false;
    E.d().arge[idv] = true;
    D.xpEkle(300);
    UI.bildir('🔬 Geliştirme tamam', t.ad + ' · ' + t.etki, 'iyi');
    return true;
  };
  E.argeHtml = function () {
    var h = '<div class="kart"><div class="baslik">🔬 Ar-Ge</div>';
    h += '<div class="not">Kalıcı geliştirmeler. Bir kez alınır, bütün şubelerinde geçerlidir.</div>';
    for (var i = 0; i < E.arge.length; i++) {
      var t = E.arge[i], var_ = E.argeVar(t.id);
      var kilit = D.s.seviye < t.sv || (t.on && !E.argeVar(t.on));
      var onAd = '';
      if (t.on) for (var k = 0; k < E.arge.length; k++) if (E.arge[k].id === t.on) onAd = E.arge[k].ad;
      h += '<div class="satir"><div class="sol"><div class="ikon">' + t.emoji + '</div><div><div class="ad"' + (kilit && !var_ ? ' style="opacity:.6"' : '') + '>' + t.ad + '</div>';
      h += '<div class="alt">' + t.etki + (kilit && !var_ ? ' · <span class="kirmiziY">' + (D.s.seviye < t.sv ? 'Sv ' + t.sv : 'önce ' + onAd) + '</span>' : '') + '</div></div></div>';
      if (var_) h += '<span class="etiket iyi">✓ Alındı</span>';
      else h += '<button class="btn minik"' + (kilit ? ' style="opacity:.45"' : '') + ' onclick="EK.argeTikla(\'' + t.id + '\')">Al<br><span class="mini">' + tl(t.fiyat) + '</span></button>';
      h += '</div>';
    }
    return h + '</div>';
  };
  E.argeTikla = function (idv) { if (E.argeAl(idv)) UI.panelYenile(); };

  /* =========================================================
     4) BAYİLİK
     ========================================================= */
  E.bayiSinir = function () { return Math.floor((D.s.seviye || 1) / 4); };
  E.bayiBedeli = function () { return Math.round(1800000 * (1 + E.d().bayi * 0.6)); };
  E.bayiGunluk = function () { return Math.round(E.d().bayi * 14000 * (D.s.marka / 60)); };
  E.bayiVer = function () {
    var e = E.d();
    if (D.s.marka < 55) { UI.bildir('Marka zayıf', 'Bayilik vermek için marka puanın en az 55 olmalı.', 'kotu'); return false; }
    if (e.bayi >= E.bayiSinir()) { UI.bildir('Sınır doldu', 'Her 4 seviyede bir bayilik hakkı açılır.', 'kotu'); return false; }
    if (!D.harca(E.bayiBedeli())) return false;
    e.bayi++;
    D.xpEkle(500);
    UI.bildir('🤝 Yeni bayi', 'Markanla bir istasyon daha açıldı. Her gün pay alacaksın.', 'iyi');
    return true;
  };
  E.bayiHtml = function () {
    var e = E.d();
    var h = '<div class="kart"><div class="baslik">🤝 Bayilik</div>';
    h += '<div class="not">Markanı başka girişimcilere verirsin; onlar işletir, sen her gün pay alırsın. Pay marka puanınla büyür. Marka 35\'in altına düşerse bayiler ayrılmaya başlar.</div>';
    h += '<div class="kv" style="margin-top:8px"><span>Bayi sayısı</span><b>' + e.bayi + ' / ' + E.bayiSinir() + '</b></div>';
    h += '<div class="kv"><span>Günlük pay</span><b class="yesilY">' + tl(E.bayiGunluk()) + '</b></div>';
    h += '<div class="kv"><span>Marka puanı</span><b>' + say(D.s.marka, 0) + '</b></div>';
    if (e.bayi < E.bayiSinir()) h += '<button class="btn genis" style="margin-top:10px" onclick="EK.bayiTikla()">Bayilik ver · ' + tl(E.bayiBedeli()) + '</button>';
    else h += '<div class="not">Yeni bayilik hakkı için seviye ' + ((E.bayiSinir() + 1) * 4) + ' gerek.</div>';
    return h + '</div>';
  };
  E.bayiTikla = function () { if (E.bayiVer()) UI.panelYenile(); };

  /* =========================================================
     5) RAKİBİ SATIN ALMA
     ========================================================= */
  E.rakipBedeli = function (sb) {
    var r = SIM.rakipKur(sb);
    return Math.round(3200000 * D.lok(sb).trafik * (0.6 + kisitla(r.guc, 0.55, 1.45) * 0.4) / 10000) * 10000;
  };
  E.rakipGunluk = function (sb) { return Math.round(16000 * D.lok(sb).trafik); };
  E.rakipAl = function (sb) {
    var r = SIM.rakipKur(sb);
    if (r.satin) return false;
    if (D.s.seviye < 6) { UI.bildir('Kilitli', 'Rakibi satın almak için seviye 6 gerekli.', 'kotu'); return false; }
    if (!D.harca(E.rakipBedeli(sb))) return false;
    r.satin = true; r.savas = 0; r.indirim = 0; r.olay = null; r.guc = 0.55;
    D.xpEkle(800);
    UI.bildir('🏁 Rakip satın alındı', r.ad + ' artık senin. Fiyat savaşı bitti, o istasyondan da gelir alacaksın.', 'iyi');
    return true;
  };
  E.rakipKart = function (sb) {
    var r = SIM.rakipKur(sb);
    if (r.satin) {
      return '<div class="kart"><div class="baslik">🏁 Karşı istasyon senin</div><div class="not">' + r.ad + ' markan altında çalışıyor. Fiyat savaşı yok; her gün ' + tl(E.rakipGunluk(sb)) + ' gelir getiriyor.</div></div>';
    }
    var h = '<div class="kart"><div class="baslik">🏁 Rakibi satın al</div>';
    h += '<div class="not">Karşı istasyonu alırsan fiyat savaşları biter, müşteri sana kayar ve o istasyondan günlük gelir alırsın.</div>';
    if (D.s.seviye < 6) h += '<div class="not">🔒 Seviye 6 gerekli.</div>';
    else h += '<button class="btn genis" style="margin-top:8px" onclick="EK.rakipTikla()">Satın al · ' + tl(E.rakipBedeli(sb)) + '</button>';
    return h + '</div>';
  };
  E.rakipTikla = function () { if (E.rakipAl(D.sube())) UI.panelYenile(); };

  /* =========================================================
     6) VERGİ (30 günde bir, dönem kârı üzerinden)
     ========================================================= */
  E.vergiOrani = 0.1;
  E.vergiTahmin = function () {
    var v = E.d().vergi;
    return Math.max(0, Math.round((D.s.ist.kar - v.sonKar) * E.vergiOrani));
  };
  E.vergiKes = function () {
    var v = E.d().vergi, t = E.vergiTahmin();
    v.sonKar = D.s.ist.kar;
    v.sonTutar = t;
    if (t > 0) {
      D.s.para -= t; D.s.ist.bugunGider += t;
      UI.bildir('🧾 Dönem vergisi', 'Son 30 günün kârından %' + (E.vergiOrani * 100) + ': ' + tl(t), 'uyari');
    }
    return t;
  };
  E.vergiKart = function () {
    var gun = 30 - ((D.s.gun - 1) % 30);
    var h = '<div class="kart"><div class="baslik">🧾 Dönem vergisi</div>';
    h += '<div class="not">Her 30 günde bir, o dönemin kârından %' + (E.vergiOrani * 100) + ' vergi kesilir. Zarar eden dönemde vergi yoktur.</div>';
    h += '<div class="kv"><span>Şu ana kadar biriken</span><b>' + tl(E.vergiTahmin()) + '</b></div>';
    h += '<div class="kv"><span>Ödemeye kalan</span><b>' + gun + ' gün</b></div>';
    if (E.d().vergi.sonTutar) h += '<div class="kv"><span>Geçen dönem ödenen</span><b>' + tl(E.d().vergi.sonTutar) + '</b></div>';
    return h + '</div>';
  };

  /* =========================================================
     7) PİYASA TAKİBİ (toptan fiyat geçmişi)
     ========================================================= */
  E.piyasaKaydet = function () {
    var g = E.d().gecmis, t = D.s.toptan;
    g.push([+t.benzin.toFixed(2), +t.dizel.toFixed(2), +t.lpg.toFixed(2)]);
    if (g.length > 48) g.shift();
  };
  E.piyasaKart = function () {
    var g = E.d().gecmis;
    if (g.length < 3) return '';
    var adlar = ['benzin', 'dizel', 'lpg'];
    var h = '<div class="kart"><div class="baslik">📈 Toptan piyasa · son ' + g.length + ' saat</div>';
    h += '<div class="not">Fiyat düşükken tankı doldur, yükselirken bekle.</div>';
    for (var y = 0; y < 3; y++) {
      var en = 1e9, cok = 0, i;
      for (i = 0; i < g.length; i++) { if (g[i][y] < en) en = g[i][y]; if (g[i][y] > cok) cok = g[i][y]; }
      var aralik = Math.max(0.01, cok - en), pts = '';
      for (i = 0; i < g.length; i++) pts += (i / (g.length - 1) * 100).toFixed(1) + ',' + (22 - (g[i][y] - en) / aralik * 20).toFixed(1) + ' ';
      var son = g[g.length - 1][y], once = g[Math.max(0, g.length - 4)][y];
      var yon = son > once * 1.004 ? ['▲ yükseliyor', 'kirmiziY'] : (son < once * 0.996 ? ['▼ düşüyor', 'yesilY'] : ['● yatay', '']);
      var konum = (son - en) / aralik;
      var yorum = konum < 0.25 ? 'dipte — alım fırsatı' : (konum > 0.75 ? 'tepede — pahalı' : 'ortalarda');
      h += '<div class="kv"><span>' + VERI.yakitlar[adlar[y]].kisa + ' ' + say(son, 2) + ' ₺ · ' + yorum + '</span><b class="' + yon[1] + '">' + yon[0] + '</b></div>';
      h += '<svg viewBox="0 0 100 24" preserveAspectRatio="none" style="width:100%;height:30px;display:block"><polyline points="' + pts + '" fill="none" stroke="' + VERI.yakitlar[adlar[y]].renk + '" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>';
    }
    return h + '</div>';
  };

  /* =========================================================
     8) EK OLAYLAR ve VIP
     ========================================================= */
  E.olayTanim = function (idv) { for (var i = 0; i < E.olaylar.length; i++) if (E.olaylar[i].id === idv) return E.olaylar[i]; return null; };
  E.olayBaslat = function (idv) {
    var o = E.olayTanim(idv);
    if (!o || SIM.olayVar(idv)) return false;
    var sure = rastgeleTam(o.sure[0], o.sure[1]);
    D.s.olaylar.push({ id: idv, kalan: sure });
    UI.bildir(o.emoji + ' ' + o.ad, o.aciklama + ' (' + sure + ' dk)', o.iyi ? 'iyi' : 'uyari');
    return true;
  };
  E.hirsizlik = function (sb) {
    if (D.binaSayisi(sb, 'kamera')) {
      UI.bildir('📹 Hırsız caydırıldı', 'Gece tanka yaklaşan biri kamerayı görünce kaçtı.', 'iyi');
      return 0;
    }
    var adaylar = [];
    ['benzin', 'dizel', 'lpg'].forEach(function (y) { if (sb.tank[y] && sb.tank[y].dolu > 300) adaylar.push(y); });
    if (!adaylar.length) return 0;
    var y = secRast(adaylar), l = Math.min(sb.tank[y].dolu * 0.2, rastgeleTam(150, 420));
    sb.tank[y].dolu -= l;
    UI.bildir('🕵️ Yakıt hırsızlığı', 'Gece tanktan ' + say(l, 0) + ' L ' + VERI.yakitlar[y].ad.toLocaleLowerCase('tr-TR') + ' çalındı. Güvenlik kamerası bunu önler.', 'kotu');
    return l;
  };
  E.saatOlay = function () {
    var s = D.s, sb = D.sube();
    if (s.seviye < 2) return;
    if (Math.random() > 0.055) return;
    var r = Math.random();
    if (r < 0.22) E.olayBaslat('bayram');
    else if (r < 0.42) E.olayBaslat('yolcalisma');
    else if (r < 0.60) E.olayBaslat('festival');
    else if (r < 0.78) { if (s.saat >= 22 || s.saat < 6) E.hirsizlik(sb); }
    else E._vipSirada = true;
  };
  E.olayKat = function () {
    var k = 1;
    for (var i = 0; i < E.olaylar.length; i++) if (SIM.olayVar(E.olaylar[i].id)) k *= E.olaylar[i].kat;
    return k;
  };

  /* =========================================================
     9) FOTOĞRAF MODU
     ========================================================= */
  E.foto = function (ac) {
    var b = document.body;
    if (!b || !b.classList) return;
    if (ac) {
      b.classList.add('foto');
      try { UI.fabKapat(); } catch (e) { }
      var p = document.getElementById('fotoCik');
      if (!p) {
        p = document.createElement('button');
        p.id = 'fotoCik';
        p.textContent = '✕';
        p.onclick = function () { EK.foto(false); };
        b.appendChild(p);
      }
    } else b.classList.remove('foto');
    try { IZO.boyutla(); } catch (e) { }
  };

  /* =========================================================
     ÇEKİRDEĞE BAĞLANTI
     ========================================================= */
  E.kur = function () {
    if (E._kuruldu) return;
    E._kuruldu = true;
    var k;

    /* veriler */
    for (k = 0; k < E.olaylar.length; k++) VERI.olaylar.push(E.olaylar[k]);
    for (k in E.yeniBinalar) if (!VERI.binalar[k]) { VERI.binalar[k] = E.yeniBinalar[k]; VERI.binaSira.push(k); }

    /* müşteri akışı */
    var e1 = SIM.saatlikMusteri;
    SIM.saatlikMusteri = function (sb) {
      var r = e1.call(this, sb);
      if (!r) return r;
      r *= E.olayKat();
      if (E.argeVar('pazarlama')) r *= 1.06;
      if (E.argeVar('dijital')) r *= 1.08;
      return r;
    };

    /* VIP ve sabır */
    var e2 = SIM.musteriYap;
    SIM.musteriYap = function (sb) {
      var m = e2.call(this, sb);
      if (!m) return m;
      if (E.argeVar('sabir')) { m.sabir *= 1.2; m.sabirKalan *= 1.2; }
      var sans = D.s.seviye >= 3 ? (E.argeVar('vip') ? 0.03 : 0.015) : 0;
      if (!m.filo && (E._vipSirada || Math.random() < sans) && m.arac !== 'Tır' && m.arac !== 'Otobüs' && m.arac !== 'Traktör') {
        E._vipSirada = false;
        m.vip = true;
        m.bahsis = (m.bahsis || 1) * 3;
        m.sabirKalan *= 0.75;
        UI.bildir('⭐ VIP müşteri geldi', 'Hızlı ve tam dolum bekliyor; memnun kalırsa büyük ödül bırakır.', 'iyi');
      }
      return m;
    };
    var e3 = SIM.satisTamamla;
    SIM.satisTamamla = function (sb, m) {
      var r = e3.apply(this, arguments);
      if (m && m.vip && r && r.tip === 'ok' && !r.kacak) {
        if (r.isabet === 'tam' || r.isabet === 'orta') {
          var odul = Math.round((4000 + D.s.seviye * 2200) * (E.argeVar('vip') ? 1.5 : 1) * (r.isabet === 'tam' ? 1.5 : 1) / 100) * 100;
          D.s.para += odul; D.s.ist.bugunCiro += odul;
          D.s.marka = kisitla(D.s.marka + 1.2, 0, 100);
          UI.bildir('⭐ VIP memnun', 'Teşekkür olarak ' + tl(odul) + ' bıraktı; marka puanın arttı.', 'iyi');
        } else {
          D.s.marka = kisitla(D.s.marka - 1, 0, 100);
          UI.bildir('⭐ VIP memnun kalmadı', 'Dolum isteğine uymadı; marka puanın biraz düştü.', 'uyari');
        }
      }
      return r;
    };
    var e4 = SIM.musteriKacti;
    SIM.musteriKacti = function (sb, m) {
      if (m && m.vip) { D.s.marka = kisitla(D.s.marka - 1.5, 0, 100); UI.bildir('⭐ VIP beklemeden gitti', 'Marka puanın düştü.', 'kotu'); }
      return e4.apply(this, arguments);
    };

    /* Ar-Ge etkileri */
    var e5 = SIM.kiraGunluk;
    SIM.kiraGunluk = function (sb) { return e5.call(this, sb) * (E.argeVar('kira') ? 0.85 : 1); };
    var e6 = SIM.bakimBedeli;
    SIM.bakimBedeli = function (y) { return Math.round(e6.call(this, y) * (E.argeVar('bakim') ? 0.75 : 1)); };
    var e7 = SIM.siparisVer;
    SIM.siparisVer = function () {
      var once = D.s.para;
      var r = e7.apply(this, arguments);
      var harcanan = once - D.s.para;
      if (r && harcanan > 0 && E.argeVar('tedarik')) {
        var iade = Math.round(harcanan * 0.04);
        D.s.para += iade; D.s.ist.bugunGider -= iade;
      }
      return r;
    };

    /* satın alınan rakip */
    var e8 = SIM.rakipCekim;
    SIM.rakipCekim = function (sb) { return SIM.rakipKur(sb).satin ? 1.22 : e8.call(this, sb); };
    var e9 = SIM.rakipGunSonu;
    SIM.rakipGunSonu = function (sb) { if (SIM.rakipKur(sb).satin) return; return e9.apply(this, arguments); };
    var e10 = SIM.rakipIndirim;
    SIM.rakipIndirim = function (sb) { return SIM.rakipKur(sb).satin ? 0 : e10.call(this, sb); };

    /* saat başı ve gün sonu */
    var e11 = SIM.saatBasi;
    SIM.saatBasi = function () {
      var r = e11.apply(this, arguments);
      try { E.piyasaKaydet(); E.saatOlay(); } catch (x) { }
      return r;
    };
    var e12 = SIM.gunSonu;
    SIM.gunSonu = function () {
      try {
        E.personelGun();                                  /* günün sayaçları sıfırlanmadan önce */
        var s = D.s, e = E.d();
        /* süs ve dijital pazarlama: marka */
        var sus = 0;
        s.subeler.forEach(function (sb) {
          if (sb.devredildi) return;
          D.binalar(sb).forEach(function (b) { if (VERI.binalar[b.b.t] && VERI.binalar[b.b.t].sus) sus++; });
        });
        var artis = Math.min(4, sus) * 0.15 + (E.argeVar('dijital') ? 0.3 : 0);
        if (artis) s.marka = kisitla(s.marka + artis, 0, 100);
        /* bayi payı */
        if (e.bayi > 0) {
          if (s.marka < 35 && Math.random() < 0.5) {
            e.bayi--;
            UI.bildir('🤝 Bayi ayrıldı', 'Marka puanın düşük olduğu için bir bayin sözleşmeyi bitirdi.', 'kotu');
          }
          var pay = E.bayiGunluk();
          if (pay > 0) { s.para += pay; s.ist.bugunCiro += pay; }
        }
        /* satın alınan rakiplerin geliri */
        s.subeler.forEach(function (sb) {
          if (sb.devredildi || !sb.rakipIst || !sb.rakipIst.satin) return;
          var g = E.rakipGunluk(sb);
          s.para += g; s.ist.bugunCiro += g;
        });
        /* vergi: dönem sonu */
        if ((s.gun - 1) % 30 === 0) E.vergiKes();
      } catch (x) { }
      return e12.apply(this, arguments);
    };

    /* ---- arayüz ---- */
    if (typeof UI !== 'undefined') {
      var u1 = UI.personelHtml;
      UI.personelHtml = function () { return E.personelKart() + u1.apply(this, arguments); };
      var u2 = UI.muhasebeHtml;
      UI.muhasebeHtml = function () { return u2.apply(this, arguments) + E.vergiKart(); };
      var u3 = UI.rakipHtml;
      UI.rakipHtml = function (sb) {
        if (SIM.rakipKur(sb).satin) return E.rakipKart(sb);
        return u3.apply(this, arguments) + E.rakipKart(sb);
      };
      var u4 = UI.siparisHtml;
      UI.siparisHtml = function () { return u4.apply(this, arguments) + E.piyasaKart(); };
    }

    /* ---- görseller ---- */
    if (typeof IZO !== 'undefined' && IZO.binaModel) {
      var b1 = IZO.binaModel;
      IZO.binaModel = function (t, sv, gx, gy) {
        if (E.yeniBinalar[t]) return E.binaCiz.call(this, t, sv, gx, gy);
        return b1.apply(this, arguments);
      };
      var a1 = IZO.arabaYap;
      IZO.arabaYap = function (sb, m) {
        var a = a1.apply(this, arguments);
        if (a && m && m.vip) { a.renk = '#d4af37'; a.cesit = 'oto'; }
        return a;
      };
    }
  };

  /* yeni tesislerin çizimi (this = IZO) */
  E.binaCiz = function (t, sv, gx, gy) {
    var c = this.cz, I = this.isik(), o = this.kam.olcek, kis = this.sezonAd() === 'kis';
    if (t === 'motel') {
      var kat = Math.min(3, 1 + sv);
      this.dukkanModel(gx, gy, { govde: '#f2e3c6', cati: '#7a4b8f', kat: kat, catiTip: 'kirma', yazi: 'MOTEL' });
      return;
    }
    if (t === 'oyunparki') {
      this.golge(gx + 0.1, gy + 0.1, 0.86, 0.86, 0.26);
      this.kutu(gx + 0.05, gy + 0.05, 0, 0.9, 0.9, 1.6, kis ? '#e3ebef' : '#e2c98f');            /* kum zemin */
      /* kaydırak */
      this._koseli = true;
      this.kutu(gx + 0.16, gy + 0.2, 1.6, 0.05, 0.05, 17, '#5d6875');
      this.kutu(gx + 0.36, gy + 0.2, 1.6, 0.05, 0.05, 17, '#5d6875');
      this._koseli = false;
      this.kutu(gx + 0.13, gy + 0.16, 18, 0.32, 0.24, 2, '#e24e2f');
      var k1 = this.ekran(gx + 0.19, gy + 0.4, 19.5), k2 = this.ekran(gx + 0.41, gy + 0.4, 19.5), k3 = this.ekran(gx + 0.41, gy + 0.9, 2.2), k4 = this.ekran(gx + 0.19, gy + 0.9, 2.2);
      this.cokgen([k1, k2, k3, k4], this.ton('#f0b429', I));
      /* salıncak */
      c.strokeStyle = this.ton('#3f7fd0', I); c.lineWidth = Math.max(1.2, 2 * o); c.lineCap = 'round';
      var s1 = this.ekran(gx + 0.6, gy + 0.3, 1.6), s2 = this.ekran(gx + 0.72, gy + 0.3, 22), s3 = this.ekran(gx + 0.84, gy + 0.3, 1.6);
      var s4 = this.ekran(gx + 0.6, gy + 0.7, 1.6), s5 = this.ekran(gx + 0.72, gy + 0.7, 22), s6 = this.ekran(gx + 0.84, gy + 0.7, 1.6);
      c.beginPath(); c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y); c.lineTo(s3.x, s3.y); c.moveTo(s4.x, s4.y); c.lineTo(s5.x, s5.y); c.lineTo(s6.x, s6.y); c.moveTo(s2.x, s2.y); c.lineTo(s5.x, s5.y); c.stroke();
      c.strokeStyle = this.ton('#6b7480', I); c.lineWidth = Math.max(0.7, 1 * o);
      var o1 = this.ekran(gx + 0.72, gy + 0.44, 22), o2 = this.ekran(gx + 0.72, gy + 0.44, 7), o3 = this.ekran(gx + 0.72, gy + 0.56, 22), o4 = this.ekran(gx + 0.72, gy + 0.56, 7);
      c.beginPath(); c.moveTo(o1.x, o1.y); c.lineTo(o2.x, o2.y); c.moveTo(o3.x, o3.y); c.lineTo(o4.x, o4.y); c.stroke();
      c.lineCap = 'butt';
      this.cokgen([o2, o4, this.ekran(gx + 0.78, gy + 0.56, 7), this.ekran(gx + 0.78, gy + 0.44, 7)], this.ton('#e24e2f', I));
      return;
    }
    if (t === 'cicek') {
      this.golge(gx + 0.12, gy + 0.12, 0.8, 0.8, 0.2);
      this.prizma(this.ayak(gx + 0.5, gy + 0.5, 0.84, 0.84, 0.2, 0, 4), 0, 3, '#cfd5db');
      this.prizma(this.ayak(gx + 0.5, gy + 0.5, 0.74, 0.74, 0.18, 0, 4), 3, 0.8, kis ? '#e6eef2' : '#63a653', { kenarsiz: true });
      var pal = kis ? ['#dfe8ec', '#c3d1d8', '#f6fafc'] : ['#58a348', '#3d8334', '#86c873'];
      var yer = [[0.3, 0.32], [0.68, 0.3], [0.5, 0.52], [0.3, 0.7], [0.7, 0.68]];
      var renkler = ['#ff8fab', '#ffd166', '#ffffff', '#c58cf2', '#ff6b6b'];
      for (var i = 0; i < yer.length; i++) {
        var p = this.ekran(gx + yer[i][0], gy + yer[i][1], 4);
        this.lob(p.x, p.y - 2.6 * o, (i === 2 && sv > 1 ? 6 : 4.2) * o, pal);
        if (!kis) {
          c.fillStyle = this.ton(renkler[i], I);
          for (var f = 0; f < 4; f++) { c.beginPath(); c.arc(p.x + Math.cos(f * 1.6 + i) * 2.4 * o, p.y - 3.4 * o + Math.sin(f * 1.6 + i) * 1.8 * o, 1.15 * o, 0, 6.3); c.fill(); }
        }
      }
      if (sv > 1) {                                   /* 2. seviye: ortada süs ağacı */
        var a = this.ekran(gx + 0.5, gy + 0.52, 4);
        c.fillStyle = this.ton('#7a5636', I); c.fillRect(a.x - 1.2 * o, a.y - 15 * o, 2.4 * o, 12 * o);
        this.lob(a.x, a.y - 19 * o, 7 * o, pal);
      }
      return;
    }
    if (t === 'bayrak') {
      this.golge(gx + 0.36, gy + 0.36, 0.3, 0.3, 0.22);
      this.silindir(gx + 0.38, gy + 0.38, 0, 0.24, 3, '#c6ccd3');
      this.silindir(gx + 0.47, gy + 0.47, 3, 0.06, 78, '#e9edf1');
      var tp = this.ekran(gx + 0.5, gy + 0.5, 81);
      c.fillStyle = this.ton('#e3c15a', I); c.beginPath(); c.arc(tp.x, tp.y, 2.2 * o, 0, 6.3); c.fill();
      /* dalgalı bayrak */
      var st = this.tabelaStili ? this.tabelaStili() : { pano: '#e24e2f' };
      var bx = tp.x + 1 * o, by = tp.y + 3 * o, w = 26 * o, hh = 16 * o;
      var g = c.createLinearGradient(bx, 0, bx + w, 0);
      g.addColorStop(0, this.ton(st.pano, Math.max(I, 0.8)));
      g.addColorStop(0.5, this.ton(this.karis(st.pano, '#ffffff', 0.18), Math.max(I, 0.8)));
      g.addColorStop(1, this.ton(this.karis(st.pano, '#000000', 0.15), Math.max(I, 0.8)));
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(bx, by);
      c.bezierCurveTo(bx + w * 0.3, by - 4 * o, bx + w * 0.6, by + 4 * o, bx + w, by);
      c.lineTo(bx + w, by + hh);
      c.bezierCurveTo(bx + w * 0.6, by + hh + 4 * o, bx + w * 0.3, by + hh - 4 * o, bx, by + hh);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.92)';
      c.beginPath(); c.arc(bx + w * 0.45, by + hh * 0.5, 4.2 * o, 0, 6.3); c.fill();
      return;
    }
  };

  return E;
})();

if (typeof window !== 'undefined') window.EK = EK;
try { EK.kur(); } catch (e) { }

/* =========================================================
   EK 2 — vardiya, oto kuaför, şarj parkı, bölge kapışması
   Hiçbiri kare başına çalışmaz: dakikalık / günlük hesaplar ve hazır resimler.
   ========================================================= */
(function () {
  var E = EK;

  /* ---------------------------------------------------------
     VARDİYA
     tam: her saat çalışır, yorulur · gunduz 07–19 · gece 19–07 (daha az maaş)
     --------------------------------------------------------- */
  E.vardiyalar = {
    tam:    { ad: 'Tam gün', emoji: '🔁', kat: 1.0,  not: 'Her saat çalışır; yorulur, morali daha düşük seyreder.' },
    gunduz: { ad: 'Gündüz',  emoji: '☀️', kat: 0.72, not: '07:00–19:00 arası çalışır.' },
    gece:   { ad: 'Gece',    emoji: '🌙', kat: 0.8,  not: '19:00–07:00 arası çalışır.' }
  };
  E.vardiyali = { pompaci: true, temizlik: true, teknisyen: true };       /* kasiyer ve müdür hep tam gün */
  E.vardiya = function (p) { return (E.vardiyali[p.tip] && E.vardiyalar[p.vardiya]) ? p.vardiya : 'tam'; };
  E.gorevde = function (p, saat) {
    var v = E.vardiya(p);
    if (v === 'tam') return true;
    if (saat === undefined) saat = D.s.saat;
    var gunduz = saat >= 7 && saat < 19;
    return v === 'gunduz' ? gunduz : !gunduz;
  };
  E.gorevdekiler = function (sb) {
    var r = [], degisti = false;
    for (var i = 0; i < sb.personel.length; i++) { if (E.gorevde(sb.personel[i])) r.push(sb.personel[i]); else degisti = true; }
    return degisti ? r : sb.personel;
  };
  E.vardiyaDegis = function (pid, v) {
    var sb = D.sube();
    if (!E.vardiyalar[v]) return false;
    for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].id === pid) {
      if (!E.vardiyali[sb.personel[i].tip]) return false;
      sb.personel[i].vardiya = v;
      return true;
    }
    return false;
  };
  E.vardiyaSirala = function (pid) {
    var sb = D.sube(), sira = ['tam', 'gunduz', 'gece'];
    for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].id === pid) {
      var v = sira[(sira.indexOf(E.vardiya(sb.personel[i])) + 1) % 3];
      if (E.vardiyaDegis(pid, v)) UI.panelYenile();
    }
  };
  /* gün sonunda vardiya indirimi: çekirdek tam maaşı keser, fark geri yazılır */
  E.vardiyaTasarrufu = function () {
    var t = 0;
    D.s.subeler.forEach(function (sb) {
      if (sb.devredildi) return;
      sb.personel.forEach(function (p) { t += p.maas / 30 * (1 - E.vardiyalar[E.vardiya(p)].kat); });
    });
    return t;
  };
  E.vardiyaKart = function () {
    var sb = D.sube(), adet = 0, i;
    for (i = 0; i < sb.personel.length; i++) if (E.vardiyali[sb.personel[i].tip]) adet++;
    if (!adet) return '';
    var saat = D.s.saat, gunduz = saat >= 7 && saat < 19;
    var h = '<div class="kart"><div class="baslik">🕐 Vardiya · şu an ' + (gunduz ? 'gündüz' : 'gece') + '</div>';
    h += '<div class="not">Gündüzcü %28, gececi %20 daha az maaş alır ama yalnızca kendi saatinde çalışır. Tam gün çalışan yorulur. Düğmeye bastıkça vardiya değişir.</div>';
    for (i = 0; i < sb.personel.length; i++) {
      var p = sb.personel[i];
      if (!E.vardiyali[p.tip]) continue;
      var v = E.vardiya(p), tan = E.vardiyalar[v], is = E.gorevde(p);
      h += '<div class="satir"><div class="sol"><div class="ikon">' + VERI.personel[p.tip].emoji + '</div><div><div class="ad">' + p.ad + '</div>';
      h += '<div class="alt">' + (is ? '<span class="yesilY">görevde</span>' : '<span class="sariY">izinde</span>') + ' · günlük ' + tl(p.maas / 30 * tan.kat) + '</div></div></div>';
      h += '<button class="btn minik ikincil" onclick="EK.vardiyaSirala(\'' + p.id + '\')">' + tan.emoji + '<br><span class="mini">' + tan.ad + '</span></button></div>';
    }
    return h + '</div>';
  };

  /* ---------------------------------------------------------
     YENİ TESİSLER
     --------------------------------------------------------- */
  E.yeniBinalar.kuafor = { ad: 'Oto Kuaför', emoji: '✨', fiyat: 540000, guc: 12, gelir: 300, cekim: 0.045, sv: 3, svFiyat: 380000, seviyeSart: 6, konfor: 3, aciklama: 'Pasta-cila ve detaylı iç temizlik. Az müşteri, yüksek ciro; lüks araç sahipleri bayılır.' };
  E.yeniBinalar.sarjpark = { ad: 'Şarj Parkı', emoji: '🔌', fiyat: 720000, guc: 34, gelir: 0, cekim: 0.05, sv: 3, svFiyat: 480000, seviyeSart: 8, konfor: 4, aciklama: 'Güneş çatılı hızlı şarj alanı. Elektrikli araç sahipleri uzun kalır, şarj ve bekleme geliri bırakır.' };

  var eskiBinaCiz = E.binaCiz;
  E.binaCiz = function (t, sv, gx, gy) {
    var c = this.cz, I = this.isik(), o = this.kam.olcek, gece = this.gece();
    if (t === 'kuafor') {
      this.dukkanModel(gx, gy, { govde: '#e8e4f2', cati: '#6a4fb0', kat: 1, garaj: true, yazi: 'KUAFÖR' });
      /* kapı önünde cila kovası ve parıltı */
      this.silindir(gx + 0.82, gy + 0.94, 0, 0.1, 6, '#f0b429');
      var pr = this.ekran(gx + 0.36, gy + 0.92, 22);
      c.fillStyle = 'rgba(255,255,255,.95)';
      for (var k = 0; k < 3; k++) {
        var px = pr.x + (k - 1) * 9 * o, py = pr.y - (k % 2) * 6 * o, r = (k === 1 ? 3.2 : 2.2) * o;
        c.beginPath(); c.moveTo(px, py - r); c.lineTo(px + r * 0.3, py - r * 0.3); c.lineTo(px + r, py); c.lineTo(px + r * 0.3, py + r * 0.3);
        c.lineTo(px, py + r); c.lineTo(px - r * 0.3, py + r * 0.3); c.lineTo(px - r, py); c.lineTo(px - r * 0.3, py - r * 0.3); c.closePath(); c.fill();
      }
      return;
    }
    if (t === 'sarjpark') {
      this.golge(gx + 0.08, gy + 0.08, 0.9, 0.9, 0.3);
      this.kutu(gx + 0.03, gy + 0.03, 0, 0.94, 0.94, 2, '#8f99a5');
      /* park çizgileri */
      c.strokeStyle = this.ton('#7fe0a8', I); c.lineWidth = Math.max(0.8, 1.3 * o);
      for (var q = 0; q < 3; q++) {
        var l1 = this.ekran(gx + 0.12 + q * 0.38, gy + 0.3, 2.2), l2 = this.ekran(gx + 0.12 + q * 0.38, gy + 0.92, 2.2);
        c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
      }
      /* direkler ve güneş çatısı */
      this.silindir(gx + 0.12, gy + 0.14, 2, 0.06, 40, '#e3e8ed');
      this.silindir(gx + 0.82, gy + 0.14, 2, 0.06, 40, '#e3e8ed');
      /* şarj üniteleri */
      for (var u = 0; u < Math.min(3, 1 + sv); u++) {
        var ux = gx + 0.2 + u * 0.24;
        this.prizma(this.ayak(ux + 0.06, gy + 0.2, 0.12, 0.12, 0.035, 0, 2), 2, 17, '#f4f6f8');
        this.prizma(this.ayak(ux + 0.06, gy + 0.2, 0.125, 0.125, 0.04, 0, 2), 19, 2.6, '#2fbf71');
        this.cokgen(this.yuzDortgen('on', ux + 0.02, ux + 0.1, gy + 0.262, 11, 16), gece ? '#9ef0b5' : this.ton('#1d2a3d', I));
      }
      /* eğimli panel çatı */
      var a1 = this.ekran(gx + 0.04, gy + 0.04, 47), a2 = this.ekran(gx + 0.96, gy + 0.04, 47), a3 = this.ekran(gx + 0.96, gy + 0.6, 40), a4 = this.ekran(gx + 0.04, gy + 0.6, 40);
      var pg = c.createLinearGradient(a1.x, a1.y, a3.x, a3.y);
      pg.addColorStop(0, this.ton('#2e5f9e', I)); pg.addColorStop(1, this.ton('#17325c', I));
      this.cokgen([a1, a2, a3, a4], pg);
      c.strokeStyle = 'rgba(190,220,255,.45)'; c.lineWidth = Math.max(0.5, 0.7 * o);
      for (var z = 1; z < 6; z++) {
        var u1 = this.ekran(gx + 0.04 + z * 0.153, gy + 0.04, 47), u2 = this.ekran(gx + 0.04 + z * 0.153, gy + 0.6, 40);
        c.beginPath(); c.moveTo(u1.x, u1.y); c.lineTo(u2.x, u2.y); c.stroke();
      }
      this.cokgen([a4, a3, this.ekran(gx + 0.96, gy + 0.6, 37.5), this.ekran(gx + 0.04, gy + 0.6, 37.5)], this.ton('#2fbf71', I));
      if (gece) { var hp = this.ekran(gx + 0.5, gy + 0.3, 30); this.hale(hp.x, hp.y, 30 * o, '160,255,200', 0.3); }
      return;
    }
    return eskiBinaCiz.call(this, t, sv, gx, gy);
  };

  /* ---------------------------------------------------------
     BÖLGE KAPIŞMASI
     Sekiz ilçe; her birinde pazar payı sen ve üç rakip zincir arasında bölünür.
     Payı %50'yi geçen bölge senindir: günlük gelir ve müşteri artışı getirir.
     --------------------------------------------------------- */
  E.bolgeAdlari = ['Merkez', 'Sanayi', 'Sahil', 'Yayla', 'Liman', 'Üniversite', 'Organize', 'Havalimanı'];
  E.zincirTanim = [
    { ad: 'Yıldız Petrol', renk: '#d64545' },
    { ad: 'Mavi Enerji',   renk: '#3f7fd0' },
    { ad: 'Anka Oil',      renk: '#e0a92e' }
  ];
  E.BENIM_RENK = '#2fbf71';
  E.bolge = function () {
    var e = E.d();
    if (!e.bolge) {
      var L = [];
      for (var i = 0; i < E.bolgeAdlari.length; i++) {
        var r = [rastgele(18, 34), rastgele(18, 34), rastgele(18, 34)];
        var sen = i === 0 ? 14 : rastgele(2, 8), top = r[0] + r[1] + r[2];
        for (var k = 0; k < 3; k++) r[k] = +(r[k] / top * (100 - sen)).toFixed(1);
        L.push({ ad: E.bolgeAdlari[i], nufus: Math.round(rastgele(0.7, 1.6) * 10) / 10, sen: +sen.toFixed(1), r: r, bekle: 0 });
      }
      e.bolge = { liste: L, guc: [rastgele(0.9, 1.15), rastgele(0.9, 1.15), rastgele(0.9, 1.15)], saldiri: null };
    }
    return e.bolge;
  };
  E.bolgeNormalle = function (b) {
    b.sen = kisitla(b.sen, 0, 96);
    var top = b.r[0] + b.r[1] + b.r[2], kalan = 100 - b.sen;
    if (top <= 0) { b.r = [kalan / 3, kalan / 3, kalan / 3]; return; }
    for (var k = 0; k < 3; k++) b.r[k] = +(b.r[k] / top * kalan).toFixed(1);
  };
  E.bolgeLider = function (b) {
    var en = -1, kim = 'sen', deger = b.sen;
    for (var k = 0; k < 3; k++) if (b.r[k] > deger) { deger = b.r[k]; en = k; kim = k; }
    return { kim: kim, pay: deger };
  };
  E.bolgeSenin = function (b) { return b.sen >= 50; };
  E.bolgeSayisi = function () { var n = 0, L = E.bolge().liste; for (var i = 0; i < L.length; i++) if (E.bolgeSenin(L[i])) n++; return n; };
  E.bolgeGunluk = function () {
    var t = 0, L = E.bolge().liste;
    for (var i = 0; i < L.length; i++) if (E.bolgeSenin(L[i])) t += 22000 * L[i].nufus * (L[i].sen / 60);
    return Math.round(t);
  };
  E.bolgeCarpan = function () { return 1 + Math.min(8, E.bolgeSayisi()) * 0.015; };
  E.reklamBedeli = function (b, buyuk) {
    return Math.round((buyuk ? 520000 : 160000) * b.nufus * (1 + b.sen / 70) / 5000) * 5000;
  };
  E.bolgeReklam = function (idx, buyuk) {
    var bg = E.bolge(), b = bg.liste[idx];
    if (!b) return false;
    if (D.s.seviye < 4) { UI.bildir('Kilitli', 'Bölge kapışması seviye 4\'te açılır.', 'kotu'); return false; }
    if (b.bekle > 0) { UI.bildir('Bekle', 'Bu bölgede yeni kampanya için ' + b.bekle + ' gün beklemelisin.', 'uyari'); return false; }
    if (!D.harca(E.reklamBedeli(b, buyuk))) return false;
    var once = E.bolgeSenin(b);
    var artis = (buyuk ? rastgele(14, 20) : rastgele(5, 8)) * (0.75 + D.s.marka / 200);
    b.sen += artis;
    b.bekle = buyuk ? 4 : 2;
    E.bolgeNormalle(b);
    E._bolgeCarpan = undefined;
    if (!once && E.bolgeSenin(b)) { D.xpEkle(600); UI.bildir('🏴 ' + b.ad + ' senin!', 'Bölgenin yarısından fazlası artık senden alıyor. Günlük gelir ve müşteri artışı başladı.', 'iyi'); }
    else UI.bildir('📣 Kampanya yapıldı', b.ad + ' bölgesinde payın %' + say(b.sen, 0) + ' oldu.', 'iyi');
    return true;
  };
  E.bolgeGun = function () {
    var bg = E.bolge(), L = bg.liste, i, k;
    for (k = 0; k < 3; k++) bg.guc[k] = kisitla(bg.guc[k] + rastgele(-0.03, 0.03), 0.8, 1.25);
    for (i = 0; i < L.length; i++) {
      var b = L[i];
      if (b.bekle > 0) b.bekle--;
      var once = E.bolgeSenin(b);
      /* marka güçlüyse payın yavaşça büyür, zayıfsa erir; rakipler kendi aralarında da yer değiştirir */
      b.sen += (D.s.marka - 55) / 55 * 0.45 - (b.sen > 50 ? 0.35 : 0.12);
      for (k = 0; k < 3; k++) b.r[k] = Math.max(1, b.r[k] * (1 + (bg.guc[k] - 1) * 0.06 + rastgele(-0.012, 0.012)));
      E.bolgeNormalle(b);
      if (once && !E.bolgeSenin(b)) UI.bildir('🏳️ ' + b.ad + ' elden gitti', 'Payın %50\'nin altına düştü. Kampanya yapıp geri alabilirsin.', 'kotu');
    }
    /* rakip saldırısı: bir zincir senin en güçlü olduğun bölgelerden birine yüklenir */
    if (D.s.seviye >= 4 && Math.random() < 0.16) {
      var aday = [];
      for (i = 0; i < L.length; i++) if (L[i].sen > 20) aday.push(i);
      if (aday.length) {
        var hi = secRast(aday), z = rastgeleTam(0, 2), kayip = rastgele(4, 9);
        L[hi].sen -= kayip; L[hi].r[z] += kayip;
        E.bolgeNormalle(L[hi]);
        UI.bildir('⚔️ ' + E.zincirTanim[z].ad + ' saldırdı', L[hi].ad + ' bölgesinde kampanya yaptı; payın %' + say(L[hi].sen, 0) + '\'e geriledi.', 'uyari');
      }
    }
    E._bolgeCarpan = undefined;
    var g = E.bolgeGunluk();
    if (g > 0) { D.s.para += g; D.s.ist.bugunCiro += g; }
    return g;
  };
  E.bolgeHtml = function () {
    var bg = E.bolge(), L = bg.liste, i, k;
    var h = '<div class="kart"><div class="baslik">🗺️ Bölge kapışması</div>';
    if (D.s.seviye < 4) return h + '<div class="not">🔒 Seviye 4\'te açılır. Üç rakip zincirle sekiz bölgenin pazarı için yarışacaksın.</div></div>';
    h += '<div class="not">Bir bölgede payın %50\'yi geçerse o bölge senindir: günlük gelir getirir ve bütün şubelerine müşteri artışı sağlar. Rakipler kampanya yapıp geri almaya çalışır.</div>';
    /* harita: 4x2 karo, lider rengine boyanır */
    h += '<div class="bolgeHarita">';
    for (i = 0; i < L.length; i++) {
      var ld = E.bolgeLider(L[i]);
      var renk = ld.kim === 'sen' ? E.BENIM_RENK : E.zincirTanim[ld.kim].renk;
      h += '<div class="bolgeKaro' + (E.bolgeSenin(L[i]) ? ' benim' : '') + '" style="background:' + renk + '"><b>' + L[i].ad + '</b><span>%' + Math.round(L[i].sen) + '</span></div>';
    }
    h += '</div>';
    h += '<div class="kv" style="margin-top:8px"><span>Senin bölgelerin</span><b>' + E.bolgeSayisi() + ' / ' + L.length + '</b></div>';
    h += '<div class="kv"><span>Günlük bölge geliri</span><b class="yesilY">' + tl(E.bolgeGunluk()) + '</b></div>';
    h += '<div class="kv"><span>Müşteri artışı</span><b class="yesilY">+%' + say((E.bolgeCarpan() - 1) * 100, 1) + '</b></div>';
    h += '<div class="lejant"><span><i style="background:' + E.BENIM_RENK + '"></i>Sen</span>';
    for (k = 0; k < 3; k++) h += '<span><i style="background:' + E.zincirTanim[k].renk + '"></i>' + E.zincirTanim[k].ad + '</span>';
    h += '</div></div>';

    for (i = 0; i < L.length; i++) {
      var b = L[i];
      h += '<div class="kart"><div class="baslik">' + (E.bolgeSenin(b) ? '🏴 ' : '') + b.ad + ' · nüfus ×' + say(b.nufus, 1) + '</div>';
      h += '<div class="bolgeCubuk"><i style="width:' + b.sen + '%;background:' + E.BENIM_RENK + '"></i>';
      for (k = 0; k < 3; k++) h += '<i style="width:' + b.r[k] + '%;background:' + E.zincirTanim[k].renk + '"></i>';
      h += '</div>';
      h += '<div class="alt" style="margin-top:4px">Sen %' + say(b.sen, 0) + ' · hedef %50' + (b.bekle > 0 ? ' · ' + b.bekle + ' gün bekleme' : '') + '</div>';
      h += '<div class="btngrup" style="margin-top:8px">';
      h += '<button class="btn kucuk' + (b.bekle > 0 ? ' ikincil' : '') + '" onclick="EK.bolgeTikla(' + i + ',false)">📣 Reklam · ' + tl(E.reklamBedeli(b, false)) + '</button>';
      h += '<button class="btn kucuk ikincil" onclick="EK.bolgeTikla(' + i + ',true)">🎪 Büyük kampanya · ' + tl(E.reklamBedeli(b, true)) + '</button>';
      h += '</div></div>';
    }
    return h;
  };
  E.bolgeTikla = function (i, buyuk) { if (E.bolgeReklam(i, buyuk)) UI.panelYenile(); };

  /* ---------------------------------------------------------
     BAĞLANTI
     --------------------------------------------------------- */
  var k;
  for (k in E.yeniBinalar) if (!VERI.binalar[k]) { VERI.binalar[k] = E.yeniBinalar[k]; VERI.binaSira.push(k); }

  /* görevde olmayan personel o an yokmuş gibi: yalnızca hesap sırasında liste daraltılır */
  function vardiyaIle(sb, fn) {
    var tam = sb.personel, aktif = E.gorevdekiler(sb);
    if (aktif === tam) return fn();
    sb.personel = aktif;
    try { return fn(); } finally { sb.personel = tam; }
  }
  var v1 = SIM.otoServis;
  SIM.otoServis = function (sb) { var self = this, a = arguments; return vardiyaIle(sb, function () { return v1.apply(self, a); }); };
  var v2 = SIM.saatBasi;
  SIM.saatBasi = function () { var self = this, a = arguments, sb = D.sube(); return vardiyaIle(sb, function () { return v2.apply(self, a); }); };
  if (typeof IZO !== 'undefined' && IZO.personelGuncelle) {
    var v3 = IZO.personelGuncelle;
    IZO.personelGuncelle = function (sb) { var self = this, a = arguments; return vardiyaIle(sb, function () { return v3.apply(self, a); }); };
  }

  /* müşteri akışı: bölge üstünlüğü (çarpan gün içinde sabit, bir kez hesaplanır) */
  var m1 = SIM.saatlikMusteri;
  SIM.saatlikMusteri = function (sb) {
    var r = m1.call(this, sb);
    if (!r || !D.s.ek || !D.s.ek.bolge) return r;
    if (E._bolgeCarpan === undefined) E._bolgeCarpan = E.bolgeCarpan();
    return r * E._bolgeCarpan;
  };

  /* şarj parkı: elektrikli araç ek gelir bırakır */
  var t1 = SIM.ekTesisGeliri;
  SIM.ekTesisGeliri = function (sb, m) {
    var r = t1.apply(this, arguments);
    if (m && m.arac === 'Elektrikli') {
      var sp = D.binalar(sb, 'sarjpark');
      for (var i = 0; i < sp.length; i++) if (!sp[i].b.arizali) r += 240 * (1 + 0.35 * (sp[i].b.sv - 1)) * rastgele(0.8, 1.5);
    }
    if (m && m.arac === 'Lüks Araç' && D.binaSayisi(sb, 'kuafor') && Math.random() < 0.35) r += 420 * rastgele(0.8, 1.4);
    return r;
  };

  /* gün sonu: vardiya tasarrufu, tam gün yorgunluğu, bölge */
  var g1 = SIM.gunSonu;
  SIM.gunSonu = function () {
    try {
      var tas = E.vardiyaTasarrufu();
      if (tas > 0) { D.s.para += tas; D.s.ist.bugunGider -= tas; }
      D.s.subeler.forEach(function (sb) {
        if (sb.devredildi) return;
        sb.personel.forEach(function (p) { if (E.vardiyali[p.tip] && E.vardiya(p) === 'tam' && typeof p.moral === 'number') p.moral = kisitla(p.moral - 1.5, 0, 100); });
      });
      if (D.s.seviye >= 4 || (D.s.ek && D.s.ek.bolge)) E.bolgeGun();
    } catch (x) { }
    return g1.apply(this, arguments);
  };

  /* arayüz */
  if (typeof UI !== 'undefined') {
    var p1 = UI.personelHtml;
    UI.personelHtml = function () { return p1.apply(this, arguments) + E.vardiyaKart(); };
  }
})();
