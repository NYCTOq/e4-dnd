import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePersistentState } from "../state/usePersistentState";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

const FIRST_RUN_STORAGE_KEY = "e4_dnd_first_run_guide_v1";

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as NavigatorWithStandalone).standalone)
  );
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PwaInstallGuide() {
  const [guideCompleted, setGuideCompleted] = usePersistentState(
    FIRST_RUN_STORAGE_KEY,
    false,
  );
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [networkNotice, setNetworkNotice] = useState<"offline" | "online" | null>(
    null,
  );
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);

  const isIos = useMemo(isIosDevice, []);

  useEffect(() => {
    if (!guideCompleted) {
      const timeoutId = window.setTimeout(() => setIsGuideOpen(true), 650);
      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [guideCompleted]);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstallEvent(null);
      setIsInstalled(true);
      setGuideCompleted(true);
      setIsGuideOpen(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [setGuideCompleted]);

  useEffect(() => {
    let hideNoticeTimeout: number | undefined;

    function updateNetworkState(nextOnlineState: boolean) {
      setIsOnline(nextOnlineState);
      setNetworkNotice(nextOnlineState ? "online" : "offline");

      if (hideNoticeTimeout) {
        window.clearTimeout(hideNoticeTimeout);
      }

      if (nextOnlineState) {
        hideNoticeTimeout = window.setTimeout(
          () => setNetworkNotice(null),
          3200,
        );
      }
    }

    const handleOnline = () => updateNetworkState(true);
    const handleOffline = () => updateNetworkState(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (hideNoticeTimeout) {
        window.clearTimeout(hideNoticeTimeout);
      }
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installEvent) {
      return;
    }

    setIsInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome === "accepted") {
        setInstallEvent(null);
        setGuideCompleted(true);
        setIsGuideOpen(false);
      }
    } finally {
      setIsInstalling(false);
    }
  }, [installEvent, setGuideCompleted]);

  const handleFinishGuide = useCallback(() => {
    setGuideCompleted(true);
    setIsGuideOpen(false);
  }, [setGuideCompleted]);

  return (
    <>
      {!isOnline ? (
        <div className="network-status-pill offline" role="status">
          Ã‡evrimdÄ±ÅŸÄ± mod
        </div>
      ) : null}

      {networkNotice ? (
        <section className={`network-status-toast ${networkNotice}`} role="status">
          <strong>
            {networkNotice === "offline"
              ? "BaÄŸlantÄ± kesildi"
              : "BaÄŸlantÄ± geri geldi"}
          </strong>
          <span>
            {networkNotice === "offline"
              ? "KayÄ±tlÄ± iÃ§eriklerle Ã§alÄ±ÅŸmaya devam edebilirsin. DeÄŸiÅŸiklikler bu cihazda saklanÄ±r."
              : "Uygulama yeniden Ã§evrimiÃ§i. PWA gÃ¼ncellemeleri tekrar kontrol edilebilir."}
          </span>
          {networkNotice === "offline" ? (
            <button type="button" onClick={() => setNetworkNotice(null)}>
              Kapat
            </button>
          ) : null}
        </section>
      ) : null}

      {guideCompleted && !isInstalled ? (
        <button
          type="button"
          className="first-run-help-button"
          onClick={() => setIsGuideOpen(true)}
        >
          Kurulum
        </button>
      ) : null}

      {isGuideOpen ? (
        <div className="first-run-overlay" role="presentation">
          <section
            className="first-run-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="first-run-title"
          >
            <div className="first-run-head">
              <div>
                <span className="mini-label">Ä°lk kullanÄ±m</span>
                <h2 id="first-run-title">E4 D&D hazÄ±r</h2>
                <p>
                  Verilerin bu cihazda tutulur. Uygulama Ã§evrimdÄ±ÅŸÄ± Ã§alÄ±ÅŸabilir ve
                  desteklenen cihazlarda normal bir uygulama gibi kurulabilir.
                </p>
              </div>

              <button
                type="button"
                className="first-run-close"
                aria-label="Rehberi kapat"
                onClick={handleFinishGuide}
              >
                Ã—
              </button>
            </div>

            <div className="first-run-grid">
              <article>
                <span>01</span>
                <strong>Yerel ve hÄ±zlÄ±</strong>
                <p>
                  Karakter, campaign ve homebrew kayÄ±tlarÄ± localStorage iÃ§inde
                  saklanÄ±r. AynÄ± tarayÄ±cÄ± ve portu kullanmak gerekir.
                </p>
              </article>

              <article>
                <span>02</span>
                <strong>YedeÄŸi unutma</strong>
                <p>
                  Backup sayfasÄ±ndan tam JSON yedeÄŸi al. TarayÄ±cÄ± verisini
                  temizlemek, insanlÄ±ÄŸÄ±n dijital hafÄ±za kaybÄ± yÃ¶ntemidir.
                </p>
              </article>

              <article>
                <span>03</span>
                <strong>Masaya kur</strong>
                <p>
                  PWA kurulursa tam ekran aÃ§Ä±lÄ±r ve Ã§evrimdÄ±ÅŸÄ± kullanÄ±m daha
                  rahat olur. Kurulum zorunlu deÄŸildir.
                </p>
              </article>
            </div>

            {isInstalled ? (
              <div className="install-state-card success">
                <strong>Uygulama kurulu</strong>
                <span>E4 D&D ÅŸu anda baÄŸÄ±msÄ±z uygulama modunda Ã§alÄ±ÅŸÄ±yor.</span>
              </div>
            ) : installEvent ? (
              <div className="install-state-card">
                <div>
                  <strong>Bu cihaza kurulabilir</strong>
                  <span>TarayÄ±cÄ± kuruluma hazÄ±r. KayÄ±tlarÄ±n korunur.</span>
                </div>
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={isInstalling}
                >
                  {isInstalling ? "Kuruluyor..." : "UygulamayÄ± yÃ¼kle"}
                </button>
              </div>
            ) : isIos ? (
              <div className="install-state-card ios">
                <strong>iPhone / iPad kurulumu</strong>
                <span>
                  Safariâ€™de PaylaÅŸ dÃ¼ÄŸmesine dokun, ardÄ±ndan â€œAna Ekrana Ekleâ€
                  seÃ§eneÄŸini kullan.
                </span>
              </div>
            ) : (
              <div className="install-state-card muted">
                <strong>Kurulum dÃ¼ÄŸmesi gÃ¶rÃ¼nmÃ¼yor</strong>
                <span>
                  Uygulama zaten kurulu olabilir veya tarayÄ±cÄ± PWA kurulumunu
                  henÃ¼z sunmamÄ±ÅŸ olabilir. Normal kullanÄ±m devam eder.
                </span>
              </div>
            )}

            <div className="first-run-actions">
              <Link className="secondary-action" to="/backup" onClick={handleFinishGuide}>
                Backup sayfasÄ±
              </Link>
              <button type="button" onClick={handleFinishGuide}>
                AnladÄ±m, devam et
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

