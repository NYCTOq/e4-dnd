import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, v) => fs.writeFileSync(p, v);
const mustReplace = (source, from, to, label) => {
  if (!source.includes(from)) throw new Error(`[v5.130] ${label} anchor not found`);
  return source.replace(from, to);
};

// 1) ClassFeaturePanel: rest controls + live feedback.
{
  const file = 'src/components/classFeatures/ClassFeaturePanel.tsx';
  let s = read(file);
  s = mustReplace(s,
    'import { useMemo } from "react";',
    'import { useMemo, useState } from "react";',
    'panel react import');
  s = mustReplace(s,
    '  buildClassRuntimeSnapshot,\n  type ClassCompatibleCharacter,',
    '  applyClassFeatureRest,\n  buildClassRuntimeSnapshot,\n  type ClassCompatibleCharacter,',
    'panel adapter import');
  s = mustReplace(s,
    '  const snapshot = useMemo(',
    '  const [restFeedback, setRestFeedback] = useState("");\n\n  const snapshot = useMemo(',
    'panel state');
  s = mustReplace(s,
    '  const mutate = (featureId: string, mode: "spend" | "restore") => {\n    onCharacterChange(\n      mutateCharacterFeature(character, featureId, mode) as T,\n    );\n  };',
    `  const mutate = (featureId: string, mode: "spend" | "restore") => {\n    onCharacterChange(\n      mutateCharacterFeature(character, featureId, mode) as T,\n    );\n    setRestFeedback(mode === "spend" ? "Sınıf özelliği kullanıldı." : "Sınıf özelliği yenilendi.");\n  };\n\n  const recoverByRest = (rest: "short" | "long") => {\n    const before = snapshot.unlockedFeatures.reduce(\n      (sum, feature) => sum + (feature.currentUses ?? 0),\n      0,\n    );\n    const next = applyClassFeatureRest(character, rest) as T;\n    const after = buildClassRuntimeSnapshot(next).unlockedFeatures.reduce(\n      (sum, feature) => sum + (feature.currentUses ?? 0),\n      0,\n    );\n    onCharacterChange(next);\n    const restored = Math.max(0, after - before);\n    const restLabel = rest === "short" ? "Kısa" : "Uzun";\n    setRestFeedback(\n      restored > 0\n        ? restLabel + " dinlenme: " + restored + " kullanım yenilendi."\n        : restLabel + " dinlenmede yenilenecek kullanım yok.",\n    );\n  };`,
    'panel mutation block');
  s = mustReplace(s,
    '      </header>\n\n      {snapshot.unlockedFeatures.length === 0 ? (',
    `      </header>\n\n      <div className="class-feature-panel__rest-controls" aria-label="Sınıf özelliği dinlenme yenilemeleri">\n        <button\n          type="button"\n          onClick={() => recoverByRest("short")}\n          data-testid="class-feature-short-rest"\n        >\n          Kısa Dinlenme\n        </button>\n        <button\n          type="button"\n          onClick={() => recoverByRest("long")}\n          data-testid="class-feature-long-rest"\n        >\n          Uzun Dinlenme\n        </button>\n      </div>\n\n      <p\n        className="class-feature-panel__feedback"\n        role="status"\n        aria-live="polite"\n        data-testid="class-feature-feedback"\n      >\n        {restFeedback}\n      </p>\n\n      {snapshot.unlockedFeatures.length === 0 ? (`,
    'panel rest controls');
  write(file, s);
}

// 2) Styling.
{
  const file = 'src/styles/47-class-feature-panel.css';
  let s = read(file);
  const marker = '/* v5.130 class runtime completion */';
  if (!s.includes(marker)) {
    s += `\n\n${marker}\n.class-feature-panel__rest-controls{display:flex;flex-wrap:wrap;gap:.5rem;margin:.75rem 0}.class-feature-panel__rest-controls button{min-height:44px;padding:.55rem .8rem}.class-feature-panel__feedback{min-height:1.25rem;margin:.25rem 0 .75rem;font-size:.875rem;opacity:.86}\n`;
  }
  write(file, s);
}

// 3) Package scripts/version.
{
  const file = 'package.json';
  const pkg = JSON.parse(read(file));
  pkg.version = '5.130.0';
  pkg.scripts ??= {};
  pkg.scripts['test:class-runtime-completion'] = 'vitest run src/core/rulesets/classRuntimeCompletion-v5.130.test.ts';
  pkg.scripts['certify:class-runtime-completion'] = 'npm run test:class-runtime-completion && npm run build';
  write(file, JSON.stringify(pkg, null, 2) + '\n');
}

console.log('[v5.130] Class runtime completion installed.');
