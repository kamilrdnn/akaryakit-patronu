# İlerleme ve yapılacaklar

Bu dosya oturum kesilse bile işin kaldığı yerden sürmesi için tutulur.
**Yeni bir oturum bu depoyu açtığında: bu dosyayı oku, "Sıradaki işler" listesinin en üstündeki
maddeden devam et, bitirdiğini `Tamamlananlar`a taşı, testleri çalıştır, `main`'e gönder.**
`main`'e her gönderim GitHub Actions'ta imzalı APK üretir, Releases'a yükler ve `update.json`'ı
günceller; oyun kendi içinden güncellendiği için APK'yı elle göndermeye gerek yoktur.

## Çalışma kuralları

1. Değişiklikten sonra **mutlaka** üç testi de çalıştır:
   `cd test && npm install && node test.js && node uitest.js && node sahne.js`
2. Testler geçmeden commit etme. Yeni özellik eklediysen testini de yaz.
3. Commit mesajları Türkçe, ne yapıldığını anlatır. Sonuna şu iki satır eklenir:
   `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` ve `Claude-Session: <oturum bağlantısı>`
4. İmza anahtarı (`app/akaryakit-release.jks`) depoda **yoktur**; APK'yı CI üretir.
   Yerelde derlemek istersen anahtar olmadan imzalı sürüm çıkmaz, bu normaldir.
5. Oyun tamamen çevrimdışıdır, Türkçedir, reklam ve uygulama içi satın alma yoktur.
6. Görsel üretimi için hazır dosya kullanılmaz; her şey `izo.js` içinde kodla çizilir.

## Tamamlananlar

- İzometrik 3B istasyon sahnesi (`izo.js`): kutu/silindir modelleme, gün-gece aydınlatması,
  sezonluk ağaçlar, yoldan geçen ve pompaya yanaşan araçlar, uçan kazanç yazıları, duman,
  yumuşak kamera (atalet + yakınlaştırma), görünür alana göre zemin kırpma, dokunma isabeti.
- Personel figürleri sahnede: pompacı pompada, temizlikçi turda, teknisyen bakımda, müdür ofiste.
- HUD: yakıt göstergeleri ve tek dokunuşla sipariş, sezon kampanyası kartı, sıradaki lokasyon
  ilerlemesi, büyük DOLDUR düğmesi, kamera düğmeleri.
- Sol altta dört kareli düğme ve yukarı açılan yelpaze menü (alt sekme çubuğu kaldırıldı).
- Elle dolum: tam akış + yavaş tabanca, tam isabet bahşişi, taşma zararı, yanlış tabanca cezası.
- **Ön ayar modu**: miktar girilip otomatik durdurma (bahşiş yarı). Ayarlardan
  "basılı tut / miktar gir / ikisi de" seçilebiliyor.
- **Karma pompa**: tek pompadan benzin, dizel ve LPG (kendi türü tam hızda, diğerleri %70).
- Market sistemi: 12 ürün, raf kapasitesi, alış/satış fiyatı, stoksuz satış kaybı, kasiyer.
- Banka: varlık/borç/net değer dökümü, kredi notu, 4 kredi ürünü, taksit, gecikme, erken kapatma.
- Yeni tesisler: tuvalet, mescit, hava-su, ATM, lastikçi, AdBlue, güvenlik kamerası,
  yangın sistemi, fiyat totemi (fiyatları yoldan gösterir).
- Tank %25 altına inince uyarı (tanker yoldaysa susar), market stoğu uyarısı.
- Daha büyük parseller: kasaba 5×5 … metropol 9×9, pompa sınırları yükseltildi.
- 16 başarım, sezon kampanyası, hile paneli (para/seviye/tank/bakım).
- **Motor tarafı hazır, arayüzü bekleyen**: tedarikçi seçimi (toptancı/standart/hızlı),
  kurumsal sözleşmeler (`SIM.sozlesmeTeklifleriUret`, `sozlesmeImzala`, `sozlesmeleriIsle`),
  günlük görevler (`gorevleriYenile`, `gorevIlerleme`, `gorevOdulAl`),
  darboğaz analizi (`SIM.darbogazlar`).

## Sıradaki işler

1. **Panel arayüzleri** — motor hazır, ekranları yazılacak:
   - Yönetim paneline alt sekmeler: Özet · Muhasebe (darboğazlar + gün dökümü) · Görevler ·
     Sözleşmeler · Başarımlar · Ayarlar.
   - İnşaat paneline kategori sekmeleri: İstasyon · Tesisler · Enerji · Arsa.
   - Sipariş paneli: −/+ ve MAX düğmeleri, %25/%50/%75/FULL kısayolları, tedarikçi seçimi.
   - Fiyat paneli: kaydırıcının yanına −/+ adım düğmeleri, "bu fiyatla müşteri akışı %X".
2. **Mini oyunlar**: oto yıkama (program + süre), yağ değişimi (doğru yağ/filtre),
   market kasası (hızlı okutma), LPG dolumunda güvenlik adımı.
3. **Ses**: WebAudio ile kodla üretilen efektler (dolum, kasa, buton, araç, başarım) ve ayarı.
4. **Konfor**: çevrimdışı kazanç (kapalıyken müdürlü şubeler), 5× hız, ciro grafiği,
   ilk oyun rehberi, kaydı dosyaya yedekleme/geri yükleme.
5. **Oynanış derinliği**: sadakat kartı, premium (katkılı) yakıt, ödemeden kaçan müşteri ve
   kameranın etkisi, vardiya/gece kapatma.
6. **Sahne cilası**: yağmur ve kar partikülleri, dolumda hortumun araca uzanması,
   gece neon tabela, araç çeşitliliğinin artırılması.
7. **Dağıtım**: Google Play için AAB üretimi, mağaza görselleri ve gizlilik metni.

## Kullanıcının oyun hakkındaki tercihleri

- Görünüm referansı: benzer bir mobil tycoon oyununun ekran görüntüleri verildi;
  **birebir kopya istenmiyor**, fikirler alınıp kendi tasarımımızla uygulanıyor.
- Oyun Türkçe, tek kişilik, çevrimdışı; hile paneli kalsın (kendi oyunu).
- Grafiklerin mümkün olduğunca yumuşak ve akıcı olması isteniyor.
