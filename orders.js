// Istorik kòmand yo sove sou aparèy kliyan an sèlman (localStorage).
const KEY = "aswer-orders";
const ID_KEY = "aswer-player-id";

export function loadOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveOrder(order) {
  const list = [order, ...loadOrders()].slice(0, 50);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  return list;
}

// Nimewo kòmand kout pou sipò a ka jwenn li fasil (egzanp "AS-7K2F9Q")
export function newOrderId() {
  return `AS-${Date.now().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
}

export function loadPlayerId() {
  try { return localStorage.getItem(ID_KEY) || ""; } catch { return ""; }
}

export function savePlayerId(id) {
  try { localStorage.setItem(ID_KEY, id); } catch {}
}

export function orderMessage(order) {
  const lines = [
    `Nouvo kòmand Aswer Top Up (${order.id})`,
    `Pwodwi: ${order.product}`,
    `Pake: ${order.package}`,
    `Pri: ${order.priceText}`,
  ];
  if (order.playerId) lines.push(`Player ID: ${order.playerId}`);
  lines.push(`Peman: ${order.payment}`);
  return lines.join("\n");
}
