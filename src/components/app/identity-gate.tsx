"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Identity gate — wraps the app and asks the user to identify themselves
 * (name + email) on first visit. Persists in a signed HttpOnly cookie
 * via /api/identity. Once set, becomes invisible.
 *
 * For internal team use only — no real OAuth, no password. The threat
 * model is "70 trusted salespeople" so a self-attested identity is fine
 * for v1; v2 swaps in real SSO without changing this surface.
 */

interface Identity {
    name: string;
    email: string;
}

interface IdentityState {
    loading: boolean;
    identity: Identity | null;
    isOps: boolean;
    allowedDomains: string[];
}

export function IdentityGate({ children }: { children: ReactNode }) {
    const [state, setState] = useState<IdentityState>({
        loading: true,
        identity: null,
        isOps: false,
        allowedDomains: [],
    });

    useEffect(() => {
        fetch("/api/identity")
            .then((r) => r.json())
            .then((d) =>
                setState({
                    loading: false,
                    identity: d.identity,
                    isOps: !!d.isOps,
                    allowedDomains: Array.isArray(d.allowedDomains) ? d.allowedDomains : [],
                }),
            )
            .catch(() =>
                setState({
                    loading: false,
                    identity: null,
                    isOps: false,
                    allowedDomains: [],
                }),
            );
    }, []);

    if (state.loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] grid place-items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a] animate-pulse" />
            </div>
        );
    }

    if (!state.identity) {
        return (
            <IdentityForm
                allowedDomains={state.allowedDomains}
                onComplete={(identity, isOps) =>
                    setState({
                        loading: false,
                        identity,
                        isOps,
                        allowedDomains: state.allowedDomains,
                    })
                }
            />
        );
    }

    return <>{children}</>;
}

function IdentityForm({
    allowedDomains,
    onComplete,
}: {
    allowedDomains: string[];
    onComplete: (identity: Identity, isOps: boolean) => void;
}) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const emailDomain = email.split("@")[1]?.trim().toLowerCase() ?? "";
    const domainOk =
        allowedDomains.length === 0 || allowedDomains.includes(emailDomain);
    const canSubmit =
        name.trim().length > 1 &&
        email.trim().includes("@") &&
        domainOk &&
        !submitting;
    const domainHint = allowedDomains.length
        ? `Sólo correos ${allowedDomains.map((d) => `@${d}`).join(", ")}`
        : null;

    const submit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/identity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim() }),
            });
            const data = await res.json();
            if (!data.ok) {
                setError(data.error || "No se pudo guardar la identidad.");
                setSubmitting(false);
                return;
            }
            onComplete(data.identity, !!data.isOps);
        } catch (err) {
            setError(String(err));
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] grid place-items-center px-4">
            <div className="w-full max-w-[440px]">
                <div className="text-center mb-7">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-black/[0.06] mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E9FF7B]" />
                        <span className="text-[11px] font-medium tracking-[-0.005em] text-[#525252]">
                            30x Design
                        </span>
                    </div>
                    <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-[#0a0a0a] leading-[1.1] mb-2">
                        ¿Quién eres?
                    </h1>
                    <p className="text-[13px] text-[#525252] tracking-[-0.005em] leading-[1.5] max-w-[360px] mx-auto">
                        Cada propuesta queda asociada a vos. Sólo lo pregunto una vez
                        por navegador.
                    </p>
                    {domainHint ? (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a0a0a] text-white">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M8 1.5l5.5 3v5c0 3.5-2.5 5-5.5 5s-5.5-1.5-5.5-5v-5l5.5-3z"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="text-[11px] font-medium tracking-[-0.005em]">
                                {domainHint}
                            </span>
                        </div>
                    ) : null}
                </div>

                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_2px_4px_rgba(0,0,0,0.02),0_12px_32px_-12px_rgba(0,0,0,0.08)] p-6">
                    <div className="space-y-4">
                        <div>
                            <div className="text-[11px] font-medium text-[#525252] tracking-[-0.005em] mb-1.5">
                                Tu nombre
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Juan Diego de la Ossa"
                                autoFocus
                                className="w-full h-10 px-3.5 rounded-lg border border-black/[0.09] bg-white text-[14px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/35 focus:ring-4 focus:ring-black/[0.04] tracking-[-0.005em]"
                            />
                        </div>
                        <div>
                            <div className="text-[11px] font-medium text-[#525252] tracking-[-0.005em] mb-1.5">
                                Tu email de 30x
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="juandelaossa@30x.com"
                                className={`w-full h-10 px-3.5 rounded-lg border bg-white text-[14px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-4 tracking-[-0.005em] ${
                                    email && !domainOk
                                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                        : "border-black/[0.09] focus:border-black/35 focus:ring-black/[0.04]"
                                }`}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") submit();
                                }}
                            />
                            {email && !domainOk && allowedDomains.length > 0 ? (
                                <div className="mt-1.5 text-[11px] text-red-600">
                                    Sólo aceptamos correos {allowedDomains.map((d) => `@${d}`).join(", ")}.
                                </div>
                            ) : null}
                        </div>

                        {error ? (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-[12px] text-red-700">
                                {error}
                            </div>
                        ) : null}

                        <button
                            onClick={submit}
                            disabled={!canSubmit}
                            className="w-full h-11 rounded-lg text-[13.5px] font-semibold tracking-[-0.01em] bg-[#0a0a0a] text-white hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-[filter,opacity] duration-150"
                        >
                            {submitting ? "Guardando…" : "Continuar"}
                        </button>
                    </div>
                </div>

                <p className="text-center text-[11px] text-[#a3a3a3] mt-5 leading-[1.5]">
                    Tus propuestas se sincronizan al store central de 30x Design.
                    <br />
                    Sales Ops puede verlas en el dashboard <code>/ops</code>.
                </p>
            </div>
        </div>
    );
}
