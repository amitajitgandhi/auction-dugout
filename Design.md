# Design Documentation - Auction Dugout

A comprehensive design guide documenting the page-wise logic, variables, state management, and architectural patterns used throughout the Auction Dugout cricket auction management system.

## ?? Table of Contents

1. [System Overview](#system-overview)
2. [Global State Management](#global-state-management)
3. [Page-wise Documentation](#page-wise-documentation)
4. [Component Architecture](#component-architecture)
5. [Custom Hooks Documentation](#custom-hooks-documentation)
6. [Utility Functions](#utility-functions)
7. [Data Flow Patterns](#data-flow-patterns)
8. [State Persistence Strategy](#state-persistence-strategy)

---

## ??? System Overview

### Architecture Pattern
```
App.js (Root Container)
??? Authentication Layer (AuthPage)
??? Main Application Flow
?   ??? Tournament Setup
?   ??? Data Upload & Configuration
?   ??? Live Auction Interface
?   ??? Team Management
?   ??? Analytics & Reports
??? Persistence & Integration Layer
```

### Technology Stack
- **Frontend**: React 18.2.0 with functional components and hooks
- **Styling**: Tailwind CSS 4.1.11 with custom animations
- **State**: React hooks (useState, useEffect, custom hooks)
- **Persistence**: Local Storage + Supabase cloud storage
- **Authentication**: Supabase Auth
- **UI/UX**: Framer Motion animations, React Hot Toast notifications

---

## ?? Global State Management

### Main App State (App.js)
```javascript
// Core Data States
const [players, setPlayers] = useState([]);           // Array of player objects
const [teams, setTeams] = useState({});               // Object with team data
const [tournamentName, setTournamentName] = useState(""); // String
const [isTournamentNameSet, setIsTournamentNameSet] = useState(false); // Boolean

// Configuration States
const [categoryConfigs, setCategoryConfigs] = useState({}); // Auction category settings
const [whatsappSettings, setWhatsappSettings] = useState({}); // WhatsApp integration
const [boosterData, setBoosterData] = useState(null); // Team booster information

// Navigation & UI States
const [currentPage, setCurrentPage] = useState('auction'); // Current view
const [showResetConfirmation, setShowResetConfirmation] = useState(false);
const [showWhatsAppSettings, setShowWhatsAppSettings] = useState(false);
```

### Data Structure Definitions

#### Player Object Structure
```javascript
{
  id: "unique-id",
  name: "Player Name",
  skill: "Batsman/Bowler/All Rounder",
  category: "PLATINUM/ICON/GOLD/SILVER/OPEN",
  photo: "image-url",
  cricHeroesProfile: "profile-url" (optional),
  sold: false,
  soldTo: null,
  soldPrice: 0
}
```

#### Team Object Structure
```javascript
{
  "Team Name": {
    owner: "Owner Name",
    purse: 80000000,           // Remaining budget
    playersToBuy: 25,          // Players still needed
    players: [],               // Array of purchased players
    ownerRetained: false,      // Whether owner is retained
    ownerRetainedAt: 0,        // Cost of owner retention
    ownerCategory: "OPEN"      // Owner's category if retained
  }
}
```

#### Category Config Structure
```javascript
{
  "PLATINUM": {
    playersPerCategory: 3,
    basePrice: 2000000
  },
  "GOLD": {
    playersPerCategory: 5,
    basePrice: 1000000
  }
  // ... other categories
}
```

#### Booster Data Structure
```javascript
{
  pointsPerBooster: 500000,
  teamBoosters: {
    "Team Name": {
      selected: true,
      boosterCount: 2
    }
    // ... other teams
  }
}
```

---

## ?? Page-wise Documentation

### 1. Authentication Page (AuthPage.js)

**Purpose**: User authentication and feature showcase

**Local State Variables**:
```javascript
const [email, setEmail] = useState('');               // User email input
const [password, setPassword] = useState('');         // User password input
const [highlightedTile, setHighlightedTile] = useState(-1); // Feature highlight animation
```

**Key Props**: None (root level component)

**Logic Flow**:
1. Display animated feature tiles with auto-highlighting
2. Handle user authentication via Supabase
3. Redirect to main app on successful login
4. Show loading states and error messages

**Components Used**:
- `useAuth()` hook for authentication logic
- Framer Motion for animations
- Logo component with rotation animation

---

### 2. Tournament Setup (TournamentSetup.js)

**Purpose**: Initial tournament configuration

**Local State Variables**:
```javascript
// Managed in parent App.js
tournamentName          // Tournament name string
isTournamentNameSet     // Boolean flag for setup completion
```

**Key Props**:
```javascript
{
  tournamentName: string,
  setTournamentName: function,
  onSubmit: function
}
```

**Logic Flow**:
1. Validate tournament name (minimum 3 characters)
2. Set tournament name in global state
3. Display scrolling ticker with tournament name
4. Enable navigation to next step

---

### 3. File Upload Page (FileUpload.js)

**Purpose**: CSV data upload and processing for players and teams

**Local State Variables**:
```javascript
const [playersFile, setPlayersFile] = useState(null);      // Selected players CSV
const [teamsFile, setTeamsFile] = useState(null);          // Selected teams CSV
const [uploadProgress, setUploadProgress] = useState({});   // Upload progress tracking
const [processing, setProcessing] = useState(false);       // Processing status
const [validationErrors, setValidationErrors] = useState([]); // Validation messages
```

**Key Props**:
```javascript
{
  players: array,           // Current player data
  teams: object,           // Current team data
  onPlayersLoad: function, // Player data callback
  onTeamsLoad: function,   // Team data callback
  onError: function,       // Error handler
  onStartAuction: function, // Navigation callback
  persistence: object,     // Persistence utilities
  authUser: object,        // User authentication
  showManagedToast: function // Toast notifications
}
```

**Logic Flow**:
1. **File Selection**: Handle CSV file selection with validation
2. **CSV Parsing**: Use Papa Parse to process CSV data
3. **Data Validation**: Validate required columns and data formats
4. **Image Processing**: Send player photos to backend for processing
5. **State Update**: Update global players/teams state
6. **Progress Tracking**: Show upload and processing progress
7. **Error Handling**: Display validation errors and retry options

**CSV Processing Functions**:
```javascript
// Player CSV processing
const processPlayersCSV = async (file) => {
  // Parse CSV ? Validate structure ? Process images ? Update state
}

// Team CSV processing  
const processTeamsCSV = async (file) => {
  // Parse CSV ? Validate team data ? Calculate budgets ? Update state
}
```

---

### 4. Category Configuration (CategoryConfig.js)

**Purpose**: Configure auction settings per player category

**Local State Variables**:
```javascript
const [categoryConfigs, setCategoryConfigs] = useState({}); // Category settings
const [validationState, setValidationState] = useState({}); // Validation results
const [fieldErrors, setFieldErrors] = useState({});         // Field-specific errors
```

**Key Props**:
```javascript
{
  players: array,              // Player data for validation
  teams: object,              // Team data for budget validation
  tournamentName: string,     // Tournament identifier
  onStartAuction: function,   // Start auction callback
  onBackToFileUpload: function, // Navigation callback
  showManagedToast: function, // Toast notifications
  categoryConfigs: object     // Existing configuration
}
```

**Logic Flow**:
1. **Category Detection**: Extract unique categories from player data
2. **Configuration Input**: Allow setting players per category and base prices
3. **Real-time Validation**: 
   - Players per category ? available players in that category
   - Base price ? team budget
   - Total players across categories = team requirement
4. **Visual Feedback**: Highlight invalid fields in red
5. **Summary Display**: Show totals and validation status
6. **Auction Start**: Enable auction start when all validations pass

**Validation Logic**:
```javascript
const validateConfiguration = useMemo(() => {
  // Check players per category limits
  // Validate base price against team budgets  
  // Ensure total players match team requirements
  // Return validation state and errors
}, [categoryConfigs, players, teams]);
```

---

### 5. Live Auction Interface (AuctionInterface.js)

**Purpose**: Main auction bidding interface

**Local State Variables**:
```javascript
// Managed by useAuction hook
const [currentPlayer, setCurrentPlayer] = useState(null);     // Player being auctioned
const [teamNameInput, setTeamNameInput] = useState('');       // Bid team input
const [bidAmountInput, setBidAmountInput] = useState('');     // Bid amount input
const [selectedCategory, setSelectedCategory] = useState(''); // Current category
const [round, setRound] = useState(1);                        // Auction round
const [isUnsoldRound, setIsUnsoldRound] = useState(false);   // Unsold player round
const [showConfetti, setShowConfetti] = useState(false);     // Celebration animation
```

**Key Props**:
```javascript
{
  currentPlayer: object,           // Current player object
  teams: object,                  // Team data
  teamNameInput: string,          // Team input value
  setTeamNameInput: function,     // Team input setter
  bidAmountInput: string,         // Bid input value
  setBidAmountInput: function,    // Bid input setter
  onMarkSold: function,           // Sell player callback
  onMarkUnsold: function,         // Mark unsold callback
  onNextPlayer: function,         // Next player callback
  selectedCategory: string,       // Current category
  round: number,                  // Current round
  isUnsoldRound: boolean,         // Unsold round flag
  onChangeCategory: function      // Category change callback
}
```

**Logic Flow**:
1. **Player Display**: Show current player with photo and details
2. **Category Management**: Handle category selection and round progression
3. **Bidding Interface**: 
   - Team dropdown with autocomplete
   - Bid amount input with validation
   - Confirmation dialogs for actions
4. **Player Actions**:
   - Mark as sold (update team data, deduct budget)
   - Mark as unsold (queue for later rounds)
   - Skip to next player
5. **Progress Tracking**: Show sold/unsold counts per category
6. **Animation**: Confetti on successful bids

**Key Business Logic**:
```javascript
// Validate bid against team budget and constraints
const validateBid = (teamName, bidAmount) => {
  const team = teams[teamName];
  return team.purse >= bidAmount && team.playersToBuy > 0;
};

// Update team state after successful bid
const updateTeamAfterPurchase = (teamName, player, price) => {
  // Deduct from purse, add player to roster, reduce playersToBuy
};
```

---

### 6. Teams Overview Page (TeamsPage.js)

**Purpose**: Team management and squad overview

**Local State Variables**:
```javascript
const [showMenu, setShowMenu] = useState(false);              // Hamburger menu
const [showPlayerSpin, setShowPlayerSpin] = useState(false);  // Player spin modal
const [showJerseyColor, setShowJerseyColor] = useState(false); // Jersey color modal
const [showBooster, setShowBooster] = useState(false);        // Booster modal
const [editingPlayer, setEditingPlayer] = useState(null);     // Player being edited
const [showConfirmation, setShowConfirmation] = useState(false); // Edit confirmation
const [editForm, setEditForm] = useState({                    // Edit form data
  newTeam: '',
  newPrice: 0
});
```

**Key Props**:
```javascript
{
  teams: object,                  // Team data
  players: array,                 // Player data
  tournamentName: string,         // Tournament name
  onResetAuction: function,       // Reset callback
  onBackToAuction: function,      // Navigation callback
  showManagedToast: function,     // Toast notifications
  onPlayerEdit: function,         // Player edit callback
  boosterData: object,            // Team booster data
  onBoosterUpdate: function,      // Booster update callback
  whatsappSettings: object,       // WhatsApp configuration
  onTeamWhatsAppShare: function   // WhatsApp sharing
}
```

**Logic Flow**:
1. **Team Display**: Grid layout showing each team's information
2. **Financial Summary**: 
   - Points left (including booster adjustments)
   - Players still needed
   - Current squad value
3. **Squad Management**:
   - List purchased players with categories and prices
   - Edit player assignments (transfer between teams)
   - Update player prices
4. **Action Menu**:
   - Export team data to CSV
   - Player spin wheel
   - Jersey color assignment
   - Team boosters
   - WhatsApp integration
5. **Player Editing**:
   - Modal interface for player transfers
   - Confirmation dialogs for changes
   - Validation of new assignments

**Helper Functions**:
```javascript
// Calculate adjusted purse including booster points
const getAdjustedPurse = (teamName, teamData) => {
  let adjustedPurse = teamData.purse;
  // Add booster points if available
  if (boosterData?.teamBoosters?.[teamName]?.selected) {
    adjustedPurse += boosterPoints;
  }
  return adjustedPurse;
};

// Format team names for display
const toCamelCase = (str) => {
  // Convert to proper case formatting
};
```

---

### 7. Max Bid Analysis Page (MaxBidPage.js)

**Purpose**: Analytics dashboard for bidding capacity analysis

**Local State Variables**:
```javascript
const [showMenu, setShowMenu] = useState(false);                    // Options menu
const [selectedCategoryForAnalysis, setSelectedCategoryForAnalysis] = useState(''); // Analysis category
const [showCalculationHelp, setShowCalculationHelp] = useState(false); // Help modal
```

**Key Props**:
```javascript
{
  teams: object,                  // Team data
  players: array,                 // Player data
  tournamentName: string,         // Tournament name
  currentPlayer: object,          // Current auction player
  selectedCategory: string,       // Current auction category
  categoryConfigs: object,        // Category configurations
  boosterData: object,           // Team booster data
  onResetAuction: function,      // Reset callback
  onBackToAuction: function,     // Navigation callback
  showManagedToast: function     // Toast notifications
}
```

**Logic Flow**:
1. **Team Analysis Calculation**:
   ```javascript
   const teamAnalysis = useMemo(() => {
     return Object.entries(teams).map(([teamName, teamData]) => {
       const remainingPoints = getAdjustedPurse(teamName, teamData);
       const categoryBreakdown = calculateCategoryBreakdown(teamData);
       const maxBid = remainingPoints - totalReservedPoints;
       return { teamName, remainingPoints, maxBid, categoryBreakdown };
     });
   }, [teams, categoryConfigs, selectedCategoryForAnalysis, boosterData]);
   ```

2. **Category Analysis**:
   - Calculate players bought vs. allowed per category
   - Determine base prices and reserved points
   - Apply different logic for selected vs. other categories

3. **Max Bid Calculation**:
   - **Formula**: Max Bid = Points Left - Reserved Points
   - **Selected Category**: Reserve (remaining - 1) × base price
   - **Other Categories**: Reserve remaining × base price

4. **Visual Presentation**:
   - Sortable table with team rankings
   - Category-wise breakdown
   - Color coding for bid capacity
   - Export functionality

**Core Calculation Logic**:
```javascript
// Calculate points reserved for each category
const calculateReservedPoints = (teamData, selectedCategory) => {
  let totalReserved = 0;
  
  availableCategories.forEach(categoryName => {
    const config = categoryConfigs[categoryName];
    const playersBought = teamData.players.filter(p => p.category === categoryName).length;
    const playersRemaining = config.playersPerCategory - playersBought;
    
    if (categoryName === selectedCategory) {
      // For selected category, reserve (n-1) players
      totalReserved += Math.max(0, playersRemaining - 1) * config.basePrice;
    } else {
      // For other categories, reserve all remaining players
      totalReserved += playersRemaining * config.basePrice;
    }
  });
  
  return totalReserved;
};
```

---

### 8. Category Selection Modal (CategorySelection.js)

**Purpose**: Category selection for auction phases

**Local State Variables**:
```javascript
// Minimal state - mostly controlled by parent
```

**Key Props**:
```javascript
{
  isOpen: boolean,              // Modal visibility
  categories: array,            // Available categories
  onSelect: function,           // Category selection callback
  onClose: function,            // Close modal callback
  onViewTeams: function,        // Navigation to teams
  onViewMaxBid: function        // Navigation to max bid
}
```

**Logic Flow**:
1. Display available player categories
2. Show player count per category
3. Handle category selection
4. Provide navigation shortcuts

---

## ?? Component Architecture

### Modal Components Pattern
All modal components follow a consistent pattern:

```javascript
const ModalComponent = ({ isOpen, onClose, ...props }) => {
  // Early return if not open
  if (!isOpen) return null;
  
  return (
    <>
      {/* Modal content */}
      <div className="fixed inset-0 z-50">
        {/* Modal body */}
      </div>
      
      {/* Backdrop click handler */}
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
    </>
  );
};
```

### Form Components Pattern
Form components use controlled inputs with validation:

```javascript
const FormComponent = ({ onSubmit, showManagedToast }) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateForm(formData);
    if (validation.isValid) {
      onSubmit(formData);
    } else {
      setErrors(validation.errors);
      showManagedToast('error', 'Please fix validation errors');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with error handling */}
    </form>
  );
};
```

---

## ?? Custom Hooks Documentation

### useAuth Hook
**Purpose**: Authentication state management

**Returns**:
```javascript
{
  user: object | null,          // Current user object
  loading: boolean,             // Authentication loading state
  signIn: function,             // Sign in method
  signUp: function,             // Sign up method
  signOut: function,            // Sign out method
  error: string | null          // Authentication error
}
```

### useAuction Hook
**Purpose**: Core auction state management

**Parameters**: `(players, showManagedToast)`

**Returns**:
```javascript
{
  // Current auction state
  currentPlayer: object | null,
  selectedCategory: string,
  round: number,
  isUnsoldRound: boolean,
  
  // Counts and progress
  soldCount: number,
  markedUnsoldCount: number,
  currentCategoryUnsoldCount: number,
  
  // UI state
  showConfetti: boolean,
  categorySelectionOpen: boolean,
  
  // Input controls
  teamNameInput: string,
  setTeamNameInput: function,
  bidAmountInput: string,
  setBidAmountInput: function,
  
  // Action methods
  startAuction: function,
  pickNextPlayer: function,
  handleCategorySelect: function,
  resetAuction: function,
  
  // Utility methods
  getUniqueCategories: function,
  isLastPlayerInQueue: boolean
}
```

### usePersistence Hook
**Purpose**: Data backup and restore functionality

**Parameters**: `(showManagedToast, user)`

**Returns**:
```javascript
{
  saveState: function,          // Save current state
  loadState: function,          // Load saved state
  clearState: function,         // Clear saved data
  exportBackup: function,       // Export backup file
  getSavedInfo: function,       // Get save metadata
  autoSave: function,           // Auto-save functionality
  lastSaveTime: string | null,  // Last save timestamp
  autoBackupEnabled: boolean,   // Auto-backup setting
  setAutoBackupEnabled: function // Toggle auto-backup
}
```

### useAutoSave Hook
**Purpose**: Automatic data persistence

**Parameters**: 
```javascript
(
  players,           // Player data
  teams,            // Team data
  tournamentName,   // Tournament name
  isTournamentNameSet, // Setup status
  whatsappSettings, // WhatsApp config
  auction,          // Auction state
  persistence,      // Persistence utilities
  authUser,         // User object
  categoryConfigs,  // Category settings
  boosterData       // Booster data
)
```

**Logic**:
- Auto-save every 2 minutes when conditions are met
- Save on page unload/close
- Only save when tournament is set and meaningful progress exists

### useToastManager Hook
**Purpose**: Centralized toast notification management

**Returns**:
```javascript
{
  showManagedToast: function,   // Show toast with consistent styling
  showFancyError: function      // Show error toast with enhanced styling
}
```

### useWhatsAppIntegration Hook
**Purpose**: WhatsApp messaging functionality

**Parameters**: `(showManagedToast)`

**Returns**:
```javascript
{
  whatsappSettings: object,         // Current WhatsApp settings
  setWhatsappSettings: function,    // Update settings
  sendWhatsAppNotification: function, // Send player sale notification
  handleWhatsAppTest: function,     // Test WhatsApp integration
  handleTeamWhatsAppShare: function // Share team summary
}
```

---

## ??? Utility Functions

### CSV Processing (csvUtils.js)
```javascript
// Parse and validate CSV files
export const parseCSV = (file, expectedColumns) => {
  // Use Papa Parse to process CSV
  // Validate required columns
  // Return parsed data or errors
};

// Validate player CSV structure
export const validatePlayerCSV = (data) => {
  // Check required fields: name, skill, photo, category
  // Validate data types and formats
  // Return validation results
};

// Validate team CSV structure
export const validateTeamCSV = (data) => {
  // Check required fields: team name, owner, budget, etc.
  // Validate numeric fields and constraints
  // Return validation results
};
```

### Constants and Styling (constants.js)
```javascript
// Emoji constants for consistent UI
export const EMOJIS = {
  TROPHY: '??',
  CRICKET_BAT: '??',
  CURRENCY_RUPEE: '?',
  // ... many more
};

// Toast styling themes
export const TOAST_STYLES = {
  success: {
    border: '2px solid #10b981',
    background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
    // ... complete styling
  },
  error: {
    border: '2px solid #f59e42',
    background: 'linear-gradient(90deg, #fffbe6 0%, #ffe4e6 100%)',
    // ... complete styling
  }
};

// Export functionality
export const exportTeamsData = (teams, tournamentName) => {
  // Generate CSV data from teams object
  // Create downloadable file
  // Trigger browser download
};
```

### WhatsApp Integration (whatsappUtils.js)
```javascript
// Format player sale messages
export const formatPlayerSaleMessage = (player, team, price, tournament) => {
  // Create formatted message with emojis
  // Include player details and sale information
  // Return WhatsApp-ready message
};

// Format team summary messages
export const formatTeamSummaryMessage = (teamName, teamData, tournament) => {
  // Create comprehensive team overview
  // Include squad, budget, and statistics
  // Return formatted message
};

// WhatsApp emoji constants
export const WHATSAPP_EMOJIS = {
  CRICKET: '??',
  TROPHY: '??',
  MONEY: '??',
  // ... WhatsApp-specific emojis
};
```

---

## ?? Data Flow Patterns

### Component Communication Patterns

#### 1. Parent-Child Props Flow
```javascript
// Parent component
const Parent = () => {
  const [data, setData] = useState(initialData);
  
  return (
    <Child 
      data={data}
      onUpdate={(newData) => setData(newData)}
      onAction={handleAction}
    />
  );
};

// Child component
const Child = ({ data, onUpdate, onAction }) => {
  // Use props for display and callbacks for actions
};
```

#### 2. Hook-Based State Sharing
```javascript
// Custom hook provides state and methods
const useSharedState = () => {
  const [state, setState] = useState(initial);
  
  const methods = {
    updateState: (newState) => setState(newState),
    resetState: () => setState(initial)
  };
  
  return { state, ...methods };
};

// Components use shared hook
const ComponentA = () => {
  const { state, updateState } = useSharedState();
  // Component logic
};
```

#### 3. Event-Driven Updates
```javascript
// Auction events trigger cascading updates
const handlePlayerSold = (player, team, price) => {
  // Update player data
  setPlayers(prev => prev.map(p => 
    p.id === player.id ? { ...p, sold: true, soldTo: team, soldPrice: price } : p
  ));
  
  // Update team data
  setTeams(prev => ({
    ...prev,
    [team]: {
      ...prev[team],
      purse: prev[team].purse - price,
      players: [...prev[team].players, { ...player, soldPrice: price }],
      playersToBuy: prev[team].playersToBuy - 1
    }
  }));
  
  // Trigger side effects
  sendWhatsAppNotification(player, team, price);
  saveProgress();
  showCelebration();
};
```

### State Update Patterns

#### 1. Immutable Updates
```javascript
// Always create new objects/arrays
const updateTeamPurse = (teamName, newPurse) => {
  setTeams(prev => ({
    ...prev,
    [teamName]: {
      ...prev[teamName],
      purse: newPurse
    }
  }));
};
```

#### 2. Batch Updates
```javascript
// Group related updates together
const handleBoosterApplication = (boosterData) => {
  setBoosters(boosterData);
  
  // Recalculate affected teams
  const updatedTeams = Object.entries(teams).reduce((acc, [name, data]) => {
    acc[name] = {
      ...data,
      adjustedPurse: calculateAdjustedPurse(name, data, boosterData)
    };
    return acc;
  }, {});
  
  setTeams(updatedTeams);
  saveProgress();
};
```

#### 3. Conditional Updates
```javascript
// Update only when conditions are met
const conditionalSave = useCallback(async (stateData) => {
  if (!user?.id || !stateData.isTournamentNameSet) {
    return; // Skip save if conditions not met
  }
  
  await persistence.saveState(stateData);
}, [user, persistence]);
```

---

## ?? State Persistence Strategy

### Multi-Layer Persistence
```javascript
// Layer 1: In-Memory State (React)
const [players, setPlayers] = useState([]);

// Layer 2: Local Storage (Browser)
useEffect(() => {
  localStorage.setItem('auction_players', JSON.stringify(players));
}, [players]);

// Layer 3: Cloud Storage (Supabase)
useEffect(() => {
  if (shouldSaveToCloud(players)) {
    persistence.saveState({ players, teams, ...otherState });
  }
}, [players, teams, /* other dependencies */]);

// Layer 4: Auto-Save Timer
useAutoSave(players, teams, tournamentName, /* other dependencies */);
```

### Save Triggers
```javascript
// Immediate saves on critical actions
const handleCriticalAction = async () => {
  // Perform action
  updateState(newState);
  
  // Immediate save
  await persistence.saveState(getCurrentState());
};

// Debounced saves on frequent updates
const debouncedSave = useCallback(
  debounce(async (state) => {
    await persistence.saveState(state);
  }, 2000),
  [persistence]
);

// Auto-save on interval
useEffect(() => {
  const interval = setInterval(async () => {
    if (hasUnsavedChanges()) {
      await persistence.autoSave(getCurrentState());
    }
  }, 30000); // Every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

### Restore Logic
```javascript
// Startup restore with priority order
const restoreData = async () => {
  try {
    // 1. Try cloud storage first
    const cloudData = await persistence.loadState();
    if (cloudData && isValidData(cloudData)) {
      return cloudData;
    }
    
    // 2. Fallback to local storage
    const localData = localStorage.getItem('auction_state');
    if (localData) {
      return JSON.parse(localData);
    }
    
    // 3. Default to empty state
    return getInitialState();
  } catch (error) {
    console.error('Restore failed:', error);
    return getInitialState();
  }
};
```

---

## ?? UI/UX Patterns

### Consistent Styling Patterns
```javascript
// Button variants
const buttonStyles = {
  primary: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
  secondary: "bg-gray-200 text-gray-800",
  danger: "bg-gradient-to-r from-red-500 to-red-600 text-white",
  success: "bg-gradient-to-r from-green-500 to-green-600 text-white"
};

// Modal patterns
const modalBase = "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm";
const modalContent = "bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4";

// Toast styling
const toastStyles = {
  success: {
    border: '2px solid #10b981',
    background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
    color: '#065f46'
  }
};
```

### Animation Patterns
```javascript
// Fade in animations
const fadeIn = "animate-fade-in";

// Scale animations on hover
const scaleHover = "hover:scale-105 transition-all duration-200";

// Loading states
const loadingSpinner = "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500";

// Confetti celebrations
const celebrationEffect = () => {
  setShowConfetti(true);
  setTimeout(() => setShowConfetti(false), 4000);
};
```

### Responsive Design Patterns
```javascript
// Grid layouts
const responsiveGrid = "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6";

// Text scaling
const responsiveText = "text-2xl md:text-4xl lg:text-5xl";

// Padding adjustments
const responsivePadding = "px-4 md:px-6 lg:px-8";

// Navigation adaptations
const mobileMenu = "fixed top-16 right-4 z-50 md:relative md:top-0";
```

---

## ?? Configuration & Environment

### Environment Variables
```javascript
// Supabase configuration
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

// Backend API
REACT_APP_API_BASE_URL=your-backend-url

// Feature flags
REACT_APP_ENABLE_WHATSAPP=true
REACT_APP_ENABLE_AUTO_SAVE=true
```

### Build Configuration
```javascript
// Tailwind CSS configuration
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'marquee': 'marquee 20s linear infinite'
      }
    }
  }
};

// PostCSS configuration
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

---

## ?? Performance Considerations

### Optimization Strategies
```javascript
// Memoization for expensive calculations
const expensiveCalculation = useMemo(() => {
  return calculateMaxBids(teams, categoryConfigs, selectedCategory);
}, [teams, categoryConfigs, selectedCategory]);

// Callback memoization
const handlePlayerSelect = useCallback((player) => {
  setCurrentPlayer(player);
}, []);

// Component memoization
const PlayerCard = React.memo(({ player, onSelect }) => {
  return (
    <div onClick={() => onSelect(player)}>
      {player.name}
    </div>
  );
});

// Lazy loading for large datasets
const VirtualizedPlayerList = ({ players }) => {
  // Implement virtualization for large player lists
};
```

### Bundle Optimization
```javascript
// Code splitting
const LazyMaxBidPage = React.lazy(() => import('./components/MaxBidPage'));

// Dynamic imports
const loadPlayerImage = async (playerPhoto) => {
  const { processImage } = await import('./utils/imageUtils');
  return processImage(playerPhoto);
};
```

---

## ?? Error Handling & Validation

### Validation Patterns
```javascript
// Form validation
const validateForm = (formData) => {
  const errors = {};
  
  if (!formData.name || formData.name.length < 3) {
    errors.name = 'Name must be at least 3 characters';
  }
  
  if (!formData.email || !isValidEmail(formData.email)) {
    errors.email = 'Valid email is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Data validation
const validatePlayerData = (player) => {
  const requiredFields = ['name', 'skill', 'category', 'photo'];
  const missing = requiredFields.filter(field => !player[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
};
```

### Error Boundaries
```javascript
// Global error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
    // Log to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### Graceful Degradation
```javascript
// Fallback for failed features
const WhatsAppIntegration = ({ settings, onFallback }) => {
  try {
    return <WhatsAppComponent settings={settings} />;
  } catch (error) {
    console.warn('WhatsApp integration failed, using fallback');
    return <BasicNotification onFallback={onFallback} />;
  }
};

// Progressive enhancement
const EnhancedFeature = ({ basicVersion, enhancedVersion, isSupported }) => {
  return isSupported ? enhancedVersion : basicVersion;
};
```

---

## ?? Development Guidelines

### Code Organization
```javascript
// File naming conventions
components/           // React components (PascalCase)
hooks/               // Custom hooks (camelCase starting with 'use')
utils/               // Utility functions (camelCase)
constants/           // Constants and configuration

// Component structure
const ComponentName = ({ prop1, prop2, ...props }) => {
  // 1. State declarations
  const [state, setState] = useState(initial);
  
  // 2. Hooks and effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 3. Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // 4. Computed values
  const computedValue = useMemo(() => {
    // Computation
  }, [dependencies]);
  
  // 5. Early returns
  if (!data) return <Loading />;
  
  // 6. Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

### Documentation Standards
```javascript
/**
 * Component for managing team auction data
 * @param {Object} props - Component props
 * @param {Array} props.teams - Team data array
 * @param {Function} props.onUpdate - Update callback
 * @param {Boolean} props.isEditable - Whether teams can be edited
 * @returns {JSX.Element} Team management interface
 */
const TeamManager = ({ teams, onUpdate, isEditable = true }) => {
  // Component implementation
};
```

---

This design document provides a comprehensive overview of the Auction Dugout application's architecture, component design, and implementation patterns. It serves as a reference for understanding the codebase structure and maintaining consistency across the application.

**Last Updated**: August 2025  
**Version**: 1.0  
**Maintained By**: Amit Gandhi