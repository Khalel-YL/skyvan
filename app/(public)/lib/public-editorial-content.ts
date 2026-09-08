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
    title: "Hakkımızda", seoTitle: "Hakkımızda | Skyvan", seoDescription: "Skyvan’ın gerçek bir motokaravan yapımından gelen deneyimini, malzeme ve mühendislik yaklaşımını keşfedin.", eyebrow: "Hakkımızda",
    heading: "Gerçek bir motokaravanı inşa ederken öğrendiklerimizle yola çıktık.",
    body: "Skyvan, eksiksiz bir motokaravanı kendi ellerimizle inşa ederken edinilen deneyimden doğdu. Bu deneyimi yaşam odaklı tasarım, dikkatli malzeme kararları ve açık teknik değerlendirmeyle geleceğin projelerine taşıyoruz.",
    sections: [
      { id: "why-skyvan-exists", heading: "Skyvan, kararları daha anlaşılır kılmak için var.", body: "Bir karavan projesi donanım listesinden önce yaşam biçimiyle başlar. Yolculuk alışkanlıklarını, alanı paylaşan kişileri ve günlük öncelikleri görünür kılmak; doğru teknik sorulara ulaşmanın ilk adımıdır." },
      { id: "hands-on-build-experience", heading: "Yapım deneyimi, çizimin ötesini gösterir.", body: "Gerçek bir motokaravanı inşa etmek; çizimde doğru görünen bir kararın üretimde, kullanımda ve bakımda nasıl karşılık bulduğunu öğretti. Skyvan’ın yaklaşımı bu doğrudan deneyimin üzerine kuruludur." },
      { id: "lightweight-material-decisions", heading: "Malzeme seçimi, aracın bütünüyle ilgilidir.", body: "Skyvan’da kullanılan 15 mm Marin Panel, proje sahibi tarafından sağlanan ürün bilgisine göre 140 × 210 cm levha ölçüsünde yaklaşık 15–16 kg’dır. Bu değeri mobilya kütlesini ve kullanılabilir taşıma kapasitesini planlarken bir başlangıç verisi olarak ele alırız; her proje yine araç ve kapsamıyla doğrulanır." },
      { id: "organized-service-access", heading: "Düzen, servis erişimini de kapsar.", body: "Elektrik ve su bileşenleri yalnızca saklanmamalı; bağlantılar, koruma elemanları ve kontrol noktaları gerektiğinde erişilebilir kalmalıdır. Mobilya ve depolama kararları bu erişimi kapatmamalıdır." },
      { id: "living-space-and-engineering", heading: "Yaşam alanı ile mühendislik aynı planda buluşur.", body: "Oturum, uyku, mutfak ve kişisel alan; dolaşım, açıklıklar, ağırlık, enerji, su ve bakım ihtiyaçlarından bağımsız değildir. Görünen tasarım ile onu mümkün kılan kararlar birlikte gelişir." },
      { id: "open-technical-questions", heading: "Açık soruları saklamayız.", body: "Eksik bilgi bir uygunluk sonucu değildir. Doğrulanması gereken ölçü, ürün verisi veya uygulama koşulu varsa bunu görünür tutmak, varsayımla ilerlemekten daha güvenlidir." },
      { id: "workshop-extension", heading: "Workshop, bu deneyimin gelecekteki uzantısıdır.", body: "Hazırlanan Workshop; araç, yerleşim ve ürün seçimlerinin birbirini nasıl etkilediğini müşteriye anlaşılır biçimde göstermeyi amaçlıyor. Bu deneyim henüz kullanıma açık değildir." },
      { id: "human-responsibility", heading: "Son kararın sorumluluğu insanda kalır.", body: "Dijital rehberlik seçenekleri açıklayabilir ve açık soruları gösterebilir. Projeye özgü nihai teknik ve ticari kararlar ise uzman incelemesi ve insan onayı gerektirir." },
    ],
    actions: [{ label: "Karavan Deneyimi", slug: "karavan-deneyimi" }, { label: "Mühendislik", slug: "muhendislik" }, { label: "Workshop", slug: "sistem" }],
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
    actions: [{ label: "Workshop’u Tanıyın", slug: "sistem" }, { label: "Mühendislik Yaklaşımı", slug: "muhendislik" }],
  },
  muhendislik: {
    title: "Mühendislik", seoTitle: "Mühendislik Yaklaşımı | Skyvan", seoDescription: "Skyvan’ın araç bağlamı, fiziksel yerleşim, enerji, su, kontrol ve insan onayını birlikte ele alan mühendislik yaklaşımı.", eyebrow: "Mühendislik",
    heading: "Görünen şey, üretilebilir olmalı.", body: "Yaşam alanının arkasında birbirini etkileyen teknik kararlar vardır. Skyvan’ın mühendislik yaklaşımı, yerleşimi; araç, enerji, su, ağırlık ve bakım erişimiyle birlikte ele alır.",
    sections: [
      { id: "vehicle-context", heading: "İlk referans, aracın kendisi.", body: "Marka ve model bir başlangıçtır. Model yılı, gövde ve varyant bağlamı, kullanılabilir ölçüler, açıklıklar ve taşıma sınırları projenin çerçevesini belirler. L/H tanımı tek başına yerleşim uyumunu göstermez." },
      { id: "material-weight-awareness", heading: "Malzeme ve ağırlık kararları birlikte izlenir.", body: "Skyvan’da kullanılan 15 mm Marin Panel, 140 × 210 cm levha ölçüsünde yaklaşık 15–16 kg’dır. Bu proje sahibi tarafından sağlanan ürün verisi, mobilya kütlesinin kullanılabilir taşıma kapasitesi ve aracın bütünü üzerindeki etkisini planlamak için kullanılır; sayısal karşılaştırmalar doğrulanmış eşdeğer veriler olmadan yapılmaz." },
      { id: "layout-physical-fit", heading: "Sığması kadar, kullanılabilmesi de önemli.", body: "Dolaşım, kapakların açılması, bağlantılara ulaşılması, havalandırma ve bakım payı yerleşimi etkiler. Görselde boş görünen alan otomatik olarak kullanılabilir montaj alanı değildir." },
      { id: "roof-electrical-compatibility", heading: "Çatı yerleşimi ve elektriksel uyum, iki ayrı soru.", body: "Panel yerleşimi için gerçek ürün ölçüleri, kullanılabilir tavan alanı, açıklıklar ve servis payları gerekir. Panel dizisi ise kontrolör, akü sistemi, yükler, koruma ve üretici sınırlarıyla ayrıca değerlendirilir." },
      { id: "electrical-service", heading: "Elektrik dağıtımı erişilebilir ve anlaşılır kalmalı.", body: "Bileşen konumları, bağlantı güzergâhları, koruma elemanları ve servis erişimi aynı planın parçalarıdır. Bu sayfadaki görseller cihaz seçimi, bağlantı talimatı veya doğrulanmış elektrik projesi değildir." },
      { id: "water-service", heading: "Su sistemi, bakım düşünülerek yerleşmeli.", body: "Depolama ve dağıtım noktaları kullanım kadar temizlik, kontrol ve bakım açısından da ele alınır. Bir bağlantıyı incelemek için yaşam alanını gereksiz yere sökmek zorunda kalmamak, servis erişimini baştan düşünmenin nedenlerinden biridir." },
      { id: "controls", heading: "Temel işlevler anlaşılır kalsın.", body: "Kontroller, yaşam alanındaki işlevleri açık biçimde izlemeyi ve kullanmayı desteklemelidir. Erişim ile sistem davranışı aynı konuşmanın parçasıdır; gösterilen arayüz çalışması tamamlanmış bir otomasyon ürünü değildir." },
      { id: "technical-review", heading: "Teknik inceleme, açık soruları karara dönüştürür.", body: "Eksik bilgi varsa uygunluk çözülmemiş kalır. Doğrulanmış veriler ve belirli kurallar kesin uyumsuzlukları ayırır; nihai teknik ve ticari kararlar projeye özgü insan onayı gerektirir." },
    ],
    note: "Bilgi eksikse, uygunluk sonucu da net değildir. Teknik değerlendirme açık soruları görünür kılar; nihai teknik ve ticari karar insan onayıyla verilir.",
    actions: [{ label: "Workshop Yaklaşımını İncele", slug: "sistem" }, { label: "Üretime Hazırlık", slug: "uretim-sureci" }],
  },
  sistem: {
    title: "Skyvan ve Workshop", seoTitle: "Skyvan Workshop Yaklaşımı | Skyvan", seoDescription: "Araç, yaşam alanı ve teknik seçimlerin planlanan Workshop deneyiminde nasıl birlikte ele alınacağını keşfedin.", eyebrow: "Skyvan Workshop",
    heading: "Bir seçimin, bütün projeyi nasıl etkilediğini anlayın.", body: "Skyvan, araç, yaşam alanı ve teknik seçimleri aynı bağlamda ele alan bir deneyim geliştiriyor. Workshop, bu yaklaşımın müşteriye açılacak bölümü olarak hazırlanıyor.", status: "Yakında",
    sections: [
      { id: "vehicle-selection", heading: "Araç ve varyant bağlamını kurun.", body: "Planlanan akış; marka, model, model yılı, gövde ve varyant bilgileriyle başlayacak. Doğrulanmış kullanılabilir ölçüler, seçimlerin hangi araç için değerlendirildiğini açık tutacak." },
      { id: "project-foundation", heading: "Yolculuğunuzu ve yaşam önceliklerinizi anlatın.", body: "Proje çerçevesi, nasıl seyahat ettiğiniz ve alanı nasıl kullanmak istediğinizle oluşacak. Oturum, uyku, mutfak, banyo ve depolama ihtiyaçları aynı yaşam bağlamında ele alınacak." },
      { id: "category-choices", heading: "Ürün kategorilerini ilişkileriyle keşfedin.", body: "Görünür malzeme ve yerleşim tercihleri seçilirken bir kararın alanı, ağırlığı, enerjiyi veya servis erişimini nasıl etkilediği açıklanacak. Uyumlu olduğu doğrulanmamış seçenekler kesin sonuç gibi sunulmayacak." },
      { id: "visible-preview", heading: "Görünür yaşam alanını önizleyin.", body: "Planlanan 2.5D görünüm; mobilya ve malzeme yüzeylerini, pencere ve kapıları, banyo alanını, oturumu, masayı, yatağı ve uygun olduğunda alkoven yatağı anlaşılır bir kompozisyonda gösterecek. Bu önizleme henüz kullanıma açık değildir." },
      { id: "preview-boundary", heading: "Gizli sistemler görsel bir benzetim değildir.", body: "MPPT, inverter, akü, kablolama, elektrik ve su tesisatı, combiner box, sigortalar ve gizli bağlantılar 2.5D yaşam alanı görünümünde canlandırılmayacak. Bunlar teknik özet ve doğrulama katmanında açık karar başlıkları olarak yer alacak." },
      { id: "technical-validation", heading: "Fiziksel yerleşimi ve teknik uyumu ayrı ayrı doğrulayın.", body: "Örneğin bir müşteri dört güneş paneli seçmek isteyebilir; bu sayı bir öneri veya uygunluk sonucu değildir.", bullets: ["Paneller, açıklıkları ve servis paylarını koruyarak kullanılabilir çatı alanına fiziksel olarak sığıyor mu?", "Panel gerilim ve akım değerleri ile dizi yapılandırması, seçilen kontrolör ve elektrik bağlamıyla uyumlu mu?", "Doğrulanmış teknik kurallar kesin uyumsuzlukları belirler ve uyumsuz birleşimleri engelleyebilir. Yapay zekâ nedeni açıklar, uyarır ve alternatifler önerebilir; eksik bilgi çözülmemiş olarak kalır."] },
      { id: "project-sealing", heading: "Projeyi incelemeye hazır bir kapsamda sabitleyin.", body: "Seçimler, uyarılar ve açık sorular ortak bir proje özetinde buluşacak. Projenin sabitlenmesi otomatik onay anlamına gelmeyecek; nihai teknik ve ticari kararlar insan incelemesi gerektirecek." },
      { id: "progress-visibility", heading: "İlerlemeyi sade bir görünümde izleyin.", body: "Planlanan müşteri görünümü, projenin hangi aşamada olduğunu ve hangi soruların yanıt beklediğini anlaşılır biçimde gösterecek. Canlı proje oluşturma ve takip bugün kullanıma açık değildir." },
    ],
    actions: [{ label: "Proje Başlat", slug: "proje-baslat" }, { label: "Mühendislik", slug: "muhendislik" }, { label: "Nasıl Çalışır", slug: "nasil-calisir" }],
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
    title: "About Skyvan", seoTitle: "About Skyvan | Skyvan", seoDescription: "Discover how hands-on experience building a real motorhome shapes Skyvan’s material and engineering decisions.", eyebrow: "About Skyvan",
    heading: "We began with what we learned by building a real motorhome.", body: "Skyvan is shaped by hands-on experience from building a complete motorhome. We are carrying that experience into future projects through life-led design, considered material choices and clear technical review.",
    sections: [
      { id: "why-skyvan-exists", heading: "Skyvan exists to make connected decisions easier to understand.", body: "A motorhome project begins with a way of living, not an equipment list. Making travel habits, the people sharing the space and everyday priorities visible leads to better technical questions." },
      { id: "hands-on-build-experience", heading: "Building reveals what a drawing cannot.", body: "Hands-on experience building a real motorhome showed us how a decision that looks right on paper changes through fabrication, everyday use and maintenance. Skyvan’s approach grows from that direct experience." },
      { id: "lightweight-material-decisions", heading: "Material choices belong to the whole vehicle.", body: "The 15 mm Marin Panel used by Skyvan comes in a 140 × 210 cm sheet weighing approximately 15–16 kg. We treat these owner-provided product specifications as a starting point when planning furniture mass and usable payload; each project still requires review in its own vehicle and scope." },
      { id: "organized-service-access", heading: "Order includes access for service.", body: "Electrical and water components should not merely disappear behind furniture. Connections, protection devices and inspection points need to remain reachable, and storage decisions should preserve that access." },
      { id: "living-space-and-engineering", heading: "Living-space design and engineering share one plan.", body: "Lounge, sleep, galley and personal space are not separate from circulation, openings, weight, energy, water and maintenance. The visible design develops with the decisions that make it possible." },
      { id: "open-technical-questions", heading: "We keep unresolved questions visible.", body: "Missing information is not a compatibility result. When dimensions, product data or installation conditions still need verification, saying so clearly is safer than progressing on an assumption." },
      { id: "workshop-extension", heading: "Workshop is the future extension of this experience.", body: "The planned Workshop is intended to show customers how vehicle, layout and product choices affect one another. The experience is not yet available to use." },
      { id: "human-responsibility", heading: "People remain responsible for final decisions.", body: "Digital guidance may explain options and surface open questions. Project-specific technical and commercial decisions still require expert review and human approval." },
    ], actions: [{ label: "Motorhome Living", slug: "karavan-deneyimi" }, { label: "Engineering", slug: "muhendislik" }, { label: "Workshop", slug: "sistem" }],
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
    ], actions: [{ label: "Meet Workshop", slug: "sistem" }, { label: "Engineering Approach", slug: "muhendislik" }],
  },
  muhendislik: {
    title: "Engineering", seoTitle: "Engineering Approach | Skyvan", seoDescription: "How Skyvan considers vehicle context, physical fit, energy, water, controls and human approval.", eyebrow: "Engineering",
    heading: "What you see must be buildable.", body: "Behind a living space is a set of connected technical decisions. Skyvan’s engineering approach considers layout alongside the vehicle, energy, water, weight and maintenance access.",
    sections: [
      { id: "vehicle-context", heading: "Begin with the vehicle itself.", body: "Make and model are a starting point. Model year, body and variant context, usable dimensions, openings and load limits establish the project boundaries. An L/H designation alone does not establish layout compatibility." },
      { id: "material-weight-awareness", heading: "Material and weight decisions stay connected.", body: "The 15 mm Marin Panel used by Skyvan comes in a 140 × 210 cm sheet weighing approximately 15–16 kg. These owner-provided product specifications support planning for furniture mass, usable payload and the whole vehicle; numerical comparisons require verified equivalent data." },
      { id: "layout-physical-fit", heading: "Space to fit, and space to function.", body: "Circulation, opening covers, access to connections, ventilation and servicing all affect a layout. Empty-looking space in a rendering is not automatically suitable installation space." },
      { id: "roof-electrical-compatibility", heading: "Roof placement and electrical compatibility are separate questions.", body: "Placement needs actual product dimensions, usable roof area, openings and service clearances. Array configuration then needs separate review with the controller, battery system, loads, protection and manufacturer limits." },
      { id: "electrical-service", heading: "Electrical distribution should remain accessible and understandable.", body: "Component positions, connection routes, protection devices and service access belong to one plan. Images on this page are not equipment selection, wiring instructions or a verified electrical design." },
      { id: "water-service", heading: "Plan water systems around maintenance as well as use.", body: "Storage and distribution points need consideration for cleaning, inspection and maintenance. Avoiding unnecessary dismantling to reach a connection is one reason to plan service access early." },
      { id: "controls", heading: "Keep essential functions understandable.", body: "Controls should make living-space functions clear to monitor and use. Access and system behaviour belong in the same discussion; the interface study shown is not a finished automation product." },
      { id: "technical-review", heading: "Technical review turns open questions into accountable decisions.", body: "When information is missing, compatibility remains unresolved. Verified data and defined rules distinguish confirmed incompatibilities; final technical and commercial decisions require project-specific human approval." },
    ], note: "Missing information means compatibility is unresolved. Technical review makes open questions visible; final technical and commercial decisions require human approval.", actions: [{ label: "Explore the Workshop Approach", slug: "sistem" }, { label: "Preparing for Production", slug: "uretim-sureci" }],
  },
  sistem: {
    title: "Skyvan and Workshop", seoTitle: "The Skyvan Workshop Approach | Skyvan", seoDescription: "How vehicle, living-space and technical choices will remain connected in the planned Workshop experience.", eyebrow: "Skyvan Workshop", status: "Coming soon",
    heading: "Understand how one choice affects the whole project.", body: "Skyvan is developing an experience that keeps vehicle, living-space and technical choices connected. Workshop is being prepared as the customer-facing part of that approach.",
    sections: [
      { id: "vehicle-selection", heading: "Establish the vehicle and variant context.", body: "The planned journey will begin with make, model, model year, body and variant details. Verified usable dimensions will keep it clear which vehicle each choice is being considered for." },
      { id: "project-foundation", heading: "Describe your journey and living priorities.", body: "The project context will grow from how you travel and want to use the space. Seating, sleeping, galley, bathroom and storage needs will be considered within the same living brief." },
      { id: "category-choices", heading: "Explore product categories through their relationships.", body: "As visible materials and layouts are considered, Workshop is intended to explain how a choice affects space, weight, energy or service access. Options without confirmed compatibility will not be presented as settled answers." },
      { id: "visible-preview", heading: "Preview the visible living space.", body: "The planned 2.5D view will present furniture and material surfaces, windows and doors, the bathroom, seating, table, bed and an overcab bed where relevant as one understandable composition. This preview is not available today." },
      { id: "preview-boundary", heading: "Hidden systems are not a visual simulation.", body: "MPPT controllers, inverters, batteries, cabling, electrical and water installations, combiner boxes, fuses and hidden connections will not be simulated inside the 2.5D living-space view. They belong in the technical summary and validation layer as explicit decisions." },
      { id: "technical-validation", heading: "Validate physical placement and technical compatibility separately.", body: "For example, a customer may wish to select four solar panels; that number is neither a recommendation nor a compatibility result.", bullets: ["Do the panels physically fit the usable roof while preserving openings and service clearances?", "Are panel voltage and current values, and the array configuration, compatible with the selected controller and electrical context?", "Validated deterministic rules identify confirmed incompatibilities and may block incompatible combinations. AI may explain why, warn and suggest alternatives; missing information remains unresolved."] },
      { id: "project-sealing", heading: "Seal a scope that is ready for review.", body: "Selections, warnings and open questions will meet in a shared project summary. Sealing the project will not mean automatic approval; final technical and commercial decisions will require human review." },
      { id: "progress-visibility", heading: "See progress in a simple customer view.", body: "The planned customer view will show which stage the project has reached and which questions still need answers. Live project creation and tracking are not available today." },
    ], actions: [{ label: "Start a Project", slug: "proje-baslat" }, { label: "Engineering", slug: "muhendislik" }, { label: "How It Works", slug: "nasil-calisir" }],
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
