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
      <rect x={x} y={y} width={width} height="58" rx="4" className="sv-technical-diagram-node" />
      <line x1={x + 16} y1={y + 12} x2={x + 48} y2={y + 12} className="sv-technical-diagram-node-rule" />
      <text x={x + 16} y={y + 24} className="sv-technical-diagram-index">{String(index + 1).padStart(2, "0")}</text>
      <text x={x + 16} y={y + 45} className="sv-technical-diagram-label">{label}</text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, markerId }: { x1: number; y1: number; x2: number; y2: number; markerId: string }) {
  return <path d={`M ${x1} ${y1} L ${x2} ${y2}`} className="sv-technical-diagram-line" markerEnd={`url(#${markerId})`} />;
}

function LoadBalanceDiagram({ nodes, ariaLabel, axisLabel }: { nodes: string[]; ariaLabel: string; axisLabel: string }) {
  return (
    <>
      <svg viewBox="0 0 920 390" role="img" aria-label={ariaLabel} className="sv-technical-diagram-svg sv-technical-diagram-svg-desktop">
        <title>{ariaLabel}</title>
        <defs>
          <marker id="sv-technical-arrow-load" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" className="sv-technical-diagram-arrow" /></marker>
        </defs>
        <rect x="20" y="18" width="880" height="354" rx="16" className="sv-technical-diagram-frame" />
        <text x="46" y="50" className="sv-technical-diagram-micro-label">VEHICLE PLAN / BALANCE STUDY</text>
        <text x="874" y="50" textAnchor="end" className="sv-technical-diagram-micro-label">REFERENCE / 01</text>
        <text x="460" y="66" textAnchor="middle" className="sv-technical-diagram-orientation">REFERENCE FRONT</text>
        <text x="460" y="356" textAnchor="middle" className="sv-technical-diagram-orientation">REFERENCE REAR</text>

        <path d="M394 78 H526 C572 78 604 112 607 154 L614 264 C616 298 596 322 560 326 H360 C324 322 304 298 306 264 L313 154 C316 112 348 78 394 78 Z" className="sv-technical-diagram-vehicle" />
        <path d="M350 101 Q460 72 570 101 L586 143 H334 Z" className="sv-technical-diagram-vehicle-cab" />
        <path d="M337 163 H583 M337 281 H583" className="sv-technical-diagram-vehicle-rule" />
        <path d="M337 163 V281 M583 163 V281" className="sv-technical-diagram-vehicle-rule" />
        <rect x="304" y="112" width="15" height="46" rx="7.5" className="sv-technical-diagram-wheel" />
        <rect x="601" y="112" width="15" height="46" rx="7.5" className="sv-technical-diagram-wheel" />
        <rect x="304" y="238" width="15" height="46" rx="7.5" className="sv-technical-diagram-wheel" />
        <rect x="601" y="238" width="15" height="46" rx="7.5" className="sv-technical-diagram-wheel" />
        <rect x="356" y="177" width="82" height="41" rx="5" className="sv-technical-diagram-vehicle-zone" />
        <rect x="482" y="177" width="82" height="41" rx="5" className="sv-technical-diagram-vehicle-zone" />
        <rect x="356" y="231" width="208" height="32" rx="5" className="sv-technical-diagram-vehicle-zone sv-technical-diagram-vehicle-zone-wide" />
        <text x="397" y="201" textAnchor="middle" className="sv-technical-diagram-vehicle-zone-label">LOAD ZONE</text>
        <text x="523" y="201" textAnchor="middle" className="sv-technical-diagram-vehicle-zone-label">LOAD ZONE</text>
        <text x="460" y="251" textAnchor="middle" className="sv-technical-diagram-vehicle-zone-label">LIVING / SERVICE FIELD</text>
        <path d="M337 222 H583" className="sv-technical-diagram-axis" />
        <circle cx="460" cy="222" r="7" className="sv-technical-diagram-centre" />
        <text x="460" y="214" textAnchor="middle" className="sv-technical-diagram-axis-label">{axisLabel}</text>

        <DiagramNode x={48} y={92} width={220} label={nodes[0]} index={0} tone="load" />
        <DiagramNode x={652} y={92} width={220} label={nodes[1]} index={1} tone="load" />
        <DiagramNode x={48} y={238} width={220} label={nodes[2]} index={2} tone="load" />
        <DiagramNode x={652} y={238} width={220} label={nodes[3]} index={3} tone="load" />
        <path d="M268 121 H306 M652 121 H614 M268 267 H306 M652 267 H614" className="sv-technical-diagram-callout-line" />
        <circle cx="306" cy="121" r="3.5" className="sv-technical-diagram-callout-point" />
        <circle cx="614" cy="121" r="3.5" className="sv-technical-diagram-callout-point" />
        <circle cx="306" cy="267" r="3.5" className="sv-technical-diagram-callout-point" />
        <circle cx="614" cy="267" r="3.5" className="sv-technical-diagram-callout-point" />
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
  const positions = [32, 213, 394, 575];
  const nodeWidth = 154;
  return (
    <>
      <svg viewBox="0 0 760 292" role="img" aria-label={ariaLabel} className="sv-technical-diagram-svg sv-technical-diagram-svg-desktop">
        <title>{ariaLabel}</title>
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" className="sv-technical-diagram-arrow" /></marker>
        </defs>
        <rect x="18" y="18" width="724" height="256" rx="10" className="sv-technical-diagram-frame" />
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
      <div className="sv-technical-diagram-heading">
        <div className="sv-technical-diagram-heading-copy"><span>{item.label}</span><strong>{item.title}</strong></div>
        <span>EXPLANATORY SCHEMATIC</span>
      </div>
      {kind === "load-aero"
        ? <LoadBalanceDiagram nodes={item.nodes} ariaLabel={ariaLabel} axisLabel={axisLabel} />
        : <FlowDiagram nodes={item.nodes} ariaLabel={ariaLabel} captions={captions} kind={kind} tone={flowTone} />}
      <figcaption><span>{item.note}</span></figcaption>
    </figure>
  );
}

export type { PublicTechnicalDiagramKind };
