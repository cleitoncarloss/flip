const CARDS_KEY = "flip.cards.v1";

function generateId() {
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function loadCards() {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Falha ao ler cartões do localStorage:", err);
    return [];
  }
}

function saveCards(cards) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function createCard({ front, back }) {
  const cards = loadCards();
  const card = {
    id: generateId(),
    front,
    back,
    createdAt: nowIso(),
    srs: {
      repetitions: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      dueAt: nowIso(),
    },
  };
  cards.push(card);
  saveCards(cards);
  return card;
}

export function updateCard(id, changes) {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  cards[idx] = { ...cards[idx], ...changes };
  saveCards(cards);
  return cards[idx];
}

export function deleteCard(id) {
  const cards = loadCards().filter((c) => c.id !== id);
  saveCards(cards);
}

export function getDueCards(referenceDate = new Date()) {
  return loadCards().filter((c) => new Date(c.srs.dueAt) <= referenceDate);
}

export function findCardByFront(front, excludeId = null) {
  const normalized = front.trim().toLowerCase();
  return loadCards().find(
    (c) => c.id !== excludeId && c.front.trim().toLowerCase() === normalized
  );
}
