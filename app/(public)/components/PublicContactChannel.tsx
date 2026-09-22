import { Clock3, Mail, MessageCircle, Phone } from "lucide-react";

import { publicContact } from "../lib/public-contact";
import type { PublicLocale } from "../lib/public-routing";

const copy = {
  tr: {
    eyebrow: "Doğrudan iletişim",
    heading: "İlk görüşmeyi telefon veya WhatsApp üzerinden başlatın.",
    body: "Gökyüzü Teknik Otomotiv, yeni proje görüşmeleri için doğrudan iletişim kanallarını kullanır. Araç fikrinizi, yolculuk biçiminizi ve yaşam önceliklerinizi paylaşmanız yeterli.",
    phone: "Telefon",
    whatsapp: "WhatsApp",
    email: "E-posta",
    hours: "Çalışma saatleri",
  },
  en: {
    eyebrow: "Direct contact",
    heading: "Begin the conversation by phone or WhatsApp.",
    body: "Gökyüzü Teknik Otomotiv is available for new project conversations through direct contact. Share your vehicle idea, travel style and living priorities to begin.",
    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "Email",
    hours: "Business hours",
  },
} as const;

export function PublicContactChannel({ locale }: { locale: PublicLocale }): React.JSX.Element {
  const labels = copy[locale];

  return <section className="sv-contact-channel" aria-labelledby="public-contact-channel-title">
    <div className="sv-contact-channel-intro">
      <p className="sv-eyebrow">{labels.eyebrow}</p>
      <h2 id="public-contact-channel-title">{labels.heading}</h2>
      <p>{labels.body}</p>
      <strong>{publicContact.legalName}</strong>
    </div>
    <div className="sv-contact-channel-grid">
      <a className="sv-contact-channel-item" href={publicContact.phone.href}>
        <span className="sv-contact-channel-icon"><Phone size={18} aria-hidden="true" /></span>
        <span><small>{labels.phone}</small><strong>{publicContact.phone.display}</strong></span>
      </a>
      <a className="sv-contact-channel-item" href={publicContact.whatsapp.href} target="_blank" rel="noreferrer">
        <span className="sv-contact-channel-icon"><MessageCircle size={18} aria-hidden="true" /></span>
        <span><small>{labels.whatsapp}</small><strong>{publicContact.phone.display}</strong></span>
      </a>
      <a className="sv-contact-channel-item" href={publicContact.email.href}>
        <span className="sv-contact-channel-icon"><Mail size={18} aria-hidden="true" /></span>
        <span><small>{labels.email}</small><strong>{publicContact.email.display}</strong></span>
      </a>
      <div className="sv-contact-channel-item sv-contact-channel-item-static">
        <span className="sv-contact-channel-icon"><Clock3 size={18} aria-hidden="true" /></span>
        <span><small>{labels.hours}</small><strong>{publicContact.workingHours}</strong></span>
      </div>
    </div>
  </section>;
}
