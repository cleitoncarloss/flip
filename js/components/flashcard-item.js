import { speak, isSpeechSupported } from "../speech.js";

export class FlashcardItem extends HTMLElement {
  static get observedAttributes() {
    return ["flipped"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._card = null;
  }

  set card(value) {
    this._card = value;
    this.render();
  }

  get card() {
    return this._card;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  flip() {
    if (this.hasAttribute("flipped")) {
      this.removeAttribute("flipped");
    } else {
      this.setAttribute("flipped", "");
    }
  }

  render() {
    if (!this._card) return;
    const { front, back, example } = this._card;
    const flipped = this.hasAttribute("flipped");
    const audioSupported = isSpeechSupported();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          perspective: 1200px;
        }
        .card {
          position: relative;
          width: 100%;
          min-height: 220px;
          transform-style: preserve-3d;
          transition: transform 0.5s;
          cursor: pointer;
        }
        :host([flipped]) .card {
          transform: rotateY(180deg);
        }
        .face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          background: var(--color-surface, #fff);
          border-radius: var(--radius, 12px);
          box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          gap: 12px;
        }
        .face.back {
          transform: rotateY(180deg);
        }
        .text {
          font-size: 1.4rem;
          font-weight: 600;
        }
        .example {
          font-size: 0.95rem;
          color: var(--color-text-muted, #6b7280);
          font-style: italic;
        }
        .audio-btn {
          background: none;
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .audio-btn:hover {
          background: var(--color-bg, #f5f6fa);
        }
        .hint {
          position: absolute;
          bottom: 10px;
          font-size: 0.75rem;
          color: var(--color-text-muted, #6b7280);
        }
      </style>
      <div class="card" part="card">
        <div class="face front">
          ${audioSupported ? `<button class="audio-btn" data-audio aria-label="Ouvir pronúncia">🔊</button>` : ""}
          <div class="text">${escapeHtml(front)}</div>
          <div class="hint">Toque para virar</div>
        </div>
        <div class="face back">
          <div class="text">${escapeHtml(back)}</div>
          ${example ? `<div class="example">${escapeHtml(example)}</div>` : ""}
          <div class="hint">Toque para voltar</div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector(".card").addEventListener("click", () => {
      this.flip();
    });

    const audioBtn = this.shadowRoot.querySelector("[data-audio]");
    if (audioBtn) {
      audioBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        speak(front);
      });
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

customElements.define("flashcard-item", FlashcardItem);
