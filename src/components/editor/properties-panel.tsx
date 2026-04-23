"use client";

import type { Slide } from "@/lib/slide-types";
import { XMarkIcon } from "@heroicons/react/24/solid";

// Friendly type names
const TYPE_LABELS: Record<string, string> = {
  "cover-hero": "Cover Hero",
  "corporate-cover": "Portada Corporativa",
  "cover-globe": "Cierre",
  "intro-mentors": "Intro + Mentores",
  "problem-cards": "Problema",
  "diagnostic": "Diagnóstico",
  "curriculum-grid": "Currículo",
  "mentor-duo": "Mentor Duo",
  "mentor-grid": "Mentor Grid",
  "methodology": "Metodología",
  "impact": "Impacto",
  "pricing-cta": "Inversión",
  "content": "Contenido",
};

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 border-b border-[var(--chrome-border)]">
      <p className="text-[10px] font-medium text-[var(--chrome-fg-5)] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[12px] text-[var(--chrome-fg-2)] leading-relaxed break-words">{value}</p>
    </div>
  );
}

function PropertySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2">
      <p className="text-[10px] font-semibold text-[var(--chrome-accent-fg)] uppercase tracking-wider mb-1">{title}</p>
      {children}
    </div>
  );
}

function getSlideProperties(slide: Slide): { label: string; value: string }[] {
  const props: { label: string; value: string }[] = [];

  if ("headline" in slide && slide.headline) props.push({ label: "Headline", value: slide.headline });
  if ("subtitle" in slide && slide.subtitle) props.push({ label: "Subtitle", value: slide.subtitle as string });
  if ("body" in slide && slide.body) props.push({ label: "Body", value: slide.body as string });
  if ("label" in slide && slide.label) props.push({ label: "Label", value: slide.label as string });
  if ("title" in slide && slide.title) props.push({ label: "Title", value: slide.title as string });
  if ("price" in slide && slide.price) props.push({ label: "Price", value: slide.price as string });
  if ("description" in slide && slide.description) props.push({ label: "Description", value: slide.description as string });
  if ("programName" in slide && slide.programName) props.push({ label: "Program", value: slide.programName as string });
  if ("moduleTitle" in slide && slide.moduleTitle) props.push({ label: "Module", value: slide.moduleTitle as string });
  if ("backgroundImage" in slide && slide.backgroundImage) props.push({ label: "Background", value: slide.backgroundImage as string });
  if ("imageKey" in slide && slide.imageKey) props.push({ label: "Image", value: slide.imageKey as string });

  return props;
}

function getSlideItems(slide: Slide): string[] {
  if ("cards" in slide && slide.cards) return slide.cards.map((c: { title: string }) => c.title);
  if ("modules" in slide && slide.modules) return slide.modules.map((m: { name: string }) => m.name);
  if ("steps" in slide && slide.steps) return slide.steps.map((s: { title: string }) => s.title);
  if ("findings" in slide && slide.findings) return slide.findings.map((f: { title: string }) => f.title);
  if ("angles" in slide && slide.angles) return slide.angles.map((a: { title: string }) => a.title);
  if ("stats" in slide && slide.stats) return slide.stats.map((s: { label: string; value: string }) => `${s.value} · ${s.label}`);
  if ("bullets" in slide && Array.isArray(slide.bullets)) return slide.bullets as string[];
  if ("checklist" in slide && slide.checklist) return slide.checklist as string[];
  if ("mentors" in slide && Array.isArray(slide.mentors)) return slide.mentors.map((m: { name: string }) => m.name);
  return [];
}

interface PropertiesPanelProps {
  slide: Slide;
  slideIndex: number;
  onClose: () => void;
}

export function PropertiesPanel({ slide, slideIndex, onClose }: PropertiesPanelProps) {
  const properties = getSlideProperties(slide);
  const items = getSlideItems(slide);

  return (
    <div className="w-[280px] shrink-0 border-l border-[var(--chrome-border)] bg-[var(--chrome-bg-elevated)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[var(--chrome-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--chrome-accent-fg)] tabular-nums">#{slideIndex + 1}</span>
          <span className="text-[11px] font-medium text-[var(--chrome-fg-3)]">
            {TYPE_LABELS[slide.type] || slide.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--chrome-fg-5)] hover:text-[var(--chrome-fg)] hover:bg-[var(--chrome-hover-bg)] transition-colors"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Properties */}
        {properties.length > 0 && (
          <PropertySection title="Propiedades">
            {properties.map((prop, i) => (
              <PropertyRow key={i} label={prop.label} value={prop.value} />
            ))}
          </PropertySection>
        )}

        {/* Items/children */}
        {items.length > 0 && (
          <PropertySection title="Contenido">
            <div className="space-y-1 py-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <span className="text-[10px] text-[var(--chrome-fg-5)] font-medium tabular-nums mt-0.5 shrink-0">{i + 1}</span>
                  <span className="text-[11px] text-[var(--chrome-fg-3)] leading-snug break-words">{item}</span>
                </div>
              ))}
            </div>
          </PropertySection>
        )}

        {/* Type badge */}
        <div className="px-3 py-3 mt-auto">
          <div className="bg-[var(--chrome-bg)] border border-[var(--chrome-border)] rounded-md p-2.5">
            <p className="text-[9px] text-[var(--chrome-fg-5)] uppercase tracking-wider mb-1">Tipo de slide</p>
            <p className="text-[12px] font-mono text-[var(--chrome-accent-fg)]">{slide.type}</p>
          </div>
        </div>

        {/* Hint */}
        <div className="px-3 pb-3">
          <p className="text-[10px] text-[var(--chrome-fg-6)] leading-relaxed">
            Usa el chat para editar: &ldquo;cambia el headline del slide {slideIndex + 1}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
