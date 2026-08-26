import { getDueCards } from "../storage.js";
import { getActiveTheme, toggleTheme } from "../theme.js";

export class FlashcardApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.view = "study";
    this.editingCard = null;
    this.modalOpen = false;
  }

  connectedCallback() {
    this.render();
    this.addEventListener("card-saved", () => {
      this.closeModal();
      this.onDataChanged();
    });
    this.addEventListener("card-deleted", () => this.onDataChanged());
    this.addEventListener("session-progress", () => this.updateDueBadge());
    this.addEventListener("edit-card", (e) => {
      this.editingCard = e.detail;
      this.modalOpen = true;
      this.render();
    });
    this.addEventListener("cancel-edit", () => this.closeModal());
    this.addEventListener("modal-close", () => this.closeModal());
  }

  closeModal() {
    if (!this.modalOpen) return;
    this.modalOpen = false;
    this.editingCard = null;
    this.render();
  }

  onDataChanged() {
    const list = this.shadowRoot.querySelector("card-list");
    if (list) list.refresh();
    this.updateDueBadge();
  }

  updateDueBadge() {
    const badge = this.shadowRoot.querySelector("[data-due-badge]");
    if (badge) badge.textContent = getDueCards().length;
  }

  setView(view) {
    this.view = view;
    this.render();
  }

  render() {
    const dueCount = getDueCards().length;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 640px;
          margin: 0 auto;
          padding: 16px;
        }
        header {
          text-align: center;
          margin-bottom: 20px;
          position: relative;
        }
        h1 {
          font-size: 1.6rem;
          margin: 0 0 4px;
          color: var(--color-primary, #4f46e5);
        }
        .theme-toggle {
          position: absolute;
          top: 0;
          right: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--color-border, #e5e7eb);
          background: var(--color-surface, #fff);
          color: var(--color-text-muted, #6b7280);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .theme-toggle:hover {
          background: var(--color-bg, #f5f6fa);
        }
        .theme-toggle svg {
          width: 20px;
          height: 20px;
        }
        nav {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          background: var(--color-surface, #fff);
          border-radius: var(--radius, 12px);
          padding: 4px;
          box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
        }
        nav button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-weight: 600;
          color: var(--color-text-muted, #6b7280);
          position: relative;
        }
        nav button.active {
          background: var(--color-primary, #4f46e5);
          color: white;
        }
        .badge {
          position: absolute;
          top: -6px;
          right: 8px;
          background: var(--color-danger, #dc2626);
          color: white;
          border-radius: 999px;
          font-size: 0.7rem;
          padding: 1px 6px;
        }
      </style>
      <header>
        <button class="theme-toggle" data-theme-toggle aria-label="Alternar tema claro/escuro">
          ${getActiveTheme() === "dark" ? ICON_SUN : ICON_MOON}
        </button>
        <h1>Flip 🔁</h1>
        <div>Flashcards para estudar inglês</div>
      </header>
      <nav>
        <button data-view="study" class="${this.view === "study" ? "active" : ""}">
          Revisar
          ${dueCount > 0 ? `<span class="badge" data-due-badge>${dueCount}</span>` : ""}
        </button>
        <button data-view="add" class="${this.view === "add" ? "active" : ""}">Adicionar</button>
        <button data-view="manage" class="${this.view === "manage" ? "active" : ""}">Meus cartões</button>
      </nav>
      <section>
        ${this.view === "study" ? "<study-session></study-session>" : ""}
        ${this.view === "add" ? "<card-form></card-form>" : ""}
        ${this.view === "manage" ? "<card-list></card-list>" : ""}
      </section>
      <app-modal ${this.modalOpen ? "open" : ""}>
        ${this.modalOpen ? "<card-form id='edit-form'></card-form>" : ""}
      </app-modal>
    `;

    this.shadowRoot.querySelectorAll("nav button").forEach((btn) => {
      btn.addEventListener("click", () => this.setView(btn.dataset.view));
    });

    this.shadowRoot.querySelector("[data-theme-toggle]").addEventListener("click", () => {
      toggleTheme();
      this.render();
    });

    if (this.modalOpen) {
      const editForm = this.shadowRoot.getElementById("edit-form");
      if (editForm) editForm.editingCard = this.editingCard;
    }
  }
}

const ICON_SUN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

const ICON_MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

customElements.define("flashcard-app", FlashcardApp);
