// Seeded random for consistent SSR/client data
class SeededRandom {
    private seed: number;
    constructor(seed: number) { this.seed = seed; }
    next(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    nextInt(max: number): number { return Math.floor(this.next() * max); }
    nextRange(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    pick<T>(arr: readonly T[]): T { return arr[this.nextInt(arr.length)]; }
}

const rng = new SeededRandom(54321);

// --- Revenue over time (last 12 months) ---
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const revenueByMonth = MONTHS.map((month, i) => {
    const base = 42000 + i * 3500;
    const revenue = base + rng.nextRange(-5000, 8000);
    const expenses = Math.round(revenue * (0.35 + rng.next() * 0.15));
    return { month, revenue, expenses, profit: revenue - expenses };
});

// --- KPI Metrics ---
export const salesMetrics = {
    totalRevenue: "$584,230",
    totalRevenueChange: 12.5,
    totalOrders: "1,847",
    totalOrdersChange: 8.2,
    avgOrderValue: "$316",
    avgOrderValueChange: -2.4,
    conversionRate: "3.6%",
    conversionRateChange: 15.3,
};

// --- Sales by product ---
export const salesByProduct = [
    { name: "30x Membership", revenue: 245800, units: 612, percentage: 42.1 },
    { name: "1:1 Coaching", revenue: 128400, units: 214, percentage: 22.0 },
    { name: "Group Program", revenue: 98600, units: 329, percentage: 16.9 },
    { name: "Digital Course", revenue: 67200, units: 448, percentage: 11.5 },
    { name: "Workshop", revenue: 44230, units: 244, percentage: 7.5 },
];

// --- Sales by channel ---
export const salesByChannel = [
    { name: "Orgánico", value: 34, color: "#22c55e" },
    { name: "Paid Ads", value: 28, color: "#3b82f6" },
    { name: "Referral", value: 18, color: "#8b5cf6" },
    { name: "Email", value: 12, color: "#f59e0b" },
    { name: "Social", value: 8, color: "#ec4899" },
];

// --- Weekly sales (last 8 weeks) ---
export const weeklySales = Array.from({ length: 8 }, (_, i) => {
    const weekNum = i + 1;
    const target = 12000 + rng.nextRange(0, 3000);
    const actual = target + rng.nextRange(-3000, 4000);
    return { week: `S${weekNum}`, target, actual };
});

// --- Top sales reps ---
const REP_NAMES = [
    "María García", "Carlos Rodríguez", "Ana Martínez",
    "Roberto López", "Sofía Hernández", "Diego Torres",
];

export const topSalesReps = REP_NAMES.map((name, i) => {
    const deals = rng.nextRange(12, 45);
    const revenue = deals * rng.nextRange(280, 520);
    const conversionRate = rng.nextRange(18, 42);
    return {
        id: `rep-${i}`,
        name,
        initials: name.split(" ").map(n => n[0]).join(""),
        deals,
        revenue,
        conversionRate,
        trend: rng.next() > 0.3 ? "up" as const : "down" as const,
    };
}).sort((a, b) => b.revenue - a.revenue);

// --- Recent transactions ---
const PRODUCTS = ["30x Membership", "1:1 Coaching", "Group Program", "Digital Course", "Workshop"];
const STATUSES = ["completed", "pending", "refunded"] as const;
const CLIENTS = [
    "Alejandra Vega", "Fernando Ruiz", "Camila Soto", "Pablo Mendoza",
    "Natalia Cruz", "Sebastián Flores", "Isabella Morales", "Martín Díaz",
    "Lucía Rojas", "Felipe Castillo", "Valeria Herrera", "Andrés Reyes",
];

export const recentTransactions = Array.from({ length: 12 }, (_, i) => {
    const product = rng.pick(PRODUCTS);
    const status = rng.next() > 0.15 ? (rng.next() > 0.2 ? "completed" : "pending") : "refunded";
    const amount = rng.nextRange(180, 850);
    const daysAgo = rng.nextRange(0, 14);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
        id: `txn-${i}`,
        client: CLIENTS[i],
        initials: CLIENTS[i].split(" ").map(n => n[0]).join(""),
        product,
        amount,
        status: status as typeof STATUSES[number],
        date: date.toISOString(),
    };
});

// --- Daily revenue sparkline (last 30 days) ---
export const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
    return { day: i + 1, value: rng.nextRange(12000, 28000) };
});

export const dailyOrders = Array.from({ length: 30 }, (_, i) => {
    return { day: i + 1, value: rng.nextRange(40, 90) };
});
