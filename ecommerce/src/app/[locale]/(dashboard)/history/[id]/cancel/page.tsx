"use client";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Card, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/Textarea";
import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";

const memberships = [
  {
    id: "m1",
    planName: "Membresía Premium Mensual",
    status: "activa",
  },
  {
    id: "m2",
    planName: "Membresía Premium Mensual",
    status: "cancelada",
  },
];

export default function CancelMembershipPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("MembershipCancel");

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const membership = memberships.find((m) => m.id === id);

  useEffect(() => {
    if (!membership || membership.status !== "activa") {
      router.replace("/history");
    }
  }, [membership, router]);

  if (!membership || membership.status !== "activa") {
    return null;
  }

  return (
    <div className="min-h-screen">
      <main className="p-4">
        <Card className="max-w-3xl mx-auto my-8 border shadow-sm">
          <CardTitle className="p-4">
            <h1 className="text-3xl">{t("title")}</h1>
            <p className="text-sm font-normal text-gray-500">{t("message")}</p>
          </CardTitle>
          <CardContent className="space-y-6 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">
                  {t("fields.planName")}
                </label>
                <Input value={membership.planName} disabled />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">
                  {t("fields.status")}
                </label>
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-green-100 text-green-800 border-green-300">
                    {t("status.active")}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-4">
              <div>
                <label className="text-sm font-semibold block mb-2">
                  {t("fields.reason")}
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("placeholders.reason")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">{t("reasons.price")}</SelectItem>
                    <SelectItem value="time">{t("reasons.time")}</SelectItem>
                    <SelectItem value="service">
                      {t("reasons.service")}
                    </SelectItem>
                    <SelectItem value="other">{t("reasons.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">
                  {t("fields.description")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("placeholders.description")}
                  required
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 p-4">
              <Button
                className="w-1/2"
                variant="outline"
                onClick={() => router.replace("/history")}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                className="w-1/2"
                disabled={!reason || !description.trim()}
              >
                {t("actions.confirm")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
