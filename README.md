# Auction Dugout

A web-based tool for managing cricket team auctions, including player and team management, auction state persistence, WhatsApp integration, and backup/restore functionality.

## Features

- **Player & Team Management:** Upload CSV files to quickly add players and teams.
- **Auction State Persistence:** Automatically saves and restores auction progress using local storage.
- **Auto-Backup:** Periodically auto-saves auction state and allows manual backup/export as JSON.
- **Restore Functionality:** Restore previous sessions from backup files.
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
- **Auto-Backup:** The app auto-saves progress every few minutes. Manual backup/export is also available.
- **Restore:** Import a backup JSON file to restore a previous auction session.
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

### Backup JSON

- Exported backups are named `<TournamentName>_Backup_<Timestamp>.json` and contain the full auction state.

## Technologies Used

- React
- JavaScript (ES6+)
- LocalStorage API
- WhatsApp Web integration

## Supabase Integration

This project uses [Supabase](https://supabase.com/) for authentication and backend data storage.