"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { usePaymentHistory } from "@/hooks/usePaymentHistory";
import { useTranslations } from "next-intl"; 
import PaymentsTable from "@/components/modules/clients/PaymentsTable";
import { Button } from "@/components/ui/button"; 
import { ChevronLeft } from "lucide-react"; 
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

export default function ClientPaymentsPage() {
    const params = useParams();
    const router = useRouter(); 
    const t = useTranslations("clients.payments"); 
    
    const { 
        data, 
        isLoading, 
        page, 
        totalPages, 
        handlePageChange,
        filters,
        onFilterChange 
    } = usePaymentHistory(params.id as string);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">

            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.back()}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t("back") || "Volver"} 
                </Button>
            </div>

            <PageHeader 
                title={t("title")} 
                subtitle={t("subtitle")} 
            />

            <Card className="border-primary/10 shadow-sm">
                <CardContent className="pt-6">
                    <PaymentsTable 
                        data={data}
                        isLoading={isLoading}
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        filters={filters}
                        onFilterChange={onFilterChange}
                    />
                </CardContent>
            </Card>
        </div>
    );
}