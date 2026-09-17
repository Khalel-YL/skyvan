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

function DiagramNode({ x, y, width, label, index }: { x: number; y: number; width: number; label: string; index: number }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height="54" rx="11" className="sv-technical-diagram-node" />
      <text x={x + 16} y={y + 22} className="sv-technical-diagram-index">{String(index + 1).padStart(2, "0")}</text>
      <text x={x + 16} y={y + 41} className="sv-technical-diagram-label">{label}</text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, markerId }: { x1: number; y1: number; x2: number; y2: number; markerId: string }) {
  return <path d={`M ${x1} ${y1} L ${x2} ${y2}`} className="sv-technical-diagram-line" markerEnd={`url(#${markerId})`} />;
}

function LoadBalanceDiagram({ nodes, ariaLabel, axisLabel }: { nodes: string[]; ariaLabel: string; axisLabel: string }) {
  return (
    <svg viewBox="0 0 720 300" role="img" aria-label={ariaLabel} className="sv-technical-diagram-svg">
      <defs><marker id="sv-technical-arrow-load" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" className="sv-technical-diagram-arrow" /></marker></defs>
      <rect x="52" y="84" width="616" height="132" rx="66" className="sv-technical-diagram-vehicle" />
      <path d="M88 150 H632" className="sv-technical-diagram-axis" />
      <text x="360" y="144" textAnchor="middle" className="sv-technical-diagram-axis-label">{axisLabel}</text>
      <DiagramNode x={78} y={30} width={178} label={nodes[0]} index={0} />
      <DiagramNode x={271} y={30} width={178} label={nodes[1]} index={1} />
      <DiagramNode x={464} y={30} width={178} label={nodes[2]} index={2} />
      <DiagramNode x={271} y={216} width={178} label={nodes[3]} index={3} />
      <Arrow markerId="sv-technical-arrow-load" x1={167} y1={84} x2={167} y2={72} />
      <Arrow markerId="sv-technical-arrow-load" x1={360} y1={84} x2={360} y2={72} />
      <Arrow markerId="sv-technical-arrow-load" x1={553} y1={84} x2={553} y2={72} />
      <Arrow markerId="sv-technical-arrow-load" x1={360} y1={216} x2={360} y2={228} />
      <circle cx="360" cy="150" r="6" className="sv-technical-diagram-centre" />
    </svg>
  );
}

function FlowDiagram({ nodes, ariaLabel, captions }: { nodes: string[]; ariaLabel: string; captions: { top: string; bottom: string } }) {
  return (
    <svg viewBox="0 0 720 300" role="img" aria-label={ariaLabel} className="sv-technical-diagram-svg">
      <defs><marker id="sv-technical-arrow-flow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" className="sv-technical-diagram-arrow" /></marker></defs>
      <path d="M94 152 H626" className="sv-technical-diagram-track" />
      {nodes.map((node, index) => {
        const x = 24 + index * 174;
        return <DiagramNode key={node} x={x} y={125} width={150} label={node} index={index} />;
      })}
      {nodes.slice(0, -1).map((node, index) => <Arrow key={`${node}-arrow`} markerId="sv-technical-arrow-flow" x1={174 + index * 174} y1={152} x2={198 + index * 174} y2={152} />)}
      <text x="24" y="77" className="sv-technical-diagram-caption">{captions.top}</text>
      <text x="24" y="260" className="sv-technical-diagram-caption">{captions.bottom}</text>
    </svg>
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
  return (
    <figure className="sv-technical-diagram" data-diagram-kind={kind}>
      <div className="sv-technical-diagram-meta"><span>{item.label}</span><span>SKYVAN / SYSTEM STUDY</span></div>
      {kind === "load-aero" ? <LoadBalanceDiagram nodes={item.nodes} ariaLabel={ariaLabel} axisLabel={axisLabel} /> : <FlowDiagram nodes={item.nodes} ariaLabel={ariaLabel} captions={captions} />}
      <figcaption><strong>{item.title}</strong><span>{item.note}</span></figcaption>
    </figure>
  );
}

export type { PublicTechnicalDiagramKind };
