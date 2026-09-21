import type { NextRequest } from "next/server"
import { getAdminUser } from "@/lib/auth"
import { isSameOrigin, seeOther } from "@/lib/admin-form"
import { createProductAction, updateProductAction } from "@/app/admin/actions"

export const dynamic = "force-dynamic"

// Add / edit product is a plain multipart form POST answered with a 303
// redirect (not a server action), so the browser finishes with an ordinary
// full page load instead of Next's client-side action handling.
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return seeOther("/admin/products")
  if (!(await getAdminUser())) return seeOther("/admin/login")

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return seeOther("/admin/products/new?error=" + encodeURIComponent("The upload was too large or was interrupted. Try a smaller photo."))
  }

  const id = String(form.get("id") || "")
  const categorySlug = String(form.get("categorySlug") || "")

  try {
    return seeOther(id ? await updateProductAction(id, form) : await createProductAction(form))
  } catch (err) {
    console.error("Saving product failed:", err)
    const message = err instanceof Error && err.message ? err.message : "Could not save the product."
    const params = new URLSearchParams({ error: message })
    if (!id && categorySlug) params.set("category", categorySlug)
    return seeOther(`${id ? `/admin/products/${encodeURIComponent(id)}/edit` : "/admin/products/new"}?${params}`)
  }
}
