# 🏏 Auction Dugout

A complete web-based cricket auction management system — run your IPL-style auction from any browser with live streaming, team management, WhatsApp updates, and cloud backup.

---

## 🏆 Features We Offer

### Core Auction
- **🎯 Live Auction Interface** — Real-time bidding with player photos, category-wise rounds, sold/unsold stamps, and confetti celebrations
- **📊 Player & Team CSV File Upload** — Bulk-import players and teams from CSV files with built-in validation and sample templates
- **⚙️ Category Configuration** — Set base price and player count per category (Platinum, Icon, Gold, Silver, Open, or custom) with smart budget validation
- **🔄 Multi-Round Support** — Unsold players carry forward to the next round for re-auction

### Live Viewer (Spectator Mode)
- **📺 Live Streaming Page** — Share a link (`#/viewer/USER_ID`) with spectators to watch the auction in real time — no login required
- **📱 Mobile-First Viewer** — Optimized for phones with compact cards, current player details, team summaries, and a prominent tournament name banner
- **🔗 Drive Photo Links** — Viewers can tap to open player photos from Google Drive in their own browser (zero bandwidth cost)

### Team Management
- **👥 Team Dashboard** — View squad, remaining budget, players still needed, and owner-retained players
- **🔀 Player Transfers** — Move players between teams or adjust sold prices after the auction
- **📤 CSV Export** — Download team rosters as CSV with one click

### Integrations & Utilities
- **📱 WhatsApp Integration** — Send auction updates and team summaries directly to WhatsApp groups
- **🎡 Spin Wheel** — Interactive random team selector for fun decision-making
- **🎨 Jersey Color Assignment** — Randomly assign jersey colors to each team
- **⚡ Booster Points** — Increase a team's budget by applying boosters (count × points-per-booster), reflected across Auction, Teams, Viewer, and Max Bid
- **📈 Max Bid Calculator** — Analytics dashboard showing each team's maximum affordable bid
- **🔗 CricHeroes Profiles** — Link each player to their CricHeroes profile for quick stats lookup

### Data Safety
- **🔐 Secure Authentication** — Email/password login powered by Supabase Auth
- **💾 Cloud Auto-Backup & Restore** — Authenticated auction state is saved to Supabase and restored by user ID; browser storage is not used for auction data
- **🛡️ No Data Loss** — `beforeunload` save + periodic auto-save ensures progress is never lost

---

## 📋 How to Use the App

### 1. Sign Up / Sign In
Open the app in your browser and create an account (or sign in). All your auction data is tied to your account and synced to the cloud.

### 2. Set Tournament Name
Enter your tournament name (min 3 characters). This appears in the auction ticker and on the viewer page.

### 3. Upload Players CSV
Prepare a CSV with these columns and upload it:

| Column | Required | Description |
|---|---|---|
| `Name` | ✅ | Player name |
| `Skillset` | ✅ | e.g. Batsman, Bowler, All-Rounder |
| `Photo Link` | ✅ | Google Drive sharing link to the player's photo |
| `Category` | ✅ | PLATINUM, ICON, GOLD, SILVER, OPEN, or custom |
| `CricHeroes_Profile` | ❌ | Link to the player's CricHeroes profile |

Photos are automatically downloaded from Google Drive and stored in Supabase Storage.

### 4. Upload Teams CSV
Prepare a CSV with these columns and upload it:

| Column | Required | Description |
|---|---|---|
| `Team Name` | ✅ | Name of the team |
| `Owner Name` | ✅ | Team owner's name |
| `Total Points` | ✅ | Team's total budget/purse |
| `Total Players to Buy` | ✅ | Number of players to acquire |
| `Owner Retained` | ❌ | Name of retained player (auto-deducted) |
| `Owner Retained at` | ❌ | Retention price |
| `Owner Category` | ❌ | Category of retained player |

### 5. Configure Categories
Set the base price and number of players to buy per category. The app validates that totals don't exceed team capacity or budget.

### 6. Run the Auction
- Select a category to start
- The current player's photo, skill, and category are displayed
- Pick a team, enter the bid amount, and confirm the sale
- Mark a player as unsold to move to the next
- The app tracks progress, shows confetti on sale, and auto-advances

### 7. Share the Viewer Link
Click **"Copy Viewer Link"** in the footer and share it with spectators. They can watch live from any device — no login needed. The page auto-refreshes every 5 seconds.

### 8. After the Auction
- Visit the **Teams** page to review squads, transfer players, or adjust prices
- **Export** team rosters as CSV
- **Share** team summaries via WhatsApp

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Tailwind CSS v4, Framer Motion |
| **State Management** | React Hooks (custom hooks architecture) |
| **Authentication** | Supabase Auth (email/password) |
| **Database** | Supabase PostgreSQL (`auction_data` table) |
| **File Storage** | Supabase Storage (`player-images` bucket) |
| **Backend API** | Node.js + Express (hosted on Render) |
| **Image Processing** | Magic-byte detection for MIME types, Google Drive download proxy |
| **Notifications** | React Hot Toast, WhatsApp Web API |
| **Animations** | Framer Motion, React Confetti, CSS keyframes |
| **CSV Parsing** | PapaParse (frontend), csv-parse (backend) |

---

## 🗄️ DB Setup

### Prerequisites
- A [Supabase](https://supabase.com) account (free tier works)
- A [Render](https://render.com) account for the backend API (free tier works)

### 1. Create the `auction_data` Table

```sql
CREATE TABLE auction_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX idx_auction_data_user_id ON auction_data(user_id);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auction_data_updated_at
    BEFORE UPDATE ON auction_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2. Create the `players` Table (used by the backend image upload)

```sql
CREATE TABLE players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    skill TEXT,
    category TEXT DEFAULT 'OPEN',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Create the Supabase Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `player-images`
3. Set it to **Public** (so player photos have public URLs)

### 4. Set Up Row Level Security (RLS)

```sql
-- Authenticated users can read/write their own auction data
CREATE POLICY "users_crud_own_data" ON auction_data
    FOR ALL USING (auth.uid() = user_id);

-- Public read access for the viewer page (no login required)
CREATE POLICY "allow_public_viewer_read" ON auction_data
    FOR SELECT USING (true);
```

### 5. Environment Variables

Create a `.env` file in the project root:

```env
# Backend (server.js) — Supabase service role for storage uploads
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET_NAME=player-images

# Frontend (React) — Supabase anon key for auth & data reads
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_BASE_URL=https://your-render-backend.onrender.com
```

### 6. Install & Run

```bash
# Install dependencies
npm install

# Start the React dev server
npm start

# Start the backend (in a separate terminal)
node server.js
```

---

**Auction Dugout** — Making cricket auctions exciting, organized, and professional! 🏏✨

Built by [Amit Gandhi](https://www.linkedin.com/in/amitajitgandhi/)
