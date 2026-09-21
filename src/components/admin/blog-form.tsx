"use client"

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Heading2,
  ImagePlus,
  ImageUp,
  List,
  ListPlus,
  Loader2,
  Plus,
  Trash2,
  Type,
  X,
} from "lucide-react"
import { createPostAction, updatePostAction, uploadMediaAction } from "@/app/admin/actions"
import type { BlogContentBlock, BlogPost } from "@/lib/blog"

const CATEGORY_SUGGESTIONS = ["Buying Guides", "Marine & Rigging", "Standards & Materials"]
const EXCERPT_SOFT_LIMIT = 200

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/60 hover:border-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15"
const textareaClass =
  "w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/60 hover:border-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15"
const iconBtn =
  "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-30"
const ghostBtn =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-foreground shadow-sm transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function emptyBlock(type: BlogContentBlock["type"]): BlogContentBlock {
  if (type === "ul") return { type: "ul", items: [""] }
  return { type, text: "" }
}

function countWords(text: string) {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-5 py-4 sm:px-7">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </header>
      <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  action,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  hint?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {action}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Textarea that grows with its content instead of scrolling. */
function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minRows?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={textareaClass}
    />
  )
}

const BLOCK_META = {
  p: { label: "Paragraph", Icon: AlignLeft },
  h2: { label: "Heading", Icon: Heading2 },
  ul: { label: "Bullet list", Icon: List },
} as const

export function BlogForm({ post }: { post?: BlogPost }) {
  const router = useRouter()
  const uid = useId()
  const id = (name: string) => `${uid}-${name}`
  const isEditing = !!post
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(post?.title ?? "")
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [category, setCategory] = useState(post?.category ?? "Buying Guides")
  const [publishedAt, setPublishedAt] = useState(post?.publishedAt ?? todayISO())
  const [readTime, setReadTime] = useState(post?.readTime ?? "5 min read")
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "")
  const [coverAlt, setCoverAlt] = useState(post?.coverAlt ?? "")
  const [body, setBody] = useState<BlogContentBlock[]>(post?.body ?? [{ type: "p", text: "" }])

  const [uploading, setUploading] = useState(false)
  const [previewBroken, setPreviewBroken] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Warn before leaving with unsaved edits.
  const dirtyRef = useRef(false)
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    dirtyRef.current = true
  }, [title, excerpt, category, publishedAt, readTime, coverImage, coverAlt, body])
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [])

  const wordCount = useMemo(
    () =>
      body.reduce(
        (sum, b) => sum + (b.type === "ul" ? b.items.reduce((s, i) => s + countWords(i), 0) : countWords(b.text)),
        0,
      ),
    [body],
  )
  const suggestedReadTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`

  async function handleCoverFile(file: File | null) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const result = await uploadMediaAction(file)
      setCoverImage(result.url)
      setPreviewBroken(false)
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "Failed to upload cover image.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function updateBlock(index: number, next: BlogContentBlock) {
    setBody((prev) => prev.map((b, i) => (i === index ? next : b)))
  }

  function removeBlock(index: number) {
    setBody((prev) => prev.filter((_, i) => i !== index))
  }

  function moveBlock(index: number, dir: -1 | 1) {
    setBody((prev) => {
      const target = index + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  function addBlock(type: BlogContentBlock["type"]) {
    setBody((prev) => [...prev, emptyBlock(type)])
  }

  function focusItem(blockIndex: number, itemIndex: number) {
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLInputElement>(`[data-uid="${uid}"][data-block="${blockIndex}"][data-item="${itemIndex}"]`)
        ?.focus()
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanedBody = body
      .map((b) =>
        b.type === "ul" ? { ...b, items: b.items.map((i) => i.trim()).filter(Boolean) } : { ...b, text: b.text.trim() },
      )
      .filter((b) => (b.type === "ul" ? b.items.length > 0 : b.text.length > 0))

    if (cleanedBody.length === 0) {
      setError("Add at least one paragraph, heading or list to the article.")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const input = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      category: category.trim(),
      publishedAt,
      readTime: readTime.trim(),
      coverImage: coverImage.trim(),
      coverAlt: coverAlt.trim(),
      body: cleanedBody,
    }

    startTransition(async () => {
      try {
        if (isEditing && post) {
          await updatePostAction(post.slug, input)
        } else {
          await createPostAction(input)
        }
        dirtyRef.current = false
        router.push("/admin/blog")
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error && err.message ? err.message : "Failed to save post.")
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    })
  }

  const busy = isPending || uploading

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-4">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss" className="text-red-500 hover:text-red-700">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ── Post details ─────────────────────────────── */}
      <Section title="Post details" hint="Shown on the blog listing and at the top of the article.">
        <Field label="Title" htmlFor={id("title")} required>
          <input
            id={id("title")}
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to choose the right shackle for marine rigging"
            className={`${inputClass} !h-12 text-base font-semibold`}
          />
        </Field>

        <Field
          label="Excerpt"
          htmlFor={id("excerpt")}
          required
          hint="A one or two sentence summary for the blog cards and search results."
          action={
            <span
              className={`text-[11px] tabular-nums ${excerpt.length > EXCERPT_SOFT_LIMIT ? "font-bold text-amber-600" : "text-muted-foreground"}`}
            >
              {excerpt.length}/{EXCERPT_SOFT_LIMIT}
            </span>
          }
        >
          <textarea
            id={id("excerpt")}
            rows={3}
            required
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="What will readers learn from this post?"
            className={textareaClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Category" htmlFor={id("category")} required>
            <input
              id={id("category")}
              type="text"
              required
              list={id("categories")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            />
            <datalist id={id("categories")}>
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Published date" htmlFor={id("date")} required>
            <input
              id={id("date")}
              type="date"
              required
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Read time"
            htmlFor={id("readtime")}
            required
            action={
              wordCount > 0 && readTime !== suggestedReadTime ? (
                <button
                  type="button"
                  onClick={() => setReadTime(suggestedReadTime)}
                  className="text-[11px] font-bold text-accent hover:underline"
                >
                  Use {suggestedReadTime}
                </button>
              ) : null
            }
          >
            <input
              id={id("readtime")}
              type="text"
              required
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* ── Cover image ──────────────────────────────── */}
      <Section title="Cover image" hint="Shown on the blog card and above the article. Landscape images work best.">
        <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
          <div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
              {coverImage && !previewBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt={coverAlt || "Cover preview"}
                  onError={() => setPreviewBroken(true)}
                  className="absolute inset-0 size-full object-contain p-2"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-muted-foreground">
                  <ImagePlus className="size-7" aria-hidden="true" />
                  <span className="text-xs">{coverImage ? "Preview unavailable" : "No image yet"}</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 className="size-6 animate-spin text-accent" aria-label="Uploading" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-accent bg-accent/5 px-4 text-xs font-bold text-accent transition hover:bg-accent hover:text-white disabled:opacity-60"
              >
                <ImageUp className="size-4" /> {uploading ? "Uploading…" : coverImage ? "Replace image" : "Upload image"}
              </button>
              {coverImage && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage("")
                    setPreviewBroken(false)
                  }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" /> Remove
                </button>
              )}
            </div>

            <Field label="Image URL" htmlFor={id("cover")} required hint="Filled in automatically after upload, or paste an existing path.">
              <input
                id={id("cover")}
                type="text"
                required
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value)
                  setPreviewBroken(false)
                }}
                placeholder="https://… or /blog/cover.jpg"
                className={inputClass}
              />
            </Field>

            <Field label="Alt text" htmlFor={id("alt")} required hint="Describe the image for screen readers and search engines.">
              <input
                id={id("alt")}
                type="text"
                required
                value={coverAlt}
                onChange={(e) => setCoverAlt(e.target.value)}
                placeholder="e.g. Stainless steel bow shackle on a rigging line"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Article content ──────────────────────────── */}
      <Section title="Article content" hint="Build the article from paragraphs, headings and bullet lists, in the order they appear.">
        <div className="flex flex-col gap-3">
          {body.map((block, i) => {
            const { label, Icon } = BLOCK_META[block.type]
            return (
              <div
                key={i}
                className="rounded-xl border border-slate-200 border-l-4 border-l-accent/70 bg-slate-50/60 p-4 transition focus-within:border-slate-300 focus-within:border-l-accent focus-within:bg-white"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-accent">
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} aria-label="Move up" className={iconBtn}>
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(i, 1)}
                      disabled={i === body.length - 1}
                      aria-label="Move down"
                      className={iconBtn}
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(i)}
                      aria-label={`Delete ${label.toLowerCase()}`}
                      className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {block.type === "ul" ? (
                  <div className="space-y-2">
                    {block.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <input
                          type="text"
                          data-uid={uid}
                          data-block={i}
                          data-item={ii}
                          value={item}
                          placeholder="List item"
                          aria-label={`List item ${ii + 1}`}
                          onChange={(e) => {
                            const items = [...block.items]
                            items[ii] = e.target.value
                            updateBlock(i, { ...block, items })
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const items = [...block.items]
                              items.splice(ii + 1, 0, "")
                              updateBlock(i, { ...block, items })
                              focusItem(i, ii + 1)
                            } else if (e.key === "Backspace" && item === "" && block.items.length > 1) {
                              e.preventDefault()
                              updateBlock(i, { ...block, items: block.items.filter((_, x) => x !== ii) })
                              focusItem(i, Math.max(0, ii - 1))
                            }
                          }}
                          className={`${inputClass} !h-10`}
                        />
                        <button
                          type="button"
                          onClick={() => updateBlock(i, { ...block, items: block.items.filter((_, x) => x !== ii) })}
                          disabled={block.items.length === 1}
                          aria-label={`Remove list item ${ii + 1}`}
                          className={iconBtn}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        updateBlock(i, { ...block, items: [...block.items, ""] })
                        focusItem(i, block.items.length)
                      }}
                      className="ml-3.5 inline-flex h-8 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-accent transition hover:bg-accent/10"
                    >
                      <Plus className="size-3.5" /> Add item
                    </button>
                    <p className="ml-3.5 text-[11px] text-muted-foreground">Tip: press Enter to add the next item.</p>
                  </div>
                ) : block.type === "h2" ? (
                  <input
                    type="text"
                    value={block.text}
                    onChange={(e) => updateBlock(i, { ...block, text: e.target.value })}
                    placeholder="Section heading"
                    aria-label="Section heading"
                    className={`${inputClass} !h-12 text-base font-bold`}
                  />
                ) : (
                  <AutoTextarea
                    value={block.text}
                    onChange={(text) => updateBlock(i, { ...block, text })}
                    placeholder="Write your paragraph…"
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-3">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Add</span>
          <button type="button" onClick={() => addBlock("p")} className={ghostBtn}>
            <Type className="size-3.5" /> Paragraph
          </button>
          <button type="button" onClick={() => addBlock("h2")} className={ghostBtn}>
            <Heading2 className="size-3.5" /> Heading
          </button>
          <button type="button" onClick={() => addBlock("ul")} className={ghostBtn}>
            <ListPlus className="size-3.5" /> Bullet list
          </button>
        </div>
      </Section>

      {/* ── Sticky action bar ────────────────────────── */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:px-5">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground tabular-nums">{wordCount}</span> words
          <span className="mx-1.5">·</span>
          ~{suggestedReadTime}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/blog"
            className="inline-flex h-11 items-center rounded-lg px-4 text-sm font-bold text-muted-foreground transition hover:bg-slate-100 hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary inline-flex h-11 items-center gap-2 px-6 text-sm uppercase tracking-wider disabled:opacity-60"
          >
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isPending ? "Saving…" : isEditing ? "Save changes" : "Publish post"}
          </button>
        </div>
      </div>
    </form>
  )
}
