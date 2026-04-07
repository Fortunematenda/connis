import { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart3 } from 'lucide-react';
import { customersApi } from '../services/api';

// ── Config ──
const POLL_MS = 2000;
const CHART_H = 320;
const PAD = { top: 20, right: 16, bottom: 40, left: 72 };

const DURATION_OPTIONS = [
  { ms: 60000, label: '1 minute' },
  { ms: 120000, label: '2 minutes' },
  { ms: 300000, label: '5 minutes' },
  { ms: 600000, label: '10 minutes' },
];

function fmtBps(bps) {
  if (!bps || bps <= 0) return '0 bps';
  if (bps >= 1e9) return (bps / 1e9).toFixed(2) + ' Gbps';
  if (bps >= 1e6) return (bps / 1e6).toFixed(2) + ' Mbps';
  if (bps >= 1e3) return (bps / 1e3).toFixed(0) + ' Kbps';
  return Math.round(bps) + ' bps';
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function niceMax(val) {
  if (val <= 0) return 1000;
  const exp = Math.pow(10, Math.floor(Math.log10(val)));
  return Math.ceil(val / exp) * exp;
}

// ── Main Component ──
export default function LiveBandwidth({ customerId }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dataRef = useRef([]);
  const prevRef = useRef(null);
  const durationRef = useRef(60000);
  const animRef = useRef(null);

  const [duration, setDuration] = useState(60000);
  const [offline, setOffline] = useState(false);
  const [currentRate, setCurrentRate] = useState({ upload: 0, download: 0 });

  durationRef.current = duration;

  // ── Poll MikroTik every 2s ──
  const poll = useCallback(async () => {
    try {
      const res = await customersApi.getLiveBandwidth(customerId);
      const traffic = res.data;
      if (!traffic) { setOffline(true); prevRef.current = null; return; }

      setOffline(false);
      const now = Date.now();

      if (prevRef.current) {
        const dt = (now - prevRef.current.timestamp) / 1000;
        if (dt > 0.5) {
          const down = Math.max(0, (traffic.txBytes - prevRef.current.txBytes) / dt);
          const up = Math.max(0, (traffic.rxBytes - prevRef.current.rxBytes) / dt);
          setCurrentRate({ upload: up * 8, download: down * 8 });
          dataRef.current.push({ time: now, upload: up, download: down });
          const cutoff = now - 600000;
          dataRef.current = dataRef.current.filter(p => p.time > cutoff);
        }
      }
      prevRef.current = { txBytes: traffic.txBytes, rxBytes: traffic.rxBytes, timestamp: now };
    } catch { /* ignore */ }
  }, [customerId]);

  // ── Start polling ──
  useEffect(() => {
    prevRef.current = null;
    dataRef.current = [];
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  // ── Canvas draw loop at 60fps ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const container = containerRef.current;
      if (!container) { animRef.current = requestAnimationFrame(draw); return; }

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = CHART_H;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cw = w - PAD.left - PAD.right;
      const ch = h - PAD.top - PAD.bottom;
      ctx.clearRect(0, 0, w, h);

      const now = Date.now();
      const dur = durationRef.current;
      const tStart = now - dur;
      const tEnd = now;

      let pts = dataRef.current.filter(p => p.time >= tStart && p.time <= tEnd);

      // Fill edges: extend first point to tStart and last point to tEnd
      if (pts.length > 0) {
        const first = pts[0];
        const last = pts[pts.length - 1];
        if (first.time > tStart + 2000) {
          pts = [{ time: tStart, upload: 0, download: 0 }, ...pts];
        }
        if (last.time < tEnd - 2000) {
          pts = [...pts, { time: tEnd, upload: last.upload, download: last.download }];
        }
      }

      let maxVal = 0;
      pts.forEach(p => { maxVal = Math.max(maxVal, p.upload, p.download); });
      maxVal = niceMax(maxVal);

      // Horizontal grid
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      const gridRows = 5;
      for (let i = 0; i <= gridRows; i++) {
        const y = PAD.top + (ch / gridRows) * i;
        ctx.beginPath();
        ctx.moveTo(PAD.left, y);
        ctx.lineTo(PAD.left + cw, y);
        ctx.stroke();
      }

      // Vertical grid every 10s
      const tickInterval = dur <= 60000 ? 10000 : dur <= 120000 ? 20000 : dur <= 300000 ? 30000 : 60000;
      const firstTick = Math.ceil(tStart / tickInterval) * tickInterval;
      ctx.strokeStyle = '#f5f5f5';
      for (let t = firstTick; t <= tEnd; t += tickInterval) {
        const x = PAD.left + ((t - tStart) / (tEnd - tStart)) * cw;
        ctx.beginPath();
        ctx.moveTo(x, PAD.top);
        ctx.lineTo(x, PAD.top + ch);
        ctx.stroke();
      }

      // Y-axis labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= gridRows; i++) {
        const y = PAD.top + (ch / gridRows) * i;
        const val = maxVal * (1 - i / gridRows);
        ctx.fillText(fmtBps(val * 8), PAD.left - 8, y);
      }

      // X-axis labels
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let t = firstTick; t <= tEnd; t += tickInterval) {
        const x = PAD.left + ((t - tStart) / (tEnd - tStart)) * cw;
        ctx.fillText(fmtTime(t), x, PAD.top + ch + 6);
      }

      // Draw filled area with smooth bezier
      function drawArea(data, key, strokeColor, fillColor) {
        if (data.length < 2) return;
        const toX = (t) => PAD.left + ((t - tStart) / (tEnd - tStart)) * cw;
        const toY = (v) => PAD.top + ch - (v / maxVal) * ch;

        ctx.beginPath();
        ctx.moveTo(toX(data[0].time), PAD.top + ch);
        for (let i = 0; i < data.length; i++) {
          const x = toX(data[i].time);
          const y = toY(data[i][key]);
          if (i === 0) ctx.lineTo(x, y);
          else {
            const prev = data[i - 1];
            const px = toX(prev.time);
            const py = toY(prev[key]);
            const cpx = (px + x) / 2;
            ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
          }
        }
        ctx.lineTo(toX(data[data.length - 1].time), PAD.top + ch);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
          const x = toX(data[i].time);
          const y = toY(data[i][key]);
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prev = data[i - 1];
            const px = toX(prev.time);
            const py = toY(prev[key]);
            const cpx = (px + x) / 2;
            ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
          }
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      drawArea(pts, 'upload', '#fda4af', 'rgba(253,164,175,0.25)');
      drawArea(pts, 'download', '#93c5fd', 'rgba(147,197,253,0.25)');

      // Axes
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.left, PAD.top);
      ctx.lineTo(PAD.left, PAD.top + ch);
      ctx.lineTo(PAD.left + cw, PAD.top + ch);
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* ── Panel Header ── */}
      <div className="px-4 py-3 border-b bg-gray-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-500" />
          <h4 className="text-[13px] font-semibold text-gray-800">Live bandwidth usage</h4>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="h-[30px] px-2 text-xs border border-gray-300 rounded bg-white text-gray-700 outline-none focus:border-blue-400 cursor-pointer"
          >
            {DURATION_OPTIONS.map(opt => (
              <option key={opt.ms} value={opt.ms}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Panel Body: Chart ── */}
      <div className="relative" ref={containerRef} style={{ height: CHART_H }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        {offline && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/80 z-10">
            <BarChart3 size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">User is offline</p>
          </div>
        )}
      </div>

      {/* ── Footer: Legend + Rates ── */}
      <div className="border-t py-3 text-center">
        <div className="flex items-center justify-center gap-5 mb-1.5">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: '#fda4af' }} />
            Upload
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: '#93c5fd' }} />
            Download
          </span>
        </div>
        <p className="text-[11px] text-gray-400">Upload / Download</p>
        <p className="text-sm font-bold text-gray-700">
          {fmtBps(currentRate.upload)} / {fmtBps(currentRate.download)}
        </p>
      </div>
    </div>
  );
}
