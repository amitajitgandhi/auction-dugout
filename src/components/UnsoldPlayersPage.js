import React, { useMemo, useState } from 'react';
import { EMOJIS } from '../utils/constants';

const UnsoldPlayersPage = ({
  players,
  teams,
  tournamentName,
  tickerDetails = "",
  onBackToTeams,
  onSellUnsoldPlayer,
  showManagedToast
}) => {
  const [playerInputs, setPlayerInputs] = useState({});
  // Show players that were ever unsold (wasUnsold flag) OR currently unsold
  const unsoldPlayers = useMemo(() => players.filter(p => p.soldTo === 'Unsold' || p.wasUnsold), [players]);

  const handleInputChange = (playerId, field, value) => {
    setPlayerInputs(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  };

  const handleSubmitSale = async (player) => {
    const inputs = playerInputs[player.id] || {};
    const price = parseInt(inputs.price, 10);
    const teamName = inputs.team;
    if (!teamName || isNaN(price) || price <= 0) {
      showManagedToast && showManagedToast('error', 'Select team and valid price before submitting.', { icon: EMOJIS.CROSS_MARK, duration: 3000 });
      return;
    }
    if (player.sold && player.soldTo !== 'Unsold') return; // already processed
    const result = await onSellUnsoldPlayer(player, teamName, price);
    if (result?.success) {
      showManagedToast && showManagedToast('success', `${player.name} sold to ${teamName} for ₹${price.toLocaleString()}`, { icon: EMOJIS.CHECK_MARK, duration: 3000 });
    } else if (result?.message) {
      showManagedToast && showManagedToast('error', result.message, { icon: EMOJIS.CROSS_MARK, duration: 3000 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 bg-fixed relative overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white py-2 shadow-lg">
        <div className="overflow-hidden whitespace-nowrap"><div className="animate-marquee inline-block font-bold text-lg">{EMOJIS.TROPHY} {tournamentName.toUpperCase()} - UNSOLD PLAYERS {EMOJIS.TROPHY}</div></div>
      </div>
      <div className="pt-16 pb-20 px-4">
        <div className="w-full max-w-5xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">Unsold Players</h1>
            <p className="text-gray-300 text-lg mb-6">Assign price and team. After selling, inputs are disabled and submit removed but player stays listed.</p>
            <button onClick={onBackToTeams} className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:from-gray-600 hover:to-gray-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center gap-3 mx-auto text-lg"><span className="text-xl">{EMOJIS.BACK_ARROW}</span>Back to Team Summary Page</button>
          </div>
          <div className="bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span>{EMOJIS.CLIPBOARD}</span>Unsold Players List</h3>
                <p className="text-gray-600 text-sm mt-1">Total Listed: {unsoldPlayers.length}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Player</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Photo</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Assign Price</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Sold To Team</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unsoldPlayers.length === 0 && (<tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500 text-sm">No unsold players yet.</td></tr>)}
                  {unsoldPlayers.map((player, idx) => {
                    const isProcessed = player.sold && player.soldTo !== 'Unsold';
                    const inputs = playerInputs[player.id] || {};
                    return (
                      <tr key={player.id} className={`border-t border-gray-200 hover:bg-gray-50 ${isProcessed ? 'opacity-70' : ''}`}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-700">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-gray-800">{player.name}</td>
                        <td className="px-4 py-2 text-sm text-blue-600">
                          {player.driveLink ? (
                            <a
                              href={player.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-blue-800"
                              title={`Open photo of ${player.name}`}
                            >
                              View
                            </a>
                          ) : player.photo ? (
                            <a
                              href={player.photo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-blue-800"
                              title={`Open photo of ${player.name}`}
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{player.category}</td>
                        <td className="px-4 py-2">
                          <input type="number" min={1} value={isProcessed ? player.soldPrice : (inputs.price || '')} onChange={e => handleInputChange(player.id, 'price', e.target.value)} disabled={isProcessed} className={`w-28 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${isProcessed ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`} placeholder="Price" />
                        </td>
                        <td className="px-4 py-2">
                          <select value={isProcessed ? player.soldTo : (inputs.team || '')} onChange={e => handleInputChange(player.id, 'team', e.target.value)} disabled={isProcessed} className={`border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${isProcessed ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}>
                            <option value="">Select Team</option>
                            {Object.keys(teams).map(team => <option key={team} value={team}>{team}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          {isProcessed ? (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">SOLD</span>
                          ) : (
                            <button onClick={() => handleSubmitSale(player)} disabled={isProcessed} className="px-4 py-1.5 rounded-lg text-sm font-semibold shadow-md bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-200">Submit</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full text-center py-4 mt-8 text-white bg-black bg-opacity-60 text-lg font-semibold tracking-wide fixed bottom-0 left-0 z-50">Product by Amit Gandhi</footer>
    </div>
  );
};

export default UnsoldPlayersPage;