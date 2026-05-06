import { prisma } from "./prisma";
import fallbackData from "@/data/menu-fallback.json";

export type Locale = "ar" | "en";

function shouldUseJsonFallback() {
  const source = (process.env.MENU_SOURCE || "auto").toLowerCase();
  if (source === "json") return true;
  if (source === "db") return false;
  return !process.env.DATABASE_URL;
}

function mapCategories(
  categories: Array<{
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
    menuItems: Array<{
      id: string;
      nameAr: string;
      nameEn: string;
      descriptionAr?: string | null;
      descriptionEn?: string | null;
      price: number;
      imageUrl?: string | null;
      isFeatured: boolean;
    }>;
  }>,
  locale: Locale,
) {
  return categories.map((category) => ({
    id: category.id,
    name: locale === "ar" ? category.nameAr : category.nameEn,
    slug: category.slug,
    items: category.menuItems.map((item) => ({
      id: item.id,
      name: locale === "ar" ? item.nameAr : item.nameEn,
      description:
        locale === "ar"
          ? item.descriptionAr || ""
          : item.descriptionEn || "",
      price: Number(item.price),
      imageUrl: item.imageUrl || "",
      featured: item.isFeatured,
    })),
  }));
}

export async function getMenuForLocale(locale: Locale) {
  if (shouldUseJsonFallback()) {
    const active = fallbackData.categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        ...category,
        menuItems: category.menuItems
          .filter((item) => item.isAvailable)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
    return mapCategories(active, locale);
  }

  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return mapCategories(
      categories.map((category) => ({
        ...category,
        menuItems: category.menuItems.map((item) => ({
          ...item,
          price: Number(item.price),
        })),
      })),
      locale,
    );
  } catch {
    const active = fallbackData.categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        ...category,
        menuItems: category.menuItems
          .filter((item) => item.isAvailable)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
    return mapCategories(active, locale);
  }
}

export async function getSettings() {
  if (shouldUseJsonFallback()) {
    return fallbackData.settings;
  }

  try {
    const setting = await prisma.siteSetting.findFirst();
    return (
      setting ?? {
        phone: fallbackData.settings.phone,
        welcomeTextAr: fallbackData.settings.welcomeTextAr,
        welcomeTextEn: fallbackData.settings.welcomeTextEn,
      }
    );
  } catch {
    return fallbackData.settings;
  }
}
