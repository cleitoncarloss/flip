import { createCard, updateCard } from "../storage.js";

export class CardForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._editingCard = null;
  }

  set editingCard(card) {
    this._editingCard = card;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const card = this._editingCard;

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
      </style>
      <form>
        <h2>${card ? "Editar cartão" : "Novo cartão"}</h2>
        <div>
          <label for="front">Frente (inglês)</label>
          <textarea id="front" required placeholder="ex: to give up">${escapeHtml(card?.front ?? "")}</textarea>
        </div>
        <div>
          <label for="back">Verso (tradução/significado)</label>
          <textarea id="back" required placeholder="ex: desistir">${escapeHtml(card?.back ?? "")}</textarea>
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
        this.dispatchEvent(new CustomEvent("cancel-edit"));
        this.render();
      });
    }
  }

  handleSubmit() {
    const front = this.shadowRoot.getElementById("front").value.trim();
    const back = this.shadowRoot.getElementById("back").value.trim();

    if (!front || !back) return;

    if (this._editingCard) {
      updateCard(this._editingCard.id, { front, back });
      this._editingCard = null;
    } else {
      createCard({ front, back });
    }

    this.render();
    this.dispatchEvent(new CustomEvent("card-saved", { bubbles: true, composed: true }));
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

customElements.define("card-form", CardForm);
