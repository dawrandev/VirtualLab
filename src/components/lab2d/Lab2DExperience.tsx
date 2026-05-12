"use client";

import { Suspense, useEffect, useState } from "react";
import { loadLab2DConfig } from "@/engine2d/labRegistry";
import type { Lab2DConfig } from "@/engine2d/types";
import { useLab2DStore } from "@/stores/labStore2d";
import { LabStage } from "./LabStage";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { HandCursor } from "./HandCursor";
import { InteractionProvider } from "./interactionContext";
import { StageBadge } from "./StageBadge";
import { ZoneRegistryProvider } from "./ZoneRegistry";

interface Props {
  labId: number;
}

/**
 * Top-level mount for any 2D lab. Loads config, mounts state, renders
 * sidebar + topbar + stage + microscope modal + custom hand cursor.
 */
export function Lab2DExperience({ labId }: Props) {
  const mountLab = useLab2DStore((s) => s.mountLab);
  const [config, setConfig] = useState<Lab2DConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLab2DConfig(labId).then((cfg) => {
      if (cancelled || !cfg) return;
      setConfig(cfg);
      mountLab(cfg);
    });
    return () => {
      cancelled = true;
    };
  }, [labId, mountLab]);

  if (!config) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-700">
        Yuklanmoqda…
      </div>
    );
  }

  const Scene = config.Scene;
  const ResultModal = config.ResultModal;

  return (
    <InteractionProvider>
      <ZoneRegistryProvider>
      <div
        className="relative w-screen h-screen overflow-hidden select-none"
        style={{
          cursor: "none",
          background:
            "linear-gradient(180deg, #ececec 0%, #ececec 55%, #7a7a7a 55%, #7e7e7e 100%)",
        }}
      >
        <TopBar />
        <Sidebar />
        <LabStage>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </LabStage>
        <StageBadge />
        <Suspense fallback={null}>
          <ResultModal />
        </Suspense>
        <HandCursor />
      </div>
      </ZoneRegistryProvider>
    </InteractionProvider>
  );
}
