"use client";

import { Suspense, useEffect, useState } from "react";
import { LabCanvas } from "@/components/three/LabCanvas";
import { Hud } from "@/components/ui/Hud";
import { audioEngine } from "@/engine/audio/AudioEngine";
import { loadLabConfig } from "@/engine/labRegistry";
import type { LabConfig } from "@/engine/types";
import { useLabStore } from "@/stores/labStore";
import { useSettingsStore } from "@/stores/settingsStore";

interface Props {
  labId: number;
}

/**
 * Top-level composition for any lab: 3D canvas + 2D HUD.
 * Loads the lab config lazily and mounts it into the store.
 */
export function LabExperience({ labId }: Props) {
  const mountLab = useLabStore((s) => s.mountLab);
  const [config, setConfig] = useState<LabConfig | null>(null);
  const muted = useSettingsStore((s) => s.muted);

  useEffect(() => {
    let cancelled = false;
    loadLabConfig(labId).then((cfg) => {
      if (cancelled || !cfg) return;
      setConfig(cfg);
      mountLab(cfg);
      audioEngine.init(cfg.audio);
      audioEngine.setMuted(muted);
    });
    return () => {
      cancelled = true;
    };
  }, [labId, mountLab, muted]);

  if (!config) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-300">
        Yuklanmoqda…
      </div>
    );
  }

  const SceneComponent = config.scene;
  const ResultView = config.resultView;

  return (
    <div
      className="relative flex-1 h-screen w-screen"
      onPointerDown={() => audioEngine.unlock()}
    >
      <div className="absolute inset-0">
        <LabCanvas>
          <Suspense fallback={null}>
            <SceneComponent />
          </Suspense>
        </LabCanvas>
      </div>
      <Hud config={config} />
      <Suspense fallback={null}>
        <ResultView />
      </Suspense>
    </div>
  );
}
