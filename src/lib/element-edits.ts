import type { Slide } from "./slide-types";

export type ElementPath = (string | number)[];

export type ElementAction = "moveUp" | "moveDown" | "moveLeft" | "moveRight" | "delete";

export function canEdit(slide: Slide, path: ElementPath): boolean {
    if (path.length < 2) return false;
    const arrayKey = path[path.length - 2] as string;
    const idx = path[path.length - 1];
    if (typeof idx !== "number") return false;
    const arr = (slide as unknown as Record<string, unknown>)[arrayKey];
    return Array.isArray(arr) && idx >= 0 && idx < arr.length;
}

export function canMove(
    slide: Slide,
    path: ElementPath,
    action: ElementAction,
): boolean {
    if (!canEdit(slide, path)) return false;
    if (action === "delete") {
        const arrayKey = path[path.length - 2] as string;
        const arr = (slide as unknown as Record<string, unknown>)[arrayKey] as unknown[];
        return arr.length > 1;
    }
    const arrayKey = path[path.length - 2] as string;
    const idx = path[path.length - 1] as number;
    const arr = (slide as unknown as Record<string, unknown>)[arrayKey] as unknown[];
    const offset = action === "moveUp" || action === "moveLeft" ? -1 : 1;
    const newIdx = idx + offset;
    return newIdx >= 0 && newIdx < arr.length;
}

export function applyAction(
    slide: Slide,
    path: ElementPath,
    action: ElementAction,
): { slide: Slide; newPath: ElementPath | null } {
    if (!canMove(slide, path, action)) return { slide, newPath: path };

    const arrayKey = path[path.length - 2] as string;
    const idx = path[path.length - 1] as number;
    const arr = (slide as unknown as Record<string, unknown>)[arrayKey] as unknown[];
    const newArr = [...arr];

    if (action === "delete") {
        newArr.splice(idx, 1);
        const newSlide = { ...slide, [arrayKey]: newArr } as Slide;
        return { slide: newSlide, newPath: null };
    }

    const offset = action === "moveUp" || action === "moveLeft" ? -1 : 1;
    const newIdx = idx + offset;
    [newArr[idx], newArr[newIdx]] = [newArr[newIdx], newArr[idx]];

    const newSlide = { ...slide, [arrayKey]: newArr } as Slide;
    const newPath = [...path.slice(0, -1), newIdx];
    return { slide: newSlide, newPath };
}

const ELEMENT_LABELS: Record<string, string> = {
    cards: "Card",
    findings: "Hallazgo",
    modules: "Módulo",
    steps: "Paso",
    angles: "Ángulo",
    stats: "Stat",
    mentors: "Mentor",
    bullets: "Bullet",
    checklist: "Check",
    sidebar: "Item",
    packages: "Paquete",
    blocks: "Bloque",
    rows: "Fila",
};

export function describeElement(path: ElementPath): string {
    if (path.length === 0) return "";
    if (path.length === 1) {
        const key = path[0] as string;
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
    const arrayKey = path[path.length - 2] as string;
    const idx = path[path.length - 1] as number;
    const label = ELEMENT_LABELS[arrayKey] || arrayKey;
    return `${label} ${idx + 1}`;
}
