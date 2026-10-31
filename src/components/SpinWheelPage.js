import React, { useEffect, useRef, useState } from 'react';

export default function SpinWheelPage({ mode, onBack }) {
  const jersey = mode === 'jersey';
  const title = jersey ? 'Jersey Color - Spin Wheel' : 'Table - Spin Wheel';
  const [labels, setLabels] = useState(() => Array.from({ length: 20 }, (_, i) => jersey ? '' : String(i + 1)));
  const [checked, setChecked] = useState(() => Array(20).fill(!jersey));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const options = labels.map((label, index) => ({ label: label.trim(), index }))
    .filter(option => checked[option.index] && option.label);
  const count = options.length;
  const colors = ['#2563eb', '#7c3aed', '#0891b2', '#ea580c', '#16a34a', '#db2777', '#ca8a04', '#4f46e5'];
  const spin = () => {
    if (spinning || !count) return;
    const random = new Uint32Array(1);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) window.crypto.getRandomValues(random);
    else random[0] = Math.floor(Math.random() * 4294967296);
    const index = random[0] % count;
    const sector = 360 / count;
    const current = ((rotation % 360) + 360) % 360;
    const target = (360 - (index + 0.5) * sector) % 360;
    const delta = (target - current + 360) % 360;
    setWinner(null);
    setSpinning(true);
    setRotation(previous => previous + 360 * 6 + delta);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setWinner(options[index].label); setSpinning(false); }, 4700);
  };
  const changeLabel = (index, value) => {
    setLabels(previous => previous.map((label, i) => i === index ? value : label));
    setWinner(null);
  };
  const toggle = index => {
    setChecked(previous => previous.map((value, i) => i === index ? !value : value));
    setWinner(null);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="mb-5 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25">← Back to Team Summary</button>
        <h1 className="text-3xl font-extrabold mb-2">{title}</h1>
        <p className="text-indigo-200 mb-6">{jersey ? 'Enter jersey colors, check the ones to include, and spin.' : 'Check table numbers to include, then spin.'}</p>
        <div className="grid lg:grid-cols-2 gap-7">
          <section className="rounded-2xl bg-white text-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Options</h2><span className="text-sm text-slate-500">{count} selected</span></div>
            {!jersey && <div className="flex gap-2 mb-4">
              <button disabled={spinning} onClick={() => { setChecked(Array(20).fill(true)); setWinner(null); }} className="text-sm rounded bg-indigo-100 px-3 py-2 disabled:opacity-50">Select all</button>
              <button disabled={spinning} onClick={() => { setChecked(Array(20).fill(false)); setWinner(null); }} className="text-sm rounded bg-slate-100 px-3 py-2 disabled:opacity-50">Clear all</button>
            </div>}
            <div className={jersey ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-4 sm:grid-cols-5 gap-3'}>
              {labels.map((label, index) => (
                <label key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 cursor-pointer">
                  <input type="checkbox" checked={checked[index]} disabled={spinning} onChange={() => toggle(index)} className="h-5 w-5 accent-indigo-600" />
                  {jersey ? <input aria-label={`Jersey color ${index + 1}`} value={label} maxLength={60} disabled={spinning} onChange={event => changeLabel(index, event.target.value)} placeholder={`Color ${index + 1}`} className="min-w-0 w-full border-b border-slate-200 outline-none focus:border-indigo-600 px-1 py-1" /> : <span className="font-semibold">{label}</span>}
                </label>
              ))}
            </div>
            {jersey && <p className="text-xs text-slate-500 mt-4">Blank fields are excluded, even if checked.</p>}
          </section>
          <section className="rounded-2xl bg-white/10 p-5 shadow-xl flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-square">
              <div className="absolute z-10 top-0 left-1/2 -translate-x-1/2 -translate-y-1" style={{ width: 0, height: 0, borderLeft: '13px solid transparent', borderRight: '13px solid transparent', borderTop: '27px solid #fbbf24' }} />
              <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl" role="img" aria-label="Spin wheel">
                <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '200px 200px', transition: spinning ? 'transform 4.6s cubic-bezier(0.12, 0.7, 0.13, 1)' : 'none' }}>
                  {count ? options.map((option, index) => {
                    const angle = 2 * Math.PI / count;
                    const start = index * angle - Math.PI / 2;
                    const end = (index + 1) * angle - Math.PI / 2;
                    const x1 = 200 + 188 * Math.cos(start), y1 = 200 + 188 * Math.sin(start);
                    const x2 = 200 + 188 * Math.cos(end), y2 = 200 + 188 * Math.sin(end);
                    const mid = (index + 0.5) * angle - Math.PI / 2;
                    const radius = count > 12 ? 140 : 128;
                    return <g key={option.index}>
                      <path d={`M 200 200 L ${x1} ${y1} A 188 188 0 ${angle > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`} fill={colors[index % colors.length]} stroke="#fff" strokeWidth="2" />
                      <text x={200 + radius * Math.cos(mid)} y={200 + radius * Math.sin(mid)} textAnchor="middle" dominantBaseline="middle" fontSize={count > 12 ? 10 : 13} fontWeight="bold" fill="white">{option.label.length > 12 ? option.label.slice(0, 11) + '…' : option.label}</text>
                    </g>;
                  }) : <circle cx="200" cy="200" r="188" fill="#475569" />}
                  <circle cx="200" cy="200" r="25" fill="#fff" stroke="#334155" strokeWidth="4" />
                </g>
              </svg>
            </div>
            <button disabled={!count || spinning} onClick={spin} className="mt-5 w-full max-w-xs rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold py-3 text-lg">{spinning ? 'Spinning…' : winner ? 'Spin Again' : 'Spin Wheel'}</button>
            {!count && <p className="mt-3 text-amber-200">Select at least one {jersey ? 'nonempty color' : 'table number'}.</p>}
            {winner && !spinning && <div aria-live="polite" className="mt-5 text-center rounded-xl bg-emerald-500/20 border border-emerald-300 px-8 py-4 w-full"><p className="text-sm uppercase tracking-wider text-emerald-200">Result</p><p className="text-3xl font-extrabold break-words">{winner}</p></div>}
          </section>
        </div>
      </div>
    </div>
  );
}
