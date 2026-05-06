"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Camera, Music2, Users } from "lucide-react";

type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  featured: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  items: Item[];
};

export function MenuView({
  locale,
  labels,
  categories,
  phone,
}: {
  locale: "ar" | "en";
  labels: Record<string, string>;
  categories: Category[];
  phone?: string | null;
}) {
  const nextLocale = locale === "ar" ? "en" : "ar";
  const currencyLabel = locale === "ar" ? "ل.ل" : "L.L.";
  const formatPrice = (value: number) =>
    Number.isFinite(value)
      ? value.toLocaleString(locale === "ar" ? "ar-LB" : "en-US")
      : "--";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-b from-amber-50 to-white text-zinc-900">
      <div className="pointer-events-none absolute -left-8 top-24 text-8xl opacity-10">🍔</div>
      <div className="pointer-events-none absolute -right-8 top-80 text-8xl opacity-10">🍟</div>
      <div className="pointer-events-none absolute left-1/2 top-[38rem] -translate-x-1/2 text-8xl opacity-10">🍔</div>
      <header className="sticky top-0 z-30 border-b border-amber-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <Image
              src="/snack-nasab-logo.png"
              alt="Snack Nasab logo"
              width={260}
              height={118}
              className="h-10 w-auto object-contain md:h-12"
              priority
            />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-amber-700 md:text-2xl">{labels.brand}</h1>
              <p className="truncate text-xs text-zinc-600 md:text-sm">{labels.tagline}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            <a
              href={`tel:${phone ?? "076665462"}`}
              dir="ltr"
              className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-900 md:px-4 md:py-2 md:text-base"
            >
              {phone ?? "076665462"}
            </a>
            <Link
              href={`/${nextLocale}`}
              className="rounded-full bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700 md:px-5 md:py-2 md:text-base"
            >
              {labels.switchLanguage}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 rounded-3xl bg-amber-600 p-7 text-white shadow-lg"
        >
          <h2 className="text-3xl font-extrabold md:text-4xl">{labels.welcome}</h2>
          <p className="mt-2 text-lg font-medium text-amber-100 md:text-xl">{labels.menu}</p>
        </motion.section>

        <div className="space-y-6">
          {categories.map((category, index) => (
            <motion.section
              key={category.id}
              id={category.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className="rounded-2xl border border-amber-200 bg-white/95 p-5 shadow-md"
            >
              <h3 className="mb-4 inline-block rounded-lg bg-amber-100 px-3 py-1 text-2xl font-extrabold text-amber-900 md:text-3xl">
                {category.name}
              </h3>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-zinc-100 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xl font-bold text-zinc-900 md:text-2xl">{item.name}</h4>
                      <span className="shrink-0 rounded-lg bg-amber-100 px-3 py-1 text-base font-extrabold text-amber-800 md:text-lg">
                        {formatPrice(item.price)} {currencyLabel}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-base text-zinc-700 md:text-lg">{item.description}</p>
                    ) : null}
                    {item.featured ? (
                      <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                        {labels.featured}
                      </span>
                    ) : null}
                  </article>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </main>

      <footer className="border-t border-amber-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-5 text-base text-zinc-700 md:text-lg">
          <div className="flex items-center justify-between">
            <span>{labels.contact}</span>
            <span dir="ltr">{phone ?? "076665462"}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-3xl">
              <span className="font-semibold">{labels.addressLabel}:</span>{" "}
              {labels.addressValue}
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://www.tiktok.com/@snack_nasab"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-200 p-2 text-zinc-700 transition hover:bg-zinc-100"
                aria-label="Instagram"
              >
                <Camera size={16} />
              </a>
              <a
                href="https://www.tiktok.com/@snack_nasab"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-200 p-2 text-zinc-700 transition hover:bg-zinc-100"
                aria-label="TikTok"
              >
                <Music2 size={16} />
              </a>
              <a
                href="https://www.tiktok.com/@snack_nasab"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-200 p-2 text-zinc-700 transition hover:bg-zinc-100"
                aria-label="Facebook"
              >
                <Users size={16} />
              </a>
            </div>
          </div>
        </div>
      </footer>
      <Link
        href={`/${nextLocale}`}
        className="fixed bottom-4 end-4 z-40 rounded-full bg-zinc-900 px-5 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-zinc-800"
      >
        {labels.switchLanguage}
      </Link>
    </div>
  );
}
