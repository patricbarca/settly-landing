import { useRef, useState } from "react";

/** Dictado por voz con la Web Speech API del navegador (gratis, sin claves). */
export function useSpeech(onText: (t: string) => void) {
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const SR =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
  const supported = !!SR;

  function toggle() {
    if (!supported) return;
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {}
      return;
    }
    try {
      const rec = new SR();
      rec.lang = "es-ES";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e: any) => {
        const txt = Array.from(e.results)
          .map((r: any) => r[0].transcript)
          .join(" ");
        onText(txt);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
    }
  }

  return { listening, supported, toggle };
}
