import { useState, useEffect } from "react";
import { shuffle, TOAST_STYLES, EMOJIS } from "../utils/constants";

export const useAuction = (players, showManagedToast) => {
    // Auction state
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [auctionStarted, setAuctionStarted] = useState(false);
    const [categoryStarted, setCategoryStarted] = useState(false); // New state to track if category auction has started
    const [teamNameInput, setTeamNameInput] = useState("");
    const [bidAmountInput, setBidAmountInput] = useState("");
    const [showConfetti, setShowConfetti] = useState(false);
    const [categorySelectionOpen, setCategorySelectionOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [playerProcessed, setPlayerProcessed] = useState(false);
    
    // Use Set for queues
    const [currentQueue, setCurrentQueue] = useState(new Set()); // Set of player IDs
    const [soldQueue, setSoldQueue] = useState(new Set()); // Set of player IDs
    const [unsoldQueue, setUnsoldQueue] = useState(new Set()); // Set of player IDs
    const [currentQueuePointer, setCurrentQueuePointer] = useState(0);
    const [round, setRound] = useState(1);
    const [isUnsoldRound, setIsUnsoldRound] = useState(false);
    
    // Track completed categories
    const [completedCategories, setCompletedCategories] = useState(new Set());

    // Handle category selection
    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setAuctionStarted(true);
        setCategoryStarted(false); // Reset category started state
        setCategorySelectionOpen(false);
        setCurrentPlayer(null);
        setPlayerProcessed(false);
        // Get all player IDs for this category
        const catPlayers = players.filter(p => p.category === cat).map(p => p.id);
        setCurrentQueue(new Set(shuffle(catPlayers)));
        setSoldQueue(new Set());
        setUnsoldQueue(new Set());
        setCurrentQueuePointer(0);
        setRound(1);
        setIsUnsoldRound(false);
    };

    // Handle end of round logic
    const handleEndOfRound = () => {
        // Don't proceed if category is already finished
        if (!selectedCategory) {
            return;
        }
        
        // Get remaining unsold players that haven't been sold yet
        const remainingUnsoldPlayers = Array.from(unsoldQueue).filter(id => !soldQueue.has(id));
        
        if (remainingUnsoldPlayers.length > 0) {
            // There are still unsold players, continue with next unsold round
            const nextRound = round + 1;
            
            // Determine the appropriate message based on whether this is the first unsold round or continuation
            let toastMessage;
            if (!isUnsoldRound) {
                // First transition from initial round to unsold round
                toastMessage = `Starting Round 2 for Unsold players from ${selectedCategory} category`;
            } else {
                // Continuing unsold rounds
                toastMessage = `Starting Round ${nextRound} for Unsold players from ${selectedCategory} category`;
            }
            
            // Show toast immediately with improved messaging (no duplicate emoji)
            showManagedToast('success', toastMessage, {
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
                duration: 5000,
            });
            
            // Shuffle the remaining unsold players for the next round
            const shuffledUnsoldPlayers = shuffle(remainingUnsoldPlayers);
            
            // Update state for next unsold round
            setCurrentQueue(new Set(shuffledUnsoldPlayers));
            setCurrentQueuePointer(0);
            setRound(nextRound);
            setIsUnsoldRound(true);
            setCurrentPlayer(null); // Will be set by useEffect
            setPlayerProcessed(false);
        } else {
            // No more unsold players, finish category
            finishCategory();
        }
    };

    // Finish the current category
    const finishCategory = () => {
        // Store the category name before clearing it
        const categoryName = selectedCategory;
        
        // Don't proceed if category is already empty (prevents duplicate calls)
        if (!categoryName) {
            return;
        }
        
        // Add to completed categories
        setCompletedCategories(prev => new Set(prev).add(categoryName));
        
        setCurrentPlayer(null);
        setSelectedCategory("");
        setCategorySelectionOpen(true);
        setIsUnsoldRound(false);
        setRound(1);
        setPlayerProcessed(false);
        
        // Show completion message using stored category name
        showManagedToast('success', `All players from '${categoryName}' category have been sold! Great job!`, {
            style: TOAST_STYLES.success,
            icon: EMOJIS.PARTY,
            duration: 6000,
        });
    };

    // Pick next player - Modified to work with new flow
    const pickNextPlayer = () => {
        // If we're at the end of the queue, handle end of round
        const queueArr = Array.from(currentQueue);
        if (currentQueuePointer >= queueArr.length) {
            handleEndOfRound();
            return;
        }

        // Load the next player
        let idx = currentQueuePointer;
        
        // In unsold rounds, skip already sold players
        if (isUnsoldRound) {
            while (idx < queueArr.length && soldQueue.has(queueArr[idx])) {
                idx++;
            }
        }
        
        if (idx < queueArr.length) {
            const player = players.find(p => p.id === queueArr[idx]);
            setCurrentPlayer(player);
            setCurrentQueuePointer(idx);
            setPlayerProcessed(false);
        } else {
            // No more players in current queue
            handleEndOfRound();
        }
    };

    // Mark as Unsold - Modified to not auto-advance
    const markUnsoldPlayerWithoutNext = () => {
        if (!currentPlayer) return;
        setUnsoldQueue(q => new Set(q).add(currentPlayer.id));
        setPlayerProcessed(true);
        setCurrentQueuePointer(ptr => ptr + 1);
        setTeamNameInput("");
        setBidAmountInput("");
    };

    // Original mark unsold (for backward compatibility)
    const markUnsoldPlayer = () => {
        if (!currentPlayer) return;
        setUnsoldQueue(q => new Set(q).add(currentPlayer.id));
        // Clear current player to trigger next player display
        setCurrentPlayer(null);
        setCurrentQueuePointer(ptr => ptr + 1);
        setTeamNameInput("");
        setBidAmountInput("");
    };

    // Show the current player from currentQueue - Modified to only load when category is started
    useEffect(() => {
        // Don't proceed if category is already finished or not started
        if (!selectedCategory || !categoryStarted) {
            return;
        }
        
        const queueArr = Array.from(currentQueue);
        
        // If we have a queue but no current player showing, show the next one
        // BUT only if player hasn't been processed (sold/unsold)
        if (queueArr.length > 0 && !currentPlayer && !playerProcessed) {
            let idx = currentQueuePointer;
            
            // In unsold rounds, skip already sold players
            if (isUnsoldRound) {
                while (idx < queueArr.length && soldQueue.has(queueArr[idx])) {
                    idx++;
                }
            }
            
            if (idx < queueArr.length) {
                const player = players.find(p => p.id === queueArr[idx]);
                setCurrentPlayer(player);
                setCurrentQueuePointer(idx);
            } else {
                // No more players in current queue
                handleEndOfRound();
            }
        }
    }, [currentQueue, currentQueuePointer, soldQueue, players, currentPlayer, isUnsoldRound, selectedCategory, playerProcessed, categoryStarted]);

    // Get unique categories excluding already completed ones
    const getUniqueCategories = () => {
        const cats = new Set(players.map(p => p.category).filter(Boolean));
        // Filter out completed categories
        return Array.from(cats).filter(cat => !completedCategories.has(cat));
    };

    // Calculate player counts - improved for current category
    const getCurrentCategoryPlayers = () => {
        if (!selectedCategory) return [];
        return players.filter(p => p.category === selectedCategory);
    };

    const soldCount = getCurrentCategoryPlayers().filter(p => p.sold && p.soldTo !== "Unsold").length;
    const currentCategoryUnsoldCount = getCurrentCategoryPlayers().filter(p => !p.sold).length;
    const markedUnsoldCount = getCurrentCategoryPlayers().filter(p => p.soldTo === "Unsold").length;

    // Check if all players in current category are sold/processed
    const checkCategoryCompletion = () => {
        if (!selectedCategory) return false;
        
        const categoryPlayers = getCurrentCategoryPlayers();
        const totalPlayers = categoryPlayers.length;
        const soldPlayers = categoryPlayers.filter(p => p.sold && p.soldTo !== "Unsold").length;
        const unsoldPlayers = categoryPlayers.filter(p => p.soldTo === "Unsold").length;
        
        // IMPORTANT: If we're in an unsold round, check if there are still remaining unsold players to process
        if (isUnsoldRound) {
            // Get remaining unsold players that haven't been sold yet
            const remainingUnsoldPlayers = Array.from(unsoldQueue).filter(id => !soldQueue.has(id));
            
            // If there are still unsold players in the queue to process, category is NOT complete
            if (remainingUnsoldPlayers.length > 0) {
                return false;
            }
        }
        
        // Category is complete when all players are either sold or marked as unsold
        const isComplete = (soldPlayers + unsoldPlayers) === totalPlayers;
        
        return isComplete;
    };

    // Handle category change (for when user wants to change category after seeing first player)
    const handleCategoryChange = () => {
        // Reset all auction state but keep the auction started
        setCurrentPlayer(null);
        setPlayerProcessed(false);
        setCurrentQueue(new Set());
        setSoldQueue(new Set());
        setUnsoldQueue(new Set());
        setCurrentQueuePointer(0);
        setRound(1);
        setIsUnsoldRound(false);
        setTeamNameInput("");
        setBidAmountInput("");
        // Clear the selected category and show category selection again
        setSelectedCategory("");
        setCategorySelectionOpen(true);
    };

    // Check if current player is the last in the queue
    const getIsLastPlayerInQueue = () => {
        const queueArr = Array.from(currentQueue);
        
        // If in unsold round, count remaining players that haven't been sold
        if (isUnsoldRound) {
            const remainingUnsoldPlayers = queueArr.filter(id => !soldQueue.has(id));
            return remainingUnsoldPlayers.length <= 1; // Last one or no more players
        }
        
        // In normal round, check if we're at the last player
        return (currentQueuePointer + 1) >= queueArr.length;
    };

    // Start category auction - loads the first player with countdown
    const startCategoryAuction = () => {
        setCategoryStarted(true);
        // Start with countdown before showing first player
        pickNextPlayer();
    };

    return {
        // State
        currentPlayer,
        auctionStarted,
        categoryStarted,
        teamNameInput,
        setTeamNameInput,
        bidAmountInput,
        setBidAmountInput,
        showConfetti,
        setShowConfetti,
        categorySelectionOpen,
        setCategorySelectionOpen,
        selectedCategory,
        round,
        isUnsoldRound,
        completedCategories,
        playerProcessed,
        setPlayerProcessed,
        
        // Queue state
        soldQueue,
        setSoldQueue,
        unsoldQueue,
        setUnsoldQueue,
        setCurrentPlayer,
        setCurrentQueuePointer,
        
        // Actions
        handleCategorySelect,
        handleCategoryChange,
        startCategoryAuction,
        pickNextPlayer,
        markUnsoldPlayer,
        markUnsoldPlayerWithoutNext,
        getUniqueCategories,
        checkCategoryCompletion,
        finishCategory,
        
        // Computed values
        soldCount,
        currentCategoryUnsoldCount,
        markedUnsoldCount,
        isLastPlayerInQueue: getIsLastPlayerInQueue(),
        
        // Reset functions
        resetAuction: () => {
            setCompletedCategories(new Set());
            setCurrentPlayer(null);
            setSelectedCategory("");
            setAuctionStarted(false);
            setCategoryStarted(false);
            setCategorySelectionOpen(false);
            setCurrentQueue(new Set());
            setSoldQueue(new Set());
            setUnsoldQueue(new Set());
            setCurrentQueuePointer(0);
            setRound(1);
            setIsUnsoldRound(false);
            setTeamNameInput("");
            setBidAmountInput("");
            setPlayerProcessed(false);
        },
        
        startAuction: () => {
            setCategorySelectionOpen(true);
        },
    };
};