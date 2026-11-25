/* Akaryakıt Patronu — sabit veri tanımları */
'use strict';

const VERI = {

  /* ---------------- yakıtlar ---------------- */
  yakitlar: {
    benzin: { ad: 'Benzin', kisa: 'BEN', birim: 'L', tabanMaliyet: 42.40, renk: '#e24e2f', emoji: '⛽' },
    dizel:  { ad: 'Dizel',  kisa: 'DZL', birim: 'L', tabanMaliyet: 41.60, renk: '#f0a020', emoji: '🛢️' },
    lpg:    { ad: 'LPG',    kisa: 'LPG', birim: 'L', tabanMaliyet: 23.80, renk: '#3ec47a', emoji: '💨' },
    ev:     { ad: 'Elektrik',kisa:'kWh', birim: 'kWh',tabanMaliyet: 4.90,  renk: '#4299e1', emoji: '🔌' }
  },
  yakitSira: ['benzin', 'dizel', 'lpg', 'ev'],

  /* ---------------- pompa ---------------- */
  pompa: {
    fiyat: { benzin: 38000, dizel: 38000, lpg: 62000, ev: 95000 },
    // seviye başına tam akış (birim/sn) ve yükseltme bedeli
    akis: [3.60, 4.90, 6.40, 8.20, 10.60],
    evAkis: [1.80, 2.60, 3.60, 5.00, 6.80],
    // hassas dolum için kısık akış (tabancayı az sıkma)
    yavasAkis: [0.30, 0.34, 0.38, 0.44, 0.50],
    yavasEvAkis: [0.20, 0.24, 0.28, 0.34, 0.40],
    yukseltme: [0, 24000, 52000, 110000, 240000],
    guc: { benzin: 0.6, dizel: 0.6, lpg: 1.1, ev: 22 }  // kW
  },

  /* ---------------- tanklar ---------------- */
  tank: {
    temelKapasite: { benzin: 5000, dizel: 5000, lpg: 2500, ev: 0 },
    ekFiyat: 85000,      // +5000 L kapasite
    ekKapasite: 5000
  },

  /* ---------------- binalar ---------------- */
  binalar: {
    market:   { ad: 'Market',        emoji: '🏪', fiyat: 150000,  guc: 6,  gelir: 28,  cekim: 0.16, sv: 3, svFiyat: 120000, seviyeSart: 2,  aciklama: 'Her müşterinin bir kısmı markete girer, ürün satışı gelir getirir.' },
    kafe:     { ad: 'Kafe',          emoji: '☕', fiyat: 210000,  guc: 8,  gelir: 42,  cekim: 0.12, sv: 3, svFiyat: 160000, seviyeSart: 3,  aciklama: 'Kahve ve atıştırmalık; bekleme süresini keyifli kılar, memnuniyeti artırır.' },
    yikama:   { ad: 'Oto Yıkama',    emoji: '🧼', fiyat: 320000,  guc: 14, gelir: 190, cekim: 0.07, sv: 3, svFiyat: 240000, seviyeSart: 3,  aciklama: 'Yıkama ve iç temizlik. Yüksek kârlı ama su/elektrik tüketir.' },
    yag:      { ad: 'Yağ Değişimi',  emoji: '🔧', fiyat: 290000,  guc: 9,  gelir: 320, cekim: 0.035,sv: 3, svFiyat: 220000, seviyeSart: 4,  aciklama: 'Periyodik bakım hizmeti. Az müşteri, yüksek ciro.' },
    restoran: { ad: 'Restoran',      emoji: '🍽️', fiyat: 620000,  guc: 20, gelir: 165, cekim: 0.10, sv: 3, svFiyat: 420000, seviyeSart: 6,  aciklama: 'Özellikle otoyolda tır şoförleri için güçlü bir çekim merkezi.' },
    tirpark:  { ad: 'Tır Parkı',     emoji: '🅿️', fiyat: 380000,  guc: 4,  gelir: 120, cekim: 0.05, sv: 2, svFiyat: 260000, seviyeSart: 5,  aciklama: 'Tır trafiğini ve dizel satışını ciddi şekilde artırır.' },
    wc:       { ad: 'Tuvalet',        emoji: '🚻', fiyat: 65000,   guc: 3,  gelir: 6,   cekim: 0.22, sv: 2, svFiyat: 55000,  seviyeSart: 1,  konfor: 10, aciklama: 'Temel ihtiyaç. Yoksa müşteri memnuniyeti sürekli düşer, varsa yükselir.' },
    mescit:   { ad: 'Mescit',         emoji: '🕌', fiyat: 95000,   guc: 2,  gelir: 0,   cekim: 0.10, sv: 2, svFiyat: 70000,  seviyeSart: 2,  konfor: 8,  aciklama: 'Yol üstü istasyonların vazgeçilmezi; mola veren sürücüyü çeker.' },
    havasu:   { ad: 'Hava & Su',      emoji: '💨', fiyat: 48000,   guc: 4,  gelir: 14,  cekim: 0.20, sv: 2, svFiyat: 40000,  seviyeSart: 1,  konfor: 5,  aciklama: 'Lastik havası ve su. Küçük gelir, yüksek memnuniyet.' },
    atm:      { ad: 'ATM',            emoji: '🏧', fiyat: 75000,   guc: 3,  gelir: 20,  cekim: 0.12, sv: 1, svFiyat: 0,      seviyeSart: 2,  konfor: 4,  aciklama: 'Banka yerleştirir, sen kira ve komisyon alırsın.' },
    lastikci: { ad: 'Lastikçi',       emoji: '🛞', fiyat: 265000,  guc: 11, gelir: 280, cekim: 0.045,sv: 3, svFiyat: 200000, seviyeSart: 5,  konfor: 3,  aciklama: 'Lastik değişimi ve tamiri. Kışın ve uzun yolda talep patlar.' },
    adblue:   { ad: 'AdBlue Ünitesi', emoji: '🧪', fiyat: 130000,  guc: 3,  gelir: 110, cekim: 0.07, sv: 2, svFiyat: 95000,  seviyeSart: 4,  konfor: 2,  aciklama: 'Dizel ticari araç ve tırlar için şart; otoyolda çok iş yapar.' },
    kamera:   { ad: 'Güvenlik Kamerası', emoji: '📹', fiyat: 115000, guc: 4, gelir: 0,  cekim: 0,    sv: 2, svFiyat: 85000,  seviyeSart: 3,  konfor: 3,  aciklama: 'Ödemeden kaçan müşterileri engeller, denetim puanını yükseltir.' },
    yangin:   { ad: 'Yangın Sistemi', emoji: '🧯', fiyat: 98000,   guc: 2,  gelir: 0,   cekim: 0,    sv: 2, svFiyat: 72000,  seviyeSart: 2,  konfor: 2,  aciklama: 'Denetimde puan kazandırır, yangın riskini neredeyse sıfırlar.' },
    totem:    { ad: 'Fiyat Totemi',   emoji: '🪧', fiyat: 85000,   guc: 3,  gelir: 0,   cekim: 0.06, sv: 2, svFiyat: 60000,  seviyeSart: 2,  konfor: 0,  aciklama: 'Yoldan fiyatın görünür. Ucuzsan trafiği belirgin artırır.' },
    depo:     { ad: 'Yakıt Deposu',  emoji: '🛢️', fiyat: 180000,  guc: 2,  gelir: 0,   cekim: 0,    sv: 4, svFiyat: 150000, seviyeSart: 1,  aciklama: 'Her seviyesi tüm tanklara +4.000 L kapasite ekler.' },
    ofis:     { ad: 'Yönetim Ofisi', emoji: '🏢', fiyat: 260000,  guc: 5,  gelir: 0,   cekim: 0,    sv: 3, svFiyat: 200000, seviyeSart: 4,  aciklama: 'Personel verimini ve müdür performansını artırır.' },
    gunes:    { ad: 'Güneş Paneli',  emoji: '☀️', fiyat: 140000,  guc: 0,  gelir: 0,   cekim: 0,    sv: 4, svFiyat: 110000, seviyeSart: 2,  uretim: 18, aciklama: 'Gündüz bedava elektrik üretir; gece üretmez.' },
    jenerator:{ ad: 'Dizel Jeneratör',emoji:'🔋', fiyat: 160000,  guc: 0,  gelir: 0,   cekim: 0,    sv: 3, svFiyat: 120000, seviyeSart: 1,  uretim: 40, aciklama: 'Her saat dizel tankından yakıt yakar ama kesinti yaşatmaz.' },
    smr:      { ad: 'Modüler Reaktör',emoji:'⚛️', fiyat: 4200000, guc: 0,  gelir: 0,   cekim: 0,    sv: 2, svFiyat: 3000000,seviyeSart: 12, uretim: 420, aciklama: 'Küçük modüler reaktör: dev üretim, zorunlu bakım, yüksek prestij.' }
  },
  binaSira: ['depo','wc','havasu','market','totem','gunes','jenerator','yangin','mescit','atm','kafe','kamera','yikama','yag','adblue','ofis','lastikci','tirpark','restoran','smr'],

  /* ---------------- araçlar ---------------- */
  araclar: [
    { ad: 'Otomobil',    emoji: '🚗', depo: [38, 60],   yakit: { benzin: .52, dizel: .26, lpg: .18, ev: .04 }, bahsis: 1.0,  sabir: 70, agirlik: 1.0 },
    { ad: 'Hatchback',   emoji: '🚙', depo: [42, 68],   yakit: { benzin: .44, dizel: .30, lpg: .22, ev: .04 }, bahsis: 1.0,  sabir: 65, agirlik: 0.9 },
    { ad: 'Ticari Araç', emoji: '🚐', depo: [60, 90],   yakit: { benzin: .10, dizel: .82, lpg: .08, ev: 0 },   bahsis: 0.85, sabir: 55, agirlik: 0.6 },
    { ad: 'Tır',         emoji: '🚛', depo: [250, 620], yakit: { dizel: 1 },                                   bahsis: 1.25, sabir: 95, agirlik: 0.22 },
    { ad: 'Otobüs',      emoji: '🚌', depo: [180, 320], yakit: { dizel: 1 },                                   bahsis: 1.1,  sabir: 80, agirlik: 0.12 },
    { ad: 'Motosiklet',  emoji: '🏍️', depo: [8, 17],    yakit: { benzin: 1 },                                  bahsis: 0.7,  sabir: 45, agirlik: 0.5 },
    { ad: 'Lüks Araç',   emoji: '🚘', depo: [55, 85],   yakit: { benzin: .74, dizel: .14, ev: .12 },           bahsis: 2.1,  sabir: 40, agirlik: 0.3 },
    { ad: 'Elektrikli',  emoji: '🔋', depo: [35, 82],   yakit: { ev: 1 },                                      bahsis: 1.4,  sabir: 110,agirlik: 0.35 },
    { ad: 'Traktör',     emoji: '🚜', depo: [55, 130],  yakit: { dizel: 1 },                                   bahsis: 0.75, sabir: 120,agirlik: 0.18 },
    { ad: 'Taksi',       emoji: '🚕', depo: [45, 65],   yakit: { lpg: .62, benzin: .20, dizel: .18 },          bahsis: 0.9,  sabir: 50, agirlik: 0.55 }
  ],

  /* ---------------- lokasyonlar ---------------- */
  lokasyonlar: [
    { id:'kasaba',    ad:'Kasaba İstasyonu',   emoji:'🏘️', fiyat:0,        w:7, h:6, trafik:1.00, maxPompa:6,  seviyeSart:1,
      profil:{ Otomobil:1.1, Hatchback:1.1, 'Ticari Araç':.9, Tır:.25, Otobüs:.3, Motosiklet:1.2, 'Lüks Araç':.3, Elektrikli:.25, Traktör:1.4, Taksi:.7 },
      aciklama:'Doğduğun kasaba. Sakin trafik, düşük kira, öğrenmek için ideal.' },
    { id:'cevreyolu', ad:'Çevre Yolu',         emoji:'🛣️', fiyat:900000,   w:9, h:7, trafik:1.75, maxPompa:9,  seviyeSart:4,
      profil:{ Otomobil:1.2, Hatchback:1.1, 'Ticari Araç':1.3, Tır:.8, Otobüs:.8, Motosiklet:.9, 'Lüks Araç':.7, Elektrikli:.6, Traktör:.4, Taksi:1.2 },
      aciklama:'Şehir çıkışı. Dengeli trafik, ticari araç ve taksi yoğun.' },
    { id:'otoyol',    ad:'Otoyol Dinlenme',    emoji:'🚛', fiyat:2600000,  w:10, h:8, trafik:2.60, maxPompa:12, seviyeSart:7,
      profil:{ Otomobil:1.0, Hatchback:.8, 'Ticari Araç':1.2, Tır:3.2, Otobüs:2.4, Motosiklet:.5, 'Lüks Araç':.9, Elektrikli:.8, Traktör:.1, Taksi:.3 },
      aciklama:'Dizel cenneti. Tır ve otobüsler büyük depolarla gelir; restoran ve tır parkı şart.' },
    { id:'marina',    ad:'Marina',             emoji:'⛵', fiyat:4100000,  w:9, h:8, trafik:1.60, maxPompa:10, seviyeSart:9,
      profil:{ Otomobil:.9, Hatchback:.6, 'Ticari Araç':.5, Tır:.2, Otobüs:.3, Motosiklet:.8, 'Lüks Araç':3.4, Elektrikli:1.6, Traktör:.05, Taksi:.6 },
      aciklama:'Lüks araç ve yat sahipleri. Az müşteri ama yüksek bahşiş ve premium fiyat toleransı.' },
    { id:'metropol',  ad:'Metropol',           emoji:'🌆', fiyat:7800000,  w:12, h:10, trafik:3.60, maxPompa:14, seviyeSart:12,
      profil:{ Otomobil:1.4, Hatchback:1.3, 'Ticari Araç':1.1, Tır:.6, Otobüs:1.2, Motosiklet:1.5, 'Lüks Araç':1.5, Elektrikli:2.8, Traktör:.02, Taksi:2.6 },
      aciklama:'Zirve. Dev trafik, elektrikli araç patlaması, 14 pompaya kadar büyüme.' }
  ],

  /* ---------------- personel ---------------- */
  personel: {
    pompaci: { ad:'Pompacı', emoji:'🧑‍🔧', maas:[14000,26000], aciklama:'Atandığı pompada müşterileri kendi doldurur. Bahşiş alamaz, küçük hata payı vardır.' },
    temizlik:{ ad:'Temizlik Görevlisi', emoji:'🧹', maas:[12000,18000], aciklama:'İstasyon temizliğini korur; memnuniyet ve marka puanını yükseltir.' },
    teknisyen:{ ad:'Teknisyen', emoji:'🛠️', maas:[22000,34000], aciklama:'Pompa ve bina bakımlarını kendiliğinden yapar, arıza riskini düşürür.' },
    kasiyer: { ad:'Market Kasiyeri', emoji:'🧑‍💼', maas:[15000,27000], aciklama:'Market satışlarını yürütür. Kasiyersiz market yarı verimle çalışır.' },
    mudur:   { ad:'Şube Müdürü', emoji:'👔', maas:[38000,65000], aciklama:'Sen başka şubedeyken bu şubeyi çalıştırır. Becerisi kadar verim alır.' }
  },
  isimler: ['Hakan','Mert','Emre','Serkan','Oğuz','Burak','Kaan','Tolga','Can','Barış','Volkan','Uğur','Seda','Elif','Merve','Ayşe','Zeynep','Buse','Derya','Gamze','Fatih','Yusuf','Murat','Okan','Selim','Ece','Nazlı','Pelin','İrem','Berk'],
  soyadlar:['Yılmaz','Demir','Kaya','Şahin','Çelik','Yıldız','Yıldırım','Öztürk','Aydın','Arslan','Doğan','Kılıç','Aslan','Çetin','Kara','Koç','Kurt','Özkan','Şimşek','Polat'],

  /* ---------------- sezonlar ---------------- */
  sezonlar: {
    ilkbahar:{ ad:'İlkbahar', emoji:'🌱', trafik:1.00, aciklama:'Normal trafik.' },
    yaz:     { ad:'Yaz',      emoji:'☀️', trafik:1.28, aciklama:'Tatil trafiği; satışlar yükselir, klima elektriği artar.' },
    sonbahar:{ ad:'Sonbahar', emoji:'🍂', trafik:1.05, aciklama:'Hasat ve okul dönüşü.' },
    kis:     { ad:'Kış',      emoji:'❄️', trafik:0.82, aciklama:'Trafik azalır, arıza riski ve ısınma tüketimi artar.' }
  },
  sezonSira:['ilkbahar','yaz','sonbahar','kis'],

  /* ---------------- güç / şebeke ---------------- */
  sebekeFiyat: 3.60,   // ₺/kWh
  gunesVerim: { 6:.15, 7:.35, 8:.6, 9:.8, 10:.92, 11:1, 12:1, 13:1, 14:.95, 15:.85, 16:.7, 17:.5, 18:.3, 19:.12 },

  /* ---------------- rafineri ---------------- */
  rafineri: {
    fiyat: 9500000, seviyeSart: 14,
    tankerFiyat: 420000,
    tankerKapasite: 24000,
    indirim: [0, .12, .19, .25, .30],   // seviye başına tedarik indirimi
    svFiyat: [0, 2200000, 4800000, 9000000],
    aciklama:'Kendi rafinerin: tüm şubelere indirimli yakıt, tankerlerin anında teslimat yapar.'
  },

  /* ---------------- rastgele olaylar ---------------- */
  olaylar: [
    { id:'akin',   ad:'Müşteri Akını',   emoji:'🚦', olasilik:.16, sure:[25,70], aciklama:'Yolda kaza oldu, trafik istasyona döndü!' },
    { id:'zam',    ad:'Rafineri Zammı',  emoji:'📈', olasilik:.13, sure:[180,420],aciklama:'Toptan yakıt fiyatları yükseldi.' },
    { id:'indirim',ad:'Toptan İndirim',  emoji:'📉', olasilik:.11, sure:[180,360],aciklama:'Toptan fiyatlar geriledi, sipariş zamanı.' },
    { id:'savas',  ad:'Fiyat Savaşı',    emoji:'⚔️', olasilik:.12, sure:[240,600],aciklama:'Rakip istasyon fiyat kırdı.' },
    { id:'ariza',  ad:'Arıza',           emoji:'🔩', olasilik:.14, sure:[0,0],    aciklama:'Bir ekipman bozuldu.' },
    { id:'denetim',ad:'Denetim',         emoji:'📋', olasilik:.08, sure:[0,0],    aciklama:'Müfettişler istasyonu denetliyor.' },
    { id:'kesinti',ad:'Elektrik Kesintisi',emoji:'🔌',olasilik:.09,sure:[40,140], aciklama:'Şebeke gitti; kendi üretimin yoksa pompalar yavaşlar.' },
    { id:'turist', ad:'Tur Otobüsleri',  emoji:'🚌', olasilik:.10, sure:[30,90],  aciklama:'Tur kafilesi mola verdi; market ve kafe dolup taşıyor.' },
    { id:'hava',   ad:'Sağanak Yağış',   emoji:'🌧️', olasilik:.11, sure:[60,180], aciklama:'Yağmur trafiği düşürdü ama yıkamayı artırdı.' }
  ],




  /* ---------------- tedarikçiler ---------------- */
  tedarikciler: {
    toptanci: { ad: 'Toptancı Depo',    emoji: '🏚️', carpan: 0.92, sure: 1.9, aciklama: '%8 ucuz ama tanker geç gelir.' },
    standart: { ad: 'Standart Dağıtım', emoji: '🚚', carpan: 1.00, sure: 1.0, aciklama: 'Piyasa fiyatı, normal teslim.' },
    hizli:    { ad: 'Hızlı Lojistik',   emoji: '⚡', carpan: 1.07, sure: 0.45, aciklama: '%7 pahalı ama yarı sürede kapıda.' }
  },

  /* ---------------- kurumsal sözleşmeler ---------------- */
  sozlesmeMusteriler: [
    { ad: 'Kargo Filosu',      yakit: 'dizel',  emoji: '📦' },
    { ad: 'Taksi Durağı',      yakit: 'lpg',    emoji: '🚕' },
    { ad: 'Tarım Kooperatifi', yakit: 'dizel',  emoji: '🚜' },
    { ad: 'Belediye Otobüsü',  yakit: 'dizel',  emoji: '🚌' },
    { ad: 'Servis Şirketi',    yakit: 'benzin', emoji: '🚐' },
    { ad: 'Araç Kiralama',     yakit: 'benzin', emoji: '🔑' },
    { ad: 'İnşaat Şantiyesi',  yakit: 'dizel',  emoji: '🏗️' },
    { ad: 'Kurye Ağı',         yakit: 'benzin', emoji: '🛵' }
  ],

  /* ---------------- müşteri şikayetleri ---------------- */
  sikayetTipleri: {
    bekleme:   { ad: 'Uzun kuyruk',        emoji: '⏱️', metin: 'Sıra çok uzundu, beklemeden gittim.',           etki: 2.5, cozum: 'Pompa ekle ya da pompacı al', sekme: 'insa' },
    kirli:     { ad: 'Kirli istasyon',     emoji: '🧹', metin: 'İstasyon çok kirliydi, bir daha uğramam.',       etki: 2.0, cozum: 'Temizlik yap', sekme: 'personel' },
    stokYok:   { ad: 'Yakıt yok',          emoji: '🚫', metin: 'İstediğim yakıt tükenmişti.',                    etki: 3.0, cozum: 'Tank siparişi ver', sekme: 'siparis' },
    pahali:    { ad: 'Fiyat yüksek',       emoji: '💸', metin: 'Rakipten pahalıydı, yarım depo aldım.',          etki: 1.5, cozum: 'Fiyatı gözden geçir', sekme: 'fiyat' },
    ariza:     { ad: 'Arızalı pompa',      emoji: '🔧', metin: 'Pompa bozuktu, zaman kaybettim.',                etki: 2.8, cozum: 'Bakım/tamir yaptır', sekme: 'insa' },
    tasma:     { ad: 'Yakıt taştı',        emoji: '💧', metin: 'Deponun ağzından taştı, aracım kirlendi.',        etki: 3.5, cozum: 'Dolumda hedefe dikkat et', sekme: 'daha' },
    yanlis:    { ad: 'Yanlış yakıt',       emoji: '❌', metin: 'Aracıma yanlış yakıt verdiniz!',                  etki: 6.0, cozum: 'Tabancayı doğru seç', sekme: 'daha' },
    wcYok:     { ad: 'Tuvalet yok',        emoji: '🚻', metin: 'Tuvalet yoktu, mola veremedim.',                 etki: 1.2, cozum: 'WC kur', sekme: 'insa' },
    marketYok: { ad: 'Market boş',         emoji: '🛒', metin: 'Marketin rafları boştu.',                        etki: 1.4, cozum: 'Market stoğu al', sekme: 'market' },
    karanlik:  { ad: 'Aydınlatma yok',     emoji: '💡', metin: 'Gece istasyon karanlıktı, güvensiz hissettim.',  etki: 1.6, cozum: 'Elektrik kesintisini çöz', sekme: 'insa' }
  },
  ovguTipleri: [
    { emoji: '⭐', metin: 'Tam istediğim kadar doldurdunuz, teşekkürler!' },
    { emoji: '😊', metin: 'Hızlı ve temiz hizmet, yine geleceğim.' },
    { emoji: '👏', metin: 'Pompacı çok ilgiliydi.' },
    { emoji: '💚', metin: 'Market ve tuvalet tertemizdi.' },
    { emoji: '🏆', metin: 'Bölgenin en iyi istasyonu burası.' }
  ],

  /* ---------------- marka / tabela tasarımı ---------------- */
  tabelaRenkleri: [
    { id: 'turuncu', ad: 'Turuncu', pano: '#e2683a', yazi: '#ffffff' },
    { id: 'kirmizi', ad: 'Kırmızı', pano: '#c62f2f', yazi: '#ffffff' },
    { id: 'mavi',    ad: 'Mavi',    pano: '#1f5fa8', yazi: '#ffffff' },
    { id: 'yesil',   ad: 'Yeşil',   pano: '#1f7a4d', yazi: '#ffffff' },
    { id: 'lacivert',ad: 'Lacivert',pano: '#17243d', yazi: '#ffd166' },
    { id: 'sari',    ad: 'Sarı',    pano: '#e8b21f', yazi: '#17243d' },
    { id: 'mor',     ad: 'Mor',     pano: '#5b3fa8', yazi: '#ffffff' },
    { id: 'siyah',   ad: 'Antrasit',pano: '#262b33', yazi: '#f2f5f8' },
    { id: 'beyaz',   ad: 'Beyaz',   pano: '#f2f5f8', yazi: '#17243d' },
    { id: 'bordo',   ad: 'Bordo',   pano: '#7a2342', yazi: '#ffd9e4' }
  ],
  tabelaSekilleri: [
    { id: 'klasik', ad: 'Klasik dikey', aciklama: 'Yüksek direk, üstte marka, altta fiyatlar.' },
    { id: 'genis',  ad: 'Geniş pano',   aciklama: 'Yola bakan geniş pano; marka büyük görünür.' },
    { id: 'kule',   ad: 'Kule',         aciklama: 'İnce ve çok yüksek; uzaktan görünür.' },
    { id: 'tente',  ad: 'Kanopi bandı', aciklama: 'Alçak pano, marka rengi kanopiye de vurur.' }
  ],
  tabelaLogolari: ['⛽', '🛢️', '🔥', '⭐', '🦅', '🐎', '🌊', '⚡', '🍀', '🏔️', '🦁', '💎'],

  /* ---------------- pazarlama programları ---------------- */
  programlar: {
    sadakat: {
      ad: 'Sadakat Kartı', emoji: '💳', kurulum: 180000, aylik: 26000, seviyeSart: 3,
      aciklama: 'Kart sahibi müşteriler düzenli gelir. Trafiği artırır, küçük bir iskonto ister.'
    },
    premium: {
      ad: 'Katkılı Yakıt', emoji: '✨', kurulum: 320000, aylik: 42000, seviyeSart: 4,
      aciklama: 'Katkılı ürün satarsın: litre başı kâr artar, fiyata duyarlı müşterilerin bir kısmı kaçar.'
    },
    yikamaAbone: {
      ad: 'Yıkama Aboneliği', emoji: '🧼', kurulum: 140000, aylik: 18000, seviyeSart: 5,
      aciklama: 'Aylık abonelik geliri; yıkama tesisi varsa her gün sabit gelir getirir.'
    }
  },

  /* ---------------- toplu (filo) anlaşmaları ---------------- */
  filoAnlasmalar: [
    { id:'belediye',  ad:'Belediye Otobüs Filosu', emoji:'🚌', arac:'Otobüs',      yakit:'dizel',  aracSayi:[3,5], aracL:[110,190], iskonto:[0.05,0.09], gun:[8,16], seviyeSart:2,  saatler:[6,14,22], aciklama:'Sabah, öğle ve gece vardiyasında otobüsler depoya uğrar.' },
    { id:'okul',      ad:'Okul Servisleri',        emoji:'🚐', arac:'Minibüs',     yakit:'dizel',  aracSayi:[4,7], aracL:[40,70],   iskonto:[0.04,0.08], gun:[6,12], seviyeSart:1,  saatler:[6,16],    aciklama:'Servis minibüsleri sabah ve okul çıkışı toplu gelir.' },
    { id:'kargo',     ad:'Kargo Dağıtım Merkezi',  emoji:'📦', arac:'Ticari Araç', yakit:'dizel',  aracSayi:[5,9], aracL:[45,80],   iskonto:[0.05,0.10], gun:[7,14], seviyeSart:2,  saatler:[5,13],    aciklama:'Dağıtım araçları günde iki sefer yakıt alır.' },
    { id:'taksi',     ad:'Taksi Durağı',           emoji:'🚕', arac:'Taksi',       yakit:'lpg',    aracSayi:[4,8], aracL:[35,55],   iskonto:[0.04,0.07], gun:[8,15], seviyeSart:1,  saatler:[9,18,23], aciklama:'Durak tüm araçlarını senin LPG\'ne bağlar.' },
    { id:'santiye',   ad:'Şantiye İş Makineleri',  emoji:'🚜', arac:'Tır',         yakit:'dizel',  aracSayi:[2,4], aracL:[200,320], iskonto:[0.06,0.11], gun:[5,10], seviyeSart:4,  saatler:[7,17],    aciklama:'İş makineleri için yüksek hacimli dizel çekişi.' },
    { id:'nakliye',   ad:'Nakliye Kooperatifi',    emoji:'🚛', arac:'Tır',         yakit:'dizel',  aracSayi:[2,5], aracL:[180,300], iskonto:[0.07,0.12], gun:[6,12], seviyeSart:5,  saatler:[4,15,21], aciklama:'Uzun yol tırları gece gündüz uğrar; tır parkı varsa daha kârlı.' },
    { id:'kiralama',  ad:'Araç Kiralama Şirketi',  emoji:'🔑', arac:'Otomobil',    yakit:'benzin', aracSayi:[5,9], aracL:[35,55],   iskonto:[0.04,0.08], gun:[7,14], seviyeSart:3,  saatler:[10,19],   aciklama:'Kiralık araçlar teslimden önce dolu teslim edilir.' },
    { id:'sarj',      ad:'Elektrikli Filo',        emoji:'⚡', arac:'Elektrikli',  yakit:'ev',     aracSayi:[4,7], aracL:[30,55],   iskonto:[0.03,0.07], gun:[8,16], seviyeSart:6,  saatler:[11,20],   aciklama:'Şarj istasyonun varsa kurumsal elektrikli filo bağlanır.' }
  ],

  /* ---------------- günlük görevler ---------------- */
  gorevTipleri: [
    { id: 'musteri',  ad: 'Müşteriye hizmet et',    birim: 'müşteri', taban: 12,   odul: 9000 },
    { id: 'isabet',   ad: 'Tam isabetli dolum yap', birim: 'dolum',   taban: 4,    odul: 12000 },
    { id: 'litre',    ad: 'Yakıt sat',              birim: 'L',       taban: 900,  odul: 11000 },
    { id: 'market',   ad: 'Markette ürün sat',      birim: 'ürün',    taban: 10,   odul: 8000 },
    { id: 'ciro',     ad: 'Ciro yap',               birim: '₺',       taban: 35000,odul: 10000 },
    { id: 'bakim',    ad: 'Bakım veya tamir yap',   birim: 'işlem',   taban: 2,    odul: 7000 }
  ],

  /* ---------------- market ürünleri ---------------- */
  marketUrunler: [
    { id: 'su',      ad: 'Su',             emoji: '💧', alis: 6,   satis: 15,  raf: 1,   talep: 1.30 },
    { id: 'icecek',  ad: 'Gazlı İçecek',   emoji: '🥤', alis: 18,  satis: 40,  raf: 1,   talep: 1.10 },
    { id: 'cay',     ad: 'Çay & Kahve',    emoji: '☕', alis: 9,   satis: 30,  raf: 1,   talep: 1.00 },
    { id: 'cips',    ad: 'Cips',           emoji: '🍟', alis: 22,  satis: 50,  raf: 1,   talep: 0.85 },
    { id: 'cikolata',ad: 'Çikolata',       emoji: '🍫', alis: 14,  satis: 35,  raf: 1,   talep: 0.80 },
    { id: 'sandvic', ad: 'Sandviç & Tost', emoji: '🥪', alis: 45,  satis: 110, raf: 2,   talep: 0.55 },
    { id: 'sigara',  ad: 'Sigara',         emoji: '🚬', alis: 78,  satis: 90,  raf: 1,   talep: 1.45 },
    { id: 'camsuyu', ad: 'Cam Suyu',       emoji: '🧴', alis: 35,  satis: 85,  raf: 2,   talep: 0.35 },
    { id: 'antifriz',ad: 'Antifriz',       emoji: '🧊', alis: 90,  satis: 190, raf: 2,   talep: 0.18, sezon: 'kis' },
    { id: 'motoryag',ad: 'Motor Yağı',     emoji: '🛢️', alis: 420, satis: 780, raf: 3,   talep: 0.14 },
    { id: 'ampul',   ad: 'Ampul & Sigorta',emoji: '💡', alis: 40,  satis: 110, raf: 1,   talep: 0.12 },
    { id: 'kuruyemis',ad: 'Kuruyemiş',     emoji: '🥜', alis: 55,  satis: 120, raf: 1,   talep: 0.40 }
  ],
  marketRaf: [0, 120, 220, 360],     /* market seviyesine göre raf kapasitesi */

  /* ---------------- banka ---------------- */
  banka: {
    urunler: [
      { id: 'ihtiyac',  ad: 'İhtiyaç Kredisi',  taban: 250000,   taksit: 12, faiz: 0.034, notSart: 0,  seviyeSart: 1 },
      { id: 'yatirim',  ad: 'Yatırım Kredisi',  taban: 1500000,  taksit: 24, faiz: 0.029, notSart: 45, seviyeSart: 4 },
      { id: 'ticari',   ad: 'Ticari Kredi',     taban: 6000000,  taksit: 36, faiz: 0.026, notSart: 60, seviyeSart: 8 },
      { id: 'kurumsal', ad: 'Kurumsal Kredi',   taban: 25000000, taksit: 48, faiz: 0.023, notSart: 75, seviyeSart: 12 }
    ],
    gecikmeFaizi: 0.05,      /* ödenmeyen taksite aylık ek */
    borcOrani: 0.65          /* net değerin en fazla bu kadarı borçlanılabilir */
  },

  /* ---------------- sezon kampanyaları ---------------- */
  kampanyalar: {
    ilkbahar: { ad: 'Cam Suyu',     emoji: '💧', hedef: 12, odul: 45000 },
    yaz:      { ad: 'Soğuk İçecek', emoji: '🥤', hedef: 14, odul: 60000 },
    sonbahar: { ad: 'Kış Lastiği',  emoji: '🛞', hedef: 14, odul: 80000 },
    kis:      { ad: 'Antifriz',     emoji: '🧊', hedef: 12, odul: 55000 }
  },

  /* ---------------- başarımlar ---------------- */
  basarimlar: [
    { id: 'ilk10k',    ad: 'Esnaf oldun!',        aciklama: 'İlk 10.000 ₺ ciro',              odul: 5000,    kosul: function (s) { return s.ist.ciro >= 10000; } },
    { id: 'ilk100k',   ad: 'İşler açıldı',        aciklama: '100.000 ₺ ciro',                 odul: 20000,   kosul: function (s) { return s.ist.ciro >= 100000; } },
    { id: 'milyon',    ad: 'Milyoncu',            aciklama: '1.000.000 ₺ ciro',               odul: 120000,  kosul: function (s) { return s.ist.ciro >= 1000000; } },
    { id: 'onmilyon',  ad: 'Akaryakıt baronu',    aciklama: '10.000.000 ₺ ciro',              odul: 900000,  kosul: function (s) { return s.ist.ciro >= 10000000; } },
    { id: 'tam10',     ad: 'Hassas el',           aciklama: '10 tam isabetli dolum',          odul: 8000,    kosul: function (s) { return s.ist.tamIsabet >= 10; } },
    { id: 'tam100',    ad: 'Pompa ustası',        aciklama: '100 tam isabetli dolum',         odul: 70000,   kosul: function (s) { return s.ist.tamIsabet >= 100; } },
    { id: 'musteri500',ad: 'Kalabalık',           aciklama: '500 müşteriye hizmet',           odul: 35000,   kosul: function (s) { return s.ist.musteri >= 500; } },
    { id: 'dortpompa', ad: 'Sıra beklemesin',     aciklama: 'Tek şubede 4 pompa',             odul: 25000,   kosul: function (s) { return D.pompalar(D.sube()).length >= 4; } },
    { id: 'tumyakit',  ad: 'Dört koldan',         aciklama: 'Benzin, dizel, LPG ve şarj',     odul: 60000,   kosul: function (s) { var sb = D.sube(); var t = {}; D.pompalar(sb).forEach(function (p) { t[p.p.yakit] = 1; }); return t.benzin && t.dizel && t.lpg && t.ev; } },
    { id: 'gunes',     ad: 'Kendi enerjin',       aciklama: 'Üretimin tüketimini karşılasın', odul: 50000,   kosul: function (s) { var sb = D.sube(); return D.gucUretim(sb) >= D.gucTuketim(sb) && D.gucTuketim(sb) > 5; } },
    { id: 'ikincisube',ad: 'Zincir başlıyor',     aciklama: 'İkinci şubeyi aç',               odul: 100000,  kosul: function (s) { return s.subeler.length >= 2; } },
    { id: 'bessube',   ad: 'Beş kol',             aciklama: 'Beş lokasyonun da olsun',        odul: 1200000, kosul: function (s) { return s.subeler.length >= 5; } },
    { id: 'rafineri',  ad: 'Kaynaktan',           aciklama: 'Rafineri kur',                   odul: 400000,  kosul: function (s) { return s.rafineri.aktif; } },
    { id: 'devir',     ad: 'Franchise',           aciklama: 'Bir şubeyi devret',              odul: 250000,  kosul: function (s) { return s.devredilen.length >= 1; } },
    { id: 'bessyildiz',ad: 'Beş yıldız',          aciklama: 'Bir şubeyi 5 yıldıza çıkar',     odul: 150000,  kosul: function (s) { return D.yildiz() >= 5; } },
    { id: 'temiz',     ad: 'Pırıl pırıl',         aciklama: 'Temizlik ve bakım %90 üstü',     odul: 30000,   kosul: function (s) { var sb = D.sube(); return sb.temizlik >= 90 && D.bakimOrt(sb) >= 90; } }
  ],

  /* ---------------- seviye ---------------- */
  xpTablo: [0,1200,3200,6800,12500,21000,33000,50000,74000,106000,150000,208000,286000,392000,530000,720000,980000,1320000,1800000,2450000],

  ipuclari: [
    'Pompaya kendin bakarsan bahşiş alırsın; pompacı bahşiş alamaz.',
    'Hedefi tam tutturmak (±0,15 L) %10 bahşiş ve marka puanı kazandırır.',
    'Taşırdığın yakıt yere döküldü sayılır: parası senden gider.',
    'Fiyatını rakibin altına çekersen trafik artar ama marj düşer.',
    'Tank boşalınca müşteri gider; sipariş süresi dakikalar sürer.',
    'Güneş paneli gece üretmez, jeneratör dizel yakar.',
    'Yoğun saatler 07:00-09:00 ve 17:00-19:00 arasıdır.',
    'Tır parkı ve restoran, otoyol şubesinde dizel satışını uçurur.',
    'Bakımı düşen ekipman daha sık arızalanır ve yavaş çalışır.',
    'Beş yıldıza ulaşan şubeyi devredip kalıcı pasif gelir alabilirsin.'
  ]
};

/* yakıt/araç yardımcıları */
VERI.aracBul = function (ad) {
  for (var i = 0; i < VERI.araclar.length; i++) if (VERI.araclar[i].ad === ad) return VERI.araclar[i];
  return VERI.araclar[0];
};
