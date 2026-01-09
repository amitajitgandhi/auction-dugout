import { useState, useEffect, useRef } from "react";
import { shuffle, TOAST_STYLES, EMOJIS } from "../utils/constants";

export const useAuction = (players, showManagedToast) => {
    const normalize = (v) => (v ?? "").toString().trim().toUpperCase();

    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [auctionStarted, setAuctionStarted] = useState(false);
    const [categoryStarted, setCategoryStarted] = useState(false);
    const [teamNameInput, setTeamNameInput] = useState("");
    const [bidAmountInput, setBidAmountInput] = useState("");
    const [showConfetti, setShowConfetti] = useState(false);
    const [categorySelectionOpen, setCategorySelectionOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [playerProcessed, setPlayerProcessed] = useState(false);
    const [currentQueue, setCurrentQueue] = useState(new Set());
    const [soldQueue, setSoldQueue] = useState(new Set());
    const [unsoldQueue, setUnsoldQueue] = useState(new Set());
    const [currentQueuePointer, setCurrentQueuePointer] = useState(0);
    const [round, setRound] = useState(1);
    const [isUnsoldRound, setIsUnsoldRound] = useState(false);
    const [completedCategories, setCompletedCategories] = useState(new Set());
    const endOfRoundCalledRef = useRef(false);

    // Handle category selection
    const handleCategorySelect = (cat) => {
        endOfRoundCalledRef.current = false;
        const normCat = normalize(cat);
        setSelectedCategory(normCat);
        setAuctionStarted(true);
        // setCategoryStarted(false);
        setCategorySelectionOpen(false);
        setCurrentPlayer(null);
        setPlayerProcessed(false);
        // Build queue keys robustly: prefer id, fallback to name
        const catPlayers = players
            .filter(p => normalize(p.category) === normCat)
            .map(p => (p.id !== undefined && p.id !== null) ? p.id : `name:${p.name}`);
        setCurrentQueue(new Set(catPlayers));
        setSoldQueue(new Set());
        setUnsoldQueue(new Set());
        setCurrentQueuePointer(0);
        setRound(1);
        setIsUnsoldRound(false);
    };

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
            finishCategory();
            return;
        }
        const key = queueArr[currentQueuePointer];
        let player;
        if (typeof key === 'string' && key.startsWith('name:')) {
            const name = key.slice(5);
            player = players.find(p => p.name === name && normalize(p.category) === normalize(selectedCategory));
        } else {
            player = players.find(p => p.id === key);
        }
        if (!player) {
            setCurrentQueuePointer(ptr => ptr + 1);
            pickNextPlayer();
            return;
        }
        // Skip already processed players (restore scenarios)
        if (player.sold && player.soldTo !== 'Unsold') {
            setSoldQueue(prev => new Set(prev).add(player.id ?? `name:${player.name}`));
            setCurrentQueuePointer(ptr => ptr + 1);
            pickNextPlayer();
            return;
        }
        if (player.soldTo === 'Unsold') {
            setUnsoldQueue(prev => new Set(prev).add(player.id ?? `name:${player.name}`));
            setCurrentQueuePointer(ptr => ptr + 1);
            pickNextPlayer();
            return;
        }
        setCurrentPlayer(player);
        setPlayerProcessed(false);
    };

    const markUnsoldPlayerWithoutNext = () => {
        if (!currentPlayer) return;
        setUnsoldQueue(q => new Set(q).add(currentPlayer.id ?? `name:${currentPlayer.name}`));
        setPlayerProcessed(true);
        setCurrentQueuePointer(ptr => ptr + 1);
        setTeamNameInput("");
        setBidAmountInput("");
        const queueArr = Array.from(currentQueue);
        if (currentQueuePointer + 1 >= queueArr.length) {
            finishCategory();
        }
    };

    const markUnsoldPlayer = () => {
        if (!currentPlayer) return;
        setUnsoldQueue(q => new Set(q).add(currentPlayer.id ?? `name:${currentPlayer.name}`));
        setCurrentQueuePointer(ptr => ptr + 1);
        setTeamNameInput("");
        setBidAmountInput("");
        const queueArr = Array.from(currentQueue);
        if (currentQueuePointer + 1 >= queueArr.length) {
            finishCategory();
        } else {
            setTimeout(pickNextPlayer, 0);
        }
    };

    const startCategoryAuction = () => {
        endOfRoundCalledRef.current = false;
        setCategoryStarted(true);
    };

    const getUniqueCategories = () => {
        const cats = new Set(players.map(p => normalize(p.category)).filter(Boolean));
        return Array.from(cats).filter(cat => !completedCategories.has(cat));
    };

    const getCurrentCategoryPlayers = () => {
        if (!selectedCategory) return [];
        return players.filter(p => normalize(p.category) === normalize(selectedCategory));
    };

    const soldCount = getCurrentCategoryPlayers().filter(p => p.sold && p.soldTo !== 'Unsold').length;
    const currentCategoryUnsoldCount = getCurrentCategoryPlayers().filter(p => !p.sold && p.soldTo !== 'Unsold').length;
    const markedUnsoldCount = getCurrentCategoryPlayers().filter(p => p.soldTo === 'Unsold').length;

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

    useEffect(() => {
        if (
            auctionStarted &&
            categoryStarted &&
            selectedCategory &&
            currentQueue.size > 0 &&
            !currentPlayer
        ) {
            const t = setTimeout(() => {
                pickNextPlayer();
            }, 0);

            return () => clearTimeout(t);
        }
    }, [
        auctionStarted,
        categoryStarted,
        selectedCategory,
        currentQueue,
        currentPlayer
    ]);

    return {
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
        handleCategorySelect,
        handleCategoryChange,
        startCategoryAuction,
        pickNextPlayer,
        markUnsoldPlayer,
        markUnsoldPlayerWithoutNext,
        getUniqueCategories,
        checkCategoryCompletion,
        finishCategory,
        soldCount,
        currentCategoryUnsoldCount,
        markedUnsoldCount,
        isLastPlayerInQueue: getIsLastPlayerInQueue(),
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