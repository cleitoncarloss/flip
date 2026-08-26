export class AppModal extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
    if (this.hasAttribute("open")) {
      document.addEventListener("keydown", this._onKeydown);
    } else {
      document.removeEventListener("keydown", this._onKeydown);
    }
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeydown);
  }

  open() {
    this.setAttribute("open", "");
  }

  close() {
    this.removeAttribute("open");
    this.dispatchEvent(new CustomEvent("modal-close", { bubbles: true, composed: true }));
  }

  _onKeydown(e) {
    if (e.key === "Escape") this.close();
  }

  render() {
    const isOpen = this.hasAttribute("open");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: ${isOpen ? "block" : "none"};
        }
        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
        }
        .panel {
          background: var(--color-surface, #fff);
          border-radius: var(--radius, 12px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        .close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted, #6b7280);
          cursor: pointer;
        }
        .close-btn:hover {
          background: var(--color-bg, #f5f6fa);
        }
        .close-btn svg {
          width: 18px;
          height: 18px;
        }
      </style>
      <div class="backdrop" part="backdrop">
        <div class="panel" part="panel" role="dialog" aria-modal="true">
          <button class="close-btn" data-close aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <slot></slot>
        </div>
      </div>
    `;

    const backdrop = this.shadowRoot.querySelector(".backdrop");
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) this.close();
    });

    this.shadowRoot.querySelector("[data-close]").addEventListener("click", () => this.close());
  }
}

customElements.define("app-modal", AppModal);
