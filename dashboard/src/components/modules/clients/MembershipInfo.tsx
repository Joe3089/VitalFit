"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientMembership } from "@vitalfit/sdk";

interface Props {
  membership: ClientMembership;
  t: any; 
  formatDate: (date: string) => string;
}

export const MembershipInfo = ({ membership, t, formatDate }: Props) => {

  const statusVariants: Record<string, "success" | "error" | "warning" | "default"> = {
    active: "success",
    expired: "error",
    pending: "warning",
    canceled: "error",
  };

  return (
    <Card className="overflow-hidden border-t-4 border-t-primary text-left">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {t("sections.membership")}
          <Badge variant={statusVariants[membership.status] || "default"} className="capitalize">

            {t(`status.${membership.status}`) || membership.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("fields.membership_type")}
            </p>
            <p className="font-semibold text-foreground uppercase">
              {membership.membership_type_id}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("fields.start_date")}
            </p>
            <p className="font-medium">
              {formatDate(membership.start_date)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("fields.end_date")}
            </p>
            <p className="font-medium text-destructive">
              {formatDate(membership.end_date)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("fields.membership_id")}
            </p>
            <p className="text-xs font-mono text-muted-foreground truncate" title={membership.client_membership_id}>
              {membership.client_membership_id}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};