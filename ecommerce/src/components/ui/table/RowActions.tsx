"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import React from "react";

export interface ActionItem {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "danger";
  show?: boolean;
  separatorBefore?: boolean;
}

interface GenericRowActionsProps {
  actions: ActionItem[];
  menuLabel?: string;
}

export const RowActions: React.FC<GenericRowActionsProps> = ({
  actions,
  menuLabel = "Acciones",
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>

        {actions.map((action, index) => {
          if (action.show === false) {
            return null;
          }

          return (
            <React.Fragment key={index}>
              {action.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={action.onClick}
                className={action.variant === "danger" ? "text-red-600" : ""}
              >
                <action.icon className="mr-2 h-4 w-4" /> {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
