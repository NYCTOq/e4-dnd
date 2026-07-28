export type OnboardingSignals = {
  characterCount: number;
  hasOpenedPlayMode: boolean;
  hasBackup: boolean;
  isInstalled: boolean;
};

export type OnboardingStep = {
  id: "character" | "play" | "backup" | "install";
  title: string;
  description: string;
  to: string;
  complete: boolean;
};

export function getOnboardingSteps(signals: OnboardingSignals): OnboardingStep[] {
  return [
    {
      id: "character",
      title: "İlk karakterini oluştur",
      description: "Builder ile ruleset, class, subclass ve temel seçimleri tamamla.",
      to: "/builder",
      complete: signals.characterCount > 0,
    },
    {
      id: "play",
      title: "Play Mode'u aç",
      description: "HP, kaynak, condition ve oturum akışını masa ekranında kullan.",
      to: "/play-mode",
      complete: signals.hasOpenedPlayMode,
    },
    {
      id: "backup",
      title: "İlk yedeğini al",
      description: "Tarayıcı verisi fanidir. Tam JSON yedeğini güvenli bir yerde tut.",
      to: "/backup",
      complete: signals.hasBackup,
    },
    {
      id: "install",
      title: "Uygulamayı kur",
      description: "Desteklenen cihazlarda PWA olarak kur ve çevrimdışı erişimi kolaylaştır.",
      to: "/settings",
      complete: signals.isInstalled,
    },
  ];
}

export function getOnboardingPercent(steps: OnboardingStep[]) {
  if (!steps.length) return 0;
  return Math.round((steps.filter((step) => step.complete).length / steps.length) * 100);
}
