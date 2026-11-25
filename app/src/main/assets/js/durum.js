/* Akaryakıt Patronu — oyun durumu, kayıt/yükleme ve yardımcılar */
'use strict';

const KAYIT_ANAHTAR = 'akaryakit_kayit_v1';

/* ---------------- biçimlendirme ---------------- */
function tl(n) {
  n = Math.round(n || 0);
  var eks = n < 0; n = Math.abs(n);
  var s;
  if (n >= 1e9) s = (n / 1e9).toFixed(2).replace('.', ',') + ' Mr';
  else if (n >= 1e6) s = (n / 1e6).toFixed(2).replace('.', ',') + ' M';
  else s = n.toLocaleString('tr-TR');
  return (eks ? '-' : '') + s + ' ₺';
}
function tlTam(n) { return Math.round(n || 0).toLocaleString('tr-TR') + ' ₺'; }
function say(n, bas) {
  if (bas === undefined) bas = 0;
  return (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: bas, maximumFractionDigits: bas });
}
function litre(n) { return say(n, 2) + ' L'; }
function yuzde(n) { return Math.round(n) + '%'; }
function ikiHane(n) { return (n < 10 ? '0' : '') + n; }
function rastgele(a, b) { return a + Math.random() * (b - a); }
function rastgeleTam(a, b) { return Math.floor(rastgele(a, b + 0.999)); }
function secRast(dizi) { return dizi[Math.floor(Math.random() * dizi.length)]; }
function kisitla(n, a, b) { return n < a ? a : (n > b ? b : n); }
function id() { return Math.random().toString(36).slice(2, 10); }

/* ---------------- durum nesnesi ---------------- */
const D = {
  s: null,

  /* ---- yeni oyun ---- */
  yeni: function () {
    var ilk = this.yeniSube('kasaba', true);
    this.s = {
      v: 1,
      para: 150000,
      xp: 0,
      seviye: 1,
      gun: 1,
      saat: 7,
      dk: 0,
      sezonIdx: 1,
      marka: 10,
      aktif: 0,
      hiz: 1,
      subeler: [ilk],
      rafineri: { aktif: false, sv: 0, tanker: 0 },
      toptan: {
        benzin: VERI.yakitlar.benzin.tabanMaliyet,
        dizel: VERI.yakitlar.dizel.tabanMaliyet,
        lpg: VERI.yakitlar.lpg.tabanMaliyet,
        ev: VERI.yakitlar.ev.tabanMaliyet
      },
      olaylar: [],
      pasifGelir: 0,
      devredilen: [],
      ist: {
        satisL: { benzin: 0, dizel: 0, lpg: 0, ev: 0 },
        ciro: 0, kar: 0, dokulen: 0, dokulenTl: 0,
        mutlu: 0, mutsuz: 0, tamIsabet: 0, musteri: 0,
        elleServis: 0, otoServis: 0,
        gunluk: [], bugunCiro: 0, bugunGider: 0
      },
      egitim: { servis: false, insa: false }
    };
    return this.s;
  },

  /* ---- yeni şube ---- */
  yeniSube: function (lokId, ilkMi) {
    var lok = null;
    for (var i = 0; i < VERI.lokasyonlar.length; i++) if (VERI.lokasyonlar[i].id === lokId) lok = VERI.lokasyonlar[i];
    /* şube küçük başlar, arsa satın alarak lokasyon sınırına kadar büyür */
    var bw = Math.min(3, lok.w), bh = Math.min(3, lok.h);
    var n = bw * bh;
    var sb = {
      lok: lok.id,
      ad: lok.ad,
      w: bw, h: bh,
      beton: new Array(n).fill(false),
      yapi: new Array(n).fill(null),
      tank: {
        benzin: { kap: VERI.tank.temelKapasite.benzin, dolu: 0 },
        dizel: { kap: VERI.tank.temelKapasite.dizel, dolu: 0 },
        lpg: { kap: VERI.tank.temelKapasite.lpg, dolu: 0 }
      },
      fiyat: {
        benzin: +(VERI.yakitlar.benzin.tabanMaliyet * 1.22).toFixed(2),
        dizel: +(VERI.yakitlar.dizel.tabanMaliyet * 1.22).toFixed(2),
        lpg: +(VERI.yakitlar.lpg.tabanMaliyet * 1.24).toFixed(2),
        ev: +(VERI.yakitlar.ev.tabanMaliyet * 1.9).toFixed(2)
      },
      rakip: {
        benzin: +(VERI.yakitlar.benzin.tabanMaliyet * 1.23).toFixed(2),
        dizel: +(VERI.yakitlar.dizel.tabanMaliyet * 1.23).toFixed(2),
        lpg: +(VERI.yakitlar.lpg.tabanMaliyet * 1.25).toFixed(2),
        ev: +(VERI.yakitlar.ev.tabanMaliyet * 1.95).toFixed(2)
      },
      personel: [],
      kuyruk: [],
      siparis: [],
      temizlik: 100,
      memnuniyet: 80,
      hizmetSayac: 0,
      puanToplam: 0,
      devredildi: false,
      kesinti: false,
      sebekeBorc: 0
    };
    if (ilkMi) {
      // başlangıç: 2x2 beton, 1 benzin + 1 dizel pompası, yarım dolu tanklar
      var mer = [0, 1, bw, bw + 1];
      for (var k = 0; k < mer.length; k++) sb.beton[mer[k]] = true;
      sb.yapi[0] = { t: 'pompa', yakit: 'benzin', sv: 1, bakim: 100, mesgul: null, arizali: false };
      sb.yapi[1] = { t: 'pompa', yakit: 'dizel', sv: 1, bakim: 100, mesgul: null, arizali: false };
      sb.tank.benzin.dolu = 2500;
      sb.tank.dizel.dolu = 2500;
    }
    return sb;
  },

  /* ---- kısayollar ---- */
  sube: function () { return this.s.subeler[this.s.aktif]; },
  lok: function (sb) {
    sb = sb || this.sube();
    for (var i = 0; i < VERI.lokasyonlar.length; i++) if (VERI.lokasyonlar[i].id === sb.lok) return VERI.lokasyonlar[i];
    return VERI.lokasyonlar[0];
  },
  sezon: function () { return VERI.sezonlar[VERI.sezonSira[this.s.sezonIdx]]; },

  pompalar: function (sb) {
    sb = sb || this.sube();
    var r = [];
    for (var i = 0; i < sb.yapi.length; i++) if (sb.yapi[i] && sb.yapi[i].t === 'pompa') r.push({ i: i, p: sb.yapi[i] });
    return r;
  },
  binalar: function (sb, tip) {
    sb = sb || this.sube();
    var r = [];
    for (var i = 0; i < sb.yapi.length; i++) {
      var y = sb.yapi[i];
      if (y && y.t !== 'pompa' && (!tip || y.t === tip)) r.push({ i: i, b: y });
    }
    return r;
  },
  binaSayisi: function (sb, tip) { return this.binalar(sb, tip).length; },

  /* tank kapasitesi: temel + depo binaları */
  tankKap: function (sb, yakit) {
    sb = sb || this.sube();
    if (yakit === 'ev') return 0;
    var ek = 0, dep = this.binalar(sb, 'depo');
    for (var i = 0; i < dep.length; i++) ek += 4000 * dep[i].b.sv;
    return VERI.tank.temelKapasite[yakit] + ek + (sb.tankEk && sb.tankEk[yakit] ? sb.tankEk[yakit] : 0);
  },

  /* tam akış hızı (birim/sn) */
  akis: function (p) {
    var dizi = p.yakit === 'ev' ? VERI.pompa.evAkis : VERI.pompa.akis;
    var a = dizi[kisitla(p.sv - 1, 0, dizi.length - 1)];
    a *= 0.6 + 0.4 * (p.bakim / 100);        // bakımsız pompa yavaşlar
    if (this.sube().kesinti && !this.gucYeterli()) a *= 0.45;
    return a;
  },

  /* kısık (hassas) akış hızı */
  yavasAkis: function (p) {
    var dizi = p.yakit === 'ev' ? VERI.pompa.yavasEvAkis : VERI.pompa.yavasAkis;
    var a = dizi[kisitla(p.sv - 1, 0, dizi.length - 1)];
    a *= 0.7 + 0.3 * (p.bakim / 100);
    if (this.sube().kesinti && !this.gucYeterli()) a *= 0.5;
    return a;
  },

  /* ---- güç ---- */
  gucTuketim: function (sb) {
    sb = sb || this.sube();
    var t = 2; // aydınlatma
    var po = this.pompalar(sb);
    for (var i = 0; i < po.length; i++) t += VERI.pompa.guc[po[i].p.yakit];
    var bi = this.binalar(sb);
    for (var j = 0; j < bi.length; j++) {
      var tan = VERI.binalar[bi[j].b.t];
      if (tan && tan.guc) t += tan.guc * (1 + 0.25 * (bi[j].b.sv - 1));
    }
    var sz = VERI.sezonSira[this.s.sezonIdx];
    if (sz === 'yaz') t *= 1.18; else if (sz === 'kis') t *= 1.12;
    return t;
  },
  gucUretim: function (sb) {
    sb = sb || this.sube();
    var u = 0, bi = this.binalar(sb), st = this.s.saat;
    for (var i = 0; i < bi.length; i++) {
      var tan = VERI.binalar[bi[i].b.t];
      if (!tan || !tan.uretim) continue;
      if (bi[i].b.arizali) continue;
      var kat = (0.7 + 0.3 * (bi[i].b.bakim / 100)) * bi[i].b.sv;
      if (bi[i].b.t === 'gunes') {
        var v = VERI.gunesVerim[st] || 0;
        u += tan.uretim * kat * v;
      } else {
        u += tan.uretim * kat;
      }
    }
    return u;
  },
  gucYeterli: function (sb) {
    sb = sb || this.sube();
    if (!sb.kesinti) return true;                 // şebeke varsa sorun yok
    return this.gucUretim(sb) >= this.gucTuketim(sb) * 0.9;
  },

  /* ---- seviye / xp ---- */
  xpEkle: function (n) {
    this.s.xp += n;
    while (this.s.seviye < VERI.xpTablo.length && this.s.xp >= VERI.xpTablo[this.s.seviye]) {
      this.s.seviye++;
      if (window.UI) UI.bildir('Seviye ' + this.s.seviye + '!', 'Yeni yatırımlar ve lokasyonlar açıldı.', 'iyi');
    }
  },
  sonrakiXp: function () {
    return this.s.seviye < VERI.xpTablo.length ? VERI.xpTablo[this.s.seviye] : VERI.xpTablo[VERI.xpTablo.length - 1];
  },
  oncekiXp: function () { return VERI.xpTablo[this.s.seviye - 1] || 0; },

  /* ---- marka yıldızı (0-5) ---- */
  yildiz: function () {
    var sb = this.sube();
    var ort = (sb.memnuniyet * 0.5 + sb.temizlik * 0.2 + this.bakimOrt(sb) * 0.3);
    return kisitla(Math.floor(ort / 20), 0, 5);
  },
  bakimOrt: function (sb) {
    sb = sb || this.sube();
    var top = 0, n = 0;
    for (var i = 0; i < sb.yapi.length; i++) {
      var y = sb.yapi[i];
      if (y && typeof y.bakim === 'number') { top += y.bakim; n++; }
    }
    return n ? top / n : 100;
  },

  /* ---- para ---- */
  harca: function (n, aciklama) {
    if (this.s.para < n) {
      if (window.UI) UI.bildir('Para yetmiyor', 'Gereken: ' + tl(n) + ' · Kasa: ' + tl(this.s.para), 'kotu');
      return false;
    }
    this.s.para -= n;
    this.s.ist.bugunGider += n;
    return true;
  },
  kazan: function (n) { this.s.para += n; },

  /* ---- toptan alış fiyatı (rafineri indirimi dahil) ---- */
  toptanFiyat: function (yakit) {
    var f = this.s.toptan[yakit];
    if (this.s.rafineri.aktif) {
      var ind = VERI.rafineri.indirim[kisitla(this.s.rafineri.sv, 0, VERI.rafineri.indirim.length - 1)];
      f *= (1 - ind);
    }
    return f;
  },

  /* ---- kayıt ---- */
  kaydet: function () {
    try {
      localStorage.setItem(KAYIT_ANAHTAR, JSON.stringify(this.s));
      return true;
    } catch (e) { return false; }
  },
  yukle: function () {
    try {
      var h = localStorage.getItem(KAYIT_ANAHTAR);
      if (!h) return false;
      var o = JSON.parse(h);
      if (!o || !o.subeler || !o.subeler.length) return false;
      this.s = o;
      this.onar();
      return true;
    } catch (e) { return false; }
  },
  sil: function () { try { localStorage.removeItem(KAYIT_ANAHTAR); } catch (e) {} },

  /* eski kayıtları yeni alanlarla tamamla (güncelleme uyumu) */
  onar: function () {
    var s = this.s;
    if (!s.ist) s.ist = {};
    var ist = s.ist;
    if (!ist.satisL) ist.satisL = { benzin: 0, dizel: 0, lpg: 0, ev: 0 };
    ['ciro','kar','dokulen','dokulenTl','mutlu','mutsuz','tamIsabet','musteri','elleServis','otoServis','bugunCiro','bugunGider']
      .forEach(function (k) { if (typeof ist[k] !== 'number') ist[k] = 0; });
    if (!ist.gunluk) ist.gunluk = [];
    if (!s.rafineri) s.rafineri = { aktif: false, sv: 0, tanker: 0 };
    if (!s.olaylar) s.olaylar = [];
    if (!s.devredilen) s.devredilen = [];
    if (typeof s.pasifGelir !== 'number') s.pasifGelir = 0;
    if (typeof s.marka !== 'number') s.marka = 10;
    if (typeof s.hiz !== 'number') s.hiz = 1;
    if (!s.egitim) s.egitim = { servis: false, insa: false };
    if (!s.toptan) {
      s.toptan = {};
      VERI.yakitSira.forEach(function (y) { s.toptan[y] = VERI.yakitlar[y].tabanMaliyet; });
    }
    s.subeler.forEach(function (sb) {
      if (!sb.kuyruk) sb.kuyruk = [];
      if (!sb.siparis) sb.siparis = [];
      if (!sb.personel) sb.personel = [];
      if (!sb.rakip) sb.rakip = JSON.parse(JSON.stringify(sb.fiyat));
      if (typeof sb.temizlik !== 'number') sb.temizlik = 100;
      if (typeof sb.memnuniyet !== 'number') sb.memnuniyet = 80;
      if (typeof sb.devredildi !== 'boolean') sb.devredildi = false;
      if (typeof sb.kesinti !== 'boolean') sb.kesinti = false;
      if (!sb.tank) sb.tank = { benzin:{kap:5000,dolu:0}, dizel:{kap:5000,dolu:0}, lpg:{kap:2500,dolu:0} };
      if (!sb.tank.lpg) sb.tank.lpg = { kap: 2500, dolu: 0 };
      // yapı dizisinin boyutu tutmazsa düzelt
      var n = sb.w * sb.h;
      if (sb.yapi.length !== n) { while (sb.yapi.length < n) sb.yapi.push(null); sb.yapi.length = n; }
      if (sb.beton.length !== n) { while (sb.beton.length < n) sb.beton.push(false); sb.beton.length = n; }
      sb.yapi.forEach(function (y) {
        if (!y) return;
        if (typeof y.bakim !== 'number') y.bakim = 100;
        if (typeof y.sv !== 'number') y.sv = 1;
        if (typeof y.arizali !== 'boolean') y.arizali = false;
        if (y.t === 'pompa' && y.mesgul === undefined) y.mesgul = null;
      });
    });
  }
};
