// Definição das duas trilhas do workflow de entrada de profissionais.
// Portado do sistema original (server/src/workflow.js).

export type CaseType = "CONTRATACAO" | "NTT";

export interface Stage {
  key: string;
  label: string;
  hint?: string;
  isDecision?: boolean;
}

export const TERMINAL = {
  concluido: { key: "concluido", label: "Concluído", kind: "done" as const },
  reprovado: { key: "reprovado", label: "Reprovado", kind: "rejected" as const },
};

const CONTRATACAO: Stage[] = [
  { key: "abertura_vaga", label: "Abertura de vaga (EVERJOB)", hint: "Vaga aberta na plataforma EVERJOB." },
  { key: "analise_cv", label: "Análise de CV", hint: "Triagem dos currículos recebidos." },
  {
    key: "entrevista_candidato",
    label: "Entrevista de candidato",
    isDecision: true,
    hint: "Entrevista técnica/comportamental. Aprovado segue; reprovado encerra.",
  },
  {
    key: "entrevista_serasa",
    label: "Entrevista Serasa",
    isDecision: true,
    hint: "Entrevista com o cliente. Aprovado segue; reprovado encerra.",
  },
  { key: "carta_oferta", label: "Envio de carta oferta", hint: "Carta oferta enviada e aceita pelo candidato." },
  { key: "enviar_dados_serasa", label: "Enviar dados ao Serasa para acessos", hint: "Dados pessoais enviados para criação de acessos." },
  { key: "onboarding_ntt", label: "Onboarding NTT do candidato", hint: "Processo de admissão/onboarding interno." },
  { key: "acessos_serasa", label: "Acessos Serasa disponíveis", hint: "Acessos criados e liberados pelo cliente." },
  { key: "solicitar_maquina", label: "Solicitar máquina adicional", hint: "Solicitação de equipamento para o profissional." },
  { key: "identificacao_maquina", label: "Identificação da máquina", hint: "Coleta de patrimônio/serial da máquina." },
  { key: "enviar_maquina_serasa", label: "Enviar dados da máquina ao Serasa", hint: "Identificação da máquina enviada ao cliente." },
  { key: "chamado_serasa", label: "Abertura de chamado Serasa", hint: "Chamado aberto para provisionamento." },
  { key: "retirar_maquina", label: "Retirar máquina Serasa", hint: "Retirada física da máquina." },
  { key: "envio_maquina", label: "Envio da máquina ao profissional", hint: "Máquina enviada ao profissional. Etapa final." },
];

const NTT: Stage[] = [
  { key: "identificar_gestor", label: "Identificar Gestor e Área contratante", hint: "Definição do gestor e área demandante." },
  { key: "enviar_cv_serasa", label: "Enviar CV para a Serasa analisar", hint: "Currículo do profissional enviado ao cliente." },
  { key: "entrevista_agendada", label: "Entrevista agendada", hint: "Entrevista com o cliente agendada." },
  {
    key: "decisao_candidato",
    label: "Candidato Aprovado ou Reprovado",
    isDecision: true,
    hint: "Resultado da entrevista. Aprovado segue; reprovado encerra.",
  },
  { key: "enviar_dados_serasa", label: "Enviar dados ao Serasa para criar acessos", hint: "Dados pessoais enviados ao cliente." },
  { key: "acessos_criados", label: "Acessos criados", hint: "Acessos criados e liberados pelo cliente." },
  { key: "solicitar_maquina", label: "Solicitar máquina adicional", hint: "Solicitação de equipamento para o profissional." },
  { key: "identificacao_maquina", label: "Identificação da máquina", hint: "Coleta de patrimônio/serial da máquina." },
  { key: "enviar_maquina_serasa", label: "Enviar dados da máquina ao Serasa", hint: "Identificação da máquina enviada ao cliente." },
  { key: "chamado_serasa", label: "Abertura de chamado Serasa", hint: "Chamado aberto para provisionamento." },
  { key: "retirar_maquina", label: "Retirar máquina Serasa", hint: "Retirada física da máquina." },
  { key: "envio_maquina", label: "Envio da máquina ao profissional", hint: "Máquina enviada ao profissional. Etapa final." },
];

export const WORKFLOWS: Record<CaseType, { key: CaseType; label: string; sub: string; stages: Stage[] }> = {
  CONTRATACAO: {
    key: "CONTRATACAO",
    label: "Contratação",
    sub: "seleção completa",
    stages: CONTRATACAO,
  },
  NTT: {
    key: "NTT",
    label: "Profissional NTT",
    sub: "já contratado",
    stages: NTT,
  },
};

export function getStages(type: CaseType): Stage[] {
  return WORKFLOWS[type]?.stages ?? [];
}

export function getStageLabel(type: CaseType, key: string): string {
  if (key === "concluido") return TERMINAL.concluido.label;
  if (key === "reprovado") return TERMINAL.reprovado.label;
  return getStages(type).find((s) => s.key === key)?.label ?? key;
}

export function firstStage(type: CaseType): string {
  return getStages(type)[0]?.key ?? "";
}

export function nextStage(type: CaseType, key: string): string {
  const stages = getStages(type);
  const idx = stages.findIndex((s) => s.key === key);
  if (idx === -1) return "concluido";
  return idx + 1 < stages.length ? stages[idx + 1]!.key : "concluido";
}
