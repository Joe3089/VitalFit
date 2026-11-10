"use client";
import React from "react";
import ProfileForm from "./ProfileForm";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500">
        Cargando información del perfil...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <button
          className="bg-orange-500 text-white px-4 py-2 rounded"
          onClick={() => router.replace("/profile/edit")}
        >
          Editar
        </button>
      </div>
      <ProfileForm user={user} mode="view" />
    </div>
  );
}
