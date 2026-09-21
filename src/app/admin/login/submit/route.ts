import type { NextRequest } from "next/server"
import { signInAdmin } from "@/lib/auth"
import { isSameOrigin, seeOther } from "@/lib/admin-form"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return seeOther("/admin/login")

  let email = ""
  let password = ""
  try {
    const form = await req.formData()
    email = String(form.get("email") || "")
    password = String(form.get("password") || "")
  } catch {
    return seeOther("/admin/login?error=invalid")
  }

  const result = await signInAdmin(email, password)
  return seeOther(result === "ok" ? "/admin" : `/admin/login?error=${result}`)
}
