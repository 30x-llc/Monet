"use client";

import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";

interface Transaction {
    id: string;
    client: string;
    initials: string;
    product: string;
    amount: number;
    status: "completed" | "pending" | "refunded";
    date: string;
}

interface RecentTransactionsProps {
    data: Transaction[];
    className?: string;
}

const STATUS_CONFIG = {
    completed: { label: "Completado", color: "success" as const },
    pending: { label: "Pendiente", color: "warning" as const },
    refunded: { label: "Reembolsado", color: "error" as const },
};

export function RecentTransactions({ data, className }: RecentTransactionsProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
        });
    };

    return (
        <div
            className={cx(
                "flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-md font-semibold text-primary">Transacciones recientes</h3>
                    <p className="text-sm text-tertiary">Últimas ventas realizadas</p>
                </div>
                <Badge color="gray" size="sm" type="modern">
                    {data.length} transacciones
                </Badge>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-secondary">
                            <th className="pb-3 text-left text-xs font-medium text-tertiary">Cliente</th>
                            <th className="pb-3 text-left text-xs font-medium text-tertiary">Producto</th>
                            <th className="pb-3 text-right text-xs font-medium text-tertiary">Monto</th>
                            <th className="pb-3 text-left text-xs font-medium text-tertiary">Estado</th>
                            <th className="pb-3 text-right text-xs font-medium text-tertiary">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary">
                        {data.map((txn) => {
                            const status = STATUS_CONFIG[txn.status];
                            return (
                                <tr key={txn.id} className="group">
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar initials={txn.initials} size="sm" />
                                            <span className="text-sm font-medium text-primary">{txn.client}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className="text-sm text-secondary">{txn.product}</span>
                                    </td>
                                    <td className="py-3 pr-4 text-right">
                                        <span
                                            className={cx(
                                                "text-sm font-semibold",
                                                txn.status === "refunded" ? "text-error-primary" : "text-primary"
                                            )}
                                        >
                                            {txn.status === "refunded" ? "-" : ""}${txn.amount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <BadgeWithDot color={status.color} size="sm" type="pill-color">
                                            {status.label}
                                        </BadgeWithDot>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="text-sm text-tertiary">{formatDate(txn.date)}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
