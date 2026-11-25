# Akaryakıt Patronu — ilerleme defteri

Bu dosya, oturum kesilirse yeni oturumun kaldığı yerden devam edebilmesi için tutulur.

## Çalışma kuralları
- Her değişiklikten sonra: `cd test && node test.js && node uitest.js && node sahne.js`
- Commit mesajları Türkçe, kısa ve maddeli.
- `main`'e push → GitHub Actions imzalı APK üretir, Release yayınlar, `update.json` yazar.
- Keystore repoda değil; CI tek bir `KEYSTORE_BASE64` gizli anahtarıyla imzalar.
- Sahne (izo.js) değişince `test/sahne-*.png` çıktılarına bakılır.

## Tamamlananlar (son tur)
- Zemin önbelleği (kasma çözümü), DPR 2 sınırı
- Mevsime göre çim paleti, benekli çim dokusu
- Çevre: tarlalar, kasaba binaları, cami, otobüs durağı, aydınlatma direkleri
- Bina modelleri %84 ölçekle çiziliyor (üst üste binme yok)
- Otomatik yerleşim planı (SIM.oneriYer / SIM.yerAc)
- Yapı taşıma modu (SIM.yapiTasi + UI taşıma şeridi)
- Jeneratör kendi yakıt deposundan çalışıyor (SIM.jeneratorDoldur)
- Toplu (filo) anlaşmaları: VERI.filoAnlasmalar, SIM.filoKonvoy/filolariIsle, UI.filoHtml
- Mini oyunlar bağlandı: oto yıkama, yağ değişimi, market kasası, LPG güvenlik
- WebAudio ses motoru (ses.js) + ayar anahtarı
- Bildirimler alta alındı, otomatik kapanıyor, tekrar bastırma var
- Safe-area (çentik) desteği
- Yelpaze menü yazısız/akıcı
- Çevrimdışı kazanç, oyun hızı 1×/2×/3×/5×
- Hava olayları: kar ve yağmur tanecikleri
- Çevre trafiğinde otobüs/tır/taksi/minibüs çeşitliliği

## Son turda eklenenler (3)
- Mağaza ekran görüntüleri: `test/ekran.js` (Playwright) gerçek oyundan 6 adet 1080x1920 PNG üretiyor
- `test/kayit.js`: ekran görüntüsü ve denge ölçümü için gelişmiş hazır kayıt üretici

## Son turda eklenenler (2)
- Pazarlama programları: sadakat kartı, katkılı yakıt, yıkama aboneliği
- Ödemeden kaçan müşteri + güvenlik kamerası tahsilatı
- Muhasebede ciro/gider/net grafiği (SVG)
- İlk oyun rehberi (6 adım + ödül)
- Kayıt yedekleme / geri yükleme (base64 kod)
- Gece kapatma (00:00-05:00) ve sahnede KAPALI tabelası
- Dolumda hortum, gece dükkân neonları, kışın çatı karı
- CI artık AAB de üretiyor; magaza/ altında gizlilik ve mağaza metni

## Sıradaki işler
1. **Sahne**: istasyon içi yaya hareketi, market vitrin detayı, araç gölgelerinde yumuşatma
2. **Oynanış**: rakip istasyon olayları, fiyat savaşı, tanker filosu yönetimi
3. **Denge**: 60 günlük bot simülasyonunu yeni programlarla yeniden ölç
