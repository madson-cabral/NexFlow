export type DeliveryCategory = "all" | "salads" | "bowls" | "meals";
export type DeliveryCart = Record<string, number>;
export type ParcelSize = "envelope" | "small" | "medium";
export type CourierVehicle = "bike" | "car";
export type DeliveryOrder = {id: number; kind: "market" | "food" | "courier" | "pharmacy"; title: string; items: number; total: number; stage: number; minutes: number; destination: string; pickup?: string; vehicle?: CourierVehicle};

export const deliveryProducts = [
  {id: "rainbow", name: "Salada colorida", category: "salads", price: 24.9, photo: "rainbow"},
  {id: "citrus", name: "Salada cítrica", category: "salads", price: 21.9, photo: "citrus"},
  {id: "tofu", name: "Bowl de tofu", category: "bowls", price: 26.9, photo: "tofu"},
  {id: "steak", name: "Carne e folhas", category: "meals", price: 34.9, photo: "steak"},
] as const;
export const parcelOptions = [{id: "envelope" as const, title: "Envelope", detail: "Até 1 kg"}, {id: "small" as const, title: "Pequeno", detail: "Até 5 kg"}, {id: "medium" as const, title: "Médio", detail: "Até 10 kg"}];
export const pharmacyOptions = [{id: "soap", title: "Sabonete neutro", detail: "1 unidade", price: 8.9}, {id: "cotton", title: "Algodão", detail: "1 pacote · 50 g", price: 6.9}];
export const deliveryStages = ["Pedido recebido", "Em preparação", "A caminho", "Entregue"];
export function deliveryMoney(value: number) {return value.toLocaleString("pt-BR", {style: "currency", currency: "BRL"})}
export function deliverySearch(query: string, category: DeliveryCategory = "all") {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return deliveryProducts.filter(product => (category === "all" || product.category === category) && normalize(product.name).includes(normalize(query)));
}
export function deliveryQuantity(cart: DeliveryCart, product: string, change: number): DeliveryCart {
  if (!deliveryProducts.some(item => item.id === product) || !Number.isInteger(change)) return cart;
  return {...cart, [product]: Math.max(0, Math.min(20, (cart[product] || 0) + change))};
}
export function deliveryCartSummary(cart: DeliveryCart) {
  const rows = deliveryProducts.map(product => ({...product, quantity: Math.max(0, Math.min(20, Math.floor(cart[product.id] || 0)))})).filter(product => product.quantity > 0);
  const count = rows.reduce((sum, product) => sum + product.quantity, 0);
  const subtotal = Math.round(rows.reduce((sum, product) => sum + product.quantity * product.price, 0) * 100) / 100;
  const fee = count ? 4.9 : 0;
  return {rows, count, subtotal, fee, total: Math.round((subtotal + fee) * 100) / 100};
}
export function courierPrice(size: ParcelSize, vehicle: CourierVehicle) {return Math.round(((vehicle === "bike" ? 9.9 : 16.4) + (size === "medium" ? 4 : 0)) * 100) / 100}
export function deliveryNextStage(order: DeliveryOrder): DeliveryOrder {return {...order, stage: Math.min(3, order.stage + 1)}}
export function deliveryRemaining(order: DeliveryOrder) {return Math.max(0, Math.round(order.minutes * [1, .7, .3, 0][Math.max(0, Math.min(3, order.stage))]))}
export const initialDeliveryCart: DeliveryCart = {rainbow: 1, citrus: 1};
export const initialDeliveryOrder: DeliveryOrder = {id: 1208, kind: "food", title: "Koji Ramen", items: 2, total: 56.7, stage: 2, minutes: 20, destination: "Rua da Rosa, 41"};
