type PublicTechnicalDiagramKind = "load-aero" | "solar-electrical" | "water-service" | "service-access";

type DiagramCopy = {
  label: string;
  title: string;
  note: string;
  route: string;
  nodes: readonly [string, string, string, string];
  ariaLabel: string;
};

const copy: Record<"tr" | "en", Record<PublicTechnicalDiagramKind, DiagramCopy>> = {
  tr: {
    "load-aero": {
      label: "YÜK VE DENGE",
      title: "Kütle, yerleşimle birlikte okunur.",
      note: "Açıklama görselidir; ölçü, taşıma kapasitesi veya montaj sonucu değildir.",
      route: "Araç planı / denge çalışması",
      nodes: ["Temiz su", "Kuru yük", "Yaşam alanı", "Gri su"],
      ariaLabel: "Skyvan yük ve denge teknik açıklama görseli",
    },
    "solar-electrical": {
      label: "DC ENERJİ",
      title: "Güneşten akü barasına kontrollü yol.",
      note: "Dizi gerilimi, akım, kablo yolu ve üretici limitleri proje özelinde doğrulanır.",
      route: "Kaynak → koruma → dönüşüm → depolama",
      nodes: ["PV dizisi", "Combiner / ayırıcı", "MPPT", "Akü + DC barası"],
      ariaLabel: "Skyvan DC enerji sistemi teknik akış görseli",
    },
    "water-service": {
      label: "SU SERVİSİ",
      title: "Depodan armatüre erişilebilir dağıtım.",
      note: "İçme suyu borusu, filtre, pompa ve sızdırmazlık seçimi ürün ve uygulama şartlarına bağlıdır.",
      route: "Depo → şartlandırma → basınç → dağıtım",
      nodes: ["Temiz su deposu", "Süzgeç + filtre", "Pompa / akümülatör", "Manifold + armatür"],
      ariaLabel: "Skyvan temiz su ve servis sistemi teknik akış görseli",
    },
    "service-access": {
      label: "SERVİS ERİŞİMİ",
      title: "Kullanım, izleme ve bakım aynı düzlemde.",
      note: "Erişim kapakları ve ayırma noktaları araç, ürün ve yerel kurallarla doğrulanır.",
      route: "Koruma → ölçüm → erişim → doğrulama",
      nodes: ["Sigorta / ayırıcı", "Shunt / izleme", "Servis kapağı", "Test ve kayıt"],
      ariaLabel: "Skyvan servis erişimi teknik açıklama görseli",
    },
  },
  en: {
    "load-aero": {
      label: "LOAD AND BALANCE",
      title: "Mass is read together with the layout.",
      note: "Explanatory visual only; not a dimension, payload or installation result.",
      route: "Vehicle plan / balance study",
      nodes: ["Fresh water", "Dry load", "Living space", "Grey water"],
      ariaLabel: "Skyvan load and balance technical visual",
    },
    "solar-electrical": {
      label: "DC ENERGY",
      title: "A controlled path from sun to the battery bus.",
      note: "Array voltage, current, cable route and manufacturer limits are verified per project.",
      route: "Source → protection → conversion → storage",
      nodes: ["PV array", "Combiner / isolator", "MPPT", "Battery + DC bus"],
      ariaLabel: "Skyvan DC energy system technical flow visual",
    },
    "water-service": {
      label: "WATER SERVICE",
      title: "An accessible distribution path from tank to fixture.",
      note: "Potable tubing, filtration, pump and sealing depend on the product and installation conditions.",
      route: "Tank → conditioning → pressure → distribution",
      nodes: ["Fresh tank", "Strainer + filter", "Pump / accumulator", "Manifold + fixtures"],
      ariaLabel: "Skyvan fresh water and service system technical flow visual",
    },
    "service-access": {
      label: "SERVICE ACCESS",
      title: "Use, monitoring and maintenance share one plane.",
      note: "Access panels and isolation points are verified against the vehicle, product and local rules.",
      route: "Protection → measurement → access → verification",
      nodes: ["Fuse / isolator", "Shunt / monitor", "Service panel", "Test and record"],
      ariaLabel: "Skyvan service access technical visual",
    },
  },
};

type PlateNodeTone = "solar" | "water" | "access" | "load";

function PlateNode({
  x,
  y,
  index,
  label,
  detail,
  tone,
}: {
  x: number;
  y: number;
  index: number;
  label: string;
  detail: string;
  tone: PlateNodeTone;
}) {
  return (
    <g className={`sv-plate-node sv-plate-node-${tone}`} transform={`translate(${x} ${y})`}>
      <circle r="21" className="sv-plate-node-halo" />
      <circle r="15" className="sv-plate-node-ring" />
      <circle r="4" className="sv-plate-node-core" />
      <text y="-31" textAnchor="middle" className="sv-plate-node-index">{String(index).padStart(2, "0")}</text>
      <text y="47" textAnchor="middle" className="sv-plate-node-label">{label}</text>
      <text y="63" textAnchor="middle" className="sv-plate-node-detail">{detail}</text>
    </g>
  );
}

function PlateCallout({
  x,
  y,
  anchorX,
  anchorY,
  index,
  label,
  detail,
  align = "start",
}: {
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  index: number;
  label: string;
  detail: string;
  align?: "start" | "end";
}) {
  const lineStart = align === "end" ? x - 18 : x + 18;
  return (
    <g className="sv-plate-callout">
      <path d={`M ${lineStart} ${y - 5} H ${anchorX} L ${anchorX} ${anchorY}`} className="sv-plate-callout-line" />
      <circle cx={anchorX} cy={anchorY} r="3.5" className="sv-plate-callout-point" />
      <text x={x} y={y - 7} textAnchor={align} className="sv-plate-callout-index">{String(index).padStart(2, "0")}</text>
      <text x={x} y={y + 12} textAnchor={align} className="sv-plate-callout-label">{label}</text>
      <text x={x} y={y + 29} textAnchor={align} className="sv-plate-callout-detail">{detail}</text>
    </g>
  );
}

function SolarPlate({ nodes, ariaLabel, route }: { nodes: DiagramCopy["nodes"]; ariaLabel: string; route: string }) {
  return (
    <svg viewBox="0 0 1080 560" role="img" aria-label={ariaLabel} className="sv-plate-svg">
      <title>{ariaLabel}</title>
      <desc>{route}</desc>
      <g className="sv-plate-grid" aria-hidden="true">
        <path d="M70 104 H1010 M70 184 H1010 M70 264 H1010 M70 344 H1010 M70 424 H1010" />
        <path d="M150 64 V480 M310 64 V480 M470 64 V480 M630 64 V480 M790 64 V480 M950 64 V480" />
      </g>
      <text x="84" y="80" className="sv-plate-overline">ROOF / PV ARRAY</text>
      <text x="996" y="80" textAnchor="end" className="sv-plate-overline">DC SYSTEM / 01</text>

      <g className="sv-plate-solar-roof">
        <path d="M113 182 L296 122 L424 178 L238 246 Z" className="sv-plate-solar-roof-shell" />
        <path d="M138 181 L296 131 L397 177 L238 236 Z" className="sv-plate-solar-panel" />
        <path d="M191 164 L241 184 M244 147 L294 168 M297 131 L347 152 M163 171 L212 191 M216 154 L267 175 M269 138 L320 159" className="sv-plate-solar-panel-line" />
        <path d="M151 201 L238 236 M201 185 L289 221 M250 167 L338 203 M299 151 L387 187" className="sv-plate-solar-panel-line" />
        <path d="M238 246 L238 282 M424 178 L424 214" className="sv-plate-solar-support" />
      </g>

      <path d="M326 224 C373 267 408 305 475 342 S709 365 946 365" className="sv-plate-route sv-plate-route-solar" />
      <circle cx="338" cy="236" r="5" className="sv-plate-route-orb sv-plate-route-orb-solar" />
      <circle cx="338" cy="236" r="14" className="sv-plate-route-aura sv-plate-route-aura-solar" />
      <path d="M475 342 H946" className="sv-plate-route-guide" />

      <PlateNode x={475} y={342} index={1} label={nodes[0]} detail="SOURCE" tone="solar" />
      <PlateNode x={630} y={365} index={2} label={nodes[1]} detail="PROTECTION" tone="solar" />
      <PlateNode x={785} y={365} index={3} label={nodes[2]} detail="CONVERSION" tone="solar" />
      <PlateNode x={940} y={365} index={4} label={nodes[3]} detail="STORAGE" tone="solar" />

      <PlateCallout x={164} y={335} anchorX={238} anchorY={246} index={0} label="ROOF ARRAY" detail="panel / cable entry" />
      <text x="996" y="480" textAnchor="end" className="sv-plate-footnote">CONCEPT STUDY</text>
    </svg>
  );
}

function WaterPlate({ nodes, ariaLabel, route }: { nodes: DiagramCopy["nodes"]; ariaLabel: string; route: string }) {
  return (
    <svg viewBox="0 0 1080 560" role="img" aria-label={ariaLabel} className="sv-plate-svg">
      <title>{ariaLabel}</title>
      <desc>{route}</desc>
      <g className="sv-plate-grid" aria-hidden="true">
        <path d="M70 104 H1010 M70 184 H1010 M70 264 H1010 M70 344 H1010 M70 424 H1010" />
        <path d="M150 64 V480 M310 64 V480 M470 64 V480 M630 64 V480 M790 64 V480 M950 64 V480" />
      </g>
      <text x="84" y="80" className="sv-plate-overline">POTABLE WATER / SERVICE PATH</text>
      <text x="996" y="80" textAnchor="end" className="sv-plate-overline">WATER SYSTEM / 01</text>

      <g className="sv-plate-water-tank">
        <rect x="112" y="178" width="170" height="170" rx="26" className="sv-plate-water-tank-shell" />
        <path d="M113 252 H281" className="sv-plate-water-tank-line" />
        <path d="M146 292 C176 276 207 309 244 288" className="sv-plate-water-wave" />
        <path d="M150 311 C180 295 210 327 245 307" className="sv-plate-water-wave" />
        <text x="197" y="228" textAnchor="middle" className="sv-plate-object-label">TANK</text>
        <text x="197" y="243" textAnchor="middle" className="sv-plate-object-detail">FRESH WATER</text>
      </g>

      <path d="M282 300 H356 C385 300 393 258 424 258 H476 C504 258 518 300 548 300 H918" className="sv-plate-route sv-plate-route-water" />
      <circle cx="300" cy="300" r="5" className="sv-plate-route-orb sv-plate-route-orb-water" />
      <circle cx="300" cy="300" r="14" className="sv-plate-route-aura sv-plate-route-aura-water" />

      <g className="sv-plate-water-filter">
        <circle cx="424" cy="258" r="35" className="sv-plate-water-filter-shell" />
        <path d="M406 246 L442 270 M442 246 L406 270" className="sv-plate-water-filter-mark" />
        <text x="424" y="316" textAnchor="middle" className="sv-plate-object-label">FILTER</text>
      </g>
      <g className="sv-plate-water-pump">
        <circle cx="548" cy="300" r="42" className="sv-plate-water-pump-shell" />
        <path d="M533 300 H563 M548 285 V315" className="sv-plate-water-pump-mark" />
        <text x="548" y="367" textAnchor="middle" className="sv-plate-object-label">PUMP</text>
      </g>
      <g className="sv-plate-manifold">
        <path d="M760 300 V204 M760 300 V396 M760 300 H918" className="sv-plate-manifold-line" />
        <circle cx="760" cy="300" r="21" className="sv-plate-manifold-hub" />
        <circle cx="760" cy="204" r="7" className="sv-plate-manifold-port" />
        <circle cx="760" cy="396" r="7" className="sv-plate-manifold-port" />
        <circle cx="918" cy="300" r="7" className="sv-plate-manifold-port" />
        <text x="760" y="450" textAnchor="middle" className="sv-plate-object-label">MANIFOLD</text>
      </g>
      <path d="M760 204 H866 M760 396 H866" className="sv-plate-secondary-line" />
      <text x="884" y="208" className="sv-plate-secondary-label">HOT</text>
      <text x="884" y="400" className="sv-plate-secondary-label">COLD</text>

      <PlateNode x={196} y={430} index={1} label={nodes[0]} detail="TANK" tone="water" />
      <PlateNode x={424} y={430} index={2} label={nodes[1]} detail="CONDITIONING" tone="water" />
      <PlateNode x={648} y={430} index={3} label={nodes[2]} detail="PRESSURE" tone="water" />
      <PlateNode x={918} y={430} index={4} label={nodes[3]} detail="DISTRIBUTION" tone="water" />
      <text x="996" y="505" textAnchor="end" className="sv-plate-footnote">CONCEPT STUDY</text>
    </svg>
  );
}

function LoadBalancePlate({ nodes, ariaLabel, route }: { nodes: DiagramCopy["nodes"]; ariaLabel: string; route: string }) {
  return (
    <svg viewBox="0 0 1080 560" role="img" aria-label={ariaLabel} className="sv-plate-svg">
      <title>{ariaLabel}</title>
      <desc>{route}</desc>
      <g className="sv-plate-grid" aria-hidden="true">
        <path d="M70 104 H1010 M70 184 H1010 M70 264 H1010 M70 344 H1010 M70 424 H1010" />
        <path d="M150 64 V480 M310 64 V480 M470 64 V480 M630 64 V480 M790 64 V480 M950 64 V480" />
      </g>
      <text x="84" y="80" className="sv-plate-overline">VEHICLE PLAN / BALANCE STUDY</text>
      <text x="996" y="80" textAnchor="end" className="sv-plate-overline">REFERENCE / 01</text>
      <text x="540" y="108" textAnchor="middle" className="sv-plate-orientation">REFERENCE FRONT</text>
      <text x="540" y="485" textAnchor="middle" className="sv-plate-orientation">REFERENCE REAR</text>

      <g className="sv-plate-vehicle-plan">
        <path d="M454 126 H626 C681 126 718 159 724 211 L736 386 C739 423 715 449 674 454 H406 C365 449 341 423 344 386 L356 211 C362 159 399 126 454 126 Z" className="sv-plate-vehicle-shell" />
        <path d="M398 154 Q540 116 682 154 L701 213 H379 Z" className="sv-plate-vehicle-cab" />
        <path d="M378 248 H702 M378 402 H702 M378 248 V402 M702 248 V402" className="sv-plate-vehicle-rule" />
        <rect x="341" y="190" width="18" height="58" rx="9" className="sv-plate-vehicle-wheel" />
        <rect x="721" y="190" width="18" height="58" rx="9" className="sv-plate-vehicle-wheel" />
        <rect x="341" y="349" width="18" height="58" rx="9" className="sv-plate-vehicle-wheel" />
        <rect x="721" y="349" width="18" height="58" rx="9" className="sv-plate-vehicle-wheel" />
        <rect x="402" y="274" width="112" height="70" rx="12" className="sv-plate-zone sv-plate-zone-water" />
        <rect x="566" y="274" width="112" height="70" rx="12" className="sv-plate-zone sv-plate-zone-energy" />
        <rect x="402" y="363" width="276" height="26" rx="13" className="sv-plate-zone sv-plate-zone-living" />
        <text x="458" y="313" textAnchor="middle" className="sv-plate-zone-label">WATER</text>
        <text x="622" y="313" textAnchor="middle" className="sv-plate-zone-label">ENERGY</text>
        <text x="540" y="380" textAnchor="middle" className="sv-plate-zone-label">LIVING / SERVICE FIELD</text>
        <path d="M378 352 H702" className="sv-plate-balance-axis" />
        <circle cx="540" cy="352" r="8" className="sv-plate-balance-centre" />
        <text x="540" y="338" textAnchor="middle" className="sv-plate-balance-label">BALANCE AXIS</text>
      </g>

      <PlateCallout x={154} y={197} anchorX={402} anchorY={308} index={1} label={nodes[0]} detail="LIQUID MASS" />
      <PlateCallout x={926} y={197} anchorX={678} anchorY={308} index={2} label={nodes[1]} detail="FIXED LOAD" align="end" />
      <PlateCallout x={154} y={404} anchorX={402} anchorY={376} index={3} label={nodes[2]} detail="LIVING AREA" />
      <PlateCallout x={926} y={404} anchorX={678} anchorY={376} index={4} label={nodes[3]} detail="POST-USE" align="end" />
      <text x="996" y="515" textAnchor="end" className="sv-plate-footnote">CONCEPT STUDY</text>
    </svg>
  );
}

function ServiceAccessPlate({ nodes, ariaLabel, route }: { nodes: DiagramCopy["nodes"]; ariaLabel: string; route: string }) {
  return (
    <svg viewBox="0 0 1080 560" role="img" aria-label={ariaLabel} className="sv-plate-svg">
      <title>{ariaLabel}</title>
      <desc>{route}</desc>
      <g className="sv-plate-grid" aria-hidden="true">
        <path d="M70 104 H1010 M70 184 H1010 M70 264 H1010 M70 344 H1010 M70 424 H1010" />
        <path d="M150 64 V480 M310 64 V480 M470 64 V480 M630 64 V480 M790 64 V480 M950 64 V480" />
      </g>
      <text x="84" y="80" className="sv-plate-overline">REAR SERVICE BAY / ACCESS STUDY</text>
      <text x="996" y="80" textAnchor="end" className="sv-plate-overline">MAINTENANCE / 01</text>

      <g className="sv-plate-service-bay">
        <rect x="326" y="126" width="428" height="292" rx="24" className="sv-plate-service-shell" />
        <path d="M354 151 H726 V393 H354 Z" className="sv-plate-service-opening" />
        <path d="M354 151 Q540 102 726 151" className="sv-plate-service-lid" />
        <path d="M386 194 H694 M386 352 H694" className="sv-plate-service-rail" />
        <rect x="407" y="224" width="84" height="84" rx="12" className="sv-plate-service-module" />
        <rect x="516" y="224" width="84" height="84" rx="12" className="sv-plate-service-module" />
        <rect x="625" y="224" width="42" height="84" rx="10" className="sv-plate-service-module sv-plate-service-module-slim" />
        <circle cx="449" cy="266" r="17" className="sv-plate-service-core" />
        <path d="M430 266 H468 M449 247 V285" className="sv-plate-service-cross" />
        <path d="M535 248 H581 M535 266 H581 M535 284 H581" className="sv-plate-service-lines" />
        <path d="M641 245 V287" className="sv-plate-service-lines" />
        <circle cx="646" cy="238" r="4" className="sv-plate-service-status" />
        <text x="449" y="330" textAnchor="middle" className="sv-plate-object-label">PROTECTION</text>
        <text x="558" y="330" textAnchor="middle" className="sv-plate-object-label">MONITOR</text>
        <text x="646" y="330" textAnchor="middle" className="sv-plate-object-label">TEST</text>
      </g>
      <PlateCallout x={150} y={222} anchorX={407} anchorY={266} index={1} label={nodes[0]} detail="PROTECTION" />
      <PlateCallout x={930} y={222} anchorX={600} anchorY={266} index={2} label={nodes[1]} detail="MONITORING" align="end" />
      <PlateCallout x={150} y={382} anchorX={354} anchorY={352} index={3} label={nodes[2]} detail="ACCESS" />
      <PlateCallout x={930} y={382} anchorX={646} anchorY={307} index={4} label={nodes[3]} detail="RECORD" align="end" />
      <text x="996" y="505" textAnchor="end" className="sv-plate-footnote">CONCEPT STUDY</text>
    </svg>
  );
}

function MobilePlateRail({ nodes, route, ariaLabel }: { nodes: DiagramCopy["nodes"]; route: string; ariaLabel: string }) {
  return (
    <div className="sv-plate-mobile" role="img" aria-label={ariaLabel}>
      <span className="sv-plate-mobile-route">{route}</span>
      <div className="sv-plate-mobile-flow">
        {nodes.map((node, index) => (
          <div className="sv-plate-mobile-step" key={node}>
            <span className="sv-plate-mobile-marker" aria-hidden="true"><b>{String(index + 1).padStart(2, "0")}</b></span>
            <span className="sv-plate-mobile-copy"><strong>{node}</strong><small>{index === 0 ? "SOURCE" : index === nodes.length - 1 ? "NEXT LAYER" : "INTERMEDIATE"}</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicTechnicalDiagram({ kind, locale }: { kind: PublicTechnicalDiagramKind; locale: "tr" | "en" }): React.JSX.Element {
  const item = copy[locale][kind];

  return (
    <figure className="sv-technical-plate" data-diagram-kind={kind}>
      <div className="sv-plate-meta">
        <span>SKYVAN / ENGINEERING</span>
        <span>CONCEPT STUDY / {String(kind === "load-aero" ? 1 : kind === "solar-electrical" ? 2 : kind === "water-service" ? 3 : 4).padStart(2, "0")}</span>
      </div>
      <div className="sv-plate-heading">
        <div>
          <span>{item.label}</span>
          <strong>{item.title}</strong>
        </div>
        <span>ENGINEERING PLATE</span>
      </div>
      <div className="sv-plate-canvas">
        {kind === "solar-electrical" ? <SolarPlate nodes={item.nodes} ariaLabel={item.ariaLabel} route={item.route} /> : null}
        {kind === "water-service" ? <WaterPlate nodes={item.nodes} ariaLabel={item.ariaLabel} route={item.route} /> : null}
        {kind === "load-aero" ? <LoadBalancePlate nodes={item.nodes} ariaLabel={item.ariaLabel} route={item.route} /> : null}
        {kind === "service-access" ? <ServiceAccessPlate nodes={item.nodes} ariaLabel={item.ariaLabel} route={item.route} /> : null}
      </div>
      <MobilePlateRail nodes={item.nodes} route={item.route} ariaLabel={item.ariaLabel} />
      <figcaption>
        <span>{item.note}</span>
        <small>Konsept tasarım / Design concept</small>
      </figcaption>
    </figure>
  );
}

export type { PublicTechnicalDiagramKind };
