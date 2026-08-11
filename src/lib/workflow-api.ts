import { supabase } from "@/integrations/supabase/client";
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

const BUCKET = "workflow-files";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function listCases(type: CaseType): Promise<CaseRow[]> {
  return unwrap(
    await supabase.from("cases").select("*").eq("type", type).order("updated_at", { ascending: false }),
  ) as CaseRow[];
}

export async function getCase(id: string): Promise<FullCase> {
  const base = unwrap(await supabase.from("cases").select("*").eq("id", id).single()) as CaseRow;
  const [history, interviews, attachments] = await Promise.all([
    supabase.from("stage_history").select("*").eq("case_id", id).order("created_at", { ascending: true }),
    supabase.from("interviews").select("*").eq("case_id", id).order("scheduled_at", { ascending: true }),
    supabase.from("attachments").select("*").eq("case_id", id).order("created_at", { ascending: false }),
  ]);
  return {
    ...base,
    history: (unwrap(history) ?? []) as HistoryRow[],
    interviews: (unwrap(interviews) ?? []) as InterviewRow[],
    attachments: (unwrap(attachments) ?? []) as AttachmentRow[],
  };
}

export async function createCase(input: CaseFields & { type: CaseType }): Promise<CaseRow> {
  const { data: userData } = await supabase.auth.getUser();
  const stage = firstStage(input.type);
  const created = unwrap(
    await supabase
      .from("cases")
      .insert({
        ...input,
        title: input.title || input.cand_name || "Novo caso",
        current_stage: stage,
        status: "active",
        created_by: userData.user?.id ?? null,
      })
      .select()
      .single(),
  ) as CaseRow;

  await supabase.from("stage_history").insert({
    case_id: created.id,
    from_stage: null,
    to_stage: stage,
    outcome: "created",
    note: "Caso criado",
    author: userData.user?.id ?? null,
  });

  return created;
}

export async function updateCase(id: string, fields: CaseFields): Promise<void> {
  const res = await supabase.from("cases").update(fields).eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function deleteCase(id: string): Promise<void> {
  const { data: files } = await supabase.from("attachments").select("storage_path").eq("case_id", id);
  const paths = (files ?? []).map((f: { storage_path: string }) => f.storage_path);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  const res = await supabase.from("cases").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function advance(
  current: CaseRow,
  opts: { outcome?: "advance" | "approved" | "rejected"; toStage?: string; note?: string },
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
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

  const res = await supabase
    .from("cases")
    .update({ current_stage: to, status })
    .eq("id", current.id);
  if (res.error) throw new Error(res.error.message);

  await supabase.from("stage_history").insert({
    case_id: current.id,
    from_stage: current.current_stage,
    to_stage: to,
    outcome,
    note: opts.note || null,
    author: userData.user?.id ?? null,
  });
}

export async function uploadAttachments(caseId: string, files: FileList | File[], kind = "other"): Promise<void> {
  for (const file of Array.from(files)) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${caseId}/${crypto.randomUUID()}-${safe}`;
    const up = await supabase.storage
      .from(BUCKET)
      .upload(path, file, file.type ? { contentType: file.type } : undefined);
    if (up.error) throw new Error(up.error.message);
    const res = await supabase.from("attachments").insert({
      case_id: caseId,
      kind,
      original_name: file.name,
      storage_path: path,
      mime: file.type || null,
      size: file.size,
    });
    if (res.error) throw new Error(res.error.message);
  }
}

export async function attachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteAttachment(att: AttachmentRow): Promise<void> {
  await supabase.storage.from(BUCKET).remove([att.storage_path]);
  const res = await supabase.from("attachments").delete().eq("id", att.id);
  if (res.error) throw new Error(res.error.message);
}

export async function createInterview(
  caseId: string,
  data: { kind: string; scheduled_at: string | null; interviewer: string; location: string; notes: string },
): Promise<void> {
  const res = await supabase.from("interviews").insert({ case_id: caseId, ...data });
  if (res.error) throw new Error(res.error.message);
}

export async function updateInterview(id: string, fields: Partial<InterviewRow>): Promise<void> {
  const res = await supabase.from("interviews").update(fields).eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function deleteInterview(id: string): Promise<void> {
  const res = await supabase.from("interviews").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}
