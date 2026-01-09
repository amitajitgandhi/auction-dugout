import { useState, useEffect, useRef } from "react";
import { shuffle, TOAST_STYLES, EMOJIS } from "../utils/constants";

export const useAuction = (players, showManagedToast) => {
    // Auction state
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [auctionStarted, setAuctionStarted] = useState(false);
    const [categoryStarted, setCategoryStarted] = useState(false);
    const [teamNameInput, setTeamNameInput] = useState("");
    const [bidAmountInput, setBidAmountInput] = useState("");
    const [showConfetti, setShowConfetti] = useState(false);
    const [categorySelectionOpen, setCategorySelectionOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [playerProcessed, setPlayerProcessed] = useState(false);
    
    // Queues
    const [currentQueue, setCurrentQueue] = useState(new Set());
    const [soldQueue, setSoldQueue] = useState(new Set());
    const [unsoldQueue, setUnsoldQueue] = useState(new Set());
    const [currentQueuePointer, setCurrentQueuePointer] = useState(0);
    const [round, setRound] = useState(1); // Round will always stay 1 now (no unsold rounds)
    const [isUnsoldRound, setIsUnsoldRound] = useState(false); // Kept for backward compatibility but no longer used
    
    // Track completed categories
    const [completedCategories, setCompletedCategories] = useState(new Set());
    
    // Ref guard
    const endOfRoundCalledRef = useRef(false);

    // Handle category selection
    const handleCategorySelect = (cat) => {
        endOfRoundCalledRef.current = false;
        setSelectedCategory(cat);
        setAuctionStarted(true);
        setCategoryStarted(false);
        setCategorySelectionOpen(false);
        setCurrentPlayer(null);
        setPlayerProcessed(false);
        const catPlayers = players.filter(p => p.category === cat).map(p => p.id);
        setCurrentQueue(new Set(catPlayers));
        setSoldQueue(new Set());
        setUnsoldQueue(new Set());
        setCurrentQueuePointer(0);
        setRound(1);
        setIsUnsoldRound(false);
    };

    // Finish category immediately once all players processed (sold or marked unsold)
    const finishCategory = () => {
        const categoryName = selectedCategory;
        if (!categoryName) return;
        setCompletedCategories(prev => new Set(prev).add(categoryName));
        setCurrentPlayer(null);
        setSelectedCategory("");
        setCategorySelectionOpen(true);
        setIsUnsoldRound(false);
        setRound(1);
        setPlayerProcessed(false);
        showManagedToast && showManagedToast('success', `Category '${categoryName}' completed!`, {
            style: TOAST_STYLES.success,
            icon: EMOJIS.PARTY,
            duration: 4000,
        });
    };

    // Pick next player (single pass only)
    const pickNextPlayer = () => {
        const queueArr = Array.from(currentQueue);
        if (currentQueuePointer >= queueArr.length) {
            // End of queue reached, finish category
            finishCategory();
            return;
        }
        const player = players.find(p => p.id === queueArr[currentQueuePointer]);
        if (!player) {
            setCurrentQueuePointer(ptr => ptr + 1);
            pickNextPlayer();
            return;
        }
        // Skip already processed players (restore scenarios)
        if (player.sold && player.soldTo !== 'Unsold') {
            setSoldQueue(prev => new Set(prev).add(player.id));
            setCurrentQueuePointer(ptr => ptr + 1);
            pickNextPlayer();
            return;
        }
        if (player.soldTo === 'Unsold') {
            setUnsoldQueue(prev => new Set(prev).add(player.id));
            setCurrentQueuePointer(ptr => ptr + 1);
            pickNextPlayer();
            return;
        }
        setCurrentPlayer(player);
        setPlayerProcessed(false);
    };

    // Mark player as unsold (added to unsold queue, advance pointer manually later via Next Player)
    const markUnsoldPlayerWithoutNext = () => {
        if (!currentPlayer) return;
        setUnsoldQueue(q => new Set(q).add(currentPlayer.id));
        setPlayerProcessed(true);
        setCurrentQueuePointer(ptr => ptr + 1);
        setTeamNameInput("");
        setBidAmountInput("");
        // If this was last player, finish category automatically
        const queueArr = Array.from(currentQueue);
        if (currentQueuePointer + 1 >= queueArr.length) {
            finishCategory();
        }
    };

    // Backward compatibility (auto next)
    const markUnsoldPlayer = () => {
        if (!currentPlayer) return;
        setUnsoldQueue(q => new Set(q).add(currentPlayer.id));
        setCurrentQueuePointer(ptr => ptr + 1);
        setTeamNameInput("");
        setBidAmountInput("");
        const queueArr = Array.from(currentQueue);
        if (currentQueuePointer + 1 >= queueArr.length) {
            finishCategory();
        } else {
            pickNextPlayer();
        }
    };

    // Start category auction
    const startCategoryAuction = () => {
        endOfRoundCalledRef.current = false;
        setCategoryStarted(true);
        pickNextPlayer();
    };

    // Unique categories excluding completed ones
    const getUniqueCategories = () => {
        const cats = new Set(players.map(p => p.category).filter(Boolean));
        return Array.from(cats).filter(cat => !completedCategories.has(cat));
    };

    // Helpers
    const getCurrentCategoryPlayers = () => {
        if (!selectedCategory) return [];
        return players.filter(p => p.category === selectedCategory);
    };

    const soldCount = getCurrentCategoryPlayers().filter(p => p.sold && p.soldTo !== 'Unsold').length;
    const currentCategoryUnsoldCount = getCurrentCategoryPlayers().filter(p => !p.sold && p.soldTo !== 'Unsold').length;
    const markedUnsoldCount = getCurrentCategoryPlayers().filter(p => p.soldTo === 'Unsold').length;

    // Category completion check (single pass logic already handled in finishCategory)
    const checkCategoryCompletion = () => false;

    const handleCategoryChange = () => {
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
        setSelectedCategory("");
        setCategorySelectionOpen(true);
    };

    const getIsLastPlayerInQueue = () => {
        const queueArr = Array.from(currentQueue);
        return currentQueuePointer + 1 >= queueArr.length;
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
        // Computed
        soldCount,
        currentCategoryUnsoldCount,
        markedUnsoldCount,
        isLastPlayerInQueue: getIsLastPlayerInQueue(),
        // Reset
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
            setAuctionStarted(true);
        },
        setCompletedCategories,
    };
};