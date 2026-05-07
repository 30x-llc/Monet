"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Identity gate — wraps the app and requires the user to sign in with
 * Google Workspace (30x.com) before showing the app. Identity is
 * persisted in a signed HttpOnly cookie set by the OAuth callback at
 * /api/auth/google/callback.
 *
 * The gate is intentionally invisible to signed-in users: a brief
 * loading dot, then `children`. The sign-in screen mirrors 30x NPS:
 * dark background, centered logo, single CTA, allow-list disclaimer.
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

const ERROR_COPY: Record<string, string> = {
    not_workspace_member:
        "Tu cuenta no es de Google Workspace 30x.com. Pídele a admin que te dé acceso.",
    email_not_verified: "Google aún no verifica este correo.",
    email_domain_mismatch: "El correo no termina en @30x.com.",
    aud_mismatch: "Token inválido (audience).",
    iss_mismatch: "Token inválido (issuer).",
    expired: "El token expiró. Intenta de nuevo.",
    invalid_token: "Token inválido.",
    state_mismatch: "Sesión inválida. Vuelve a intentarlo.",
    state_invalid: "Sesión inválida. Vuelve a intentarlo.",
    missing_params: "Faltan parámetros del callback.",
    google_error: "Google rechazó la solicitud.",
    token_exchange_failed: "No se pudo intercambiar el token con Google.",
    not_configured: "OAuth no está configurado todavía.",
};

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
            <div className="min-h-screen bg-[#0a0a0a] grid place-items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E9FF7B] animate-pulse" />
            </div>
        );
    }

    if (!state.identity) {
        return <SignInScreen />;
    }

    return <>{children}</>;
}

function SignInScreen() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const e = params.get("error");
        if (e) setError(e);
    }, []);

    const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    const startUrl = `/api/auth/google/start?next=${encodeURIComponent(next)}`;

    return (
        <div className="min-h-screen bg-[#0a0a0a] grid place-items-center px-4 text-white">
            <div className="w-full max-w-[440px] flex flex-col items-center">
                {/* Wordmark */}
                <div className="flex flex-col items-center mb-10">
                    <div className="flex items-baseline">
                        <span className="text-white text-[44px] font-extrabold tracking-[-0.04em] leading-none">3</span>
                        <span className="text-white text-[44px] font-extrabold tracking-[-0.04em] leading-none">0</span>
                        <span className="text-[#E9FF7B] text-[44px] font-extrabold tracking-[-0.04em] leading-none">X</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="h-px w-6 bg-white/20" />
                        <span className="text-[10px] font-semibold tracking-[0.24em] text-white/70">DESIGN</span>
                        <span className="h-px w-6 bg-white/20" />
                    </div>
                </div>

                {/* Subtitle */}
                <p className="text-[14px] text-white/70 tracking-[-0.005em] text-center mb-6">
                    Diseño y propuestas comerciales de 30x
                </p>

                {/* Google button */}
                <a
                    href={startUrl}
                    className="w-full h-14 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.06] flex items-center justify-center gap-3 transition-colors"
                >
                    <GoogleLogo />
                    <span className="text-[15px] font-medium tracking-[-0.01em] text-white">
                        Continuar con Google
                    </span>
                </a>

                <p className="text-[12px] text-white/45 tracking-[-0.005em] text-center mt-5">
                    Solo disponible para cuentas{" "}
                    <span className="text-white/75">@30x.com</span>
                </p>

                {error ? (
                    <div className="mt-6 w-full rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-[12.5px] text-red-200 leading-[1.5] tracking-[-0.005em]">
                        {ERROR_COPY[error] ?? `Error: ${error}`}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function GoogleLogo() {
    return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white">
            <svg width="14" height="14" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                />
                <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                    fill="#FBBC05"
                    d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                />
                <path
                    fill="#EA4335"
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                />
            </svg>
        </span>
    );
}
