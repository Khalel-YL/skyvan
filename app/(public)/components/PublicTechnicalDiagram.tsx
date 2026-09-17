type PublicTechnicalDiagramKind = "load-aero" | "solar-electrical" | "water-service" | "service-access";

type DiagramCopy = {
  label: string;
  title: string;
  note: string;
  nodes: string[];
};

const copy: Record<"tr" | "en", Record<PublicTechnicalDiagramKind, DiagramCopy>> = {
  tr: {
    "load-aero": {
      label: "YÜK VE DENGE",
      title: "Kütle, yerleşimle birlikte okunur.",
      note: "Açıklama şemasıdır; ölçü, taşıma kapasitesi veya montaj sonucu değildir.",
      nodes: ["Temiz su", "Kuru yük", "Yaşam alanı", "Gri su"],
    },
    "solar-electrical": {
      label: "DC ENERJİ",
      title: "Güneşten akü barasına kontrollü yol.",
      note: "Dizi gerilimi, akım, kablo yolu ve üretici limitleri proje özelinde doğrulanır.",
      nodes: ["PV dizisi", "Combiner / ayırıcı", "MPPT", "Akü + DC barası"],
    },
    "water-service": {
      label: "SU SERVİSİ",
      title: "Depodan armatüre erişilebilir dağıtım.",
      note: "İçme suyu borusu, filtre, pompa ve sızdırmazlık seçimi ürün ve uygulama şartlarına bağlıdır.",
      nodes: ["Temiz su deposu", "Süzgeç + filtre", "Pompa / akümülatör", "Manifold + armatür"],
    },
    "service-access": {
      label: "SERVİS ERİŞİMİ",
      title: "Kullanım, izleme ve bakım aynı düzlemde.",
      note: "Erişim kapakları ve ayırma noktaları araç, ürün ve yerel kurallarla doğrulanır.",
      nodes: ["Sigorta / ayırıcı", "Shunt / izleme", "Servis kapağı", "Test ve kayıt"],
    },
  },
  en: {
    "load-aero": {
      label: "LOAD AND BALANCE",
      title: "Mass is read together with the layout.",
      note: "Explanatory diagram only; not a dimension, payload or installation result.",
      nodes: ["Fresh water", "Dry load", "Living space", "Grey water"],
    },
    "solar-electrical": {
      label: "DC ENERGY",
      title: "A controlled path from sun to the battery bus.",
      note: "Array voltage, current, cable route and manufacturer limits are verified per project.",
      nodes: ["PV array", "Combiner / isolator", "MPPT", "Battery + DC bus"],
    },
    "water-service": {
      label: "WATER SERVICE",
      title: "An accessible distribution path from tank to fixture.",
      note: "Potable tubing, filtration, pump and sealing depend on the product and installation conditions.",
      nodes: ["Fresh tank", "Strainer + filter", "Pump / accumulator", "Manifold + fixtures"],
    },
    "service-access": {
      label: "SERVICE ACCESS",
      title: "Use, monitoring and maintenance share one plane.",
      note: "Access panels and isolation points are verified against the vehicle, product and local rules.",
      nodes: ["Fuse / isolator", "Shunt / monitor", "Service panel", "Test and record"],
    },
  },
};

type DiagramTone = "load" | "solar" | "water" | "access";

function DiagramNode({
  x,
  y,
  width,
  label,
  index,
  tone,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  index: number;
  tone: DiagramTone;
}) {
  return (
    <g className={`sv-technical-diagram-station sv-technical-diagram-station-${tone}`}>
      <rect x={x} y={y} width={width} height="58" rx="7" className="sv-technical-diagram-node" />
      <line x1={x + 14} y1={y + 12} x2={x + width - 14} y2={y + 12} className="sv-technical-diagram-node-rule" />
      <circle cx={x + width - 16} cy={y + 12} r="2.5" className="sv-technical-diagram-node-port" />
      <text x={x + 16} y={y + 31} className="sv-technical-diagram-index">{String(index + 1).padStart(2, "0")}</text>
      <text x={x + 16} y={y + 48} className="sv-technical-diagram-label">{label}</text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, markerId }: { x1: number; y1: number; x2: number; y2: number; markerId: string }) {
  return <path d={`M ${x1} ${y1} L ${x2} ${y2}`} className="sv-technical-diagram-line" markerEnd={`url(#${markerId})`} />;
}

function DiagramGrid({ id }: { id: string }) {
  return (
    <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M 28 0 L 0 0 0 28" className="sv-technical-diagram-grid-line" />
    </pattern>
  );
}

function LoadBalanceDiagram({ nodes, ariaLabel, axisLabel }: { nodes: string[]; ariaLabel: string; axisLabel: string }) {
  return (
    <>
      <svg viewBox="0 0 760 320" role="img" aria-label={ariaLabel} className="sv-technical-diagram-svg sv-technical-diagram-svg-desktop">
        <title>{ariaLabel}</title>
        <defs>
          <DiagramGrid id="sv-technical-grid-load" />
          <marker id="sv-technical-arrow-load" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" className="sv-technical-diagram-arrow" /></marker>
        </defs>
        <rect x="18" y="18" width="724" height="284" rx="10" className="sv-technical-diagram-frame" />
        <rect x="19" y="19" width="722" height="282" rx="9" fill="url(#sv-technical-grid-load)" className="sv-technical-diagram-grid" />
        <text x="36" y="46" className="sv-technical-diagram-micro-label">VEHICLE PLAN / BALANCE STUDY</text>
        <text x="724" y="46" textAnchor="end" className="sv-technical-diagram-micro-label">SCHEMATIC / 01</text>

        <path d="M304 72 H456 C488 72 515 96 522 130 L531 213 C534 239 517 257 488 260 H272 C243 257 226 239 229 213 L238 130 C245 96 272 72 304 72 Z" className="sv-technical-diagram-vehicle" />
        <path d="M272 91 Q360 67 448 91 L469 126 H251 Z" className="sv-technical-diagram-vehicle-cab" />
        <path d="M252 148 H468 M252 202 H468" className="sv-technical-diagram-vehicle-rule" />
        <path d="M252 148 V202 M468 148 V202" className="sv-technical-diagram-vehicle-rule" />
        <rect x="226" y="105" width="14" height="42" rx="7" className="sv-technical-diagram-wheel" />
        <rect x="520" y="105" width="14" height="42" rx="7" className="sv-technical-diagram-wheel" />
        <rect x="226" y="199" width="14" height="42" rx="7" className="sv-technical-diagram-wheel" />
        <rect x="520" y="199" width="14" height="42" rx="7" className="sv-technical-diagram-wheel" />
        <path d="M252 176 H508" className="sv-technical-diagram-axis" />
        <circle cx="360" cy="176" r="6" className="sv-technical-diagram-centre" />
        <text x="360" y="169" textAnchor="middle" className="sv-technical-diagram-axis-label">{axisLabel}</text>

        <DiagramNode x={30} y={72} width={166} label={nodes[0]} index={0} tone="load" />
        <DiagramNode x={564} y={72} width={166} label={nodes[1]} index={1} tone="load" />
        <DiagramNode x={30} y={194} width={166} label={nodes[2]} index={2} tone="load" />
        <DiagramNode x={564} y={194} width={166} label={nodes[3]} index={3} tone="load" />
        <path d="M196 101 H244 M564 101 H516 M196 223 H244 M564 223 H516" className="sv-technical-diagram-callout-line" />
        <circle cx="244" cy="101" r="3" className="sv-technical-diagram-callout-point" />
        <circle cx="516" cy="101" r="3" className="sv-technical-diagram-callout-point" />
        <circle cx="244" cy="223" r="3" className="sv-technical-diagram-callout-point" />
        <circle cx="516" cy="223" r="3" className="sv-technical-diagram-callout-point" />
      </svg>
      <div className="sv-technical-diagram-mobile-balance" role="img" aria-label={ariaLabel}>
        <span className="sv-technical-diagram-mobile-axis">{axisLabel}</span>
        <ol>{nodes.map((node, index) => <li key={node}><span>{String(index + 1).padStart(2, "0")}</span><strong>{node}</strong></li>)}</ol>
      </div>
    </>
  );
}

function FlowDiagram({
  nodes,
  ariaLabel,
  captions,
  kind,
  tone,
}: {
  nodes: string[];
  ariaLabel: string;
  captions: { top: string; bottom: string };
  kind: Exclude<PublicTechnicalDiagramKind, "load-aero">;
  tone: Exclude<DiagramTone, "load">;
}) {
  const markerId = `sv-technical-arrow-${kind}`;
  const gridId = `sv-technical-grid-${kind}`;
  const positions = [32, 213, 394, 575];
  const nodeWidth = 154;
  return (
    <>
      <svg viewBox="0 0 760 292" role="img" aria-label={ariaLabel} className="sv-technical-diagram-svg sv-technical-diagram-svg-desktop">
        <title>{ariaLabel}</title>
        <defs>
          <DiagramGrid id={gridId} />
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" className="sv-technical-diagram-arrow" /></marker>
        </defs>
        <rect x="18" y="18" width="724" height="256" rx="10" className="sv-technical-diagram-frame" />
        <rect x="19" y="19" width="722" height="254" rx="9" fill={`url(#${gridId})`} className="sv-technical-diagram-grid" />
        <text x="36" y="46" className="sv-technical-diagram-micro-label">SYSTEM PATH / CONTROLLED ROUTE</text>
        <text x="724" y="46" textAnchor="end" className="sv-technical-diagram-micro-label">SCHEMATIC / 01</text>
        <text x="36" y="76" className="sv-technical-diagram-caption">{captions.top}</text>
        <text x="724" y="76" textAnchor="end" className="sv-technical-diagram-caption">{captions.bottom}</text>
        <path d="M109 149 H651" className="sv-technical-diagram-track" />
        <circle cx="109" cy="149" r="4" className="sv-technical-diagram-route-point" />
        <circle cx="651" cy="149" r="4" className="sv-technical-diagram-route-point" />
        {nodes.map((node, index) => <DiagramNode key={node} x={positions[index]} y={120} width={nodeWidth} label={node} index={index} tone={tone} />)}
        {nodes.slice(0, -1).map((node, index) => <Arrow key={`${node}-arrow`} markerId={markerId} x1={positions[index] + nodeWidth + 7} y1={149} x2={positions[index + 1] - 7} y2={149} />)}
      </svg>
      <div className={`sv-technical-diagram-mobile-flow sv-technical-diagram-mobile-flow-${tone}`} role="img" aria-label={ariaLabel}>
        <span className="sv-technical-diagram-mobile-caption">{captions.top}</span>
        <ol>{nodes.map((node, index) => <li key={node}><span>{String(index + 1).padStart(2, "0")}</span><strong>{node}</strong>{index < nodes.length - 1 ? <i aria-hidden="true" /> : null}</li>)}</ol>
        <span className="sv-technical-diagram-mobile-caption">{captions.bottom}</span>
      </div>
    </>
  );
}

export function PublicTechnicalDiagram({ kind, locale }: { kind: PublicTechnicalDiagramKind; locale: "tr" | "en" }): React.JSX.Element {
  const item = copy[locale][kind];
  const ariaLabel = locale === "tr"
    ? kind === "load-aero" ? "Yük ve denge açıklama şeması" : "Teknik akış açıklama şeması"
    : kind === "load-aero" ? "Load and balance explanatory diagram" : "Technical flow explanatory diagram";
  const axisLabel = locale === "tr" ? "denge ekseni" : "balance axis";
  const captions = locale === "tr"
    ? kind === "solar-electrical"
      ? { top: "kaynak → koruma → dönüşüm → depolama", bottom: "DC akışı" }
      : kind === "water-service"
        ? { top: "depo → şartlandırma → basınç → dağıtım", bottom: "servis akışı" }
        : { top: "koruma → ölçüm → erişim → doğrulama", bottom: "bakım döngüsü" }
    : kind === "solar-electrical"
      ? { top: "source → protection → conversion → storage", bottom: "DC flow" }
      : kind === "water-service"
        ? { top: "tank → conditioning → pressure → distribution", bottom: "service flow" }
        : { top: "protection → measurement → access → verification", bottom: "maintenance loop" };
  const flowTone: Exclude<DiagramTone, "load"> = kind === "solar-electrical" ? "solar" : kind === "water-service" ? "water" : "access";

  return (
    <figure className="sv-technical-diagram" data-diagram-kind={kind}>
      <div className="sv-technical-diagram-meta"><span>SKYVAN / ENGINEERING</span><span>CONCEPT / CONCEPT STUDY</span></div>
      <div className="sv-technical-diagram-heading"><span>{item.label}</span><span>EXPLANATORY SCHEMATIC</span></div>
      {kind === "load-aero"
        ? <LoadBalanceDiagram nodes={item.nodes} ariaLabel={ariaLabel} axisLabel={axisLabel} />
        : <FlowDiagram nodes={item.nodes} ariaLabel={ariaLabel} captions={captions} kind={kind} tone={flowTone} />}
      <figcaption><strong>{item.title}</strong><span>{item.note}</span></figcaption>
    </figure>
  );
}

export type { PublicTechnicalDiagramKind };
