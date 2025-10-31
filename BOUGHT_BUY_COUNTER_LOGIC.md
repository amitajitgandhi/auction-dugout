# Bought/Buy Counter Logic Documentation

## Overview
This document explains how the bought/buy counter works in the Cricket Auction Tool, specifically focusing on the logic that displays team purchase statistics on the Max Bid Analysis page.

## The Issue
The bought/buy counter was showing incorrect values (e.g., 0/1 instead of 1/1) on the Max Bid page even after players were marked as sold and the "Next Player" button was visible.

## Root Cause
The issue was that when players were marked as sold, the `sold` property was not being set to `true` in the player object. The Max Bid Analysis logic was filtering players based on `p.sold === true`, but this property was never being set during the sale process.

## Key Files Involved

### 1. `src/components/MaxBidPage.js`
**Purpose**: Main page component for Max Bid Analysis
**Key Logic**: 
```javascript
// Calculate for each category
availableCategories.forEach(categoryName => {
    // ? FIXED: Count players bought from the actual players array
    const playersBought = players.filter(p => 
        (p.category || 'OPEN') === categoryName && 
        p.soldTo === teamName && 
        p.sold === true  // This was the key check that was failing
    ).length;
    
    // Calculate remaining players to buy in this category
    const playersRemaining = Math.max(0, playersAllowed - playersBought);
});
```

### 2. `src/components/MaxBidAnalysisTable.js`
**Purpose**: Displays the analysis table with bought/buy counters
**Key Logic**:
```javascript
<td className="px-2 py-4 whitespace-nowrap text-center text-xs">
    <div className={`font-bold px-2 py-1 rounded-full text-xs ${
        catData.playersBought >= catData.playersAllowed 
            ? 'text-red-600 bg-red-100' 
            : 'text-green-600 bg-green-100'
    }`}>
        {catData.playersBought}/{catData.playersAllowed}
    </div>
</td>
```

### 3. `src/hooks/useAuctionBusinessLogic.js` ? **MAIN FIX**
**Purpose**: Handles the core auction business logic including player sales
**Issue**: The `sellPlayer` function was not setting `sold: true` when marking players as sold

**Before (Broken)**:
```javascript
const updatedPlayers = players.map(player =>
    player.name === playerName 
        ? { ...player, soldTo: teamName, soldPrice: bidAmount }  // Missing 'sold: true'
        : player
);
```

**After (Fixed)**:
```javascript
const updatedPlayers = players.map(player =>
    player.name === playerName 
        ? { ...player, soldTo: teamName, soldPrice: bidAmount, sold: true }  // ? Added 'sold: true'
        : player
);
```

**All Fixed Functions**:
- `sellPlayer()` - Sets `sold: true` for purchased players
- `handleMarkUnsold()` - Sets `sold: false` for unsold players  
- `handlePlayerTransfer()` - Sets `sold: true` for transferred players

### 4. `src/App.js`
**Purpose**: Main application component with player edit functionality
**Fix Applied**: The `handlePlayerEdit` function now also sets `sold: true` when players are transferred between teams

```javascript
setPlayers(prevPlayers => 
    prevPlayers.map(p => 
        p.name === player.name 
            ? { ...p, soldTo: newTeamName, soldPrice: newPrice, sold: true }  // ? Added 'sold: true'
            : p
    )
);
```

## Data Flow

```
1. Player Sale Process
   ??? User clicks "Mark as Sold" in AuctionInterface
   ??? handleMarkSold() called in useAuctionBusinessLogic
   ??? sellPlayer() function processes the sale
   ??? Player object updated with: soldTo, soldPrice, sold: true
   ??? State saved to persistence layer
   ??? UI updates to show "Next Player" button

2. Max Bid Analysis Display
   ??? User navigates to Max Bid Analysis page
   ??? MaxBidPage component calculates team analysis
   ??? For each team and category:
   ?   ??? Filter players: p.soldTo === teamName && p.sold === true
   ?   ??? Count filtered players as "playersBought"
   ?   ??? Calculate remaining: playersAllowed - playersBought
   ??? MaxBidAnalysisTable displays bought/buy counters
   ??? Shows correct values (e.g., 1/1 instead of 0/1)
```

## Player Object Structure

### Before Sale
```javascript
{
    id: "player123",
    name: "John Doe",
    category: "OPEN",
    skill: "Batsman",
    // No soldTo, soldPrice, or sold properties
}
```

### After Sale (Fixed)
```javascript
{
    id: "player123",
    name: "John Doe", 
    category: "OPEN",
    skill: "Batsman",
    soldTo: "Team Alpha",
    soldPrice: 50000,
    sold: true  // ? This property was missing before the fix
}
```

### After Marked Unsold
```javascript
{
    id: "player123",
    name: "John Doe",
    category: "OPEN", 
    skill: "Batsman",
    soldTo: "Unsold",
    soldPrice: 0,
    sold: false  // ? Explicitly set to false for unsold players
}
```

## Testing the Fix

### Before Fix
1. Mark a player as sold
2. Navigate to Max Bid Analysis
3. See bought/buy counter showing 0/1 (incorrect)

### After Fix  
1. Mark a player as sold
2. Navigate to Max Bid Analysis
3. See bought/buy counter showing 1/1 (correct)

## Additional Considerations

### Startup Restore
The `useStartupRestore.js` hook properly restores player data including the `sold` property from saved state, ensuring consistency across app sessions.

### Auto-Save
The `useAutoSave.js` hook saves the complete player state including the `sold` property, maintaining data integrity.

### Team Transfers
Player transfers between teams via the Team Edit functionality also properly maintain the `sold: true` property.

## Files Modified in the Fix

1. **`src/hooks/useAuctionBusinessLogic.js`** - Main fix: Added `sold: true/false` to player updates
2. **`src/App.js`** - Added `sold: true` to player transfer functionality

## Files That Use the Fixed Logic

1. **`src/components/MaxBidPage.js`** - Consumes the `sold` property for analysis
2. **`src/components/MaxBidAnalysisTable.js`** - Displays the corrected bought/buy counters
3. **`src/hooks/useAutoSave.js`** - Persists the player state with `sold` property
4. **`src/hooks/useStartupRestore.js`** - Restores players with correct `sold` values

## Key Takeaways

1. **Consistency is Critical**: All player state updates must include the `sold` property
2. **Filtering Logic Dependency**: UI components rely on accurate data properties for calculations
3. **State Management**: Changes to core business logic must be reflected across all related components
4. **Testing Coverage**: Both sale and transfer operations needed the same fix

This fix ensures that the bought/buy counter accurately reflects the actual auction state across all components and user interactions.