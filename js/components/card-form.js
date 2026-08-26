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
        input, textarea {
          font-size: 1rem;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #e5e7eb);
          font-family: inherit;
        }
        textarea {
          resize: vertical;
          min-height: 60px;
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
          <input id="front" required value="${escapeAttr(card?.front ?? "")}" placeholder="ex: to give up" />
        </div>
        <div>
          <label for="back">Verso (tradução/significado)</label>
          <input id="back" required value="${escapeAttr(card?.back ?? "")}" placeholder="ex: desistir" />
        </div>
        <div>
          <label for="example">Exemplo (opcional)</label>
          <textarea id="example" placeholder="ex: Don't give up on your dreams.">${card?.example ?? ""}</textarea>
        </div>
        <div>
          <label for="tags">Tags (separadas por vírgula, opcional)</label>
          <input id="tags" value="${escapeAttr((card?.tags ?? []).join(", "))}" placeholder="ex: phrasal verbs, verbos" />
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
    const example = this.shadowRoot.getElementById("example").value.trim();
    const tagsRaw = this.shadowRoot.getElementById("tags").value.trim();
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    if (!front || !back) return;

    if (this._editingCard) {
      updateCard(this._editingCard.id, { front, back, example, tags });
      this._editingCard = null;
    } else {
      createCard({ front, back, example, tags });
    }

    this.render();
    this.dispatchEvent(new CustomEvent("card-saved", { bubbles: true, composed: true }));
  }
}

function escapeAttr(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML.replace(/"/g, "&quot;");
}

customElements.define("card-form", CardForm);
