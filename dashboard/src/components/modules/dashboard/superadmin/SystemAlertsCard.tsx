import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info, Bell } from "lucide-react";

type AlertType = "warning" | "error" | "info" | "success";

interface SystemAlert {
  type: AlertType;
  title: string;
  desc: string;
  time: string;
}

const MOCK_ALERTS: SystemAlert[] = [
  {
    type: "warning",
    title: "Baja ocupación crítica",
    desc: "Sede Querétaro - Clases < 30%",
    time: "2h",
  },
  {
    type: "error",
    title: "Reporte financiero pendiente",
    desc: "Sede Cancún - Cierre Mes",
    time: "5h",
  },
  {
    type: "info",
    title: "Nuevo franquiciado",
    desc: "Proceso de onboarding iniciado",
    time: "1d",
  },
  {
    type: "info",
    title: "Error de sincronización",
    desc: "API de pagos",
    time: "1d",
  },
];

export const SystemAlertsCard = () => {

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case "error":
        return { color: "text-red-600 bg-red-50 border-red-100", icon: AlertCircle };
      case "warning":
        return { color: "text-yellow-600 bg-yellow-50 border-yellow-100", icon: AlertTriangle };
      case "info":
        return { color: "text-blue-600 bg-blue-50 border-blue-100", icon: Info };
      case "success":
        return { color: "text-green-600 bg-green-50 border-green-100", icon: Bell };
      default:
        return { color: "text-gray-600 bg-gray-50 border-gray-100", icon: Bell };
    }
  };

  return (
    <Card className="h-full border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Alertas del Sistema
          {MOCK_ALERTS.length > 0 && (
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Notificaciones críticas y de gestión</p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {MOCK_ALERTS.map((alert, i) => {
            const { color, icon: Icon } = getAlertStyles(alert.type);
            return (
              <div 
                key={i} 
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-md ${color}`}
              >
                <div className="mt-0.5">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm leading-none mb-1 text-slate-900">
                    {alert.title}
                  </p>
                  <p className="text-xs opacity-80 leading-snug">
                    {alert.desc}
                  </p>
                </div>
                <span className="text-[10px] font-medium opacity-60 whitespace-nowrap">
                  {alert.time}
                </span>
              </div>
            );
          })}
          
          {MOCK_ALERTS.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="bg-slate-100 p-3 rounded-full mb-2">
                <Bell className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Todo en orden por aquí</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};