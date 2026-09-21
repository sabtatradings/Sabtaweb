"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  ExternalLink,
  FolderTree,
  HelpCircle,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Package,
  Settings,
  Type,
  X,
} from "lucide-react"

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/content", label: "Page text", icon: Type },
  { href: "/admin/site", label: "Site & contact", icon: Settings },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/media", label: "Media", icon: Images },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground lg:hidden">
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <span className="text-sm font-bold uppercase tracking-wide">Sabta Trading Admin</span>
      </div>

      <aside
        className={`${open ? "flex" : "hidden"} shrink-0 flex-col bg-primary text-primary-foreground lg:flex lg:h-screen lg:sticky lg:top-0 lg:w-60 lg:overflow-y-auto`}
      >
        <div className="hidden px-5 py-5 lg:block">
          <p className="text-sm font-black uppercase tracking-wide">Sabta Trading</p>
          <p className="text-xs text-primary-foreground/60">Admin panel</p>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white/15 text-primary-foreground"
                    : "text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary-foreground/70 transition hover:bg-white/10 hover:text-primary-foreground"
          >
            <ExternalLink className="size-4" />
            View site
          </Link>
          <form method="post" action="/admin/logout">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-primary-foreground/70 transition hover:bg-white/10 hover:text-primary-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
          <p className="px-3 pt-2 text-xs text-primary-foreground/40">Signed in as Admin</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
