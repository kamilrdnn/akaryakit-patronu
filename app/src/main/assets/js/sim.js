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
    this.filoKonvoy(sb);
    this.tekliflerTazele();

    /* --- elektrik --- */
    var tuk = D.gucTuketim(sb), ure = D.gucUretim(sb);
    var sebeke = Math.max(0, tuk - ure);
    if (sb.kesinti) sebeke = 0;
    var bedel = sebeke * VERI.sebekeFiyat;
    if (this.geceKapali(sb)) bedel *= 0.35;         /* kapalıyken tüketim düşer */
    if (bedel > 0) { s.para -= bedel; s.ist.bugunGider += bedel; }

    /* --- jeneratör dizel tüketimi --- */
    var jen = D.binalar(sb, 'jenerator');
    for (var j = 0; j < jen.length; j++) {
      var jb = jen[j].b;
      if (jb.arizali) continue;
      if (typeof jb.depo !== 'number') jb.depo = 0;
      var harcanan = 9 * jb.sv;
      if (jb.depo >= harcanan) {
        jb.depo -= harcanan;
        if (jb.depo < this.jeneratorKap(jb) * 0.18 && !jb.uyarildi) {
          jb.uyarildi = true;
          UI.bildir('⛽ Jeneratör yakıtı azaldı', 'Jeneratör deposunda ' + say(jb.depo, 0) + ' L kaldı — doldur.', 'uyari');
        }
      } else {
        jb.depo = 0;
        jb.calismiyor = true;
        UI.bildir('🔋 Jeneratör durdu', 'Deposu boşaldı. Yapı kartından dizel doldur.', 'kotu');
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
    var rInd = this.rakipIndirim(sb);
    VERI.yakitSira.forEach(function (y) {
      var hedef = s.toptan[y] * (y === 'ev' ? 1.85 : 1.17);
      if (SIM.olayVar('savas')) hedef *= 0.94;
      hedef *= (1 - rInd);
      sb.rakip[y] = +(sb.rakip[y] + (hedef - sb.rakip[y]) * 0.25).toFixed(2);
    });

    /* --- yeni olay --- */
    if (Math.random() < 0.22) this.olayUret();

    this.seviyeUyarilari(sb);
    this.basarimKontrol();

    /* --- memnuniyet yavaş toparlanma --- */
    var konfor = 0, bik = D.binalar(sb);
    for (var kf = 0; kf < bik.length; kf++) {
      var tnk = VERI.binalar[bik[kf].b.t];
      if (tnk && tnk.konfor && !bik[kf].b.arizali) konfor += tnk.konfor * (0.7 + 0.3 * bik[kf].b.sv);
    }
    var konforEtki = kisitla(konfor / 22, 0, 1.6) - (D.binaSayisi(sb, 'wc') ? 0 : 0.5);
    sb.memnuniyet = kisitla(sb.memnuniyet + (sb.temizlik > 70 ? 0.4 : -0.3) + konforEtki * 0.5, 0, 100);
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

    s.subeler.forEach(function (sbr) { SIM.rakipGunSonu(sbr); });
    this.kredileriIsle();
    this.sozlesmeleriIsle();
    this.filolariIsle();
    this.programlariIsle();
    /* günlük sayaçları sıfırla ve yeni görev ver */
    s.subeler.forEach(function (sbx) {
      sbx.gunlukYakit = { benzin: 0, dizel: 0, lpg: 0, ev: 0 };
      sbx.bugun = { musteri: 0, isabet: 0, litre: 0, marketUrun: 0, ciro: 0, bakim: 0, kacan: 0, tankBos: 0, kuyrukDolu: 0 };
      if (sbx.market) sbx.market.gunlukSatis = {};
    });
    this.gorevleriYenile();
    if (Math.random() < 0.5 || !s.sozlesmeTeklif.length) this.sozlesmeTeklifleriUret();

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
     - EV şarj ünitesi yalnızca elektrik verir
     - benzin / dizel / LPG pompaları çok tabancalıdır: üçünü de verir,
       kendi türünü tam hızda, diğerlerini %70 hızda */
  pompaUygun: function (p, y) {
    /* elektrik yalnızca şarj ünitesinden; diğer pompalar benzin, dizel ve LPG'nin
       üçünü birden verir (kendi türü tam hızda, diğerleri %70 hızda) */
    if (p.yakit === 'ev' || y === 'ev') return p.yakit === 'ev' && y === 'ev';
    return true;
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
  /* gece kapatma: 00:00–05:00 arası istasyon kapalı */
  geceKapali: function (sb) {
    if (!sb.gece) return false;
    var sa = D.s.saat;
    return sa >= 0 && sa < 5;
  },

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
    k *= this.rakipCekim(sb);
    if (sb.program) {
      if (sb.program.sadakat) k *= 1.12;
      if (sb.program.premium) k *= 0.96;
    }
    k *= this.girisKat(sb);
    return k * 2.2 * pompa;
  },

  musteriUret: function (sb) {
    if (sb.devredildi) return;
    if (this.geceKapali(sb)) return;
    var po = D.pompalar(sb);
    var calisan = 0;
    for (var ci = 0; ci < po.length; ci++) if (!po[ci].p.arizali) calisan++;
    /* kuyruk uzunsa müşteri istasyona hiç girmez (geçip gider, ceza yok) */
    if (sb.kuyruk.length >= Math.max(2, Math.ceil(calisan * 1.6) + (this.girisSeviye(sb) - 1))) {
      if (sb.bugun) sb.bugun.kuyrukDolu++;
      return;
    }

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
      if (hedef > mevcut) {
        hedef = mevcut * rastgele(0.5, 0.95);
        if (sb.bugun) sb.bugun.tankBos++;
        if (Math.random() < 0.4) this.sikayet(sb, 'stokYok', { emoji: '🚗', arac: 'Müşteri' });
      }
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
      durum: 'bekliyor',
      kartli: !!(sb.program && sb.program.sadakat && Math.random() < 0.34),
      premium: !!(sb.program && sb.program.premium && yakit !== 'ev' && Math.random() < 0.38)
    };
  },

  /* sabır tüketimi, ayrılanlar */
  kuyrukIsle: function (sb, dk) {
    for (var i = sb.kuyruk.length - 1; i >= 0; i--) {
      var m = sb.kuyruk[i];
      if (m.durum === 'servis') continue;
      if (m.yolda) continue;                           // aracı pompaya yanaşırken sabrı tükenmez
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
    if (sb.bugun) sb.bugun.kacan++;
    /* bekleyip giden müşteri şikâyet bırakır */
    if (Math.random() < (pompadaydi ? 0.75 : 0.3)) {
      var arizaliMi = pompadaydi && sb.yapi[m.pompa] && sb.yapi[m.pompa].arizali;
      this.sikayet(sb, arizaliMi ? 'ariza' : 'bekleme', m);
    }
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
      if (m.yolda) continue;                // araç henüz pompaya yanaşmadı

      /* gerçekçi akış: araç yanaşır, kapak açılır, tabanca takılır */
      if (m.hazirlik === undefined) m.hazirlik = rastgele(1.6, 3.2) * (1.4 - pompaci.beceri / 180);
      if (m.hazirlik > 0) { m.hazirlik -= dk; continue; }

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
        if (m.odeme === undefined) m.odeme = rastgele(0.8, 2.0);   /* tabanca yerine, ödeme */
        m.odeme -= dk;
        if (m.odeme <= 0) this.satisTamamla(sb, m, false);
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
  satisTamamla: function (sb, m, elle, yanlisYakit, onAyarli) {
    var s = D.s;
    var yk = m.yakit;
    var fiyat = sb.fiyat[yk];
    if (m.filo) fiyat = +(fiyat * (1 - (m.iskonto || 0))).toFixed(3);
    if (m.premium) fiyat = +(fiyat * 1.09).toFixed(3);
    if (m.kartli) fiyat = +(fiyat * 0.985).toFixed(3);
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
      this.sikayet(sb, 'yanlis', m);
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

    /* --- ödemeden kaçan müşteri --- */
    var kacak = false;
    if (!m.filo && !m.kartli && satilan > 8) {
      var kamera = D.binaSayisi(sb, 'kamera');
      var risk = (elle ? 0.004 : 0.016) * (1 + (100 - sb.memnuniyet) / 150);
      if (D.s.saat >= 23 || D.s.saat <= 4) risk *= 1.8;
      if (kamera) risk *= 0.12;
      if (Math.random() < risk) {
        kacak = true;
        if (kamera) {
          /* kamera kaydı: plaka tespit, tahsilat yapılır */
          UI.bildir('📹 Kaçak yakalandı', 'Araç ödemeden kaçtı ama kamera plakayı aldı; ' + tl(ciro) + ' tahsil edildi.', 'uyari');
          kacak = false;
          D.s.ist.kacak = (D.s.ist.kacak || 0) + 0;
        } else {
          ciro = 0;
          kar = -(satilan * maliyet) - dokulen * maliyet;
          D.s.ist.kacak = (D.s.ist.kacak || 0) + 1;
          D.s.ist.kacakTl = (D.s.ist.kacakTl || 0) + satilan * fiyat;
          sb.memnuniyet = kisitla(sb.memnuniyet - 1, 0, 100);
          UI.bildir('🏃 Ödemeden kaçtı!', say(satilan, 0) + ' ' + VERI.yakitlar[yk].birim + ' alıp gitti. Güvenlik kamerası bu işi bitirir.', 'kotu');
        }
      }
    }

    /* --- bahşiş / memnuniyet --- */
    var bahsis = 0, isabet = 'orta';
    var mutlulukKat = (sb.temizlik / 100) * 0.3 + 0.7;
    if (dokulen > 0.001) {
      isabet = 'tasma';
      sb.memnuniyet = kisitla(sb.memnuniyet - kisitla(dokulen * 1.4, 0.5, 6), 0, 100);
      s.ist.mutsuz++;
    } else if (Math.abs(fark) <= 0.15) {
      isabet = 'tam';
      if (elle) { bahsis = ciro * 0.10 * m.bahsis * mutlulukKat * (onAyarli ? 0.5 : 1); s.ist.tamIsabet++; }
      sb.memnuniyet = kisitla(sb.memnuniyet + 1.4, 0, 100);
      s.ist.mutlu++;
      s.marka = kisitla(s.marka + 0.22, 0, 100);
    } else if (Math.abs(fark) <= 0.60) {
      isabet = 'iyi';
      if (elle) bahsis = ciro * 0.035 * m.bahsis * mutlulukKat * (onAyarli ? 0.5 : 1);
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
    var ekGelir = 0;
    if (!kacak) {
      ekGelir = this.ekTesisGeliri(sb, m);
      ekGelir += this.marketSatis(sb, m);
      ekGelir += this.kampanyaIlerlet(sb);
    } else { bahsis = 0; }

    s.para += ciro + bahsis + ekGelir;
    s.ist.ciro += ciro + ekGelir;
    s.ist.kar += kar + bahsis + ekGelir;
    s.ist.bugunCiro += ciro + bahsis + ekGelir;
    s.ist.satisL[yk] += satilan;

    /* --- XP --- */
    var xp = Math.round(satilan * 0.7 + (isabet === 'tam' ? 18 : 0) + ekGelir * 0.02);
    D.xpEkle(xp);

    sb.hizmetSayac++;
    if (!sb.bugun) sb.bugun = { musteri: 0, isabet: 0, litre: 0, marketUrun: 0, ciro: 0, bakim: 0, kacan: 0, tankBos: 0, kuyrukDolu: 0 };
    if (!sb.gunlukYakit) sb.gunlukYakit = { benzin: 0, dizel: 0, lpg: 0, ev: 0 };
    sb.bugun.musteri++;
    sb.bugun.litre += satilan;
    sb.bugun.ciro += ciro + bahsis + ekGelir;
    if (isabet === 'tam') sb.bugun.isabet++;
    sb.gunlukYakit[yk] = (sb.gunlukYakit[yk] || 0) + satilan;
    if (m.filo) {
      var fl = this.filoBul(m.filo);
      if (fl) { fl.bugunTeslim += satilan; fl.toplamTeslim += satilan; }
    }

    /* --- müşteri geri bildirimi --- */
    if (dokulen > 0.3) this.sikayet(sb, 'tasma', m);
    else if (!this.ortamSikayeti(sb, m)) {
      if (isabet === 'tam' && sb.temizlik > 70 && Math.random() < 0.3) this.ovgu(sb, m);
      else if (sb.memnuniyet > 82 && Math.random() < 0.08) this.ovgu(sb, m);
    }

    this.basarimKontrol();

    /* izometrik sahnede uçan kazanç */
    if (window.IZO && IZO.cz && m.pompa !== null) {
      var px = m.pompa % sb.w, py = Math.floor(m.pompa / sb.w);
      IZO.ucur(px + 0.5, py + 0.4, '+' + tl(ciro + bahsis + ekGelir),
        isabet === 'tam' ? '#ffd166' : (isabet === 'tasma' ? '#ff8f8f' : '#6ee2a0'));
    }

    return {
      tip: 'ok', isabet: isabet, satilan: satilan, dokulen: dokulen,
      ciro: ciro, bahsis: bahsis, kar: kar, ekGelir: ekGelir, xp: xp, fark: fark,
      kacak: !!kacak, kartli: !!m.kartli, premium: !!m.premium
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
      if (t === 'market') continue;              /* market kendi stok sistemiyle satar */
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
     MARKET
     ========================================================= */
  marketVar: function (sb) { return D.binaSayisi(sb, 'market') > 0; },

  marketRafKapasite: function (sb) {
    var top = 0, m = D.binalar(sb, 'market');
    for (var i = 0; i < m.length; i++) {
      if (m[i].b.arizali) continue;
      top += VERI.marketRaf[kisitla(m[i].b.sv, 1, VERI.marketRaf.length - 1)];
    }
    return top;
  },

  marketDoluluk: function (sb) {
    var top = 0;
    for (var i = 0; i < VERI.marketUrunler.length; i++) {
      var u = VERI.marketUrunler[i];
      top += (sb.market.stok[u.id] || 0) * u.raf;
    }
    return top;
  },

  marketUrun: function (id) {
    for (var i = 0; i < VERI.marketUrunler.length; i++) if (VERI.marketUrunler[i].id === id) return VERI.marketUrunler[i];
    return null;
  },

  marketSatisFiyati: function (sb, id) {
    var u = this.marketUrun(id);
    if (!u) return 0;
    var f = sb.market.fiyat[id];
    return (typeof f === 'number' && f > 0) ? f : u.satis;
  },

  marketStokAl: function (sb, id, adet) {
    var u = this.marketUrun(id);
    if (!u || adet <= 0) return false;
    if (!this.marketVar(sb)) { UI.bildir('Market yok', 'Önce bir market inşa etmelisin.', 'kotu'); return false; }
    var bosRaf = this.marketRafKapasite(sb) - this.marketDoluluk(sb);
    var sigar = Math.floor(bosRaf / u.raf);
    if (sigar <= 0) { UI.bildir('Raf dolu', 'Market rafları dolu; market yükselt veya stok erit.', 'kotu'); return false; }
    if (adet > sigar) adet = sigar;
    var tutar = adet * u.alis;
    if (!D.harca(tutar)) return false;
    sb.market.stok[id] = (sb.market.stok[id] || 0) + adet;
    return adet;
  },

  marketTumunuDoldur: function (sb) {
    if (!this.marketVar(sb)) { UI.bildir('Market yok', 'Önce bir market inşa etmelisin.', 'kotu'); return false; }
    var kap = this.marketRafKapasite(sb);
    var hedefPay = kap / VERI.marketUrunler.length;
    var alinan = 0, harcanan = 0;
    for (var i = 0; i < VERI.marketUrunler.length; i++) {
      var u = VERI.marketUrunler[i];
      if (u.sezon && VERI.sezonSira[D.s.sezonIdx] !== u.sezon) continue;
      var hedefAdet = Math.max(1, Math.floor((hedefPay * (0.5 + u.talep / 2)) / u.raf));
      var eksik = hedefAdet - (sb.market.stok[u.id] || 0);
      if (eksik <= 0) continue;
      var bosRaf = this.marketRafKapasite(sb) - this.marketDoluluk(sb);
      if (bosRaf < u.raf) break;
      eksik = Math.min(eksik, Math.floor(bosRaf / u.raf));
      var tutar = eksik * u.alis;
      if (D.s.para < tutar) continue;
      D.s.para -= tutar;
      D.s.ist.bugunGider += tutar;
      sb.market.stok[u.id] = (sb.market.stok[u.id] || 0) + eksik;
      alinan += eksik; harcanan += tutar;
    }
    if (alinan) UI.bildir('Market dolduruldu', say(alinan, 0) + ' ürün · ' + tl(harcanan), 'iyi');
    else UI.bildir('Alım yapılmadı', 'Raf dolu ya da bütçe yetmedi.', 'uyari');
    return alinan;
  },

  /* bir müşterinin market alışverişi; gelir döndürür */
  marketSatis: function (sb, m) {
    if (!this.marketVar(sb)) return 0;
    var marketler = D.binalar(sb, 'market');
    var sv = 1, calisan = false;
    for (var i = 0; i < marketler.length; i++) {
      if (marketler[i].b.arizali) continue;
      calisan = true;
      if (marketler[i].b.sv > sv) sv = marketler[i].b.sv;
    }
    if (!calisan) return 0;

    var kasiyer = 0;
    for (var k = 0; k < sb.personel.length; k++) if (sb.personel[k].tip === 'kasiyer') kasiyer = Math.max(kasiyer, sb.personel[k].beceri);
    var verim = kasiyer ? (0.75 + kasiyer / 400) : 0.5;

    var girisSansi = 0.17 * (1 + 0.22 * (sv - 1)) * verim * (0.7 + sb.temizlik / 330);
    if (m.arac === 'Tır' || m.arac === 'Otobüs') girisSansi *= 1.5;
    if (this.olayVar('turist')) girisSansi *= 1.6;
    if (Math.random() > kisitla(girisSansi, 0, 0.8)) return 0;
    /* müşteri markete uğrayacak: aracı otoparka yönlendir */
    if (window.IZO && IZO.marketNiyeti) IZO.marketNiyeti(m.id);

    var adet = 1 + (Math.random() < 0.45 ? 1 : 0) + (Math.random() < 0.18 ? 1 : 0);
    var gelir = 0;
    var sezon = VERI.sezonSira[D.s.sezonIdx];
    for (var a = 0; a < adet; a++) {
      /* talep ağırlıklı ürün seçimi */
      var aday = [], agir = [], top = 0;
      for (var u = 0; u < VERI.marketUrunler.length; u++) {
        var ur = VERI.marketUrunler[u];
        if (ur.sezon && ur.sezon !== sezon) continue;
        var w = ur.talep;
        if (sezon === 'yaz' && (ur.id === 'su' || ur.id === 'icecek')) w *= 1.6;
        if (sezon === 'kis' && (ur.id === 'cay' || ur.id === 'antifriz')) w *= 1.7;
        /* fiyat esnekliği */
        var oran = this.marketSatisFiyati(sb, ur.id) / ur.satis;
        w *= kisitla(1 + (1 - oran) * 1.4, 0.15, 2.0);
        if (w <= 0) continue;
        aday.push(ur); agir.push(w); top += w;
      }
      if (!top) break;
      var r = Math.random() * top, sec = aday[0];
      for (var z = 0; z < aday.length; z++) { r -= agir[z]; if (r <= 0) { sec = aday[z]; break; } }

      if ((sb.market.stok[sec.id] || 0) <= 0) {
        sb.market.kayipSatis++;
        sb.memnuniyet = kisitla(sb.memnuniyet - 0.12, 0, 100);
        continue;
      }
      sb.market.stok[sec.id]--;
      var fiyat = this.marketSatisFiyati(sb, sec.id);
      gelir += fiyat;
      D.s.ist.marketKar = (D.s.ist.marketKar || 0) + (fiyat - sec.alis);
      sb.market.gunlukSatis[sec.id] = (sb.market.gunlukSatis[sec.id] || 0) + 1;
      if (sb.bugun) sb.bugun.marketUrun++;
    }
    sb.market.ciro += gelir;
    return gelir;
  },

  marketStokDegeri: function (sb) {
    var top = 0;
    for (var i = 0; i < VERI.marketUrunler.length; i++) {
      var u = VERI.marketUrunler[i];
      top += (sb.market.stok[u.id] || 0) * u.alis;
    }
    return top;
  },

  /* =========================================================
     UYARILAR
     ========================================================= */
  seviyeUyarilari: function (sb) {
    if (!sb.uyari) sb.uyari = {};
    var self = this;
    ['benzin', 'dizel', 'lpg'].forEach(function (y) {
      var kap = D.tankKap(sb, y);
      if (!kap) return;
      var o = sb.tank[y].dolu / kap;
      var yolda = false;
      for (var i = 0; i < sb.siparis.length; i++) if (sb.siparis[i].yakit === y) yolda = true;
      if (o < 0.25 && !sb.uyari[y] && !yolda) {
        sb.uyari[y] = true;
        UI.bildir('⚠️ ' + VERI.yakitlar[y].ad + ' azaldı',
          '%' + Math.round(o * 100) + ' kaldı (' + say(sb.tank[y].dolu, 0) + ' L). Sipariş ver.', 'uyari');
      } else if (o > 0.35 || yolda) {
        sb.uyari[y] = false;
      }
    });
    /* market stoğu */
    if (this.marketVar(sb)) {
      var kap2 = this.marketRafKapasite(sb);
      var dolu = this.marketDoluluk(sb);
      var mo = kap2 ? dolu / kap2 : 0;
      if (mo < 0.25 && !sb.uyari.market) {
        sb.uyari.market = true;
        UI.bildir('⚠️ Market stoğu azaldı', '%' + Math.round(mo * 100) + ' dolu. Market menüsünden mal al.', 'uyari');
      } else if (mo > 0.4) sb.uyari.market = false;
    }
  },

  /* =========================================================
     BANKA / FİNANS
     ========================================================= */
  varliklar: function () {
    var s = D.s;
    var v = { nakit: s.para, yakit: 0, market: 0, tesis: 0, arsa: 0, rafineri: 0 };
    for (var i = 0; i < s.subeler.length; i++) {
      var sb = s.subeler[i];
      if (sb.devredildi) continue;
      ['benzin', 'dizel', 'lpg'].forEach(function (y) {
        v.yakit += sb.tank[y].dolu * D.toptanFiyat(y);
      });
      v.market += SIM.marketStokDegeri(sb);
      var po = D.pompalar(sb);
      for (var p = 0; p < po.length; p++) v.tesis += VERI.pompa.fiyat[po[p].p.yakit] * po[p].p.sv * 0.7 * (0.5 + po[p].p.bakim / 200);
      var bi = D.binalar(sb);
      for (var b = 0; b < bi.length; b++) v.tesis += VERI.binalar[bi[b].b.t].fiyat * bi[b].b.sv * 0.7 * (0.5 + bi[b].b.bakim / 200);
      var betonlu = 0;
      for (var c = 0; c < sb.beton.length; c++) if (sb.beton[c]) betonlu++;
      v.arsa += D.lok(sb).fiyat * 0.5 + betonlu * 9000;
    }
    if (s.rafineri.aktif) v.rafineri = VERI.rafineri.fiyat * 0.6 * s.rafineri.sv + s.rafineri.tanker * VERI.rafineri.tankerFiyat * 0.6;
    v.toplam = v.nakit + v.yakit + v.market + v.tesis + v.arsa + v.rafineri;
    return v;
  },

  borcToplam: function () {
    var t = 0;
    for (var i = 0; i < D.s.krediler.length; i++) t += D.s.krediler[i].kalan;
    return t;
  },

  aylikTaksitToplam: function () {
    var t = 0;
    for (var i = 0; i < D.s.krediler.length; i++) t += D.s.krediler[i].taksitTutar;
    return t;
  },

  netDeger: function () { return this.varliklar().toplam - this.borcToplam(); },

  aylikTaksitHesapla: function (anapara, faiz, ay) {
    if (faiz <= 0) return anapara / ay;
    return anapara * faiz / (1 - Math.pow(1 + faiz, -ay));
  },

  krediLimiti: function () {
    var net = this.netDeger();
    var tavan = Math.max(150000, net * VERI.banka.borcOrani);
    return Math.max(0, tavan - this.borcToplam());
  },

  krediTeklifleri: function () {
    var s = D.s, liste = [];
    var limit = this.krediLimiti();
    for (var i = 0; i < VERI.banka.urunler.length; i++) {
      var u = VERI.banka.urunler[i];
      var uygun = s.seviye >= u.seviyeSart && s.krediNotu >= u.notSart;
      /* kredi notu faizi ve tutarı etkiler */
      var faiz = u.faiz * (1.35 - s.krediNotu / 160);
      var tutar = Math.min(u.taban * (0.6 + s.krediNotu / 125), limit);
      tutar = Math.floor(tutar / 10000) * 10000;
      var taksit = this.aylikTaksitHesapla(tutar, faiz, u.taksit);
      liste.push({
        id: u.id, ad: u.ad, tutar: tutar, ay: u.taksit, faiz: faiz,
        taksitTutar: taksit, toplam: taksit * u.taksit,
        uygun: uygun && tutar >= 50000,
        sebep: !uygun ? (s.seviye < u.seviyeSart ? 'Seviye ' + u.seviyeSart + ' gerekli' : 'Kredi notu ' + u.notSart + ' gerekli')
                      : (tutar < 50000 ? 'Limitin yetersiz' : '')
      });
    }
    return liste;
  },

  krediCek: function (teklif) {
    if (!teklif.uygun) { UI.bildir('Kredi verilmedi', teklif.sebep, 'kotu'); return false; }
    if (D.s.krediler.length >= 4) { UI.bildir('Kredi sınırı', 'Aynı anda en fazla 4 kredin olabilir.', 'kotu'); return false; }
    D.s.krediler.push({
      id: id(), ad: teklif.ad, anapara: teklif.tutar, kalan: teklif.tutar,
      faiz: teklif.faiz, taksitTutar: teklif.taksitTutar,
      kalanTaksit: teklif.ay, toplamTaksit: teklif.ay,
      sonrakiGun: D.s.gun + 30, gecikme: 0
    });
    D.s.para += teklif.tutar;
    D.s.ist.bugunCiro += 0;
    UI.bildir('💰 Kredi onaylandı', tl(teklif.tutar) + ' hesabına geçti · ' + teklif.ay + ' taksit × ' + tl(teklif.taksitTutar), 'iyi');
    return true;
  },

  krediKapat: function (kid) {
    for (var i = 0; i < D.s.krediler.length; i++) {
      var k = D.s.krediler[i];
      if (k.id !== kid) continue;
      if (!D.harca(k.kalan)) return false;
      UI.bildir('Kredi kapatıldı', k.ad + ' · ' + tl(k.kalan) + ' ödendi, kalan faizden kurtuldun.', 'iyi');
      D.s.krediler.splice(i, 1);
      D.s.krediNotu = kisitla(D.s.krediNotu + 4, 0, 100);
      return true;
    }
    return false;
  },

  kredileriIsle: function () {
    var s = D.s;
    for (var i = s.krediler.length - 1; i >= 0; i--) {
      var k = s.krediler[i];
      if (s.gun < k.sonrakiGun) continue;
      var borc = k.taksitTutar + (k.gecikme || 0);
      if (s.para >= borc) {
        s.para -= borc;
        s.ist.bugunGider += borc;
        k.kalan = Math.max(0, k.kalan - (borc - k.kalan * k.faiz));
        k.kalanTaksit--;
        k.gecikme = 0;
        k.sonrakiGun = s.gun + 30;
        s.krediNotu = kisitla(s.krediNotu + 1.5, 0, 100);
        if (k.kalanTaksit <= 0 || k.kalan <= 1) {
          UI.bildir('✅ Kredi bitti', k.ad + ' tamamen ödendi.', 'iyi');
          s.krediler.splice(i, 1);
          s.krediNotu = kisitla(s.krediNotu + 6, 0, 100);
        }
      } else {
        k.gecikme = (k.gecikme || 0) + k.taksitTutar * VERI.banka.gecikmeFaizi;
        k.kalan += k.taksitTutar * VERI.banka.gecikmeFaizi;
        k.sonrakiGun = s.gun + 10;
        s.krediNotu = kisitla(s.krediNotu - 8, 0, 100);
        UI.bildir('❌ Taksit ödenemedi', k.ad + ' · gecikme faizi işledi, kredi notun düştü.', 'kotu');
      }
    }
  },

  /* =========================================================
     SİPARİŞ / TEDARİK
     ========================================================= */
  siparisVer: function (sb, yakit, miktar) {
    var ted = VERI.tedarikciler[sb.tedarikci] || VERI.tedarikciler.standart;
    var birim = D.toptanFiyat(yakit) * ted.carpan;
    var tutar = birim * miktar;
    var nakliye = D.s.rafineri.aktif ? 0 : 2500 + miktar * 0.35;
    if (!D.harca(tutar + nakliye, 'sipariş')) return false;
    var sure = D.s.rafineri.aktif ? rastgeleTam(8, 25) : Math.round(rastgeleTam(45, 150) * ted.sure);
    if (sure < 4) sure = 4;
    sb.siparis.push({ id: id(), yakit: yakit, miktar: miktar, kalan: sure, birim: birim });
    D.s.ist.siparis = (D.s.ist.siparis || 0) + 1;
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
     KURUMSAL SÖZLEŞMELER
     ========================================================= */
  sozlesmeTeklifleriUret: function () {
    var s = D.s;
    s.sozlesmeTeklif = [];
    var adet = kisitla(3 + Math.floor(s.seviye / 3), 3, 6);
    for (var i = 0; i < adet; i++) {
      var m = secRast(VERI.sozlesmeMusteriler);
      var gun = rastgeleTam(5, 14);
      var gunlukL = Math.round(rastgeleTam(60, 90 + s.seviye * 22) / 10) * 10;
      var taban = D.toptanFiyat(m.yakit);
      var fiyat = +(taban * rastgele(1.10, 1.26)).toFixed(2);
      var prim = Math.round(gunlukL * gun * taban * rastgele(0.05, 0.12));
      s.sozlesmeTeklif.push({
        id: id(), ad: m.ad, emoji: m.emoji, yakit: m.yakit,
        gun: gun, gunlukL: gunlukL, fiyat: fiyat,
        prim: prim, ceza: Math.round(prim * rastgele(0.6, 1.1)),
        rakipFiyat: +(taban * rastgele(1.06, 1.22)).toFixed(2),
        pazarlik: 0,
        sure: rastgeleTam(2, 5)
      });
    }
  },

  sozlesmePazarlik: function (teklifId) {
    var s = D.s;
    for (var i = 0; i < s.sozlesmeTeklif.length; i++) {
      var t = s.sozlesmeTeklif[i];
      if (t.id !== teklifId) continue;
      if (t.pazarlik >= 3) { UI.bildir('Pazarlık bitti', 'Firma son teklifini verdi.', 'uyari'); return false; }
      var guc = 0.4 + (s.marka / 100) * 0.3 - t.pazarlik * 0.12;
      if (Math.random() > guc) {
        s.sozlesmeTeklif.splice(i, 1);
        UI.bildir('✍️ Teklif geri çekildi', t.ad + ' başka istasyonla anlaştı.', 'kotu');
        return false;
      }
      t.pazarlik++;
      t.fiyat = +(t.fiyat * rastgele(1.015, 1.045)).toFixed(2);
      t.prim = Math.round(t.prim * rastgele(1.05, 1.15));
      t.ceza = Math.round(t.ceza * rastgele(0.88, 0.97));
      UI.bildir('✅ Pazarlık tuttu', t.ad + ' · litre ' + say(t.fiyat, 2) + ' ₺, prim ' + tl(t.prim), 'iyi');
      return true;
    }
    return false;
  },

  sozlesmeImzala: function (teklifId) {
    var s = D.s;
    for (var i = 0; i < s.sozlesmeTeklif.length; i++) {
      var t = s.sozlesmeTeklif[i];
      if (t.id !== teklifId) continue;
      var slimit = this.sozlesmeLimit();
      if (s.sozlesmeler.length >= slimit) { UI.bildir('Sözleşme sınırı', 'Aynı anda en fazla ' + slimit + ' sözleşme yürütebilirsin. (Seviye atladıkça artar)', 'kotu'); return false; }
      var stem = this.sozlesmeTeminat(t);
      if (s.para < stem) { UI.bildir('Teminat yetersiz', 'Bu sözleşme için kasanda en az ' + tl(stem) + ' bulunmalı.', 'kotu'); return false; }
      s.sozlesmeler.push({
        id: t.id, ad: t.ad, emoji: t.emoji, yakit: t.yakit,
        gun: t.gun, kalanGun: t.gun, gunlukL: t.gunlukL, fiyat: t.fiyat,
        prim: t.prim, ceza: t.ceza, basarili: 0, kacirilan: 0, sube: s.aktif
      });
      s.sozlesmeTeklif.splice(i, 1);
      UI.bildir('✍️ Sözleşme imzalandı', t.ad + ' · günde ' + say(t.gunlukL, 0) + ' L ' + VERI.yakitlar[t.yakit].ad, 'iyi');
      return true;
    }
    return false;
  },

  /* =========================================================
     MÜŞTERİ ŞİKAYETLERİ VE ÖVGÜLERİ
     ========================================================= */
  sikayet: function (sb, tip, m) {
    var t = VERI.sikayetTipleri[tip];
    if (!t) return;
    if (!sb.sikayetler) { sb.sikayetler = []; sb.ovguler = []; sb.sikayetSayac = {}; }
    var kayit = {
      id: id(), tip: tip, emoji: t.emoji, baslik: t.ad, metin: t.metin,
      arac: m ? (m.emoji + ' ' + m.arac) : '🚗 Müşteri',
      gun: D.s.gun, saat: ikiHane(D.s.saat) + ':' + ikiHane(D.s.dk),
      okundu: false
    };
    sb.sikayetler.unshift(kayit);
    if (sb.sikayetler.length > 40) sb.sikayetler.pop();
    sb.sikayetSayac[tip] = (sb.sikayetSayac[tip] || 0) + 1;

    /* memnuniyet ve marka etkisi */
    var etki = t.etki * (sb.program && sb.program.sadakat ? 0.85 : 1);
    sb.memnuniyet = kisitla(sb.memnuniyet - etki, 0, 100);
    D.s.marka = kisitla(D.s.marka - etki * 0.25, 0, 100);
    if (sb.bugun) sb.bugun.sikayet = (sb.bugun.sikayet || 0) + 1;
    D.s.ist.sikayet = (D.s.ist.sikayet || 0) + 1;
  },

  ovgu: function (sb, m) {
    if (!sb.ovguler) sb.ovguler = [];
    var o = secRast(VERI.ovguTipleri);
    sb.ovguler.unshift({
      id: id(), emoji: o.emoji, metin: o.metin,
      arac: m ? (m.emoji + ' ' + m.arac) : '🚗 Müşteri',
      gun: D.s.gun, saat: ikiHane(D.s.saat) + ':' + ikiHane(D.s.dk)
    });
    if (sb.ovguler.length > 25) sb.ovguler.pop();
    D.s.ist.ovgu = (D.s.ist.ovgu || 0) + 1;
  },

  /* satış sonrası ortam kaynaklı şikayet kontrolü */
  ortamSikayeti: function (sb, m) {
    /* temizlik */
    if (sb.temizlik < 45 && Math.random() < 0.35) { this.sikayet(sb, 'kirli', m); return true; }
    /* gece elektrik kesintisi */
    if (sb.kesinti && !D.gucYeterli(sb) && (D.s.saat >= 19 || D.s.saat <= 6) && Math.random() < 0.3) {
      this.sikayet(sb, 'karanlik', m); return true;
    }
    /* market var ama boş */
    if (this.marketVar(sb) && Math.random() < 0.2) {
      var bos = true;
      for (var i = 0; i < VERI.marketUrunler.length; i++) {
        if ((sb.market.stok[VERI.marketUrunler[i].id] || 0) > 0) { bos = false; break; }
      }
      if (bos) { this.sikayet(sb, 'marketYok', m); return true; }
    }
    /* tuvalet yokluğu (uzun yol araçları) */
    if (!D.binaSayisi(sb, 'wc') && (m.arac === 'Tır' || m.arac === 'Otobüs') && Math.random() < 0.25) {
      this.sikayet(sb, 'wcYok', m); return true;
    }
    /* fiyat */
    var yk = m.yakit;
    if (sb.rakip[yk] && sb.fiyat[yk] > sb.rakip[yk] * 1.08 && Math.random() < 0.28) {
      this.sikayet(sb, 'pahali', m); return true;
    }
    return false;
  },

  sikayetOzeti: function (sb) {
    var liste = [];
    var say2 = sb.sikayetSayac || {};
    for (var tip in say2) {
      if (!say2[tip]) continue;
      var t = VERI.sikayetTipleri[tip];
      if (!t) continue;
      liste.push({ tip: tip, ad: t.ad, emoji: t.emoji, adet: say2[tip], cozum: t.cozum, sekme: t.sekme });
    }
    liste.sort(function (a, b) { return b.adet - a.adet; });
    return liste;
  },

  sikayetTemizle: function (sb) {
    sb.sikayetler = [];
    sb.sikayetSayac = {};
  },

  /* =========================================================
     TOPLU (FİLO) ANLAŞMALARI
     ========================================================= */
  filoTeklifleriUret: function () {
    var s = D.s;
    s.filoTeklif = [];
    var sb = D.sube();
    var adet = kisitla(3 + Math.floor(s.seviye / 3), 3, 6);
    var havuz = [];
    for (var i = 0; i < VERI.filoAnlasmalar.length; i++) {
      var f = VERI.filoAnlasmalar[i];
      if (s.seviye < f.seviyeSart) continue;
      if (!this.yakitVar(sb, f.yakit)) continue;
      var zatenVar = false;
      for (var j = 0; j < s.filolar.length; j++) if (s.filolar[j].tanim === f.id) zatenVar = true;
      if (!zatenVar) havuz.push(f);
    }
    var temelHavuz = havuz.slice();
    for (var k = 0; k < adet; k++) {
      if (!havuz.length) havuz = temelHavuz.slice();      /* havuz biterse başa dön */
      if (!havuz.length) break;
      var idx = Math.floor(Math.random() * havuz.length);
      var t = havuz.splice(idx, 1)[0];
      var aracSayi = rastgeleTam(t.aracSayi[0], t.aracSayi[1]);
      var aracL = Math.round(rastgele(t.aracL[0], t.aracL[1]));
      var iskonto = +rastgele(t.iskonto[0], t.iskonto[1]).toFixed(3);
      var gun = rastgeleTam(t.gun[0], t.gun[1]);
      var gunlukL = aracSayi * aracL * t.saatler.length;
      var taban = t.yakit === 'ev' ? this.elektrikMaliyet(sb) : D.toptanFiyat(t.yakit);
      s.filoTeklif.push({
        id: id(), tanim: t.id, ad: t.ad, emoji: t.emoji, arac: t.arac, yakit: t.yakit,
        aracSayi: aracSayi, aracL: aracL, saatler: t.saatler.slice(), iskonto: iskonto,
        gun: gun, gunlukL: gunlukL, aciklama: t.aciklama,
        pesin: Math.round(gunlukL * taban * rastgele(0.25, 0.5)),
        prim: Math.round(gunlukL * gun * taban * rastgele(0.03, 0.07)),
        ceza: Math.round(gunlukL * taban * rastgele(0.5, 0.9)),
        /* rakip istasyonun teklifi: seninkinden iyiyse müşteri kaçabilir */
        rakipIskonto: +(iskonto + rastgele(-0.015, 0.02)).toFixed(3),
        pazarlik: 0,
        sure: rastgeleTam(2, 5)            /* kaç saat geçerli */
      });
    }
  },

  /* teklifle pazarlık: iskontoyu düşür, primi artır — kaybetme riski var */
  filoPazarlik: function (teklifId) {
    var s = D.s;
    for (var i = 0; i < s.filoTeklif.length; i++) {
      var t = s.filoTeklif[i];
      if (t.id !== teklifId) continue;
      if (t.pazarlik >= 3) { UI.bildir('Pazarlık bitti', 'Bu firma daha fazla indirim kabul etmiyor.', 'uyari'); return false; }
      /* marka puanı ve memnuniyet pazarlık gücünü artırır */
      var guc = 0.38 + (s.marka / 100) * 0.3 + (D.sube().memnuniyet / 100) * 0.12 - t.pazarlik * 0.12;
      if (Math.random() > guc) {
        s.filoTeklif.splice(i, 1);
        UI.bildir('🤝 Anlaşma bozuldu', t.ad + ' rakip istasyonla anlaştı.', 'kotu');
        return false;
      }
      t.pazarlik++;
      t.iskonto = Math.max(0.01, +(t.iskonto - rastgele(0.008, 0.02)).toFixed(3));
      t.prim = Math.round(t.prim * rastgele(1.06, 1.18));
      t.pesin = Math.round(t.pesin * rastgele(1.02, 1.12));
      UI.bildir('✅ Pazarlık tuttu', t.ad + ' · iskonto %' + say(t.iskonto * 100, 1) + ', prim ' + tl(t.prim), 'iyi');
      return true;
    }
    return false;
  },

  /* saat başı: teklifler tazelenir */
  tekliflerTazele: function () {
    var s = D.s;
    var degisti = false;
    /* süresi dolan filo teklifleri düşsün */
    for (var i = s.filoTeklif.length - 1; i >= 0; i--) {
      s.filoTeklif[i].sure--;
      if (s.filoTeklif[i].sure <= 0) { s.filoTeklif.splice(i, 1); degisti = true; }
    }
    for (var j = s.sozlesmeTeklif.length - 1; j >= 0; j--) {
      s.sozlesmeTeklif[j].sure = (s.sozlesmeTeklif[j].sure || 3) - 1;
      if (s.sozlesmeTeklif[j].sure <= 0) { s.sozlesmeTeklif.splice(j, 1); degisti = true; }
    }
    /* azaldıysa yenilerini üret */
    if (s.filoTeklif.length < 3) { this.filoTeklifleriUret(); degisti = true; }
    if (s.sozlesmeTeklif.length < 3) { this.sozlesmeTeklifleriUret(); degisti = true; }
    return degisti;
  },

  /* aynı anda yürütülebilecek anlaşma sayıları seviyeye göre artar */
  filoLimit: function () { return kisitla(1 + Math.floor(D.s.seviye / 4), 1, 5); },
  sozlesmeLimit: function () { return kisitla(2 + Math.floor(D.s.seviye / 3), 2, 7); },
  /* imza için elde tutulması gereken nakit (teminat) */
  filoTeminat: function (t) { return Math.round(t.ceza * 1.5); },
  sozlesmeTeminat: function (t) { return Math.round(t.ceza * 2); },

  filoImzala: function (teklifId) {
    var s = D.s;
    for (var i = 0; i < s.filoTeklif.length; i++) {
      var t = s.filoTeklif[i];
      if (t.id !== teklifId) continue;
      var limit = this.filoLimit();
      if (s.filolar.length >= limit) { UI.bildir('Filo sınırı', 'Aynı anda en fazla ' + limit + ' toplu anlaşma yürütebilirsin. (Seviye atladıkça artar)', 'kotu'); return false; }
      var tem = this.filoTeminat(t);
      if (s.para < tem) { UI.bildir('Teminat yetersiz', 'Bu anlaşma için kasanda en az ' + tl(tem) + ' bulunmalı.', 'kotu'); return false; }
      s.filolar.push({
        id: t.id, tanim: t.tanim, ad: t.ad, emoji: t.emoji, arac: t.arac, yakit: t.yakit,
        aracSayi: t.aracSayi, aracL: t.aracL, saatler: t.saatler, iskonto: t.iskonto,
        gun: t.gun, kalanGun: t.gun, gunlukL: t.gunlukL,
        prim: t.prim, ceza: t.ceza, sube: s.aktif,
        bugunTeslim: 0, toplamTeslim: 0, kacirilan: 0, sonSaat: -1
      });
      s.para += t.pesin;
      s.ist.bugunCiro += t.pesin;
      s.marka = kisitla(s.marka + 1.5, 0, 100);
      s.filoTeklif.splice(i, 1);
      UI.bildir('🤝 Toplu anlaşma imzalandı', t.ad + ' · peşinat ' + tl(t.pesin) + ' · günde ' + say(t.gunlukL, 0) + ' L', 'iyi');
      return true;
    }
    return false;
  },

  /* saat başı: filo konvoyu gelir */
  filoKonvoy: function (sb) {
    var s = D.s;
    for (var i = 0; i < s.filolar.length; i++) {
      var f = s.filolar[i];
      if (f.sube !== s.aktif) continue;
      if (f.saatler.indexOf(s.saat) < 0 || f.sonSaat === s.saat) continue;
      f.sonSaat = s.saat;
      var geldi = 0;
      for (var a = 0; a < f.aracSayi; a++) {
        if (sb.kuyruk.length >= 10) break;
        var m = this.filoMusterisi(sb, f);
        if (!m) break;
        sb.kuyruk.push(m);
        geldi++;
      }
      if (geldi) UI.bildir(f.emoji + ' ' + f.ad, geldi + ' araçlık konvoy geldi · ' + say(f.aracL, 0) + ' L/araç', 'uyari');
    }
  },

  filoMusterisi: function (sb, f) {
    var aracTanim = null;
    for (var i = 0; i < VERI.araclar.length; i++) if (VERI.araclar[i].ad === f.arac) aracTanim = VERI.araclar[i];
    if (!aracTanim) aracTanim = VERI.araclar[0];
    var hedef = f.aracL * rastgele(0.9, 1.1);
    if (f.yakit !== 'ev') {
      var mevcut = sb.tank[f.yakit].dolu;
      if (hedef > mevcut) hedef = mevcut * 0.9;
      if (hedef < 5) return null;
    }
    hedef = Math.round(hedef);
    return {
      id: id(), arac: aracTanim.ad, emoji: aracTanim.emoji, yakit: f.yakit,
      hedef: hedef, tip: 'litre', etiket: say(hedef, 0) + ' ' + VERI.yakitlar[f.yakit].birim + ' · ' + f.ad,
      bahsis: 0.2, sabir: aracTanim.sabir * 1.6, sabirKalan: aracTanim.sabir * 1.6,
      pompa: null, verilen: 0, durum: 'bekliyor',
      filo: f.id, iskonto: f.iskonto
    };
  },

  filolariIsle: function () {
    var s = D.s;
    for (var i = s.filolar.length - 1; i >= 0; i--) {
      var f = s.filolar[i];
      var oran = f.gunlukL > 0 ? f.bugunTeslim / f.gunlukL : 1;
      if (oran >= 0.8) {
        f.basarili = (f.basarili || 0) + 1;
      } else {
        f.kacirilan++;
        var kesinti = Math.round((f.ceza / f.gun) * (1 - oran));
        s.para -= kesinti;
        s.ist.bugunGider += kesinti;
        UI.bildir('⚠️ Filo açığı', f.ad + ' · ' + say(f.bugunTeslim, 0) + '/' + say(f.gunlukL, 0) + ' L · kesinti ' + tl(kesinti), 'kotu');
      }
      f.bugunTeslim = 0;
      f.sonSaat = -1;
      f.kalanGun--;
      if (f.kalanGun <= 0) {
        if (f.kacirilan === 0) {
          s.para += f.prim;
          s.ist.bugunCiro += f.prim;
          s.marka = kisitla(s.marka + 5, 0, 100);
          D.xpEkle(1200);
          UI.bildir('🏅 Toplu anlaşma tamamlandı', f.ad + ' · prim ' + tl(f.prim), 'iyi');
        } else {
          s.marka = kisitla(s.marka - 3, 0, 100);
          UI.bildir('Anlaşma bitti', f.ad + ' · ' + f.kacirilan + ' gün hedefin altında kaldın.', 'uyari');
        }
        s.filolar.splice(i, 1);
      }
    }
    if (Math.random() < 0.6 || !s.filoTeklif.length) this.filoTeklifleriUret();
  },

  /* =========================================================
     YERLEŞİM PLANI — yapılar üst üste binmesin, düzenli otursun
     ========================================================= */
  hucreBos: function (sb, i) { return i >= 0 && i < sb.yapi.length && sb.beton[i] && !sb.yapi[i]; },

  komsuTipi: function (sb, i, tip) {
    var x = i % sb.w, y = Math.floor(i / sb.w);
    var kom = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var k = 0; k < kom.length; k++) {
      var nx = x + kom[k][0], ny = y + kom[k][1];
      if (nx < 0 || nx >= sb.w || ny < 0 || ny >= sb.h) continue;
      var yp = sb.yapi[ny * sb.w + nx];
      if (yp && (tip === 'pompa' ? yp.t === 'pompa' : yp.t !== 'pompa')) return true;
    }
    return false;
  },

  /* =========================================================
     GİRİŞ / ÇIKIŞ DÜZENİ
     ========================================================= */
  girisSeviye: function (sb) { return kisitla(sb.giris || 1, 1, 4); },
  girisBedeli: function (sb) {
    var sv = this.girisSeviye(sb);
    return Math.round(180000 * Math.pow(2.1, sv - 1) * (1 + D.lok(sb).trafik * 0.3));
  },
  girisYukselt: function (sb) {
    var sv = this.girisSeviye(sb);
    if (sv >= 4) { UI.bildir('Maksimum', 'Giriş-çıkış düzeni en geniş hâlinde.', 'uyari'); return false; }
    var f = this.girisBedeli(sb);
    if (!D.harca(f)) return false;
    sb.giris = sv + 1;
    D.xpEkle(250);
    if (window.IZO) IZO._zAnahtar = '';          /* zemin önbelleği yenilensin */
    UI.bildir('🛣️ Giriş genişletildi', 'Seviye ' + sb.giris + ' · araçlar daha hızlı giriyor, kuyruk azalıyor.', 'iyi');
    return true;
  },
  /* giriş düzeninin müşteri akışına etkisi */
  girisKat: function (sb) { return 1 + (this.girisSeviye(sb) - 1) * 0.09; },

  /* komşu hücrelerde kaç yapı var (çapraz dahil) */
  komsuDoluluk: function (sb, i) {
    var x = i % sb.w, y = Math.floor(i / sb.w);
    var dik = 0, capraz = 0;
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        var nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= sb.w || ny < 0 || ny >= sb.h) continue;
        if (!sb.yapi[ny * sb.w + nx]) continue;
        if (dx === 0 || dy === 0) dik++; else capraz++;
      }
    }
    return { dik: dik, capraz: capraz };
  },

  /* tur: 'pompa' | 'bina' — en uygun hücreyi döndürür (yoksa -1) */
  oneriYer: function (sb, tur) {
    var aday = [];
    for (var i = 0; i < sb.yapi.length; i++) {
      if (!this.hucreBos(sb, i)) continue;
      var x = i % sb.w, y = Math.floor(i / sb.w);
      var puan = 0;

      var kom = this.komsuDoluluk(sb, i);
      if (tur === 'pompa') {
        /* pompalar yola yakın orta şeritte, aralarında boşlukla */
        var idealY = sb.h - 2;
        puan -= Math.abs(y - idealY) * 10;
        if (y === sb.h - 1) puan -= 28;          /* en ön şerit manevra alanı */
        if (x % 2 === 0) puan += 8;              /* bir dolu bir boş: ada düzeni */
        if (this.komsuTipi(sb, i, 'bina')) puan -= 12;
        puan -= kom.dik * 9 + kom.capraz * 2;    /* yan yana yığılmasın */
        puan -= Math.abs(x - (sb.w - 1) / 2) * 1.5;
      } else {
        /* binalar arka sıraya, geniş aralıklarla */
        puan -= y * 9;                            /* y küçükse (arka) daha iyi */
        if (y >= sb.h - 2) puan -= 24;
        if (this.komsuTipi(sb, i, 'pompa')) puan -= 14;
        puan -= kom.dik * 16 + kom.capraz * 5;    /* komşusu boş parsel tercih edilir */
        if ((x + y) % 2 === 0) puan += 6;         /* satranç düzeni: aralar açık kalsın */
        puan -= Math.abs(x - (sb.w - 1) / 2) * 0.6;
      }
      aday.push({ i: i, p: puan });
    }
    if (!aday.length) return -1;
    aday.sort(function (a, b) { return b.p - a.p; });
    return aday[0].i;
  },

  /* plana uygun yer yoksa beton dökerek yer açar */
  yerAc: function (sb, tur) {
    var i = this.oneriYer(sb, tur);
    if (i >= 0) return i;
    /* betonu plana göre dök */
    var en = -1, enPuan = -1e9;
    for (var k = 0; k < sb.beton.length; k++) {
      if (sb.beton[k] || sb.yapi[k]) continue;
      var x = k % sb.w, y = Math.floor(k / sb.w);
      var puan = tur === 'pompa' ? -Math.abs(y - (sb.h - 2)) * 10 - Math.abs(x - (sb.w - 1) / 2) : -y * 11;
      if (puan > enPuan) { enPuan = puan; en = k; }
    }
    if (en < 0) return -1;
    return this.betonDok(sb, en) ? en : -1;
  },

  /* =========================================================
     İSTASYONU BAŞTAN DÜZENLE
     Pompalar yola bakan şeritte aralıklı, market ve tesisler arkada,
     depo/enerji kenarda. Gerekli yerlere beton döker.
     ========================================================= */
  duzenlemeBedeli: function (sb) {
    var adet = D.pompalar(sb).length + D.binalar(sb).length;
    return Math.round(12000 * adet + 25000);
  },

  duzenlemeOnizle: function (sb) {
    var pompalar = [], binalar = [];
    for (var i = 0; i < sb.yapi.length; i++) {
      var y = sb.yapi[i];
      if (!y) continue;
      if (y.t === 'pompa') pompalar.push(y); else binalar.push(y);
    }
    /* binaları türüne göre önceliklendir: market/kafe öne yakın, depo/enerji kenara */
    var onSira = { market: 1, kafe: 2, restoran: 3, wc: 4, havasu: 5, atm: 6, totem: 0 };
    var kenar = { depo: 1, gunes: 2, jenerator: 3, smr: 4, tirpark: 5, yikama: 6, yag: 7, adblue: 8 };
    binalar.sort(function (a, b) {
      var ao = onSira[a.t] !== undefined ? onSira[a.t] : 50;
      var bo = onSira[b.t] !== undefined ? onSira[b.t] : 50;
      return ao - bo;
    });

    /* --- pompa şeridi: en ön satırdan bir yukarısı --- */
    var plan = [];               /* {idx, yapi} */
    var kullanilan = {};
    var pompaSatiri = Math.max(0, sb.h - 2);
    var sut = 0;
    for (var p = 0; p < pompalar.length; p++) {
      var yer = -1;
      /* aynı satırda birer boşluk bırakarak ilerle; satır dolarsa bir üst satır */
      for (var deneme = 0; deneme < sb.w * 3 && yer < 0; deneme++) {
        var satir = pompaSatiri - Math.floor(sut / Math.ceil(sb.w / 2));
        var sutun = (sut % Math.ceil(sb.w / 2)) * 2;
        sut++;
        if (satir < 0 || sutun >= sb.w) continue;
        var aday = satir * sb.w + sutun;
        if (kullanilan[aday]) continue;
        yer = aday;
      }
      if (yer < 0) continue;
      kullanilan[yer] = true;
      plan.push({ idx: yer, yapi: pompalar[p] });
    }

    /* --- binalar: arka satırlardan başlayarak satranç düzeni --- */
    var bAday = [];
    for (var gy = 0; gy < sb.h; gy++) {
      for (var gx = 0; gx < sb.w; gx++) {
        var k = gy * sb.w + gx;
        if (kullanilan[k]) continue;
        if (gy >= sb.h - 1) continue;                 /* en ön şerit manevra */
        var puan = (sb.h - gy) * 10 + ((gx + gy) % 2 === 0 ? 4 : 0);
        /* pompa şeridine komşu olanları sona at */
        if (Math.abs(gy - pompaSatiri) <= 0) puan -= 40;
        bAday.push({ k: k, puan: -puan });
      }
    }
    bAday.sort(function (a, b) { return a.puan - b.puan; });
    for (var b2 = 0; b2 < binalar.length && b2 < bAday.length; b2++) {
      plan.push({ idx: bAday[b2].k, yapi: binalar[b2] });
      kullanilan[bAday[b2].k] = true;
    }
    return plan;
  },

  istasyonDuzenle: function (sb) {
    var plan = this.duzenlemeOnizle(sb);
    var toplam = D.pompalar(sb).length + D.binalar(sb).length;
    if (plan.length < toplam) {
      UI.bildir('Yer yetmiyor', 'Tüm yapıları düzgün yerleştirmek için arsa küçük. Önce arsa genişlet.', 'kotu');
      return false;
    }
    var bedel = this.duzenlemeBedeli(sb);
    if (!D.harca(bedel)) return false;

    /* pompacı atamalarını ve müşterileri koru */
    var eskiPompaYeri = {};                       /* eski indeks -> yapı */
    for (var i = 0; i < sb.yapi.length; i++) if (sb.yapi[i]) eskiPompaYeri[i] = sb.yapi[i];

    var yeniYapi = new Array(sb.yapi.length).fill(null);
    var yapiYeniYeri = {};                        /* yapı nesnesi -> yeni indeks */
    for (var p = 0; p < plan.length; p++) {
      yeniYapi[plan[p].idx] = plan[p].yapi;
      if (!sb.beton[plan[p].idx]) sb.beton[plan[p].idx] = true;   /* düzenleme betonu kapsar */
    }
    sb.yapi = yeniYapi;

    /* personel ve kuyruk referanslarını yeni indekslere taşı */
    var eskiden = {};
    for (var e in eskiPompaYeri) eskiden[e] = eskiPompaYeri[e];
    for (var pi = 0; pi < plan.length; pi++) {
      for (var ek in eskiden) {
        if (eskiden[ek] === plan[pi].yapi) { yapiYeniYeri[ek] = plan[pi].idx; break; }
      }
    }
    for (var ps = 0; ps < sb.personel.length; ps++) {
      var pz = sb.personel[ps];
      if (pz.pompa !== null && pz.pompa !== undefined && yapiYeniYeri[pz.pompa] !== undefined) {
        pz.pompa = yapiYeniYeri[pz.pompa];
      } else if (pz.tip === 'pompaci') pz.pompa = null;
    }
    for (var kq = 0; kq < sb.kuyruk.length; kq++) {
      var mq = sb.kuyruk[kq];
      if (mq.pompa !== null && mq.pompa !== undefined) {
        mq.pompa = (yapiYeniYeri[mq.pompa] !== undefined) ? yapiYeniYeri[mq.pompa] : null;
        if (mq.pompa === null) mq.durum = 'bekliyor';
      }
    }

    if (window.IZO) {
      IZO._zAnahtar = '';
      IZO._otoparkAnahtar = '';
      IZO.arabalar = [];
      IZO.susle(sb);
    }
    UI.bildir('🧹 İstasyon düzenlendi', 'Pompalar yola bakan şeride, tesisler arkaya alındı · ' + tl(bedel), 'iyi');
    return true;
  },

  /* yapıyı arsa içinde başka bir betonlu hücreye taşı */
  tasimaBedeli: function (y) {
    if (!y) return 0;
    var taban = y.t === 'pompa' ? VERI.pompa.fiyat[y.yakit] : VERI.binalar[y.t].fiyat;
    return Math.round(taban * 0.06);
  },

  yapiTasi: function (sb, kaynak, hedef) {
    var y = sb.yapi[kaynak];
    if (!y) return false;
    if (kaynak === hedef) return false;
    if (hedef < 0 || hedef >= sb.yapi.length) return false;
    if (!sb.beton[hedef]) { UI.bildir('Zemin yok', 'Önce oraya beton dök.', 'kotu'); return false; }
    if (sb.yapi[hedef]) { UI.bildir('Dolu', 'O hücrede başka bir yapı var.', 'kotu'); return false; }
    if (y.mesgul) { UI.bildir('Pompa meşgul', 'Müşteri varken pompa taşınamaz.', 'kotu'); return false; }
    var bedel = this.tasimaBedeli(y);
    if (!D.harca(bedel)) return false;
    sb.yapi[hedef] = y;
    sb.yapi[kaynak] = null;
    /* pompacı ataması taşınsın */
    for (var i = 0; i < sb.personel.length; i++) if (sb.personel[i].pompa === kaynak) sb.personel[i].pompa = hedef;
    /* kuyruktaki müşteriler */
    for (var j = 0; j < sb.kuyruk.length; j++) if (sb.kuyruk[j].pompa === kaynak) sb.kuyruk[j].pompa = hedef;
    if (window.IZO) { IZO.susle(sb); IZO._zAnahtar = ''; }
    UI.bildir('Taşındı', (y.t === 'pompa' ? 'Pompa' : VERI.binalar[y.t].ad) + ' yeni yerine kuruldu · ' + tl(bedel), 'iyi');
    return true;
  },

  /* =========================================================
     PAZARLAMA PROGRAMLARI
     ========================================================= */
  programAc: function (sb, id) {
    var t = VERI.programlar[id];
    if (!t) return false;
    if (!sb.program) sb.program = {};
    if (sb.program[id]) {
      sb.program[id] = false;
      UI.bildir(t.ad + ' kapatildi', 'Aylik gideri durdu.', 'uyari');
      return true;
    }
    if (D.s.seviye < t.seviyeSart) { UI.bildir('Seviye yetersiz', t.ad + ' icin seviye ' + t.seviyeSart + ' gerekiyor.', 'kotu'); return false; }
    if (id === 'yikamaAbone' && !D.binaSayisi(sb, 'yikama')) { UI.bildir('Yikama tesisi yok', 'Once oto yikama kur.', 'kotu'); return false; }
    if (!D.harca(t.kurulum)) return false;
    sb.program[id] = true;
    D.s.marka = kisitla(D.s.marka + 2, 0, 100);
    UI.bildir(t.emoji + ' ' + t.ad + ' acildi', t.aciklama, 'iyi');
    return true;
  },

  programlariIsle: function () {
    var s = D.s;
    for (var i = 0; i < s.subeler.length; i++) {
      var sb = s.subeler[i];
      if (!sb.program || sb.devredildi) continue;
      for (var id in sb.program) {
        if (!sb.program[id]) continue;
        var t = VERI.programlar[id];
        if (!t) continue;
        var gun = Math.round(t.aylik / 30);
        s.para -= gun;
        s.ist.bugunGider += gun;
        if (id === 'yikamaAbone') {
          var yik = D.binaSayisi(sb, 'yikama');
          var gelir = Math.round(gun * (1.7 + yik * 0.35) * (0.7 + sb.memnuniyet / 200));
          s.para += gelir;
          s.ist.bugunCiro += gelir;
        }
        if (id === 'sadakat') sb.memnuniyet = kisitla(sb.memnuniyet + 0.6, 0, 100);
      }
    }
  },

  /* =========================================================
     ÇEVRİMDIŞI KAZANÇ
     ========================================================= */
  cevrimdisiHesapla: function () {
    var s = D.s;
    if (!s.kapanis) return null;
    var gecen = Date.now() - s.kapanis;
    if (gecen < 4 * 60 * 1000) return null;                 /* 4 dk altı sayılmaz */
    var saat = Math.min(8, gecen / 3600000);                /* en çok 8 saat */

    /* son günlerin ortalama saatlik kârı */
    var gunluk = s.ist.gunluk || [];
    var topKar = 0, n = 0;
    for (var i = Math.max(0, gunluk.length - 5); i < gunluk.length; i++) {
      topKar += (gunluk[i].ciro - gunluk[i].gider);
      n++;
    }
    var gunlukKar = n ? topKar / n : 0;
    if (gunlukKar <= 0) return null;

    /* personel olmadan istasyon yarı kapasite çalışır */
    var sb = D.sube();
    var pompaci = this.personelSayisi(sb, 'pompaci');
    var mudur = this.personelSayisi(sb, 'mudur');
    var verim = kisitla(0.18 + pompaci * 0.12 + mudur * 0.18, 0.18, 0.72);

    var kazanc = Math.round((gunlukKar / 24) * saat * verim);
    if (kazanc < 1) return null;
    return { kazanc: kazanc, saat: saat, verim: verim, pompaci: pompaci, mudur: mudur };
  },

  cevrimdisiAl: function (o) {
    if (!o) return false;
    D.s.para += o.kazanc;
    D.s.ist.ciro += o.kazanc;
    D.s.ist.bugunCiro += o.kazanc;
    D.kaydet();
    return true;
  },

  jeneratorKap: function (y) { return 90 * (y.sv || 1); },

  jeneratorDoldur: function (sb, k) {
    var y = sb.yapi[k];
    if (!y || y.t !== 'jenerator') return false;
    if (typeof y.depo !== 'number') y.depo = 0;
    var kap = this.jeneratorKap(y);
    var gerek = kap - y.depo;
    if (gerek <= 0.5) { UI.bildir('Depo dolu', 'Jeneratör deposu zaten dolu.', 'uyari'); return false; }
    var alinan = Math.min(gerek, sb.tank.dizel.dolu);
    if (alinan < 1) { UI.bildir('Dizel yok', 'Önce dizel tankını doldur.', 'kotu'); return false; }
    sb.tank.dizel.dolu -= alinan;
    y.depo += alinan;
    y.uyarildi = false;
    if (y.depo > 1) y.calismiyor = false;
    UI.bildir('Jeneratör dolduruldu', say(alinan, 0) + ' L dizel aktarıldı.', 'iyi');
    return true;
  },

  filoBul: function (fid) {
    for (var i = 0; i < D.s.filolar.length; i++) if (D.s.filolar[i].id === fid) return D.s.filolar[i];
    return null;
  },

  sozlesmeleriIsle: function () {
    var s = D.s;
    for (var i = s.sozlesmeler.length - 1; i >= 0; i--) {
      var sz = s.sozlesmeler[i];
      var sb = s.subeler[sz.sube] || D.sube();
      var satilan = (sb.gunlukYakit && sb.gunlukYakit[sz.yakit]) || 0;
      if (satilan >= sz.gunlukL) {
        sz.basarili++;
        var odeme = sz.gunlukL * sz.fiyat * 0.12;   /* günlük teşvik payı */
        s.para += odeme;
        s.ist.bugunCiro += odeme;
      } else {
        sz.kacirilan++;
        var kesinti = Math.round(sz.ceza / sz.gun);
        s.para -= kesinti;
        s.ist.bugunGider += kesinti;
        UI.bildir('⚠️ Sözleşme açığı', sz.ad + ' · bugün ' + say(satilan, 0) + '/' + say(sz.gunlukL, 0) + ' L · kesinti ' + tl(kesinti), 'kotu');
      }
      sz.kalanGun--;
      if (sz.kalanGun <= 0) {
        if (sz.kacirilan === 0) {
          s.para += sz.prim;
          s.ist.bugunCiro += sz.prim;
          s.marka = kisitla(s.marka + 4, 0, 100);
          D.xpEkle(800);
          UI.bildir('🏅 Sözleşme tamamlandı', sz.ad + ' · prim ' + tl(sz.prim), 'iyi');
        } else {
          s.marka = kisitla(s.marka - 2, 0, 100);
          UI.bildir('Sözleşme bitti', sz.ad + ' · ' + sz.kacirilan + ' gün eksik kaldı, prim alamadın.', 'uyari');
        }
        s.sozlesmeler.splice(i, 1);
      }
    }
  },

  /* =========================================================
     GÜNLÜK GÖREVLER
     ========================================================= */
  gorevleriYenile: function () {
    var s = D.s;
    var havuz = VERI.gorevTipleri.slice();
    s.gorevler = [];
    for (var i = 0; i < 3 && havuz.length; i++) {
      var idx = Math.floor(Math.random() * havuz.length);
      var g = havuz.splice(idx, 1)[0];
      var kat = 1 + s.seviye * 0.22;
      s.gorevler.push({
        id: g.id, ad: g.ad, birim: g.birim,
        hedef: Math.round(g.taban * kat),
        odul: Math.round(g.odul * (1 + s.seviye * 0.18)),
        alindi: false
      });
    }
    s.gorevGun = s.gun;
  },

  gorevIlerleme: function (g) {
    var sb = D.sube();
    var b = sb.bugun || {};
    switch (g.id) {
      case 'musteri': return b.musteri || 0;
      case 'isabet':  return b.isabet || 0;
      case 'litre':   return b.litre || 0;
      case 'market':  return b.marketUrun || 0;
      case 'ciro':    return b.ciro || 0;
      case 'bakim':   return b.bakim || 0;
    }
    return 0;
  },

  gorevOdulAl: function (gid) {
    var s = D.s;
    for (var i = 0; i < s.gorevler.length; i++) {
      var g = s.gorevler[i];
      if (g.id !== gid || g.alindi) continue;
      if (this.gorevIlerleme(g) < g.hedef) { UI.bildir('Henüz tamamlanmadı', g.ad, 'uyari'); return false; }
      g.alindi = true;
      s.para += g.odul;
      s.ist.bugunCiro += g.odul;
      D.xpEkle(200);
      UI.bildir('✅ Görev tamam', g.ad + ' · ödül ' + tl(g.odul), 'iyi');
      return true;
    }
    return false;
  },

  /* =========================================================
     DARBOĞAZ ANALİZİ (muhasebe görünümü)
     ========================================================= */
  darbogazlar: function () {
    var sb = D.sube(), s = D.s, liste = [];
    var b = sb.bugun || {};

    if (b.tankBos > 3) {
      liste.push({ baslik: 'Tank kurudu', metin: b.tankBos + ' müşteri istediği kadar yakıt alamadı. Tank %25 in altına inmeden sipariş ver.', sekme: 'siparis', dugme: 'Sipariş ver' });
    }
    if (b.kuyrukDolu > 4) {
      liste.push({ baslik: 'Kuyruk doldu', metin: b.kuyrukDolu + ' araç sıraya giremeden geçip gitti. Pompa ekle ya da pompacı tut.', sekme: 'insa', dugme: 'Pompa ekle' });
    }
    if (b.kacan > 5) {
      liste.push({ baslik: 'Müşteri bekletiliyor', metin: b.kacan + ' müşteri sabrı tükenip gitti. Pompacı atamak bekleme süresini düşürür.', sekme: 'personel', dugme: 'Pompacı tut' });
    }
    var fk = this.fiyatKat(sb);
    if (fk < 0.85) {
      liste.push({ baslik: 'Fiyatın yüksek', metin: 'Rakibe göre pahalısın; müşteri akışı %' + Math.round((1 - fk) * 100) + ' düşük. Fiyatı kırmak cirosu artırır.', sekme: 'fiyat', dugme: 'Fiyatı ayarla' });
    } else if (fk > 1.45) {
      var marjDus = false;
      VERI.yakitSira.forEach(function (y) {
        var mal = y === 'ev' ? SIM.elektrikMaliyet(sb) : D.toptanFiyat(y);
        if (sb.fiyat[y] - mal < mal * 0.08) marjDus = true;
      });
      if (marjDus) liste.push({ baslik: 'Marj çok ince', metin: 'Fiyatın maliyete çok yakın; çok satıyorsun ama kâr kalmıyor.', sekme: 'fiyat', dugme: 'Fiyatı ayarla' });
    }
    var bakimOrt = D.bakimOrt(sb);
    if (bakimOrt < 60) {
      liste.push({ baslik: 'Bakım düşük', metin: 'Ortalama bakım %' + Math.round(bakimOrt) + '. Arıza riski ve yavaşlama artıyor.', sekme: 'insa', dugme: 'Bakım yap' });
    }
    var arizali = 0;
    for (var i = 0; i < sb.yapi.length; i++) if (sb.yapi[i] && sb.yapi[i].arizali) arizali++;
    if (arizali) liste.push({ baslik: arizali + ' arızalı ekipman', metin: 'Arızalı ekipman hiç çalışmaz. Tamir et.', sekme: 'insa', dugme: 'Tamir et' });
    if (sb.temizlik < 50) liste.push({ baslik: 'İstasyon kirli', metin: 'Temizlik %' + Math.round(sb.temizlik) + '. Memnuniyet ve marka puanı düşüyor.', sekme: 'insa', dugme: 'Temizlik yaptır' });
    if (this.marketVar(sb)) {
      var kap = this.marketRafKapasite(sb), dolu = this.marketDoluluk(sb);
      if (kap && dolu / kap < 0.25) liste.push({ baslik: 'Market boş', metin: 'Raflar %' + Math.round(dolu / kap * 100) + ' dolu; stoksuz ürün satılamıyor.', sekme: 'market', dugme: 'Mal al' });
      var kasiyerVar = false;
      for (var k = 0; k < sb.personel.length; k++) if (sb.personel[k].tip === 'kasiyer') kasiyerVar = true;
      if (!kasiyerVar) liste.push({ baslik: 'Kasiyer yok', metin: 'Market yarı verimle çalışıyor.', sekme: 'personel', dugme: 'Kasiyer al' });
    }
    var ure = D.gucUretim(sb), tuk = D.gucTuketim(sb);
    if (sb.kesinti && ure < tuk * 0.9) liste.push({ baslik: 'Elektrik kesintisi', metin: 'Kendi üretimin yetmiyor, pompalar yavaş çalışıyor.', sekme: 'insa', dugme: 'Jeneratör kur' });
    if (this.borcToplam() > this.varliklar().toplam * 0.55) {
      liste.push({ baslik: 'Borç yükü ağır', metin: 'Borcun varlığının yarısını aştı; taksitler nakdini kurutabilir.', sekme: 'banka', dugme: 'Bankaya bak' });
    }
    if (!liste.length) liste.push({ baslik: 'Darboğaz yok', metin: 'İstasyon sorunsuz çalışıyor. Büyümeye bakabilirsin.', sekme: 'insa', dugme: 'Yatırım yap' });
    return liste;
  },

  /* =========================================================
     KARŞI İSTASYON (rakip) ve FİYAT SAVAŞI
     ========================================================= */
  /* kayıttan gelen eski şubelerde de rakip olsun */
  rakipKur: function (sb) {
    if (!sb.rakipIst) {
      sb.rakipIst = { ad: secRast(VERI.rakip.adlar), guc: 1, agresif: 0.6, indirim: 0, savas: 0, olay: null, pay: 50, kazanilanSavas: 0 };
    }
    return sb.rakipIst;
  },

  /* rakibin o anki ek indirimi (fiyat savaşında büyür) */
  rakipIndirim: function (sb) {
    var r = this.rakipKur(sb);
    return kisitla(r.indirim || 0, 0, VERI.rakip.savasTavan);
  },

  /* rakibin olayı varsa tanımını ver */
  rakipOlayi: function (sb) {
    var r = this.rakipKur(sb);
    if (!r.olay) return null;
    for (var i = 0; i < VERI.rakip.olaylar.length; i++) {
      if (VERI.rakip.olaylar[i].id === r.olay.id) return VERI.rakip.olaylar[i];
    }
    return null;
  },

  /* rakibin müşteri akışına etkisi: gücü yüksekse seninki azalır */
  rakipCekim: function (sb) {
    var r = this.rakipKur(sb);
    var guc = kisitla(r.guc, VERI.rakip.gucSinir[0], VERI.rakip.gucSinir[1]);
    return kisitla(1 + (1 - guc) * 0.42, 0.78, 1.22);
  },

  /* ortalama fiyat oranın: 1'in altı rakipten ucuzsun demek */
  rakipFiyatOrani: function (sb) {
    var top = 0, n = 0;
    VERI.yakitSira.forEach(function (y) {
      if (y === 'ev' || !sb.rakip[y] || !sb.fiyat[y]) return;
      top += sb.fiyat[y] / sb.rakip[y]; n++;
    });
    return n ? top / n : 1;
  },

  /* pazar payın (%) — çekim gücünüzün oranı */
  pazarPayi: function (sb) {
    var r = this.rakipKur(sb);
    var benim = Math.max(0.05, (1 + this.binaCekim(sb)) * this.fiyatKat(sb) * (0.6 + sb.memnuniyet / 160));
    var onun = Math.max(0.05, kisitla(r.guc, VERI.rakip.gucSinir[0], VERI.rakip.gucSinir[1]) * 1.35);
    return Math.round(kisitla((benim / (benim + onun)) * 100, 3, 97));
  },

  /* günlük rakip davranışı: olaylar, fiyat savaşı, güç dengesi */
  rakipGunSonu: function (sb) {
    if (sb.devredildi) return;
    var r = this.rakipKur(sb);
    var tan = VERI.rakip;
    var aktif = (sb === D.sube());

    /* --- süren olay --- */
    if (r.olay) {
      r.olay.kalan--;
      if (r.olay.kalan <= 0) r.olay = null;
    } else if (Math.random() < 0.18) {
      var o = secRast(tan.olaylar);
      r.olay = { id: o.id, kalan: rastgeleTam(o.sure[0], o.sure[1]) };
      r.guc = kisitla(r.guc + o.guc, tan.gucSinir[0], tan.gucSinir[1]);
      if (aktif) UI.bildir(o.emoji + ' ' + o.ad, o.aciklama, o.guc < 0 ? 'iyi' : 'uyari');
    }

    /* --- fiyat savaşı --- */
    var oran = this.rakipFiyatOrani(sb);
    if (r.savas > 0) {
      r.savas--;
      /* rakip her gün biraz daha yorulur; sen de ucuz kaldıkça onu zorlarsın */
      var yipranma = oran < 1 ? 0.07 : -0.04;
      r.guc = kisitla(r.guc - yipranma, tan.gucSinir[0], tan.gucSinir[1]);
      if (r.savas === 0) {
        r.indirim = 0;
        if (oran < 1) {
          r.kazanilanSavas = (r.kazanilanSavas || 0) + 1;
          r.guc = kisitla(r.guc - 0.08, tan.gucSinir[0], tan.gucSinir[1]);
          if (aktif) UI.bildir('🏁 Fiyat savaşı bitti', r.ad + ' eski fiyatına döndü; müşterinin bir kısmı sende kaldı.', 'iyi');
        } else {
          r.guc = kisitla(r.guc + 0.06, tan.gucSinir[0], tan.gucSinir[1]);
          if (aktif) UI.bildir('🏁 Fiyat savaşı bitti', r.ad + ' kazançlı çıktı; pahalı kaldığın günlerde müşteri ona gitti.', 'kotu');
        }
      }
    } else if (oran < tan.kiskirtmaEsigi && Math.random() < 0.35 + r.agresif * 0.4) {
      /* onun altına indin: karşılık veriyor */
      r.savas = rastgeleTam(tan.savasGun[0], tan.savasGun[1]);
      r.indirim = kisitla(rastgele(tan.savasAdim[0], tan.savasAdim[1]) * (0.6 + r.agresif), 0, tan.savasTavan);
      if (aktif) {
        UI.bildir('⚔️ ' + r.ad + ' fiyat kırdı',
          'Ucuzladığını gördü, %' + Math.round(r.indirim * 100) + ' indirim yaptı. ' + r.savas + ' gün sürecek.', 'kotu');
      }
    } else {
      /* savaş yok: güç yavaşça 1'e döner, pahalıysan rakip güçlenir */
      var cek = (oran > 1.04 ? 0.05 : oran < 0.99 ? -0.04 : 0);
      r.guc = kisitla(r.guc + (1 - r.guc) * 0.08 + cek, tan.gucSinir[0], tan.gucSinir[1]);
      if (r.indirim > 0) r.indirim = Math.max(0, r.indirim - 0.02);
    }

    r.pay = this.pazarPayi(sb);
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
    if (tip === 'jenerator') {
      /* kurulurken deposu istasyon dizelinden doldurulur */
      sb.yapi[i].depo = 0;
      this.jeneratorDoldur(sb, i);
    }
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
    return y.sv >= tan.sv ? 0 : Math.round(tan.svFiyat * 1.35 * Math.pow(1.95, y.sv - 1));
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
    if (sb.bugun) sb.bugun.bakim++;
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
    /* her alımda iki sütun + bir satır (ya da sınıra kadar) — parsel hızlı büyür */
    var yeniW = Math.min(lok.w, sb.w + 2);
    var yeniH = Math.min(lok.h, sb.h + 1);
    if (yeniW === sb.w && yeniH === sb.h) return false;
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

  /* hızlı yol: aday üret + işe al (pompa kartından) */
  personelAl: function (sb, tip) {
    var aday = this.adayUret(tip);
    return this.iseAl(sb, aday) ? aday : null;
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
