import type { PublicLocale } from "./public-routing";

export const curatedPublicSlugs = [
  "hakkimizda",
  "karavan-deneyimi",
  "muhendislik",
  "sistem",
  "nasil-calisir",
  "uretim-sureci",
  "sss",
  "iletisim",
  "proje-baslat",
] as const;

export type CuratedPublicSlug = (typeof curatedPublicSlugs)[number];
export type EditorialSection = { id: string; heading: string; body: string; bullets?: string[] };
export type EditorialAction = { label: string; slug: CuratedPublicSlug };
export type EditorialFaqGroup = { heading: string; items: Array<{ question: string; answer: string }> };

export type PublicEditorialCopy = {
  title: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  heading: string;
  body: string;
  sections: EditorialSection[];
  actions: EditorialAction[];
  note?: string;
  status?: string;
  faqGroups?: EditorialFaqGroup[];
};

const tr: Record<CuratedPublicSlug, PublicEditorialCopy> = {
  hakkimizda: {
    title: "Hakkımızda", seoTitle: "Hakkımızda | Skyvan", seoDescription: "Skyvan’ın yaşam odaklı karavan tasarımı, mühendislik sorumluluğu ve platform yönünü keşfedin.", eyebrow: "Hakkımızda",
    heading: "Yolda kuracağınız yaşamı, bütün ayrıntılarıyla düşünüyoruz.",
    body: "Skyvan, karavan yapımından gelen deneyimi yaşam odaklı tasarım ve mühendislik yaklaşımıyla bir araya getirir. Amacımız, size yakın gelen bir yaşam düzeninin araç içinde nasıl karşılık bulabileceğini açık ve anlaşılır hâle getirmek.",
    sections: [
      { id: "everyday-life", heading: "Tasarım, günlük hayatın içinden başlar.", body: "Sabah kahvenizi nerede hazırladığınız, akşam nerede dinlendiğiniz ve alanı kiminle paylaştığınız bir yerleşimi değiştirir. Bu yüzden başlangıç noktamız bir donanım listesi değil; yolculuğunuz, alışkanlıklarınız ve vazgeçmek istemediğiniz ihtiyaçlardır." },
      { id: "considered-space", heading: "Kalite, ayrıntıların birlikte çalışmasıdır.", body: "Rahat bir geçiş, erişilebilir bir dolap ve doğru yerde bir aydınlatma aynı bütünün parçalarıdır. Görünüş; kullanım kolaylığı, malzeme seçimi ve bakım erişimiyle birlikte ele alınır. Sadelik, bu ilişkiler çözüldüğünde anlam kazanır." },
      { id: "technical-responsibility", heading: "Güven, kararların açıklığından doğar.", body: "Bir fikrin güzel görünmesi, her araca uygulanabileceği anlamına gelmez. Araç bilgileri, yerleşim ve yaşam sistemleri birlikte incelenir. Açık kalan sorular görünür tutulur; proje kapsamı teknik değerlendirme ve insan onayıyla belirlenir." },
      { id: "connected-future", heading: "Aynı bağlamı koruyan bir deneyim hazırlıyoruz.", body: "Uzun vadeli hedefimiz, araçtan yerleşime ve bileşenlere uzanan seçimleri birbirinden koparmadan ele almak. Hazırlanan Workshop deneyimi, seçeneklerin birbirini nasıl etkilediğini anlamaya yardımcı olacak. Bugün tasarım yaklaşımımızı ve bu deneyimin yönünü keşfedebilirsiniz." },
    ],
    actions: [{ label: "Yaşam Alanlarını Keşfet", slug: "karavan-deneyimi" }, { label: "Mühendislik Yaklaşımı", slug: "muhendislik" }],
  },
  "karavan-deneyimi": {
    title: "Karavan Deneyimi", seoTitle: "Karavan Deneyimi | Skyvan", seoDescription: "Oturum, uyku, mutfak, kişisel alan, depolama ve günlük hareketin bir karavan yerleşiminde nasıl buluştuğunu keşfedin.", eyebrow: "Karavan deneyimi",
    heading: "Bir aracın içinde, hayatınıza yer açın.", body: "Yemek hazırlamak, birlikte oturmak, dinlenmek ve kendinize zaman ayırmak aynı sınırlı hacmi paylaşır. İyi bir yerleşim, bu anların birbirini engellemeden akmasını hedefler.",
    sections: [
      { id: "living", heading: "Birlikte geçirilen zamanın merkezi.", body: "Oturum alanını yalnızca kaç kişinin sığdığıyla düşünmeyin. Masaya yaklaşmak, yerinizden kalkmak ve mutfağa geçmek de günlük konforu belirler. U biçimli bir düzen ortak alanı öne çıkarırken, farklı çözümler dolaşıma ve kişisel alana başka öncelikler verir." },
      { id: "sleep", heading: "Dinlenme düzeni size uysun.", body: "Sabit yatak akşam hazırlığını azaltır; dönüşebilen oturum aynı alana gündüz ve gece farklı görevler verir. Alkoven çözümünde erişim ve baş mesafesi ayrıca önem kazanır. Doğru tercih, alışkanlıklarınızla aracın kullanılabilir hacmi birlikte ele alındığında ortaya çıkar." },
      { id: "kitchen", heading: "Küçük bir mutfakta düşünülmüş bir akış.", body: "Hazırlık yüzeyi, evye, pişirme alanı ve saklama birbirine yakın; kullanımları ise birbirini engellemeyecek şekilde düşünülmeli. Ek cihazlar için çalışma alanı, havalandırma, bağlantılar ve enerji ihtiyacı yerleşimin parçasıdır." },
      { id: "personal-space", heading: "Kişisel alan, karavan ölçeğinde.", body: "Birleşik ıslak hacim ve ayrı duş–tuvalet düzenleri farklı alan tercihleri sunar. Kapının açılışı, kurulanma alanı, temizlik, havalandırma, çevresindeki geçiş ve servis erişimi günlük kullanımın parçasıdır." },
      { id: "storage", heading: "Yanınızda taşıdığınız hayat için yer.", body: "Saklama, geriye kalan boşlukları doldurmak değildir. Sık kullanılan eşyalara erişim, büyük parçaların yerleşimi ve yükün araç içindeki dağılımı birlikte ele alınır. Her ek işlev alan, sabitleme, su, enerji ve servis ihtiyacıyla değerlendirilir." },
    ],
    actions: [{ label: "İhtiyaçlarını Nasıl Netleştirebilirsin?", slug: "nasil-calisir" }, { label: "Tasarımın Arkasındaki Kararlar", slug: "muhendislik" }],
  },
  muhendislik: {
    title: "Mühendislik", seoTitle: "Mühendislik Yaklaşımı | Skyvan", seoDescription: "Skyvan’ın araç bağlamı, fiziksel yerleşim, enerji, su, kontrol ve insan onayını birlikte ele alan mühendislik yaklaşımı.", eyebrow: "Mühendislik",
    heading: "Görünen şey, üretilebilir olmalı.", body: "Yaşam alanının arkasında birbirini etkileyen teknik kararlar vardır. Skyvan’ın mühendislik yaklaşımı, yerleşimi; araç, enerji, su, ağırlık ve bakım erişimiyle birlikte ele alır.",
    sections: [
      { id: "vehicle-context", heading: "İlk referans, aracın kendisi.", body: "Marka ve model bir başlangıçtır. Model yılı, gövde varyantı, kullanılabilir iç ölçüler, açıklıklar ve taşıma sınırları projenin çerçevesini belirler. L/H tanımı tek başına yerleşim uyumunu göstermez." },
      { id: "physical-fit", heading: "Sığması kadar, kullanılabilmesi de önemli.", body: "Bir ürünün dış ölçüsü, montaj alanının yalnızca bir bölümüdür. Kapakların açılması, bağlantılara ulaşılması, havalandırma ve bakım payı da yerleşimi etkiler. Görselde boş görünen alan otomatik olarak kullanılabilir montaj alanı değildir." },
      { id: "solar", heading: "Çatı yerleşimi ve elektriksel uyum, iki ayrı soru.", body: "Panel yerleşimi için gerçek panel ölçüleri, kullanılabilir tavan alanı ve diğer çatı elemanları gerekir. Şarj kontrolörü ise panel dizisi, akü sistemi ve üretici sınırlarıyla birlikte değerlendirilir. Panel sayısı tek başına iki sorunun da cevabı değildir." },
      { id: "electrical-service", heading: "Düzenli görünümün arkasında erişilebilir bir sistem.", body: "Elektrik alanı; bileşen yerleşimi, bağlantı güzergâhları, koruma ve servis erişimiyle birlikte düşünülür. Bu sayfadaki görseller cihaz seçimi, bağlantı talimatı veya doğrulanmış elektrik projesi değildir." },
      { id: "water-service", heading: "Su sistemi, bakım düşünülerek yerleşmeli.", body: "Depo, pompa, filtre ve dağıtım noktaları kullanım kadar temizlik ve bakım açısından da ele alınır. Kontrol edilecek bağlantılara yaşam alanını gereksiz yere sökmeden ulaşabilmek, servis erişimini baştan düşünmenin nedenlerinden biridir." },
      { id: "controls", heading: "Temel işlevler anlaşılır kalsın.", body: "Kontrol yaklaşımında amaç, yaşam alanındaki işlevleri açık biçimde izlemek ve yönetmektir. Erişim kolaylığı ve sistem davranışı birlikte ele alınır. Gösterilen arayüz çalışması tamamlanmış bir otomasyon ürünü değildir." },
    ],
    note: "Bilgi eksikse, uygunluk sonucu da net değildir. Teknik değerlendirme açık soruları görünür kılar; nihai teknik ve ticari karar insan onayıyla verilir.",
    actions: [{ label: "Workshop Yaklaşımını İncele", slug: "sistem" }, { label: "Üretime Hazırlık", slug: "uretim-sureci" }],
  },
  sistem: {
    title: "Skyvan ve Workshop", seoTitle: "Skyvan Workshop Yaklaşımı | Skyvan", seoDescription: "Araç, yaşam alanı ve teknik seçimlerin planlanan Workshop deneyiminde nasıl birlikte ele alınacağını keşfedin.", eyebrow: "Skyvan Workshop",
    heading: "Bir seçimin, bütün projeyi nasıl etkilediğini anlayın.", body: "Skyvan, araç, yaşam alanı ve teknik seçimleri aynı bağlamda ele alan bir deneyim geliştiriyor. Workshop, bu yaklaşımın müşteriye açılacak bölümü olarak hazırlanıyor.", status: "Yakında",
    sections: [
      { id: "vehicle", heading: "Seçimler doğru araçla başlar.", body: "Planlanan deneyimde araç marka ve modeli, gövde varyantı ve ilgili ölçüler başlangıç bağlamını oluşturacak. Böylece bir yerleşim veya bileşen, hangi araca göre düşünüldüğü belirsiz bir seçenek olarak kalmayacak." },
      { id: "related-choices", heading: "Seçenekler birlikte değerlendirilecek.", body: "Bir güneş panelinin çatıda kapladığı alan ile bağlanacağı enerji sistemi farklı değerlendirmeler gerektirir. Bir buzdolabı da mutfak yerleşimini, enerji ihtiyacını ve servis alanını etkileyebilir." },
      { id: "clear-guidance", heading: "Bir uyarının nedenini anlayın.", body: "Yapay zekâ desteği seçenekleri ve uyarıların nedenlerini açıklamaya yardımcı olacak. Teknik uyumluluk doğrulanmış bilgiler ve tanımlı kurallarla değerlendirilecek; bilgi eksikliği uygunluk olarak gösterilmeyecek." },
      { id: "human-review", heading: "Son kararda insan sorumluluğu korunacak.", body: "Bir öneri kendiliğinden teknik onay veya ticari teklif oluşturmayacak. Projeye özgü değerlendirme ve insan onayı kapsamın netleşmesinin parçası olacak. Proje başlatma ve seçim akışı bugün açık değildir." },
    ],
    actions: [{ label: "Teknik Yaklaşımı Keşfet", slug: "muhendislik" }, { label: "Proje Başlat", slug: "proje-baslat" }],
  },
  "nasil-calisir": {
    title: "Nasıl Çalışır", seoTitle: "Proje Yaklaşımı | Skyvan", seoDescription: "Günlük ihtiyaçlardan araç ve teknik sorulara, açık bir karavan proje tanımına uzanan yaklaşım.", eyebrow: "Proje yaklaşımı",
    heading: "Karavan fikrinizden, açık bir proje tanımına.", body: "İyi bir başlangıç, bütün seçimleri bir anda yapmak değildir. Önce yaşam ihtiyaçlarını anlamak, ardından araç ve teknik sorularla bu çerçeveyi netleştirmektir.",
    sections: [
      { id: "needs", heading: "01 — Nasıl bir yolculuk düşünüyorsunuz?", body: "Kısa kaçamaklar mı, daha uzun yolculuklar mı? Alanı paylaşacağınız kişiler, günlük alışkanlıklarınız ve yanınızda taşımak istedikleriniz başlangıç sorularını oluşturur." },
      { id: "layout", heading: "02 — Hangi yaşam düzeni size yakın?", body: "Oturum, uyku, mutfak ve kişisel alanları aralarındaki geçişle birlikte inceleyin. Sabit yatak ve dönüşen oturum gibi farklı çözümler günlük hazırlığı değiştirir." },
      { id: "vehicle-review", heading: "03 — Araç ve teknik ihtiyaçlar ne söylüyor?", body: "Seçilen düzen doğru araç bilgileriyle birlikte ele alınır. Kullanılabilir hacim, ağırlık, enerji, su ve servis ihtiyaçları açık sorulara dönüştürülür; eksik bilgide uygunluk varsayılmaz." },
      { id: "scope", heading: "04 — Kararlar ortak bir kapsamda buluşur.", body: "Yerleşim, bileşenler ve teknik koşullar birlikte değerlendirilerek proje çerçevesi oluşturulur. Nihai kapsam insan onayıyla netleşir; bir tercih değiştiğinde etkilediği kararlar yeniden ele alınır." },
    ],
    note: "Proje başlatma deneyimi hazırlanıyor. Şimdilik yaşam alanlarını ve mühendislik yaklaşımını inceleyerek sizin için önemli soruları belirleyebilirsiniz.",
    actions: [{ label: "Yaşam Alanlarını İncele", slug: "karavan-deneyimi" }, { label: "Proje Başlat", slug: "proje-baslat" }],
  },
  "uretim-sureci": {
    title: "Üretime Hazırlık", seoTitle: "Üretime Hazırlık | Skyvan", seoDescription: "Kapsam, teknik tanım, onay, değişiklikler, kontroller ve kullanım hazırlığının birlikte ele alındığı yaklaşım.", eyebrow: "Üretime hazırlık",
    heading: "İyi bir hazırlık, kararları uygulamadan önce netleştirir.", body: "Bir yerleşim fikrinin üretime hazırlanması, görünür tasarımın arkasındaki ayrıntıların da tanımlanmasını gerektirir. Yaklaşımımız; kapsam, teknik değerlendirme, onay ve kontrol başlıklarını birlikte düşünmektir.",
    sections: [
      { id: "defined-scope", heading: "Ortak bir proje tanımı.", body: "Hangi araç, hangi yerleşim ve hangi ihtiyaçlar için çalışıldığı açık olmalı. Düşünülen bileşenler kadar henüz kararlaştırılmamış konular da proje tanımının parçasıdır." },
      { id: "technical-definition", heading: "Görünmeyen ayrıntıların hazırlanması.", body: "Montaj alanları, bağlantı güzergâhları, erişim ve üretici gereklilikleri projeye özgü ele alınır. Bir cihazın yerini belirlemek ile uygulanabilir çözümünü tanımlamak aynı şey değildir." },
      { id: "approval-changes", heading: "Değişikliklerin etkisi birlikte değerlendirilir.", body: "Bir dolabın ölçüsü veya cihaz seçimi değiştiğinde çevresindeki kararlar da etkilenebilir. Yerleşim, teknik koşullar ve kapsam üzerindeki etkiler birlikte yeniden gözden geçirilmelidir." },
      { id: "checks", heading: "Kontrol başlıkları baştan tanımlanmalı.", body: "Hangi noktaların kontrol edileceği, gereken bilgiler ve karar sorumluluğu açık olmalıdır. Kontroller gerçek uygulamaya göre belirlenir; tasarım görselleri bu kontrollerin yapıldığını göstermez." },
      { id: "handover-preparation", heading: "Kullanımı ve bakımı da düşünün.", body: "Teknik bileşenlere erişim, kullanım bilgileri ve bakım noktaları üretime hazırlıkla birlikte ele alınmalıdır. Amaç, yaşam alanının zaman içinde nasıl kullanılacağını da düşünmektir." },
    ],
    note: "Bu sayfa üretime hazırlık yaklaşımını anlatır; aktif bir sipariş veya canlı üretim takibi göstermez.",
    actions: [{ label: "Teknik Kararları Keşfet", slug: "muhendislik" }, { label: "Sık Sorulan Sorular", slug: "sss" }],
  },
  sss: {
    title: "Sık Sorulan Sorular", seoTitle: "Sık Sorulan Sorular | Skyvan", seoDescription: "Tasarım çalışmaları, araç uyumu ve hazırlanmakta olan proje deneyimi hakkında açık yanıtlar.", eyebrow: "Sık sorulan sorular",
    heading: "Merak ettiklerinize açık yanıtlar.", body: "Tasarım çalışmaları, araç uyumu ve hazırlanmakta olan proje deneyimi hakkında başlangıç bilgileri.", sections: [],
    faqGroups: [
      { heading: "Skyvan ve tasarım", items: [
        { question: "Skyvan nasıl bir yaklaşım sunuyor?", answer: "Karavan yaşamını yerleşim, günlük ihtiyaçlar ve teknik kararlarla birlikte ele alıyoruz. Bu site tasarım yaklaşımını tanıtır; geliştirilmekte olan Workshop seçimlerin ilişkisini açıklamaya yardımcı olacak." },
        { question: "Görseller tamamlanmış araçları mı gösteriyor?", answer: "“Konsept tasarım” olarak işaretlenen görseller tasarım çalışmalarıdır. Belirli bir araca onaylanmış uyum, dahil donanım veya tamamlanmış üretim kanıtı değildir." },
        { question: "Farklı sayfalardaki bütün odalar aynı araca mı ait?", answer: "Yalnızca aynı model ve görsel grubu olarak tanımlanan çalışmalar birlikte değerlendirilmelidir. Farklı yerleşimler tek bir aracın parçaları gibi düşünülmemelidir." },
      ] },
      { heading: "Araç ve teknik seçimler", items: [
        { question: "Kendi aracım için uygun yerleşimi nasıl anlayacağım?", answer: "Marka, model, model yılı, gövde varyantı ve ilgili ölçüler birlikte gerekir. Görsel tek başına kesin uyum sonucu vermez." },
        { question: "L3, L4 veya H tanımı yeterli mi?", answer: "Bu tanımlar araç bağlamına yardımcı olabilir; tek başına yerleşim veya ürün uyumu göstermez. Kullanılabilir ölçüler ve teknik bilgiler ayrıca doğrulanmalıdır." },
        { question: "Dört güneş paneli aracıma sığar mı?", answer: "Panel adedi tek başına cevap vermez. Panel ölçüleri, kullanılabilir tavan alanı, diğer çatı elemanları ve montaj gereksinimleri gerekir. Fiziksel yerleşim ve elektriksel uyum ayrı değerlendirilir." },
        { question: "MPPT seçimi yalnızca panel gücüne göre mi yapılır?", answer: "Hayır. Panel dizisi, bağlantı düzeni, akü sistemi, çalışma koşulları ve üretici sınırları birlikte değerlendirilmelidir. Bu site cihaz seçimi veya bağlantı talimatı vermez." },
        { question: "Elektrikli masa veya çamaşır makinesi her projede olabilir mi?", answer: "Her ek işlev alan, ağırlık, sabitleme, enerji, su ve servis ihtiyacıyla değerlendirilir. Bir görselde bulunması her araca uygun veya dahil olduğu anlamına gelmez." },
      ] },
      { heading: "Başlangıç ve Workshop", items: [
        { question: "Workshop bugün kullanılabiliyor mu?", answer: "Henüz değil. Proje başlatma sayfası hazırlık bilgisi sunar; galeri seçimleri proje kaydı oluşturmaz." },
        { question: "Yanlış seçimler nasıl ele alınacak?", answer: "Planlanan deneyimde doğrulanmış bilgiye dayanan kurallar uyumsuz seçimleri durdurabilecek. Eksik bilgi açıkça belirtilecek; yapay zekâ uyarının nedenini açıklamaya yardımcı olacak." },
        { question: "Son teknik ve ticari kararı kim verir?", answer: "Projeye özgü değerlendirme ve insan onayı gerekir. Sistem önerisi veya yapay zekâ açıklaması kendiliğinden teknik onay, fiyat ya da teklif oluşturmaz." },
        { question: "Fiyat veya teslim tarihi görebilir miyim?", answer: "Bu tanıtım sitesinde proje fiyatı ve teslim tarihi sunulmuyor. “Yakında” ifadesi belirli bir açılış veya teslim tarihi taahhüdü değildir." },
      ] },
    ],
    actions: [{ label: "Proje Yaklaşımını İncele", slug: "nasil-calisir" }, { label: "İletişim", slug: "iletisim" }],
  },
  iletisim: {
    title: "İletişim", seoTitle: "İletişim | Skyvan", seoDescription: "Bir karavan projesi görüşmesi öncesinde araç fikrinizi ve yaşam önceliklerinizi hazırlamak için yararlı bilgiler.", eyebrow: "İletişim",
    heading: "Yolculuğunuzu anlatmak için iyi bir başlangıç.", body: "Araç fikriniz ve yaşam öncelikleriniz, bir karavan projesinin ilk çerçevesini oluşturur. Görüşme öncesinde her teknik ayrıntıyı çözmeniz gerekmez; sizin için önemli ihtiyaçları belirlemek yeterli bir başlangıçtır.",
    sections: [
      { id: "prepare", heading: "Paylaşmaya hazırlanabileceğiniz bilgiler.", body: "Görüşme için kesinleşmiş bir teknik dosya gerekmez.", bullets: ["Aklınızdaki araç veya mevcut aracın marka, model ve varyant bilgileri.", "Nasıl yolculuk etmek ve alanı kimlerle paylaşmak istediğiniz.", "Oturum, uyku, mutfak, kişisel alan ve depolamadaki öncelikleriniz.", "Açıklığa kavuşturmak istediğiniz teknik sorular."] },
      { id: "pending-channel", heading: "İletişim kanalı hazırlanıyor.", body: "Yeni proje görüşmeleri için iletişim kanalımızı hazırlıyoruz. Bu sırada araç fikrinizi, yolculuk biçiminizi ve yaşam önceliklerinizi netleştirebilirsiniz." },
      { id: "current-status", heading: "Proje başlatma deneyimi yakında.", body: "Hazırlanan deneyim ihtiyaçlarınızı araç ve yerleşim bağlamıyla birlikte ele almayı hedefliyor. Bugün tasarım çalışmalarını keşfedebilir ve başlangıç sorularınızı netleştirebilirsiniz." },
    ],
    actions: [{ label: "Başlangıç Sorularını Keşfet", slug: "nasil-calisir" }, { label: "Yaşam Alanlarını İncele", slug: "karavan-deneyimi" }],
  },
  "proje-baslat": {
    title: "Proje Başlat", seoTitle: "Proje Başlat | Skyvan", seoDescription: "Yaklaşan proje başlatma deneyimi öncesinde araç, yaşam ve teknik sorularınızı hazırlayın.", eyebrow: "Proje Başlat", status: "Yakında",
    heading: "Kendi yolculuğunuza yer açın.", body: "Araç fikrinizi, yaşam önceliklerinizi ve yerleşim tercihlerinizi birlikte ele alabileceğiniz başlangıç deneyimini hazırlıyoruz. Bu sırada size yakın gelen yaşam düzenini keşfedebilirsiniz.",
    sections: [
      { id: "vehicle-question", heading: "Hangi araçla yol almak istiyorsunuz?", body: "Mevcut aracınızın bilgilerini veya düşündüğünüz seçenekleri not edin. Bir varyant ya da ölçüden emin değilseniz, bunu açık bir soru olarak bırakabilirsiniz." },
      { id: "life-question", heading: "Günün hangi anlarına daha çok yer ayırırsınız?", body: "Birlikte yemek, dinlenme, çalışma veya kişisel alan: sizin için en önemli kullanımları belirleyin. Öncelikler, yerleşim seçeneklerini anlamayı kolaylaştırır." },
      { id: "technical-question", heading: "Hangi soruların netleşmesini istersiniz?", body: "Bir ürünün sığıp sığmadığı, enerji ihtiyacı veya yatak dönüşümü gibi konuları not edin. Bunları şimdi çözmeniz gerekmiyor; amaç ihtiyaçlarınızı daha açık ifade edebilmek." },
    ],
    note: "Proje başlatma deneyimi hazırlanıyor.",
    actions: [{ label: "Yaşam Alanlarını Keşfet", slug: "karavan-deneyimi" }, { label: "Workshop’u Tanı", slug: "sistem" }],
  },
};

const en: Record<CuratedPublicSlug, PublicEditorialCopy> = {
  hakkimizda: {
    title: "About Skyvan", seoTitle: "About Skyvan | Skyvan", seoDescription: "Discover Skyvan’s approach to life-led motorhome design, engineering responsibility and a connected platform.", eyebrow: "About Skyvan",
    heading: "A considered approach to life on the road.", body: "Skyvan brings hands-on motorhome building experience together with thoughtful design and engineering. Our aim is to make it easier to understand how the way you want to live can take shape within a vehicle.",
    sections: [
      { id: "everyday-life", heading: "Design begins with everyday life.", body: "Where you make your morning coffee, how you unwind and who shares the space all shape a layout. We begin with your journey, your routines and the things that matter to you before considering an equipment list." },
      { id: "considered-space", heading: "Quality lives in the details working together.", body: "A clear passage, an accessible cupboard and well-placed lighting belong to the same design. Appearance is considered alongside ease of use, materials and maintenance access." },
      { id: "technical-responsibility", heading: "Confidence grows from clear decisions.", body: "An appealing idea will not necessarily suit every vehicle. Vehicle information, layout and living systems need to be considered together. Open questions deserve clarity; scope requires technical review and human approval." },
      { id: "connected-future", heading: "We are building a more connected experience.", body: "Our longer-term goal is to keep vehicle, layout and component choices connected. Workshop is intended to help explain how those choices affect one another. Today, this website introduces our design approach and that direction." },
    ], actions: [{ label: "Explore the Living Spaces", slug: "karavan-deneyimi" }, { label: "Engineering Approach", slug: "muhendislik" }],
  },
  "karavan-deneyimi": {
    title: "Motorhome Living", seoTitle: "Motorhome Living | Skyvan", seoDescription: "Explore how lounging, sleeping, cooking, personal space, storage and movement come together in a motorhome.", eyebrow: "Motorhome living",
    heading: "Make room for your way of living.", body: "Cooking, gathering, resting and finding a little privacy all share a compact space. A considered layout helps those moments fit together throughout the day.",
    sections: [
      { id: "living", heading: "A place to spend time together.", body: "A lounge is about more than how many people fit around a table. Sitting down, getting up and reaching the galley affect everyday comfort. A U-shaped arrangement emphasises shared space; other layouts prioritise circulation and privacy differently." },
      { id: "sleep", heading: "Choose a rhythm for rest.", body: "A fixed bed reduces evening rearrangement, while a convertible lounge gives one area different roles by day and night. An overcab bed brings access and headroom considerations. The right approach depends on your routines and usable vehicle space." },
      { id: "kitchen", heading: "A compact galley with a considered flow.", body: "Preparation space, sink, cooking and storage need to work without obstructing one another. Additional appliances require working space, ventilation, connections and energy as part of the layout discussion." },
      { id: "personal-space", heading: "Personal space at motorhome scale.", body: "Combined wet rooms and separate shower and toilet compartments make different demands on a layout. Door movement, drying space, cleaning, ventilation, circulation and service access all matter." },
      { id: "storage", heading: "Space for the life you bring with you.", body: "Storage is more than filling leftover gaps. Access, larger belongings and load distribution need to be considered together. Every additional function brings space, restraint, water, energy and servicing requirements." },
    ], actions: [{ label: "Start with Your Needs", slug: "nasil-calisir" }, { label: "The Decisions Behind the Design", slug: "muhendislik" }],
  },
  muhendislik: {
    title: "Engineering", seoTitle: "Engineering Approach | Skyvan", seoDescription: "How Skyvan considers vehicle context, physical fit, energy, water, controls and human approval.", eyebrow: "Engineering",
    heading: "What you see must be buildable.", body: "Behind a living space is a set of connected technical decisions. Skyvan’s engineering approach considers layout alongside the vehicle, energy, water, weight and maintenance access.",
    sections: [
      { id: "vehicle-context", heading: "Begin with the vehicle itself.", body: "Make and model are a starting point. Model year, body variant, usable dimensions, openings and load limits establish the project boundaries. An L/H designation alone does not establish layout compatibility." },
      { id: "physical-fit", heading: "Space to fit, and space to function.", body: "Outer dimensions are only part of installation needs. Opening covers, connections, ventilation and servicing affect the layout. Empty-looking space in a rendering is not automatically suitable installation space." },
      { id: "solar", heading: "Roof layout and electrical compatibility are separate questions.", body: "Panel placement needs actual dimensions, usable roof area and other fixtures. A charge controller must be considered with the array, battery system and manufacturer limits. Panel count alone answers neither question." },
      { id: "electrical-service", heading: "An accessible system behind an orderly appearance.", body: "Electrical space involves component positions, connection routes, protection and service access. Images on this page are not equipment selection, wiring instructions or a verified electrical design." },
      { id: "water-service", heading: "Plan water systems around maintenance as well as use.", body: "Tank, pump, filter and distribution points need consideration for cleaning and maintenance. Avoiding unnecessary dismantling to inspect a connection is one reason to plan service access early." },
      { id: "controls", heading: "Keep essential functions understandable.", body: "Controls should make living-space functions clear to monitor and operate. Access and system behaviour belong in the same discussion. The interface study shown is not a finished automation product." },
    ], note: "Missing information means compatibility is unresolved. Technical review makes open questions visible; final technical and commercial decisions require human approval.", actions: [{ label: "Explore the Workshop Approach", slug: "sistem" }, { label: "Preparing for Production", slug: "uretim-sureci" }],
  },
  sistem: {
    title: "Skyvan and Workshop", seoTitle: "The Skyvan Workshop Approach | Skyvan", seoDescription: "How vehicle, living-space and technical choices will remain connected in the planned Workshop experience.", eyebrow: "Skyvan Workshop", status: "Coming soon",
    heading: "Understand how one choice affects the whole project.", body: "Skyvan is developing an experience that keeps vehicle, living-space and technical choices connected. Workshop is being prepared as the customer-facing part of that approach.",
    sections: [
      { id: "vehicle", heading: "Begin with the right vehicle context.", body: "The vehicle make, model, body variant and relevant dimensions will establish the starting context, so layouts and components can be considered for a specific vehicle rather than as isolated options." },
      { id: "related-choices", heading: "Consider choices together.", body: "A solar panel’s roof footprint and its place in an energy system require separate assessments. A refrigerator can affect galley layout, energy demand and service space." },
      { id: "clear-guidance", heading: "Understand the reason behind a warning.", body: "AI assistance is intended to explain options and warnings. Technical compatibility will depend on verified information and defined rules; missing information will remain distinct from a compatibility result." },
      { id: "human-review", heading: "Human responsibility remains part of the decision.", body: "A suggestion will not automatically become technical approval or a commercial offer. Project-specific review and human approval remain part of defining scope. Project creation and selection are not available today." },
    ], actions: [{ label: "Explore the Technical Approach", slug: "muhendislik" }, { label: "Start a Project", slug: "proje-baslat" }],
  },
  "nasil-calisir": {
    title: "How It Works", seoTitle: "Project Approach | Skyvan", seoDescription: "From everyday needs through vehicle and technical questions to a clearly defined motorhome project.", eyebrow: "Project approach",
    heading: "From a motorhome idea to a clearly defined project.", body: "A good beginning does not require every choice at once. It starts with understanding how you want to live, then refining that picture through the vehicle and its technical requirements.",
    sections: [
      { id: "needs", heading: "01 — What kind of journey do you have in mind?", body: "Short breaks or longer journeys? The people sharing the space, your routines and the belongings you bring are useful starting points." },
      { id: "layout", heading: "02 — Which living arrangement feels right?", body: "Consider lounging, sleeping, cooking and personal space alongside the passages between them. Fixed beds and convertible lounges create different daily routines." },
      { id: "vehicle-review", heading: "03 — What do the vehicle and technical needs require?", body: "The preferred arrangement is considered with relevant vehicle information. Space, weight, energy, water and servicing become specific questions; missing information does not become assumed compatibility." },
      { id: "scope", heading: "04 — Bring the decisions into a shared scope.", body: "Layout, components and technical conditions define the project together. Final scope requires human approval. When a preference changes, affected decisions need review." },
    ], note: "Project start is in preparation. For now, explore the living spaces and engineering approach to identify the questions that matter to you.", actions: [{ label: "Explore the Living Spaces", slug: "karavan-deneyimi" }, { label: "Start a Project", slug: "proje-baslat" }],
  },
  "uretim-sureci": {
    title: "Preparing for Production", seoTitle: "Preparing for Production | Skyvan", seoDescription: "An approach connecting scope, technical definition, approval, changes, checks and preparation for use.", eyebrow: "Preparing for production",
    heading: "Resolve the decisions before they reach the build.", body: "Preparing a layout for production means defining the details behind the visible design. Our approach brings scope, technical review, approval and checks into the same conversation.",
    sections: [
      { id: "defined-scope", heading: "A shared definition of the project.", body: "The vehicle, layout and intended needs should be clear. Components being considered and questions still open both belong in the project definition." },
      { id: "technical-definition", heading: "Define the details behind the surfaces.", body: "Installation space, connection routes, access and manufacturer requirements need project-specific consideration. Choosing a location differs from defining an installable solution." },
      { id: "approval-changes", heading: "Consider the wider effect of a change.", body: "A change to a cabinet or appliance can affect surrounding decisions. Its implications for layout, technical conditions and scope need review together." },
      { id: "checks", heading: "Establish what needs to be checked.", body: "Required checks, information and decision responsibility should be clear. Their scope depends on the actual project; design illustrations do not demonstrate completion." },
      { id: "handover-preparation", heading: "Consider use and maintenance from the beginning.", body: "Access to components, operating information and maintenance needs belong in production preparation. The space should be considered over time, not only on its first day." },
    ], note: "This page explains the production-preparation approach; it does not display an active order or live production tracking.", actions: [{ label: "Explore the Technical Decisions", slug: "muhendislik" }, { label: "Frequently Asked Questions", slug: "sss" }],
  },
  sss: {
    title: "Frequently Asked Questions", seoTitle: "Frequently Asked Questions | Skyvan", seoDescription: "Clear answers about design studies, vehicle compatibility and the project experience in development.", eyebrow: "Frequently asked questions", heading: "Clear answers to the questions that matter.", body: "A starting point for understanding the design studies, vehicle compatibility and the project experience in development.", sections: [],
    faqGroups: [
      { heading: "Skyvan and design", items: [
        { question: "What is Skyvan’s approach?", answer: "We consider motorhome living through layout, everyday needs and technical decisions together. This site introduces that approach; Workshop is intended to explain relationships between choices." },
        { question: "Do the images show completed vehicles?", answer: "Images labelled “Design concept” show design studies. They do not establish fit to a vehicle, included equipment or completed production." },
        { question: "Do all the rooms shown belong to one vehicle?", answer: "Only studies identified as the same model and visual group should be considered together. Different layouts should not be treated as parts of one vehicle." },
      ] },
      { heading: "Vehicle and technical choices", items: [
        { question: "How can I understand which layout suits my vehicle?", answer: "Make, model, model year, body variant and relevant dimensions need consideration together. An image alone cannot establish compatibility." },
        { question: "Is an L3, L4 or H designation enough?", answer: "It can help identify context but does not establish layout or product compatibility. Usable dimensions and technical information still need verification." },
        { question: "Will four solar panels fit my vehicle?", answer: "Panel count alone cannot answer that. Dimensions, usable roof area, fixtures and mounting needs are required. Physical fit and electrical compatibility are separate checks." },
        { question: "Is an MPPT controller selected from panel wattage alone?", answer: "No. The array, connections, battery system, operating conditions and manufacturer limits need consideration together. This site does not provide equipment selection or wiring instructions." },
        { question: "Can every project include an electric table or washing machine?", answer: "Each function needs review for space, weight, secure installation, energy, water and servicing. An illustration does not mean it suits every vehicle or is included." },
      ] },
      { heading: "Getting started and Workshop", items: [
        { question: "Is Workshop available today?", answer: "Not yet. The Project Start page offers preparation guidance; gallery choices do not create a project record." },
        { question: "How will incompatible choices be handled?", answer: "Defined rules based on verified information are intended to stop incompatible choices. Missing information will be explicit; AI will help explain warnings." },
        { question: "Who makes the final technical and commercial decisions?", answer: "Project-specific review and human approval are required. A system suggestion or AI explanation does not automatically become approval, a price or an offer." },
        { question: "Can I see a price or delivery date?", answer: "This launch site does not provide project prices or delivery dates. “Coming soon” does not commit to a particular launch or delivery date." },
      ] },
    ], actions: [{ label: "Explore the Project Approach", slug: "nasil-calisir" }, { label: "Contact", slug: "iletisim" }],
  },
  iletisim: {
    title: "Contact", seoTitle: "Contact | Skyvan", seoDescription: "Useful preparation guidance before discussing a vehicle idea and living priorities.", eyebrow: "Contact",
    heading: "A good place to begin the conversation.", body: "Your vehicle idea and living priorities provide the first outline of a motorhome project. You do not need to resolve every technical detail beforehand; identifying the needs that matter to you is a useful beginning.",
    sections: [
      { id: "prepare", heading: "Useful information to have in mind.", body: "A complete technical file is not required before a conversation.", bullets: ["The vehicle you are considering, or the make, model and variant of your existing vehicle.", "How you want to travel and who will share the space.", "Your priorities for lounging, sleeping, cooking, personal space and storage.", "The technical questions you would like to understand better."] },
      { id: "pending-channel", heading: "The contact channel is being prepared.", body: "We are preparing the contact channel for new project conversations. In the meantime, you can clarify your vehicle idea, travel plans, and living priorities." },
      { id: "current-status", heading: "The project-start experience is coming soon.", body: "The experience in development aims to bring your needs together with vehicle and layout context. Today, you can explore the design studies and identify your starting questions." },
    ], actions: [{ label: "Explore the Starting Questions", slug: "nasil-calisir" }, { label: "Explore the Living Spaces", slug: "karavan-deneyimi" }],
  },
  "proje-baslat": {
    title: "Start a Project", seoTitle: "Start a Project | Skyvan", seoDescription: "Prepare your vehicle, living and technical questions for the upcoming project-start experience.", eyebrow: "Start a Project", status: "Coming soon",
    heading: "Make room for your own journey.", body: "We are preparing a starting experience that brings your vehicle idea, living priorities and layout preferences together. For now, explore the arrangements that feel closest to the way you want to travel.",
    sections: [
      { id: "vehicle-question", heading: "Which vehicle do you have in mind?", body: "Note the information you have about your vehicle or the options you are considering. An uncertain variant or dimension can remain an open question." },
      { id: "life-question", heading: "Which parts of the day deserve more space?", body: "Shared meals, rest, work or privacy: identify the uses that matter most. Clear priorities make it easier to understand different layouts." },
      { id: "technical-question", heading: "Which questions would you like to resolve?", body: "Note equipment fit, energy needs or a convertible bed. You do not need to settle them now; the aim is to make your needs clearer." },
    ], note: "The project-start experience is being prepared.", actions: [{ label: "Explore the Living Spaces", slug: "karavan-deneyimi" }, { label: "Meet Workshop", slug: "sistem" }],
  },
};

export const publicEditorialContent: Record<PublicLocale, Record<CuratedPublicSlug, PublicEditorialCopy>> = { tr, en };

export function isCuratedPublicSlug(slug: string): slug is CuratedPublicSlug {
  return (curatedPublicSlugs as readonly string[]).includes(slug);
}
