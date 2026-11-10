"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { ClientPersonalInfo } from "@/components/modules/clients/ClientPersonalInfo";
import { ClientActions } from "@/components/modules/clients/ClientActions";
import { MembershipInfo } from "@/components/modules/clients/MembershipInfo";
import { ClientEditForm } from "@/components/modules/clients/ClientEditForm";
import { ClientMedicalSection } from "@/components/modules/clients/ClientMedicalSection";
import { BlockClientDialog } from "@/components/modules/clients/BlockClientDialog";
import { useGetUser } from "@/hooks/users/useGetUser";
import { ClientCrmPanel } from "@/components/modules/clients/ClientCrmPanel";

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  BRANCH_ADMIN = "branch_admin",
  INSTRUCTOR = "instructor",
  ACCOUNTANT = "accountant",
  DATA_ANALYST = "data_analyst",
  RECEPTIONIST = "recepcionist",
}

const AUTHORIZED_ROLES = [UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.RECEPTIONIST];
const ROLES_CAN_EDIT_MEDICAL = [UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN];

const formatDate = (date: string, locale: string) => {
  if (!date){
     return "N/A";
  }
  return new Date(date).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
};

export default function ClientDetails() {
  const t = useTranslations("clients.view"); 
  const locale = useLocale();
  const { id } = useParams();
  const router = useRouter();
  const { token, user: currentUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const { user, loading, error, reload } = useGetUser(id as string, token);

  const canManageClient = useMemo(() => {
    if (!currentUser?.role) {
      return false;
    }
    return AUTHORIZED_ROLES.includes(currentUser.role as UserRole);
  }, [currentUser]);

  const canEditMedical = useMemo(() => {
    if (!currentUser?.role){
       return false;
    }
    return ROLES_CAN_EDIT_MEDICAL.includes(currentUser.role as UserRole);
  }, [currentUser]);

  const handleSave = async (updatedData: any) => {
    if (!token || !id || !canManageClient) {
      return;
    }
    setIsUpdating(true);
    try {
      await api.user.updateUserClient(id as string, updatedData, token);
      toast.success(t("notifications.update_success"));
      setIsEditing(false);
      reload?.();
    } catch (err) {
      toast.error(t("notifications.update_error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBlockConfirm = async (justification: string) => {
    if (!token || !id) {
      return;
    }
    setIsBlocking(true);
    try {
      await api.user.blockUser(id as string, { block_justification: justification }, token);
      toast.success(t("notifications.block_success"));
      setIsBlockDialogOpen(false);
      reload?.(); 
    } catch (err) {
      toast.error(t("notifications.block_error"));
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async () => {
    if (!token || !id || !canManageClient) {
      return;
    }
    setIsUnblocking(true);
    try {
      await api.user.unblockUser(id as string, token);
      toast.success(t("notifications.unblock_success"));
      reload?.(); 
    } catch (err) {
      toast.error(t("notifications.unblock_error"));
    } finally {
      setIsUnblocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-8 p-8 pt-6">
        <PageHeader title={t("loading")} subtitle={t("loading_subtitle")} />
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground italic font-black animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {t("loading_message")}...
        </div>
      </div>
    );
  }

  if (error || !user) {
    if (error === 401){
       router.replace("/login");
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="p-4 bg-red-50 rounded-full"><AlertCircle className="h-12 w-12 text-red-500" /></div>
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
            {error === 404 ? t("errors.not_found") : t("errors.connection")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">{t("errors.description")}</p>
        </div>
        <button onClick={() => window.location.reload()} className="text-[10px] font-bold uppercase underline tracking-widest text-primary hover:text-primary/80 transition-colors">
          {t("errors.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-500 text-left">
      <PageHeader
        title={isEditing ? t("editing_title") : t("title")}
        subtitle={isEditing 
          ? t("editing_subtitle") 
          : t("subtitle", { name: `${user.first_name} ${user.last_name}` })
        }
      />

      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList className="bg-muted/50 p-1 border rounded-xl shadow-sm">
          <TabsTrigger value="general" className="px-8 font-bold italic uppercase tracking-tighter data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("tabs.general")}
          </TabsTrigger>
          <TabsTrigger value="medical" className="px-8 font-bold italic uppercase tracking-tighter data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("tabs.medical")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {isEditing && canManageClient ? (
                <ClientEditForm
                  client={user}
                  onSave={handleSave}
                  onCancel={() => setIsEditing(false)}
                  isSubmitting={isUpdating}
                />
              ) : (
                <ClientPersonalInfo 
                  client={user} 
                  t={t} 
                  formatDate={(d) => formatDate(d, locale)} 
                  formatPhone={(p) => p || "N/A"} 
                />
              )}
            </div>

            <ClientActions 
              userId={user.user_id} 
              onNavigate={(path) => router.push(path)} 
              onEditClick={() => setIsEditing(true)}
              onBlockClick={() => setIsBlockDialogOpen(true)}
              onUnblockClick={handleUnblock}
              isBlocked={user.status === "Blocked" || !user.is_validated}
              canEdit={canManageClient}
              currentUser={currentUser}
              isUnblocking={isUnblocking}
            />
          </div>

          {!isEditing && <ClientCrmPanel clientId={user.user_id} />}

          {!isEditing && user.client_membership && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <MembershipInfo 
                membership={user.client_membership} 
                t={t} 
                formatDate={(d) => formatDate(d, locale)} 
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="medical" className="outline-none animate-in fade-in duration-300">
           <ClientMedicalSection 
             userId={user.user_id} 
             token={token} 
             canEdit={canEditMedical} 
           />
        </TabsContent>
      </Tabs>

      <BlockClientDialog 
        isOpen={isBlockDialogOpen}
        onOpenChange={setIsBlockDialogOpen}
        onConfirm={handleBlockConfirm}
        isLoading={isBlocking}
        clientName={`${user.first_name} ${user.last_name}`}
      />
    </div>
  );
}