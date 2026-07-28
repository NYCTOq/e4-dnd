from pathlib import Path
import json
root=Path.cwd(); play=root/'src/features/play-mode/PlayMode.tsx'; text=play.read_text(encoding='utf-8')
def r(old,new):
 global text
 if old not in text: raise SystemExit(f'v5.134 anchor missing: {old[:100]}')
 text=text.replace(old,new,1)
r('import { getSpellBehavior } from "../../core/rulesets/spellBehaviorRules";', 'import { getSpellBehavior } from "../../core/rulesets/spellBehaviorRules";\nimport { appendSessionEvent, clearPlaySession, endPlaySession, ensurePlaySession, getSessionSummary, savePlaySession, type PlaySession } from "../../core/session/sessionPlayLoop";')
r('  const [undoRevision, setUndoRevision] = useState(0);', '  const [undoRevision, setUndoRevision] = useState(0);\n  const [sessionRevision, setSessionRevision] = useState(0);')
r('  const capstoneSummary=getCapstoneSummary(activeCharacter.className,activeCharacter.level,activeCharacter.ruleset);', '  const capstoneSummary=getCapstoneSummary(activeCharacter.className,activeCharacter.level,activeCharacter.ruleset);\n  const playSession: PlaySession = ensurePlaySession(activeCharacter.id, activeCharacter.name);\n  const sessionSummary = getSessionSummary(playSession);\n  void sessionRevision;')
r('    setActionFeedback(label);\n    setUndoRevision((value) => value + 1);', '    const nextSession = appendSessionEvent(ensurePlaySession(activeCharacter.id, activeCharacter.name), label, { round: combatTurn.round, turn: combatTurn.turn });\n    savePlaySession(nextSession);\n    setSessionRevision((value) => value + 1);\n    setActionFeedback(label);\n    setUndoRevision((value) => value + 1);')
panel='''        <section className="session-play-loop" data-testid="session-play-loop" aria-label="Oyun oturumu özeti">
          <div className="session-play-loop-head"><div><span className="mini-label">Session Play Loop</span><h2>{sessionSummary.active ? "Oturum devam ediyor" : "Oturum tamamlandı"}</h2><small>{new Date(playSession.startedAt).toLocaleString("tr-TR")} · {sessionSummary.total} kayıt</small></div><div className="session-play-loop-actions">{sessionSummary.active ? <button type="button" data-testid="session-end" onClick={()=>{savePlaySession(endPlaySession(playSession));setSessionRevision(value=>value+1);setActionFeedback("Oyun oturumu tamamlandı")}}>Oturumu Bitir</button> : <button type="button" data-testid="session-new" onClick={()=>{clearPlaySession(activeCharacter.id);ensurePlaySession(activeCharacter.id,activeCharacter.name);setSessionRevision(value=>value+1);setActionFeedback("Yeni oyun oturumu başlatıldı")}}>Yeni Oturum</button>}<button type="button" onClick={()=>{clearPlaySession(activeCharacter.id);ensurePlaySession(activeCharacter.id,activeCharacter.name);setSessionRevision(value=>value+1)}}>Geçmişi Temizle</button></div></div>
          <div className="session-play-loop-stats"><div><span>Aksiyon</span><strong>{sessionSummary.counts.action + sessionSummary.counts.turn}</strong></div><div><span>Spell/Kaynak</span><strong>{sessionSummary.counts.spell + sessionSummary.counts.resource}</strong></div><div><span>Hasar/İyileştirme</span><strong>{sessionSummary.counts.damage + sessionSummary.counts.healing}</strong></div><div><span>Rest/Condition</span><strong>{sessionSummary.counts.rest + sessionSummary.counts.condition}</strong></div></div>
          <div className="session-play-loop-events" data-testid="session-event-list">{playSession.events.length ? playSession.events.slice(0,8).map(event=><div className="session-play-loop-event" key={event.id}><div><strong>{event.label}</strong><small>{event.kind} · Round {event.round ?? "-"} / Turn {event.turn ?? "-"}</small></div><time>{new Date(event.at).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</time></div>) : <small>İlk aksiyonla birlikte oturum kaydı başlayacak.</small>}</div>
        </section>

        <header className="play-mode-toolbar">'''
r('        <header className="play-mode-toolbar">',panel)
play.write_text(text,encoding='utf-8')
css=root/'src/index.css'
if not css.exists(): raise SystemExit('v5.134 src/index.css missing')
c=css.read_text(encoding='utf-8')
if '41-session-play-loop.css' not in c: css.write_text(c+'\n@import "./styles/41-session-play-loop.css";\n',encoding='utf-8')
pkg=root/'package.json'; data=json.loads(pkg.read_text(encoding='utf-8')); data['version']='5.134.0'; data['scripts']['test:session-play-loop']='vitest run src/core/session/sessionPlayLoop-v5.134.test.ts'; data['scripts']['certify:session-play-loop']='npm run test:session-play-loop && npm run build'; pkg.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
