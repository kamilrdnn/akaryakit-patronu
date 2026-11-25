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
    this.dongu();
    if (yeniMi) {
      UI.bildir('Hoş geldin patron', 'İki pompan ve yarım dolu tankların var. Müşteri gelince pompaya dokun.', 'iyi');
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

  acilisCiz: function () {
    var kayitVar = false;
    try { kayitVar = !!localStorage.getItem(KAYIT_ANAHTAR); } catch (e) {}
    var ipucu = secRast(VERI.ipuclari);
    var h = '<div class="logo">⛽</div><h1>Akaryakıt Patronu</h1>';
    h += '<p>Kasabanın küçük istasyonundan metropol zincirine. Her müşteriyi elinle doldur, tam tuttur, bahşişi kap.</p>';
    if (kayitVar) {
      h += '<button class="btn genis" style="max-width:280px" onclick="OYUN.devamEt()">DEVAM ET</button>';
      h += '<div style="height:10px"></div>';
      h += '<button class="btn ikincil genis" style="max-width:280px" onclick="OYUN.yeniOyunOnay()">Yeni oyun</button>';
    } else {
      h += '<button class="btn genis" style="max-width:280px" onclick="OYUN.basla(true)">BAŞLA</button>';
    }
    h += '<div class="ipucu">💡 ' + ipucu + '</div>';
    document.getElementById('acilis').innerHTML = h;
  },

  devamEt: function () {
    if (D.yukle()) this.basla(false);
    else { UI.bildir('Kayıt okunamadı', 'Yeni oyun başlatılıyor.', 'kotu'); this.basla(true); }
  },

  yeniOyunOnay: function () {
    if (confirm('Mevcut kaydın silinecek. Emin misin?')) this.basla(true);
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
