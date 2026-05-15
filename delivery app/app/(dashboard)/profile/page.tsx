"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { DriverMe } from "@/lib/apiTypes";
import { ApiError } from "@/services/http";
import * as Driver from "@/services/driver";
import { useAuthStore } from "@/store/authStore";
import { useDriverStore } from "@/store/driverStore";

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const token = useAuthStore((s) => s.token);

  const me = useDriverStore((s) => s.me);
  const setMe = useDriverStore((s) => s.setMe);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const next = await Driver.getMe(token);
        if (cancelled) return;
        setMe(next);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          logout();
          return;
        }
        toast.error(e instanceof Error ? e.message : "Failed to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [logout, setMe, token]);

  const initials = useMemo(() => {
    const name = me?.fullName || "Driver";
    const out =
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "D";
    return out;
  }, [me?.fullName]);

  return (
    <div className="space-y-6">
      <IdentitySection me={me} initials={initials} loading={loading} />
      <DocumentsSection me={me} loading={loading} />
      <SecuritySection me={me} loading={loading} />
      <AccountSection
        onEdit={() => router.push("/profile/edit")}
        onVehicle={() => router.push("/profile/vehicle")}
        onSupport={() => router.push("/profile/support")}
        onLogout={() => logout()}
      />
    </div>
  );
}

function Section(p: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2">
        <div className="text-xs font-semibold tracking-[0.18em] text-muted">{p.title.toUpperCase()}</div>
        {p.subtitle ? <div className="mt-1 text-sm text-white/90">{p.subtitle}</div> : null}
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">{p.children}</div>
    </section>
  );
}

function Divider() {
  return <div className="h-px w-full bg-white/10" />;
}

function Row(p: { label: string; value: React.ReactNode; right?: React.ReactNode; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="text-xs text-muted">{p.label}</div>
        <div className={cn("mt-0.5 truncate text-sm font-semibold", p.dim ? "text-white/55" : "text-white/90")}>
          {p.value}
        </div>
      </div>
      {p.right ? <div className="shrink-0">{p.right}</div> : null}
    </div>
  );
}

function StatusPill(p: { status: "Verified" | "Pending" | "Rejected" | "Active"; tone?: "good" | "warn" | "bad" | "neutral" }) {
  const tone =
    p.tone ??
    (p.status === "Verified" || p.status === "Active"
      ? "good"
      : p.status === "Pending"
        ? "warn"
        : p.status === "Rejected"
          ? "bad"
          : "neutral");

  const cls =
    tone === "good"
      ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20"
      : tone === "warn"
        ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/20"
        : tone === "bad"
          ? "bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/20"
          : "bg-white/10 text-white/80 ring-1 ring-white/10";

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em]", cls)}>
      {p.status}
    </span>
  );
}

function IdentitySection(p: { me: DriverMe | null; initials: string; loading: boolean }) {
  const verified = Boolean(p.me?.verifiedDriver);
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-4">
        <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/18 via-sky-400/10 to-fuchsia-400/10" />
          <div className="relative text-lg font-semibold text-white/90">{p.initials}</div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("truncate text-xl font-semibold", p.loading ? "text-white/55" : "text-white/90")}>
              {p.me?.fullName ?? "—"}
            </div>
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
                <IconCheck className="size-3.5" /> Verified driver
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/10">
                Verification pending
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-muted">{p.me?.id ?? "—"}</div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <Row
          label="Phone number"
          value={p.me?.phone ?? "—"}
          right={p.me?.phoneVerified ? <StatusPill status="Verified" /> : <StatusPill status="Pending" />}
          dim={!p.me}
        />
        <Divider />
        <Row label="Vehicle type" value={p.me?.vehicleType ?? "—"} dim={!p.me} />
      </div>
    </div>
  );
}

function DocumentsSection(p: { me: DriverMe | null; loading: boolean }) {
  return (
    <Section title="Documents" subtitle="Verification status for required documents.">
      {(p.me?.documents ?? []).length ? (
        (p.me?.documents ?? []).map((d, idx, arr) => (
          <div key={d.kind}>
            <Row label={d.label} value={documentHelpText(d.kind)} right={<StatusPill status={d.status} />} />
            {idx < arr.length - 1 ? <Divider /> : null}
          </div>
        ))
      ) : (
        <Row label="Documents" value={p.loading ? "Loading..." : "No documents found"} dim />
      )}
    </Section>
  );
}

function SecuritySection(p: { me: DriverMe | null; loading: boolean }) {
  const account = p.me?.accountStatus ?? "Pending";
  return (
    <Section title="Security" subtitle="Phone verification and account status.">
      <Row
        label="Phone verification"
        value={p.me ? (p.me.phoneVerified ? "Verified" : "Not verified") : p.loading ? "Loading..." : "—"}
        right={p.me?.phoneVerified ? <StatusPill status="Verified" /> : <StatusPill status="Pending" />}
        dim={!p.me}
      />
      <Divider />
      <Row label="Account status" value={account} right={<StatusPill status={account} />} dim={!p.me} />
    </Section>
  );
}

function AccountSection(p: { onEdit: () => void; onVehicle: () => void; onSupport: () => void; onLogout: () => void }) {
  return (
    <Section title="Account" subtitle="Essential account controls.">
      <ActionRow label="Edit profile" onClick={p.onEdit} />
      <Divider />
      <ActionRow label="Change vehicle info" onClick={p.onVehicle} />
      <Divider />
      <ActionRow label="Help / Support" onClick={p.onSupport} />
      <Divider />
      <ActionRow label="Logout" onClick={p.onLogout} tone="danger" />
    </Section>
  );
}

function ActionRow(p: { label: string; onClick: () => void; tone?: "danger" | "default" }) {
  const tone = p.tone ?? "default";
  return (
    <button
      type="button"
      onClick={p.onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
        "hover:bg-white/[0.04] active:bg-white/[0.06]",
      )}
    >
      <div className={cn("text-sm font-semibold", tone === "danger" ? "text-rose-200" : "text-white/90")}>{p.label}</div>
      <IconChevron className="size-5 text-white/40" />
    </button>
  );
}

function documentHelpText(kind: DriverMe["documents"][number]["kind"]) {
  if (kind === "DRIVER_LICENSE") return "License on file";
  if (kind === "ID_CARD") return "ID on file";
  return "Registration on file";
}

function IconCheck(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden="true">
      <path d="M20 7 10.5 16.5 4 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevron(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
