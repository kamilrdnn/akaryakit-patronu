/* Akaryakıt Patronu — model katmanı
   izo.js'in üstüne biner: yuvarlak hatlı prizmalar, önbellekli (sprite) modeller,
   yeni ağaç / bina / araç / insan çizimleri ve sürüş-yürüyüş fiziği.
   Oyun mantığına dokunmaz. */
'use strict';

(function () {
  var Z = IZO;

  /* =========================================================
     TEMEL: ışık kovası, renk yardımcıları
     ========================================================= */
  Z.isikKova = function () {
    return Math.round(this.isik() * 8) + '|' + D.s.sezonIdx;
  };
  Z.sezonAd = function () { return VERI.sezonSira[D.s.sezonIdx]; };

  /* iki rengi karıştır (0..1) */
  Z.karis = function (h1, h2, t) {
    var a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
    var g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
    var bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  };

  /* =========================================================
     GÖLGE (hazır sprite ile; her karede gradyan üretmez)
     ========================================================= */
  Z.golge = function (gx, gy, w, d, koyu) {
    var p = this.ekran(gx + w / 2, gy + d / 2, 0);
    var rx = (w + d) * this.TW / 4 * this.kam.olcek * 0.74;
    var ry = (w + d) * this.TH / 4 * this.kam.olcek * 0.74;
    this.golgeCiz(p.x, p.y, Math.max(4, rx), Math.max(2, ry), (koyu || 0.3) * this.isik());
  };

  /* =========================================================
     YUVARLAK PRİZMA
     ========================================================= */
  /** yuvarlatılmış dikdörtgen taban: merkez, uzunluk (gx yönü), en, köşe yarıçapı, açı */
  Z.ayak = function (cx, cy, uz, en, r, aci, seg) {
    seg = seg || 3;
    r = Math.max(0.0001, Math.min(r, uz / 2, en / 2));
    var hx = uz / 2 - r, hy = en / 2 - r;
    var kose = [[hx, hy, 0], [-hx, hy, 90], [-hx, -hy, 180], [hx, -hy, 270]];
    var ca = Math.cos(aci || 0), sa = Math.sin(aci || 0);
    var pts = [];
    for (var k = 0; k < 4; k++) {
      for (var s = 0; s <= seg; s++) {
        var a = (kose[k][2] + 90 * s / seg) * Math.PI / 180;
        var x = kose[k][0] + r * Math.cos(a), y = kose[k][1] + r * Math.sin(a);
        pts.push({ gx: cx + x * ca - y * sa, gy: cy + x * sa + y * ca });
      }
    }
    return pts;
  };

  /** dışbükey taban çokgenini (saat yönü tersine) z'den h kadar yükselt */
  Z.prizma = function (pts, z, h, renk, o) {
    o = o || {};
    var c = this.cz, I = this.isik(), n = pts.length;
    var alt = [], ust = [], i;
    for (i = 0; i < n; i++) {
      alt.push(this.ekran(pts[i].gx, pts[i].gy, z));
      ust.push(this.ekran(pts[i].gx, pts[i].gy, z + h));
    }
    var duvar = o.duvar || renk;
    var zengin = this._zengin;
    for (i = 0; i < n; i++) {
      var j = (i + 1) % n;
      var dx = pts[j].gx - pts[i].gx, dy = pts[j].gy - pts[i].gy;
      var uz = Math.sqrt(dx * dx + dy * dy);
      if (uz < 1e-6) continue;
      var nx = dy / uz, ny = -dx / uz;
      if (nx + ny <= 0.02) continue;                     /* kameraya dönük değil */
      var t = (nx - ny + 1) / 2;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      var k = (o.duvarAlt || 0.56) + 0.24 * t;
      var rk = this.ton(duvar, k * I);
      c.fillStyle = rk;
      c.beginPath();
      c.moveTo(ust[i].x, ust[i].y); c.lineTo(ust[j].x, ust[j].y);
      c.lineTo(alt[j].x, alt[j].y); c.lineTo(alt[i].x, alt[i].y);
      c.closePath(); c.fill();
      c.strokeStyle = rk; c.lineWidth = 0.7; c.stroke();   /* dikişleri kapat */
      if (zengin && h > 5 && !o.duz) {
        /* taban kararması: zemine oturmuş hissi */
        var m1 = this.ekran(pts[i].gx, pts[i].gy, z + h * 0.3), m2 = this.ekran(pts[j].gx, pts[j].gy, z + h * 0.3);
        c.fillStyle = 'rgba(0,0,0,.07)';
        c.beginPath();
        c.moveTo(m1.x, m1.y); c.lineTo(m2.x, m2.y); c.lineTo(alt[j].x, alt[j].y); c.lineTo(alt[i].x, alt[i].y);
        c.closePath(); c.fill();
      }
    }
    if (o.ustsuz) return ust;
    /* üst yüz */
    c.fillStyle = this.ton(o.ust || renk, (o.ustTon || 1.0) * I);
    c.beginPath();
    c.moveTo(ust[0].x, ust[0].y);
    for (i = 1; i < n; i++) c.lineTo(ust[i].x, ust[i].y);
    c.closePath(); c.fill();
    if (!o.kenarsiz) {
      c.strokeStyle = this.ton(o.ust || renk, Math.min(1.3, 1.16 * I));
      c.lineWidth = Math.max(0.6, 0.8 * this.kam.olcek);
      c.stroke();
    }
    return ust;
  };

  /* =========================================================
     KUTU / SİLİNDİR (zengin kipte yuvarlak ve gölgeli)
     ========================================================= */
  var duzKutu = function (gx, gy, z, w, d, h, renk) {
    var I = this.isik();
    var A = this.ekran(gx, gy, z + h), B = this.ekran(gx + w, gy, z + h),
        C = this.ekran(gx + w, gy + d, z + h), Dd = this.ekran(gx, gy + d, z + h);
    var Bk = this.ekran(gx + w, gy, z), Ck = this.ekran(gx + w, gy + d, z), Dk = this.ekran(gx, gy + d, z);
    this.cokgen([Dd, C, Ck, Dk], this.ton(renk, 0.58 * I));
    this.cokgen([B, C, Ck, Bk], this.ton(renk, 0.78 * I));
    this.cokgen([A, B, C, Dd], this.ton(renk, 1.0 * I));
    return { A: A, B: B, C: C, D: Dd, Bk: Bk, Ck: Ck, Dk: Dk };
  };

  Z.kutu = function (gx, gy, z, w, d, h, renk, vurusa) {
    var r;
    if (this._zengin && w >= 0.1 && d >= 0.1 && !this._koseli) {
      var yr = Math.min(0.085, Math.min(w, d) * 0.2);
      this.prizma(this.ayak(gx + w / 2, gy + d / 2, w, d, yr, 0, 2), z, h, renk);
      r = {
        A: this.ekran(gx, gy, z + h), B: this.ekran(gx + w, gy, z + h),
        C: this.ekran(gx + w, gy + d, z + h), D: this.ekran(gx, gy + d, z + h),
        Bk: this.ekran(gx + w, gy, z), Ck: this.ekran(gx + w, gy + d, z), Dk: this.ekran(gx, gy + d, z)
      };
    } else {
      r = duzKutu.call(this, gx, gy, z, w, d, h, renk);
    }
    if (vurusa && !this._vurusKapali && this.vurus) {
      this.vurus.push({ tip: vurusa.tip, i: vurusa.i, poly: [r.A, r.B, r.Bk, r.Ck, r.Dk, r.D] });
    }
    return r;
  };

  Z.silindir = function (gx, gy, z, cap, h, renk, vurusa) {
    var I = this.isik();
    var mx = gx + cap / 2, my = gy + cap / 2;
    var ustM = this.ekran(mx, my, z + h), altM = this.ekran(mx, my, z);
    var rx = cap * this.TW / 2 * this.kam.olcek, ry = cap * this.TH / 2 * this.kam.olcek;
    var c = this.cz;
    if (this._zengin) {
      var g = c.createLinearGradient(ustM.x - rx, 0, ustM.x + rx, 0);
      g.addColorStop(0, this.ton(renk, 0.56 * I));
      g.addColorStop(0.55, this.ton(renk, 0.92 * I));
      g.addColorStop(0.8, this.ton(renk, 1.02 * I));
      g.addColorStop(1, this.ton(renk, 0.76 * I));
      c.fillStyle = g;
    } else c.fillStyle = this.ton(renk, 0.72 * I);
    c.beginPath();
    c.moveTo(ustM.x - rx, ustM.y);
    c.lineTo(ustM.x - rx, altM.y);
    c.ellipse(altM.x, altM.y, rx, ry, 0, Math.PI, 0, true);
    c.lineTo(ustM.x + rx, ustM.y);
    c.ellipse(ustM.x, ustM.y, rx, ry, 0, 0, Math.PI, false);
    c.closePath();
    c.fill();
    c.fillStyle = this.ton(renk, 1.06 * I);
    c.beginPath(); c.ellipse(ustM.x, ustM.y, rx, ry, 0, 0, Math.PI * 2); c.fill();
    if (this._zengin) {
      c.strokeStyle = this.ton(renk, 1.22 * I);
      c.lineWidth = Math.max(0.6, 0.8 * this.kam.olcek);
      c.stroke();
    }
    if (vurusa && !this._vurusKapali && this.vurus) {
      this.vurus.push({
        tip: vurusa.tip, i: vurusa.i,
        poly: [
          { x: ustM.x - rx, y: ustM.y - ry }, { x: ustM.x + rx, y: ustM.y - ry },
          { x: altM.x + rx, y: altM.y }, { x: altM.x + rx, y: altM.y + ry },
          { x: altM.x - rx, y: altM.y + ry }, { x: altM.x - rx, y: altM.y }
        ]
      });
    }
  };

  /* yarım küre (kubbe) */
  Z.kubbe = function (gx, gy, z, cap, renk) {
    var c = this.cz, I = this.isik();
    var m = this.ekran(gx + cap / 2, gy + cap / 2, z);
    var rx = cap * this.TW / 2 * this.kam.olcek, ry = cap * this.TH / 2 * this.kam.olcek;
    var yuk = rx * 0.82;
    var g = c.createRadialGradient(m.x - rx * 0.3, m.y - yuk * 0.6, rx * 0.08, m.x, m.y - yuk * 0.2, rx * 1.15);
    g.addColorStop(0, this.ton(renk, 1.28 * I));
    g.addColorStop(0.5, this.ton(renk, 0.98 * I));
    g.addColorStop(1, this.ton(renk, 0.6 * I));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(m.x - rx, m.y);
    c.bezierCurveTo(m.x - rx, m.y - yuk * 1.25, m.x + rx, m.y - yuk * 1.25, m.x + rx, m.y);
    c.ellipse(m.x, m.y, rx, ry, 0, 0, Math.PI, false);
    c.closePath(); c.fill();
    return { x: m.x, y: m.y - yuk * 0.94 };
  };

  /* =========================================================
     ÇATILAR
     ========================================================= */
  /** beşik çatı: mahya gx yönünde; s = saçak taşması */
  Z.catiBesik = function (gx, gy, z, w, d, h, renk, s) {
    s = s === undefined ? 0.06 : s;
    var I = this.isik(), c = this.cz;
    var R1 = this.ekran(gx - s, gy + d / 2, z + h), R2 = this.ekran(gx + w + s, gy + d / 2, z + h);
    var E1 = this.ekran(gx - s, gy + d + s, z), E2 = this.ekran(gx + w + s, gy + d + s, z);
    var B1 = this.ekran(gx - s, gy - s, z), B2 = this.ekran(gx + w + s, gy - s, z);
    this.cokgen([B1, B2, R2, R1], this.ton(renk, 0.62 * I));            /* arka eğim */
    this.cokgen([B2, E2, R2], this.ton(this.karis(renk, '#ffffff', 0.55), 0.8 * I));   /* kalkan duvarı */
    if (this._zengin) {
      var g = c.createLinearGradient(R1.x, R1.y, E1.x, E1.y);
      g.addColorStop(0, this.ton(renk, 1.1 * I));
      g.addColorStop(1, this.ton(renk, 0.84 * I));
      this.cokgen([R1, R2, E2, E1], g);
      /* kiremit sıraları */
      c.strokeStyle = 'rgba(0,0,0,.10)';
      c.lineWidth = Math.max(0.5, 0.7 * this.kam.olcek);
      for (var k = 1; k < 4; k++) {
        var t = k / 4;
        var a = this.ekran(gx - s, gy + d / 2 + (d / 2 + s) * t, z + h * (1 - t));
        var b = this.ekran(gx + w + s, gy + d / 2 + (d / 2 + s) * t, z + h * (1 - t));
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      }
    } else this.cokgen([R1, R2, E2, E1], this.ton(renk, 0.96 * I));
    /* saçak kalınlığı */
    var E1a = this.ekran(gx - s, gy + d + s, z - 2), E2a = this.ekran(gx + w + s, gy + d + s, z - 2);
    this.cokgen([E1, E2, E2a, E1a], this.ton(renk, 0.6 * I));
  };

  /** kırma çatı: dört eğim */
  Z.catiKirma = function (gx, gy, z, w, d, h, renk, s) {
    s = s === undefined ? 0.06 : s;
    var I = this.isik(), c = this.cz;
    var m = Math.min(w, d) * 0.5;
    var R1 = this.ekran(gx + m * 0.8, gy + d / 2, z + h), R2 = this.ekran(gx + w - m * 0.8, gy + d / 2, z + h);
    var E1 = this.ekran(gx - s, gy + d + s, z), E2 = this.ekran(gx + w + s, gy + d + s, z);
    var B1 = this.ekran(gx - s, gy - s, z), B2 = this.ekran(gx + w + s, gy - s, z);
    this.cokgen([B1, B2, R2, R1], this.ton(renk, 0.6 * I));
    this.cokgen([B2, E2, R2], this.ton(renk, 0.78 * I));
    if (this._zengin) {
      var g = c.createLinearGradient(R1.x, R1.y, E1.x, E1.y);
      g.addColorStop(0, this.ton(renk, 1.1 * I));
      g.addColorStop(1, this.ton(renk, 0.86 * I));
      this.cokgen([E1, E2, R2, R1], g);
    } else this.cokgen([E1, E2, R2, R1], this.ton(renk, 0.96 * I));
    var E1a = this.ekran(gx - s, gy + d + s, z - 2), E2a = this.ekran(gx + w + s, gy + d + s, z - 2);
    var B2a = this.ekran(gx + w + s, gy - s, z - 2);
    this.cokgen([E1, E2, E2a, E1a], this.ton(renk, 0.58 * I));
    this.cokgen([E2, B2, B2a, E2a], this.ton(renk, 0.5 * I));
  };

  /* =========================================================
     CEPHE PARÇALARI: pencere, kapı, tente, levha
     ========================================================= */
  /* yuz: 'on' → gy=sabit düzleminde gx a..b ; 'sag' → gx=sabit düzleminde gy a..b */
  Z.yuzDortgen = function (yuz, a, b, sabit, z1, z2) {
    if (yuz === 'on') {
      return [this.ekran(a, sabit, z2), this.ekran(b, sabit, z2), this.ekran(b, sabit, z1), this.ekran(a, sabit, z1)];
    }
    return [this.ekran(sabit, a, z2), this.ekran(sabit, b, z2), this.ekran(sabit, b, z1), this.ekran(sabit, a, z1)];
  };

  Z.pencere = function (yuz, a, b, sabit, z1, z2, o) {
    o = o || {};
    var c = this.cz, I = this.isik(), gece = this.gece();
    var p = 0.014;
    this.cokgen(this.yuzDortgen(yuz, a - p, b + p, sabit, z1 - 1, z2 + 1), this.ton(o.cerceve || '#f4f1ea', (yuz === 'on' ? 0.9 : 0.98) * I));
    var d = this.yuzDortgen(yuz, a, b, sabit, z1, z2);
    var dolgu;
    if (gece) dolgu = o.sonuk ? '#27313f' : '#ffd98a';
    else {
      dolgu = c.createLinearGradient(d[0].x, d[0].y, d[2].x, d[2].y);
      dolgu.addColorStop(0, this.ton('#cfe9fa', I));
      dolgu.addColorStop(1, this.ton('#7fb0d6', I));
    }
    this.cokgen(d, dolgu);
    if (!o.sade) {
      /* orta kayıt + parıltı */
      c.strokeStyle = this.ton(o.cerceve || '#f4f1ea', 0.95 * I);
      c.lineWidth = Math.max(0.6, 0.8 * this.kam.olcek);
      var u1 = { x: (d[0].x + d[1].x) / 2, y: (d[0].y + d[1].y) / 2 }, u2 = { x: (d[3].x + d[2].x) / 2, y: (d[3].y + d[2].y) / 2 };
      c.beginPath(); c.moveTo(u1.x, u1.y); c.lineTo(u2.x, u2.y); c.stroke();
    }
    if (o.denizlik !== false) {
      this.cokgen(this.yuzDortgen(yuz, a - 0.02, b + 0.02, sabit, z1 - 2.2, z1 - 0.8), this.ton(o.cerceve || '#f4f1ea', 1.05 * I));
    }
  };

  Z.kapi = function (yuz, a, b, sabit, z2, renk, o) {
    o = o || {};
    var I = this.isik(), gece = this.gece();
    this.cokgen(this.yuzDortgen(yuz, a - 0.014, b + 0.014, sabit, 0.5, z2 + 1), this.ton('#f4f1ea', 0.92 * I));
    if (o.cam) {
      this.cokgen(this.yuzDortgen(yuz, a, b, sabit, 0.8, z2), gece ? '#ffe2a6' : this.ton('#9cc7e6', I));
    } else {
      this.cokgen(this.yuzDortgen(yuz, a, b, sabit, 0.8, z2), this.ton(renk, 0.9 * I));
      /* kol */
      var k = this.yuzDortgen(yuz, b - 0.035, b - 0.02, sabit, z2 * 0.45, z2 * 0.55);
      this.cokgen(k, this.ton('#e9c46a', I));
    }
  };

  /** çizgili tente: ön yüzden (gy = sabit) dışarı sarkan */
  Z.tente = function (a, b, sabit, z, cik, renkA, renkB) {
    var I = this.isik();
    var n = Math.max(2, Math.round((b - a) / 0.105));
    var gen = (b - a) / n;
    for (var i = 0; i < n; i++) {
      var x1 = a + i * gen, x2 = x1 + gen;
      var rk = i % 2 === 0 ? renkA : (renkB || '#fbfaf5');
      this.cokgen([this.ekran(x1, sabit, z), this.ekran(x2, sabit, z), this.ekran(x2, sabit + cik, z - 3.5), this.ekran(x1, sabit + cik, z - 3.5)], this.ton(rk, 1.0 * I));
      this.cokgen([this.ekran(x1, sabit + cik, z - 3.5), this.ekran(x2, sabit + cik, z - 3.5), this.ekran(x2, sabit + cik, z - 6), this.ekran(x1, sabit + cik, z - 6)], this.ton(rk, 0.8 * I));
    }
    /* yan üçgen */
    this.cokgen([this.ekran(b, sabit, z), this.ekran(b, sabit + cik, z - 3.5), this.ekran(b, sabit, z - 3.5)], this.ton(renkA, 0.66 * I));
  };

  /** ekrana dönük küçük levha */
  Z.levha = function (gx, gy, z, yazi, zemin, yaziRenk, boyut) {
    var c = this.cz, o = this.kam.olcek, I = this.isik();
    var p = this.ekran(gx, gy, z);
    var b = (boyut || 6.5) * o;
    c.font = 'bold ' + b.toFixed(1) + 'px sans-serif';
    var w = c.measureText(yazi).width + b * 1.1, h = b * 1.55;
    c.fillStyle = this.gece() ? zemin : this.ton(zemin, Math.max(I, 0.85));
    this.yuvarlakKutu(p.x - w / 2, p.y - h, w, h, h * 0.3);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.65)';
    c.lineWidth = Math.max(0.5, 0.7 * o);
    c.stroke();
    c.fillStyle = yaziRenk || '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(yazi, p.x, p.y - h / 2 + b * 0.05);
    c.textBaseline = 'alphabetic';
  };

  /* yumuşak ışık halesi (gece) */
  Z.hale = function (x, y, r, renk, alfa) {
    var c = this.cz;
    var g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + renk + ',' + alfa + ')');
    g.addColorStop(1, 'rgba(' + renk + ',0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  };

  /* =========================================================
     SPRITE ÖNBELLEĞİ
     Durağan modeller bir kez ayrıntılı çizilir, sonra tek kopyayla basılır.
     ========================================================= */
  /* istegeBagli: bütçe bittiyse üretme, eldekini (ya da null) döndür.
     Işık değişince hepsi birden silinmez: eskisi kullanılır, kare başına birkaç tanesi yenilenir. */
  Z.spriteAl = function (anahtar, sinir, gx0, gy0, cizFn, istegeBagli) {
    var kova = this.isikKova();
    if (!this._spr) { this._spr = {}; this._sprSay = 0; }
    this._sprKova = kova;
    var sp = this._spr[anahtar];
    if (sp && (sp.kova === kova || sp.hata)) return sp;
    if (this._sprYok) return sp || null;
    if (this._sprButce === undefined) this._sprButce = 4;
    if (this._sprButce <= 0 && (sp || istegeBagli)) return sp || null;
    this._sprButce--;
    var S = sinir.S || 2;
    var en = Math.ceil((sinir.sol + sinir.sag) * S), boy = Math.ceil((sinir.ust + sinir.alt) * S);
    var tv, tc;
    if (sp && sp.tuval && sp.tuval.width === en && sp.tuval.height === boy) {
      tv = sp.tuval; tc = tv.getContext('2d');
      tc.setTransform(1, 0, 0, 1, 0, 0); tc.clearRect(0, 0, en, boy);
    } else {
      try { tv = document.createElement('canvas'); } catch (e) { tv = null; }
      if (!tv || !tv.getContext) { this._sprYok = true; return null; }
      tv.width = en; tv.height = boy;
      tc = tv.getContext('2d');
    }
    if (!tc) { this._sprYok = true; return null; }
    var yeniAnahtar = !sp;

    var iz = this.izo(gx0, gy0);
    var eskiCz = this.cz, eskiKam = this.kam, eskiZ = this._zengin, eskiV = this._vurusKapali;
    this.cz = tc;
    this.kam = { x: sinir.sol * S - iz.x * S, y: sinir.ust * S - iz.y * S, olcek: S, hx: 0, hy: 0, holcek: S, vx: 0, vy: 0, kuruldu: true };
    this._zengin = true;
    this._vurusKapali = true;
    var hata = false;
    try { cizFn.call(this); } catch (e) { hata = true; this._sprHata = (e && e.message) || String(e); }
    this.cz = eskiCz; this.kam = eskiKam; this._zengin = eskiZ; this._vurusKapali = eskiV;

    sp = hata ? { hata: true } : { tuval: tv, sol: sinir.sol, ust: sinir.ust, en: en / S, boy: boy / S, kova: kova };
    this._spr[anahtar] = sp;
    if (yeniAnahtar && ++this._sprSay > 900) {
      /* en eski 250 kaydı bırak (anahtarlar eklenme sırasıyla gezilir) */
      var sil = 250;
      for (var esk in this._spr) { if (sil-- <= 0) break; delete this._spr[esk]; this._sprSay--; }
    }
    return sp;
  };

  /** önbellekten bas; önbellek yoksa doğrudan çiz */
  Z.spriteli = function (anahtar, sinir, gx0, gy0, cizFn) {
    var sp = this.spriteAl(anahtar, sinir, gx0, gy0, cizFn);
    if (sp && !sp.hata) {
      var p = this.ekran(gx0, gy0, 0), o = this.kam.olcek;
      this.cz.drawImage(sp.tuval, p.x - sp.sol * o, p.y - sp.ust * o, sp.en * o, sp.boy * o);
      return true;
    }
    var eskiV = this._vurusKapali;
    this._vurusKapali = true;
    try { cizFn.call(this); } catch (e) { }
    this._vurusKapali = eskiV;
    return false;
  };

  /* =========================================================
     DOĞA: ağaç, çalı, taş
     ========================================================= */
  Z.yaprakPaleti = function (tohum) {
    var sezon = this.sezonAd();
    if (sezon === 'kis') return ['#e6eef2', '#c9d7de', '#f7fbfd'];
    if (sezon === 'sonbahar') {
      return [['#d9822b', '#b5601c', '#f0a94a'], ['#c9502e', '#9f3a20', '#e87d52'], ['#d9a62b', '#b3841b', '#f2c95a']][tohum % 3];
    }
    if (sezon === 'ilkbahar') return [['#6dbf52', '#4f9b3c', '#9fdc7c'], ['#7cc65a', '#58a341', '#aee38a']][tohum % 2];
    return [['#4d9a41', '#357a2f', '#7fc266'], ['#3f8f4a', '#2c6f38', '#6fb873'], ['#5aa23c', '#3f8029', '#8fca62']][tohum % 3];
  };

  Z.lob = function (x, y, r, pal) {
    var c = this.cz, I = this.isik();
    var g = c.createRadialGradient(x - r * 0.35, y - r * 0.42, r * 0.08, x, y, r);
    g.addColorStop(0, this.ton(pal[2], I));
    g.addColorStop(0.55, this.ton(pal[0], I));
    g.addColorStop(1, this.ton(pal[1], I));
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  };

  Z.agacModel = function (s) {
    var c = this.cz, o = this.kam.olcek, I = this.isik(), sezon = this.sezonAd();
    var P = this.ekran(s.gx + 0.5, s.gy + 0.5, 0);
    var b = (s.boy || 1) * o, tur = (s.tohum || 0) % 4;      /* 0,1: yapraklı · 2: çam · 3: kavak */
    this.golgeCiz(P.x + 3 * o, P.y + 1.5 * o, 17 * b, 7.5 * b, 0.34);

    var gh = (tur === 2 ? 9 : (tur === 3 ? 13 : 16)) * b, gw = 3.1 * b;
    var gg = c.createLinearGradient(P.x - gw, 0, P.x + gw, 0);
    gg.addColorStop(0, this.ton('#5a3d26', I));
    gg.addColorStop(0.6, this.ton('#8c6442', I));
    gg.addColorStop(1, this.ton('#6b4a2e', I));
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(P.x - gw, P.y + 1 * o);
    c.quadraticCurveTo(P.x - gw * 0.5, P.y - gh * 0.5, P.x - gw * 0.5, P.y - gh);
    c.lineTo(P.x + gw * 0.5, P.y - gh);
    c.quadraticCurveTo(P.x + gw * 0.5, P.y - gh * 0.5, P.x + gw, P.y + 1 * o);
    c.closePath(); c.fill();

    var pal = this.yaprakPaleti(s.tohum || 0);
    if (tur === 2) {
      /* çam: üç kat yumuşak üçgen */
      var cam = sezon === 'kis' ? ['#5f8f72', '#3f6f55', '#8fb89c'] : ['#3d8456', '#2a6440', '#63a878'];
      for (var k = 0; k < 3; k++) {
        var yb = P.y - gh + 2 * b - k * 9.5 * b;
        var hw = (15.5 - k * 3.8) * b, ht = 16 * b;
        var g3 = c.createLinearGradient(P.x - hw, 0, P.x + hw, 0);
        g3.addColorStop(0, this.ton(cam[1], I));
        g3.addColorStop(0.65, this.ton(cam[0], I));
        g3.addColorStop(1, this.ton(cam[2], I));
        c.fillStyle = g3;
        c.beginPath();
        c.moveTo(P.x - hw, yb);
        c.quadraticCurveTo(P.x, yb + 4.5 * b, P.x + hw, yb);
        c.quadraticCurveTo(P.x + hw * 0.3, yb - ht * 0.55, P.x, yb - ht);
        c.quadraticCurveTo(P.x - hw * 0.3, yb - ht * 0.55, P.x - hw, yb);
        c.closePath(); c.fill();
        if (sezon === 'kis') {
          c.fillStyle = 'rgba(255,255,255,.9)';
          c.beginPath();
          c.moveTo(P.x, yb - ht);
          c.quadraticCurveTo(P.x + hw * 0.42, yb - ht * 0.45, P.x + hw * 0.5, yb - ht * 0.3);
          c.quadraticCurveTo(P.x, yb - ht * 0.42, P.x - hw * 0.5, yb - ht * 0.3);
          c.quadraticCurveTo(P.x - hw * 0.42, yb - ht * 0.45, P.x, yb - ht);
          c.fill();
        }
      }
      return;
    }
    if (tur === 3) {
      /* kavak: uzun damla */
      var cy = P.y - gh - 17 * b;
      c.save();
      c.translate(P.x, cy); c.scale(0.55, 1.25);
      this.lob(0, 0, 15 * b, pal);
      c.restore();
      this.lob(P.x - 2.5 * b, cy + 9 * b, 7.5 * b, pal);
      this.lob(P.x + 3 * b, cy + 6 * b, 7 * b, pal);
      return;
    }
    /* yapraklı: bulut gibi loblar */
    var ty = P.y - gh;
    var loblar = [[-9.5, -4, 8.8], [9.5, -5, 8.6], [0, -9, 12.2], [-5, -17, 8.4], [6, -15.5, 8]];
    for (var i = 0; i < loblar.length; i++) this.lob(P.x + loblar[i][0] * b, ty + loblar[i][1] * b, loblar[i][2] * b, pal);
    if (sezon === 'ilkbahar' && (s.tohum || 0) % 3 === 0) {
      c.fillStyle = this.ton('#ffd3e2', I);
      for (var f = 0; f < 9; f++) {
        var ax = P.x + Math.sin(f * 2.4 + s.tohum) * 11 * b, ay = ty - 9 * b + Math.cos(f * 1.7 + s.tohum) * 9 * b;
        c.beginPath(); c.arc(ax, ay, 1.5 * b, 0, Math.PI * 2); c.fill();
      }
    }
    if (sezon === 'kis') {
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath(); c.ellipse(P.x - 1 * b, ty - 19 * b, 9 * b, 4 * b, 0, 0, Math.PI * 2); c.fill();
    }
  };

  Z.caliModel = function (s) {
    var c = this.cz, o = this.kam.olcek, I = this.isik(), sezon = this.sezonAd();
    var P = this.ekran(s.gx + 0.5, s.gy + 0.5, 0), b = (s.boy || 1) * o;
    this.golgeCiz(P.x + 1.5 * o, P.y + 1 * o, 10 * b, 4.5 * b, 0.3);
    var pal = sezon === 'kis' ? ['#dfe8ec', '#c3d1d8', '#f6fafc'] : (sezon === 'sonbahar' ? ['#8f9f45', '#6f7e31', '#b3c266'] : ['#58a348', '#3d8334', '#86c873']);
    this.lob(P.x - 5 * b, P.y - 3.5 * b, 5.2 * b, pal);
    this.lob(P.x + 5 * b, P.y - 3.8 * b, 5 * b, pal);
    this.lob(P.x, P.y - 6.5 * b, 6.6 * b, pal);
    if ((sezon === 'ilkbahar' || sezon === 'yaz') && (s.tohum || 0) % 2 === 0) {
      var cicek = ['#ffffff', '#ffd166', '#ff9bb3'][(s.tohum || 0) % 3];
      c.fillStyle = this.ton(cicek, I);
      for (var f = 0; f < 5; f++) {
        c.beginPath(); c.arc(P.x + Math.sin(f * 2.1 + s.tohum) * 6 * b, P.y - 6 * b + Math.cos(f * 1.9) * 3.5 * b, 1.15 * b, 0, Math.PI * 2); c.fill();
      }
    }
  };

  Z.tasModel = function (s) {
    var c = this.cz, o = this.kam.olcek, I = this.isik();
    var P = this.ekran(s.gx + 0.5, s.gy + 0.5, 0), b = (s.boy || 1) * o;
    this.golgeCiz(P.x + 1 * o, P.y + 0.5 * o, 8 * b, 3.5 * b, 0.3);
    var g = c.createLinearGradient(P.x - 6 * b, P.y - 8 * b, P.x + 6 * b, P.y);
    g.addColorStop(0, this.ton('#c2c9d1', I));
    g.addColorStop(1, this.ton('#7f8892', I));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(P.x - 6.5 * b, P.y);
    c.quadraticCurveTo(P.x - 7 * b, P.y - 5.5 * b, P.x - 2 * b, P.y - 7 * b);
    c.quadraticCurveTo(P.x + 3.5 * b, P.y - 8 * b, P.x + 6 * b, P.y - 3.5 * b);
    c.quadraticCurveTo(P.x + 7.5 * b, P.y, P.x + 4 * b, P.y + 1 * b);
    c.quadraticCurveTo(P.x - 3 * b, P.y + 1.8 * b, P.x - 6.5 * b, P.y);
    c.fill();
    if (this.sezonAd() === 'kis') {
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath(); c.ellipse(P.x - 0.5 * b, P.y - 6.2 * b, 4.5 * b, 1.8 * b, 0, 0, Math.PI * 2); c.fill();
    }
  };

  /* =========================================================
     TARLA
     ========================================================= */
  Z.tarlaModel = function (s) {
    var c = this.cz, o = this.kam.olcek, I = this.isik(), sezon = this.sezonAd();
    var kis = sezon === 'kis';
    var a = this.ekran(s.gx, s.gy, 0), b = this.ekran(s.gx + s.w, s.gy, 0),
        d = this.ekran(s.gx + s.w, s.gy + s.h, 0), e = this.ekran(s.gx, s.gy + s.h, 0);
    var g = c.createLinearGradient(a.x, a.y, d.x, d.y);
    g.addColorStop(0, this.ton(kis ? '#b9b3a4' : '#7a5e3e', I));
    g.addColorStop(1, this.ton(kis ? '#a39c8c' : '#63492d', I));
    this.cokgen([a, b, d, e], g);

    var urun = s.urun || 'bugday';
    var renkler = kis ? ['#eef3f6', '#dfe7ec'] :
      (urun === 'ayciceg' ? ['#5f9a3e', '#4d8432'] : (urun === 'misir' ? ['#7fae45', '#6a9638'] : ['#d9bd5c', '#c7a947']));
    c.lineCap = 'round';
    var sira = 0;
    for (var gy = s.gy + 0.2; gy < s.gy + s.h - 0.08; gy += 0.24) {
      var p1 = this.ekran(s.gx + 0.14, gy, 2.5), p2 = this.ekran(s.gx + s.w - 0.14, gy, 2.5);
      c.strokeStyle = this.ton(renkler[sira % 2], I);
      c.lineWidth = Math.max(1.5, 3.6 * o);
      c.beginPath(); c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.stroke();
      c.strokeStyle = this.ton(renkler[sira % 2], I * 1.2);
      c.lineWidth = Math.max(0.8, 1.2 * o);
      c.beginPath(); c.moveTo(p1.x, p1.y - 1.4 * o); c.lineTo(p2.x, p2.y - 1.4 * o); c.stroke();
      if (!kis && urun === 'ayciceg') {
        for (var gx = s.gx + 0.22; gx < s.gx + s.w - 0.15; gx += 0.3) {
          var q = this.ekran(gx + (sira % 2) * 0.12, gy, 6);
          c.fillStyle = this.ton('#f2c230', I);
          c.beginPath(); c.arc(q.x, q.y, 2.3 * o, 0, Math.PI * 2); c.fill();
          c.fillStyle = this.ton('#7a4a1e', I);
          c.beginPath(); c.arc(q.x, q.y, 0.95 * o, 0, Math.PI * 2); c.fill();
        }
      }
      sira++;
    }
    c.lineCap = 'butt';

    /* çit: yuvarlak başlı kazıklar + iki sıra tahta */
    var kose = [[s.gx, s.gy], [s.gx + s.w, s.gy], [s.gx + s.w, s.gy + s.h], [s.gx, s.gy + s.h]];
    var sirala = [0, 3, 1, 2];                        /* arkadan öne */
    for (var kk = 0; kk < 4; kk++) {
      var k = sirala[kk];
      var p = kose[k], q2 = kose[(k + 1) % 4];
      var r1 = this.ekran(p[0], p[1], 7), r2 = this.ekran(q2[0], q2[1], 7);
      var r3 = this.ekran(p[0], p[1], 3.5), r4 = this.ekran(q2[0], q2[1], 3.5);
      c.strokeStyle = this.ton('#a9865a', I);
      c.lineWidth = Math.max(1, 1.5 * o);
      c.beginPath(); c.moveTo(r1.x, r1.y); c.lineTo(r2.x, r2.y); c.moveTo(r3.x, r3.y); c.lineTo(r4.x, r4.y); c.stroke();
      var adet = Math.max(2, Math.round((Math.abs(p[0] - q2[0]) + Math.abs(p[1] - q2[1])) * 2.4));
      c.lineCap = 'round';
      for (var i = 0; i <= adet; i++) {
        var fx = p[0] + (q2[0] - p[0]) * (i / adet), fy = p[1] + (q2[1] - p[1]) * (i / adet);
        var t1 = this.ekran(fx, fy, 0), t2 = this.ekran(fx, fy, 9.5);
        c.strokeStyle = this.ton('#8a6a42', I);
        c.lineWidth = Math.max(1.4, 2.6 * o);
        c.beginPath(); c.moveTo(t1.x, t1.y); c.lineTo(t2.x, t2.y); c.stroke();
      }
      c.lineCap = 'butt';
    }
  };

  /* =========================================================
     KASABA BİNALARI
     ========================================================= */
  Z.kasabaModel = function (s) {
    var c = this.cz, o = this.kam.olcek, I = this.isik(), gece = this.gece(), kis = this.sezonAd() === 'kis';
    var gx = s.gx, gy = s.gy, w = s.w, d = s.h, alt = s.alt, th = s.tohum || 0;
    this.golgeCiz(this.ekran(gx + w / 2 + 0.12, gy + d / 2 + 0.12, 0).x, this.ekran(gx + w / 2 + 0.12, gy + d / 2 + 0.12, 0).y,
      (w + d) * this.TW / 4 * o * 0.95, (w + d) * this.TH / 4 * o * 0.95, 0.36);
    var on = gy + d, sag = gx + w;
    var katH = 13, kat = s.kat || 1, h;

    if (alt === 'ev') {
      h = 15;
      this.kutu(gx, gy, 0, w, d, h, s.renk);
      this.catiBesik(gx, gy, h, w, d, 11, s.cati, 0.07);
      if (kis) this.cokgen([this.ekran(gx - 0.07, gy + d / 2, h + 11.6), this.ekran(sag + 0.07, gy + d / 2, h + 11.6),
        this.ekran(sag + 0.07, on - 0.05, h + 3.5), this.ekran(gx - 0.07, on - 0.05, h + 3.5)], 'rgba(255,255,255,.88)');
      /* baca */
      this._koseli = true;
      this.kutu(gx + w * 0.68, gy + d * 0.26, h + 6, 0.11, 0.11, 8, '#b5654a');
      this._koseli = false;
      this.kapi('on', gx + w * 0.42, gx + w * 0.58, on, 9.5, ['#8a5a3b', '#3f6fa5', '#9a3f3f', '#3f7a5a'][th % 4]);
      this.pencere('on', gx + w * 0.12, gx + w * 0.32, on, 5, 10.5, { sonuk: th % 3 === 0 });
      this.pencere('on', gx + w * 0.68, gx + w * 0.88, on, 5, 10.5, { sonuk: th % 4 === 1 });
      this.pencere('sag', gy + d * 0.3, gy + d * 0.62, sag, 5, 10.5, { sonuk: th % 2 === 0 });
      if (s.bahce && !kis) {
        var pal = ['#58a348', '#3d8334', '#86c873'];
        for (var bi = 0; bi < 3; bi++) {
          var bp = this.ekran(gx + w * (0.14 + bi * 0.1), on + 0.1, 0);
          this.lob(bp.x, bp.y - 2.5 * o, 3.1 * o, pal);
        }
        var cp = this.ekran(gx + w * 0.8, on + 0.1, 0);
        c.fillStyle = this.ton(['#ff8fab', '#ffd166', '#ffffff'][th % 3], I);
        for (var f = 0; f < 4; f++) { c.beginPath(); c.arc(cp.x + (f - 1.5) * 2.6 * o, cp.y - 2 * o - (f % 2) * 1.5 * o, 1.3 * o, 0, Math.PI * 2); c.fill(); }
      }
    } else if (alt === 'dukkan') {
      h = 17;
      this.kutu(gx, gy, 0, w, d, h, s.renk);
      this.kutu(gx - 0.04, gy - 0.04, h, w + 0.08, d + 0.08, 3, this.karis(s.renk, '#6b6f78', 0.55));
      var tr = ['#d9534f', '#3f8f6f', '#3f6fb5', '#e09a2e'][th % 4];
      this.pencere('on', gx + w * 0.1, gx + w * 0.56, on, 3, 11, { sade: true, denizlik: false });
      this.kapi('on', gx + w * 0.66, gx + w * 0.88, on, 11, '#6b4a2e', { cam: true });
      this.tente(gx + 0.03, sag - 0.03, on, 15.5, 0.16, tr, '#fbfaf5');
      this.pencere('sag', gy + d * 0.25, gy + d * 0.7, sag, 5, 11, { sonuk: th % 2 === 0 });
      this.levha(gx + w / 2, on, 23.5, ['BAKKAL', 'FIRIN', 'ECZANE', 'MANAV'][th % 4], tr, '#fff', 4.6);
    } else if (alt === 'depo') {
      h = 15;
      this.kutu(gx, gy, 0, w, d, h, '#c9cfd6');
      this.catiBesik(gx, gy, h, w, d, 7, '#7f8b98', 0.04);
      this.cokgen(this.yuzDortgen('on', gx + w * 0.34, gx + w * 0.66, on, 0.6, 11.5), this.ton('#5d6875', 0.9 * I));
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = Math.max(0.5, 0.7 * o);
      for (var rl = 3; rl < 11; rl += 2.2) {
        var l1 = this.ekran(gx + w * 0.34, on, rl), l2 = this.ekran(gx + w * 0.66, on, rl);
        c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
      }
    } else {
      /* apartman / ofis */
      h = katH * kat + 3;
      var ofis = alt === 'ofis';
      this.kutu(gx, gy, 0, w, d, h, ofis ? '#d5dde6' : s.renk);
      this.kutu(gx - 0.04, gy - 0.04, h, w + 0.08, d + 0.08, 3.2, ofis ? '#55657a' : this.karis(s.renk, '#5c5f66', 0.6));
      for (var kk = 0; kk < kat; kk++) {
        var zb = kk * katH + 4.5;
        if (ofis) {
          this.pencere('on', gx + w * 0.08, gx + w * 0.92, on, zb, zb + 7.5, { sade: true, denizlik: false, cerceve: '#55657a', sonuk: (th + kk) % 3 === 0 });
          this.pencere('sag', gy + d * 0.1, gy + d * 0.9, sag, zb, zb + 7.5, { sade: true, denizlik: false, cerceve: '#55657a', sonuk: (th + kk) % 2 === 0 });
        } else {
          for (var pw = 0; pw < 3; pw++) {
            var a1 = gx + w * (0.1 + pw * 0.3);
            this.pencere('on', a1, a1 + w * 0.19, on, zb, zb + 7, { sonuk: (th + kk * 3 + pw * 5) % 5 < 2 });
          }
          this.pencere('sag', gy + d * 0.16, gy + d * 0.42, sag, zb, zb + 7, { sonuk: (th + kk) % 3 === 0 });
          this.pencere('sag', gy + d * 0.58, gy + d * 0.84, sag, zb, zb + 7, { sonuk: (th + kk * 2) % 4 === 0 });
          /* balkon */
          if (kk > 0) {
            this._koseli = true;
            this.kutu(gx + w * 0.38, on, zb - 2.2, w * 0.24, 0.07, 1.4, '#eef0f2');
            this.kutu(gx + w * 0.38, on + 0.06, zb - 0.8, w * 0.24, 0.012, 3.2, this.karis(s.cati, '#ffffff', 0.25));
            this._koseli = false;
          }
        }
      }
      this.kapi('on', gx + w * 0.43, gx + w * 0.57, on, 3.9 + (ofis ? 4 : 0), '#5a4636', { cam: ofis });
      if (kis) this.cokgen([this.ekran(gx - 0.04, gy - 0.04, h + 3.6), this.ekran(sag + 0.04, gy - 0.04, h + 3.6),
        this.ekran(sag + 0.04, on + 0.04, h + 3.6), this.ekran(gx - 0.04, on + 0.04, h + 3.6)], 'rgba(255,255,255,.9)');
    }
    if (gece && alt !== 'depo') {
      var hp = this.ekran(gx + w / 2, on, 8);
      this.hale(hp.x, hp.y, 20 * o, '255,214,140', 0.16);
    }
  };

  Z.camiModel = function (s) {
    var c = this.cz, o = this.kam.olcek, I = this.isik();
    var gx = s.gx, gy = s.gy, w = s.w, d = s.h;
    var gp = this.ekran(gx + w / 2 + 0.1, gy + d / 2 + 0.1, 0);
    this.golgeCiz(gp.x, gp.y, (w + d) * this.TW / 4 * o, (w + d) * this.TH / 4 * o, 0.36);
    this.kutu(gx, gy, 0, w, d, 17, '#efe8da');
    this.kutu(gx - 0.03, gy - 0.03, 17, w + 0.06, d + 0.06, 2.5, '#d9cfbb');
    this.pencere('on', gx + w * 0.14, gx + w * 0.3, gy + d, 5, 12, { sade: true });
    this.pencere('on', gx + w * 0.7, gx + w * 0.86, gy + d, 5, 12, { sade: true });
    this.kapi('on', gx + w * 0.42, gx + w * 0.58, gy + d, 11, '#6b4a2e');
    this.pencere('sag', gy + d * 0.3, gy + d * 0.7, gx + w, 5, 12, { sade: true });
    /* kasnak + kubbe */
    this.silindir(gx + w * 0.2, gy + d * 0.2, 19.5, w * 0.6, 4, '#e3dccb');
    var tepe = this.kubbe(gx + w * 0.2, gy + d * 0.2, 23.5, w * 0.6, '#6f9fc4');
    c.strokeStyle = this.ton('#e3c15a', I); c.lineWidth = Math.max(1, 1.5 * o); c.lineCap = 'round';
    c.beginPath(); c.moveTo(tepe.x, tepe.y); c.lineTo(tepe.x, tepe.y - 6 * o); c.stroke();
    c.beginPath(); c.arc(tepe.x + 0.6 * o, tepe.y - 8 * o, 2.2 * o, 0.7, 5.3); c.stroke();
    c.lineCap = 'butt';
    /* minare */
    var mx = gx + w - 0.2, my = gy + 0.06;
    this.silindir(mx, my, 0, 0.17, 40, '#f3eee3');
    this.silindir(mx - 0.03, my - 0.03, 28, 0.23, 2.6, '#d9cfbb');
    var mt = this.ekran(mx + 0.085, my + 0.085, 40);
    var rw = 0.17 * this.TW / 2 * o;
    c.fillStyle = this.ton('#6f9fc4', I);
    c.beginPath();
    c.moveTo(mt.x - rw * 1.15, mt.y + 1 * o);
    c.quadraticCurveTo(mt.x - rw * 0.4, mt.y - 9 * o, mt.x, mt.y - 15 * o);
    c.quadraticCurveTo(mt.x + rw * 0.4, mt.y - 9 * o, mt.x + rw * 1.15, mt.y + 1 * o);
    c.closePath(); c.fill();
  };

  Z.direkModel = function (s) {
    var c = this.cz, o = this.kam.olcek, I = this.isik(), gece = this.gece();
    var kucuk = !!s.kucuk;
    var boy = kucuk ? 30 : 44;
    var P = this.ekran(s.gx + 0.5, s.gy + 0.5, 0);
    this.golgeCiz(P.x, P.y, 5 * o, 2.4 * o, 0.3);
    c.lineCap = 'round';
    c.strokeStyle = this.ton('#7c8794', I);
    c.lineWidth = Math.max(1.6, 2.6 * o);
    c.beginPath();
    c.moveTo(P.x, P.y);
    c.lineTo(P.x, P.y - (boy - 6) * o);
    c.quadraticCurveTo(P.x, P.y - boy * o, P.x - 8 * o, P.y - (boy + 1) * o);
    c.stroke();
    c.strokeStyle = this.ton('#5d6875', I);
    c.lineWidth = Math.max(2, 3.6 * o);
    c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(P.x, P.y - 5 * o); c.stroke();
    c.lineCap = 'butt';
    var L = { x: P.x - 9.5 * o, y: P.y - (boy + 0.5) * o };
    if (gece) this.hale(L.x, L.y + 4 * o, (kucuk ? 26 : 36) * o, '255,226,150', 0.5);
    c.fillStyle = gece ? '#fff3c4' : this.ton('#dfe5eb', I);
    c.beginPath(); c.ellipse(L.x, L.y, 4 * o, 2.1 * o, -0.15, 0, Math.PI * 2); c.fill();
  };

  Z.durakModel = function (s) {
    var I = this.isik();
    var gx = s.gx, gy = s.gy, w = s.w, d = s.h;
    this.golge(gx, gy, w, d, 0.3);
    this.kutu(gx, gy, 0, w, d, 1.6, '#c6ccd3');
    /* arka cam */
    this.cokgen(this.yuzDortgen('on', gx + 0.05, gx + w - 0.05, gy + 0.06, 2, 17), 'rgba(160,205,235,' + (0.55 * I) + ')');
    this._koseli = true;
    this.kutu(gx + 0.03, gy + 0.03, 1.6, 0.05, 0.05, 17, '#5d6875');
    this.kutu(gx + w - 0.08, gy + 0.03, 1.6, 0.05, 0.05, 17, '#5d6875');
    this.kutu(gx + 0.12, gy + 0.14, 1.6, w - 0.24, 0.13, 4.5, '#8a6a42');
    this._koseli = false;
    this.kutu(gx - 0.04, gy - 0.02, 18.5, w + 0.08, d * 0.8, 2.4, '#2f6fa8');
    this.levha(gx + w - 0.1, gy + d, 14, 'D', '#2f6fa8', '#fff', 5);
  };

  /* süs çizimi: her model önbellekten */
  Z.susCiz = function (s) {
    var TW = this.TW, TH = this.TH;
    var w = s.w || 1, h = s.h || 1;
    var anahtar, sinir, fn, self = this;
    if (s.tip === 'agac') {
      var b = Math.round((s.boy || 1) * 5) / 5;
      var kopya = { gx: 0, gy: 0, boy: b, tohum: (s.tohum || 0) % 12 };
      anahtar = 'agac|' + b + '|' + kopya.tohum;
      sinir = { sol: 30 * b + 6, sag: 34 * b + 6, ust: 62 * b + 8, alt: 14 * b + 6 };
      /* paylaşılan sprite: (0,0) köşesine göre çizilir, her ağaca kendi yerinde basılır */
      var sp = this.spriteAl(anahtar, sinir, 0.5, 0.5, function () { self.agacModel(kopya); });
      this.sprBas(sp, s.gx + 0.5, s.gy + 0.5, function () { self.agacModel(s); });
      return;
    }
    if (s.tip === 'cali' || s.tip === 'tas') {
      var b2 = Math.round((s.boy || 1) * 4) / 4;
      var kp = { gx: 0, gy: 0, boy: b2, tohum: (s.tohum || 0) % 6 };
      anahtar = s.tip + '|' + b2 + '|' + kp.tohum;
      sinir = { sol: 16 * b2 + 4, sag: 18 * b2 + 4, ust: 18 * b2 + 4, alt: 8 * b2 + 4 };
      fn = s.tip === 'cali' ? 'caliModel' : 'tasModel';
      var sp2 = this.spriteAl(anahtar, sinir, 0.5, 0.5, function () { self[fn](kp); });
      this.sprBas(sp2, s.gx + 0.5, s.gy + 0.5, function () { self[fn](s); });
      return;
    }
    if (s.tip === 'direk') {
      var kd = { gx: 0, gy: 0, kucuk: !!s.kucuk };
      var sp3 = this.spriteAl('direk|' + (s.kucuk ? 1 : 0), { sol: 50, sag: 30, ust: 86, alt: 12 }, 0.5, 0.5, function () { self.direkModel(kd); });
      this.sprBas(sp3, s.gx + 0.5, s.gy + 0.5, function () { self.direkModel(s); });
      return;
    }
    if (!s._sid) s._sid = (this._sidSay = (this._sidSay || 0) + 1);
    var yuk = 30;
    if (s.tip === 'kasabaBina') { yuk = 13 * (s.kat || 1) + 40; fn = 'kasabaModel'; }
    else if (s.tip === 'cami') { yuk = 76; fn = 'camiModel'; }
    else if (s.tip === 'tarla') { yuk = 16; fn = 'tarlaModel'; }
    else if (s.tip === 'durak') { yuk = 36; fn = 'durakModel'; }
    else return;
    sinir = { sol: h * TW / 2 + 22, sag: w * TW / 2 + 22, ust: yuk + 10, alt: (w + h) * TH / 2 + 20 };
    this.spriteli(s.tip + '|' + s._sid, sinir, s.gx, s.gy, function () { self[fn](s); });
  };

  /* paylaşılan sprite'ı verilen karo noktasına bas */
  Z.sprBas = function (sp, gx0, gy0, yedekFn) {
    if (sp && !sp.hata) {
      var p = this.ekran(gx0, gy0, 0), o = this.kam.olcek;
      this.cz.drawImage(sp.tuval, p.x - sp.sol * o, p.y - sp.ust * o, sp.en * o, sp.boy * o);
    } else if (yedekFn) {
      try { yedekFn(); } catch (e) { }
    }
  };
})();

/* =========================================================
   BÖLÜM 2 — istasyon yapıları, pompa, araçlar, insanlar, fizik
   ========================================================= */
(function () {
  var Z = IZO;

  Z.isikKova = function () {
    return Math.round(this.isik() * 8) + '|' + D.s.sezonIdx + '|' + (this.gece() ? 1 : 0);
  };

  /* çizmeden kutu silueti (dokunma alanı) */
  Z.kutuPoly = function (gx, gy, z, w, d, h) {
    return [this.ekran(gx, gy, z + h), this.ekran(gx + w, gy, z + h), this.ekran(gx + w, gy, z),
      this.ekran(gx + w, gy + d, z), this.ekran(gx, gy + d, z), this.ekran(gx, gy + d, z + h)];
  };

  /* =========================================================
     İSTASYON BİNALARI
     ========================================================= */
  var BINA_YUK = {
    depo: 40, gunes: 20, jenerator: 34, smr: 66, tirpark: 6, wc: 32, mescit: 56, havasu: 28, atm: 34,
    lastikci: 38, adblue: 34, kamera: 62, yangin: 28, market: 34, kafe: 40, yikama: 34, yag: 34, restoran: 56, ofis: 58
  };

  /* ---------------------------------------------------------
     VİTRİN İÇİ: raf, mal, teşhir dolabı, doğrama
     Camın arkasına bakılınca dükkânın içi görünür; gece ışıkla canlanır.
     --------------------------------------------------------- */
  Z.vitrinMal = {
    market:   ['#e05a4e', '#f0b429', '#4f93d6', '#56b870', '#e8744f', '#9f7aea', '#d94f78', '#3fb6a8'],
    kafe:     ['#8c5a34', '#c98a4b', '#efe3cc', '#6b4226', '#d9a05b', '#b07a45'],
    restoran: ['#d6633f', '#e8b05a', '#7fa650', '#c44a3d', '#e0c48a', '#9a6b3f']
  };

  Z.vitrinIci = function (a, b, sabit, z1, z2, tur) {
    var c = this.cz, o = this.kam.olcek, I = this.isik(), gece = this.gece();
    if (o < 0.42) return;                       /* uzaktan görünmez, çizme */
    var mal = this.vitrinMal[tur] || this.vitrinMal.market;
    var en = b - a, yuk = z2 - z1;
    var ic = gece ? 1.14 : 0.82;                /* gece içerisi aydınlık */

    /* teşhir dolabı (solda, camlı buzdolabı) */
    var dolapB = a + en * 0.22;
    this.cokgen(this.yuzDortgen('on', a + en * 0.04, dolapB, sabit, z1 + yuk * 0.06, z2 - yuk * 0.08),
      gece ? 'rgba(186,232,255,.62)' : 'rgba(198,224,242,.5)');
    for (var dr = 0; dr < 3; dr++) {
      var dz = z1 + yuk * (0.22 + dr * 0.24);
      this.cokgen(this.yuzDortgen('on', a + en * 0.05, dolapB - en * 0.01, sabit, dz, dz + yuk * 0.055),
        this.ton(mal[(dr * 2) % mal.length], ic * 0.95));
    }

    /* iki raf bandı + üstlerindeki mallar */
    var rafA = dolapB + en * 0.04, rafB = b - en * 0.03;
    for (var r = 0; r < 2; r++) {
      var rz = z1 + yuk * (0.2 + r * 0.38);
      this.cokgen(this.yuzDortgen('on', rafA, rafB, sabit, rz - yuk * 0.045, rz),
        this.ton(gece ? '#a07b4a' : '#8a93a0', ic));
      for (var u = 0; u < 4; u++) {
        var ux = rafA + (rafB - rafA) * (0.05 + u * 0.245);
        var uw = (rafB - rafA) * 0.17;
        var uy = rz + yuk * (0.1 + ((u + r * 3) % 3) * 0.045);
        this.cokgen(this.yuzDortgen('on', ux, ux + uw, sabit, rz, uy),
          this.ton(mal[(u + r * 3) % mal.length], ic));
      }
    }

    /* dikey doğrama kayıtları */
    for (var k = 1; k < 3; k++) {
      var kx = a + en * (k / 3);
      this.cokgen(this.yuzDortgen('on', kx - en * 0.012, kx + en * 0.012, sabit, z1, z2),
        'rgba(74,86,104,' + (gece ? 0.5 : 0.62) + ')');
    }
    /* cam parıltısı: sol üstten inen ince bant */
    if (!gece) {
      this.cokgen([
        this.ekran(a + en * 0.08, sabit, z2), this.ekran(a + en * 0.3, sabit, z2),
        this.ekran(a + en * 0.14, sabit, z1), this.ekran(a + en * 0.02, sabit, z1)
      ], 'rgba(255,255,255,.17)');
    }
    /* alt kaide */
    this.cokgen(this.yuzDortgen('on', a - 0.012, b + 0.012, sabit, z1 - 2.4, z1 + 0.4), this.ton('#e7e2d8', 0.95 * I));
  };

  Z.dukkanModel = function (gx, gy, o) {
    var I = this.isik(), c = this.cz;
    var x0 = gx + 0.1, y0 = gy + 0.1, w = 0.8, d = 0.8, on = y0 + d, sag = x0 + w;
    var kat = o.kat || 1, kh = 21, h = kh * kat;
    this.golge(gx + 0.1, gy + 0.1, 0.9, 0.9, 0.34);
    this.kutu(gx + 0.03, gy + 0.03, 0, 0.94, 0.94, 2, '#b9c1ca');
    this.kutu(x0, y0, 2, w, d, h, o.govde);
    /* üst katlar */
    for (var k = 1; k < kat; k++) {
      var zb = 2 + k * kh + 5;
      this.pencere('on', x0 + 0.08, x0 + 0.3, on, zb, zb + 10);
      this.pencere('on', x0 + 0.5, x0 + 0.72, on, zb, zb + 10);
      this.pencere('sag', y0 + 0.12, y0 + 0.34, sag, zb, zb + 10);
      this.pencere('sag', y0 + 0.46, y0 + 0.68, sag, zb, zb + 10);
    }
    /* zemin kat: vitrin + kapı */
    if (o.garaj) {
      this.cokgen(this.yuzDortgen('on', x0 + 0.08, x0 + 0.56, on, 2.6, 17), this.ton('#59636f', 0.95 * I));
      c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = Math.max(0.6, 0.8 * this.kam.olcek);
      for (var r = 5; r < 17; r += 2.6) {
        var l1 = this.ekran(x0 + 0.08, on, r), l2 = this.ekran(x0 + 0.56, on, r);
        c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
      }
      this.kapi('on', x0 + 0.62, x0 + 0.74, on, 14, '#3f4a57');
    } else {
      this.pencere('on', x0 + 0.06, x0 + 0.5, on, 5, 16, { sade: true, denizlik: false });
      if (o.vitrin) this.vitrinIci(x0 + 0.06, x0 + 0.5, on, 5, 16, o.vitrin);
      this.kapi('on', x0 + 0.56, x0 + 0.74, on, 15.5, '#5a4636', { cam: true });
    }
    this.pencere('sag', y0 + 0.14, y0 + 0.66, sag, 7, 15, { sade: !!o.garaj });
    if (o.tente) this.tente(x0 + 0.02, sag - 0.02, on, 24.5, 0.13, o.cati, '#fbfaf5');
    /* çatı */
    if (o.catiTip === 'kirma') this.catiKirma(x0, y0, 2 + h, w, d, 11, o.cati, 0.06);
    else if (o.catiTip === 'besik') this.catiBesik(x0, y0, 2 + h, w, d, 10, o.cati, 0.06);
    else {
      this.kutu(x0 - 0.04, y0 - 0.04, 2 + h, w + 0.08, d + 0.08, 3.5, o.cati);
      this.kutu(x0 + 0.02, y0 + 0.02, 2 + h + 3.5, w - 0.04, d - 0.04, 0.8, this.karis(o.cati, '#ffffff', 0.35));
      if (o.klima) {
        this.kutu(x0 + 0.5, y0 + 0.16, 2 + h + 4.3, 0.2, 0.16, 5, '#dfe5ea');
        this.silindir(x0 + 0.14, y0 + 0.2, 2 + h + 4.3, 0.14, 4, '#aab3bd');
      }
    }
    if (o.yazi) this.levha(x0 + 0.33, on + 0.02, (o.tente ? 31 : 27) + (kat - 1) * 0, o.yazi, o.cati, '#fff', 6.2);
    if (this.gece()) { var hp = this.ekran(x0 + 0.3, on, 10); this.hale(hp.x, hp.y, 26 * this.kam.olcek, '255,224,160', 0.22); }
  };

  Z.binaModel = function (t, sv, gx, gy) {
    var c = this.cz, I = this.isik(), o = this.kam.olcek, gece = this.gece();
    var kat;
    switch (t) {
    case 'market':
      this.dukkanModel(gx, gy, { govde: '#f3f0ea', cati: '#d64545', kat: Math.min(2, 1 + Math.floor(sv / 3)), tente: true, klima: true, yazi: 'MARKET', vitrin: 'market' }); return;
    case 'kafe':
      this.dukkanModel(gx, gy, { govde: '#ecd9bd', cati: '#8a5a3b', kat: Math.min(2, 1 + Math.floor(sv / 3)), tente: true, catiTip: 'besik', yazi: 'KAFE', vitrin: 'kafe' });
      /* dışarıda masa + şemsiye */
      this.silindir(gx + 0.9, gy + 0.98, 0, 0.1, 6, '#c9a57a');
      var sp = this.ekran(gx + 0.95, gy + 1.03, 17);
      c.fillStyle = this.ton('#e9c46a', I);
      c.beginPath(); c.moveTo(sp.x - 9 * o, sp.y + 3 * o); c.quadraticCurveTo(sp.x, sp.y - 8 * o, sp.x + 9 * o, sp.y + 3 * o);
      c.quadraticCurveTo(sp.x, sp.y + 6 * o, sp.x - 9 * o, sp.y + 3 * o); c.fill();
      return;
    case 'restoran':
      this.dukkanModel(gx, gy, { govde: '#f1dcc0', cati: '#b5572e', kat: Math.min(3, 2 + Math.floor(sv / 3)), tente: true, catiTip: 'kirma', yazi: 'LOKANTA', vitrin: 'restoran' }); return;
    case 'ofis':
      this.dukkanModel(gx, gy, { govde: '#dbe3ec', cati: '#49586b', kat: Math.min(3, 2 + Math.floor(sv / 2)), klima: true, yazi: 'OFİS' }); return;
    case 'yag':
      this.dukkanModel(gx, gy, { govde: '#cfd6dd', cati: '#e0a92e', kat: 1, garaj: true, yazi: 'YAĞ' });
      this.silindir(gx + 0.8, gy + 0.93, 0, 0.11, 8, '#2f6fa8');
      this.silindir(gx + 0.9, gy + 0.99, 0, 0.11, 8, '#d64545');
      return;
    case 'lastikci':
      this.dukkanModel(gx, gy, { govde: '#c9d1d9', cati: '#3f4a57', kat: 1, garaj: true, yazi: 'LASTİK' });
      for (var li = 0; li < 3; li++) this.silindir(gx + 0.8, gy + 0.93, li * 4.4, 0.16, 4, li % 2 ? '#363c46' : '#23272e');
      return;
    case 'wc':
      this.golge(gx + 0.14, gy + 0.14, 0.8, 0.8, 0.32);
      this.kutu(gx + 0.08, gy + 0.08, 0, 0.84, 0.84, 2, '#b9c1ca');
      this.kutu(gx + 0.15, gy + 0.15, 2, 0.7, 0.7, 22, '#eef2f5');
      this.kapi('on', gx + 0.22, gx + 0.4, gy + 0.85, 16, '#3f7fd0');
      this.kapi('on', gx + 0.58, gx + 0.76, gy + 0.85, 16, '#d05f9a');
      this.pencere('sag', gy + 0.3, gy + 0.7, gx + 0.85, 15, 20, { sade: true, denizlik: false });
      this.kutu(gx + 0.11, gy + 0.11, 24, 0.78, 0.78, 3.5, '#5a6b80');
      this.levha(gx + 0.5, gy + 0.87, 31, 'WC', '#5a6b80', '#fff', 6.5);
      return;
    case 'mescit':
      this.golge(gx + 0.14, gy + 0.14, 0.8, 0.8, 0.32);
      this.kutu(gx + 0.08, gy + 0.08, 0, 0.84, 0.84, 2, '#c3cbd4');
      this.kutu(gx + 0.16, gy + 0.16, 2, 0.6, 0.62, 20, '#f1ece0');
      this.kapi('on', gx + 0.38, gx + 0.54, gy + 0.78, 14, '#6b4a2e');
      this.pencere('on', gx + 0.2, gx + 0.32, gy + 0.78, 8, 15, { sade: true });
      this.pencere('on', gx + 0.6, gx + 0.72, gy + 0.78, 8, 15, { sade: true });
      this.pencere('sag', gy + 0.34, gy + 0.6, gx + 0.76, 8, 15, { sade: true });
      this.kutu(gx + 0.13, gy + 0.13, 22, 0.66, 0.68, 2.5, '#d9cfbb');
      this.silindir(gx + 0.25, gy + 0.26, 24.5, 0.42, 3, '#e3dccb');
      var tp = this.kubbe(gx + 0.25, gy + 0.26, 27.5, 0.42, '#4a8f6f');
      c.strokeStyle = this.ton('#e3c15a', I); c.lineWidth = Math.max(1, 1.4 * o); c.lineCap = 'round';
      c.beginPath(); c.moveTo(tp.x, tp.y); c.lineTo(tp.x, tp.y - 5 * o); c.stroke(); c.lineCap = 'butt';
      this.silindir(gx + 0.8, gy + 0.18, 2, 0.1, 44, '#f3eee3');
      this.silindir(gx + 0.78, gy + 0.16, 33, 0.14, 2.4, '#d9cfbb');
      var mt = this.ekran(gx + 0.85, gy + 0.23, 46);
      c.fillStyle = this.ton('#4a8f6f', I);
      c.beginPath(); c.moveTo(mt.x - 4 * o, mt.y + 1 * o); c.quadraticCurveTo(mt.x, mt.y - 8 * o, mt.x, mt.y - 12 * o);
      c.quadraticCurveTo(mt.x, mt.y - 8 * o, mt.x + 4 * o, mt.y + 1 * o); c.closePath(); c.fill();
      return;
    case 'depo':
      this.golge(gx + 0.12, gy + 0.12, 0.86, 0.86, 0.32);
      this.kutu(gx + 0.05, gy + 0.05, 0, 0.9, 0.9, 3, '#b4bcc5');
      var tk = [[0.12, 0.13, 0.36, 25 + sv * 4, '#eef2f6', '#d64545'], [0.54, 0.13, 0.36, 21 + sv * 4, '#eef2f6', '#2f6fa8'], [0.32, 0.55, 0.34, 18 + sv * 3, '#eef2f6', '#3ec47a']];
      for (var k = 0; k < 3; k++) {
        var T = tk[k];
        this.silindir(gx + T[0], gy + T[1], 3, T[2], T[3], T[4]);
        this.silindir(gx + T[0] - 0.005, gy + T[1] - 0.005, 3 + T[3] * 0.55, T[2] + 0.01, 3.5, T[5]);
        this.kubbe(gx + T[0], gy + T[1], 3 + T[3], T[2] * 1.0, '#dfe6ec');
      }
      return;
    case 'gunes':
      this.kutu(gx + 0.05, gy + 0.05, 0, 0.9, 0.9, 2, '#9fbf7c');
      for (var s = 0; s < 2; s++) {
        var oy = gy + 0.12 + s * 0.42;
        this._koseli = true;
        this.kutu(gx + 0.18, oy + 0.02, 2, 0.04, 0.04, 9, '#6b7480');
        this.kutu(gx + 0.78, oy + 0.02, 2, 0.04, 0.04, 9, '#6b7480');
        this._koseli = false;
        /* eğimli panel */
        var a1 = this.ekran(gx + 0.1, oy, 17), a2 = this.ekran(gx + 0.9, oy, 17), a3 = this.ekran(gx + 0.9, oy + 0.3, 8), a4 = this.ekran(gx + 0.1, oy + 0.3, 8);
        var pg = c.createLinearGradient(a1.x, a1.y, a3.x, a3.y);
        pg.addColorStop(0, this.ton('#2e5f9e', I)); pg.addColorStop(1, this.ton('#17325c', I));
        this.cokgen([a1, a2, a3, a4], pg);
        c.strokeStyle = 'rgba(190,220,255,.5)'; c.lineWidth = Math.max(0.5, 0.7 * o);
        for (var q = 1; q < 5; q++) {
          var u1 = this.ekran(gx + 0.1 + q * 0.16, oy, 17), u2 = this.ekran(gx + 0.1 + q * 0.16, oy + 0.3, 8);
          c.beginPath(); c.moveTo(u1.x, u1.y); c.lineTo(u2.x, u2.y); c.stroke();
        }
        var m1 = this.ekran(gx + 0.1, oy + 0.15, 12.5), m2 = this.ekran(gx + 0.9, oy + 0.15, 12.5);
        c.beginPath(); c.moveTo(m1.x, m1.y); c.lineTo(m2.x, m2.y); c.stroke();
        this.cokgen([a4, a3, this.ekran(gx + 0.9, oy + 0.3, 6.5), this.ekran(gx + 0.1, oy + 0.3, 6.5)], this.ton('#c9d1d9', I));
      }
      return;
    case 'jenerator':
      this.golge(gx + 0.14, gy + 0.14, 0.8, 0.8, 0.3);
      this.kutu(gx + 0.1, gy + 0.1, 0, 0.8, 0.8, 3, '#aab3bd');
      this.kutu(gx + 0.16, gy + 0.2, 3, 0.66, 0.56, 19, '#e0a92e');
      c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = Math.max(0.7, 1 * o);
      for (var v = 0; v < 4; v++) {
        var v1 = this.ekran(gx + 0.24, gy + 0.76, 8 + v * 3), v2 = this.ekran(gx + 0.5, gy + 0.76, 8 + v * 3);
        c.beginPath(); c.moveTo(v1.x, v1.y); c.lineTo(v2.x, v2.y); c.stroke();
      }
      this.cokgen(this.yuzDortgen('on', gx + 0.58, gx + 0.74, gy + 0.76, 9, 17), this.ton('#2a3340', I));
      this.silindir(gx + 0.6, gy + 0.26, 22, 0.1, 13, '#4a525c');
      this.kutu(gx + 0.22, gy + 0.3, 22, 0.24, 0.3, 2, '#b98a1f');
      return;
    case 'smr':
      this.golge(gx + 0.1, gy + 0.1, 0.9, 0.9, 0.36);
      this.kutu(gx + 0.02, gy + 0.02, 0, 0.96, 0.96, 5, '#b4bcc5');
      this.silindir(gx + 0.18, gy + 0.18, 5, 0.62, 40, '#e6ebf0');
      this.silindir(gx + 0.17, gy + 0.17, 22, 0.64, 3.5, '#5aa9e6');
      this.kubbe(gx + 0.18, gy + 0.18, 45, 0.62, '#cfd8e0');
      this.kutu(gx + 0.7, gy + 0.72, 5, 0.2, 0.18, 12, '#8fa8c6');
      return;
    case 'tirpark':
      this.kutu(gx + 0.02, gy + 0.02, 0, 0.96, 0.96, 2.2, '#7d8792');
      c.strokeStyle = this.ton('#f4f6f8', I); c.lineWidth = Math.max(1, 1.5 * o);
      for (var k2 = 0; k2 < 3; k2++) {
        var p1 = this.ekran(gx + 0.1, gy + 0.2 + k2 * 0.3, 2.4), p2 = this.ekran(gx + 0.9, gy + 0.2 + k2 * 0.3, 2.4);
        c.beginPath(); c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.stroke();
      }
      this._koseli = true; this.kutu(gx + 0.08, gy + 0.08, 2, 0.035, 0.035, 26, '#7c8794'); this._koseli = false;
      this.levha(gx + 0.1, gy + 0.1, 38, 'TIR P', '#2f6fa8', '#fff', 6.5);
      return;
    case 'havasu':
      this.golge(gx + 0.22, gy + 0.24, 0.6, 0.5, 0.26);
      this.kutu(gx + 0.15, gy + 0.2, 0, 0.7, 0.56, 3, '#b9c1ca');
      this.kutu(gx + 0.24, gy + 0.3, 3, 0.2, 0.2, 20, '#3f7fd0');
      this.kutu(gx + 0.56, gy + 0.3, 3, 0.2, 0.2, 18, '#4aa96c');
      this.cokgen(this.yuzDortgen('on', gx + 0.27, gx + 0.41, gy + 0.5, 14, 20), gece ? '#9ef0b5' : this.ton('#eef3f7', I));
      this.cokgen(this.yuzDortgen('on', gx + 0.59, gx + 0.73, gy + 0.5, 12, 18), gece ? '#9ef0b5' : this.ton('#eef3f7', I));
      this.silindir(gx + 0.44, gy + 0.56, 3, 0.12, 5, '#2a2f38');
      return;
    case 'atm':
      this.golge(gx + 0.3, gy + 0.32, 0.46, 0.4, 0.26);
      this.kutu(gx + 0.26, gy + 0.28, 0, 0.48, 0.42, 3, '#b9c1ca');
      this.kutu(gx + 0.32, gy + 0.34, 3, 0.36, 0.28, 24, '#d64545');
      this.cokgen(this.yuzDortgen('on', gx + 0.37, gx + 0.63, gy + 0.62, 15, 23), gece ? '#9ef0b5' : this.ton('#1d2a3d', I));
      this.cokgen(this.yuzDortgen('on', gx + 0.4, gx + 0.6, gy + 0.62, 9, 12.5), this.ton('#e9edf1', I));
      this.kutu(gx + 0.27, gy + 0.3, 27, 0.46, 0.4, 3.5, '#8f2f2f');
      this.levha(gx + 0.5, gy + 0.66, 38, 'ATM', '#8f2f2f', '#fff', 6);
      return;
    case 'adblue':
      this.golge(gx + 0.2, gy + 0.24, 0.66, 0.42, 0.26);
      this.kutu(gx + 0.14, gy + 0.2, 0, 0.72, 0.44, 3, '#b9c1ca');
      this.kutu(gx + 0.24, gy + 0.3, 3, 0.28, 0.24, 27, '#2f80b8');
      this.cokgen(this.yuzDortgen('on', gx + 0.28, gx + 0.48, gy + 0.54, 19, 27), gece ? '#9ef0b5' : this.ton('#eef3f7', I));
      this.silindir(gx + 0.58, gy + 0.3, 3, 0.22, 16, '#e3eaf0');
      this.silindir(gx + 0.575, gy + 0.295, 10, 0.23, 3, '#2f80b8');
      return;
    case 'kamera':
      this.golge(gx + 0.4, gy + 0.4, 0.2, 0.2, 0.24);
      this.silindir(gx + 0.44, gy + 0.44, 0, 0.1, 52, '#8a94a0');
      this.kutu(gx + 0.3, gy + 0.42, 51, 0.26, 0.13, 8, '#f1f4f7');
      this.silindir(gx + 0.25, gy + 0.435, 52, 0.09, 5.5, '#1d2630');
      if (gece) { var kp = this.ekran(gx + 0.3, gy + 0.5, 57); c.fillStyle = 'rgba(240,82,82,.9)'; c.beginPath(); c.arc(kp.x, kp.y, 1.8 * o, 0, 6.3); c.fill(); }
      return;
    case 'yangin':
      this.golge(gx + 0.25, gy + 0.28, 0.56, 0.46, 0.26);
      this.kutu(gx + 0.2, gy + 0.22, 0, 0.62, 0.5, 3, '#b9c1ca');
      this.kutu(gx + 0.26, gy + 0.3, 3, 0.4, 0.3, 22, '#c23b3b');
      this.cokgen(this.yuzDortgen('on', gx + 0.31, gx + 0.61, gy + 0.6, 9, 21), this.ton('#f4d7d7', I));
      this.silindir(gx + 0.7, gy + 0.36, 3, 0.1, 13, '#d64545');
      this.silindir(gx + 0.725, gy + 0.385, 16, 0.05, 3, '#2a2f38');
      return;
    case 'yikama':
      this.golge(gx + 0.1, gy + 0.1, 0.9, 0.9, 0.34);
      this.kutu(gx + 0.04, gy + 0.04, 0, 0.92, 0.92, 2, '#aab8c2');
      this.kutu(gx + 0.1, gy + 0.1, 2, 0.8, 0.1, 24, '#bfe6f2');                /* arka duvar */
      this.silindir(gx + 0.26, gy + 0.3, 2, 0.16, 20, '#3f8ccc');                /* fırçalar */
      this.silindir(gx + 0.58, gy + 0.3, 2, 0.16, 20, '#e05a5a');
      this.kutu(gx + 0.1, gy + 0.78, 2, 0.11, 0.11, 24, '#e8f4f8');              /* ön direkler */
      this.kutu(gx + 0.79, gy + 0.78, 2, 0.11, 0.11, 24, '#e8f4f8');
      this.kutu(gx + 0.06, gy + 0.06, 26, 0.88, 0.88, 5, '#2f84a8');
      this.kutu(gx + 0.1, gy + 0.1, 31, 0.8, 0.8, 1, '#56a8c9');
      this.levha(gx + 0.5, gy + 0.95, 40, 'YIKAMA', '#2f84a8', '#fff', 6.2);
      return;
    default:
      this.dukkanModel(gx, gy, { govde: '#e1e6eb', cati: '#4a5563', kat: 1 });
    }
  };

  Z.binaCiz = function (sb, i, gx, gy, b) {
    var t = b.t, kucult = 0.58, c = this.cz, self = this;
    var merkez = this.ekran(gx + 0.5, gy + 0.5, 0);
    if (t === 'totem') {
      var once = this.vurus.length;
      c.save(); c.translate(merkez.x, merkez.y); c.scale(kucult, kucult); c.translate(-merkez.x, -merkez.y);
      try { this.binaCizIc(sb, i, gx, gy, b); } catch (e) { }
      c.restore();
      for (var v = once; v < this.vurus.length; v++) {
        var poly = this.vurus[v].poly;
        for (var n = 0; n < poly.length; n++) poly[n] = { x: merkez.x + (poly[n].x - merkez.x) * kucult, y: merkez.y + (poly[n].y - merkez.y) * kucult };
      }
      return;
    }
    /* dokunma silueti */
    var hp = this.kutuPoly(gx + 0.06, gy + 0.06, 0, 0.88, 0.88, BINA_YUK[t] || 36);
    for (var k = 0; k < hp.length; k++) hp[k] = { x: merkez.x + (hp[k].x - merkez.x) * kucult, y: merkez.y + (hp[k].y - merkez.y) * kucult };
    if (!this._vurusKapali) this.vurus.push({ tip: 'hucre', i: i, poly: hp });

    var sv = b.sv || 1;
    var sinir = { sol: 50, sag: 52, ust: 58, alt: 34, S: 2.4 };
    var cizim = function () {
      var cc = self.cz, m = self.ekran(0.5, 0.5, 0);
      cc.save(); cc.translate(m.x, m.y); cc.scale(kucult, kucult); cc.translate(-m.x, -m.y);
      try { self.binaModel(t, sv, 0, 0); } finally { cc.restore(); }
    };
    var sp = this.spriteAl('bina|' + t + '|' + sv, sinir, 0.5, 0.5, cizim);
    if (sp && !sp.hata) this.sprBas(sp, gx + 0.5, gy + 0.5);
    else {
      c.save(); c.translate(merkez.x, merkez.y); c.scale(kucult, kucult); c.translate(-merkez.x, -merkez.y);
      var ev = this._vurusKapali; this._vurusKapali = true;
      try { this.binaCizIc(sb, i, gx, gy, b); } catch (e) { }
      this._vurusKapali = ev;
      c.restore();
    }
    if (t === 'jenerator' && !b.arizali && !this.dusukKalite) {
      c.save(); c.translate(merkez.x, merkez.y); c.scale(kucult, kucult); c.translate(-merkez.x, -merkez.y);
      this.dumanCiz(gx + 0.65, gy + 0.31, 37);
      c.restore();
    }
  };

  /* =========================================================
     POMPA
     ========================================================= */
  Z.pompaModel = function (yakit, sv, catiRenk) {
    var c = this.cz, I = this.isik(), o = this.kam.olcek, gece = this.gece();
    var gx = 0, gy = 0;
    var govde = yakit === 'ev' ? '#2f7fc4' : (yakit === 'lpg' ? '#e9edf1' : '#f1f3f5');
    var vurgu = yakit === 'ev' ? '#7fd0ff' : (yakit === 'lpg' ? '#3ec47a' : '#e2683a');
    this.golge(gx + 0.14, gy + 0.2, 0.76, 0.5, 0.3);
    /* ada: hap biçimli beton + sarı bordür */
    this.prizma(this.ayak(gx + 0.5, gy + 0.39, 0.74, 0.36, 0.17, 0, 4), 0, 1.2, '#e9c046');
    this.prizma(this.ayak(gx + 0.5, gy + 0.39, 0.7, 0.32, 0.15, 0, 4), 1.2, 2, '#c9d0d7');
    var catiH = 50 + (sv - 1) * 2;
    /* arka direkler */
    this.silindir(gx + 0.17, gy + 0.3, 3, 0.06, catiH, '#e3e8ed');
    this.silindir(gx + 0.77, gy + 0.3, 3, 0.06, catiH, '#e3e8ed');
    /* dispenserler */
    var adet = (yakit === 'benzin' || yakit === 'dizel') ? 2 : 1;
    for (var k = 0; k < adet; k++) {
      var bx = gx + (adet === 2 ? 0.27 + k * 0.27 : 0.4);
      this.prizma(this.ayak(bx + 0.1, gy + 0.39, 0.2, 0.2, 0.05, 0, 2), 3.2, 4, '#4a525c');
      this.prizma(this.ayak(bx + 0.1, gy + 0.39, 0.19, 0.19, 0.05, 0, 2), 7.2, 17, govde);
      this.prizma(this.ayak(bx + 0.1, gy + 0.39, 0.2, 0.2, 0.055, 0, 2), 24.2, 3.4, vurgu);
      /* ekran */
      this.cokgen(this.yuzDortgen('on', bx + 0.035, bx + 0.165, gy + 0.487, 15.5, 22), gece ? '#9ef0b5' : this.ton('#22303f', I));
      this.cokgen(this.yuzDortgen('on', bx + 0.035, bx + 0.165, gy + 0.487, 9.5, 13), this.ton(vurgu, I));
      /* tabanca yuvası + hortum */
      c.strokeStyle = this.ton('#23282f', I); c.lineWidth = Math.max(1, 1.5 * o); c.lineCap = 'round';
      var h1 = this.ekran(bx + 0.197, gy + 0.42, 19), h2 = this.ekran(bx + 0.197, gy + 0.44, 9);
      c.beginPath(); c.moveTo(h1.x, h1.y); c.quadraticCurveTo(h1.x + 4 * o, (h1.y + h2.y) / 2 + 3 * o, h2.x, h2.y); c.stroke();
      c.lineCap = 'butt';
    }
    /* kanopi */
    var kr = catiRenk;
    this.prizma(this.ayak(gx + 0.5, gy + 0.39, 0.9, 0.62, 0.1, 0, 3), catiH + 3, 2, '#f4f6f8');
    this.prizma(this.ayak(gx + 0.5, gy + 0.39, 0.92, 0.64, 0.11, 0, 3), catiH + 5, 4.5, kr);
    this.prizma(this.ayak(gx + 0.5, gy + 0.39, 0.86, 0.58, 0.09, 0, 3), catiH + 9.5, 0.8, this.karis(kr, '#ffffff', 0.3));
    /* alın şeridi */
    var s1 = this.ekran(gx + 0.1, gy + 0.71, catiH + 7.2), s2 = this.ekran(gx + 0.9, gy + 0.71, catiH + 7.2);
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(0.8, 1.2 * o);
    c.beginPath(); c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y); c.stroke();
    if (sv > 1) {
      for (var y = 0; y < Math.min(5, sv - 1); y++) {
        var yp = this.ekran(gx + 0.86, gy + 0.71 - 0.001, catiH + 7.2);
        c.fillStyle = '#ffd166';
        c.beginPath(); c.arc(yp.x - (y * 4 + 3) * o, yp.y - 0.2 * o, 1.3 * o, 0, 6.3); c.fill();
      }
    }
    if (gece) {
      var lp = this.ekran(gx + 0.5, gy + 0.45, catiH + 2);
      this.hale(lp.x, lp.y + 6 * o, 34 * o, '255,236,180', 0.4);
    }
  };

  Z.pompaCiz = function (sb, i, gx, gy, p) {
    var self = this;
    var catiH = 50 + (p.sv - 1) * 2;
    if (!this._vurusKapali) {
      this.vurus.push({ tip: 'hucre', i: i, poly: this.kutuPoly(gx + 0.13, gy + 0.2, 0, 0.74, 0.4, 28) });
      this.vurus.push({ tip: 'hucre', i: i, poly: this.kutuPoly(gx + 0.05, gy + 0.08, catiH + 3, 0.9, 0.62, 7) });
    }
    var st2 = this.tabelaStili();
    var catiRenk = st2.kanopi ? st2.pano : (p.yakit === 'ev' ? '#3f8ccc' : (p.yakit === 'lpg' ? '#3ec47a' : '#2f9e5e'));
    var sp = this.spriteAl('pompa|' + p.yakit + '|' + p.sv + '|' + catiRenk, { sol: 62, sag: 62, ust: 82, alt: 44, S: 2.4 }, 0, 0,
      function () { self.pompaModel(p.yakit, p.sv, catiRenk); });
    if (sp && !sp.hata) this.sprBas(sp, gx, gy);
    else {
      var ek = this.kam, ec = this.cz;
      try {
        /* önbellek yoksa doğrudan çiz (kamerayı karoya kaydırarak) */
        var iz = this.izo(gx, gy), o = ek.olcek;
        this.kam = { x: ek.x + iz.x * o, y: ek.y + iz.y * o, olcek: o, kuruldu: true };
        this.pompaModel(p.yakit, p.sv, catiRenk);
      } catch (e) { }
      this.kam = ek; this.cz = ec;
    }
    if (p.mesgul) {
      var m = SIM.musteriBul(sb, p.mesgul);
      if (m && !m.yolda && (m.durum === 'pompada' || m.durum === 'servis')) {
        if (m.durum === 'pompada') {
          this._balonSayisi = (this._balonSayisi || 0) + 1;
          this.isaretler.push({ tip: 'bekleyen', gx: gx + 0.5, gy: gy + 0.5, m: m, balon: this._balonSayisi <= 2, i: i });
        }
        this.hortumCiz(gx, gy, p, m);
        this.dolumGostergesi(gx, gy, m);
      }
    }
  };

  Z.hortumCiz = function (gx, gy, p, m) {
    var arac = null;
    for (var i = 0; i < this.arabalar.length; i++) if (this.arabalar[i].mid === m.id) arac = this.arabalar[i];
    if (!arac || arac.durum === 'geliyor' || arac.durum === 'gidiyor') return;
    if (arac.yol && arac.yol.length) return;
    var c = this.cz, o = this.kam.olcek;
    var cift = (p.yakit === 'benzin' || p.yakit === 'dizel');
    var a = this.ekran(gx + (cift ? 0.467 : 0.597), gy + 0.42, 19);
    var b = this.ekran(arac.gx + 0.16, arac.gy - 0.15, 9);
    var orta = { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 10 * o };
    c.strokeStyle = 'rgba(26,32,42,.9)';
    c.lineWidth = Math.max(1.3, 2.2 * o);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(orta.x, orta.y, b.x, b.y); c.stroke();
    c.lineCap = 'butt';
    c.fillStyle = VERI.yakitlar[m.yakit].renk;
    c.beginPath(); c.arc(b.x, b.y, 2.4 * o, 0, Math.PI * 2); c.fill();
  };

  /* =========================================================
     ARAÇLAR
     ========================================================= */
  Z.aracCesit = function (a) {
    var cesit = a.cesit || (a.buyuk ? 'tir' : 'oto');
    if (a.tip === 'Tır') cesit = 'tir';
    else if (a.tip === 'Otobüs') cesit = 'otobus';
    else if (a.tip === 'Motosiklet') cesit = 'motor';
    else if (a.tip === 'Taksi') cesit = 'taksi';
    else if (a.tip === 'Ticari Araç' || a.tip === 'Minibüs') cesit = 'minibus';
    else if (a.tip === 'Traktör') cesit = 'traktor';
    return cesit;
  };
  var ARAC_UZ = { oto: 0.76, taksi: 0.78, minibus: 0.86, traktor: 0.66, motor: 0.4, tir: 1.1, otobus: 0.98 };

  /** aracı (cx,cy) merkezinde, aci yönünde çizer */
  Z.aracModel = function (cesit, renk, cx, cy, aci) {
    var self = this, c = this.cz, I = this.isik(), o = this.kam.olcek, gece = this.gece();
    var ca = Math.cos(aci), sa = Math.sin(aci);
    var nk = function (lx, ly) { return { gx: cx + lx * ca - ly * sa, gy: cy + lx * sa + ly * ca }; };
    var cam = gece ? '#34465c' : '#bfe2f4';
    var parcalar = [];
    /* p: [boyunaMerkez, uzunluk, en, yarıçap, z, h, renk, seçenek] */
    var ekle = function (lx, uz, en, r, z, h, rk, sec) { parcalar.push({ lx: lx, uz: uz, en: en, r: r, z: z, h: h, rk: rk, sec: sec }); };
    var teker = function (lx, ly, cap, kal) {
      var m = nk(lx, ly);
      self.prizma(self.ayak(m.gx, m.gy, cap, kal, Math.min(cap, kal) * 0.42, aci, 2), 0, cap * 30, '#1f242b', { duz: true, kenarsiz: true });
    };
    var L, W;
    if (cesit === 'motor') {
      teker(0.13, 0, 0.13, 0.045); teker(-0.13, 0, 0.13, 0.045);
      ekle(0, 0.3, 0.08, 0.035, 3, 3.6, renk);
      ekle(-0.04, 0.14, 0.09, 0.04, 6.6, 1.6, '#23282f');
    } else if (cesit === 'tir') {
      L = 1.1; W = 0.42;
      [0.39, -0.13, -0.26, -0.44].forEach(function (x) { teker(x, W / 2 - 0.035, 0.16, 0.07); teker(x, -W / 2 + 0.035, 0.16, 0.07); });
      ekle(-0.13, 0.78, W - 0.06, 0.03, 3, 2, '#3b424c', { duz: true });
      ekle(-0.17, 0.72, W, 0.035, 5, 15.5, '#f1f3f5');
      ekle(-0.17, 0.725, W + 0.005, 0.035, 9, 2.4, renk, { duz: true, ustsuz: true });
      ekle(0.39, 0.3, W - 0.02, 0.07, 2.4, 7.2, renk);
      ekle(0.4, 0.25, W - 0.06, 0.06, 9.6, 5, cam, { duz: true });
      ekle(0.39, 0.28, W - 0.03, 0.07, 14.6, 1.8, renk);
    } else if (cesit === 'otobus' || cesit === 'minibus') {
      L = cesit === 'otobus' ? 0.98 : 0.86; W = cesit === 'otobus' ? 0.42 : 0.4;
      var gh = cesit === 'otobus' ? 7 : 6.5, ch = cesit === 'otobus' ? 6.5 : 5.5;
      var tk = L / 2 - 0.2;
      teker(tk, W / 2 - 0.03, 0.16, 0.065); teker(tk, -W / 2 + 0.03, 0.16, 0.065);
      teker(-tk, W / 2 - 0.03, 0.16, 0.065); teker(-tk, -W / 2 + 0.03, 0.16, 0.065);
      ekle(0, L, W, 0.08, 2.2, gh, renk);
      ekle(0, L - 0.05, W - 0.035, 0.07, 2.2 + gh, ch, cam, { duz: true });
      ekle(0, L - 0.02, W - 0.01, 0.08, 2.2 + gh + ch, 2.2, cesit === 'otobus' ? '#f4f6f8' : renk);
      if (cesit === 'otobus') ekle(0, L + 0.005, W + 0.005, 0.08, 4.4, 1.5, '#f4f6f8', { duz: true, ustsuz: true });
    } else if (cesit === 'traktor') {
      teker(-0.17, 0.2, 0.3, 0.09); teker(-0.17, -0.2, 0.3, 0.09);
      teker(0.22, 0.17, 0.17, 0.06); teker(0.22, -0.17, 0.17, 0.06);
      ekle(0.12, 0.42, 0.2, 0.05, 5, 6, renk);
      ekle(-0.16, 0.26, 0.26, 0.05, 5, 5, renk);
      ekle(-0.16, 0.22, 0.24, 0.05, 10, 7, cam, { duz: true });
      ekle(-0.16, 0.27, 0.28, 0.06, 17, 1.6, self.karis(renk, '#000000', 0.25));
      ekle(0.27, 0.035, 0.035, 0.015, 11, 7, '#3b424c', { duz: true });
    } else {
      L = cesit === 'taksi' ? 0.78 : 0.76; W = 0.37;
      teker(0.24, W / 2 - 0.028, 0.15, 0.06); teker(0.24, -W / 2 + 0.028, 0.15, 0.06);
      teker(-0.24, W / 2 - 0.028, 0.15, 0.06); teker(-0.24, -W / 2 + 0.028, 0.15, 0.06);
      ekle(0, L, W, 0.13, 2, 5.8, renk);
      ekle(-0.035, L * 0.5, W - 0.05, 0.1, 7.8, 4.6, cam, { duz: true });
      ekle(-0.04, L * 0.45, W - 0.07, 0.1, 12.4, 1.5, renk);
      if (cesit === 'taksi') ekle(-0.04, 0.12, 0.07, 0.02, 13.9, 2.4, '#2a2f38', { duz: true });
    }
    /* uzaktan yakına: parça merkezinin derinliğine, eşitse yüksekliğe göre */
    parcalar.sort(function (p, q) {
      var dp = p.lx * (ca + sa), dq = q.lx * (ca + sa);
      if (Math.abs(dp - dq) > 0.2) return dp - dq;
      return p.z - q.z;
    });
    for (var i = 0; i < parcalar.length; i++) {
      var p = parcalar[i], m = nk(p.lx, 0);
      this.prizma(this.ayak(m.gx, m.gy, p.uz, p.en, p.r, aci, 3), p.z, p.h, p.rk, p.sec);
    }
    /* farlar ve stoplar */
    if (cesit !== 'motor' && cesit !== 'traktor') {
      L = L || 0.76; W = W || 0.37;
      var onGor = (ca + sa) > -0.15, arkaGor = (ca + sa) < 0.15;
      var zf = cesit === 'tir' ? 5.5 : 5.2;
      var nokta = function (lx, ly, rk, r) {
        var q = nk(lx, ly), e = self.ekran(q.gx, q.gy, zf);
        c.fillStyle = rk; c.beginPath(); c.arc(e.x, e.y, r * o, 0, 6.3); c.fill();
        return e;
      };
      var onX = cesit === 'tir' ? 0.54 : L / 2;
      if (onGor) {
        var f1 = nokta(onX - 0.005, W * 0.3, gece ? '#fff6c8' : '#fdf3c4', 1.25), f2 = nokta(onX - 0.005, -W * 0.3, gece ? '#fff6c8' : '#fdf3c4', 1.25);
        if (gece) { this.hale(f1.x, f1.y, 9 * o, '255,240,180', 0.5); this.hale(f2.x, f2.y, 9 * o, '255,240,180', 0.5); }
      }
      if (arkaGor) { nokta(-(cesit === 'tir' ? 0.53 : L / 2) + 0.005, W * 0.3, '#e23b3b', 1.1); nokta(-(cesit === 'tir' ? 0.53 : L / 2) + 0.005, -W * 0.3, '#e23b3b', 1.1); }
    } else if (cesit === 'motor') {
      /* sürücü */
      var s = nk(-0.02, 0), e1 = this.ekran(s.gx, s.gy, 8), e2 = this.ekran(s.gx, s.gy, 15.5);
      c.strokeStyle = this.ton('#3f4a5c', I); c.lineWidth = 4.2 * o; c.lineCap = 'round';
      c.beginPath(); c.moveTo(e1.x, e1.y); c.lineTo(e2.x, e2.y + 2 * o); c.stroke(); c.lineCap = 'butt';
      c.fillStyle = this.ton(renk, I); c.beginPath(); c.arc(e2.x, e2.y - 1.4 * o, 3 * o, 0, 6.3); c.fill();
    }
  };

  Z.arabaCiz = function (a) {
    var self = this, o = this.kam.olcek;
    var cesit = this.aracCesit(a);
    var uz = ARAC_UZ[cesit] || 0.76;
    var N = 24;
    var kova = Math.round(((a.aci || 0) / (Math.PI * 2)) * N);
    kova = ((kova % N) + N) % N;
    var gp = this.ekran(a.gx, a.gy, 0);
    this.golgeCiz(gp.x, gp.y + 1.5 * o, Math.max(4, (uz * 0.62 + 0.18) * this.TW / 2 * o), Math.max(2, (uz * 0.62 + 0.18) * this.TH / 2 * o), 0.32);
    var yari = uz / 2 + 0.12;
    var sinir = { sol: yari * this.TW / 2 * 1.42 + 6, sag: yari * this.TW / 2 * 1.42 + 6, ust: yari * this.TH / 2 * 1.42 + 26, alt: yari * this.TH / 2 * 1.42 + 8, S: 1.7 };
    var on = 'arac|' + cesit + '|' + a.renk + '|';
    var uret = function (kv, serbest) {
      var ac = kv / N * Math.PI * 2;
      return self.spriteAl(on + kv, sinir, 0, 0, function () { self.aracModel(cesit, a.renk, 0, 0, ac); }, serbest);
    };
    var sp = uret(kova, true);
    if (!sp) {
      /* bu karede üretim hakkı bitti: en yakın hazır açıyı kullan */
      for (var f = 1; f <= 3 && !sp; f++) sp = this._spr[on + ((kova + f) % N)] || this._spr[on + ((kova - f + N) % N)];
      if (!sp) sp = uret(kova, false);
    }
    if (sp && !sp.hata) this.sprBas(sp, a.gx, a.gy);
    else { try { this.aracModel(cesit, a.renk, a.gx, a.gy, kova / N * Math.PI * 2); } catch (e) { } }
  };

  /* =========================================================
     SÜRÜŞ FİZİĞİ
     Araç burnunun baktığı yöne gider; direksiyon sınırlı, virajda yavaşlar,
     öndeki araca mesafe bırakır, son noktada düzgün durur.
     ========================================================= */
  function aciFark(a, b) { var f = a - b; while (f > Math.PI) f -= Math.PI * 2; while (f < -Math.PI) f += Math.PI * 2; return f; }

  Z.ondeEngel = function (a, hedefUz) {
    var ca = Math.cos(a.aci), sa = Math.sin(a.aci);
    var benUz = (ARAC_UZ[this.aracCesit(a)] || 0.76) / 2;
    for (var i = 0; i < this.arabalar.length; i++) {
      var b = this.arabalar[i];
      if (b === a) continue;
      var dx = b.gx - a.gx, dy = b.gy - a.gy;
      var ileri = dx * ca + dy * sa;
      if (ileri <= 0.05) continue;
      if (hedefUz !== undefined && ileri > hedefUz + 0.45) continue;      /* duracağım yerin ötesinde */
      if ((b.suanHiz || 0) < 0.03 && a.yol && a.yol.length) {
        /* duran araç: yalnızca gideceğim doğrunun üstündeyse engeldir */
        var hx = a.yol[0].gx - a.gx, hy = a.yol[0].gy - a.gy, hl = hx * hx + hy * hy;
        var t = hl > 1e-6 ? Math.max(0, Math.min(1, (dx * hx + dy * hy) / hl)) : 0;
        var ex = dx - hx * t, ey = dy - hy * t;
        if (ex * ex + ey * ey > 0.3 * 0.3) continue;
      }
      var bUz = (ARAC_UZ[this.aracCesit(b)] || 0.76) / 2;
      var hiza = Math.abs(aciFark(b.aci || 0, a.aci));
      if (hiza > 2.3 && b.yol && b.yol.length) continue;                /* karşıdan gelen: yan yana geçilir */
      var bYari = hiza < 0.8 || hiza > 2.34 ? bUz : 0.22;
      if (ileri > benUz + bYari + 0.24) continue;
      if (Math.abs(-dx * sa + dy * ca) > 0.27) continue;
      return b;
    }
    return null;
  };

  Z.arabaIlerlet = function (a, dt) {
    if (a.aci === undefined || a._yon === undefined) {
      a._yon = 1;
      if (a.yol && a.yol.length) a.aci = Math.atan2(a.yol[0].gy - a.gy, a.yol[0].gx - a.gx);
      else if (a.aci === undefined) a.aci = 0;
    }
    if (a.bekle && a.bekle > 0) { a.bekle -= dt; a.fren = true; a.suanHiz = 0; return; }
    if (!a.yol || !a.yol.length) {
      a.suanHiz = 0;
      if (a.durum === 'gidiyor') a.sil = true;
      return;
    }
    var h = a.yol[0], son = a.yol.length === 1;
    if (!a._sira) a._sira = (this._aracSay = (this._aracSay || 0) + 1);
    var hx = h.gx, hy = h.gy;
    if (!son && a.mid) {
      /* istasyon içinde sağdan git: karşıdan gelenle burun buruna gelme */
      var sbx = D.sube();
      if (a.gy < sbx.h + 0.9 && hy < sbx.h + 0.9) {
        var ux = hx - a.gx, uy = hy - a.gy, ul = Math.sqrt(ux * ux + uy * uy);
        if (ul > 0.45) { hx += uy / ul * 0.11; hy -= ux / ul * 0.11; }
      }
    }
    var dx = hx - a.gx, dy = hy - a.gy;
    var uz = Math.sqrt(dx * dx + dy * dy);
    var esik = son ? 0.035 : 0.2;
    if (a._hedef !== h) { a._hedef = h; a._sure = 0; }
    a._sure += dt;

    if (uz < esik) {
      if (son) { a.gx = h.gx; a.gy = h.gy; }
      a.yol.shift();
      if (!a.yol.length) {
        a.suanHiz = 0;
        if (a.durum === 'gidiyor' || a.durum === 'gecis') a.sil = true;
        else if (a.durum !== 'parkta') a.durum = 'park';
      }
      return;
    }
    var hedefAci = Math.atan2(dy, dx);
    var fark = aciFark(hedefAci, a.aci), mf = Math.abs(fark);

    /* hız hedefi */
    var v = a.hiz;
    v *= Math.max(0.3, 1 - mf / 1.5);                         /* virajda yavaşla */
    if (son) v = Math.min(v, Math.max(0.16, uz * 1.9));       /* yumuşak duruş */
    else if (uz < 0.6 && a.yol.length > 1) {
      /* yaklaşan köşe keskinse yavaşla */
      var n = a.yol[1];
      var kose = Math.abs(aciFark(Math.atan2(n.gy - h.gy, n.gx - h.gx), hedefAci));
      v = Math.min(v, a.hiz * Math.max(0.4, 1 - kose / 2.2));
    }
    /* öndeki araç */
    var engel = false;
    if (!(a._gec > 0)) {
      engel = this.ondeEngel(a, son ? uz : undefined);
      a._engel = engel;
      if (engel && engel._engel === a && a._sira < engel._sira) engel = null;   /* karşılıklı kilit: eski olan geçer */
      if (engel) { a._tikali = (a._tikali || 0) + dt; if (a._tikali > 6) { a._gec = 1.8; a._tikali = 0; } }
      else a._tikali = 0;
    } else { a._gec -= dt; a._engel = null; }
    if (engel) v = 0;

    var onceki = a.suanHiz || 0;
    var ivme = v > onceki ? 1.9 : 4.2;
    a.suanHiz = onceki + Math.max(-ivme * dt, Math.min(ivme * dt, v - onceki));
    a.fren = a.suanHiz < onceki - 0.001 || engel;
    if (engel && a.suanHiz < 0.02) { a.suanHiz = 0; return; }

    /* direksiyon */
    var takildi = a._sure > 7;
    if (takildi || (son && uz < 0.16)) {
      /* son santimler: doğrudan hedefe süzül */
      var adim0 = Math.min(uz, Math.max(a.suanHiz, 0.14) * dt);
      a.gx += dx / uz * adim0; a.gy += dy / uz * adim0;
      if (mf < 1.2 || takildi) a.aci += fark * Math.min(1, dt * 5);
      return;
    }
    var donus = Math.min(4.6, Math.max(1.6, a.suanHiz / 0.26));   /* rad/sn */
    if (uz < 0.5 && mf > 0.9) donus = 5.2;                          /* dar manevra */
    a.aci += Math.max(-donus * dt, Math.min(donus * dt, fark));
    var adim = Math.min(uz, a.suanHiz * dt);
    a.gx += Math.cos(a.aci) * adim;
    a.gy += Math.sin(a.aci) * adim;
  };

  /* =========================================================
     İNSANLAR
     ========================================================= */
  var SAC = ['#3a2a1e', '#5a3d26', '#1f1a17', '#8a6238', '#6b6b6b', '#b98a4a'];
  var TEN = ['#f1c9a5', '#e8b98f', '#d9a37a', '#c68e63'];

  Z.insanModel = function (p, sapka) {
    var c = this.cz, o = this.kam.olcek, I = this.isik();
    var P = this.ekran(p.gx, p.gy, 0);
    var yuru = !!p.yuruyor, faz = p.faz || 0;
    var yon = p.yon === undefined ? 1 : p.yon;            /* ekranda sağ(+1) / sol(-1) */
    var arkasi = !!p.arkasi;
    var tohum = p.tohum === undefined ? (p.tohum = Math.floor(Math.random() * 1000)) : p.tohum;
    var sw = yuru ? Math.sin(faz) : 0;
    var zip = yuru ? Math.abs(Math.cos(faz)) * 0.9 : Math.sin(Date.now() / 600 + tohum) * 0.25;
    var x = P.x, y = P.y;
    var s = function (v) { return v * o; };

    this.golgeCiz(x, y + s(0.5), s(5.2), s(2.4), 0.3);
    c.lineCap = 'round';
    /* bacaklar */
    var pant = this.ton(p.pantolon || ['#2f3a4d', '#3f4a5c', '#4a3f38', '#28303c'][tohum % 4], I);
    var kalca = y - s(8);
    for (var b = 0; b < 2; b++) {
      var isr = b === 0 ? 1 : -1;
      var ax = x + s(1.3) * isr, bx2 = ax + s(2.7) * sw * isr * yon, by2 = y - s(0.9) - (yuru ? Math.max(0, -sw * isr) * s(1.5) : 0);
      c.strokeStyle = pant; c.lineWidth = s(2.7);
      c.beginPath(); c.moveTo(ax, kalca); c.lineTo(bx2, by2); c.stroke();
      c.fillStyle = this.ton('#23272e', I);
      c.beginPath(); c.ellipse(bx2 + s(0.6) * yon, by2 + s(0.5), s(1.9), s(1.05), 0, 0, 6.3); c.fill();
    }
    /* arka kol */
    var govdeUst = y - s(18) - s(zip), omuz = govdeUst + s(2.4);
    var kolRenk = this.ton(p.renk, I * 0.84);
    var calis = !!p.calisiyor;
    c.strokeStyle = kolRenk; c.lineWidth = s(2.2);
    c.beginPath(); c.moveTo(x - s(3) * yon, omuz); c.lineTo(x - s(3.4) * yon + s(2.4) * sw * yon, omuz + s(6.2)); c.stroke();
    /* gövde */
    c.fillStyle = this.ton(p.renk, I);
    this.yuvarlakKutu(x - s(3.6), govdeUst, s(7.2), s(11), s(3.1)); c.fill();
    c.fillStyle = 'rgba(0,0,0,.13)';
    this.yuvarlakKutu(x + s(0.9) * (yon > 0 ? -4 : 1), govdeUst, s(2.7), s(11), s(1.3)); c.fill();
    if (p.tip === 'pompaci' || p.tip === 'teknisyen' || p.tip === 'temizlik') {
      /* reflektör şerit */
      c.fillStyle = 'rgba(255,255,255,.78)';
      c.fillRect(x - s(3.4), govdeUst + s(5.2), s(6.8), s(1.2));
    } else if (p.tip === 'mudur') {
      c.fillStyle = this.ton('#f4f6f8', I);
      c.beginPath(); c.moveTo(x - s(1.2), govdeUst + s(0.6)); c.lineTo(x + s(1.2), govdeUst + s(0.6)); c.lineTo(x, govdeUst + s(5)); c.fill();
      c.fillStyle = this.ton('#c0392b', I); c.fillRect(x - s(0.45), govdeUst + s(1.2), s(0.9), s(3.6));
    }
    /* ön kol */
    c.strokeStyle = this.ton(p.renk, I * 0.92); c.lineWidth = s(2.2);
    var elx, ely;
    if (calis) { elx = x + s(6.5) * (p.elYon || -1); ely = omuz + s(3 + Math.sin(Date.now() / 260) * 0.6); }
    else { elx = x + s(3.4) * yon - s(2.4) * sw * yon; ely = omuz + s(6.2); }
    c.beginPath(); c.moveTo(x + s(3) * yon, omuz); c.lineTo(elx, ely); c.stroke();
    var ten = this.ton(TEN[tohum % 4], I);
    c.fillStyle = ten; c.beginPath(); c.arc(elx, ely, s(1.15), 0, 6.3); c.fill();
    /* alışveriş poşeti: elden sarkar, yürürken hafif savrulur */
    if (p.poset) {
      var px = elx + s(0.3) * yon + (yuru ? s(0.7) * sw : 0), py = ely + s(1.1);
      c.strokeStyle = this.ton(p.poset, I * 0.8); c.lineWidth = s(0.6);
      c.beginPath(); c.moveTo(px - s(1.3), py); c.quadraticCurveTo(px, py - s(1.6), px + s(1.3), py); c.stroke();
      c.fillStyle = this.ton(p.poset, I);
      this.yuvarlakKutu(px - s(1.7), py, s(3.4), s(4.2), s(0.6)); c.fill();
      c.fillStyle = 'rgba(0,0,0,.12)';
      this.yuvarlakKutu(px + s(0.5), py, s(1.2), s(4.2), s(0.5)); c.fill();
    }
    if (p.tip === 'temizlik') {
      c.strokeStyle = this.ton('#8a6a42', I); c.lineWidth = s(1);
      c.beginPath(); c.moveTo(elx, ely - s(5)); c.lineTo(elx + s(2.5) * yon, y); c.stroke();
      c.strokeStyle = this.ton('#e0c46a', I); c.lineWidth = s(2.6);
      c.beginPath(); c.moveTo(elx + s(1.6) * yon, y - s(0.6)); c.lineTo(elx + s(3.8) * yon, y - s(0.2)); c.stroke();
    }
    c.lineCap = 'butt';
    /* baş */
    var by = govdeUst - s(2.9), r = s(3.9);
    c.fillStyle = ten; c.beginPath(); c.arc(x, by, r, 0, 6.3); c.fill();
    if (sapka) {
      c.fillStyle = this.ton(sapka, I);
      c.beginPath(); c.arc(x, by - s(0.5), r * 1.03, Math.PI, 0); c.closePath(); c.fill();
      if (!arkasi) { c.beginPath(); c.ellipse(x + s(2.6) * yon, by - s(0.5), s(2.8), s(0.95), 0, 0, 6.3); c.fill(); }
    } else {
      c.fillStyle = this.ton(SAC[tohum % 6], I);
      c.beginPath();
      if (arkasi) c.arc(x, by, r * 1.02, 0, 6.3);
      else { c.arc(x, by - s(0.3), r * 1.04, Math.PI * 1.02, -0.06); c.quadraticCurveTo(x - s(1.2) * yon, by - s(2.2), x - s(3.9) * yon, by + s(1.4)); }
      c.fill();
    }
    if (!arkasi && o > 0.6) {
      c.fillStyle = '#2a2420';
      c.beginPath(); c.arc(x + s(0.5) * yon, by + s(0.5), s(0.55), 0, 6.3); c.fill();
      c.beginPath(); c.arc(x + s(2.5) * yon, by + s(0.5), s(0.55), 0, 6.3); c.fill();
    }
  };

  Z.insanCiz = function (gx, gy, renk, faz, sapka) {
    this.insanModel({ gx: gx, gy: gy, renk: renk, faz: faz, tohum: Math.round(gx * 7 + gy * 13) }, sapka);
  };

  /* yaya rotası: karo sınırındaki koridorlardan yürür, binaların içinden geçmez */
  Z.yayaRota = function (p, hedef) {
    var kx1 = Math.floor(hedef.gx), kx2 = kx1 + 1;
    var kx = Math.abs(p.gx - kx1) <= Math.abs(p.gx - kx2) ? kx1 : kx2;
    if (Math.abs(hedef.gy - p.gy) < 0.3) return [{ gx: hedef.gx, gy: hedef.gy }];
    return [{ gx: kx, gy: p.gy }, { gx: kx, gy: hedef.gy }, { gx: hedef.gx, gy: hedef.gy }];
  };

  var eskiYaya = Z.yayaGuncelle;
  Z.yayaGuncelle = function (sb, dt) {
    var i, p, onceki = [];
    var L = this.yayalar || [];
    for (i = 0; i < L.length; i++) onceki.push({ p: L[i], gx: L[i].gx, gy: L[i].gy, hedef: L[i].hedef, bekle: L[i].bekle });
    eskiYaya.call(this, sb, 0);                 /* yalnız doğma/silinme/hedef mantığı; yürüyüş aşağıda */
    L = this.yayalar || [];
    for (i = 0; i < L.length; i++) {
      p = L[i];
      if (p.bekle > 0) { p.bekle -= dt; p.yuruyor = false; continue; }
      if (p._rh !== p.hedef) { p._rh = p.hedef; p.rota = this.yayaRota(p, p.hedef); }
      if (!p.rota || !p.rota.length) { p.yuruyor = false; p.gx = p.hedef.gx; p.gy = p.hedef.gy; continue; }
      var h = p.rota[0], dx = h.gx - p.gx, dy = h.gy - p.gy, uz = Math.sqrt(dx * dx + dy * dy);
      if (uz < 0.04) {
        p.rota.shift();
        if (!p.rota.length) { p.gx = p.hedef.gx; p.gy = p.hedef.gy; p.yuruyor = false; }
        continue;
      }
      var adim = Math.min(uz, p.hiz * dt);
      p.gx += dx / uz * adim; p.gy += dy / uz * adim;
      p.yuruyor = true;
      p.faz = (p.faz || 0) + dt * (7 + p.hiz * 9);
      var ex = dx - dy;                           /* ekrandaki yatay yön */
      if (Math.abs(ex) > 0.02 * uz) p.yon = ex > 0 ? 1 : -1;
      p.arkasi = (dx + dy) < -0.3 * uz;
    }
  };

  var eskiPersonel = Z.personelGuncelle;
  Z.personelGuncelle = function (sb, dt) {
    eskiPersonel.call(this, sb, dt);
    var iz = this._perIz || (this._perIz = {});
    var say = {};
    for (var i = 0; i < this.personeller.length; i++) {
      var p = this.personeller[i];
      say[p.tip] = (say[p.tip] || 0) + 1;
      var k = p.tip + say[p.tip];
      var e = iz[k] || (iz[k] = { gx: p.gx, gy: p.gy, yon: 1, faz: 0, tohum: i * 37 + 11 });
      var dx = p.gx - e.gx, dy = p.gy - e.gy, uz = Math.sqrt(dx * dx + dy * dy);
      p.yuruyor = uz > 0.0008;
      if (p.yuruyor) {
        e.faz += dt * 11;
        if (Math.abs(dx - dy) > 0.15 * uz) e.yon = dx - dy > 0 ? 1 : -1;
        e.arkasi = (dx + dy) < -0.3 * uz;
      } else if (p.tip === 'pompaci') { e.yon = -1; e.arkasi = false; }
      e.gx = p.gx; e.gy = p.gy;
      p.faz = e.faz; p.yon = e.yon; p.arkasi = e.arkasi; p.tohum = e.tohum; p.elYon = -1;
    }
  };
})();

/* =========================================================
   BÖLÜM 3 — bekleme düzeni: araçlar asla üst üste beklemez
   ========================================================= */
(function () {
  var Z = IZO;

  Z.beklemeYeri = function (sb, sira) {
    var kp = this.kapilar(sb);
    var bas = kp.giris + 0.85, adim = 1.02;
    var n = Math.max(1, Math.floor((sb.w - 0.55 - bas) / adim) + 1);
    if (sira < n) return { gx: bas + (n - 1 - sira) * adim, gy: kp.bekY };   /* ilk gelen en öne çeker */
    /* şerit dolunca: yol kenarında, kapının gerisinde sıra */
    var k = sira - n;
    return { gx: kp.giris - 1.25 - k * 1.05, gy: kp.yolY, yolda: true };
  };

  var eskiYap = Z.arabaYap;
  Z.arabaYap = function (sb, m, sira) {
    var a = eskiYap.call(this, sb, m, sira);
    if (m.pompa === null) {
      var bek = this.beklemeYeri(sb, sira);
      if (bek.yolda) a.yol = [{ gx: bek.gx, gy: bek.gy }];
      a.bekYeri = bek;
    }
    return a;
  };

  var eskiTrafik = Z.cevreTrafigi;
  Z.cevreTrafigi = function (sb, dt) {
    var once = this.arabalar.length;
    eskiTrafik.call(this, sb, dt);
    if (this.arabalar.length > once) {
      var y = this.arabalar[this.arabalar.length - 1];
      y.aci = y.yol[0].gx > y.gx ? 0 : Math.PI;
      for (var i = 0; i < once; i++) {
        var b = this.arabalar[i];
        if (Math.abs(b.gy - y.gy) < 0.3 && Math.abs(b.gx - y.gx) < 2.2) { this.arabalar.pop(); break; }
      }
    }
  };

  var eskiMus = Z.musteriArabalari;
  Z.musteriArabalari = function (sb) {
    eskiMus.call(this, sb);
    var kp = this.kapilar(sb);
    for (var c0 = 0; c0 < this.arabalar.length; c0++) {
      var ar = this.arabalar[c0];
      if (!ar.mid || ar._cikis || (ar.durum !== 'gidiyor' && ar.durum !== 'parkta')) continue;
      ar._cikis = true;
      var cikisYolu = [{ gx: kp.cikis, gy: kp.seritY }, { gx: kp.cikis, gy: kp.agizY }, { gx: kp.cikis, gy: sb.h + 1.72 }, { gx: sb.w + 7, gy: sb.h + 1.72 }];
      var on = [];
      var cepte = false;
      if (ar.hedefPompa !== null && ar.hedefPompa !== undefined) {
        var qx = ar.hedefPompa % sb.w, qy = Math.floor(ar.hedefPompa / sb.w);
        if (Math.abs(ar.gx - (qx + 0.52)) < 0.3 && Math.abs(ar.gy - (qy + 0.82)) < 0.25) {
          cepte = true;
          on = [{ gx: qx + 0.2, gy: qy + 0.92 }, { gx: qx + 0.02, gy: qy + 1.3 }, { gx: qx + 0.02, gy: kp.seritY }];
        }
      }
      if (!cepte) {
        if (ar.gy >= sb.h + 0.9) {                       /* yoldan vazgeçti: akışa katıl */
          ar.yol = [{ gx: ar.gx + 1.1, gy: sb.h + 1.72 }, { gx: sb.w + 7, gy: sb.h + 1.72 }];
          continue;
        }
        on = [{ gx: Math.min(kp.cikis, ar.gx + 0.5), gy: kp.seritY }];
      }
      if (ar.durum === 'parkta' && ar.parkYeri) {
        ar.yol = on.concat([{ gx: ar.parkYeri.gx, gy: kp.seritY }, { gx: ar.parkYeri.gx, gy: ar.parkYeri.gy }]);
      } else ar.yol = on.concat(cikisYolu);
    }
    var bekleyen = {};
    for (var w = 0; w < sb.kuyruk.length; w++) if (sb.kuyruk[w].pompa === null) bekleyen[sb.kuyruk[w].id] = true;
    for (var i = 0; i < this.arabalar.length; i++) {
      var a = this.arabalar[i];
      if (!a.mid || a.durum === 'gidiyor' || a.durum === 'parkta') continue;
      /* sıra yeri değiştiyse rota sonu da değişsin */
      if (bekleyen[a.mid] && a.bekYeri) {
        var by = a.bekYeri;
        if (a.yol && a.yol.length) {
          var sn = a.yol[a.yol.length - 1];
          if (sn.gx !== by.gx || sn.gy !== by.gy) {
            if ((sn.gy < sb.h + 0.9) === (by.gy < sb.h + 0.9)) a.yol[a.yol.length - 1] = { gx: by.gx, gy: by.gy };
            else a.yol = [{ gx: by.gx, gy: by.gy }];
          }
        } else if (Math.abs(a.gx - by.gx) > 0.06 || Math.abs(a.gy - by.gy) > 0.06) {
          a.yol = [{ gx: by.gx, gy: by.gy }];
          a.durum = 'geliyor';
        }
      }
      /* pompaya yanaşma: kendi cebine doğu sınırından girer, komşu cebin içinden geçmez */
      if (a.hedefPompa !== null && a.hedefPompa !== undefined && a._rotaPompa !== a.hedefPompa && a.yol && a.yol.length >= 3) {
        a._rotaPompa = a.hedefPompa;
        var px = a.hedefPompa % sb.w, py = Math.floor(a.hedefPompa / sb.w);
        var bas = a.yol.slice(0, a.yol.length - 3);
        if (bas.length && Math.abs(bas[bas.length - 1].gx - a.gx) < 0.01 && bas.length === 1 && a.gy < sb.h + 0.9) {
          /* bekleme şeridinden çıkış: olduğu yerde yan kaymak yerine öne doğru çapraz çık */
          bas = [{ gx: a.gx + (px + 1 >= a.gx ? 0.45 : -0.45), gy: kp.seritY }];
        }
        a.yol = bas.concat([
          { gx: px + 1.0, gy: kp.seritY },
          { gx: px + 1.0, gy: py + 1.28 },
          { gx: px + 0.93, gy: py + 0.84 },
          { gx: px + 0.52, gy: py + 0.82 }
        ]);
      }
      if (!a.yol || !a.yol.length) continue;
      var son = a.yol[a.yol.length - 1];
      var disarda = a.gy >= sb.h + 0.9;
      var kapida = Math.abs(a.gx - kp.giris) < 0.3 && a.gy < kp.yolY + 0.1;
      if (disarda && !kapida && son.gy < sb.h + 0.9) {
        /* içeri girecek ama rota kapıdan geçmiyor → kapıdan geçir */
        var kapili = false;
        for (var k = 0; k < a.yol.length; k++) if (Math.abs(a.yol[k].gy - kp.agizY) < 0.02 && Math.abs(a.yol[k].gx - kp.giris) < 0.02) kapili = true;
        if (!kapili) {
          var ic = [];
          for (var q = 0; q < a.yol.length; q++) if (a.yol[q].gy < sb.h + 0.9) ic.push(a.yol[q]);
          a.yol = [{ gx: kp.giris, gy: kp.yolY }, { gx: kp.giris, gy: kp.agizY }, { gx: kp.giris, gy: ic.length > 1 ? kp.seritY : kp.bekY }].concat(ic);
        }
      } else if (disarda && son.gy >= sb.h + 0.9 && a.gx > son.gx + 0.3 && a.durum !== 'gecis') {
        /* yol kenarı sırası gerisinde kaldı: geri gitmek yerine olduğu yerde bekle */
        a.yol = [];
      }
    }
  };
})();

/* =========================================================
   BÖLÜM 4 — marka tabelası (totem): bir kez çizilir, hazır resim olarak basılır
   ========================================================= */
(function () {
  var Z = IZO;
  var KUCULT = 0.58;
  var OLCU = {
    klasik: { direk: 30, en: 60, bas: 24, satir: 15, ayak: 'govde' },
    genis:  { direk: 30, en: 78, bas: 25, satir: 16, ayak: 'cift' },
    kule:   { direk: 58, en: 50, bas: 21, satir: 13, ayak: 'govde', tepe: true },
    tente:  { direk: 16, en: 72, bas: 23, satir: 15, ayak: 'cift', kemer: true }
  };

  Z.totemOlcu = function (st, n) {
    var ol = OLCU[st.sekil] || OLCU.klasik;
    var H = ol.bas + 3 + (n ? n * ol.satir + 5 : 0) + 9;
    return { ol: ol, H: H, alt: 5 + ol.direk };
  };

  Z.totemYakitlar = function (sb, st) {
    var l = [];
    if (!st.fiyat) return l;
    ['benzin', 'dizel', 'lpg', 'ev'].forEach(function (y) {
      if (y === 'ev') { if (SIM.yakitVar(sb, 'ev')) l.push(y); }
      else if (sb.tank[y]) l.push(y);
    });
    return l;
  };

  /* (0,0) karosuna çizer */
  Z.totemModel = function (st, satirlar) {
    var c = this.cz, o = this.kam.olcek, I = this.isik(), gece = this.gece(), self = this;
    var olc = this.totemOlcu(st, satirlar.length), ol = olc.ol;
    var s = function (v) { return v * o; };
    var isikli = function (r, enAz) { return gece ? r : self.ton(r, Math.max(I, enAz || 0.8)); };

    /* --- kaide: çiçeklik --- */
    this.golge(0.24, 0.24, 0.56, 0.56, 0.34);
    var kg = ol.ayak === 'cift' ? 0.3 : 0;
    this.prizma(this.ayak(0.5, 0.5, 0.56 + kg, 0.44, 0.12, 0, 3), 0, 5, '#cfd5db');
    this.prizma(this.ayak(0.5, 0.5, 0.48 + kg, 0.36, 0.1, 0, 3), 5, 0.6, '#6b5138', { kenarsiz: true });
    var T = this.ekran(0.5, 0.5, 5);
    var W = s(ol.en), H = s(olc.H);
    var x0 = T.x - W / 2, yAlt = T.y - s(ol.direk), y0 = yAlt - H;
    var kal = s(5);                                   /* pano kalınlığı */

    /* --- ayaklar --- */
    var ayakCiz = function (x, w) {
      var g = c.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, self.ton('#aeb7c1', I)); g.addColorStop(0.45, self.ton('#eef2f5', I)); g.addColorStop(1, self.ton('#8f99a5', I));
      c.fillStyle = g; c.fillRect(x, yAlt - s(1), w, T.y - yAlt + s(1.5));
      c.fillStyle = self.ton('#6f7985', I);
      c.beginPath(); c.moveTo(x + w, yAlt); c.lineTo(x + w + kal * 0.6, yAlt - kal * 0.3); c.lineTo(x + w + kal * 0.6, T.y - kal * 0.3); c.lineTo(x + w, T.y + s(0.5)); c.fill();
    };
    if (ol.ayak === 'cift') { ayakCiz(x0 + W * 0.13, s(5)); ayakCiz(x0 + W * 0.87 - s(5), s(5)); }
    else {
      var gw = W * 0.56;
      ayakCiz(T.x - gw / 2, gw);
      c.fillStyle = isikli(st.pano, 0.75);
      c.fillRect(T.x - gw / 2 + s(3), yAlt, s(3.2), T.y - yAlt);
    }
    /* çalılar (ayakların önünde) */
    var pal = this.sezonAd() === 'kis' ? ['#dfe8ec', '#c3d1d8', '#f6fafc'] : ['#58a348', '#3d8334', '#86c873'];
    var b1 = this.ekran(0.34, 0.66, 5.5), b2 = this.ekran(0.62, 0.72, 5.5), b3 = this.ekran(0.72, 0.5, 5.5);
    this.lob(b3.x, b3.y - s(2), s(4), pal); this.lob(b1.x, b1.y - s(2.4), s(4.6), pal); this.lob(b2.x, b2.y - s(2), s(4.2), pal);

    /* --- pano gövdesi: yan ve üst kalınlık --- */
    var r = s(4);
    c.fillStyle = this.ton('#7c8794', I);
    c.beginPath(); c.moveTo(x0 + W - r, y0); c.lineTo(x0 + W + kal - r, y0 - kal * 0.5);
    c.lineTo(x0 + W + kal, y0 - kal * 0.5 + r); c.lineTo(x0 + W + kal, yAlt - kal * 0.5 - r); c.lineTo(x0 + W, yAlt); c.lineTo(x0 + W, y0); c.fill();
    c.fillStyle = this.ton('#dfe5ea', I);
    c.beginPath(); c.moveTo(x0 + r, y0); c.lineTo(x0 + kal + r, y0 - kal * 0.5); c.lineTo(x0 + W + kal - r, y0 - kal * 0.5); c.lineTo(x0 + W - r, y0); c.fill();
    /* ön yüz çerçevesi */
    var fg = c.createLinearGradient(x0, y0, x0 + W, y0);
    fg.addColorStop(0, isikli('#f7f9fb', 0.75)); fg.addColorStop(1, isikli('#d5dce3', 0.75));
    c.fillStyle = fg; this.yuvarlakKutu(x0, y0, W, H, r); c.fill();

    /* --- marka başlığı --- */
    var p = s(2.2), bw = W - p * 2, bh = s(ol.bas), bx = x0 + p, by = y0 + p;
    if (gece) { c.save(); c.shadowColor = st.pano; c.shadowBlur = s(7); }
    var bg = c.createLinearGradient(0, by, 0, by + bh);
    bg.addColorStop(0, isikli(this.karis(st.pano, '#ffffff', 0.2), 0.8)); bg.addColorStop(0.55, isikli(st.pano, 0.8)); bg.addColorStop(1, isikli(this.karis(st.pano, '#000000', 0.18), 0.8));
    c.fillStyle = bg;
    if (ol.kemer) {
      c.beginPath(); c.moveTo(bx, by + bh); c.lineTo(bx, by + s(6)); c.quadraticCurveTo(bx + bw / 2, by - s(5), bx + bw, by + s(6)); c.lineTo(bx + bw, by + bh); c.closePath();
    } else this.yuvarlakKutu(bx, by, bw, bh, s(3));
    c.fill();
    if (gece) c.restore();
    /* parlama */
    c.fillStyle = 'rgba(255,255,255,.16)';
    this.yuvarlakKutu(bx + s(1.5), by + s(1.5), bw - s(3), bh * 0.36, s(2)); c.fill();
    /* logo rozeti + ad */
    var lr = bh * 0.34, lx = bx + lr + s(3), ly = by + bh / 2 + (ol.kemer ? s(1.5) : 0);
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(lx, ly, lr, 0, 6.3); c.fill();
    c.strokeStyle = this.karis(st.pano, '#000000', 0.25); c.lineWidth = Math.max(0.6, s(0.7)); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = Math.round(lr * 1.25) + 'px sans-serif'; c.fillStyle = '#17243d';
    c.fillText(st.logo, lx, ly + s(0.4));
    var alan = bw - lr * 2 - s(8), fb = bh * 0.5, mx = lx + lr + s(2.5) + alan / 2;
    var satir = [st.ad];
    c.font = '800 ' + fb.toFixed(1) + 'px sans-serif';
    if (c.measureText(st.ad).width > alan * 1.3 && st.ad.indexOf(' ') > 0) {
      /* uzun ad: iki satıra böl (ortaya en yakın boşluktan) */
      var bos = -1, orta = st.ad.length / 2;
      for (var q = 0; q < st.ad.length; q++) if (st.ad[q] === ' ' && (bos < 0 || Math.abs(q - orta) < Math.abs(bos - orta))) bos = q;
      satir = [st.ad.slice(0, bos), st.ad.slice(bos + 1)];
      fb = bh * 0.36;
    }
    var sigar = function () { for (var w = 0; w < satir.length; w++) if (c.measureText(satir[w]).width > alan) return false; return true; };
    c.font = '800 ' + fb.toFixed(1) + 'px sans-serif';
    while (!sigar() && fb > 3) { fb -= 0.5; c.font = '800 ' + fb.toFixed(1) + 'px sans-serif'; }
    for (var w2 = 0; w2 < satir.length; w2++) {
      var ty2 = ly + (satir.length === 2 ? (w2 - 0.5) * fb * 1.08 : 0);
      c.fillStyle = 'rgba(0,0,0,.28)'; c.fillText(satir[w2], mx, ty2 + s(0.9));
      c.fillStyle = st.yazi; c.fillText(satir[w2], mx, ty2 + s(0.3));
    }

    /* --- fiyat satırları --- */
    var yy = by + bh + s(3);
    if (satirlar.length) {
      var ph = satirlar.length * s(ol.satir) + s(3);
      c.fillStyle = gece ? '#05080d' : '#141b25';
      this.yuvarlakKutu(bx, yy - s(1), bw, ph, s(2.5)); c.fill();
      for (var k = 0; k < satirlar.length; k++) {
        var sat = satirlar[k], sy = yy + s(0.5) + s(ol.satir) * (k + 0.5);
        var rh = s(ol.satir) * 0.66, rw = Math.min(bw * 0.33, s(19));
        c.fillStyle = sat.renk; this.yuvarlakKutu(bx + s(2), sy - rh / 2, rw, rh, rh * 0.35); c.fill();
        c.fillStyle = '#ffffff'; c.textAlign = 'center';
        c.font = '800 ' + (rh * 0.68).toFixed(1) + 'px sans-serif';
        c.fillText(sat.kisa, bx + s(2) + rw / 2, sy + s(0.3));
        c.textAlign = 'right';
        var pf = s(ol.satir) * 0.7;
        c.font = 'bold ' + pf.toFixed(1) + 'px ui-monospace, Menlo, monospace';
        while (c.measureText(sat.fiyat).width > bw - rw - s(8) && pf > 3) { pf -= 0.5; c.font = 'bold ' + pf.toFixed(1) + 'px ui-monospace, Menlo, monospace'; }
        if (gece) { c.save(); c.shadowColor = 'rgba(255,190,80,.9)'; c.shadowBlur = s(4); }
        c.fillStyle = gece ? '#ffd98a' : '#ffe9b0';
        c.fillText(sat.fiyat, bx + bw - s(2.5), sy + s(0.4));
        if (gece) c.restore();
        if (k < satirlar.length - 1) { c.fillStyle = 'rgba(255,255,255,.09)'; c.fillRect(bx + s(2), sy + s(ol.satir) / 2 - s(0.3), bw - s(4), Math.max(0.5, s(0.5))); }
      }
      yy += ph + s(1);
    }
    /* --- alt şerit --- */
    c.fillStyle = isikli(this.karis(st.pano, '#000000', 0.12), 0.8);
    this.yuvarlakKutu(bx, yy, bw, s(7), s(2)); c.fill();
    c.fillStyle = st.yazi; c.textAlign = 'center';
    c.font = '800 ' + s(4.3).toFixed(1) + 'px sans-serif';
    c.fillText(ol.en > 60 ? 'HOŞ GELDİNİZ  •  7/24' : '7/24 AÇIK', bx + bw / 2, yy + s(3.8));

    /* --- kule: tepede dönen-logo görünümlü disk --- */
    if (ol.tepe) {
      var ty = y0 - s(13);
      c.fillStyle = this.ton('#8f99a5', I); c.fillRect(T.x - s(1.5), y0 - s(4), s(3), s(4.5));
      if (gece) { c.save(); c.shadowColor = st.pano; c.shadowBlur = s(8); }
      c.fillStyle = this.ton('#7c8794', I); c.beginPath(); c.arc(T.x + kal * 0.6, ty - kal * 0.3, s(10.5), 0, 6.3); c.fill();
      c.fillStyle = isikli(st.pano, 0.8); c.beginPath(); c.arc(T.x, ty, s(10.5), 0, 6.3); c.fill();
      if (gece) c.restore();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(T.x, ty, s(7.6), 0, 6.3); c.fill();
      c.font = s(9.5).toFixed(1) + 'px sans-serif'; c.fillStyle = '#17243d'; c.textAlign = 'center';
      c.fillText(st.logo, T.x, ty + s(0.6));
    }
    c.textBaseline = 'alphabetic';
  };

  var eskiBina = Z.binaCiz;
  Z.binaCiz = function (sb, i, gx, gy, b) {
    if (b.t !== 'totem') return eskiBina.call(this, sb, i, gx, gy, b);
    var self = this, o = this.kam.olcek, c = this.cz;
    var st = this.tabelaStili();
    var yk = this.totemYakitlar(sb, st), satirlar = [], anh = '';
    for (var k = 0; k < yk.length; k++) {
      var sat = { kisa: VERI.yakitlar[yk[k]].kisa, renk: VERI.yakitlar[yk[k]].renk, fiyat: say(sb.fiyat[yk[k]], 2) };
      satirlar.push(sat); anh += sat.kisa + sat.fiyat + ';';
    }
    var olc = this.totemOlcu(st, satirlar.length);
    var m = this.ekran(gx + 0.5, gy + 0.5, 0);
    var kk = KUCULT * o;
    var ust = (olc.alt + olc.H + (olc.ol.tepe ? 26 : 8)) * KUCULT;

    /* dokunma alanları: pano + kaide */
    if (!this._vurusKapali && this.vurus) {
      var yA = m.y - olc.alt * kk, yU = yA - olc.H * kk, yw = olc.ol.en * kk / 2 + 2 * o;
      this.vurus.push({ tip: 'hucre', i: i, poly: [{ x: m.x - yw, y: yU }, { x: m.x + yw, y: yU }, { x: m.x + yw, y: m.y + 8 * kk }, { x: m.x - yw, y: m.y + 8 * kk }] });
    }
    if (this.gece() && !this.dusukKalite) this.hale(m.x, m.y - (olc.alt + olc.H * 0.5) * kk, olc.ol.en * kk * 1.25, '255,236,200', 0.22);

    var sinir = { sol: olc.ol.en * KUCULT / 2 + 8, sag: olc.ol.en * KUCULT / 2 + 12, ust: ust + 8, alt: 24, S: 3 };
    var ciz = function () {
      var cc = self.cz, q = self.ekran(0.5, 0.5, 0);
      cc.save(); cc.translate(q.x, q.y); cc.scale(KUCULT, KUCULT); cc.translate(-q.x, -q.y);
      try { self.totemModel(st, satirlar); } finally { cc.restore(); }
    };
    var sp = this.spriteAl('totem|' + st.sekil + '|' + st.pano + '|' + st.yazi + '|' + st.ad + '|' + st.logo + '|' + anh, sinir, 0.5, 0.5, ciz);
    if (sp && !sp.hata) this.sprBas(sp, gx + 0.5, gy + 0.5);
    else {
      /* önbellek yoksa eski çizim */
      c.save(); c.translate(m.x, m.y); c.scale(KUCULT, KUCULT); c.translate(-m.x, -m.y);
      var ev = this._vurusKapali; this._vurusKapali = true;
      try { this.binaCizIc(sb, i, gx, gy, b); } catch (e) { }
      this._vurusKapali = ev;
      c.restore();
    }
  };
})();


/* =========================================================
   BÖLÜM 5 — araç pompaya varmadan dolum başlamaz
   ========================================================= */
(function () {
  var Z = IZO;

  /* sahne ilk kurulduğunda (oyun açılışı, şube değişimi) araçlar yerlerinde belirir */
  var eskiGuncelle = Z.guncelle;
  Z.guncelle = function (dt) {
    var sb = D.sube();
    this._yerinde = (D.s.aktif + ':' + sb.w + 'x' + sb.h) !== this._sahneAnahtar;
    try { eskiGuncelle.call(this, dt); } finally { this._yerinde = false; }
  };

  var eskiYap2 = Z.arabaYap;
  Z.arabaYap = function (sb, m, sira) {
    var a = eskiYap2.call(this, sb, m, sira);
    if (this._yerinde && a.yol && a.yol.length) {
      var son = a.yol[a.yol.length - 1];
      a.gx = son.gx; a.gy = son.gy; a.yol = [];
      a.aci = m.pompa !== null ? Math.PI : 0;
      a._yon = 1; a.durum = 'park'; a._rotaPompa = m.pompa;
    }
    return a;
  };

  var eskiMus2 = Z.musteriArabalari;
  Z.musteriArabalari = function (sb) {
    eskiMus2.call(this, sb);
    var simdi = Date.now(), araba = {};
    for (var i = 0; i < this.arabalar.length; i++) if (this.arabalar[i].mid) araba[this.arabalar[i].mid] = this.arabalar[i];
    for (var k = 0; k < sb.kuyruk.length; k++) {
      var m = sb.kuyruk[k];
      if (m.pompa === null) { if (m.yolda) m.yolda = false; continue; }
      var a = araba[m.id];
      if (!a) { m.yolda = false; continue; }
      var px = m.pompa % sb.w, py = Math.floor(m.pompa / sb.w);
      var hx = px + 0.52, hy = py + 0.82;
      var vardi = (!a.yol || !a.yol.length) && Math.abs(a.gx - hx) < 0.15 && Math.abs(a.gy - hy) < 0.15;
      if (vardi) { m.yolda = false; a._atama = 0; continue; }
      if (a._atamaP !== m.pompa || !a._atama) { a._atamaP = m.pompa; a._atama = simdi; }
      if (simdi - a._atama > 30000 || !a.yol || !a.yol.length) {
        /* çok uzun sürdü ya da rotasız kaldı: aracı yerine al, oyun tıkanmasın */
        a.gx = hx; a.gy = hy; a.yol = []; a.aci = Math.PI; a.durum = 'park';
        m.yolda = false; a._atama = 0;
      } else m.yolda = true;
    }
  };
})();


/* =========================================================
   BÖLÜM 6 — derinlik sırası: araçlar yapıların üstünden görünmesin
   Araç, kutusu yapının önünde kalıyorsa sonra; arkasında kalıyorsa önce çizilir.
   ========================================================= */
(function () {
  var Z = IZO;
  var UZ = { oto: 0.76, taksi: 0.78, minibus: 0.86, traktor: 0.66, motor: 0.4, tir: 1.1, otobus: 0.98 };
  Z.derinlikDuzelt = function (sb, liste) {
    var yapilar = [], i, k;
    for (i = 0; i < liste.length; i++) if (liste[i].tur === 'yapi') yapilar.push(liste[i]);
    if (!yapilar.length) return;
    for (i = 0; i < liste.length; i++) {
      var o = liste[i];
      if (o.tur !== 'araba') continue;
      var a = o.a, L = (UZ[this.aracCesit(a)] || 0.76) / 2, W = 0.2;
      var ca = Math.abs(Math.cos(a.aci || 0)), sa = Math.abs(Math.sin(a.aci || 0));
      var hx = ca * L + sa * W, hy = sa * L + ca * W;
      var x0 = a.gx - hx, x1 = a.gx + hx, y0 = a.gy - hy, y1 = a.gy + hy;
      var enAz = -1e9, enCok = 1e9;
      for (k = 0; k < yapilar.length; k++) {
        var y = yapilar[k];
        if (y.gx > x1 + 1.2 || y.gx + 1 < x0 - 1.2 || y.gy > y1 + 1.2 || y.gy + 1 < y0 - 1.2) continue;
        var pompa = sb.yapi[y.i].t === 'pompa';
        var sx0 = y.gx + (pompa ? 0.1 : 0.2), sx1 = y.gx + (pompa ? 0.9 : 0.8);
        var sy0 = y.gy + (pompa ? 0.1 : 0.2), sy1 = y.gy + (pompa ? 0.7 : 0.8);
        var e = 0.12;
        if (y0 >= sy1 - e || x0 >= sx1 - e) { if (y.d > enAz) enAz = y.d; }        /* araç önde */
        else if (y1 <= sy0 + e || x1 <= sx0 + e) { if (y.d < enCok) enCok = y.d; } /* araç arkada */
      }
      if (o.d <= enAz) o.d = enAz + 0.01;
      if (o.d >= enCok && enCok > enAz + 0.02) o.d = enCok - 0.01;
    }
    /* insanlar da aynı kural: önündeki yapının arkasında kalsın */
    for (i = 0; i < liste.length; i++) {
      var p = liste[i];
      if (p.tur !== 'insan' && p.tur !== 'yaya') continue;
      for (k = 0; k < yapilar.length; k++) {
        var yb = yapilar[k];
        if (Math.abs(yb.gx + 0.5 - p.gx) > 1.3 || Math.abs(yb.gy + 0.5 - p.gy) > 1.3) continue;
        var on = p.gy >= yb.gy + 0.68 || p.gx >= yb.gx + 0.78;
        var arka = p.gy <= yb.gy + 0.22 || p.gx <= yb.gx + 0.22;
        if (on && p.d <= yb.d) p.d = yb.d + 0.02;
        else if (!on && arka && p.d >= yb.d) p.d = yb.d - 0.02;
      }
    }
  };
})();


/* =========================================================
   BÖLÜM 7 — arsa dışına konan tabela
   ========================================================= */
(function () {
  var Z = IZO;

  var eskiDerinlik = Z.derinlikDuzelt;
  Z.derinlikDuzelt = function (sb, liste) {
    var self = this, T = SIM.disTotemler ? SIM.disTotemler(sb) : [];
    if (T.length) SIM.totemDisDuzelt(sb);
    var dolu = {};
    for (var q = 0; q < T.length; q++) dolu[T[q].x + ',' + T[q].y] = true;
    /* taşıma modunda konabilecek kareleri göster */
    if (typeof UI !== 'undefined' && UI.tabelaTasiniyor && UI.tabelaTasiniyor()) {
      var c = this.cz, nab = 0.2 + 0.1 * Math.sin(Date.now() / 300);
      for (var y = -1; y <= sb.h; y++) for (var x = -1; x <= sb.w; x++) {
        if (SIM.totemDisUygun(sb, x, y) !== '' || dolu[x + ',' + y]) continue;
        var a = this.ekran(x + 0.08, y + 0.08, 0), b = this.ekran(x + 0.92, y + 0.08, 0), d = this.ekran(x + 0.92, y + 0.92, 0), e = this.ekran(x + 0.08, y + 0.92, 0);
        c.fillStyle = 'rgba(62,196,122,' + nab.toFixed(2) + ')';
        c.strokeStyle = 'rgba(62,196,122,.9)'; c.lineWidth = Math.max(1, 1.3 * this.kam.olcek);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d.x, d.y); c.lineTo(e.x, e.y); c.closePath(); c.fill(); c.stroke();
      }
    }
    if (T.length) {
      for (var n = 0; n < T.length; n++) (function (t, kimlik) {
        liste.push({ d: t.x + t.y + 1, tur: 'ozel', gx: t.x, gy: t.y, ciz: function () { self.binaCiz(sb, kimlik, t.x, t.y, t); } });
      })(T[n], -2 - n);
      /* aynı karedeki ağaç, çalı, direk çizilmesin */
      for (var i = liste.length - 1; i >= 0; i--) {
        var o = liste[i];
        if (o.tur === 'sus' && !(o.s.w > 1 || o.s.h > 1) && dolu[Math.floor(o.s.gx + 0.01) + ',' + Math.floor(o.s.gy + 0.01)]) liste.splice(i, 1);
      }
    }
    if (eskiDerinlik) eskiDerinlik.call(this, sb, liste);
  };

  var eskiDokun = Z.dokunuldu;
  Z.dokunuldu = function (ex, ey) {
    if (typeof UI !== 'undefined' && UI.tabelaTasiniyor && UI.tabelaTasiniyor()) {
      var k = this.karo(ex, ey), gx = Math.floor(k.gx), gy = Math.floor(k.gy), sb = D.sube();
      var icte = gx >= 0 && gx < sb.w && gy >= 0 && gy < sb.h;
      if (!icte && gx >= -1 && gx <= sb.w && gy >= -1 && gy <= sb.h) { UI.disHucreTik(gx, gy); return; }
    }
    eskiDokun.call(this, ex, ey);
  };
})();


/* =========================================================
   BÖLÜM 8 — akıcılık: kare başına üretim bütçesi, insanlar da hazır resimden
   ========================================================= */
(function () {
  var Z = IZO;
  var eskiD = Z.derinlikDuzelt;
  Z.derinlikDuzelt = function (sb, liste) {
    this._sprButce = this.dusukKalite ? 2 : 4;          /* her karede en çok bu kadar yeni resim */
    if (eskiD) eskiD.call(this, sb, liste);
  };

  var hamInsan = Z.insanModel;
  Z.insanModel = function (p, sapka) {
    var self = this;
    if (p.tohum === undefined) p.tohum = Math.floor(Math.random() * 1000);
    var poz;
    if (p.calisiyor) poz = 'c' + (Math.floor(Date.now() / 300) % 2);
    else if (p.yuruyor) poz = 'y' + (Math.floor((((p.faz || 0) % 6.2832) + 6.2832) % 6.2832 / 6.2832 * 8) % 8);
    else poz = 'd';
    var yon = p.yon === undefined ? 1 : p.yon;
    var anh = 'insan|' + p.renk + '|' + (p.pantolon || '') + '|' + (p.tip || '') + '|' + (sapka || '') + '|' + (p.tohum % 12) + '|' + yon + '|' + (p.arkasi ? 1 : 0) + '|' + poz + '|' + (p.poset || '') + '|' + (p.elYon || '');
    var sp = this.spriteAl(anh, { sol: 20, sag: 20, ust: 36, alt: 8, S: 2 }, 0, 0, function () {
      var k = { gx: 0, gy: 0, renk: p.renk, pantolon: p.pantolon, tip: p.tip, tohum: p.tohum % 12, yon: yon, arkasi: p.arkasi,
        yuruyor: poz.charAt(0) === 'y', faz: poz.charAt(0) === 'y' ? (+poz.slice(1) + 0.5) / 8 * 6.2832 : 0,
        calisiyor: p.calisiyor, poset: p.poset, elYon: p.elYon };
      hamInsan.call(self, k, sapka);
    }, true);
    if (sp && !sp.hata) this.sprBas(sp, p.gx, p.gy);
    else hamInsan.call(this, p, sapka);
  };
})();
