"use client";

import type { AppDoc, StoredApp } from "./app-types";

const STORAGE_KEY = "30x-design:apps";

function nano(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readAll(): StoredApp[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeAll(apps: StoredApp[]): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
        console.error("Failed to save apps:", e);
    }
}

export function saveApp(app: AppDoc, existingId?: string): string {
    const now = new Date().toISOString();
    const all = readAll();

    if (existingId) {
        const idx = all.findIndex((a) => a.id === existingId);
        if (idx >= 0) {
            all[idx] = { ...all[idx], app, updatedAt: now };
            writeAll(all);
            return existingId;
        }
        const stored: StoredApp = {
            id: existingId,
            app,
            createdAt: now,
            updatedAt: now,
        };
        all.unshift(stored);
        writeAll(all.slice(0, 50));
        return existingId;
    }

    const id = nano();
    const stored: StoredApp = { id, app, createdAt: now, updatedAt: now };
    all.unshift(stored);
    writeAll(all.slice(0, 50));
    return id;
}

export function getRecentApps(limit = 20): StoredApp[] {
    return readAll().slice(0, limit);
}

export function getAppById(id: string): StoredApp | null {
    return readAll().find((a) => a.id === id) ?? null;
}

export function deleteApp(id: string): void {
    writeAll(readAll().filter((a) => a.id !== id));
}
