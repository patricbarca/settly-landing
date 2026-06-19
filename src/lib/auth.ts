import { useSyncExternalStore } from "react";
import { uid } from "./format";

export type User = {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  provider: "email" | "google" | "guest";
};

const KEY = "settly.user";

let user: User | null = load();
const listeners = new Set<() => void>();

function load(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as User;
  } catch {}
  return null;
}

function emit() {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useUser(): User | null {
  return useSyncExternalStore(subscribe, () => user, () => user);
}

// NOTA: autenticación local (demo). Para Google/registro reales se conecta
// Supabase Auth (OAuth) con su clave; estos métodos serían el seam.
export function signInEmail(name: string, email: string) {
  user = { id: uid(), name: name.trim() || "Yo", email: email.trim(), avatar: "🦊", provider: "email" };
  emit();
}

export function signInGoogle() {
  user = { id: uid(), name: "Usuario Google", email: "tu@gmail.com", avatar: "🦊", provider: "google" };
  emit();
}

export function signInGuest() {
  user = { id: uid(), name: "Invitado", avatar: "🦊", provider: "guest" };
  emit();
}

export function signOut() {
  user = null;
  emit();
}
