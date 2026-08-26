const RATE_KEY = "flip.speechRate.v1";
const DEFAULT_RATE = 0.95;

export const SPEECH_RATES = [
  { value: 0.7, label: "Lento" },
  { value: 0.95, label: "Normal" },
  { value: 1.3, label: "Rápido" },
];

export function isSpeechSupported() {
  return "speechSynthesis" in window;
}

export function getSpeechRate() {
  const stored = Number(localStorage.getItem(RATE_KEY));
  const isValidPreset = SPEECH_RATES.some((r) => r.value === stored);
  return isValidPreset ? stored : DEFAULT_RATE;
}

export function setSpeechRate(rate) {
  localStorage.setItem(RATE_KEY, String(rate));
}

export function cycleSpeechRate() {
  const current = getSpeechRate();
  const currentIndex = SPEECH_RATES.findIndex((r) => r.value === current);
  const next = SPEECH_RATES[(currentIndex + 1) % SPEECH_RATES.length];
  setSpeechRate(next.value);
  return next;
}

export function speak(text, lang = "en-US") {
  if (!isSpeechSupported() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = getSpeechRate();
  window.speechSynthesis.speak(utterance);
}
