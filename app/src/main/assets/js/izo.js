/* Akaryakıt Patronu — izometrik sahne (canvas)
   Oyun mantığına hiç dokunmaz; sadece D/SIM durumunu çizer ve dokunuşu hücreye çevirir. */
'use strict';

const IZO = {
  tuval: null, cz: null,
  G: 1,                 // devicePixelRatio
  en: 0, boy: 0,
  TW: 64, TH: 32,       // iso karo ölçüsü
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
    this.G = Math.min(window.devicePixelRatio || 1, 2);
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
    var olcek = Math.min(1.45, Math.max(0.52, 5.9 / Math.max(sb.w, sb.h + 1)));
    /* dar ekranda istasyon taşmasın */
    var genislikGerek = (sb.w + sb.h + 2) * this.TW / 2;
    olcek = Math.min(olcek, (this.en - 24) / genislikGerek);
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
  golge: function (gx, gy, w, d, koyu) {
    var c = this.cz;
    var p = this.ekran(gx + w / 2, gy + d / 2, 0);
    var rx = (w + d) * this.TW / 4 * this.kam.olcek * 0.62;
    var ry = (w + d) * this.TH / 4 * this.kam.olcek * 0.62;
    var g = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, Math.max(rx, 6));
    var a = (koyu || 0.3) * this.isik();
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save();
    c.translate(p.x, p.y);
    c.scale(1, ry / Math.max(rx, 1));
    c.translate(-p.x, -p.y);
    c.fillStyle = g;
    c.beginPath(); c.arc(p.x, p.y, Math.max(rx, 6), 0, Math.PI * 2); c.fill();
    c.restore();
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
  silindir: function (gx, gy, z, cap, h, renk) {
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
  },

  /* =========================================================
     ANA DÖNGÜ
     ========================================================= */
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

    for (var i = this.arabalar.length - 1; i >= 0; i--) {
      var a = this.arabalar[i];
      this.arabaIlerlet(a, dt);
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
    var yasak = function (gx, gy, w, h) {
      w = w || 1; h = h || 1;
      /* istasyon arsası + önündeki beton + yol şeridi boş kalsın */
      if (gx + w > -1.6 && gx < sb.w + 1.4 && gy + h > -1.8 && gy < sb.h + 3.2) return true;
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

    var genis = { x0: -11, x1: sb.w + 11, y0: -10, y1: sb.h + 12 };
    var kasaba = { x0: -11, x1: sb.w + 11, y0: sb.h + 4.2, y1: sb.h + 13 };   /* yolun karşısı */
    var arka = { x0: -11, x1: sb.w + 11, y0: -9, y1: -2.2 };                  /* istasyonun arkası */

    /* --- kasaba: yolun karşısında sıra sıra binalar (merkez hissi) --- */
    var binaTipleri = ['apartman', 'apartman', 'dukkan', 'ev', 'ev', 'depo', 'ofis'];
    var binaSayi = 12 + Math.floor(rnd(5));
    for (var b = 0; b < binaSayi; b++) {
      var tip = binaTipleri[Math.floor(rnd(binaTipleri.length))];
      var bw = tip === 'depo' ? 1.5 + rnd(0.5) : (tip === 'ev' ? 0.85 + rnd(0.3) : 1.0 + rnd(0.4));
      var bh = tip === 'depo' ? 1.0 + rnd(0.35) : (tip === 'ev' ? 0.8 + rnd(0.25) : 0.95 + rnd(0.35));
      var yer = yerBul(bw, bh, kasaba);
      if (!yer) continue;
      this.susler.push({
        tip: 'kasabaBina', alt: tip, gx: yer.gx, gy: yer.gy, w: bw, h: bh,
        kat: tip === 'apartman' ? 3 + Math.floor(rnd(3)) : (tip === 'ofis' ? 2 + Math.floor(rnd(2)) : 1),
        renk: ['#d8c6a8', '#e0cdb2', '#c4b39b', '#cdd5dd', '#dfd8c9', '#c3cedb', '#d9b9a4', '#bfd0c4'][Math.floor(rnd(8))],
        cati: ['#8c4b3a', '#7a4435', '#5c6672', '#9a5a44'][Math.floor(rnd(4))],
        tohum: Math.floor(rnd(1000))
      });
    }
    /* cami: kasabanın simgesi */
    var camiYer = yerBul(1.25, 1.25, kasaba, 60);
    if (camiYer) this.susler.push({ tip: 'cami', gx: camiYer.gx, gy: camiYer.gy, w: 1.25, h: 1.25 });

    /* --- tarlalar: arka ve yanlar --- */
    var tarlaSayi = 3 + Math.floor(rnd(2));
    for (var t = 0; t < tarlaSayi; t++) {
      var tw = 1.9 + rnd(1.3), th = 1.5 + rnd(1.0);
      var alan = t % 2 === 0 ? arka : { x0: -12, x1: -3.5, y0: -7, y1: sb.h + 10 };
      var ty = yerBul(tw, th, alan, 40);
      if (!ty) ty = yerBul(tw, th, { x0: sb.w + 2.4, x1: sb.w + 11, y0: -6, y1: sb.h + 9 }, 40);
      if (!ty) continue;
      this.susler.push({
        tip: 'tarla', gx: ty.gx, gy: ty.gy, w: tw, h: th,
        urun: ['bugday', 'ayciceg', 'misir'][Math.floor(rnd(3))]
      });
    }

    /* --- yol boyu aydınlatma direkleri --- */
    for (var d2 = -6; d2 <= sb.w + 7; d2 += 4) {
      this.susler.push({ tip: 'direk', gx: d2, gy: sb.h + 2.45, w: 0.3, h: 0.3, yon: 1 });
    }
    /* otobüs durağı */
    this.susler.push({ tip: 'durak', gx: sb.w + 1.9, gy: sb.h + 2.3, w: 1.2, h: 0.6 });

    /* --- ağaç, çalı, taş serpiştirme --- */
    var dogaSayi = 34;
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

  /* müşterilere araç eşle */
  musteriArabalari: function (sb) {
    var mevcut = {};
    for (var i = 0; i < this.arabalar.length; i++) if (this.arabalar[i].mid) mevcut[this.arabalar[i].mid] = this.arabalar[i];

    for (var k = 0; k < sb.kuyruk.length; k++) {
      var m = sb.kuyruk[k];
      var a = mevcut[m.id];
      if (!a) {
        a = this.arabaYap(sb, m, k);
        this.arabalar.push(a);
        mevcut[m.id] = a;
      }
      a.gorunen = true;
      /* pompaya atandıysa hedefi güncelle */
      if (m.pompa !== null && a.hedefPompa !== m.pompa) {
        a.hedefPompa = m.pompa;
        var px = m.pompa % sb.w, py = Math.floor(m.pompa / sb.w);
        a.yol = [{ gx: px + 0.5, gy: sb.h + 1.5 }, { gx: px + 0.5, gy: py + 1.35 }, { gx: px + 0.5, gy: py + 0.72 }];
        a.durum = 'geliyor';
      }
    }
    /* kuyruktan çıkanlar yola çıksın */
    for (var j = 0; j < this.arabalar.length; j++) {
      var ar = this.arabalar[j];
      if (!ar.mid) continue;
      var varMi = false;
      for (var q = 0; q < sb.kuyruk.length; q++) if (sb.kuyruk[q].id === ar.mid) varMi = true;
      if (!varMi && ar.durum !== 'gidiyor') {
        ar.durum = 'gidiyor';
        ar.yol = [{ gx: ar.gx, gy: sb.h + 1.3 }, { gx: sb.w + 5, gy: sb.h + 1.3 }];
        ar.hiz = 2.4;
      }
    }
  },

  arabaYap: function (sb, m, sira) {
    var renkler = ['#d64545', '#3f7fd0', '#e0a92e', '#4aa96c', '#8a8f99', '#2f3b52', '#c96a2c', '#8e5fc0'];
    var r = renkler[Math.floor(Math.random() * renkler.length)];
    var buyuk = (m.arac === 'Tır' || m.arac === 'Otobüs');
    var baslangic = { gx: -4.5, gy: sb.h + 1.5 };
    var yol;
    if (m.pompa !== null) {
      var px = m.pompa % sb.w, py = Math.floor(m.pompa / sb.w);
      yol = [{ gx: px + 0.5, gy: sb.h + 1.5 }, { gx: px + 0.5, gy: py + 1.35 }, { gx: px + 0.5, gy: py + 0.72 }];
    } else {
      /* sırada bekleyenler girişte kuyruk olur */
      yol = [{ gx: -0.6 - sira * 1.5, gy: sb.h + 0.4 }];
    }
    return {
      mid: m.id, gx: baslangic.gx, gy: baslangic.gy, aci: 0,
      renk: r, buyuk: buyuk, tip: m.arac,
      yol: yol, durum: 'geliyor', hiz: buyuk ? 1.5 : 2.1,
      hedefPompa: m.pompa, sil: false
    };
  },

  cevreTrafigi: function (sb, dt) {
    var say = 0;
    for (var i = 0; i < this.arabalar.length; i++) if (!this.arabalar[i].mid) say++;
    var hedefSayi = Math.min(5, Math.round(D.lok(sb).trafik * 2 * (SIM.saatKat(D.s.saat) || 0.3)));
    if (say < hedefSayi && Math.random() < dt * 0.9) {
      var saga = Math.random() < 0.5;
      var renkler = ['#d64545', '#3f7fd0', '#e0a92e', '#4aa96c', '#8a8f99', '#2f3b52'];
      this.arabalar.push({
        mid: null,
        gx: saga ? -5 : sb.w + 5,
        gy: sb.h + (saga ? 1.3 : 1.72),
        renk: renkler[Math.floor(Math.random() * renkler.length)],
        buyuk: Math.random() < 0.15,
        yol: [{ gx: saga ? sb.w + 5.5 : -5.5, gy: sb.h + (saga ? 1.3 : 1.72) }],
        durum: 'gecis', hiz: 2.2 + Math.random() * 1.4, sil: false
      });
    }
  },

  arabaIlerlet: function (a, dt) {
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
    var gkk = c.createLinearGradient(0, 0, 0, this.boy);
    if (this.gece()) { gkk.addColorStop(0, '#111c30'); gkk.addColorStop(1, '#0c1322'); }
    else { gkk.addColorStop(0, '#9fd3f0'); gkk.addColorStop(1, '#cfe9c4'); }
    c.fillStyle = gkk;
    c.fillRect(0, 0, this.en, this.boy);

    this.vurus = [];
    this.isaretler = [];
    this._balonSayisi = 0;

    var cimenPal = ['#6ca950', '#69a54d', '#70ad54', '#67a24b', '#6eab52'];
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
      liste.push({ d: x + y, tur: 'yapi', i: i, gx: x, gy: y });
    }
    for (var s2 = 0; s2 < (this.susler || []).length; s2++) {
      var su = this.susler[s2];
      liste.push({ d: su.gx + su.gy, tur: 'sus', s: su, gx: su.gx, gy: su.gy });
    }
    for (var pr = 0; pr < (this.personeller || []).length; pr++) {
      var pp = this.personeller[pr];
      liste.push({ d: pp.gx + pp.gy + 0.02, tur: 'insan', p: pp, gx: pp.gx, gy: pp.gy });
    }
    for (var a2 = 0; a2 < this.arabalar.length; a2++) {
      var ar = this.arabalar[a2];
      liste.push({ d: ar.gx + ar.gy, tur: 'araba', a: ar, gx: ar.gx, gy: ar.gy });
    }
    liste.sort(function (p, q) { return p.d - q.d; });

    for (var n = 0; n < liste.length; n++) {
      var o = liste[n];
      if (o.tur === 'yapi') this.yapiCiz(sb, o.i, o.gx, o.gy);
      else if (o.tur === 'sus') this.susCiz(o.s);
      else if (o.tur === 'insan') this.insanCiz(o.p.gx, o.p.gy, o.p.renk, o.p.faz, o.p.sapka);
      else this.arabaCiz(o.a);
    }

    /* işaret katmanı: binalar arkada kalsa da müşteri hep görünür */
    for (var is = 0; is < this.isaretler.length; is++) {
      var ii = this.isaretler[is];
      if (ii.tip === 'bekleyen') this.bekleyenHalka(ii.gx, ii.gy, ii.m, ii.balon);
      else this.uyariIsareti(ii.gx, ii.gy, ii.z, ii.renk, '!');
    }

    /* uçan yazılar */
    this.ucanCiz();
  },

  /* zemin karolarını doğrudan çiz */
  zeminCiz: function (sb, minGX, maxGX, minGY, maxGY, cimenRenk, asfalt, beton, toprak, I) {
    for (var t = minGX + minGY; t <= maxGX + maxGY; t++) {
      var gxBas = Math.max(minGX, t - maxGY), gxSon = Math.min(maxGX, t - minGY);
      for (var gx = gxBas; gx <= gxSon; gx++) {
        var gy = t - gx;
        var ic = (gx >= 0 && gx < sb.w && gy >= 0 && gy < sb.h);
        var yolMu = (gy === sb.h + 1);
        var onluk = (gy === sb.h && gx >= -1 && gx <= sb.w);
        var renk, cimMi = false;
        if (yolMu) renk = asfalt;
        else if (onluk) renk = beton;
        else if (ic) renk = sb.beton[gy * sb.w + gx] ? beton : toprak;
        else { renk = cimenRenk[Math.floor(this.karoRast(gx, gy, 7) * cimenRenk.length) % cimenRenk.length]; cimMi = true; }
        this.zemin(gx, gy, renk, null);
        if (cimMi) this.cimenBenek(gx, gy, I);
        if (ic && !sb.beton[gy * sb.w + gx]) this.satilikTabela(gx, gy);
      }
    }
  },

  /* ---- zemin önbelleği: karolar her karede yeniden çizilmez ---- */
  zeminAnahtar: function (sb, I) {
    var b = 0;
    for (var i = 0; i < sb.beton.length; i++) if (sb.beton[i]) b += (i + 1) * 7;
    return [sb.lok, sb.w, sb.h, b, D.s.sezonIdx, Math.round(I * 12)].join('|');
  },

  zeminHazirla: function (sb, I) {
    var anahtar = this.zeminAnahtar(sb, I);
    if (this._zOnbellek && this._zAnahtar === anahtar) return this._zOnbellek;
    if (this._zDestekYok) return null;

    var pay = 14;                                   /* çevre payı (karo) */
    var minGX = -pay, maxGX = sb.w + pay, minGY = -pay, maxGY = sb.h + pay;
    /* dünya sınırları (ölçek 1) */
    var k1 = this.izo(minGX, minGY), k2 = this.izo(maxGX + 1, minGY),
        k3 = this.izo(minGX, maxGY + 1), k4 = this.izo(maxGX + 1, maxGY + 1);
    var x0 = Math.min(k1.x, k2.x, k3.x, k4.x) - 4, x1 = Math.max(k1.x, k2.x, k3.x, k4.x) + 4;
    var y0 = Math.min(k1.y, k2.y, k3.y, k4.y) - 4, y1 = Math.max(k1.y, k2.y, k3.y, k4.y) + 4;
    var en = Math.ceil(x1 - x0), boy = Math.ceil(y1 - y0);
    if (en <= 0 || boy <= 0 || en * boy > 9e6) { this._zDestekYok = true; return null; }

    var tv;
    try { tv = document.createElement('canvas'); } catch (e) { tv = null; }
    if (!tv || !tv.getContext) { this._zDestekYok = true; return null; }
    tv.width = en; tv.height = boy;
    var tc = tv.getContext('2d');
    if (!tc) { this._zDestekYok = true; return null; }

    /* kamerayı geçici olarak önbellek uzayına al */
    var eskiCz = this.cz, eskiKam = this.kam;
    this.cz = tc;
    this.kam = { x: -x0, y: -y0, olcek: 1, hx: -x0, hy: -y0, holcek: 1, vx: 0, vy: 0, kuruldu: true };
    try {
      var cimenPal = ['#6ca950', '#69a54d', '#70ad54', '#67a24b', '#6eab52'];
      var cimenRenk = [];
      for (var cp = 0; cp < cimenPal.length; cp++) cimenRenk.push(this.ton(cimenPal[cp], I));
      this.zeminCiz(sb, minGX, maxGX, minGY, maxGY, cimenRenk,
        this.ton('#3b4149', I), this.ton('#9aa3ad', I), this.ton('#8a7b5e', I), I);
      this.yolCizgileri(sb);
    } catch (e) {
      this.cz = eskiCz; this.kam = eskiKam; this._zDestekYok = true; return null;
    }
    this.cz = eskiCz; this.kam = eskiKam;

    this._zOnbellek = { tuval: tv, x0: x0, y0: y0, en: en, boy: boy };
    this._zAnahtar = anahtar;
    return this._zOnbellek;
  },

  zeminBlit: function (sb, I) {
    var o = this.zeminHazirla(sb, I);
    if (!o) return false;
    var c = this.cz, k = this.kam;
    c.drawImage(o.tuval,
      o.x0 * k.olcek + k.x, o.y0 * k.olcek + k.y,
      o.en * k.olcek, o.boy * k.olcek);
    return true;
  },

  /* çimende yaprak / çiçek / taşçık benekleri — sabit konumlu */
  cimenBenek: function (gx, gy, I) {
    if (this.kam.olcek < 0.5) return;
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

  satilikTabela: function (gx, gy) {
    var p = this.ekran(gx + 0.5, gy + 0.5, 0);
    var c = this.cz;
    c.globalAlpha = 0.5;
    c.fillStyle = '#ffffff';
    c.font = Math.round(9 * this.kam.olcek) + 'px sans-serif';
    c.textAlign = 'center';
    c.fillText('satılık', p.x, p.y + 3);
    c.globalAlpha = 1;
  },

  yolCizgileri: function (sb) {
    var c = this.cz, I = this.isik();
    var y = sb.h + 1.5;
    /* orta sarı çift çizgi */
    for (var k = 0; k < 2; k++) {
      var oy = y + (k ? 0.04 : -0.04);
      var a = this.ekran(-4, oy, 0), b = this.ekran(sb.w + 5, oy, 0);
      c.strokeStyle = this.ton('#e8c44a', I);
      c.lineWidth = Math.max(1, 1.6 * this.kam.olcek);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    /* kenar beyaz kesikler */
    c.strokeStyle = this.ton('#e8edf2', I);
    c.lineWidth = Math.max(1, 1.3 * this.kam.olcek);
    for (var gx = -4; gx < sb.w + 5; gx += 0.9) {
      var p1 = this.ekran(gx, sb.h + 1.08, 0), p2 = this.ekran(gx + 0.45, sb.h + 1.08, 0);
      c.beginPath(); c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.stroke();
      var q1 = this.ekran(gx, sb.h + 1.92, 0), q2 = this.ekran(gx + 0.45, sb.h + 1.92, 0);
      c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.stroke();
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
    this.golge(gx + 0.08, gy + 0.08, 0.84, 0.36, 0.26);
    this.kutu(gx + 0.06, gy + 0.06, 0, 0.88, 0.38, 3, '#b9c1c9', { tip: 'hucre', i: i });
    /* gövde */
    var govde = p.yakit === 'ev' ? '#2f6fa8' : '#e2683a';
    this.kutu(gx + 0.16, gy + 0.12, 3, 0.26, 0.24, 26, govde, { tip: 'hucre', i: i });
    /* ekran paneli */
    this.kutu(gx + 0.18, gy + 0.10, 16, 0.22, 0.03, 9, this.gece() ? '#9ef0b5' : '#eef3f7');
    /* tabanca kolu */
    this.kutu(gx + 0.44, gy + 0.18, 14, 0.04, 0.04, 4, '#58606b');
    /* ikinci sütun (çok tabancalı) */
    if (p.yakit === 'benzin' || p.yakit === 'dizel') {
      this.kutu(gx + 0.58, gy + 0.12, 3, 0.24, 0.24, 24, govde, { tip: 'hucre', i: i });
      this.kutu(gx + 0.60, gy + 0.10, 15, 0.20, 0.03, 8, this.gece() ? '#9ef0b5' : '#eef3f7');
    }
    /* kanopi: direk + çatı */
    var catiH = 52 + (p.sv - 1) * 2;
    this.kutu(gx + 0.08, gy + 0.08, 3, 0.06, 0.06, catiH, '#cfd6dd');
    this.kutu(gx + 0.86, gy + 0.08, 3, 0.06, 0.06, catiH, '#cfd6dd');
    var catiRenk = p.yakit === 'ev' ? '#3f8ccc' : (p.yakit === 'lpg' ? '#3ec47a' : '#2f9e5e');
    this.kutu(gx - 0.02, gy - 0.04, catiH + 3, 1.04, 0.62, 7, catiRenk, { tip: 'hucre', i: i });
    /* seviye şeridi */
    if (p.sv > 1) {
      var sp = this.ekran(gx + 0.5, gy + 0.3, catiH + 12);
      var c = this.cz;
      c.fillStyle = '#ffd166';
      c.font = 'bold ' + Math.round(9 * this.kam.olcek) + 'px sans-serif';
      c.textAlign = 'center';
      c.fillText('sv' + p.sv, sp.x, sp.y);
    }
    /* bekleyen müşteri halkası */
    if (p.mesgul) {
      var m = SIM.musteriBul(sb, p.mesgul);
      if (m && m.durum === 'pompada') {
        this._balonSayisi = (this._balonSayisi || 0) + 1;
        this.isaretler.push({ tip: 'bekleyen', gx: gx + 0.5, gy: gy + 0.5, m: m, balon: this._balonSayisi <= 2 });
      }
    }
    /* gece aydınlatması */
    if (this.gece()) this.isikHuzmesi(gx + 0.5, gy + 0.3, catiH);
  },

  binaCiz: function (sb, i, gx, gy, b) {
    var kayit = this.cz;
    var merkez = this.ekran(gx + 0.5, gy + 0.5, 0);
    var kucult = 0.84;
    kayit.save();
    kayit.translate(merkez.x, merkez.y);
    kayit.scale(kucult, kucult);
    kayit.translate(-merkez.x, -merkez.y);
    try { this.binaCizIc(sb, i, gx, gy, b); } catch (e) { }
    kayit.restore();
  },

  binaCizIc: function (sb, i, gx, gy, b) {
    var t = b.t;
    var tan = VERI.binalar[t];
    var I = this.isik();

    if (t === 'depo') {
      this.golge(gx + 0.08, gy + 0.08, 0.84, 0.84, 0.3);
      this.kutu(gx + 0.05, gy + 0.05, 0, 0.9, 0.9, 3, '#aab3bd', { tip: 'hucre', i: i });
      this.silindir(gx + 0.12, gy + 0.14, 3, 0.36, 26 + b.sv * 4, '#e8edf2');
      this.silindir(gx + 0.54, gy + 0.14, 3, 0.36, 22 + b.sv * 4, '#5aa9e6');
      this.silindir(gx + 0.32, gy + 0.56, 3, 0.34, 20 + b.sv * 3, '#d9e2ea');
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
      this.silindir(gx + 0.18, gy + 0.18, 5, 0.62, 46, '#dde3ea');
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
      this.golge(gx + 0.35, gy + 0.35, 0.3, 0.3, 0.3);
      this.kutu(gx + 0.42, gy + 0.42, 0, 0.1, 0.1, 62, '#8e98a4');
      /* tabela panosu */
      var ty = 62, tw = 0.86;
      this.kutu(gx + 0.07, gy + 0.4, ty, tw, 0.1, 42, '#16233a', { tip: 'hucre', i: i });
      var c3 = this.cz, o3 = this.kam.olcek;
      var sayac = 0;
      var sbx = D.sube();
      ['benzin', 'dizel', 'lpg'].forEach(function (yk) {
        var tp = IZO.ekran(gx + 0.5, gy + 0.45, ty + 34 - sayac * 12);
        c3.font = 'bold ' + Math.round(8 * o3) + 'px sans-serif';
        c3.textAlign = 'center';
        c3.fillStyle = VERI.yakitlar[yk].renk;
        c3.fillText(VERI.yakitlar[yk].kisa + ' ' + say(sbx.fiyat[yk], 2), tp.x, tp.y);
        sayac++;
      });
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
      this.silindir(gx + 0.26, gy + 0.26, 24, 0.42, 12, '#4a8f6f');
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
    /* pencereler */
    this.pencereler(gx, gy, h, kat);
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
    var c = this.cz, p = this.ekran(gx, gy, 0);
    var g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(2, r * 1.6));
    g.addColorStop(0, 'rgba(20,32,18,.30)');
    g.addColorStop(0.55, 'rgba(20,32,18,.14)');
    g.addColorStop(1, 'rgba(20,32,18,0)');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(p.x, p.y + 1, Math.max(2, r * 1.6), Math.max(1.2, r * 0.8), 0, 0, Math.PI * 2);
    c.fill();
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
      /* teras su deposu */
      this.kutu(s.gx + s.w * 0.6, s.gy + s.h * 0.25, h + 3.5, 0.3, 0.3, 7, '#aeb6bf');
    }
    /* pencereler */
    var c = this.cz;
    var gece = this.gece();
    var kat = s.kat || 1;
    for (var kk = 0; kk < kat; kk++) {
      for (var w = 0; w < 3; w++) {
        var fx = s.gx + s.w * (0.18 + w * 0.28);
        var py = kk * katH + 4;
        var yanik = ((s.tohum + kk * 7 + w * 13) % 10) < 6;
        var renk = gece ? (yanik ? '#ffd98a' : '#2a3340') : '#8fb8d8';
        this.kutu(fx, s.gy - 0.02, py, s.w * 0.17, 0.04, 4.5, renk);
      }
    }
    /* dükkân tentesi */
    if (s.alt === 'dukkan') {
      this.kutu(s.gx + 0.05, s.gy - 0.16, 9, s.w - 0.1, 0.2, 2.5, '#d9534f');
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
    var boyX = a.buyuk ? 1.25 : 0.72;
    var boyY = a.buyuk ? 0.42 : 0.36;
    var gx = a.gx - boyX / 2, gy = a.gy - boyY / 2;
    var govdeY = a.buyuk ? 15 : 11;
    /* gölge */
    var c = this.cz;
    var gp = this.ekran(a.gx, a.gy, 0);
    c.fillStyle = 'rgba(0,0,0,.22)';
    c.beginPath();
    c.ellipse(gp.x, gp.y + 2, boyX * this.TW / 2 * this.kam.olcek * 0.55, boyY * this.TH / 2 * this.kam.olcek * 1.3, 0, 0, Math.PI * 2);
    c.fill();
    /* tekerler */
    this.kutu(gx + 0.08, gy - 0.02, 0, 0.14, boyY + 0.04, 5, '#23282f');
    this.kutu(gx + boyX - 0.22, gy - 0.02, 0, 0.14, boyY + 0.04, 5, '#23282f');
    /* gövde */
    this.kutu(gx, gy, 4, boyX, boyY, govdeY, a.renk);
    /* kabin */
    if (a.buyuk) {
      this.kutu(gx + boyX - 0.42, gy + 0.03, 4 + govdeY, 0.4, boyY - 0.06, 13, this.sabitTon(a.renk, 1.1));
    } else {
      this.kutu(gx + 0.18, gy + 0.04, 4 + govdeY, boyX - 0.4, boyY - 0.08, 9, '#cfe0ee');
    }
    /* fren lambası */
    if (a.fren && a.durum !== 'park') {
      var lp = this.ekran(a.gx - Math.cos(a.aci || 0) * boyX * 0.45, a.gy - Math.sin(a.aci || 0) * boyY * 0.45, 9);
      c.fillStyle = 'rgba(240,82,82,.9)';
      c.beginPath(); c.arc(lp.x, lp.y, 2.4 * this.kam.olcek, 0, Math.PI * 2); c.fill();
    }
    /* gece farları */
    if (this.gece() && a.durum !== 'park') {
      var fp = this.ekran(a.gx + (a.aci > -1.6 && a.aci < 1.6 ? boyX * 0.5 : -boyX * 0.5), a.gy, 9);
      c.fillStyle = 'rgba(255,240,190,.75)';
      c.beginPath(); c.arc(fp.x, fp.y, 3.2 * this.kam.olcek, 0, Math.PI * 2); c.fill();
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
  bekleyenHalka: function (gx, gy, m, balonGoster) {
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
      if (s.tasindi || Date.now() - s.t > 600) return;
      self.kam.vx = self.kam.vy = 0;
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
    /* önce çizilmiş nesnelerin silueti (öndekiler önce) */
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
