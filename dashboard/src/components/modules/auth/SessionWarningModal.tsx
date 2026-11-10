"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface SessionWarningModalProps {
  remainingTime: number;
  onStayLoggedIn: () => void;
}

export const SessionWarningModal = ({
  remainingTime,
  onStayLoggedIn,
}: SessionWarningModalProps) => {

  const t = useTranslations("Auth.sessionWarning");

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-3">
            <Clock className="h-6 w-6 text-destructive animate-pulse" />
          </div>
          <AlertDialogTitle className="text-xl">
            {t("title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground">
            {t("description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-6 flex justify-center">
          <span className="rounded-md bg-muted px-4 py-2 font-mono text-4xl font-bold tracking-tighter text-foreground">
            {formattedTime}
          </span>
        </div>

        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction asChild>
            <Button 
              onClick={onStayLoggedIn} 
              className="w-full sm:w-auto px-8"
            >
              {t("button")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};