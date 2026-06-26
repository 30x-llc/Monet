"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DECK_STATUS_LABELS, DECK_STATUSES, type DeckStatus } from "@/lib/db/types";

interface DeckRow {
    id: string;
    userEmail: string;
    userName: string;
    deckTitle: string;
    companyName: string;
    programName: string | null;
    format: string;
    status: DeckStatus;
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    total: number;
    byStatus: Record<DeckStatus, number>;
    byUser: Array<{ userEmail: string; userName: string; count: number }>;
}

type Filters = {
    user: string;
    company: string;
    status: DeckStatus | "";
};

export default function OpsDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [decks, setDecks] = useState<DeckRow[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [filters, setFilters] = useState<Filters>({
        user: "",
        company: "",
        status: "",
    });

    const load = async (f: Filters) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ stats: "1" });
            if (f.user) params.set("user", f.user);
            if (f.company) params.set("company", f.company);
            if (f.status) params.set("status", f.status);
            const res = await fetch(`/api/decks/all?${params}`);
            if (res.status === 403) {
                setError("403 — tu email no está en la lista de Sales Ops.");
                setLoading(false);
                return;
            }
            const data = await res.json();
            if (!data.ok) {
                setError(data.error || "Error cargando decks");
                setLoading(false);
                return;
            }
            setDecks(data.decks);
            if (data.stats) setStats(data.stats);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onApplyFilters = () => load(filters);

    const total = stats?.total ?? decks.length;
    const byStatus = stats?.byStatus;

    return (
        <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
            <header className="sticky top-0 z-10 bg-[#fafafa]/85 backdrop-blur-md border-b border-black/[0.06]">
                <div className="max-w-[1400px] mx-auto px-6 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="text-[12px] text-[#525252] hover:text-[#0a0a0a] tracking-[-0.005em] flex items-center gap-1"
                        >
                            ← Home
                        </Link>
                        <div className="w-px h-4 bg-black/[0.1]" />
                        <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#a3a3a3]">
                            Sales Ops
                        </span>
                    </div>
                    <div className="text-[11px] text-[#737373]">
                        {total} {total === 1 ? "propuesta" : "propuestas"}
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 pt-8 pb-20">
                <div className="mb-2">
                    <h1 className="text-[28px] font-semibold tracking-[-0.025em]">
                        Pipeline de propuestas
                    </h1>
                    <p className="text-[13px] text-[#525252] mt-1">
                        Todo lo que el equipo de 30x está mandando, en vivo.
                    </p>
                </div>

                {byStatus ? (
                    <div className="grid grid-cols-4 gap-3 mt-6">
                        {DECK_STATUSES.map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    const next = { ...filters, status: filters.status === s ? "" : s } as Filters;
                                    setFilters(next);
                                    load(next);
                                }}
                                className={`text-left rounded-xl border p-4 transition-[border-color,box-shadow] duration-150 ${
                                    filters.status === s
                                        ? "border-[#0a0a0a]/40 bg-white shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)]"
                                        : "border-black/[0.06] bg-white hover:border-black/[0.18]"
                                }`}
                            >
                                <div className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#a3a3a3] mb-1">
                                    {DECK_STATUS_LABELS[s]}
                                </div>
                                <div className="text-[28px] font-semibold tabular-nums tracking-[-0.025em]">
                                    {byStatus[s] ?? 0}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : null}

                <div className="mt-7 flex items-center gap-2 flex-wrap">
                    <FilterInput
                        label="Vendedor (email)"
                        value={filters.user}
                        onChange={(v) => setFilters({ ...filters, user: v })}
                        placeholder="ej: juan@30x.school"
                    />
                    <FilterInput
                        label="Cliente"
                        value={filters.company}
                        onChange={(v) => setFilters({ ...filters, company: v })}
                        placeholder="ej: Aeroméxico"
                    />
                    <button
                        onClick={onApplyFilters}
                        className="h-9 px-4 rounded-md bg-[#0a0a0a] text-white text-[12px] font-semibold hover:brightness-110"
                    >
                        Filtrar
                    </button>
                    {(filters.user || filters.company || filters.status) && (
                        <button
                            onClick={() => {
                                const blank: Filters = { user: "", company: "", status: "" };
                                setFilters(blank);
                                load(blank);
                            }}
                            className="h-9 px-3 text-[12px] text-[#737373] hover:text-[#0a0a0a]"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {error ? (
                    <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-[12.5px] text-red-800">
                        {error}
                    </div>
                ) : null}

                <div className="mt-6 rounded-xl bg-white border border-black/[0.06] overflow-hidden">
                    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_120px_120px_60px] px-4 py-2.5 border-b border-black/[0.06] bg-[#fafafa] text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#737373]">
                        <div>Propuesta · Cliente</div>
                        <div>Vendedor</div>
                        <div>Programa</div>
                        <div>Status</div>
                        <div>Actualizado</div>
                        <div>Creado</div>
                        <div></div>
                    </div>
                    {loading ? (
                        <div className="px-4 py-12 text-center text-[12.5px] text-[#737373]">
                            Cargando…
                        </div>
                    ) : decks.length === 0 ? (
                        <div className="px-4 py-12 text-center text-[12.5px] text-[#737373]">
                            Sin resultados.
                        </div>
                    ) : (
                        decks.map((d) => <DeckRowComp key={d.id} d={d} onChange={() => load(filters)} />)
                    )}
                </div>

                {stats && stats.byUser.length > 0 ? (
                    <div className="mt-9">
                        <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-3">
                            Por vendedor
                        </h2>
                        <div className="rounded-xl bg-white border border-black/[0.06] overflow-hidden">
                            {stats.byUser.map((u, i) => (
                                <div
                                    key={u.userEmail}
                                    className={`px-4 py-2.5 flex items-center justify-between text-[12.5px] ${
                                        i > 0 ? "border-t border-black/[0.04]" : ""
                                    }`}
                                >
                                    <div>
                                        <div className="font-medium tracking-[-0.005em]">
                                            {u.userName}
                                        </div>
                                        <div className="text-[11px] text-[#a3a3a3]">{u.userEmail}</div>
                                    </div>
                                    <div className="tabular-nums font-semibold">{u.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

function FilterInput({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] tracking-[0.06em] uppercase text-[#a3a3a3] font-medium">
                {label}
            </span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-9 w-[230px] px-3 rounded-md border border-black/[0.09] bg-white text-[12.5px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/35 focus:ring-2 focus:ring-black/[0.04]"
            />
        </div>
    );
}

function DeckRowComp({ d, onChange }: { d: DeckRow; onChange: () => void }) {
    const [busy, setBusy] = useState(false);
    const setStatus = async (status: DeckStatus) => {
        setBusy(true);
        try {
            await fetch(`/api/decks/${d.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            onChange();
        } finally {
            setBusy(false);
        }
    };
    const submitApproval = async () => {
        setBusy(true);
        try {
            const res = await fetch(`/api/proposals/${d.id}/submit-approval`, { method: "POST" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                alert(`No se pudo enviar a aprobación: ${data.error || `HTTP ${res.status}`}`);
            }
            onChange();
        } finally {
            setBusy(false);
        }
    };
    const updated = useMemo(() => formatRelative(d.updatedAt), [d.updatedAt]);
    const created = useMemo(() => formatRelative(d.createdAt), [d.createdAt]);

    return (
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_120px_120px_60px] items-center px-4 py-3 border-t border-black/[0.04] hover:bg-black/[0.015] transition-colors">
            <div className="min-w-0 pr-3">
                <div className="text-[13px] font-semibold tracking-[-0.005em] truncate">
                    {d.deckTitle}
                </div>
                <div className="text-[11px] text-[#737373] truncate">{d.companyName}</div>
            </div>
            <div className="min-w-0 pr-3">
                <div className="text-[12px] truncate">{d.userName}</div>
                <div className="text-[11px] text-[#a3a3a3] truncate">{d.userEmail}</div>
            </div>
            <div className="min-w-0 text-[11.5px] text-[#525252] truncate pr-3">
                {d.programName ?? "—"}
            </div>
            <div className="flex flex-col gap-1 items-start">
                <select
                    value={d.status}
                    onChange={(e) => setStatus(e.target.value as DeckStatus)}
                    disabled={busy}
                    className="h-7 px-2 rounded-md border border-black/[0.09] bg-white text-[11.5px] tracking-[-0.005em] text-[#0a0a0a] focus:outline-none focus:border-black/35"
                >
                    {DECK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {DECK_STATUS_LABELS[s]}
                        </option>
                    ))}
                </select>
                {d.status === "pending_approval" ? (
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setStatus("approved")}
                            disabled={busy}
                            className="text-[10px] font-medium text-green-700 hover:underline"
                        >
                            ✓ Aprobar
                        </button>
                        <button
                            onClick={() => setStatus("rejected")}
                            disabled={busy}
                            className="text-[10px] font-medium text-red-700 hover:underline"
                        >
                            ✕ Rechazar
                        </button>
                    </div>
                ) : d.status === "draft" || d.status === "rejected" ? (
                    <button
                        onClick={submitApproval}
                        disabled={busy}
                        className="text-[10px] text-[#737373] hover:text-[#0a0a0a] hover:underline"
                    >
                        ↗ Enviar a aprobación
                    </button>
                ) : null}
            </div>
            <div className="text-[11px] text-[#737373] tabular-nums">{updated}</div>
            <div className="text-[11px] text-[#a3a3a3] tabular-nums">{created}</div>
            <div className="text-right">
                <a
                    href={`/?open=${d.id}`}
                    title="Abrir en el editor"
                    className="text-[11px] text-[#0a0a0a] hover:underline"
                >
                    Abrir →
                </a>
            </div>
        </div>
    );
}

function formatRelative(iso: string): string {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60_000);
    if (min < 1) return "ahora";
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const dy = Math.floor(hr / 24);
    if (dy < 30) return `${dy}d`;
    return d.toISOString().slice(0, 10);
}
