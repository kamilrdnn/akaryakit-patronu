/* Akaryakıt Patronu — arayüz */
'use strict';

const UI = {
  sekme: 'istasyon',
  secHucre: null,
  modalAcik: false,

  sekmeler: [
    { id: 'istasyon', ad: 'İstasyon', ik: '⛽' },
    { id: 'insa',     ad: 'İnşa',     ik: '🏗️' },
    { id: 'fiyat',    ad: 'Fiyat',    ik: '🏷️' },
    { id: 'siparis',  ad: 'Sipariş',  ik: '🚚' },
    { id: 'personel', ad: 'Personel', ik: '🧑‍🔧' },
    { id: 'subeler',  ad: 'Şubeler',  ik: '🗺️' },
    { id: 'daha',     ad: 'Daha',     ik: '☰' }
  ],

  /* =========================================================
     KURULUM
     ========================================================= */
  kur: function () {
    var h = '';
    for (var i = 0; i < this.sekmeler.length; i++) {
      var s = this.sekmeler[i];
      h += '<button onclick="UI.sekmeGec(\'' + s.id + '\')" id="sk_' + s.id + '">' +
           '<span class="ik">' + s.ik + '</span>' + s.ad + '</button>';
    }
    document.getElementById('alt').innerHTML = h;
    this.sekmeGec('istasyon');
  },

  sekmeGec: function (id) {
    this.sekme = id;
    for (var i = 0; i < this.sekmeler.length; i++) {
      var el = document.getElementById('sk_' + this.sekmeler[i].id);
      if (el) el.classList.toggle('aktif', this.sekmeler[i].id === id);
    }
    document.getElementById('govde').scrollTop = 0;
    this.ciz();
  },

  /* =========================================================
     ÇİZİM
     ========================================================= */
  ciz: function () {
    if (!D.s) return;
    this.ustCiz();
    var g = document.getElementById('govde');
    switch (this.sekme) {
      case 'istasyon': g.innerHTML = this.istasyonHtml(); break;
      case 'insa':     g.innerHTML = this.insaHtml(); break;
      case 'fiyat':    g.innerHTML = this.fiyatHtml(); break;
      case 'siparis':  g.innerHTML = this.siparisHtml(); break;
      case 'personel': g.innerHTML = this.personelHtml(); break;
      case 'subeler':  g.innerHTML = this.subelerHtml(); break;
      case 'daha':     g.innerHTML = this.dahaHtml(); break;
    }
  },

  /* sadece canlı ekranlar tik'te yenilenir (girdi odağı bozulmasın).
     Yeniden çizimde gövde ve kuyruk şeridinin kaydırma konumu korunur. */
  tikCiz: function () {
    if (!D.s) return;
    this.ustCiz();
    if (this.modalAcik || SERVIS.acik) return;
    if (this.sekme !== 'istasyon' && this.sekme !== 'siparis') return;

    var govde = document.getElementById('govde');
    var kayGovde = govde ? govde.scrollTop : 0;
    var kuyrukEl = document.getElementById('kuyruk');
    var kayKuyruk = kuyrukEl ? kuyrukEl.scrollLeft : 0;
    var izgaraEl = document.getElementById('izgaraSar');
    var kayIzgaraY = izgaraEl ? izgaraEl.scrollTop : 0;
    var kayIzgaraX = izgaraEl ? izgaraEl.scrollLeft : 0;

    this.ciz();

    if (govde) govde.scrollTop = kayGovde;
    var yeniKuyruk = document.getElementById('kuyruk');
    if (yeniKuyruk && kayKuyruk) yeniKuyruk.scrollLeft = kayKuyruk;
    var yeniIzgara = document.getElementById('izgaraSar');
    if (yeniIzgara) { yeniIzgara.scrollTop = kayIzgaraY; yeniIzgara.scrollLeft = kayIzgaraX; }
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
    if (s.olaylar.length) {
      for (var i = 0; i < s.olaylar.length; i++) {
        var ov = null;
        for (var j = 0; j < VERI.olaylar.length; j++) if (VERI.olaylar[j].id === s.olaylar[i].id) ov = VERI.olaylar[j];
        if (ov) h += '<div class="rozet">' + ov.emoji + ' <b>' + ov.ad + '</b> ' + s.olaylar[i].kalan + 'dk</div>';
      }
    }
    h += '</div>';
    h += '<div class="cubuk ince" style="margin-top:6px"><i style="width:' + xpOran + '%;background:var(--mor)"></i></div>';

    document.getElementById('ust').innerHTML = h;
    document.body.classList.toggle('gecemod', gece);
  },

  hizDegis: function () {
    var sira = [1, 2, 3];
    var i = sira.indexOf(D.s.hiz);
    D.s.hiz = sira[(i + 1) % sira.length];
    this.ustCiz();
  },

  /* =========================================================
     İSTASYON
     ========================================================= */
  istasyonHtml: function () {
    var sb = D.sube(), s = D.s;
    var h = '';

    if (sb.devredildi) {
      h += '<div class="kart"><div class="baslik">Devredilmiş şube</div>';
      h += '<div class="not">Bu şubeyi devrettin, günlük pasif gelir getiriyor. Oynamak için Şubeler sekmesinden başka bir şubeye geç.</div></div>';
      return h;
    }

    /* bekleyen müşteri uyarısı */
    var bekleyen = [];
    for (var i = 0; i < sb.kuyruk.length; i++) if (sb.kuyruk[i].durum === 'pompada') bekleyen.push(sb.kuyruk[i]);
    if (bekleyen.length) {
      h += '<button class="btn genis" style="margin-bottom:10px" onclick="SERVIS.ac(' + bekleyen[0].pompa + ')">';
      h += bekleyen[0].emoji + ' POMPA ' + (bekleyen[0].pompa + 1) + ' — ' + bekleyen[0].etiket + ' · DOLDUR';
      h += '</button>';
    }

    /* ızgara */
    h += '<div id="izgaraSar"><div id="izgara" style="grid-template-columns:repeat(' + sb.w + ',minmax(54px,1fr))">';
    for (var k = 0; k < sb.w * sb.h; k++) h += this.hucreHtml(sb, k);
    h += '</div></div>';

    /* kuyruk */
    h += '<div class="kart sik" style="margin-top:10px"><div class="baslik">Kuyruk · ' + sb.kuyruk.length + ' araç</div>';
    if (!sb.kuyruk.length) {
      h += '<div class="bos">Şu an müşteri yok. Fiyatını düşürmek veya tesis açmak trafiği artırır.</div>';
    } else {
      h += '<div id="kuyruk">';
      for (var m = 0; m < sb.kuyruk.length; m++) {
        var mu = sb.kuyruk[m];
        var oran = mu.sabirKalan / Math.max(1, mu.sabir);
        h += '<div class="mus' + (oran < 0.3 ? ' acil' : '') + '"' + (mu.pompa !== null ? ' onclick="SERVIS.ac(' + mu.pompa + ')"' : '') + '>';
        h += '<div class="ar">' + mu.emoji + ' <span class="etiket ' + mu.yakit + '">' + VERI.yakitlar[mu.yakit].kisa + '</span></div>';
        h += '<div class="ist">' + mu.etiket + '</div>';
        h += '<div class="sure">' + (mu.pompa !== null ? 'Pompa ' + (mu.pompa + 1) : 'sırada bekliyor') + '</div>';
        h += '<div class="cubuk ince"><i style="width:' + (oran * 100) + '%;background:' + (oran < 0.3 ? 'var(--kirmizi)' : oran < 0.6 ? 'var(--sari)' : 'var(--yesil)') + '"></i></div>';
        h += '</div>';
      }
      h += '</div>';
    }
    h += '</div>';

    /* tanklar */
    h += '<div class="kart"><div class="baslik">Tanklar</div>';
    ['benzin', 'dizel', 'lpg'].forEach(function (y) {
      var t = sb.tank[y];
      var kap = D.tankKap(sb, y);
      t.kap = kap;
      var o = kap > 0 ? (t.dolu / kap) * 100 : 0;
      h += '<div class="satir"><div class="sol"><div class="ikon">' + VERI.yakitlar[y].emoji + '</div>';
      h += '<div><div class="ad">' + VERI.yakitlar[y].ad + '</div>';
      h += '<div class="alt">' + say(t.dolu, 0) + ' / ' + say(kap, 0) + ' L · satış ' + say(sb.fiyat[y], 2) + ' ₺</div>';
      h += '<div class="cubuk" style="width:150px"><i style="width:' + o + '%;background:' + (o < 15 ? 'var(--kirmizi)' : o < 35 ? 'var(--sari)' : 'var(--yesil)') + '"></i></div>';
      h += '</div></div>';
      h += '<button class="btn minik ikincil" onclick="UI.sekmeGec(\'siparis\')">Sipariş</button>';
      h += '</div>';
    });
    h += '</div>';

    /* güç + temizlik */
    var tuk = D.gucTuketim(sb), ure = D.gucUretim(sb);
    h += '<div class="kart"><div class="baslik">İşletme</div>';
    h += '<div class="kv"><span>Elektrik</span><b>' + say(ure, 1) + ' / ' + say(tuk, 1) + ' kW ' +
      (sb.kesinti ? '<span class="kirmiziY">· ŞEBEKE YOK</span>' : (ure >= tuk ? '<span class="yesilY">· kendi üretimin yeter</span>' : '<span class="mini">· şebekeden ' + say(tuk - ure, 1) + ' kW</span>')) + '</b></div>';
    h += '<div class="kv"><span>Temizlik</span><b>' + Math.round(sb.temizlik) + '%</b></div>';
    h += '<div class="kv"><span>Bakım ortalaması</span><b>' + Math.round(D.bakimOrt(sb)) + '%</b></div>';
    h += '<div class="kv"><span>Günlük kira+gider</span><b>' + tl(SIM.kiraGunluk(sb)) + '</b></div>';
    h += '<div class="kv"><span>Beklenen müşteri</span><b>' + say(SIM.saatlikMusteri(sb), 1) + ' / saat</b></div>';
    h += '<div class="btngrup" style="margin-top:8px">';
    h += '<button class="btn kucuk ikincil" onclick="UI.temizlikOnay()">🧹 Temizlik ' + tl(2500 + (100 - sb.temizlik) * 220) + '</button>';
    h += '</div></div>';

    return h;
  },

  hucreHtml: function (sb, k) {
    var y = sb.yapi[k];
    var cls = 'huc', ic = '', ek = '';
    if (!sb.beton[k]) {
      cls += '';
      ic = '<div class="e" style="opacity:.3">▫</div><div class="et">boş arsa</div>';
    } else if (!y) {
      cls += ' beton';
      ic = '<div class="e" style="opacity:.35">＋</div><div class="et">beton</div>';
    } else if (y.t === 'pompa') {
      cls += ' dolu pompa';
      var musteri = y.mesgul ? SIM.musteriBul(sb, y.mesgul) : null;
      if (musteri) cls += musteri.durum === 'pompada' ? ' bekleyen' : ' mesgul';
      if (y.arizali) cls += ' arizali';
      ic = '<div class="e">' + (y.yakit === 'ev' ? '🔌' : '⛽') + '</div>';
      ic += '<div class="et" style="color:' + VERI.yakitlar[y.yakit].renk + '">' + VERI.yakitlar[y.yakit].kisa + ' sv' + y.sv + '</div>';
      if (musteri) ic += '<div class="musteri">' + musteri.emoji + '</div>';
      if (y.arizali) ek = '<div class="uyari">🔧</div>';
      else if (y.bakim < 45) ek = '<div class="uyari">⚠️</div>';
    } else {
      cls += ' dolu';
      if (y.arizali) cls += ' arizali';
      var tan = VERI.binalar[y.t];
      ic = '<div class="e">' + tan.emoji + '</div><div class="et">' + tan.ad.split(' ')[0] + ' sv' + y.sv + '</div>';
      if (y.arizali) ek = '<div class="uyari">🔧</div>';
      else if (y.bakim < 45) ek = '<div class="uyari">⚠️</div>';
    }
    return '<button class="' + cls + '" onclick="UI.hucreTik(' + k + ')">' + ic + ek + '</button>';
  },

  hucreTik: function (k) {
    var sb = D.sube(), y = sb.yapi[k];
    if (y && y.t === 'pompa' && y.mesgul) {
      var m = SIM.musteriBul(sb, y.mesgul);
      if (m && m.durum === 'pompada') { SERVIS.ac(k); return; }
    }
    this.secHucre = k;
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
      h += '<div class="ss">' + tl(f) + ' · akış ' + say(y === 'ev' ? VERI.pompa.evAkis[0] : VERI.pompa.akis[0], 2) + ' ' + VERI.yakitlar[y].birim + '/sn';
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
    var h = '';
    var ad, aciklama;
    if (y.t === 'pompa') {
      ad = VERI.yakitlar[y.yakit].ad + ' Pompası ' + (k + 1);
      aciklama = 'Akış ' + say(D.akis(y), 2) + ' ' + VERI.yakitlar[y.yakit].birim + '/sn';
      if (y.yakit === 'benzin' || y.yakit === 'dizel') aciklama += ' · çok tabancalı (benzin+dizel)';
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
     İNŞA SEKMESİ
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
    h += '</div>';

    h += '<div class="kart"><div class="baslik">Pompalar · ' + D.pompalar(sb).length + '/' + lok.maxPompa + '</div>';
    var po = D.pompalar(sb);
    if (!po.length) h += '<div class="bos">Hiç pompa yok.</div>';
    for (var p = 0; p < po.length; p++) {
      var pp = po[p].p;
      h += '<div class="satir" onclick="UI.yapiModal(' + po[p].i + ')"><div class="sol"><div class="ikon">' + (pp.yakit === 'ev' ? '🔌' : '⛽') + '</div>';
      h += '<div><div class="ad">' + VERI.yakitlar[pp.yakit].ad + ' · Pompa ' + (po[p].i + 1) + '</div>';
      h += '<div class="alt">sv.' + pp.sv + ' · akış ' + say(D.akis(pp), 2) + ' · bakım ' + Math.round(pp.bakim) + '%</div></div></div>';
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

    h += '<div class="kart"><div class="baslik">İstasyon planı</div>';
    h += '<div id="izgaraSar"><div id="izgara" style="grid-template-columns:repeat(' + sb.w + ',minmax(54px,1fr))">';
    for (var k2 = 0; k2 < sb.w * sb.h; k2++) h += this.hucreHtml(sb, k2);
    h += '</div></div>';
    h += '<div class="not">Boş hücreye dokun → beton dök → pompa veya tesis kur.</div></div>';
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
    if (s.rafineri.aktif) {
      h += '<div class="not">Rafinerin sayesinde toptan fiyatlardan %' + Math.round(VERI.rafineri.indirim[s.rafineri.sv] * 100) + ' indirim alıyorsun.</div>';
    }
    h += '<div class="kv"><span>Şebeke elektriği</span><b>' + say(VERI.sebekeFiyat, 2) + ' ₺/kWh</b></div>';
    h += '<div class="kv"><span>Beklenen müşteri</span><b>' + say(SIM.saatlikMusteri(sb), 1) + ' / saat</b></div>';
    h += '</div>';
    return h;
  },

  fiyatKaydir: function (y, v) {
    D.sube().fiyat[y] = +(+v).toFixed(2);
    this.ciz();
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
      h += '<button class="btn ikincil genis" style="margin-top:10px" onclick="UI.sekmeGec(\'daha\')">Rafineriye göz at</button>';
    }
    h += '</div>';
    return h;
  },

  siparis: function (y, mik) {
    if (SIM.siparisVer(D.sube(), y, mik)) this.ciz();
  },

  /* =========================================================
     PERSONEL
     ========================================================= */
  adaylar: null,
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
    var tipler = ['pompaci', 'pompaci', 'temizlik', 'teknisyen', 'mudur'];
    this.adaylar = [];
    for (var i = 0; i < 5; i++) this.adaylar.push(SIM.adayUret(tipler[i]));
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
      var var_ = false;
      for (var m = 0; m < s.subeler.length; m++) if (s.subeler[m].lok === lk.id) var_ = true;
      if (var_) continue;
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
     DAHA (istatistik, rafineri, ayarlar)
     ========================================================= */
  dahaHtml: function () {
    var s = D.s, i = s.ist;
    var h = '';

    /* rafineri */
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

    /* istatistik */
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

    /* son günler */
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

    /* ayarlar */
    h += '<div class="kart"><div class="baslik">⚙️ Ayarlar</div>';
    h += '<div class="kv"><span>Oyun hızı</span><b>' + s.hiz + '×</b></div>';
    h += '<div class="btngrup" style="margin-top:8px">';
    h += '<button class="btn kucuk ikincil" onclick="D.kaydet()&&UI.bildir(\'Kaydedildi\',\'\',\'iyi\')">💾 Kaydet</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.guncellemeKontrol()">⬇ Güncelleme denetle</button>';
    h += '<button class="btn kucuk ikincil" onclick="UI.sifirlaOnay()">🗑 Sıfırla</button>';
    h += '</div>';
    h += '<div class="not">Sürüm <b id="surumYazi">—</b> · Oyun tamamen çevrimdışı çalışır; internet yalnızca güncelleme denetiminde kullanılır.</div>';
    h += '</div>';

    /* ipuçları */
    h += '<div class="kart"><div class="baslik">💡 İpuçları</div>';
    for (var t = 0; t < VERI.ipuclari.length; t++) h += '<div class="kv"><span>·</span><b style="font-weight:500;text-align:right">' + VERI.ipuclari[t] + '</b></div>';
    h += '</div>';

    setTimeout(function () {
      var el = document.getElementById('surumYazi');
      if (el) { try { el.textContent = window.AndroidKabuk ? AndroidKabuk.surum() : 'web'; } catch (e) { el.textContent = '1.0'; } }
    }, 0);

    return h;
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

  guncellemeKontrol: function () {
    if (window.GUNCELLE) GUNCELLE.kontrol(true);
    else this.bildir('Güncelleme', 'Bu sürümde denetim yapılamıyor.', 'uyari');
  },

  /* =========================================================
     BİLDİRİM
     ========================================================= */
  bildir: function (baslik, metin, tip) {
    var k = document.getElementById('bildirimler');
    var d = document.createElement('div');
    d.className = 'bld ' + (tip || '');
    d.innerHTML = '<b>' + baslik + '</b>' + (metin || '');
    k.appendChild(d);
    if (k.children.length > 4) k.removeChild(k.firstChild);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 4200);
  }
};
