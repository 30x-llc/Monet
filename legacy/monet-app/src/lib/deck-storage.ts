"use client";

import type { Deck } from "./slide-types";

/**
 * Deck storage layer — localStorage-backed.
 * Format: { id, deck, createdAt, updatedAt }
 */

const STORAGE_KEY = "30x-design:decks";

export interface StoredDeck {
    id: string;
    deck: Deck;
    createdAt: string;
    updatedAt: string;
    starred?: boolean;
}

function nano(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readAll(): StoredDeck[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeAll(decks: StoredDeck[]): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    } catch (e) {
        console.error("Failed to save decks:", e);
    }
}

export function saveDeck(deck: Deck, existingId?: string): string {
    const now = new Date().toISOString();
    const all = readAll();
    let id: string;

    if (existingId) {
        const idx = all.findIndex((d) => d.id === existingId);
        if (idx >= 0) {
            all[idx] = { ...all[idx], deck, updatedAt: now };
            writeAll(all);
            id = existingId;
        } else {
            id = existingId;
            const stored: StoredDeck = { id, deck, createdAt: now, updatedAt: now };
            all.unshift(stored);
            writeAll(all.slice(0, 50));
        }
    } else {
        id = nano();
        const stored: StoredDeck = { id, deck, createdAt: now, updatedAt: now };
        all.unshift(stored);
        writeAll(all.slice(0, 50)); // cap at 50 most recent
    }

    // Mirror to the central server-side store. Debounced per deck so a
    // chatty editor doesn't hammer the API. Failure is silent — local
    // copy is the source of truth from the user's POV; the server copy
    // is for Sales Ops visibility.
    syncToServer(id, deck);
    return id;
}

// ─── server-side mirror ─────────────────────────────────────────

const SYNC_DEBOUNCE_MS = 1500;
const pendingSync = new Map<string, ReturnType<typeof setTimeout>>();

function syncToServer(id: string, deck: Deck): void {
    if (typeof window === "undefined") return;
    const existing = pendingSync.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
        pendingSync.delete(id);
        fetch("/api/decks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, deck }),
        }).catch(() => {
            // Silent — local copy still works. Could add a "syncing failed"
            // banner in v2 if needed.
        });
    }, SYNC_DEBOUNCE_MS);
    pendingSync.set(id, timer);
}

export function getRecentDecks(limit = 20): StoredDeck[] {
    return readAll().slice(0, limit);
}

export function getDeckById(id: string): StoredDeck | null {
    return readAll().find((d) => d.id === id) ?? null;
}

export function deleteDeck(id: string): void {
    writeAll(readAll().filter((d) => d.id !== id));
    if (typeof window !== "undefined") {
        // Best-effort server delete; ignore failures.
        fetch(`/api/decks/${id}`, { method: "DELETE" }).catch(() => {});
    }
}

export function toggleStar(id: string): void {
    const all = readAll();
    const idx = all.findIndex((d) => d.id === id);
    if (idx >= 0) {
        all[idx].starred = !all[idx].starred;
        writeAll(all);
    }
}
