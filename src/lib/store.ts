import { useSyncExternalStore } from "react";
import type { Group } from "./types";
import { createSeed } from "./seed";

const KEY = "settly.v1";

type State = { groups: Group[]; activeId: string | null };

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return { groups: [], activeId: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.groups) return { groups: parsed.groups, activeId: null }; // arranca en el inicio
    }
  } catch {}
  const init: State = { groups: [createSeed()], activeId: null };
  persist(init);
  return init;
}

function persist(s: State) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

function emit() {
  persist(state);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useGroups(): Group[] {
  return useSyncExternalStore(subscribe, () => state.groups, () => state.groups);
}

export function useActiveGroup(): Group | undefined {
  return useSyncExternalStore(
    subscribe,
    () => state.groups.find((g) => g.id === state.activeId),
    () => state.groups.find((g) => g.id === state.activeId)
  );
}

export function setActiveGroup(id: string | null) {
  state = { ...state, activeId: id };
  emit();
}

export function addGroup(group: Group) {
  state = { groups: [group, ...state.groups], activeId: group.id };
  emit();
}

export function archiveGroup(id: string, value: boolean) {
  state = {
    groups: state.groups.map((g) => (g.id === id ? { ...g, archived: value } : g)),
    activeId: value && state.activeId === id ? null : state.activeId,
  };
  emit();
}

export function deleteGroup(id: string) {
  const groups = state.groups.filter((g) => g.id !== id);
  state = { groups, activeId: state.activeId === id ? null : state.activeId };
  emit();
}

export function updateGroup(id: string, fn: (g: Group) => Group) {
  state = { ...state, groups: state.groups.map((g) => (g.id === id ? fn(g) : g)) };
  emit();
}

export function resetSeed() {
  state = { groups: [createSeed()], activeId: null };
  emit();
}
