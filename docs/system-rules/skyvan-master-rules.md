# Skyvan Master Rules

## Dil
Tüm içerikler Türkçe hazırlanır.

## Ana Sıra
Ana sıra asla değişmez:

1. Admin
2. AI
3. Workshop
4. Integration / Stabilization

## Genel Çalışma Kuralları
- Mevcut local gerçekliği temel referanstır
- Repo, local ile eşitse güvenilir referans olarak kullanılabilir
- Hayali dosya yasaktır
- Hayali kolon yasaktır
- Hayali akış yasaktır
- Partial patch yasaktır
- “şurayı değiştir” mantığında belirsiz yönlendirme yapılmaz
- Sadece değişecek dosyaların tam içeriği verilir
- Son çalışan onaylı state stable referanstır
- Timeout veya karışıklık durumunda son stabil çalışan kod baz alınır
- Durduk yere mimari değişiklik yapılmaz
- Büyük refactor yapılmaz
- İsim/klasör değiştirme yapılmaz
- Gereksiz özellik eklenmez
- Üretime uygun, stabil, sade ve kompakt çözümler tercih edilir

## Teknik Sabitler
- `@/db/db`
- `@/db/schema`
- ikinci db klasörü açılmaz
- `useActionState` korunur
- `async searchParams` korunur
- kör migration yapılmaz
- gerekiyorsa kontrollü SQL önce açıkça belirtilir
- Admin UI dark, kompakt ve operasyonel olur
- Büyük bloklar kullanılmaz
- Segmentli filtre mantığı korunur
- Self-contained modül yaklaşımı korunur

## Çalışma Biçimi
Her batch şu sırayla ilerler:

1. kısa ve net dosya planı
2. sadece değişecek dosyalar
3. her dosyanın tam içeriği
4. kısa uygulama notu
5. ekran görüntüsü / log bekleme

## Geliştirme Disiplini
- Aynı anda çok fazla modül açılmaz
- Aktif iş hattı dışındaki stabil modüllere dokunulmaz
- Yeni geliştirme ile stabilization ayrı düşünülür
- Dependency zincirleri görünür ve korunmuş olmalıdır
- Fake seed, geçici bypass, zorunlu alan kırma, sahte nullable çözümü kullanılmaz
- Gerçek şemaya sadakat korunur

## Sistem Öncelikleri
Her zaman şu sıraya göre düşünülür:

1. veri bütünlüğü
2. dependency doğruluğu
3. stabil çalışma
4. bakım kolaylığı
5. operasyonel sadelik
6. görsel düzen

## Kod Üretim Prensibi
- Kod mevcut repo gerçekliğiyle uyumlu olmalıdır
- Değişiklikler minimum riskli olmalıdır
- Aynı modül içinde ortak pattern’ler korunmalıdır
- Validation, normalize, trim ve parse mantıkları tutarlı olmalıdır
- Action response yapıları mümkün olduğunca standart tutulmalıdır

## Skyvan Sistem Gerçeği
- Skyvan bir karavan OS’tir
- Workshop sadece bir modüldür
- AI açıklayıcı ve önerici katmandır
- Teknik karar sistemi admin kontrollü veri, belge ve kurallarla desteklenir
- Teknik uyumsuzluklar sistem tarafından engellenir