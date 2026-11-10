"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Play, Users } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClassScheduleItem } from "@vitalfit/sdk";
import { cn } from "@/lib/utils";

interface TodayClassesListProps {
  classes: ClassScheduleItem[];
  branchName?: string;
}

export function TodayClassesList({ classes, branchName }: TodayClassesListProps) {
  const t = useTranslations("dashboards.InstructorDashboard.classes_list");
  
  const locale = useLocale();

  const formatTime = (isoString: string) => {
    try {
      return format(parseISO(isoString), "hh:mm aa", { 
        locale: locale === "es" ? es : undefined 
      });
    } catch {
      return "--:--";
    }
  };

  return (
    <Card className="shadow-sm border-none bg-card">
      <CardHeader className="px-7">
        <CardTitle className="text-xl font-semibold tracking-tight">
          {t("title")}
        </CardTitle>
        
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(
          "w-full pr-4",
          classes.length > 5 ? "h-[400px]" : "h-auto"
        )}>
          <div className="space-y-8">
            {classes.length > 0 ? (
              classes.map((classItem) => (
                <div key={classItem.class_id} className="flex items-center justify-between group">
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none uppercase tracking-tight text-foreground">
                      {classItem.class_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3 opacity-70" />
                      {t("capacity")}: {classItem.max_capacity} alumnos
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {formatTime(classItem.start_time)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {t("ends")}: {formatTime(classItem.end_time)}
                      </p>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 rounded-md border-muted-foreground/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-none"
                      onClick={() => console.log("Iniciando clase:", classItem.class_id)}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span className="sr-only">{t("start_button")}</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                {t("empty")}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}