import "server-only";

export type DashboardMetric = {
  label: string;
  value: string;
  hint: string;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  health: {
    database: "online" | "degraded";
    note: string;
  };
};

export async function getAdminDashboardData(): Promise<DashboardData> {
  return {
    metrics: [
      { label: "Modeller", value: "-", hint: "Statik mod" },
      { label: "Paketler", value: "-", hint: "Statik mod" },
      { label: "Ürünler", value: "-", hint: "Statik mod" },
      { label: "Kurallar", value: "-", hint: "Statik mod" },
      { label: "İçerikler", value: "-", hint: "Statik mod" },
      { label: "Medya", value: "-", hint: "Statik mod" },
      { label: "Müşteri Adayları", value: "-", hint: "Statik mod" },
    ],
    health: {
      database: "degraded",
      note: "Genel bakış statik modda çalışıyor.",
    },
  };
}
