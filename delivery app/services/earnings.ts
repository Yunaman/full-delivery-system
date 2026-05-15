"use client";

import { apiFetch } from "@/services/http";

export type DriverEarnings = {
  balance: number;
  total_earnings: number;
  total_deliveries: number;
  recent_payouts: {
    id: string;
    amount: number;
    status: string;
    method: string;
    created_at: string;
  }[];
};

export type EarningsHistoryRow = {
  id: string;
  orderId: string;
  amountEtb: number;
  at: number;
};

/**
 * Get driver earnings summary
 * Django endpoint: GET /api/drivers/earnings/
 */
export async function getEarnings(token: string) {
  return apiFetch<DriverEarnings>("/api/drivers/earnings/", { method: "GET", token, retry: 1 });
}

/**
 * Request a payout
 * Django endpoint: POST /api/drivers/request_payout/
 */
export async function requestPayout(token: string, amount: number, method: string = "bank_transfer") {
  return apiFetch<{
    id: string;
    amount: number;
    status: string;
    method: string;
    created_at: string;
  }>("/api/drivers/request_payout/", { 
    method: "POST", 
    token, 
    body: { amount, method }
  });
}

// Legacy compatibility exports
export async function getToday(token: string) {
  const earnings = await getEarnings(token);
  return { amountEtb: Math.round(earnings.total_earnings * 55) }; // Approximate conversion
}

export async function getSummary(token: string) {
  const earnings = await getEarnings(token);
  return { todayEtb: 0, weekEtb: Math.round(earnings.total_earnings * 55) };
}

export async function getHistory(token: string) {
  const earnings = await getEarnings(token);
  return { 
    rows: earnings.recent_payouts.map(p => ({
      id: p.id,
      amountEtb: Math.round(p.amount * 55),
      at: new Date(p.created_at).getTime(),
      orderId: p.id
    }))
  };
}
