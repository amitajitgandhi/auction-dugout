function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sellByCurrentPlayer(players, currentPlayer, teamName, bidAmount) {
  return players.map((p) =>
    currentPlayer && currentPlayer.id !== undefined && currentPlayer.id !== null
      ? (p.id === currentPlayer.id
          ? { ...p, sold: true, soldTo: teamName, soldPrice: bidAmount }
          : p)
      : (p.name === currentPlayer.name
          ? { ...p, sold: true, soldTo: teamName, soldPrice: bidAmount }
          : p)
  );
}

function markUnsoldByCurrentPlayer(players, currentPlayer) {
  return players.map((p) =>
    currentPlayer && currentPlayer.id !== undefined && currentPlayer.id !== null
      ? (p.id === currentPlayer.id
          ? { ...p, sold: false, soldTo: "Unsold", soldPrice: 0, wasUnsold: true }
          : p)
      : (p.name === currentPlayer.name
          ? { ...p, sold: false, soldTo: "Unsold", soldPrice: 0, wasUnsold: true }
          : p)
  );
}

function sellUnsoldLater(players, playerObj, teamName, bidAmount) {
  return players.map((p) =>
    p.id === playerObj.id
      ? { ...p, sold: true, soldTo: teamName, soldPrice: bidAmount, wasUnsold: true }
      : p
  );
}

function setBooster(baseInitial, spent, boosterCount, pointsPerBooster) {
  const initialPurse = baseInitial + boosterCount * pointsPerBooster;
  const purse = initialPurse - spent;
  return { initialPurse, purse };
}

function pickNextPlayerByQueue(players, selectedCategory, queue) {
  for (const key of queue) {
    const player =
      typeof key === "string" && key.startsWith("name:")
        ? players.find((p) => p.name === key.slice(5) && p.category === selectedCategory)
        : players.find((p) => p.id === key);

    if (!player) continue;
    if (player.sold && player.soldTo !== "Unsold") continue;
    if (player.soldTo === "Unsold") continue;
    return player;
  }
  return null;
}

function run() {
  const players = [
    { id: 101, name: "Rahul", category: "OPEN", sold: false, soldTo: null, soldPrice: null },
    { id: 102, name: "Rahul", category: "OPEN", sold: false, soldTo: null, soldPrice: null },
    { id: 103, name: "Aman", category: "OPEN", sold: false, soldTo: null, soldPrice: null },
  ];

  // 1) Duplicate-name safety: selling id=102 must not touch id=101
  let state = sellByCurrentPlayer(players, { id: 102, name: "Rahul" }, "Team A", 500);
  assert(state.find((p) => p.id === 102).soldTo === "Team A", "id=102 should be sold to Team A");
  assert(state.find((p) => p.id === 101).soldTo === null, "id=101 should remain unsold");

  // 2) Mark unsold on id=101 only
  state = markUnsoldByCurrentPlayer(state, { id: 101, name: "Rahul" });
  assert(state.find((p) => p.id === 101).soldTo === "Unsold", "id=101 should be unsold");
  assert(state.find((p) => p.id === 101).wasUnsold === true, "id=101 should set wasUnsold");
  assert(state.find((p) => p.id === 102).soldTo === "Team A", "id=102 should stay sold");

  // 3) Sell unsold later for id=101
  state = sellUnsoldLater(state, { id: 101 }, "Team B", 350);
  assert(state.find((p) => p.id === 101).sold === true, "id=101 should be sold after later sale");
  assert(state.find((p) => p.id === 101).soldTo === "Team B", "id=101 should move to Team B");
  assert(state.find((p) => p.id === 101).wasUnsold === true, "id=101 wasUnsold should stay true");

  // 4) Restore-style pickNext should skip sold/unsold and pick remaining
  const queue = [101, 102, 103];
  const next = pickNextPlayerByQueue(state, "OPEN", queue);
  assert(next && next.id === 103, "restore pickNext should return id=103");

  const soldCount = state.filter((p) => p.sold && p.soldTo !== "Unsold").length;
  const unsoldCount = state.filter((p) => p.soldTo === "Unsold").length;
  const remainingCount = state.filter((p) => !p.sold && p.soldTo !== "Unsold").length;
  assert(soldCount === 2, "soldCount should be 2");
  assert(unsoldCount === 0, "unsoldCount should be 0");
  assert(remainingCount === 1, "remainingCount should be 1");

  // 5) Booster set semantics (absolute count, not additive)
  const base = 1000;
  const spent = 0;
  const v1 = setBooster(base, spent, 1, 10);
  assert(v1.initialPurse === 1010, "1 booster should make total 1010");
  const v2 = setBooster(base, spent, 2, 10);
  assert(v2.initialPurse === 1020, "2 boosters should make total 1020 (not 1030)");

  console.log("PASS: sync simulation checks passed");
}

try {
  run();
} catch (err) {
  console.error("FAIL:", err.message);
  process.exit(1);
}
