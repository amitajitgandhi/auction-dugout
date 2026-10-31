import React, { useState } from 'react';

export default function StandardNavigationMenu({
  currentPage,
  onAuction,
  onTeamSummary,
  onPlayerSummary,
  onUnsoldPlayers,
  onMaxBid,
  onLogout,
  children
}) {
  const [open, setOpen] = useState(false);
  const items = [
    ['auction', '🏏', 'Auction', onAuction],
    ['teams', '👥', 'Team Summary', onTeamSummary],
    ['masterplayers', '📋', 'Player Summary', onPlayerSummary],
    ['unsoldplayers', '❌', 'Unsold Players', onUnsoldPlayers],
    ['maxbid', '🏆', 'Max Bid', onMaxBid]
  ];

  return (
    <div className="fixed top-16 right-4 z-50">
      <button onClick={() => setOpen(v => !v)} className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-3 rounded-lg shadow-md hover:scale-105 transition-all" aria-label="Menu">
        <div className="w-6 h-6 flex flex-col justify-center space-y-1"><div className="w-6 h-0.5 bg-white rounded"/><div className="w-6 h-0.5 bg-white rounded"/><div className="w-6 h-0.5 bg-white rounded"/></div>
      </button>
      {open && <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        {items.map(([key, icon, label, action]) => key === currentPage
          ? <div key={key} className="px-4 py-3 bg-indigo-50 text-indigo-700 font-bold flex gap-3"><span>{icon}</span>{label}</div>
          : <button key={key} onClick={() => { action?.(); setOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex gap-3"><span>{icon}</span><span className="text-gray-700 font-medium">{label}</span></button>
        )}
        {children && <>{children}</>}
        {onLogout && (
          <>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full text-left px-4 py-3 hover:bg-red-50 flex gap-3"
            >
              <span>↪️</span>
              <span className="text-red-600 font-semibold">Logout</span>
            </button>
          </>
        )}
      </div>}
      {open && <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />}
    </div>
  );
}