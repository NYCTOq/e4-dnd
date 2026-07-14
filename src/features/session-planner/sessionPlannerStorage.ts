export type SessionScene = {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
};

export type SessionTask = {
  id: string;
  text: string;
  completed: boolean;
};

export type SessionPlan = {
  id: string;
  campaignId: string;
  title: string;
  scheduledFor: string;
  objective: string;
  quickNotes: string;
  recap: string;
  scenes: SessionScene[];
  tasks: SessionTask[];
  createdAt: string;
  updatedAt: string;
};

const SESSION_PLANS_KEY = "e4_dnd_session_plans_v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeSessionPlan(value: unknown): SessionPlan | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }

  const now = new Date().toISOString();
  const scenes = Array.isArray(value.scenes)
    ? value.scenes.filter(isRecord).map((scene) => ({
        id: typeof scene.id === "string" ? scene.id : crypto.randomUUID(),
        title: typeof scene.title === "string" ? scene.title : "Adsız sahne",
        notes: typeof scene.notes === "string" ? scene.notes : "",
        completed: scene.completed === true,
      }))
    : [];
  const tasks = Array.isArray(value.tasks)
    ? value.tasks.filter(isRecord).map((task) => ({
        id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
        text: typeof task.text === "string" ? task.text : "",
        completed: task.completed === true,
      })).filter((task) => task.text.trim().length > 0)
    : [];

  return {
    id: value.id,
    campaignId: typeof value.campaignId === "string" ? value.campaignId : "",
    title: value.title,
    scheduledFor: typeof value.scheduledFor === "string" ? value.scheduledFor : "",
    objective: typeof value.objective === "string" ? value.objective : "",
    quickNotes: typeof value.quickNotes === "string" ? value.quickNotes : "",
    recap: typeof value.recap === "string" ? value.recap : "",
    scenes,
    tasks,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

export function loadSessionPlans(): SessionPlan[] {
  try {
    const raw = localStorage.getItem(SESSION_PLANS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeSessionPlan).filter((plan): plan is SessionPlan => Boolean(plan));
  } catch {
    return [];
  }
}

export function saveSessionPlans(plans: SessionPlan[]) {
  try {
    localStorage.setItem(SESSION_PLANS_KEY, JSON.stringify(plans));
  } catch {
    // Depolama kapalıysa ekran yine kullanılabilir; yalnızca kalıcılık devre dışı kalır.
  }
}

export function createSessionPlan(title: string, campaignId = ""): SessionPlan {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    campaignId,
    title: title.trim() || "Yeni oturum",
    scheduledFor: "",
    objective: "",
    quickNotes: "",
    recap: "",
    scenes: [],
    tasks: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getSessionProgress(plan: SessionPlan) {
  const total = plan.scenes.length + plan.tasks.length;
  const completed = plan.scenes.filter((scene) => scene.completed).length + plan.tasks.filter((task) => task.completed).length;
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
