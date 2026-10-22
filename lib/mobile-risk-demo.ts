export type RiskTaskStatus = "open" | "doing" | "done";
export type RiskPeriod = "week" | "month";
export const riskProperties = [
  {id: "horizonte", name: "Casa Horizonte", city: "São Paulo, SP", code: "PRM-1024", photo: "house", value: 1450000, baseRisk: 72, occupied: 4, capacity: 5},
  {id: "sol", name: "Villa do Sol", city: "Curitiba, PR", code: "PRM-1025", photo: "house", value: 980000, baseRisk: 82, occupied: 3, capacity: 4},
  {id: "aurora", name: "Casa Aurora", city: "Florianópolis, SC", code: "PRM-1026", photo: "intro", value: 1720000, baseRisk: 38, occupied: 2, capacity: 3},
] as const;
export const riskTasks = [
  {id: "electrical", property: "horizonte", title: "Revisão elétrica", description: "Reunir os registros da instalação e acompanhar a revisão com a equipe responsável.", category: "Instalações", weight: 12, initial: "doing" as RiskTaskStatus},
  {id: "drainage", property: "horizonte", title: "Acompanhamento da drenagem", description: "Organizar o histórico de manutenção e registrar o andamento da revisão.", category: "Manutenção", weight: 8, initial: "doing" as RiskTaskStatus},
  {id: "inspection", property: "sol", title: "Vistoria programada", description: "Reunir documentos e acompanhar a vistoria planejada para este imóvel.", category: "Acompanhamento", weight: 15, initial: "open" as RiskTaskStatus},
  {id: "maintenance", property: "sol", title: "Plano de manutenção", description: "Conferir os registros e atualizar o plano de acompanhamento da equipe.", category: "Manutenção", weight: 10, initial: "doing" as RiskTaskStatus},
  {id: "documents", property: "aurora", title: "Conferência de documentos", description: "Verificar quais documentos foram reunidos e registrar a conclusão da etapa.", category: "Documentação", weight: 6, initial: "open" as RiskTaskStatus},
] as const;
export type RiskStatuses = Record<string, RiskTaskStatus>;
export const initialRiskStatuses = (): RiskStatuses => Object.fromEntries(riskTasks.map(task => [task.id, task.initial]));
export function riskScore(id: string, statuses: RiskStatuses) {
  const property = riskProperties.find(item => item.id === id);
  if (!property) return 0;
  return Math.max(0, property.baseRisk - riskTasks.filter(task => task.property === id && statuses[task.id] === "done").reduce((sum, task) => sum + task.weight, 0));
}
export function riskLevel(score: number) {return score >= 75 ? "Elevado" : score >= 50 ? "Moderado" : score >= 25 ? "Atenção" : "Baixo"}
export const riskStatusLabels = {open: "A fazer", doing: "Em andamento", done: "Concluída"};
export const riskProgress = (status: RiskTaskStatus) => status === "done" ? 100 : status === "doing" ? 70 : 0;
export function riskHistory(score: number, period: RiskPeriod) {
  const base = period === "week" ? [32, 48, 44, 61, 72, 69, 72] : [38, 54, 63, 72];
  const labels = period === "week" ? ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] : ["S1", "S2", "S3", "S4"];
  return base.map((value, i) => ({label: labels[i], value: Math.max(0, Math.min(100, value + score - 72))}));
}
export function riskSearch(query: string, city: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  return riskProperties.filter(property => (city === "all" || property.city === city) && normalize(`${property.name} ${property.city} ${property.code}`).includes(normalize(query.trim())));
}
export const riskMoney = (value: number) => value.toLocaleString("pt-BR", {style: "currency", currency: "BRL", maximumFractionDigits: 0});
