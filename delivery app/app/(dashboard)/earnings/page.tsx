"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/http";
import * as Earnings from "@/services/earnings";
import { useAuthStore } from "@/store/authStore";
import { useDriverStore } from "@/store/driverStore";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatEtb(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 }).format(Math.round(v));
}

function formatTime(ts: number) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(ts));
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function useCountUp(target: number, durationMs = 650) {
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const [value, setValue] = useState(() => (Number.isFinite(target) ? target : 0));

  useEffect(() => {
    const to = Number.isFinite(target) ? target : 0;
    const from = value;
    if (from === to) return;

    fromRef.current = from;
    const start = performance.now();

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    const step = (t: number) => {
      const k = clamp((t - start) / durationMs, 0, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      const next = fromRef.current + (to - fromRef.current) * eased;
      setValue(next);
      if (k < 1) rafRef.current = requestAnimationFrame(step);
      else rafRef.current = null;
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}

export default function EarningsPage() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const todayEtb = useDriverStore((s) => s.earningsTodayBirr);
  const weekEtb = useDriverStore((s) => s.earningsWeekBirr);
  const setEarnings = useDriverStore((s) => s.setEarnings);

  const [rows, setRows] = useState<Earnings.EarningsHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [summary, history] = await Promise.all([Earnings.getSummary(token), Earnings.getHistory(token)]);
        if (cancelled) return;
        setEarnings({ todayEtb: summary.todayEtb, weekEtb: summary.weekEtb });
        setRows(history.rows);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          logout();
          return;
        }
        setErrorMsg(e instanceof Error ? e.message : "Failed to load earnings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [logout, setEarnings, token]);

  const animatedToday = useCountUp(todayEtb);

  const dailyGoalEtb = 500;
  const weeklyGoalEtb = 2500;

  const deliveriesToday = useMemo(() => {
    const day0 = startOfDay(Date.now());
    return rows.reduce((n, r) => (r.at >= day0 ? n + 1 : n), 0);
  }, [rows]);

  const lastHourEtb = useMemo(() => {
    const cutoff = Date.now() - 60 * 60_000;
    return rows.reduce((sum, r) => (r.at >= cutoff ? sum + r.amountEtb : sum), 0);
  }, [rows]);

  const avgPerDeliveryEtb = useMemo(() => {
    if (!deliveriesToday) return 0;
    return Math.round((todayEtb / Math.max(1, deliveriesToday)) * 10) / 10;
  }, [deliveriesToday, todayEtb]);

  const peak = useMemo(() => {
    if (!rows.length) return { label: "—", amountEtb: 0 };
    const byHour = new Map<number, number>();
    for (const r of rows) {
      const h = new Date(r.at).getHours();
      byHour.set(h, (byHour.get(h) ?? 0) + r.amountEtb);
    }
    let bestHour = new Date(rows[0].at).getHours();
    let bestAmt = -1;
    for (const [h, amt] of byHour.entries()) {
      if (amt > bestAmt) {
        bestAmt = amt;
        bestHour = h;
      }
    }
    return { label: `${String(bestHour).padStart(2, "0")}:00`, amountEtb: Math.round(bestAmt) };
  }, [rows]);

  const nowHour = new Date().getHours();
  const peakBonusActive = nowHour >= 18 && nowHour <= 21;

  const insight = useMemo(() => {
    const pct = clamp(todayEtb / dailyGoalEtb, 0, 1);
    if (!deliveriesToday) return "Kick off your day with 1 quick delivery. Momentum matters.";
    if (pct >= 0.95) return "You’re basically at your goal. One more delivery can push you over the top.";
    if (peakBonusActive) return "Peak hours are live. Stay active now to boost your ETB per delivery.";
    if (pct < 0.35 && nowHour >= 14) return "Afternoons can be slower. Try busy restaurant areas for faster pickups.";
    if (avgPerDeliveryEtb < 55) return "Your average is a bit low. Accept slightly longer trips for better payouts.";
    return "Consistency wins. A steady pace keeps your earnings climbing.";
  }, [avgPerDeliveryEtb, dailyGoalEtb, deliveriesToday, nowHour, peakBonusActive, todayEtb]);

  return (
    <div className="space-y-4">
      <EarningsHero amountEtb={animatedToday} deliveriesToday={deliveriesToday} lastHourEtb={lastHourEtb} />

      <div className="grid gap-3 lg:grid-cols-2">
        <GoalProgress todayEtb={todayEtb} dailyGoalEtb={dailyGoalEtb} weekEtb={weekEtb} weeklyGoalEtb={weeklyGoalEtb} />
        <Incentives deliveriesToday={deliveriesToday} peakBonusActive={peakBonusActive} remainingToDailyGoalEtb={Math.max(0, dailyGoalEtb - todayEtb)} />
      </div>

      <QuickStats
        deliveriesToday={deliveriesToday}
        avgPerDeliveryEtb={avgPerDeliveryEtb}
        peakHourLabel={peak.label}
        peakHourEtb={peak.amountEtb}
        totalRows={rows.length}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <EarningsList rows={rows} loading={loading} errorMsg={errorMsg} />
        <InsightCard message={insight} />
      </div>
    </div>
  );
}

function EarningsHero(p: { amountEtb: number; deliveriesToday: number; lastHourEtb: number }) {
  const rounded = Math.max(0, Math.round(p.amountEtb));
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-[0.18em] text-muted">TODAY</div>
          <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
            <div className="text-4xl font-semibold tracking-tight text-emerald-300 sm:text-5xl">{formatEtb(rounded)}</div>
            <div className="pb-1 text-sm font-semibold text-white/90">ETB</div>
          </div>
          <div className="mt-2 text-sm text-muted">
            {p.lastHourEtb > 0 ? (
              <span className="text-white/90">
                +{formatEtb(p.lastHourEtb)} ETB <span className="text-muted">last hour</span>
              </span>
            ) : (
              <span>Stay online to catch the next high-paying run.</span>
            )}
          </div>
        </div>
        <div className="shrink-0 rounded-2xl bg-emerald-400/10 px-3 py-2 ring-1 ring-emerald-300/20">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-emerald-200/90">DELIVERIES</div>
          <div className="mt-1 text-2xl font-semibold text-white/90 tabular-nums">{p.deliveriesToday}</div>
        </div>
      </div>
    </Card>
  );
}

function GoalProgress(p: { todayEtb: number; dailyGoalEtb: number; weekEtb: number; weeklyGoalEtb: number }) {
  const pct = clamp(p.todayEtb / Math.max(1, p.dailyGoalEtb), 0, 1);
  const pctLabel = Math.round(pct * 100);
  const left = Math.max(0, Math.round(p.dailyGoalEtb - p.todayEtb));
  const weekPct = clamp(p.weekEtb / Math.max(1, p.weeklyGoalEtb), 0, 1);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">Daily goal</div>
          <div className="mt-1 text-sm text-muted">
            {left > 0 ? (
              <span>
                <span className="text-white/90">{formatEtb(left)} ETB</span> to reach{" "}
                <span className="text-white/90">{formatEtb(p.dailyGoalEtb)} ETB</span>
              </span>
            ) : (
              <span className="text-white/90">Goal reached. Keep stacking ETB.</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-muted">Progress</div>
          <div className="mt-1 text-2xl font-semibold text-white/90 tabular-nums">{pctLabel}%</div>
        </div>
      </div>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
        <div
          className="h-full rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(34,197,94,0.25)]"
          style={{ width: `${Math.max(4, Math.round(pct * 100))}%` }}
        />
      </div>

      <div className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted">Week</div>
            <div className="mt-1 text-lg font-semibold text-white/90">
              {formatEtb(p.weekEtb)} <span className="text-sm font-semibold text-muted">ETB</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">Mini progress</div>
            <div className="mt-1 text-sm font-semibold text-white/90 tabular-nums">{Math.round(weekPct * 100)}%</div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
          <div className="h-full rounded-full bg-white/30" style={{ width: `${Math.max(6, Math.round(weekPct * 100))}%` }} />
        </div>
      </div>
    </Card>
  );
}

function QuickStats(p: { deliveriesToday: number; avgPerDeliveryEtb: number; peakHourLabel: string; peakHourEtb: number; totalRows: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Deliveries today" value={`${p.deliveriesToday}`} tone="neutral" />
      <StatCard label="Avg / delivery" value={`${formatEtb(p.avgPerDeliveryEtb)} ETB`} tone="money" />
      <StatCard label="Peak hour" value={`${formatEtb(p.peakHourEtb)} ETB`} sub={p.peakHourLabel} tone="money" />
      <StatCard label="History rows" value={`${p.totalRows}`} tone="neutral" />
    </div>
  );
}

function StatCard(p: { label: string; value: string; sub?: string; tone: "money" | "neutral" }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted">{p.label}</div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums", p.tone === "money" ? "text-emerald-300" : "text-white/90")}>
        {p.value}
      </div>
      {p.sub ? <div className="mt-1 text-xs text-muted">{p.sub}</div> : <div className="mt-1 text-xs text-muted"> </div>}
    </Card>
  );
}

function Incentives(p: { deliveriesToday: number; peakBonusActive: boolean; remainingToDailyGoalEtb: number }) {
  const remainingDeliveries = Math.max(0, 3 - p.deliveriesToday);
  const bonusLine =
    remainingDeliveries > 0
      ? `Complete ${remainingDeliveries} more ${remainingDeliveries === 1 ? "delivery" : "deliveries"} → +50 ETB`
      : "Milestone unlocked → +50 ETB earned";

  return (
    <Card className="p-5">
      <div className="text-sm font-semibold">Bonuses & incentives</div>
      <div className="mt-1 text-sm text-muted">Quick wins that boost your ETB.</div>

      <div className="mt-4 space-y-3">
        <IncentiveRow title={bonusLine} pill={remainingDeliveries > 0 ? "Active" : "Done"} tone={remainingDeliveries > 0 ? "money" : "neutral"} />
        <IncentiveRow title={p.peakBonusActive ? "Peak hour bonus active" : "Peak hour bonus (6–9 PM)"} pill={p.peakBonusActive ? "Live" : "Soon"} tone={p.peakBonusActive ? "money" : "neutral"} />
        <IncentiveRow
          title={p.remainingToDailyGoalEtb > 0 ? `Reach your goal → ${formatEtb(p.remainingToDailyGoalEtb)} ETB left` : "Goal reached → keep earning"}
          pill={p.remainingToDailyGoalEtb > 0 ? "Goal" : "Done"}
          tone={p.remainingToDailyGoalEtb > 0 ? "neutral" : "money"}
        />
      </div>
    </Card>
  );
}

function IncentiveRow(p: { title: string; pill: string; tone: "money" | "neutral" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <div className="min-w-0 text-sm font-semibold text-white/90">{p.title}</div>
      <div
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.12em]",
          p.tone === "money"
            ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20"
            : "bg-white/10 text-white/80 ring-1 ring-white/10",
        )}
      >
        {p.pill}
      </div>
    </div>
  );
}

function EarningsList(p: { rows: Earnings.EarningsHistoryRow[]; loading: boolean; errorMsg: string | null }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Recent earnings</div>
        <div className="text-xs text-muted">{p.rows.length ? `${p.rows.length} rows` : p.loading ? "Loading..." : "—"}</div>
      </div>

      {p.errorMsg ? (
        <div className="mt-4 rounded-2xl bg-rose-400/10 p-4 text-sm text-rose-200 ring-1 ring-rose-300/20">{p.errorMsg}</div>
      ) : null}

      {p.rows.length ? (
        <div className="mt-4 space-y-2">
          {p.rows.slice(0, 10).map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white/90">{r.orderId}</div>
                <div className="mt-1 text-xs text-muted">{formatTime(r.at)}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold text-emerald-300">+{formatEtb(r.amountEtb)} ETB</div>
                <div className="mt-1 text-[11px] text-muted">Earned</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-muted ring-1 ring-white/10">
          {p.loading ? "Loading history..." : "No earnings yet. Complete a delivery to start building momentum."}
        </div>
      )}
    </Card>
  );
}

function InsightCard(p: { message: string }) {
  return (
    <Card className="p-5">
      <div className="text-sm font-semibold">Smart insight</div>
      <div className="mt-1 text-sm text-muted">A quick tip to earn more with less effort.</div>
      <div className="mt-4 rounded-2xl bg-emerald-400/10 p-4 ring-1 ring-emerald-300/20">
        <div className="text-sm font-semibold text-white/90">{p.message}</div>
        <div className="mt-2 text-xs text-muted">Keep your pace steady. Small wins stack fast.</div>
      </div>
    </Card>
  );
}

