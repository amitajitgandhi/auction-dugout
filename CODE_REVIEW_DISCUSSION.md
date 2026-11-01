# Auction Dugout review discussion

Last updated: 2026-11-01 (Asia/Kolkata).
Reviewed application commit: `a987e5f824921779815b42436fc5f00dec0fbdfe`.

## Working agreement

Discuss one issue at a time. Record verified behavior, corrections, remaining risks and explicit decisions here so future reviews can resume from evidence. Application code changes are not authorized by this discussion. This commit changes documentation only.

## Issue 1: Duplicate player names

Status: Closed for the current workflow — CSV prevention verified; residual risk accepted by the user. No application changes requested or implemented.

### User clarification and verified behavior

The user explained that player CSV uploads reject duplicate names before downloading or uploading images.

Confirmed in `src/utils/csvUtils.js`, function `validatePlayerCSV`: names are normalized by removing U+200B through U+200D, U+FEFF and U+FFFD, trimming, collapsing whitespace and lowercasing. Duplicate normalized names cause an exception with the affected CSV row numbers.

`src/components/FileUpload.js` invokes this validation before session lookup and the per-player backend requests. A duplicate rejection therefore prevents this upload flow from reaching photo processing or player database writes.

Isolated tests of the production validation function confirmed:

| Input names | Result |
| --- | --- |
| Rahul / Rahul | Rejected |
| Rahul / ` rahul ` | Rejected |
| Rahul Shah / Rahul with two spaces before Shah | Rejected |
| Rahul / Rahul containing U+200B | Rejected |
| Rahul / Aman | Accepted |

The initial review overlooked this existing protection. Its implication that duplicate CSV names would reach normal upload processing was too broad and is corrected here. The defensive transfer/price-edit test used duplicate records directly; it did not demonstrate that the validated CSV flow creates them.

### Remaining scope

Fresh CSV imports through this validated path are protected. This does not establish that every later state always has unique names:

- Player Summary edits (`MasterPlayersPage.saveEdit` and `App.onUpdatePlayer`) can rename a player without checking for an existing normalized name.
- Existing cloud snapshots with duplicates are not validated by this CSV function during startup restore.
- `processPlayerTransfer` and `updatePlayerPriceInTeam` in `src/utils/centralizedTeamData.js` match by ID OR name. With duplicate names and different IDs, the wrong roster entry can be selected. Business-logic transfer/edit updates also match by ID OR name.
- The public viewer resolves the current player by name in `src/utils/viewerPayload.js`.

These are conditional remaining risks, not evidence that the user's current data contains duplicates. No live database was queried.

### Review recommendation and user decision

Preserve CSV rejection. Consider enforcing normalized-name uniqueness when renaming players and using ID-first matching for roster edits/transfers (name fallback only when an ID is unavailable). These remain optional defensive improvements, not agreed work.

User decision (2026-11-01): Player Summary edits are very rare, and CSV upload validation is sufficient for the current operating workflow. Close this review item without code changes. Retain the conditional risks above as accepted residual risk; do not describe every entry/edit/restore path as technically protected. Reopen only if the workflow changes or duplicate data is observed.

## Continuation

Issue 1 is closed by user decision. Continue with one remaining review issue at a time; the recommended next topic is overlapping saves and stale snapshots. Do not treat this document as authorization to implement fixes or as a guarantee about deployed behavior. Re-read the relevant current source before acting.
