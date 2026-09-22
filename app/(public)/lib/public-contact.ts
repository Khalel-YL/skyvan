export const publicContact = {
  legalName: "Gökyüzü Teknik Otomotiv",
  phone: {
    display: "+90 536 051 15 74",
    href: "tel:+905360511574",
  },
  whatsapp: {
    href: "https://wa.me/905360511574",
  },
  email: {
    display: "info@skyvan.com.tr",
    href: "mailto:info@skyvan.com.tr",
  },
  workingHours: "09:00–17:30",
} as const;

export const publicSocialLinks = [
  {
    key: "instagram",
    label: { tr: "Instagram", en: "Instagram" },
    href: null,
  },
  {
    key: "youtube",
    label: { tr: "YouTube", en: "YouTube" },
    href: null,
  },
  {
    key: "facebook",
    label: { tr: "Facebook", en: "Facebook" },
    href: null,
  },
  {
    key: "linkedin",
    label: { tr: "LinkedIn", en: "LinkedIn" },
    href: null,
  },
] as const;
