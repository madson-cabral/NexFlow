export type OperationType="portal"|"system";
export type OperationStep=0|1|2;
export type OperationRecord={id:string,title:string,description:string,step:OperationStep,team:"Atendimento"|"Operação"};

export function seedOperations(type:OperationType):OperationRecord[]{
 const titles=type==="portal"?["Atualização cadastral","Entrega de documentos","Agendamento","Acompanhamento do pedido","Confirmação de cadastro","Documentos aprovados"]:["Revisar cadastro","Organizar documentos","Confirmar atendimento","Preparar relatório","Validar informações","Encerrar solicitação"];
 const descriptions=type==="portal"?["Conferência das informações recebidas no portal.","Documentos enviados para análise da equipe.","Solicitação de um horário de atendimento.","Consulta ao andamento de uma solicitação.","Informações cadastrais conferidas.","Análise de documentos finalizada."]:["Conferir os dados antes de atualizar o registro.","Reunir os arquivos necessários para o atendimento.","Definir o responsável pela próxima etapa.","Organizar os dados para consulta da equipe.","Conferência do registro concluída.","Todas as etapas desta atividade foram concluídas."];
 const steps:OperationStep[]=[1,0,1,0,2,2];
 return titles.map((title,index)=>({id:`NF-${101+index}`,title,description:descriptions[index],step:steps[index],team:index%2===0?"Atendimento":"Operação"}));
}
export function operationSummary(records:OperationRecord[]){return {open:records.filter(r=>r.step<2).length,inProgress:records.filter(r=>r.step===1).length,completed:records.filter(r=>r.step===2).length,total:records.length};}
export function advanceOperation(records:OperationRecord[],id:string){return records.map(record=>record.id===id?{...record,step:Math.min(2,record.step+1) as OperationStep}:record);}
export function searchOperations(records:OperationRecord[],query:string){const normalize=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");const term=normalize(query.trim());return records.filter(record=>normalize(`${record.id} ${record.title} ${record.team}`).includes(term));}
export function operationLabels(type:OperationType){return type==="portal"?["Recebida","Em análise","Concluída"]:["A fazer","Em andamento","Concluída"];}
