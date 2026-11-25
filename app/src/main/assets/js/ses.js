/* Akaryakıt Patronu — ses motoru
   Dosya yok; tüm efektler WebAudio ile anında üretilir. */
'use strict';

const SES = {
  ctx: null,
  ana: null,
  acik: true,
  hazir: false,
  _dolum: null,

  kur: function () {
    if (this.hazir) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.hazir = false; return false; }
    try {
      this.ctx = new AC();
      this.ana = this.ctx.createGain();
      this.ana.gain.value = 0.5;
      this.ana.connect(this.ctx.destination);
      this.hazir = true;
    } catch (e) { this.hazir = false; }
    return this.hazir;
  },

  /* ilk dokunuşta tarayıcı kilidini aç */
  uyandir: function () {
    if (!this.kur()) return;
    if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) {} }
  },

  ayar: function (acik) {
    this.acik = !!acik;
    if (!this.acik) this.dolumDur();
    if (this.ana) this.ana.gain.value = this.acik ? 0.5 : 0;
  },

  /* temel ton */
  ton: function (frk, sure, tip, ses, kayma) {
    if (!this.acik || !this.kur()) return;
    var c = this.ctx, t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = tip || 'sine';
    o.frequency.setValueAtTime(frk, t);
    if (kayma) o.frequency.exponentialRampToValueAtTime(Math.max(40, kayma), t + sure);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(ses || 0.18, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g); g.connect(this.ana);
    o.start(t); o.stop(t + sure + 0.02);
  },

  gurultu: function (sure, ses, frk) {
    if (!this.acik || !this.kur()) return;
    var c = this.ctx, t = c.currentTime;
    var n = Math.floor(c.sampleRate * sure);
    var tampon = c.createBuffer(1, n, c.sampleRate);
    var d = tampon.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var kaynak = c.createBufferSource();
    kaynak.buffer = tampon;
    var f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = frk || 900;
    var g = c.createGain();
    g.gain.value = ses || 0.12;
    kaynak.connect(f); f.connect(g); g.connect(this.ana);
    kaynak.start(t);
  },

  cal: function (ad) {
    if (!this.acik) return;
    switch (ad) {
      case 'bip':     this.ton(880, 0.07, 'square', 0.08); break;
      case 'buton':   this.ton(420, 0.06, 'triangle', 0.09); break;
      case 'kasa':    this.ton(1180, 0.08, 'square', 0.10);
                      var self = this; setTimeout(function () { self.ton(1560, 0.13, 'square', 0.09); }, 70); break;
      case 'basari':  this.akor([660, 880, 1320], 0.42); break;
      case 'hata':    this.ton(190, 0.22, 'sawtooth', 0.12, 90); break;
      case 'uyari':   this.ton(520, 0.1, 'triangle', 0.1);
                      var s2 = this; setTimeout(function () { s2.ton(400, 0.14, 'triangle', 0.09); }, 110); break;
      case 'arac':    this.gurultu(0.5, 0.05, 300); break;
      case 'para':    this.akor([520, 780], 0.25); break;
      case 'tik':     this.ton(300, 0.04, 'square', 0.06); break;
      default: break;
    }
  },

  akor: function (frekanslar, sure) {
    for (var i = 0; i < frekanslar.length; i++) {
      (function (self, f, gecikme) {
        setTimeout(function () { self.ton(f, sure, 'triangle', 0.1); }, gecikme);
      })(this, frekanslar[i], i * 65);
    }
  },

  /* yakıt akışı: sürekli döngü */
  dolumBasla: function () {
    if (!this.acik || !this.kur() || this._dolum) return;
    var c = this.ctx;
    var n = Math.floor(c.sampleRate * 1.0);
    var tampon = c.createBuffer(1, n, c.sampleRate);
    var d = tampon.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
    var kaynak = c.createBufferSource();
    kaynak.buffer = tampon;
    kaynak.loop = true;
    var f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 1.3;
    var g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.055, c.currentTime + 0.12);
    kaynak.connect(f); f.connect(g); g.connect(this.ana);
    kaynak.start();
    this._dolum = { kaynak: kaynak, gain: g };
  },

  dolumDur: function () {
    if (!this._dolum) return;
    var d = this._dolum;
    this._dolum = null;
    try {
      d.gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
      setTimeout(function () { try { d.kaynak.stop(); } catch (e) {} }, 140);
    } catch (e) { try { d.kaynak.stop(); } catch (e2) {} }
  }
};

/* const ile tanımlanan nesne window üzerinde görünmez; window.SES denetimleri için bağla */
if (typeof window !== 'undefined') window.SES = SES;
