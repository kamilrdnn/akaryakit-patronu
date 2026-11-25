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
    /* sessiz güncelleme denetimi */
    setTimeout(function () { try { GUNCELLE.kontrol(false); } catch (e) {} }, 2500);
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
      /* tarayıcı confirm() kutusu WebView'da açılmadığı için sayfa içi onay */
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
    h += '<div class="acLogo"><span>⛽</span></div>';
    h += '<h1>Akaryakıt Patronu</h1>';
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
    if (surum) h += '<div class="acSurum">' + surum + '</div>';
    document.getElementById('acilis').innerHTML = h;
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
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('beforeunload', function () { if (D.s) D.kaydet(); });
});
