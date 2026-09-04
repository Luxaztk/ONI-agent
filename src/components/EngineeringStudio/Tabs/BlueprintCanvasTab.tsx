import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ONIBlueprint, LayerType, BuildingNode, ConnectionWire } from '../../../types/blueprint';
import styles from './BlueprintCanvasTab.module.scss';
import { Layers, Copy, Check, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// ─── Building type → visual config ──────────────────────────────────────────
const BUILDING_CONFIG: Record<string, { color: string; border: string; icon: string }> = {
  'Electrolyzer':           { color: '#1a3a5c', border: '#00aaff', icon: '⚡' },
  'Hydrogen Generator':     { color: '#2d1a0e', border: '#ff6b2b', icon: '🔥' },
  'Gas Pump':               { color: '#1a2d1a', border: '#4caf50', icon: '💨' },
  'Liquid Pump':            { color: '#0d2233', border: '#29b6f6', icon: '💧' },
  'Thermo Aquatuner':       { color: '#0d1a33', border: '#00e5ff', icon: '❄️' },
  'Steam Turbine':          { color: '#33220d', border: '#ff9800', icon: '🌪️' },
  'Geyser':                 { color: '#2d1800', border: '#ff6b2b', icon: '🌋' },
  'Smart Battery':          { color: '#1a1a2d', border: '#7b61ff', icon: '🔋' },
  'Atmo Sensor':            { color: '#2d1a2d', border: '#e040fb', icon: '📡' },
  'Gas Filter':             { color: '#1a2d1a', border: '#66bb6a', icon: '🔬' },
  'Desalinator':            { color: '#0d2233', border: '#29b6f6', icon: '🏭' },
  default:                  { color: '#1e2a3a', border: '#607d8b', icon: '🔧' }
};

const LAYER_COLORS: Record<LayerType | 'composite', string> = {
  building:   '#607d8b',
  liquid:     '#00e5ff',
  gas:        '#4caf50',
  power:      '#ffeb3b',
  automation: '#f44336',
  shipping:   '#ff9800',
  composite:  '#00e5ff',
};

const CELL = 48; // px per tile

function getBuildingCfg(type: string) {
  return BUILDING_CONFIG[type] || BUILDING_CONFIG.default;
}

// Rounded rect helper
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Draw glow on a path (for pipes)
function drawGlowPath(
  ctx: CanvasRenderingContext2D,
  path: { x: number; y: number }[],
  color: string,
  rows: number,
  lineWidth: number,
  glowWidth: number
) {
  if (path.length < 2) return;
  ctx.save();
  // Glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = glowWidth;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  path.forEach((pt, i) => {
    const cx = pt.x * CELL + CELL / 2;
    const cy = (rows - pt.y - 1) * CELL + CELL / 2;
    if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
  });
  ctx.stroke();
  ctx.restore();
}

interface BlueprintCanvasTabProps {
  blueprint: ONIBlueprint;
}

export const BlueprintCanvasTab: React.FC<BlueprintCanvasTabProps> = ({ blueprint }) => {
  const [activeLayer, setActiveLayer] = useState<LayerType | 'composite'>('composite');
  const [zoom, setZoom] = useState<number>(1.0);
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = blueprint.dimensions.x;
    const rows = blueprint.dimensions.y;
    const W = cols * CELL;
    const H = rows * CELL;

    canvas.width = W;
    canvas.height = H;

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, W, H);

    // ── Grid ────────────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
    }

    // ── Coordinate labels ───────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (let x = 0; x < cols; x++) {
      ctx.fillText(`${x}`, x * CELL + CELL / 2, 9);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y < rows; y++) {
      ctx.fillText(`${rows - y - 1}`, 18, y * CELL + CELL / 2 + 4);
    }

    // ── Draw Buildings ──────────────────────────────────────────────────────
    const drawBuildings = (alpha: number) => {
      const bLayer = blueprint.layers.building;
      if (!bLayer) return;
      ctx.globalAlpha = alpha;
      bLayer.buildings.forEach((b: BuildingNode) => {
        const px = b.position.x * CELL;
        const py = (rows - b.position.y - b.size.y) * CELL;
        const pw = b.size.x * CELL;
        const ph = b.size.y * CELL;
        const cfg = getBuildingCfg(b.type);

        // Shadow / glow
        ctx.save();
        ctx.shadowColor = cfg.border;
        ctx.shadowBlur = 12;

        // Body
        roundRect(ctx, px + 3, py + 3, pw - 6, ph - 6, 5);
        ctx.fillStyle = cfg.color;
        ctx.fill();
        ctx.strokeStyle = cfg.border;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Inner gradient sheen
        const grad = ctx.createLinearGradient(px + 3, py + 3, px + 3, py + ph - 6);
        grad.addColorStop(0, 'rgba(255,255,255,0.08)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        roundRect(ctx, px + 3, py + 3, pw - 6, ph - 6, 5);
        ctx.fillStyle = grad;
        ctx.fill();

        // Icon
        ctx.font = `${Math.min(pw, ph) * 0.35}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cfg.icon, px + pw / 2, py + ph * 0.38);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.min(11, pw / b.name.length * 1.6)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const label = b.name.length > 14 ? b.name.slice(0, 13) + '…' : b.name;
        ctx.fillText(label, px + pw / 2, py + ph - 8);

        // Material badge (small)
        if (b.primaryMaterial) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          const matW = Math.min(pw - 8, 70);
          ctx.fillRect(px + pw / 2 - matW / 2, py + ph - 21, matW, 13);
          ctx.fillStyle = '#aaa';
          ctx.font = '8px monospace';
          ctx.fillText(b.primaryMaterial, px + pw / 2, py + ph - 11);
        }

        // Port dots on edges
        ctx.fillStyle = cfg.border;
        ctx.shadowColor = cfg.border;
        ctx.shadowBlur = 6;
        // Input port (left center)
        ctx.beginPath();
        ctx.arc(px + 3, py + ph / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        // Output port (right center)
        ctx.beginPath();
        ctx.arc(px + pw - 3, py + ph / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1.0;
    };

    // ── Draw Pipes / Wires ──────────────────────────────────────────────────
    const drawPipes = (layerName: LayerType, alpha: number = 1.0) => {
      const l = blueprint.layers[layerName];
      if (!l) return;
      const color = LAYER_COLORS[layerName];
      const lineWidth = layerName === 'power' ? 3 : layerName === 'automation' ? 2 : 5;
      const glowWidth = layerName === 'power' ? 8 : 14;

      ctx.globalAlpha = alpha;
      l.connections.forEach((conn: ConnectionWire) => {
        drawGlowPath(ctx, conn.path, color, rows, lineWidth, glowWidth);

        // Draw flow direction arrows on middle segments
        if (conn.path.length >= 2) {
          const mid = Math.floor(conn.path.length / 2);
          const from = conn.path[mid - 1];
          const to = conn.path[mid];
          const fx = from.x * CELL + CELL / 2;
          const fy = (rows - from.y - 1) * CELL + CELL / 2;
          const tx = to.x * CELL + CELL / 2;
          const ty = (rows - to.y - 1) * CELL + CELL / 2;
          const angle = Math.atan2(ty - fy, tx - fx);
          const mx = (fx + tx) / 2;
          const my = (fy + ty) / 2;
          const arrowLen = 7;

          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.translate(mx, my);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(arrowLen, 0);
          ctx.lineTo(-arrowLen, -4);
          ctx.lineTo(-arrowLen, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Element/capacity label near midpoint
        if (conn.element || conn.capacity) {
          const midPt = conn.path[Math.floor(conn.path.length / 2)];
          const lx = midPt.x * CELL + CELL / 2;
          const ly = (rows - midPt.y - 1) * CELL + CELL / 2 - 10;
          ctx.save();
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.fillRect(lx - 30, ly - 10, 60, 14);
          ctx.fillStyle = color;
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${conn.element || ''} ${conn.capacity || ''}`.trim().slice(0, 14), lx, ly + 1);
          ctx.restore();
        }
      });
      ctx.globalAlpha = 1.0;
    };

    // ── Composite or single layer ───────────────────────────────────────────
    if (activeLayer === 'composite') {
      drawBuildings(0.75);
      drawPipes('liquid');
      drawPipes('gas');
      drawPipes('power');
      drawPipes('automation');
      drawPipes('shipping');
    } else if (activeLayer === 'building') {
      drawBuildings(1.0);
    } else {
      drawBuildings(0.2);
      drawPipes(activeLayer as LayerType);
    }

    // ── Legend bar ──────────────────────────────────────────────────────────
    const legendItems: [string, string][] = [
      ['🔵 Liquid', '#00e5ff'],
      ['🟢 Gas', '#4caf50'],
      ['🟡 Power', '#ffeb3b'],
      ['🔴 Automation', '#f44336'],
      ['🟠 Shipping', '#ff9800'],
    ];
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, H - 22, W, 22);
    legendItems.forEach(([label, color], i) => {
      ctx.fillStyle = color;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, 10 + i * (W / legendItems.length), H - 7);
    });

  }, [blueprint, activeLayer]);

  useEffect(() => { render(); }, [render]);

  const handleCopyString = () => {
    navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const layers: Array<{ key: LayerType | 'composite'; label: string; emoji: string }> = [
    { key: 'composite', label: 'Composite', emoji: '👁' },
    { key: 'building',  label: 'Building',  emoji: '🏢' },
    { key: 'liquid',    label: 'Liquid',    emoji: '🔵' },
    { key: 'gas',       label: 'Gas',       emoji: '🟢' },
    { key: 'power',     label: 'Power',     emoji: '🟡' },
    { key: 'automation',label: 'Automation',emoji: '🔴' },
    { key: 'shipping',  label: 'Shipping',  emoji: '📦' },
  ];

  return (
    <div className={styles.canvasContainer}>
      <div className={styles.toolbar}>
        <div className={styles.layerGroup}>
          <Layers size={14} color="#00e5ff" style={{ marginRight: 4 }} />
          {layers.map(l => (
            <button
              key={l.key}
              className={`${styles.layerBtn} ${activeLayer === l.key ? styles.active : ''}`}
              style={activeLayer === l.key ? { borderColor: LAYER_COLORS[l.key as LayerType] ?? '#00e5ff', color: LAYER_COLORS[l.key as LayerType] ?? '#00e5ff', boxShadow: `0 0 10px ${LAYER_COLORS[l.key as LayerType] ?? '#00e5ff'}55` } : {}}
              onClick={() => setActiveLayer(l.key)}
            >
              {l.emoji} {l.label}
            </button>
          ))}
        </div>
        <div className={styles.zoomGroup}>
          <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><ZoomOut size={14} /></button>
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.min(2, z + 0.25))}><ZoomIn size={14} /></button>
          <button className={styles.zoomBtn} onClick={() => setZoom(1)} title="Reset zoom"><RefreshCw size={13} /></button>
        </div>
      </div>

      <div className={styles.canvasWrapper}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' }}>
          <canvas ref={canvasRef} className={styles.bpCanvas} />
        </div>
      </div>

      <div className={styles.overlayInfo}>
        <div>
          <span className={styles.infoTitle}>{blueprint.title}</span>
          <span style={{ color: '#666', fontSize: '0.85rem', marginLeft: 8 }}>
            {blueprint.dimensions.x}×{blueprint.dimensions.y} Tiles · {blueprint.difficulty}
          </span>
        </div>
        <button className={styles.copyBtn} onClick={handleCopyString}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Đã sao chép!' : 'Copy Blueprint JSON'}
        </button>
      </div>
    </div>
  );
};
