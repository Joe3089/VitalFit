"use client";

import * as React from "react";

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
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GeneralAlertDialogProps
  extends Partial<React.ComponentProps<typeof AlertDialog>> {
  trigger: React.ReactNode;
  title: string;
  description: string;
  type?: "confirmation" | "info";
  actionText: string;
  onAction?: () => void;
  actionVariant?: "default" | "destructive";
  cancelText?: string;
}

export function GeneralAlertDialog(props: GeneralAlertDialogProps) {
  const {
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
  } = props;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {type === "info" ? (
            <AlertDialogCancel
              onClick={onAction}
              className={cn(
                buttonVariants({
                  variant:
                    actionVariant === "destructive" ? "destructive" : "default",
                }),
              )}
            >
              {actionText}
            </AlertDialogCancel>
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
