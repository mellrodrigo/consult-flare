import { api, apiUpload, apiUrl, getToken } from "@/lib/api-client";
import { firstStage, nextStage, type CaseType } from "@/lib/workflow";

export interface CaseRow {
  id: string;
  type: CaseType;
  title: string;
  current_stage: string;
  status: "active" | "done" | "rejected";
  cand_name: string | null;
  cand_email: string | null;
  cand_phone: string | null;
  cand_linkedin: string | null;
  role: string | null;
  manager: string | null;
  area: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HistoryRow {
  id: string;
  case_id: string;
  from_stage: string | null;
  to_stage: string;
  outcome: string | null;
  note: string | null;
  created_at: string;
}

export interface InterviewRow {
  id: string;
  case_id: string;
  kind: string | null;
  scheduled_at: string | null;
  location: string | null;
  interviewer: string | null;
  result: string;
  notes: string | null;
  created_at: string;
}

export interface AttachmentRow {
  id: string;
  case_id: string;
  kind: string;
  original_name: string;
  storage_path: string;
  mime: string | null;
  size: number | null;
  created_at: string;
}

export interface FullCase extends CaseRow {
  history: HistoryRow[];
  interviews: InterviewRow[];
  attachments: AttachmentRow[];
}

export type CaseFields = Partial<
  Pick<
    CaseRow,
    "cand_name" | "cand_email" | "cand_phone" | "cand_linkedin" | "role" | "manager" | "area" | "notes" | "title"
  >
>;

export async function listCases(type: CaseType): Promise<CaseRow[]> {
  const out = await api<{ data: CaseRow[] }>("cases", { params: { type } });
  return out.data ?? [];
}

export async function getCase(id: string): Promise<FullCase> {
  const out = await api<{ data: FullCase }>("case", { params: { id } });
  return out.data;
}

export async function createCase(input: CaseFields & { type: CaseType }): Promise<CaseRow> {
  const out = await api<{ data: CaseRow }>("cases", {
    method: "POST",
    body: {
      ...input,
      title: input.title || input.cand_name || "Novo caso",
      current_stage: firstStage(input.type),
    },
  });
  return out.data;
}

export async function updateCase(id: string, fields: CaseFields): Promise<void> {
  await api("case", { method: "PATCH", params: { id }, body: fields });
}

export async function deleteCase(id: string): Promise<void> {
  await api("case", { method: "DELETE", params: { id } });
}

export async function advance(
  current: CaseRow,
  opts: { outcome?: "advance" | "approved" | "rejected"; toStage?: string; note?: string },
): Promise<void> {
  let to: string;
  let status: CaseRow["status"] = "active";
  let outcome = opts.outcome ?? "set";

  if (opts.toStage) {
    to = opts.toStage;
    outcome = "set";
    status = to === "concluido" ? "done" : to === "reprovado" ? "rejected" : "active";
  } else if (opts.outcome === "rejected") {
    to = "reprovado";
    status = "rejected";
  } else {
    to = nextStage(current.type, current.current_stage);
    status = to === "concluido" ? "done" : "active";
  }

  await api("case/advance", {
    method: "POST",
    params: { id: current.id },
    body: { to_stage: to, status, outcome, note: opts.note || "" },
  });
}

export async function uploadAttachments(caseId: string, files: FileList | File[], kind = "other"): Promise<void> {
  for (const file of Array.from(files)) {
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);
    await apiUpload("attachments", { id: caseId }, form);
  }
}

export async function downloadAttachment(att: AttachmentRow): Promise<void> {
  const res = await fetch(apiUrl("attachment", { id: att.id }), {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  });
  if (!res.ok) throw new Error("Não foi possível baixar o arquivo.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = att.original_name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function deleteAttachment(att: AttachmentRow): Promise<void> {
  await api("attachment", { method: "DELETE", params: { id: att.id } });
}

export async function createInterview(
  caseId: string,
  data: { kind: string; scheduled_at: string | null; interviewer: string; location: string; notes: string },
): Promise<void> {
  await api("interviews", { method: "POST", params: { id: caseId }, body: data });
}

export async function updateInterview(id: string, fields: Partial<InterviewRow>): Promise<void> {
  await api("interview", { method: "PATCH", params: { id }, body: fields });
}

export async function deleteInterview(id: string): Promise<void> {
  await api("interview", { method: "DELETE", params: { id } });
}
