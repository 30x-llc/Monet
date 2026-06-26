/**
 * Company Enrichment — resolves a partner company into a logo URL + a
 * fallback domain guess. Hero imagery is populated by the research step
 * (Claude's web_search returns a real image URL) — this module is the
 * safety net for when research fails or the user bypasses it.
 *
 * Used when 30x builds a proposal for a specific company (Aeroméxico,
 * Colsubsidio, Action Black, etc). The partner logo shows on EVERY
 * slide (top-right), and on the cover slide it renders large + white
 * over a full-bleed hero image of the company's world.
 *
 * Logo strategy:
 *   1. Clearbit Logo API by guessed domain (free, public CDN, no auth)
 *   2. Google favicon service as a last resort
 *
 * The cover hero image is best-effort: research step populates it via
 * web_search. If missing we fall back to the 30x portada — never a
 * broken image.
 */

export interface CompanyEnrichment {
    name: string;
    domain: string;
    logoUrl: string;
    logoFallbackUrl: string; // favicon service
    heroKeyword: string; // used by the research prompt
}

// Known Latin-American corporate domains the model won't reliably guess.
// Only for companies 30x actually gets asked about often — keeps the
// lookup table small and high-precision.
const KNOWN_DOMAINS: Record<string, string> = {
    "aeroméxico": "aeromexico.com",
    "aeromexico": "aeromexico.com",
    "avianca": "avianca.com",
    "latam airlines": "latamairlines.com",
    "latam": "latamairlines.com",
    "viva aerobus": "vivaaerobus.com",
    "volaris": "volaris.com",
    "colsubsidio": "colsubsidio.com",
    "compensar": "compensar.com",
    "cafam": "cafam.com.co",
    "davivienda": "davivienda.com",
    "bancolombia": "bancolombia.com",
    "grupo aval": "grupoaval.com",
    "bbva": "bbva.com",
    "banco de bogota": "bancodebogota.com",
    "banco de bogotá": "bancodebogota.com",
    "banco lambia": "lambia.co",
    "lulo bank": "lulobank.com",
    "lulo": "lulobank.com",
    "nubank": "nubank.com.br",
    "nu colombia": "nu.com.co",
    "rappi": "rappi.com",
    "truora": "truora.com",
    "habi": "habi.co",
    "action black": "actionblack.com",
    "smartfit": "smartfit.com",
    "bodytech": "bodytech.com.co",
    "grupo éxito": "grupoexito.com.co",
    "grupo exito": "grupoexito.com.co",
    "éxito": "exito.com",
    "exito": "exito.com",
    "falabella": "falabella.com",
    "cencosud": "cencosud.com",
    "walmart": "walmart.com",
    "claro": "claro.com",
    "tigo": "tigo.com",
    "movistar": "movistar.com",
    "tigo une": "tigo.com.co",
    "ecopetrol": "ecopetrol.com.co",
    "geopark": "geo-park.com",
    "sura": "sura.com",
    "grupo sura": "gruposura.com",
    "bavaria": "bavaria.co",
    "postobón": "postobon.com",
    "postobon": "postobon.com",
    "alpina": "alpina.com",
    "nutresa": "gruponutresa.com",
    "grupo nutresa": "gruponutresa.com",
    "mercado libre": "mercadolibre.com",
    "mercadolibre": "mercadolibre.com",
    "despegar": "despegar.com",
    "uber": "uber.com",
    "didi": "didi.global",
    "ifood": "ifood.com.br",
    "pedidosya": "pedidosya.com",
    "globant": "globant.com",
    "stripe": "stripe.com",
    "linktic": "linktic.com",
    "platzi": "platzi.com",
    "crehana": "crehana.com",
    "epm": "epm.com.co",
    "isa": "isa.co",
    "tcc": "tcc.com.co",
    "corona": "corona.co",
    "haceb": "haceb.com",
    "homecenter": "homecenter.com.co",
    "sodimac": "sodimac.com",
    "argos": "argos.co",
    "cemex": "cemex.com",
    "oxxo": "oxxo.com",
    "femsa": "femsa.com",
    "grupo bimbo": "grupobimbo.com",
    "arcos dorados": "arcosdorados.com",
    "mcdonalds": "mcdonalds.com",
    "mcdonald's": "mcdonalds.com",
    "coca cola femsa": "coca-colafemsa.com",
    "ab inbev": "ab-inbev.com",
    "sab miller": "ab-inbev.com",
    "grupo empresarial antioqueño": "gruposura.com",
    "gea": "gruposura.com",
    "grupo mexico": "gmexico.com",
    "ontop": "ontop.com",
    "bold": "bold.co",
    "tpaga": "tpaga.co",
    "addi": "addi.com",
    "liftit": "liftit.co",
    "la haus": "lahaus.com",
    "chiper": "chiper.co",
    "kushki": "kushki.com",
    "tiendanube": "tiendanube.com",
    "vtex": "vtex.com",
    "auteco": "auteco.com.co",
    "totto": "totto.com",
    "arturo calle": "arturocalle.com",
    "cueros vélez": "cuerosvelez.com",
    "bosi": "bosi.com",
    "crepes and waffles": "crepesywaffles.com",
    "oma": "cafeoma.com",
    "juan valdez": "juanvaldezcafe.com",
    "alianza team": "alianzateam.com",
    "colombina": "colombina.com",
    "pan pa' ya": "panpaya.com.co",
};

// Industry → hero keyword that pairs well with web_search image hunting.
const INDUSTRY_KEYWORDS: [RegExp, string][] = [
    [/aero|airline|avianca|latam|viva|jetsmart|volaris/i, "airplane cockpit takeoff"],
    [/banco|bank|davivienda|bancolombia|bbva|aval|sura|lulo|nu /i, "corporate banking headquarters skyline"],
    [/colsubsidio|compensar|cafam/i, "family wellness recreation community"],
    [/gym|fit|action black|smartfit|bodytech|crossfit/i, "modern gym fitness training equipment"],
    [/retail|exito|falabella|cencosud|walmart|oxxo|juan valdez|totto/i, "modern retail store interior"],
    [/telecom|claro|tigo|movistar|telefonica/i, "telecommunications fiber network city"],
    [/ecopetrol|energia|energy|epm|oil|gas|cemex|argos/i, "energy infrastructure industrial refinery"],
    [/rappi|uber|didi|delivery|pedidosya|ifood|liftit/i, "city delivery rider motorcycle sunset"],
    [/tech|software|globant|stripe|linktic|platzi|crehana|habi|truora|nubank|vtex/i, "modern tech office workspace laptop"],
    [/salud|hospital|ips|eps|medic|pharma/i, "hospital hallway doctor modern"],
    [/real estate|vivienda|bienes|habi|la haus/i, "modern architecture apartment building"],
    [/bavaria|postobon|alpina|nutresa|bimbo|femsa|coca|colombina|crepes|café/i, "manufacturing food beverage production"],
    [/corona|cemex|argos|haceb|homecenter|sodimac|auteco/i, "industrial manufacturing plant workers"],
    [/mercadolibre|despegar|ecommerce|tiendanube/i, "ecommerce warehouse logistics box"],
    [/insurance|seguros|aseguradora/i, "insurance agent office meeting"],
    [/education|educación|universidad|platzi|crehana/i, "students learning modern classroom"],
    [/moda|fashion|calle|velez|totto|bosi/i, "fashion retail store mannequin"],
];

/**
 * Guess the company domain from the name. Tries:
 *   1. The curated KNOWN_DOMAINS table (exact)
 *   2. KNOWN_DOMAINS partial match ("Aeromexico S.A." → aeromexico.com)
 *   3. <slug>.com
 */
export function guessDomain(companyName: string): string {
    const norm = companyName.trim().toLowerCase();
    if (KNOWN_DOMAINS[norm]) return KNOWN_DOMAINS[norm];

    for (const [key, domain] of Object.entries(KNOWN_DOMAINS)) {
        if (norm.includes(key)) return domain;
    }

    const slug = norm
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // strip accents
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 30);

    if (!slug) return "example.com";
    return `${slug}.com`;
}

/**
 * Returns the Clearbit Logo API URL. Clearbit is a free public CDN,
 * no auth required. If the domain has no logo, Clearbit returns 404
 * and the <img> tag will fire onerror.
 */
export function clearbitLogoUrl(domain: string, size = 512): string {
    return `https://logo.clearbit.com/${domain}?size=${size}`;
}

/**
 * Google's favicon service — always returns something, even if it's
 * a colored "?" placeholder. Used as the onerror fallback for Clearbit.
 */
export function googleFaviconUrl(domain: string, size = 256): string {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/**
 * Infer a useful hero-image keyword for the research step. Claude can
 * then use web_search to find a real photograph URL.
 */
export function inferHeroKeyword(companyName: string, industry?: string): string {
    const source = `${companyName} ${industry || ""}`;
    for (const [re, keyword] of INDUSTRY_KEYWORDS) {
        if (re.test(source)) return keyword;
    }
    return `${companyName} headquarters office`;
}

/**
 * Main entry — enrich a company name with a logo URL + hero keyword.
 * Purely synchronous: no network calls; URLs resolve when the <img>
 * tag loads.
 */
export function enrichCompany(
    companyName: string,
    industry?: string,
): CompanyEnrichment {
    const domain = guessDomain(companyName);
    return {
        name: companyName,
        domain,
        // Clearbit's free Logo API was shut down (HubSpot acquisition) and now
        // 403s, so we fall back to Google's favicon service, which always
        // returns an image. The higher-quality logo, when found, comes from
        // the research step (Gemini + Google Search) and is preferred upstream
        // in postProcessDeck.
        logoUrl: googleFaviconUrl(domain, 256),
        logoFallbackUrl: googleFaviconUrl(domain, 128),
        heroKeyword: inferHeroKeyword(companyName, industry),
    };
}
