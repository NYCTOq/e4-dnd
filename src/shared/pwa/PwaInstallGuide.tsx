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
          Çevrimdışı mod
        </div>
      ) : null}

      {networkNotice ? (
        <section className={`network-status-toast ${networkNotice}`} role="status">
          <strong>
            {networkNotice === "offline"
              ? "Bağlantı kesildi"
              : "Bağlantı geri geldi"}
          </strong>
          <span>
            {networkNotice === "offline"
              ? "Kayıtlı içeriklerle çalışmaya devam edebilirsin. Değişiklikler bu cihazda saklanır."
              : "Uygulama yeniden çevrimiçi. PWA güncellemeleri tekrar kontrol edilebilir."}
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
                <span className="mini-label">İlk kullanım</span>
                <h2 id="first-run-title">E4 D&D hazır</h2>
                <p>
                  Verilerin bu cihazda tutulur. Uygulama çevrimdışı çalışabilir ve
                  desteklenen cihazlarda normal bir uygulama gibi kurulabilir.
                </p>
              </div>

              <button
                type="button"
                className="first-run-close"
                aria-label="Rehberi kapat"
                onClick={handleFinishGuide}
              >
                ×
              </button>
            </div>

            <div className="first-run-grid">
              <article>
                <span>01</span>
                <strong>Yerel ve hızlı</strong>
                <p>
                  Karakter, campaign ve homebrew kayıtları localStorage içinde
                  saklanır. Aynı tarayıcı ve portu kullanmak gerekir.
                </p>
              </article>

              <article>
                <span>02</span>
                <strong>Yedeği unutma</strong>
                <p>
                  Backup sayfasından tam JSON yedeği al. Tarayıcı verisini
                  temizlemek, insanlığın dijital hafıza kaybı yöntemidir.
                </p>
              </article>

              <article>
                <span>03</span>
                <strong>Masaya kur</strong>
                <p>
                  PWA kurulursa tam ekran açılır ve çevrimdışı kullanım daha
                  rahat olur. Kurulum zorunlu değildir.
                </p>
              </article>
            </div>

            {isInstalled ? (
              <div className="install-state-card success">
                <strong>Uygulama kurulu</strong>
                <span>E4 D&D şu anda bağımsız uygulama modunda çalışıyor.</span>
              </div>
            ) : installEvent ? (
              <div className="install-state-card">
                <div>
                  <strong>Bu cihaza kurulabilir</strong>
                  <span>Tarayıcı kuruluma hazır. Kayıtların korunur.</span>
                </div>
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={isInstalling}
                >
                  {isInstalling ? "Kuruluyor..." : "Uygulamayı yükle"}
                </button>
              </div>
            ) : isIos ? (
              <div className="install-state-card ios">
                <strong>iPhone / iPad kurulumu</strong>
                <span>
                  Safari’de Paylaş düğmesine dokun, ardından “Ana Ekrana Ekle”
                  seçeneğini kullan.
                </span>
              </div>
            ) : (
              <div className="install-state-card muted">
                <strong>Kurulum düğmesi görünmüyor</strong>
                <span>
                  Uygulama zaten kurulu olabilir veya tarayıcı PWA kurulumunu
                  henüz sunmamış olabilir. Normal kullanım devam eder.
                </span>
              </div>
            )}

            <div className="first-run-actions">
              <Link className="secondary-action" to="/backup" onClick={handleFinishGuide}>
                Backup sayfası
              </Link>
              <button type="button" onClick={handleFinishGuide}>
                Anladım, devam et
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
