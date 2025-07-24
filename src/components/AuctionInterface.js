import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { EMOJIS } from "../utils/constants";
import PlayerImage from "./PlayerImage";
import PlayerInfo from "./PlayerInfo";
import ConfirmationDialogs from "./ConfirmationDialogs";

const AuctionInterface = forwardRef(({
    currentPlayer,
    teams,
    teamNameInput,
    setTeamNameInput,
    bidAmountInput,
    setBidAmountInput,
    onMarkSold,
    onMarkUnsold,
    onNextPlayer,
    soldCount,
    markedUnsoldCount,
    currentCategoryUnsoldCount,
    onViewTeams,
    selectedCategory,
    round,
    isUnsoldRound,
    playerProcessed,
    onChangeCategory,
    showManagedToast,
    isLastPlayerInQueue,
    categoryStarted,
    onStartCategory
}, ref) => {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [imageKey, setImageKey] = useState(0);
    
    // Animation states for temporary stamp display
    const [showSoldStamp, setShowSoldStamp] = useState(false);
    const [showUnsoldStamp, setShowUnsoldStamp] = useState(false);

    // State for confirmation dialogs
    const [showCategoryChangeConfirm, setShowCategoryChangeConfirm] = useState(false);
    const [showSoldConfirm, setShowSoldConfirm] = useState(false);
    const [showUnsoldConfirm, setShowUnsoldConfirm] = useState(false);

    // Reset animations for new player
    useEffect(() => {
        if (currentPlayer) {
            console.log('=== PLAYER CHANGE DEBUG ===');
            console.log('Current player:', currentPlayer.name);
            console.log('Player sold:', currentPlayer.sold);
            console.log('Player soldTo:', currentPlayer.soldTo);
            
            setImageKey(prev => prev + 1);
            setShowSoldStamp(false);
            setShowUnsoldStamp(false);
            
            // Check if player is already sold/unsold (restoration scenario)
            const isPlayerSold = currentPlayer.sold && currentPlayer.soldTo !== "Unsold";
            const isPlayerUnsold = currentPlayer.soldTo === "Unsold";
            
            if (isPlayerSold || isPlayerUnsold) {
                // Show notification that player is already processed
                const statusText = isPlayerSold ? 
                    `already sold to ${currentPlayer.soldTo} for ?${currentPlayer.soldPrice?.toLocaleString()}` :
                    'already marked as unsold';
                    
                showManagedToast && showManagedToast('info', 
                    `${currentPlayer.name} is ${statusText}. Showing next available player...`, {
                    style: {
                        border: '2px solid #0ea5e9',
                        padding: '16px',
                        color: '#0c4a6e',
                        fontWeight: 'bold',
                        fontSize: '1.05rem',
                        background: 'linear-gradient(90deg, #e0f7ff 0%, #f0f9ff 100%)',
                        boxShadow: '0 4px 24px 0 #0ea5e9',
                    },
                    icon: EMOJIS.RESTORE,
                    duration: 4000,
                });
            }
        }
    }, [currentPlayer, showManagedToast]);

    // Bidding handlers
    const handleMarkSold = () => {
        const bidAmount = parseInt(bidAmountInput, 10);
        if (teamNameInput && !isNaN(bidAmount) && bidAmount > 0) {
            setShowSoldConfirm(true);
        }
    };

    const confirmSold = () => {
        const bidAmount = parseInt(bidAmountInput, 10);
        setShowSoldConfirm(false);
        onMarkSold(teamNameInput, bidAmount);
    };

    const handleMarkUnsold = () => {
        setShowUnsoldConfirm(true);
    };

    const confirmUnsold = () => {
        setShowUnsoldConfirm(false);
        setShowUnsoldStamp(true);
        onMarkUnsold();
    };

    // Navigation handlers
    const handleNextPlayer = () => {
        setShowSoldStamp(false);
        setShowUnsoldStamp(false);
        setIsTransitioning(true);
        
        if (isLastPlayerInQueue) {
            console.log("Last player in queue - skipping countdown animation");
            setTimeout(() => {
                onNextPlayer();
                setIsTransitioning(false);
                setCountdown(null);
            }, 500);
        } else {
            setCountdown(3);
        }
    };

    // Countdown effect
    useEffect(() => {
        if (countdown === null) return;

        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => {
                onNextPlayer();
                setIsTransitioning(false);
                setCountdown(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [countdown, onNextPlayer]);

    // Category change handler
    const handleCategoryChangeRequest = () => {
        setShowCategoryChangeConfirm(true);
    };

    const confirmCategoryChange = () => {
        setShowCategoryChangeConfirm(false);
        
        showManagedToast && showManagedToast('success', `Category changed! Please select a new category.`, {
            style: {
                border: '2px solid #7c3aed',
                padding: '16px',
                color: '#4c1d95',
                fontWeight: 'bold',
                fontSize: '1.05rem',
                background: 'linear-gradient(90deg, #ede9fe 0%, #f3e8ff 100%)',
                boxShadow: '0 4px 24px 0 #c084fc',
            },
            icon: EMOJIS.REFRESH,
            duration: 3000,
        });
        
        onChangeCategory();
    };

    // Expose stamp animation functions to parent component
    useImperativeHandle(ref, () => ({
        triggerSoldStamp: () => setShowSoldStamp(true),
        triggerUnsoldStamp: () => setShowUnsoldStamp(true)
    }));

    return (
        <div className="mb-32 space-y-3">
            {/* Category and Round Information */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md p-3">
                <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{EMOJIS.CLIPBOARD}</span>
                        <div>
                            <div className="text-sm opacity-75">Category</div>
                            <div className="text-lg font-bold">{selectedCategory}</div>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-white opacity-30"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{isUnsoldRound ? EMOJIS.REFRESH : EMOJIS.TARGET}</span>
                        <div>
                            <div className="text-sm opacity-75">Round</div>
                            <div className="text-lg font-bold">
                                {isUnsoldRound ? `Unsold ${round}` : `Round ${round}`}
                            </div>
                        </div>
                    </div>
                    
                    {/* Change Category button */}
                    {currentPlayer && !playerProcessed && soldCount === 0 && markedUnsoldCount === 0 && round === 1 && !isUnsoldRound && (
                        <>
                            <div className="w-px h-6 bg-white opacity-30"></div>
                            <button
                                onClick={handleCategoryChangeRequest}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 border border-white border-opacity-30 hover:border-opacity-50"
                                title="Change category if selected by mistake"
                            >
                                {EMOJIS.REFRESH} Change Category
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Statistics */}
            {categoryStarted && (
                <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-3">
                    <div className="flex justify-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-green-500 text-base">{EMOJIS.CHECK_MARK}</span>
                            <span className="text-gray-700 font-medium text-sm">Sold:</span>
                            <span className="text-green-600 font-bold text-lg">{soldCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 text-base">{EMOJIS.CROSS_MARK}</span>
                            <span className="text-gray-700 font-medium text-sm">Unsold:</span>
                            <span className="text-red-600 font-bold text-lg">{markedUnsoldCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-blue-500 text-base">{EMOJIS.PEOPLE}</span>
                            <span className="text-gray-700 font-medium text-sm">Remaining:</span>
                            <span className="text-blue-600 font-bold text-lg">{currentCategoryUnsoldCount}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            {!categoryStarted ? (
                /* START Category Section */
                <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8">
                    <div className="text-center">
                        <div className="text-6xl mb-6">{EMOJIS.TARGET}</div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">
                            Ready to Start {selectedCategory} Category!
                        </h2>
                        <p className="text-gray-600 mb-8 text-lg">
                            Click the button below to begin the auction for this category.
                            Players will be presented one by one for bidding.
                        </p>
                        <button
                            onClick={onStartCategory}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-lg text-xl font-bold shadow-lg hover:from-green-600 hover:to-emerald-700 transition transform hover:scale-105"
                        >
                            {EMOJIS.TARGET} START AUCTION
                        </button>
                    </div>
                </div>
            ) : (
                /* Auction Interface */
                <div className={`bg-white bg-opacity-90 rounded-xl shadow-lg p-6 transition-all duration-500 ${
                    isTransitioning ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
                }`}>
                    <div className="flex gap-8 items-center relative">
                        {/* Countdown Overlay */}
                        {countdown !== null && countdown > 0 && (
                            <div className="absolute inset-0 bg-black bg-opacity-75 rounded-xl flex items-center justify-center z-20">
                                <div className="text-white text-8xl font-bold animate-pulse">
                                    {countdown}
                                </div>
                            </div>
                        )}

                        {/* Left Section - Player Photo */}
                        <div className="flex-shrink-0 flex items-center justify-center relative">
                            <PlayerImage 
                                currentPlayer={currentPlayer}
                                imageKey={imageKey}
                                setImageKey={setImageKey}
                            />
                        </div>

                        {/* Right Section - Player Info & Controls */}
                        <div className="flex-1 ml-8 space-y-5">
                            <PlayerInfo 
                                currentPlayer={currentPlayer}
                                showSoldStamp={showSoldStamp}
                                showUnsoldStamp={showUnsoldStamp}
                            />

                            {/* Bidding Controls */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="font-semibold text-gray-700">Team Name</label>
                                        <select
                                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            value={teamNameInput}
                                            onChange={e => setTeamNameInput(e.target.value)}
                                            disabled={playerProcessed || isTransitioning}
                                        >
                                            <option value="">Select Team</option>
                                            {Object.keys(teams).map(team => (
                                                <option key={team} value={team}>{team}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-semibold text-gray-700">Bid Amount ({EMOJIS.CURRENCY_RUPEE})</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            value={bidAmountInput}
                                            onChange={e => setBidAmountInput(e.target.value)}
                                            placeholder="Enter amount"
                                            disabled={playerProcessed || isTransitioning}
                                        />
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                {!playerProcessed ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleMarkSold}
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50"
                                            disabled={!currentPlayer || !teamNameInput || !bidAmountInput || isNaN(parseInt(bidAmountInput, 10)) || parseInt(bidAmountInput, 10) <= 0 || isTransitioning}
                                        >
                                            Mark as Sold
                                        </button>
                                        <button
                                            onClick={handleMarkUnsold}
                                            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md hover:from-red-600 hover:to-pink-600 transition"
                                            disabled={!currentPlayer || isTransitioning}
                                        >
                                            Mark as Unsold
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleNextPlayer}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md hover:from-blue-600 hover:to-purple-700 transition transform hover:scale-105"
                                            disabled={isTransitioning}
                                        >
                                            {isTransitioning ? (
                                                countdown !== null && countdown > 0 ? (
                                                    <span className="flex items-center gap-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Loading Next...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Loading...
                                                    </span>
                                                )
                                            ) : (
                                                'Next Player'
                                            )}
                                        </button>
                                        <button
                                            onClick={onViewTeams}
                                            className="bg-gradient-to-r from-yellow-400 to-pink-500 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md hover:from-yellow-500 hover:to-pink-600 transition"
                                            disabled={isTransitioning}
                                        >
                                            {EMOJIS.PEOPLE} View Teams
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialogs */}
            <ConfirmationDialogs
                showSoldConfirm={showSoldConfirm}
                showUnsoldConfirm={showUnsoldConfirm}
                showCategoryChangeConfirm={showCategoryChangeConfirm}
                currentPlayer={currentPlayer}
                teamNameInput={teamNameInput}
                bidAmountInput={bidAmountInput}
                onConfirmSold={confirmSold}
                onCancelSold={() => setShowSoldConfirm(false)}
                onConfirmUnsold={confirmUnsold}
                onCancelUnsold={() => setShowUnsoldConfirm(false)}
                onConfirmCategoryChange={confirmCategoryChange}
                onCancelCategoryChange={() => setShowCategoryChangeConfirm(false)}
            />
        </div>
    );
});

export default AuctionInterface;