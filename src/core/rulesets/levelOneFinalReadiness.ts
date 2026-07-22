export type ReadinessStatusLike = {
  applicable?: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
};

export type LevelOneFinalReadinessSection = {
  id: string;
  label: string;
  status: ReadinessStatusLike;
};

export type LevelOneFinalReadiness = {
  ready: boolean;
  readySections: number;
  applicableSections: number;
  completedChecks: number;
  totalChecks: number;
  blockerCount: number;
  noticeCount: number;
  score: number;
  blockingSections: string[];
  noticeSections: string[];
};

export function getLevelOneFinalReadiness(
  sections: LevelOneFinalReadinessSection[],
): LevelOneFinalReadiness {
  const applicable = sections.filter((section) => section.status.applicable !== false);
  const readySections = applicable.filter((section) => section.status.ready).length;
  const completedChecks = applicable.reduce((total, section) => total + Math.max(0, section.status.completedChecks), 0);
  const totalChecks = applicable.reduce((total, section) => total + Math.max(0, section.status.totalChecks), 0);
  const blockerCount = applicable.reduce((total, section) => total + section.status.blockers.length, 0);
  const noticeCount = applicable.reduce((total, section) => total + section.status.notices.length, 0);
  const blockingSections = applicable.filter((section) => !section.status.ready || section.status.blockers.length > 0).map((section) => section.label);
  const noticeSections = applicable.filter((section) => section.status.notices.length > 0).map((section) => section.label);
  const score = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  return {
    ready: applicable.length > 0 && blockingSections.length === 0,
    readySections,
    applicableSections: applicable.length,
    completedChecks,
    totalChecks,
    blockerCount,
    noticeCount,
    score,
    blockingSections,
    noticeSections,
  };
}
