import { createCard, updateCard, findCardByFront } from "../storage.js";

export class CardForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._editingCard = null;
    this._error = "";
    this._draft = null;
  }

  set editingCard(card) {
    this._editingCard = card;
    this._error = "";
    this._draft = null;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const card = this._editingCard;
    const front = this._draft?.front ?? card?.front ?? "";
    const back = this._draft?.back ?? card?.back ?? "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: var(--color-surface, #fff);
          border-radius: var(--radius, 12px);
          box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
          padding: 20px;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-muted, #6b7280);
        }
        textarea {
          font-size: 1rem;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #e5e7eb);
          font-family: inherit;
          resize: vertical;
          min-height: 70px;
        }
        .actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        button {
          padding: 10px 18px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
        }
        .primary {
          background: var(--color-primary, #4f46e5);
          color: white;
        }
        .secondary {
          background: transparent;
          color: var(--color-text-muted, #6b7280);
        }
        h2 {
          margin: 0 0 4px;
          font-size: 1.1rem;
        }
        .error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fee2e2;
          color: var(--color-danger, #dc2626);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .error svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
      </style>
      <form>
        <h2>${card ? "Editar cartão" : "Novo cartão"}</h2>
        ${this._error ? `<div class="error">${ICON_ALERT}<span>${escapeHtml(this._error)}</span></div>` : ""}
        <div class="field">
          <label for="front">Frente (inglês)</label>
          <textarea id="front" required placeholder="ex: to give up">${escapeHtml(front)}</textarea>
        </div>
        <div class="field">
          <label for="back">Verso (tradução/significado)</label>
          <textarea id="back" required placeholder="ex: desistir">${escapeHtml(back)}</textarea>
        </div>
        <div class="actions">
          ${card ? `<button type="button" class="secondary" data-cancel>Cancelar</button>` : ""}
          <button type="submit" class="primary">${card ? "Salvar" : "Adicionar"}</button>
        </div>
      </form>
    `;

    const form = this.shadowRoot.querySelector("form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    const cancelBtn = this.shadowRoot.querySelector("[data-cancel]");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this._editingCard = null;
        this._error = "";
        this._draft = null;
        this.dispatchEvent(new CustomEvent("cancel-edit", { bubbles: true, composed: true }));
        this.render();
      });
    }
  }

  handleSubmit() {
    const front = this.shadowRoot.getElementById("front").value.trim();
    const back = this.shadowRoot.getElementById("back").value.trim();

    if (!front || !back) return;

    const duplicate = findCardByFront(front, this._editingCard?.id ?? null);
    if (duplicate) {
      this._error = "Já existe um cartão com essa frente.";
      this._draft = { front, back };
      this.render();
      return;
    }

    if (this._editingCard) {
      updateCard(this._editingCard.id, { front, back });
      this._editingCard = null;
    } else {
      createCard({ front, back });
    }

    this._error = "";
    this._draft = null;
    this.render();
    this.dispatchEvent(new CustomEvent("card-saved", { bubbles: true, composed: true }));
  }
}

const ICON_ALERT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

customElements.define("card-form", CardForm);
