"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const categorySchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  nameAr: z.string().min(2),
  nameEn: z.string().min(2),
  sortOrder: z.coerce.number().int().min(0),
});

const itemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1),
  nameAr: z.string().min(2),
  nameEn: z.string().min(2),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.coerce.number().min(1),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function upsertCategory(formData: FormData) {
  await requireAdmin();
  const parsed = categorySchema.parse({
    id: formData.get("id")?.toString(),
    slug: formData.get("slug")?.toString(),
    nameAr: formData.get("nameAr")?.toString(),
    nameEn: formData.get("nameEn")?.toString(),
    sortOrder: formData.get("sortOrder")?.toString(),
  });

  if (parsed.id) {
    await prisma.category.update({
      where: { id: parsed.id },
      data: parsed,
    });
  } else {
    await prisma.category.create({ data: parsed });
  }
  revalidatePath("/admin");
  revalidatePath("/ar");
  revalidatePath("/en");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function upsertMenuItem(formData: FormData) {
  await requireAdmin();
  const imageFile = formData.get("imageFile");
  let imageUrl = formData.get("imageUrl")?.toString() ?? "";
  if (imageFile instanceof File && imageFile.size > 0) {
    const bytes = Buffer.from(await imageFile.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${imageFile.name.replace(/\s+/g, "-")}`;
    await writeFile(path.join(uploadDir, safeName), bytes);
    imageUrl = `/uploads/${safeName}`;
  }

  const parsed = itemSchema.parse({
    id: formData.get("id")?.toString(),
    categoryId: formData.get("categoryId")?.toString(),
    nameAr: formData.get("nameAr")?.toString(),
    nameEn: formData.get("nameEn")?.toString(),
    descriptionAr: formData.get("descriptionAr")?.toString() ?? "",
    descriptionEn: formData.get("descriptionEn")?.toString() ?? "",
    price: formData.get("price")?.toString(),
    imageUrl,
    sortOrder: formData.get("sortOrder")?.toString(),
    isAvailable: formData.get("isAvailable") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });

  const data = {
    ...parsed,
    price: parsed.price,
  };

  if (parsed.id) {
    await prisma.menuItem.update({
      where: { id: parsed.id },
      data,
    });
  } else {
    await prisma.menuItem.create({ data });
  }
  revalidatePath("/admin");
  revalidatePath("/ar");
  revalidatePath("/en");
}

export async function deleteMenuItem(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await prisma.menuItem.delete({ where: { id } });
  revalidatePath("/admin");
}
