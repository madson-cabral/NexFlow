export const automationPresets = [
  {name:"Atendimento", description:"Uma solicitação chega, encontra seu registro e segue para o responsável.", steps:["Receber", "Registrar", "Notificar"], hue:2, saturation:1.2},
  {name:"Cadastros", description:"Informações entram, passam por validação e atualizam o cadastro.", steps:["Receber", "Validar", "Atualizar"], hue:0, saturation:.42},
  {name:"Relatórios", description:"Os dados são reunidos e organizados para gerar um relatório.", steps:["Coletar", "Organizar", "Relatar"], hue:6, saturation:1.3},
  {name:"Agendamentos", description:"Um pedido passa pela disponibilidade e chega à confirmação.", steps:["Receber", "Consultar", "Confirmar"], hue:0, saturation:.2},
  {name:"Notificações", description:"Um evento passa por uma condição e gera um aviso ao responsável.", steps:["Detectar", "Verificar", "Avisar"], hue:0, saturation:.68},
];

export const nextAutomationPreset = (index:number) => (index + 1) % automationPresets.length;
