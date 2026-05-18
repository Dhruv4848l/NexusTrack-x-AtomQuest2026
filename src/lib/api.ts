import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aq_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("aq_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string, requestedRole?: string) =>
    api.post<{ token: string; user: AQUser; is_first_login: boolean }>("/auth/login", { email, password, requestedRole }),
  register: (first_name: string, last_name: string, email: string, password: string, department?: string, employee_id?: string, roles?: string[]) =>
    api.post<{ token: string; user: AQUser }>("/auth/register", { first_name, last_name, email, password, department, employee_id, roles }),
  me: () => api.get<{ user: AQUser }>("/auth/me"),
  updateMe: (data: Partial<AQUser>) => api.patch<{ user: AQUser }>("/auth/me", data),
  changePassword: (data: any) => api.post("/auth/change-password", data),
  uploadAvatar: (formData: FormData) => api.post<{ user: any }>("/auth/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  requestForgotPassword: (identifier: string) => api.post("/auth/forgot-password/request", { identifier }),
  verifyForgotPassword: (data: any) => api.post("/auth/forgot-password/verify", data),
};

// ─── Users ───────────────────────────────────────────────
export const usersApi = {
  list: () => api.get<AQUser[]>("/users"),
  get: (id: string) => api.get<AQUser>(`/users/${id}`),
  update: (id: string, data: Partial<AQUser>) => api.patch<AQUser>(`/users/${id}`, data),
  setRoles: (id: string, roles: string[]) => api.patch<AQUser>(`/users/${id}/roles`, { roles }),
  myTeam: () => api.get<AQUser[]>("/users/team/my"),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// ─── Cycles ──────────────────────────────────────────────
export const cyclesApi = {
  list: () => api.get<AQCycle[]>("/cycles"),
  active: () => api.get<AQCycle | null>("/cycles/active"),
  create: (data: Partial<AQCycle>) => api.post<AQCycle>("/cycles", data),
  update: (id: string, data: Partial<AQCycle>) => api.patch<AQCycle>(`/cycles/${id}`, data),
  activate: (id: string, active: boolean) => api.patch<AQCycle>(`/cycles/${id}/activate`, { active }),
};

// ─── Goal Sheets ─────────────────────────────────────────
export const sheetsApi = {
  list: () => api.get<AQSheet[]>("/sheets"),
  my: (cycleId: string) => api.get<AQSheet | null>("/sheets/my", { params: { cycleId } }),
  get: (id: string) => api.get<{ sheet: AQSheet; goals: AQGoal[] }>(`/sheets/${id}`),
  save: (data: { sheetId?: string; cycleId: string; goals: Partial<AQGoal>[]; submit?: boolean }) =>
    api.post<{ sheetId: string }>("/sheets/save", data),
  approve: (id: string) => api.post(`/sheets/${id}/approve`),
  approveWithEdits: (id: string, edits: { goalId: string; target?: number | null; target_date?: string | null; weightage?: number }[]) =>
    api.post(`/sheets/${id}/approve-with-edits`, { edits }),
  return: (id: string, comment: string) => api.post(`/sheets/${id}/return`, { comment }),
  unlock: (id: string) => api.post(`/sheets/${id}/unlock`),
  comments: (id: string) => api.get<AQComment[]>(`/sheets/${id}/comments`),
  requestEdit: (id: string, reason: string) => api.patch(`/sheets/${id}/request-edit`, { reason }),
  approveEdit: (id: string) => api.post(`/sheets/${id}/approve-edit`),
  rejectEdit: (id: string, reason: string) => api.post(`/sheets/${id}/reject-edit`, { reason }),
};

// ─── Goals ───────────────────────────────────────────────
export const goalsApi = {
  list: (sheetId: string) => api.get<AQGoal[]>("/goals", { params: { sheetId } }),
  pushShared: (data: {
    cycleId: string; ownerIds: string[]; thrust_area: string; title: string;
    description?: string; uom_type: string; target?: number | null;
    target_date?: string | null; defaultWeightage: number;
  }) => api.post("/goals/push-shared", data),
};

// ─── Achievements ─────────────────────────────────────────
export const achievementsApi = {
  list: (goalId: string) => api.get<AQAchievement[]>("/achievements", { params: { goalId } }),
  forSheet: (sheetId: string) => api.get<AQAchievement[]>(`/achievements/sheet/${sheetId}`),
  upsert: (data: {
    goalId: string; quarter: string; actualValue: number | null;
    actualDate: string | null; status: string; notes?: string;
  }) => api.post<{ achievement: AQAchievement; score: number | null }>("/achievements/upsert", data),
  addComment: (goalId: string, quarter: string, comment: string) =>
    api.post("/achievements/comment", { goalId, quarter, comment }),
  comments: (goalId: string, quarter?: string) =>
    api.get<AQComment[]>("/achievements/comments", { params: { goalId, quarter } }),
  uploadProof: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/achievements/${id}/proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ─── Audit ───────────────────────────────────────────────
export const auditApi = {
  list: (params?: { entity?: string; limit?: number; skip?: number }) =>
    api.get<{ logs: AQAuditLog[]; total: number }>("/audit", { params }),
};

// ─── Shared Types ─────────────────────────────────────────
export interface AQUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string | null;
  employee_id: string | null;
  phone_number: string | null;
  dob: string | null;
  avatar_color: string | null;
  profile_image: string | null;
  personal_email?: string | null;
  manager_id: AQUser | string | null;
  roles: string[];
  is_first_login: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AQCycle {
  _id: string;
  name: string;
  is_active: boolean;
  phase1_open: string; phase1_close: string;
  q1_open: string; q1_close: string;
  q2_open: string; q2_close: string;
  q3_open: string; q3_close: string;
  q4_open: string; q4_close: string;
}

export interface AQSheet {
  _id: string;
  owner_id: AQUser | string;
  cycle_id: AQCycle | string;
  status: "draft" | "submitted" | "approved_locked" | "returned" | "completed";
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: AQUser | string | null;
  is_edit_requested: boolean;
  edit_request_reason: string | null;
  createdAt: string; updatedAt: string;
}

export interface AQGoal {
  _id: string;
  sheet_id: string;
  shared_parent_id: string | null;
  thrust_area: string;
  title: string;
  description: string | null;
  uom_type: string;
  target: number | null;
  target_date: string | null;
  weightage: number;
  position: number;
}

export interface AQAchievement {
  _id: string;
  goal_id: string;
  quarter: string;
  actual_value: number | null;
  actual_date: string | null;
  status: "not_started" | "on_track" | "completed";
  computed_score: number | null;
  notes: string | null;
  proof_url: string | null;
  proof_name: string | null;
}

export interface AQComment {
  _id: string;
  type: "return" | "checkin";
  manager_id: AQUser | string;
  sheet_id?: string;
  goal_id?: string;
  quarter?: string;
  comment: string;
  createdAt: string;
}

export interface AQAuditLog {
  _id: string;
  actor_id: AQUser | null;
  entity: string;
  entity_id: string | null;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}
