$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.134D1 Session Play Loop PowerShell Hotfix starting..."

if (-not (Test-Path ".\package.json")) { throw "Run this script from D:\Projects\e4_dnd" }

$requiredFiles = @(
  ".\src\core\session\sessionPlayLoop.ts",
  ".\src\core\session\sessionPlayLoop-v5.134.test.ts",
  ".\src\styles\41-session-play-loop.css"
)
foreach ($file in $requiredFiles) {
  if (-not (Test-Path $file)) { throw "v5.134D1 required patch file missing: $file" }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Replace-Once {
  param(
    [Parameter(Mandatory=$true)][string]$Text,
    [Parameter(Mandatory=$true)][string]$Old,
    [Parameter(Mandatory=$true)][string]$New,
    [Parameter(Mandatory=$true)][string]$Label
  )
  if ($Text.Contains($New)) { return $Text }
  $index = $Text.IndexOf($Old, [System.StringComparison]::Ordinal)
  if ($index -lt 0) { throw "v5.134D1 anchor missing: $Label" }
  return $Text.Substring(0, $index) + $New + $Text.Substring($index + $Old.Length)
}

$playPath = ".\src\features\play-mode\PlayMode.tsx"
if (-not (Test-Path $playPath)) { throw "v5.134D1 PlayMode.tsx missing" }
$play = [System.IO.File]::ReadAllText($playPath)

$old = 'import { getSpellBehavior } from "../../core/rulesets/spellBehaviorRules";'
$new = $old + "`n" + 'import { appendSessionEvent, clearPlaySession, endPlaySession, ensurePlaySession, getSessionSummary, savePlaySession, type PlaySession } from "../../core/session/sessionPlayLoop";'
$play = Replace-Once $play $old $new "session import"

$old = '  const [undoRevision, setUndoRevision] = useState(0);'
$new = $old + "`n" + '  const [sessionRevision, setSessionRevision] = useState(0);'
$play = Replace-Once $play $old $new "session revision state"

$old = '  const capstoneSummary=getCapstoneSummary(activeCharacter.className,activeCharacter.level,activeCharacter.ruleset);'
$new = $old + "`n" + '  const playSession: PlaySession = ensurePlaySession(activeCharacter.id, activeCharacter.name);' + "`n" + '  const sessionSummary = getSessionSummary(playSession);' + "`n" + '  void sessionRevision;'
$play = Replace-Once $play $old $new "session summary"

$old = "    setActionFeedback(label);`n    setUndoRevision((value) => value + 1);"
$new = '    const nextSession = appendSessionEvent(ensurePlaySession(activeCharacter.id, activeCharacter.name), label, { round: combatTurn.round, turn: combatTurn.turn });' + "`n" + '    savePlaySession(nextSession);' + "`n" + '    setSessionRevision((value) => value + 1);' + "`n" + '    setActionFeedback(label);' + "`n" + '    setUndoRevision((value) => value + 1);'
$play = Replace-Once $play $old $new "commit session event"

$panelMarker = '        <section className="session-play-loop" data-testid="session-play-loop" aria-label="Oyun oturumu özeti">'
if (-not $play.Contains($panelMarker)) {
  $old = '        <header className="play-mode-toolbar">'
  $panel = @'
        <section className="session-play-loop" data-testid="session-play-loop" aria-label="Oyun oturumu özeti">
          <div className="session-play-loop-head"><div><span className="mini-label">Session Play Loop</span><h2>{sessionSummary.active ? "Oturum devam ediyor" : "Oturum tamamlandı"}</h2><small>{new Date(playSession.startedAt).toLocaleString("tr-TR")} · {sessionSummary.total} kayıt</small></div><div className="session-play-loop-actions">{sessionSummary.active ? <button type="button" data-testid="session-end" onClick={()=>{savePlaySession(endPlaySession(playSession));setSessionRevision(value=>value+1);setActionFeedback("Oyun oturumu tamamlandı")}}>Oturumu Bitir</button> : <button type="button" data-testid="session-new" onClick={()=>{clearPlaySession(activeCharacter.id);ensurePlaySession(activeCharacter.id,activeCharacter.name);setSessionRevision(value=>value+1);setActionFeedback("Yeni oyun oturumu başlatıldı")}}>Yeni Oturum</button>}<button type="button" onClick={()=>{clearPlaySession(activeCharacter.id);ensurePlaySession(activeCharacter.id,activeCharacter.name);setSessionRevision(value=>value+1)}}>Geçmişi Temizle</button></div></div>
          <div className="session-play-loop-stats"><div><span>Aksiyon</span><strong>{sessionSummary.counts.action + sessionSummary.counts.turn}</strong></div><div><span>Spell/Kaynak</span><strong>{sessionSummary.counts.spell + sessionSummary.counts.resource}</strong></div><div><span>Hasar/İyileştirme</span><strong>{sessionSummary.counts.damage + sessionSummary.counts.healing}</strong></div><div><span>Rest/Condition</span><strong>{sessionSummary.counts.rest + sessionSummary.counts.condition}</strong></div></div>
          <div className="session-play-loop-events" data-testid="session-event-list">{playSession.events.length ? playSession.events.slice(0,8).map(event=><div className="session-play-loop-event" key={event.id}><div><strong>{event.label}</strong><small>{event.kind} · Round {event.round ?? "-"} / Turn {event.turn ?? "-"}</small></div><time>{new Date(event.at).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</time></div>) : <small>İlk aksiyonla birlikte oturum kaydı başlayacak.</small>}</div>
        </section>

        <header className="play-mode-toolbar">
'@
  $play = Replace-Once $play $old $panel "session panel"
}
[System.IO.File]::WriteAllText($playPath, $play, $utf8NoBom)

$cssPath = ".\src\index.css"
if (-not (Test-Path $cssPath)) { throw "v5.134D1 src/index.css missing" }
$css = [System.IO.File]::ReadAllText($cssPath)
$import = '@import "./styles/41-session-play-loop.css";'
if (-not $css.Contains($import)) {
  $css = $css.TrimEnd() + "`n`n$import`n"
  [System.IO.File]::WriteAllText($cssPath, $css, $utf8NoBom)
}

$packagePath = ".\package.json"
$package = Get-Content $packagePath -Raw | ConvertFrom-Json
$package.version = "5.134.1"
if (-not $package.scripts) { throw "v5.134D1 package scripts missing" }
$package.scripts | Add-Member -NotePropertyName "test:session-play-loop" -NotePropertyValue "vitest run src/core/session/sessionPlayLoop-v5.134.test.ts" -Force
$package.scripts | Add-Member -NotePropertyName "certify:session-play-loop" -NotePropertyValue "npm run test:session-play-loop && npm run build" -Force
$packageJson = $package | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText($packagePath, $packageJson + "`n", $utf8NoBom)

Write-Host "v5.134D1 source changes applied without Python."
npm.cmd run certify:session-play-loop
if ($LASTEXITCODE -ne 0) { throw "v5.134D1 Session Play Loop certification failed." }
Write-Host "v5.134D1 GREEN - Session Play Loop closed; next target: Playable Gap Closure v5.135."
