"use client";

import { useState } from "react";
import { programs } from "@/lib/programs";
import { Button } from "@/components/base/buttons/button";
import { Button30x } from "@/components/30x/button-30x";
import { cx } from "@/utils/cx";

interface OnboardData {
    companyName: string;
    program: string;
    slideCount: number;
    notes: string;
}

export function OnboardForm({
    onSubmit,
}: {
    onSubmit: (data: OnboardData) => void;
}) {
    const [step, setStep] = useState(0);
    const [companyName, setCompanyName] = useState("");
    const [program, setProgram] = useState("");
    const [slideCount, setSlideCount] = useState(8);
    const [notes, setNotes] = useState("");

    function handleNext() {
        if (step < 3) setStep(step + 1);
        else onSubmit({ companyName, program, slideCount, notes });
    }

    function handleBack() {
        if (step > 0) setStep(step - 1);
    }

    const canAdvance =
        (step === 0 && companyName.trim().length > 0) ||
        (step === 1 && program.length > 0) ||
        step === 2 ||
        step === 3;

    return (
        <div className="w-full max-w-[640px]">
            {/* Progress bar */}
            <div className="flex gap-2 mb-8">
                {[0, 1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={cx(
                            "h-1 flex-1 rounded-full transition-colors",
                            s <= step ? "bg-brand-600" : "bg-secondary",
                        )}
                    />
                ))}
            </div>

            {/* Step 0: Company */}
            {step === 0 && (
                <div>
                    <h2 className="text-display-xs font-semibold tracking-tight text-primary mb-1">
                        Empresa objetivo
                    </h2>
                    <p className="text-tertiary text-sm mb-6">
                        Nombre de la empresa para la que necesitas el deck.
                    </p>
                    <div className="relative w-full">
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && canAdvance && handleNext()
                            }
                            placeholder="Bancolombia, Femsa, BBVA..."
                            autoFocus
                            className="w-full rounded-lg bg-primary px-3.5 py-2.5 text-md text-primary shadow-xs ring-1 ring-primary ring-inset placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
                        />
                    </div>
                </div>
            )}

            {/* Step 1: Program */}
            {step === 1 && (
                <div>
                    <h2 className="text-display-xs font-semibold tracking-tight text-primary mb-1">
                        Programa 30x
                    </h2>
                    <p className="text-tertiary text-sm mb-6">
                        Selecciona el programa que quieres proponer.
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto scrollbar-hide pr-1">
                        {programs.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setProgram(p.id)}
                                className={cx(
                                    "text-left p-3.5 rounded-xl ring-1 ring-inset transition-all",
                                    program === p.id
                                        ? "bg-brand-50 ring-brand-300 shadow-xs"
                                        : "bg-primary ring-primary hover:bg-primary_hover shadow-xs",
                                )}
                            >
                                <span className="text-sm font-semibold text-primary block mb-0.5">
                                    {p.name}
                                </span>
                                <span className="text-xs text-tertiary block mb-1.5">
                                    {p.tagline}
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-quaternary">
                                    <span>{p.price}</span>
                                    <span>·</span>
                                    <span>{p.duration}</span>
                                    <span>·</span>
                                    <span className="capitalize">{p.format}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Slides */}
            {step === 2 && (
                <div>
                    <h2 className="text-display-xs font-semibold tracking-tight text-primary mb-1">
                        Cantidad de slides
                    </h2>
                    <p className="text-tertiary text-sm mb-6">
                        Recomendado: 8-10 slides.
                    </p>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={7}
                            max={12}
                            value={slideCount}
                            onChange={(e) =>
                                setSlideCount(Number(e.target.value))
                            }
                            className="flex-1 accent-brand-600"
                        />
                        <span className="text-display-xs font-semibold text-brand-600 w-10 text-center">
                            {slideCount}
                        </span>
                    </div>
                </div>
            )}

            {/* Step 3: Notes */}
            {step === 3 && (
                <div>
                    <h2 className="text-display-xs font-semibold tracking-tight text-primary mb-1">
                        Notas de reunion
                    </h2>
                    <p className="text-tertiary text-sm mb-6">
                        Opcional. Informacion adicional que tengas mejora mucho
                        el deck.
                    </p>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Hablamos con el VP de talento, les interesa retener high-potentials..."
                        rows={4}
                        className="w-full rounded-lg bg-primary px-3.5 py-2.5 text-md text-primary shadow-xs ring-1 ring-primary ring-inset placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand transition-shadow resize-none"
                    />
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
                {step > 0 ? (
                    <Button size="md" color="tertiary" onClick={handleBack}>
                        Atras
                    </Button>
                ) : (
                    <div />
                )}
                <Button30x
                    variant="accent"
                    onClick={handleNext}
                    disabled={!canAdvance}
                >
                    {step === 3 ? "Generar Deck" : "Siguiente"}
                </Button30x>
            </div>
        </div>
    );
}
