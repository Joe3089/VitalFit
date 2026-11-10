"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import ProfileForm from "../ProfileForm";

export default function ProfileEditPage() {
  const { user } = useAuth();
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
        <h1 className="text-2xl font-bold">Editar Perfil</h1>
      </div>

      <ProfileForm user={user} mode="edit" />
    </div>
  );
}
