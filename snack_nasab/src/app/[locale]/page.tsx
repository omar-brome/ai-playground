import { getTranslations, setRequestLocale } from "next-intl/server";
import { MenuView } from "@/components/public/MenuView";
import { getMenuForLocale, getSettings } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, categories, settings] = await Promise.all([
    getTranslations(),
    getMenuForLocale(locale),
    getSettings(),
  ]);

  return (
    <MenuView
      locale={locale}
      categories={categories}
      phone={settings.phone}
      labels={{
        brand: t("brand"),
        tagline: t("tagline"),
        welcome: locale === "ar" ? settings.welcomeTextAr || t("welcome") : settings.welcomeTextEn || t("welcome"),
        menu: t("menu"),
        featured: t("featured"),
        contact: t("contact"),
        addressLabel: t("addressLabel"),
        addressValue: t("addressValue"),
        switchLanguage: t("switchLanguage"),
        switchLanguageCta: t("switchLanguageCta"),
      }}
    />
  );
}
