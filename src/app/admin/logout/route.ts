import type { NextRequest } from "next/server"
import { signOutAdmin } from "@/lib/auth"
import { isSameOrigin, seeOther } from "@/lib/admin-form"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return seeOther("/admin/login")
  await signOutAdmin()
  return seeOther("/admin/login")
}
