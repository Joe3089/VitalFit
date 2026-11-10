"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

interface BillingMatrixProps {
  data: any;
  isLoading: boolean;
}

export function BillingMatrixTable({ data, isLoading }: BillingMatrixProps) {
  const t = useTranslations("analytics.finance.billing_matrix");

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-[300px] w-full rounded-md" />
      </div>
    );
  }

  const matrix = data?.data || data;

  if (!matrix || !matrix.branches || matrix.branches.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {t("no_data")}
      </div>
    );
  }

  const { branches, rows, totals, grand_total } = matrix;

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(val) || 0);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold tracking-tight">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead className="font-medium text-foreground h-11 border-r w-[180px]">
                  {t("column_concept")}
                </TableHead>
                {branches.map((branch: string) => (
                  <TableHead key={branch} className="text-right font-medium text-foreground whitespace-nowrap px-4">
                    {branch}
                  </TableHead>
                ))}
                <TableHead className="text-right font-semibold text-orange-600 dark:bg-orange-950/20 border-l min-w-[120px]">
                  {t("column_total")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: any) => (
                <TableRow key={row.concept} className="hover:bg-muted/30">
                  <TableCell className="font-medium border-r">{row.concept}</TableCell>
                  {branches.map((branch: string) => (
                    <TableCell key={branch} className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(row.values?.[branch] || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium text-orange-600/80 border-l">
                    {formatCurrency(row.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="border-t-2 bg-muted/20">
              <TableRow className="hover:bg-transparent">
                <TableCell className="font-bold border-r text-foreground italic uppercase text-xs tracking-widest">
                  {t("footer_totals")}
                </TableCell>
                {branches.map((branch: string) => (
                  <TableCell key={branch} className="text-right font-bold tabular-nums text-foreground">
                    {formatCurrency(totals?.[branch] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold bg-orange-500 text-white border-l">
                  {formatCurrency(grand_total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}