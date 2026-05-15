export type OrderStatus = "incoming" | "preparing" | "ready" | "on_the_way" | "delivered";

export const revenueSeries = [
  { day: "Mon", revenue: 4200, orders: 61 },
  { day: "Tue", revenue: 5100, orders: 75 },
  { day: "Wed", revenue: 4800, orders: 72 },
  { day: "Thu", revenue: 6300, orders: 91 },
  { day: "Fri", revenue: 7600, orders: 110 },
  { day: "Sat", revenue: 8200, orders: 124 },
  { day: "Sun", revenue: 6900, orders: 98 },
];

export const topProducts = [
  { id: "1", name: "Truffle Mushroom", sold: 142, stock: 74, category: "Pizza" },
  { id: "2", name: "Smoky BBQ Burger", sold: 131, stock: 42, category: "Burger" },
  { id: "3", name: "Crispy Chicken Bowl", sold: 97, stock: 56, category: "Bowl" },
  { id: "4", name: "Cold Brew Float", sold: 88, stock: 64, category: "Drinks" },
];

export const orderFeed = [
  { id: "VH-9201", customer: "Alyssa M.", amount: 39.5, status: "incoming" as OrderStatus, eta: "14 min", rider: "No rider yet" },
  { id: "VH-9200", customer: "Noah T.", amount: 28.75, status: "preparing" as OrderStatus, eta: "11 min", rider: "Samir P." },
  { id: "VH-9199", customer: "Lina K.", amount: 22.2, status: "on_the_way" as OrderStatus, eta: "7 min", rider: "Darren W." },
];

export const activityFeed = [
  { id: "a1", time: "2m ago", text: "Order VH-9201 received from Uber Eats channel." },
  { id: "a2", time: "7m ago", text: "Courier assigned to VH-9200 (Samir P.)." },
  { id: "a3", time: "13m ago", text: "Menu item 'Smoky BBQ Burger' stock dropped below 50." },
  { id: "a4", time: "24m ago", text: "Team member Dana updated Friday working hours." },
];

export const heatmapData = [
  { hour: "08", traffic: 24 },
  { hour: "10", traffic: 46 },
  { hour: "12", traffic: 91 },
  { hour: "14", traffic: 74 },
  { hour: "16", traffic: 59 },
  { hour: "18", traffic: 99 },
  { hour: "20", traffic: 88 },
  { hour: "22", traffic: 51 },
];
