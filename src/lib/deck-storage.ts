"use client";

import type { Deck } from "./slide-types";

/**
 * Deck storage layer — localStorage-backed.
 * Format: { id, deck, createdAt, updatedAt }
 */

const STORAGE_KEY = "30x-deck-engine:decks";

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

    if (existingId) {
        const idx = all.findIndex((d) => d.id === existingId);
        if (idx >= 0) {
            all[idx] = { ...all[idx], deck, updatedAt: now };
            writeAll(all);
            return existingId;
        }
    }

    const id = nano();
    const stored: StoredDeck = { id, deck, createdAt: now, updatedAt: now };
    all.unshift(stored);
    writeAll(all.slice(0, 50)); // cap at 50 most recent
    return id;
}

export function getRecentDecks(limit = 20): StoredDeck[] {
    return readAll().slice(0, limit);
}

export function getDeckById(id: string): StoredDeck | null {
    return readAll().find((d) => d.id === id) ?? null;
}

export function deleteDeck(id: string): void {
    writeAll(readAll().filter((d) => d.id !== id));
}

export function toggleStar(id: string): void {
    const all = readAll();
    const idx = all.findIndex((d) => d.id === id);
    if (idx >= 0) {
        all[idx].starred = !all[idx].starred;
        writeAll(all);
    }
}
