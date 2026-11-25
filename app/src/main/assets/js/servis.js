/* Akaryakıt Patronu — elle dolum (ana oyun döngüsü) */
'use strict';

const SERVIS = {
  acik: false,
  m: null,
  pompaIdx: null,
  nozul: null,
  basili: false,
  mod: 'tam',
  onAyar: 0,        /* 0 = kapalı, >0 = bu miktarda otomatik duracak */
  onAyarliSatis: false,
  sonFrame: 0,
  rafId: 0,
  bitti: false,

  /* ---- hangi nozullar bu pompada var ---- */
  nozullar: function (p, sb) {
    if (p.yakit === 'ev') return ['ev'];
    var r = [];
    ['benzin', 'dizel', 'lpg'].forEach(function (y) {
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
    this.nozul = null;   /* bilerek boş: doğru tabancayı oyuncu seçer */
    this.basili = false;
    this.mod = 'tam';
    this.onAyar = 0;
    this.onAyarliSatis = false;
    this._uyardi = false;
    this._lpgOnayli = false;
    this._ekTeklif = null;
    this.bitti = false;
    this.acik = true;
    if (window.SES) SES.uyandir();
    m.durum = 'servis';

    document.getElementById('servis').classList.add('ac');
    this.ciz();
    this.dongu();
  },

  kapat: function () {
    if (window.SES) SES.dolumDur();
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

    var ayar = (D.s.ayar && D.s.ayar.dolum) || 'ikisi';
    if (ayar === 'onayar' || ayar === 'ikisi') {
      h += '<div class="onAyar tik">';
      h += '<div class="oaBas">Ön ayar<span class="mini"> · gireceğin miktarda kendiliğinden durur, bahşiş yarı</span></div>';
      h += '<div class="oaSatir">';
      h += '<input type="number" id="oaMiktar" inputmode="decimal" step="0.01" min="0" value="' + m.hedef.toFixed(2) + '">';
      h += '<span class="oaBirim">' + VERI.yakitlar[m.yakit].birim + '</span>';
      h += '<button class="btn kucuk" onclick="SERVIS.onAyarBasla()">BAŞLAT</button>';
      h += '</div>';
      h += '<div class="btngrup" style="margin-top:6px">';
      h += '<button class="btn minik ikincil" onclick="SERVIS.oaDoldur(' + m.hedef.toFixed(2) + ')">İstenen (' + say(m.hedef, 2) + ')</button>';
      [100, 250, 500].forEach(function (tut) {
        var lt = tut / sb.fiyat[m.yakit];
        h += '<button class="btn minik ikincil" onclick="SERVIS.oaDoldur(' + lt.toFixed(2) + ')">' + tut + ' ₺</button>';
      });
      h += '</div></div>';
    }
    if (ayar === 'onayar') {
      h += '<div class="tetikler" style="min-height:0;display:none">';
    } else {
      h += '<div class="tetikler">';
    }
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
    /* LPG: güvenlik adımları */
    if (y === 'lpg' && window.MINI && D.s.ayar && D.s.ayar.lpgGuvenlik !== false && !this._lpgOnayli) {
      var self = this;
      MINI.lpgOnay(function (tamam) {
        if (tamam === null) return;             /* vazgeçti */
        self._lpgOnayli = true;
        self.nozulSec('lpg');
      });
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

  oaDoldur: function (v) {
    var el = document.getElementById('oaMiktar');
    if (el) el.value = (+v).toFixed(2);
  },

  onAyarBasla: function () {
    if (this.bitti || !this.acik) return;
    if (!this.nozul) { UI.bildir('Nozul seçilmedi', 'Önce hangi yakıtı vereceğini seç.', 'uyari'); return; }
    var el = document.getElementById('oaMiktar');
    var v = el ? parseFloat(String(el.value).replace(',', '.')) : 0;
    if (!isFinite(v) || v <= 0) { UI.bildir('Miktar girilmedi', 'Kaç ' + VERI.yakitlar[this.m.yakit].birim + ' dolduracağını yaz.', 'uyari'); return; }
    if (v <= this.m.verilen + 0.001) { UI.bildir('Zaten doldu', 'Girilen miktar sayaçtan düşük.', 'uyari'); return; }
    this.onAyar = v;
    this.onAyarliSatis = true;
    this.mod = 'tam';
    this.basili = true;
    this.sonFrame = performance.now();
    if (window.SES) SES.dolumBasla();
    var t = document.getElementById('svTetik');
    if (t) t.classList.add('basili');
    UI.bildir('Ön ayar', say(v, 2) + ' ' + VERI.yakitlar[this.m.yakit].birim + ' dolduruluyor…', 'iyi');
  },

  onAyarDur: function () {
    this.onAyar = 0;
    this.basili = false;
    if (window.SES) SES.dolumDur();
    var t = document.getElementById('svTetik');
    var v = document.getElementById('svYavas');
    if (t) t.classList.remove('basili');
    if (v) v.classList.remove('basili');
  },

  bas: function (durum, mod) {
    if (durum && this.onAyar) this.onAyar = 0;   /* elle müdahale ön ayarı iptal eder */
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
    if (window.SES) { if (durum) SES.dolumBasla(); else SES.dolumDur(); }
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
    if (this.onAyar > 0) {
      var kalanOa = this.onAyar - this.m.verilen;
      if (kalanOa <= 0) { this.onAyarDur(); this.guncelle(); return; }
      if (miktar > kalanOa) miktar = kalanOa;
    }
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
    if (this.onAyar > 0 && this.m.verilen >= this.onAyar - 0.0005) {
      this.onAyarDur();
      try { if (window.AndroidKabuk) AndroidKabuk.titret(35); } catch (e) {}
      UI.bildir('Ön ayar tamam', say(this.m.verilen, 2) + ' ' + VERI.yakitlar[y].birim + ' verildi. BİTİR\'e bas.', 'iyi');
    }
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
    var sonuc = SIM.satisTamamla(sb, m, true, yanlis, this.onAyarliSatis);
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
      if (r.kacak) { bas = '🏃 Ödemeden Kaçtı'; renk = 'var(--kirmizi)'; }
      alt += 'Hedef ' + say(hedef, 2) + ' · verilen ' + say(verilen, 2) + ' (' + (r.fark >= 0 ? '+' : '') + say(r.fark, 2) + ')<br>';
      if (r.premium) alt += '<span class="sariY">✨ Katkılı ürün satıldı</span><br>';
      if (r.kartli) alt += '<span class="mini">💳 Sadakat kartlı müşteri</span><br>';
      alt += 'Satış: <b>' + tl(r.ciro) + '</b>';
      if (r.bahsis > 0.5) alt += ' · Bahşiş: <b class="sariY">+' + tl(r.bahsis) + '</b>' + (this.onAyarliSatis ? ' <span class="mini">(ön ayar: yarı bahşiş)</span>' : '');
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
    /* ek hizmet teklifi (yıkama / yağ) */
    var ek = (window.MINI && r.tip !== 'yanlis') ? MINI.teklif(sb, m) : null;
    if (ek) {
      this._ekTeklif = { tur: ek, m: m };
      h += '<button class="btn genis" style="background:linear-gradient(180deg,#3b8fd0,#2f6fa8)" onclick="SERVIS.ekHizmet()">' +
           (ek === 'yikama' ? '🧼 Müşteri yıkama istiyor — başlat' : '🔧 Müşteri yağ değişimi istiyor — başlat') + '</button>';
      h += '<div style="height:8px"></div>';
    }
    if (sonraki) {
      h += '<button class="btn genis" onclick="SERVIS.sonrakine(' + sonraki.pompa + ')">SIRADAKİ MÜŞTERİ ' + sonraki.emoji + '</button>';
      h += '<div style="height:8px"></div>';
    }
    h += '<button class="btn ikincil genis" onclick="SERVIS.kapat()">İstasyona dön</button>';
    document.getElementById('servis').innerHTML = h;

    D.kaydet();
    if (window.SES) {
      SES.dolumDur();
      SES.cal(r.tip === 'yanlis' ? 'hata' : (r.isabet === 'tam' ? 'basari' : 'kasa'));
    }
    try { if (window.AndroidKabuk) AndroidKabuk.titret(r.isabet === 'tam' ? 90 : 25); } catch (e) {}
  },

  ekHizmet: function () {
    var t = this._ekTeklif;
    if (!t || !window.MINI) return;
    this._ekTeklif = null;
    if (t.tur === 'yikama') MINI.yikamaBaslat(t.m, null);
    else MINI.yagBaslat(t.m, null);
  },

  sonrakine: function (pompaIdx) {
    this.bitti = false;
    this._lpgOnayli = false;
    this._ekTeklif = null;
    this.mod = 'tam';
    this.onAyar = 0;
    this.onAyarliSatis = false;
    this.m = null;
    this._uyardi = false;
    this.ac(pompaIdx);
  }
};

/* const ile tanımlanan nesne window üzerinde görünmez; window.SERVIS denetimleri için bağla */
if (typeof window !== 'undefined') window.SERVIS = SERVIS;
