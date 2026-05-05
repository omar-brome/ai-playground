import { isMuted } from "./GameSettings";

/**
 * Uses the browser's speech synthesis (offline, varies by system voice).
 * Skipped when sound is muted to match SFX behavior.
 */
export function speakPhrase(text) {
  if (typeof window === "undefined" || !text) {
    return;
  }
  if (isMuted()) {
    return;
  }
  const synth = window.speechSynthesis;
  if (!synth) {
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05;
  u.volume = 0.92;
  u.lang = "en-US";
  synth.speak(u);
}

export function speakAfterDelay(text, ms) {
  if (typeof window === "undefined") {
    return;
  }
  window.setTimeout(() => speakPhrase(text), ms);
}
