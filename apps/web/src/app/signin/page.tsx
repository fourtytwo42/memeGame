import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="min-h-screen bg-[#0b0d12] px-4 py-10 text-slate-100">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md content-center gap-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Meme Foundry access
          </p>
          <h1 className="text-4xl font-black text-white">Sign in</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Use a seeded account for Stage 3 verification. Founder, supporter,
            crew, and admin accounts share the same seeded password.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <SignInForm />
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Seed password: MemeFoundry!123
        </p>
      </section>
    </main>
  );
}
