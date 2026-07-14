import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

type NoticeKind = "update" | "offline" | "cache" | null;

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function PwaUpdateManager() {
  const [notice, setNotice] = useState<NoticeKind>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const updateServiceWorkerRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNotice("update");
      },
      onOfflineReady() {
        setNotice((current) => current ?? "offline");
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) {
          return;
        }

        const intervalId = window.setInterval(() => {
          if (navigator.onLine) {
            void registration.update();
          }
        }, UPDATE_CHECK_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
      },
      onRegisterError(error) {
        console.error("PWA service worker kaydÄ± baÅŸarÄ±sÄ±z:", error);
      },
    });

    updateServiceWorkerRef.current = updateServiceWorker;
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!updateServiceWorkerRef.current) {
      return;
    }

    setIsUpdating(true);

    try {
      await updateServiceWorkerRef.current(true);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const handleClearPwaCache = useCallback(async () => {
    const confirmed = window.confirm(
      "PWA Ã¶nbelleÄŸi temizlenip uygulama yeniden baÅŸlatÄ±lsÄ±n mÄ±? Karakter, campaign ve homebrew kayÄ±tlarÄ±n korunur.",
    );

    if (!confirmed) {
      return;
    }

    setIsClearing(true);

    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      setNotice("cache");
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      console.error("PWA cache temizlenemedi:", error);
      window.alert("PWA Ã¶nbelleÄŸi temizlenemedi. TarayÄ±cÄ± ayarlarÄ±ndan site verilerini temizlemeyi deneyebilirsin.");
      setIsClearing(false);
    }
  }, []);

  return (
    <>
      <button
        type="button"
        className="pwa-tools-button"
        aria-expanded={isToolsOpen}
        onClick={() => setIsToolsOpen((current) => !current)}
      >
        PWA
      </button>

      {isToolsOpen ? (
        <section className="pwa-tools-panel" aria-label="PWA araÃ§larÄ±">
          <div>
            <strong>PWA araÃ§larÄ±</strong>
            <span>GÃ¼ncelleme veya eski cache sorunlarÄ±nda kullan.</span>
          </div>

          <button
            type="button"
            onClick={handleClearPwaCache}
            disabled={isClearing}
          >
            {isClearing ? "Temizleniyor..." : "Cache temizle ve yenile"}
          </button>
        </section>
      ) : null}

      {notice ? (
        <section className={`pwa-update-toast ${notice}`} role="status">
          <div>
            <strong>
              {notice === "update"
                ? "Yeni E4 D&D sÃ¼rÃ¼mÃ¼ hazÄ±r"
                : notice === "offline"
                  ? "Ã‡evrimdÄ±ÅŸÄ± kullanÄ±m hazÄ±r"
                  : "PWA Ã¶nbelleÄŸi temizlendi"}
            </strong>
            <span>
              {notice === "update"
                ? "GÃ¼ncelleme, aÃ§Ä±k verilerini localStorage iÃ§inde koruyarak uygulamayÄ± yeniden baÅŸlatÄ±r."
                : notice === "offline"
                  ? "Uygulama baÄŸlantÄ± olmadan da aÃ§Ä±labilir. Ä°nsanlÄ±k interneti kesmeyi baÅŸarsa bile zarlar Ã§alÄ±ÅŸacak."
                  : "Uygulama temiz dosyalarla yeniden baÅŸlatÄ±lÄ±yor."}
            </span>
          </div>

          <div className="pwa-update-actions">
            {notice === "update" ? (
              <button type="button" onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? "GÃ¼ncelleniyor..." : "GÃ¼ncelle ve yeniden baÅŸlat"}
              </button>
            ) : null}

            {notice !== "cache" ? (
              <button
                type="button"
                className="secondary-action"
                onClick={() => setNotice(null)}
              >
                {notice === "update" ? "Sonra" : "Kapat"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

