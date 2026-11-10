"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, Save, X, Fingerprint, Calendar, 
  Phone, Mail, Camera, User as UserIcon 
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  client: any; 
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ClientEditForm = ({ client, onSave, onCancel, isSubmitting }: Props) => {
  const t = useTranslations("clients.view");
  const [isUploading, setIsUploading] = useState(false);


  const clientSchema = z.object({
    first_name: z.string().min(2, t("validation.min_2")),
    last_name: z.string().min(2, t("validation.min_2")),
    email: z.string().email(t("validation.invalid_email")),
    phone: z.string().min(10, t("validation.min_10")),
    identity_document: z.string().min(5, t("validation.invalid_id")),
    birth_date: z.string().min(1, t("validation.required")),
    gender: z.string(),
    profile_picture_url: z.string().optional().or(z.literal("")),
  });

  type ClientFormValues = z.infer<typeof clientSchema>;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      email: client.email || "",
      phone: client.phone || "",
      identity_document: client.identity_document || "",
      birth_date: client.birth_date ? new Date(client.birth_date).toISOString().split("T")[0] : "",
      gender: client.gender || "prefer-not-to-say",
      profile_picture_url: client.profile_picture_url || "",
    },
  });

  const initials = `${client.first_name?.[0] || ""}${client.last_name?.[0] || ""}`.toUpperCase();
  const currentAvatar = watch("profile_picture_url");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(t("notifications.invalid_image"));
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      const apiKey = process.env.NEXT_PUBLIC_IMGBB || "";
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setValue("profile_picture_url", result.data.url, { shouldValidate: true });
        toast.success(t("notifications.image_success"));
      }
    } catch (error) {
      toast.error(t("notifications.image_error"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className="md:col-span-2 space-y-4 text-left">
      <Card className="overflow-hidden border-primary/10 shadow-lg animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 border-b bg-muted/30 pb-4">
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
              <AvatarImage src={currentAvatar} alt="Preview" className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : initials}
              </AvatarFallback>
            </Avatar>
            <label 
              htmlFor="avatar-upload" 
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-5 w-5 text-white" />
            </label>
            <input 
              id="avatar-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading || isSubmitting}
            />
          </div>

          <div className="flex-1">
            <CardTitle className="text-xl italic font-black uppercase tracking-tighter">
              {t("editing_title") || "Edit Client"}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              ID: {client.user_id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
              <X className="h-4 w-4 mr-1" /> {t("form_actions.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || isUploading} className="font-bold italic uppercase tracking-tighter px-4">
              {(isSubmitting || isUploading) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t("form_actions.save")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 pt-6">
          
          <FormInput 
            label={t("fields.first_name")} 
            registration={register("first_name")} 
            error={errors.first_name?.message} 
          />
          
          <FormInput 
            label={t("fields.last_name")} 
            registration={register("last_name")} 
            error={errors.last_name?.message} 
          />

          <FormInput 
            label={t("fields.identity")} 
            icon={<Fingerprint className="h-3.5 w-3.5" />} 
            registration={register("identity_document")} 
            error={errors.identity_document?.message} 
          />

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
              {t("fields.gender")}
            </p>
            <select
              {...register("gender")}
              className="w-full h-9 px-3 rounded-md border border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="male">{t("gender_options.male")}</option>
              <option value="female">{t("gender_options.female")}</option>
              <option value="prefer-not-to-say">{t("gender_options.prefer-not-to-say")}</option>
            </select>
          </div>

          <FormInput 
            label={t("fields.email")} 
            type="email" 
            icon={<Mail className="h-3.5 w-3.5" />} 
            registration={register("email")} 
            error={errors.email?.message} 
          />

          <FormInput 
            label={t("fields.phone")} 
            icon={<Phone className="h-3.5 w-3.5" />} 
            registration={register("phone")} 
            error={errors.phone?.message} 
          />

          <FormInput 
            label={t("fields.birth_date")} 
            type="date" 
            icon={<Calendar className="h-3.5 w-3.5" />} 
            registration={register("birth_date")} 
            error={errors.birth_date?.message} 
          />

          <FormInput 
            label={t("fields.image_url")} 
            icon={<UserIcon className="h-3.5 w-3.5" />}
            registration={register("profile_picture_url")} 
            error={errors.profile_picture_url?.message} 
            placeholder="https://..."
          />
        </CardContent>
      </Card>
    </form>
  );
};

const FormInput = ({ label, error, registration, type = "text", icon, className, placeholder }: any) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
      {label}
    </p>
    <div className="relative group">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
          {icon}
        </div>
      )}
      <input
        {...registration}
        type={type}
        placeholder={placeholder}
        className={`flex h-9 w-full rounded-md border ${error ? "border-destructive" : "border-slate-100"} bg-slate-50/50 px-3 ${icon ? "pl-10" : ""} py-1 text-sm font-semibold text-slate-700 transition-all focus:outline-none focus:ring-2 ${error ? "focus:ring-destructive/20" : "focus:ring-primary/20"} disabled:opacity-50`}
      />
    </div>
    {error && (
      <p className="text-[9px] font-bold text-destructive uppercase ml-1 animate-in fade-in slide-in-from-top-1">
        {error}
      </p>
    )}
  </div>
);