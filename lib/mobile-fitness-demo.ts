export const fitnessWorkouts = [
  {id: "full", title: "Corpo inteiro", subtitle: "Seu treino de hoje", seconds: 630, sets: 2, photo: "body", exercises: ["Agachamento", "Remada", "Prancha"]},
  {id: "upper", title: "Força e movimento", subtitle: "Parte superior", seconds: 600, sets: 2, photo: "upper", exercises: ["Remada", "Elevação de braços", "Prancha"]},
  {id: "core", title: "Centro e equilíbrio", subtitle: "Estabilidade", seconds: 600, sets: 2, photo: "core", exercises: ["Prancha", "Equilíbrio", "Alongamento"]},
] as const;
export type FitnessWorkoutId = typeof fitnessWorkouts[number]["id"];
export type FitnessSession = {workout: FitnessWorkoutId; remaining: number; running: boolean; startedAt: number | null; completed: boolean; day: number};
export const fitnessWeekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export function fitnessClock(seconds: number) {const safe = Math.max(0, Math.ceil(seconds)); return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`}
export function fitnessTick(session: FitnessSession, now: number): FitnessSession {
  if (!session.running || session.startedAt === null) return session;
  const elapsed = Math.max(0, Math.floor((now - session.startedAt) / 1000));
  if (!elapsed) return session;
  const remaining = Math.max(0, session.remaining - elapsed);
  return {...session, remaining, startedAt: remaining ? session.startedAt + elapsed * 1000 : null, running: remaining > 0, completed: remaining === 0};
}
export const fitnessPosts = [
  {id: "katie", name: "Katie Harbatth", initials: "KH", badge: "Na comunidade", time: "Há 1 hora", text: "Hoje voltei à academia. Quem também separou um tempo para se movimentar?", likes: 512, comments: 38, photo: true},
  {id: "james", name: "James Carter", initials: "JC", badge: "Conquista do mês", time: "Há 2 horas", text: "Completei meu desafio de 30 dias! Obrigado a todos que acompanharam essa jornada.", likes: 124, comments: 12, photo: false},
];
