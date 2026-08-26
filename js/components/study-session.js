import { getDueCards, updateCard } from "../storage.js";
import { nextReview, RATING } from "../spaced-repetition.js";

const REQUEUE_OFFSET = 3;

export class StudySession extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.queue = [];
    this.currentIndex = 0;
  }

  connectedCallback() {
    this.startSession();
  }

  startSession() {
    this.queue = getDueCards();
    this.currentIndex = 0;
    this.render();
  }

  get currentCard() {
    return this.queue[this.currentIndex];
  }

  rate(rating) {
    const card = this.currentCard;
    if (!card) return;
    const srs = nextReview(card.srs, rating);
    updateCard(card.id, { srs });

    const hasOtherCardsToInterleave = this.currentIndex + 1 < this.queue.length;
    if (rating === RATING.DIFFICULT && hasOtherCardsToInterleave) {
      const insertAt = Math.min(this.currentIndex + REQUEUE_OFFSET, this.queue.length);
      this.queue.splice(insertAt, 0, { ...card, srs });
    }

    this.currentIndex += 1;
    this.render();
    this.dispatchEvent(new CustomEvent("session-progress", { bubbles: true, composed: true }));
  }

  render() {
    const card = this.currentCard;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .status {
          text-align: center;
          color: var(--color-text-muted, #6b7280);
          margin-bottom: 12px;
          font-size: 0.9rem;
        }
        .done {
          text-align: center;
          padding: 48px 16px;
          color: var(--color-text-muted, #6b7280);
        }
        .rating-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 16px;
          visibility: hidden;
        }
        .rating-buttons.visible {
          visibility: visible;
        }
        button {
          padding: 12px 8px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          font-size: 0.85rem;
          line-height: 1.5;
        }
        button small {
          font-weight: 400;
          font-size: 0.7rem;
          opacity: 0.85;
        }
        .difficult { background: var(--color-danger-bg, #fee2e2); color: var(--color-danger, #dc2626); }
        .medium { background: var(--color-warning-bg, #fef3c7); color: var(--color-warning, #d97706); }
        .easy { background: var(--color-success-bg, #dcfce7); color: var(--color-success, #16a34a); }
      </style>
      ${
        card
          ? `
        <div class="status">${remainingLabel(this.queue.length - this.currentIndex)}</div>
        <flashcard-item id="item"></flashcard-item>
        <div class="rating-buttons">
          <button class="difficult" data-rating="${RATING.DIFFICULT}">Difícil<br><small>Não lembrou</small></button>
          <button class="medium" data-rating="${RATING.MEDIUM}">Médio<br><small>Lembrou com dificuldade</small></button>
          <button class="easy" data-rating="${RATING.EASY}">Fácil<br><small>Lembrou sem esforço</small></button>
        </div>
      `
          : `<div class="done">🎉 Nenhum cartão pendente para revisão agora.</div>`
      }
    `;

    if (card) {
      const item = this.shadowRoot.getElementById("item");
      item.card = card;
      const ratingButtons = this.shadowRoot.querySelector(".rating-buttons");
      item.addEventListener("flip-change", (e) => {
        ratingButtons.classList.toggle("visible", e.detail.flipped);
      });
      this.shadowRoot.querySelectorAll("[data-rating]").forEach((btn) => {
        btn.addEventListener("click", () => this.rate(Number(btn.dataset.rating)));
      });
    }
  }
}

function remainingLabel(count) {
  return count === 1 ? "Falta 1 cartão" : `Faltam ${count} cartões`;
}

customElements.define("study-session", StudySession);
