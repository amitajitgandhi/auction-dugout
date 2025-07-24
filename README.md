# Auction Dugout

A web-based tool for managing cricket team auctions, including player and team management, auction state persistence, WhatsApp integration, and backup/restore functionality.

## Features

- **Player & Team Management:** Upload CSV files to quickly add players and teams.
- **Auction State Persistence:** Automatically saves and restores auction progress using local storage.
- **Auto-Backup:** Periodically auto-saves auction state and allows manual backup/export as JSON.
- **Restore Functionality:** Restore previous sessions from backup files.
- **WhatsApp Integration:** Send auction updates and team summaries directly to WhatsApp groups.
- **User-Friendly Interface:** Modern UI with confirmation dialogs, toasts, and emoji support.

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd cricket-auction-tool
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Start the development server:
   ```sh
   npm start
   # or
   yarn start
   ```
4. Open your browser and navigate to `http://localhost:3000`

## Usage

- **Upload Players/Teams:** Use the UI to upload CSV files for players and teams. Sample CSVs can be downloaded from the interface.
- **Start Auction:** Once players and teams are loaded, start the auction.
- **Auto-Backup:** The app auto-saves progress every few minutes. Manual backup/export is also available.
- **Restore:** Import a backup JSON file to restore a previous auction session.
- **WhatsApp Integration:** Configure WhatsApp settings to send updates to your group.

## File Formats

### Players CSV

| Name           | Skillset      | Photo Link                | Category      |
|----------------|---------------|---------------------------|--------------|
| Virat Kohli    | Batsman       | https://.../virat.jpg     | BATSMEN      |

### Teams CSV

| Team Name                | Owner Name      | Purse     | Players to Buy |
|--------------------------|-----------------|-----------|----------------|
| Mumbai Indians           | Mukesh Ambani   | 80000000  | 25             |

### Backup JSON

- Exported backups are named `<TournamentName>_Backup_<Timestamp>.json` and contain the full auction state.

## Technologies Used

- React
- JavaScript (ES6+)
- LocalStorage API
- WhatsApp Web integration

## Supabase Integration

This project uses [Supabase](https://supabase.com/) for authentication and backend data storage.

### Supabase Setup Steps

1. **Create a Supabase Project**
   - Go to https://app.supabase.com/ and create a new project.
   - Note your Project URL and anon/public API key.

2. **Install Supabase Client**
   - In your project directory, run:
     ```sh
     npm install @supabase/supabase-js
     ```

3. **Initialize Supabase in Your App**
   - Create a file at `src/supabaseClient.js` with the following content:
     ```js
     import { createClient } from '@supabase/supabase-js';
     const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
     const supabaseAnonKey = 'YOUR_ANON_KEY';
     export const supabase = createClient(supabaseUrl, supabaseAnonKey);
     ```
   - Replace the placeholders with your actual Supabase credentials.

4. **Set Up Authentication and Tables in Supabase**
   - In the Supabase dashboard, enable Email sign-in under Authentication.
   - In the Table Editor, create tables for users, organizers, and auctions as needed.
   - Add a `role` column to the users table (e.g., 'admin', 'organizer').

5. **Next Steps**
   - Use Supabase Auth for login/signup in your React app.
   - Use Supabase client to read/write auction and organizer data.

See the [Supabase documentation](https://supabase.com/docs) for more details.
