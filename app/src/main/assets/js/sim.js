/* Akaryakıt Patronu — simülasyon motoru */
'use strict';

const SIM = {
  birikenSn: 0,

  /* =========================================================
     ZAMAN
     ========================================================= */
  tik: function (dakika) {
    for (var i = 0; i < dakika; i++) this.dakika();
  },

  dakika: function () {
    var s = D.s;
    s.dk++;
    if (s.dk >= 60) { s.dk = 0; s.saat++; this.saatBasi(); }
    if (s.saat >= 24) { s.saat = 0; s.gun++; this.gunSonu(); }

    var sb = D.sube();
    this.musteriUret(sb);
    this.kuyrukIsle(sb, 1);
    this.atama(sb);
    this.otoServis(sb, 1);
    this.siparisIsle(sb, 1);
    this.olaylariIsle();
    this.pasifSubeler(1);
  },

  /* saatlik: elektrik, bakım aşınması, toptan fiyat, olaylar */
  saatBasi: function () {
    var s = D.s, sb = D.sube();

    /* --- elektrik --- */
    var tuk = D.gucTuketim(sb), ure = D.gucUretim(sb);
    var sebeke = Math.max(0, tuk - ure);
    if (sb.kesinti) sebeke = 0;
    var bedel = sebeke * VERI.sebekeFiyat;
    if (bedel > 0) { s.para -= bedel; s.ist.bugunGider += bedel; }

    /* --- jeneratör dizel tüketimi --- */
    var jen = D.binalar(sb, 'jenerator');
    for (var j = 0; j < jen.length; j++) {
      if (jen[j].b.arizali) continue;
      var harcanan = 9 * jen[j].b.sv;
      if (sb.tank.dizel.dolu >= harcanan) {
        sb.tank.dizel.dolu -= harcanan;
        s.ist.bugunGider += harcanan * D.toptanFiyat('dizel');
      } else {
        jen[j].b.arizali = true;
        UI.bildir('Jeneratör durdu', 'Dizel tankı boşaldı, jeneratör yakıt bulamadı.', 'kotu');
      }
    }

    /* --- bakım aşınması --- */
    var teknisyen = this.personelSayisi(sb, 'teknisyen');
    for (var i = 0; i < sb.yapi.length; i++) {
      var y = sb.yapi[i];
      if (!y || typeof y.bakim !== 'number') continue;
      var asinma = rastgele(0.5, 1.6);
      if (VERI.sezonSira[s.sezonIdx] === 'kis') asinma *= 1.3;
      if (y.t === 'smr') asinma *= 2.2;
      y.bakim = kisitla(y.bakim - asinma + teknisyen * 1.5, 0, 100);
      /* arıza riski */
      if (!y.arizali && y.bakim < 45 && Math.random() < (45 - y.bakim) / 2600) {
        y.arizali = true;
        UI.bildir('Arıza!', (y.t === 'pompa' ? 'Bir pompa' : VERI.binalar[y.t].ad) + ' bozuldu, tamir gerekiyor.', 'kotu');
      }
    }

    /* --- temizlik --- */
    var temizlikci = this.personelSayisi(sb, 'temizlik');
    sb.temizlik = kisitla(sb.temizlik - rastgele(0.8, 2.4) + temizlikci * 3.2, 0, 100);

    /* --- toptan fiyat dalgalanması --- */
    VERI.yakitSira.forEach(function (y) {
      var taban = VERI.yakitlar[y].tabanMaliyet;
      var mevcut = s.toptan[y];
      var hedefe = (taban - mevcut) * 0.08;                 // ortalamaya dönüş
      var gurultu = taban * rastgele(-0.012, 0.012);
      var zam = SIM.olayVar('zam') ? taban * 0.011 : 0;
      var ind = SIM.olayVar('indirim') ? -taban * 0.010 : 0;
      s.toptan[y] = Math.max(taban * 0.72, mevcut + hedefe + gurultu + zam + ind);
    });

    /* --- rakip fiyatı --- */
    VERI.yakitSira.forEach(function (y) {
      var hedef = s.toptan[y] * (y === 'ev' ? 1.85 : 1.17);
      if (SIM.olayVar('savas')) hedef *= 0.94;
      sb.rakip[y] = +(sb.rakip[y] + (hedef - sb.rakip[y]) * 0.25).toFixed(2);
    });

    /* --- yeni olay --- */
    if (Math.random() < 0.22) this.olayUret();

    this.basarimKontrol();

    /* --- memnuniyet yavaş toparlanma --- */
    sb.memnuniyet = kisitla(sb.memnuniyet + (sb.temizlik > 70 ? 0.4 : -0.3), 0, 100);
    s.marka = kisitla(s.marka + (sb.memnuniyet - 60) * 0.012, 0, 100);
  },

  gunSonu: function () {
    var s = D.s;

    /* maaşlar + kira (tüm şubeler) */
    var maas = 0, kira = 0;
    s.subeler.forEach(function (sb) {
      if (sb.devredildi) return;
      sb.personel.forEach(function (p) { maas += p.maas / 30; });
      kira += SIM.kiraGunluk(sb);
    });
    s.para -= (maas + kira);
    s.ist.bugunGider += maas + kira;

    /* pasif gelir (devredilen şubeler) */
    if (s.pasifGelir > 0) { s.para += s.pasifGelir; s.ist.bugunCiro += s.pasifGelir; }

    /* gün kaydı */
    s.ist.gunluk.push({ gun: s.gun - 1, ciro: Math.round(s.ist.bugunCiro), gider: Math.round(s.ist.bugunGider) });
    if (s.ist.gunluk.length > 60) s.ist.gunluk.shift();
    s.ist.bugunCiro = 0; s.ist.bugunGider = 0;

    /* sezon: 30 günde bir */
    if ((s.gun - 1) % 30 === 0) {
      s.sezonIdx = (s.sezonIdx + 1) % 4;
      var sz = D.sezon();
      UI.bildir(sz.emoji + ' ' + sz.ad + ' geldi', sz.aciklama, 'uyari');
    }

    UI.bildir('Gün ' + s.gun, 'Maaş ve kira: ' + tl(maas + kira) + (s.pasifGelir ? ' · Pasif gelir: ' + tl(s.pasifGelir) : ''), 'uyari');
    D.kaydet();
  },

  kiraGunluk: function (sb) {
    var lok = D.lok(sb);
    var temel = 400 + lok.trafik * 900;
    var binaSayi = D.binalar(sb).length + D.pompalar(sb).length;
    return temel + binaSayi * 180;
  },

  personelSayisi: function (sb, tip) {
    var n = 0;
    for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].tip === tip) n++;
    return n;
  },

  /* =========================================================
     MÜŞTERİ
     ========================================================= */
  saatKat: function (saat) {
    var t = [
      0.10, 0.07, 0.05, 0.05, 0.08, 0.20, 0.55, 1.35, 1.55, 1.05,
      0.85, 0.90, 1.00, 0.95, 0.90, 0.95, 1.25, 1.60, 1.45, 1.05,
      0.80, 0.60, 0.35, 0.18
    ];
    return t[saat] || 0.5;
  },

  /* fiyatın müşteri akışına etkisi */
  fiyatKat: function (sb) {
    var top = 0, n = 0;
    VERI.yakitSira.forEach(function (y) {
      if (!SIM.yakitVar(sb, y)) return;
      var r = sb.rakip[y], f = sb.fiyat[y];
      if (!r) return;
      var oran = f / r;
      top += kisitla(1 + (1 - oran) * 2.6, 0.25, 1.9);
      n++;
    });
    return n ? top / n : 1;
  },

  binaCekim: function (sb) {
    var c = 0, bi = D.binalar(sb);
    for (var i = 0; i < bi.length; i++) {
      var tan = VERI.binalar[bi[i].b.t];
      if (tan && tan.cekim && !bi[i].b.arizali) c += tan.cekim * (1 + 0.2 * (bi[i].b.sv - 1));
    }
    return c;
  },

  /* bir pompa hangi yakıtları verebilir:
     - EV pompası sadece elektrik, LPG pompası sadece LPG (güvenlik)
     - benzin/dizel pompaları çok tabancalıdır: ikisini de verir,
       kendi türünü tam hızda, diğerini %70 hızda */
  pompaUygun: function (p, y) {
    if (p.yakit === 'ev' || y === 'ev') return p.yakit === 'ev' && y === 'ev';
    if (p.yakit === 'lpg' || y === 'lpg') return p.yakit === 'lpg' && y === 'lpg';
    return (p.yakit === 'benzin' || p.yakit === 'dizel') && (y === 'benzin' || y === 'dizel');
  },

  yakitVar: function (sb, y) {
    var po = D.pompalar(sb);
    for (var i = 0; i < po.length; i++) {
      if (po[i].p.arizali || !this.pompaUygun(po[i].p, y)) continue;
      if (y === 'ev') return true;
      if (sb.tank[y] && sb.tank[y].dolu > 1) return true;
    }
    return false;
  },

  /* beklenen saatlik müşteri */
  saatlikMusteri: function (sb) {
    var lok = D.lok(sb);
    var pompa = 0, po = D.pompalar(sb);
    for (var i = 0; i < po.length; i++) if (!po[i].p.arizali) pompa++;
    if (!pompa) return 0;
    var k = lok.trafik * D.sezon().trafik * this.saatKat(D.s.saat);
    k *= (0.80 + 0.40 * (D.s.marka / 100));
    k *= (0.85 + 0.30 * (sb.memnuniyet / 100));
    k *= this.fiyatKat(sb);
    k *= (1 + this.binaCekim(sb));
    if (this.olayVar('akin')) k *= 2.3;
    if (this.olayVar('turist')) k *= 1.5;
    if (this.olayVar('hava')) k *= 0.7;
    if (this.olayVar('savas')) k *= 0.78;
    if (sb.kesinti && !D.gucYeterli(sb)) k *= 0.5;
    return k * 2.2 * pompa;
  },

  musteriUret: function (sb) {
    if (sb.devredildi) return;
    var po = D.pompalar(sb);
    var calisan = 0;
    for (var ci = 0; ci < po.length; ci++) if (!po[ci].p.arizali) calisan++;
    /* kuyruk uzunsa müşteri istasyona hiç girmez (geçip gider, ceza yok) */
    if (sb.kuyruk.length >= Math.max(2, Math.ceil(calisan * 1.6))) return;

    var olasilik = this.saatlikMusteri(sb) / 60;
    if (Math.random() > olasilik) return;

    var m = this.musteriYap(sb);
    if (m) sb.kuyruk.push(m);
  },

  musteriYap: function (sb) {
    var lok = D.lok(sb);

    /* satılabilir yakıtlar */
    var satilir = [];
    VERI.yakitSira.forEach(function (y) { if (SIM.yakitVar(sb, y)) satilir.push(y); });
    if (!satilir.length) return null;

    /* araç seçimi: lokasyon profili x araç ağırlığı */
    var agirliklar = [], toplam = 0;
    for (var i = 0; i < VERI.araclar.length; i++) {
      var a = VERI.araclar[i];
      var pr = (lok.profil[a.ad] || 0.5) * a.agirlik;
      /* istasyonda o aracın kullanabileceği yakıt var mı */
      var uygun = false;
      for (var y in a.yakit) if (satilir.indexOf(y) >= 0) uygun = true;
      if (!uygun) pr = 0;
      /* tır parkı tır/otobüs çeker */
      if ((a.ad === 'Tır' || a.ad === 'Otobüs')) {
        if (D.binaSayisi(sb, 'tirpark')) pr *= 1.9;
        if (D.binaSayisi(sb, 'restoran')) pr *= 1.4;
      }
      agirliklar.push(pr); toplam += pr;
    }
    if (toplam <= 0) return null;
    var r = Math.random() * toplam, arac = VERI.araclar[0];
    for (var k = 0; k < agirliklar.length; k++) { r -= agirliklar[k]; if (r <= 0) { arac = VERI.araclar[k]; break; } }

    /* yakıt seçimi */
    var ykAgir = [], ykToplam = 0, ykListe = [];
    for (var yy in arac.yakit) {
      if (satilir.indexOf(yy) < 0) continue;
      ykListe.push(yy); ykAgir.push(arac.yakit[yy]); ykToplam += arac.yakit[yy];
    }
    if (!ykListe.length) return null;
    var r2 = Math.random() * ykToplam, yakit = ykListe[0];
    for (var z = 0; z < ykListe.length; z++) { r2 -= ykAgir[z]; if (r2 <= 0) { yakit = ykListe[z]; break; } }

    /* hedef miktar */
    var depo = rastgele(arac.depo[0], arac.depo[1]);
    var oran = rastgele(0.35, 1.0);
    var hedef = depo * oran;
    if (yakit !== 'ev') {
      var mevcut = sb.tank[yakit].dolu;
      if (hedef > mevcut) hedef = mevcut * rastgele(0.5, 0.95);
      if (hedef < 3) return null;
    }

    /* istek tipi */
    var tip, etiket;
    var zar = Math.random();
    if (zar < 0.42) {
      tip = 'litre';
      hedef = Math.round(hedef / 5) * 5;
      if (hedef < 5) hedef = 5;
      etiket = say(hedef, 0) + ' ' + VERI.yakitlar[yakit].birim;
    } else if (zar < 0.80) {
      tip = 'tutar';
      var tutar = Math.round((hedef * sb.fiyat[yakit]) / 50) * 50;
      if (tutar < 100) tutar = 100;
      hedef = tutar / sb.fiyat[yakit];
      etiket = say(tutar, 0) + ' ₺';
    } else {
      tip = 'depo';
      etiket = 'Depoyu doldur';
    }

    return {
      id: id(),
      arac: arac.ad,
      emoji: arac.emoji,
      yakit: yakit,
      hedef: +hedef.toFixed(2),
      tip: tip,
      etiket: etiket,
      bahsis: arac.bahsis,
      sabir: arac.sabir,
      sabirKalan: arac.sabir * rastgele(0.8, 1.25),
      pompa: null,
      verilen: 0,
      durum: 'bekliyor'
    };
  },

  /* sabır tüketimi, ayrılanlar */
  kuyrukIsle: function (sb, dk) {
    for (var i = sb.kuyruk.length - 1; i >= 0; i--) {
      var m = sb.kuyruk[i];
      if (m.durum === 'servis') continue;
      var hiz = m.durum === 'pompada' ? 0.55 : 1;      // pompaya geçtiyse daha sabırlı
      if (D.binaSayisi(sb, 'kafe')) hiz *= 0.82;
      m.sabirKalan -= dk * hiz;
      if (m.sabirKalan <= 0) {
        this.musteriKacti(sb, m, i);
      }
    }
  },

  musteriKacti: function (sb, m, idx) {
    if (m.pompa !== null && sb.yapi[m.pompa] && sb.yapi[m.pompa].mesgul === m.id) sb.yapi[m.pompa].mesgul = null;
    var pompadaydi = m.pompa !== null;
    sb.kuyruk.splice(idx, 1);
    /* pompaya kadar gelip bekletilen müşteri gerçekten kızar; sırada bekleyip
       vazgeçen yalnızca kaçırılmış fırsattır */
    sb.memnuniyet = kisitla(sb.memnuniyet - (pompadaydi ? 1.1 : 0.35), 0, 100);
    if (pompadaydi) { D.s.ist.mutsuz++; D.s.marka = kisitla(D.s.marka - 0.12, 0, 100); }
  },

  /* bekleyen müşteriyi uygun boş pompaya ata */
  atama: function (sb) {
    var po = D.pompalar(sb);
    for (var i = 0; i < sb.kuyruk.length; i++) {
      var m = sb.kuyruk[i];
      if (m.pompa !== null || m.durum === 'servis') continue;
      for (var j = 0; j < po.length; j++) {
        var p = po[j].p;
        if (p.arizali || p.mesgul) continue;
        if (!this.pompaUygun(p, m.yakit)) continue;
        p.mesgul = m.id;
        m.pompa = po[j].i;
        m.durum = 'pompada';
        break;
      }
    }
  },

  /* pompacı atanmış pompalarda otomatik dolum */
  otoServis: function (sb, dk) {
    var po = D.pompalar(sb);
    for (var j = 0; j < po.length; j++) {
      var p = po[j].p, idx = po[j].i;
      if (!p.mesgul || p.arizali) continue;
      var pompaci = null;
      for (var k = 0; k < sb.personel.length; k++) {
        if (sb.personel[k].tip === 'pompaci' && sb.personel[k].pompa === idx) pompaci = sb.personel[k];
      }
      if (!pompaci) continue;

      var m = this.musteriBul(sb, p.mesgul);
      if (!m) { p.mesgul = null; continue; }
      if (m.durum === 'servis') continue;   // oyuncu elle dolduruyor

      /* saniyede akış; 1 oyun dakikası = 6 saniye iş */
      var akis = D.akis(p) * (0.75 + pompaci.beceri / 400) * (m.yakit === p.yakit ? 1 : 0.70);
      var saniye = 2.5 * dk;
      var hedefeKalan = m.hedef - m.verilen;
      var hata = (1 - pompaci.beceri / 100) * rastgele(-1.6, 1.9);
      var hedefNokta = m.hedef + hata;
      var verebilir = Math.min(akis * saniye, Math.max(0, hedefNokta - m.verilen));
      if (m.yakit !== 'ev') verebilir = Math.min(verebilir, sb.tank[m.yakit].dolu);

      m.verilen += verebilir;
      if (m.yakit !== 'ev') sb.tank[m.yakit].dolu -= verebilir;

      if (m.verilen >= hedefNokta - 0.05 || verebilir <= 0.0001 || hedefeKalan <= 0.05) {
        this.satisTamamla(sb, m, false);
      }
    }
  },

  musteriBul: function (sb, mid) {
    for (var i = 0; i < sb.kuyruk.length; i++) if (sb.kuyruk[i].id === mid) return sb.kuyruk[i];
    return null;
  },
  musteriIdx: function (sb, mid) {
    for (var i = 0; i < sb.kuyruk.length; i++) if (sb.kuyruk[i].id === mid) return i;
    return -1;
  },

  /* =========================================================
     SATIŞ KAPAMA
     ========================================================= */
  /**
   * @param elle  oyuncu kendi mi doldurdu
   * @param yanlisYakit elle serviste yanlış nozul kullanıldıysa
   * @returns sonuç özeti
   */
  satisTamamla: function (sb, m, elle, yanlisYakit) {
    var s = D.s;
    var yk = m.yakit;
    var fiyat = sb.fiyat[yk];
    var maliyet = yk === 'ev' ? this.elektrikMaliyet(sb) : D.toptanFiyat(yk);
    var sonuc = { tip: 'ok' };

    /* pompayı boşalt */
    if (m.pompa !== null && sb.yapi[m.pompa] && sb.yapi[m.pompa].mesgul === m.id) sb.yapi[m.pompa].mesgul = null;
    var idx = this.musteriIdx(sb, m.id);
    if (idx >= 0) sb.kuyruk.splice(idx, 1);

    s.ist.musteri++;
    if (elle) s.ist.elleServis++; else s.ist.otoServis++;

    /* --- yanlış yakıt --- */
    if (yanlisYakit) {
      var kayip = m.verilen * maliyet;
      s.para -= kayip;
      s.ist.dokulen += m.verilen;
      s.ist.dokulenTl += kayip;
      s.ist.bugunGider += kayip;
      s.ist.mutsuz++;
      sb.memnuniyet = kisitla(sb.memnuniyet - 7, 0, 100);
      s.marka = kisitla(s.marka - 1.4, 0, 100);
      return { tip: 'yanlis', kayip: kayip, verilen: m.verilen };
    }

    var hedef = m.hedef;
    var verilen = m.verilen;
    var fark = verilen - hedef;
    var satilan = verilen, dokulen = 0;

    /* taşma: müşteri yalnız hedefi öder, fazlası yere döküldü */
    if (fark > 0.30) {
      satilan = hedef;
      dokulen = fark;
      s.ist.dokulen += dokulen;
      s.ist.dokulenTl += dokulen * maliyet;
      s.ist.bugunGider += dokulen * maliyet;
    }

    var ciro = satilan * fiyat;
    var kar = satilan * (fiyat - maliyet) - dokulen * maliyet;

    /* --- bahşiş / memnuniyet --- */
    var bahsis = 0, isabet = 'orta';
    var mutlulukKat = (sb.temizlik / 100) * 0.3 + 0.7;
    if (dokulen > 0.001) {
      isabet = 'tasma';
      sb.memnuniyet = kisitla(sb.memnuniyet - kisitla(dokulen * 1.4, 0.5, 6), 0, 100);
      s.ist.mutsuz++;
    } else if (Math.abs(fark) <= 0.15) {
      isabet = 'tam';
      if (elle) { bahsis = ciro * 0.10 * m.bahsis * mutlulukKat; s.ist.tamIsabet++; }
      sb.memnuniyet = kisitla(sb.memnuniyet + 1.4, 0, 100);
      s.ist.mutlu++;
      s.marka = kisitla(s.marka + 0.22, 0, 100);
    } else if (Math.abs(fark) <= 0.60) {
      isabet = 'iyi';
      if (elle) bahsis = ciro * 0.035 * m.bahsis * mutlulukKat;
      sb.memnuniyet = kisitla(sb.memnuniyet + 0.5, 0, 100);
      s.ist.mutlu++;
    } else {
      isabet = 'eksik';
      sb.memnuniyet = kisitla(sb.memnuniyet - 0.9, 0, 100);
    }
    if (hedef - verilen > hedef * 0.25) {
      /* ciddi eksik dolum */
      sb.memnuniyet = kisitla(sb.memnuniyet - 1.6, 0, 100);
    }

    /* --- ek tesis geliri + sezon kampanyası --- */
    var ekGelir = this.ekTesisGeliri(sb, m);
    ekGelir += this.kampanyaIlerlet(sb);

    s.para += ciro + bahsis + ekGelir;
    s.ist.ciro += ciro + ekGelir;
    s.ist.kar += kar + bahsis + ekGelir;
    s.ist.bugunCiro += ciro + bahsis + ekGelir;
    s.ist.satisL[yk] += satilan;

    /* --- XP --- */
    var xp = Math.round(satilan * 0.7 + (isabet === 'tam' ? 18 : 0) + ekGelir * 0.02);
    D.xpEkle(xp);

    sb.hizmetSayac++;
    this.basarimKontrol();

    /* izometrik sahnede uçan kazanç */
    if (window.IZO && IZO.cz && m.pompa !== null) {
      var px = m.pompa % sb.w, py = Math.floor(m.pompa / sb.w);
      IZO.ucur(px + 0.5, py + 0.4, '+' + tl(ciro + bahsis + ekGelir),
        isabet === 'tam' ? '#ffd166' : (isabet === 'tasma' ? '#ff8f8f' : '#6ee2a0'));
    }

    return {
      tip: 'ok', isabet: isabet, satilan: satilan, dokulen: dokulen,
      ciro: ciro, bahsis: bahsis, kar: kar, ekGelir: ekGelir, xp: xp, fark: fark
    };
  },

  elektrikMaliyet: function (sb) {
    var ure = D.gucUretim(sb), tuk = D.gucTuketim(sb);
    var kendi = kisitla(ure / Math.max(1, tuk), 0, 1);
    return VERI.sebekeFiyat * (1 - kendi * 0.85);
  },

  ekTesisGeliri: function (sb, m) {
    var top = 0, bi = D.binalar(sb);
    var bekleme = 1;
    for (var i = 0; i < bi.length; i++) {
      var t = bi[i].b.t, tan = VERI.binalar[t];
      if (!tan || !tan.gelir || bi[i].b.arizali) continue;
      var sans = tan.cekim * (1 + 0.22 * (bi[i].b.sv - 1)) * bekleme;
      if (t === 'restoran' && (m.arac === 'Tır' || m.arac === 'Otobüs')) sans *= 2.6;
      if (t === 'tirpark' && (m.arac === 'Tır' || m.arac === 'Otobüs')) sans *= 4.0;
      if (t === 'yikama' && SIM.olayVar('hava')) sans *= 1.8;
      if (t === 'yag' && m.arac === 'Ticari Araç') sans *= 1.6;
      if (Math.random() < kisitla(sans, 0, 0.85)) {
        top += tan.gelir * (1 + 0.3 * (bi[i].b.sv - 1)) * rastgele(0.7, 1.5) * (m.bahsis > 1.5 ? 1.6 : 1);
      }
    }
    return top;
  },

  /* =========================================================
     KAMPANYA / BAŞARIM
     ========================================================= */
  kampanya: function () {
    var s = D.s;
    if (!s.kampanya) s.kampanya = { sezonIdx: s.sezonIdx, sayac: 0, bitti: false };
    if (s.kampanya.sezonIdx !== s.sezonIdx) {
      s.kampanya = { sezonIdx: s.sezonIdx, sayac: 0, bitti: false };
    }
    var tanim = VERI.kampanyalar[VERI.sezonSira[s.sezonIdx]];
    return { tanim: tanim, sayac: s.kampanya.sayac, bitti: s.kampanya.bitti };
  },

  kampanyaIlerlet: function (sb) {
    var s = D.s;
    var k = this.kampanya();
    if (k.bitti) return 0;
    if (!D.binaSayisi(sb, 'market')) return 0;
    if (Math.random() > 0.26) return 0;
    s.kampanya.sayac++;
    var urunGeliri = Math.round(k.tanim.odul / k.tanim.hedef * 0.22);
    if (s.kampanya.sayac >= k.tanim.hedef) {
      s.kampanya.bitti = true;
      s.para += k.tanim.odul;
      s.ist.bugunCiro += k.tanim.odul;
      s.ist.ciro += k.tanim.odul;
      s.marka = kisitla(s.marka + 3, 0, 100);
      D.xpEkle(400);
      UI.bildir('🎉 Kampanya tamam', k.tanim.ad + ' hedefi doldu · ödül ' + tl(k.tanim.odul), 'iyi');
    }
    return urunGeliri;
  },

  basarimKontrol: function () {
    var s = D.s;
    if (!s.basarimlar) s.basarimlar = [];
    for (var i = 0; i < VERI.basarimlar.length; i++) {
      var b = VERI.basarimlar[i];
      if (s.basarimlar.indexOf(b.id) >= 0) continue;
      var oldu = false;
      try { oldu = !!b.kosul(s); } catch (e) { oldu = false; }
      if (!oldu) continue;
      s.basarimlar.push(b.id);
      s.para += b.odul;
      s.ist.bugunCiro += b.odul;
      D.xpEkle(250);
      if (UI.basarimToast) UI.basarimToast(b);
    }
  },

  /* =========================================================
     SİPARİŞ / TEDARİK
     ========================================================= */
  siparisVer: function (sb, yakit, miktar) {
    var birim = D.toptanFiyat(yakit);
    var tutar = birim * miktar;
    var nakliye = D.s.rafineri.aktif ? 0 : 2500 + miktar * 0.35;
    if (!D.harca(tutar + nakliye, 'sipariş')) return false;
    var sure = D.s.rafineri.aktif ? rastgeleTam(8, 25) : rastgeleTam(45, 150);
    sb.siparis.push({ id: id(), yakit: yakit, miktar: miktar, kalan: sure, birim: birim });
    UI.bildir('Sipariş verildi', say(miktar, 0) + ' L ' + VERI.yakitlar[yakit].ad + ' · ' + tl(tutar + nakliye) + ' · ' + sure + ' dk', 'iyi');
    return true;
  },

  siparisIsle: function (sb, dk) {
    for (var i = sb.siparis.length - 1; i >= 0; i--) {
      var o = sb.siparis[i];
      o.kalan -= dk;
      if (o.kalan <= 0) {
        var kap = D.tankKap(sb, o.yakit);
        sb.tank[o.yakit].kap = kap;
        var yer = kap - sb.tank[o.yakit].dolu;
        var giren = Math.min(yer, o.miktar);
        sb.tank[o.yakit].dolu += giren;
        sb.siparis.splice(i, 1);
        if (giren < o.miktar) {
          UI.bildir('Tanker geldi', say(giren, 0) + ' L boşaltıldı, ' + say(o.miktar - giren, 0) + ' L tanka sığmadı (iade yok).', 'uyari');
        } else {
          UI.bildir('Tanker geldi', say(giren, 0) + ' L ' + VERI.yakitlar[o.yakit].ad + ' tanka boşaltıldı.', 'iyi');
        }
      }
    }
  },

  /* =========================================================
     OLAYLAR
     ========================================================= */
  olayVar: function (idv) {
    for (var i = 0; i < D.s.olaylar.length; i++) if (D.s.olaylar[i].id === idv) return true;
    return false;
  },

  olayUret: function () {
    var top = 0;
    for (var i = 0; i < VERI.olaylar.length; i++) top += VERI.olaylar[i].olasilik;
    var r = Math.random() * top, o = VERI.olaylar[0];
    for (var j = 0; j < VERI.olaylar.length; j++) { r -= VERI.olaylar[j].olasilik; if (r <= 0) { o = VERI.olaylar[j]; break; } }
    if (this.olayVar(o.id)) return;

    var sb = D.sube();

    if (o.id === 'ariza') {
      var aday = [];
      for (var k = 0; k < sb.yapi.length; k++) if (sb.yapi[k] && !sb.yapi[k].arizali) aday.push(k);
      if (!aday.length) return;
      var se = secRast(aday);
      sb.yapi[se].arizali = true;
      sb.yapi[se].bakim = Math.min(sb.yapi[se].bakim, 35);
      UI.bildir('🔩 Arıza', (sb.yapi[se].t === 'pompa' ? 'Bir pompa' : VERI.binalar[sb.yapi[se].t].ad) + ' bozuldu. Tamir et.', 'kotu');
      return;
    }

    if (o.id === 'denetim') {
      var puan = (sb.temizlik * 0.4 + D.bakimOrt(sb) * 0.4 + sb.memnuniyet * 0.2);
      if (puan >= 70) {
        var odul = 4000 + D.s.seviye * 2500;
        D.s.para += odul; D.s.ist.bugunCiro += odul;
        D.s.marka = kisitla(D.s.marka + 2.5, 0, 100);
        UI.bildir('📋 Denetim geçildi', 'Temizlik ve bakım yerinde. Teşvik: ' + tl(odul), 'iyi');
      } else {
        var ceza = 8000 + D.s.seviye * 4000;
        D.s.para -= ceza; D.s.ist.bugunGider += ceza;
        D.s.marka = kisitla(D.s.marka - 4, 0, 100);
        UI.bildir('📋 Denetim cezası', 'Bakım/temizlik yetersiz. Ceza: ' + tl(ceza), 'kotu');
      }
      return;
    }

    var sure = rastgeleTam(o.sure[0], o.sure[1]);
    D.s.olaylar.push({ id: o.id, kalan: sure });
    if (o.id === 'kesinti') sb.kesinti = true;
    UI.bildir(o.emoji + ' ' + o.ad, o.aciklama + ' (' + sure + ' dk)', o.id === 'indirim' || o.id === 'akin' || o.id === 'turist' ? 'iyi' : 'uyari');
  },

  olaylariIsle: function () {
    for (var i = D.s.olaylar.length - 1; i >= 0; i--) {
      var o = D.s.olaylar[i];
      o.kalan--;
      if (o.kalan <= 0) {
        if (o.id === 'kesinti') D.sube().kesinti = false;
        D.s.olaylar.splice(i, 1);
      }
    }
  },

  /* =========================================================
     DİĞER ŞUBELER (müdür yönetiminde)
     ========================================================= */
  pasifSubeler: function (dk) {
    var s = D.s;
    for (var i = 0; i < s.subeler.length; i++) {
      if (i === s.aktif) continue;
      var sb = s.subeler[i];
      if (sb.devredildi) continue;
      var mudur = null;
      for (var j = 0; j < sb.personel.length; j++) if (sb.personel[j].tip === 'mudur') mudur = sb.personel[j];
      if (!mudur) continue;

      var verim = 0.45 + mudur.beceri / 220;                 // 0.45 - 0.90
      var musteri = (this.saatlikMusteriPasif(sb) / 60) * dk * verim;
      if (musteri <= 0) continue;

      /* ortalama satış: 45 L karışık */
      var yakitlar = [];
      VERI.yakitSira.forEach(function (y) { if (SIM.yakitVar(sb, y)) yakitlar.push(y); });
      if (!yakitlar.length) continue;
      var yk = secRast(yakitlar);
      var litreMik = musteri * 42;
      if (yk !== 'ev') {
        litreMik = Math.min(litreMik, sb.tank[yk].dolu);
        sb.tank[yk].dolu -= litreMik;
      }
      var maliyet = yk === 'ev' ? this.elektrikMaliyet(sb) : D.toptanFiyat(yk);
      var ciro = litreMik * sb.fiyat[yk];
      s.para += ciro;
      s.ist.ciro += ciro;
      s.ist.kar += litreMik * (sb.fiyat[yk] - maliyet);
      s.ist.bugunCiro += ciro;
      s.ist.satisL[yk] += litreMik;
      if (Math.random() < 0.02 * dk) D.xpEkle(Math.round(litreMik));
    }
  },

  saatlikMusteriPasif: function (sb) {
    var lok = D.lok(sb);
    var pompa = 0, po = D.pompalar(sb);
    for (var i = 0; i < po.length; i++) if (!po[i].p.arizali) pompa++;
    if (!pompa) return 0;
    var k = lok.trafik * D.sezon().trafik * this.saatKat(D.s.saat);
    k *= (0.8 + 0.4 * (D.s.marka / 100));
    k *= this.fiyatKat(sb);
    k *= (1 + this.binaCekim(sb));
    return k * 2.2 * pompa;
  },

  /* =========================================================
     İNŞA / YÜKSELTME / TAMİR
     ========================================================= */
  betonFiyat: function (sb) {
    var dokulu = 0;
    for (var i = 0; i < sb.beton.length; i++) if (sb.beton[i]) dokulu++;
    return Math.round(9000 + dokulu * 1800 + D.lok(sb).trafik * 4000);
  },

  betonDok: function (sb, i) {
    if (sb.beton[i]) return false;
    var f = this.betonFiyat(sb);
    if (!D.harca(f)) return false;
    sb.beton[i] = true;
    D.xpEkle(25);
    return true;
  },

  pompaKur: function (sb, i, yakit) {
    if (!sb.beton[i] || sb.yapi[i]) return false;
    var lok = D.lok(sb);
    if (D.pompalar(sb).length >= lok.maxPompa) {
      UI.bildir('Pompa sınırı', lok.ad + ' en fazla ' + lok.maxPompa + ' pompa alır.', 'kotu');
      return false;
    }
    var f = VERI.pompa.fiyat[yakit];
    if (!D.harca(f)) return false;
    sb.yapi[i] = { t: 'pompa', yakit: yakit, sv: 1, bakim: 100, mesgul: null, arizali: false };
    D.xpEkle(120);
    UI.bildir('Pompa kuruldu', VERI.yakitlar[yakit].ad + ' pompası hizmete girdi.', 'iyi');
    return true;
  },

  binaKur: function (sb, i, tip) {
    if (!sb.beton[i] || sb.yapi[i]) return false;
    var tan = VERI.binalar[tip];
    if (D.s.seviye < tan.seviyeSart) {
      UI.bildir('Seviye yetersiz', tan.ad + ' için seviye ' + tan.seviyeSart + ' gerekiyor.', 'kotu');
      return false;
    }
    if (!D.harca(tan.fiyat)) return false;
    sb.yapi[i] = { t: tip, sv: 1, bakim: 100, arizali: false };
    if (tip === 'depo') VERI.yakitSira.forEach(function (y) { if (y !== 'ev') sb.tank[y].kap = D.tankKap(sb, y); });
    D.xpEkle(200);
    UI.bildir(tan.ad + ' açıldı', tan.aciklama, 'iyi');
    return true;
  },

  yukselt: function (sb, i) {
    var y = sb.yapi[i];
    if (!y) return false;
    if (y.t === 'pompa') {
      if (y.sv >= VERI.pompa.akis.length) return false;
      var f = VERI.pompa.yukseltme[y.sv];
      if (!D.harca(f)) return false;
      y.sv++; y.bakim = 100;
      D.xpEkle(80);
      return true;
    }
    var tan = VERI.binalar[y.t];
    if (y.sv >= tan.sv) return false;
    var bedel = Math.round(tan.svFiyat * Math.pow(1.6, y.sv - 1));
    if (!D.harca(bedel)) return false;
    y.sv++; y.bakim = 100;
    if (y.t === 'depo') VERI.yakitSira.forEach(function (yy) { if (yy !== 'ev') sb.tank[yy].kap = D.tankKap(sb, yy); });
    D.xpEkle(120);
    return true;
  },

  yukseltmeBedeli: function (y) {
    if (!y) return 0;
    if (y.t === 'pompa') return y.sv >= VERI.pompa.akis.length ? 0 : VERI.pompa.yukseltme[y.sv];
    var tan = VERI.binalar[y.t];
    return y.sv >= tan.sv ? 0 : Math.round(tan.svFiyat * Math.pow(1.6, y.sv - 1));
  },

  bakimBedeli: function (y) {
    var temel = y.t === 'pompa' ? 6000 : (VERI.binalar[y.t].fiyat * 0.035);
    var eksik = (100 - y.bakim) / 100;
    return Math.round(temel * (0.25 + eksik) * (y.arizali ? 2.4 : 1) * y.sv);
  },

  bakimYap: function (sb, i) {
    var y = sb.yapi[i];
    if (!y) return false;
    var f = this.bakimBedeli(y);
    if (!D.harca(f)) return false;
    y.bakim = 100; y.arizali = false;
    D.xpEkle(30);
    return true;
  },

  yik: function (sb, i) {
    var y = sb.yapi[i];
    if (!y) return false;
    if (y.t === 'pompa' && y.mesgul) {
      UI.bildir('Pompa meşgul', 'Önce müşteriyi bitir.', 'kotu');
      return false;
    }
    var deger = y.t === 'pompa' ? VERI.pompa.fiyat[y.yakit] : VERI.binalar[y.t].fiyat;
    var geri = Math.round(deger * 0.35 * y.sv * (y.bakim / 100));
    sb.yapi[i] = null;
    /* pompacı ataması kalkar */
    sb.personel.forEach(function (p) { if (p.pompa === i) p.pompa = null; });
    D.kazan(geri);
    UI.bildir('Yıkıldı', 'Hurda/iade bedeli: ' + tl(geri), 'uyari');
    return true;
  },

  temizlikYap: function (sb) {
    var f = Math.round(2500 + (100 - sb.temizlik) * 220);
    if (!D.harca(f)) return false;
    sb.temizlik = 100;
    sb.memnuniyet = kisitla(sb.memnuniyet + 3, 0, 100);
    return true;
  },

  /* =========================================================
     ARSA / ŞUBE / RAFİNERİ
     ========================================================= */
  arsaGenislet: function (sb) {
    var lok = D.lok(sb);
    if (sb.w >= lok.w && sb.h >= lok.h) return false;
    var bedel = Math.round((sb.w * sb.h) * 22000 * lok.trafik);
    if (!D.harca(bedel)) return false;
    /* satır/sütun ekle */
    var yeniW = sb.w, yeniH = sb.h;
    if (sb.w < lok.w && (sb.w <= sb.h || sb.h >= lok.h)) yeniW = sb.w + 1; else yeniH = sb.h + 1;
    var yeniYapi = new Array(yeniW * yeniH).fill(null);
    var yeniBeton = new Array(yeniW * yeniH).fill(false);
    for (var y = 0; y < sb.h; y++) {
      for (var x = 0; x < sb.w; x++) {
        var eski = y * sb.w + x, yeni = y * yeniW + x;
        yeniYapi[yeni] = sb.yapi[eski];
        yeniBeton[yeni] = sb.beton[eski];
      }
    }
    /* personel pompa indeksleri kaydı */
    sb.personel.forEach(function (p) {
      if (p.pompa === null || p.pompa === undefined) return;
      var ex = p.pompa % sb.w, ey = Math.floor(p.pompa / sb.w);
      p.pompa = ey * yeniW + ex;
    });
    sb.kuyruk.forEach(function (m) {
      if (m.pompa === null) return;
      var ex = m.pompa % sb.w, ey = Math.floor(m.pompa / sb.w);
      m.pompa = ey * yeniW + ex;
    });
    sb.w = yeniW; sb.h = yeniH;
    sb.yapi = yeniYapi; sb.beton = yeniBeton;
    D.xpEkle(150);
    UI.bildir('Arsa genişledi', sb.w + '×' + sb.h + ' oldu.', 'iyi');
    return true;
  },

  arsaBedeli: function (sb) { return Math.round((sb.w * sb.h) * 22000 * D.lok(sb).trafik); },

  subeAc: function (lokId) {
    var lok = null;
    for (var i = 0; i < VERI.lokasyonlar.length; i++) if (VERI.lokasyonlar[i].id === lokId) lok = VERI.lokasyonlar[i];
    if (!lok) return false;
    for (var j = 0; j < D.s.subeler.length; j++) if (D.s.subeler[j].lok === lokId) return false;
    if (D.s.seviye < lok.seviyeSart) {
      UI.bildir('Seviye yetersiz', lok.ad + ' için seviye ' + lok.seviyeSart + ' gerekiyor.', 'kotu');
      return false;
    }
    if (!D.harca(lok.fiyat)) return false;
    var sb = D.yeniSube(lokId, false);
    /* başlangıç: 2 hücre beton + 1 pompa */
    sb.beton[0] = true; sb.beton[1] = true;
    sb.yapi[0] = { t: 'pompa', yakit: lokId === 'otoyol' ? 'dizel' : 'benzin', sv: 1, bakim: 100, mesgul: null, arizali: false };
    D.s.subeler.push(sb);
    D.xpEkle(600);
    UI.bildir('Yeni şube!', lok.ad + ' açıldı. Tankları doldurup pompa kurmayı unutma.', 'iyi');
    return true;
  },

  devret: function (idx) {
    var sb = D.s.subeler[idx];
    if (sb.devredildi) return false;
    var puan = (sb.memnuniyet * 0.5 + sb.temizlik * 0.2 + D.bakimOrt(sb) * 0.3);
    if (puan < 95) {
      UI.bildir('Devir için hazır değil', '5 yıldız (hizmet puanı 95+) gerekiyor. Şu an: ' + Math.round(puan), 'kotu');
      return false;
    }
    var deger = this.subeDegeri(sb);
    var pesin = Math.round(deger * 0.55);
    var pasif = Math.round(deger * 0.0018);
    sb.devredildi = true;
    sb.kuyruk = [];
    D.s.para += pesin;
    D.s.pasifGelir += pasif;
    D.s.devredilen.push({ ad: sb.ad, pasif: pasif, gun: D.s.gun });
    D.s.marka = kisitla(D.s.marka + 6, 0, 100);
    D.xpEkle(2500);
    UI.bildir('Şube devredildi', pesin !== 0 ? 'Peşin: ' + tl(pesin) + ' · Günlük pasif gelir: ' + tl(pasif) : '', 'iyi');
    return true;
  },

  subeDegeri: function (sb) {
    var d = 0, po = D.pompalar(sb), bi = D.binalar(sb);
    for (var i = 0; i < po.length; i++) d += VERI.pompa.fiyat[po[i].p.yakit] * po[i].p.sv * 0.8;
    for (var j = 0; j < bi.length; j++) d += VERI.binalar[bi[j].b.t].fiyat * bi[j].b.sv * 0.8;
    d += D.lok(sb).fiyat * 0.6;
    d *= (0.7 + (sb.memnuniyet / 100) * 0.6);
    return Math.round(d + 250000);
  },

  rafineriKur: function () {
    if (D.s.rafineri.aktif) return false;
    if (D.s.seviye < VERI.rafineri.seviyeSart) {
      UI.bildir('Seviye yetersiz', 'Rafineri için seviye ' + VERI.rafineri.seviyeSart + ' gerekiyor.', 'kotu');
      return false;
    }
    if (!D.harca(VERI.rafineri.fiyat)) return false;
    D.s.rafineri = { aktif: true, sv: 1, tanker: 1 };
    D.xpEkle(5000);
    UI.bildir('⚙️ Rafineri kuruldu', 'Tüm şubelere %12 indirimli, hızlı tedarik.', 'iyi');
    return true;
  },

  rafineriYukselt: function () {
    var r = D.s.rafineri;
    if (!r.aktif || r.sv >= VERI.rafineri.indirim.length - 1) return false;
    var bedel = VERI.rafineri.svFiyat[r.sv];
    if (!D.harca(bedel)) return false;
    r.sv++;
    D.xpEkle(2000);
    UI.bildir('Rafineri yükseltildi', 'Tedarik indirimi: %' + Math.round(VERI.rafineri.indirim[r.sv] * 100), 'iyi');
    return true;
  },

  tankerAl: function () {
    if (!D.s.rafineri.aktif) return false;
    if (!D.harca(VERI.rafineri.tankerFiyat)) return false;
    D.s.rafineri.tanker++;
    UI.bildir('Tanker alındı', 'Filo: ' + D.s.rafineri.tanker + ' tanker · teslim daha hızlı.', 'iyi');
    return true;
  },

  /* =========================================================
     PERSONEL
     ========================================================= */
  adayUret: function (tip) {
    var t = VERI.personel[tip];
    var beceri = rastgeleTam(35, 97);
    var maas = Math.round((t.maas[0] + (t.maas[1] - t.maas[0]) * (beceri / 100)) / 500) * 500;
    return {
      id: id(), tip: tip,
      ad: secRast(VERI.isimler) + ' ' + secRast(VERI.soyadlar),
      beceri: beceri, maas: maas, pompa: null
    };
  },

  iseAl: function (sb, aday) {
    if (aday.tip === 'mudur') {
      for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].tip === 'mudur') {
        UI.bildir('Zaten müdür var', 'Bu şubede bir müdür çalışıyor.', 'kotu');
        return false;
      }
    }
    if (sb.personel.length >= 12) { UI.bildir('Kadro dolu', 'Bu şubede en fazla 12 personel çalışabilir.', 'kotu'); return false; }
    var pesin = Math.round(aday.maas * 0.5);
    if (!D.harca(pesin)) return false;
    sb.personel.push(aday);
    UI.bildir(aday.ad + ' işe alındı', VERI.personel[aday.tip].ad + ' · maaş ' + tl(aday.maas) + '/ay', 'iyi');
    return true;
  },

  cikar: function (sb, pid) {
    for (var i = 0; i < sb.personel.length; i++) {
      if (sb.personel[i].id === pid) {
        var tazminat = Math.round(sb.personel[i].maas * 0.8);
        D.s.para -= tazminat;
        D.s.ist.bugunGider += tazminat;
        UI.bildir('İşten çıkarıldı', 'Tazminat: ' + tl(tazminat), 'uyari');
        sb.personel.splice(i, 1);
        return true;
      }
    }
    return false;
  },

  pompaAta: function (sb, pid, pompaIdx) {
    var p = null;
    for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].id === pid) p = sb.personel[i];
    if (!p) return false;
    if (pompaIdx !== null) {
      for (var j = 0; j < sb.personel.length; j++) {
        if (sb.personel[j].id !== pid && sb.personel[j].pompa === pompaIdx) sb.personel[j].pompa = null;
      }
    }
    p.pompa = pompaIdx;
    return true;
  }
};
