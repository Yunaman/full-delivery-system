import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6">
      <section className="card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-slate-500">Login to your vendor workspace.</p>
        <form className="mt-6 space-y-4">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Password" type="password" />
          <Link href="/dashboard" className="block w-full rounded-2xl bg-slate-900 py-3 text-center font-semibold text-white">
            Login
          </Link>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          No account? <Link href="/register" className="font-semibold text-slate-900">Register</Link>
        </p>
      </section>
    </main>
  );
}
