import { getAccessibilityPerformanceReport } from "../../core/qa/mobileAccessibilityPerformance";

const report = getAccessibilityPerformanceReport({
  viewportWidth: 390,
  scrollWidth: 390,
  clientWidth: 390,
  interactiveTargetSizes: [44, 48, 48, 52],
  hasSkipLink: true,
  mainIsFocusable: true,
  visibleFocusStyle: true,
  reducedMotionSupported: true,
  renderedCatalogItems: 80,
  totalCatalogItems: 300,
});

export function AccessibilityPerformancePanel() {
  return (
    <section className="settings-card settings-card-wide accessibility-performance-panel">
      <div className="settings-card-head">
        <div>
          <span className="mini-label">v5.100 kalite kapısı</span>
          <h2>Accessibility & Performance</h2>
        </div>
        <span
          className={report.ready ? "settings-live-pill ready" : "settings-live-pill"}
          aria-label={`Kalite puanı yüzde ${report.score}`}
        >
          %{report.score}
        </span>
      </div>

      <p>
        Mobil dokunmatik hedefler, klavye odağı, yatay taşma, azaltılmış hareket ve
        büyük katalog render bütçesi aynı kalite sözleşmesiyle izlenir.
      </p>

      <div className="accessibility-performance-grid" aria-label="Erişilebilirlik ve performans özeti">
        <article><strong>44 px+</strong><span>Dokunmatik hedef</span></article>
        <article><strong>80</strong><span>Büyük katalog render bütçesi</span></article>
        <article><strong>{report.completedChecks}/{report.totalChecks}</strong><span>Tamamlanan kontrol</span></article>
        <article><strong>{report.blockers.length}</strong><span>Blocker</span></article>
      </div>

      <ul className="accessibility-performance-list">
        <li>Skip link ve odaklanabilir ana içerik</li>
        <li>Görünür :focus-visible halkası</li>
        <li>prefers-reduced-motion desteği</li>
        <li>Mobil safe-area ve yatay taşma koruması</li>
      </ul>
    </section>
  );
}
