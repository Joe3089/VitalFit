import { api } from "@/lib/sdk-config";
import { FiscalDocument } from "@vitalfit/sdk";
import { useEffect, useState } from "react";

export function useFiscalDocument(id: string | undefined, token: string | null) {
  const [document, setDocument] = useState<FiscalDocument>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id || !token) {
        return;
      }
      try {
        setIsLoading(true);
        const res = await api.billing.getFiscalDocumentById(token, id);
        setDocument(res.data);
      } catch (error) {
        console.error("Error loading document:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, token]);

  return { document, isLoading, setDocument };
}