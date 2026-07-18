import type { HomebrewPackage } from "./homebrewFoundation";
import type { HomebrewShareManifest } from "./homebrewPackageSharing";

export type HomebrewMarketplaceTrustLevel = "trusted" | "community" | "blocked";

export type HomebrewMarketplaceSource = {
  id: string;
  name: string;
  baseUrl?: string;
  trustLevel: HomebrewMarketplaceTrustLevel;
  publicKeyJwk?: JsonWebKey;
  enabled: boolean;
  addedAt: string;
  syncIntervalHours?: number;
  lastSyncedAt?: string;
  lastSyncError?: string;
};

export type HomebrewMarketplaceEnvelope = {
  format: "e4-dnd-homebrew-marketplace";
  schemaVersion: 1;
  sourceId: string;
  createdAt: string;
  manifest: HomebrewShareManifest;
  integrity: {
    algorithm: "SHA-256";
    checksum: string;
    signerId?: string;
    signature?: string;
  };
};

export type HomebrewMarketplaceVerification = {
  valid: boolean;
  trusted: boolean;
  checksumValid: boolean;
  signatureValid: boolean | null;
  blockers: string[];
  warnings: string[];
  source?: HomebrewMarketplaceSource;
};

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob !== "function") throw new Error("Base64 decoder kullanılamıyor.");
  return Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0));
}

export async function calculateHomebrewManifestChecksum(manifest: HomebrewShareManifest): Promise<string> {
  const data = new TextEncoder().encode(canonicalize(manifest));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

export function normalizeHomebrewMarketplaceSources(sources: HomebrewMarketplaceSource[]): HomebrewMarketplaceSource[] {
  const seen = new Set<string>();
  return sources.flatMap((source) => {
    const id = source.id.trim();
    if (!id || seen.has(id)) return [];
    seen.add(id);
    return [{
      ...source,
      id,
      name: source.name.trim() || id,
      trustLevel: source.trustLevel ?? "community",
      enabled: source.enabled !== false,
      addedAt: source.addedAt || new Date().toISOString(),
      syncIntervalHours: Math.max(1, source.syncIntervalHours ?? 24),
    }];
  });
}

export async function createHomebrewMarketplaceEnvelope(
  manifest: HomebrewShareManifest,
  sourceId: string,
): Promise<HomebrewMarketplaceEnvelope> {
  return {
    format: "e4-dnd-homebrew-marketplace",
    schemaVersion: 1,
    sourceId,
    createdAt: new Date().toISOString(),
    manifest: structuredClone(manifest),
    integrity: {
      algorithm: "SHA-256",
      checksum: await calculateHomebrewManifestChecksum(manifest),
    },
  };
}

async function verifySignature(envelope: HomebrewMarketplaceEnvelope, source: HomebrewMarketplaceSource): Promise<boolean | null> {
  if (!envelope.integrity.signature) return null;
  if (!source.publicKeyJwk) return false;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      source.publicKeyJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      base64ToBytes(envelope.integrity.signature) as BufferSource,
      new TextEncoder().encode(envelope.integrity.checksum),
    );
  } catch {
    return false;
  }
}

export async function verifyHomebrewMarketplaceEnvelope(
  envelope: HomebrewMarketplaceEnvelope,
  sources: HomebrewMarketplaceSource[],
): Promise<HomebrewMarketplaceVerification> {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (envelope.format !== "e4-dnd-homebrew-marketplace") blockers.push("Geçersiz marketplace envelope formatı.");
  if (envelope.schemaVersion !== 1) blockers.push("Desteklenmeyen marketplace envelope şema sürümü.");
  if (envelope.integrity.algorithm !== "SHA-256") blockers.push("Desteklenmeyen paket bütünlük algoritması.");
  const source = sources.find((entry) => entry.id === envelope.sourceId);
  if (!source) blockers.push(`Marketplace kaynağı kayıtlı değil: ${envelope.sourceId}`);
  if (source && !source.enabled) blockers.push(`${source.name} kaynağı devre dışı.`);
  if (source?.trustLevel === "blocked") blockers.push(`${source.name} kaynağı engellenmiş.`);
  const checksum = await calculateHomebrewManifestChecksum(envelope.manifest);
  const checksumValid = checksum.toLowerCase() === envelope.integrity.checksum.toLowerCase();
  if (!checksumValid) blockers.push("Marketplace paket checksum doğrulaması başarısız.");
  const signatureValid = source ? await verifySignature(envelope, source) : null;
  if (envelope.integrity.signature && signatureValid === false) blockers.push("Marketplace dijital imza doğrulaması başarısız.");
  if (!envelope.integrity.signature) warnings.push("Paket dijital imza içermiyor; yalnızca checksum doğrulandı.");
  if (source?.trustLevel === "community") warnings.push(`${source.name} topluluk kaynağıdır; içeriği kurmadan önce incele.`);
  return {
    valid: blockers.length === 0,
    trusted: source?.trustLevel === "trusted" && checksumValid && (signatureValid !== false),
    checksumValid,
    signatureValid,
    blockers,
    warnings,
    source,
  };
}

export function resolveVerifiedMarketplacePackages(
  verification: HomebrewMarketplaceVerification,
  envelope: HomebrewMarketplaceEnvelope,
): HomebrewPackage[] {
  if (!verification.valid) throw new Error(verification.blockers.join(" "));
  return envelope.manifest.packages.map((entry) => structuredClone(entry.package));
}

export function importHomebrewMarketplaceEnvelope(raw: string): HomebrewMarketplaceEnvelope {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Marketplace envelope geçerli JSON değil."); }
  if (!parsed || typeof parsed !== "object") throw new Error("Marketplace envelope nesne olmalıdır.");
  return parsed as HomebrewMarketplaceEnvelope;
}
