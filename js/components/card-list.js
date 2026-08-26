import { loadCards, deleteCard } from "../storage.js";
import { speak, isSpeechSupported } from "../speech.js";

const PAGE_SIZE = 10;

const FILTERS = [
  { key: "today", label: "Pronto para revisar" },
  { key: "tomorrow", label: "Revisar amanhã" },
  { key: "later", label: "Em breve" },
];

export class CardList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.page = 1;
    this.filter = null;
    this.search = "";
    this._searchHadFocus = false;
    this._searchCaret = 0;
  }

  connectedCallback() {
    this.render();
  }

  refresh() {
    this.page = 1;
    this.render();
  }

  goToPage(page) {
    this.page = page;
    this.render();
  }

  setFilter(key) {
    this.filter = this.filter === key ? null : key;
    this.page = 1;
    this.render();
  }

  setSearch(value) {
    const input = this.shadowRoot.querySelector("[data-search]");
    this._searchHadFocus = true;
    this._searchCaret = input ? input.selectionStart : value.length;
    this.search = value;
    this.page = 1;
    this.render();
  }

  render() {
    const allCards = loadCards();
    const audioSupported = isSpeechSupported();
    const query = this.search.trim().toLowerCase();
    let cards = this.filter ? allCards.filter((c) => dueGroup(c.srs.dueAt) === this.filter) : allCards;
    if (query) {
      cards = cards.filter((c) => c.front.toLowerCase().includes(query));
    }
    const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
    this.page = Math.min(this.page, totalPages);
    const start = (this.page - 1) * PAGE_SIZE;
    const pageCards = cards.slice(start, start + PAGE_SIZE);

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
        .search {
          position: relative;
          margin-bottom: 16px;
        }
        .search svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: var(--color-text-muted, #6b7280);
          pointer-events: none;
        }
        .search input {
          width: 100%;
          font-size: 1rem;
          padding: 10px 12px 10px 38px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #e5e7eb);
          font-family: inherit;
          background: var(--color-surface, #fff);
          color: var(--color-text, #1f2330);
        }
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .filter-tag {
          border: 1px solid var(--color-border, #e5e7eb);
          background: var(--color-surface, #fff);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-muted, #6b7280);
        }
        .filter-tag:hover {
          background: var(--color-bg, #f5f6fa);
        }
        .filter-tag.active {
          background: var(--color-primary, #4f46e5);
          border-color: var(--color-primary, #4f46e5);
          color: white;
        }
        .filter-tag .count {
          opacity: 0.75;
          margin-left: 4px;
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
          padding: 8px;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted, #6b7280);
        }
        button svg {
          width: 18px;
          height: 18px;
        }
        button:hover {
          background: var(--color-bg, #f5f6fa);
        }
        button.danger {
          color: var(--color-danger, #dc2626);
        }
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
        }
        .pagination button {
          width: auto;
          padding: 8px 14px;
          font-weight: 600;
        }
        .pagination button:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .pagination .info {
          flex: none;
          font-size: 0.85rem;
          color: var(--color-text-muted, #6b7280);
        }
      </style>
      ${
        allCards.length === 0
          ? `<div class="empty">Nenhum cartão ainda. Adicione o primeiro acima.</div>`
          : `
            <div class="search">
              ${ICON_SEARCH}
              <input type="search" data-search placeholder="Buscar pela frente do cartão..." value="${escapeAttr(this.search)}" />
            </div>
            <div class="filters">
              ${FILTERS.map((f) => filterTag(f, allCards, this.filter)).join("")}
            </div>
            ${
              cards.length === 0
                ? `<div class="empty">Nenhum cartão encontrado.</div>`
                : `
                  <ul>${pageCards.map((c) => cardRow(c, audioSupported)).join("")}</ul>
                  ${
                    totalPages > 1
                      ? `
                    <div class="pagination">
                      <button data-prev ${this.page === 1 ? "disabled" : ""} aria-label="Página anterior">${ICON_CHEVRON_LEFT}</button>
                      <span class="info">Página ${this.page} de ${totalPages}</span>
                      <button data-next ${this.page === totalPages ? "disabled" : ""} aria-label="Próxima página">${ICON_CHEVRON_RIGHT}</button>
                    </div>
                  `
                      : ""
                  }
                `
            }
          `
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

    const prevBtn = this.shadowRoot.querySelector("[data-prev]");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.goToPage(this.page - 1));
    }

    const nextBtn = this.shadowRoot.querySelector("[data-next]");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.goToPage(this.page + 1));
    }

    this.shadowRoot.querySelectorAll("[data-filter]").forEach((tag) => {
      tag.addEventListener("click", () => this.setFilter(tag.dataset.filter));
    });

    const searchInput = this.shadowRoot.querySelector("[data-search]");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.setSearch(searchInput.value));
      if (this._searchHadFocus) {
        this._searchHadFocus = false;
        searchInput.focus();
        searchInput.setSelectionRange(this._searchCaret, this._searchCaret);
      }
    }
  }
}

function cardRow(card, audioSupported) {
  return `
    <li>
      <div class="info">
        <div class="front">${escapeHtml(card.front)}</div>
        <div class="back">${escapeHtml(card.back)}</div>
      </div>
      <div class="actions">
        ${audioSupported ? `<button data-audio="${escapeAttr(card.front)}" aria-label="Ouvir">${ICON_VOLUME}</button>` : ""}
        <button data-edit="${card.id}" aria-label="Editar">${ICON_EDIT}</button>
        <button class="danger" data-delete="${card.id}" aria-label="Excluir">${ICON_TRASH}</button>
      </div>
    </li>
  `;
}

const ICON_VOLUME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;

const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>`;

const ICON_TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;

const ICON_CHEVRON_LEFT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;

const ICON_CHEVRON_RIGHT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

const ICON_SEARCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

function dueGroup(dueAt) {
  const due = new Date(dueAt);
  const now = new Date();

  if (due <= now) return "today";

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const daysUntil = Math.round((startOfDue - startOfToday) / (1000 * 60 * 60 * 24));

  return daysUntil === 1 ? "tomorrow" : "later";
}

function filterTag(filter, allCards, activeFilter) {
  const count = allCards.filter((c) => dueGroup(c.srs.dueAt) === filter.key).length;
  const isActive = activeFilter === filter.key;
  return `
    <button class="filter-tag ${isActive ? "active" : ""}" data-filter="${filter.key}">
      ${filter.label}<span class="count">${count}</span>
    </button>
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
