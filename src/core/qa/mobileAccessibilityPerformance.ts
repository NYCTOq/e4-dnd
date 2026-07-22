export type AccessibilityPerformanceInput = {
  viewportWidth: number;
  scrollWidth: number;
  clientWidth: number;
  interactiveTargetSizes: number[];
  hasSkipLink: boolean;
  mainIsFocusable: boolean;
  visibleFocusStyle: boolean;
  reducedMotionSupported: boolean;
  renderedCatalogItems: number;
  totalCatalogItems: number;
};

export type AccessibilityPerformanceReport = {
  score: number;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
};

const MIN_TOUCH_TARGET = 44;
const LARGE_CATALOG_THRESHOLD = 120;
const SAFE_RENDER_BUDGET = 80;

export function getCatalogRenderBudget(totalItems: number, queryActive = false) {
  if (queryActive) return Math.max(1, totalItems);
  return totalItems > LARGE_CATALOG_THRESHOLD ? SAFE_RENDER_BUDGET : Math.max(1, totalItems);
}

export function getAccessibilityPerformanceReport(
  input: AccessibilityPerformanceInput,
): AccessibilityPerformanceReport {
  const blockers: string[] = [];
  const notices: string[] = [];
  let completedChecks = 0;
  const totalChecks = 8;

  const hasHorizontalOverflow = input.scrollWidth > input.clientWidth + 1;
  if (hasHorizontalOverflow) blockers.push("Sayfada yatay taşma var.");
  else completedChecks += 1;

  const smallTargets = input.interactiveTargetSizes.filter((size) => size < MIN_TOUCH_TARGET);
  if (smallTargets.length > 0) blockers.push(`${smallTargets.length} dokunmatik hedef 44 px altında.`);
  else completedChecks += 1;

  if (!input.hasSkipLink) blockers.push("Ana içeriğe geç bağlantısı eksik.");
  else completedChecks += 1;

  if (!input.mainIsFocusable) blockers.push("Ana içerik programatik olarak odaklanamıyor.");
  else completedChecks += 1;

  if (!input.visibleFocusStyle) blockers.push("Klavye odağı görünür değil.");
  else completedChecks += 1;

  if (!input.reducedMotionSupported) blockers.push("Azaltılmış hareket tercihi desteklenmiyor.");
  else completedChecks += 1;

  const renderBudget = getCatalogRenderBudget(input.totalCatalogItems);
  if (input.renderedCatalogItems > renderBudget) {
    blockers.push(`Katalog render bütçesi aşıldı: ${input.renderedCatalogItems}/${renderBudget}.`);
  } else completedChecks += 1;

  if (input.viewportWidth <= 700) notices.push("Mobil viewport denetimi uygulandı.");
  completedChecks += 1;

  const score = Math.round((completedChecks / totalChecks) * 100);
  return {
    score,
    ready: blockers.length === 0,
    blockers,
    notices,
    completedChecks,
    totalChecks,
  };
}
