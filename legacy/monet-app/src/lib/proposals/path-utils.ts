/**
 * Tiny immutable get/set by path for editing nested deck fields from the
 * field editor. Paths are arrays like ["slides", 2, "findings", 0, "title"].
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getByPath(obj: any, path: (string | number)[]): any {
    let cur = obj;
    for (const k of path) {
        if (cur == null) return undefined;
        cur = cur[k];
    }
    return cur;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setByPath<T>(obj: T, path: (string | number)[], value: any): T {
    if (path.length === 0) return value as unknown as T;
    const [head, ...rest] = path;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clone: any = Array.isArray(obj) ? [...(obj as any)] : { ...((obj as any) ?? {}) };
    clone[head] = setByPath(clone[head], rest, value);
    return clone;
}
