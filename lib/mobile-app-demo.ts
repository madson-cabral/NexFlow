export const mobileServices = [
  {id: "cut", name: "Corte e finalização", short: "Corte", price: 90, minutes: 60, category: "cut", description: "Escolha um corte e um acabamento que combinem com seu estilo."},
  {id: "color", name: "Coloração", short: "Cor", price: 180, minutes: 90, category: "color", description: "Converse sobre a cor e escolha o resultado que você procura."},
  {id: "spa", name: "Tratamento capilar", short: "Cuidados", price: 110, minutes: 45, category: "care", description: "Um momento de cuidado para hidratar e finalizar seus cabelos."},
  {id: "dry", name: "Escova", short: "Escova", price: 70, minutes: 40, category: "care", description: "Finalização para a rotina ou para uma ocasião especial."},
];
export const mobileStylists = [
  {id: "emma", name: "Emma Johnson", role: "Cortes e finalização", rating: "4,9", photo: "emma"},
  {id: "liam", name: "Liam Carter", role: "Corte e estilo", rating: "4,8", photo: "liam"},
  {id: "sophia", name: "Sophia Lee", role: "Coloração", rating: "4,9", photo: "sophia"},
];
export const mobileTimes = ["10:00", "11:00", "14:00", "15:00"];
export type MobileDay = {id: string; weekday: string; label: string};
export type MobileBooking = {service: string; stylist: string; day: MobileDay; time: string; total: number};
export const mobileMoney = (amount: number) => amount.toLocaleString("pt-BR", {style: "currency", currency: "BRL", maximumFractionDigits: 0});
export const mobileTotal = (price: number, coupon: boolean) => Math.round(price * (coupon ? .7 : 1) * 100) / 100;
export function mobileBookingDays(now = new Date()): MobileDay[] {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit"}).formatToParts(now).map(part => [part.type, part.value]));
  const start = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return Array.from({length: 5}, (_, index) => {
    const date = new Date(start + (index + 1) * 86400000);
    return {id: date.toISOString().slice(0, 10), weekday: date.toLocaleDateString("pt-BR", {timeZone: "UTC", weekday: "short"}).replace(".", ""), label: date.toLocaleDateString("pt-BR", {timeZone: "UTC", day: "numeric", month: "short"}).replace(" de ", " ").replace(".", "")};
  });
}
export function mobileServiceSearch(query: string, category: string) {
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  return mobileServices.filter(service => (category === "all" || service.category === category) && normalize(service.name).includes(normalize(query.trim())));
}
