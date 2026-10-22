export type HeroCamera = {x: number; y: number; z: number; rx: number; ry: number; scale: number};
export type HeroNode = {id: number; x: number; y: number; z: number; rx: number; ry: number; width: number; height: number};

export const heroNodes: HeroNode[] = [
  {id: 1, x: 0, y: 25, z: 60, rx: 0, ry: 0, width: 300, height: 250},
  {id: 2, x: -340, y: -115, z: -90, rx: 6, ry: 24, width: 310, height: 210},
  {id: 3, x: 345, y: -110, z: -80, rx: 6, ry: -24, width: 330, height: 220},
  {id: 4, x: -285, y: 155, z: 130, rx: -6, ry: 18, width: 280, height: 190},
];

export const heroStations = [
  {id: 0, label: "Visão geral", title: "Uma operação conectada.", description: "Explore os módulos ou reproduza um fluxo de exemplo.", solution: "automation", action: "Conhecer as soluções"},
  {id: 1, label: "Integrações", title: "Informações que seguem o mesmo fluxo.", description: "Conecte formulários, ferramentas e etapas da sua operação.", solution: "automation", action: "Ver automações"},
  {id: 2, label: "Automações", title: "Cada etapa tem um próximo passo.", description: "Experimente receber, registrar, notificar e acompanhar um pedido.", solution: "automation", action: "Ver automações"},
  {id: 3, label: "Sistemas", title: "O andamento fica visível.", description: "Os indicadores deste exemplo acompanham as etapas executadas.", solution: "systems", action: "Ver sistemas web"},
  {id: 4, label: "Aplicações", title: "Uma experiência simples para quem usa.", description: "Portais e aplicativos dão acesso às informações e aos serviços.", solution: "apps", action: "Ver aplicativos web"},
] as const;

export const heroFlowSteps = ["Pronto", "Receber", "Registrar", "Notificar", "Acompanhar"];
export const heroFlowLogs = ["Solicitação recebida pelo formulário.", "Informações registradas no sistema.", "Equipe notificada sobre o pedido.", "Andamento disponível para acompanhamento."];
export function clampHero(value: number, min: number, max: number) {return Math.max(min, Math.min(max, value))}

// Full-bleed desktop canvas: keep the camera's subject on the right, clear of
// the headline and dock. Mobile and the expanded dialog use their whole stage.
export function heroSceneFrame(width: number, height: number, expanded: boolean) {
  return expanded || width <= 1160
    ? {width, height}
    : {width: width * .52, height: Math.max(180, height - 390)};
}

export function rotateHeroPoint(point: {x: number; y: number; z: number}, rx: number, ry: number) {
  const xAngle = rx * Math.PI / 180, yAngle = ry * Math.PI / 180;
  const x = point.x * Math.cos(yAngle) + point.z * Math.sin(yAngle);
  const z = -point.x * Math.sin(yAngle) + point.z * Math.cos(yAngle);
  return {x, y: point.y * Math.cos(xAngle) - z * Math.sin(xAngle), z: point.y * Math.sin(xAngle) + z * Math.cos(xAngle)};
}

export function heroCameraFor(station: number, width: number, height: number, zoom = 0): HeroCamera {
  const safeWidth = Math.max(200, width), safeHeight = Math.max(180, height);
  const compact = safeWidth < 520;
  const node = heroNodes.find(item => item.id === station) ?? (compact ? heroNodes[0] : undefined);
  if (!node) return {x: 0, y: -8, z: -100 + clampHero(zoom, -1, 1) * 160, rx: -12, ry: -12, scale: Math.min(.72, (safeWidth - 20) / 1080, (safeHeight - 20) / 560)};
  // Reserve room for camera controls; compact views show the central module
  // instead of shrinking the entire world into an unreadable thumbnail.
  const gutter = compact ? 96 : 48;
  const scale = Math.min(station === 0 ? .9 : 1.14, (safeWidth - gutter) / node.width, (safeHeight - gutter) / node.height);
  const rx = station === 0 ? -4 : -node.rx, ry = station === 0 ? -8 : -node.ry, point = rotateHeroPoint(node, rx, ry);
  return {x: -point.x * scale - (compact ? 16 : 0), y: -point.y * scale, z: -point.z * scale + clampHero(zoom, -1, 1) * 120, rx, ry, scale};
}
