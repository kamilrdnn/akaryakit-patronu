/* Akaryakıt Patronu — arayüz (izometrik sahne + paneller) */
'use strict';

const UI = {
  sekme: 'istasyon',
  modalAcik: false,
  adaylar: null,
  bildirimGecmisi: [],
  okunmamis: 0,

  sekmeler: [
    { id: 'istasyon', ad: 'İstasyon', ik: '⛽' },
    { id: 'insa',     ad: 'İnşaat',   ik: '🏗️' },
    { id: 'market',   ad: 'Market',   ik: '🛒' },
    { id: 'siparis',  ad: 'Sipariş',  ik: '🚚' },
    { id: 'personel', ad: 'Personel', ik: '🧑‍🔧' },
    { id: 'fiyat',    ad: 'Fiyat',    ik: '🏷️' },
    { id: 'subeler',  ad: 'Şubeler',  ik: '🗺️' },
    { id: 'banka',    ad: 'Banka',    ik: '🏦' },
    { id: 'daha',     ad: 'Yönetim',  ik: '⚙️' }
  ],

  /* yelpaze menüdeki yerleşim: [sekme, yarıçap, açı] */
  fabDuzen: [
    ['insa', 112, 90], ['market', 112, 62], ['siparis', 112, 34], ['personel', 112, 6],
    ['fiyat', 198, 90], ['subeler', 198, 62], ['banka', 198, 34], ['daha', 198, 6]
  ],
  fabAcik: false,

  /* =========================================================
     KURULUM
     ========================================================= */
  kur: function () {
    this.fabCiz();
    try { IZO.kur(); } catch (e) { /* tuval yoksa oyun yine çalışır */ }
    this.sekmeGec('istasyon');
  },

  /* ---------- yelpaze menü ---------- */
  fabCiz: function () {
    var kap = document.getElementById('fab');
    if (!kap) return;
    var h = '<div class="perde" onclick="UI.fabKapat()"></div>';
    for (var i = 0; i < this.fabDuzen.length; i++) {
      var d = this.fabDuzen[i], sk = null;
      for (var j = 0; j < this.sekmeler.length; j++) if (this.sekmeler[j].id === d[0]) sk = this.sekmeler[j];
      if (!sk) continue;
      var r = d[1], aci = d[2] * Math.PI / 180;
      var x = Math.cos(aci) * r, y = Math.sin(aci) * r;
      h += '<button class="fabOge" id="fo_' + sk.id + '" style="transition-delay:' + (i * 22) + 'ms" ' +
           'data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1) + '" ' +
           'onclick="UI.fabSec(\'' + sk.id + '\')">' +
           '<span class="yuvar">' + sk.ik + '</span><span class="yzi">' + sk.ad + '</span></button>';
    }
    h += '<button class="fabAna" onclick="UI.fabAc()"><span class="kareler"><i></i><i></i><i></i><i></i></span></button>';
    kap.innerHTML = h;
    this.fabKonumla();
  },

  fabKonumla: function () {
    var kap = document.getElementById('fab');
    if (!kap) return;
    var ogeler = kap.querySelectorAll('.fabOge');
    for (var i = 0; i < ogeler.length; i++) {
      var e = ogeler[i];
      if (this.fabAcik) {
        e.style.transform = 'translate(' + e.getAttribute('data-x') + 'px,' + (-e.getAttribute('data-y')) + 'px) scale(1)';
      } else {
        e.style.transform = 'translate(0,0) scale(.5)';
      }
    }
  },

  fabAc: function () {
    this.fabAcik = !this.fabAcik;
    var kap = document.getElementById('fab');
    if (kap) kap.classList.toggle('ac', this.fabAcik);
    this.fabKonumla();
    if (this.sekme === 'istasyon') this.ciz();
  },
  fabKapat: function () {
    if (!this.fabAcik) return;
    this.fabAcik = false;
    var kap = document.getElementById('fab');
    if (kap) kap.classList.remove('ac');
    this.fabKonumla();
    if (this.sekme === 'istasyon') this.ciz();
  },
  fabSec: function (id) {
    this.fabKapat();
    this.sekmeGec(id);
  },

  sekmeGec: function (id) {
    this.sekme = id;
    this.fabKapat();
    if (id === 'daha') this.okunmamis = 0;
    var g = document.getElementById('govde');
    if (g) g.scrollTop = 0;
    this.ciz();
    if (id === 'istasyon') { try { IZO.boyutla(); } catch (e) {} }
  },

  /* =========================================================
     ÇİZİM
     ========================================================= */
  ciz: function () {
    if (!D.s) return;
    this.ustCiz();
    var hud = document.getElementById('hud');
    var govde = document.getElementById('govde');
    if (!hud || !govde) return;

    if (this.sekme === 'istasyon') {
      hud.classList.add('ac');
      govde.classList.remove('ac');
      hud.innerHTML = this.hudHtml();
    } else {
      hud.classList.remove('ac');
      govde.classList.add('ac');
      govde.innerHTML = this.panelHtml();
    }
  },

  /* canlı yenileme: kaydırma konumu korunur */
  tikCiz: function () {
    if (!D.s) return;
    this.ustCiz();
    if (this.modalAcik || SERVIS.acik) return;
    if (this.sekme === 'istasyon') {
      var hud = document.getElementById('hud');
      if (hud) hud.innerHTML = this.hudHtml();
      return;
    }
    if (this.sekme !== 'siparis') return;
    var govde = document.getElementById('govde');
    if (!govde) return;
    var kay = govde.scrollTop;
    govde.innerHTML = this.panelHtml();
    govde.scrollTop = kay;
  },

  panelHtml: function () {
    var bas = '', ic = '';
    switch (this.sekme) {
      case 'insa':     bas = '🏗️ İnşaat';          ic = this.insaHtml(); break;
      case 'market':   bas = '🛒 Market';          ic = this.marketHtml(); break;
      case 'banka':    bas = '🏦 Banka & Finans';  ic = this.bankaHtml(); break;
      case 'fiyat':    bas = '🏷️ Fiyatlar';        ic = this.fiyatHtml(); break;
      case 'siparis':  bas = '🚚 Sipariş';         ic = this.siparisHtml(); break;
      case 'personel': bas = '🧑‍🔧 Personel';      ic = this.personelHtml(); break;
      case 'subeler':  bas = '🗺️ Şubeler';         ic = this.subelerHtml(); break;
      case 'daha':     bas = '☰ Yönetim';          ic = this.dahaHtml(); break;
      default: return '';
    }
    return '<div class="panelBas"><button class="geri" onclick="UI.sekmeGec(\'istasyon\')">‹</button><h2>' + bas + '</h2></div>' + ic;
  },

  ustCiz: function () {
    var s = D.s, sb = D.sube(), lok = D.lok(sb), sz = D.sezon();
    var gece = s.saat < 6 || s.saat >= 20;
    var yildiz = D.yildiz();
    var xpAlt = D.oncekiXp(), xpUst = D.sonrakiXp();
    var xpOran = kisitla((s.xp - xpAlt) / Math.max(1, xpUst - xpAlt) * 100, 0, 100);

    var h = '<div class="ustsatir">';
    h += '<div class="para">' + tl(s.para) + '</div>';
    h += '<div style="flex:1"></div>';
    h += '<div class="rozet saat ' + (gece ? 'gece' : '') + '">' + (gece ? '🌙' : '☀️') + ' <b>' + ikiHane(s.saat) + ':' + ikiHane(s.dk) + '</b></div>';
    h += '<div class="rozet">Gün <b>' + s.gun + '</b></div>';
    h += '<button id="hizBtn" onclick="UI.hizDegis()">' + s.hiz + '×</button>';
    h += '</div>';

    h += '<div class="ustsatir ikinci">';
    h += '<div class="rozet">' + lok.emoji + ' <b>' + sb.ad + '</b></div>';
    h += '<div class="rozet">Sv <b>' + s.seviye + '</b></div>';
    h += '<div class="rozet"><span class="yildiz">' + '★'.repeat(yildiz) + '☆'.repeat(5 - yildiz) + '</span></div>';
    h += '<div class="rozet">' + sz.emoji + ' ' + sz.ad + '</div>';
    h += '<div class="rozet">😊 <b>' + Math.round(sb.memnuniyet) + '</b></div>';
    h += '<div class="rozet" onclick="UI.sekmeGec(\'banka\')">Net <b>' + tl(SIM.netDeger()) + '</b></div>';
    for (var i = 0; i < s.olaylar.length; i++) {
      var ov = null;
      for (var j = 0; j < VERI.olaylar.length; j++) if (VERI.olaylar[j].id === s.olaylar[i].id) ov = VERI.olaylar[j];
      if (ov) h += '<div class="rozet">' + ov.emoji + ' <b>' + ov.ad + '</b> ' + s.olaylar[i].kalan + 'dk</div>';
    }
    h += '</div>';
    h += '<div class="cubuk ince" style="margin-top:6px"><i style="width:' + xpOran + '%;background:var(--mor)"></i></div>';

    document.getElementById('ust').innerHTML = h;
  },

  hizDegis: function () {
    var sira = [1, 2, 3];
    D.s.hiz = sira[(sira.indexOf(D.s.hiz) + 1) % sira.length];
    this.ustCiz();
  },

  /* =========================================================
     HUD — izometrik sahnenin üstü
     ========================================================= */
  hudHtml: function () {
    var sb = D.sube(), s = D.s;
    var h = '';

    /* ---- üst: yakıt göstergeleri ---- */
    h += '<div class="hudUst">';
    h += '<div class="yakitKart tik">';
    ['benzin', 'dizel', 'lpg'].forEach(function (y) {
      var kap = D.tankKap(sb, y);
      sb.tank[y].kap = kap;
      var o = kap > 0 ? (sb.tank[y].dolu / kap) * 100 : 0;
      var renk = o < 15 ? 'var(--kirmizi)' : o < 35 ? 'var(--sari)' : 'var(--yesil)';
      var yolda = false;
      for (var i = 0; i < sb.siparis.length; i++) if (sb.siparis[i].yakit === y) yolda = true;
      h += '<div class="yk' + (o > 92 ? ' dolu' : '') + '">';
      h += '<span class="ad">' + VERI.yakitlar[y].kisa + '</span>';
      h += '<span class="cb"><i style="width:' + o + '%;background:' + renk + '"></i></span>';
      h += '<button class="sip" onclick="UI.hizliSiparis(\'' + y + '\')">' + (yolda ? '🚚' : '⟳') + '</button>';
      h += '</div>';
    });
    h += '</div>';

    /* ---- kampanya + sıradaki lokasyon ---- */
    h += '<div class="hudSatir" style="align-items:flex-start">';
    h += this.kampanyaHtml();
    h += '<div class="hudBosluk"></div>';
    h += this.sonrakiHtml();
    h += '</div>';
    h += '</div>';

    /* ---- kamera butonları ---- */
    h += '<div class="kamBtnler">';
    h += '<button class="kamBtn tik" onclick="IZO.yakinlas(1.2)">+</button>';
    h += '<button class="kamBtn tik" onclick="IZO.yakinlas(0.84)">−</button>';
    h += '<button class="kamBtn tik" onclick="IZO.ortala()">⊙</button>';
    h += '</div>';

    /* ---- alt: bekleyen müşteri ---- */
    h += '<div class="hudAlt"' + (this.fabAcik ? ' style="display:none"' : '') + '>';
    var bekleyen = null, bekSayi = 0;
    for (var k = 0; k < sb.kuyruk.length; k++) {
      if (sb.kuyruk[k].durum === 'pompada') { bekSayi++; if (!bekleyen) bekleyen = sb.kuyruk[k]; }
    }
    if (sb.devredildi) {
      h += '<div class="yakitKart tik" style="justify-content:center">Bu şube devredildi — Şubeler\'den başka şubeye geç.</div>';
    } else if (bekleyen) {
      h += '<button class="doldurBtn tik" onclick="SERVIS.ac(' + bekleyen.pompa + ')">';
      h += bekleyen.emoji + ' POMPA ' + (bekleyen.pompa + 1) + ' · ' + bekleyen.etiket;
      h += (bekSayi > 1 ? ' <span class="etiket uyari">+' + (bekSayi - 1) + '</span>' : '');
      h += '</button>';
    } else if (!D.pompalar(sb).length) {
      h += '<button class="doldurBtn tik" onclick="UI.sekmeGec(\'insa\')">🏗️ POMPA KUR</button>';
    }
    h += '</div>';

    return h;
  },

  kampanyaHtml: function () {
    var k = SIM.kampanya();
    if (!k) return '<div></div>';
    var kalan = 30 - ((D.s.gun - 1) % 30);
    var oran = Math.min(100, (k.sayac / k.tanim.hedef) * 100);
    var h = '<div class="kampanya tik" onclick="UI.kampanyaBilgi()">';
    h += '<div class="halka" style="background:conic-gradient(var(--mavi) ' + (oran * 3.6) + 'deg, #d8e0e8 0deg)">';
    h += '<span style="background:#eef4fa;border-radius:50%;width:30px;height:30px;display:grid;place-items:center">' + k.sayac + '/' + k.tanim.hedef + '</span></div>';
    h += '<div><div class="kad">' + k.tanim.emoji + ' ' + k.tanim.ad + '</div>';
    h += '<div class="kalt">' + (k.bitti ? 'Tamamlandı ✓' : kalan + ' gün kaldı') + '</div></div>';
    h += '</div>';
    return h;
  },

  sonrakiHtml: function () {
    var s = D.s;
    var hedef = null;
    for (var i = 0; i < VERI.lokasyonlar.length; i++) {
      var l = VERI.lokasyonlar[i], varMi = false;
      for (var j = 0; j < s.subeler.length; j++) if (s.subeler[j].lok === l.id) varMi = true;
      if (!varMi) { hedef = l; break; }
    }
    if (!hedef) {
      if (!s.rafineri.aktif) {
        var o2 = Math.min(100, (s.para / VERI.rafineri.fiyat) * 100);
        return '<div class="sonraki tik" onclick="UI.sekmeGec(\'daha\')"><div class="sust"><span class="set">SIRADAKİ</span><span class="syz">%' + Math.round(o2) + '</span></div>' +
               '<div class="sad">⚙️ Rafineri</div><div class="cubuk"><i style="width:' + o2 + '%"></i></div></div>';
      }
      return '<div class="sonraki tik" onclick="UI.sekmeGec(\'subeler\')"><div class="sust"><span class="set">ZİNCİR</span><span class="syz">TAM</span></div>' +
             '<div class="sad">🏆 Bütün lokasyonlar senin</div></div>';
    }
    var paraOran = Math.min(100, (s.para / hedef.fiyat) * 100);
    var svOran = Math.min(100, (s.seviye / hedef.seviyeSart) * 100);
    var oran = Math.min(paraOran, svOran);
    var h = '<div class="sonraki tik" onclick="UI.sekmeGec(\'subeler\')">';
    h += '<div class="sust"><span class="set">SIRADAKİ</span><span class="syz">%' + Math.round(oran) + '</span></div>';
    h += '<div class="sad">' + hedef.emoji + ' ' + hedef.ad + '</div>';
    h += '<div class="cubuk"><i style="width:' + oran + '%"></i></div>';
    h += '<div class="mini" style="margin-top:3px">' + (s.seviye < hedef.seviyeSart ? 'Seviye ' + hedef.seviyeSart + ' gerek' : tl(hedef.fiyat)) + '</div>';
    h += '</div>';
    return h;
  },

  kampanyaBilgi: function () {
    var k = SIM.kampanya();
    if (!k) return;
    var h = '<div class="not">Sezon kampanyası: istasyonunda <b>market</b> varsa her satışta müşterilerin bir kısmı bu üründen alır. Hedefe ulaşınca ödülü kazanırsın.</div>';
    h += '<div class="kv" style="margin-top:10px"><span>Ürün</span><b>' + k.tanim.emoji + ' ' + k.tanim.ad + '</b></div>';
    h += '<div class="kv"><span>İlerleme</span><b>' + k.sayac + ' / ' + k.tanim.hedef + '</b></div>';
    h += '<div class="kv"><span>Ödül</span><b class="yesilY">' + tl(k.tanim.odul) + '</b></div>';
    h += '<div class="kv"><span>Kalan süre</span><b>' + (30 - ((D.s.gun - 1) % 30)) + ' gün</b></div>';
    if (!D.binaSayisi(D.sube(), 'market')) h += '<div class="not"><span class="sariY">Bu şubede market yok — kampanya ilerlemiyor.</span></div>';
    this.modal('Sezon Kampanyası', h);
  },

  hizliSiparis: function (y) {
    var sb = D.sube();
    var kap = D.tankKap(sb, y);
    var yer = Math.floor(kap - sb.tank[y].dolu);
    if (yer < 100) { this.bildir('Tank dolu', VERI.yakitlar[y].ad + ' tankı zaten dolu.', 'uyari'); return; }
    var birim = D.toptanFiyat(y);
    var h = '<div class="kv"><span>Tanktaki</span><b>' + say(sb.tank[y].dolu, 0) + ' / ' + say(kap, 0) + ' L</b></div>';
    h += '<div class="kv"><span>Toptan fiyat</span><b>' + say(birim, 2) + ' ₺/L</b></div>';
    h += '<div class="btngrup" style="margin-top:12px">';
    [1000, 2500, 5000].forEach(function (m) {
      if (m > yer) return;
      h += '<button class="btn kucuk ikincil" onclick="UI.siparis(\'' + y + '\',' + m + ')">' + say(m, 0) + ' L<br><span class="mini">' + tl(m * birim) + '</span></button>';
    });
    h += '<button class="btn kucuk" onclick="UI.siparis(\'' + y + '\',' + yer + ')">Tankı doldur<br><span class="mini">' + tl(yer * birim) + '</span></button>';
    h += '</div>';
    this.modal(VERI.yakitlar[y].emoji + ' ' + VERI.yakitlar[y].ad + ' siparişi', h);
  },

  /* =========================================================
     HÜCRE / YAPI ETKİLEŞİMİ
     ========================================================= */
  hucreTik: function (k) {
    var sb = D.sube();
    if (k < 0 || k >= sb.yapi.length) return;
    var y = sb.yapi[k];
    if (y && y.t === 'pompa' && y.mesgul) {
      var m = SIM.musteriBul(sb, y.mesgul);
      if (m && m.durum === 'pompada') { SERVIS.ac(k); return; }
    }
    if (!sb.beton[k]) this.betonModal(k);
    else if (!y) this.insaModal(k);
    else this.yapiModal(k);
  },

  temizlikOnay: function () {
    if (SIM.temizlikYap(D.sube())) { this.bildir('Temizlik yapıldı', 'İstasyon pırıl pırıl.', 'iyi'); this.ciz(); }
  },

  /* =========================================================
     MODALLAR
     ========================================================= */
  modal: function (baslik, ic) {
    document.getElementById('modalIc').innerHTML =
      '<div class="mBas"><h3>' + baslik + '</h3><button class="kapat" onclick="UI.modalKapat()">✕</button></div>' + ic;
    document.getElementById('modal').classList.add('ac');
    this.modalAcik = true;
  },
  modalKapat: function () {
    document.getElementById('modal').classList.remove('ac');
    this.modalAcik = false;
    this.ciz();
  },

  betonModal: function (k) {
    var sb = D.sube();
    var f = SIM.betonFiyat(sb);
    var h = '<div class="not">Bu hücre boş arsa. Üzerine pompa veya tesis koymak için önce beton dökmen gerekiyor.</div>';
    h += '<div class="kv" style="margin-top:10px"><span>Beton bedeli</span><b>' + tl(f) + '</b></div>';
    h += '<button class="btn genis" style="margin-top:10px" onclick="UI.betonDok(' + k + ')">Beton dök</button>';
    this.modal('Zemin', h);
  },
  betonDok: function (k) {
    if (SIM.betonDok(D.sube(), k)) { this.modalKapat(); this.insaModal(k); }
  },

  insaModal: function (k) {
    var sb = D.sube(), s = D.s, lok = D.lok(sb);
    var pompaSayi = D.pompalar(sb).length;
    var h = '';

    h += '<div class="baslik">Pompa (' + pompaSayi + '/' + lok.maxPompa + ')</div><div class="sek">';
    VERI.yakitSira.forEach(function (y) {
      var f = VERI.pompa.fiyat[y];
      var kapali = pompaSayi >= lok.maxPompa || s.para < f;
      h += '<button class="sec" ' + (kapali ? 'style="opacity:.45"' : '') + ' onclick="UI.pompaKur(' + k + ',\'' + y + '\')">';
      h += '<div class="st">' + VERI.yakitlar[y].emoji + ' ' + VERI.yakitlar[y].ad + ' pompası</div>';
      h += '<div class="ss">' + tl(f) + ' · akış ' + say(y === 'ev' ? VERI.pompa.evAkis[0] : VERI.pompa.akis[0], 1) + ' ' + VERI.yakitlar[y].birim + '/sn';
      h += '<br>güç ' + VERI.pompa.guc[y] + ' kW</div></button>';
    });
    h += '</div>';

    h += '<div class="baslik" style="margin-top:14px">Tesis</div><div class="sek">';
    VERI.binaSira.forEach(function (t) {
      var tan = VERI.binalar[t];
      var kilit = s.seviye < tan.seviyeSart;
      var pahali = s.para < tan.fiyat;
      h += '<button class="sec" ' + (kilit || pahali ? 'style="opacity:.45"' : '') + ' onclick="UI.binaKur(' + k + ',\'' + t + '\')">';
      h += '<div class="st">' + tan.emoji + ' ' + tan.ad + '</div>';
      h += '<div class="ss">' + tl(tan.fiyat) + (kilit ? ' · <span class="kirmiziY">Sv ' + tan.seviyeSart + ' gerekli</span>' : '');
      if (tan.uretim) h += '<br>+' + tan.uretim + ' kW üretim';
      else if (tan.guc) h += '<br>' + tan.guc + ' kW tüketim';
      h += '<br>' + tan.aciklama + '</div></button>';
    });
    h += '</div>';

    this.modal('Ne inşa edilsin?', h);
  },

  pompaKur: function (k, y) { if (SIM.pompaKur(D.sube(), k, y)) this.modalKapat(); },
  binaKur: function (k, t) { if (SIM.binaKur(D.sube(), k, t)) this.modalKapat(); },

  yapiModal: function (k) {
    var sb = D.sube(), y = sb.yapi[k];
    if (!y) return;
    var h = '', ad, aciklama;
    if (y.t === 'pompa') {
      ad = VERI.yakitlar[y.yakit].ad + ' Pompası ' + (k + 1);
      aciklama = 'Tam akış ' + say(D.akis(y), 1) + ' · yavaş ' + say(D.yavasAkis(y), 2) + ' ' + VERI.yakitlar[y.yakit].birim + '/sn';
      if (y.yakit !== 'ev') aciklama += ' · çok tabancalı: benzin, dizel ve LPG verir (kendi türü tam hızda)';
    } else {
      ad = VERI.binalar[y.t].ad;
      aciklama = VERI.binalar[y.t].aciklama;
    }

    h += '<div class="not">' + aciklama + '</div>';
    h += '<div class="kv" style="margin-top:8px"><span>Seviye</span><b>' + y.sv + '</b></div>';
    h += '<div class="kv"><span>Bakım</span><b class="' + (y.bakim < 45 ? 'kirmiziY' : y.bakim < 75 ? 'sariY' : 'yesilY') + '">' + Math.round(y.bakim) + '%</b></div>';
    if (y.arizali) h += '<div class="kv"><span>Durum</span><b class="kirmiziY">ARIZALI — çalışmıyor</b></div>';
    if (y.t !== 'pompa' && VERI.binalar[y.t].gelir) h += '<div class="kv"><span>Ziyaret başı gelir</span><b>' + tl(VERI.binalar[y.t].gelir * (1 + 0.3 * (y.sv - 1))) + '</b></div>';
    if (y.t !== 'pompa' && VERI.binalar[y.t].uretim) h += '<div class="kv"><span>Üretim</span><b>' + say(VERI.binalar[y.t].uretim * y.sv, 0) + ' kW</b></div>';

    h += '<div class="btngrup" style="margin-top:12px">';
    var yuk = SIM.yukseltmeBedeli(y);
    if (yuk > 0) h += '<button class="btn kucuk" onclick="UI.yukselt(' + k + ')">⬆ Yükselt ' + tl(yuk) + '</button>';
    else h += '<span class="etiket iyi">Maksimum seviye</span>';
    h += '<button class="btn kucuk ikincil" onclick="UI.bakim(' + k + ')">🛠 ' + (y.arizali ? 'Tamir' : 'Bakım') + ' ' + tl(SIM.bakimBedeli(y)) + '</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.yik(' + k + ')">🧨 Yık</button>';
    h += '</div>';

    if (y.t === 'pompa') {
      var atanan = null;
      for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].pompa === k) atanan = sb.personel[i];
      h += '<div class="baslik" style="margin-top:14px">Pompacı</div>';
      if (atanan) {
        h += '<div class="satir"><div class="sol"><div class="ikon">🧑‍🔧</div><div><div class="ad">' + atanan.ad + '</div><div class="alt">Beceri ' + atanan.beceri + ' · ' + tl(atanan.maas) + '/ay</div></div></div>';
        h += '<button class="btn minik ikincil" onclick="UI.pompaAta(\'' + atanan.id + '\',null,' + k + ')">Kaldır</button></div>';
        h += '<div class="not">Pompacı doldurursa bahşiş alamazsın ve küçük hata payı olur. En kârlısı kendin doldurmaktır.</div>';
      } else {
        var bos = [];
        for (var j = 0; j < sb.personel.length; j++) if (sb.personel[j].tip === 'pompaci' && sb.personel[j].pompa === null) bos.push(sb.personel[j]);
        if (!bos.length) h += '<div class="not">Boşta pompacı yok. Personel sekmesinden işe alabilirsin.</div>';
        else {
          for (var b = 0; b < bos.length; b++) {
            h += '<div class="satir"><div class="sol"><div class="ikon">🧑‍🔧</div><div><div class="ad">' + bos[b].ad + '</div><div class="alt">Beceri ' + bos[b].beceri + '</div></div></div>';
            h += '<button class="btn minik" onclick="UI.pompaAta(\'' + bos[b].id + '\',' + k + ',' + k + ')">Ata</button></div>';
          }
        }
      }
    }

    this.modal(ad, h);
  },

  yukselt: function (k) { if (SIM.yukselt(D.sube(), k)) { this.bildir('Yükseltildi', '', 'iyi'); this.yapiModal(k); } },
  bakim: function (k) { if (SIM.bakimYap(D.sube(), k)) { this.bildir('Bakım tamam', 'Ekipman yeni gibi.', 'iyi'); this.yapiModal(k); } },
  yik: function (k) { if (SIM.yik(D.sube(), k)) this.modalKapat(); },
  pompaAta: function (pid, pompa, k) { SIM.pompaAta(D.sube(), pid, pompa); this.yapiModal(k); },

  /* =========================================================
     İNŞA PANELİ
     ========================================================= */
  insaHtml: function () {
    var sb = D.sube(), lok = D.lok(sb);
    var h = '';
    h += '<div class="kart"><div class="baslik">Arsa</div>';
    h += '<div class="kv"><span>Mevcut</span><b>' + sb.w + '×' + sb.h + ' = ' + (sb.w * sb.h) + ' hücre</b></div>';
    h += '<div class="kv"><span>Lokasyon sınırı</span><b>' + lok.w + '×' + lok.h + '</b></div>';
    var betonlu = 0;
    for (var i = 0; i < sb.beton.length; i++) if (sb.beton[i]) betonlu++;
    h += '<div class="kv"><span>Beton dökülü</span><b>' + betonlu + ' hücre</b></div>';
    if (sb.w < lok.w || sb.h < lok.h) {
      h += '<button class="btn genis" style="margin-top:10px" onclick="UI.arsaGenislet()">Arsa satın al · ' + tl(SIM.arsaBedeli(sb)) + '</button>';
    } else {
      h += '<div class="not">Bu lokasyonda arsa tamamen alındı.</div>';
    }
    h += '<div class="not">Sahnedeki boş araziye dokunarak da beton dökebilir, beton hücreye dokunarak pompa veya tesis kurabilirsin.</div>';
    h += '</div>';

    h += '<div class="kart"><div class="baslik">Pompalar · ' + D.pompalar(sb).length + '/' + lok.maxPompa + '</div>';
    var po = D.pompalar(sb);
    if (!po.length) h += '<div class="bos">Hiç pompa yok.</div>';
    for (var p = 0; p < po.length; p++) {
      var pp = po[p].p;
      h += '<div class="satir" onclick="UI.yapiModal(' + po[p].i + ')"><div class="sol"><div class="ikon">' + (pp.yakit === 'ev' ? '🔌' : '⛽') + '</div>';
      h += '<div><div class="ad">' + VERI.yakitlar[pp.yakit].ad + ' · Pompa ' + (po[p].i + 1) + '</div>';
      h += '<div class="alt">sv.' + pp.sv + ' · akış ' + say(D.akis(pp), 1) + ' · bakım ' + Math.round(pp.bakim) + '%</div></div></div>';
      h += (pp.arizali ? '<span class="etiket kotu">ARIZA</span>' : pp.bakim < 45 ? '<span class="etiket uyari">bakım</span>' : '<span class="etiket iyi">çalışıyor</span>');
      h += '</div>';
    }
    h += '</div>';

    h += '<div class="kart"><div class="baslik">Tesisler</div>';
    var bi = D.binalar(sb);
    if (!bi.length) h += '<div class="bos">Hiç tesis yok. Market ve kafe hem gelir hem müşteri çeker.</div>';
    for (var b = 0; b < bi.length; b++) {
      var tan = VERI.binalar[bi[b].b.t];
      h += '<div class="satir" onclick="UI.yapiModal(' + bi[b].i + ')"><div class="sol"><div class="ikon">' + tan.emoji + '</div>';
      h += '<div><div class="ad">' + tan.ad + ' sv.' + bi[b].b.sv + '</div>';
      h += '<div class="alt">bakım ' + Math.round(bi[b].b.bakim) + '%' + (tan.uretim ? ' · +' + say(tan.uretim * bi[b].b.sv, 0) + ' kW' : '') + '</div></div></div>';
      h += (bi[b].b.arizali ? '<span class="etiket kotu">ARIZA</span>' : '<span class="etiket">düzenle</span>');
      h += '</div>';
    }
    h += '</div>';

    var tuk = D.gucTuketim(sb), ure = D.gucUretim(sb);
    h += '<div class="kart"><div class="baslik">İşletme</div>';
    h += '<div class="kv"><span>Elektrik</span><b>' + say(ure, 1) + ' / ' + say(tuk, 1) + ' kW</b></div>';
    h += '<div class="kv"><span>Temizlik</span><b>' + Math.round(sb.temizlik) + '%</b></div>';
    h += '<div class="kv"><span>Bakım ortalaması</span><b>' + Math.round(D.bakimOrt(sb)) + '%</b></div>';
    h += '<div class="kv"><span>Günlük kira+gider</span><b>' + tl(SIM.kiraGunluk(sb)) + '</b></div>';
    h += '<div class="kv"><span>Beklenen müşteri</span><b>' + say(SIM.saatlikMusteri(sb), 1) + ' / saat</b></div>';
    h += '<button class="btn ikincil genis" style="margin-top:10px" onclick="UI.temizlikOnay()">🧹 Temizlik yaptır · ' + tl(2500 + (100 - sb.temizlik) * 220) + '</button>';
    h += '</div>';
    return h;
  },

  arsaGenislet: function () { if (SIM.arsaGenislet(D.sube())) this.ciz(); },

  /* =========================================================
     FİYAT
     ========================================================= */
  fiyatHtml: function () {
    var sb = D.sube(), s = D.s;
    var h = '<div class="kart"><div class="baslik">Pompa fiyatların</div>';
    h += '<div class="not">Rakibin altına inersen trafik artar, marjın düşer. Üstüne çıkarsan müşteri azalır ama her litre daha çok kâr bırakır.</div>';
    VERI.yakitSira.forEach(function (y) {
      var yk = VERI.yakitlar[y];
      var maliyet = y === 'ev' ? SIM.elektrikMaliyet(sb) : D.toptanFiyat(y);
      var f = sb.fiyat[y], r = sb.rakip[y];
      var marj = f - maliyet;
      var marjYuzde = maliyet > 0 ? (marj / maliyet) * 100 : 0;
      var fark = ((f / r) - 1) * 100;
      h += '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">';
      h += '<div class="satir" style="padding:0 0 6px;border:none"><div class="sol"><div class="ikon">' + yk.emoji + '</div>';
      h += '<div><div class="ad">' + yk.ad + '</div><div class="alt">maliyet ' + say(maliyet, 2) + ' · rakip ' + say(r, 2) + ' ₺</div></div></div>';
      h += '<div style="text-align:right"><div style="font-size:19px;font-weight:800">' + say(f, 2) + '</div>';
      h += '<div class="mini">₺/' + yk.birim + '</div></div></div>';
      h += '<input type="range" min="' + (maliyet * 0.92).toFixed(2) + '" max="' + (maliyet * 1.75).toFixed(2) + '" step="0.01" value="' + f + '" ';
      h += 'oninput="UI.fiyatKaydir(\'' + y + '\',this.value)">';
      h += '<div class="satir" style="padding:4px 0 0;border:none">';
      h += '<span class="etiket ' + (marj <= 0 ? 'kotu' : marjYuzde > 25 ? 'iyi' : 'uyari') + '">marj ' + say(marj, 2) + ' ₺ (%' + say(marjYuzde, 0) + ')</span>';
      h += '<span class="etiket ' + (fark < -1 ? 'iyi' : fark > 1 ? 'kotu' : '') + '">rakibe göre ' + (fark >= 0 ? '+' : '') + say(fark, 1) + '%</span>';
      h += '</div></div>';
    });
    h += '<div class="btngrup" style="margin-top:12px">';
    h += '<button class="btn kucuk ikincil" onclick="UI.fiyatOtomatik(-0.02)">Rakibin %2 altı</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.fiyatOtomatik(0)">Rakiple aynı</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.fiyatOtomatik(0.04)">%4 üstü</button>';
    h += '</div></div>';

    h += '<div class="kart"><div class="baslik">Piyasa</div>';
    VERI.yakitSira.forEach(function (y) {
      h += '<div class="kv"><span>' + VERI.yakitlar[y].ad + ' toptan</span><b>' + say(D.toptanFiyat(y), 2) + ' ₺</b></div>';
    });
    if (s.rafineri.aktif) h += '<div class="not">Rafinerin sayesinde toptan fiyatlardan %' + Math.round(VERI.rafineri.indirim[s.rafineri.sv] * 100) + ' indirim alıyorsun.</div>';
    h += '<div class="kv"><span>Şebeke elektriği</span><b>' + say(VERI.sebekeFiyat, 2) + ' ₺/kWh</b></div>';
    h += '<div class="kv"><span>Beklenen müşteri</span><b>' + say(SIM.saatlikMusteri(sb), 1) + ' / saat</b></div>';
    h += '</div>';
    return h;
  },

  fiyatKaydir: function (y, v) {
    D.sube().fiyat[y] = +(+v).toFixed(2);
    var govde = document.getElementById('govde');
    var kay = govde ? govde.scrollTop : 0;
    this.ciz();
    if (govde) govde.scrollTop = kay;
  },
  fiyatOtomatik: function (oran) {
    var sb = D.sube();
    VERI.yakitSira.forEach(function (y) { sb.fiyat[y] = +(sb.rakip[y] * (1 + oran)).toFixed(2); });
    this.ciz();
  },

  /* =========================================================
     SİPARİŞ
     ========================================================= */
  siparisHtml: function () {
    var sb = D.sube(), s = D.s;
    var h = '';

    if (sb.siparis.length) {
      h += '<div class="kart"><div class="baslik">Yoldaki tankerler</div>';
      for (var i = 0; i < sb.siparis.length; i++) {
        var o = sb.siparis[i];
        h += '<div class="satir"><div class="sol"><div class="ikon">🚚</div><div><div class="ad">' + say(o.miktar, 0) + ' L ' + VERI.yakitlar[o.yakit].ad + '</div>';
        h += '<div class="alt">' + say(o.birim, 2) + ' ₺/L alındı</div></div></div>';
        h += '<span class="etiket uyari">' + o.kalan + ' dk</span></div>';
      }
      h += '</div>';
    }

    ['benzin', 'dizel', 'lpg'].forEach(function (y) {
      var t = sb.tank[y], kap = D.tankKap(sb, y);
      t.kap = kap;
      var yer = Math.floor(kap - t.dolu);
      var birim = D.toptanFiyat(y);
      var oran = kap ? (t.dolu / kap) * 100 : 0;
      h += '<div class="kart"><div class="satir" style="border:none;padding-top:0">';
      h += '<div class="sol"><div class="ikon">' + VERI.yakitlar[y].emoji + '</div><div><div class="ad">' + VERI.yakitlar[y].ad + '</div>';
      h += '<div class="alt">' + say(t.dolu, 0) + '/' + say(kap, 0) + ' L · toptan ' + say(birim, 2) + ' ₺</div></div></div>';
      h += '<span class="etiket ' + (oran < 15 ? 'kotu' : oran < 35 ? 'uyari' : 'iyi') + '">' + Math.round(oran) + '%</span></div>';
      h += '<div class="cubuk"><i style="width:' + oran + '%"></i></div>';
      h += '<div class="btngrup" style="margin-top:10px">';
      [1000, 2500, 5000].forEach(function (mik) {
        if (mik > yer) return;
        h += '<button class="btn kucuk ikincil" onclick="UI.siparis(\'' + y + '\',' + mik + ')">' + say(mik, 0) + ' L<br><span class="mini">' + tl(mik * birim) + '</span></button>';
      });
      if (yer > 100) h += '<button class="btn kucuk" onclick="UI.siparis(\'' + y + '\',' + yer + ')">Tankı doldur ' + say(yer, 0) + ' L<br><span class="mini">' + tl(yer * birim) + '</span></button>';
      if (yer <= 100) h += '<span class="etiket iyi">Tank dolu</span>';
      h += '</div></div>';
    });

    h += '<div class="kart"><div class="baslik">Tedarik</div>';
    if (s.rafineri.aktif) {
      h += '<div class="kv"><span>Rafineri</span><b>sv.' + s.rafineri.sv + ' · %' + Math.round(VERI.rafineri.indirim[s.rafineri.sv] * 100) + ' indirim</b></div>';
      h += '<div class="kv"><span>Tanker filosu</span><b>' + s.rafineri.tanker + '</b></div>';
      h += '<div class="not">Teslim süresi 8-25 dakika, nakliye bedeli yok.</div>';
    } else {
      h += '<div class="not">Dış tedarikçiyle çalışıyorsun: nakliye bedeli var, teslim 45-150 dakika sürer. Rafineri kurarsan maliyet düşer, teslim hızlanır.</div>';
    }
    h += '</div>';
    return h;
  },

  siparis: function (y, mik) {
    if (SIM.siparisVer(D.sube(), y, mik)) { if (this.modalAcik) this.modalKapat(); else this.ciz(); }
  },


  /* =========================================================
     MARKET
     ========================================================= */
  marketHtml: function () {
    var sb = D.sube();
    var h = '';
    if (!SIM.marketVar(sb)) {
      h += '<div class="kart"><div class="bos">Bu şubede market yok.<br>Market kurduğunda burada raf, stok ve fiyat yönetimi açılır.</div>';
      h += '<button class="btn genis" style="margin-top:10px" onclick="UI.sekmeGec(\'insa\')">🏗️ İnşaat menüsüne git</button></div>';
      return h;
    }
    var kap = SIM.marketRafKapasite(sb), dolu = SIM.marketDoluluk(sb);
    var oran = kap ? (dolu / kap) * 100 : 0;
    var kasiyer = null;
    for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].tip === 'kasiyer') kasiyer = sb.personel[i];

    h += '<div class="kart"><div class="baslik">Raf ve kasa</div>';
    h += '<div class="kv"><span>Raf doluluğu</span><b>' + say(dolu, 0) + ' / ' + say(kap, 0) + ' birim</b></div>';
    h += '<div class="cubuk"><i style="width:' + oran + '%;background:' + (oran < 25 ? 'var(--kirmizi)' : oran < 50 ? 'var(--sari)' : 'var(--yesil)') + '"></i></div>';
    h += '<div class="kv" style="margin-top:8px"><span>Market cirosu (toplam)</span><b>' + tl(sb.market.ciro) + '</b></div>';
    h += '<div class="kv"><span>Stok değeri</span><b>' + tl(SIM.marketStokDegeri(sb)) + '</b></div>';
    h += '<div class="kv"><span>Stoksuzluktan kaçan satış</span><b class="' + (sb.market.kayipSatis > 20 ? 'kirmiziY' : '') + '">' + say(sb.market.kayipSatis, 0) + '</b></div>';
    h += '<div class="kv"><span>Kasiyer</span><b>' + (kasiyer ? kasiyer.ad + ' (' + kasiyer.beceri + ')' : '<span class="sariY">yok · market yarı verimle çalışıyor</span>') + '</b></div>';
    h += '<div class="btngrup" style="margin-top:10px">';
    h += '<button class="btn kucuk" onclick="UI.marketDoldur()">🛒 Rafları doldur</button>';
    if (!kasiyer) h += '<button class="btn kucuk ikincil" onclick="UI.sekmeGec(\'personel\')">🧑‍💼 Kasiyer al</button>';
    h += '</div></div>';

    h += '<div class="kart"><div class="baslik">Ürünler</div>';
    h += '<div class="not">Alış fiyatı sabittir; satış fiyatını sen belirlersin. Ucuzlatırsan daha çok satarsın, pahalılaştırırsan marjın artar.</div>';
    var sezon = VERI.sezonSira[D.s.sezonIdx];
    for (var u = 0; u < VERI.marketUrunler.length; u++) {
      var ur = VERI.marketUrunler[u];
      var stok = sb.market.stok[ur.id] || 0;
      var fiyat = SIM.marketSatisFiyati(sb, ur.id);
      var marj = fiyat - ur.alis;
      var sezonluk = ur.sezon && ur.sezon !== sezon;
      h += '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)">';
      h += '<div class="satir" style="border:none;padding:0 0 5px"><div class="sol"><div class="ikon">' + ur.emoji + '</div>';
      h += '<div><div class="ad">' + ur.ad + (sezonluk ? ' <span class="etiket">sezon dışı</span>' : '') + '</div>';
      h += '<div class="alt">alış ' + say(ur.alis, 0) + ' ₺ · stok <b class="' + (stok <= 0 ? 'kirmiziY' : stok < 6 ? 'sariY' : '') + '">' + say(stok, 0) + '</b> · bugün ' + say(sb.market.gunlukSatis[ur.id] || 0, 0) + ' satıldı</div></div></div>';
      h += '<div style="text-align:right"><div style="font-size:17px;font-weight:800">' + say(fiyat, 0) + ' ₺</div>';
      h += '<div class="mini ' + (marj <= 0 ? 'kirmiziY' : 'yesilY') + '">+' + say(marj, 0) + '</div></div></div>';
      h += '<input type="range" min="' + Math.round(ur.alis) + '" max="' + Math.round(ur.satis * 2) + '" step="1" value="' + Math.round(fiyat) + '" oninput="UI.marketFiyat(\'' + ur.id + '\',this.value)">';
      h += '<div class="btngrup" style="margin-top:5px">';
      [10, 25, 50].forEach(function (adet) {
        h += '<button class="btn minik ikincil" onclick="UI.marketAl(\'' + ur.id + '\',' + adet + ')">+' + adet + '<br><span class="mini">' + tl(adet * ur.alis) + '</span></button>';
      });
      h += '</div></div>';
    }
    h += '</div>';
    return h;
  },

  marketAl: function (id, adet) {
    var sonuc = SIM.marketStokAl(D.sube(), id, adet);
    if (sonuc) {
      var govde = document.getElementById('govde');
      var kay = govde ? govde.scrollTop : 0;
      this.ciz();
      if (govde) govde.scrollTop = kay;
    }
  },
  marketDoldur: function () { SIM.marketTumunuDoldur(D.sube()); this.ciz(); },
  marketFiyat: function (id, v) {
    D.sube().market.fiyat[id] = Math.round(+v);
    var govde = document.getElementById('govde');
    var kay = govde ? govde.scrollTop : 0;
    this.ciz();
    if (govde) govde.scrollTop = kay;
  },

  /* =========================================================
     BANKA & FİNANS
     ========================================================= */
  bankaHtml: function () {
    var s = D.s;
    var v = SIM.varliklar();
    var borc = SIM.borcToplam();
    var net = v.toplam - borc;
    var h = '';

    h += '<div class="kart"><div class="baslik">Özet</div>';
    h += '<div class="kv"><span>Kasadaki nakit</span><b>' + tl(v.nakit) + '</b></div>';
    h += '<div class="kv"><span>Toplam varlık</span><b>' + tl(v.toplam) + '</b></div>';
    h += '<div class="kv"><span>Toplam borç</span><b class="' + (borc > 0 ? 'kirmiziY' : '') + '">' + tl(borc) + '</b></div>';
    h += '<div class="kv" style="border-top:1px solid var(--cizgi);margin-top:6px;padding-top:8px"><span><b>Net değer</b></span><b class="' + (net >= 0 ? 'yesilY' : 'kirmiziY') + '" style="font-size:17px">' + tl(net) + '</b></div>';
    h += '<div class="kv"><span>Kredi notu</span><b class="' + (s.krediNotu >= 70 ? 'yesilY' : s.krediNotu >= 45 ? 'sariY' : 'kirmiziY') + '">' + Math.round(s.krediNotu) + ' / 100</b></div>';
    h += '<div class="cubuk"><i style="width:' + s.krediNotu + '%;background:' + (s.krediNotu >= 70 ? 'var(--yesil)' : s.krediNotu >= 45 ? 'var(--sari)' : 'var(--kirmizi)') + '"></i></div>';
    h += '</div>';

    h += '<div class="kart"><div class="baslik">Neyim var</div>';
    h += '<div class="kv"><span>💵 Nakit</span><b>' + tl(v.nakit) + '</b></div>';
    h += '<div class="kv"><span>⛽ Tanklardaki yakıt</span><b>' + tl(v.yakit) + '</b></div>';
    h += '<div class="kv"><span>🛒 Market stoğu</span><b>' + tl(v.market) + '</b></div>';
    h += '<div class="kv"><span>🏗️ Pompa ve tesisler</span><b>' + tl(v.tesis) + '</b></div>';
    h += '<div class="kv"><span>🧱 Arsa ve zemin</span><b>' + tl(v.arsa) + '</b></div>';
    if (v.rafineri) h += '<div class="kv"><span>⚙️ Rafineri ve tankerler</span><b>' + tl(v.rafineri) + '</b></div>';
    if (s.pasifGelir) h += '<div class="kv"><span>🏁 Devredilen şubeler (günlük)</span><b class="yesilY">' + tl(s.pasifGelir) + '</b></div>';
    h += '</div>';

    /* şube şube döküm */
    h += '<div class="kart"><div class="baslik">Şube dökümü</div>';
    for (var i = 0; i < s.subeler.length; i++) {
      var sb = s.subeler[i];
      var deger = SIM.subeDegeri(sb);
      h += '<div class="satir"><div class="sol"><div class="ikon">' + D.lok(sb).emoji + '</div><div><div class="ad">' + sb.ad + '</div>';
      h += '<div class="alt">' + D.pompalar(sb).length + ' pompa · ' + D.binalar(sb).length + ' tesis' + (sb.devredildi ? ' · devredildi' : '') + '</div></div></div>';
      h += '<b>' + tl(deger) + '</b></div>';
    }
    h += '</div>';

    /* giderler */
    var gunlukMaas = 0, gunlukKira = 0;
    for (var j = 0; j < s.subeler.length; j++) {
      var sbx = s.subeler[j];
      if (sbx.devredildi) continue;
      for (var p = 0; p < sbx.personel.length; p++) gunlukMaas += sbx.personel[p].maas / 30;
      gunlukKira += SIM.kiraGunluk(sbx);
    }
    h += '<div class="kart"><div class="baslik">Sabit giderler</div>';
    h += '<div class="kv"><span>Personel (günlük)</span><b>' + tl(gunlukMaas) + '</b></div>';
    h += '<div class="kv"><span>Kira ve işletme (günlük)</span><b>' + tl(gunlukKira) + '</b></div>';
    if (s.krediler.length) h += '<div class="kv"><span>Kredi taksitleri (aylık)</span><b class="kirmiziY">' + tl(SIM.aylikTaksitToplam()) + '</b></div>';
    h += '<div class="kv" style="border-top:1px solid var(--cizgi);margin-top:6px;padding-top:8px"><span><b>Günlük toplam</b></span><b>' + tl(gunlukMaas + gunlukKira + SIM.aylikTaksitToplam() / 30) + '</b></div>';
    h += '</div>';

    /* mevcut krediler */
    if (s.krediler.length) {
      h += '<div class="kart"><div class="baslik">Kredilerim</div>';
      for (var k = 0; k < s.krediler.length; k++) {
        var kr = s.krediler[k];
        h += '<div class="satir"><div class="sol"><div class="ikon">🏦</div><div><div class="ad">' + kr.ad + '</div>';
        h += '<div class="alt">kalan <b>' + tl(kr.kalan) + '</b> · ' + kr.kalanTaksit + '/' + kr.toplamTaksit + ' taksit · aylık ' + tl(kr.taksitTutar);
        h += '<br>sonraki ödeme: gün ' + kr.sonrakiGun + ' · faiz %' + say(kr.faiz * 100, 1);
        if (kr.gecikme) h += ' · <span class="kirmiziY">gecikme ' + tl(kr.gecikme) + '</span>';
        h += '</div></div></div>';
        h += '<button class="btn minik ikincil" onclick="UI.krediKapat(\'' + kr.id + '\')">Kapat</button></div>';
      }
      h += '</div>';
    }

    /* teklifler */
    h += '<div class="kart"><div class="baslik">Kredi teklifleri</div>';
    h += '<div class="kv"><span>Kullanılabilir limit</span><b>' + tl(SIM.krediLimiti()) + '</b></div>';
    h += '<div class="not">Limit net değerinin %' + Math.round(VERI.banka.borcOrani * 100) + ' u kadardır. Taksitini zamanında ödersen kredi notun yükselir, faizin düşer.</div>';
    var teklifler = SIM.krediTeklifleri();
    for (var t = 0; t < teklifler.length; t++) {
      var tk = teklifler[t];
      h += '<div class="satir"><div class="sol"><div class="ikon">' + (tk.uygun ? '💰' : '🔒') + '</div><div><div class="ad"' + (tk.uygun ? '' : ' style="opacity:.6"') + '>' + tk.ad + '</div>';
      if (tk.uygun) {
        h += '<div class="alt">' + tl(tk.tutar) + ' · ' + tk.ay + ' ay × ' + tl(tk.taksitTutar) + '<br>aylık faiz %' + say(tk.faiz * 100, 2) + ' · toplam geri ödeme ' + tl(tk.toplam) + '</div>';
      } else {
        h += '<div class="alt"><span class="kirmiziY">' + tk.sebep + '</span></div>';
      }
      h += '</div></div>';
      if (tk.uygun) h += '<button class="btn minik" onclick="UI.krediCek(' + t + ')">Çek</button>';
      h += '</div>';
    }
    h += '</div>';
    return h;
  },

  krediCek: function (i) {
    var teklifler = SIM.krediTeklifleri();
    if (!teklifler[i]) return;
    var tk = teklifler[i];
    var h = '<div class="not">Kredi hemen kasana geçer. Taksitler her 30 günde bir otomatik tahsil edilir; ödeyemezsen gecikme faizi işler ve kredi notun düşer.</div>';
    h += '<div class="kv" style="margin-top:10px"><span>Anapara</span><b>' + tl(tk.tutar) + '</b></div>';
    h += '<div class="kv"><span>Vade</span><b>' + tk.ay + ' ay</b></div>';
    h += '<div class="kv"><span>Aylık faiz</span><b>%' + say(tk.faiz * 100, 2) + '</b></div>';
    h += '<div class="kv"><span>Aylık taksit</span><b>' + tl(tk.taksitTutar) + '</b></div>';
    h += '<div class="kv"><span>Toplam geri ödeme</span><b class="kirmiziY">' + tl(tk.toplam) + '</b></div>';
    h += '<div class="kv"><span>Toplam faiz yükü</span><b class="kirmiziY">' + tl(tk.toplam - tk.tutar) + '</b></div>';
    h += '<button class="btn genis" style="margin-top:12px" onclick="UI.krediOnay(' + i + ')">Krediyi kullan</button>';
    this.modal(tk.ad, h);
  },
  krediOnay: function (i) {
    var teklifler = SIM.krediTeklifleri();
    if (teklifler[i] && SIM.krediCek(teklifler[i])) this.modalKapat();
  },
  krediKapat: function (kid) { if (SIM.krediKapat(kid)) this.ciz(); },

  /* =========================================================
     PERSONEL
     ========================================================= */
  personelHtml: function () {
    var sb = D.sube();
    var h = '<div class="kart"><div class="baslik">Kadro · ' + sb.personel.length + '/12</div>';
    if (!sb.personel.length) h += '<div class="bos">Henüz personel yok. Her şeyi tek başına yapıyorsun.</div>';
    for (var i = 0; i < sb.personel.length; i++) {
      var p = sb.personel[i], t = VERI.personel[p.tip];
      h += '<div class="satir"><div class="sol"><div class="ikon">' + t.emoji + '</div><div><div class="ad">' + p.ad + '</div>';
      h += '<div class="alt">' + t.ad + ' · beceri ' + p.beceri + ' · ' + tl(p.maas) + '/ay';
      if (p.tip === 'pompaci') h += ' · ' + (p.pompa !== null ? 'Pompa ' + (p.pompa + 1) : '<span class="sariY">atanmadı</span>');
      h += '</div></div></div>';
      h += '<button class="btn minik ikincil" onclick="UI.cikar(\'' + p.id + '\')">Çıkar</button></div>';
    }
    var toplamMaas = 0;
    for (var j = 0; j < sb.personel.length; j++) toplamMaas += sb.personel[j].maas;
    h += '<div class="kv" style="margin-top:8px"><span>Aylık maaş yükü</span><b>' + tl(toplamMaas) + '</b></div>';
    h += '<div class="kv"><span>Günlük</span><b>' + tl(toplamMaas / 30) + '</b></div>';
    h += '</div>';

    h += '<div class="kart"><div class="baslik">İş başvuruları</div>';
    if (!this.adaylar) this.adaylarYenile();
    for (var a = 0; a < this.adaylar.length; a++) {
      var ad = this.adaylar[a], ta = VERI.personel[ad.tip];
      h += '<div class="satir"><div class="sol"><div class="ikon">' + ta.emoji + '</div><div><div class="ad">' + ad.ad + '</div>';
      h += '<div class="alt">' + ta.ad + ' · beceri <b>' + ad.beceri + '</b> · ' + tl(ad.maas) + '/ay</div>';
      h += '<div class="cubuk" style="width:140px"><i style="width:' + ad.beceri + '%;background:' + (ad.beceri > 75 ? 'var(--yesil)' : ad.beceri > 50 ? 'var(--sari)' : 'var(--kirmizi)') + '"></i></div></div></div>';
      h += '<button class="btn minik" onclick="UI.iseAl(' + a + ')">Al<br><span class="mini">' + tl(ad.maas * 0.5) + '</span></button></div>';
    }
    h += '<button class="btn ikincil genis" style="margin-top:10px" onclick="UI.adaylarYenile(true)">🔄 Yeni başvurular</button>';
    h += '</div>';

    h += '<div class="kart"><div class="baslik">Görev tanımları</div>';
    for (var tip in VERI.personel) {
      h += '<div class="satir"><div class="sol"><div class="ikon">' + VERI.personel[tip].emoji + '</div><div><div class="ad">' + VERI.personel[tip].ad + '</div>';
      h += '<div class="alt">' + VERI.personel[tip].aciklama + '</div></div></div></div>';
    }
    h += '</div>';
    return h;
  },

  adaylarYenile: function (ciz) {
    var tipler = ['pompaci', 'pompaci', 'kasiyer', 'temizlik', 'teknisyen', 'mudur'];
    this.adaylar = [];
    for (var i = 0; i < tipler.length; i++) this.adaylar.push(SIM.adayUret(tipler[i]));
    if (ciz) this.ciz();
  },
  iseAl: function (i) {
    var aday = this.adaylar[i];
    if (SIM.iseAl(D.sube(), aday)) { this.adaylar.splice(i, 1); this.ciz(); }
  },
  cikar: function (pid) { SIM.cikar(D.sube(), pid); this.ciz(); },

  /* =========================================================
     ŞUBELER
     ========================================================= */
  subelerHtml: function () {
    var s = D.s;
    var h = '<div class="kart"><div class="baslik">Şubelerin</div>';
    for (var i = 0; i < s.subeler.length; i++) {
      var sb = s.subeler[i], lok = D.lok(sb);
      var mudur = null;
      for (var j = 0; j < sb.personel.length; j++) if (sb.personel[j].tip === 'mudur') mudur = sb.personel[j];
      h += '<div class="satir"><div class="sol"><div class="ikon">' + lok.emoji + '</div><div><div class="ad">' + sb.ad + (i === s.aktif ? ' <span class="etiket iyi">buradasın</span>' : '') + '</div>';
      h += '<div class="alt">' + D.pompalar(sb).length + ' pompa · ' + D.binalar(sb).length + ' tesis · memnuniyet ' + Math.round(sb.memnuniyet) + '%';
      if (sb.devredildi) h += ' · <span class="maviY">devredildi</span>';
      else if (mudur) h += ' · müdür: ' + mudur.ad.split(' ')[0] + ' (' + mudur.beceri + ')';
      else if (i !== s.aktif) h += ' · <span class="sariY">müdür yok, çalışmıyor</span>';
      h += '</div></div></div>';
      if (sb.devredildi) h += '<span class="etiket">pasif</span>';
      else if (i !== s.aktif) h += '<button class="btn minik" onclick="UI.subeGec(' + i + ')">Geç</button>';
      else h += '<button class="btn minik ikincil" onclick="UI.devretModal(' + i + ')">Devret</button>';
      h += '</div>';
    }
    if (s.pasifGelir > 0) h += '<div class="kv" style="margin-top:8px"><span>Devredilen şubelerden günlük</span><b class="yesilY">' + tl(s.pasifGelir) + '</b></div>';
    h += '</div>';

    h += '<div class="kart"><div class="baslik">Yeni lokasyonlar</div>';
    for (var k = 0; k < VERI.lokasyonlar.length; k++) {
      var lk = VERI.lokasyonlar[k];
      var varMi = false;
      for (var m = 0; m < s.subeler.length; m++) if (s.subeler[m].lok === lk.id) varMi = true;
      if (varMi) continue;
      var kilit = s.seviye < lk.seviyeSart;
      h += '<div class="satir"><div class="sol"><div class="ikon">' + lk.emoji + '</div><div><div class="ad">' + lk.ad + '</div>';
      h += '<div class="alt">trafik ×' + say(lk.trafik, 2) + ' · ' + lk.w + '×' + lk.h + ' arsa · ' + lk.maxPompa + ' pompa<br>' + lk.aciklama + '</div></div></div>';
      h += '<div style="text-align:right">';
      if (kilit) h += '<span class="etiket kotu">Sv ' + lk.seviyeSart + '</span>';
      else h += '<button class="btn minik" onclick="UI.subeAc(\'' + lk.id + '\')">Aç<br><span class="mini">' + tl(lk.fiyat) + '</span></button>';
      h += '</div></div>';
    }
    h += '</div>';
    return h;
  },

  subeGec: function (i) {
    D.s.aktif = i;
    this.adaylar = null;
    this.bildir('Şube değişti', D.sube().ad + ' yönetimine geçtin.', 'iyi');
    this.sekmeGec('istasyon');
  },
  subeAc: function (lokId) { if (SIM.subeAc(lokId)) this.ciz(); },
  devretModal: function (i) {
    var sb = D.s.subeler[i];
    var puan = (sb.memnuniyet * 0.5 + sb.temizlik * 0.2 + D.bakimOrt(sb) * 0.3);
    var deger = SIM.subeDegeri(sb);
    var h = '<div class="not">Şubeyi bir işletmeciye devredersen peşin ödeme alırsın ve her gün kalıcı pasif gelir kazanırsın. Şube bir daha oynanamaz.</div>';
    h += '<div class="kv" style="margin-top:10px"><span>Hizmet puanı</span><b class="' + (puan >= 95 ? 'yesilY' : 'kirmiziY') + '">' + Math.round(puan) + ' / 95</b></div>';
    h += '<div class="kv"><span>Şube değeri</span><b>' + tl(deger) + '</b></div>';
    h += '<div class="kv"><span>Peşin ödeme</span><b>' + tl(deger * 0.55) + '</b></div>';
    h += '<div class="kv"><span>Günlük pasif gelir</span><b class="yesilY">' + tl(deger * 0.0018) + '</b></div>';
    h += '<button class="btn genis" style="margin-top:12px" onclick="UI.devret(' + i + ')">Devret</button>';
    this.modal('Şubeyi devret', h);
  },
  devret: function (i) {
    if (SIM.devret(i)) {
      if (D.s.aktif === i) {
        for (var j = 0; j < D.s.subeler.length; j++) if (!D.s.subeler[j].devredildi) { D.s.aktif = j; break; }
      }
      this.modalKapat();
    }
  },

  /* =========================================================
     DAHA
     ========================================================= */
  dahaHtml: function () {
    var s = D.s, i = s.ist;
    var h = '';

    var kazanilan = s.basarimlar || [];
    h += '<div class="kart"><div class="baslik">🏆 Başarımlar · ' + kazanilan.length + '/' + VERI.basarimlar.length + '</div>';
    for (var b = 0; b < VERI.basarimlar.length; b++) {
      var ba = VERI.basarimlar[b];
      var alindi = kazanilan.indexOf(ba.id) >= 0;
      h += '<div class="satir"><div class="sol"><div class="ikon">' + (alindi ? '🏅' : '🔒') + '</div>';
      h += '<div><div class="ad"' + (alindi ? '' : ' style="opacity:.6"') + '>' + ba.ad + '</div><div class="alt">' + ba.aciklama + '</div></div></div>';
      h += '<span class="etiket ' + (alindi ? 'iyi' : '') + '">' + tl(ba.odul) + '</span></div>';
    }
    h += '</div>';

    h += '<div class="kart"><div class="baslik">⚙️ Rafineri</div>';
    if (!s.rafineri.aktif) {
      h += '<div class="not">' + VERI.rafineri.aciklama + '</div>';
      h += '<div class="kv" style="margin-top:8px"><span>Kuruluş</span><b>' + tl(VERI.rafineri.fiyat) + '</b></div>';
      h += '<div class="kv"><span>Gereken seviye</span><b>' + VERI.rafineri.seviyeSart + '</b></div>';
      h += '<button class="btn genis' + (s.seviye < VERI.rafineri.seviyeSart || s.para < VERI.rafineri.fiyat ? ' kapali' : '') + '" style="margin-top:10px" onclick="SIM.rafineriKur()&&UI.ciz()">Rafineri kur</button>';
    } else {
      h += '<div class="kv"><span>Seviye</span><b>' + s.rafineri.sv + '</b></div>';
      h += '<div class="kv"><span>Tedarik indirimi</span><b class="yesilY">%' + Math.round(VERI.rafineri.indirim[s.rafineri.sv] * 100) + '</b></div>';
      h += '<div class="kv"><span>Tanker</span><b>' + s.rafineri.tanker + '</b></div>';
      h += '<div class="btngrup" style="margin-top:10px">';
      if (s.rafineri.sv < VERI.rafineri.indirim.length - 1)
        h += '<button class="btn kucuk" onclick="SIM.rafineriYukselt()&&UI.ciz()">⬆ Yükselt ' + tl(VERI.rafineri.svFiyat[s.rafineri.sv]) + '</button>';
      h += '<button class="btn kucuk ikincil" onclick="SIM.tankerAl()&&UI.ciz()">🚛 Tanker al ' + tl(VERI.rafineri.tankerFiyat) + '</button>';
      h += '</div>';
    }
    h += '</div>';

    h += '<div class="kart"><div class="baslik">📊 İstatistik</div>';
    h += '<div class="kv"><span>Toplam ciro</span><b>' + tl(i.ciro) + '</b></div>';
    h += '<div class="kv"><span>Toplam kâr</span><b class="' + (i.kar >= 0 ? 'yesilY' : 'kirmiziY') + '">' + tl(i.kar) + '</b></div>';
    h += '<div class="kv"><span>Müşteri</span><b>' + say(i.musteri, 0) + ' (elle ' + say(i.elleServis, 0) + ' / pompacı ' + say(i.otoServis, 0) + ')</b></div>';
    h += '<div class="kv"><span>Tam isabet</span><b class="sariY">' + say(i.tamIsabet, 0) + '</b></div>';
    h += '<div class="kv"><span>Mutlu / mutsuz</span><b>' + say(i.mutlu, 0) + ' / ' + say(i.mutsuz, 0) + '</b></div>';
    h += '<div class="kv"><span>Dökülen yakıt</span><b class="kirmiziY">' + say(i.dokulen, 1) + ' L (' + tl(i.dokulenTl) + ')</b></div>';
    VERI.yakitSira.forEach(function (y) {
      h += '<div class="kv"><span>' + VERI.yakitlar[y].ad + ' satışı</span><b>' + say(i.satisL[y], 0) + ' ' + VERI.yakitlar[y].birim + '</b></div>';
    });
    h += '<div class="kv"><span>Marka puanı</span><b>' + Math.round(s.marka) + ' / 100</b></div>';
    h += '<div class="kv"><span>XP</span><b>' + say(s.xp, 0) + ' / ' + say(D.sonrakiXp(), 0) + '</b></div>';
    h += '</div>';

    if (i.gunluk.length) {
      h += '<div class="kart"><div class="baslik">Son günler</div>';
      var bas = Math.max(0, i.gunluk.length - 7);
      for (var g = i.gunluk.length - 1; g >= bas; g--) {
        var gn = i.gunluk[g];
        var net = gn.ciro - gn.gider;
        h += '<div class="kv"><span>Gün ' + gn.gun + '</span><b class="' + (net >= 0 ? 'yesilY' : 'kirmiziY') + '">' + tl(net) + ' <span class="mini">(' + tl(gn.ciro) + ' − ' + tl(gn.gider) + ')</span></b></div>';
      }
      h += '</div>';
    }

    if (this.bildirimGecmisi.length) {
      h += '<div class="kart"><div class="baslik">🔔 Son olaylar</div>';
      for (var n = this.bildirimGecmisi.length - 1; n >= Math.max(0, this.bildirimGecmisi.length - 12); n--) {
        var bg = this.bildirimGecmisi[n];
        h += '<div class="kv"><span>' + bg.saat + '</span><b style="font-weight:500;text-align:right">' + bg.baslik + (bg.metin ? ' — <span class="mini">' + bg.metin + '</span>' : '') + '</b></div>';
      }
      h += '</div>';
    }

    h += '<div class="kart"><div class="baslik">⚙️ Ayarlar</div>';
    var dm = (s.ayar && s.ayar.dolum) || 'ikisi';
    h += '<div class="kv"><span>Dolum şekli</span><b></b></div>';
    h += '<div class="sek" style="margin-bottom:10px">';
    [['tut', '✋ Basılı tut', 'Tabancayı sen tutarsın; tam isabette tam bahşiş.'],
     ['onayar', '🔢 Miktar gir', 'Miktarı yaz, pompa kendi durur; bahşiş yarı.'],
     ['ikisi', '⚡ İkisi de', 'Serviste iki seçenek birlikte çıkar.']].forEach(function (o) {
      h += '<button class="sec' + (dm === o[0] ? ' secili' : '') + '" onclick="UI.dolumModu(\'' + o[0] + '\')">';
      h += '<div class="st">' + o[1] + '</div><div class="ss">' + o[2] + '</div></button>';
    });
    h += '</div>';
    h += '<div class="kv"><span>Oyun hızı</span><b>' + s.hiz + '×</b></div>';
    h += '<div class="btngrup" style="margin-top:8px">';
    h += '<button class="btn kucuk ikincil" onclick="D.kaydet()&&UI.bildir(\'Kaydedildi\',\'\',\'iyi\')">💾 Kaydet</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.guncellemeKontrol()">⬇ Güncelleme denetle</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.sifirlaOnay()">🗑 Sıfırla</button>';
    h += '</div>';
    h += '<div class="not">Sürüm <b id="surumYazi">—</b> · Oyun tamamen çevrimdışı çalışır; internet yalnızca güncelleme denetiminde kullanılır.</div>';
    h += '</div>';

    h += '<div class="kart"><div class="baslik">🧪 Geliştirici</div>';
    h += '<div class="not">Kendi oyunun — istediğin gibi oyna. Bu düğmeler kaydını anında değiştirir.</div>';
    h += '<div class="btngrup" style="margin-top:10px">';
    h += '<button class="btn kucuk ikincil" onclick="UI.hile(\'para\')">+5.000.000 ₺</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.hile(\'para50\')">+50.000.000 ₺</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.hile(\'seviye\')">+3 seviye</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.hile(\'tank\')">Tankları doldur</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.hile(\'bakim\')">Her şeyi tamir et</button>';
    h += '</div></div>';

    h += '<div class="kart"><div class="baslik">💡 İpuçları</div>';
    for (var t = 0; t < VERI.ipuclari.length; t++) h += '<div class="kv"><span>·</span><b style="font-weight:500;text-align:right">' + VERI.ipuclari[t] + '</b></div>';
    h += '</div>';

    setTimeout(function () {
      var el = document.getElementById('surumYazi');
      if (el) { try { el.textContent = window.AndroidKabuk ? AndroidKabuk.surum() : 'web'; } catch (e) { el.textContent = '1.0'; } }
    }, 0);

    return h;
  },

  hile: function (tip) {
    var s = D.s, sb = D.sube();
    if (tip === 'para') { s.para += 5000000; this.bildir('+5.000.000 ₺', 'Kasaya eklendi.', 'iyi'); }
    else if (tip === 'para50') { s.para += 50000000; this.bildir('+50.000.000 ₺', 'Kasaya eklendi.', 'iyi'); }
    else if (tip === 'seviye') {
      s.seviye = Math.min(VERI.xpTablo.length, s.seviye + 3);
      s.xp = Math.max(s.xp, D.oncekiXp());
      this.bildir('Seviye ' + s.seviye, 'Yeni lokasyon ve tesisler açıldı.', 'iyi');
    } else if (tip === 'tank') {
      ['benzin', 'dizel', 'lpg'].forEach(function (y) { sb.tank[y].dolu = D.tankKap(sb, y); });
      this.bildir('Tanklar doldu', 'Bedava dolum.', 'iyi');
    } else if (tip === 'bakim') {
      for (var i = 0; i < sb.yapi.length; i++) if (sb.yapi[i]) { sb.yapi[i].bakim = 100; sb.yapi[i].arizali = false; }
      sb.temizlik = 100;
      this.bildir('Her şey tamir edildi', 'Bakım ve temizlik %100.', 'iyi');
    }
    D.kaydet();
    this.ciz();
  },

  sifirlaOnay: function () {
    var h = '<div class="not">Tüm ilerlemen silinir ve oyun en baştan başlar. Bu işlem geri alınamaz.</div>';
    h += '<button class="btn genis" style="margin-top:12px;background:var(--kirmizi);box-shadow:0 3px 0 #8f2020" onclick="UI.sifirla()">Evet, sıfırla</button>';
    h += '<button class="btn ikincil genis" style="margin-top:8px" onclick="UI.modalKapat()">Vazgeç</button>';
    this.modal('Oyunu sıfırla', h);
  },
  sifirla: function () {
    D.sil();
    D.yeni();
    this.modalKapat();
    this.sekmeGec('istasyon');
    this.bildir('Yeni oyun', 'Kasaba istasyonunda yeniden başladın.', 'iyi');
  },

  dolumModu: function (m) {
    if (!D.s.ayar) D.s.ayar = {};
    D.s.ayar.dolum = m;
    D.kaydet();
    this.bildir('Dolum şekli', m === 'tut' ? 'Basılı tut' : m === 'onayar' ? 'Miktar gir' : 'İkisi de', 'iyi');
    this.ciz();
  },

  guncellemeKontrol: function () {
    if (window.GUNCELLE) GUNCELLE.kontrol(true);
    else this.bildir('Güncelleme', 'Bu sürümde denetim yapılamıyor.', 'uyari');
  },

  /* =========================================================
     BİLDİRİM / BAŞARIM
     ========================================================= */
  bildir: function (baslik, metin, tip) {
    if (D.s) {
      this.bildirimGecmisi.push({ baslik: baslik, metin: metin || '', saat: ikiHane(D.s.saat) + ':' + ikiHane(D.s.dk) });
      if (this.bildirimGecmisi.length > 40) this.bildirimGecmisi.shift();
      if (this.sekme !== 'daha') this.okunmamis = Math.min(99, this.okunmamis + 1);
    }
    var k = document.getElementById('bildirimler');
    if (!k) return;
    var d = document.createElement('div');
    d.className = 'bld ' + (tip || '');
    d.innerHTML = '<b>' + baslik + '</b>' + (metin || '');
    k.appendChild(d);
    if (k.children.length > 4) k.removeChild(k.firstChild);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 4200);
  },

  basarimToast: function (ba) {
    var d = document.createElement('div');
    d.className = 'basarimToast';
    d.innerHTML = '<span class="bik">🏅</span><div style="flex:1"><div class="bad">Başarım: ' + ba.ad + '</div>' +
                  '<div class="baz">' + ba.aciklama + ' · +' + tl(ba.odul) + '</div></div>';
    document.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 4600);
    try { if (window.AndroidKabuk) AndroidKabuk.titret(70); } catch (e) {}
  }
};
