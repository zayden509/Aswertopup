// Konvèsyon pou pwodwi Finans yo (Meru, PayPal, Cash App…): kliyan an chwazi konbyen li
// vle resevwa, nou ajoute frè palye a, epi nou miltipliye pa to du jou a.
// Menm kalkil sa a nan firebase/firestore.rules (validNewExchangeOrder): pa chanje youn san lòt.

// Palye a: premye palye kote montan an <= max. Pi wo pase dènye palye a, dènye a aplike.
export function tierIndex(tiers, amount) {
  const i = tiers.findIndex((t) => amount <= t.max);
  return i === -1 ? tiers.length - 1 : i;
}

// Pri total an goud pou `amount` inite (frè a deja ladan l)
export function quote(config, amount) {
  const tier = tierIndex(config.tiers, amount);
  const fee = config.tiers[tier].fee;
  return { amount, tier, fee, price: Math.ceil((amount + fee) * config.rate) };
}

// Pi gwo montan kliyan an ka resevwa ak `budget` goud (0 si li pa ase pou minimòm lan)
export function amountForBudget(config, budget) {
  let amount = Math.min(config.max, Math.floor(budget / config.rate));
  while (amount >= config.min && quote(config, amount).price > budget) amount--;
  return amount >= config.min ? amount : 0;
}

// "1 – 9", "9 – 19", … jan tablo frè a montre yo
export function tierRanges(config) {
  return config.tiers.map((t, i) => ({ from: i === 0 ? config.min : config.tiers[i - 1].max, to: t.max, fee: t.fee }));
}

// Tablo frè Meru (dizitopup), sèvi kòm valè pa defo pou tout pwodwi Finans yo
export const DEFAULT_TIERS = [
  { max: 9, fee: 1 },
  { max: 19, fee: 2 },
  { max: 49, fee: 3 },
  { max: 99, fee: 4 },
  { max: 199, fee: 6 },
  { max: 399, fee: 12 },
  { max: 499, fee: 15 },
  { max: 699, fee: 20 },
  { max: 799, fee: 25 },
  { max: 899, fee: 35 },
  { max: 1000, fee: 50 },
];
