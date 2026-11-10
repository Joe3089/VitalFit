import { useState } from "react";
import { api } from "@/lib/sdk-config";
import { CreateFiscalDocumentRequest } from "@vitalfit/sdk";

export function useFiscalDocumentActions(token: string | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDocument = async (data: CreateFiscalDocumentRequest) => {
    if (!token) {
        throw new Error("No token provided");
    }
    setIsSubmitting(true);
    try {
      await api.billing.createFiscalDocument(token, data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDocument = async (id: string, data: CreateFiscalDocumentRequest) => {
    if (!token) {
        throw new Error("No token provided");
    }
    setIsSubmitting(true);
    try {
 
      await api.billing.updateFiscalDocument(token, id, data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!token) {
        throw new Error("No token provided");
    }
    try {
      await api.billing.deleteFiscalDocument(token, id);
    } catch (error) {
      throw error;
    }
  };

  return {
    isSubmitting,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}