type PublicTechnicalDiagramKind = "load-aero" | "solar-electrical" | "water-service" | "service-access";

type DiagramCopy = {
  label: string;
  title: string;
  note: string;
  route: string;
  nodes: readonly string[];
  ariaLabel: string;
};

const copy: Record<"tr" | "en", Record<PublicTechnicalDiagramKind, DiagramCopy>> = {
  tr: {
    "load-aero": {
      label: "YÜK VE DENGE",
      title: "Sonuç, araç verisiyle birlikte okunur.",
      note: "Bu akış; araç, kütle ve aks verisi seçildikten sonra oluşacak inceleme mantığını gösterir. Ölçülü yerleşim değildir.",
      route: "Araç verisi → yük kalemleri → aks kontrolü → insan onayı",
      nodes: ["Araç referansı", "Yük kalemleri", "Aks sınırları", "Karar kaydı"],
      ariaLabel: "Skyvan araç kütlesi ve denge değerlendirme akışı",
    },
    "solar-electrical": {
      label: "DC ENERJİ",
      title: "Kaynak, koruma ve depolama ayrı doğrulanır.",
      note: "Şema, ürün seçimi değildir. Dizi koruması ve combiner yalnızca gerçek panel bağlantısı ile üretici ve uygulama şartları gerektiriyorsa kullanılır.",
      route: "PV dizileri → koruma → MPPT → akü/BMS → DC bara",
      nodes: ["PV dizileri", "Dizi koruması", "PV ayırıcı", "MPPT", "Akü + BMS", "DC bara + shunt"],
      ariaLabel: "Skyvan DC enerji mimarisi ve doğrulama akışı",
    },
    "water-service": {
      label: "SU SERVİSİ",
      title: "Temiz ve gri su, ayrı servis yolları olarak okunur.",
      note: "Temiz su, sıcak su ve gri su akışları ürün, araç ve uygulama şartlarıyla doğrulanır; şema ölçülü tesisat veya montaj onayı değildir.",
      route: "Temiz su → basınç → dağıtım → kullanım → gri su / tahliye",
      nodes: ["Temiz su deposu", "Havalandırma + seviye", "Giriş süzgeci", "Pompa + akümülatör", "Manifold / boiler", "Gri su hattı", "Gri su deposu"],
      ariaLabel: "Skyvan temiz su, sıcak su ve gri su servis akışı",
    },
    "service-access": {
      label: "SERVİS ERİŞİMİ",
      title: "Koruma, ölçüm ve ayırma aynı servis mantığında buluşur.",
      note: "Servis paneli; gerçek ürünler, kablo kesitleri, koruma değerleri ve araç içindeki erişim ölçüleriyle proje özelinde doğrulanır.",
      route: "Akü/BMS → koruma → bara → yükler; eksi dönüş → shunt",
      nodes: ["Akü + BMS", "Ana sigorta / ayırıcı", "DC bara", "Shunt / eksi dönüş"],
      ariaLabel: "Skyvan servis paneli ve DC koruma erişim akışı",
    },
  },
  en: {
    "load-aero": {
      label: "LOAD AND BALANCE",
      title: "The result is read with the vehicle data.",
      note: "This flow shows the review logic after vehicle, mass and axle data are selected. It is not a scaled layout.",
      route: "Vehicle data → load items → axle check → human approval",
      nodes: ["Vehicle reference", "Load items", "Axle limits", "Decision record"],
      ariaLabel: "Skyvan vehicle mass and balance review flow",
    },
    "solar-electrical": {
      label: "DC ENERGY",
      title: "Source, protection and storage are verified separately.",
      note: "This is not a product selection. Array protection and a combiner are used only when the actual array and manufacturer/application requirements call for them.",
      route: "PV arrays → protection → MPPT → battery/BMS → DC bus",
      nodes: ["PV arrays", "Array protection", "PV isolator", "MPPT", "Battery + BMS", "DC bus + shunt"],
      ariaLabel: "Skyvan DC energy architecture and verification flow",
    },
    "water-service": {
      label: "WATER SERVICE",
      title: "Fresh and grey water follow separate service paths.",
      note: "Fresh water, hot water and grey water are verified against the product, vehicle and installation conditions; this is not a scaled plumbing or installation approval.",
      route: "Fresh water → pressure → distribution → use → grey water / drain",
      nodes: ["Fresh tank", "Vent + level", "Inlet strainer", "Pump + accumulator", "Manifold / boiler", "Grey-water line", "Grey tank"],
      ariaLabel: "Skyvan fresh water, hot water and grey water service flow",
    },
    "service-access": {
      label: "SERVICE ACCESS",
      title: "Protection, measurement and isolation share one service logic.",
      note: "The service panel is verified against real products, cable sizes, protection values and vehicle-specific access dimensions.",
      route: "Battery/BMS → protection → bus → loads; negative return → shunt",
      nodes: ["Battery + BMS", "Main fuse / isolator", "DC bus", "Shunt / negative return"],
      ariaLabel: "Skyvan service panel and DC protection access flow",
    },
  },
};

type FlowTone = "gold" | "water" | "neutral";

function FlowBlock({
  x,
  y,
  width = 148,
  index,
  label,
  detail,
  tone = "gold",
  optional = false,
}: {
  x: number;
  y: number;
  width?: number;
  index: string;
  label: string;
  detail: string;
  tone?: FlowTone;
  optional?: boolean;
}) {
  const lines = label.split("\n");

  return (
    <g className={`sv-plate-flow-block sv-plate-flow-block-${tone}${optional ? " is-optional" : ""}`} transform={`translate(${x} ${y})`}>
      <rect width={width} height="108" rx="16" className="sv-plate-flow-block-surface" />
      <text x="17" y="23" className="sv-plate-flow-block-index">{index}</text>
      {optional ? <text x={width - 16} y="23" textAnchor="end" className="sv-plate-flow-block-optional">OPS.</text> : null}
      {lines.map((line, lineIndex) => (
        <text key={`${line}-${lineIndex}`} x="17" y={52 + lineIndex * 17} className="sv-plate-flow-block-title">{line}</text>
      ))}
      <text x="17" y={lines.length > 1 ? 92 : 76} className="sv-plate-flow-block-detail">{detail}</text>
    </g>
  );
}

function FlowPath({ d, tone = "gold" }: { d: string; tone?: FlowTone }) {
  return (
    <g className={`sv-plate-flow sv-plate-flow-${tone}`}>
      <path d={d} className="sv-plate-flow-path" />
      <circle r="4" className="sv-plate-flow-dot">
        <animateMotion dur="3.8s" repeatCount="indefinite" path={d} />
      </circle>
    </g>
  );
}

function PlateStage({ children }: { children: React.ReactNode }) {
  return (
    <g className="sv-plate-stage">
      <rect x="52" y="92" width="976" height="416" rx="26" className="sv-plate-stage-surface" />
      <path d="M78 151 H1002" className="sv-plate-stage-rule" />
      {children}
    </g>
  );
}

function StageHeader({ left, right }: { left: string; right: string }) {
  return (
    <>
      <text x="82" y="127" className="sv-plate-stage-label">{left}</text>
      <text x="998" y="127" textAnchor="end" className="sv-plate-stage-label">{right}</text>
    </>
  );
}

function DataChip({ x, label }: { x: number; label: string }) {
  return (
    <g className="sv-plate-data-chip" transform={`translate(${x} 164)`}>
      <rect width="92" height="27" rx="13.5" />
      <text x="46" y="17" textAnchor="middle">{label}</text>
    </g>
  );
}

function LoadBalancePlate({ nodes, ariaLabel, route }: { nodes: readonly string[]; ariaLabel: string; route: string }) {
  return (
    <svg viewBox="0 0 1080 560" role="img" aria-label={ariaLabel} className="sv-plate-svg">
      <title>{ariaLabel}</title>
      <desc>{route}</desc>
      <StageHeader left="PROJEYE ÖZEL İNCELEME" right="MODEL / AKS / PAYLOAD" />
      <PlateStage>
        <text x="82" y="184" className="sv-plate-stage-subtitle">KÜTLE KARAR AKIŞI</text>
        <text x="998" y="184" textAnchor="end" className="sv-plate-stage-muted">SCALE NOT APPLICABLE</text>
        <FlowBlock x={84} y={226} index="01" label={nodes[0]} detail="MODEL / VARYANT" />
        <FlowBlock x={320} y={226} index="02" label={nodes[1]} detail="EMPTY / FULL MASS" />
        <FlowBlock x={556} y={226} index="03" label={nodes[2]} detail="AXLE / PAYLOAD" />
        <FlowBlock x={792} y={226} index="04" label={nodes[3]} detail="HUMAN REVIEW" tone="neutral" />
        <FlowPath d="M232 280 H320" />
        <FlowPath d="M468 280 H556" />
        <FlowPath d="M704 280 H792" />
        <rect x="84" y="382" width="916" height="82" rx="18" className="sv-plate-state" />
        <text x="108" y="412" className="sv-plate-state-label">SONUÇ DURUMU / REVIEW STATE</text>
        <text x="108" y="441" className="sv-plate-state-title">VERİ SEÇİLMEDEN DENGE SONUCU ÜRETİLMEZ</text>
        <text x="974" y="441" textAnchor="end" className="sv-plate-state-detail">Araç ve gerçek ürün verisi bekleniyor</text>
      </PlateStage>
    </svg>
  );
}

function SolarPlate({ nodes, ariaLabel, route }: { nodes: readonly string[]; ariaLabel: string; route: string }) {
  const x = [76, 232, 388, 544, 700, 856];

  return (
    <svg viewBox="0 0 1080 560" role="img" aria-label={ariaLabel} className="sv-plate-svg">
      <title>{ariaLabel}</title>
      <desc>{route}</desc>
      <StageHeader left="DATASHEET → SİSTEM SINIRI" right="DC ENERGY / 02" />
      <PlateStage>
        <text x="82" y="184" className="sv-plate-stage-subtitle">ÖNCE VERİ, SONRA ÜRÜN UYUMU</text>
        <text x="998" y="184" textAnchor="end" className="sv-plate-stage-muted">NO LIVE VALUES</text>
        <DataChip x={82} label="Voc" />
        <DataChip x={184} label="Vmp" />
        <DataChip x={286} label="Isc" />
        <DataChip x={388} label="Imp" />
        <DataChip x={490} label="AKÜ V" />
        <DataChip x={592} label="MPPT A" />
        <FlowBlock x={x[0]} y={230} index="01" label={nodes[0]} detail="SOURCE" />
        <FlowBlock x={x[1]} y={230} index="02" label={nodes[1]} detail="WHEN REQUIRED" optional />
        <FlowBlock x={x[2]} y={230} index="03" label={nodes[2]} detail="ISOLATION" />
        <FlowBlock x={x[3]} y={230} index="04" label={nodes[3]} detail="TRACKING / CHARGE" />
        <FlowBlock x={x[4]} y={230} index="05" label={nodes[4]} detail="BATTERY SAFETY" />
        <FlowBlock x={x[5]} y={230} index="06" label={nodes[5]} detail="DISTRIBUTION" tone="neutral" />
        <FlowPath d="M224 284 H232" />
        <FlowPath d="M380 284 H388" />
        <FlowPath d="M536 284 H544" />
        <FlowPath d="M692 284 H700" />
        <FlowPath d="M848 284 H856" />
        <text x="856" y="382" className="sv-plate-branch-label">AYRI DOĞRULAMA DALLARI</text>
        <FlowBlock x={548} y={400} width={132} index="A" label="DC–DC şarj" detail="ALTERNATÖR" tone="neutral" />
        <FlowBlock x={704} y={400} width={132} index="B" label="İnverter / AC" detail="AYRI HAT" tone="neutral" />
        <FlowBlock x={860} y={400} width={132} index="C" label="DC yükler" detail="SİGORTALI" tone="neutral" />
        <FlowPath d="M930 338 V370 H614 V400" tone="neutral" />
        <FlowPath d="M930 338 V400" tone="neutral" />
        <FlowPath d="M930 338 V370 H926 V400" tone="neutral" />
      </PlateStage>
    </svg>
  );
}

function WaterPlate({ nodes, ariaLabel, route }: { nodes: readonly string[]; ariaLabel: string; route: string }) {
  return (
    <svg viewBox="0 0 1080 560" role="img" aria-label={ariaLabel} className="sv-plate-svg">
      <title>{ariaLabel}</title>
      <desc>{route}</desc>
      <StageHeader left="TEMİZ / SICAK / GRİ SU" right="WATER SERVICE / 03" />
      <PlateStage>
        <text x="82" y="184" className="sv-plate-stage-subtitle">BASINÇLI TEMİZ SU AKIŞI</text>
        <text x="998" y="184" textAnchor="end" className="sv-plate-stage-muted">SEPARATE DRAIN PATH</text>
        <FlowBlock x={78} y={218} width={154} index="01" label={nodes[0]} detail="TANK / MASS" tone="water" />
        <FlowBlock x={248} y={218} width={154} index="02" label={nodes[1]} detail="VENT / SENSOR" tone="water" />
        <FlowBlock x={418} y={218} width={154} index="03" label={nodes[2]} detail="PUMP INLET" tone="water" />
        <FlowBlock x={588} y={218} width={154} index="04" label={nodes[3]} detail="PRESSURE" tone="water" optional />
        <FlowBlock x={758} y={218} width={244} index="05" label={nodes[4]} detail="HOT / COLD DISTRIBUTION" tone="water" />
        <FlowPath d="M232 272 H248" tone="water" />
        <FlowPath d="M402 272 H418" tone="water" />
        <FlowPath d="M572 272 H588" tone="water" />
        <FlowPath d="M742 272 H758" tone="water" />
        <path d="M880 326 V352 H178 V382" className="sv-plate-secondary-flow" />
        <text x="82" y="371" className="sv-plate-branch-label">KULLANIMDAN SONRA / GRİ SU</text>
        <FlowBlock x={90} y={382} width={178} index="06" label="Armatürler" detail="USE POINTS" tone="neutral" />
        <FlowBlock x={326} y={382} width={178} index="07" label={nodes[5]} detail="DRAIN ROUTE" tone="neutral" />
        <FlowBlock x={562} y={382} width={178} index="08" label={nodes[6]} detail="TANK / ACCESS" tone="neutral" />
        <FlowBlock x={798} y={382} width={178} index="09" label="Tahliye + servis" detail="MAINTENANCE" tone="neutral" />
        <FlowPath d="M268 436 H326" tone="neutral" />
        <FlowPath d="M504 436 H562" tone="neutral" />
        <FlowPath d="M740 436 H798" tone="neutral" />
      </PlateStage>
    </svg>
  );
}

function ServiceAccessPlate({ nodes, ariaLabel, route }: { nodes: readonly string[]; ariaLabel: string; route: string }) {
  return (
    <svg viewBox="0 0 1080 560" role="img" aria-label={ariaLabel} className="sv-plate-svg">
      <title>{ariaLabel}</title>
      <desc>{route}</desc>
      <StageHeader left="BATARYA KORUMASI / ÖLÇÜM" right="SERVICE ACCESS / 04" />
      <PlateStage>
        <text x="82" y="184" className="sv-plate-stage-subtitle">POZİTİF HAT</text>
        <text x="82" y="372" className="sv-plate-stage-subtitle">NEGATİF DÖNÜŞ</text>
        <FlowBlock x={84} y={208} width={190} index="01" label={nodes[0]} detail="SOURCE / BMS" />
        <FlowBlock x={322} y={208} width={190} index="02" label={nodes[1]} detail="SHORT-CIRCUIT PROTECTION" />
        <FlowBlock x={560} y={208} width={190} index="03" label={nodes[2]} detail="POSITIVE DISTRIBUTION" tone="neutral" />
        <FlowBlock x={84} y={396} width={190} index="01N" label="Akü eksi" detail="RETURN SOURCE" tone="neutral" />
        <FlowBlock x={322} y={396} width={190} index="04" label={nodes[3]} detail="ALL MEASURED RETURN" tone="water" />
        <FlowBlock x={560} y={396} width={190} index="03N" label="Eksi DC bara" detail="NEGATIVE DISTRIBUTION" tone="neutral" />
        <FlowPath d="M274 262 H322" />
        <FlowPath d="M512 262 H560" />
        <FlowPath d="M274 450 H322" tone="neutral" />
        <FlowPath d="M512 450 H560" tone="neutral" />
        <rect x="806" y="208" width="192" height="296" rx="20" className="sv-plate-service-stack" />
        <text x="830" y="240" className="sv-plate-service-stack-label">SERVİS PANELİ</text>
        <text x="830" y="272" className="sv-plate-service-stack-title">AYRI HATLAR</text>
        <text x="830" y="314" className="sv-plate-service-stack-copy">MPPT</text>
        <text x="830" y="344" className="sv-plate-service-stack-copy">DC–DC ŞARJ</text>
        <text x="830" y="374" className="sv-plate-service-stack-copy">İNVERTER / AC</text>
        <text x="830" y="404" className="sv-plate-service-stack-copy">DC YÜKLER</text>
        <path d="M750 262 H806" className="sv-plate-secondary-flow" />
        <path d="M750 450 H806" className="sv-plate-secondary-flow" />
        <text x="830" y="464" className="sv-plate-service-stack-foot">AC / DC GÜZERGÂHLARI AYRI</text>
      </PlateStage>
    </svg>
  );
}

function MobilePlateRail({ nodes, route, ariaLabel }: { nodes: readonly string[]; route: string; ariaLabel: string }) {
  return (
    <div className="sv-plate-mobile" role="img" aria-label={ariaLabel}>
      <span className="sv-plate-mobile-route">{route}</span>
      <div className="sv-plate-mobile-flow">
        {nodes.map((node, index) => (
          <div className="sv-plate-mobile-step" key={`${node}-${index}`}>
            <span className="sv-plate-mobile-marker" aria-hidden="true"><b>{String(index + 1).padStart(2, "0")}</b></span>
            <span className="sv-plate-mobile-copy"><strong>{node}</strong><small>{index === 0 ? "BAŞLANGIÇ" : index === nodes.length - 1 ? "SONRAKİ KATMAN" : "DOĞRULAMA"}</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicTechnicalDiagram({ kind, locale }: { kind: PublicTechnicalDiagramKind; locale: "tr" | "en" }): React.JSX.Element {
  const item = copy[locale][kind];
  const renderPlate = kind === "solar-electrical"
    ? <SolarPlate nodes={item.nodes} ariaLabel={item.ariaLabel} route={item.route} />
    : kind === "water-service"
      ? <WaterPlate nodes={item.nodes} ariaLabel={item.ariaLabel} route={item.route} />
      : kind === "load-aero"
        ? <LoadBalancePlate nodes={item.nodes} ariaLabel={item.ariaLabel} route={item.route} />
        : <ServiceAccessPlate nodes={item.nodes} ariaLabel={item.ariaLabel} route={item.route} />;

  return (
    <figure className={`sv-technical-plate sv-technical-plate-${kind}`} data-diagram-kind={kind}>
      <div className="sv-plate-meta">
        <span>{locale === "tr" ? "SKYVAN / MÜHENDİSLİK" : "SKYVAN / ENGINEERING"}</span>
        <span>{locale === "tr" ? "KONSEPT AKIŞ / " : "CONCEPT FLOW / "}{String(kind === "load-aero" ? 1 : kind === "solar-electrical" ? 2 : kind === "water-service" ? 3 : 4).padStart(2, "0")}</span>
      </div>
      <div className="sv-plate-heading">
        <div>
          <span>{item.label}</span>
          <strong>{item.title}</strong>
        </div>
        <span>{locale === "tr" ? "PROJEYE ÖZEL DOĞRULAMA" : "PROJECT-SPECIFIC REVIEW"}</span>
      </div>
      <div className="sv-plate-canvas">{renderPlate}</div>
      <MobilePlateRail nodes={item.nodes} route={item.route} ariaLabel={item.ariaLabel} />
      <figcaption>
        <span>{item.note}</span>
        <small>{locale === "tr" ? "Konsept akış / Design concept" : "Concept flow / Design concept"}</small>
      </figcaption>
    </figure>
  );
}

export type { PublicTechnicalDiagramKind };
