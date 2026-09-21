"use server"

import fs from "fs"
import path from "path"
import sharp from "sharp"
import { redirect } from "next/navigation"
import { revalidatePath } from "@/lib/revalidate"
import { v2 as cloudinary } from "cloudinary"
import { signInAdmin, signOutAdmin, requireAdmin } from "@/lib/auth"
import { createPost, updatePost, deletePost, type BlogPost, type BlogContentBlock } from "@/lib/blog"
import {
  addProduct,
  updateProduct,
  deleteProduct,
  reorderCategory,
  getProductById,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  saveSetting,
} from "@/lib/db"

// -------------------------------------------------------------
// Cloudinary Configuration & Image Optimization Helper
// -------------------------------------------------------------

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

async function saveProductImage(file: File, categorySlug: string, slug: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  // Optimize and resize image to WebP using sharp before upload/save.
  // No .flatten() here: every place a product photo is displayed already
  // sits it on a white background (catalog cards, admin thumbnails), so a
  // flattened-opaque image and a transparent one look identical there — but
  // keeping transparency lets a cutout PNG float cleanly in non-white spots
  // like the homepage hero carousel instead of showing a white box.
  const optimizedBuffer = await sharp(buffer)
    .rotate() // apply EXIF orientation
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 95 })
    .toBuffer()

  if (isCloudinaryConfigured) {
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `sabta-products/${categorySlug}`,
            public_id: slug,
            format: "webp",
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        stream.end(optimizedBuffer)
      })
      return (uploadResult as any).secure_url
    } catch (err) {
      console.error("Cloudinary upload failed, falling back to local file system:", err)
    }
  }

  // Fallback: Save to local public folder if Cloudinary is not configured or fails
  const dir = path.join(process.cwd(), "public", "products", categorySlug)
  fs.mkdirSync(dir, { recursive: true })
  const dest = path.join(dir, `${slug}.webp`)
  await sharp(optimizedBuffer).toFile(dest)
  return `/products/${categorySlug}/${slug}.webp`
}

function revalidateProductPaths(categorySlug: string, slug?: string) {
  revalidatePath("/")
  revalidatePath("/products")
  revalidatePath(`/categories/${categorySlug}`)
  if (slug) revalidatePath(`/products/${categorySlug}/${slug}`)
}

// -------------------------------------------------------------
// Authentication Actions
// -------------------------------------------------------------

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
  const password = String(formData.get("password") || "")
  const result = await signInAdmin(email, password)
  if (result !== "ok") {
    redirect(`/admin/login?error=${result}`)
  }
  redirect("/admin")
}

export async function logoutAction() {
  await signOutAdmin()
  redirect("/admin/login")
}

// -------------------------------------------------------------
// Products Actions
// -------------------------------------------------------------

export async function createProductAction(formData: FormData) {
  await requireAdmin()

  const categorySlug = String(formData.get("categorySlug") || "")
  const name = String(formData.get("name") || "").trim()
  const grade = String(formData.get("grade") || "")
  const standard = String(formData.get("standard") || "")
  const description = String(formData.get("description") || "").trim()
  const featured = formData.get("featured") === "on"
  const heroCarousel = formData.get("heroCarousel") === "on"
  const file = formData.get("image")

  if (!categorySlug) {
    throw new Error("Please choose a valid category.")
  }
  if (!name) throw new Error("Product name is required.")
  if (!description) throw new Error("Description is required.")

  const product = await addProduct({ categorySlug, name, grade, standard, description, featured, heroCarousel })

  if (file instanceof File && file.size > 0) {
    const imagePath = await saveProductImage(file, product.categorySlug, product.slug)
    await updateProduct(product.id, { image: imagePath })
  }

  revalidateProductPaths(product.categorySlug, product.slug)
  redirect(`/admin/products?category=${product.categorySlug}#category-${product.categorySlug}`)
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin()

  const existing = await getProductById(id)
  if (!existing) throw new Error("Product not found.")

  const categorySlug = String(formData.get("categorySlug") || existing.categorySlug)
  const name = String(formData.get("name") || "").trim()
  const grade = String(formData.get("grade") || "")
  const standard = String(formData.get("standard") || "")
  const description = String(formData.get("description") || "").trim()
  const featured = formData.get("featured") === "on"
  const heroCarousel = formData.get("heroCarousel") === "on"
  const file = formData.get("image")

  if (!name) throw new Error("Product name is required.")
  if (!description) throw new Error("Description is required.")

  const updated = await updateProduct(id, { categorySlug, name, grade, standard, description, featured, heroCarousel })
  if (!updated) throw new Error("Product not found.")

  if (file instanceof File && file.size > 0) {
    const imagePath = await saveProductImage(file, updated.categorySlug, updated.slug)
    await updateProduct(updated.id, { image: imagePath })
  }

  revalidateProductPaths(existing.categorySlug, existing.slug)
  revalidateProductPaths(updated.categorySlug, updated.slug)
  redirect(`/admin/products?category=${updated.categorySlug}#category-${updated.categorySlug}`)
}

export async function deleteProductAction(id: string) {
  await requireAdmin()
  const existing = await getProductById(id)
  await deleteProduct(id)
  if (existing) revalidateProductPaths(existing.categorySlug, existing.slug)
}

export async function reorderCategoryAction(categorySlug: string, orderedIds: string[]) {
  await requireAdmin()
  await reorderCategory(categorySlug, orderedIds)
  revalidateProductPaths(categorySlug)
}

// -------------------------------------------------------------
// Site Settings Actions
// -------------------------------------------------------------

export async function saveSiteSettingsAction(key: string, data: any) {
  await requireAdmin()
  const ok = await saveSetting(key, data)
  if (!ok) throw new Error("Failed to save settings.")
  
  revalidatePath("/")
  revalidatePath("/about")
  revalidatePath("/contact")
  revalidatePath("/faq")
  revalidatePath("/products")
}

// -------------------------------------------------------------
// Categories Actions
// -------------------------------------------------------------

export async function createCategoryAction(formData: FormData) {
  await requireAdmin()
  const slug = String(formData.get("slug") || "").trim().toLowerCase()
  const name = String(formData.get("name") || "").trim()
  const shortDescription = String(formData.get("shortDescription") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const icon = String(formData.get("icon") || "clamp")
  const color = String(formData.get("color") || "#1b2a80")
  const brandNote = String(formData.get("brandNote") || "").trim()
  const image = String(formData.get("image") || "").trim()
  const pageRangeStart = Number(formData.get("pageRangeStart") || 0)
  const pageRangeEnd = Number(formData.get("pageRangeEnd") || 0)

  if (!slug) throw new Error("Slug is required")
  if (!name) throw new Error("Name is required")

  const ok = await createCategory({
    slug,
    name,
    shortDescription,
    description,
    icon,
    color,
    brandNote: brandNote || undefined,
    pageRangeStart,
    pageRangeEnd,
    image: image || undefined,
  })

  if (!ok) throw new Error("Failed to create category")
  revalidatePath("/")
  revalidatePath("/products")
  redirect("/admin/categories")
}

export async function updateCategoryAction(slug: string, formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") || "").trim()
  const shortDescription = String(formData.get("shortDescription") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const icon = String(formData.get("icon") || "clamp")
  const color = String(formData.get("color") || "#1b2a80")
  const brandNote = String(formData.get("brandNote") || "").trim()
  const image = String(formData.get("image") || "").trim()
  const pageRangeStart = Number(formData.get("pageRangeStart") || 0)
  const pageRangeEnd = Number(formData.get("pageRangeEnd") || 0)

  if (!name) throw new Error("Name is required")

  const ok = await updateCategory(slug, {
    name,
    shortDescription,
    description,
    icon,
    color,
    brandNote: brandNote || undefined,
    pageRangeStart,
    pageRangeEnd,
    image: image || undefined,
  })

  if (!ok) throw new Error("Failed to update category")
  revalidatePath("/")
  revalidatePath("/products")
  revalidatePath(`/categories/${slug}`)
  redirect("/admin/categories")
}

export async function deleteCategoryAction(slug: string) {
  await requireAdmin()
  const ok = await deleteCategory(slug)
  if (!ok) throw new Error("Failed to delete category")
  revalidatePath("/")
  revalidatePath("/products")
}

export async function reorderCategoriesAction(orderedSlugs: string[]) {
  await requireAdmin()
  await reorderCategories(orderedSlugs)
  revalidatePath("/")
  revalidatePath("/products")
}

// -------------------------------------------------------------
// Media Upload Helper (shared by blog covers and the media library)
// -------------------------------------------------------------

async function saveMediaImage(file: File): Promise<{ url: string; publicId?: string }> {
  const buffer = Buffer.from(await file.arrayBuffer())

  const optimizedBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer()

  const nameBase =
    (file.name || "image")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "") || "image"
  const publicId = `${nameBase}-${Date.now().toString(36)}`

  if (isCloudinaryConfigured) {
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "sabta-media",
            public_id: publicId,
            format: "webp",
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        stream.end(optimizedBuffer)
      })
      return { url: (uploadResult as any).secure_url, publicId: (uploadResult as any).public_id }
    } catch (err) {
      console.error("Cloudinary media upload failed, falling back to local file system:", err)
    }
  }

  const dir = path.join(process.cwd(), "public", "media")
  fs.mkdirSync(dir, { recursive: true })
  const dest = path.join(dir, `${publicId}.webp`)
  await sharp(optimizedBuffer).toFile(dest)
  return { url: `/media/${publicId}.webp` }
}

export async function uploadMediaAction(file: File): Promise<{ url: string; publicId?: string }> {
  await requireAdmin()
  if (!(file instanceof File) || file.size === 0) throw new Error("Please choose an image file.")
  const result = await saveMediaImage(file)
  revalidatePath("/admin/media")
  return result
}

export async function deleteMediaAction(image: { url: string; publicId?: string }) {
  await requireAdmin()
  if (isCloudinaryConfigured && image.publicId) {
    try {
      await cloudinary.uploader.destroy(image.publicId)
    } catch (err) {
      console.error("Cloudinary media delete failed:", err)
      throw new Error("Failed to delete image from Cloudinary.")
    }
  } else if (image.url.startsWith("/media/")) {
    const filePath = path.join(process.cwd(), "public", image.url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
  revalidatePath("/admin/media")
}

// -------------------------------------------------------------
// Blog Actions
// -------------------------------------------------------------

type PostInput = {
  title: string
  excerpt: string
  category: string
  publishedAt: string
  readTime: string
  coverImage: string
  coverAlt: string
  body: BlogContentBlock[]
  slug?: string
}

function assertValidPost(input: PostInput) {
  if (!input.title.trim()) throw new Error("Title is required.")
  if (!input.excerpt.trim()) throw new Error("Excerpt is required.")
  if (!input.category.trim()) throw new Error("Category is required.")
  if (!input.publishedAt.trim()) throw new Error("Published date is required.")
  if (!input.coverImage.trim()) throw new Error("Cover image is required.")
  if (!input.body || input.body.length === 0) throw new Error("Add at least one content block.")
}

export async function createPostAction(input: PostInput): Promise<BlogPost> {
  await requireAdmin()
  assertValidPost(input)
  const post = await createPost(input)
  revalidatePath("/blog")
  revalidatePath(`/blog/${post.slug}`)
  revalidatePath("/sitemap.xml")
  return post
}

export async function updatePostAction(slug: string, input: PostInput): Promise<BlogPost> {
  await requireAdmin()
  assertValidPost(input)
  const { slug: _ignored, ...patch } = input
  const updated = await updatePost(slug, patch)
  if (!updated) throw new Error("Post not found.")
  revalidatePath("/blog")
  revalidatePath(`/blog/${slug}`)
  revalidatePath(`/blog/${updated.slug}`)
  revalidatePath("/sitemap.xml")
  return updated
}

export async function deletePostAction(slug: string) {
  await requireAdmin()
  await deletePost(slug)
  revalidatePath("/blog")
  revalidatePath(`/blog/${slug}`)
  revalidatePath("/sitemap.xml")
}
