# Auction Dugout

A web-based tool for managing cricket team auctions, including player and team management, auction state persistence, WhatsApp integration, and backup/restore functionality.

## Features

- **Player & Team Management:** Upload CSV files to quickly add players and teams.
- **Auto-Backup:** Periodically auto-saves auction state locally as well as over cloud<Supabase>
- **Restore Functionality:** Restore previous sessions from backups.
- **WhatsApp Integration:** Send auction updates and team summaries directly to WhatsApp groups.
- **User-Friendly Interface:** Modern UI with confirmation dialogs, toasts, and emoji support.

## User Guide

### Getting Started

1. **Authentication**
   - Access the application through your web browser
   - Sign in using your email and password
   - New users can sign up for an account

2. **Tournament Setup**
   - Enter a tournament name (minimum 3 characters)
   - The tournament name will appear in the ticker at the top of the screen

3. **Upload Data**
   - **Players CSV**: Upload a CSV file containing player information
     - Required columns: Name, Skillset, Photo Link, Category
     - Download sample CSV template from the interface
   - **Teams CSV**: Upload a CSV file containing team information
     - Required columns: Team Name, Owner Name, Purse, Players to Buy
     - Download sample CSV template from the interface

4. **Start Auction**
   - Once both players and teams are loaded, click "Start Auction"
   - Select a category from the available player categories
   - The auction interface will display the current player


## Usage

- **Upload Players/Teams:** Use the UI to upload CSV files for players and teams. Sample CSVs can be downloaded from the interface.
- **Start Auction:** Once players and teams are loaded, start the auction.
- **Auto-Backup:** The app auto-saves progress every few minutes. 
- **WhatsApp Integration:** Configure WhatsApp settings to send updates to your group.

## File Formats

### Players CSV

| Name           | Skillset      | Photo Link                | Category      |
|----------------|---------------|---------------------------|--------------|
| Virat Kohli    | Batsman       | https://.../virat.jpg  | BATSMEN      |

### Teams CSV

| Team Name                | Owner Name      | Purse     | Players to Buy |
|--------------------------|-----------------|-----------|----------------|
| Mumbai Indians           | Mukesh Ambani   | 80000000  | 25             |


## Technologies Used

### Frontend
- **React 18.2.0** - Modern React with hooks and functional components
- **JavaScript (ES6+)** - Modern JavaScript features and syntax
- **Tailwind CSS 4.1.11** - Utility-first CSS framework for styling
- **Framer Motion 12.23.7** - Animation library for smooth UI transitions
- **React Hot Toast 2.5.2** - Toast notifications and user feedback
- **React Confetti 6.4.0** - Celebratory animations for auction events

### Backend & API
- **Node.js with Express 5.1.0** - Server-side runtime and web framework
- **Supabase** - Backend-as-a-Service for authentication and data storage
- **CORS 2.8.5** - Cross-origin resource sharing middleware
- **Multer 2.0.2** - File upload handling middleware
- **Node Fetch 3.3.2** - HTTP client for server-side requests

### Data Processing
- **Papa Parse 5.4.1** - CSV parsing and processing library
- **CSV Parser 3.2.0** - Additional CSV handling utilities
- **Axios 1.11.0** - HTTP client for API requests

### Development Tools
- **React Scripts 5.0.1** - Build tools and development server
- **PostCSS 8.5.6** - CSS post-processing
- **Autoprefixer 10.4.21** - CSS vendor prefixing
- **ESLint 8.57.1** - JavaScript linting and code quality
- **TypeScript ESLint 8.37.0** - TypeScript support for ESLint

### Browser APIs
- **LocalStorage API** - Client-side data persistence
- **WhatsApp Web Integration** - Direct messaging capabilities
- **File API** - CSV file upload and processing

### Project Structure
```plaintext
auction-dugout/
├── public/                         # Static assets
│   ├── index.html                  # Main HTML template
│   └── favicon.ico                 # App favicon
│
├── src/                            # Source code
│   ├── components/                 # React components
│   │   ├── AuctionInterface.js     # Main auction bidding interface
│   │   ├── AuthPage.js             # User authentication page
│   │   ├── ConfirmationDialogs.js  # Modal confirmation dialogs
│   │   ├── FileUpload.js           # CSV file upload component
│   │   ├── JerseyColorAssignment.js # Team jersey color assignment
│   │   ├── PlayerImage.js          # Player photo display component
│   │   ├── PlayerInfo.js           # Player details display
│   │   ├── SpinWheel.js            # Random team selection wheel
│   │   ├── TeamManagement.js       # Team overview and management
│   │   ├── TeamOwnerView.js        # Team owner dashboard
│   │   └── ToastManager.js         # Toast notification manager
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.js              # Authentication logic
│   │   ├── useAuction.js           # Auction state management
│   │   ├── useAuctionBusinessLogic.js # Core auction business rules
│   │   ├── useAutoSave.js          # Automatic data persistence
│   │   ├── usePersistence.js       # Data backup and restore
│   │   ├── useStartupRestore.js    # Session restoration on startup
│   │   ├── useToastManager.js      # Toast notification management
│   │   └── useWhatsAppIntegration.js # WhatsApp messaging integration
│   │
│   ├── utils/                      # Utility functions
│   │   ├── constants.js            # App constants and emojis
│   │   ├── csvUtils.js             # CSV parsing and validation
│   │   └── supabaseClient.js       # Supabase client configuration
│   │
│   ├── assets/                     # Static assets (images, logos)
│   │   ├── ad.png                  # App logo
│   │   └── Whatsapp.png            # WhatsApp integration icon
│   │
│   ├── App.js                      # Main application component
│   ├── index.js                    # React app entry point
│   └── index.css                   # Global styles and Tailwind imports
│
├── server.js                       # Express.js backend server
├── download_player_images.js       # Player image processing script
├── package.json                    # Project dependencies and scripts
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── .env                            # Environment variables (not in repo)
└── README.md                       # Project documentation
```

### Key Architecture Patterns

- **Component-Based Architecture**: Modular React components for reusability
- **Custom Hooks Pattern**: Business logic separated into reusable hooks
- **State Management**: React hooks with local storage persistence
- **File-Based Routing**: Simple page navigation without complex routing
- **API Integration**: RESTful communication with Express.js backend
- **Real-time Updates**: LocalStorage-based state synchronization

### Supabase Integration

This project uses [Supabase](https://supabase.com/) for user authentication and data storage. 
Supabase environment variables are configured in `.env`.
