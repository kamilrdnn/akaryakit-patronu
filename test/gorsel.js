/* Mağaza ve uygulama görsellerini üretir:
   - app/src/main/res/mipmap-<yogunluk>/ic_launcher ve ic_launcher_round
   - magaza/ikon-512.png
   - magaza/one-cikan-1024x500.png
   Çalıştır: node gorsel.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const KOK = path.join(__dirname, '..');
const RES = path.join(KOK, 'app', 'src', 'main', 'res');
const MAG = path.join(KOK, 'magaza');
if (!fs.existsSync(MAG)) fs.mkdirSync(MAG, { recursive: true });

/* ---------- yardımcılar ---------- */
function yuvarlakYol(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* izometrik kutu (ölçek birimli) */
function izoKutu(c, ox, oy, bx, by, bz, w, d, h, renk, s) {
  const TW = 1, TH = 0.5;
  const P = (gx, gy, z) => ({
    x: ox + (gx - gy) * TW * s * 0.5,
    y: oy + (gx + gy) * TH * s * 0.5 - z * s
  });
  const ton = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
    const b = Math.min(255, Math.round((n & 255) * k));
    return `rgb(${r},${g},${b})`;
  };
  const A = P(bx, by, bz + h), B = P(bx + w, by, bz + h),
        C = P(bx + w, by + d, bz + h), D = P(bx, by + d, bz + h);
  const Bk = P(bx + w, by, bz), Ck = P(bx + w, by + d, bz), Dk = P(bx, by + d, bz);
  const cok = (pts, renk2) => {
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.closePath();
    c.fillStyle = renk2;
    c.fill();
  };
  cok([B, Bk, Ck, C], ton(renk, 0.78));     /* sağ yüz */
  cok([D, Dk, Ck, C], ton(renk, 0.58));     /* sol yüz */
  cok([A, B, C, D], ton(renk, 1.0));        /* üst */
}

/* ---------- simge ---------- */
function ikonCiz(boy, yuvarlak) {
  const c = createCanvas(boy, boy);
  const x = c.getContext('2d');
  const s = boy / 100;   /* 100 birimlik tasarım ızgarası */

  /* zemin */
  const g = x.createLinearGradient(0, 0, boy, boy);
  g.addColorStop(0, '#1d4f8c');
  g.addColorStop(0.55, '#123a6b');
  g.addColorStop(1, '#0d1f3d');
  if (yuvarlak) {
    x.beginPath();
    x.arc(boy / 2, boy / 2, boy / 2, 0, Math.PI * 2);
    x.closePath();
  } else {
    yuvarlakYol(x, 0, 0, boy, boy, boy * 0.22);
  }
  x.fillStyle = g;
  x.fill();
  x.save();
  x.clip();

  /* arka ışık */
  const h = x.createRadialGradient(boy * 0.5, boy * 0.34, 0, boy * 0.5, boy * 0.34, boy * 0.6);
  h.addColorStop(0, 'rgba(120,190,255,.30)');
  h.addColorStop(1, 'rgba(120,190,255,0)');
  x.fillStyle = h;
  x.fillRect(0, 0, boy, boy);

  /* zemin platformu */
  const S = 26 * s, OX = boy * 0.5, OY = boy * 0.62;
  izoKutu(x, OX, OY, -1.15, -1.15, 0, 2.3, 2.3, 0.10, '#aab6c4', S);
  izoKutu(x, OX, OY, -1.05, -1.05, 0.10, 2.1, 2.1, 0.03, '#c2ccd8', S);

  /* pompa gövdesi */
  izoKutu(x, OX, OY, -0.42, -0.34, 0.13, 0.70, 0.62, 1.02, '#ef7a45', S);
  /* ön yüz ekranı */
  izoKutu(x, OX, OY, -0.34, -0.40, 0.70, 0.52, 0.06, 0.30, '#f4fbff', S);
  /* tabanca */
  izoKutu(x, OX, OY, 0.30, -0.10, 0.60, 0.11, 0.11, 0.14, '#4f5862', S);

  /* yan direkler (ekranda sol ve sağ köşeye düşer) */
  izoKutu(x, OX, OY, -1.02, 0.88, 0.13, 0.13, 0.13, 1.70, '#c6ced7', S);
  izoKutu(x, OX, OY, 0.88, -1.02, 0.13, 0.13, 0.13, 1.70, '#d6dde4', S);

  /* kanopi (en üst) */
  izoKutu(x, OX, OY, -1.14, -1.14, 1.80, 2.28, 2.28, 0.18, '#35a868', S);

  /* üst köşe parıltısı */
  const par = x.createLinearGradient(0, 0, boy * 0.8, boy * 0.8);
  par.addColorStop(0, 'rgba(255,255,255,.16)');
  par.addColorStop(0.45, 'rgba(255,255,255,0)');
  x.fillStyle = par;
  x.fillRect(0, 0, boy, boy);

  x.restore();
  return c;
}

/* ---------- öne çıkan grafik ---------- */
function oneCikan() {
  const W = 1024, H = 500;
  const c = createCanvas(W, H);
  const x = c.getContext('2d');

  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#15396b');
  g.addColorStop(0.5, '#0f2a52');
  g.addColorStop(1, '#0a1730');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  /* çim şeridi */
  x.fillStyle = '#3f7a46';
  x.beginPath();
  x.moveTo(0, H * 0.72);
  x.lineTo(W, H * 0.58);
  x.lineTo(W, H);
  x.lineTo(0, H);
  x.closePath();
  x.fill();

  /* yol */
  x.fillStyle = '#2f353d';
  x.beginPath();
  x.moveTo(0, H * 0.88);
  x.lineTo(W, H * 0.74);
  x.lineTo(W, H * 0.92);
  x.lineTo(0, H);
  x.closePath();
  x.fill();
  x.strokeStyle = '#e8c44a';
  x.lineWidth = 4;
  x.setLineDash([26, 20]);
  x.beginPath();
  x.moveTo(0, H * 0.935);
  x.lineTo(W, H * 0.80);
  x.stroke();
  x.setLineDash([]);

  /* istasyon */
  const ox = W * 0.74, oy = H * 0.60, s = 58;
  izoKutu(x, ox, oy, -2.2, -2.2, 0, 4.4, 4.4, 0.1, '#9aa3ad', s);
  izoKutu(x, ox, oy, -1.3, -1.1, 0.1, 0.8, 0.7, 0.9, '#e2683a', s);
  izoKutu(x, ox, oy, 0.1, -1.1, 0.1, 0.8, 0.7, 0.9, '#e2683a', s);
  izoKutu(x, ox, oy, -1.9, -1.8, 0.1, 0.16, 0.16, 1.7, '#cfd6dd', s);
  izoKutu(x, ox, oy, 1.3, -1.8, 0.1, 0.16, 0.16, 1.7, '#cfd6dd', s);
  izoKutu(x, ox, oy, -2.1, -2.0, 1.8, 3.6, 2.4, 0.2, '#2f9e5e', s);
  /* market (kanopinin solunda) */
  izoKutu(x, ox, oy, -2.0, 0.4, 0.1, 1.5, 1.2, 0.75, '#dde2e8', s);
  izoKutu(x, ox, oy, -2.1, 0.3, 0.85, 1.7, 1.4, 0.12, '#5a6675', s);

  /* yoldan geçen araçlar */
  const araba = (ax, ay, renk, buyuk) => {
    const bw = buyuk ? 1.5 : 0.95, bd = buyuk ? 0.5 : 0.42;
    izoKutu(x, ax, ay, 0, 0, 0, bw, bd, 0.30, renk, s * 1.5);
    izoKutu(x, ax, ay, buyuk ? 0.9 : 0.22, 0.05, 0.30, 0.5, bd - 0.10, 0.24,
      buyuk ? renk : '#cfe0ee', s * 1.5);
  };
  araba(W * 0.26, H * 0.885, '#2f8f5f', true);
  araba(W * 0.55, H * 0.93, '#d64545', false);

  /* yazı */
  x.fillStyle = '#ffffff';
  x.font = 'bold 78px sans-serif';
  x.fillText('AKARYAKIT', 56, H * 0.42);
  x.fillStyle = '#ffd166';
  x.font = 'bold 78px sans-serif';
  x.fillText('PATRONU', 56, H * 0.42 + 84);
  x.fillStyle = '#b9c9dd';
  x.font = '30px sans-serif';
  x.fillText('İstasyonunu kur · elinle doldur · zinciri büyüt', 58, H * 0.42 + 140);

  return c;
}

/* ---------- üret ---------- */
const boyutlar = [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]];
boyutlar.forEach(([ad, px]) => {
  const dizin = path.join(RES, 'mipmap-' + ad);
  if (!fs.existsSync(dizin)) fs.mkdirSync(dizin, { recursive: true });
  fs.writeFileSync(path.join(dizin, 'ic_launcher.png'), ikonCiz(px, false).toBuffer('image/png'));
  fs.writeFileSync(path.join(dizin, 'ic_launcher_round.png'), ikonCiz(px, true).toBuffer('image/png'));
});
fs.writeFileSync(path.join(MAG, 'ikon-512.png'), ikonCiz(512, false).toBuffer('image/png'));
fs.writeFileSync(path.join(MAG, 'one-cikan-1024x500.png'), oneCikan().toBuffer('image/png'));

console.log('✅ Görseller üretildi:');
console.log('   mipmap-* ic_launcher / ic_launcher_round');
console.log('   magaza/ikon-512.png');
console.log('   magaza/one-cikan-1024x500.png');
