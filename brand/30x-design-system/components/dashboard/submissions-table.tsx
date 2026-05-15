"use client";

import { useState } from "react";
import { TableBody as AriaTableBody } from "react-aria-components";
import { LinkExternal01, Mail01, Phone01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button30x } from "@/components/30x/button-30x";
import { Table, TableCard, TableRowActionsDropdown } from "@/components/application/table/table";
import type { TallySubmission } from "@/types/tally";
import { cx } from "@/utils/cx";

interface SubmissionsTableProps {
    submissions: TallySubmission[];
    className?: string;
}

const STATUS_CONFIG = {
    new: { label: "Nuevo", color: "blue" as const },
    reviewing: { label: "En revisión", color: "warning" as const },
    interviewed: { label: "Entrevistado", color: "purple" as const },
    accepted: { label: "Aceptado", color: "success" as const },
    rejected: { label: "Rechazado", color: "error" as const },
};

export const SubmissionsTable = ({ submissions, className }: SubmissionsTableProps) => {
    const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: "ascending" | "descending" }>({
        column: "submittedAt",
        direction: "descending",
    });

    const sortedSubmissions = [...submissions].sort((a, b) => {
        const aValue = a[sortDescriptor.column as keyof TallySubmission] ?? "";
        const bValue = b[sortDescriptor.column as keyof TallySubmission] ?? "";

        if (sortDescriptor.direction === "ascending") {
            return aValue < bValue ? -1 : 1;
        }
        return aValue > bValue ? -1 : 1;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <TableCard.Root size="sm" className={className}>
            <TableCard.Header
                title="Submissions recientes"
                badge={submissions.length}
                description="Candidatos que han aplicado al programa 30x"
                contentTrailing={
                    <div className="flex items-center gap-2">
                        <Button30x variant="accent" size="small">
                            Exportar
                        </Button30x>
                        <Button30x variant="dark" size="small">
                            Ver todos
                        </Button30x>
                    </div>
                }
            />
            <Table
                aria-label="Submissions table"
                selectionMode="multiple"
                sortDescriptor={sortDescriptor}
                onSortChange={(descriptor) => setSortDescriptor(descriptor as typeof sortDescriptor)}
            >
                <Table.Header>
                    <Table.Head id="name" label="Candidato" allowsSorting />
                    <Table.Head id="targetRole" label="Rol objetivo" allowsSorting />
                    <Table.Head id="currentCompany" label="Empresa actual" />
                    <Table.Head id="area" label="Área" />
                    <Table.Head id="yearsExperience" label="Experiencia" allowsSorting />
                    <Table.Head id="status" label="Estado" />
                    <Table.Head id="submittedAt" label="Fecha" allowsSorting />
                    <Table.Head id="actions" label="" />
                </Table.Header>
                <AriaTableBody items={sortedSubmissions}>
                    {(submission) => (
                        <Table.Row key={submission.id} id={submission.id}>
                            <Table.Cell>
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        size="sm"
                                        initials={`${submission.firstName[0]}${submission.lastName[0]}`}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-primary">
                                            {submission.firstName} {submission.lastName}
                                        </span>
                                        <span className="text-xs text-tertiary">{submission.email}</span>
                                    </div>
                                </div>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge color="gray" size="sm" type="modern">
                                    {submission.targetRole}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <div className="flex flex-col">
                                    <span className="text-sm text-primary">{submission.currentCompany}</span>
                                    <span className="text-xs text-tertiary">{submission.currentPosition}</span>
                                </div>
                            </Table.Cell>
                            <Table.Cell>
                                <span className="text-sm text-tertiary">{submission.area}</span>
                            </Table.Cell>
                            <Table.Cell>
                                <span className="text-sm text-tertiary">{submission.yearsExperience} años</span>
                            </Table.Cell>
                            <Table.Cell>
                                <BadgeWithDot
                                    color={STATUS_CONFIG[submission.status].color}
                                    size="sm"
                                    type="pill-color"
                                >
                                    {STATUS_CONFIG[submission.status].label}
                                </BadgeWithDot>
                            </Table.Cell>
                            <Table.Cell>
                                <span className="text-sm text-tertiary">{formatDate(submission.submittedAt)}</span>
                            </Table.Cell>
                            <Table.Cell>
                                <TableRowActionsDropdown />
                            </Table.Cell>
                        </Table.Row>
                    )}
                </AriaTableBody>
            </Table>
        </TableCard.Root>
    );
};
