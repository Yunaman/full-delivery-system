import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6">
      <section className="card w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold tracking-tight">Create vendor account</h1>
        <p className="mt-2 text-slate-500">Start managing operations in minutes.</p>
        <form className="mt-6 grid gap-4 sm:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Store name" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Owner name" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2" placeholder="Email" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2" placeholder="Password" type="password" />
          <Link href="/dashboard" className="sm:col-span-2 rounded-2xl bg-slate-900 py-3 text-center font-semibold text-white">
            Create account
          </Link>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account? <Link href="/login" className="font-semibold text-slate-900">Login</Link>
        </p>
      </section>
    </main>
  );
}
