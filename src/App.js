import React, { useState, useRef, useEffect } from "react";
import ReactConfetti from "react-confetti";
import { Toaster } from "react-hot-toast";

import TournamentSetup from "./components/TournamentSetup";
import FileUpload from "./components/FileUpload";
import CategoryConfig from "./components/CategoryConfig";
import CategorySelection from "./components/CategorySelection";
import AuctionInterface from "./components/AuctionInterface";
import TeamsPage from "./components/TeamsPage";
import MaxBidPage from "./components/MaxBidPage";
import ResetConfirmation from "./components/ResetConfirmation";
import WhatsAppSettings from "./components/WhatsAppSettings";
import AuthPage from "./components/AuthPage";
import UnsoldPlayersPage from "./components/UnsoldPlayersPage"; // NEW PAGE
import MasterPlayersPage from "./components/MasterPlayersPage";

import { useAuth } from "./hooks/useAuth";
import { useAuction } from "./hooks/useAuction";
import { usePersistence } from "./hooks/usePersistence";
import { useToastManager } from "./hooks/useToastManager";
import { useWhatsAppIntegration } from "./hooks/useWhatsAppIntegration";
import { useAuctionBusinessLogic } from "./hooks/useAuctionBusinessLogic";
import { useAutoSave } from "./hooks/useAutoSave";
import { useStartupRestore } from "./hooks/useStartupRestore";

import { TOAST_STYLES, EMOJIS } from "./utils/constants";

export default function CricketAuctionTool() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [tournamentName, setTournamentName] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [tickerDetails, setTickerDetails] = useState("");
  const [isTournamentNameSet, setIsTournamentNameSet] = useState(false);
  const [currentPage, setCurrentPage] = useState('auction');
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showWhatsAppSettings, setShowWhatsAppSettings] = useState(false);
  const [categoryConfigs, setCategoryConfigs] = useState({});
  // Tournament-wide points awarded per booster — a single value shared by every
  // team for the whole tournament (never a per-team value).
  const [boosterPointsPerBooster, setBoosterPointsPerBooster] = useState(10);
  const auctionInterfaceRef = useRef(null);

  // New: snapshot of restored state to rehydrate auction after React applies players/teams
  const [rehydrateSnapshot, setRehydrateSnapshot] = useState(null);

  const goToTeamsPage = () => setCurrentPage('teams');
  const goToMaxBidPage = () => setCurrentPage('maxbid');
  const goToAuctionPage = () => setCurrentPage('auction');
  const goToCategoryConfig = () => setCurrentPage('categoryconfig');
  const goToUnsoldPlayersPage = () => setCurrentPage('unsoldplayers');
  const goToMasterPlayersPage = () => setCurrentPage('masterplayers');
  const goBackToFileUpload = (configs = {}) => {
    setCategoryConfigs(prev => ({...prev, ...configs}));
    setCurrentPage('auction');
  };

  const { showManagedToast, showFancyError } = useToastManager();
  const { whatsappSettings, setWhatsappSettings, sendWhatsAppNotification, handleWhatsAppTest, handleTeamWhatsAppShare } = useWhatsAppIntegration(showManagedToast);
  const auction = useAuction(players, showManagedToast);
  const persistence = usePersistence(showManagedToast, authUser);

  const {
  handleMarkSold,
  handleMarkUnsold,
  handleRetainPlayer,
  sellPlayer,
  sellUnsoldPlayerLater,
  handleUpdateTeamPurse,
  handleIncrementTeamBooster,
  handleDecrementTeamBooster,
  handleUpdatePointsPerBooster,
  handlePlayerTransfer,
  handlePlayerEdit,
  getTeamBudgetInfo
} = useAuctionBusinessLogic(
          players,
    setPlayers,
    teams,
    setTeams,
    auction,
    showFancyError,
    showManagedToast,
    sendWhatsAppNotification,
    tournamentName,
    auctionInterfaceRef,
    persistence,
    authUser,
    isTournamentNameSet,
    whatsappSettings,
    categoryConfigs,
    boosterPointsPerBooster,
    setBoosterPointsPerBooster
  );

  useAutoSave(players, teams, tournamentName, isTournamentNameSet, whatsappSettings, auction, persistence, authUser, categoryConfigs, boosterPointsPerBooster, sponsorName, tickerDetails);
  const { showStartupRestore, startupRestoreData, handleStartupRestoreConfirm, handleStartupRestoreCancel } = useStartupRestore(persistence, showManagedToast, authUser);

  // New: when players/teams are set after restore, rehydrate the auction state
  useEffect(() => {
    if (rehydrateSnapshot && players.length > 0 && Object.keys(teams).length > 0) {
      const snap = rehydrateSnapshot;
      if (snap.auctionStarted) {
        auction.startAuction();
      }
      if (snap.completedCategories && auction.setCompletedCategories) {
        auction.setCompletedCategories(new Set(snap.completedCategories));
      }
      if (snap.selectedCategory) {
        // Select category and start to pick the current player
          auction.handleCategorySelect(snap.selectedCategory);
          auction.startCategoryAuction();
      }
      setRehydrateSnapshot(null);
    }
  }, [rehydrateSnapshot, players, teams]);

  // ✅ LIVE VIEWER SYNC: Broadcast the current player to the viewer link the moment
  // they appear on the auction block, not just once sold/unsold. This keeps the
  // live streaming viewer page in near real-time with the auctioneer's screen.
  useEffect(() => {
    if (!auction.currentPlayer || !authUser?.id || !isTournamentNameSet) {
      return;
    }

    const broadcastCurrentPlayer = async () => {
      try {
        const currentState = {
          players,
          teams,
          tournamentName,
          sponsorName,
          tickerDetails,
          isTournamentNameSet,
          whatsappSettings,
          categoryConfigs,
          boosterPointsPerBooster,
          auctionStarted: auction.auctionStarted,
          selectedCategory: auction.selectedCategory,
          completedCategories: Array.from(auction.completedCategories || []),
          currentPlayerName: auction.currentPlayer?.name || null
        };
        await persistence.saveState(currentState);
      } catch (error) {
        console.error('❌ Failed to broadcast live current player to viewer:', error);
      }
    };

    broadcastCurrentPlayer();
  }, [auction.currentPlayer]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <div className="text-white text-lg font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthPage />;
  }

  const handleTournamentNameSubmit = () => {
    if (!tournamentName.trim()) {
      showFancyError("Please enter a tournament name before proceeding.");
      return;
    }
    if (tournamentName.trim().length < 3) {
      showFancyError("Tournament name must be at least 3 characters long.");
      return;
    }
    setIsTournamentNameSet(true);
    showManagedToast('success', `Tournament "${tournamentName.trim()}" has been set!`, {
      style: TOAST_STYLES.success,
      icon: EMOJIS.TROPHY,
      duration: 3000,
    });
  };

  const handlePlayersLoad = (loadedPlayers) => {
    setPlayers(loadedPlayers);
    showManagedToast('success', `Successfully loaded ${loadedPlayers.length} players from CSV file!`, {
      style: TOAST_STYLES.success,
      icon: EMOJIS.CHECK_MARK,
      duration: 3000,
    });
  };

  const handleTeamsLoad = (loadedTeams) => {
    setTeams(loadedTeams);
    showManagedToast('success', `Successfully loaded ${Object.keys(loadedTeams).length} teams from CSV file!`, {
      style: TOAST_STYLES.success,
      icon: EMOJIS.CHECK_MARK,
      duration: 3000,
    });
  };

  const handleProceedToCategoryConfig = () => {
    if (!isTournamentNameSet) {
      showFancyError("Please set the tournament name before proceeding.");
      return;
    }
    if (players.length === 0) {
      showFancyError("No players loaded. Please upload a valid players CSV file or import a backup file.");
      return;
    }
    if (Object.keys(teams).length === 0) {
      showFancyError("No teams loaded. Please upload a valid teams CSV file or import a backup file.");
      return;
    }
    const availableCategories = auction.getUniqueCategories();
    if (availableCategories.length === 0) {
      showFancyError("No player categories found. Please make sure your player CSV file has valid categories.");
      return;
    }
    goToCategoryConfig();
  };

  const handleStartAuctionFromConfig = async (configs) => {
    setCategoryConfigs(configs);
    auction.startAuction();
    goToAuctionPage();
    if (authUser?.id && isTournamentNameSet) {
      try {
        const currentState = {
          players,
          teams,
          tournamentName,
          sponsorName,
          tickerDetails,
          isTournamentNameSet,
          whatsappSettings,
          categoryConfigs: configs,
          boosterPointsPerBooster,
          auctionStarted: true,
          selectedCategory: auction.selectedCategory,
          completedCategories: Array.from(auction.completedCategories || []),
          currentPlayerName: auction.currentPlayer?.name || null
        };
        await persistence.saveState(currentState);
        showManagedToast('success', `Auction started and progress saved!`, {
          style: TOAST_STYLES.success,
          icon: EMOJIS.SAVEDISK,
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to save progress after starting auction:', error);
        showManagedToast('error', 'Auction started but failed to save progress to cloud', {
          style: TOAST_STYLES.error,
          icon: EMOJIS.FAILURE,
          duration: 4000,
        });
      }
    }
  };

  // Rehydrate auction state after restore
  const applyRestoredAuctionState = () => {
    const restoredSelectedCategory = startupRestoreData?.selectedCategory;
    const restoredCompletedCategories = new Set(startupRestoreData?.completedCategories || []);
    const auctionStarted = !!startupRestoreData?.auctionStarted;
    if (auctionStarted) {
      auction.startAuction();
    }
    if (restoredCompletedCategories.size > 0 && auction.setCompletedCategories) {
      auction.setCompletedCategories(restoredCompletedCategories);
    }
    if (restoredSelectedCategory) {
      auction.handleCategorySelect(restoredSelectedCategory);
      // Immediately start the category auction so current player is picked
      auction.startCategoryAuction();
    }
  };

  const handleResetAuction = () => {
    setShowResetConfirmation(true);
  };

  const confirmResetAuction = () => {
    setPlayers([]);
    setTeams({});
    setCategoryConfigs({});
    setBoosterPointsPerBooster(10);
    auction.resetAuction();
    setShowResetConfirmation(false);
    persistence.clearState();
    setIsTournamentNameSet(false);
    setTournamentName("");
    setSponsorName("");
    setTickerDetails("");
    setCurrentPage('auction');
    showManagedToast('success', 'Auction has been completely reset! All saved data cleared.', {
      style: TOAST_STYLES.success,
      icon: EMOJIS.REFRESH,
      duration: 5000,
    });
  };

  const handleWhatsAppSettings = () => {
    setShowWhatsAppSettings(true);
  };

  const handleSaveWhatsAppSettings = (newSettings) => {
    setWhatsappSettings(newSettings);
    showManagedToast('success', `WhatsApp settings saved! ${EMOJIS.MOBILE}`, {
      style: TOAST_STYLES.success,
      icon: EMOJIS.MOBILE,
      duration: 3000,
    });
  };

  // NOTE: Player edits and purse edits are handled via `useAuctionBusinessLogic`
  // so the updated state is persisted atomically (keeps Auction/Teams/Viewer in sync).

  // Restore button handler: snapshot then confirm
  const onConfirmRestoreClick = () => {
    if (startupRestoreData) {
      setRehydrateSnapshot({
        auctionStarted: !!startupRestoreData.auctionStarted,
        selectedCategory: startupRestoreData.selectedCategory || "",
        completedCategories: Array.from(startupRestoreData.completedCategories || []),
      });
    }
    handleStartupRestoreConfirm(
      setPlayers,
      setTeams,
      setTournamentName,
      setIsTournamentNameSet,
      setSponsorName,
      setTickerDetails,
      setWhatsappSettings,
      whatsappSettings,
      setCategoryConfigs,
      setBoosterPointsPerBooster
    );
  };

  // NEW PAGE RENDER
  if (currentPage === 'masterplayers') {
    return (
      <>
        <Toaster position="top-center" />
        <MasterPlayersPage
          players={players}
          teams={teams}
          tournamentName={tournamentName}
          sponsorName={sponsorName}
          tickerDetails={tickerDetails}
          categoryConfigs={categoryConfigs}
          onBackToTeams={goToTeamsPage}
          onBackToAuction={goToAuctionPage}
          onViewUnsoldPlayers={goToUnsoldPlayersPage}
          onViewMaxBid={goToMaxBidPage}
          onRetainPlayer={handleRetainPlayer}
          onUpdatePlayer={(updatedPlayer) => {
            setPlayers(prev => prev.map(player => player.id === updatedPlayer.id ? updatedPlayer : player));
          }}
          onSellPlayer={async (player, teamName, amount, wasUnsold, category) =>
            wasUnsold
              ? await sellUnsoldPlayerLater(player, teamName, amount, category)
              : await sellPlayer(player, teamName, amount, category)
          }
          showManagedToast={showManagedToast}
        />
        <ResetConfirmation isOpen={showResetConfirmation} onConfirm={confirmResetAuction} onCancel={() => setShowResetConfirmation(false)} />
        <WhatsAppSettings isOpen={showWhatsAppSettings} settings={whatsappSettings} onSave={handleSaveWhatsAppSettings} onClose={() => setShowWhatsAppSettings(false)} onTest={handleWhatsAppTest} />
      </>
    );
  }

  if (currentPage === 'unsoldplayers') {
    return (
      <>
        <Toaster position="top-center" />
        <UnsoldPlayersPage
          players={players}
          teams={teams}
          tournamentName={tournamentName}
          tickerDetails={tickerDetails}
          onBackToTeams={goToTeamsPage}
          onBackToAuction={goToAuctionPage}
          onViewMasterPlayers={goToMasterPlayersPage}
          onViewMaxBid={goToMaxBidPage}
          onSellUnsoldPlayer={sellUnsoldPlayerLater}
          showManagedToast={showManagedToast}
        />
        <ResetConfirmation 
          isOpen={showResetConfirmation}
          onConfirm={confirmResetAuction}
          onCancel={() => setShowResetConfirmation(false)}
        />
        <WhatsAppSettings
          isOpen={showWhatsAppSettings}
          settings={whatsappSettings}
          onSave={handleSaveWhatsAppSettings}
          onClose={() => setShowWhatsAppSettings(false)}
          onTest={handleWhatsAppTest}
        />
      </>
    );
  }

  if (currentPage === 'teams') {
    return (
      <>
        <Toaster position="top-center" />
        <TeamsPage
          teams={teams}
          players={players}
          tournamentName={tournamentName}
          tickerDetails={tickerDetails}
          onResetAuction={handleResetAuction}
          onBackToAuction={goToAuctionPage}
          onBackToTeams={goToTeamsPage}
          onViewMasterPlayers={goToMasterPlayersPage}
          onViewUnsoldPlayers={goToUnsoldPlayersPage}
          showManagedToast={showManagedToast}
          onWhatsAppSettings={handleWhatsAppSettings}
          onTeamWhatsAppShare={(teamName, teamData) => handleTeamWhatsAppShare(teamName, teamData, tournamentName)}
          whatsappSettings={whatsappSettings}
          onPlayerEdit={(player, newTeamName, newPrice) =>
            handlePlayerEdit(player, player?.currentTeam, newTeamName, newPrice)
          }
          onTeamPurseUpdate={handleUpdateTeamPurse}
onIncrementTeamBooster={handleIncrementTeamBooster}
onDecrementTeamBooster={handleDecrementTeamBooster}
onUpdatePointsPerBooster={handleUpdatePointsPerBooster}
          boosterPointsPerBooster={boosterPointsPerBooster}
          updateTeamPurse={handleUpdateTeamPurse}
          onViewUnsoldPlayers={goToUnsoldPlayersPage}
          onViewMasterPlayers={goToMasterPlayersPage}
          onViewAuction={goToAuctionPage}
          onViewMaxBid={goToMaxBidPage}
        />
        <ResetConfirmation 
          isOpen={showResetConfirmation}
          onConfirm={confirmResetAuction}
          onCancel={() => setShowResetConfirmation(false)}
        />
        <WhatsAppSettings
          isOpen={showWhatsAppSettings}
          settings={whatsappSettings}
          onSave={handleSaveWhatsAppSettings}
          onClose={() => setShowWhatsAppSettings(false)}
          onTest={handleWhatsAppTest}
        />
      </>
    );
  }

  if (currentPage === 'maxbid') {
    return (
      <>
        <Toaster position="top-center" />
        <MaxBidPage 
          teams={teams}
          players={players}
          tournamentName={tournamentName}
          tickerDetails={tickerDetails}
          onResetAuction={handleResetAuction}
          onBackToAuction={goToAuctionPage}
          showManagedToast={showManagedToast}
          onWhatsAppSettings={handleWhatsAppSettings}
          onTeamWhatsAppShare={(teamName, teamData) => handleTeamWhatsAppShare(teamName, teamData, tournamentName)}
          whatsappSettings={whatsappSettings}
          currentPlayer={auction.currentPlayer}
          selectedCategory={auction.selectedCategory}
          categoryConfigs={categoryConfigs}
        />
        <ResetConfirmation 
          isOpen={showResetConfirmation}
          onConfirm={confirmResetAuction}
          onCancel={() => setShowResetConfirmation(false)}
        />
        <WhatsAppSettings
          isOpen={showWhatsAppSettings}
          settings={whatsappSettings}
          onSave={handleSaveWhatsAppSettings}
          onClose={() => setShowWhatsAppSettings(false)}
          onTest={handleWhatsAppTest}
        />
      </>
    );
  }

  if (currentPage === 'categoryconfig') {
    return (
      <>
        <Toaster position="top-center" />
        <CategoryConfig 
          players={players}
          teams={teams}
          tournamentName={tournamentName}
          tickerDetails={tickerDetails}
          onStartAuction={handleStartAuctionFromConfig}
          onBackToFileUpload={goBackToFileUpload}
          showManagedToast={showManagedToast}
          categoryConfigs={categoryConfigs}
        />
        <ResetConfirmation 
          isOpen={showResetConfirmation}
          onConfirm={confirmResetAuction}
          onCancel={() => setShowResetConfirmation(false)}
        />
        <WhatsAppSettings
          isOpen={showWhatsAppSettings}
          settings={whatsappSettings}
          onSave={handleSaveWhatsAppSettings}
          onClose={() => setShowWhatsAppSettings(false)}
          onTest={handleWhatsAppTest}
        />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: TOAST_STYLES.error }} />
      {isTournamentNameSet && tickerDetails.trim() && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white py-2 shadow-lg">
          <div className="overflow-hidden whitespace-nowrap">
            <div className="animate-marquee inline-block font-bold text-lg">
              {tickerDetails}
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-gray-800 to-gray-900 bg-fixed relative overflow-x-hidden" style={{ paddingTop: isTournamentNameSet && tickerDetails.trim() ? '3rem' : '0' }}>
        <ResetConfirmation 
          isOpen={showResetConfirmation}
          onConfirm={confirmResetAuction}
          onCancel={() => setShowResetConfirmation(false)}
        />
        <WhatsAppSettings
          isOpen={showWhatsAppSettings}
          settings={whatsappSettings}
          onSave={handleSaveWhatsAppSettings}
          onClose={() => setShowWhatsAppSettings(false)}
          onTest={handleWhatsAppTest}
        />
        <CategorySelection 
          isOpen={auction.categorySelectionOpen}
          categories={auction.getUniqueCategories()}
          onSelect={auction.handleCategorySelect}
          onClose={() => auction.setCategorySelectionOpen(false)}
          onViewTeams={goToTeamsPage}
          onViewMaxBid={goToMaxBidPage}
        />
        {showStartupRestore && startupRestoreData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-bounce-in">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6 animate-pulse">
                  <div className="text-4xl">{EMOJIS.RESTORE}</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Restore Previous Session?</h3>
                <div className="mb-6">
                  <p className="text-gray-600 mb-3">Found saved auction data from:</p>
                  <div className="bg-blue-50 rounded-lg p-4 text-left border border-blue-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="font-medium text-blue-800">Tournament:</span><span className="text-blue-700">{startupRestoreData.tournamentName || 'Untitled Tournament'}</span></div>
                      <div className="flex justify-between"><span className="font-medium text-blue-800">Players:</span><span className="text-blue-700">{startupRestoreData.players?.length || 0}</span></div>
                      <div className="flex justify-between"><span className="font-medium text-blue-800">Teams:</span><span className="text-blue-700">{Object.keys(startupRestoreData.teams || {}).length}</span></div>
                      <div className="flex justify-between"><span className="font-medium text-blue-800">Category Config:</span><span className="text-blue-700">{Object.keys(startupRestoreData.categoryConfigs || {}).length}</span></div>
                      <div className="flex justify-between"><span className="font-medium text-blue-800">Saved:</span><span className="text-blue-700 text-xs">{startupRestoreData.timestamp || startupRestoreData.updated_at ? new Date(startupRestoreData.timestamp || startupRestoreData.updated_at).toLocaleString() : 'Recently'}</span></div>
                      {startupRestoreData.source && (
                        <div className="flex justify-between"><span className="font-medium text-blue-800">Source:</span><span className="text-blue-700 text-xs capitalize">{startupRestoreData.source === 'supabase' ? `${EMOJIS.BACKUP} Cloud` : startupRestoreData.source === 'localStorage' ? `${EMOJIS.FOLDER} Local` : `${EMOJIS.FOLDER} Storage`}</span></div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-3 text-sm">Would you like to restore this data and continue your auction?</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={handleStartupRestoreCancel} className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"><span>{EMOJIS.CROSS_MARK}</span>Not Now</button>
                  <button onClick={onConfirmRestoreClick} className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg flex items-center justify-center gap-2"><span>{EMOJIS.RESTORE}</span>Yes, Restore Data</button>
                </div>
              </div>
            </div>
          </div>
        )}
        )}
        {auction.showConfetti && (
          <ReactConfetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={500} recycle={false} initialVelocityY={10} gravity={0.2} run={auction.showConfetti} confettiSource={{ x: 0, y: window.innerHeight, w: window.innerWidth, h: 0 }} />
        )}
        <div className="flex-1 flex flex-col justify-center items-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-8 text-center text-white drop-shadow-lg bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent px-6 py-4 rounded-xl mt-8 shadow-lg border-4 border-yellow-300 animate-pulse">
            {EMOJIS.CRICKET_BAT} Auction Dugout {EMOJIS.TROPHY}
          </h1>
          {isTournamentNameSet && (
            <div className="w-full max-w-4xl mx-auto text-center px-4 mb-6 -mt-4">
              <div className="text-2xl md:text-3xl font-extrabold text-white break-words">{tournamentName}</div>
              {sponsorName.trim() && (
                  <div className="mt-2 text-yellow-300 break-words">
                    <div className="text-xs md:text-sm font-medium leading-tight text-purple-500">Sponsored by</div>
                    <div className="text-2xl md:text-3xl font-extrabold leading-tight">{sponsorName}</div>
                  </div>
                )}
            </div>
          )}
          <div className="w-full max-w-4xl mx-auto">
            {!isTournamentNameSet && (
              <TournamentSetup tournamentName={tournamentName} setTournamentName={setTournamentName} sponsorName={sponsorName} setSponsorName={setSponsorName} tickerDetails={tickerDetails} setTickerDetails={setTickerDetails} onSubmit={handleTournamentNameSubmit} />
            )}
            {isTournamentNameSet && !auction.auctionStarted && (
              <FileUpload 
                players={players}
                teams={teams}
                onPlayersLoad={handlePlayersLoad}
                onTeamsLoad={handleTeamsLoad}
                onError={showFancyError}
                onStartAuction={handleProceedToCategoryConfig}
                onWhatsAppSettings={handleWhatsAppSettings}
                persistence={persistence}
                authUser={authUser}
                isTournamentNameSet={isTournamentNameSet}
                tournamentName={tournamentName}
                whatsappSettings={whatsappSettings}
                categoryConfigs={categoryConfigs}
                showManagedToast={showManagedToast}
              />
            )}
            {isTournamentNameSet && auction.auctionStarted && auction.selectedCategory && (
              <AuctionInterface 
                ref={auctionInterfaceRef}
                currentPlayer={auction.currentPlayer}
                teams={teams}
                teamNameInput={auction.teamNameInput}
                setTeamNameInput={auction.setTeamNameInput}
                bidAmountInput={auction.bidAmountInput}
                setBidAmountInput={auction.setBidAmountInput}
                onMarkSold={handleMarkSold}
                onMarkUnsold={handleMarkUnsold}
                onNextPlayer={auction.pickNextPlayer}
                soldCount={auction.soldCount}
                markedUnsoldCount={auction.markedUnsoldCount}
                currentCategoryUnsoldCount={auction.currentCategoryUnsoldCount}
                onViewTeams={goToTeamsPage}
                onViewMaxBid={goToMaxBidPage}
                onViewUnsoldPlayers={goToUnsoldPlayersPage}
                onViewMasterPlayers={goToMasterPlayersPage}
                onResetAuction={handleResetAuction}
                selectedCategory={auction.selectedCategory}
                round={auction.round}
                isUnsoldRound={auction.isUnsoldRound}
                playerProcessed={auction.playerProcessed}
                onChangeCategory={auction.handleCategoryChange}
                showManagedToast={showManagedToast}
                isLastPlayerInQueue={auction.isLastPlayerInQueue}
                categoryStarted={auction.categoryStarted}
                onStartCategory={auction.startCategoryAuction}
              />
            )}
            {/* Quick Access to Unsold Players Page when auction started */}
          </div>
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 w-full text-center text-base font-semibold text-white py-3 bg-black shadow z-50" style={{letterSpacing: '1px', textShadow: '0 1px 8px #111'}}>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {authUser?.id && isTournamentNameSet && (
            <button
              onClick={() => {
                const viewerUrl = `${window.location.origin}${window.location.pathname}#/viewer/${authUser.id}`;
                navigator.clipboard.writeText(viewerUrl).then(() => {
                  showManagedToast('success', 'Viewer link copied to clipboard! Share it with viewers.', {
                    style: TOAST_STYLES.success,
                    icon: EMOJIS.TEAMOWNERVIEW,
                    duration: 4000,
                  });
                }).catch(() => {
                  // Fallback: show the URL in a prompt
                  window.prompt('Copy this viewer link:', viewerUrl);
                });
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              title="Copy the read-only viewer link for spectators"
            >
              {EMOJIS.TEAMOWNERVIEW} Copy Viewer Link
            </button>
          )}
          <span>Designed with ❤️ by <a href="https://wa.me/917276319578" className="underline hover:text-yellow-400" target="_blank" rel="noopener noreferrer">Amit Gandhi</a></span>
        </div>
      </footer>
    </>
  );
};