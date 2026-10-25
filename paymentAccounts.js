// Nimewo MonCash/NatCash boutik la pa defo (pwopriyetè a ka chanje yo nan Panneau admin → Paramèt).
// Fichye sa a pa gen foto: sèvè a (api/) ka itilize l tou.
export const DEFAULT_ACCOUNTS = {
  moncash: { number: "34431664", name: "Awens Kelly Alexandre" },
  natcash: { number: "43699262", name: "Awens Kelly Alexandre" },
};

// Nimewo chak mòd peman: sa ki nan Paramèt (settings/payments), sinon nimewo pa defo a
export const accountNumbers = (settings) =>
  Object.fromEntries(Object.entries(DEFAULT_ACCOUNTS).map(([id, account]) => [id, settings?.[id]?.number || account.number]));
