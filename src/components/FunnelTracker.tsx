"use client";

import { useEffect } from "react";
import { trackFunnel } from "@/lib/tracking";

/** Registers the "visit" step of the conversion funnel once per session. */
export default function FunnelTracker() {
  useEffect(() => {
    trackFunnel("visit");
  }, []);
  return null;
}
