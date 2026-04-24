"use client";

import { Component, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    slideType?: string;
}

interface State {
    error: Error | null;
}

/**
 * Shields the editor from crashing when a single slide renderer throws —
 * e.g. because the model returned an intro-mentors slide without a mentors
 * array, and the renderer calls `slide.mentors.length`. Without this boundary,
 * one bad slide propagates up, React unmounts the whole subtree, and the tab
 * dies showing Chrome's "This page couldn't load" screen.
 */
export class SlideErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error) {
        console.error("[slide-renderer]", this.props.slideType, error);
    }

    render() {
        if (this.state.error) {
            return (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        background: "#0a0a0a",
                        color: "#E9FF7B",
                        fontFamily: "Inter, system-ui, sans-serif",
                        padding: 40,
                        textAlign: "center",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 11,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                opacity: 0.7,
                                marginBottom: 8,
                            }}
                        >
                            Slide con datos incompletos
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                letterSpacing: "-0.01em",
                                color: "#F0F0F0",
                                marginBottom: 4,
                            }}
                        >
                            {this.props.slideType || "slide"}
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: "#999",
                                letterSpacing: "-0.005em",
                            }}
                        >
                            Regenera o edita — el resto del deck sigue funcionando.
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
