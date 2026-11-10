"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, Camera, Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl"; 

interface UserData {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  identity_document?: string;
  birth_date?: string;
  gender?: string;
  profile_picture_url?: string;
  role?: string;
  role_label?: string;
  activeBranch?: { name: string };
  managedBranches?: any[];
}

interface AccountFormProps {
  user: UserData;
}

export const AccountForm: React.FC<AccountFormProps> = ({ user }) => {
  const t = useTranslations("account.profile"); 
  const { reloadUser, token } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profile_picture_url || null);

  const userId = user.id || user.user_id || "";

  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
    identity_document: user.identity_document || "",
    birth_date: user.birth_date ? user.birth_date.split("T")[0] : "",
    gender: user.gender || "",
    role_name: user.role || "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      identity_document: user.identity_document || "",
      birth_date: user.birth_date ? user.birth_date.split("T")[0] : "",
      gender: user.gender || "",
      role_name: user.role || "",
    }));
    if (!selectedFile) {
      setPreviewUrl(user.profile_picture_url || null);
    }
  }, [user, selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("notifications.imageTooHeavy"));
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const uploadToImgBB = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append("image", file);
    const apiKey = process.env.NEXT_PUBLIC_IMGBB;

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: data,
    });

    const responseData = await res.json();
    if (!responseData.success) {
      throw new Error("Failed to upload image to ImgBB");
    }
    return responseData.data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      return toast.error(t("notifications.noUserId"));
    }
    if (!token) {
      return toast.error(t("notifications.noSession"));
    }

    setIsLoading(true);

    try {
      let finalProfileUrl = user.profile_picture_url;

      if (selectedFile) {
        try {
          finalProfileUrl = await uploadToImgBB(selectedFile);
        } catch (uploadError) {
          console.error(uploadError);
          toast.error(t("notifications.uploadError"));
        }
      }

      const payload = {
        ...formData,
        profile_picture_url: finalProfileUrl,
      };

      await api.user.updateUserStaff(userId, payload, token);

      toast.success(t("notifications.updateSuccess"));

      setSelectedFile(null);
      await reloadUser();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || t("notifications.updateError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      identity_document: user.identity_document || "",
      birth_date: user.birth_date ? user.birth_date.split("T")[0] : "",
      gender: user.gender || "",
      role_name: user.role || "",
    });
    setSelectedFile(null);
    setPreviewUrl(user.profile_picture_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info(t("notifications.discarded"));
  };

  const getInitials = () => {
    return (
      (user.first_name?.[0] || "") + (user.last_name?.[0] || "")
    ).toUpperCase();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-2 border-white shadow-md cursor-pointer bg-gray-100">
            <AvatarImage
              src={previewUrl || undefined}
              className="object-cover"
            />
            <AvatarFallback className="bg-slate-100 text-slate-600 text-2xl font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div
            onClick={handleImageClick}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-sm cursor-pointer hover:bg-blue-700 transition-colors z-10"
          >
            <Camera className="w-4 h-4" />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {user.first_name} {user.last_name}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {t("manageInfo")}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
              {user.role_label || t("staff")}
            </span>
            {user.activeBranch && (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {user.activeBranch.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InputField
          label={t("firstName")}
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          required
        />
        <InputField
          label={t("lastName")}
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          required
        />

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1.5 block">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            {t("emailWarning")}
          </p>
        </div>

        <InputField
          label={t("identityDocument")}
          name="identity_document"
          value={formData.identity_document}
          onChange={handleChange}
        />
        <InputField
          label={t("phone")}
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+58..."
        />

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">{t("gender")}</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{t("genderPlaceholder")}</option>
            <option value="male">{t("genderMale")}</option>
            <option value="female">{t("genderFemale")}</option>
            <option value="other">{t("genderOther")}</option>
          </select>
        </div>

        <InputField
          label={t("birthDate")}
          name="birth_date"
          type="date"
          value={formData.birth_date}
          onChange={handleChange}
        />
      </div>

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button type="button" variant="ghost" onClick={handleCancel}>
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[140px] bg-gray-900 text-white hover:bg-black"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("saveChanges")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};