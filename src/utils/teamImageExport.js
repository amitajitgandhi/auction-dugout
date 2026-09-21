/**
 * Canvas-based image export for the Teams Summary page.
 *
 * Draws a shareable PNG directly on a <canvas> instead of screenshotting the
 * DOM (no html2canvas/dom-to-image dependency, no risk of Tailwind gradients
 * or backdrop-blur rendering incorrectly). Two entry points:
 *   - exportTeamCardImage(teamName, teamData, tournamentName)   -> one team
 *   - exportAllTeamsImage(teams, tournamentName)                -> all teams, one image
 *
 * Both render a canvas, then either open the device's native share sheet
 * (so "Share to WhatsApp" works directly on mobile) or fall back to a plain
 * PNG download when Web Share with files isn't available (most desktops).
 */

// Render everything at 2x for crisp text on high-DPI phone screens.
const SCALE = 2;

const PALETTE = {
    page: '#0f172a',
    cardBg: '#ffffff',
    cardBorder: '#c7d2fe',
    headerFrom: '#facc15',
    headerVia: '#f43f5e',
    headerTo: '#ec4899',
    statsBg: '#dbeafe',
    statsBorder: '#93c5fd',
    statLabel: '#1e3a8a',
    statValue: '#1d4ed8',
    statValueGreen: '#059669',
    statValueOrange: '#c2410c',
    squadHeaderBg: '#d1fae5',
    squadHeaderText: '#047857',
    rowBorder: '#e5e7eb',
    rowAlt: '#f9fafb',
    nameText: '#1f2937',
    categoryBg: '#f3e8ff',
    categoryText: '#7e22ce',
    priceBg: '#d1fae5',
    priceBorder: '#34d399',
    priceText: '#047857',
    ownerText: '#475569',
    footerText: '#94a3b8',
    emptyText: '#9ca3af'
};

const money = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}

function truncateToWidth(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let lo = 0, hi = text.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        const candidate = text.slice(0, mid) + '…';
        if (ctx.measureText(candidate).width <= maxWidth) lo = mid;
        else hi = mid - 1;
    }
    return lo > 0 ? text.slice(0, lo) + '…' : '…';
}

function drawGradientBanner(ctx, x, y, width, height) {
    const g = ctx.createLinearGradient(x, 0, x + width, 0);
    g.addColorStop(0, PALETTE.headerFrom);
    g.addColorStop(0.5, PALETTE.headerVia);
    g.addColorStop(1, PALETTE.headerTo);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, width, height);
}

function toCamelCase(str) {
    return (str || '')
        .toLowerCase()
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join(' ');
}

// --- Layout constants (logical px, pre-scale) --------------------------------

const ROW_H = 34;
const PLAYER_ROW_GAP = 6;

function playersHeight(count) {
    return count > 0 ? count * (ROW_H + PLAYER_ROW_GAP) : 56;
}

// These must track the cumulative cursorY advance inside drawTeamCard exactly
// (name row + owner row [+ stats box], then the squad header) — if they drift
// apart, cards either waste whitespace or, worse, overflow their allotted
// height and bleed into whatever's drawn next (a real problem in the masonry
// "all teams" layout where cards sit right next to each other).
function teamCardHeight(playerCount, compact) {
    const preSquadHeaderH = compact ? 62 : 138; // name + owner [+ stats box]
    const squadHeaderH = 38; // squad header pill + gap
    const padTop = 20;
    const padBottom = 20;
    return padTop + preSquadHeaderH + squadHeaderH + playersHeight(playerCount) + padBottom;
}

/**
 * Draws one team's card (header, stats, squad list) inside the given box.
 * @returns {number} the height actually drawn
 */
function drawTeamCard(ctx, x, y, width, teamName, teamData, { compact = false } = {}) {
    const players = teamData.players || [];
    const totalSpent = players.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    const currentPurse = teamData.purse || 0;
    const initialPurse = teamData.initialPurse || currentPurse + totalSpent;
    const height = teamCardHeight(players.length, compact);

    // Card background
    ctx.fillStyle = PALETTE.cardBg;
    ctx.strokeStyle = PALETTE.cardBorder;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, width, height, 18);
    ctx.fill();
    ctx.stroke();

    const padX = 20;
    let cursorY = y + 20;

    // Team name
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PALETTE.nameText;
    ctx.font = compact ? 'bold 20px Arial' : 'bold 24px Arial';
    const nameMaxWidth = width - padX * 2;
    ctx.fillText(truncateToWidth(ctx, `\u{1F3CF} ${teamName}`, nameMaxWidth), x + padX, cursorY + 22);
    cursorY += compact ? 30 : 34;

    // Owner
    ctx.font = compact ? '13px Arial' : '15px Arial';
    ctx.fillStyle = PALETTE.ownerText;
    ctx.fillText(truncateToWidth(ctx, `Owner: ${teamData.owner || '-'}`, nameMaxWidth), x + padX, cursorY + 14);
    cursorY += compact ? 26 : 30;

    // Stats row (full cards only — compact cards skip this to save room)
    if (!compact) {
        const statsY = cursorY;
        const statsH = 60;
        ctx.fillStyle = PALETTE.statsBg;
        ctx.strokeStyle = PALETTE.statsBorder;
        ctx.lineWidth = 1;
        roundRect(ctx, x + padX, statsY, width - padX * 2, statsH, 12);
        ctx.fill();
        ctx.stroke();

        const colW = (width - padX * 2) / 3;
        const stats = [
            { label: 'Total Points', value: money(initialPurse), color: PALETTE.statValue },
            { label: 'Points Left', value: money(currentPurse), color: PALETTE.statValueGreen },
            { label: 'To Buy', value: String(teamData.playersToBuy ?? 0), color: PALETTE.statValueOrange }
        ];
        stats.forEach((s, i) => {
            const cx = x + padX + colW * i + colW / 2;
            ctx.textAlign = 'center';
            ctx.font = '12px Arial';
            ctx.fillStyle = PALETTE.statLabel;
            ctx.fillText(s.label, cx, statsY + 22);
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = s.color;
            ctx.fillText(s.value, cx, statsY + 44);
        });
        ctx.textAlign = 'left';
        cursorY += statsH + 14;
    } else {
        cursorY += 6;
    }

    // Squad header
    ctx.fillStyle = PALETTE.squadHeaderBg;
    roundRect(ctx, x + padX, cursorY, width - padX * 2, 30, 10);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = PALETTE.squadHeaderText;
    ctx.fillText(`\u{1F465} SQUAD (${players.length})`, x + width / 2, cursorY + 20);
    ctx.textAlign = 'left';
    cursorY += 30 + 8;

    // Player rows
    if (players.length > 0) {
        players.forEach((p, idx) => {
            const rowY = cursorY;
            if (idx % 2 === 1) {
                ctx.fillStyle = PALETTE.rowAlt;
                roundRect(ctx, x + padX, rowY, width - padX * 2, ROW_H, 6);
                ctx.fill();
            }

            const rowInnerX = x + padX + 8;
            const priceW = 92;
            const categoryW = compact ? 0 : 80;
            const nameW = width - padX * 2 - 16 - priceW - categoryW - 8;

            // Index + name
            ctx.font = '13px Arial';
            ctx.fillStyle = PALETTE.nameText;
            const displayName = `${idx + 1}. ${toCamelCase(p.name)}`;
            ctx.fillText(truncateToWidth(ctx, displayName, nameW), rowInnerX, rowY + ROW_H / 2 + 4);

            // Category badge (full cards only)
            if (!compact && p.category) {
                const badgeText = p.category;
                ctx.font = 'bold 10px Arial';
                const badgeTextW = ctx.measureText(badgeText).width;
                const badgeW = Math.min(categoryW, badgeTextW + 12);
                const badgeX = x + width - padX - priceW - 8 - badgeW;
                const badgeY = rowY + (ROW_H - 18) / 2;
                ctx.fillStyle = PALETTE.categoryBg;
                roundRect(ctx, badgeX, badgeY, badgeW, 18, 9);
                ctx.fill();
                ctx.fillStyle = PALETTE.categoryText;
                ctx.textAlign = 'center';
                ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 13);
                ctx.textAlign = 'left';
            }

            // Price badge
            const priceText = money(p.soldPrice);
            ctx.font = 'bold 12px Arial';
            const priceBadgeW = Math.max(priceW - 8, ctx.measureText(priceText).width + 14);
            const priceX = x + width - padX - priceBadgeW;
            const priceY = rowY + (ROW_H - 20) / 2;
            ctx.fillStyle = PALETTE.priceBg;
            ctx.strokeStyle = PALETTE.priceBorder;
            ctx.lineWidth = 1;
            roundRect(ctx, priceX, priceY, priceBadgeW, 20, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = PALETTE.priceText;
            ctx.textAlign = 'center';
            ctx.fillText(priceText, priceX + priceBadgeW / 2, priceY + 14);
            ctx.textAlign = 'left';

            cursorY += ROW_H + PLAYER_ROW_GAP;
        });
    } else {
        ctx.font = '13px Arial';
        ctx.fillStyle = PALETTE.emptyText;
        ctx.textAlign = 'center';
        ctx.fillText('No players yet', x + width / 2, cursorY + 30);
        ctx.textAlign = 'left';
    }

    return height;
}

const PAGE_HEADER_H = 78;

function drawPageHeader(ctx, width, tournamentName, subtitle) {
    const bannerH = PAGE_HEADER_H;
    drawGradientBanner(ctx, 0, 0, width, bannerH);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(
        truncateToWidth(ctx, `\u{1F3C6} ${(tournamentName || 'AUCTION').toUpperCase()} \u{1F3C6}`, width - 40),
        width / 2,
        38
    );
    ctx.font = '14px Arial';
    ctx.fillText(subtitle, width / 2, 62);
    ctx.textAlign = 'left';
    return bannerH;
}

function drawFooter(ctx, width, y) {
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillStyle = PALETTE.footerText;
    const dateStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    ctx.fillText(`\u{1F3CF} Auction Dugout • Generated ${dateStr}`, width / 2, y);
    ctx.textAlign = 'left';
}

function makeScaledCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width * SCALE;
    canvas.height = height * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = PALETTE.page;
    ctx.fillRect(0, 0, width, height);
    return { canvas, ctx };
}

/**
 * Build the canvas for a single team's squad card.
 */
function buildTeamCardCanvas(teamName, teamData, tournamentName) {
    const width = 640;
    const padOuter = 16;
    const cardH = teamCardHeight((teamData.players || []).length, false);
    const footerH = 34;
    const height = PAGE_HEADER_H + padOuter * 2 + cardH + footerH;

    const { canvas, ctx } = makeScaledCanvas(width, height);
    drawPageHeader(ctx, width, tournamentName, teamName);
    drawTeamCard(ctx, padOuter, PAGE_HEADER_H + padOuter, width - padOuter * 2, teamName, teamData, { compact: false });
    drawFooter(ctx, width, height - 14);

    return canvas;
}

/**
 * Build the canvas containing every team, laid out as a 2-column masonry grid
 * so it reads as one shareable "final squads" poster.
 */
function buildAllTeamsCanvas(teams, tournamentName) {
    const entries = Object.entries(teams || {});
    const outerWidth = 940;
    const padOuter = 20;
    const gap = 20;
    const columns = entries.length > 1 ? 2 : 1;
    const colWidth = (outerWidth - padOuter * 2 - gap * (columns - 1)) / columns;

    const footerH = 34;

    // Pre-compute heights and pack shortest-column-first (masonry)
    const colHeights = new Array(columns).fill(PAGE_HEADER_H + padOuter);
    const placements = entries.map(([teamName, data]) => {
        const h = teamCardHeight((data.players || []).length, true);
        let col = 0;
        for (let i = 1; i < columns; i++) {
            if (colHeights[i] < colHeights[col]) col = i;
        }
        const x = padOuter + col * (colWidth + gap);
        const y = colHeights[col];
        colHeights[col] = y + h + gap;
        return { teamName, data, x, y, h };
    });

    const contentHeight = Math.max(...colHeights) - gap + padOuter + footerH;

    const { canvas, ctx } = makeScaledCanvas(outerWidth, contentHeight);
    drawPageHeader(ctx, outerWidth, tournamentName, `ALL TEAMS • ${entries.length} teams`);
    placements.forEach(({ teamName, data, x, y }) => {
        drawTeamCard(ctx, x, y, colWidth, teamName, data, { compact: true });
    });
    drawFooter(ctx, outerWidth, contentHeight - 14);

    return canvas;
}

function canvasToBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

/**
 * Try the native share sheet (WhatsApp shows up directly on mobile) and fall
 * back to a plain PNG download when Web Share with files isn't supported.
 * @returns {Promise<'shared'|'downloaded'|'failed'>}
 */
async function shareOrDownloadCanvas(canvas, filename, shareTitle) {
    const blob = await canvasToBlob(canvas);
    if (!blob) return 'failed';

    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: shareTitle });
            return 'shared';
        } catch (err) {
            if (err?.name === 'AbortError') return 'cancelled';
            // fall through to download on any other share failure
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'downloaded';
}

const slug = (s) => (s || 'team').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();

/**
 * Export + share/download a single team's squad card as a PNG.
 */
export async function exportTeamCardImage(teamName, teamData, tournamentName) {
    const canvas = buildTeamCardCanvas(teamName, teamData, tournamentName);
    return shareOrDownloadCanvas(canvas, `${slug(teamName)}-squad.png`, `${teamName} Squad`);
}

/**
 * Export + share/download a single combined image with every team's squad.
 */
export async function exportAllTeamsImage(teams, tournamentName) {
    const canvas = buildAllTeamsCanvas(teams, tournamentName);
    return shareOrDownloadCanvas(canvas, `${slug(tournamentName)}-all-teams.png`, `${tournamentName || 'Auction'} - All Teams`);
}
