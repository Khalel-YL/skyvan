# Skyvan Current Stable State

## Aktif Faz
ADMIN

## Stabil ve Dokunulmayacak Modüller
- Admin shell / layout / nav
- Categories
- Products core
- Product Documents
- Models
- Packages
- Datasheet Merkezi
- Dashboard + AI radar
- Rules (kapalı, tekrar açılmayacak)
- Manufacturer Source Registry
- Product Source Binding

## Leads Durumu
- Leads sayfası açılıyor
- Runtime error yok
- Derleme kırığı yok
- Lead oluşturma şu an bilinçli olarak kapalı
- Sebep: en az bir build version kaydı gerekliliği

Bu davranış doğru kabul edilir.
Bu bir bug değildir.
Bu bir dependency lock durumudur.

## Offers Durumu
- Offer akışı lead bağımlıdır
- `offers.leadId` gerçek şemada zorunludur
- Lead açılmadan Offer doğal şekilde açılamaz

## Dependency Zinciri
Doğru zincir:

Build Version -> Lead -> Offer

Bu zincir bozulmayacaktır.

Aşağıdakiler kullanılmayacaktır:
- fake seed
- geçici bypass
- zorunlu alan kırma
- lead bağını koparma
- nullable ile sahte rahatlatma

## Şu Anki Kritik İş
Build / Build Version dependency unlock mini-batch

## Bu Mini-Batch’in Amacı
- gerçek şemaya sadık kalmak
- en az bir geçerli build version üretilebilir hale gelmek
- Leads modülünü doğal şekilde açmak
- sonra Offers tarafını yeniden test etmek

## Geliştirme Notu
Yeni sohbette veya yeni batch’te Build / Build Version hattı analiz edilmeden
Offers tarafına geri dönülmeyecektir.