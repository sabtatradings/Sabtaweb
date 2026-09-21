"use client"

import { useRef, useState, useTransition } from "react"
import { GripVertical, ImageUp, Pencil, Plus, Trash2, X } from "lucide-react"
import type { CategoryMeta } from "@/lib/site-data"
import {
  deleteCategoryAction,
  reorderCategoriesAction,
  uploadMediaAction,
} from "@/app/admin/actions"

export function CategoryEditor({ initialCategories }: { initialCategories: CategoryMeta[] }) {
  const [categories, setCategories] = useState<CategoryMeta[]>(initialCategories)
  const [editingCategory, setEditingCategory] = useState<CategoryMeta | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dragId, setDragId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageFile(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadMediaAction(file)
      setImageUrl(result.url)
    } catch (err) {
      console.error("Failed to upload category image:", err)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(sourceSlug: string, targetSlug: string) {
    if (!sourceSlug || sourceSlug === targetSlug) return
    const list = [...categories]
    const fromIdx = list.findIndex((c) => c.slug === sourceSlug)
    const toIdx = list.findIndex((c) => c.slug === targetSlug)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = list.splice(fromIdx, 1)
    list.splice(toIdx, 0, moved)
    setCategories(list)
    setDragId(null)
    startTransition(async () => {
      await reorderCategoriesAction(list.map((c) => c.slug))
    })
  }

  async function handleDelete(slug: string, name: string) {
    if (!confirm(`Delete range "${name}"? All products inside this range will be deleted. This cannot be undone.`)) return
    setCategories((prev) => prev.filter((c) => c.slug !== slug))
    await deleteCategoryAction(slug)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold uppercase text-foreground">Product Ranges (Categories)</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Drag rows to reorder ranges on the web page header and grids.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null)
            setImageUrl("")
            setShowAddForm(true)
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg btn-primary px-4 text-xs font-bold"
        >
          <Plus className="size-4" /> Add Range
        </button>
      </div>

      {/* Category List */}
      <div className="card-premium p-0 overflow-hidden">
        <ul className="divide-y divide-border">
          {categories.map((cat) => (
            <li
              key={cat.slug}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", cat.slug)
                e.dataTransfer.effectAllowed = "move"
                setDragId(cat.slug)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
              }}
              onDrop={(e) => {
                e.preventDefault()
                const sourceSlug = e.dataTransfer.getData("text/plain")
                handleDrop(sourceSlug, cat.slug)
              }}
              onDragEnd={() => setDragId(null)}
              className={`flex items-center gap-4 px-5 py-4 transition-opacity ${
                dragId === cat.slug ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
              <div
                className="size-8 rounded-lg flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm"
                style={{ backgroundColor: cat.color }}
              >
                {cat.icon.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground truncate">{cat.shortDescription}</p>
              </div>
              <div className="text-xs text-muted-foreground font-semibold px-2 shrink-0">
                Catalog Pages: {cat.pageRange[0]}–{cat.pageRange[1]}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingCategory(cat)
                  setImageUrl(cat.image ?? "")
                }}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input text-muted-foreground hover:text-accent"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat.slug, cat.name)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input text-muted-foreground hover:border-red-300 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {isPending && <p className="text-xs text-muted-foreground">Saving category order…</p>}

      {/* Add / Edit Form Modal */}
      {(showAddForm || editingCategory) && (
        <div key={editingCategory?.slug ?? "new"} className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <button
              onClick={() => {
                setShowAddForm(false)
                setEditingCategory(null)
              }}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
            >
              <X className="size-5" />
            </button>

            <h3 className="text-lg font-bold uppercase tracking-tight text-foreground">
              {editingCategory ? `Edit Range: ${editingCategory.name}` : "Add Product Range"}
            </h3>

            <form method="post" action="/admin/save/category" className="mt-6 flex flex-col gap-4 text-sm">
              {editingCategory && <input type="hidden" name="originalSlug" value={editingCategory.slug} />}
              {!editingCategory && (
                <div>
                  <label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    URL Slug
                  </label>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    required
                    placeholder="e.g. marine-fasteners"
                    className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              )}

              <div>
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Range Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={editingCategory?.name}
                  placeholder="e.g. Stainless Bolts"
                  className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label htmlFor="shortDescription" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Short Summary (shown in footer/grids)
                </label>
                <input
                  id="shortDescription"
                  name="shortDescription"
                  type="text"
                  required
                  defaultValue={editingCategory?.shortDescription}
                  placeholder="e.g. Marine grade fasteners and hardware."
                  className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Full Page Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  defaultValue={editingCategory?.description}
                  placeholder="Provide details about grades, mechanical specs, and options stocked."
                  className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="icon" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Icon representation
                  </label>
                  <select
                    id="icon"
                    name="icon"
                    defaultValue={editingCategory?.icon ?? "clamp"}
                    className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="clamp">Clamp</option>
                    <option value="band">Banding System</option>
                    <option value="rigging">Rigging</option>
                    <option value="marine">Marine</option>
                    <option value="pin">Pin / Clip</option>
                    <option value="bolt">Bolt</option>
                    <option value="nut">Nut</option>
                    <option value="washer">Washer</option>
                    <option value="misc">Workshop Consumables</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="color" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Theme Color (Hex)
                  </label>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      id="color"
                      name="color"
                      type="color"
                      defaultValue={editingCategory?.color ?? "#1b2a80"}
                      className="size-11 shrink-0 rounded-lg border border-input bg-background p-1 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground font-mono">Theme accent</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cover Photo (optional — falls back to a product photo)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
                />
                <input type="hidden" name="image" value={imageUrl} />
                <div className="mt-1 flex items-center gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-input bg-white">
                    {imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="Cover preview" className="size-full object-contain p-1" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-accent bg-accent/5 px-4 text-xs font-bold text-accent hover:bg-accent hover:text-white"
                  >
                    <ImageUp className="size-4" /> {uploading ? "Uploading..." : imageUrl ? "Change Image" : "Add Image"}
                  </button>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-xs font-bold text-muted-foreground hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pageRangeStart" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Catalog Page Start
                  </label>
                  <input
                    id="pageRangeStart"
                    name="pageRangeStart"
                    type="number"
                    required
                    defaultValue={editingCategory?.pageRange[0] ?? 0}
                    className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label htmlFor="pageRangeEnd" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Catalog Page End
                  </label>
                  <input
                    id="pageRangeEnd"
                    name="pageRangeEnd"
                    type="number"
                    required
                    defaultValue={editingCategory?.pageRange[1] ?? 0}
                    className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="brandNote" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Brand Tagline (optional)
                </label>
                <input
                  id="brandNote"
                  name="brandNote"
                  type="text"
                  defaultValue={editingCategory?.brandNote}
                  placeholder="e.g. Rubit Brand"
                  className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <button type="submit" className="mt-4 h-12 w-full rounded-lg btn-primary text-sm font-bold uppercase tracking-wider">
                {editingCategory ? "Save Range Details" : "Add Range to Catalogue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
