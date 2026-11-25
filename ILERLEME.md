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

## Sıradaki işler
1. **Sahne cilası**: dolumda hortumun araca uzanması, gece neon tabela, çatı kar örtüsü
2. **Oynanış derinliği**: sadakat kartı, premium (katkılı) yakıt, ödeme kaçıran müşteri + kamera etkisi, vardiya/gece kapatma
3. **Konfor**: ciro grafiği (Muhasebe), ilk oyun rehberi, kaydı dosyaya yedekleme/geri yükleme
4. **Dağıtım**: Google Play için AAB, mağaza görselleri, gizlilik metni
