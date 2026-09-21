import type { NextRequest } from "next/server"
import { getAdminUser } from "@/lib/auth"
import { isSameOrigin, seeOther } from "@/lib/admin-form"
import { createCategoryAction, updateCategoryAction } from "@/app/admin/actions"

export const dynamic = "force-dynamic"

// Add / edit product range: plain form POST + 303 redirect (see save/product).
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return seeOther("/admin/categories")
  if (!(await getAdminUser())) return seeOther("/admin/login")

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return seeOther("/admin/categories?error=" + encodeURIComponent("The form could not be read. Please try again."))
  }

  const originalSlug = String(form.get("originalSlug") || "")

  try {
    return seeOther(originalSlug ? await updateCategoryAction(originalSlug, form) : await createCategoryAction(form))
  } catch (err) {
    console.error("Saving category failed:", err)
    const message = err instanceof Error && err.message ? err.message : "Could not save the range."
    return seeOther(`/admin/categories?${new URLSearchParams({ error: message })}`)
  }
}
