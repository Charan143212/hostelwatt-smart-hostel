import { useSyncExternalStore } from "react";
import type { Session } from "./demo-auth";
import { clearReportAccess, setReportAccess } from './report-access';

/** Demo session persistence (non-sensitive fields only) in localStorage. */
const KEY = "hostelwatt.demo-session";

export type AuthTab = "student" | "admin";
type State = { session: Session | null; hydrated: boolean; modalOpen: boolean; modalTab: AuthTab };
let state: State = { session: null, hydrated: false, modalOpen: false, modalTab: "student" };
const listeners = new Set<() => void>();
const serverState: State = { session: null, hydrated: false, modalOpen: false, modalTab: "student" };

function emit(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function hydrate() {
  if (state.hydrated || typeof window === "undefined") return;
  let session: Session | null = null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) session = JSON.parse(raw) as Session;
  } catch {
    session = null;
  }
  state = { ...state, session, hydrated: true };
}

export function useAuthState() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      if (!state.hydrated) {
        hydrate();
        queueMicrotask(() => listeners.forEach((fn) => fn()));
      }
      return () => listeners.delete(l);
    },
    () => state,
    () => serverState,
  );
}

export function signIn(session: Session, reportPassword?: string) {
  setReportAccess(session, reportPassword);
  window.localStorage.setItem(KEY, JSON.stringify(session));
  emit({ session, hydrated: true, modalOpen: false });
}

export function signOut() {
  clearReportAccess();
  window.localStorage.removeItem(KEY);
  emit({ session: null });
}

export function setAuthModalOpen(modalOpen: boolean, modalTab?: AuthTab) {
  emit(modalTab ? { modalOpen, modalTab } : { modalOpen });
}

export function setAuthModalTab(modalTab: AuthTab) {
  emit({ modalTab });
}
