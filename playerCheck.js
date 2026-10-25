// Mande sèvè a si ID jwè a egziste (FazerCards), ak non jwè a pou kliyan an wè l anvan l peye.
// Retounen null si verifikasyon an pa disponib: paj la pa bloke kliyan an pou sa.
export async function checkPlayerId(product, playerId, signal) {
  try {
    const res = await fetch("/api/player-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, playerId }),
      signal,
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
