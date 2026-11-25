/* Akaryakıt Patronu — izometrik sahne (canvas)
   Oyun mantığına hiç dokunmaz; sadece D/SIM durumunu çizer ve dokunuşu hücreye çevirir. */
'use strict';

const IZO = {
  tuval: null, cz: null,
  G: 1,                 // devicePixelRatio
  en: 0, boy: 0,
  TW: 84, TH: 42,       // iso karo ölçüsü (geniş parsel)
  kam: { x: 0, y: 0, olcek: 1, hx: 0, hy: 0, holcek: 1, vx: 0, vy: 0, kuruldu: false },
  arabalar: [],
  ucanlar: [],          // uçan ₺ yazıları
  duman: [],
  vurus: [],            // {tip, i, poly} — dokunma sınama listesi
  sonKare: 0,
  calisiyor: false,
  _sahneAnahtar: '',
  _suruk: null,
  _pinch: null,

  /* =========================================================
     KURULUM
     ========================================================= */
  kur: function () {
    this.tuval = document.getElementById('tuval');
    if (!this.tuval || !this.tuval.getContext) return false;
    try { this.cz = this.tuval.getContext('2d'); } catch (e) { this.cz = null; }
    if (!this.cz) return false;

    this.boyutla();
    window.addEventListener('resize', function () { IZO.boyutla(); });
    this.girdiBagla();
    this.kameraSifirla();
    this.calisiyor = true;
    this.dongu();
    return true;
  },

  boyutla: function () {
    if (!this.tuval) return;
    var k = this.tuval.parentNode;
    var en = (k ? k.clientWidth : window.innerWidth) || 360;
    var boy = (k ? k.clientHeight : window.innerHeight) || 560;
    var hedefG = this.kaliteG || 1.6;
    this.G = Math.min(window.devicePixelRatio || 1, hedefG);
    this.en = en; this.boy = boy;
    this.tuval.width = Math.round(en * this.G);
    this.tuval.height = Math.round(boy * this.G);
    this.tuval.style.width = en + 'px';
    this.tuval.style.height = boy + 'px';
  },

  kameraSifirla: function () {
    var sb = D.sube();
    var mx = (sb.w - 1) / 2, my = (sb.h + 1) / 2;
    var m = this.izo(mx, my);
    /* tüm arsayı ekrana sığdırmaya çalışma: yapılar ferah görünsün, oyuncu kaydırsın.
       En çok 6x5'lik bir pencere gösterilir, büyük arsalarda kamera yakın kalır. */
    var pencereW = Math.min(sb.w, 4), pencereH = Math.min(sb.h, 4);
    var genislikGerek = (pencereW + pencereH + 1.6) * this.TW / 2;
    var olcek = (this.en - 16) / genislikGerek;
    olcek = kisitla(olcek, 0.78, 1.7);
    this.kam.holcek = olcek;
    this.kam.hx = this.en / 2 - m.x * olcek;
    this.kam.hy = this.boy * 0.54 - m.y * olcek;
    if (!this.kam.kuruldu) { this.kam.olcek = olcek; this.kam.x = this.kam.hx; this.kam.y = this.kam.hy; }
    this.kam.vx = this.kam.vy = 0;
    this.kam.kuruldu = true;
  },

  /* =========================================================
     DÖNÜŞÜMLER
     ========================================================= */
  izo: function (gx, gy) {
    return { x: (gx - gy) * this.TW / 2, y: (gx + gy) * this.TH / 2 };
  },
  ekran: function (gx, gy, z) {
    var p = this.izo(gx, gy);
    return {
      x: p.x * this.kam.olcek + this.kam.x,
      y: (p.y - (z || 0)) * this.kam.olcek + this.kam.y
    };
  },
  /* ekran noktasından karo koordinatı (z=0 düzlemi) */
  karo: function (ex, ey) {
    var x = (ex - this.kam.x) / this.kam.olcek;
    var y = (ey - this.kam.y) / this.kam.olcek;
    return {
      gx: (y / (this.TH / 2) + x / (this.TW / 2)) / 2,
      gy: (y / (this.TH / 2) - x / (this.TW / 2)) / 2
    };
  },

  /* =========================================================
     RENK YARDIMCILARI
     ========================================================= */
  ton: function (hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(Math.min(255, r * k)); g = Math.round(Math.min(255, g * k)); b = Math.round(Math.min(255, b * k));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  },
  /* gece karartması */
  isik: function () {
    var sa = D.s.saat + D.s.dk / 60;
    if (sa >= 7 && sa <= 18) return 1;
    if (sa >= 20 || sa <= 5) return 0.52;
    if (sa > 18) return 1 - (sa - 18) * 0.24;
    return 0.52 + (sa - 5) * 0.24;
  },
  gece: function () { return this.isik() < 0.8; },

  /* =========================================================
     ÇİZİM İLKELLERİ
     ========================================================= */
  cokgen: function (noktalar, renk) {
    var c = this.cz;
    c.beginPath();
    c.moveTo(noktalar[0].x, noktalar[0].y);
    for (var i = 1; i < noktalar.length; i++) c.lineTo(noktalar[i].x, noktalar[i].y);
    c.closePath();
    c.fillStyle = renk;
    c.fill();
  },

  /* karo zemini (eşkenar dörtgen) — kenarı kendi rengiyle taranır, dikiş izi kalmaz */
  zemin: function (gx, gy, renk, cizgi) {
    var a = this.ekran(gx, gy, 0), b = this.ekran(gx + 1, gy, 0),
        c = this.ekran(gx + 1, gy + 1, 0), d = this.ekran(gx, gy + 1, 0);
    var z = this.cz;
    z.beginPath();
    z.moveTo(a.x, a.y); z.lineTo(b.x, b.y); z.lineTo(c.x, c.y); z.lineTo(d.x, d.y);
    z.closePath();
    z.fillStyle = renk; z.fill();
    z.strokeStyle = cizgi || renk;
    z.lineWidth = cizgi ? 1 : 1.05;
    z.stroke();
  },

  /* karo başına sabit rastgele sayı (0..1) */
  karoRast: function (gx, gy, tohum) {
    var n = (gx * 73856093) ^ (gy * 19349663) ^ ((tohum || 0) * 83492791);
    n = (n ^ (n >> 13)) >>> 0;
    n = (n * 1274126177) >>> 0;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  },

  /** kutu: (gx,gy) köşesinden w×d karo, z yüksekliğinden h piksel yukarı */
  kutu: function (gx, gy, z, w, d, h, renk, vurusa) {
    var I = this.isik();
    var ust = this.ton(renk, 1.0 * I), sag = this.ton(renk, 0.78 * I), sol = this.ton(renk, 0.58 * I);
    var A = this.ekran(gx, gy, z + h), B = this.ekran(gx + w, gy, z + h),
        C = this.ekran(gx + w, gy + d, z + h), Dd = this.ekran(gx, gy + d, z + h);
    var Bk = this.ekran(gx + w, gy, z), Ck = this.ekran(gx + w, gy + d, z), Dk = this.ekran(gx, gy + d, z);
    this.cokgen([Dd, C, Ck, Dk], sol);        // sol yüz
    this.cokgen([B, C, Ck, Bk], sag);         // sağ yüz
    this.cokgen([A, B, C, Dd], ust);          // üst yüz
    /* üst kenarda ince aydınlık: kenarlar yumuşasın */
    var cz = this.cz;
    cz.strokeStyle = this.ton(renk, Math.min(1.25, 1.18 * I));
    cz.lineWidth = Math.max(0.6, 0.9 * this.kam.olcek);
    cz.beginPath();
    cz.moveTo(Dd.x, Dd.y); cz.lineTo(A.x, A.y); cz.lineTo(B.x, B.y);
    cz.stroke();
    if (vurusa) this.vurus.push({ tip: vurusa.tip, i: vurusa.i, poly: [A, B, Bk, Ck, Dk, Dd] });
    return { A: A, B: B, C: C, D: Dd };
  },

  /* nesne altına yumuşak gölge */
  /* bir kez üretilen yumuşak gölge sprite'ı */
  golgeSprite: function () {
    if (this._golgeSprite) return this._golgeSprite;
    var t;
    try { t = document.createElement('canvas'); } catch (e) { t = null; }
    if (!t || !t.getContext) return null;
    var N = 96;
    t.width = N; t.height = N;
    var tc = t.getContext('2d');
    if (!tc) return null;
    var g = tc.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    /* yumuşak geçiş: ortada bile tam siyah değil, kenar uzun sönümlü */
    g.addColorStop(0.00, 'rgba(0,0,0,.86)');
    g.addColorStop(0.32, 'rgba(0,0,0,.62)');
    g.addColorStop(0.58, 'rgba(0,0,0,.30)');
    g.addColorStop(0.80, 'rgba(0,0,0,.10)');
    g.addColorStop(1.00, 'rgba(0,0,0,0)');
    tc.fillStyle = g;
    tc.fillRect(0, 0, N, N);
    this._golgeSprite = t;
    return t;
  },

  /* güneşin o saatteki yönü ve gücü: gölge nereye, ne kadar uzun ve koyu düşsün.
     Sabah batıya, akşam doğuya uzar; öğlen kısa ve koyu, gece silik olur. */
  golgeYon: function () {
    var anah = D.s.saat * 60 + D.s.dk;
    if (this._gyAnah === anah && this._gy) return this._gy;
    var sa = D.s.saat + D.s.dk / 60;
    var gunduz = sa > 6 && sa < 18;
    var t = gunduz ? (sa - 6) / 12 : 0.5;
    var yuk = gunduz ? Math.sin(Math.PI * t) : 0;      /* güneşin yüksekliği 0..1 */
    var uz = gunduz ? 1 + (1 - yuk) * 1.05 : 1.12;     /* alçak güneş → uzun gölge */
    this._gy = {
      x: gunduz ? (0.5 - t) * -0.78 * uz : 0.10,       /* yatay kayma (rx katı) */
      y: 0.22 * uz,                                     /* dikey kayma (ry katı) */
      uz: uz,
      guc: gunduz ? 0.55 + 0.45 * yuk : 0.34            /* gece gölge silikleşir */
    };
    this._gyAnah = anah;
    return this._gy;
  },

  /* sprite ile ucuz ve yumuşak gölge (güneş yönüne kayar) */
  golgeCiz: function (ekranX, ekranY, rx, ry, alfa) {
    var sp = this.golgeSprite();
    var c = this.cz;
    var y = this.golgeYon();
    var gx2 = rx * (1 + (y.uz - 1) * 0.45);
    var gy2 = ry * (1 + (y.uz - 1) * 0.22);
    var px = ekranX + rx * y.x, py = ekranY + ry * y.y;
    var a = alfa * y.guc;
    if (!sp) {
      c.fillStyle = 'rgba(0,0,0,' + (a * 0.5).toFixed(2) + ')';
      c.beginPath(); c.ellipse(px, py, gx2, gy2, 0, 0, Math.PI * 2); c.fill();
      return;
    }
    c.globalAlpha = a;
    c.drawImage(sp, px - gx2, py - gy2, gx2 * 2, gy2 * 2);
    c.globalAlpha = 1;
  },

  golge: function (gx, gy, w, d, koyu) {
    var p = this.ekran(gx + w / 2, gy + d / 2, 0);
    var rx = (w + d) * this.TW / 4 * this.kam.olcek * 0.72;
    var ry = (w + d) * this.TH / 4 * this.kam.olcek * 0.72;
    this.golgeCiz(p.x, p.y, Math.max(4, rx), Math.max(2, ry), (koyu || 0.3) * this.isik());
  },

  /* küçük insan figürü (personel / müşteri) */
  insanCiz: function (gx, gy, renk, faz, sapka) {
    var c = this.cz, o = this.kam.olcek, I = this.isik();
    var salin = Math.sin((faz || 0)) * 1.4;
    this.golge(gx - 0.08, gy - 0.08, 0.16, 0.16, 0.26);
    /* bacaklar */
    this.kutu(gx - 0.05, gy - 0.03, 0, 0.04, 0.05, 7, '#2f3a4d');
    this.kutu(gx + 0.01, gy - 0.03, 0, 0.04, 0.05, 7, '#2f3a4d');
    /* gövde */
    this.kutu(gx - 0.06, gy - 0.04, 7, 0.12, 0.08, 10 + salin, renk);
    /* kafa */
    var kp = this.ekran(gx, gy, 20 + salin);
    c.fillStyle = this.ton('#e8b98f', I);
    c.beginPath(); c.arc(kp.x, kp.y, 3.6 * o, 0, Math.PI * 2); c.fill();
    if (sapka) {
      c.fillStyle = this.ton(sapka, I);
      c.beginPath(); c.arc(kp.x, kp.y - 1.6 * o, 3.6 * o, Math.PI, 0); c.fill();
    }
  },

  /* silindir (tank, reaktör) */
  silindir: function (gx, gy, z, cap, h, renk, vurusa) {
    var I = this.isik();
    var mx = gx + cap / 2, my = gy + cap / 2;
    var ustM = this.ekran(mx, my, z + h), altM = this.ekran(mx, my, z);
    var rx = cap * this.TW / 2 * this.kam.olcek, ry = cap * this.TH / 2 * this.kam.olcek;
    var c = this.cz;
    c.fillStyle = this.ton(renk, 0.7 * I);
    c.beginPath();
    c.moveTo(ustM.x - rx, ustM.y);
    c.lineTo(ustM.x - rx, altM.y);
    c.ellipse(altM.x, altM.y, rx, ry, 0, Math.PI, 0, true);
    c.lineTo(ustM.x + rx, ustM.y);
    c.ellipse(ustM.x, ustM.y, rx, ry, 0, 0, Math.PI, false);
    c.closePath();
    c.fill();
    c.fillStyle = this.ton(renk, 1.05 * I);
    c.beginPath(); c.ellipse(ustM.x, ustM.y, rx, ry, 0, 0, Math.PI * 2); c.fill();
    if (vurusa && this.vurus) {
      this.vurus.push({
        tip: vurusa.tip, i: vurusa.i,
        poly: [
          { x: ustM.x - rx, y: ustM.y - ry }, { x: ustM.x + rx, y: ustM.y - ry },
          { x: altM.x + rx, y: altM.y }, { x: altM.x + rx, y: altM.y + ry },
          { x: altM.x - rx, y: altM.y + ry }, { x: altM.x - rx, y: altM.y }
        ]
      });
    }
  },

  /* =========================================================
     ANA DÖNGÜ
     ========================================================= */
  /* kare süresine göre çözünürlüğü ayarlar: kasmayı keser */
  kaliteAyarla: function (kareMs) {
    this._ortMs = this._ortMs === undefined ? kareMs : this._ortMs * 0.9 + kareMs * 0.1;
    if (this._kaliteSayac === undefined) this._kaliteSayac = 0;
    this._kaliteSayac++;
    if (this._kaliteSayac < 90) return;            /* ~1,5 sn'de bir karar */
    this._kaliteSayac = 0;
    var simdi = this.kaliteG || 1.6;
    var yeni = simdi;
    if (this._ortMs > 26 && simdi > 1.0) yeni = Math.max(1.0, simdi - 0.3);
    else if (this._ortMs < 13 && simdi < 1.6) yeni = Math.min(1.6, simdi + 0.2);
    this.dusukKalite = this._ortMs > 24;
    if (yeni !== simdi) {
      this.kaliteG = yeni;
      this.boyutla();
      this._zAnahtar = '';
    }
  },

  dongu: function () {
    var self = this;
    function kare(t) {
      if (!self.calisiyor) return;
      var dt = Math.min(0.1, (t - self.sonKare) / 1000 || 0.016);
      self.sonKare = t;
      try {
        if (D.s && document.getElementById('tuval') && !OYUN.duruyor) {
          self.guncelle(dt);
          self.ciz();
        }
      } catch (e) { /* çizim hatası oyunu durdurmasın */ }
      requestAnimationFrame(kare);
    }
    requestAnimationFrame(kare);
  },

  /* =========================================================
     GÜNCELLEME (araçlar, uçan yazılar)
     ========================================================= */
  guncelle: function (dt) {
    var sb = D.sube();
    var anahtar = D.s.aktif + ':' + sb.w + 'x' + sb.h;
    if (anahtar !== this._sahneAnahtar) {
      this._sahneAnahtar = anahtar;
      this.arabalar = [];
      this.ucanlar = [];
      this.susle(sb);
      this.kameraSifirla();
    }

    this.kameraGuncelle(dt);
    this.musteriArabalari(sb);
    this.cevreTrafigi(sb, dt);
    this.personelGuncelle(sb, dt);
    this.yayaGuncelle(sb, dt);

    for (var i = this.arabalar.length - 1; i >= 0; i--) {
      var a = this.arabalar[i];
      this.arabaIlerlet(a, dt);
      /* otoparkta bekleyen araç: süre bitince çıkışa yönelir */
      if (a.durum === 'parkta' && (!a.yol || !a.yol.length) && !a.bekle) {
        a.parkSuresi -= dt;
        a.fren = false;
        if (a.parkSuresi <= 0) {
          var kpx = this.kapilar(sb);
          a.durum = 'gidiyor';
          a.bekle = 0.6 + Math.random();
          a.hiz = 1.4;
          a.yol = [
            { gx: a.gx, gy: kpx.seritY },
            { gx: kpx.cikis, gy: kpx.seritY },
            { gx: kpx.cikis, gy: kpx.agizY },
            { gx: kpx.cikis + 0.5, gy: sb.h + 1.3 },
            { gx: sb.w + 7, gy: sb.h + 1.3 }
          ];
        }
      }
      if (a.sil) this.arabalar.splice(i, 1);
    }
    for (var j = this.ucanlar.length - 1; j >= 0; j--) {
      var u = this.ucanlar[j];
      u.t += dt;
      if (u.t > 1.7) this.ucanlar.splice(j, 1);
    }
  },

  /* çevre: ağaç, çalı, tarla, kasaba binaları, direk, durak — şube başına sabit */
  susle: function (sb) {
    this.susler = [];
    var tohum = sb.w * 31 + sb.h * 17 + sb.lok.length * 7 + 3;
    function rnd(n) { tohum = (tohum * 1103515245 + 12345) & 0x7fffffff; return (tohum / 0x7fffffff) * (n === undefined ? 1 : n); }
    var self = this;

    var yolY = sb.h + 1;                 /* asfalt karosu */
    var ek = (SIM.yolEk ? SIM.yolEk(sb) : 0);    /* yol genişletme: ek şerit satırı */
    var yasak = function (gx, gy, w, h) {
      w = w || 1; h = h || 1;
      /* istasyon arsası + önündeki beton */
      if (gx + w > -1.6 && gx < sb.w + 1.4 && gy + h > -1.8 && gy < sb.h + 0.8) return true;
      /* ana yol bandı (iki şerit + refüj + banket) */
      if (gy + h > sb.h + 0.5 && gy < sb.h + ek + 3.6) return true;
      /* kasaba sokakları ve bina şeritleri */
      if (gy + h > sb.h + ek + 4.2 && gy < sb.h + ek + 12) return true;
      return false;
    };
    var cakisma = function (gx, gy, w, h) {
      for (var k = 0; k < self.susler.length; k++) {
        var o = self.susler[k];
        var ow = o.w || 0.9, oh = o.h || 0.9;
        if (gx < o.gx + ow + 0.35 && gx + w + 0.35 > o.gx && gy < o.gy + oh + 0.35 && gy + h + 0.35 > o.gy) return true;
      }
      return false;
    };
    var yerBul = function (w, h, alan, dene) {
      for (var d = 0; d < (dene || 36); d++) {
        var gx = alan.x0 + rnd(alan.x1 - alan.x0 - w);
        var gy = alan.y0 + rnd(alan.y1 - alan.y0 - h);
        if (yasak(gx, gy, w, h) || cakisma(gx, gy, w, h)) continue;
        return { gx: gx, gy: gy };
      }
      return null;
    };

    var genis = { x0: -11, x1: sb.w + 11, y0: -10, y1: sb.h + ek + 12 };
    var kasaba = { x0: -11, x1: sb.w + 11, y0: sb.h + ek + 4.2, y1: sb.h + ek + 13 };   /* yolun karşısı */
    var arka = { x0: -11, x1: sb.w + 11, y0: -9, y1: -2.2 };                  /* istasyonun arkası */

    /* --- kasaba: sokak boyunca hizalı binalar --- */
    var binaTipleri = ['apartman', 'dukkan', 'ev', 'ev', 'ofis', 'apartman', 'ev', 'dukkan'];
    var sokaklar = [sb.h + ek + 6, sb.h + ek + 10];          /* yatay sokak satırları */
    this.kasabaSokaklari = sokaklar.slice();
    var sira = 0;
    for (var sk = 0; sk < sokaklar.length; sk++) {
      var yolY = sokaklar[sk];
      /* sokağın iki yakası */
      [-1, 1].forEach(function (taraf) {
        var gyBina = taraf < 0 ? yolY - 1.9 : yolY + 1.1;
        for (var bx = -8; bx < sb.w + 8; bx += 2.7 + rnd(0.6)) {
          if (rnd(1) < 0.18) continue;                       /* arada boşluk */
          var tip = binaTipleri[Math.floor(rnd(binaTipleri.length))];
          var bw = tip === 'apartman' ? 1.15 + rnd(0.25) : (tip === 'ofis' ? 1.2 + rnd(0.2) : 0.9 + rnd(0.25));
          var bh = tip === 'apartman' ? 0.95 + rnd(0.2) : 0.85 + rnd(0.2);
          if (yasak(bx, gyBina, bw, bh) || cakisma(bx, gyBina, bw, bh)) continue;
          self.susler.push({
            tip: 'kasabaBina', alt: tip, gx: bx, gy: gyBina, w: bw, h: bh,
            kat: tip === 'apartman' ? 3 + Math.floor(rnd(3)) : (tip === 'ofis' ? 2 + Math.floor(rnd(2)) : 1),
            renk: ['#d8c6a8', '#e0cdb2', '#c4b39b', '#cdd5dd', '#dfd8c9', '#c3cedb', '#d9b9a4', '#bfd0c4'][Math.floor(rnd(8))],
            cati: ['#8c4b3a', '#7a4435', '#5c6672', '#9a5a44'][Math.floor(rnd(4))],
            tohum: Math.floor(rnd(1000)),
            bahce: rnd(1) < 0.45
          });
          sira++;
        }
      });
      /* sokak lambaları */
      for (var lx = -8; lx < sb.w + 9; lx += 4.2) {
        this.susler.push({ tip: 'direk', gx: lx, gy: yolY + 0.75, w: 0.3, h: 0.3, kucuk: true });
      }
    }
    /* cami: kasabanın simgesi */
    var camiYer = yerBul(1.25, 1.25, { x0: -8, x1: sb.w + 8, y0: sb.h + ek + 12, y1: sb.h + ek + 15 }, 40);
    if (camiYer) this.susler.push({ tip: 'cami', gx: camiYer.gx, gy: camiYer.gy, w: 1.25, h: 1.25 });

    /* --- tarlalar: arka ve yanlar --- */
    var tarlaSayi = 3 + Math.floor(rnd(2));
    for (var t = 0; t < tarlaSayi; t++) {
      var tw = 1.9 + rnd(1.3), th = 1.5 + rnd(1.0);
      var alan = t % 2 === 0 ? arka : { x0: -12, x1: -3.5, y0: -7, y1: sb.h - 0.5 };
      var ty = yerBul(tw, th, alan, 40);
      if (!ty) ty = yerBul(tw, th, { x0: sb.w + 2.4, x1: sb.w + 12, y0: -6, y1: sb.h - 0.5 }, 40);
      if (!ty) ty = yerBul(tw, th, { x0: -12, x1: sb.w + 12, y0: sb.h + ek + 13, y1: sb.h + ek + 19 }, 40);
      if (!ty) continue;
      this.susler.push({
        tip: 'tarla', gx: ty.gx, gy: ty.gy, w: tw, h: th,
        urun: ['bugday', 'ayciceg', 'misir'][Math.floor(rnd(3))]
      });
    }

    /* --- yol boyu aydınlatma direkleri --- */
    for (var d2 = -8; d2 <= sb.w + 9; d2 += 4) {
      this.susler.push({ tip: 'direk', gx: d2, gy: sb.h + ek + 3.35, w: 0.3, h: 0.3, yon: 1 });
    }
    /* otobüs durağı (yolun karşı banketinde) */
    this.susler.push({ tip: 'durak', gx: sb.w + 1.9, gy: sb.h + ek + 3.3, w: 1.2, h: 0.6 });

    /* --- ağaç, çalı, taş serpiştirme --- */
    var dogaSayi = 24;
    for (var i = 0; i < dogaSayi; i++) {
      var zar = rnd(1);
      var dtip = zar < 0.52 ? 'agac' : (zar < 0.8 ? 'cali' : 'tas');
      var yer2 = yerBul(0.8, 0.8, genis, 26);
      if (!yer2) continue;
      this.susler.push({
        tip: dtip, gx: yer2.gx, gy: yer2.gy, w: 0.8, h: 0.8,
        boy: 0.85 + rnd(0.7), tohum: Math.floor(rnd(1000))
      });
    }
  },

  /* istasyon içi yayalar: market/kafe arasında gidip gelirler */
  yayaGuncelle: function (sb, dt) {
    if (!this.yayalar) this.yayalar = [];
    var hedefler = [];
    var bi = D.binalar(sb);
    for (var i = 0; i < bi.length; i++) {
      var t = bi[i].b.t;
      if (t === 'market' || t === 'kafe' || t === 'restoran' || t === 'wc' || t === 'atm' || t === 'mescit') {
        hedefler.push({ gx: bi[i].i % sb.w + 0.5, gy: Math.floor(bi[i].i / sb.w) + 0.95, t: t });
      }
    }
    if (!hedefler.length) { this.yayalar = []; return; }

    /* gece kapalıysa yaya olmasın */
    var kapali = SIM.geceKapali && SIM.geceKapali(sb);
    var hedefSayi = kapali ? 0 : Math.min(this.dusukKalite ? 2 : 6,
      1 + Math.floor(sb.kuyruk.length / 2) + Math.min(2, Math.floor(hedefler.length / 2)));
    var renkler = ['#c75f5f', '#4f7fc0', '#d1a23c', '#5aa06c', '#8e6fb0', '#c98a4b'];

    var serbest = 0;
    for (var sb2 = 0; sb2 < this.yayalar.length; sb2++) if (!this.yayalar[sb2].aracId) serbest++;
    while (serbest > hedefSayi) {
      for (var sp = this.yayalar.length - 1; sp >= 0; sp--) {
        if (!this.yayalar[sp].aracId) { this.yayalar.splice(sp, 1); serbest--; break; }
      }
      break;
    }
    while (serbest < hedefSayi) {
      serbest++;
      var h0 = hedefler[Math.floor(Math.random() * hedefler.length)];
      this.yayalar.push({
        gx: h0.gx + (Math.random() - 0.5), gy: sb.h - 0.3,
        hedef: h0, bekle: Math.random() * 3,
        renk: renkler[Math.floor(Math.random() * renkler.length)],
        faz: Math.random() * 6.28, hiz: 0.35 + Math.random() * 0.25
      });
    }

    /* otoparktaki araçlardan inen müşteriler */
    for (var pk = 0; pk < this.arabalar.length; pk++) {
      var pa = this.arabalar[pk];
      if (pa.durum !== 'parkta' || pa.yayaVar || (pa.yol && pa.yol.length) || pa.bekle) continue;
      pa.yayaVar = true;
      var hed = hedefler[Math.floor(Math.random() * hedefler.length)];
      this.yayalar.push({
        gx: pa.gx, gy: pa.gy, hedef: hed, bekle: 0,
        renk: renkler[Math.floor(Math.random() * renkler.length)],
        faz: Math.random() * 6.28, hiz: 0.4 + Math.random() * 0.2,
        aracId: pa.mid, donus: { gx: pa.gx, gy: pa.gy }, asama: 'gidiyor'
      });
    }

    for (var y = 0; y < this.yayalar.length; y++) {
      var p = this.yayalar[y];
      p.faz += dt * 7;
      if (p.bekle > 0) { p.bekle -= dt; continue; }
      var dx = p.hedef.gx - p.gx, dy = p.hedef.gy - p.gy;
      var uz = Math.sqrt(dx * dx + dy * dy);
      if (uz < 0.08) {
        if (p.aracId) {
          if (p.asama === 'gidiyor') {               /* markete vardı */
            p.asama = 'aliyor';
            p.bekle = 3 + Math.random() * 4;
            if (this.posetliMi(p.hedef)) p.poset = this.posetRenk();
            p.hedef = p.donus;
          } else {                                   /* aracına döndü */
            p.sil = true;
          }
          continue;
        }
        /* serbest yaya: yeni hedef */
        p.bekle = 1.5 + Math.random() * 4;
        if (this.posetliMi(p.hedef)) p.poset = this.posetRenk();
        if (Math.random() < 0.4) p.hedef = { gx: 0.4 + Math.random() * (sb.w - 0.8), gy: sb.h - 0.25 };
        else p.hedef = hedefler[Math.floor(Math.random() * hedefler.length)];
        continue;
      }
      var adim = Math.min(uz, p.hiz * dt);
      p.gx += dx / uz * adim;
      p.gy += dy / uz * adim;
    }
    for (var sy = this.yayalar.length - 1; sy >= 0; sy--) if (this.yayalar[sy].sil) this.yayalar.splice(sy, 1);
  },

  /* alışveriş yapılan tesisten çıkan yaya poşet taşır */
  posetliMi: function (hedef) {
    return !!(hedef && (hedef.t === 'market' || hedef.t === 'kafe' || hedef.t === 'restoran'));
  },
  posetRenk: function () {
    var r = ['#e8edf2', '#d94f78', '#f0b429', '#4f93d6', '#56b870'];
    return r[Math.floor(Math.random() * r.length)];
  },

  /* markete uğrayacak müşterinin aracı otoparka geçer */
  marketNiyeti: function (mid) {
    if (!this._marketNiyet) this._marketNiyet = {};
    this._marketNiyet[mid] = true;
  },

  /* otopark cepleri: market/kafe/restoran önünde, yoksa arsanın sağ kenarında */
  otoparkYerleri: function (sb) {
    if (this._otoparkAnahtar === sb.lok + ':' + sb.w + 'x' + sb.h + ':' + D.binalar(sb).length && this._otopark) return this._otopark;
    var yerler = [];
    var hedefBinalar = [];
    var bi = D.binalar(sb);
    for (var i = 0; i < bi.length; i++) {
      var t = bi[i].b.t;
      if (t === 'market' || t === 'kafe' || t === 'restoran') hedefBinalar.push(bi[i].i);
    }
    var ekle = function (gx, gy) {
      if (gx < 0 || gx > sb.w - 0.6 || gy < 0 || gy > sb.h - 0.4) return;
      yerler.push({ gx: gx, gy: gy });
    };
    for (var b = 0; b < hedefBinalar.length && yerler.length < 4; b++) {
      var bx = hedefBinalar[b] % sb.w, by = Math.floor(hedefBinalar[b] / sb.w);
      /* binanın ön tarafındaki hücre park cebi olur */
      var cepY = by + 1;
      if (cepY <= sb.h - 1 && !sb.yapi[cepY * sb.w + bx]) {
        ekle(bx + 0.25, cepY + 0.45);
        ekle(bx + 0.72, cepY + 0.45);
      }
    }
    if (!yerler.length) {
      /* yedek: sağ kenarda iki cep */
      ekle(sb.w - 0.75, sb.h - 0.7);
      ekle(sb.w - 0.75, sb.h - 1.25);
    }
    this._otopark = yerler;
    this._otoparkAnahtar = sb.lok + ':' + sb.w + 'x' + sb.h + ':' + D.binalar(sb).length;
    return yerler;
  },

  /* bekleme şeridindeki sıra yeri */
  beklemeYeri: function (sb, sira) {
    var kp = this.kapilar(sb);
    var bas = kp.giris + 0.75;
    var adim = 1.05;
    var gx = bas + sira * adim;
    var gy = kp.bekY;
    /* şerit taşarsa ikinci sıraya geç */
    if (gx > sb.w - 0.4) {
      var tasma = Math.floor((gx - (sb.w - 0.4)) / adim) + 1;
      gx = bas + ((sira - tasma * 2) * adim);
      gy = kp.bekY + 0.42;
      if (gx < 0.3) gx = 0.3;
    }
    return { gx: gx, gy: gy };
  },

  /* giriş/çıkış kapılarının orta noktaları */
  kapilar: function (sb) {
    var sv = (SIM.girisSeviye ? SIM.girisSeviye(sb) : 1);
    var kapiEn = 0.9 + (sv - 1) * 0.45;
    var girisX = 0.25, cikisX = sb.w - 0.25 - kapiEn;
    return {
      giris: girisX + kapiEn / 2,
      cikis: cikisX + kapiEn / 2,
      yolY: sb.h + 1.3,           /* istasyon tarafı şerit */
      agizY: sb.h + 0.95,         /* kapı ağzı */
      seritY: sb.h + 0.35,        /* apron manevra şeridi */
      bekY: sb.h + 0.68           /* bekleme şeridi (apronun kenarı) */
    };
  },

  /* müşterilere araç eşle */
  musteriArabalari: function (sb) {
    var mevcut = {};
    for (var i = 0; i < this.arabalar.length; i++) if (this.arabalar[i].mid) mevcut[this.arabalar[i].mid] = this.arabalar[i];

    var bekSira = 0;
    for (var k = 0; k < sb.kuyruk.length; k++) {
      var m = sb.kuyruk[k];
      var a = mevcut[m.id];
      if (!a) {
        a = this.arabaYap(sb, m, bekSira);
        this.arabalar.push(a);
        mevcut[m.id] = a;
      }
      a.gorunen = true;
      /* pompası olmayanlar bekleme şeridinde sıra ilerletir */
      if (m.pompa === null && a.durum !== 'gidiyor') {
        var hedefBek = this.beklemeYeri(sb, bekSira);
        if (!a.bekYeri || a.bekYeri.gx !== hedefBek.gx || a.bekYeri.gy !== hedefBek.gy) {
          a.bekYeri = hedefBek;
          var sonNokta = a.yol && a.yol.length ? a.yol[a.yol.length - 1] : null;
          if (sonNokta && Math.abs(sonNokta.gy - this.kapilar(sb).yolY) < 0.3) {
            /* henüz yoldaysa tüm rotayı koru, son durağı güncelle */
            a.yol[a.yol.length - 1] = hedefBek;
          } else if (a.gy < sb.h + 0.9) {
            a.yol = [hedefBek];                 /* içerideyse doğruca sıraya ilerle */
          } else if (!a.yol || !a.yol.length) {
            /* yolda takılı kaldıysa kapıdan içeri al */
            var kpb = this.kapilar(sb);
            a.yol = [
              { gx: kpb.giris, gy: kpb.yolY },
              { gx: kpb.giris, gy: kpb.agizY },
              { gx: kpb.giris, gy: kpb.bekY },
              hedefBek
            ];
          }
        }
        bekSira++;
      }
      /* pompaya atandıysa hedefi güncelle */
      if (m.pompa !== null && a.hedefPompa !== m.pompa) {
        a.hedefPompa = m.pompa;
        var kp = this.kapilar(sb);
        var px = m.pompa % sb.w, py = Math.floor(m.pompa / sb.w);
        var icerde = a.gy < sb.h + 0.9;           /* araç zaten istasyonun içinde mi */
        a.yol = [];
        if (!icerde) {
          a.yol.push({ gx: kp.giris, gy: kp.yolY });    /* kapı önüne yanaş */
          a.yol.push({ gx: kp.giris, gy: kp.agizY });   /* kapıdan gir */
          a.yol.push({ gx: kp.giris, gy: kp.seritY });  /* apron şeridine in */
        } else {
          a.yol.push({ gx: a.gx, gy: kp.seritY });      /* bekleme şeridinden manevra şeridine */
        }
        a.yol.push({ gx: px + 1.45, gy: kp.seritY });   /* pompanın sağına geç */
        a.yol.push({ gx: px + 1.35, gy: py + 0.82 });   /* pompa şeridine dön */
        a.yol.push({ gx: px + 0.52, gy: py + 0.82 });   /* adanın önünde paralel dur */
        a.bekYeri = null;
        a.durum = 'geliyor';
      }
    }
    /* kuyruktan çıkanlar yola çıksın */
    for (var j = 0; j < this.arabalar.length; j++) {
      var ar = this.arabalar[j];
      if (!ar.mid) continue;
      var varMi = false;
      for (var q = 0; q < sb.kuyruk.length; q++) if (sb.kuyruk[q].id === ar.mid) varMi = true;
      if (!varMi && ar.durum !== 'gidiyor' && ar.durum !== 'parkta') {
        var kp2 = this.kapilar(sb);
        /* markete uğrayacaksa önce park yerine geç */
        if (this._marketNiyet && this._marketNiyet[ar.mid]) {
          delete this._marketNiyet[ar.mid];
          var cepler = this.otoparkYerleri(sb);
          if (cepler.length) {
            var cep = cepler[Math.floor(Math.random() * cepler.length)];
            ar.durum = 'parkta';
            ar.bekle = 1.6 + Math.random() * 1.4;      /* tabancayı bırak, aracı al */
            ar.parkSuresi = 9 + Math.random() * 11;    /* markette geçen süre */
            ar.parkYeri = cep;
            ar.yol = [
              { gx: ar.gx, gy: kp2.seritY },
              { gx: cep.gx, gy: kp2.seritY },
              { gx: cep.gx, gy: cep.gy }
            ];
            ar.hiz = 1.1;
            continue;
          }
        }
        ar.durum = 'gidiyor';
        /* ödeme ve hazırlık molası: hemen fırlayıp gitmesin */
        ar.bekle = 2.2 + Math.random() * 3.2;
        ar.yol = [
          { gx: ar.gx - 0.9, gy: ar.gy },       /* adanın önünden ileri çık */
          { gx: ar.gx - 0.9, gy: kp2.seritY },  /* şeride in */
          { gx: kp2.cikis, gy: kp2.seritY },    /* çıkış hizasına git */
          { gx: kp2.cikis, gy: kp2.agizY },     /* kapıdan çık */
          { gx: kp2.cikis, gy: sb.h + 1.72 },   /* yolun ikinci şeridine katıl */
          { gx: sb.w + 7, gy: sb.h + 1.72 }
        ];
        ar.hiz = 1.5;
      }
    }
  },

  arabaYap: function (sb, m, sira) {
    var renkler = ['#d64545', '#3f7fd0', '#e0a92e', '#4aa96c', '#8a8f99', '#2f3b52', '#c96a2c', '#8e5fc0'];
    var r = renkler[Math.floor(Math.random() * renkler.length)];
    var buyuk = (m.arac === 'Tır' || m.arac === 'Otobüs');
    var kp = this.kapilar(sb);
    var baslangic = { gx: -5.5, gy: kp.yolY };
    var yol;
    if (m.pompa !== null) {
      var px = m.pompa % sb.w, py = Math.floor(m.pompa / sb.w);
      yol = [
        { gx: kp.giris, gy: kp.yolY },
        { gx: kp.giris, gy: kp.agizY },
        { gx: kp.giris, gy: kp.seritY },
        { gx: px + 1.45, gy: kp.seritY },
        { gx: px + 1.35, gy: py + 0.82 },
        { gx: px + 0.52, gy: py + 0.82 }
      ];
    } else {
      /* sırada bekleyenler istasyon içindeki bekleme şeridine girer */
      var bek = this.beklemeYeri(sb, sira);
      yol = [
        { gx: kp.giris, gy: kp.yolY },
        { gx: kp.giris, gy: kp.agizY },
        { gx: kp.giris, gy: kp.bekY },
        { gx: bek.gx, gy: bek.gy }
      ];
    }
    return {
      mid: m.id, gx: baslangic.gx, gy: baslangic.gy, aci: 0,
      renk: r, buyuk: buyuk, tip: m.arac,
      yol: yol, durum: 'geliyor', hiz: buyuk ? 1.15 : 1.5,
      hedefPompa: m.pompa, sil: false, bekle: 0
    };
  },

  cevreTrafigi: function (sb, dt) {
    var say = 0;
    for (var i = 0; i < this.arabalar.length; i++) if (!this.arabalar[i].mid) say++;
    var hedefSayi = Math.min(5, Math.round(D.lok(sb).trafik * 2 * (SIM.saatKat(D.s.saat) || 0.3)));
    if (say < hedefSayi && Math.random() < dt * 0.9) {
      var saga = Math.random() < 0.5;
      var zar = Math.random();
      var cesit, renk, buyuk = false;
      if (zar < 0.08) { cesit = 'otobus'; renk = '#2f8f5f'; buyuk = true; }
      else if (zar < 0.14) { cesit = 'tir'; renk = ['#3f7fd0', '#d64545', '#8a8f99'][Math.floor(Math.random() * 3)]; buyuk = true; }
      else if (zar < 0.2) { cesit = 'taksi'; renk = '#e8b21f'; }
      else if (zar < 0.26) { cesit = 'minibus'; renk = '#dfe3e8'; }
      else { cesit = 'oto'; renk = ['#d64545', '#3f7fd0', '#e0a92e', '#4aa96c', '#8a8f99', '#2f3b52', '#c96a2c', '#f0f2f5'][Math.floor(Math.random() * 8)]; }
      this.arabalar.push({
        mid: null, cesit: cesit,
        gx: saga ? -6 : sb.w + 6,
        gy: sb.h + (saga ? 1.72 : 2.55),
        renk: renk,
        buyuk: buyuk,
        yol: [{ gx: saga ? sb.w + 6.5 : -6.5, gy: sb.h + (saga ? 1.72 : 2.55) }],
        durum: 'gecis', hiz: (buyuk ? 1.7 : 2.4) + Math.random() * 1.3, sil: false
      });
    }
  },

  arabaIlerlet: function (a, dt) {
    if (a.bekle && a.bekle > 0) {           /* ödeme / mola */
      a.bekle -= dt;
      a.fren = true;
      return;
    }
    if (!a.yol || !a.yol.length) {
      if (a.durum === 'gidiyor') a.sil = true;
      return;
    }
    var h = a.yol[0];
    var dx = h.gx - a.gx, dy = h.gy - a.gy;
    var uz = Math.sqrt(dx * dx + dy * dy);
    if (uz < 0.05) {
      a.yol.shift();
      if (!a.yol.length) {
        if (a.durum === 'gidiyor' || a.durum === 'gecis') a.sil = true;
        else a.durum = 'park';
      }
      return;
    }
    /* hedefe yaklaşırken yavaşla (yumuşak varış) */
    var hedefHiz = a.hiz * (uz < 0.8 ? Math.max(0.28, uz / 0.8) : 1);
    a.suanHiz = (a.suanHiz === undefined) ? hedefHiz : a.suanHiz + (hedefHiz - a.suanHiz) * Math.min(1, dt * 4);
    a.fren = a.suanHiz < a.hiz * 0.7;
    var adim = Math.min(uz, a.suanHiz * dt);
    a.gx += dx / uz * adim;
    a.gy += dy / uz * adim;
    /* açıyı yumuşat */
    var yeniAci = Math.atan2(dy, dx);
    if (a.aci === undefined) a.aci = yeniAci;
    var fark = yeniAci - a.aci;
    while (fark > Math.PI) fark -= Math.PI * 2;
    while (fark < -Math.PI) fark += Math.PI * 2;
    a.aci += fark * Math.min(1, dt * 7);
  },

  /* personeli sahnede konumlandır */
  personelGuncelle: function (sb, dt) {
    this.personeller = [];
    var t = Date.now() / 1000;
    for (var i = 0; i < sb.personel.length; i++) {
      var p = sb.personel[i];
      if (p.tip === 'pompaci') {
        if (p.pompa === null || p.pompa === undefined) continue;
        var y = sb.yapi[p.pompa];
        if (!y || y.t !== 'pompa') continue;
        var px = p.pompa % sb.w, py = Math.floor(p.pompa / sb.w);
        this.personeller.push({
          gx: px + 0.88, gy: py + 0.34, renk: '#2f6fa8',
          faz: t * 3 + i, sapka: '#e24e2f', tip: 'pompaci',
          calisiyor: !!y.mesgul
        });
      } else if (p.tip === 'temizlik') {
        var d = (t * 0.12 + i * 0.37) % 1;
        var cevre = this.cevreYolu(sb, d);
        this.personeller.push({ gx: cevre.gx, gy: cevre.gy, renk: '#3ec47a', faz: t * 5 + i, sapka: '#2f9e5e', tip: 'temizlik' });
      } else if (p.tip === 'teknisyen') {
        /* en bakımsız yapının yanına gider */
        var hedef = null, enAz = 101;
        for (var k = 0; k < sb.yapi.length; k++) {
          var yy = sb.yapi[k];
          if (yy && typeof yy.bakim === 'number' && yy.bakim < enAz) { enAz = yy.bakim; hedef = k; }
        }
        if (hedef === null) continue;
        var hx = hedef % sb.w, hy = Math.floor(hedef / sb.w);
        this.personeller.push({ gx: hx + 0.12, gy: hy + 0.86, renk: '#f0b429', faz: t * 4 + i, sapka: '#f0b429', tip: 'teknisyen' });
      } else if (p.tip === 'mudur') {
        this.personeller.push({ gx: -0.35, gy: sb.h - 0.4, renk: '#9f7aea', faz: t * 2 + i, sapka: '#2f3b52', tip: 'mudur' });
      }
    }
  },

  /* istasyon çevresinde kapalı dolaşım yolu (0..1) */
  cevreYolu: function (sb, d) {
    var w = sb.w - 0.4, h = sb.h - 0.4;
    var cevre = 2 * (w + h);
    var m = d * cevre;
    if (m < w) return { gx: 0.2 + m, gy: 0.2 };
    m -= w;
    if (m < h) return { gx: 0.2 + w, gy: 0.2 + m };
    m -= h;
    if (m < w) return { gx: 0.2 + w - m, gy: 0.2 + h };
    m -= w;
    return { gx: 0.2, gy: 0.2 + h - m };
  },

  /* satış/gelir yazısı uçur */
  ucur: function (gx, gy, metin, renk) {
    var kaydir = (this.ucanlar.length % 3) * 0.26 - 0.26;
    this.ucanlar.push({ gx: gx + kaydir, gy: gy + kaydir * 0.4, metin: metin, renk: renk || '#ffd166', t: 0, taban: 52 + (this.ucanlar.length % 3) * 14 });
    if (this.ucanlar.length > 14) this.ucanlar.shift();
  },

  /* =========================================================
     SAHNE ÇİZİMİ
     ========================================================= */
  ciz: function () {
    var c = this.cz, sb = D.sube();
    if (!c) return;
    c.setTransform(this.G, 0, 0, this.G, 0, 0);
    c.clearRect(0, 0, this.en, this.boy);

    var I = this.isik();
    /* gökyüzü / zemin fonu */
    var cimTon = this.cimenPaleti()[0];
    c.fillStyle = this.gece() ? this.ton(cimTon, this.isik() * 0.9) : this.ton(cimTon, I);
    c.fillRect(0, 0, this.en, this.boy);

    this.vurus = [];
    this.vurusUst = [];
    this.isaretler = [];
    this._balonSayisi = 0;

    var cimenPal = this.cimenPaleti();
    var cimenRenk = [];
    for (var cp = 0; cp < cimenPal.length; cp++) cimenRenk.push(this.ton(cimenPal[cp], I));
    var asfalt = this.ton('#3b4149', I);
    var beton = this.ton('#9aa3ad', I);
    var toprak = this.ton('#8a7b5e', I);

    /* görünen karo aralığı: ekran köşelerinden hesapla (ekranı tamamen doldurur) */
    var k1 = this.karo(0, 0), k2 = this.karo(this.en, 0),
        k3 = this.karo(0, this.boy), k4 = this.karo(this.en, this.boy);
    var gxl = [k1.gx, k2.gx, k3.gx, k4.gx], gyl = [k1.gy, k2.gy, k3.gy, k4.gy];
    var minGX = Math.floor(Math.min.apply(null, gxl)) - 1;
    var maxGX = Math.ceil(Math.max.apply(null, gxl)) + 1;
    var minGY = Math.floor(Math.min.apply(null, gyl)) - 1;
    var maxGY = Math.ceil(Math.max.apply(null, gyl)) + 1;
    /* güvenlik sınırı: çok uzaklaşınca kare sayısı patlamasın */
    if ((maxGX - minGX) * (maxGY - minGY) > 2600) {
      var mx = (minGX + maxGX) / 2, my = (minGY + maxGY) / 2;
      minGX = Math.floor(mx - 25); maxGX = Math.ceil(mx + 25);
      minGY = Math.floor(my - 25); maxGY = Math.ceil(my + 25);
    }
    var bas = minGX, son = maxGX;

    /* ---- zemin: önbellekten tek seferde ---- */
    if (!this.zeminBlit(sb, I)) {
      this.zeminCiz(sb, minGX, maxGX, minGY, maxGY, cimenRenk, asfalt, beton, toprak, I);
      this.yolCizgileri(sb);
    }

    /* ---- nesneler: derinlik sırasına göre ---- */
    var liste = [];
    for (var i = 0; i < sb.yapi.length; i++) {
      if (!sb.yapi[i]) continue;
      var x = i % sb.w, y = Math.floor(i / sb.w);
      /* derinlik anahtarı: yapının oturduğu alanın ortası (köşesi değil) */
      liste.push({ d: x + y + (sb.yapi[i].t === 'pompa' ? 0.89 : 1), tur: 'yapi', i: i, gx: x, gy: y });
    }
    /* görüş penceresi: dışarıdaki süsler hiç çizilmesin (kasmayı önler) */
    var pay = 2.5;
    for (var s2 = 0; s2 < (this.susler || []).length; s2++) {
      var su = this.susler[s2];
      if (su.gx + (su.w || 1) < minGX - pay || su.gx > maxGX + pay) continue;
      if (su.gy + (su.h || 1) < minGY - pay || su.gy > maxGY + pay) continue;
      liste.push({ d: su.gx + su.gy + ((su.w || 1) + (su.h || 1)) / 2, tur: 'sus', s: su, gx: su.gx, gy: su.gy });
    }
    for (var pr = 0; pr < (this.personeller || []).length; pr++) {
      var pp = this.personeller[pr];
      liste.push({ d: pp.gx + pp.gy + 0.02, tur: 'insan', p: pp, gx: pp.gx, gy: pp.gy });
    }
    for (var yy = 0; yy < (this.yayalar || []).length; yy++) {
      var yp = this.yayalar[yy];
      liste.push({ d: yp.gx + yp.gy + 0.03, tur: 'yaya', p: yp, gx: yp.gx, gy: yp.gy });
    }
    for (var a2 = 0; a2 < this.arabalar.length; a2++) {
      var ar = this.arabalar[a2];
      if (ar.gx < minGX - pay || ar.gx > maxGX + pay || ar.gy < minGY - pay || ar.gy > maxGY + pay) continue;
      liste.push({ d: ar.gx + ar.gy, tur: 'araba', a: ar, gx: ar.gx, gy: ar.gy });
    }
    if (this.derinlikDuzelt) this.derinlikDuzelt(sb, liste);
    liste.sort(function (p, q) { return p.d - q.d; });

    for (var n = 0; n < liste.length; n++) {
      var o = liste[n];
      if (o.tur === 'yapi') this.yapiCiz(sb, o.i, o.gx, o.gy);
      else if (o.tur === 'sus') this.susCiz(o.s);
      else if (o.tur === 'insan') this.insanModel(o.p, o.p.sapka);
      else if (o.tur === 'yaya') this.insanModel(o.p, null);
      else if (o.tur === 'ozel') o.ciz.call(this);
      else this.arabaCiz(o.a);
    }

    /* işaret katmanı: binalar arkada kalsa da müşteri hep görünür */
    for (var is = 0; is < this.isaretler.length; is++) {
      var ii = this.isaretler[is];
      if (ii.tip === 'bekleyen') this.bekleyenHalka(ii.gx, ii.gy, ii.m, ii.balon, ii.i);
      else this.uyariIsareti(ii.gx, ii.gy, ii.z, ii.renk, '!');
    }

    /* gece kapalı uyarısı */
    if (SIM.geceKapali && SIM.geceKapali(sb)) this.kapaliTabela(sb);

    /* hava olayları */
    this.havaCiz();

    /* uçan yazılar */
    this.ucanCiz();
  },

  /* zemin karolarını doğrudan çiz */
  cimenPaleti: function () {
    var sezon = VERI.sezonSira[D.s.sezonIdx];
    if (sezon === 'kis') return ['#d8e3e8', '#d2dee4', '#dce7eb', '#cfdbe2', '#e2ecef'];
    if (sezon === 'sonbahar') return ['#8a9a4e', '#93a254', '#849447', '#9aa85c', '#8f9e52'];
    if (sezon === 'ilkbahar') return ['#73b857', '#6fb453', '#79bd5c', '#6cb050', '#7dc061'];
    return ['#6ca950', '#69a54d', '#70ad54', '#67a24b', '#6eab52'];
  },

  zeminCiz: function (sb, minGX, maxGX, minGY, maxGY, cimenRenk, asfalt, beton, toprak, I) {
    for (var t = minGX + minGY; t <= maxGX + maxGY; t++) {
      var gxBas = Math.max(minGX, t - maxGY), gxSon = Math.min(maxGX, t - minGY);
      for (var gx = gxBas; gx <= gxSon; gx++) {
        var gy = t - gx;
        var ic = (gx >= 0 && gx < sb.w && gy >= 0 && gy < sb.h);
        var yolMu = (gy >= sb.h + 1 && gy <= sb.h + 2 + (SIM.yolEk ? SIM.yolEk(sb) : 0));
        var sv0 = (SIM.girisSeviye ? SIM.girisSeviye(sb) : 1);
        var yan = sv0;                               /* her seviye bir karo daha yanlara */
        var onluk = (gy === sb.h && gx >= -yan && gx < sb.w + yan);
        var renk, cimMi = false;
        if (yolMu) renk = asfalt;
        else if (onluk) renk = beton;
        else if (ic) renk = sb.beton[gy * sb.w + gx] ? beton : toprak;
        else { renk = cimenRenk[Math.floor(this.karoRast(gx, gy, 7) * cimenRenk.length) % cimenRenk.length]; cimMi = true; }
        this.zemin(gx, gy, renk, null);
        if (cimMi) this.cimenBenek(gx, gy, I);
        if (ic && !sb.beton[gy * sb.w + gx] && (gx + gy) % 3 === 0) this.satilikTabela(gx, gy);
      }
    }
    this.istasyonDuzeni(sb, I);
  },

  /* istasyon önü: bordür, giriş-çıkış kapıları, yön okları, şerit çizgileri */
  istasyonDuzeni: function (sb, I) {
    var c = this.cz, o = this.kam.olcek;
    var sv = (SIM.girisSeviye ? SIM.girisSeviye(sb) : 1);
    var kapiEn = 0.9 + (sv - 1) * 0.45;                 /* kapı genişliği (karo) */
    var girisX = 0.25, cikisX = sb.w - 0.25 - kapiEn;   /* sol giriş, sağ çıkış */
    var onY = sb.h;                                     /* apron satırı */

    /* --- kapı rampaları: apron ile yol arasındaki banket --- */
    var rampaRenk = this.ton('#9aa3ad', I);
    function rampa(x1r, x2r) {
      var a = IZO.ekran(x1r, onY + 0.94, 0.2), b = IZO.ekran(x2r, onY + 0.94, 0.2);
      var d2 = IZO.ekran(x2r + 0.1, onY + 1.0, 0.2), e2 = IZO.ekran(x1r - 0.1, onY + 1.0, 0.2);
      IZO.cokgen([a, b, d2, e2], rampaRenk);
    }
    rampa(girisX - 0.1, girisX + kapiEn + 0.1);
    rampa(cikisX - 0.1, cikisX + kapiEn + 0.1);

    /* --- bordür: ön kenarda kapı boşlukları hariç --- */
    var bordurRenk = '#d7dde4';
    var parcalar = [];
    if (girisX > 0) parcalar.push([0, girisX]);
    if (cikisX > girisX + kapiEn) parcalar.push([girisX + kapiEn, cikisX]);
    if (cikisX + kapiEn < sb.w) parcalar.push([cikisX + kapiEn, sb.w]);
    for (var p = 0; p < parcalar.length; p++) {
      var x1 = parcalar[p][0], x2 = parcalar[p][1];
      if (x2 - x1 < 0.05) continue;
      this.kutu(x1, onY + 0.94, 0, x2 - x1, 0.1, 3.5, bordurRenk);
    }
    /* yan bordürler */
    this.kutu(-0.06, -0.06, 0, 0.1, sb.h + 1.02, 3.5, bordurRenk);
    this.kutu(sb.w - 0.04, -0.06, 0, 0.1, sb.h + 1.02, 3.5, bordurRenk);
    this.kutu(-0.06, -0.06, 0, sb.w + 0.1, 0.1, 3.5, bordurRenk);

    /* --- kapı yaklaşma şeritleri --- */
    var sarі = this.ton('#e8c44a', I);
    function serit(xBas, xSon, yv, renk, kalin) {
      var a = IZO.ekran(xBas, yv, 0.6), b = IZO.ekran(xSon, yv, 0.6);
      c.strokeStyle = renk;
      c.lineWidth = Math.max(1, (kalin || 1.4) * o);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    /* kapı ağızlarında beyaz kılavuz */
    serit(girisX, girisX + kapiEn, onY + 0.98, 'rgba(240,246,250,.85)', 2);
    serit(cikisX, cikisX + kapiEn, onY + 0.98, 'rgba(240,246,250,.85)', 2);

    /* --- yön okları --- */
    this.yonOku(girisX + kapiEn / 2, onY + 0.45, 1, '#5ad17e', o);     /* içeri */
    this.yonOku(cikisX + kapiEn / 2, onY + 0.45, -1, '#f0b429', o);    /* dışarı */

    /* --- kapı direkleri + tabelalar --- */
    /* köşede tabela varsa levha onunla üst üste binmesin */
    var kosede = function (x) {
      var L = sb.disTotemler || [];
      for (var q = 0; q < L.length; q++) if (L[q].x === x && L[q].y === sb.h) return true;
      return false;
    };
    if (!kosede(-1)) this.kapiDiregi(girisX - 0.22, onY + 0.95, 'GİRİŞ', '#2f9e5e', I);
    if (!kosede(sb.w)) this.kapiDiregi(cikisX + kapiEn + 0.12, onY + 0.95, 'ÇIKIŞ', '#d9843a', I);

    /* --- otopark cepleri --- */
    var cepler = this.otoparkYerleri(sb);
    for (var pc = 0; pc < cepler.length; pc++) {
      var cp2 = cepler[pc];
      c.strokeStyle = 'rgba(240,246,250,.55)';
      c.lineWidth = Math.max(1, 1.3 * o);
      var k1 = this.ekran(cp2.gx - 0.2, cp2.gy - 0.26, 0.4);
      var k2 = this.ekran(cp2.gx - 0.2, cp2.gy + 0.26, 0.4);
      var k3 = this.ekran(cp2.gx + 0.2, cp2.gy + 0.26, 0.4);
      var k4 = this.ekran(cp2.gx + 0.2, cp2.gy - 0.26, 0.4);
      c.beginPath();
      c.moveTo(k1.x, k1.y); c.lineTo(k2.x, k2.y); c.lineTo(k3.x, k3.y); c.lineTo(k4.x, k4.y);
      c.stroke();
      if (o > 0.6) {
        var pp2 = this.ekran(cp2.gx, cp2.gy, 0.4);
        c.fillStyle = 'rgba(240,246,250,.4)';
        c.font = 'bold ' + Math.round(7 * o) + 'px sans-serif';
        c.textAlign = 'center';
        c.fillText('P', pp2.x, pp2.y + 2 * o);
      }
    }

    /* --- orta refüj (iki kapı arası) --- */
    if (cikisX - (girisX + kapiEn) > 0.6) {
      var rx = girisX + kapiEn + 0.16, rw = cikisX - girisX - kapiEn - 0.32;
      this.kutu(rx, onY + 0.92, 0, rw, 0.12, 3, '#cfd6dd');
      /* refüjde çalılar */
      var adetC = Math.max(1, Math.round(rw / 0.55));
      for (var ci = 0; ci < adetC; ci++) {
        var cp = this.ekran(rx + rw * ((ci + 0.5) / adetC), onY + 0.98, 3);
        c.fillStyle = this.ton('#4e8f45', I);
        c.beginPath(); c.arc(cp.x, cp.y - 1.5 * o, 3.6 * o, 0, Math.PI * 2); c.fill();
        c.fillStyle = this.ton('#5ea254', I * 1.1);
        c.beginPath(); c.arc(cp.x - 1.1 * o, cp.y - 2.6 * o, 2.3 * o, 0, Math.PI * 2); c.fill();
      }
    }
  },

  yonOku: function (gx, gy, yon, renk, o) {
    var c = this.cz;
    var u = this.ekran(gx, gy - 0.3 * yon, 0.8);
    var a = this.ekran(gx - 0.17, gy + 0.12 * yon, 0.8);
    var b = this.ekran(gx + 0.17, gy + 0.12 * yon, 0.8);
    c.fillStyle = renk;
    c.globalAlpha = 0.85;
    c.beginPath();
    c.moveTo(u.x, u.y); c.lineTo(a.x, a.y); c.lineTo(b.x, b.y);
    c.closePath(); c.fill();
    c.globalAlpha = 1;
  },

  kapiDiregi: function (gx, gy, yazi, renk, I) {
    var c = this.cz, o = this.kam.olcek;
    this.kutu(gx, gy, 0, 0.1, 0.1, 26, '#b9c1c9');
    var p = this.ekran(gx + 0.05, gy + 0.05, 26);
    var w = Math.max(20, c.measureText(yazi).width + 12 * o);
    c.font = 'bold ' + Math.round(7 * o) + 'px sans-serif';
    w = c.measureText(yazi).width + 9 * o;
    this.yuvarlakKutu(p.x - w / 2, p.y - 11 * o, w, 11 * o, 3 * o);
    c.fillStyle = this.ton(renk, Math.max(I, 0.8));
    c.fill();
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.fillText(yazi, p.x, p.y - 3 * o);
  },

  /* ---- zemin önbelleği: karolar her karede yeniden çizilmez ---- */
  zeminAnahtar: function (sb, I) {
    var b = 0;
    for (var i = 0; i < sb.beton.length; i++) if (sb.beton[i]) b += (i + 1) * 7;
    return [sb.lok, sb.w, sb.h, b, sb.giris || 1, sb.yol || 1, (sb.disTotemler || []).map(function (t) { return t.x + '.' + t.y; }).join('_'), D.binalar(sb).length, D.s.sezonIdx, Math.round(I * 12)].join('|');
  },

  zeminHazirla: function (sb, I) {
    var anahtar = this.zeminAnahtar(sb, I);
    if (this._zOnbellek && this._zAnahtar === anahtar) return this._zOnbellek;
    if (this._zDestekYok) return null;

    /* önbellek 0.75 ölçekte üretilir: bellek dörtte bir, görüntü farkı yok denecek kadar az */
    var kalite = 0.75;
    var paylar = [16, 12, 9, 6, 4];
    var tv, tc, secilen = null;
    for (var pi = 0; pi < paylar.length; pi++) {
      var pay = paylar[pi];
      var minGX = -pay, maxGX = sb.w + pay, minGY = -pay, maxGY = sb.h + pay;
      var k1 = this.izo(minGX, minGY), k2 = this.izo(maxGX + 1, minGY),
          k3 = this.izo(minGX, maxGY + 1), k4 = this.izo(maxGX + 1, maxGY + 1);
      var x0 = (Math.min(k1.x, k2.x, k3.x, k4.x) - 4) * kalite;
      var x1 = (Math.max(k1.x, k2.x, k3.x, k4.x) + 4) * kalite;
      var y0 = (Math.min(k1.y, k2.y, k3.y, k4.y) - 4) * kalite;
      var y1 = (Math.max(k1.y, k2.y, k3.y, k4.y) + 4) * kalite;
      var en = Math.ceil(x1 - x0), boy = Math.ceil(y1 - y0);
      if (en > 0 && boy > 0 && en * boy <= 7.5e6) {
        secilen = { pay: pay, x0: x0, y0: y0, en: en, boy: boy,
                    minGX: minGX, maxGX: maxGX, minGY: minGY, maxGY: maxGY };
        break;
      }
    }
    if (!secilen) { this._zDestekYok = true; return null; }

    try { tv = document.createElement('canvas'); } catch (e) { tv = null; }
    if (!tv || !tv.getContext) { this._zDestekYok = true; return null; }
    tv.width = secilen.en; tv.height = secilen.boy;
    tc = tv.getContext('2d');
    if (!tc) { this._zDestekYok = true; return null; }

    var eskiCz = this.cz, eskiKam = this.kam;
    this.cz = tc;
    this.kam = { x: -secilen.x0, y: -secilen.y0, olcek: kalite,
                 hx: -secilen.x0, hy: -secilen.y0, holcek: kalite, vx: 0, vy: 0, kuruldu: true };
    try {
      var cimenPal = this.cimenPaleti();
      var cimenRenk = [];
      for (var cp = 0; cp < cimenPal.length; cp++) cimenRenk.push(this.ton(cimenPal[cp], I));
      this.zeminCiz(sb, secilen.minGX, secilen.maxGX, secilen.minGY, secilen.maxGY, cimenRenk,
        this.ton('#3b4149', I), this.ton('#9aa3ad', I), this.ton('#8a7b5e', I), I);
      this.yolCizgileri(sb);
    } catch (e) {
      this.cz = eskiCz; this.kam = eskiKam; this._zDestekYok = true;
      this._zHata = (e && e.message) ? e.message : String(e);
      return null;
    }
    this.cz = eskiCz; this.kam = eskiKam;

    this._zOnbellek = {
      tuval: tv, x0: secilen.x0, y0: secilen.y0,
      en: secilen.en, boy: secilen.boy, kalite: kalite
    };
    this._zAnahtar = anahtar;
    return this._zOnbellek;
  },

  zeminBlit: function (sb, I) {
    var o = this.zeminHazirla(sb, I);
    if (!o) return false;
    var c = this.cz, k = this.kam;
    /* önbellek kendi ölçeğinde: ekran ölçeğine oranla yerleştir */
    var oran = k.olcek / o.kalite;
    var hx = o.x0 * oran + k.x, hy = o.y0 * oran + k.y;
    var hw = o.en * oran, hh = o.boy * oran;
    var kx1 = Math.max(0, -hx), ky1 = Math.max(0, -hy);
    var kx2 = Math.min(hw, this.en - hx), ky2 = Math.min(hh, this.boy - hy);
    if (kx2 <= kx1 || ky2 <= ky1) return true;
    var sx = kx1 / oran, sy = ky1 / oran;
    var sw = (kx2 - kx1) / oran, sh = (ky2 - ky1) / oran;
    c.drawImage(o.tuval, sx, sy, sw, sh, hx + kx1, hy + ky1, kx2 - kx1, ky2 - ky1);
    return true;
  },

  /* çimende yaprak / çiçek / taşçık benekleri — sabit konumlu */
  cimenBenek: function (gx, gy, I) {
    if (this.kam.olcek < 0.5 || this.dusukKalite) return;
    var sezon = VERI.sezonSira[D.s.sezonIdx];
    var adet = this.karoRast(gx, gy, 11) < 0.52 ? 0 : (this.karoRast(gx, gy, 12) < 0.6 ? 1 : 2);
    if (!adet) return;
    var c = this.cz;
    for (var i = 0; i < adet; i++) {
      var rx = this.karoRast(gx, gy, 21 + i), ry = this.karoRast(gx, gy, 31 + i);
      var tur = this.karoRast(gx, gy, 41 + i);
      var p = this.ekran(gx + 0.15 + rx * 0.7, gy + 0.15 + ry * 0.7, 0);
      var renk;
      if (sezon === 'kis') renk = '#e8eef2';
      else if (sezon === 'sonbahar') renk = tur < 0.5 ? '#c2622c' : '#d89a3a';
      else if (sezon === 'ilkbahar') renk = tur < 0.35 ? '#e8e0f5' : (tur < 0.7 ? '#f2d26b' : '#4f8f42');
      else renk = tur < 0.3 ? '#58934a' : '#8cc46a';
      c.fillStyle = this.ton(renk, I);
      var r = (tur < 0.25 ? 1.6 : 1.1) * this.kam.olcek;
      c.beginPath();
      c.ellipse(p.x, p.y, r * 1.5, r, 0, 0, Math.PI * 2);
      c.fill();
    }
  },

  kapaliTabela: function (sb) {
    var c = this.cz;
    var p = this.ekran((sb.w - 1) / 2, (sb.h - 1) / 2, 70);
    var o = this.kam.olcek;
    var w = 86 * o, h = 26 * o;
    c.fillStyle = 'rgba(12,18,30,.88)';
    this.yuvarlakKutu(p.x - w / 2, p.y - h / 2, w, h, 9 * o);
    c.fill();
    c.strokeStyle = 'rgba(240,82,82,.75)';
    c.lineWidth = Math.max(1, 1.6 * o);
    c.stroke();
    c.fillStyle = '#f7a8a8';
    c.font = 'bold ' + Math.round(11 * o) + 'px sans-serif';
    c.textAlign = 'center';
    c.fillText('🌙 KAPALI', p.x, p.y + 4 * o);
  },

  /* yağmur / kar tanecikleri — ekran uzayında, ucuz */
  havaCiz: function () {
    var sezon = VERI.sezonSira[D.s.sezonIdx];
    var kar = sezon === 'kis';
    var yagmur = sezon === 'sonbahar' || sezon === 'ilkbahar';
    if (!kar && !yagmur) { this._hava = null; return; }
    var c = this.cz;
    var adet = kar ? 60 : 70;
    if (!this._hava || this._hava.length !== adet || this._havaTur !== sezon) {
      this._hava = [];
      this._havaTur = sezon;
      for (var i = 0; i < adet; i++) {
        this._hava.push({
          x: Math.random(), y: Math.random(),
          h: kar ? 0.10 + Math.random() * 0.12 : 0.55 + Math.random() * 0.45,
          s: Math.random() * 6.28, r: kar ? 1.2 + Math.random() * 1.4 : 1
        });
      }
    }
    var t = Date.now() / 1000;
    c.save();
    if (kar) {
      c.fillStyle = 'rgba(255,255,255,.75)';
      for (var k = 0; k < this._hava.length; k++) {
        var p = this._hava[k];
        var py = ((p.y + t * p.h * 0.12) % 1) * this.boy;
        var px = (p.x * this.en + Math.sin(t * 0.7 + p.s) * 16) % this.en;
        c.beginPath(); c.arc(px, py, p.r, 0, Math.PI * 2); c.fill();
      }
    } else {
      c.strokeStyle = 'rgba(190,215,240,.42)';
      c.lineWidth = 1.1;
      for (var y2 = 0; y2 < this._hava.length; y2++) {
        var q = this._hava[y2];
        var qy = ((q.y + t * q.h * 0.55) % 1) * this.boy;
        var qx = (q.x * this.en + qy * 0.14) % this.en;
        c.beginPath(); c.moveTo(qx, qy); c.lineTo(qx - 2.2, qy + 11); c.stroke();
      }
    }
    c.restore();
  },

  satilikTabela: function (gx, gy) {
    var p = this.ekran(gx + 0.5, gy + 0.5, 0);
    var c = this.cz;
    c.globalAlpha = 0.42;
    c.fillStyle = '#ffffff';
    c.font = Math.round(8.5 * this.kam.olcek) + 'px sans-serif';
    c.textAlign = 'center';
    c.fillText('satılık', p.x, p.y + 3);
    c.globalAlpha = 1;
  },

  yolCizgileri: function (sb) {
    var c = this.cz, I = this.isik();
    var ek = (SIM.yolEk ? SIM.yolEk(sb) : 0);
    var ust = sb.h + 1, alt = sb.h + 3 + ek;     /* asfalt bandı */
    var orta = sb.h + 2 + ek / 2;                 /* refüj ekseni */
    var yari = 1 + ek / 2, serit = 2 + ek;        /* yön başına genişlik ve şerit sayısı */

    /* kenar beyaz sürekli çizgiler */
    function cizgi(yv, renk, kalin, kesik) {
      var a = IZO.ekran(-14, yv, 0.4), b = IZO.ekran(sb.w + 15, yv, 0.4);
      c.strokeStyle = renk;
      c.lineWidth = Math.max(1, kalin * IZO.kam.olcek);
      if (kesik) {
        var toplam = Math.hypot(b.x - a.x, b.y - a.y);
        c.setLineDash([12 * IZO.kam.olcek, 10 * IZO.kam.olcek]);
      }
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      c.setLineDash([]);
    }
    var beyaz = this.ton('#e8edf2', I);
    cizgi(ust + 0.06, beyaz, 1.4, false);         /* dış kenar (istasyon tarafı) */
    cizgi(alt - 0.06, beyaz, 1.4, false);         /* dış kenar (karşı taraf) */
    for (var sr = 1; sr < serit; sr++) {
      cizgi(ust + 0.08 + (yari - 0.22) * sr / serit, beyaz, 1.2, true);      /* yakın yön şerit ayraçları */
      cizgi(orta + 0.14 + (yari - 0.22) * sr / serit, beyaz, 1.2, true);     /* uzak yön şerit ayraçları */
    }

    /* refüj: iki sarı çizgi arası beton ada + yeşillik */
    this.kutu(-14, orta - 0.12, 0, sb.w + 29, 0.24, 2.5, '#c9d0d8');
    var sari = this.ton('#e8c44a', I);
    cizgi(orta - 0.14, sari, 1.5, false);
    cizgi(orta + 0.14, sari, 1.5, false);
    /* refüj çalıları */
    for (var gx = -12; gx < sb.w + 13; gx += 2.4) {
      var p = this.ekran(gx, orta, 2.5);
      var r = 5.2 * this.kam.olcek;
      c.fillStyle = 'rgba(20,32,18,.18)';
      c.beginPath(); c.ellipse(p.x, p.y, r * 1.1, r * 0.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = this.ton('#45853d', I);
      c.beginPath(); c.arc(p.x, p.y - r * 0.55, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = this.ton('#5ea254', I * 1.12);
      c.beginPath(); c.arc(p.x - r * 0.3, p.y - r * 0.9, r * 0.62, 0, Math.PI * 2); c.fill();
    }
  },

  /* =========================================================
     YAPI MODELLERİ
     ========================================================= */
  yapiCiz: function (sb, i, gx, gy) {
    var y = sb.yapi[i];
    if (!y) return;
    if (y.t === 'pompa') this.pompaCiz(sb, i, gx, gy, y);
    else this.binaCiz(sb, i, gx, gy, y);
    if (y.arizali) this.isaretler.push({ tip: 'uyari', gx: gx + 0.5, gy: gy + 0.35, z: 58, renk: '#f05252' });
    else if (y.bakim < 45) this.isaretler.push({ tip: 'uyari', gx: gx + 0.5, gy: gy + 0.35, z: 58, renk: '#f0b429' });
  },

  pompaCiz: function (sb, i, gx, gy, p) {
    var yk = VERI.yakitlar[p.yakit];
    var I = this.isik();
    /* ada (beton kaide) */
    this.golge(gx + 0.18, gy + 0.22, 0.64, 0.32, 0.26);
    this.kutu(gx + 0.17, gy + 0.22, 0, 0.66, 0.34, 3, '#b9c1c9', { tip: 'hucre', i: i });
    /* gövde */
    var govde = p.yakit === 'ev' ? '#2f6fa8' : '#e2683a';
    this.kutu(gx + 0.24, gy + 0.26, 3, 0.22, 0.22, 26, govde, { tip: 'hucre', i: i });
    /* ekran paneli */
    this.kutu(gx + 0.26, gy + 0.24, 16, 0.18, 0.03, 9, this.gece() ? '#9ef0b5' : '#eef3f7');
    /* tabanca kolu */
    this.kutu(gx + 0.48, gy + 0.3, 14, 0.04, 0.04, 4, '#58606b');
    /* ikinci sütun (çok tabancalı) */
    if (p.yakit === 'benzin' || p.yakit === 'dizel') {
      this.kutu(gx + 0.56, gy + 0.26, 3, 0.2, 0.22, 24, govde, { tip: 'hucre', i: i });
      this.kutu(gx + 0.58, gy + 0.24, 15, 0.16, 0.03, 8, this.gece() ? '#9ef0b5' : '#eef3f7');
    }
    /* kanopi: direk + çatı */
    var catiH = 52 + (p.sv - 1) * 2;
    this.kutu(gx + 0.18, gy + 0.2, 3, 0.055, 0.055, catiH, '#cfd6dd');
    this.kutu(gx + 0.76, gy + 0.2, 3, 0.055, 0.055, catiH, '#cfd6dd');
    var st2 = this.tabelaStili();
    var catiRenk = st2.kanopi ? st2.pano
      : (p.yakit === 'ev' ? '#3f8ccc' : (p.yakit === 'lpg' ? '#3ec47a' : '#2f9e5e'));
    this.kutu(gx + 0.13, gy + 0.14, catiH + 3, 0.72, 0.46, 6, catiRenk, { tip: 'hucre', i: i });
    /* seviye şeridi */
    if (p.sv > 1) {
      var sp = this.ekran(gx + 0.5, gy + 0.3, catiH + 12);
      var c = this.cz;
      c.fillStyle = '#ffd166';
      c.font = 'bold ' + Math.round(9 * this.kam.olcek) + 'px sans-serif';
      c.textAlign = 'center';
      c.fillText('sv' + p.sv, sp.x, sp.y);
    }
    /* bekleyen müşteri halkası + hortum */
    if (p.mesgul) {
      var m = SIM.musteriBul(sb, p.mesgul);
      if (m && (m.durum === 'pompada' || m.durum === 'servis')) {
        if (m.durum === 'pompada') {
          this._balonSayisi = (this._balonSayisi || 0) + 1;
          this.isaretler.push({ tip: 'bekleyen', gx: gx + 0.5, gy: gy + 0.5, m: m, balon: this._balonSayisi <= 2, i: i });
        }
        this.hortumCiz(gx, gy, p, m);
        this.dolumGostergesi(gx, gy, m);
      }
    }
    /* gece aydınlatması */
    if (this.gece()) this.isikHuzmesi(gx + 0.5, gy + 0.3, catiH);
  },

  /* marka tabelası (totem) — oyuncunun tasarımına göre */
  tabelaStili: function () {
    var t = (D.s && D.s.tabela) || {};
    var r = null;
    for (var i = 0; i < VERI.tabelaRenkleri.length; i++) if (VERI.tabelaRenkleri[i].id === t.renk) r = VERI.tabelaRenkleri[i];
    if (!r) r = VERI.tabelaRenkleri[0];
    return {
      ad: (t.ad || 'PETROL').toUpperCase(),
      logo: t.logo || '⛽',
      sekil: t.sekil || 'klasik',
      pano: r.pano, yazi: r.yazi,
      fiyat: t.fiyat !== false,
      kanopi: !!t.kanopi
    };
  },

  totemCiz: function (gx, gy, i, b) {
    var st = this.tabelaStili();
    var c = this.cz, o = this.kam.olcek, I = this.isik(), gece = this.gece();
    var sb = D.sube();

    /* şekle göre ölçüler (ekran pikseli, zoom ile ölçeklenir) */
    var ol = {
      klasik: { direk: 56, en: 54, bas: 20, satir: 15, kalinlik: 0.12 },
      genis:  { direk: 34, en: 76, bas: 24, satir: 16, kalinlik: 0.14 },
      kule:   { direk: 84, en: 44, bas: 17, satir: 13, kalinlik: 0.10 },
      tente:  { direk: 22, en: 70, bas: 22, satir: 15, kalinlik: 0.14 }
    }[st.sekil] || { direk: 56, en: 54, bas: 20, satir: 15, kalinlik: 0.12 };

    /* --- direk ve kaide (izometrik) --- */
    this.golge(gx + 0.3, gy + 0.3, 0.4, 0.4, 0.32);
    this.kutu(gx + 0.3, gy + 0.3, 0, 0.4, 0.4, 4, '#b9c1c9', { tip: 'hucre', i: i });
    this.kutu(gx + 0.44, gy + 0.44, 4, ol.kalinlik, ol.kalinlik, ol.direk, '#9aa4b0');
    if (st.sekil === 'genis') this.kutu(gx + 0.2, gy + 0.44, 4, ol.kalinlik, ol.kalinlik, ol.direk, '#9aa4b0');

    /* --- pano (ekrana dönük levha) --- */
    var taban = this.ekran(gx + 0.5, gy + 0.5, 4 + ol.direk);
    var yakitlar = [];
    ['benzin', 'dizel', 'lpg', 'ev'].forEach(function (y) {
      if (sb.tank[y] || y === 'ev') {
        if (y === 'ev' && !SIM.yakitVar(sb, 'ev')) return;
        yakitlar.push(y);
      }
    });
    if (!st.fiyat) yakitlar = [];

    var W = ol.en * o;
    var basH = ol.bas * o;
    var satirH = ol.satir * o;
    var ic = 3 * o;
    var H = basH + (yakitlar.length ? yakitlar.length * satirH + ic * 2 : ic);
    var x0 = taban.x - W / 2, y0 = taban.y - H;

    /* gece halesi */
    if (gece) {
      var hg = c.createRadialGradient(taban.x, y0 + H / 2, 0, taban.x, y0 + H / 2, W * 1.5);
      hg.addColorStop(0, 'rgba(255,240,205,.26)');
      hg.addColorStop(1, 'rgba(255,240,205,0)');
      c.fillStyle = hg;
      c.beginPath(); c.arc(taban.x, y0 + H / 2, W * 1.5, 0, Math.PI * 2); c.fill();
    }

    /* dış çerçeve (metalik) */
    c.save();
    c.shadowColor = 'rgba(0,0,0,.45)';
    c.shadowBlur = 8 * o;
    c.shadowOffsetY = 3 * o;
    this.yuvarlakKutu(x0 - 2 * o, y0 - 2 * o, W + 4 * o, H + 4 * o, 4 * o);
    c.fillStyle = gece ? '#e8eef4' : this.ton('#e8eef4', Math.max(I, 0.72));
    c.fill();
    c.restore();

    /* marka başlığı */
    var basRenk = gece ? st.pano : this.ton(st.pano, Math.max(I, 0.78));
    this.yuvarlakKutu(x0, y0, W, basH, 3 * o);
    c.fillStyle = basRenk;
    c.fill();
    /* başlık parlaması */
    var pg = c.createLinearGradient(x0, y0, x0, y0 + basH);
    pg.addColorStop(0, 'rgba(255,255,255,.22)');
    pg.addColorStop(0.5, 'rgba(255,255,255,0)');
    c.fillStyle = pg;
    this.yuvarlakKutu(x0, y0, W, basH, 3 * o);
    c.fill();

    if (o > 0.4) {
      var ad = st.ad;
      var yaziB = Math.min(basH * 0.56, W / Math.max(5, ad.length) * 1.5);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = gece ? st.yazi : this.ton(st.yazi, Math.max(I, 0.85));
      c.font = 'bold ' + Math.round(yaziB) + 'px sans-serif';
      while (c.measureText(st.logo + ' ' + ad).width > W - 6 * o && yaziB > 4) {
        yaziB -= 0.5;
        c.font = 'bold ' + Math.round(yaziB) + 'px sans-serif';
      }
      c.fillText(st.logo + ' ' + ad, taban.x, y0 + basH / 2 + 0.5 * o);
    }

    /* fiyat paneli (LED görünümü) */
    if (yakitlar.length) {
      var py = y0 + basH + ic * 0.4;
      var pH = yakitlar.length * satirH + ic;
      this.yuvarlakKutu(x0 + ic * 0.6, py, W - ic * 1.2, pH, 2.5 * o);
      c.fillStyle = gece ? '#06090f' : '#121922';
      c.fill();

      if (o > 0.4) {
        c.textBaseline = 'middle';
        for (var k = 0; k < yakitlar.length; k++) {
          var yk = yakitlar[k];
          var sy = py + ic * 0.5 + satirH * (k + 0.5);
          /* yakıt kısaltması */
          c.textAlign = 'left';
          c.font = 'bold ' + Math.round(satirH * 0.52) + 'px sans-serif';
          c.fillStyle = VERI.yakitlar[yk].renk;
          c.fillText(VERI.yakitlar[yk].kisa, x0 + ic * 1.6, sy);
          /* fiyat (dijital) */
          c.textAlign = 'right';
          c.font = 'bold ' + Math.round(satirH * 0.68) + 'px ui-monospace, Menlo, monospace';
          c.fillStyle = gece ? '#ffd98a' : '#f3f7fb';
          if (gece) { c.shadowColor = 'rgba(255,200,90,.85)'; c.shadowBlur = 5 * o; }
          c.fillText(say(sb.fiyat[yk], 2), x0 + W - ic * 1.6, sy);
          c.shadowBlur = 0;
          /* satır ayracı */
          if (k < yakitlar.length - 1) {
            c.strokeStyle = 'rgba(255,255,255,.08)';
            c.lineWidth = Math.max(1, 0.8 * o);
            c.beginPath();
            c.moveTo(x0 + ic * 1.4, sy + satirH / 2);
            c.lineTo(x0 + W - ic * 1.4, sy + satirH / 2);
            c.stroke();
          }
        }
      }
    }
    c.textBaseline = 'alphabetic';

    /* panoyu da dokunulabilir yap */
    if (this.vurus) {
      this.vurus.push({
        tip: 'hucre', i: i,
        poly: [{ x: x0 - 2 * o, y: y0 - 2 * o }, { x: x0 + W + 2 * o, y: y0 - 2 * o },
               { x: x0 + W + 2 * o, y: y0 + H + 2 * o }, { x: x0 - 2 * o, y: y0 + H + 2 * o }]
      });
    }
  },

  /* dolum ilerlemesi: pompanın üstünde ince çubuk */
  dolumGostergesi: function (gx, gy, m) {
    if (!m || m.hedef <= 0) return;
    var o = this.kam.olcek;
    if (o < 0.5) return;
    var c = this.cz;
    var oran = kisitla(m.verilen / m.hedef, 0, 1);
    var hazir = (m.hazirlik !== undefined && m.hazirlik > 0);
    var p = this.ekran(gx + 0.5, gy + 0.32, 38);
    var w = 26 * o, hh = 4.4 * o;
    /* zemin */
    c.fillStyle = 'rgba(10,16,26,.72)';
    this.yuvarlakKutu(p.x - w / 2, p.y - hh / 2, w, hh, hh / 2);
    c.fill();
    if (hazir) {
      /* hazırlık: kayan şerit */
      var t = (Date.now() / 420) % 1;
      c.fillStyle = 'rgba(240,180,41,.9)';
      this.yuvarlakKutu(p.x - w / 2 + t * (w - w * 0.3), p.y - hh / 2, w * 0.3, hh, hh / 2);
      c.fill();
    } else {
      c.fillStyle = VERI.yakitlar[m.yakit].renk;
      if (oran > 0.01) {
        this.yuvarlakKutu(p.x - w / 2, p.y - hh / 2, w * oran, hh, hh / 2);
        c.fill();
      }
      if (o > 0.7) {
        c.font = 'bold ' + Math.round(6.5 * o) + 'px sans-serif';
        c.textAlign = 'center';
        c.fillStyle = '#e9eef3';
        c.fillText(say(m.verilen, 0) + '/' + say(m.hedef, 0), p.x, p.y - hh);
      }
    }
  },

  /* pompadan araca uzanan hortum */
  hortumCiz: function (gx, gy, p, m) {
    var arac = null;
    for (var i = 0; i < this.arabalar.length; i++) if (this.arabalar[i].mid === m.id) arac = this.arabalar[i];
    if (!arac || arac.durum === 'geliyor' || arac.durum === 'gidiyor') return;
    var c = this.cz, o = this.kam.olcek;
    var a = this.ekran(gx + 0.46, gy + 0.2, 16);               /* tabanca ağzı */
    var b = this.ekran(arac.gx + 0.18, arac.gy - 0.12, 11);    /* aracın yakıt kapağı */
    var orta = { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 9 * o };   /* sarkma */
    c.strokeStyle = 'rgba(26,32,42,.85)';
    c.lineWidth = Math.max(1.3, 2.4 * o);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.quadraticCurveTo(orta.x, orta.y, b.x, b.y);
    c.stroke();
    /* tabanca ucu */
    c.fillStyle = VERI.yakitlar[m.yakit].renk;
    c.beginPath(); c.arc(b.x, b.y, 2.4 * o, 0, Math.PI * 2); c.fill();
  },

  binaCiz: function (sb, i, gx, gy, b) {
    var kayit = this.cz;
    var merkez = this.ekran(gx + 0.5, gy + 0.5, 0);
    var kucult = 0.58;
    var once = this.vurus.length;
    kayit.save();
    kayit.translate(merkez.x, merkez.y);
    kayit.scale(kucult, kucult);
    kayit.translate(-merkez.x, -merkez.y);
    try { this.binaCizIc(sb, i, gx, gy, b); } catch (e) { }
    kayit.restore();
    /* dokunma siluetleri de aynı ölçekle küçülsün, yoksa komşunun dokunuşunu çalar */
    for (var v = once; v < this.vurus.length; v++) {
      var poly = this.vurus[v].poly;
      for (var n = 0; n < poly.length; n++) {
        poly[n] = {
          x: merkez.x + (poly[n].x - merkez.x) * kucult,
          y: merkez.y + (poly[n].y - merkez.y) * kucult
        };
      }
    }
  },

  binaCizIc: function (sb, i, gx, gy, b) {
    var t = b.t;
    var tan = VERI.binalar[t];
    var I = this.isik();

    if (t === 'depo') {
      this.golge(gx + 0.08, gy + 0.08, 0.84, 0.84, 0.3);
      this.kutu(gx + 0.05, gy + 0.05, 0, 0.9, 0.9, 3, '#aab3bd', { tip: 'hucre', i: i });
      this.silindir(gx + 0.12, gy + 0.14, 3, 0.36, 26 + b.sv * 4, '#e8edf2', { tip: 'hucre', i: i });
      this.silindir(gx + 0.54, gy + 0.14, 3, 0.36, 22 + b.sv * 4, '#5aa9e6', { tip: 'hucre', i: i });
      this.silindir(gx + 0.32, gy + 0.56, 3, 0.34, 20 + b.sv * 3, '#d9e2ea', { tip: 'hucre', i: i });
      return;
    }
    if (t === 'gunes') {
      this.kutu(gx + 0.05, gy + 0.05, 0, 0.9, 0.9, 2, '#8fae6e', { tip: 'hucre', i: i });
      for (var s = 0; s < 2; s++) {
        var oy = gy + 0.1 + s * 0.42;
        this.kutu(gx + 0.12, oy, 2, 0.06, 0.06, 10, '#6b7480');
        this.kutu(gx + 0.72, oy, 2, 0.06, 0.06, 14, '#6b7480');
        this.kutu(gx + 0.10, oy, 13, 0.74, 0.3, 3, '#1d3a63', { tip: 'hucre', i: i });
      }
      return;
    }
    if (t === 'jenerator') {
      this.kutu(gx + 0.1, gy + 0.1, 0, 0.8, 0.8, 4, '#9aa3ad', { tip: 'hucre', i: i });
      this.kutu(gx + 0.16, gy + 0.18, 4, 0.66, 0.6, 20, '#6f7a86', { tip: 'hucre', i: i });
      this.kutu(gx + 0.62, gy + 0.22, 24, 0.1, 0.1, 12, '#4a525c');
      if (!b.arizali) this.dumanCiz(gx + 0.67, gy + 0.27, 36);
      return;
    }
    if (t === 'smr') {
      this.golge(gx + 0.05, gy + 0.05, 0.9, 0.9, 0.34);
      this.kutu(gx + 0.02, gy + 0.02, 0, 0.96, 0.96, 5, '#aeb6bf', { tip: 'hucre', i: i });
      this.silindir(gx + 0.18, gy + 0.18, 5, 0.62, 46, '#dde3ea', { tip: 'hucre', i: i });
      this.silindir(gx + 0.3, gy + 0.3, 51, 0.38, 10, '#8fa8c6');
      return;
    }
    if (t === 'tirpark') {
      this.kutu(gx + 0.02, gy + 0.02, 0, 0.96, 0.96, 2.5, '#848d97', { tip: 'hucre', i: i });
      var c0 = this.cz;
      c0.strokeStyle = this.ton('#eef3f7', I); c0.lineWidth = Math.max(1, 1.4 * this.kam.olcek);
      for (var k = 0; k < 3; k++) {
        var p1 = this.ekran(gx + 0.1, gy + 0.2 + k * 0.28, 3), p2 = this.ekran(gx + 0.9, gy + 0.2 + k * 0.28, 3);
        c0.beginPath(); c0.moveTo(p1.x, p1.y); c0.lineTo(p2.x, p2.y); c0.stroke();
      }
      return;
    }

    if (t === 'totem') {
      this.totemCiz(gx, gy, i, b);
      return;
    }
    if (t === 'wc') {
      this.golge(gx + 0.1, gy + 0.1, 0.8, 0.8, 0.3);
      this.kutu(gx + 0.08, gy + 0.08, 0, 0.84, 0.84, 2, '#aab3bd', { tip: 'hucre', i: i });
      this.kutu(gx + 0.14, gy + 0.14, 2, 0.72, 0.7, 24, '#e6ebf0', { tip: 'hucre', i: i });
      this.kutu(gx + 0.1, gy + 0.1, 26, 0.8, 0.78, 4, '#5a6b80');
      this.kutu(gx + 0.2, gy + 0.83, 4, 0.22, 0.03, 16, '#4a7fb5');
      this.kutu(gx + 0.52, gy + 0.83, 4, 0.22, 0.03, 16, '#c0578f');
      return;
    }
    if (t === 'mescit') {
      this.golge(gx + 0.1, gy + 0.1, 0.8, 0.8, 0.3);
      this.kutu(gx + 0.1, gy + 0.1, 0, 0.8, 0.8, 2, '#c3cbd4');
      this.kutu(gx + 0.16, gy + 0.16, 2, 0.62, 0.62, 22, '#e9eef3', { tip: 'hucre', i: i });
      this.silindir(gx + 0.26, gy + 0.26, 24, 0.42, 12, '#4a8f6f', { tip: 'hucre', i: i });
      /* minare */
      this.kutu(gx + 0.8, gy + 0.2, 2, 0.08, 0.08, 46, '#e9eef3');
      this.silindir(gx + 0.79, gy + 0.19, 48, 0.1, 7, '#4a8f6f');
      return;
    }
    if (t === 'havasu') {
      this.golge(gx + 0.2, gy + 0.2, 0.6, 0.6, 0.25);
      this.kutu(gx + 0.15, gy + 0.15, 0, 0.7, 0.7, 3, '#b6bec7', { tip: 'hucre', i: i });
      this.kutu(gx + 0.24, gy + 0.3, 3, 0.18, 0.18, 20, '#3f7fd0', { tip: 'hucre', i: i });
      this.kutu(gx + 0.56, gy + 0.3, 3, 0.18, 0.18, 18, '#4aa96c');
      this.kutu(gx + 0.26, gy + 0.28, 21, 0.14, 0.03, 6, '#eef3f7');
      return;
    }
    if (t === 'atm') {
      this.golge(gx + 0.3, gy + 0.3, 0.42, 0.42, 0.25);
      this.kutu(gx + 0.28, gy + 0.3, 0, 0.42, 0.34, 3, '#aab3bd');
      this.kutu(gx + 0.32, gy + 0.34, 3, 0.34, 0.26, 24, '#d64545', { tip: 'hucre', i: i });
      this.kutu(gx + 0.35, gy + 0.32, 16, 0.26, 0.03, 9, this.gece() ? '#9ef0b5' : '#1d2a3d');
      this.kutu(gx + 0.26, gy + 0.28, 27, 0.5, 0.42, 4, '#8f2f2f');
      return;
    }
    if (t === 'lastikci') {
      this.golge(gx + 0.06, gy + 0.06, 0.88, 0.88, 0.3);
      this.kutu(gx + 0.04, gy + 0.04, 0, 0.92, 0.92, 2, '#9aa3ad', { tip: 'hucre', i: i });
      this.kutu(gx + 0.1, gy + 0.1, 2, 0.62, 0.78, 30, '#b9c2cb', { tip: 'hucre', i: i });
      this.kutu(gx + 0.06, gy + 0.06, 32, 0.7, 0.86, 4, '#3f4a57');
      /* lastik yığını */
      for (var li = 0; li < 3; li++) this.silindir(gx + 0.74, gy + 0.2 + li * 0.02, 2 + li * 7, 0.2, 7, '#2a2f38');
      for (var lj = 0; lj < 2; lj++) this.silindir(gx + 0.74, gy + 0.56 + lj * 0.02, 2 + lj * 7, 0.2, 7, '#2a2f38');
      return;
    }
    if (t === 'adblue') {
      this.golge(gx + 0.2, gy + 0.2, 0.6, 0.5, 0.25);
      this.kutu(gx + 0.14, gy + 0.2, 0, 0.72, 0.42, 3, '#b6bec7', { tip: 'hucre', i: i });
      this.kutu(gx + 0.24, gy + 0.3, 3, 0.3, 0.26, 28, '#2f80b8', { tip: 'hucre', i: i });
      this.kutu(gx + 0.27, gy + 0.28, 18, 0.24, 0.03, 9, '#eef3f7');
      this.kutu(gx + 0.58, gy + 0.3, 3, 0.2, 0.2, 16, '#d9e2ea');
      return;
    }
    if (t === 'kamera') {
      this.golge(gx + 0.4, gy + 0.4, 0.2, 0.2, 0.22);
      this.kutu(gx + 0.44, gy + 0.44, 0, 0.1, 0.1, 54, '#7d8793', { tip: 'hucre', i: i });
      this.kutu(gx + 0.3, gy + 0.42, 52, 0.26, 0.14, 9, '#3f4a57', { tip: 'hucre', i: i });
      this.kutu(gx + 0.26, gy + 0.45, 54, 0.06, 0.07, 5, '#1d2630');
      if (this.gece()) {
        var kp = this.ekran(gx + 0.28, gy + 0.48, 56);
        this.cz.fillStyle = 'rgba(240,82,82,.85)';
        this.cz.beginPath(); this.cz.arc(kp.x, kp.y, 1.8 * this.kam.olcek, 0, Math.PI * 2); this.cz.fill();
      }
      return;
    }
    if (t === 'yangin') {
      this.golge(gx + 0.25, gy + 0.25, 0.5, 0.5, 0.25);
      this.kutu(gx + 0.2, gy + 0.22, 0, 0.6, 0.5, 3, '#aab3bd');
      this.kutu(gx + 0.26, gy + 0.3, 3, 0.46, 0.34, 22, '#c23b3b', { tip: 'hucre', i: i });
      this.kutu(gx + 0.3, gy + 0.28, 12, 0.36, 0.03, 10, '#eef3f7');
      this.kutu(gx + 0.74, gy + 0.3, 0, 0.12, 0.12, 14, '#d64545');
      return;
    }

    /* genel bina: gövde + çatı + tente + vitrin */
    var renkler = {
      market: '#e4e9ee', kafe: '#d9bb94', yikama: '#8fd3e8',
      yag: '#b9c2cb', restoran: '#e8c9a0', ofis: '#c9d2db'
    };
    var catilar = {
      market: '#d64545', kafe: '#8a5a3b', yikama: '#2f84a8',
      yag: '#5c6770', restoran: '#b5572e', ofis: '#49586b'
    };
    var govdeRenk = renkler[t] || '#d7dde4';
    var catiRenk = catilar[t] || '#4a5563';
    var kat = Math.min(3, ((t === 'ofis' || t === 'restoran') ? 2 : 1) + Math.floor(b.sv / 2));
    var h = 22 * kat;

    this.golge(gx + 0.06, gy + 0.06, 0.88, 0.88, 0.32);
    this.kutu(gx + 0.04, gy + 0.04, 0, 0.92, 0.92, 2, '#aab3bd', { tip: 'hucre', i: i });
    this.kutu(gx + 0.1, gy + 0.1, 2, 0.8, 0.8, h, govdeRenk, { tip: 'hucre', i: i });
    this.kutu(gx + 0.06, gy + 0.06, 2 + h, 0.88, 0.88, 5, catiRenk, { tip: 'hucre', i: i });
    /* tente */
    this.kutu(gx + 0.06, gy + 0.86, 2 + h * 0.42, 0.88, 0.18, 3, catiRenk);
    /* vitrin + tabela (market, kafe, restoran) */
    if (t === 'market' || t === 'kafe' || t === 'restoran') this.vitrin(gx, gy, t, catiRenk, h);
    /* pencereler */
    this.pencereler(gx, gy, h, kat);
  },

  /* ön cephe üzerine dörtgen boya (x1..x2 karo, z1..z2 piksel) */
  cepheDort: function (gx, gy, x1, x2, z1, z2, renk) {
    this.cokgen([
      this.ekran(gx + x1, gy + 0.9, z2), this.ekran(gx + x2, gy + 0.9, z2),
      this.ekran(gx + x2, gy + 0.9, z1), this.ekran(gx + x1, gy + 0.9, z1)
    ], renk);
  },

  /* vitrinde görünen raf malları — sabit desen, karede titremesin */
  vitrinUrun: {
    market: ['#e05a4e', '#f0b429', '#4f93d6', '#56b870', '#e8744f', '#9f7aea', '#d94f78', '#3fb6a8'],
    kafe: ['#8c5a34', '#c98a4b', '#e8d5b0', '#6b4226', '#d9a05b', '#f0e0c0'],
    restoran: ['#d6633f', '#e8b05a', '#7fa650', '#c44a3d', '#e0c48a', '#9a6b3f']
  },

  /* dükkân vitrini: cam, raflar, kapı, tabela */
  vitrin: function (gx, gy, t, catiRenk, h) {
    var c = this.cz, o = this.kam.olcek, gece = this.gece();
    /* cam bant */
    var camRenk = gece ? 'rgba(255,226,160,.92)' : 'rgba(150,196,228,.85)';
    var a = this.ekran(gx + 0.14, gy + 0.9, 16), b = this.ekran(gx + 0.56, gy + 0.9, 16);
    var a2 = this.ekran(gx + 0.14, gy + 0.9, 4), b2 = this.ekran(gx + 0.56, gy + 0.9, 4);
    this.cokgen([a, b, b2, a2], camRenk);

    /* ---- vitrin içi: raflar, ürünler, doğrama ---- */
    if (o > 0.5) {
      var urunler = this.vitrinUrun[t] || this.vitrinUrun.market;
      /* iki raf bandı */
      var raflar = [[6.5, 9.0], [11.0, 13.5]];
      for (var r = 0; r < raflar.length; r++) {
        var z1 = raflar[r][0], z2 = raflar[r][1];
        /* raf tahtası */
        this.cepheDort(gx, gy, 0.15, 0.55, z1 - 0.9, z1, gece ? 'rgba(150,110,60,.75)' : 'rgba(110,120,135,.5)');
        /* üstündeki mallar */
        for (var u = 0; u < 5; u++) {
          var ux = 0.17 + u * 0.078;
          var yuk = z1 + (z2 - z1) * (0.55 + ((u + r * 3) % 3) * 0.15);
          var renk = urunler[(u + r * 3) % urunler.length];
          this.cepheDort(gx, gy, ux, ux + 0.055, z1, yuk, this.ton(renk, gece ? 1.08 : 0.92));
        }
      }
      /* buzdolabı / teşhir dolabı sol uçta */
      this.cepheDort(gx, gy, 0.145, 0.175, 4, 16, gece ? 'rgba(190,230,255,.55)' : 'rgba(205,228,245,.45)');
      /* doğrama: dikey kayıtlar */
      for (var d2 = 1; d2 < 3; d2++) {
        var dx2 = 0.14 + (0.42 * d2) / 3;
        this.cepheDort(gx, gy, dx2 - 0.008, dx2 + 0.008, 4, 16, 'rgba(60,74,92,.62)');
      }
      /* üst ve alt çerçeve */
      this.cepheDort(gx, gy, 0.14, 0.56, 15.4, 16.4, 'rgba(55,68,86,.7)');
      this.cepheDort(gx, gy, 0.14, 0.56, 3.2, 4.2, 'rgba(70,84,102,.8)');
    }

    /* kapı */
    var k1 = this.ekran(gx + 0.62, gy + 0.9, 15), k2 = this.ekran(gx + 0.84, gy + 0.9, 15);
    var k3 = this.ekran(gx + 0.84, gy + 0.9, 2), k4 = this.ekran(gx + 0.62, gy + 0.9, 2);
    this.cokgen([k1, k2, k3, k4], gece ? 'rgba(255,226,160,.75)' : 'rgba(70,96,125,.8)');
    if (o > 0.5) {
      /* kapı çerçevesi, orta kayıt ve kol */
      this.cepheDort(gx, gy, 0.615, 0.635, 2, 15, 'rgba(48,60,76,.8)');
      this.cepheDort(gx, gy, 0.828, 0.848, 2, 15, 'rgba(48,60,76,.8)');
      this.cepheDort(gx, gy, 0.725, 0.740, 2, 15, 'rgba(48,60,76,.7)');
      this.cepheDort(gx, gy, 0.700, 0.720, 7.5, 9.0, 'rgba(225,232,240,.9)');
      /* çalışma saati çıkartması */
      this.cepheDort(gx, gy, 0.655, 0.700, 11.5, 13.2, gece ? 'rgba(120,230,160,.85)' : 'rgba(240,246,252,.8)');
    }
    /* tabela */
    if (o > 0.55) {
      var tp = this.ekran(gx + 0.5, gy + 0.92, 2 + h * 0.42 + 7);
      var yazi = t === 'market' ? 'MARKET' : (t === 'kafe' ? 'KAFE' : 'LOKANTA');
      c.font = 'bold ' + Math.round(6.5 * o) + 'px sans-serif';
      var w = c.measureText(yazi).width + 7 * o;
      c.fillStyle = gece ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.85)';
      this.yuvarlakKutu(tp.x - w / 2, tp.y - 9 * o, w, 11 * o, 3 * o);
      c.fill();
      c.fillStyle = catiRenk;
      c.textAlign = 'center';
      c.fillText(yazi, tp.x, tp.y - 1.2 * o);
      if (gece) {
        var g2 = c.createRadialGradient(tp.x, tp.y - 4 * o, 0, tp.x, tp.y - 4 * o, 24 * o);
        g2.addColorStop(0, 'rgba(255,236,180,.35)');
        g2.addColorStop(1, 'rgba(255,236,180,0)');
        c.fillStyle = g2;
        c.beginPath(); c.arc(tp.x, tp.y - 4 * o, 24 * o, 0, Math.PI * 2); c.fill();
      }
    }
  },

  pencereler: function (gx, gy, h, kat) {
    var c = this.cz;
    var gece = this.gece();
    var renk = gece ? 'rgba(255,214,120,.92)' : 'rgba(40,60,85,.55)';
    for (var k = 0; k < kat; k++) {
      var z = 7 + k * 22;
      for (var s = 0; s < 3; s++) {
        var gxx = gx + 0.18 + s * 0.22;
        var a = this.ekran(gxx, gy + 0.9, z), b = this.ekran(gxx + 0.14, gy + 0.9, z);
        var alt = this.ekran(gxx, gy + 0.9, z - 11), alt2 = this.ekran(gxx + 0.14, gy + 0.9, z - 11);
        this.cokgen([a, b, alt2, alt], renk);
      }
    }
  },

  susCiz: function (s) {
    var I = this.isik();
    var sezon = VERI.sezonSira[D.s.sezonIdx];
    if (s.tip === 'agac') this.agacCiz(s, I, sezon);
    else if (s.tip === 'cali') {
      var c2 = this.cz;
      var p2 = this.ekran(s.gx + 0.5, s.gy + 0.5, 3);
      var rr = 7 * s.boy * this.kam.olcek;
      this.yumusakGolge(s.gx + 0.5, s.gy + 0.5, rr * 0.9);
      var tonC = sezon === 'kis' ? '#b9c6cc' : '#4e8f45';
      c2.fillStyle = this.ton(tonC, I * 0.92);
      c2.beginPath(); c2.arc(p2.x, p2.y, rr, 0, Math.PI * 2); c2.fill();
      c2.fillStyle = this.ton(tonC, I * 1.14);
      c2.beginPath(); c2.arc(p2.x - rr * 0.28, p2.y - rr * 0.3, rr * 0.62, 0, Math.PI * 2); c2.fill();
    } else if (s.tip === 'tas') {
      this.yumusakGolge(s.gx + 0.49, s.gy + 0.48, 7 * this.kam.olcek);
      this.kutu(s.gx + 0.4, s.gy + 0.4, 0, 0.18, 0.16, 5 * s.boy, '#98a0a8');
    } else if (s.tip === 'tarla') this.tarlaCiz(s, I, sezon);
    else if (s.tip === 'kasabaBina') this.kasabaBinaCiz(s, I);
    else if (s.tip === 'cami') this.camiCiz(s, I);
    else if (s.tip === 'direk') this.direkCiz(s, I);
    else if (s.tip === 'durak') this.durakCiz(s, I);
  },

  /* yumuşak temas gölgesi */
  yumusakGolge: function (gx, gy, r) {
    var p = this.ekran(gx, gy, 0);
    this.golgeCiz(p.x, p.y + 1, Math.max(3, r * 1.5), Math.max(1.5, r * 0.75), 0.3);
  },

  agacCiz: function (s, I, sezon) {
    var yaprak = sezon === 'sonbahar' ? '#c2622c' : (sezon === 'kis' ? '#cfd8df' : (sezon === 'ilkbahar' ? '#67b24a' : '#3f8f3f'));
    var c = this.cz;
    var govdeH = 15 * s.boy;
    this.yumusakGolge(s.gx + 0.48, s.gy + 0.5, 10 * s.boy * this.kam.olcek);
    this.kutu(s.gx + 0.43, s.gy + 0.43, 0, 0.11, 0.11, govdeH, '#6b4a2e');
    var r = 10.5 * s.boy * this.kam.olcek;
    var p = this.ekran(s.gx + 0.485, s.gy + 0.485, govdeH + 8 * s.boy);
    /* üç küre: hacim hissi */
    var kure = [
      { x: 0, y: 0, r: r, k: 0.92 },
      { x: -r * 0.52, y: r * 0.18, r: r * 0.72, k: 0.82 },
      { x: r * 0.5, y: r * 0.12, r: r * 0.68, k: 1.0 }
    ];
    for (var i = 0; i < kure.length; i++) {
      c.fillStyle = this.ton(yaprak, I * kure[i].k);
      c.beginPath(); c.arc(p.x + kure[i].x, p.y + kure[i].y, kure[i].r, 0, Math.PI * 2); c.fill();
    }
    /* ışık vurgusu */
    c.fillStyle = this.ton(yaprak, I * 1.22);
    c.beginPath(); c.arc(p.x - r * 0.3, p.y - r * 0.42, r * 0.46, 0, Math.PI * 2); c.fill();
  },

  tarlaCiz: function (s, I, sezon) {
    var c = this.cz;
    var kis = sezon === 'kis';
    /* toprak zemin */
    var a = this.ekran(s.gx, s.gy, 0), b = this.ekran(s.gx + s.w, s.gy, 0),
        d = this.ekran(s.gx + s.w, s.gy + s.h, 0), e = this.ekran(s.gx, s.gy + s.h, 0);
    this.cokgen([a, b, d, e], this.ton(kis ? '#8d8470' : '#6e5436', I));
    /* ekin sıraları */
    var urunRenk = kis ? '#9fb0a6' : (s.urun === 'ayciceg' ? '#d9b741' : (s.urun === 'misir' ? '#96b14b' : '#c9b25e'));
    var adim = 0.26;
    c.lineWidth = Math.max(1, 1.5 * this.kam.olcek);
    for (var gy = s.gy + 0.18; gy < s.gy + s.h - 0.05; gy += adim) {
      var p1 = this.ekran(s.gx + 0.1, gy, 3), p2 = this.ekran(s.gx + s.w - 0.1, gy, 3);
      c.strokeStyle = this.ton(urunRenk, I * 0.95);
      c.beginPath(); c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.stroke();
      c.strokeStyle = this.ton(urunRenk, I * 1.18);
      c.beginPath(); c.moveTo(p1.x, p1.y - 1.2 * this.kam.olcek); c.lineTo(p2.x, p2.y - 1.2 * this.kam.olcek); c.stroke();
    }
    /* çit */
    var kose = [[s.gx, s.gy], [s.gx + s.w, s.gy], [s.gx + s.w, s.gy + s.h], [s.gx, s.gy + s.h]];
    for (var k = 0; k < 4; k++) {
      var p = kose[k], q = kose[(k + 1) % 4];
      var adet = Math.max(2, Math.round(Math.abs(p[0] - q[0] + p[1] - q[1]) * 2.2));
      for (var i = 0; i <= adet; i++) {
        var fx = p[0] + (q[0] - p[0]) * (i / adet), fy = p[1] + (q[1] - p[1]) * (i / adet);
        this.kutu(fx - 0.03, fy - 0.03, 0, 0.06, 0.06, 9, '#8a6a42');
      }
      var r1 = this.ekran(p[0], p[1], 6), r2 = this.ekran(q[0], q[1], 6);
      c.strokeStyle = this.ton('#9d7b4d', I);
      c.lineWidth = Math.max(1, 1.4 * this.kam.olcek);
      c.beginPath(); c.moveTo(r1.x, r1.y); c.lineTo(r2.x, r2.y); c.stroke();
    }
  },

  kasabaBinaCiz: function (s, I) {
    var katH = 11;
    var h = katH * (s.kat || 1);
    this.yumusakGolge(s.gx + s.w / 2, s.gy + s.h / 2, s.w * 16 * this.kam.olcek);
    this.kutu(s.gx, s.gy, 0, s.w, s.h, h, s.renk);
    /* çatı */
    if (s.alt === 'ev' || s.alt === 'dukkan') {
      this.kutu(s.gx - 0.06, s.gy - 0.06, h, s.w + 0.12, s.h + 0.12, 5, s.cati);
      this.kutu(s.gx + s.w * 0.2, s.gy + s.h * 0.2, h + 5, s.w * 0.6, s.h * 0.6, 7, s.cati);
    } else if (s.alt === 'depo') {
      this.kutu(s.gx - 0.04, s.gy - 0.04, h, s.w + 0.08, s.h + 0.08, 4, '#7d8793');
    } else {
      this.kutu(s.gx - 0.05, s.gy - 0.05, h, s.w + 0.1, s.h + 0.1, 3.5, '#6f7a86');
      /* teras korkuluğu */
      if (!this.dusukKalite) this.kutu(s.gx - 0.05, s.gy + s.h - 0.01, h + 3.5, s.w + 0.1, 0.06, 2.5, '#8d98a5');
    }
    /* pencereler: cepheye düz boyanır (kutu değil) */
    var c = this.cz;
    var gece = this.gece();
    var kat = s.kat || 1;
    if (this.kam.olcek < 0.62 || this.dusukKalite) return;   /* uzak/düşük kalite: ayrıntı yok */
    var pencereRenk = function (yanik) { return gece ? (yanik ? 'rgba(255,218,140,.95)' : 'rgba(38,48,64,.9)') : 'rgba(126,166,200,.85)'; };
    for (var kk = 0; kk < kat; kk++) {
      var z1 = kk * katH + 7.5, z2 = kk * katH + 3;
      for (var w = 0; w < 3; w++) {
        var gx1 = s.gx + s.w * (0.16 + w * 0.28);
        var gx2 = gx1 + s.w * 0.16;
        var yanik = ((s.tohum + kk * 7 + w * 13) % 10) < 6;
        /* ön cephe (gy + h tarafı) */
        var a1 = this.ekran(gx1, s.gy + s.h, z1), b1 = this.ekran(gx2, s.gy + s.h, z1);
        var a2 = this.ekran(gx2, s.gy + s.h, z2), b2 = this.ekran(gx1, s.gy + s.h, z2);
        this.cokgen([a1, b1, a2, b2], pencereRenk(yanik));
        /* yan cephe */
        var gy1 = s.gy + s.h * (0.18 + w * 0.3), gy2 = gy1 + s.h * 0.16;
        if (gy2 < s.gy + s.h && this.kam.olcek > 0.85) {
          var c1 = this.ekran(s.gx + s.w, gy1, z1), d1 = this.ekran(s.gx + s.w, gy2, z1);
          var c2 = this.ekran(s.gx + s.w, gy2, z2), d2 = this.ekran(s.gx + s.w, gy1, z2);
          this.cokgen([c1, d1, c2, d2], pencereRenk(((s.tohum + kk * 3 + w * 5) % 10) < 5));
        }
      }
    }
    /* kapı */
    var kz1 = 9, kz2 = 0.5;
    var kx1 = s.gx + s.w * 0.42, kx2 = s.gx + s.w * 0.58;
    var k1 = this.ekran(kx1, s.gy + s.h, kz1), k2 = this.ekran(kx2, s.gy + s.h, kz1);
    var k3 = this.ekran(kx2, s.gy + s.h, kz2), k4 = this.ekran(kx1, s.gy + s.h, kz2);
    this.cokgen([k1, k2, k3, k4], gece ? 'rgba(255,226,170,.8)' : 'rgba(86,66,52,.9)');
    /* dükkân tentesi */
    if (s.alt === 'dukkan') {
      this.kutu(s.gx + 0.05, s.gy - 0.16, 9, s.w - 0.1, 0.2, 2.5, '#d9534f');
      /* gece neon tabela */
      if (gece) {
        var np = this.ekran(s.gx + s.w / 2, s.gy - 0.1, 13);
        var ng = c.createRadialGradient(np.x, np.y, 0, np.x, np.y, 26 * this.kam.olcek);
        ng.addColorStop(0, 'rgba(255,180,90,.5)');
        ng.addColorStop(1, 'rgba(255,180,90,0)');
        c.fillStyle = ng;
        c.beginPath(); c.arc(np.x, np.y, 26 * this.kam.olcek, 0, Math.PI * 2); c.fill();
      }
    }
    /* kışın çatı karı */
    if (VERI.sezonSira[D.s.sezonIdx] === 'kis') {
      var catiZ = h + (s.alt === 'ev' || s.alt === 'dukkan' ? 5 : (s.alt === 'depo' ? 4 : 3.5));
      this.kutu(s.gx - 0.03, s.gy - 0.03, catiZ, s.w + 0.06, s.h + 0.06, 1.6, '#eef4f8');
    }
  },

  camiCiz: function (s, I) {
    var c = this.cz;
    this.yumusakGolge(s.gx + s.w / 2, s.gy + s.h / 2, s.w * 17 * this.kam.olcek);
    this.kutu(s.gx, s.gy, 0, s.w, s.h, 15, '#e4ded2');
    /* kubbe */
    var p = this.ekran(s.gx + s.w / 2, s.gy + s.h / 2, 15);
    var r = s.w * 11 * this.kam.olcek;
    var g = c.createLinearGradient(p.x - r, p.y - r, p.x + r, p.y + r);
    g.addColorStop(0, this.ton('#7fa9c9', I * 1.15));
    g.addColorStop(1, this.ton('#4d7ba3', I * 0.85));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.86, 0, Math.PI, Math.PI * 2); c.fill();
    /* alem */
    c.strokeStyle = this.ton('#d9c06a', I);
    c.lineWidth = Math.max(1, 1.6 * this.kam.olcek);
    c.beginPath(); c.moveTo(p.x, p.y - r * 0.86); c.lineTo(p.x, p.y - r * 1.3); c.stroke();
    /* minare */
    this.kutu(s.gx + s.w - 0.2, s.gy + 0.05, 0, 0.16, 0.16, 38, '#efe9de');
    this.kutu(s.gx + s.w - 0.23, s.gy + 0.02, 38, 0.21, 0.21, 3.5, '#d6cdbe');
    var mp = this.ekran(s.gx + s.w - 0.12, s.gy + 0.13, 42);
    c.fillStyle = this.ton('#efe9de', I);
    c.beginPath();
    c.moveTo(mp.x, mp.y - 13 * this.kam.olcek);
    c.lineTo(mp.x - 5 * this.kam.olcek, mp.y);
    c.lineTo(mp.x + 5 * this.kam.olcek, mp.y);
    c.closePath(); c.fill();
  },

  direkCiz: function (s, I) {
    var c = this.cz;
    this.kutu(s.gx + 0.45, s.gy + 0.45, 0, 0.1, 0.1, 46, '#808a96');
    this.kutu(s.gx + 0.3, s.gy + 0.42, 44, 0.3, 0.14, 4, '#808a96');
    var p = this.ekran(s.gx + 0.3, s.gy + 0.48, 44);
    if (this.gece()) {
      var g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 34 * this.kam.olcek);
      g.addColorStop(0, 'rgba(255,226,150,.55)');
      g.addColorStop(1, 'rgba(255,226,150,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(p.x, p.y, 34 * this.kam.olcek, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = this.gece() ? '#ffe9ac' : this.ton('#cfd6dd', I);
    c.beginPath(); c.ellipse(p.x, p.y, 3.4 * this.kam.olcek, 2 * this.kam.olcek, 0, 0, Math.PI * 2); c.fill();
  },

  durakCiz: function (s, I) {
    this.yumusakGolge(s.gx + s.w / 2, s.gy + s.h / 2, 14 * this.kam.olcek);
    this.kutu(s.gx, s.gy, 0, s.w, s.h, 2, '#b7bec6');
    this.kutu(s.gx + 0.05, s.gy + s.h - 0.08, 2, s.w - 0.1, 0.06, 17, '#8fb8d8');
    this.kutu(s.gx, s.gy - 0.04, 19, s.w, s.h + 0.08, 3, '#2f6fa8');
    this.kutu(s.gx + 0.1, s.gy + 0.08, 2, 0.5, 0.12, 6, '#5c6672');
  },

  /* =========================================================
     ARAÇ
     ========================================================= */
  arabaCiz: function (a) {
    var c = this.cz;
    /* --- yön: eksene hizalı dört yön --- */
    var aci = a.aci || 0;
    var yatay = Math.abs(Math.cos(aci)) >= Math.abs(Math.sin(aci));
    var ileriX = yatay ? (Math.cos(aci) >= 0 ? 1 : -1) : 0;
    var ileriY = yatay ? 0 : (Math.sin(aci) >= 0 ? 1 : -1);

    /* --- ölçüler: tipe göre --- */
    var cesit = a.cesit || (a.buyuk ? 'tir' : 'oto');
    if (a.tip === 'Tır') cesit = 'tir';
    else if (a.tip === 'Otobüs') cesit = 'otobus';
    else if (a.tip === 'Motosiklet') cesit = 'motor';
    else if (a.tip === 'Taksi') cesit = 'taksi';
    else if (a.tip === 'Ticari Araç' || a.tip === 'Minibüs') cesit = 'minibus';
    else if (a.tip === 'Traktör') cesit = 'traktor';

    var olcu = {
      oto:     { uz: 0.78, en: 0.38, govde: 7,  tavan: 9,  tekerR: 0.15 },
      taksi:   { uz: 0.80, en: 0.38, govde: 7,  tavan: 9,  tekerR: 0.15 },
      minibus: { uz: 0.92, en: 0.42, govde: 9,  tavan: 14, tekerR: 0.16 },
      traktor: { uz: 0.70, en: 0.42, govde: 10, tavan: 13, tekerR: 0.2 },
      motor:   { uz: 0.42, en: 0.2,  govde: 5,  tavan: 5,  tekerR: 0.1 },
      tir:     { uz: 1.55, en: 0.46, govde: 11, tavan: 15, tekerR: 0.18 },
      otobus:  { uz: 1.45, en: 0.46, govde: 9,  tavan: 17, tekerR: 0.18 }
    }[cesit] || { uz: 0.78, en: 0.38, govde: 7, tavan: 9, tekerR: 0.15 };

    /* yöne göre kutu ölçüleri */
    var w = yatay ? olcu.uz : olcu.en;
    var d = yatay ? olcu.en : olcu.uz;
    var gx = a.gx - w / 2, gy = a.gy - d / 2;

    /* --- gölge --- */
    var gp = this.ekran(a.gx, a.gy, 0);
    this.golgeCiz(gp.x, gp.y + 1.5,
      Math.max(4, (w + d) * this.TW / 4 * this.kam.olcek * 0.72),
      Math.max(2, (w + d) * this.TH / 4 * this.kam.olcek * 0.9), 0.3);

    /* --- tekerlekler --- */
    var tR = olcu.tekerR;
    if (yatay) {
      this.kutu(gx + 0.1, gy - 0.025, 0, tR, d + 0.05, 4.5, '#1f242b');
      this.kutu(gx + w - 0.1 - tR, gy - 0.025, 0, tR, d + 0.05, 4.5, '#1f242b');
      if (cesit === 'tir' || cesit === 'otobus') this.kutu(gx + w * 0.55, gy - 0.025, 0, tR, d + 0.05, 4.5, '#1f242b');
    } else {
      this.kutu(gx - 0.025, gy + 0.1, 0, w + 0.05, tR, 4.5, '#1f242b');
      this.kutu(gx - 0.025, gy + d - 0.1 - tR, 0, w + 0.05, tR, 4.5, '#1f242b');
      if (cesit === 'tir' || cesit === 'otobus') this.kutu(gx - 0.025, gy + d * 0.55, 0, w + 0.05, tR, 4.5, '#1f242b');
    }

    var taban = 3.5;
    var ustTon = this.sabitTon(a.renk, 1.06);
    var camRenk = this.gece() ? '#2b3a4d' : '#a9cfe8';

    if (cesit === 'motor') {
      this.kutu(gx + w * 0.2, gy + d * 0.2, taban, w * 0.6, d * 0.6, olcu.govde, a.renk);
      this.kutu(gx + w * 0.35, gy + d * 0.3, taban + olcu.govde, w * 0.3, d * 0.4, 5, '#2b3444');
      return;
    }

    /* --- gövde --- */
    this.kutu(gx, gy, taban, w, d, olcu.govde, a.renk);

    if (cesit === 'tir') {
      /* çekici + dorse */
      var kabinUz = 0.42;
      if (yatay) {
        var kx = ileriX > 0 ? gx + w - kabinUz : gx;
        this.kutu(kx, gy + 0.02, taban + olcu.govde, kabinUz, d - 0.04, olcu.tavan, ustTon);
        this.kutu(ileriX > 0 ? gx : gx + kabinUz, gy + 0.03, taban + olcu.govde, w - kabinUz, d - 0.06, olcu.tavan - 2, this.sabitTon('#dde3ea', 1));
        /* ön cam */
        this.kutu(ileriX > 0 ? gx + w - 0.06 : gx, gy + 0.06, taban + olcu.govde + 4, 0.06, d - 0.12, 6, camRenk);
      } else {
        var ky = ileriY > 0 ? gy + d - kabinUz : gy;
        this.kutu(gx + 0.02, ky, taban + olcu.govde, w - 0.04, kabinUz, olcu.tavan, ustTon);
        this.kutu(gx + 0.03, ileriY > 0 ? gy : gy + kabinUz, taban + olcu.govde, w - 0.06, d - kabinUz, olcu.tavan - 2, this.sabitTon('#dde3ea', 1));
        this.kutu(gx + 0.06, ileriY > 0 ? gy + d - 0.06 : gy, taban + olcu.govde + 4, w - 0.12, 0.06, 6, camRenk);
      }
    } else if (cesit === 'otobus') {
      this.kutu(gx + 0.02, gy + 0.02, taban + olcu.govde, w - 0.04, d - 0.04, olcu.tavan, ustTon);
      /* yan cam şeridi */
      if (yatay) {
        this.kutu(gx + 0.1, gy - 0.015, taban + olcu.govde + 4, w - 0.2, 0.04, 6, camRenk);
        this.kutu(gx + 0.1, gy + d - 0.025, taban + olcu.govde + 4, w - 0.2, 0.04, 6, camRenk);
      } else {
        this.kutu(gx - 0.015, gy + 0.1, taban + olcu.govde + 4, 0.04, d - 0.2, 6, camRenk);
        this.kutu(gx + w - 0.025, gy + 0.1, taban + olcu.govde + 4, 0.04, d - 0.2, 6, camRenk);
      }
    } else if (cesit === 'traktor') {
      this.kutu(gx + w * 0.25, gy + d * 0.15, taban + olcu.govde, w * 0.5, d * 0.7, olcu.tavan, ustTon);
      this.kutu(gx + w * 0.28, gy + d * 0.18, taban + olcu.govde + olcu.tavan, w * 0.44, d * 0.64, 2, '#2b3444');
    } else {
      /* binek / minibüs: kabin gövdenin ortasında, biraz dar */
      var kUz = cesit === 'minibus' ? w * 0.72 : w * 0.52;
      var kEn = cesit === 'minibus' ? d * 0.84 : d * 0.78;
      var kx2, ky2;
      if (yatay) {
        kx2 = gx + (ileriX > 0 ? w * 0.18 : w - kUz - w * 0.18);
        ky2 = gy + (d - kEn) / 2;
      } else {
        kUz = cesit === 'minibus' ? w * 0.84 : w * 0.78;
        kEn = cesit === 'minibus' ? d * 0.72 : d * 0.52;
        kx2 = gx + (w - kUz) / 2;
        ky2 = gy + (ileriY > 0 ? d * 0.18 : d - kEn - d * 0.18);
      }
      this.kutu(kx2, ky2, taban + olcu.govde, kUz, kEn, olcu.tavan, ustTon);
      /* camlar */
      if (yatay) {
        this.kutu(kx2 + 0.03, ky2 - 0.015, taban + olcu.govde + 2.5, kUz - 0.06, 0.035, olcu.tavan - 4, camRenk);
        this.kutu(kx2 + 0.03, ky2 + kEn - 0.02, taban + olcu.govde + 2.5, kUz - 0.06, 0.035, olcu.tavan - 4, camRenk);
      } else {
        this.kutu(kx2 - 0.015, ky2 + 0.03, taban + olcu.govde + 2.5, 0.035, kEn - 0.06, olcu.tavan - 4, camRenk);
        this.kutu(kx2 + kUz - 0.02, ky2 + 0.03, taban + olcu.govde + 2.5, 0.035, kEn - 0.06, olcu.tavan - 4, camRenk);
      }
      if (cesit === 'taksi') {
        this.kutu(kx2 + kUz * 0.3, ky2 + kEn * 0.3, taban + olcu.govde + olcu.tavan, kUz * 0.4, kEn * 0.4, 3.5, '#2b3444');
      }
    }

    /* --- farlar ve stoplar --- */
    var o = this.kam.olcek;
    var onX = a.gx + ileriX * w * 0.46, onY2 = a.gy + ileriY * d * 0.46;
    var arkaX = a.gx - ileriX * w * 0.46, arkaY = a.gy - ileriY * d * 0.46;
    if (a.durum !== 'park' && a.durum !== 'parkta') {
      if (this.gece()) {
        var fp = this.ekran(onX, onY2, 7);
        var fg = c.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, 22 * o);
        fg.addColorStop(0, 'rgba(255,240,190,.5)');
        fg.addColorStop(1, 'rgba(255,240,190,0)');
        c.fillStyle = fg;
        c.beginPath(); c.arc(fp.x, fp.y, 22 * o, 0, Math.PI * 2); c.fill();
      }
      var p1 = this.ekran(onX, onY2, 7);
      c.fillStyle = this.gece() ? '#fff6d8' : 'rgba(255,248,220,.9)';
      c.beginPath(); c.ellipse(p1.x, p1.y, 2 * o, 1.3 * o, 0, 0, Math.PI * 2); c.fill();
      var p2 = this.ekran(arkaX, arkaY, 7);
      c.fillStyle = a.fren ? '#ff4d4d' : 'rgba(190,60,60,.85)';
      c.beginPath(); c.ellipse(p2.x, p2.y, (a.fren ? 2.4 : 1.7) * o, 1.2 * o, 0, 0, Math.PI * 2); c.fill();
    }
  },

  sabitTon: function (hex, k) {
    if (hex.charAt(0) !== '#') return hex;
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * k));
    var b = Math.min(255, Math.round((n & 255) * k));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  /* =========================================================
     EFEKTLER
     ========================================================= */
  bekleyenHalka: function (gx, gy, m, balonGoster, pompaIdx) {
    var c = this.cz;
    var o = this.kam.olcek;
    var nabiz = 1 + Math.sin(Date.now() / 260) * 0.09;
    var yk = VERI.yakitlar[m.yakit];

    /* yere düşen ışık halkası */
    var zemin = this.ekran(gx, gy, 0);
    c.strokeStyle = 'rgba(62,196,122,.5)';
    c.lineWidth = Math.max(1.2, 2 * o);
    c.beginPath();
    c.ellipse(zemin.x, zemin.y, 19 * o, 9.5 * o, 0, 0, Math.PI * 2);
    c.stroke();

    /* havada duran işaret (bina arkasında kalsa da görünür) */
    var z = 66 + Math.sin(Date.now() / 420) * 4;
    var p = this.ekran(gx, gy, z);
    var r = 10 * o * nabiz;

    /* sapı */
    c.strokeStyle = 'rgba(255,255,255,.28)';
    c.lineWidth = Math.max(1, 1.5 * o);
    c.beginPath(); c.moveTo(p.x, p.y + r * 0.6); c.lineTo(zemin.x, zemin.y); c.stroke();

    c.fillStyle = yk.renk;
    c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
    /* işaretin kendisi de tıklanabilir olsun (pompa binaların arkasında kalabiliyor) */
    if (pompaIdx !== undefined && pompaIdx !== null && this.vurusUst) {
      this.vurusUst.push({ x: p.x, y: p.y, r: Math.max(16, r * 1.9), i: pompaIdx });
      this.vurusUst.push({ x: zemin.x, y: zemin.y, r: Math.max(16, 20 * o), i: pompaIdx });
    }
    c.strokeStyle = 'rgba(255,255,255,.75)';
    c.lineWidth = Math.max(1, 1.8 * o);
    c.stroke();
    c.fillStyle = '#fff';
    c.font = 'bold ' + Math.round(7.6 * o) + 'px sans-serif';
    c.textAlign = 'center';
    c.fillText(yk.kisa, p.x, p.y + 3.4 * o);

    /* istek balonu */
    if (!balonGoster) return;
    var bp = this.ekran(gx, gy, z + 18);
    var yazi = m.etiket;
    if (yazi.length > 16) yazi = yazi.slice(0, 15) + '…';
    c.font = 'bold ' + Math.round(8.5 * o) + 'px sans-serif';
    var w = c.measureText(yazi).width + 10 * o;
    var hh = 14 * o;
    c.fillStyle = 'rgba(16,24,38,.92)';
    this.yuvarlakKutu(bp.x - w / 2, bp.y - hh, w, hh, 6 * o);
    c.fill();
    c.fillStyle = '#eef3f7';
    c.textAlign = 'center';
    c.fillText(yazi, bp.x, bp.y - hh * 0.3);
  },

  yuvarlakKutu: function (x, y, w, h, r) {
    var c = this.cz;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  },

  uyariIsareti: function (gx, gy, z, renk, yazi) {
    var c = this.cz;
    var p = this.ekran(gx, gy, z + 16 + Math.sin(Date.now() / 300) * 3);
    c.fillStyle = renk;
    c.beginPath();
    c.arc(p.x, p.y, 8 * this.kam.olcek, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.font = 'bold ' + Math.round(11 * this.kam.olcek) + 'px sans-serif';
    c.textAlign = 'center';
    c.fillText(yazi, p.x, p.y + 4 * this.kam.olcek);
  },

  isikHuzmesi: function (gx, gy, z) {
    var c = this.cz;
    var p = this.ekran(gx, gy, z);
    var g = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 60 * this.kam.olcek);
    g.addColorStop(0, 'rgba(255,230,160,.35)');
    g.addColorStop(1, 'rgba(255,230,160,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(p.x, p.y, 60 * this.kam.olcek, 0, Math.PI * 2); c.fill();
  },

  dumanCiz: function (gx, gy, z) {
    var c = this.cz;
    var t = (Date.now() % 2000) / 2000;
    for (var i = 0; i < 3; i++) {
      var tt = (t + i / 3) % 1;
      var p = this.ekran(gx, gy, z + tt * 26);
      c.fillStyle = 'rgba(190,196,204,' + (0.35 * (1 - tt)) + ')';
      c.beginPath(); c.arc(p.x, p.y, (3 + tt * 7) * this.kam.olcek, 0, Math.PI * 2); c.fill();
    }
  },

  ucanCiz: function () {
    var c = this.cz;
    for (var i = 0; i < this.ucanlar.length; i++) {
      var u = this.ucanlar[i];
      var yuk = (u.taban || 52) + u.t * 40;
      var p = this.ekran(u.gx, u.gy, yuk);
      var saydam = u.t < 1.2 ? 1 : (1.7 - u.t) / 0.5;
      c.globalAlpha = Math.max(0, saydam);
      /* madeni para rozeti */
      c.font = 'bold ' + Math.round(13 * this.kam.olcek) + 'px sans-serif';
      var w = c.measureText(u.metin).width + 20 * this.kam.olcek;
      var h = 21 * this.kam.olcek;
      c.fillStyle = 'rgba(20,28,44,.9)';
      this.yuvarlakKutu(p.x - w / 2, p.y - h, w, h, h / 2);
      c.fill();
      c.fillStyle = u.renk;
      c.textAlign = 'center';
      c.fillText(u.metin, p.x, p.y - h * 0.28);
      c.globalAlpha = 1;
    }
  },

  /* =========================================================
     GİRDİ
     ========================================================= */
  girdiBagla: function () {
    var t = this.tuval, self = this;

    function nokta(e) {
      var r = t.getBoundingClientRect();
      var d = e.touches && e.touches.length ? e.touches[0] : e;
      return { x: d.clientX - r.left, y: d.clientY - r.top };
    }

    function bas(e) {
      if (e.touches && e.touches.length === 2) {
        var r = t.getBoundingClientRect();
        var a = e.touches[0], b = e.touches[1];
        self._pinch = {
          uz: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          olcek: self.kam.holcek
        };
        self._suruk = null;
        return;
      }
      var p = nokta(e);
      self.kam.vx = self.kam.vy = 0;
      self._suruk = { x: p.x, y: p.y, bx: p.x, by: p.y, kx: self.kam.hx, ky: self.kam.hy,
                      sx: p.x, sy: p.y, st: Date.now(), tasindi: false, t: Date.now() };
    }
    function hareket(e) {
      if (self._pinch && e.touches && e.touches.length === 2) {
        e.preventDefault();
        var a = e.touches[0], b = e.touches[1];
        var uz = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        var yeni = kisitla(self._pinch.olcek * (uz / self._pinch.uz), 0.38, 2.4);
        self.kam.olcek = yeni; self.kam.holcek = yeni;
        return;
      }
      if (!self._suruk) return;
      var p = nokta(e);
      var dx = p.x - self._suruk.bx, dy = p.y - self._suruk.by;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) self._suruk.tasindi = true;
      if (self._suruk.tasindi) {
        e.preventDefault();
        self.kam.hx = self._suruk.kx + dx;
        self.kam.hy = self._suruk.ky + dy;
        self.kam.x = self.kam.hx; self.kam.y = self.kam.hy;   /* sürüklerken birebir */
        var gs = Date.now();
        var ds = Math.max(16, gs - self._suruk.st);
        if (ds > 24) {
          self.kam.vx = (p.x - self._suruk.sx) / ds * 1000;
          self.kam.vy = (p.y - self._suruk.sy) / ds * 1000;
          self._suruk.sx = p.x; self._suruk.sy = p.y; self._suruk.st = gs;
        }
      }
    }
    function birak(e) {
      if (self._pinch) { self._pinch = null; return; }
      if (!self._suruk) return;
      var s = self._suruk;
      self._suruk = null;
      if (s.tasindi || Date.now() - s.t > 1200) return;
      self.kam.vx = self.kam.vy = 0;
      /* touchend sonrası tarayıcı bir de click üretir; açılan pencereyi
         hemen kapatmasın diye bastırıyoruz */
      if (e && e.cancelable && e.preventDefault) { try { e.preventDefault(); } catch (hata) {} }
      self.dokunuldu(s.bx, s.by);
    }

    t.addEventListener('touchstart', bas, { passive: true });
    t.addEventListener('touchmove', hareket, { passive: false });
    t.addEventListener('touchend', birak);
    t.addEventListener('touchcancel', function () { self._suruk = null; self._pinch = null; });
    t.addEventListener('mousedown', bas);
    t.addEventListener('mousemove', hareket);
    t.addEventListener('mouseup', birak);
    t.addEventListener('mouseleave', function () { self._suruk = null; });
    t.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.yakinlas(e.deltaY < 0 ? 1.12 : 0.89);
    }, { passive: false });
  },

  dokunuldu: function (ex, ey) {
    /* en üstte duran işaretler (bekleyen müşteri balonu) */
    var ust = this.vurusUst || [];
    var enYakin = null, enUz = 1e9;
    for (var u = 0; u < ust.length; u++) {
      var d = Math.hypot(ex - ust[u].x, ey - ust[u].y);
      if (d <= ust[u].r && d < enUz) { enUz = d; enYakin = ust[u]; }
    }
    if (enYakin) { UI.hucreTik(enYakin.i); return; }

    /* sonra çizilmiş nesnelerin silueti (öndekiler önce) */
    for (var i = this.vurus.length - 1; i >= 0; i--) {
      if (this.noktaIcinde(ex, ey, this.vurus[i].poly)) {
        UI.hucreTik(this.vurus[i].i);
        return;
      }
    }
    /* boş zemin: karo hesapla */
    var k = this.karo(ex, ey);
    var gx = Math.floor(k.gx), gy = Math.floor(k.gy);
    var sb = D.sube();
    if (gx >= 0 && gx < sb.w && gy >= 0 && gy < sb.h) UI.hucreTik(gy * sb.w + gx);
  },

  noktaIcinde: function (x, y, poly) {
    var ic = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ic = !ic;
    }
    return ic;
  },

  /* kamera yumuşatma + atalet */
  kameraGuncelle: function (dt) {
    var k = this.kam;
    /* sürükleme bittiyse atalet */
    if (!this._suruk && (Math.abs(k.vx) > 0.5 || Math.abs(k.vy) > 0.5)) {
      k.hx += k.vx * dt;
      k.hy += k.vy * dt;
      var sonum = Math.pow(0.0016, dt);
      k.vx *= sonum; k.vy *= sonum;
    }
    var p = 1 - Math.pow(0.0009, dt);     /* kare hızından bağımsız yumuşatma */
    k.x += (k.hx - k.x) * p;
    k.y += (k.hy - k.y) * p;
    k.olcek += (k.holcek - k.olcek) * p;
  },

  /* dışarıdan kamera kontrolleri */
  yakinlas: function (k) {
    var eski = this.kam.holcek;
    this.kam.holcek = kisitla(eski * k, 0.38, 2.4);
    /* ekran merkezini sabit tut */
    var oran = this.kam.holcek / eski;
    this.kam.hx = this.en / 2 - (this.en / 2 - this.kam.hx) * oran;
    this.kam.hy = this.boy / 2 - (this.boy / 2 - this.kam.hy) * oran;
  },
  ortala: function () { this.kameraSifirla(); }
};

/* const ile tanımlanan nesne window üzerinde görünmez; window.IZO denetimleri için bağla */
if (typeof window !== 'undefined') window.IZO = IZO;
