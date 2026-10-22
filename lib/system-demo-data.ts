export const demoTools = [
  {name: "Microsoft Teams", short: "T"},
  {name: "Notion", short: "N"},
  {name: "GitHub", short: "GH"},
  {name: "Google Drive", short: "D"},
  {name: "Figma", short: "F"},
  {name: "Slack", short: "S"},
];

export const demoDays = [
  {day: "SEG", name: "Segunda-feira", hours: 2},
  {day: "TER", name: "Terça-feira", hours: 6},
  {day: "QUA", name: "Quarta-feira", hours: 12},
  {day: "QUI", name: "Quinta-feira", hours: 20},
  {day: "SEX", name: "Sexta-feira", hours: 31},
  {day: "SÁB", name: "Sábado", hours: 40},
  {day: "DOM", name: "Domingo", hours: 48},
];

export const demoRecords = [
  {title: "Relatório semanal", type: "Documento", detail: "Resumo das solicitações da equipe."},
  {title: "Atualização cadastral", type: "Tarefa", detail: "Revisar as informações do cliente."},
  {title: "Atendimento ao cliente", type: "Fluxo", detail: "Receber, registrar e acompanhar solicitações."},
  {title: "Agenda da equipe", type: "Documento", detail: "Compromissos e próximos passos."},
  {title: "Enviar notificação", type: "Tarefa", detail: "Avisar o responsável sobre uma nova solicitação."},
  {title: "Aprovação de documentos", type: "Fluxo", detail: "Organizar a análise e o retorno ao cliente."},
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
export function searchDemoRecords(query: string) {
  const term = normalize(query.trim());
  return demoRecords.filter(record => normalize(`${record.title} ${record.type} ${record.detail}`).includes(term));
}
