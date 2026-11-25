# Google Play mağaza metinleri

## Uygulama adı
Akaryakıt Patronu

## Kısa açıklama (80 karakter)
Kasabanın küçük istasyonundan metropol zincirine: benzin istasyonu patronu ol!

## Tam açıklama
Elinde bir tabanca, önünde sıra sıra araç. Akaryakıt Patronu'nda bir benzin
istasyonunu sıfırdan büyütüyorsun: depoyu doldur, fiyatı belirle, personel al,
market aç, şube zinciri kur.

⛽ ELİNLE DOLDUR
Tabancayı seç, tetiği basılı tut, istenen miktarda bırak. Tam tutturursan bahşiş
alırsın; taşırırsan zararı sen ödersin. İstersen miktarı yazıp pompayı kendi
başına bırakabilirsin.

🏗️ İSTASYONUNU KUR
Pompa, market, kafe, oto yıkama, yağ değişimi, lastikçi, tır parkı, WC, mescit,
hava-su, ATM, güneş paneli, jeneratör, hatta modüler reaktör. Beğenmediğin yapıyı
sürükleyip taşı.

🤝 TOPLU ANLAŞMALAR
Belediye otobüs filosu, okul servisleri, kargo merkezi, taksi durağı, şantiye.
Konvoylar belirlenen saatlerde geliyor; hacim garantili, iskonto senden.

💳 İŞLETMEYİ YÖNET
Banka kredisi, sadakat kartı, katkılı yakıt, yıkama aboneliği, günlük görevler,
sözleşmeler, muhasebe ekranı ve ciro grafiği.

🧼 MİNİ OYUNLAR
Oto yıkama, yağ değişimi, market kasası ve LPG güvenlik adımı.

🌍 YAŞAYAN SAHNE
İzometrik 3B istasyon; gece-gündüz döngüsü, dört mevsim, kar ve yağmur,
yoldan geçen otobüsler ve tırlar.

📴 TAMAMEN ÇEVRİMDIŞI
Reklam yok, uygulama içi satın alma yok, veri toplama yok. Sen yokken de
istasyonun çalışmaya devam eder.

## Kategori
Oyun > Simülasyon

## İçerik derecelendirmesi
Herkes (3+)

## Etiketler
simülasyon, benzin istasyonu, işletme, tycoon, çevrimdışı, idle, Türkçe

## Gerekli görseller (hazırlanacak)
- Uygulama simgesi: 512×512 PNG (32 bit, alfa kanalsız)
- Öne çıkan grafik: 1024×500 PNG/JPG
- Telefon ekran görüntüleri: en az 2, en fazla 8 (1080×1920 veya 1080×2400)
  Önerilen kareler:
  1. İstasyon genel görünümü (gündüz)
  2. Dolum ekranı (sayaç + tabancalar)
  3. Toplu anlaşma paneli
  4. İnşaat paneli
  5. Gece sahnesi
  6. Muhasebe/ciro grafiği

## Üretilen görseller
- `magaza/ikon-512.png` — Play Store simgesi (512×512)
- `magaza/one-cikan-1024x500.png` — öne çıkan grafik (1024×500)
- Uygulama simgeleri `app/src/main/res/mipmap-*` altında güncellendi
- Üretmek için: `cd test && node gorsel.js`

Ekran görüntüleri oyundan alınacak (cihazdan, 1080×2400).

## Görseller
Hepsi `magaza/` altında, `test/` içindeki betiklerle oyunun kendisinden üretilir.

| Dosya | Boyut | Ne gösteriyor | Üreten |
|---|---|---|---|
| `ikon-512.png` | 512×512 | Uygulama simgesi | `node gorsel.js` |
| `one-cikan-1024x500.png` | 1024×500 | Öne çıkan grafik | `node gorsel.js` |
| `ekran-1.png` | 1080×1920 | İstasyon — gündüz, dolu pompalar | `node ekran.js` |
| `ekran-2.png` | 1080×1920 | Servis ekranı — elle dolum | `node ekran.js` |
| `ekran-3.png` | 1080×1920 | İnşaat paneli | `node ekran.js` |
| `ekran-4.png` | 1080×1920 | Muhasebe ve ciro grafiği | `node ekran.js` |
| `ekran-5.png` | 1080×1920 | Mini oyun — oto yıkama | `node ekran.js` |
| `ekran-6.png` | 1080×1920 | İstasyon — gece neonları | `node ekran.js` |

`ekran.js` gerçek oyunu başsız Chromium'da (Playwright) açar, hazır bir kayıt
yükler ve ekranları çeker; sayfada JS hatası çıkarsa hata koduyla durur.
Play Console'a yüklerken telefon ekran görüntüsü olarak 6 dosyayı da verebilirsin.
