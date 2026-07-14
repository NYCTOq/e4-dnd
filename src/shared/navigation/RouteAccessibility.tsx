import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { navItems } from "./navItems";

function getPageLabel(pathname: string) {
  const exact = navItems.find((item) => item.to === pathname);

  if (exact) {
    return exact.label;
  }

  if (pathname.startsWith("/characters/")) {
    return pathname.endsWith("/edit") ? "Karakter Düzenle" : "Karakter Detayı";
  }

  if (pathname.startsWith("/monsters/")) {
    return "Canavar Detayı";
  }

  return "E4 D&D";
}

export function RouteAccessibility() {
  const location = useLocation();
  const liveRegionRef = useRef<HTMLParagraphElement>(null);
  const pageLabel = useMemo(
    () => getPageLabel(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    document.title = `${pageLabel} | E4 D&D`;

    const main = document.getElementById("main-content");

    if (main) {
      main.focus({ preventScroll: true });
    }

    const timeoutId = window.setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = `${pageLabel} sayfası açıldı.`;
      }
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [pageLabel]);

  return (
    <p
      ref={liveRegionRef}
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    />
  );
}
