/* Akaryakıt Patronu — elle dolum (ana oyun döngüsü) */
'use strict';

const SERVIS = {
  acik: false,
  m: null,
  pompaIdx: null,
  nozul: null,
  basili: false,
  mod: 'tam',
  sonFrame: 0,
  rafId: 0,
  bitti: false,

  /* ---- hangi nozullar bu pompada var ---- */
  nozullar: function (p, sb) {
    if (p.yakit === 'ev') return ['ev'];
    if (p.yakit === 'lpg') return ['lpg'];
    var r = [];
    ['benzin', 'dizel'].forEach(function (y) {
      if (sb.tank[y] && sb.tank[y].kap > 0) r.push(y);
    });
    if (!r.length) r = [p.yakit];
    return r;
  },

  ac: function (pompaIdx) {
    var sb = D.sube();
    var p = sb.yapi[pompaIdx];
    if (!p || p.t !== 'pompa') return;
    if (p.arizali) { UI.bildir('Pompa arızalı', 'Önce tamir ettir.', 'kotu'); return; }
    if (!p.mesgul) { UI.bildir('Pompada müşteri yok', 'Müşteri gelince pompa yeşil yanar.', 'uyari'); return; }
    var m = SIM.musteriBul(sb, p.mesgul);
    if (!m) { p.mesgul = null; return; }

    this.m = m;
    this.pompaIdx = pompaIdx;
    this.nozul = this.nozullar(p, sb).indexOf(m.yakit) >= 0 ? null : null;
    this.basili = false;
    this.mod = 'tam';
    this._uyardi = false;
    this.bitti = false;
    this.acik = true;
    m.durum = 'servis';

    document.getElementById('servis').classList.add('ac');
    this.ciz();
    this.dongu();
  },

  kapat: function () {
    this.acik = false;
    this.basili = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    document.getElementById('servis').classList.remove('ac');
    if (this.m && !this.bitti) {
      /* yarıda bırakıldı: müşteri pompada beklemeye döner */
      this.m.durum = 'pompada';
    }
    this.m = null; this.pompaIdx = null; this.nozul = null;
    UI.ciz();
  },

  /* ---- ekranı kur ---- */
  ciz: function () {
    var sb = D.sube();
    var p = sb.yapi[this.pompaIdx];
    var m = this.m;
    var arac = VERI.aracBul(m.arac);
    var noz = this.nozullar(p, sb);

    var h = '';
    h += '<div class="svUst">';
    h += '<div class="svArac"><span class="big">' + m.emoji + '</span><div><div style="font-weight:800">' + m.arac + '</div>';
    h += '<div class="mini">Pompa ' + (this.pompaIdx + 1) + ' · sv.' + p.sv + ' · tam ' + say(D.akis(p), 1) + ' / yavaş ' + say(D.yavasAkis(p), 2) + ' ' + VERI.yakitlar[p.yakit].birim + '/sn</div></div></div>';
    h += '<button class="kapat" onclick="SERVIS.kapat()">✕</button>';
    h += '</div>';

    h += '<div class="svIstek"><div class="a">MÜŞTERİ İSTİYOR</div>';
    h += '<div class="n">' + m.etiket + '</div>';
    h += '<div class="a">' + VERI.yakitlar[m.yakit].emoji + ' ' + VERI.yakitlar[m.yakit].ad +
         ' · hedef <b>' + say(m.hedef, 2) + ' ' + VERI.yakitlar[m.yakit].birim + '</b></div></div>';

    h += '<div class="nozullar" id="nozullar">';
    for (var i = 0; i < noz.length; i++) {
      var y = noz[i], yk = VERI.yakitlar[y];
      h += '<button class="noz" data-y="' + y + '" onclick="SERVIS.nozulSec(\'' + y + '\')">';
      h += '<div class="nad" style="color:' + yk.renk + '">' + yk.emoji + ' ' + yk.ad + '</div>';
      h += '<div class="nf">' + say(sb.fiyat[y], 2) + ' ₺/' + yk.birim + '</div></button>';
    }
    h += '</div>';

    h += '<div class="sayac">';
    h += '<div class="lt" id="svLitre">0,00</div>';
    h += '<div class="tl" id="svTutar">0 ₺</div>';
    h += '<div class="hedefCubuk" id="svCubuk"><i style="width:0%"></i><u style="left:100%"></u></div>';
    h += '<div class="bl" id="svBilgi">Nozulu seç, sonra butonu basılı tut</div>';
    h += '</div>';

    h += '<div class="tetikler">';
    h += '<div class="tetik kapali" id="svTetik">TAM AKIŞ<span class="th">basılı tut</span></div>';
    h += '<div class="tetik yavas kapali" id="svYavas">YAVAŞ<span class="th">hassas</span></div>';
    h += '</div>';
    h += '<div class="ara"><button class="btn ikincil" onclick="SERVIS.kapat()">Beklet</button>';
    h += '<button class="btn yesil" id="svBitir" onclick="SERVIS.bitir()">BİTİR &amp; ÖDET</button></div>';

    var el = document.getElementById('servis');
    el.innerHTML = h;

    var baglaTetik = function (elId, mod) {
      var t = document.getElementById(elId);
      if (!t) return;
      var bas = function (e) { e.preventDefault(); SERVIS.bas(true, mod); };
      var birak = function (e) { e.preventDefault(); SERVIS.bas(false, mod); };
      t.addEventListener('touchstart', bas, { passive: false });
      t.addEventListener('touchend', birak);
      t.addEventListener('touchcancel', birak);
      t.addEventListener('mousedown', bas);
      t.addEventListener('mouseup', birak);
      t.addEventListener('mouseleave', birak);
    };
    baglaTetik('svTetik', 'tam');
    baglaTetik('svYavas', 'yavas');

    /* müşterinin istediği nozul önceden seçili değil — bilerek, hata yapılabilsin */
    this.guncelle();
  },

  nozulSec: function (y) {
    if (this.bitti) return;
    if (this.m.verilen > 0.05 && this.nozul && this.nozul !== y) {
      UI.bildir('Nozul değiştirilemez', 'Dolum başladıktan sonra tabancayı değiştiremezsin.', 'kotu');
      return;
    }
    this.nozul = y;
    var hepsi = document.querySelectorAll('#nozullar .noz');
    for (var i = 0; i < hepsi.length; i++) {
      hepsi[i].classList.toggle('secili', hepsi[i].getAttribute('data-y') === y);
    }
    var t = document.getElementById('svTetik');
    var v = document.getElementById('svYavas');
    if (t) t.classList.remove('kapali');
    if (v) v.classList.remove('kapali');
    this.guncelle();
  },

  bas: function (durum, mod) {
    if (this.bitti || !this.acik) return;
    if (!this.nozul) {
      if (durum) UI.bildir('Nozul seçilmedi', 'Önce hangi yakıtı vereceğini seç.', 'uyari');
      return;
    }
    if (!durum && mod && mod !== this.mod) return;   /* başka tetiğin bırakılması akışı kesmesin */
    this.basili = durum;
    if (durum && mod) this.mod = mod;
    var t = document.getElementById('svTetik');
    var v = document.getElementById('svYavas');
    if (t) t.classList.toggle('basili', durum && this.mod === 'tam');
    if (v) v.classList.toggle('basili', durum && this.mod === 'yavas');
    if (durum) this.sonFrame = performance.now();
  },

  /* ---- akış döngüsü (gerçek zaman) ---- */
  dongu: function () {
    var self = this;
    function kare(zaman) {
      if (!self.acik) return;
      if (self.basili && !self.bitti) {
        var dt = (zaman - self.sonFrame) / 1000;
        self.sonFrame = zaman;
        if (dt > 0.25) dt = 0.25;
        self.akit(dt);
      } else {
        self.sonFrame = zaman;
      }
      self.rafId = requestAnimationFrame(kare);
    }
    this.rafId = requestAnimationFrame(kare);
  },

  akit: function (dt) {
    if (!this.acik || this.bitti || !this.m || !this.nozul) return;
    var sb = D.sube();
    var p = this.pompaIdx === null ? null : sb.yapi[this.pompaIdx];
    if (!p || p.t !== 'pompa') { this.kapat(); return; }
    var y = this.nozul;
    var temelHiz = this.mod === 'yavas' ? D.yavasAkis(p) : D.akis(p);
    var hiz = temelHiz * (y === p.yakit ? 1 : 0.70);

    var miktar = hiz * dt;
    if (y !== 'ev') {
      if (sb.tank[y].dolu <= 0.01) {
        this.basili = false;
        var t = document.getElementById('svTetik');
        var v2 = document.getElementById('svYavas');
        if (t) t.classList.remove('basili');
        if (v2) v2.classList.remove('basili');
        UI.bildir('Tank boş!', VERI.yakitlar[y].ad + ' bitti. Sipariş vermen gerek.', 'kotu');
        this.guncelle();
        return;
      }
      miktar = Math.min(miktar, sb.tank[y].dolu);
      sb.tank[y].dolu -= miktar;
    }
    this.m.verilen += miktar;
    /* titreşim geri bildirimi: hedefi geçerken */
    if (this.m.verilen > this.m.hedef && !this._uyardi) {
      this._uyardi = true;
      try { if (window.AndroidKabuk) AndroidKabuk.titret(45); } catch (e) {}
    }
    this.guncelle();
  },

  guncelle: function () {
    if (!this.m) return;
    var sb = D.sube();
    var m = this.m;
    var y = this.nozul || m.yakit;
    var litreEl = document.getElementById('svLitre');
    var tutarEl = document.getElementById('svTutar');
    var cubuk = document.getElementById('svCubuk');
    var bilgi = document.getElementById('svBilgi');
    if (!litreEl) return;

    litreEl.textContent = say(m.verilen, 2);
    tutarEl.textContent = say(m.verilen * sb.fiyat[y], 2) + ' ₺';

    var oran = m.hedef > 0 ? (m.verilen / m.hedef) : 0;
    var dolu = cubuk.querySelector('i');
    dolu.style.width = kisitla(oran * 100, 0, 100) + '%';
    cubuk.classList.toggle('tasti', oran > 1.002);

    var fark = m.verilen - m.hedef;
    var renk = 'var(--yesil)';
    if (fark > 0.08) renk = 'var(--kirmizi)';
    else if (Math.abs(fark) <= 0.15) renk = 'var(--sari)';
    litreEl.style.color = renk;

    var yanlis = this.nozul && this.nozul !== m.yakit;
    if (yanlis) {
      bilgi.innerHTML = '<span class="kirmiziY">⚠ Yanlış tabanca! Müşteri ' + VERI.yakitlar[m.yakit].ad + ' istedi.</span>';
    } else if (y !== 'ev' && sb.tank[y].dolu <= 0.01) {
      bilgi.innerHTML = '<span class="kirmiziY">Tank boş</span>';
    } else if (fark > 0.08) {
      bilgi.innerHTML = '<span class="kirmiziY">Taştı: ' + say(fark, 2) + ' ' + VERI.yakitlar[y].birim + ' döküldü</span>';
    } else {
      var kalan = Math.max(0, -fark);
      var p2 = sb.yapi[this.pompaIdx];
      var ipucu = (p2 && kalan > 0 && kalan < D.akis(p2) * 0.35) ? ' · <span class="sariY">yavaşa geç</span>' : '';
      bilgi.innerHTML = 'Hedefe kalan: <b>' + say(kalan, 2) + ' ' + VERI.yakitlar[y].birim + '</b>' + ipucu +
        (y !== 'ev' ? ' · tank ' + say(sb.tank[y].dolu, 0) + ' L' : '');
    }
  },

  bitir: function () {
    if (this.bitti || !this.m) return;
    var sb = D.sube();
    var m = this.m;
    if (m.verilen < 0.01) { UI.bildir('Hiç yakıt vermedin', 'Butonu basılı tutarak doldur.', 'uyari'); return; }
    this.basili = false;
    this.bitti = true;
    var yanlis = !!(this.nozul && this.nozul !== m.yakit && m.verilen > 0.5);
    var hedef = m.hedef, verilen = m.verilen;
    var sonuc = SIM.satisTamamla(sb, m, true, yanlis);
    this.sonucEkrani(sonuc, m, hedef, verilen);
  },

  sonucEkrani: function (r, m, hedef, verilen) {
    var bas, renk, alt = '';
    if (r.tip === 'yanlis') {
      bas = '❌ Yanlış Yakıt'; renk = 'var(--kirmizi)';
      alt = 'Müşteri aracına ' + VERI.yakitlar[m.yakit].ad + ' istedi.<br>' +
            say(verilen, 2) + ' ' + VERI.yakitlar[this.nozul].birim + ' zarar: <b class="kirmiziY">-' + tl(r.kayip) + '</b><br>Müşteri sinirli ayrıldı, marka puanı düştü.';
    } else {
      if (r.isabet === 'tam') { bas = '🎯 Tam İsabet!'; renk = 'var(--sari)'; }
      else if (r.isabet === 'iyi') { bas = '👍 İyi Dolum'; renk = 'var(--yesil)'; }
      else if (r.isabet === 'tasma') { bas = '💧 Taştı'; renk = 'var(--kirmizi)'; }
      else { bas = '🙂 Satış Tamam'; renk = 'var(--mavi)'; }
      alt += 'Hedef ' + say(hedef, 2) + ' · verilen ' + say(verilen, 2) + ' (' + (r.fark >= 0 ? '+' : '') + say(r.fark, 2) + ')<br>';
      alt += 'Satış: <b>' + tl(r.ciro) + '</b>';
      if (r.bahsis > 0.5) alt += ' · Bahşiş: <b class="sariY">+' + tl(r.bahsis) + '</b>';
      if (r.dokulen > 0.05) alt += '<br>Dökülen: <b class="kirmiziY">' + say(r.dokulen, 2) + ' L</b>';
      if (r.ekGelir > 0.5) alt += '<br>Market/tesis: <b class="yesilY">+' + tl(r.ekGelir) + '</b>';
      alt += '<br>Net kâr: <b class="yesilY">' + tl(r.kar) + '</b> · +' + r.xp + ' XP';
    }

    var sb = D.sube();
    var sonraki = null;
    for (var i = 0; i < sb.kuyruk.length; i++) {
      if (sb.kuyruk[i].pompa !== null && sb.kuyruk[i].durum === 'pompada') { sonraki = sb.kuyruk[i]; break; }
    }

    var h = '<div class="svUst"><div style="font-weight:800">Sonuç</div><button class="kapat" onclick="SERVIS.kapat()">✕</button></div>';
    h += '<div class="svSonuc"><div class="bas" style="color:' + renk + '">' + bas + '</div><div class="det">' + alt + '</div></div>';
    h += '<div style="flex:1"></div>';
    if (sonraki) {
      h += '<button class="btn genis" onclick="SERVIS.sonrakine(' + sonraki.pompa + ')">SIRADAKİ MÜŞTERİ ' + sonraki.emoji + '</button>';
      h += '<div style="height:8px"></div>';
    }
    h += '<button class="btn ikincil genis" onclick="SERVIS.kapat()">İstasyona dön</button>';
    document.getElementById('servis').innerHTML = h;

    D.kaydet();
    try { if (window.AndroidKabuk) AndroidKabuk.titret(r.isabet === 'tam' ? 90 : 25); } catch (e) {}
  },

  sonrakine: function (pompaIdx) {
    this.bitti = false;
    this.mod = 'tam';
    this.m = null;
    this._uyardi = false;
    this.ac(pompaIdx);
  }
};
