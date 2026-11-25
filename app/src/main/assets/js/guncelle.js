/* Akaryakıt Patronu — uygulama içi güncelleme denetimi */
'use strict';

const GUNCELLE = {
  /* Sürüm bilgisi bu adreste durur (public repo, raw dosya) */
  adres: 'https://raw.githubusercontent.com/kamilrdnn/akaryakit-patronu/main/update.json',
  denendi: false,

  kodu: function () {
    try { return window.AndroidKabuk ? parseInt(AndroidKabuk.surumKodu(), 10) || 0 : 0; } catch (e) { return 0; }
  },

  /** @param elle kullanıcı kendi mi istedi (sessiz denetimde bildirim çıkmaz) */
  kontrol: function (elle) {
    if (!window.AndroidKabuk) {
      if (elle) UI.bildir('Güncelleme', 'Yalnızca Android uygulamasında çalışır.', 'uyari');
      return;
    }
    if (elle) UI.bildir('Denetleniyor', 'Yeni sürüm aranıyor…', 'uyari');

    var self = this;
    var zamanAsimi = setTimeout(function () { if (elle) UI.bildir('Güncelleme', 'Sunucuya ulaşılamadı.', 'kotu'); }, 12000);

    fetch(this.adres + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (y) { if (!y.ok) throw new Error('http ' + y.status); return y.json(); })
      .then(function (v) {
        clearTimeout(zamanAsimi);
        var mevcut = self.kodu();
        if (!v || !v.versionCode || !v.apkUrl) throw new Error('bozuk');
        if (v.versionCode > mevcut) {
          /* sessiz denetim aynı sürümü oturumda bir kez sorar */
          if (!elle && self._sorulan === v.versionCode) return;
          self._sorulan = v.versionCode;
          self.sor(v);
        }
        else if (elle) UI.bildir('Güncel', 'En son sürümü kullanıyorsun (' + (v.versionName || mevcut) + ').', 'iyi');
      })
      .catch(function () {
        clearTimeout(zamanAsimi);
        if (elle) UI.bildir('Güncelleme', 'Sürüm bilgisi alınamadı. İnternet bağlantını kontrol et.', 'kotu');
      });
  },

  sor: function (v) {
    var mb = v.size ? (v.size / 1048576).toFixed(1) + ' MB' : '';
    var h = '<div class="not">Yeni sürüm hazır. Kurulum sonrası kayıtların korunur.</div>';
    h += '<div class="kv" style="margin-top:10px"><span>Yeni sürüm</span><b>' + (v.versionName || v.versionCode) + '</b></div>';
    if (mb) h += '<div class="kv"><span>Boyut</span><b>' + mb + '</b></div>';
    if (v.notes) h += '<div class="not" style="margin-top:8px"><b>Değişiklikler:</b><br>' + String(v.notes).replace(/</g, '&lt;') + '</div>';
    h += '<button class="btn genis" style="margin-top:12px" onclick="GUNCELLE.indir(\'' + String(v.apkUrl).replace(/'/g, '') + '\')">Güncelle</button>';
    h += '<button class="btn ikincil genis" style="margin-top:8px" onclick="UI.modalKapat()">Sonra</button>';
    UI.modal('Güncelleme var', h);
  },

  indir: function (url) {
    UI.modalKapat();
    UI.bildir('İndiriliyor', 'Bitince kurulum ekranı açılacak.', 'uyari');
    try { AndroidKabuk.guncelle(url); }
    catch (e) { UI.bildir('Hata', 'İndirme başlatılamadı.', 'kotu'); }
  }
};

/* const ile tanımlanan nesne window üzerinde görünmez; window.GUNCELLE denetimleri için bağla */
if (typeof window !== 'undefined') window.GUNCELLE = GUNCELLE;
