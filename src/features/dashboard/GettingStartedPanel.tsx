import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { getOnboardingPercent, getOnboardingSteps } from "../../core/onboarding/onboardingProgress";

const DISMISSED_KEY = "e4_dnd_getting_started_dismissed_v1";
const PLAY_OPENED_KEY = "e4_dnd_play_mode_opened_v1";
const BACKUP_CREATED_KEY = "e4_dnd_backup_created_v1";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as NavigatorWithStandalone).standalone);
}

export function GettingStartedPanel({ characterCount }: { characterCount: number }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "true");
  const steps = useMemo(() => getOnboardingSteps({
    characterCount,
    hasOpenedPlayMode: localStorage.getItem(PLAY_OPENED_KEY) === "true",
    hasBackup: localStorage.getItem(BACKUP_CREATED_KEY) === "true",
    isInstalled: isInstalled(),
  }), [characterCount]);
  const percent = getOnboardingPercent(steps);

  if (dismissed || percent === 100) return null;

  return (
    <section className="getting-started-panel" aria-labelledby="getting-started-title">
      <div className="getting-started-head">
        <div>
          <span className="dashboard-kicker">Başlarken</span>
          <h2 id="getting-started-title">Masaya dört adımda hazırlan</h2>
          <p>Tamamlanan adımlar otomatik işaretlenir. İnsan hafızasına güvenmek gibi pervasızlıklara gerek yok.</p>
        </div>
        <div className="getting-started-progress" aria-label={`Başlangıç ilerlemesi yüzde ${percent}`}>
          <strong>%{percent}</strong>
          <span>{steps.filter((step) => step.complete).length}/{steps.length}</span>
        </div>
      </div>

      <div className="getting-started-meter" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>

      <div className="getting-started-grid">
        {steps.map((step, index) => (
          <NavLink key={step.id} to={step.to} className={`getting-started-step ${step.complete ? "complete" : ""}`}>
            <span className="getting-started-index">{step.complete ? "✓" : String(index + 1).padStart(2, "0")}</span>
            <span><strong>{step.title}</strong><small>{step.description}</small></span>
            <span aria-hidden="true">→</span>
          </NavLink>
        ))}
      </div>

      <button type="button" className="getting-started-dismiss" onClick={() => { localStorage.setItem(DISMISSED_KEY, "true"); setDismissed(true); }}>
        Bu paneli gizle
      </button>
    </section>
  );
}
