import type { PublicLocale } from "./public-routing";

type Story = { eyebrow: string; heading: string; body: string };
type Item = { title: string; body: string };
type DiscoverySlug = "hakkimizda" | "muhendislik" | "sistem" | "nasil-calisir";
type DiscoveryItem = Item & { id: string; linkLabel: string; slug: DiscoverySlug };
export type PublicLaunchCopy = {
  nav: { discover: string; workshop: string; engineering: string; about: string };
  project: string; upcoming: string; concept: string; conceptNote: string;
  hero: Story & { subtext: string; primaryCta: string; secondaryCta: string; footnote: string };
  definition: Story;
  differentiation: Story & { items: DiscoveryItem[] };
  product: Story & {
    model: string; day: string; conversion: string; night: string;
    dayBody: string; conversionBody: string; nightBody: string; galleryLabel: string;
    cta: string;
    spaces: Array<{ title: string; body: string; image: "alcove" | "toilet" | "shower"; alt: string }>;
  };
  workshop: Story & { steps: Item[]; note: string; cta: string };
  engineering: Story & { approval: string; cta: string; items: Item[] };
  about: Story & { approach: Story; principles: Item[]; cta: string };
  coming: Story & { next: string; cta: string };
  faq: { eyebrow: string; items: Item[] };
  final: { eyebrow: string; heading: string };
  media: { vehicle: string; landscape: string; about: string; electrical: string; roof: string; water: string };
  footer: string;
};

export const publicLaunchContent: Record<PublicLocale, PublicLaunchCopy> = {
  tr: {
    nav: { discover: "Keşfet", workshop: "Workshop", engineering: "Mühendislik", about: "Hakkımızda" },
    project: "Proje Başlat", upcoming: "Yakında", concept: "Konsept tasarım",
    conceptNote: "Görseller Skyvan tasarım vizyonunu gösterir. Yerleşim ve donanım, araç özelinde teknik değerlendirme ve onayla netleşir.",
    hero: {
      eyebrow: "Daha fazla yer. Daha fazla hayat.", heading: "Özgürlük,\nmühendislikle.",
      subtext: "Sizin rotanız. Sizin yaşamınız. Birlikte düşünülen bir karavan projesi.", body: "",
      primaryCta: "Skyvan’ı Keşfet", secondaryCta: "Proje Başlat", footnote: "Yolda da evde. Hayatın tam içinde.",
    },
    definition: { eyebrow: "Skyvan yaklaşımı", heading: "Her yolculuk,\nsizi anlamakla başlar.", body: "Nereye gitmek istediğiniz kadar, nasıl yaşamak istediğiniz de önemli. Skyvan; günlük ritminizi, tasarımı ve mühendisliği aynı projenin parçaları olarak düşünür." },
    differentiation: {
      eyebrow: "Skyvan farkı", heading: "Her karar, projenin bütünüyle birlikte düşünülür.",
      body: "Hafiflikten servis erişimine kadar her seçim, yaşam alanını ve çevresindeki teknik kararları etkiler.",
      items: [
        { id: "lightweight-decisions", title: "Hafiflik, tek bir malzemeden daha büyük bir karardır.", body: "Karavana eklenen her malzeme kullanılabilir taşıma kapasitesini, aracın davranışını ve diğer seçimler için kalan payı etkiler. Skyvan, malzeme kararlarını görünüş kadar proje bütünü içindeki ağırlık etkisiyle ele alır.", linkLabel: "Deneyimimizi tanıyın", slug: "hakkimizda" },
        { id: "buildable-design", title: "Görünen şey, üretilebilir olmalı.", body: "Yerleşim, dolaşım, kapı ve pencere açıklıkları, teknik sistemler ve bakım erişimi birbirinden kopmadan çözülmelidir.", linkLabel: "Mühendislik yaklaşımı", slug: "muhendislik" },
        { id: "service-access", title: "Bugünün düzeni, yarının bakımını engellememeli.", body: "Su, elektrik, depolama ve mobilya kararları; bağlantılara, koruma elemanlarına ve kontrol noktalarına erişimi korumalıdır.", linkLabel: "Proje nasıl ilerler?", slug: "nasil-calisir" },
        { id: "connected-choices", title: "Bileşenler bağımsız alışverişler değildir.", body: "Güneş paneli, şarj kontrolörü, akü, inverter, yükler, kullanılabilir alan ve koruma gereksinimleri aynı bağlamda değerlendirilir.", linkLabel: "Workshop’u tanıyın", slug: "sistem" },
      ],
    },
    product: {
      eyebrow: "Yaşam alanı", heading: "Hayatınıza göre şekillenen bir alan.",
      body: "Manzaraya açılan bir oturma alanı. Dinlenmeye ayrılan sakin bir köşe. Aynı alanın, günün farklı anlarına uyum sağladığı bir tasarım fikri.",
      model: "Ufuk konsepti", day: "Oturum", conversion: "Dönüşüm", night: "Uyku",
      dayBody: "U oturum, yükseltilmiş masa ve zemine bağlı teleskopik ayakla gündüz kullanım fikri.",
      conversionBody: "Masanın kısmen alçaldığı, ayağın ve açılan yatak desteklerinin görünür kaldığı ara düzen.",
      nightBody: "Aynı U oturumun, masa ayağı yatak altında bağlı kalacak şekilde uyku düzenine dönüşmüş hali.", galleryLabel: "Ufuk yaşam alanı durumu", cta: "Karavan deneyimini keşfedin",
      spaces: [
        { title: "Alkoven yatak", body: "Yaşam alanının üzerinde, dinlenmek için ayrılmış bir köşe.", image: "alcove", alt: "Alkovenli karavanın kabin üstü yatak bölümünün Skyvan konsept tasarımı" },
        { title: "Karavan tipi tuvalet", body: "Kompakt bir hacimde, günlük kullanımın ihtiyaçlarını düşünmek.", image: "toilet", alt: "Kompakt lavabo ve karavan tipi tuvalet içeren Skyvan konsept WC bölümü" },
        { title: "Ayrı duş alanı", body: "Islak ve kuru alanları ayrı ele alan bir yerleşim fikri.", image: "shower", alt: "Karavan ölçülerine göre tasarlanmış ayrı duş kabininin Skyvan konsept görünümü" },
      ],
    },
    workshop: {
      eyebrow: "Skyvan Workshop", heading: "Sizin yolculuğunuz,\nbirlikte düşünülen planınız.",
      body: "Hazırladığımız Workshop deneyimi; araç seçimini, yaşam düzenini ve teknik ihtiyaçları adım adım birlikte ele alacak.",
      steps: [
        { title: "Araç seçimi", body: "Marka, model ve gövde varyantından başlayarak aracın gerçek ölçülerini anlamak." },
        { title: "Yaşam düzeni", body: "Oturma, uyku, mutfak ve depolama ihtiyaçlarını rotanıza göre düşünmek." },
        { title: "Teknik değerlendirme", body: "Yerleşim ve bileşen uyumluluğunu, doğrulanmış araç ve ürün verileriyle incelemek." },
      ],
      note: "Planlanan deneyimde yapay zekâ seçimleri açıklayacak; doğrulanmış kurallar uyumsuz seçimlerde uyaracak ve gerektiğinde ilerlemeyi durduracak. Nihai karar insan onayında kalacak.",
      cta: "Workshop’u tanıyın",
    },
    engineering: {
      eyebrow: "Mühendislik", heading: "Görünen şey,\nüretilebilir olmalı.",
      body: "İyi bir yerleşimin arkasında birbirini tamamlayan kararlar var. Araç ölçüleri, enerji ihtiyacı ve bileşenler birlikte değerlendirilir.",
      approval: "Nihai teknik ve ticari kararlar insan onayıyla verilir.", cta: "Mühendislik yaklaşımımız",
      items: [
        { title: "Önce fiziksel uyum", body: "Güneş panelleri değerlendirilirken kullanılabilir tavan alanı, panel ölçüleri, açıklıklar ve montaj gereksinimleri birlikte ele alınır. Yalnızca panel sayısı yeterli değildir." },
        { title: "Sonra sistem uyumu", body: "Panel dizilimi ve elektriksel değerler; MPPT giriş sınırları, akü sistemi ve kullanım koşullarıyla birlikte değerlendirilir. Bir parçanın yerine sığması, elektriksel uyumluluk sonucu değildir." },
        { title: "Bağlantı ve servis erişimi", body: "Su dağıtım bileşenlerinin yerleşimi; bağlantılara, vanalara ve sabitlemelere erişim fikriyle birlikte düşünülür. Görsel, doğrulanmış bir tesisat şeması değildir." },
        { title: "Doğrulanmış araç bağlamı", body: "L ve H gövde kodları tek başına kesin ölçü vermez. Marka, model, yıl ve varyanta ait doğrulanmış bilgiler gerekir." },
      ],
    },
    about: {
      eyebrow: "Hakkımızda", heading: "Bir araçtan fazlasını\nbirlikte düşünmek.", body: "Skyvan, yaşam ihtiyaçlarını tasarım ve mühendislikle buluşturan bir platform olarak gelişiyor.",
      approach: { eyebrow: "Yaklaşımımız", heading: "Önce yaşam.\nSonra doğru kararlar.", body: "Daha iyi bir yolculuk, doğru sorularla başlar. Bizim için bir karavan projesi; nasıl dinlendiğiniz, çalıştığınız ve yola çıktığınızla birlikte düşünülür." },
      principles: [
        { title: "İhtiyacı anlamak", body: "Rotayı, günlük alışkanlıkları ve birlikte yolculuk edecek kişilerin ihtiyaçlarını ele almak." },
        { title: "Tasarımı birlikte düşünmek", body: "Estetik, işlev ve konforu aynı yaşam alanında dengelemek." },
        { title: "Teknik değerlendirmeyle ilerlemek", body: "Belirsizlikleri görünür tutmak; proje kapsamını doğrulama ve insan onayıyla netleştirmek." },
      ],
      cta: "Skyvan yaklaşımını keşfedin.",
    },
    coming: { eyebrow: "Skyvan Workshop", heading: "Sizin rotanız.\nSizin yaşam alanınız.", body: "Projenizi adım adım ele alabileceğiniz Workshop deneyimini hazırlıyoruz. Araçtan yaşam düzenine, her seçimi anlamlı bir bütün içinde düşünmek için.", next: "Sizi neler bekliyor?", cta: "Workshop yaklaşımını keşfet" },
    faq: {
      eyebrow: "Sık sorulan sorular",
      items: [
        { title: "Workshop bugün kullanılabiliyor mu?", body: "Workshop ve proje başlatma deneyimi hazırlanıyor. Şu anda yaklaşımımızı ve konsept tasarımlarımızı keşfedebilirsiniz. Açılış tarihi henüz açıklanmadı." },
        { title: "Görsellerdeki araç ve donanımlar satışa hazır mı?", body: "Bu görseller Skyvan’ın tasarım vizyonuna ait konseptlerdir. Sunulacak araçlar, donanımlar ve yerleşimler; teknik değerlendirme ve onaylanan proje kapsamıyla netleşecektir." },
        { title: "Teknik seçimlere kim karar verecek?", body: "Planlanan Workshop deneyiminde yapay zekâ açıklama ve yönlendirme sağlayacak, doğrulanmış kurallar uyumluluk kontrolünü destekleyecek. Nihai teknik ve ticari kararlar insan onayında kalacak." },
      ],
    },
    final: { eyebrow: "Daha geniş bir yarın için", heading: "Projenizin nasıl ele alınacağını keşfedin." },
    media: { vehicle: "Skyvan amblemli antrasit alkovenli motokaravanın stüdyo ortamında konsept görünümü", landscape: "Dağ ve göl manzarasında Skyvan alkovenli motokaravan konsepti", about: "Skyvan yaşam alanı yaklaşımını gösteren aydınlık iç mekân konsepti", electrical: "Skyvan elektrik bölmesi konsepti; teknik bağlantı şeması değildir", roof: "Skyvan araç tavanında güneş paneli yerleşim konsepti; doğrulanmış uyumluluk sonucu değildir", water: "Skyvan karavanı su sistemi servis bölmesinin konsept tasarımı" },
    footer: "Özgürlük, mühendislikle.",
  },
  en: {
    nav: { discover: "Discover", workshop: "Workshop", engineering: "Engineering", about: "About" },
    project: "Start a Project", upcoming: "Coming soon", concept: "Concept design",
    conceptNote: "These images express Skyvan’s design vision. Layouts and equipment depend on vehicle-specific technical review and approval.",
    hero: { eyebrow: "More room. More life.", heading: "Freedom,\nengineered.", subtext: "Your route. Your way of living. A motorhome project considered as a whole.", body: "", primaryCta: "Discover Skyvan", secondaryCta: "Start a Project", footnote: "At home on the road. In the heart of life." },
    definition: { eyebrow: "The Skyvan approach", heading: "Every journey begins\nwith understanding you.", body: "How you want to live matters as much as where you want to go. Skyvan considers your daily rhythm, design and engineering as parts of the same project." },
    differentiation: {
      eyebrow: "What sets Skyvan apart", heading: "Every decision belongs to the whole project.",
      body: "From lightness to service access, each choice shapes the living space and the technical decisions around it.",
      items: [
        { id: "lightweight-decisions", title: "Lightness is bigger than a single material choice.", body: "Every material added to a motorhome affects usable payload, vehicle behaviour and the margin left for other decisions. Skyvan considers materials for their place in the whole project, not appearance alone.", linkLabel: "Meet our experience", slug: "hakkimizda" },
        { id: "buildable-design", title: "What you see must be buildable.", body: "Layout, circulation, doors and windows, technical systems and maintenance access need to remain connected from design onward.", linkLabel: "Our engineering approach", slug: "muhendislik" },
        { id: "service-access", title: "Today’s layout should not obstruct tomorrow’s maintenance.", body: "Water, electrical, storage and furniture decisions should preserve access to connections, protection devices and inspection points.", linkLabel: "See how a project develops", slug: "nasil-calisir" },
        { id: "connected-choices", title: "Components are not isolated purchases.", body: "Solar panels, controllers, batteries, inverters, loads, usable area and protection requirements need to be evaluated in the same context.", linkLabel: "Meet Workshop", slug: "sistem" },
      ],
    },
    product: {
      eyebrow: "Living space", heading: "Space that follows your way of life.", body: "A lounge open to the view. A quiet place to rest. A design concept that lets the same space adapt to different moments of your day.",
      model: "Ufuk concept", day: "Lounge", conversion: "Conversion", night: "Sleep",
      dayBody: "The daytime idea with a U lounge, raised table and floor-mounted telescopic pedestal.",
      conversionBody: "An intermediate state with the table partly lowered and the pedestal and extending bed supports kept visible.",
      nightBody: "The same U lounge arranged for sleep, with the table pedestal retained beneath the bed.", galleryLabel: "Ufuk living-space state", cta: "Explore motorhome living",
      spaces: [
        { title: "Overcab bed", body: "A place to rest, set above the living space.", image: "alcove", alt: "Skyvan concept sleeping area above the motorhome cab" },
        { title: "Motorhome toilet", body: "Everyday needs considered within a compact space.", image: "toilet", alt: "Skyvan concept compact motorhome toilet room with a small basin" },
        { title: "Separate shower", body: "A layout concept that considers wet and dry areas separately.", image: "shower", alt: "Skyvan concept separate shower designed for a motorhome interior" },
      ],
    },
    workshop: {
      eyebrow: "Skyvan Workshop", heading: "Your journey.\nA thoughtfully connected plan.", body: "The Workshop experience we are preparing will bring vehicle choice, living layouts and technical needs together, step by step.",
      steps: [
        { title: "Vehicle choice", body: "Start with the make, model and body variant to understand the vehicle’s actual dimensions." },
        { title: "Living layout", body: "Consider seating, sleeping, cooking and storage around the way you travel." },
        { title: "Technical review", body: "Explore layout and component compatibility using verified vehicle and product information." },
      ],
      note: "In the planned experience, AI will explain choices. Validated rules will flag incompatible selections and stop progression where necessary. Final decisions will remain subject to human approval.", cta: "Meet Workshop",
    },
    engineering: {
      eyebrow: "Engineering", heading: "What you see\nmust be buildable.", body: "A considered layout depends on decisions that work together. Vehicle dimensions, energy needs and components are evaluated as a whole.", approval: "Final technical and commercial decisions remain subject to human approval.", cta: "Our engineering approach",
      items: [
        { title: "Physical fit first", body: "Solar-panel placement considers usable roof space, panel dimensions, openings and mounting requirements together. Panel count alone is not enough." },
        { title: "System compatibility next", body: "Array configuration and electrical characteristics are evaluated alongside MPPT input limits, the battery system and operating conditions. Physical fit does not establish electrical compatibility." },
        { title: "Connections and service access", body: "Water-distribution placement is considered alongside access to connectors, valves and retaining points. The image is not a verified plumbing diagram." },
        { title: "Verified vehicle context", body: "L and H body codes alone do not establish exact dimensions. Verified information for the make, model, year and variant is needed." },
      ],
    },
    about: {
      eyebrow: "About Skyvan", heading: "Thinking beyond\nthe vehicle, together.", body: "Skyvan is developing as a platform that connects the way you live with design and engineering.",
      approach: { eyebrow: "Our approach", heading: "Life first.\nThen the right decisions.", body: "A better journey starts with better questions. For us, a motorhome project begins with how you rest, work and take to the road." },
      principles: [
        { title: "Understand the need", body: "Consider the route, daily habits and the needs of everyone travelling together." },
        { title: "Think about design together", body: "Balance aesthetics, function and comfort within the same living space." },
        { title: "Move forward through review", body: "Keep uncertainty visible and clarify the project through verification and human approval." },
      ], cta: "Explore the Skyvan approach.",
    },
    coming: { eyebrow: "Skyvan Workshop", heading: "Your route.\nYour living space.", body: "We are preparing Workshop: a way to consider your project step by step, connecting each choice from vehicle to living layout.", next: "What are we preparing?", cta: "Explore the Workshop approach" },
    faq: {
      eyebrow: "Frequently asked questions",
      items: [
        { title: "Can I use Workshop today?", body: "Workshop and the project-start experience are in development. For now, you can explore our approach and concept designs. An opening date has not yet been announced." },
        { title: "Are the vehicles and equipment shown ready to buy?", body: "These images are concepts expressing Skyvan’s design vision. Available vehicles, equipment and layouts will be defined through technical review and the approved project scope." },
        { title: "Who will make the technical decisions?", body: "In the planned Workshop experience, AI will explain and guide, while validated rules will support compatibility checks. Final technical and commercial decisions will remain subject to human approval." },
      ],
    },
    final: { eyebrow: "For a wider tomorrow", heading: "Discover how your project will take shape." },
    media: { vehicle: "Anthracite Skyvan-branded overcab motorhome concept in a studio", landscape: "Skyvan overcab motorhome concept beside a mountain lake", about: "Bright interior concept expressing Skyvan’s living-space approach", electrical: "Skyvan electrical-compartment concept; not a wiring diagram", roof: "Skyvan roof solar-panel placement concept; not a verified compatibility result", water: "Skyvan motorhome water-system service compartment concept" },
    footer: "Freedom, engineered.",
  },
};
