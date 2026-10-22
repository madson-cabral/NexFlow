export type DemoPlan = "starter" | "growth" | "business";
export type SubscriptionStatus = "active" | "trial" | "paused";
export type DemoSubscription = {id: string; name: string; plan: DemoPlan; status: SubscriptionStatus; month: number; date: string};
export const demoPlans = [
  {id: "starter" as const, name: "Essencial", price: 79, description: "Para organizar os primeiros clientes."},
  {id: "growth" as const, name: "Crescimento", price: 199, description: "Para acompanhar uma operação em expansão."},
  {id: "business" as const, name: "Negócios", price: 499, description: "Para reunir equipes e informações."},
];
export const initialSubscriptions: DemoSubscription[] = [
  {id: "NF-1001", name: "Estúdio Aurora", plan: "business", status: "active", month: 5, date: "2026-05-12"},
  {id: "NF-1002", name: "Forma Digital", plan: "growth", status: "active", month: 5, date: "2026-05-22"},
  {id: "NF-1003", name: "Café Vila", plan: "starter", status: "trial", month: 6, date: "2026-06-04"},
  {id: "NF-1004", name: "Ateliê Luma", plan: "starter", status: "active", month: 6, date: "2026-06-19"},
  {id: "NF-1005", name: "Clínica Mais", plan: "business", status: "active", month: 7, date: "2026-07-09"},
  {id: "NF-1006", name: "Arco Lab", plan: "growth", status: "active", month: 8, date: "2026-08-17"},
  {id: "NF-1007", name: "Loja Horizonte", plan: "starter", status: "paused", month: 9, date: "2026-09-03"},
  {id: "NF-1008", name: "Ponto Norte", plan: "growth", status: "trial", month: 10, date: "2026-10-08"},
];
export const demoMonths = [{month: 5, label: "Mai"}, {month: 6, label: "Jun"}, {month: 7, label: "Jul"}, {month: 8, label: "Ago"}, {month: 9, label: "Set"}, {month: 10, label: "Out"}];
export const statusLabels = {active: "Ativa", trial: "Em teste", paused: "Pausada"};
export const brl = (value: number) => value.toLocaleString("pt-BR", {style: "currency", currency: "BRL", maximumFractionDigits: 0});
export const planFor = (id: DemoPlan) => demoPlans.find(plan => plan.id === id)!;
export function subscriptionMetrics(rows: DemoSubscription[]) {
  const active = rows.filter(row => row.status === "active");
  const mrr = active.reduce((total, row) => total + planFor(row.plan).price, 0);
  return {mrr, arr: mrr * 12, active: active.length, trial: rows.filter(row => row.status === "trial").length, paused: rows.filter(row => row.status === "paused").length, total: rows.length};
}
export function subscriptionTrend(rows: DemoSubscription[]) {
  return demoMonths.map(period => ({...period, revenue: subscriptionMetrics(rows.filter(row => row.month <= period.month)).mrr}));
}
export function filterSubscriptions(rows: DemoSubscription[], query: string, status: string, plan: string) {
  const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
  return rows.filter(row => (status === "all" || row.status === status) && (plan === "all" || row.plan === plan) && `${row.name} ${row.id} ${planFor(row.plan).name}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(normalized));
}
