/* Akaryakıt Patronu — ek hizmet mini oyunları
   Oto yıkama, yağ değişimi, market kasası ve LPG güvenlik adımı. */
'use strict';

const MINI = {
  acik: false,
  tur: null,
  veri: null,
  rafId: 0,
  kapandi: null,

  kat: function () { return document.getElementById('mini'); },

  kapat: function () {
    this.acik = false;
    this.tur = null;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    var k = this.kat();
    if (k) { k.classList.remove('ac'); k.innerHTML = ''; }
    var g = this.kapandi;
    this.kapandi = null;
    if (g) g();
    if (window.UI) UI.ciz();
  },

  ac: function (html) {
    var k = this.kat();
    if (!k) return;
    k.innerHTML = html;
    k.classList.add('ac');
    this.acik = true;
  },

  /* =========================================================
     HANGİ EK HİZMET ÖNERİLEBİLİR
     ========================================================= */
  teklif: function (sb, m) {
    if (!m) return null;
    var aday = [];
    if (D.binaSayisi(sb, 'yikama') && m.arac !== 'Motosiklet') aday.push({ tur: 'yikama', sans: 0.32 });
    if (D.binaSayisi(sb, 'yag') && (m.arac === 'Otomobil' || m.arac === 'Ticari Araç' || m.arac === 'Taksi' || m.arac === 'Hatchback')) aday.push({ tur: 'yag', sans: 0.16 });
    if (D.binaSayisi(sb, 'lastikci') && VERI.sezonSira[D.s.sezonIdx] === 'sonbahar') aday.push({ tur: 'yikama', sans: 0.12 });
    for (var i = 0; i < aday.length; i++) {
      if (Math.random() < aday[i].sans) return aday[i].tur;
    }
    return null;
  },

  /* =========================================================
     OTO YIKAMA — program seç, köpük barını yeşilde durdur
     ========================================================= */
  yikamaBaslat: function (m, bitince) {
    var sb = D.sube();
    var bina = D.binalar(sb, 'yikama')[0];
    if (!bina) { if (bitince) bitince(); return; }
    this.kapandi = bitince;
    this.tur = 'yikama';
    var sv = bina.b.sv;
    this.veri = {
      m: m, sv: sv, program: null,
      programlar: [
        { id: 'hizli',    ad: 'Hızlı Yıkama',    emoji: '💦', ucret: 260 * sv, zorluk: 0.9, sure: 'kısa' },
        { id: 'standart', ad: 'Standart Paket',  emoji: '🧼', ucret: 430 * sv, zorluk: 1.0, sure: 'orta' },
        { id: 'detayli',  ad: 'Detaylı Bakım',   emoji: '✨', ucret: 760 * sv, zorluk: 1.35, sure: 'uzun' }
      ]
    };
    this.yikamaCiz();
  },

  yikamaCiz: function () {
    var v = this.veri;
    var h = '<div class="miniKutu"><div class="miniBas"><span>🧼 Oto Yıkama</span>';
    h += '<button class="kapat" onclick="MINI.vazgec()">✕</button></div>';
    h += '<div class="not">' + v.m.emoji + ' ' + v.m.arac + ' yıkama istiyor. Programı seç, sonra köpük çubuğunu yeşil bölgede durdur — ne kadar ortalarsan o kadar iyi iş.</div>';
    h += '<div class="sek" style="margin-top:10px">';
    for (var i = 0; i < v.programlar.length; i++) {
      var p = v.programlar[i];
      h += '<button class="sec" onclick="MINI.yikamaProgram(' + i + ')">';
      h += '<div class="st">' + p.emoji + ' ' + p.ad + '</div>';
      h += '<div class="ss">' + tl(p.ucret) + ' · ' + p.sure + ' süre · ' + (p.zorluk > 1 ? 'hassas' : 'kolay') + ' ayar</div></button>';
    }
    h += '</div></div>';
    this.ac(h);
  },

  yikamaProgram: function (i) {
    var v = this.veri;
    v.program = v.programlar[i];
    v.konum = 0;
    v.yon = 1;
    v.hiz = 0.9 + v.program.zorluk * 0.55;
    v.durdu = false;
    var h = '<div class="miniKutu"><div class="miniBas"><span>' + v.program.emoji + ' ' + v.program.ad + '</span>';
    h += '<button class="kapat" onclick="MINI.vazgec()">✕</button></div>';
    h += '<div class="not">Çubuğu yeşil alanda durdur. Tam ortası en yüksek kaliteyi verir.</div>';
    h += '<div class="hedefBar"><u class="bolge"></u><i id="miniImlec"></i></div>';
    h += '<div class="miniBilgi" id="miniBilgi">Dokun ve durdur</div>';
    h += '<button class="btn genis" style="margin-top:12px" onclick="MINI.yikamaDurdur()">DURDUR</button>';
    h += '</div>';
    this.ac(h);
    this.yikamaDongu();
  },

  yikamaDongu: function () {
    var self = this, son = performance.now();
    function kare(t) {
      if (!self.acik || self.tur !== 'yikama' || self.veri.durdu) return;
      var dt = Math.min(0.05, (t - son) / 1000);
      son = t;
      var v = self.veri;
      v.konum += v.yon * v.hiz * dt;
      if (v.konum >= 1) { v.konum = 1; v.yon = -1; }
      if (v.konum <= 0) { v.konum = 0; v.yon = 1; }
      var el = document.getElementById('miniImlec');
      if (el) el.style.left = (v.konum * 100) + '%';
      self.rafId = requestAnimationFrame(kare);
    }
    this.rafId = requestAnimationFrame(kare);
  },

  yikamaDurdur: function () {
    var v = this.veri;
    if (v.durdu) return;
    v.durdu = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    var sapma = Math.abs(v.konum - 0.5);        /* 0 = tam orta */
    var kalite, ad, renk;
    if (sapma < 0.05) { kalite = 1.35; ad = '✨ Kusursuz yıkama'; renk = 'var(--sari)'; }
    else if (sapma < 0.14) { kalite = 1.1; ad = '👍 Temiz iş'; renk = 'var(--yesil)'; }
    else if (sapma < 0.26) { kalite = 0.85; ad = '🙂 İdare eder'; renk = 'var(--mavi)'; }
    else { kalite = 0.5; ad = '😕 Leke kaldı'; renk = 'var(--kirmizi)'; }

    var sb = D.sube();
    var gelir = Math.round(v.program.ucret * kalite);
    var maliyet = Math.round(v.program.ucret * 0.22);
    D.s.para += gelir - maliyet;
    D.s.ist.ciro += gelir;
    D.s.ist.kar += gelir - maliyet;
    D.s.ist.bugunCiro += gelir;
    D.s.ist.bugunGider += maliyet;
    if (sb.bugun) sb.bugun.ciro += gelir;
    sb.memnuniyet = kisitla(sb.memnuniyet + (kalite > 1 ? 1.2 : kalite < 0.7 ? -1.5 : 0.2), 0, 100);
    D.xpEkle(Math.round(gelir * 0.05));
    if (window.SES) SES.cal(kalite > 1 ? 'basari' : 'kasa');
    if (window.IZO && IZO.cz) {
      var yik = D.binalar(sb, 'yikama')[0];
      if (yik) IZO.ucur(yik.i % sb.w + 0.5, Math.floor(yik.i / sb.w) + 0.4, '+' + tl(gelir), renk);
    }

    var h = '<div class="miniKutu"><div class="miniBas"><span>Sonuç</span></div>';
    h += '<div class="miniSonuc" style="color:' + renk + '">' + ad + '</div>';
    h += '<div class="kv"><span>Program</span><b>' + v.program.ad + '</b></div>';
    h += '<div class="kv"><span>Ücret</span><b>' + tl(gelir) + '</b></div>';
    h += '<div class="kv"><span>Malzeme</span><b class="kirmiziY">-' + tl(maliyet) + '</b></div>';
    h += '<div class="kv"><span>Net</span><b class="yesilY">' + tl(gelir - maliyet) + '</b></div>';
    h += '<button class="btn genis" style="margin-top:12px" onclick="MINI.kapat()">Tamam</button></div>';
    this.ac(h);
  },

  /* =========================================================
     YAĞ DEĞİŞİMİ — doğru yağ ve filtre seçimi
     ========================================================= */
  yagBaslat: function (m, bitince) {
    var sb = D.sube();
    var bina = D.binalar(sb, 'yag')[0];
    if (!bina) { if (bitince) bitince(); return; }
    this.kapandi = bitince;
    this.tur = 'yag';
    var yaglar = ['0W-20 tam sentetik', '5W-30 tam sentetik', '10W-40 yarı sentetik', '15W-40 mineral'];
    var dogru = secRast(yaglar);
    var secenek = [dogru];
    while (secenek.length < 3) {
      var y = secRast(yaglar);
      if (secenek.indexOf(y) < 0) secenek.push(y);
    }
    secenek.sort(function () { return Math.random() - 0.5; });
    this.veri = {
      m: m, sv: bina.b.sv, dogru: dogru, secenek: secenek,
      filtreGerek: Math.random() < 0.65, secilenYag: null, secilenFiltre: null
    };
    this.yagCiz();
  },

  yagCiz: function () {
    var v = this.veri;
    var h = '<div class="miniKutu"><div class="miniBas"><span>🔧 Yağ Değişimi</span>';
    h += '<button class="kapat" onclick="MINI.vazgec()">✕</button></div>';
    h += '<div class="not">' + v.m.emoji + ' ' + v.m.arac + ' periyodik bakıma geldi. Araç kitapçığı:</div>';
    h += '<div class="miniKart"><b>' + v.dogru + '</b><br><span class="mini">' + (v.filtreGerek ? 'Yağ filtresi de değişecek.' : 'Filtre geçen bakımda değişti, gerek yok.') + '</span></div>';
    h += '<div class="baslik" style="margin-top:12px">Yağı seç</div><div class="sek">';
    for (var i = 0; i < v.secenek.length; i++) {
      var sec = v.secilenYag === v.secenek[i];
      h += '<button class="sec' + (sec ? ' secili' : '') + '" onclick="MINI.yagSec(\'' + i + '\')">';
      h += '<div class="st">🛢️ ' + v.secenek[i] + '</div></button>';
    }
    h += '</div>';
    h += '<div class="baslik" style="margin-top:12px">Filtre</div><div class="sek">';
    h += '<button class="sec' + (v.secilenFiltre === true ? ' secili' : '') + '" onclick="MINI.yagFiltre(true)"><div class="st">🔩 Filtreyi değiştir</div></button>';
    h += '<button class="sec' + (v.secilenFiltre === false ? ' secili' : '') + '" onclick="MINI.yagFiltre(false)"><div class="st">⏭️ Filtre kalsın</div></button>';
    h += '</div>';
    h += '<button class="btn genis" style="margin-top:12px' + (v.secilenYag === null || v.secilenFiltre === null ? ';opacity:.45' : '') + '" onclick="MINI.yagBitir()">İŞİ TESLİM ET</button>';
    h += '</div>';
    this.ac(h);
  },

  yagSec: function (i) { this.veri.secilenYag = this.veri.secenek[+i]; this.yagCiz(); },
  yagFiltre: function (b) { this.veri.secilenFiltre = b; this.yagCiz(); },

  yagBitir: function () {
    var v = this.veri;
    if (v.secilenYag === null || v.secilenFiltre === null) {
      UI.bildir('Eksik seçim', 'Yağ ve filtre kararını ver.', 'uyari');
      return;
    }
    var sb = D.sube();
    var yagDogru = v.secilenYag === v.dogru;
    var filtreDogru = v.secilenFiltre === v.filtreGerek;
    var temel = 640 * v.sv;
    var maliyet = Math.round(temel * 0.38) + (v.secilenFiltre ? 120 : 0);
    var gelir, ad, renk;

    if (yagDogru && filtreDogru) {
      gelir = Math.round(temel * 1.2);
      ad = '🎯 Kitabına uygun'; renk = 'var(--sari)';
      sb.memnuniyet = kisitla(sb.memnuniyet + 2, 0, 100);
      D.s.marka = kisitla(D.s.marka + 0.5, 0, 100);
    } else if (yagDogru) {
      gelir = Math.round(temel * 0.9);
      ad = '👍 Yağ doğru, filtre tartışmalı'; renk = 'var(--yesil)';
    } else {
      gelir = Math.round(temel * 0.35);
      ad = '❌ Yanlış yağ'; renk = 'var(--kirmizi)';
      sb.memnuniyet = kisitla(sb.memnuniyet - 5, 0, 100);
      D.s.marka = kisitla(D.s.marka - 1.5, 0, 100);
      maliyet += Math.round(temel * 0.3);   /* yağ boşa gitti */
    }

    D.s.para += gelir - maliyet;
    D.s.ist.ciro += gelir;
    D.s.ist.kar += gelir - maliyet;
    D.s.ist.bugunCiro += gelir;
    D.s.ist.bugunGider += maliyet;
    if (sb.bugun) sb.bugun.ciro += gelir;
    D.xpEkle(Math.round(gelir * 0.06));
    if (window.SES) SES.cal(yagDogru ? 'kasa' : 'hata');

    var h = '<div class="miniKutu"><div class="miniBas"><span>Sonuç</span></div>';
    h += '<div class="miniSonuc" style="color:' + renk + '">' + ad + '</div>';
    h += '<div class="kv"><span>İstenen</span><b>' + v.dogru + (v.filtreGerek ? ' + filtre' : '') + '</b></div>';
    h += '<div class="kv"><span>Yapılan</span><b>' + v.secilenYag + (v.secilenFiltre ? ' + filtre' : '') + '</b></div>';
    h += '<div class="kv"><span>Ücret</span><b>' + tl(gelir) + '</b></div>';
    h += '<div class="kv"><span>Malzeme</span><b class="kirmiziY">-' + tl(maliyet) + '</b></div>';
    h += '<div class="kv"><span>Net</span><b class="' + (gelir - maliyet >= 0 ? 'yesilY' : 'kirmiziY') + '">' + tl(gelir - maliyet) + '</b></div>';
    h += '<button class="btn genis" style="margin-top:12px" onclick="MINI.kapat()">Tamam</button></div>';
    this.ac(h);
  },

  /* =========================================================
     MARKET KASASI — ürünleri hızlı okut
     ========================================================= */
  kasaBaslat: function () {
    var sb = D.sube();
    if (!SIM.marketVar(sb)) { UI.bildir('Market yok', 'Önce market kur.', 'kotu'); return; }
    var stoklu = [];
    for (var i = 0; i < VERI.marketUrunler.length; i++) {
      var u = VERI.marketUrunler[i];
      if ((sb.market.stok[u.id] || 0) > 0) stoklu.push(u);
    }
    if (stoklu.length < 2) { UI.bildir('Raf boş', 'Kasaya geçmek için önce mal al.', 'kotu'); return; }

    this.tur = 'kasa';
    this.kapandi = null;
    this.veri = {
      stoklu: stoklu, sepet: [], okutulan: 0, hata: 0, ciro: 0, kar: 0,
      musteri: 0, hedefMusteri: 6, baslangic: Date.now(), sure: 32000, bitti: false
    };
    this.kasaMusteri();
    this.kasaSayac();
  },

  kasaMusteri: function () {
    var v = this.veri;
    v.musteri++;
    var adet = rastgeleTam(2, 4);
    v.sepet = [];
    for (var i = 0; i < adet; i++) {
      var u = secRast(v.stoklu);
      v.sepet.push({ u: u, okutuldu: false });
    }
    v.secenek = v.stoklu.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 6);
    /* sepetteki ürünler seçenekte olsun */
    for (var j = 0; j < v.sepet.length; j++) {
      var varMi = false;
      for (var k = 0; k < v.secenek.length; k++) if (v.secenek[k].id === v.sepet[j].u.id) varMi = true;
      if (!varMi) v.secenek[j % v.secenek.length] = v.sepet[j].u;
    }
    this.kasaCiz();
  },

  kasaCiz: function () {
    var v = this.veri;
    var sb = D.sube();
    var kalanSn = Math.max(0, Math.ceil((v.sure - (Date.now() - v.baslangic)) / 1000));
    var h = '<div class="miniKutu"><div class="miniBas"><span>🧾 Market Kasası</span>';
    h += '<button class="kapat" onclick="MINI.kasaBitir()">✕</button></div>';
    h += '<div class="kasaUst"><span>Müşteri <b>' + v.musteri + '</b></span><span>Ciro <b class="yesilY">' + tl(v.ciro) + '</b></span>';
    h += '<span>Süre <b id="kasaSure">' + kalanSn + ' sn</b></span></div>';
    h += '<div class="not">Sepetteki ürünlere alttaki raftan dokunarak okut. Yanlış ürün süre kaybettirir.</div>';
    h += '<div class="sepet">';
    for (var i = 0; i < v.sepet.length; i++) {
      var s2 = v.sepet[i];
      h += '<div class="sepetOge' + (s2.okutuldu ? ' ok' : '') + '">' + s2.u.emoji + '<span>' + s2.u.ad + '</span>';
      h += (s2.okutuldu ? '<b class="yesilY">✓</b>' : '<b class="mini">' + say(SIM.marketSatisFiyati(sb, s2.u.id), 0) + ' ₺</b>') + '</div>';
    }
    h += '</div>';
    h += '<div class="raf">';
    for (var r = 0; r < v.secenek.length; r++) {
      var u = v.secenek[r];
      h += '<button class="rafOge" onclick="MINI.kasaOkut(\'' + u.id + '\')">' + u.emoji + '<span>' + u.ad + '</span></button>';
    }
    h += '</div></div>';
    this.ac(h);
  },

  kasaSayac: function () {
    var self = this;
    function tik() {
      if (!self.acik || self.tur !== 'kasa' || self.veri.bitti) return;
      var kalan = self.veri.sure - (Date.now() - self.veri.baslangic);
      var el = document.getElementById('kasaSure');
      if (el) el.textContent = Math.max(0, Math.ceil(kalan / 1000)) + ' sn';
      if (kalan <= 0) { self.kasaBitir(); return; }
      self.rafId = requestAnimationFrame(tik);
    }
    this.rafId = requestAnimationFrame(tik);
  },

  kasaOkut: function (uid) {
    var v = this.veri, sb = D.sube();
    if (v.bitti) return;
    var bulundu = null;
    for (var i = 0; i < v.sepet.length; i++) {
      if (!v.sepet[i].okutuldu && v.sepet[i].u.id === uid) { bulundu = v.sepet[i]; break; }
    }
    if (!bulundu) {
      v.hata++;
      v.baslangic -= 1200;      /* ceza: süreden düşer */
      if (window.SES) SES.cal('hata');
      UI.bildir('Yanlış ürün', 'Sepette bu ürün yok.', 'kotu');
      this.kasaCiz();
      return;
    }
    if ((sb.market.stok[uid] || 0) <= 0) {
      bulundu.okutuldu = true;
      sb.market.kayipSatis++;
      this.kasaCiz();
      return;
    }
    bulundu.okutuldu = true;
    sb.market.stok[uid]--;
    var fiyat = SIM.marketSatisFiyati(sb, uid);
    v.ciro += fiyat;
    v.kar += fiyat - bulundu.u.alis;
    v.okutulan++;
    sb.market.gunlukSatis[uid] = (sb.market.gunlukSatis[uid] || 0) + 1;
    if (sb.bugun) sb.bugun.marketUrun++;
    if (window.SES) SES.cal('bip');

    var kaldi = false;
    for (var j = 0; j < v.sepet.length; j++) if (!v.sepet[j].okutuldu) kaldi = true;
    if (!kaldi) {
      if (window.SES) SES.cal('kasa');
      if (v.musteri >= v.hedefMusteri) { this.kasaBitir(); return; }
      this.kasaMusteri();
    } else this.kasaCiz();
  },

  kasaBitir: function () {
    var v = this.veri;
    if (v.bitti) { this.kapat(); return; }
    v.bitti = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    var sb = D.sube();
    var bonus = v.hata === 0 && v.musteri >= v.hedefMusteri ? Math.round(v.ciro * 0.25) : 0;
    D.s.para += v.ciro + bonus;
    D.s.ist.ciro += v.ciro + bonus;
    D.s.ist.kar += v.kar + bonus;
    D.s.ist.bugunCiro += v.ciro + bonus;
    sb.market.ciro += v.ciro;
    if (sb.bugun) sb.bugun.ciro += v.ciro;
    D.xpEkle(Math.round(v.ciro * 0.04));

    var h = '<div class="miniKutu"><div class="miniBas"><span>Kasa kapandı</span></div>';
    h += '<div class="miniSonuc" style="color:' + (bonus ? 'var(--sari)' : 'var(--yesil)') + '">' + (bonus ? '⚡ Hatasız vardiya' : '🧾 Vardiya bitti') + '</div>';
    h += '<div class="kv"><span>Müşteri</span><b>' + v.musteri + '</b></div>';
    h += '<div class="kv"><span>Okutulan ürün</span><b>' + v.okutulan + '</b></div>';
    h += '<div class="kv"><span>Hatalı okutma</span><b class="' + (v.hata ? 'kirmiziY' : '') + '">' + v.hata + '</b></div>';
    h += '<div class="kv"><span>Ciro</span><b class="yesilY">' + tl(v.ciro) + '</b></div>';
    if (bonus) h += '<div class="kv"><span>Hatasız primi</span><b class="sariY">+' + tl(bonus) + '</b></div>';
    h += '<button class="btn genis" style="margin-top:12px" onclick="MINI.kapat()">Tamam</button></div>';
    this.ac(h);
  },

  /* =========================================================
     LPG GÜVENLİK ADIMI
     ========================================================= */
  lpgOnay: function (devam) {
    this.tur = 'lpg';
    this.kapandi = null;
    this.veri = { adim: 0, devam: devam };
    this.lpgCiz();
  },

  lpgCiz: function () {
    var v = this.veri;
    var adimlar = [
      { ad: 'Motoru durdur', emoji: '🔑', not: 'LPG dolumunda motor çalışır durumda olamaz.' },
      { ad: 'Yolcular insin', emoji: '🚶', not: 'Dolum sırasında araçta kimse kalmamalı.' },
      { ad: 'Topraklama ve tabanca', emoji: '🔌', not: 'Topraklama kelepçesini tak, tabancayı kilitle.' }
    ];
    var a = adimlar[v.adim];
    var h = '<div class="miniKutu"><div class="miniBas"><span>💨 LPG Güvenlik</span>';
    h += '<button class="kapat" onclick="MINI.lpgVazgec()">✕</button></div>';
    h += '<div class="miniSayac">' + (v.adim + 1) + ' / ' + adimlar.length + '</div>';
    h += '<div class="miniSonuc" style="font-size:20px">' + a.emoji + ' ' + a.ad + '</div>';
    h += '<div class="not ortala">' + a.not + '</div>';
    h += '<button class="btn genis" style="margin-top:14px" onclick="MINI.lpgIlerle()">TAMAM</button>';
    h += '<button class="btn ikincil genis" style="margin-top:8px" onclick="MINI.lpgAtla()">Adımları atla</button>';
    h += '</div>';
    this.ac(h);
  },

  lpgIlerle: function () {
    var v = this.veri;
    v.adim++;
    if (v.adim >= 3) {
      var dvm = v.devam;
      this.kapat();
      if (dvm) dvm(true);
      return;
    }
    this.lpgCiz();
  },

  lpgAtla: function () {
    var dvm = this.veri.devam;
    var sb = D.sube();
    /* güvenlik adımı atlanırsa küçük risk */
    if (Math.random() < 0.18) {
      var ceza = Math.round(4000 + D.s.seviye * 1800);
      D.s.para -= ceza;
      D.s.ist.bugunGider += ceza;
      sb.memnuniyet = kisitla(sb.memnuniyet - 4, 0, 100);
      UI.bildir('⚠️ Güvenlik ihlali', 'Motor kapatılmadan dolum yapıldı; uyarı cezası ' + tl(ceza) + '.', 'kotu');
    }
    this.kapat();
    if (dvm) dvm(false);
  },

  lpgVazgec: function () {
    var dvm = this.veri.devam;
    this.kapat();
    if (dvm) dvm(null);
  },

  vazgec: function () {
    if (this.tur === 'yikama' || this.tur === 'yag') {
      UI.bildir('Hizmet verilmedi', 'Müşteri ek hizmet almadan gitti.', 'uyari');
    }
    this.kapat();
  }
};
