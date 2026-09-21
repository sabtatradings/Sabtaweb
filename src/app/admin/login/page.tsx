import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAdminUser } from "@/lib/auth"

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Incorrect email or password. Please try again.",
  denied: "This account doesn't have admin access.",
  limited: "Too many attempts. Please wait a few minutes and try again.",
  unavailable: "Sign-in is temporarily unavailable. Please try again shortly.",
}

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  // Already signed in (e.g. opened /admin/login in a new tab): go straight in.
  if (await getAdminUser()) redirect("/admin")

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <p className="eyebrow">Sabta Trading</p>
      <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-foreground">Admin Login</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to manage the product catalog.</p>

      {error && (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, error) ? ERROR_MESSAGES[error] : ERROR_MESSAGES.invalid}
        </p>
      )}

      <form method="post" action="/admin/login/submit" className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-foreground">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="username"
            className="mt-1.5 h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="admin@sabtadxb.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1.5 h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button type="submit" className="h-12 rounded-lg btn-primary text-sm font-bold">
          Sign In
        </button>
      </form>
    </div>
  )
}
