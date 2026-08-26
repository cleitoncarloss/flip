import { loadCards, deleteCard } from "../storage.js";
import { speak, isSpeechSupported } from "../speech.js";

export class CardList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  refresh() {
    this.render();
  }

  render() {
    const cards = loadCards();
    const audioSupported = isSpeechSupported();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .empty {
          text-align: center;
          color: var(--color-text-muted, #6b7280);
          padding: 32px 16px;
        }
        ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        li {
          background: var(--color-surface, #fff);
          border-radius: var(--radius, 12px);
          box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .info {
          flex: 1;
          min-width: 0;
        }
        .front {
          font-weight: 600;
        }
        .back {
          color: var(--color-text-muted, #6b7280);
          font-size: 0.9rem;
        }
        .tags {
          font-size: 0.75rem;
          color: var(--color-primary, #4f46e5);
        }
        .actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        button {
          border: 1px solid var(--color-border, #e5e7eb);
          background: none;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 0.95rem;
        }
        button.danger {
          color: var(--color-danger, #dc2626);
        }
      </style>
      ${
        cards.length === 0
          ? `<div class="empty">Nenhum cartão ainda. Adicione o primeiro acima.</div>`
          : `<ul>${cards.map((c) => cardRow(c, audioSupported)).join("")}</ul>`
      }
    `;

    this.shadowRoot.querySelectorAll("[data-audio]").forEach((btn) => {
      btn.addEventListener("click", () => speak(btn.dataset.audio));
    });

    this.shadowRoot.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = cards.find((c) => c.id === btn.dataset.edit);
        this.dispatchEvent(
          new CustomEvent("edit-card", { detail: card, bubbles: true, composed: true })
        );
      });
    });

    this.shadowRoot.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("Excluir este cartão?")) {
          deleteCard(btn.dataset.delete);
          this.render();
          this.dispatchEvent(new CustomEvent("card-deleted", { bubbles: true, composed: true }));
        }
      });
    });
  }
}

function cardRow(card, audioSupported) {
  return `
    <li>
      <div class="info">
        <div class="front">${escapeHtml(card.front)}</div>
        <div class="back">${escapeHtml(card.back)}</div>
        ${card.tags?.length ? `<div class="tags">${card.tags.map(escapeHtml).join(" · ")}</div>` : ""}
      </div>
      <div class="actions">
        ${audioSupported ? `<button data-audio="${escapeAttr(card.front)}" aria-label="Ouvir">🔊</button>` : ""}
        <button data-edit="${card.id}" aria-label="Editar">✏️</button>
        <button class="danger" data-delete="${card.id}" aria-label="Excluir">🗑️</button>
      </div>
    </li>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

customElements.define("card-list", CardList);
