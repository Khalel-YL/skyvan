# SKYVAN ÇALIŞMA SİSTEMİ — DEVİR VE DEVAM DOSYASI

**Amaç:** Bu dosya, Skyvan projesinde kullanılan çalışma biçimini, tasarım kararlarını, teknik sınırları ve devam sırasını tek yerde toplar. Başka bir sohbet, başka bir ChatGPT hesabı veya yeni bir Codex oturumu projeyi devraldığında bu dosya okunarak kaldığımız yerden devam edilmelidir.

**Dil:** Türkçe iletişim ve karar metni. Kod, değişken ve dosya adları mevcut repo standardına göre İngilizce olabilir.

**Kural:** Bu dosya bir sohbet özeti değil, proje çalışma sözleşmesidir. Eski sohbetlerdeki “tamamlandı” ifadeleri mevcut kaynak gerçekliğiyle doğrulanmadan doğru kabul edilmez.

---

## 1. Proje kimliği

Skyvan, karavan sektörüne yönelik uzun vadeli bir işletim platformudur. Public web sitesi bu platformun vitrin ve açıklama katmanıdır; Atölye/Workshop ise platformun yalnızca bir modülüdür.

Uzun vadeli yapı:

- Admin ve veri omurgası
- Ürün, kategori, model ve paket yönetimi
- Datasheet ve üretici kaynak merkezi
- AI destekli açıklama, sınıflandırma ve uyarı
- Rule engine ve insan onayı
- Atölye / configurator
- Lead, teklif ve üretim hazırlığı
- Revision, publish, audit ve rollback

Ana hedef yalnızca güzel bir landing page değildir. Güzel görünen public yüzey, gerçek Admin verisi ve kontrollü teknik karar sistemine bağlanabilecek bir temel olmalıdır.

---

## 2. Kaynak gerçekliği ve öncelik sırası

Bir konuda çelişki olduğunda aşağıdaki sıra kullanılır:

1. Mevcut local repo ve çalışan kod
2. GitHub’daki aktif branch’in güncel commit’i
3. Vercel’in o commit’ten ürettiği son deployment
4. Admin’de yayınlanmış ve onaylanmış veri
5. Bu dosya ve diğer proje dokümanları
6. Eski sohbet mesajları ve tarihsel çalışma kayıtları

Eski bir mesajda “hazır” denmiş olması, mevcut kodda gerçekten hazır olduğu anlamına gelmez. Her batch başında şu bilgiler kontrol edilir:

- aktif branch
- local çalışma ağacı
- local HEAD
- origin ile fark
- son Vercel deployment commit’i
- etkilenecek dosyalar

Şema, veri, ürün, datasheet, kaynak ve kural konusunda varsayım yapılmaz. Kaynak yoksa durum “eksik veri” olarak kalır.

---

## 3. Repo, branch ve çalışma ortamı

Repo:

    https://github.com/Khalel-YL/skyvan

Aktif public geliştirme branch’i:

    public-workshop-retention

Local proje örneği:

    ~/Desktop/skyvan-github

Çalışma ortamı:

- VS Code: local geliştirme ve diff kontrolü
- GitHub: branch’in kaynak gerçeği
- Vercel: GitHub commit’lerinden Preview deployment
- Neon/PostgreSQL: mevcut proje verisi
- Next.js App Router + React + TypeScript
- Drizzle ORM

Local başlatma:

    git switch public-workshop-retention
    git pull --ff-only origin public-workshop-retention
    npm run dev

package.json içindeki dev komutu şu anda host ve portu sabitler:

    0.0.0.0:3001

Adresler:

    http://localhost:3001/tr
    http://localhost:3001/en
    http://localhost:3001/tr/muhendislik
    http://localhost:3001/tr/workshop

EADDRINUSE görülürse 3001’de zaten bir server çalışıyor olabilir. Önce mevcut server’ı ve portu kontrol et; çalışan süreci körlemesine öldürme:

    ss -ltnp | rg ':3001'

Telefonla aynı Wi-Fi üzerinden erişim:

    hostname -I

Bilgisayarın yerel IP’si örneğin 192.168.1.110 ise telefonda:

    http://192.168.1.110:3001/tr

Telefon ve bilgisayar aynı ağda olmalıdır. VS Code/WSL/uzak çalışma kullanılıyorsa port forwarding gerekebilir.

---

## 4. Zorunlu repo kuralları

Bu projede aşağıdaki davranışlar yasaktır:

- fake seed
- sahte ürün
- hayali datasheet
- uydurma teknik değer
- geçici bypass
- zorunlu alanı nullable yaparak problemi saklama
- gerçek schema’yı görmeden migration
- ikinci database klasörü
- ikinci architecture
- duplicate API
- /v2 prototipini public siteye bağlama
- yayınlanmamış Admin içeriğini public’te gösterme
- AI kararını insan onayı yerine koyma
- teknik güvenlik sonucunu yalnızca görsel veya metinle kesinleştirme
- ilgisiz modüllere refactor yapma
- kullanıcının mevcut değişikliklerini ezme

Her değişiklik:

- mevcut sistemi geliştirmeli
- minimum riskli olmalı
- mevcut component ve veri akışını kullanmalı
- TypeScript ve lint standardına uymalı
- gerekiyorsa dokümantasyonu güncellemelidir

---

## 5. Geliştirme faz sırası

Sıra değişmez:

1. Admin
2. AI
3. Atölye / Workshop
4. Integration / Stabilization

Admin şu anda sistemin veri ve onay omurgasıdır. Workshop public tanıtımı yapılabilir; ancak canlı teknik configurator, ürün önerisi veya fiyat akışı gerçek Admin, datasheet ve rule engine hazır olmadan varmış gibi gösterilemez.

---

## 6. Çalışma biçimi — her batch için zorunlu akış

### 6.1 Kısa dosya planı

Önce hangi dosyaların değişeceği, hangi dosyalara dokunulmayacağı ve beklenen sonuç yazılır.

### 6.2 Kaynak incelemesi

- ilgili proje dokümanı okunur
- mevcut component ve CSS incelenir
- canlı Vercel görünümü kontrol edilir
- varsa Admin/CMS override davranışı kontrol edilir
- mevcut kullanıcı değişiklikleri korunur

### 6.3 Sınırlı uygulama

Yalnızca gerekli dosyalar değiştirilir. Aynı batch içinde alakasız sayfalar, Admin veya database açılmaz.

### 6.4 Teknik kontrol

- TypeScript
- ESLint
- production build
- CMS/editorial doğrulama
- git diff --check
- eksik medya yolu ve broken import kontrolü

### 6.5 Görsel kontrol

- masaüstü/laptop genişliği
- yaklaşık 360 px mobil genişliği
- açık sistem teması
- koyu sistem teması
- prefers-reduced-motion
- yatay taşma
- header ve hero hizası
- görselin metni ezmemesi

### 6.6 GitHub ve Vercel

Kontroller geçince değişiklik anlamlı bir commit’e ayrılır, aktif branch’e gönderilir ve son Preview deployment takip edilir.

### 6.7 Kullanıcı onayı

Kullanıcının ekran görüntüsü, görsel yorumu ve gerçek cihaz kontrolü bir sonraki batch’in girdisidir. Eski tasarımın kabul edildiği varsayılmaz.

---

## 7. Public tasarım sözleşmesi

Skyvan’ın public tasarım yönü:

- premium
- sakin ve kontrollü
- Apple/Tesla ürün hikâyesi ritminden esinlenen
- Skyvan’ın kendi marka diliyle özgün
- büyük fakat laptop viewport’unu boğmayan görseller
- net hiyerarşi
- az ama anlamlı animasyon
- açık/koyu sistem temasına uyumlu
- Türkçe ve İngilizce içerik eşitliği

Premium görünüm yalnızca koyu arka plan veya altın çizgi demek değildir. Asıl kalite şunlardan gelir:

- doğru bilgi hiyerarşisi
- eşit görsel ritim
- gereksiz kart kalabalığının kaldırılması
- tutarlı boşluk sistemi
- aynı görsel dil
- okunabilir teknik açıklama
- gerçek veri ile konsept verinin ayrılması

Animasyon prensipleri:

- scroll reveal hafif ve tek seferlik olmalı
- kart hover hareketi küçük olmalı
- şema akış çizgisindeki hareket bilgi akışını anlatmalı
- hareket hiçbir zaman bilgi okunabilirliğini azaltmamalı
- prefers-reduced-motion: reduce durumunda hareket kapanmalı
- parallax, aşırı zoom, zıplama ve sürekli parlayan efektler kullanılmamalı

---

## 8. Public sayfa görevleri

### 8.1 Ana sayfa

Ana sayfa marka vitrini ve ilk etkidir.

Beklenen sıra:

1. Sinematik giriş / hero
2. Skyvan’ın ne yaptığı
3. yaşam alanı ve günlük kullanım
4. Atölye yaklaşımı
5. Mühendislik yaklaşımı
6. SSS veya güven unsuru
7. net final daveti

Hero yalnızca tek bir resim gibi durmamalı; kontrollü video/animasyon hissi vermeli fakat gereksiz hareketle yorulmamalıdır. Koyu sistem temasında arka plan tamamen siyaha düşmek yerine manzara/araç görseli güçlü kalmalıdır. Hero yazısı gerçek merkez ve viewport dengesine göre hizalanmalıdır.

### 8.2 Keşfet / Karavan Deneyimi

Bu sayfa yaşam deneyimini anlatır:

- oturum
- U düzen
- yükselip alçalan masa
- uykuya dönüşüm
- mutfak
- banyo/WC
- depolama
- dolaşım

Bu sayfada teknik panel şemaları ana unsur yapılmaz. Müşteri aracın içinde nasıl yaşayacağını görmelidir.

### 8.3 Mühendislik

Bu sayfa teknik yaklaşımı anlatır; gerçek proje onayı değildir.

Sayfanın başında şu durum açıkça görünmelidir:

> Şemalar yaklaşımı açıklar; ölçülü yerleşim, seçilmiş ürün veya montaj onayı değildir. Uygunluk araç, datasheet, kütle, enerji, su ve servis verileriyle proje özelinde doğrulanır.

Mühendislikte her görselin görevi farklıdır:

- araç bağlamı: model, varyant, ölçü, aks ve payload
- malzeme/kütle: panel, mobilya, su, akü ve ekipman kütlesi
- çatı/enerji: fiziksel yerleşim ve elektriksel uyumluluğun ayrılması
- elektrik servis: kablo, sigorta, DC bara, shunt ve erişim
- su servis: temiz su, pompa, süzgeç, filtre, boiler, manifold ve gri su
- kontrol: ölçüm, kullanıcı arayüzü ve servis noktaları
- teknik inceleme: datasheet, manuel, araç verisi, kural ve insan onayı

### 8.4 Atölye

Türkçe public navigasyonda isim Atölye olmalıdır. İngilizce sayfada Workshop kullanılabilir.

Atölye tanıtım sayfası iç/dış konsept galeri sayfası değildir. Asıl görevi müşteriye şu çalışma biçimini anlatmaktır:

- araç seçimi
- kullanım ve yaşam brief’i
- şablon/yerleşim seçimi
- ürün kategorileri
- gerçek ürün datasheet’i
- enerji ve su hesap mantığı
- ağırlık ve aks kontrolü
- AI açıklaması ve uyarısı
- rule engine uyumsuzluk engeli
- insan incelemesi ve mühürleme

Atölye şu anda public’te planlanan/yakında bir deneyim olarak sunulur. Canlı configurator, canlı fiyat, gerçek uyumluluk veya otomatik teknik onay iddiası yapılmaz.

### 8.5 Proje Başlat

Şu aşamada aktif teklif veya sipariş formu değildir. Atölyeye yönlendiren ve sürecin yakında açılacağını anlatan bir yüzeydir.

### 8.6 Diğer sayfalar

- Hakkımızda: marka, yaklaşım, güven ve çalışma biçimi
- Nasıl Çalışır: müşteri yolculuğu
- Üretim Süreci: üretime hazırlık ve kontrol noktaları
- SSS: gerçek ve sınırlı cevaplar
- İletişim: net iletişim

---

## 9. Mühendislik şema standardı

Bu şemalar SVG tabanlı açıklama panolarıdır. Ölçekli teknik çizim gibi görünmemelidir. Her panelde:

- konsept/akış durumu
- proje özelinde doğrulama uyarısı
- gerçek değer yoksa no live values/veri bekleniyor durumu
- gereksiz İngilizce etiketlerin azaltılması
- okunabilir metin boyutu
- mobilde sade akış görünümü

### 9.1 Yük ve denge

Sabit “temiz su solda, enerji sağda” yerleşimi kullanılmaz. Doğru anlatım:

    Araç/model/varyant
            ↓
    Boş ve dolu kütle kalemleri
            ↓
    Aks sınırları ve payload
            ↓
    Ağırlık merkezi / yerleşim incelemesi
            ↓
    İnsan onayı

Araç seçilmeden denge sonucu üretilmez.

### 9.2 DC enerji

Genel anlatım:

    PV dizileri
       ↓
    Dizi/string koruması — yalnızca gerekiyorsa
       ↓
    PV DC ayırıcı
       ↓
    MPPT
       ↓
    MPPT çıkış koruması
       ↓
    Akü + BMS
       ↓
    Ana DC bara + shunt

DC baradan ayrı doğrulanan dallar:

- alternatör → DC–DC şarj
- inverter → AC dağıtım
- sigortalı DC yükler

Uyumluluk için en az şu alanlar gerekir:

- panel Voc
- panel Vmp
- panel Isc
- panel Imp
- seri/paralel bağlantı
- soğuk hava Voc
- akü nominal gerilimi ve kimyası
- MPPT maksimum PV gerilimi
- MPPT PV akımı/gücü
- maksimum batarya şarj akımı
- kablo kesiti, toplam gidiş–dönüş uzunluğu ve gerilim düşümü
- sigorta, ayırıcı, BMS ve üretici limitleri

Nominal panel wattı tek başına uyumluluk sonucu değildir.

### 9.3 Su sistemi

Temiz su akışı:

    Temiz su deposu
       ↓
    Havalandırma + seviye
       ↓
    Pompa giriş süzgeci
       ↓
    Gerekiyorsa içme suyu filtresi
       ↓
    Talep kontrollü pompa
       ↓
    Gerekiyorsa akümülatör/hidrofor
       ↓
    Manifold
       ├── soğuk hat
       └── boiler / sıcak su / karıştırma

Gri su ayrı akış olarak gösterilir:

    Armatürler → gri su hattı → gri su deposu → tahliye/servis

Temiz ve gri su aynı şema içinde tek depo gibi gösterilmez. Pnömatik boru ifadesi içme suyu hattı için kullanılmaz; doğru malzeme ve ürün datasheet’i seçilir.

### 9.4 Elektrik servis erişimi

Pozitif hat:

    Akü/BMS → ana sigorta/ayırıcı → pozitif DC bara → yükler

Negatif dönüş:

    Akü eksi → shunt → negatif DC bara → yük dönüşleri

MPPT, DC–DC, inverter ve DC yükler ayrı servis dallarıdır. AC ve DC güzergâhları birbirine gelişigüzel karıştırılmaz. Gerçek proje için erişim ölçüsü, havalandırma, kablo bükülme payı, etiketleme, ürün manuali ve koruma değerleri ayrıca doğrulanır.

---

## 10. Atölye karar mantığı

Atölye planlanan yapıda iki okuma sunabilir:

- Basit: müşteri sade seçim ve sonuç özeti görür.
- Uzman: teknik değerler, datasheet alanları, kurallar ve açık sorular görünür.

Temel müşteri akışı:

1. Alkovenli veya standart motokaravan
2. Marka/model/model yılı/varyant
3. Ölçü sınıfı ve doğrulanmış kullanılabilir alan
4. Yaşam düzeni ve kullanım amacı
5. Panel türü ve adedi
6. Seri/paralel bağlantı
7. MPPT
8. Akü kimyası, kapasitesi ve BMS
9. DC–DC, inverter ve koruma
10. Malzeme ve mobilya kütlesi
11. Temiz/gri su deposu, pompa, filtre ve manifold
12. Kontrol: manuel veya akıllı
13. 2.5D görünür yüzey önizlemesi
14. Teknik özet, kütle, enerji, su ve uyarılar
15. AI açıklaması
16. Rule engine kontrolü
17. İnsan incelemesi ve mühürleme

### Örnek hesap sınırı

4 × 205 W half-cut = 820 W yalnızca açıklama örneğidir. Bu sayı:

- ürün önerisi değildir
- araç uyumu değildir
- günlük üretim garantisi değildir
- MPPT seçimini tek başına belirlemez

Atölye gerçek ürün seçildiğinde datasheet’ten değerleri okuyup hesaplamalıdır. Eksik datasheet varsa değer uydurmaz.

AI’nin görevi:

- açıklamak
- eksik veriyi göstermek
- risk konusunda uyarmak
- uygun adayları önermek

AI’nin görevi değildir:

- teknik güvenlik kararını tek başına vermek
- ürünü datasheet olmadan uyumlu ilan etmek
- publish etmek
- fiyat veya sipariş onaylamak

Kesin uyumsuz kombinasyonlar rule engine tarafından engellenir. Nihai teknik ve ticari karar insan onayıyla verilir.

---

## 11. Görsel ve medya kuralları

- Aynı Skyvan araç dili ve amblem korunur.
- Teknik görsellerde Skyvan amblemi doğru, ölçülü ve okunabilir konumda olmalıdır.
- Kaynak görselin teknik içeriği logo eklemek için bozulmaz; mümkünse watermark bir sunum katmanı olarak eklenir.
- Teknik görsel Konsept çalışma olarak açıkça etiketlenir.
- Gerçek bir ürün kaydı ve üretici kaynağı yoksa marka/ürün kullanılıyor gibi yazılmaz.
- Renogy, Victron, SHURFLO veya başka markalar genel referans olarak anılabilir; Skyvan’da seçilmiş ürün gibi gösterilemez.
- Üretici ürünü için Admin ürün kaydı, datasheet ve kaynak binding’i gerekir.
- Fotoğraf, teknik şema ve 2.5D önizleme görevleri birbirine karıştırılmaz.
- Gizli teknik elemanlar 2.5D yaşam alanı önizlemesinde dekoratif şekilde gösterilmez.
- Görseller laptop ekranını aşacak kadar büyütülmez.
- next/image, doğru sizes, object-fit, containment ve alt metin kullanılır.

---

## 12. Admin, publish ve data governance

Public taraf yalnızca yayınlanmış ve onaylanmış içeriği gösterir.

Admin ilişkileri:

- Pages: metin, bölüm, locale, görünürlük, layout
- Media: görsel, alt text, etiket, focal point, kullanım
- SEO: title, description, canonical, hreflang, schema
- Menu/Footer: navigasyon
- Categories: teknik ürün grupları
- Products: gerçek MPPT, akü, inverter, pompa, filtre, kablo vb.
- Product Documents: datasheet/manual
- Source Registry/Binding: ürün–üretici kaynağı
- Publish/Audit: revision, snapshot, approval, rollback

Kritik işlemler audit ve approval gerektirir:

- publish
- datasheet onayı
- AI knowledge onayı
- kritik rule değişimi
- fiyat/offer/sipariş değişiklikleri

Public fallback içerik olabilir; ancak fallback sahte ürün veya sahte teknik sonuç içermemelidir.

---

## 13. Değişiklik yaparken korunacak dosya sınırları

Public mühendislik için başlıca dosyalar:

    app/(public)/components/PublicTechnicalDiagram.tsx
    app/(public)/components/PublicEditorialPage.tsx
    app/(public)/components/PublicEngineeringVisual.tsx
    app/(public)/lib/public-editorial-content.ts
    app/(public)/public-launch.css

Atölye tanıtımı için:

    app/(public)/components/PublicWorkshopStory.tsx
    app/(public)/lib/public-editorial-content.ts
    app/(public)/public-launch.css

Gerçek Atölye/configurator için:

    app/workshop/
    app/workshop/ConfiguratorClient.tsx
    app/workshop/transactions.ts

Mühendislik görsel düzenlemesi yapılırken app/workshop/ canlı çalışma yüzeyine gereksiz dokunulmaz. Admin ve database modülleri aynı batch’e açılmaz.

---

## 14. Mevcut batch durumu

Bu dosyanın oluşturulduğu çalışma turunda yapılan mühendislik düzeltmeleri:

- PublicTechnicalDiagram.tsx yeniden düzenlendi.
- Yük/denge şeması sabit araç yerleşimi olmaktan çıkarıldı.
- DC enerji şeması MPPT, BMS, ana DC bara/shunt ve ayrı DC–DC/inverter/DC yük dallarını açıklayacak şekilde yenilendi.
- Su şeması temiz su, sıcak su ve gri suyu ayrı servis yolları olarak yeniden düzenledi.
- Pompa giriş süzgeci ile içme suyu filtresi ayrıştırıldı.
- Servis şeması pozitif hat, negatif dönüş ve shunt mantığıyla yeniden kuruldu.
- Mühendislik hero bölümüne konsept/doğrulama durum kartı eklendi.
- Mühendislik açıklama metni boiler, gri su, opsiyonel combiner ve AC/DC ayrımını daha doğru anlatacak şekilde güncellendi.
- Premium koyu instrument-plate görsel dili, hareketli akış çizgileri ve mobil sade akış görünümü korunarak geliştirildi.

Bu değişiklikler validation, commit ve Vercel Preview kontrolünden geçmeden tamamlanmış kabul edilmez.

---

## 15. Validation checklist

### Kod

    npm run lint
    npx tsc --noEmit
    npm run verify:editorial-cms
    npm run build
    git diff --check

### Public rotalar

    /tr
    /en
    /tr/muhendislik
    /en/muhendislik
    /tr/workshop
    /en/workshop
    /tr/karavan-deneyimi
    /tr/hakkimizda

### Görsel

- Hero laptop viewport’a sığıyor mu?
- Header merkezde mi?
- Teknik plakalar sayfayı gereksiz büyütüyor mu?
- Metin ile görsel aynı ritimde mi?
- Işık teması okunaklı mı?
- Koyu tema gerçek sistem tercihini takip ediyor mu?
- 360 px genişlikte yatay taşma var mı?
- Mobil şema akışı okunuyor mu?
- Animasyon prefers-reduced-motion ile kapanıyor mu?
- Görsellerde yanlış veya fazla iddia var mı?

### Teknik içerik

- Ölçü olmayan şema ölçülü çizim gibi görünmüyor mu?
- Ürün datasheet’i yoksa ürün seçilmiş gibi görünmüyor mu?
- Panel wattı tek başına uyumluluk sonucu gibi yazılmıyor mu?
- Combiner koşullu gösteriliyor mu?
- Akü/BMS/koruma/DC bara/shunt ayrımı korunuyor mu?
- Temiz/gri su ayrımı korunuyor mu?
- Boiler ve sıcak su yolu unutulmamış mı?
- AI açıklıyor, rule engine engelliyor, insan onaylıyor mu?

---

## 16. GitHub ve Vercel handoff

Önce çalışma ağacını kontrol et:

    git status --short --branch
    git diff --stat
    git diff --check
    git fetch origin --prune
    git rev-list --left-right --count HEAD...origin/public-workshop-retention

Kullanıcının mevcut değişiklikleri varsa onları ezme. Yalnızca bu batch’e ait dosyaları stage et. İlgisiz değişiklikleri aynı commit’e zorla dahil etme.

Örnek:

    git add 'app/(public)/components/PublicTechnicalDiagram.tsx' \
      'app/(public)/components/PublicEditorialPage.tsx' \
      'app/(public)/lib/public-editorial-content.ts' \
      'app/(public)/public-launch.css' \
      docs/SKYVAN-CALISMA-SISTEMI-TRANSFER.md
    git commit -m "refine engineering decision plates"
    git push origin public-workshop-retention

Push sonrasında Vercel Preview’ın:

- doğru branch’ten geldiği
- yeni commit’i kullandığı
- build durumunun READY olduğu
- /tr/muhendislik ve /tr/workshop rotalarının açıldığı

kontrol edilir.

Eski Preview linkleri kullanılmaz. Her zaman son deployment URL’si ve son commit doğrulanır. Vercel Deployment Protection varsa doğrudan link login sayfasına düşebilir; bu durum uygulamanın bozuk olduğu anlamına gelmez.

---

## 17. Yeni sohbete başlama metni

Başka bir sohbet veya hesapta aşağıdaki metin başlangıç bağlamı olarak kullanılabilir:

    Skyvan projesine kaldığımız yerden devam ediyoruz.

    Repo: https://github.com/Khalel-YL/skyvan
    Aktif branch: public-workshop-retention
    Hosting: GitHub bağlantılı Vercel Preview
    Local geliştirme: npm run dev → 0.0.0.0:3001

    İlk olarak repo kökündeki şu dosyaları oku:
    - AGENTS.md
    - PROJECT_MANIFEST.md
    - docs/SKYVAN-CALISMA-SISTEMI-TRANSFER.md
    - docs/engineering/02_ENGINEERING_RULES.md
    - docs/engineering/00_PROJECT_OVERVIEW.md
    - docs/engineering/01_ARCHITECTURE.md
    - docs/engineering/architecture/
    - docs/engineering/knowledge/BUSINESS_DOMAIN.md
    - docs/system-rules/
    - .agents/

    Çalışmaya başlamadan önce:
    1. git status --short --branch
    2. git log -5 --oneline
    3. git fetch origin --prune
    4. local HEAD ve origin branch eşitliğini kontrol et
    5. mevcut kullanıcı değişikliklerini koru

    Skyvan çalışma kuralları:
    - Mevcut sistemi silme veya yeniden kurma.
    - Fake seed, sahte ürün, hayali datasheet, geçici bypass veya hayali teknik değer kullanma.
    - Admin, AI, Workshop, Integration faz sırasını bozma.
    - Public yalnızca yayınlanmış/onaylanmış veriyi göstermeli.
    - AI açıklar, uyarır ve önerir; nihai teknik/ticari kararı vermez.
    - Teknik uyumsuzluk rule engine tarafından engellenir; insan onayı zorunludur.
    - Atölye public sayfası canlı configurator/fiyat/teknik onay varmış gibi konuşmaz.
    - Mühendislik şemaları konsept açıklamasıdır; ölçülü çizim veya montaj onayı değildir.
    - Panel wattı tek başına uyumluluk değildir; Voc/Vmp/Isc/Imp, MPPT sınırı, akü, BMS, kablo, koruma ve araç verisi birlikte kontrol edilir.
    - Temiz su, sıcak su ve gri su ayrı okunur.
    - Mevcut marka, tipografi, animasyon ve responsive dili korunarak iyileştirme yapılır.
    - Önce kısa dosya planı ver, sonra yalnızca gerekli dosyalara dokun, validation yap, Vercel Preview’ı kontrol et.

    Devam noktası:
    Mühendislik teknik plakaları ve premium durum kartı bu batch’te yeniden düzenlendi. Önce lint, TypeScript, CMS doğrulaması, build ve mobil/desktop browser QA tamamlanmalı; sonra değişiklikler GitHub’a push edilip son Vercel Preview doğrulanmalıdır.

---

## 18. Son karar ilkesi

Skyvan’da önce veri doğruluğu, sonra sistem bütünlüğü, sonra stabil çalışma, sonra bakım kolaylığı, sonra görsel kalite gelir. Premium tasarım bu sıralamayı gizlemez; doğru bilgiyi daha sade, daha güvenilir ve daha güzel gösterir.

Bir ekran güzel görünmesine rağmen:

- verisi kaynaklanmamışsa
- teknik sınırı belirsizse
- kullanıcıyı yanlış kesinliğe götürüyorsa
- Admin ve onay sistemiyle bağlanamıyorsa

tamamlanmış sayılmaz.

**Skyvan çalışma standardı:** Gerçek veri + açık sınır + kontrollü karar + premium sunum.

