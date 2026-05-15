"use client";

import { useState } from "react";
import { Button30x } from "@/components/30x/button-30x";

export function ChatInput({
    onSend,
    isLoading,
}: {
    onSend: (message: string) => void;
    isLoading: boolean;
}) {
    const [message, setMessage] = useState("");

    function handleSubmit() {
        if (!message.trim() || isLoading) return;
        onSend(message.trim());
        setMessage("");
    }

    return (
        <div className="flex gap-3">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Modifica el deck: cambia headlines, agrega slides, ajusta el tono..."
                disabled={isLoading}
                className="flex-1 rounded-lg bg-primary px-3.5 py-2.5 text-sm text-primary shadow-xs ring-1 ring-primary ring-inset placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button30x
                variant="accent"
                size="small"
                onClick={handleSubmit}
                disabled={!message.trim() || isLoading}
            >
                {isLoading ? "..." : "Enviar"}
            </Button30x>
        </div>
    );
}
