import React from "react";
import { EMOJIS } from "../utils/constants";

const PlayerInfo = ({ 
    currentPlayer, 
    showSoldStamp, 
    showUnsoldStamp 
}) => {
    return (
        <div>
            <div className="relative inline-block">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    {currentPlayer?.name || 'No Player'}
                </h2>
                {/* SOLD Stamp Animation */}
                {showSoldStamp && (
                    <div className="absolute top-0 -right-2 transform translate-x-full z-20">
                        <div className="animate-pulse border-2 border-green-500 text-green-500 bg-transparent px-3 py-1 rounded-full shadow-lg">
                            <div className="flex items-center gap-1">
                                <span className="text-base font-bold">SOLD</span>
                                <span className="text-sm">{EMOJIS.CHECK_MARK}</span>
                            </div>
                        </div>
                    </div>
                )}
                {/* UNSOLD Stamp Animation */}
                {showUnsoldStamp && (
                    <div className="absolute top-0 -right-2 transform translate-x-full z-20">
                        <div className="animate-pulse border-2 border-red-500 text-red-500 bg-transparent px-3 py-1 rounded-full shadow-lg">
                            <div className="flex items-center gap-1">
                                <span className="text-base font-bold">UNSOLD</span>
                                <span className="text-sm">{EMOJIS.CROSS_MARK}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="space-y-2">
                <div className="text-gray-600 flex items-center gap-2 text-lg">
                    <span>{EMOJIS.SOCCER_BALL}</span>
                    <span className="font-medium">Skill:</span>
                    <span>{currentPlayer?.skill}</span>
                </div>
                <div className="text-purple-700 flex items-center gap-2 text-lg">
                    <span>{EMOJIS.CLIPBOARD}</span>
                    <span className="font-medium">Category:</span>
                    <span className="font-semibold">{currentPlayer?.category}</span>
                </div>
            </div>

            {/* Status Display */}
            {currentPlayer && currentPlayer.sold && (
                <div className="text-green-600 font-bold text-lg mt-3 animate-pulse">
                    SOLD to {currentPlayer.soldTo} for {EMOJIS.CURRENCY_RUPEE}{currentPlayer.soldPrice?.toLocaleString()}
                </div>
            )}
            {currentPlayer && currentPlayer.soldTo === 'Unsold' && (
                <div className="text-red-600 font-bold text-lg mt-3 animate-pulse">UNSOLD</div>
            )}
        </div>
    );
};

export default PlayerInfo;