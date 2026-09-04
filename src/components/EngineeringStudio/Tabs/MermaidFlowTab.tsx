import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ONIBlueprint, LayerType } from '../../../types/blueprint';
import styles from './MermaidFlowTab.module.scss';
import { Copy, Check, GitBranch, Code2, Eye } from 'lucide-react';
import mermaid from 'mermaid';

// Init mermaid once with dark theme matching ONI Studio
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#0b0f1a',
    primaryColor: '#1a3a5c',
    primaryBorderColor: '#00e5ff',
    primaryTextColor: '#e0e0e0',
    lineColor: '#00e5ff',
    edgeLabelBackground: '#141821',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  flowchart: { htmlLabels: true, curve: 'basis' }
});

interface MermaidFlowTabProps {
  blueprint: ONIBlueprint;
}

// ─── Schema → Mermaid generator ─────────────────────────────────────────────

/** Sanitize a string for use as a Mermaid node ID */
function sanitizeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, 'N$1');
}

/** Generate Mermaid for Building layer: show each building as a node, no connections */
function genBuildingDiagram(bp: ONIBlueprint): string {
  const layer = bp.layers.building;
  if (!layer || layer.buildings.length === 0) return 'graph LR\n  NoBuild[Không có công trình trong layer Building]';

  const lines: string[] = ['graph LR'];
  layer.buildings.forEach(b => {
    const id = sanitizeId(b.id);
    const size = `${b.size.x}×${b.size.y}`;
    const mat = b.primaryMaterial ? ` [${b.primaryMaterial}]` : '';
    lines.push(`  ${id}["${b.name}${mat}\\n${size} tiles @ (${b.position.x},${b.position.y})"]`);
  });

  // If buildings share same column → treat as vertically adjacent (rough spatial grouping)
  const grouped = layer.buildings.reduce<Record<number, typeof layer.buildings>>((acc, b) => {
    (acc[b.position.x] = acc[b.position.x] || []).push(b);
    return acc;
  }, {});
  Object.values(grouped).forEach(group => {
    if (group.length > 1) {
      for (let i = 0; i < group.length - 1; i++) {
        lines.push(`  ${sanitizeId(group[i].id)} --- ${sanitizeId(group[i + 1].id)}`);
      }
    }
  });

  return lines.join('\n');
}

/** Generate Mermaid for a pipe layer (liquid / gas / power / automation / shipping) */
function genPipeDiagram(bp: ONIBlueprint, layerKey: LayerType): string {
  const layer = bp.layers[layerKey];
  if (!layer) return `graph LR\n  Empty[Không có dữ liệu layer ${layerKey}]`;

  const connections = layer.connections;
  const buildings = bp.layers.building?.buildings ?? [];

  if (connections.length === 0) return `graph LR\n  Empty[Layer ${layerKey} không có đường ống/dây nào]`;

  const emojiMap: Partial<Record<LayerType, string>> = {
    liquid:     '💧',
    gas:        '💨',
    power:      '⚡',
    automation: '🤖',
    shipping:   '📦',
  };
  const emoji = emojiMap[layerKey] || '•';

  const lines: string[] = ['graph TD'];

  // For each connection, find source/sink buildings by proximity to path endpoints
  connections.forEach((conn, connIdx) => {
    if (conn.path.length < 1) return;

    const startPt = conn.path[0];
    const endPt   = conn.path[conn.path.length - 1];

    type Building = (typeof buildings)[0];

    // Find building nearest to start and end points
    const findNearest = (pt: { x: number; y: number }): Building | null => {
      let best: Building | null = null;
      let bestDist = Infinity;
      buildings.forEach((b: Building) => {
        const inX = pt.x >= b.position.x - 1 && pt.x <= b.position.x + b.size.x;
        const inY = pt.y >= b.position.y - 1 && pt.y <= b.position.y + b.size.y;
        const dist = Math.sqrt((pt.x - (b.position.x + b.size.x / 2)) ** 2 + (pt.y - (b.position.y + b.size.y / 2)) ** 2);
        if ((inX && inY) || dist < bestDist) {
          bestDist = dist;
          best = b;
        }
      });
      return best;
    };

    const srcBuilding: Building | null = findNearest(startPt);
    const dstBuilding: Building | null = findNearest(endPt);

    const connId = `conn_${connIdx}`;
    const label = [conn.element, conn.capacity].filter(Boolean).join(' · ') || layerKey;

    if (srcBuilding && dstBuilding && (srcBuilding as Building).id !== (dstBuilding as Building).id) {
      const srcId = sanitizeId((srcBuilding as Building).id);
      const dstId = sanitizeId((dstBuilding as Building).id);
      lines.push(`  ${srcId}["${emoji} ${(srcBuilding as Building).name}"] -->|"${label}"| ${dstId}["${emoji} ${(dstBuilding as Building).name}"]`);
    } else {
      const pathDesc = `(${startPt.x},${startPt.y}) → (${endPt.x},${endPt.y})`;
      const srcLabel = srcBuilding ? (srcBuilding as Building).name : `Port (${startPt.x},${startPt.y})`;
      const dstLabel = dstBuilding ? (dstBuilding as Building).name : `Port (${endPt.x},${endPt.y})`;
      lines.push(`  ${connId}_s["${emoji} ${srcLabel}"] -->|"${label}\n${pathDesc}"| ${connId}_e["${emoji} ${dstLabel}"]`);
    }
  });

  return lines.join('\n');
}

/** Generate Composite: all layers merged, buildings as nodes, all connections as edges */
function genCompositeDiagram(bp: ONIBlueprint): string {
  const buildings = bp.layers.building?.buildings ?? [];

  // If hardcoded composite exists in schema, prefer it (richer, hand-crafted)
  if (bp.mermaidDiagrams?.composite) {
    return bp.mermaidDiagrams.composite;
  }

  if (buildings.length === 0) return 'graph TD\n  Empty[Không có dữ liệu công trình]';

  const lines: string[] = ['graph TD'];
  const addedEdges = new Set<string>();

  // All buildings as nodes
  buildings.forEach(b => {
    const id = sanitizeId(b.id);
    lines.push(`  ${id}["🏢 ${b.name}\\n(${b.position.x},${b.position.y}) ${b.size.x}×${b.size.y}"]`);
  });

  const emojiMap: Partial<Record<LayerType, string>> = {
    liquid: '💧', gas: '💨', power: '⚡', automation: '🤖', shipping: '📦',
  };

  // All connections across all layers
  const layerKeys: LayerType[] = ['liquid', 'gas', 'power', 'automation', 'shipping'];
  layerKeys.forEach(lk => {
    const layer = bp.layers[lk];
    if (!layer) return;
    const emoji = emojiMap[lk] || '';
    layer.connections.forEach((conn) => {
      if (conn.path.length < 1) return;
      const startPt = conn.path[0];
      const endPt   = conn.path[conn.path.length - 1];

      // Best-effort building lookup
      const findNearest = (pt: { x: number; y: number }) =>
        buildings.reduce<{ b: (typeof buildings)[0] | null; d: number }>((acc, b) => {
          const d = Math.sqrt((pt.x - (b.position.x + b.size.x / 2)) ** 2 + (pt.y - (b.position.y + b.size.y / 2)) ** 2);
          return d < acc.d ? { b, d } : acc;
        }, { b: null, d: Infinity }).b;

      const src = findNearest(startPt);
      const dst = findNearest(endPt);
      if (!src || !dst || src.id === dst.id) return;

      const edgeKey = `${src.id}__${dst.id}__${lk}`;
      if (addedEdges.has(edgeKey)) return;
      addedEdges.add(edgeKey);

      const label = [emoji, conn.element, conn.capacity].filter(Boolean).join(' ');
      lines.push(`  ${sanitizeId(src.id)} -->|"${label}"| ${sanitizeId(dst.id)}`);
    });
  });

  return lines.join('\n');
}

// ─── Component ───────────────────────────────────────────────────────────────

let mermaidRenderCounter = 0;

export const MermaidFlowTab: React.FC<MermaidFlowTabProps> = ({ blueprint }) => {
  const [selectedDiagram, setSelectedDiagram] = useState<LayerType | 'composite'>('composite');
  const [copied, setCopied] = useState<boolean>(false);
  const [showSource, setShowSource] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  const mermaidText = useMemo<string>(() => {
    switch (selectedDiagram) {
      case 'composite':   return genCompositeDiagram(blueprint);
      case 'building':    return genBuildingDiagram(blueprint);
      case 'liquid':      return genPipeDiagram(blueprint, 'liquid');
      case 'gas':         return genPipeDiagram(blueprint, 'gas');
      case 'power':       return genPipeDiagram(blueprint, 'power');
      case 'automation':  return genPipeDiagram(blueprint, 'automation');
      case 'shipping':    return genPipeDiagram(blueprint, 'shipping');
      default:            return `graph TD\n  X[Unknown]`;
    }
  }, [blueprint, selectedDiagram]);

  // Render mermaid diagram into DOM
  useEffect(() => {
    if (showSource || !diagramRef.current) return;
    setRenderError(null);
    const containerId = `mermaid-render-${++mermaidRenderCounter}`;
    mermaid.render(containerId, mermaidText)
      .then(({ svg }) => {
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg;
          // Make SVG responsive
          const svgEl = diagramRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
          }
        }
      })
      .catch((err: Error) => {
        setRenderError(`Lỗi render diagram: ${err.message}`);
      });
  }, [mermaidText, showSource]);

  const nodeCount = (mermaidText.match(/^\s+\w+[[({"']/gm) || []).length;
  const edgeCount = (mermaidText.match(/-->/g) || []).length;

  const handleCopy = () => {
    navigator.clipboard.writeText('```mermaid\n' + mermaidText + '\n```');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: Array<{ key: LayerType | 'composite'; label: string; emoji: string }> = [
    { key: 'composite',   label: 'Composite',  emoji: '🔗' },
    { key: 'building',    label: 'Building',   emoji: '🏢' },
    { key: 'liquid',      label: 'Liquid Pipe',emoji: '🔵' },
    { key: 'gas',         label: 'Gas Pipe',   emoji: '🟢' },
    { key: 'power',       label: 'Power Grid', emoji: '🟡' },
    { key: 'automation',  label: 'Automation', emoji: '🔴' },
    { key: 'shipping',    label: 'Shipping',   emoji: '📦' },
  ];

  return (
    <div className={styles.mermaidContainer}>
      <div className={styles.selectorBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`${styles.selectorBtn} ${selectedDiagram === t.key ? styles.active : ''}`}
            onClick={() => setSelectedDiagram(t.key)}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div className={styles.diagramMeta}>
        <span className={styles.metaTag}>
          <GitBranch size={12} /> {nodeCount} Nodes · {edgeCount} Edges
        </span>
        <span className={styles.metaTag} style={{ color: '#888', fontStyle: 'italic' }}>
          Layer: {selectedDiagram}
        </span>
        <button
          className={styles.toggleBtn}
          onClick={() => setShowSource(s => !s)}
          title={showSource ? 'Xem diagram' : 'Xem source code'}
        >
          {showSource ? <><Eye size={13} /> Diagram</> : <><Code2 size={13} /> Source</>}
        </button>
      </div>

      {showSource ? (
        <pre className={styles.codeBox}>{mermaidText}</pre>
      ) : (
        <div className={styles.diagramWrapper}>
          {renderError ? (
            <div className={styles.renderError}>
              <p>⚠️ {renderError}</p>
              <pre className={styles.codeBox}>{mermaidText}</pre>
            </div>
          ) : (
            <div ref={diagramRef} className={styles.diagramOutput} />
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={styles.mermaidNotice}>
          * Diagram sinh từ layer schema. Copy để dán vào Chat.
        </span>
        <button className={styles.copyBtn} onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Đã sao chép!' : 'Copy ```mermaid'}
        </button>
      </div>
    </div>
  );
};
