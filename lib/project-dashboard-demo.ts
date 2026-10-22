export type ProjectStatus = "active" | "completed" | "pending" | "paused";
export type ProjectMember = {id: string; name: string; role: string; team: string; color: string};
export type ProjectTask = {id: string; title: string; completed: boolean};
export type DemoProject = {id: string; name: string; owner: string; due: string; status: ProjectStatus; tasks: ProjectTask[]};

export const projectStatusLabels: Record<ProjectStatus, string> = {active: "Em andamento", completed: "Concluído", pending: "Não iniciado", paused: "Pausado"};
const names = ["Ana Costa", "Bruno Alves", "Carla Lima", "Diego Melo", "Elisa Reis", "Fábio Dias", "Gabi Rocha", "Henrique Luz", "Iara Souza", "João Leal", "Karen Silva", "Lucas Rios", "Marina Lopes", "Nando Cruz", "Olívia Dias", "Paulo Reis", "Rita Nunes", "Sérgio Melo"];
export const projectMembers: ProjectMember[] = names.map((name, index) => ({id: `person-${index + 1}`, name, team: ["Produto", "Design", "Desenvolvimento"][index % 3], role: ["Gestão de produto", "Design de interfaces", "Desenvolvimento web"][index % 3], color: ["#6550e8", "#e48498", "#37ad98", "#d59643"][index % 4]}));
export const projectTaskNames = ["Definir o escopo", "Desenhar a interface", "Preparar o conteúdo", "Conectar os serviços", "Validar a entrega"];
const projectNames = ["Aplicativo de entregas", "Site institucional", "Identidade da marca", "Loja virtual", "Portal do cliente", "Agendamento online", "Painel financeiro", "Área de membros", "Aplicativo de serviços", "Portal de atendimento", "Campanha de lançamento", "Gestão de pedidos", "Catálogo digital", "Dashboard de vendas", "Integração de cadastros", "Portal de fornecedores", "Agenda da equipe", "Plataforma de cursos", "Site de eventos", "Gestão de documentos", "Página de serviços", "Central de suporte", "Programa de fidelidade", "Painel de operações"];

export function makeProjectTasks(id: string, completed = 0): ProjectTask[] {
  return projectTaskNames.map((title, index) => ({id: `${id}-task-${index + 1}`, title, completed: index < completed}));
}

export function seedProjects(): DemoProject[] {
  return projectNames.map((name, index) => {
    const id = `PR-${String(index + 1).padStart(3, "0")}`;
    const status: ProjectStatus = index < 8 ? "completed" : index < 20 ? "active" : index < 22 ? "pending" : "paused";
    const completed = index < 8 ? 5 : index < 18 ? 4 : index < 20 ? 3 : 0;
    return {id, name, owner: projectMembers[index % projectMembers.length].id, due: `2026-${index < 15 ? "10" : "11"}-${String(index < 15 ? index + 15 : index - 13).padStart(2, "0")}`, status, tasks: makeProjectTasks(id, completed)};
  });
}

export function projectSummary(projects: DemoProject[]) {
  const tasks = projects.flatMap(project => project.tasks), completedTasks = tasks.filter(task => task.completed).length;
  return {total: projects.length, active: projects.filter(project => project.status === "active").length, completed: projects.filter(project => project.status === "completed").length, pending: projects.filter(project => project.status === "pending").length, paused: projects.filter(project => project.status === "paused").length, tasks: tasks.length, completedTasks, progress: tasks.length ? Math.round(completedTasks / tasks.length * 100) : 0};
}

export function projectCompletion(project: DemoProject) {
  return project.tasks.length ? Math.round(project.tasks.filter(task => task.completed).length / project.tasks.length * 100) : 0;
}

export function toggleProjectTask(projects: DemoProject[], projectId: string, taskId: string): DemoProject[] {
  return projects.map(project => {
    if (project.id !== projectId || !project.tasks.some(task => task.id === taskId)) return project;
    const tasks = project.tasks.map(task => task.id === taskId ? {...task, completed: !task.completed} : task);
    const status: ProjectStatus = tasks.every(task => task.completed) ? "completed" : project.status === "paused" ? "paused" : tasks.some(task => task.completed) ? "active" : "pending";
    return {...project, tasks, status};
  });
}

export function changeProjectStatus(project: DemoProject, status: ProjectStatus): DemoProject {
  const tasks = status === "completed" ? project.tasks.map(task => ({...task, completed: true})) : status === "pending" ? project.tasks.map(task => ({...task, completed: false})) : project.tasks.every(task => task.completed) ? project.tasks.map((task, index) => index === project.tasks.length - 1 ? {...task, completed: false} : task) : project.tasks;
  return {...project, status, tasks};
}

export function filterProjects(projects: DemoProject[], query: string, owner: string, status: string) {
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const term = normalize(query.trim());
  return projects.filter(project => (owner === "all" || project.owner === owner) && (status === "all" || project.status === status) && normalize(`${project.name} ${project.id} ${projectMembers.find(member => member.id === project.owner)?.name || ""}`).includes(term));
}

export function projectDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {day: "2-digit", month: "short"});
}
