"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { buttonVariants } from "./button";

interface GeneralAlertDialogProps {
  trigger?: React.ReactNode;
  title: string;
  description: string;
  type?: "confirmation" | "info" | "success";
  actionText: string;
  onAction?: () => void;
  actionVariant?: "default" | "destructive" | "primary";
  cancelText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string; 
}

export function GeneralAlertDialog({
  trigger,
  title,
  description,
  actionText,
  onAction,
  type = "confirmation",
  actionVariant = "default",
  cancelText = "Cancelar",
  open,
  onOpenChange,
  className,
}: GeneralAlertDialogProps) {
  const isInfoOrSuccess = type === "info" || type === "success";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {isInfoOrSuccess ? (
            <AlertDialogAction
              onClick={onAction}
              className={cn(
                buttonVariants({
                  variant: "default",
                }),
              )}
            >
              {actionText} 
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel>{cancelText}</AlertDialogCancel>
              <AlertDialogAction
                onClick={onAction}
                className={cn(
                  actionVariant === "destructive" &&
                    buttonVariants({ variant: "destructive" }),
                )}
              >
                {actionText}              
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}