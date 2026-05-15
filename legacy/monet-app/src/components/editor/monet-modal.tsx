"use client";

import { useEffect, useState } from "react";
import { MonetLogo } from "@/components/foundations/logo/monet-logo";

/**
 * In-app confirm modal — replaces window.confirm so the dialog title
 * shows "Monet says" instead of leaking the domain ("monet.30x.com says").
 *
 * Usage pattern: parents render `<MonetModal>` controlled by their own
 * state. Helper hook `useMonetConfirm()` wraps the open/close lifecycle
 * with a Promise so calling code can `await confirm({...})` similar
 * to the native API.
 */

export interface MonetModalProps {
    open: boolean;
    title?: string;
    body: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function MonetModal({
    open,
    title,
    body,
    confirmLabel = "OK",
    cancelLabel = "Cancelar",
    danger = false,
    onConfirm,
    onCancel,
}: MonetModalProps) {
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.preventDefault();
                onCancel();
            } else if (e.key === "Enter") {
                e.preventDefault();
                onConfirm();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onCancel, onConfirm]);

    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div
                className="w-[420px] max-w-[92vw] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
                role="dialog"
                aria-modal="true"
            >
                <div className="px-5 pt-4 pb-3 flex items-center gap-2.5">
                    <MonetLogo variant="dark" />
                    <span className="text-[12px] text-[#737373] tracking-[-0.005em]">says</span>
                </div>
                {title ? (
                    <div className="px-5 pt-1 pb-2 text-[15px] font-semibold tracking-[-0.01em] text-[#0a0a0a]">
                        {title}
                    </div>
                ) : null}
                <div className="px-5 pb-5 text-[13.5px] text-[#404040] leading-[1.5] tracking-[-0.005em]">
                    {body}
                </div>
                <div className="px-5 pb-5 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="h-9 px-4 rounded-lg text-[13px] font-medium text-[#0a0a0a] hover:bg-black/5 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        autoFocus
                        className={
                            "h-9 px-4 rounded-lg text-[13px] font-semibold transition-colors " +
                            (danger
                                ? "bg-[#dc2626] text-white hover:bg-[#b91c1c]"
                                : "bg-[#0a0a0a] text-white hover:bg-[#262626]")
                        }
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface PendingConfirm {
    title?: string;
    body: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    resolve: (ok: boolean) => void;
}

/**
 * Hook that returns:
 *   - `confirm(opts)` → Promise<boolean>: shows the modal, resolves on click
 *   - `modalElement`: render this somewhere stable in the tree
 *
 * Consumer code can `await confirm({title, body})` like a drop-in for
 * window.confirm.
 */
export function useMonetConfirm() {
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    function confirm(opts: Omit<PendingConfirm, "resolve">): Promise<boolean> {
        return new Promise((resolve) => {
            setPending({ ...opts, resolve });
        });
    }

    const modalElement = (
        <MonetModal
            open={!!pending}
            title={pending?.title}
            body={pending?.body ?? null}
            confirmLabel={pending?.confirmLabel}
            cancelLabel={pending?.cancelLabel}
            danger={pending?.danger}
            onConfirm={() => {
                pending?.resolve(true);
                setPending(null);
            }}
            onCancel={() => {
                pending?.resolve(false);
                setPending(null);
            }}
        />
    );

    return { confirm, modalElement };
}
