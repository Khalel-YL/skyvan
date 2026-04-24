# Skyvan Master Context

## Proje Kimliği
Proje adı: Skyvan

Skyvan bir karavan işletim sistemi / platformudur.
Workshop bu sistemin tamamı değil, yalnızca bir modülüdür.

## Faz Sırası
Geliştirme sırası sabittir ve değiştirilemez:

1. Admin
2. AI
3. Workshop
4. Integration / Stabilization

## Temel Çalışma Felsefesi
- Her yeni aşama önceki aşamaların tamamını baz alır
- Amaç hata payını azaltmak ve sistemi hızlıca devreye almaktır
- Gereksiz gösteriş, rastgele özellik ve sistem dışı genişleme yapılmaz
- Yalnızca sistem optimizasyonu, stabilite, bakım kolaylığı ve üretime geçiş açısından gerçekten gerekli geliştirmeler eklenir
- Mevcut proje silinip yeniden kurulmaz
- Aynı repo üzerinde kontrollü ve üretime uygun şekilde ilerlenir
- Tasarım dili Apple / Tesla çizgisinde kalır
- Mevcut yapı geliştirilir, tamamen farklı bir tasarım diline geçilmez

## Admin Hakkında Sabit Kararlar
- İlk kurulan ve olgunlaştırılan katman Admin’dir
- AI, admin içindeki kontrollü bilgi ve onay katmanından beslenecektir
- Workshop daha sonra kurulacaktır
- Ürün kategorileri sistemin en kritik omurgalarından biridir
- Çoklu dil desteği olacaktır
- Dil sistemi otomatik tahmin + kullanıcı seçimi mantığında kurulmalıdır
- Sistem sadece IP bazlı dil seçimine bağlı kalmayacaktır

## Workshop Hakkında Sabit Bilgiler
Skyvan’ın müşteri akışı şu omurga üzerinde ilerler:

- araç seçimi
- proje oluşturma
- ürün kategorilerinden seçim
- canlı görsel önizleme
- teknik doğrulama
- mühürleme
- sade public takip sayfası

## Ana Konfigürasyon Ekranı
Workshop ana konfigürasyon ekranı 3 parçalıdır:

- sol: ürün seçim alanı
- orta: 2.5D preview
- alt: teknik özet + AI bilgileri

## 2.5D Preview Kuralları
2.5D preview’de yalnızca görünen yüzeyler yer alır:

- ahşap / mobilya yüzeyleri
- pencere
- kapı
- banyo
- koltuk
- masa
- yatak
- varsa alkoven yatak

Aşağıdaki teknik elemanlar preview’de görünmez:

- MPPT
- inverter
- akü
- kablo
- elektrik tesisatı
- su tesisatı
- combiner box
- sigorta
- teknik bağlantılar

## Teknik Karar Sistemi
Teknik karar mekanizması şu kaynaklara dayanır:

- datasheet
- ürün manuelleri
- uzman bilgisi
- rule engine

AI’nin rolü:
- açıklamak
- uyarmak
- önermek

AI tek başına nihai teknik karar vermez.

Teknik uyumsuz kombinasyonlar sistem tarafından engellenir.

## Mühür Sonrası
Mühür sonrası müşteri tarafında yalnızca sade bir public takip sayfası olacaktır.
Detaylı workshop twin mantığı olmayacaktır.