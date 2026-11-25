# Akaryakıt Patronu

Tek kişilik, tamamen çevrimdışı Android akaryakıt istasyonu yönetim oyunu. Kasabanın
küçük istasyonundan metropol zincirine; her müşteriyi elinle doldurup bahşiş toplayarak.
Reklam yok, uygulama içi satın alma yok. İnternet yalnızca güncelleme denetiminde kullanılır.

## Nasıl oynanır

1. Müşteri gelince pompa **yeşil** yanıp nabız gibi atar — pompaya dokun.
2. Müşterinin istediği **tabancayı** seç (yanlış tabanca = zarar + kızgın müşteri).
3. **TAM AKIŞ** tetiğini basılı tutarak hızlı doldur.
4. Son 1-2 litreyi **YAVAŞ** tetiğiyle hassas tamamla:
   - ±0,15 L → **Tam isabet**: %10 bahşiş + marka puanı
   - ±0,60 L → küçük bahşiş
   - 0,30 L üzeri taşma → fazla yakıt yere döküldü, parası senden
5. **BİTİR & ÖDET** ile satışı kapat.

## Görünüm

İstasyon, canvas üstünde çizilen **izometrik 3B sahnedir**: yoldan geçen ve pompaya yanaşan
araçlar, kutu modelli pompa/kanopi/tesisler, gün-gece aydınlatması (gece yanan vitrinler,
araç farları, kanopi ışığı), sezona göre değişen ağaçlar, satıştan sonra havaya uçan kazanç
yazıları. Sahne sürüklenerek kaydırılır, çift parmakla veya + / − düğmeleriyle yakınlaştırılır;
pompaya veya boş araziye dokunarak iş yapılır. Üstteki HUD yakıt göstergelerini, Mağaza ve
kısayol düğmelerini, sezon kampanyasını ve sıradaki lokasyonun ilerlemesini gösterir.

## Sistemler

| Alan | İçerik |
|---|---|
| Yakıt | Benzin, dizel, LPG, elektrikli şarj. Benzin/dizel pompaları çok tabancalı (diğerini %70 hızda verir), LPG ve EV ayrı pompa ister. |
| İnşa | Arsa satın alma, beton dökme, 14 pompaya kadar büyüme, seviye yükseltme, bakım, yıkım. |
| Tesisler | Market, kafe, oto yıkama, yağ değişimi, restoran, tır parkı, yakıt deposu, yönetim ofisi. |
| Enerji | Güneş paneli (gündüz), dizel jeneratör (tanktan yakıt yakar), modüler reaktör. Şebeke kesintisinde pompalar yavaşlar. |
| Personel | Pompacı (otomatik dolum, bahşiş yok), temizlikçi, teknisyen, şube müdürü. |
| Ekonomi | Günlük dalgalanan toptan fiyat, kendi satış fiyatın, rakip istasyon, fiyat savaşı, kira, maaş, elektrik. |
| Dünya | Gün/gece döngüsü, yoğun saatler, 4 sezon, müşteri akını, arıza, denetim, sağanak, tur otobüsleri. |
| Büyüme | Kasaba → çevre yolu → otoyol → marina → metropol. Her lokasyonun kendi trafiği ve araç profili var. |
| Son oyun | 5 yıldızlı şubeyi devredip kalıcı pasif gelir; rafineri + tanker filosu ile indirimli tedarik. |
| Hedefler | 16 başarım (ciro, tam isabet, pompa sayısı, zincir, rafineri…) ve her sezon değişen kampanya ürünü. |

## Teknik

- **Kabuk:** Kotlin + WebView (`MainActivity.kt`). `WebViewAssetLoader` ile sabit origin
  (`https://appassets.androidplatform.net`) kullanıldığı için `localStorage` kayıtları
  güncellemelerde silinmez.
- **Oyun:** `app/src/main/assets/` içinde saf JS/CSS — motor (`sim.js`), durum (`durum.js`),
  elle dolum (`servis.js`), izometrik sahne (`izo.js`), arayüz (`arayuz.js`), veri (`veri.js`).
  Dış kütüphane yok, hazır görsel dosyası yok: bütün sahne kodla çizilir.
- **Kayıt:** `localStorage`, 20 saniyede bir ve her satıştan sonra otomatik. `durum.js`
  içindeki `onar()` eski kayıtları yeni sürümün alanlarıyla tamamlar.
- **Güncelleme:** Oyun açılışta `update.json` dosyasını okur; yeni `versionCode` varsa
  "Güncelleme var" ekranı çıkar, APK indirilip kurulum başlatılır (`DownloadManager` + `FileProvider`).

## Derleme

GitHub Actions `main` dalına her gönderimde imzalı APK derler, sürümü `Releases`'a yükler ve
`update.json` dosyasını günceller. Gereken repo secret'ları:

| Secret | Açıklama |
|---|---|
| `KEYSTORE_BASE64` | İmza anahtarının base64 hali (tek satır) |
| `KEYSTORE_PASSWORD` | Keystore şifresi |
| `KEY_ALIAS` | Anahtar takma adı |
| `KEY_PASSWORD` | Anahtar şifresi |

> İmza anahtarı değişirse kurulu oyunun üstüne güncelleme kurulamaz (kaldırıp yeniden
> kurmak, yani kaydı silmek gerekir). Anahtarı sakla.

Elle derleme:

```bash
export ANDROID_HOME=~/android-sdk
export APP_VERSION_CODE=1 APP_VERSION_NAME=1.0
gradle :app:assembleRelease
```

## Testler

Oyun motoru ve arayüzü tarayıcısız test edilir (`test/` klasörü):

```bash
cd test && npm install && node test.js && node uitest.js
```

- `test.js` — 12 başlık: müşteri üretimi, satış matematiği (tam isabet / taşma / eksik /
  yanlış yakıt), inşa-yükseltme-bakım, arsa genişletmede indeks kayması, sipariş teslimi,
  60 oyun günü kesintisiz simülasyon, kayıt-yükleme ve eski kayıt onarımı, devretme,
  rafineri, güç dengesi.
- `uitest.js` — 10 başlık: jsdom üzerinde bütün sekmelerin çizimi, HUD bileşenleri, kampanya
  ve başarım mantığı, izometrik dönüşümler, modallar, fiyat kaydırıcıları, sipariş, elle dolum
  akışı, yanlış tabanca, geri tuşu, şube geçişi, sıfırlama.
- `sahne.js` — 6 başlık: gerçek canvas üstünde sahne render'ı (gündüz/gece/kış), araç yolu ve
  park etme, dokunma isabeti, 400 kare kararlılık. `test/sahne-*.png` dosyalarını üretir.
