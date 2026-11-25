/* Akaryakıt Patronu — arayüz (izometrik sahne + paneller) */
'use strict';

const UI = {
  sekme: 'istasyon',
  modalAcik: false,
  adaylar: null,
  altSekme: { daha: 'ozet', insa: 'istasyon' },
  siparisMiktar: {},
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
    ['insa', 118, 88], ['market', 118, 61], ['siparis', 118, 34], ['personel', 118, 7],
    ['fiyat', 196, 88], ['subeler', 196, 64], ['banka', 196, 40], ['daha', 196, 16]
  ],
  fabAcik: false,

  /* =========================================================
     KURULUM
     ========================================================= */
  kur: function () {
    if (window.SES) SES.ayar(!(D.s.ayar && D.s.ayar.ses === false));
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
      h += '<button class="fabOge" id="fo_' + sk.id + '" style="transition-delay:' + (i * 26) + 'ms" ' +
           'data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1) + '" ' +
           'onclick="UI.fabSec(\'' + sk.id + '\')">' +
           '<span class="yuvar">' + sk.ik + '</span>' +
           (sk.id === 'daha' && this.okunmamis ? '<span class="rozetS">' + this.okunmamis + '</span>' : '') +
           '</button>';
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
        e.style.transform = 'translate(0,0) scale(.35)';
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
    this.rehberKontrol();
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

  cipSerit: function (panel, liste) {
    var aktif = this.altSekme[panel];
    var h = '<div class="cipSerit">';
    for (var i = 0; i < liste.length; i++) {
      var o = liste[i];
      h += '<button class="cip' + (aktif === o[0] ? ' aktif' : '') + '" onclick="UI.altSekmeGec(\'' + panel + '\',\'' + o[0] + '\')">' + o[1];
      if (o[2]) h += '<span class="sayi">' + o[2] + '</span>';
      h += '</button>';
    }
    return h + '</div>';
  },

  altSekmeGec: function (panel, id) {
    this.altSekme[panel] = id;
    var g = document.getElementById('govde');
    this.ciz();
    if (g) g.scrollTop = 0;
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

    /* ---- alt: yalnızca kritik durum bilgisi (büyük doldur butonu kaldırıldı) ---- */
    h += '<div class="hudAlt"' + (this.fabAcik ? ' style="display:none"' : '') + '>';
    if (this.tasinan !== null && this.tasinan !== undefined) {
      h += '<div class="tasimaSerit tik"><span>📦 Yeni yerini seç — boş betona dokun</span>';
      h += '<button onclick="UI.tasimaIptal()">İptal</button></div>';
    } else {
      h += this.rehberHtml();
    }
    if (sb.devredildi) {
      h += '<div class="yakitKart tik" style="justify-content:center">Bu şube devredildi — Şubeler\'den başka şubeye geç.</div>';
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
    /* taşıma modu: hedef hücre seçiliyor */
    if (this.tasinan !== null && this.tasinan !== undefined) {
      var kaynak = this.tasinan;
      if (SIM.yapiTasi(sb, kaynak, k)) { this.tasinan = null; this.ciz(); }
      return;
    }
    var y = sb.yapi[k];
    if (y && y.t === 'pompa' && y.mesgul) {
      var m = SIM.musteriBul(sb, y.mesgul);
      if (m && m.durum === 'pompada') { this.pompaSecim(k, m); return; }
    }
    if (!sb.beton[k]) this.betonModal(k);
    else if (!y) this.insaModal(k);
    else this.yapiModal(k);
  },

  /* pompada müşteri varken: doldur mu, pompa kartı mı? */
  pompaSecim: function (k, m) {
    var sb = D.sube();
    var atanan = null;
    for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].pompa === k) atanan = sb.personel[i];
    var h = '<div class="not">' + m.emoji + ' ' + m.arac + ' pompada bekliyor · ' + m.etiket + '</div>';
    h += '<button class="btn genis" style="margin-top:10px" onclick="UI.modalKapat();SERVIS.ac(' + k + ')">⛽ KENDİM DOLDUR</button>';
    h += '<button class="btn genis ikincil" style="margin-top:8px" onclick="UI.yapiModal(' + k + ')">🧑‍🔧 Pompa kartı · pompacı ' + (atanan ? 'atandı' : 'ata') + '</button>';
    this.modal('Pompa ' + (k + 1), h);
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
    h += '<button class="btn kucuk ikincil" onclick="UI.tasimayaBasla(' + k + ')">📦 Taşı ' + tl(SIM.tasimaBedeli(y)) + '</button>';
    h += '</div>';

    /* jeneratör yakıt deposu */
    if (y.t === 'jenerator') {
      var kap = SIM.jeneratorKap(y), dolu = y.depo || 0;
      var oran = Math.round((dolu / kap) * 100);
      h += '<div class="baslik" style="margin-top:14px">Jeneratör yakıt deposu</div>';
      h += '<div class="hedefCubuk" style="margin:6px 0"><i style="width:' + oran + '%;background:' + (oran < 20 ? 'linear-gradient(90deg,#8a2b2b,#f05252)' : 'linear-gradient(90deg,#2a7f4f,#3ec47a)') + '"></i></div>';
      h += '<div class="kv"><span>Depoda</span><b class="' + (oran < 20 ? 'kirmiziY' : '') + '">' + say(dolu, 0) + ' / ' + say(kap, 0) + ' L</b></div>';
      h += '<div class="kv"><span>Saatlik tüketim</span><b>' + say(9 * y.sv, 0) + ' L</b></div>';
      if (y.calismiyor) h += '<div class="kv"><span>Durum</span><b class="kirmiziY">Yakıtsız — durdu</b></div>';
      h += '<button class="btn genis" style="margin-top:8px" onclick="UI.jeneratorDoldur(' + k + ')">⛽ Dizel tankından doldur</button>';
      h += '<div class="not">Jeneratör istasyon dizelini doğrudan kullanmaz; deposunu sen doldurursun.</div>';
    }

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
        if (!bos.length) {
          var ucret = Math.round((VERI.personel.pompaci.maas[0] + VERI.personel.pompaci.maas[1]) / 2);
          h += '<div class="not">Boşta pompacı yok. Buradan hemen işe alıp bu pompaya atayabilirsin.</div>';
          h += '<button class="btn genis" style="margin-top:8px" onclick="UI.pompaciAlVeAta(' + k + ')">🧑‍🔧 Pompacı işe al ve ata · ~' + tl(ucret) + '/ay</button>';
        }
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
  tasinan: null,
  tasimayaBasla: function (k) {
    this.tasinan = k;
    this.modalKapat();
    this.bildir('Taşıma modu', 'Yapıyı koymak istediğin boş betona dokun.', 'uyari');
    this.ciz();
  },
  tasimaIptal: function () { this.tasinan = null; this.bildir('Taşıma iptal', '', 'uyari'); this.ciz(); },
  jeneratorDoldur: function (k) { if (SIM.jeneratorDoldur(D.sube(), k)) this.yapiModal(k); },

  pompaAta: function (pid, pompa, k) { SIM.pompaAta(D.sube(), pid, pompa); this.yapiModal(k); },
  pompaciAlVeAta: function (k) {
    var sb = D.sube();
    var p = SIM.personelAl(sb, 'pompaci');
    if (!p) return;
    SIM.pompaAta(sb, p.id, k);
    this.bildir('Pompacı işe alındı', p.ad + ' · Pompa ' + (k + 1), 'iyi');
    this.yapiModal(k);
  },

  /* =========================================================
     İNŞA PANELİ
     ========================================================= */
  insaHtml: function () {
    var sb = D.sube(), lok = D.lok(sb), s2 = D.s;
    var h = this.cipSerit('insa', [
      ['istasyon', '⛽ İstasyon'], ['tesisler', '🏪 Tesisler'],
      ['enerji', '⚡ Enerji'], ['arsa', '🧱 Arsa']
    ]);
    var k = this.altSekme.insa || 'istasyon';
    var bosHucre = this.bosHucreSayisi(sb);

    if (k === 'istasyon') {
      h += '<div class="kart"><div class="baslik">Pompalar · ' + D.pompalar(sb).length + '/' + lok.maxPompa + '</div>';
      h += '<div class="not">Her pompa benzin, dizel ve LPG verir; seçtiğin tür tam hızda akar. Elektrik için ayrı şarj ünitesi gerekir.</div>';
      h += '<div class="sek" style="margin-top:10px">';
      VERI.yakitSira.forEach(function (y) {
        var f = VERI.pompa.fiyat[y];
        var dolu = D.pompalar(sb).length >= lok.maxPompa;
        h += '<button class="sec" ' + (dolu || s2.para < f ? 'style="opacity:.45"' : '') + ' onclick="UI.otoPompa(\'' + y + '\')">';
        h += '<div class="st">' + VERI.yakitlar[y].emoji + ' ' + (y === 'ev' ? 'Şarj Ünitesi' : VERI.yakitlar[y].ad + ' pompası') + '</div>';
        h += '<div class="ss">' + tl(f) + ' · akış ' + say(y === 'ev' ? VERI.pompa.evAkis[0] : VERI.pompa.akis[0], 1) + ' ' + VERI.yakitlar[y].birim + '/sn · güç ' + VERI.pompa.guc[y] + ' kW</div></button>';
      });
      h += '</div>';
      var po = D.pompalar(sb);
      for (var p = 0; p < po.length; p++) {
        var pp = po[p].p;
        h += '<div class="satir" onclick="UI.yapiModal(' + po[p].i + ')"><div class="sol"><div class="ikon">' + (pp.yakit === 'ev' ? '🔌' : '⛽') + '</div>';
        h += '<div><div class="ad">Pompa ' + (po[p].i + 1) + ' · ' + VERI.yakitlar[pp.yakit].ad + '</div>';
        h += '<div class="alt">sv.' + pp.sv + ' · ' + say(D.akis(pp), 1) + ' birim/sn · bakım ' + Math.round(pp.bakim) + '%</div></div></div>';
        h += (pp.arizali ? '<span class="etiket kotu">ARIZA</span>' : pp.bakim < 45 ? '<span class="etiket uyari">bakım</span>' : '<span class="etiket iyi">çalışıyor</span>');
        h += '</div>';
      }
      h += '</div>';

      h += '<div class="kart"><div class="baslik">İşletme</div>';
      h += '<div class="kv"><span>Temizlik</span><b>' + Math.round(sb.temizlik) + '%</b></div>';
      h += '<div class="kv"><span>Bakım ortalaması</span><b>' + Math.round(D.bakimOrt(sb)) + '%</b></div>';
      h += '<div class="kv"><span>Günlük kira ve gider</span><b>' + tl(SIM.kiraGunluk(sb)) + '</b></div>';
      h += '<div class="kv"><span>Beklenen müşteri</span><b>' + say(SIM.saatlikMusteri(sb), 1) + ' / saat</b></div>';
      h += '<div class="btngrup" style="margin-top:10px">';
      h += '<button class="btn kucuk ikincil" onclick="UI.temizlikOnay()">🧹 Temizlik · ' + tl(2500 + (100 - sb.temizlik) * 220) + '</button>';
      h += '<button class="btn kucuk ikincil" onclick="UI.hepsiniTamirEt()">🛠 Hepsini tamir et</button>';
      h += '</div></div>';
      return h;
    }

    if (k === 'enerji') {
      var tuk = D.gucTuketim(sb), ure = D.gucUretim(sb);
      h += '<div class="kart"><div class="baslik">Güç dengesi</div>';
      h += '<div class="kv"><span>Üretim</span><b class="yesilY">' + say(ure, 1) + ' kW</b></div>';
      h += '<div class="kv"><span>Tüketim</span><b>' + say(tuk, 1) + ' kW</b></div>';
      h += '<div class="cubuk"><i style="width:' + kisitla(ure / Math.max(1, tuk) * 100, 0, 100) + '%;background:var(--yesil)"></i></div>';
      h += '<div class="not">' + (ure >= tuk ? 'Kendi üretimin yetiyor, şebekeye para ödemiyorsun.' :
        'Açığı şebekeden alıyorsun: saatte ' + tl((tuk - ure) * VERI.sebekeFiyat) + '. Kesintide pompalar yavaşlar.') + '</div>';
      h += '</div>';
      h += this.tesisKartlari(sb, ['gunes', 'jenerator', 'smr'], bosHucre);
      return h;
    }

    if (k === 'arsa') {
      h += '<div class="kart"><div class="baslik">Arsa</div>';
      h += '<div class="kv"><span>Mevcut parsel</span><b>' + sb.w + '×' + sb.h + ' = ' + (sb.w * sb.h) + ' hücre</b></div>';
      h += '<div class="kv"><span>Lokasyon sınırı</span><b>' + lok.w + '×' + lok.h + '</b></div>';
      var betonlu = 0, bosArsa = 0;
      for (var i = 0; i < sb.beton.length; i++) { if (sb.beton[i]) betonlu++; else bosArsa++; }
      h += '<div class="kv"><span>Beton dökülü</span><b>' + betonlu + '</b></div>';
      h += '<div class="kv"><span>Boş arsa</span><b>' + bosArsa + '</b></div>';
      h += '<div class="kv"><span>Üzerine yapı kurulabilir</span><b>' + bosHucre + '</b></div>';
      if (sb.w < lok.w || sb.h < lok.h) {
        h += '<button class="btn genis" style="margin-top:10px" onclick="UI.arsaGenislet()">Arsa satın al · ' + tl(SIM.arsaBedeli(sb)) + '</button>';
      } else h += '<div class="not">Bu lokasyonda arsanın tamamı senin.</div>';
      if (bosArsa) h += '<button class="btn ikincil genis" style="margin-top:8px" onclick="UI.betonDokOto()">Beton dök · ' + tl(SIM.betonFiyat(sb)) + '</button>';
      h += '<div class="not">Sahnedeki boş araziye dokunarak da beton dökebilir, beton hücreye dokunarak yapı kurabilirsin.</div>';
      h += '</div>';
      return h;
    }

    /* tesisler */
    h += this.tesisKartlari(sb, ['wc', 'havasu', 'market', 'totem', 'depo', 'kafe', 'mescit', 'atm', 'yangin', 'kamera', 'yikama', 'yag', 'adblue', 'ofis', 'lastikci', 'tirpark', 'restoran'], bosHucre);
    return h;
  },

  bosHucreSayisi: function (sb) {
    var n = 0;
    for (var i = 0; i < sb.yapi.length; i++) if (sb.beton[i] && !sb.yapi[i]) n++;
    return n;
  },

  tesisKartlari: function (sb, tipler, bosHucre) {
    var s2 = D.s;
    var h = '<div class="kart"><div class="baslik">Kurulabilir tesisler · ' + bosHucre + ' boş zemin</div>';
    h += '<div class="not">Satın alınca ilk uygun boş zemine kurulur. Sahnede dokunup yükseltebilir, bakım yapabilir ya da yıkabilirsin.</div>';
    h += '<div class="sek" style="margin-top:10px">';
    for (var i = 0; i < tipler.length; i++) {
      var t = tipler[i], tan = VERI.binalar[t];
      if (!tan) continue;
      var kilit = s2.seviye < tan.seviyeSart;
      var pahali = s2.para < tan.fiyat;
      var adet = D.binaSayisi(sb, t);
      h += '<button class="sec" ' + (kilit || pahali ? 'style="opacity:.45"' : '') + ' onclick="UI.otoKur(\'' + t + '\')">';
      h += '<div class="st">' + tan.emoji + ' ' + tan.ad + (adet ? ' <span class="etiket">' + adet + '</span>' : '') + '</div>';
      h += '<div class="ss">' + tl(tan.fiyat) + (kilit ? ' · <span class="kirmiziY">Sv ' + tan.seviyeSart + '</span>' : '');
      if (tan.uretim) h += '<br>+' + tan.uretim + ' kW üretim';
      else if (tan.guc) h += '<br>' + tan.guc + ' kW tüketim';
      if (tan.gelir) h += ' · ziyaret başı ' + tl(tan.gelir);
      if (tan.konfor) h += ' · konfor +' + tan.konfor;
      h += '<br>' + tan.aciklama + '</div></button>';
    }
    h += '</div></div>';
    return h;
  },

  /* ilk uygun boş zemine kur */
  bosZeminBul: function (sb, otoBeton) {
    for (var i = 0; i < sb.yapi.length; i++) if (sb.beton[i] && !sb.yapi[i]) return i;
    if (!otoBeton) return -1;
    for (var j = 0; j < sb.beton.length; j++) {
      if (!sb.beton[j]) { if (SIM.betonDok(sb, j)) return j; return -1; }
    }
    return -1;
  },

  otoKur: function (t) {
    var sb = D.sube();
    var i = SIM.yerAc(sb, 'bina');
    if (i < 0) { this.bildir('Yer yok', 'Önce arsa satın alıp beton dök.', 'kotu'); this.altSekmeGec('insa', 'arsa'); return; }
    if (SIM.binaKur(sb, i, t)) this.ciz();
  },
  otoPompa: function (y) {
    var sb = D.sube();
    var i = SIM.yerAc(sb, 'pompa');
    if (i < 0) { this.bildir('Yer yok', 'Önce arsa satın alıp beton dök.', 'kotu'); this.altSekmeGec('insa', 'arsa'); return; }
    if (SIM.pompaKur(sb, i, y)) this.ciz();
  },
  betonDokOto: function () {
    var sb = D.sube();
    for (var i = 0; i < sb.beton.length; i++) if (!sb.beton[i]) { if (SIM.betonDok(sb, i)) this.ciz(); return; }
  },
  hepsiniTamirEt: function () {
    var sb = D.sube(), sayac = 0, bedel = 0;
    for (var i = 0; i < sb.yapi.length; i++) {
      var y = sb.yapi[i];
      if (!y || (!y.arizali && y.bakim > 80)) continue;
      var f = SIM.bakimBedeli(y);
      if (D.s.para < f) break;
      if (SIM.bakimYap(sb, i)) { sayac++; bedel += f; }
    }
    this.bildir(sayac ? sayac + ' ekipman bakıldı' : 'Bakım gerekmiyor', sayac ? tl(bedel) + ' harcandı' : '', sayac ? 'iyi' : 'uyari');
    this.ciz();
  },

  arsaGenislet: function () { if (SIM.arsaGenislet(D.sube())) this.ciz(); },

  /* =========================================================
     FİYAT
     ========================================================= */
  fiyatHtml: function () {
    var sb = D.sube(), s = D.s;
    var h = this.programHtml(sb);
    h += '<div class="kart"><div class="baslik">Pompa fiyatların</div>';
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
      h += '<div class="adim" style="margin:4px 0 6px">';
      h += '<button class="az" onclick="UI.fiyatAdim(\'' + y + '\',-0.25)">−</button>';
      h += '<div class="deger">' + say(f, 2) + ' ₺</div>';
      h += '<button class="cok" onclick="UI.fiyatAdim(\'' + y + '\',0.25)">+</button>';
      h += '</div>';
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
    var fk = SIM.fiyatKat(sb);
    h += '<div class="kv"><span>Fiyatın müşteri akışına etkisi</span><b class="' + (fk >= 1 ? 'yesilY' : 'kirmiziY') + '">' + (fk >= 1 ? '+' : '') + Math.round((fk - 1) * 100) + '%</b></div>';
    h += '</div>';
    return h;
  },

  fiyatAdim: function (y, d) {
    var sb = D.sube();
    var maliyet = y === 'ev' ? SIM.elektrikMaliyet(sb) : D.toptanFiyat(y);
    sb.fiyat[y] = +kisitla(sb.fiyat[y] + d, maliyet * 0.9, maliyet * 1.9).toFixed(2);
    this.panelYenile();
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
    var sb = D.sube(), s2 = D.s, self = this;
    var h = '';

    if (sb.siparis.length) {
      h += '<div class="kart"><div class="baslik">Yoldaki tankerler</div>';
      for (var i = 0; i < sb.siparis.length; i++) {
        var o = sb.siparis[i];
        h += '<div class="satir"><div class="sol"><div class="ikon">🚚</div><div><div class="ad">' + say(o.miktar, 0) + ' L ' + VERI.yakitlar[o.yakit].ad + '</div>';
        h += '<div class="alt">' + say(o.birim, 2) + ' ₺/L · toplam ' + tl(o.miktar * o.birim) + '</div></div></div>';
        h += '<span class="etiket uyari">' + o.kalan + ' dk</span></div>';
      }
      h += '</div>';
    }

    ['benzin', 'dizel', 'lpg'].forEach(function (y) {
      var t = sb.tank[y], kap = D.tankKap(sb, y);
      t.kap = kap;
      var yer = Math.max(0, Math.floor(kap - t.dolu));
      var birim = D.toptanFiyat(y) * (VERI.tedarikciler[sb.tedarikci] || VERI.tedarikciler.standart).carpan;
      var oran = kap ? (t.dolu / kap) * 100 : 0;
      if (self.siparisMiktar[y] === undefined) self.siparisMiktar[y] = Math.min(yer, Math.round(kap * 0.5 / 100) * 100);
      var mik = kisitla(self.siparisMiktar[y], 0, yer);
      self.siparisMiktar[y] = mik;

      h += '<div class="kart"><div class="satir" style="border:none;padding-top:0">';
      h += '<div class="sol"><div class="ikon">' + VERI.yakitlar[y].emoji + '</div><div><div class="ad">' + VERI.yakitlar[y].ad + '</div>';
      h += '<div class="alt">' + say(t.dolu, 0) + ' / ' + say(kap, 0) + ' L · alış ' + say(birim, 2) + ' ₺/L</div></div></div>';
      h += '<span class="etiket ' + (oran < 15 ? 'kotu' : oran < 35 ? 'uyari' : 'iyi') + '">%' + Math.round(oran) + '</span></div>';
      h += '<div class="cubuk" style="margin-bottom:9px"><i style="width:' + oran + '%;background:' + (oran < 25 ? 'var(--kirmizi)' : 'var(--yesil)') + '"></i></div>';

      h += '<div class="adim">';
      h += '<button class="az" onclick="UI.siparisAdim(\'' + y + '\',-200)">−</button>';
      h += '<div class="deger"><input type="number" inputmode="numeric" value="' + mik + '" oninput="UI.siparisYaz(\'' + y + '\',this.value)"></div>';
      h += '<button class="cok" onclick="UI.siparisAdim(\'' + y + '\',200)">+</button>';
      h += '<button class="btn kucuk ikincil" onclick="UI.siparisOran(\'' + y + '\',1)">MAX</button>';
      h += '</div>';
      h += '<div class="kisayol">';
      [[0.25, '%25'], [0.5, '%50'], [0.75, '%75'], [1, 'FULL']].forEach(function (o2) {
        h += '<button onclick="UI.siparisOran(\'' + y + '\',' + o2[0] + ')">' + o2[1] + '</button>';
      });
      h += '<span class="mini" style="margin-left:auto;align-self:center">' + say(yer, 0) + ' L yer var</span>';
      h += '</div>';
      h += '<button class="btn genis" style="margin-top:9px' + (mik < 50 ? ';opacity:.45' : '') + '" onclick="UI.siparis(\'' + y + '\',' + mik + ')">';
      h += 'SİPARİŞ VER · ' + tl(mik * birim) + '</button>';
      h += '</div>';
    });

    h += '<div class="kart"><div class="baslik">Tedarikçi</div>';
    h += '<div class="sek">';
    for (var tk in VERI.tedarikciler) {
      var td = VERI.tedarikciler[tk];
      h += '<button class="sec' + (sb.tedarikci === tk ? ' secili' : '') + '" onclick="UI.tedarikciSec(\'' + tk + '\')">';
      h += '<div class="st">' + td.emoji + ' ' + td.ad + '</div><div class="ss">' + td.aciklama + '</div></button>';
    }
    h += '</div>';
    if (s2.rafineri.aktif) {
      h += '<div class="not">Rafinerin devrede: toptan fiyattan %' + Math.round(VERI.rafineri.indirim[s2.rafineri.sv] * 100) + ' indirim, teslim 8-25 dakika, nakliye bedeli yok.</div>';
    } else {
      h += '<div class="not">Rafineri kurarsan tedarik hem ucuzlar hem hızlanır. Banka panelinden kredi çekip yatırım yapabilirsin.</div>';
    }
    h += '</div>';
    return h;
  },

  siparisAdim: function (y, d) {
    var sb = D.sube();
    var yer = Math.max(0, Math.floor(D.tankKap(sb, y) - sb.tank[y].dolu));
    this.siparisMiktar[y] = kisitla((this.siparisMiktar[y] || 0) + d, 0, yer);
    this.panelYenile();
  },
  siparisYaz: function (y, v) {
    var sb = D.sube();
    var yer = Math.max(0, Math.floor(D.tankKap(sb, y) - sb.tank[y].dolu));
    this.siparisMiktar[y] = kisitla(Math.round(+v || 0), 0, yer);
  },
  siparisOran: function (y, o) {
    var sb = D.sube();
    var yer = Math.max(0, Math.floor(D.tankKap(sb, y) - sb.tank[y].dolu));
    this.siparisMiktar[y] = Math.floor(yer * o);
    this.panelYenile();
  },
  tedarikciSec: function (t) {
    D.sube().tedarikci = t;
    this.bildir('Tedarikçi: ' + VERI.tedarikciler[t].ad, VERI.tedarikciler[t].aciklama, 'iyi');
    this.panelYenile();
  },
  panelYenile: function () {
    var govde = document.getElementById('govde');
    var kay = govde ? govde.scrollTop : 0;
    this.ciz();
    if (govde) govde.scrollTop = kay;
  },

  siparis: function (y, mik) {
    if (mik < 50) { this.bildir('Miktar çok düşük', 'En az 50 L sipariş verebilirsin.', 'uyari'); return; }
    if (SIM.siparisVer(D.sube(), y, mik)) {
      this.siparisMiktar[y] = 0;
      if (this.modalAcik) this.modalKapat(); else this.ciz();
    }
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
    h += '<button class="btn kucuk" onclick="MINI.kasaBaslat()">🧾 Kasaya geç</button>';
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
    var s2 = D.s;
    var hazirGorev = 0;
    for (var g = 0; g < s2.gorevler.length; g++) {
      if (!s2.gorevler[g].alindi && SIM.gorevIlerleme(s2.gorevler[g]) >= s2.gorevler[g].hedef) hazirGorev++;
    }
    var h = this.cipSerit('daha', [
      ['ozet', '📊 Özet'], ['muhasebe', '🧾 Muhasebe'],
      ['gorevler', '🎯 Görevler', hazirGorev || ''], ['sozlesme', '✍️ Sözleşmeler'],
      ['filo', '🤝 Toplu Anlaşma'], ['basarim', '🏆 Başarımlar'], ['ayarlar', '⚙️ Ayarlar']
    ]);
    var k = this.altSekme.daha || 'ozet';
    if (k === 'muhasebe') return h + this.muhasebeHtml();
    if (k === 'gorevler') return h + this.gorevlerHtml();
    if (k === 'sozlesme') return h + this.sozlesmeHtml();
    if (k === 'filo') return h + this.filoHtml();
    if (k === 'basarim') return h + this.basarimHtml();
    if (k === 'ayarlar') return h + this.ayarlarHtml();
    return h + this.ozetHtml();
  },

  ozetHtml: function () {
    var s2 = D.s, i = s2.ist, sb = D.sube();
    var h = '<div class="kart"><div class="baslik">Bugün</div>';
    var b = sb.bugun || {};
    h += '<div class="kv"><span>Müşteri</span><b>' + say(b.musteri || 0, 0) + '</b></div>';
    h += '<div class="kv"><span>Satılan yakıt</span><b>' + say(b.litre || 0, 0) + ' L</b></div>';
    h += '<div class="kv"><span>Ciro</span><b class="yesilY">' + tl(b.ciro || 0) + '</b></div>';
    h += '<div class="kv"><span>Tam isabet</span><b class="sariY">' + say(b.isabet || 0, 0) + '</b></div>';
    h += '<div class="kv"><span>Kaçan müşteri</span><b class="' + ((b.kacan || 0) > 5 ? 'kirmiziY' : '') + '">' + say(b.kacan || 0, 0) + '</b></div>';
    h += '</div>';

    h += '<div class="kart"><div class="baslik">⚙️ Rafineri</div>';
    if (!s2.rafineri.aktif) {
      h += '<div class="not">' + VERI.rafineri.aciklama + '</div>';
      h += '<div class="kv" style="margin-top:8px"><span>Kuruluş</span><b>' + tl(VERI.rafineri.fiyat) + '</b></div>';
      h += '<div class="kv"><span>Gereken seviye</span><b>' + VERI.rafineri.seviyeSart + '</b></div>';
      h += '<button class="btn genis' + (s2.seviye < VERI.rafineri.seviyeSart || s2.para < VERI.rafineri.fiyat ? ' kapali' : '') + '" style="margin-top:10px" onclick="SIM.rafineriKur()&&UI.ciz()">Rafineri kur</button>';
    } else {
      h += '<div class="kv"><span>Seviye</span><b>' + s2.rafineri.sv + '</b></div>';
      h += '<div class="kv"><span>Tedarik indirimi</span><b class="yesilY">%' + Math.round(VERI.rafineri.indirim[s2.rafineri.sv] * 100) + '</b></div>';
      h += '<div class="kv"><span>Tanker</span><b>' + s2.rafineri.tanker + '</b></div>';
      h += '<div class="btngrup" style="margin-top:10px">';
      if (s2.rafineri.sv < VERI.rafineri.indirim.length - 1)
        h += '<button class="btn kucuk" onclick="SIM.rafineriYukselt()&&UI.ciz()">⬆ Yükselt ' + tl(VERI.rafineri.svFiyat[s2.rafineri.sv]) + '</button>';
      h += '<button class="btn kucuk ikincil" onclick="SIM.tankerAl()&&UI.ciz()">🚛 Tanker al ' + tl(VERI.rafineri.tankerFiyat) + '</button>';
      h += '</div>';
    }
    h += '</div>';

    h += '<div class="kart"><div class="baslik">Ömür boyu</div>';
    h += '<div class="kv"><span>Toplam ciro</span><b>' + tl(i.ciro) + '</b></div>';
    h += '<div class="kv"><span>Toplam kâr</span><b class="' + (i.kar >= 0 ? 'yesilY' : 'kirmiziY') + '">' + tl(i.kar) + '</b></div>';
    h += '<div class="kv"><span>Müşteri</span><b>' + say(i.musteri, 0) + ' (elle ' + say(i.elleServis, 0) + ' / pompacı ' + say(i.otoServis, 0) + ')</b></div>';
    h += '<div class="kv"><span>Tam isabet</span><b class="sariY">' + say(i.tamIsabet, 0) + '</b></div>';
    h += '<div class="kv"><span>Dökülen yakıt</span><b class="kirmiziY">' + say(i.dokulen, 1) + ' L (' + tl(i.dokulenTl) + ')</b></div>';
    VERI.yakitSira.forEach(function (y) {
      h += '<div class="kv"><span>' + VERI.yakitlar[y].ad + '</span><b>' + say(i.satisL[y], 0) + ' ' + VERI.yakitlar[y].birim + '</b></div>';
    });
    h += '<div class="kv"><span>Marka puanı</span><b>' + Math.round(s2.marka) + ' / 100</b></div>';
    h += '<div class="kv"><span>XP</span><b>' + say(s2.xp, 0) + ' / ' + say(D.sonrakiXp(), 0) + '</b></div>';
    h += '</div>';
    return h;
  },

  /* son günlerin ciro/gider grafiği (saf SVG) */
  ciroGrafigi: function (gunluk) {
    var veri = gunluk.slice(-14);
    var enb = 1;
    for (var i = 0; i < veri.length; i++) enb = Math.max(enb, veri[i].ciro, veri[i].gider);
    var W = 320, H = 120, pad = 6;
    var gen = (W - pad * 2) / veri.length;
    var h = '<div class="kart"><div class="baslik">Ciro / gider eğrisi</div>';
    h += '<div class="grafikKutu"><svg viewBox="0 0 ' + W + ' ' + (H + 18) + '" preserveAspectRatio="none">';
    /* yatay kılavuzlar */
    for (var g = 1; g <= 3; g++) {
      var gy = H - (H * g / 4);
      h += '<line x1="0" y1="' + gy + '" x2="' + W + '" y2="' + gy + '" stroke="rgba(255,255,255,.07)" stroke-width="1"/>';
    }
    for (var k = 0; k < veri.length; k++) {
      var x = pad + k * gen;
      var hc = Math.max(1, (veri[k].ciro / enb) * (H - 10));
      var hg = Math.max(1, (veri[k].gider / enb) * (H - 10));
      var bw = gen * 0.34;
      h += '<rect x="' + (x + gen * 0.08) + '" y="' + (H - hc) + '" width="' + bw + '" height="' + hc + '" rx="2" fill="#3ec47a"/>';
      h += '<rect x="' + (x + gen * 0.5) + '" y="' + (H - hg) + '" width="' + bw + '" height="' + hg + '" rx="2" fill="#e2683a"/>';
    }
    /* net çizgi */
    var nokta = [];
    for (var n = 0; n < veri.length; n++) {
      var net = veri[n].ciro - veri[n].gider;
      var ny = H - kisitla((net / enb) * (H - 10), -H + 12, H - 10);
      nokta.push((pad + n * gen + gen / 2) + ',' + ny);
    }
    h += '<polyline points="' + nokta.join(' ') + '" fill="none" stroke="#ffd166" stroke-width="2" stroke-linejoin="round"/>';
    h += '<text x="2" y="' + (H + 14) + '" fill="#8c98a8" font-size="9">gün ' + veri[0].gun + '</text>';
    h += '<text x="' + (W - 42) + '" y="' + (H + 14) + '" fill="#8c98a8" font-size="9">gün ' + veri[veri.length - 1].gun + '</text>';
    h += '</svg></div>';
    h += '<div class="grafikLejant"><span><i style="background:#3ec47a"></i>Ciro</span><span><i style="background:#e2683a"></i>Gider</span><span><i style="background:#ffd166"></i>Net</span></div>';
    h += '</div>';
    return h;
  },

  programHtml: function (sb) {
    var h = '<div class="kart"><div class="baslik">Pazarlama programları</div>';
    h += '<div class="not">Açık programların aylık gideri her gün otomatik düşer; istediğin an kapatabilirsin.</div>';
    var sira = ['sadakat', 'premium', 'yikamaAbone'];
    for (var i = 0; i < sira.length; i++) {
      var id = sira[i], t = VERI.programlar[id];
      var acik = !!(sb.program && sb.program[id]);
      var kilit = D.s.seviye < t.seviyeSart;
      h += '<div class="progKart' + (acik ? ' acik' : '') + '">';
      h += '<div class="pkUst"><span class="pkIk">' + t.emoji + '</span>';
      h += '<div style="flex:1"><div class="ad">' + t.ad + (acik ? ' <span class="etiket iyi">açık</span>' : '') + '</div>';
      h += '<div class="alt">' + t.aciklama + '</div></div></div>';
      h += '<div class="fkSatir"><span>Kurulum</span><b>' + (acik ? 'ödendi' : tl(t.kurulum)) + '</b></div>';
      h += '<div class="fkSatir"><span>Aylık gider</span><b class="kirmiziY">' + tl(t.aylik) + '</b></div>';
      if (kilit) h += '<div class="fkSatir"><span>Kilit</span><b class="sariY">Seviye ' + t.seviyeSart + '</b></div>';
      h += '<button class="btn genis ' + (acik ? 'ikincil' : '') + '" style="margin-top:8px' + (kilit && !acik ? ';opacity:.45' : '') + '" onclick="UI.programAc(\'' + id + '\')">';
      h += (acik ? 'Programı kapat' : t.emoji + ' Programı aç') + '</button>';
      h += '</div>';
    }
    h += '</div>';
    return h;
  },
  programAc: function (id) { if (SIM.programAc(D.sube(), id)) this.panelYenile(); },

  muhasebeHtml: function () {
    var s2 = D.s, i = s2.ist;
    var h = '<div class="kart"><div class="baslik">Bugünün darboğazları</div>';
    var liste = SIM.darbogazlar();
    for (var d = 0; d < liste.length; d++) {
      var o = liste[d];
      h += '<div class="darbo"><div class="met"><div class="bas">' + o.baslik + '</div><div class="acik">' + o.metin + '</div></div>';
      h += '<button class="btn minik" onclick="UI.sekmeGec(\'' + o.sekme + '\')">' + o.dugme + '</button></div>';
    }
    h += '</div>';

    if (i.gunluk.length > 1) h += this.ciroGrafigi(i.gunluk);

    if (i.gunluk.length) {
      h += '<div class="kart"><div class="baslik">Gün dökümü</div>';
      h += '<div class="satir" style="border-bottom:1px solid var(--cizgi)"><div class="sol"><div class="alt">GÜN</div></div>';
      h += '<div style="display:flex;gap:18px"><div class="alt">CİRO</div><div class="alt">NET</div></div></div>';
      var bas = Math.max(0, i.gunluk.length - 10);
      for (var g = i.gunluk.length - 1; g >= bas; g--) {
        var gn = i.gunluk[g];
        var net = gn.ciro - gn.gider;
        h += '<div class="satir"><div class="sol"><div class="ad">Gün ' + gn.gun + '</div></div>';
        h += '<div style="text-align:right"><div>' + tl(gn.ciro) + '</div>';
        h += '<div class="mini ' + (net >= 0 ? 'yesilY' : 'kirmiziY') + '">' + tl(net) + '</div></div></div>';
      }
      h += '</div>';
    }

    var gunlukMaas = 0, gunlukKira = 0;
    for (var j = 0; j < s2.subeler.length; j++) {
      var sbx = s2.subeler[j];
      if (sbx.devredildi) continue;
      for (var p = 0; p < sbx.personel.length; p++) gunlukMaas += sbx.personel[p].maas / 30;
      gunlukKira += SIM.kiraGunluk(sbx);
    }
    h += '<div class="kart"><div class="baslik">Gider tablosu (günlük)</div>';
    h += '<div class="kv"><span>Personel</span><b>' + tl(gunlukMaas) + '</b></div>';
    h += '<div class="kv"><span>Kira ve işletme</span><b>' + tl(gunlukKira) + '</b></div>';
    h += '<div class="kv"><span>Kredi taksitleri</span><b class="' + (SIM.aylikTaksitToplam() ? 'kirmiziY' : '') + '">' + tl(SIM.aylikTaksitToplam() / 30) + '</b></div>';
    h += '<div class="kv" style="border-top:1px solid var(--cizgi);margin-top:6px;padding-top:8px"><span><b>Toplam</b></span><b>' + tl(gunlukMaas + gunlukKira + SIM.aylikTaksitToplam() / 30) + '</b></div>';
    h += '<button class="btn ikincil genis" style="margin-top:10px" onclick="UI.sekmeGec(\'banka\')">🏦 Varlık ve borç dökümü</button>';
    h += '</div>';
    return h;
  },

  gorevlerHtml: function () {
    var s2 = D.s;
    if (!s2.gorevler.length || s2.gorevGun !== s2.gun) SIM.gorevleriYenile();
    var h = '<div class="kart"><div class="baslik">Günlük görevler · gün ' + s2.gun + '</div>';
    h += '<div class="not">Görevler her gün yenilenir, ilerleme aktif şubenin bugünkü işine göre sayılır.</div>';
    for (var i = 0; i < s2.gorevler.length; i++) {
      var g = s2.gorevler[i];
      var ilerleme = SIM.gorevIlerleme(g);
      var oran = kisitla(ilerleme / g.hedef * 100, 0, 100);
      var bitti = ilerleme >= g.hedef;
      h += '<div class="gorev"><div class="ust"><div><div class="ad">' + g.ad + '</div>';
      h += '<div class="say">' + say(Math.min(ilerleme, g.hedef), 0) + ' / ' + say(g.hedef, 0) + ' ' + g.birim + '</div></div>';
      if (g.alindi) h += '<span class="etiket iyi">alındı ✓</span>';
      else if (bitti) h += '<button class="btn minik" onclick="UI.gorevAl(\'' + g.id + '\')">Ödülü al<br><span class="mini">' + tl(g.odul) + '</span></button>';
      else h += '<span class="etiket">' + tl(g.odul) + '</span>';
      h += '</div><div class="cubuk"><i style="width:' + oran + '%;background:' + (bitti ? 'var(--yesil)' : 'var(--mavi)') + '"></i></div></div>';
    }
    h += '</div>';
    return h;
  },

  gorevAl: function (gid) { if (SIM.gorevOdulAl(gid)) this.panelYenile(); },

  sozlesmeHtml: function () {
    var s2 = D.s;
    if (!s2.sozlesmeTeklif.length) SIM.sozlesmeTeklifleriUret();
    var h = '';
    if (s2.sozlesmeler.length) {
      h += '<div class="kart"><div class="baslik">Yürüyen sözleşmeler</div>';
      for (var i = 0; i < s2.sozlesmeler.length; i++) {
        var sz = s2.sozlesmeler[i];
        var sb = s2.subeler[sz.sube] || D.sube();
        var bugunku = (sb.gunlukYakit && sb.gunlukYakit[sz.yakit]) || 0;
        var oran = kisitla(bugunku / sz.gunlukL * 100, 0, 100);
        h += '<div class="gorev"><div class="ust"><div><div class="ad">' + sz.emoji + ' ' + sz.ad + ' · ' + VERI.yakitlar[sz.yakit].ad + '</div>';
        h += '<div class="say">bugün ' + say(bugunku, 0) + ' / ' + say(sz.gunlukL, 0) + ' L · kalan ' + sz.kalanGun + ' gün</div></div>';
        h += '<span class="etiket ' + (sz.kacirilan ? 'kotu' : 'iyi') + '">' + (sz.kacirilan ? sz.kacirilan + ' gün eksik' : 'tam') + '</span></div>';
        h += '<div class="cubuk"><i style="width:' + oran + '%;background:' + (oran >= 100 ? 'var(--yesil)' : 'var(--sari)') + '"></i></div>';
        h += '<div class="mini" style="margin-top:4px">Bitişte prim ' + tl(sz.prim) + ' · eksik günde kesinti ' + tl(Math.round(sz.ceza / sz.gun)) + '</div></div>';
      }
      h += '</div>';
    }
    h += '<div class="kart"><div class="baslik">Teklifler</div>';
    h += '<div class="not">Kurumsal müşteri günlük taahhüt ister. Normal satışların taahhüde sayılır; tuttuğun gün teşvik alırsın, tutmadığın gün kesinti yersin. Sonunda eksiksizse prim.</div>';
    for (var t = 0; t < s2.sozlesmeTeklif.length; t++) {
      var tk = s2.sozlesmeTeklif[t];
      h += '<div class="satir"><div class="sol"><div class="ikon">' + tk.emoji + '</div><div><div class="ad">' + tk.ad + ' · ' + VERI.yakitlar[tk.yakit].ad + '</div>';
      h += '<div class="alt">' + tk.gun + ' gün · günde ' + say(tk.gunlukL, 0) + ' L · ' + say(tk.fiyat, 2) + ' ₺/L<br>prim ' + tl(tk.prim) + ' · ceza ' + tl(tk.ceza) + '</div></div></div>';
      h += '<button class="btn minik" onclick="UI.sozlesmeImzala(\'' + tk.id + '\')">İmzala</button></div>';
    }
    if (!s2.sozlesmeTeklif.length) h += '<div class="bos">Şu an teklif yok, yarın yenilenir.</div>';
    h += '</div>';
    return h;
  },

  sozlesmeImzala: function (tid) { if (SIM.sozlesmeImzala(tid)) this.panelYenile(); },

  filoHtml: function () {
    var s2 = D.s;
    if (!s2.filoTeklif.length) SIM.filoTeklifleriUret();
    var h = '';
    if (s2.filolar.length) {
      h += '<div class="kart"><div class="baslik">Yürüyen toplu anlaşmalar</div>';
      for (var i = 0; i < s2.filolar.length; i++) {
        var f = s2.filolar[i];
        var oran = kisitla(f.bugunTeslim / f.gunlukL * 100, 0, 100);
        var sonraki = null;
        for (var sa = 0; sa < f.saatler.length; sa++) if (f.saatler[sa] > s2.saat && sonraki === null) sonraki = f.saatler[sa];
        if (sonraki === null) sonraki = f.saatler[0];
        h += '<div class="gorev"><div class="ust"><div><div class="ad">' + f.emoji + ' ' + f.ad + '</div>';
        h += '<div class="say">' + f.aracSayi + ' araç × ' + say(f.aracL, 0) + ' L · ' + VERI.yakitlar[f.yakit].ad + ' · %' + say(f.iskonto * 100, 0) + ' iskonto</div></div>';
        h += '<span class="etiket ' + (f.kacirilan ? 'kotu' : 'iyi') + '">' + f.kalanGun + ' gün</span></div>';
        h += '<div class="cubuk"><i style="width:' + oran + '%;background:' + (oran >= 80 ? 'var(--yesil)' : 'var(--sari)') + '"></i></div>';
        h += '<div class="mini" style="margin-top:4px">Bugün ' + say(f.bugunTeslim, 0) + ' / ' + say(f.gunlukL, 0) + ' L · sıradaki konvoy ' + ikiHane(sonraki) + ':00 · prim ' + tl(f.prim) + '</div></div>';
      }
      h += '</div>';
    }
    h += '<div class="kart"><div class="baslik">Filo teklifleri</div>';
    h += '<div class="not">Toplu anlaşmada araçlar belirlenen saatlerde konvoy halinde gelir. İskontolu satarsın ama hacim garantilidir; peşinat anında ödenir. Günlük hedefin %80\'ini tutturamazsan kesinti var.</div>';
    for (var t = 0; t < s2.filoTeklif.length; t++) {
      var tk = s2.filoTeklif[t];
      var saatMetin = [];
      for (var q = 0; q < tk.saatler.length; q++) saatMetin.push(ikiHane(tk.saatler[q]) + ':00');
      h += '<div class="filoKart"><div class="fkUst"><span class="fkIk">' + tk.emoji + '</span>';
      h += '<div><div class="ad">' + tk.ad + '</div><div class="alt">' + tk.aciklama + '</div></div></div>';
      h += '<div class="fkSatir"><span>Yakıt</span><b>' + VERI.yakitlar[tk.yakit].ad + '</b></div>';
      h += '<div class="fkSatir"><span>Konvoy</span><b>' + tk.aracSayi + ' araç × ' + say(tk.aracL, 0) + ' L</b></div>';
      h += '<div class="fkSatir"><span>Saatler</span><b>' + saatMetin.join(' · ') + '</b></div>';
      h += '<div class="fkSatir"><span>Günlük hacim</span><b>' + say(tk.gunlukL, 0) + ' L</b></div>';
      h += '<div class="fkSatir"><span>İskonto</span><b class="sariY">%' + say(tk.iskonto * 100, 1) + '</b></div>';
      h += '<div class="fkSatir"><span>Süre</span><b>' + tk.gun + ' gün</b></div>';
      h += '<div class="fkSatir"><span>Peşinat</span><b class="yesilY">' + tl(tk.pesin) + '</b></div>';
      h += '<div class="fkSatir"><span>Bitiş primi</span><b class="yesilY">' + tl(tk.prim) + '</b></div>';
      h += '<button class="btn genis" style="margin-top:8px" onclick="UI.filoImzala(\'' + tk.id + '\')">🤝 Anlaşmayı imzala</button></div>';
    }
    if (!s2.filoTeklif.length) h += '<div class="bos">Şu an filo teklifi yok. Seviyen yükseldikçe ve yakıt çeşidin arttıkça gelir.</div>';
    h += '</div>';
    return h;
  },

  filoImzala: function (tid) { if (SIM.filoImzala(tid)) this.panelYenile(); },

  basarimHtml: function () {
    var s2 = D.s;
    var kazanilan = s2.basarimlar || [];
    var h = '<div class="kart"><div class="baslik">Başarımlar · ' + kazanilan.length + '/' + VERI.basarimlar.length + '</div>';
    for (var b = 0; b < VERI.basarimlar.length; b++) {
      var ba = VERI.basarimlar[b];
      var alindi = kazanilan.indexOf(ba.id) >= 0;
      h += '<div class="satir"><div class="sol"><div class="ikon">' + (alindi ? '🏅' : '🔒') + '</div>';
      h += '<div><div class="ad"' + (alindi ? '' : ' style="opacity:.6"') + '>' + ba.ad + '</div><div class="alt">' + ba.aciklama + '</div></div></div>';
      h += '<span class="etiket ' + (alindi ? 'iyi' : '') + '">' + tl(ba.odul) + '</span></div>';
    }
    h += '</div>';
    var k = SIM.kampanya();
    if (k) {
      h += '<div class="kart"><div class="baslik">Sezon kampanyası</div>';
      h += '<div class="kv"><span>Ürün</span><b>' + k.tanim.emoji + ' ' + k.tanim.ad + '</b></div>';
      h += '<div class="kv"><span>İlerleme</span><b>' + k.sayac + ' / ' + k.tanim.hedef + '</b></div>';
      h += '<div class="kv"><span>Ödül</span><b class="yesilY">' + tl(k.tanim.odul) + '</b></div>';
      h += '<div class="cubuk"><i style="width:' + kisitla(k.sayac / k.tanim.hedef * 100, 0, 100) + '%"></i></div>';
      h += '</div>';
    }
    return h;
  },

  ayarlarHtml: function () {
    var s2 = D.s;
    var dm = (s2.ayar && s2.ayar.dolum) || 'ikisi';
    var h = '<div class="kart"><div class="baslik">Dolum şekli</div><div class="sek">';
    [['tut', '✋ Basılı tut', 'Tabancayı sen tutarsın; tam isabette tam bahşiş.'],
     ['onayar', '🔢 Miktar gir', 'Miktarı yaz, pompa kendi durur; bahşiş yarı.'],
     ['ikisi', '⚡ İkisi de', 'Serviste iki seçenek birlikte çıkar.']].forEach(function (o) {
      h += '<button class="sec' + (dm === o[0] ? ' secili' : '') + '" onclick="UI.dolumModu(\'' + o[0] + '\')">';
      h += '<div class="st">' + o[1] + '</div><div class="ss">' + o[2] + '</div></button>';
    });
    h += '</div></div>';

    var sesAcik = !(s2.ayar && s2.ayar.ses === false);
    var lpgG = !(s2.ayar && s2.ayar.lpgGuvenlik === false);
    h += '<div class="kart"><div class="baslik">Ses ve yardımcılar</div>';
    h += '<div class="anahtarSatir"><div><div class="ad">🔊 Oyun sesleri</div><div class="alt">Dolum, kasa, uyarı ve başarım efektleri</div></div>';
    h += '<button class="anahtar' + (sesAcik ? ' acik' : '') + '" onclick="UI.sesDegis()"><i></i></button></div>';
    h += '<div class="anahtarSatir"><div><div class="ad">💨 LPG güvenlik adımı</div><div class="alt">LPG dolumunda motor/yolcu kontrolü sorulur</div></div>';
    h += '<button class="anahtar' + (lpgG ? ' acik' : '') + '" onclick="UI.lpgGuvenlikDegis()"><i></i></button></div>';
    var sbA = D.sube();
    h += '<div class="anahtarSatir"><div><div class="ad">🌙 Gece kapat (00:00–05:00)</div><div class="alt">Gece müşteri gelmez; elektrik gideri ve kaçak riski düşer</div></div>';
    h += '<button class="anahtar' + (sbA.gece ? ' acik' : '') + '" onclick="UI.geceDegis()"><i></i></button></div>';
    h += '</div>';

    h += '<div class="kart"><div class="baslik">Oyun hızı</div>';
    h += '<div class="not">Zaman akışını hızlandırır; müşteriler ve günler daha çabuk geçer.</div>';
    h += '<div class="hizSerit">';
    [1, 2, 3, 5].forEach(function (hz) {
      h += '<button class="hizDugme' + (s2.hiz === hz ? ' aktif' : '') + '" onclick="UI.hizDegis(' + hz + ')">' + hz + '×</button>';
    });
    h += '</div></div>';

    h += '<div class="kart"><div class="baslik">Oyun</div>';
    h += '<div class="btngrup" style="margin-top:8px">';
    h += '<button class="btn kucuk ikincil" onclick="D.kaydet()&&UI.bildir(\'Kaydedildi\',\'\',\'iyi\')">💾 Kaydet</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.guncellemeKontrol()">⬇ Güncelleme denetle</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.sifirlaOnay()">🗑 Sıfırla</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.yedekAl()">📤 Yedek al</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.yedekYukleEkrani()">📥 Yedek yükle</button>';
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

    if (this.bildirimGecmisi.length) {
      h += '<div class="kart"><div class="baslik">🔔 Son olaylar</div>';
      for (var n = this.bildirimGecmisi.length - 1; n >= Math.max(0, this.bildirimGecmisi.length - 15); n--) {
        var bg = this.bildirimGecmisi[n];
        h += '<div class="kv"><span>' + bg.saat + '</span><b style="font-weight:500;text-align:right">' + bg.baslik + (bg.metin ? ' — <span class="mini">' + bg.metin + '</span>' : '') + '</b></div>';
      }
      h += '</div>';
    }

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

  /* =========================================================
     İLK OYUN REHBERİ
     ========================================================= */
  rehberAdimlari: [
    { ad: 'Müşteriyi karşıla', metin: 'Pompada araç belirince üstüne dokun, sonra “KENDİM DOLDUR”a bas.',
      tamam: function () { return D.s.ist.elleServis >= 1; } },
    { ad: 'Tam isabet tuttur', metin: 'İstenen miktara en yakın noktada bırak; tam tutturursan bahşiş alırsın.',
      tamam: function () { return D.s.ist.tamIsabet >= 1; } },
    { ad: 'Yakıt siparişi ver', metin: 'Yelpaze menüden 🚚 Sipariş’e gir, azalan tankı doldur.',
      tamam: function () { var sb = D.sube(); return sb.siparis.length > 0 || D.s.ist.siparis >= 1; } },
    { ad: 'Pompacı işe al', metin: 'Personel panelinden ya da pompa kartından pompacı al; o da senin yerine doldursun.',
      tamam: function () { return SIM.personelSayisi(D.sube(), 'pompaci') >= 1; } },
    { ad: 'Yeni pompa kur', metin: 'İnşaat panelinden ikinci bir pompa ekle; aynı anda iki araca hizmet ver.',
      tamam: function () { return D.pompalar(D.sube()).length >= 3; } },
    { ad: 'Market aç', metin: 'İnşaat → Tesisler’den market kur, rafları doldur, ek gelir başlasın.',
      tamam: function () { return D.binaSayisi(D.sube(), 'market') >= 1; } }
  ],

  rehberHtml: function () {
    var r = D.s.rehber;
    if (!r || r.kapali || r.adim >= this.rehberAdimlari.length) return '';
    var a = this.rehberAdimlari[r.adim];
    var h = '<div class="rehber tik">';
    h += '<div class="rhUst"><span class="rhSayi">' + (r.adim + 1) + '/' + this.rehberAdimlari.length + '</span>';
    h += '<span class="rhAd">' + a.ad + '</span>';
    h += '<button class="rhKapat" onclick="UI.rehberKapat()">✕</button></div>';
    h += '<div class="rhMetin">' + a.metin + '</div>';
    h += '</div>';
    return h;
  },

  rehberKontrol: function () {
    var r = D.s.rehber;
    if (!r || r.kapali || r.adim >= this.rehberAdimlari.length) return;
    var a = this.rehberAdimlari[r.adim];
    var tamam = false;
    try { tamam = a.tamam(); } catch (e) { tamam = false; }
    if (!tamam) return;
    r.adim++;
    if (window.SES) SES.cal('basari');
    if (r.adim >= this.rehberAdimlari.length) {
      var odul = 60000;
      D.s.para += odul;
      D.xpEkle(400);
      this.bildir('🎓 Rehber tamamlandı', 'Temel işleyişi öğrendin · +' + tl(odul), 'iyi');
    } else {
      this.bildir('✔ ' + a.ad, 'Sıradaki: ' + this.rehberAdimlari[r.adim].ad, 'iyi');
    }
    D.kaydet();
  },

  rehberKapat: function () {
    D.s.rehber.kapali = true;
    D.kaydet();
    this.ciz();
  },

  /* =========================================================
     KAYIT YEDEKLEME
     ========================================================= */
  yedekAl: function () {
    var metin = '';
    try { metin = JSON.stringify(D.s); } catch (e) { this.bildir('Yedek alınamadı', '', 'kotu'); return; }
    var kod = '';
    try { kod = btoa(unescape(encodeURIComponent(metin))); } catch (e) { kod = metin; }
    var h = '<div class="not">Aşağıdaki kodu kopyalayıp bir yere kaydet. Telefonu değiştirsen bile bu kodla kaldığın yerden devam edersin.</div>';
    h += '<textarea class="yedekKutu" id="yedekMetin" readonly>' + kod + '</textarea>';
    h += '<div class="kv"><span>Gün</span><b>' + D.s.gun + '</b></div>';
    h += '<div class="kv"><span>Kasa</span><b>' + tl(D.s.para) + '</b></div>';
    h += '<div class="kv"><span>Boyut</span><b>' + say(kod.length / 1024, 1) + ' KB</b></div>';
    h += '<button class="btn genis" style="margin-top:10px" onclick="UI.yedekKopyala()">📋 Kopyala</button>';
    this.modal('Yedek kodu', h);
  },

  yedekKopyala: function () {
    var el = document.getElementById('yedekMetin');
    if (!el) return;
    try {
      el.select();
      el.setSelectionRange(0, 999999);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(el.value);
      else document.execCommand('copy');
      this.bildir('Kopyalandı', 'Yedek kodu panoya alındı.', 'iyi');
    } catch (e) { this.bildir('Kopyalanamadı', 'Kodu elle seçip kopyala.', 'uyari'); }
  },

  yedekYukleEkrani: function () {
    var h = '<div class="not">Daha önce aldığın yedek kodunu yapıştır. Mevcut kaydın silinir, yerine bu gelir.</div>';
    h += '<textarea class="yedekKutu" id="yedekGiris" placeholder="Yedek kodunu buraya yapıştır"></textarea>';
    h += '<button class="btn genis" style="margin-top:10px" onclick="UI.yedekYukle()">📥 Yedeği yükle</button>';
    this.modal('Yedekten dön', h);
  },

  yedekYukle: function () {
    var el = document.getElementById('yedekGiris');
    if (!el || !el.value.trim()) { this.bildir('Kod boş', 'Önce yedek kodunu yapıştır.', 'kotu'); return; }
    var ham = el.value.trim(), nesne = null;
    try {
      var coz = ham.charAt(0) === '{' ? ham : decodeURIComponent(escape(atob(ham)));
      nesne = JSON.parse(coz);
    } catch (e) { nesne = null; }
    if (!nesne || !nesne.subeler || !nesne.subeler.length) {
      this.bildir('Geçersiz yedek', 'Kod okunamadı veya bozuk.', 'kotu');
      return;
    }
    D.s = nesne;
    try { D.onar(); } catch (e) {}
    D.kaydet();
    this.modalKapat();
    this.sekmeGec('istasyon');
    try { IZO.susle(D.sube()); IZO._zAnahtar = ''; IZO.kameraSifirla(); } catch (e) {}
    this.bildir('Yedek yüklendi', 'Gün ' + D.s.gun + ' · ' + tl(D.s.para), 'iyi');
  },

  cevrimdisiModal: function (cd) {
    var saat = Math.floor(cd.saat);
    var dk = Math.round((cd.saat - saat) * 60);
    var sure = (saat ? saat + ' sa ' : '') + dk + ' dk';
    var h = '<div class="cdBas">🌙</div>';
    h += '<div class="cdSure">Sen yokken ' + sure + ' geçti</div>';
    h += '<div class="cdPara">+' + tl(cd.kazanc) + '</div>';
    h += '<div class="kv"><span>Kadro verimi</span><b>%' + say(cd.verim * 100, 0) + '</b></div>';
    h += '<div class="kv"><span>Pompacı</span><b>' + cd.pompaci + '</b></div>';
    h += '<div class="kv"><span>Müdür</span><b>' + (cd.mudur ? 'var' : 'yok') + '</b></div>';
    h += '<div class="not">Daha fazla pompacı ve bir müdür, sen yokken istasyonun daha verimli çalışmasını sağlar.</div>';
    h += '<button class="btn genis" style="margin-top:12px" onclick="UI.cevrimdisiAl()">💰 KASAYA AL</button>';
    this._cd = cd;
    this.modal('Çevrimdışı kazanç', h);
  },
  cevrimdisiAl: function () {
    if (SIM.cevrimdisiAl(this._cd)) {
      if (window.SES) SES.cal('para');
      this.bildir('Çevrimdışı kazanç', tl(this._cd.kazanc) + ' kasaya eklendi.', 'iyi');
    }
    this._cd = null;
    this.modalKapat();
  },

  hizDegis: function (h) {
    D.s.hiz = h;
    D.kaydet();
    this.bildir('Oyun hızı', h + '× ayarlandı.', 'iyi');
    this.panelYenile();
  },

  sesDegis: function () {
    if (!D.s.ayar) D.s.ayar = {};
    D.s.ayar.ses = D.s.ayar.ses === false;
    if (window.SES) { SES.uyandir(); SES.ayar(D.s.ayar.ses !== false); SES.cal('buton'); }
    D.kaydet();
    this.panelYenile();
  },
  geceDegis: function () {
    var sb = D.sube();
    sb.gece = !sb.gece;
    D.kaydet();
    this.bildir(sb.gece ? '🌙 Gece kapanış açık' : '🌞 24 saat açık', sb.gece ? 'Gece 00:00–05:00 arası müşteri alınmaz.' : 'İstasyon tüm gün hizmet verir.', 'iyi');
    this.panelYenile();
  },
  lpgGuvenlikDegis: function () {
    if (!D.s.ayar) D.s.ayar = {};
    D.s.ayar.lpgGuvenlik = D.s.ayar.lpgGuvenlik === false;
    D.kaydet();
    this.panelYenile();
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
    /* aynı bildirim üst üste gelmesin */
    var imza = baslik + '|' + (metin || '');
    if (this._sonBildirim === imza && Date.now() - (this._sonBildirimZ || 0) < 2500) return;
    this._sonBildirim = imza;
    this._sonBildirimZ = Date.now();

    if (window.SES && tip === 'kotu') SES.cal('uyari');
    var d = document.createElement('div');
    d.className = 'bld ' + (tip || '');
    d.innerHTML = '<b>' + baslik + '</b>' + (metin || '');
    k.appendChild(d);
    while (k.children.length > 2) k.removeChild(k.firstChild);
    var sil = function () {
      if (!d.parentNode) return;
      d.classList.add('kapan');
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 280);
    };
    setTimeout(sil, tip === 'kotu' ? 3200 : 2300);
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
