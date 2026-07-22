export interface BuilderUiStep {
  id: string;
  title: string;
}

export function clampBuilderStepIndex(index: number, stepCount: number) {
  if (stepCount <= 0) return 0;
  return Math.min(stepCount - 1, Math.max(0, Math.trunc(index)));
}

export function getBuilderStepAnnouncement(steps: readonly BuilderUiStep[], index: number) {
  if (!steps.length) return "Builder adımı bulunmuyor";
  const safeIndex = clampBuilderStepIndex(index, steps.length);
  return `Adım ${safeIndex + 1}/${steps.length}: ${steps[safeIndex].title}`;
}

export function getBuilderMobileOverflowStatus(viewportWidth: number, contentWidth: number) {
  return {
    fitsViewport: contentWidth <= viewportWidth + 1,
    overflowPixels: Math.max(0, Math.round(contentWidth - viewportWidth)),
  };
}
