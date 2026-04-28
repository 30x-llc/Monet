/**
 * Slide JSON → Canva autofill payload mapper.
 *
 * Each slide type maps to a flat map of `{ field_name: text|imageUrl }`
 * that the orchestrator turns into the actual autofill `data` (after
 * uploading images to Canva to get asset_ids).
 *
 * Image URLs in here are the SOURCE urls (from Wikipedia, Vercel Blob,
 * mentor portrait paths, etc.). The orchestrator's job is to upload
 * each unique URL once and substitute the asset_id.
 *
 * Mapping rules per slide type follow the field schema defined in
 * `templates-config.ts` 1:1.
 */

import "server-only";
import type {
    Slide,
    Deck,
    CorporateCoverSlide,
    IntroMentorsSlide,
    CurriculumGridSlide,
    MentorGridSlide,
    MentorDuoSlide,
    ImpactSlide,
    PricingCtaSlide,
} from "@/lib/slide-types";
import { getMentorImage } from "@/lib/assets";

/** Internal payload before image-URL → asset_id substitution. */
export type AutofillTextValue = { type: "text"; text: string };
export type AutofillImageValue = { type: "image"; sourceUrl: string };
export type RawAutofillField = AutofillTextValue | AutofillImageValue;
export type RawAutofillData = Record<string, RawAutofillField>;

function txt(text: string | undefined): RawAutofillField | undefined {
    if (text == null) return undefined;
    const t = String(text).trim();
    return t ? { type: "text", text: t } : undefined;
}

function img(url: string | undefined | null): RawAutofillField | undefined {
    if (!url) return undefined;
    const u = String(url).trim();
    if (!u) return undefined;
    return { type: "image", sourceUrl: u };
}

function set(
    out: RawAutofillData,
    name: string,
    value: RawAutofillField | undefined,
) {
    if (value !== undefined) out[name] = value;
}

/**
 * Map a slide to its autofill data. Returns null if the slide type
 * has no Canva template mapping (the orchestrator falls back for these).
 *
 * `partnerLogoUrl` is sourced from the deck root (deck.clientLogoUrl) —
 * it appears on every templated slide and we pass it down here so each
 * mapper can include it in its data field.
 */
export function mapSlideToAutofill(
    slide: Slide,
    partnerLogoUrl: string | undefined,
): RawAutofillData | null {
    switch (slide.type) {
        case "corporate-cover":
            return mapRecognitionCover(slide, partnerLogoUrl);
        case "intro-mentors":
            return mapIntroMentors(slide, partnerLogoUrl);
        case "curriculum-grid":
            return mapCurriculumGrid(slide, partnerLogoUrl);
        case "mentor-grid":
        case "mentor-duo":
            return mapMentorGrid(slide, partnerLogoUrl);
        case "impact":
            return mapImpact(slide, partnerLogoUrl);
        case "pricing-cta":
            return mapPricingCta(slide, partnerLogoUrl);
        default:
            return null;
    }
}

function mapRecognitionCover(
    slide: CorporateCoverSlide,
    partnerLogoUrl: string | undefined,
): RawAutofillData {
    const out: RawAutofillData = {};
    set(out, "partner_logo", img(partnerLogoUrl));
    set(out, "hero_background", img(slide.backgroundImage));
    // Andrés formula: headline_main = full headline minus the accent
    // tail. headline_accent = the lime-coloured tail. If the model
    // didn't tag the accent we send the full headline as `_main` and
    // leave `_accent` empty.
    if (slide.headlineAccent && slide.headline.includes(slide.headlineAccent)) {
        const main = slide.headline.replace(slide.headlineAccent, "").trim();
        set(out, "headline_main", txt(main));
        set(out, "headline_accent", txt(slide.headlineAccent));
    } else {
        set(out, "headline_main", txt(slide.headline));
    }
    const paras = slide.bodyParagraphs ?? (slide.subtitle ? [slide.subtitle] : []);
    set(out, "body_paragraph_1", txt(paras[0]));
    set(out, "body_paragraph_2", txt(paras[1]));
    return out;
}

function mapIntroMentors(
    slide: IntroMentorsSlide,
    partnerLogoUrl: string | undefined,
): RawAutofillData {
    const out: RawAutofillData = {};
    set(out, "partner_logo", img(partnerLogoUrl));
    set(out, "section_title", txt(slide.title));
    set(out, "section_description", txt(slide.description));
    const angles = slide.angles ?? [];
    for (let i = 0; i < 3; i++) {
        const a = angles[i];
        if (!a) break;
        set(out, `angle_${i + 1}_title`, txt(a.title));
        set(out, `angle_${i + 1}_desc`, txt(a.description));
    }
    const mentors = slide.mentors ?? [];
    for (let i = 0; i < 3; i++) {
        const m = mentors[i];
        if (!m) break;
        set(out, `mentor_${i + 1}_photo`, img(getMentorImage(m.imageKey)));
        set(out, `mentor_${i + 1}_name`, txt(m.name));
        set(out, `mentor_${i + 1}_role`, txt(m.role));
    }
    return out;
}

function mapCurriculumGrid(
    slide: CurriculumGridSlide,
    partnerLogoUrl: string | undefined,
): RawAutofillData {
    const out: RawAutofillData = {};
    set(out, "partner_logo", img(partnerLogoUrl));
    set(out, "headline", txt(slide.headline));
    set(out, "subtitle", txt(slide.subtitle));
    const modules = slide.modules ?? [];
    for (let i = 0; i < 8; i++) {
        const m = modules[i];
        if (!m) break;
        set(out, `module_${i + 1}_number`, txt(String(m.number)));
        set(out, `module_${i + 1}_name`, txt(m.name));
        set(out, `module_${i + 1}_desc`, txt(m.description));
    }
    return out;
}

function mapMentorGrid(
    slide: MentorGridSlide | MentorDuoSlide,
    partnerLogoUrl: string | undefined,
): RawAutofillData {
    const out: RawAutofillData = {};
    set(out, "partner_logo", img(partnerLogoUrl));
    set(out, "headline", txt(slide.headline));
    set(out, "subtitle", txt("subtitle" in slide ? slide.subtitle : undefined));
    const mentors = slide.mentors ?? [];
    for (let i = 0; i < 6; i++) {
        const m = mentors[i];
        if (!m) break;
        set(out, `mentor_${i + 1}_photo`, img(getMentorImage(m.imageKey)));
        set(out, `mentor_${i + 1}_name`, txt(m.name));
        set(out, `mentor_${i + 1}_role`, txt(m.role));
        // mentor-grid mentors have `bio`, mentor-duo doesn't have company
        if ("bio" in m && m.bio) set(out, `mentor_${i + 1}_company`, txt(m.bio));
    }
    return out;
}

function mapImpact(
    slide: ImpactSlide,
    partnerLogoUrl: string | undefined,
): RawAutofillData {
    const out: RawAutofillData = {};
    set(out, "partner_logo", img(partnerLogoUrl));
    set(out, "eyebrow", txt(slide.subtitle)); // hero variant uses subtitle as eyebrow
    set(out, "headline", txt(slide.headline));
    const stats = slide.stats ?? [];
    if (slide.variant === "hero-number" && stats.length > 0) {
        const [hero, ...rest] = stats;
        set(out, "hero_value", txt(hero.value));
        set(out, "hero_label", txt(hero.label));
        set(out, "hero_context", txt(slide.heroContext));
        for (let i = 0; i < 3; i++) {
            const s = rest[i];
            if (!s) break;
            set(out, `stat_${i + 1}_value`, txt(s.value));
            set(out, `stat_${i + 1}_label`, txt(s.label));
        }
    } else {
        // stats-row variant uses up to 3 of the supporting stat slots
        for (let i = 0; i < 3; i++) {
            const s = stats[i];
            if (!s) break;
            set(out, `stat_${i + 1}_value`, txt(s.value));
            set(out, `stat_${i + 1}_label`, txt(s.label));
        }
    }
    return out;
}

function mapPricingCta(
    slide: PricingCtaSlide,
    partnerLogoUrl: string | undefined,
): RawAutofillData {
    const out: RawAutofillData = {};
    set(out, "partner_logo", img(partnerLogoUrl));
    set(out, "headline", txt(slide.headline));

    if (slide.variant === "package" && slide.packages && slide.packages.length > 0) {
        for (let i = 0; i < 2; i++) {
            const pkg = slide.packages[i];
            if (!pkg) break;
            const n = i + 1;
            set(out, `package_${n}_name`, txt(pkg.name));
            set(out, `package_${n}_tagline`, txt(pkg.tagline));
            set(out, `package_${n}_price`, txt(pkg.price));
            set(out, `package_${n}_price_note`, txt(pkg.priceNote));
            for (let j = 0; j < 5; j++) {
                set(out, `package_${n}_feature_${j + 1}`, txt(pkg.features?.[j]));
            }
        }
    } else {
        // Split variant: collapse single price + checklist into package_1
        set(out, "package_1_name", txt("Inversión"));
        set(out, "package_1_price", txt(slide.price));
        set(out, "package_1_price_note", txt(slide.paymentNote));
        const items = slide.checklist ?? [];
        for (let j = 0; j < 5; j++) {
            set(out, `package_1_feature_${j + 1}`, txt(items[j]));
        }
    }

    if (slide.contact) {
        set(out, "contact_name", txt(slide.contact.name));
        set(out, "contact_role", txt(slide.contact.role));
        set(out, "contact_details", txt(slide.contact.details));
    }
    return out;
}

/** Convenience: map every slide in a deck to its raw autofill payload. */
export function mapDeckToAutofills(
    deck: Deck,
): Array<{
    slideIndex: number;
    slideType: string;
    data: RawAutofillData;
} | null> {
    return deck.slides.map((slide, i) => {
        const data = mapSlideToAutofill(slide, deck.clientLogoUrl);
        if (!data) return null;
        return { slideIndex: i, slideType: slide.type, data };
    });
}
