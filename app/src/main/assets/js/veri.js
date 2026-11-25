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
    depo:     { ad: 'Yakıt Deposu',  emoji: '🛢️', fiyat: 180000,  guc: 2,  gelir: 0,   cekim: 0,    sv: 4, svFiyat: 150000, seviyeSart: 1,  aciklama: 'Her seviyesi tüm tanklara +4.000 L kapasite ekler.' },
    ofis:     { ad: 'Yönetim Ofisi', emoji: '🏢', fiyat: 260000,  guc: 5,  gelir: 0,   cekim: 0,    sv: 3, svFiyat: 200000, seviyeSart: 4,  aciklama: 'Personel verimini ve müdür performansını artırır.' },
    gunes:    { ad: 'Güneş Paneli',  emoji: '☀️', fiyat: 140000,  guc: 0,  gelir: 0,   cekim: 0,    sv: 4, svFiyat: 110000, seviyeSart: 2,  uretim: 18, aciklama: 'Gündüz bedava elektrik üretir; gece üretmez.' },
    jenerator:{ ad: 'Dizel Jeneratör',emoji:'🔋', fiyat: 160000,  guc: 0,  gelir: 0,   cekim: 0,    sv: 3, svFiyat: 120000, seviyeSart: 1,  uretim: 40, aciklama: 'Her saat dizel tankından yakıt yakar ama kesinti yaşatmaz.' },
    smr:      { ad: 'Modüler Reaktör',emoji:'⚛️', fiyat: 4200000, guc: 0,  gelir: 0,   cekim: 0,    sv: 2, svFiyat: 3000000,seviyeSart: 12, uretim: 420, aciklama: 'Küçük modüler reaktör: dev üretim, zorunlu bakım, yüksek prestij.' }
  },
  binaSira: ['depo','market','gunes','jenerator','kafe','yikama','yag','ofis','tirpark','restoran','smr'],

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
    { id:'kasaba',    ad:'Kasaba İstasyonu',   emoji:'🏘️', fiyat:0,        w:4, h:4, trafik:1.00, maxPompa:4,  seviyeSart:1,
      profil:{ Otomobil:1.1, Hatchback:1.1, 'Ticari Araç':.9, Tır:.25, Otobüs:.3, Motosiklet:1.2, 'Lüks Araç':.3, Elektrikli:.25, Traktör:1.4, Taksi:.7 },
      aciklama:'Doğduğun kasaba. Sakin trafik, düşük kira, öğrenmek için ideal.' },
    { id:'cevreyolu', ad:'Çevre Yolu',         emoji:'🛣️', fiyat:900000,   w:5, h:5, trafik:1.75, maxPompa:7,  seviyeSart:4,
      profil:{ Otomobil:1.2, Hatchback:1.1, 'Ticari Araç':1.3, Tır:.8, Otobüs:.8, Motosiklet:.9, 'Lüks Araç':.7, Elektrikli:.6, Traktör:.4, Taksi:1.2 },
      aciklama:'Şehir çıkışı. Dengeli trafik, ticari araç ve taksi yoğun.' },
    { id:'otoyol',    ad:'Otoyol Dinlenme',    emoji:'🚛', fiyat:2600000,  w:6, h:6, trafik:2.60, maxPompa:10, seviyeSart:7,
      profil:{ Otomobil:1.0, Hatchback:.8, 'Ticari Araç':1.2, Tır:3.2, Otobüs:2.4, Motosiklet:.5, 'Lüks Araç':.9, Elektrikli:.8, Traktör:.1, Taksi:.3 },
      aciklama:'Dizel cenneti. Tır ve otobüsler büyük depolarla gelir; restoran ve tır parkı şart.' },
    { id:'marina',    ad:'Marina',             emoji:'⛵', fiyat:4100000,  w:5, h:6, trafik:1.60, maxPompa:8,  seviyeSart:9,
      profil:{ Otomobil:.9, Hatchback:.6, 'Ticari Araç':.5, Tır:.2, Otobüs:.3, Motosiklet:.8, 'Lüks Araç':3.4, Elektrikli:1.6, Traktör:.05, Taksi:.6 },
      aciklama:'Lüks araç ve yat sahipleri. Az müşteri ama yüksek bahşiş ve premium fiyat toleransı.' },
    { id:'metropol',  ad:'Metropol',           emoji:'🌆', fiyat:7800000,  w:7, h:7, trafik:3.60, maxPompa:14, seviyeSart:12,
      profil:{ Otomobil:1.4, Hatchback:1.3, 'Ticari Araç':1.1, Tır:.6, Otobüs:1.2, Motosiklet:1.5, 'Lüks Araç':1.5, Elektrikli:2.8, Traktör:.02, Taksi:2.6 },
      aciklama:'Zirve. Dev trafik, elektrikli araç patlaması, 14 pompaya kadar büyüme.' }
  ],

  /* ---------------- personel ---------------- */
  personel: {
    pompaci: { ad:'Pompacı', emoji:'🧑‍🔧', maas:[14000,26000], aciklama:'Atandığı pompada müşterileri kendi doldurur. Bahşiş alamaz, küçük hata payı vardır.' },
    temizlik:{ ad:'Temizlik Görevlisi', emoji:'🧹', maas:[12000,18000], aciklama:'İstasyon temizliğini korur; memnuniyet ve marka puanını yükseltir.' },
    teknisyen:{ ad:'Teknisyen', emoji:'🛠️', maas:[22000,34000], aciklama:'Pompa ve bina bakımlarını kendiliğinden yapar, arıza riskini düşürür.' },
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
