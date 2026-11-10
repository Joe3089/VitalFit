"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface QRCodeModalProps {
  token?: string | null;
  userName: string;
  vencimiento: string | null;
  hasMembership?: boolean;
  onClose: () => void;
  duration?: number;
}

export default function QRCodeModal({
  token,
  userName,
  vencimiento,
  hasMembership = true,
  onClose,
  duration = 25,
}: QRCodeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [countdown, setCountdown] = useState(duration);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const handleDownload = () => {
    const svg = document.querySelector("#qr-code-svg") as SVGSVGElement;
    if (!svg) {
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-${userName}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="relative w-80 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 animate-in zoom-in duration-200"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <h4 className="text-xl font-semibold text-gray-900">Mi código QR</h4>
        <p className="text-xs text-gray-500 mb-4 mt-1">
          Presenta este código en recepción
        </p>

        <div className="flex justify-center mb-4 bg-white p-4 rounded-xl border shadow-sm shadow-gray-100">
          {token ? (
            <QRCode
              id="qr-code-svg"
              value={token}
              size={160}
              style={{ height: "auto", maxWidth: "100%" }}
            />
          ) : (
            <span className="text-sm text-gray-400">Generando QR...</span>
          )}
        </div>

        <div className="space-y-1 mb-4 text-center">
          <h4 className="text-md font-bold text-gray-900">{userName}</h4>

          {hasMembership ? (
            <span className="inline-block text-xs font-semibold text-green-600">
              Miembro activo
            </span>
          ) : (
            <span className="inline-block text-xs font-semibold text-red-600">
              Sin membresía activa
            </span>
          )}

          <p className="text-xs text-gray-500">
            Válido hasta: <strong>{vencimiento || "—"}</strong>
          </p>

          {token && countdown > 0 && (
            <p className="text-sm font-medium text-gray-700">
              Expira en:{" "}
              <span className="text-red-600">{formatTime(countdown)}</span>
            </p>
          )}
        </div>

        <Button
          onClick={handleDownload}
          disabled={!token}
          className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Descargar QR
        </Button>
      </div>
    </div>
  );
}
