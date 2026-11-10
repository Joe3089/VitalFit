"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";

const STORAGE_KEY = "vf_nps_answered_at";
const ASK_EVERY_DAYS = 90;

/** HU-ANALYTICS-06: Net Promoter Score survey for members (0-10). */
export default function NpsSurvey() {
  const t = useTranslations("NpsSurvey");
  const { token, user } = useAuth();
  const storageKey = `${STORAGE_KEY}:${user?.user_id ?? ""}`;
  const [dismissed, setDismissed] = useState(false);
  // Read the last answer date from localStorage without an effect; the server
  // snapshot hides the survey so hydration stays consistent.
  const dueByDate = useSyncExternalStore(
    () => () => {},
    () =>
      Date.now() - Number(localStorage.getItem(storageKey) || 0) >
      ASK_EVERY_DAYS * 24 * 60 * 60 * 1000,
    () => false,
  );
  const visible = dueByDate && !dismissed;
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  const remember = () => localStorage.setItem(storageKey, String(Date.now()));

  if (dismissed || (!visible && state !== "done") || !token) {
    return null;
  }

  const submit = async () => {
    if (score === null) {
      return;
    }
    setState("sending");
    try {
      await api.crm.submitNPS(token, {
        score,
        comment: comment.trim() || undefined,
        channel: "web",
      });
      remember();
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <button
        type="button"
        aria-label={t("dismiss")}
        onClick={() => {
          remember();
          setDismissed(true);
        }}
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>

      {state === "done" ? (
        <p className="text-center font-semibold text-green-700">
          {t("thanks")}
        </p>
      ) : (
        <div className="space-y-4">
          <h3 className="pr-6 text-lg font-bold text-slate-900">
            {t("question")}
          </h3>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t("question")}
          >
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={score === n}
                onClick={() => setScore(n)}
                className={`h-10 w-10 rounded-lg border text-sm font-bold transition-colors ${
                  score === n
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 hover:border-primary"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t("unlikely")}</span>
            <span>{t("likely")}</span>
          </div>
          {score !== null && (
            <Textarea
              value={comment}
              maxLength={2000}
              rows={3}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("commentPlaceholder")}
            />
          )}
          {state === "error" && (
            <p className="text-sm text-red-600">{t("error")}</p>
          )}
          <Button
            onClick={submit}
            disabled={score === null || state === "sending"}
          >
            {state === "sending" ? t("sending") : t("submit")}
          </Button>
        </div>
      )}
    </section>
  );
}
