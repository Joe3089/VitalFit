"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth } from "@/context/AuthContext"; // Tu nuevo contexto
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { User } from "@vitalfit/sdk";

interface ProfileFormProps {
  user: User;
  mode: "view" | "edit";
}

export default function ProfileForm({ user, mode }: ProfileFormProps) {
  const t = useTranslations("Profile");

  // EXTRAEMOS reloadUser EN LUGAR DE setUser
  const { token, reloadUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setBirthDate(user.birth_date ? user.birth_date.split("T")[0] : "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setDocumentNumber(user.identity_document || "");
      setGender(user.gender || "");
      setProfileImage(user.profile_picture_url || null);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleGenderChange = (selectedGender: string, isChecked: boolean) => {
    if (isChecked) {
      setGender(selectedGender);
    } else if (gender === selectedGender) {
      setGender("");
    }
  };

  const handleSave = async () => {
    if (!user || !token) {
      return;
    }
    if (!gender) {
      toast.error("Por favor selecciona un género");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = profileImage || undefined;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        const res = await fetch(
          `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB}`,
          { method: "POST", body: formData },
        );
        const data = await res.json();
        imageUrl = data.data.url;
      }

      await api.user.updateUserClient(
        user.user_id,
        {
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
          gender,
          email,
          phone,
          identity_document: documentNumber,
          profile_picture_url: imageUrl,
        },
        token,
      );

      toast.success(t("messages.updateSuccess") || "Datos actualizados");

      await reloadUser();

      setSelectedFile(null);
      router.replace("/profile");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar los datos");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-white min-h-screen">
      <div className="flex flex-col items-center -mt-4 mb-8">
        <div className="relative w-32 h-32">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
            {profileImage ? (
              <Image
                src={profileImage}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="text-gray-400 text-4xl">
                {firstName?.charAt(0) || "U"}
              </div>
            )}
          </div>

          {mode === "edit" && (
            <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow border cursor-pointer hover:bg-gray-50 z-10">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="w-4 h-4 text-gray-600" />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-600">{t("personalInfo")}</h2>
        <Card className="border shadow-sm bg-white">
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  {t("name")}
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={mode === "view"}
                  className="h-11 border-gray-200 bg-gray-50/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  {t("lastName")}
                </Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={mode === "view"}
                  className="h-11 border-gray-200 bg-gray-50/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  {t("birthDate")}
                </Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={mode === "view"}
                  className="h-11 border-gray-200 bg-gray-50/30"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  {t("gender")}
                </Label>

                <div className="flex flex-col space-y-3 mt-2">
                  <Checkbox
                    checked={gender === "male"}
                    onCheckedChange={(c) => handleGenderChange("male", c)}
                    labelText="Masculino"
                    disabled={mode === "view"}
                  />

                  <Checkbox
                    checked={gender === "female"}
                    onCheckedChange={(c) => handleGenderChange("female", c)}
                    labelText="Femenino"
                    disabled={mode === "view"}
                  />

                  <Checkbox
                    checked={
                      gender === "prefer-not-to-say" || gender === "other"
                    }
                    onCheckedChange={(c) =>
                      handleGenderChange("prefer-not-to-say", c)
                    }
                    labelText="Prefiero no especificarlo"
                    disabled={mode === "view"}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-600">{t("contactInfo")}</h2>

        <Card className="border shadow-sm bg-white">
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  {t("email")}
                </Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mode === "view"}
                  className="h-11 border-gray-200 bg-gray-50/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  {t("documentNumber")}
                </Label>
                <Input
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  disabled={mode === "view"}
                  className="h-11 border-gray-200 bg-gray-50/30"
                />
              </div>
            </div>

            <div className="w-full md:w-1/2 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                {t("phone")}
              </Label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                disabled={mode === "view"}
                className="h-11 w-full border-gray-200 bg-gray-50/30"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {mode === "edit" && (
        <div className="flex gap-4 pt-4">
          <Button onClick={handleSave} disabled={saving} variant="default">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button variant="outline" onClick={() => router.replace("/profile")}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
