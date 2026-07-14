import { useEffect, useMemo, useState } from "react";
import type { Campaign } from "../campaigns/campaignTypes";
import { PageShell } from "../../shared/layout/PageShell";
import {
  createSessionPlan,
  getSessionProgress,
  loadSessionPlans,
  saveSessionPlans,
  type SessionPlan,
} from "./sessionPlannerStorage";

type SessionPlannerPageProps = {
  campaigns: Campaign[];
};

function sortPlans(plans: SessionPlan[]) {
  return [...plans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function SessionPlannerPage({ campaigns }: SessionPlannerPageProps) {
  const [plans, setPlans] = useState<SessionPlan[]>(() => sortPlans(loadSessionPlans()));
  const [selectedId, setSelectedId] = useState(() => plans[0]?.id ?? "");
  const selectedPlan = plans.find((plan) => plan.id === selectedId) ?? null;

  useEffect(() => {
    saveSessionPlans(plans);
  }, [plans]);

  const campaignMap = useMemo(() => new Map(campaigns.map((campaign) => [campaign.id, campaign.name])), [campaigns]);

  function updateSelected(updater: (plan: SessionPlan) => SessionPlan) {
    setPlans((current) => sortPlans(current.map((plan) => plan.id === selectedId
      ? { ...updater(plan), updatedAt: new Date().toISOString() }
      : plan)));
  }

  function addPlan() {
    const campaignId = campaigns[0]?.id ?? "";
    const plan = createSessionPlan(`Oturum ${plans.length + 1}`, campaignId);
    setPlans((current) => [plan, ...current]);
    setSelectedId(plan.id);
  }

  function deletePlan() {
    if (!selectedPlan || !confirm(`“${selectedPlan.title}” oturum planı silinsin mi?`)) return;
    const remaining = plans.filter((plan) => plan.id !== selectedPlan.id);
    setPlans(remaining);
    setSelectedId(remaining[0]?.id ?? "");
  }

  return (
    <PageShell
      eyebrow="DM hazırlığı"
      title="Session Planner"
      description="Oturum hedefini, sahne sırasını, yapılacakları, hızlı notları ve session recap metnini tek yerde tut. Sekiz ayrı not dosyası açmak artık strateji sayılmıyor."
    >
      <section className="session-planner-toolbar">
        <div>
          <strong>{plans.length}</strong>
          <span>Oturum planı</span>
        </div>
        <button type="button" onClick={addPlan}>+ Yeni oturum</button>
      </section>

      {plans.length && selectedPlan ? (
        <section className="session-planner-layout">
          <aside className="session-plan-list" aria-label="Oturum planları">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={plan.id === selectedId ? "active" : ""}
                onClick={() => setSelectedId(plan.id)}
              >
                <span><strong>{plan.title}</strong><small>{campaignMap.get(plan.campaignId) ?? "Campaign seçilmedi"}</small></span>
                <em>{getSessionProgress(plan)}%</em>
              </button>
            ))}
          </aside>

          <div className="session-plan-editor">
            <header className="session-plan-header">
              <div>
                <span>Aktif plan</span>
                <input
                  aria-label="Oturum başlığı"
                  value={selectedPlan.title}
                  onChange={(event) => updateSelected((plan) => ({ ...plan, title: event.target.value }))}
                />
              </div>
              <button type="button" className="danger" onClick={deletePlan}>Planı sil</button>
            </header>

            <div className="session-plan-meta-grid">
              <label>Campaign
                <select value={selectedPlan.campaignId} onChange={(event) => updateSelected((plan) => ({ ...plan, campaignId: event.target.value }))}>
                  <option value="">Campaign seçilmedi</option>
                  {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
                </select>
              </label>
              <label>Tarih ve saat
                <input type="datetime-local" value={selectedPlan.scheduledFor} onChange={(event) => updateSelected((plan) => ({ ...plan, scheduledFor: event.target.value }))} />
              </label>
            </div>

            <label className="session-plan-field">Oturum hedefi
              <textarea value={selectedPlan.objective} onChange={(event) => updateSelected((plan) => ({ ...plan, objective: event.target.value }))} placeholder="Bu oturumun ana dramatik ve mekanik hedefi..." />
            </label>

            <section className="session-plan-columns">
              <div className="session-plan-card">
                <header><div><span>Akış</span><h2>Sahneler</h2></div><button type="button" onClick={() => updateSelected((plan) => ({ ...plan, scenes: [...plan.scenes, { id: crypto.randomUUID(), title: `Sahne ${plan.scenes.length + 1}`, notes: "", completed: false }] }))}>+ Sahne</button></header>
                <div className="session-scene-list">
                  {selectedPlan.scenes.map((scene) => (
                    <article key={scene.id} className={scene.completed ? "completed" : ""}>
                      <input type="checkbox" checked={scene.completed} onChange={() => updateSelected((plan) => ({ ...plan, scenes: plan.scenes.map((item) => item.id === scene.id ? { ...item, completed: !item.completed } : item) }))} />
                      <div><input value={scene.title} onChange={(event) => updateSelected((plan) => ({ ...plan, scenes: plan.scenes.map((item) => item.id === scene.id ? { ...item, title: event.target.value } : item) }))} /><textarea value={scene.notes} onChange={(event) => updateSelected((plan) => ({ ...plan, scenes: plan.scenes.map((item) => item.id === scene.id ? { ...item, notes: event.target.value } : item) }))} placeholder="NPC, çatışma, ipucu veya geçiş notu..." /></div>
                      <button type="button" aria-label="Sahneyi sil" onClick={() => updateSelected((plan) => ({ ...plan, scenes: plan.scenes.filter((item) => item.id !== scene.id) }))}>×</button>
                    </article>
                  ))}
                  {!selectedPlan.scenes.length ? <p>Henüz sahne eklenmedi.</p> : null}
                </div>
              </div>

              <div className="session-plan-card">
                <header><div><span>Hazırlık</span><h2>Görevler</h2></div><button type="button" onClick={() => updateSelected((plan) => ({ ...plan, tasks: [...plan.tasks, { id: crypto.randomUUID(), text: "Yeni görev", completed: false }] }))}>+ Görev</button></header>
                <div className="session-task-list">
                  {selectedPlan.tasks.map((task) => (
                    <label key={task.id} className={task.completed ? "completed" : ""}>
                      <input type="checkbox" checked={task.completed} onChange={() => updateSelected((plan) => ({ ...plan, tasks: plan.tasks.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item) }))} />
                      <input value={task.text} onChange={(event) => updateSelected((plan) => ({ ...plan, tasks: plan.tasks.map((item) => item.id === task.id ? { ...item, text: event.target.value } : item) }))} />
                      <button type="button" aria-label="Görevi sil" onClick={() => updateSelected((plan) => ({ ...plan, tasks: plan.tasks.filter((item) => item.id !== task.id) }))}>×</button>
                    </label>
                  ))}
                  {!selectedPlan.tasks.length ? <p>Hazırlık görevi eklenmedi.</p> : null}
                </div>
              </div>
            </section>

            <section className="session-notes-grid">
              <label>Hızlı notlar
                <textarea value={selectedPlan.quickNotes} onChange={(event) => updateSelected((plan) => ({ ...plan, quickNotes: event.target.value }))} placeholder="Oturum sırasında gelişen olaylar, doğaçlama isimler ve oyuncu kararları..." />
              </label>
              <label>Session recap
                <textarea value={selectedPlan.recap} onChange={(event) => updateSelected((plan) => ({ ...plan, recap: event.target.value }))} placeholder="Bir sonraki oturumdan önce okunacak kısa özet..." />
              </label>
            </section>
          </div>
        </section>
      ) : (
        <section className="session-planner-empty">
          <strong>Henüz oturum planı yok.</strong>
          <p>Yeni oturum oluşturarak sahneleri, görevleri ve notları tek akışta toplamaya başla.</p>
          <button type="button" onClick={addPlan}>İlk oturumu oluştur</button>
        </section>
      )}
    </PageShell>
  );
}
