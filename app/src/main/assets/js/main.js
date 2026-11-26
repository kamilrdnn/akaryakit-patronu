/* Akaryakıt Patronu — açılış ve ana döngü */
'use strict';

var OYUN = {
  zamanlayici: 0,
  duruyor: false,
  sonKayit: 0,

  basla: function (yeniMi) {
    if (yeniMi) { D.sil(); D.yeni(); }
    document.getElementById('acilis').style.display = 'none';
    document.getElementById('uygulama').style.display = 'flex';
    UI.kur();
    /* ilk dokunuşta ses motorunu uyandır (tarayıcı kuralı) */
    try {
      var uyandir = function () {
        if (window.SES) SES.uyandir();
        document.removeEventListener('touchstart', uyandir);
        document.removeEventListener('click', uyandir);
      };
      document.addEventListener('touchstart', uyandir);
      document.addEventListener('click', uyandir);
    } catch (e) {}
    this.dongu();
    if (yeniMi) {
      setTimeout(function () { try { UI.rehberTanitim(); } catch (e) {} }, 500);
    } else {
      /* çevrimdışı kazanç */
      try {
        var cd = SIM.cevrimdisiHesapla();
        if (cd) setTimeout(function () { UI.cevrimdisiModal(cd); }, 400);
      } catch (e) {}
    }
    /* günlük giriş ödülü: başka pencere yokken bir kez göster */
    try {
      var girisSay = 0;
      var girisZ = setInterval(function () {
        try {
          if (++girisSay > 60) { clearInterval(girisZ); return; }
          if (UI.modalAcik || (window.SERVIS && SERVIS.acik) || document.querySelector('.tanitim')) return;
          if (!D.s.ist.musteri) return;                      /* yeni oyunda öğreticiyi bölme */
          clearInterval(girisZ);
          EK.girisGoster();
        } catch (e) {}
      }, 3000);
    } catch (e) {}
    /* sessiz güncelleme denetimi */
    setTimeout(function () { try { GUNCELLE.kontrol(false); } catch (e) {} }, 2500);
    /* oyun açıkken de 15 dakikada bir yeni sürüme bak */
    setInterval(function () { try { if (!UI.modalAcik) GUNCELLE.kontrol(false); } catch (e) {} }, 15 * 60 * 1000);
  },

  dongu: function () {
    var self = this;
    if (this.zamanlayici) clearInterval(this.zamanlayici);
    this.zamanlayici = setInterval(function () {
      if (self.duruyor || !D.s) return;
      SIM.tik(D.s.hiz);
      UI.tikCiz();
      if (SERVIS.acik) SERVIS.guncelle();
      var simdi = Date.now();
      if (simdi - self.sonKayit > 20000) { D.kaydet(); self.sonKayit = simdi; }
    }, 1000);   /* 1 saniye = 1 oyun dakikası (hız çarpanı kadar) */
  },

  /* kayıt özetini güvenle oku (oyunu yüklemeden) */
  kayitOzeti: function () {
    try {
      var ham = localStorage.getItem(KAYIT_ANAHTAR);
      if (!ham) return null;
      var o = JSON.parse(ham);
      if (!o || !o.subeler || !o.subeler.length) return null;
      return {
        gun: o.gun || 1, para: o.para || 0, seviye: o.seviye || 1,
        sube: o.subeler.length,
        marka: (o.tabela && o.tabela.ad) ? String(o.tabela.ad).toUpperCase() : '',
        logo: (o.tabela && o.tabela.logo) ? o.tabela.logo : '⛽'
      };
    } catch (e) { return null; }
  },

  acilisCiz: function (ekran) {
    var oz = this.kayitOzeti();
    var ipucu = secRast(VERI.ipuclari);
    var surum = '';
    try { if (window.AndroidKabuk && AndroidKabuk.surum) surum = 'v' + AndroidKabuk.surum(); } catch (e) {}
    var h = '';

    if (ekran === 'yeniOnay') {
      /* tarayıcının onay kutusu WebView içinde açılmadığı için sayfa içi onay */
      h += '<div class="logo">🗑️</div><h1>Yeni oyun</h1>';
      h += '<p>Mevcut kaydın silinecek' + (oz ? ': <b>Gün ' + oz.gun + ' · ' + tl(oz.para) + ' · Seviye ' + oz.seviye + '</b>' : '') + '. Bu işlem geri alınamaz.</p>';
      h += '<div class="acMenu">';
      h += '<button class="acBtn tehlike" onclick="OYUN.basla(true)">Evet, sıfırdan başla</button>';
      h += '<button class="acBtn ikincil" onclick="OYUN.acilisCiz()">Vazgeç</button>';
      h += '</div>';
      document.getElementById('acilis').innerHTML = h;
      return;
    }

    if (ekran === 'yedek') {
      h += '<div class="logo">📥</div><h1>Yedekten yükle</h1>';
      h += '<p>Daha önce Ayarlar → Yedek al ile aldığın kodu yapıştır.</p>';
      h += '<textarea id="acYedek" class="acYedek" placeholder="Yedek kodunu buraya yapıştır"></textarea>';
      h += '<div id="acHata" class="acHata"></div>';
      h += '<div class="acMenu">';
      h += '<button class="acBtn" onclick="OYUN.yedektenBasla()">Yükle ve başla</button>';
      h += '<button class="acBtn ikincil" onclick="OYUN.acilisCiz()">Geri</button>';
      h += '</div>';
      document.getElementById('acilis').innerHTML = h;
      return;
    }

    if (ekran === 'hakkinda') {
      h += '<div class="logo">ℹ️</div><h1>Nasıl oynanır</h1>';
      h += '<div class="acBilgi">';
      h += '<div><b>1.</b> Pompaya gelen araca dokun, tabancayı seç, istenen miktarda bırak.</div>';
      h += '<div><b>2.</b> Tanklar boşalmadan yelpaze menüden sipariş ver.</div>';
      h += '<div><b>3.</b> Pompa, market ve tesis kur; personel al; anlaşma imzala.</div>';
      h += '<div><b>4.</b> Seviye atla, yeni şubeler aç, zinciri büyüt.</div>';
      h += '</div>';
      h += '<div class="acMenu"><button class="acBtn ikincil" onclick="OYUN.acilisCiz()">Geri</button></div>';
      document.getElementById('acilis').innerHTML = h;
      return;
    }

    /* ---- ana menü ---- */
    h += '<div class="oyunLogo kucuk">' + this.oyunLogoSvg() + '<div class="olYazi"><span>AKARYAKIT</span><b>PATRONU</b></div></div>';
    h += '<p>Kasabanın küçük istasyonundan metropol zincirine.</p>';
    h += '<div class="acMenu">';
    if (oz) {
      h += '<button class="acBtn" onclick="OYUN.devamEt()"><span class="acBas">▶ Devam et</span>';
      h += '<span class="acAlt">' + oz.logo + ' ' + (oz.marka ? oz.marka + ' · ' : '') + 'Gün ' + oz.gun + ' · ' + tl(oz.para) + ' · Sv ' + oz.seviye + '</span></button>';
      h += '<button class="acBtn ikincil" onclick="OYUN.acilisCiz(\'yeniOnay\')"><span class="acBas">＋ Yeni oyun</span></button>';
    } else {
      h += '<button class="acBtn" onclick="OYUN.basla(true)"><span class="acBas">▶ Yeni oyun</span><span class="acAlt">İlk istasyonunu kur</span></button>';
    }
    h += '<button class="acBtn ikincil" onclick="OYUN.acilisCiz(\'yedek\')"><span class="acBas">📥 Yedekten yükle</span></button>';
    h += '<button class="acBtn ikincil" onclick="OYUN.acilisCiz(\'hakkinda\')"><span class="acBas">ℹ️ Nasıl oynanır</span></button>';
    h += '</div>';
    h += '<div class="ipucu">💡 ' + ipucu + '</div>';
    h += '<div class="acYapimci">' + this.studyoSvg() + '<span>KAMİLRDNN</span></div>';
    if (surum) h += '<div class="acSurum">' + surum + '</div>';
    document.getElementById('acilis').innerHTML = h;
  },

  /* ---- logolar (satır içi SVG; dosya ya da yazı tipi gerektirmez) ---- */
  /* stüdyo amblemi: altıgen içinde K */
  studyoSvg: function () {
    return '<svg class="kmAmblem" viewBox="0 0 100 100" aria-hidden="true">' +
      '<defs><linearGradient id="kmG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd24a"/><stop offset=".5" stop-color="#ff7a3d"/><stop offset="1" stop-color="#ff3d7f"/></linearGradient></defs>' +
      '<path d="M50 4 90 27v46L50 96 10 73V27z" fill="#121a2b" stroke="url(#kmG)" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M35 26v48M35 52l30-26M44 46l23 28" fill="none" stroke="url(#kmG)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  },
  /* oyun amblemi: taç takmış yakıt damlası */
  oyunLogoSvg: function () {
    return '<svg class="olAmblem" viewBox="0 0 120 140" aria-hidden="true">' +
      '<defs><linearGradient id="olD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a4d"/><stop offset=".55" stop-color="#f2632f"/><stop offset="1" stop-color="#b9371a"/></linearGradient>' +
      '<linearGradient id="olT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#f0a81e"/></linearGradient></defs>' +
      '<path d="M60 34C60 34 22 78 22 100a38 38 0 0 0 76 0C98 78 60 34 60 34z" fill="url(#olD)" stroke="#fff" stroke-opacity=".28" stroke-width="3"/>' +
      '<path d="M42 96c0-10 8-24 13-31" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="6" stroke-linecap="round"/>' +
      '<g fill="#fff"><rect x="49" y="88" width="17" height="26" rx="3"/><rect x="52" y="92" width="11" height="8" rx="1.5" fill="#b9371a"/>' +
      '<path d="M68 94h4a4 4 0 0 1 4 4v10a3 3 0 0 0 6 0V96l-5-6" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<path d="M30 30l10-22 12 15 8-19 8 19 12-15 10 22z" fill="url(#olT)" stroke="#a86a00" stroke-width="2" stroke-linejoin="round"/>' +
      '<rect x="30" y="30" width="60" height="8" rx="3" fill="url(#olT)" stroke="#a86a00" stroke-width="2"/>' +
      '<circle cx="40" cy="8" r="4" fill="#ff5a7a"/><circle cx="60" cy="4" r="4.5" fill="#6fe0ff"/><circle cx="80" cy="8" r="4" fill="#7dffb0"/></svg>';
  },

  /* ---- açılış animasyonu: önce yapımcı, sonra oyun logosu, ardından menü ---- */
  intro: function () {
    var kap = document.getElementById('intro');
    if (!kap) return;
    var harfler = 'KAMİLRDNN'.split(''), yazi = '';
    for (var i = 0; i < harfler.length; i++) yazi += '<i style="animation-delay:' + (0.35 + i * 0.07).toFixed(2) + 's">' + harfler[i] + '</i>';
    var kivilcim = '';
    for (var k = 0; k < 10; k++) {
      kivilcim += '<u style="left:' + (8 + k * 9.3).toFixed(1) + '%;top:' + (k % 2 ? 22 : 74) + '%;animation-delay:' + (1.05 + k * 0.06).toFixed(2) + 's"></u>';
    }
    kap.innerHTML =
      '<div class="inSahne in1">' + this.studyoSvg() +
        '<div class="kmYazi">' + yazi + '<em></em></div>' +
        '<div class="kmAlt">GAMES</div>' + kivilcim + '</div>' +
      '<div class="inSahne in2"><div class="oyunLogo">' + this.oyunLogoSvg() +
        '<div class="olYazi"><span>AKARYAKIT</span><b>PATRONU</b></div></div>' +
        '<div class="inCubuk"><i></i></div></div>' +
      '<div class="inGec">dokun · geç</div>';
    kap.className = 'oynuyor';
    var bitti = false;
    var bitir = function () {
      if (bitti) return;
      bitti = true;
      kap.className = 'kapaniyor';
      setTimeout(function () { kap.className = ''; kap.innerHTML = ''; kap.style.display = 'none'; }, 450);
    };
    kap.onclick = bitir;
    setTimeout(bitir, 5200);
  },

  devamEt: function () {
    if (D.yukle()) this.basla(false);
    else { this.basla(true); }
  },

  yeniOyunOnay: function () { this.acilisCiz('yeniOnay'); },

  yedektenBasla: function () {
    var el = document.getElementById('acYedek');
    var hata = document.getElementById('acHata');
    var ham = el ? el.value.trim() : '';
    var nesne = null;
    if (ham) {
      try {
        var coz = ham.charAt(0) === '{' ? ham : decodeURIComponent(escape(atob(ham)));
        nesne = JSON.parse(coz);
      } catch (e) { nesne = null; }
    }
    if (!nesne || !nesne.subeler || !nesne.subeler.length) {
      if (hata) hata.textContent = 'Kod okunamadı. Tamamını kopyaladığından emin ol.';
      return;
    }
    try { localStorage.setItem(KAYIT_ANAHTAR, JSON.stringify(nesne)); } catch (e) {}
    this.devamEt();
  }
};

/* ---- Android kabuk köprüleri ---- */
window.oyunGeriTusu = function () {
  if (SERVIS.acik) { SERVIS.kapat(); return true; }
  if (UI.modalAcik) { UI.modalKapat(); return true; }
  if (UI.sekme !== 'istasyon') { UI.sekmeGec('istasyon'); return true; }
  return false;   // false → uygulama kapanır
};
window.oyunDurdur = function () { OYUN.duruyor = true; if (D.s) D.kaydet(); };
window.oyunDevam = function () { OYUN.duruyor = false; };

/* ---- başlat ---- */
window.addEventListener('load', function () {
  OYUN.acilisCiz();
  try { OYUN.intro(); } catch (e) { var ik = document.getElementById('intro'); if (ik) ik.style.display = 'none'; }
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('beforeunload', function () { if (D.s) D.kaydet(); });
});
