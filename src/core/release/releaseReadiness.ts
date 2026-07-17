import type { Character } from "../character/character.types";
import { auditCharacterIntegrity } from "../character/characterIntegrity";
import { getLevel20Certification } from "../rulesets/level20Certification";
import type { RulesetData } from "../rulesets/ruleset.types";
import { getRuntimeCoverageCertification } from "../rulesets/runtimeCoverageCertification";

export type ReleaseCheckStatus = "pass" | "warning" | "fail";
export type ReleaseCheck = { id: string; label: string; status: ReleaseCheckStatus; detail: string };
export type ReleaseReadiness = { score: number; status: "ready" | "needs-attention"; checks: ReleaseCheck[]; blockers: string[] };

export function getReleaseReadiness(characters: Character[], rulesetData: RulesetData | null): ReleaseReadiness {
  const level20 = getLevel20Certification(rulesetData);
  const runtime = getRuntimeCoverageCertification(rulesetData);
  const reports = characters.map((character) => auditCharacterIntegrity(character, rulesetData));
  const readyCharacters = reports.filter((report) => report.status === "ready").length;
  const checks: ReleaseCheck[] = [
    { id: "ruleset", label: "Ruleset verisi", status: rulesetData ? "pass" : "fail", detail: rulesetData ? `${rulesetData.name} yüklü` : "Ruleset yüklenemedi" },
    { id: "level-20", label: "Level 1–20 kapsamı", status: level20.certified ? "pass" : "fail", detail: `${level20.score}/100 sertifika skoru` },
    { id: "runtime", label: "Runtime kapsamı", status: runtime.status === "certified" ? "pass" : runtime.score >= 50 ? "warning" : "fail", detail: `${runtime.score}/100 · ${runtime.priorities.length} öncelikli açık` },
    { id: "characters", label: "Test karakterleri", status: characters.length ? "pass" : "warning", detail: characters.length ? `${characters.length} karakter denetlendi` : "Henüz kayıtlı test karakteri yok" },
    { id: "integrity", label: "Karakter bütünlüğü", status: !characters.length ? "warning" : readyCharacters === characters.length ? "pass" : "fail", detail: `${readyCharacters}/${characters.length} karakter oynanmaya hazır` },
    { id: "privacy", label: "Güvenli tanı çıktısı", status: "pass", detail: "İsim, oyuncu adı ve serbest notlar rapora alınmaz" },
  ];
  const score = Math.round(checks.reduce((sum, check) => sum + (check.status === "pass" ? 1 : check.status === "warning" ? 0.5 : 0), 0) / checks.length * 100);
  const blockers = [
    ...checks.filter((check) => check.status === "fail").map((check) => `${check.label}: ${check.detail}`),
    ...level20.blockers.slice(0, 12),
  ];
  return { score, status: blockers.length ? "needs-attention" : "ready", checks, blockers };
}
