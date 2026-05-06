import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  deleteCategory,
  deleteMenuItem,
  upsertCategory,
  upsertMenuItem,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [categories, items] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({
      orderBy: { sortOrder: "asc" },
      include: { category: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <h1 className="text-3xl font-bold">Snack Nasab Admin</h1>
      <p className="text-zinc-600">Manage categories and menu items</p>

      <section className="mt-6 rounded-2xl border bg-white p-4">
        <h2 className="text-xl font-semibold">Create category</h2>
        <form action={upsertCategory} className="mt-3 grid gap-2 md:grid-cols-4">
          <input name="slug" placeholder="slug" className="rounded border p-2" required />
          <input name="nameAr" placeholder="Arabic name" className="rounded border p-2" required />
          <input name="nameEn" placeholder="English name" className="rounded border p-2" required />
          <input name="sortOrder" type="number" defaultValue={0} className="rounded border p-2" required />
          <button className="rounded bg-zinc-900 px-4 py-2 text-white md:col-span-4">Save category</button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border bg-white p-4">
        <h2 className="text-xl font-semibold">Create menu item</h2>
        <form action={upsertMenuItem} className="mt-3 grid gap-2 md:grid-cols-3">
          <select name="categoryId" className="rounded border p-2" required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr} / {c.nameEn}
              </option>
            ))}
          </select>
          <input name="nameAr" placeholder="Arabic item name" className="rounded border p-2" required />
          <input name="nameEn" placeholder="English item name" className="rounded border p-2" required />
          <input name="descriptionAr" placeholder="Arabic description" className="rounded border p-2" />
          <input name="descriptionEn" placeholder="English description" className="rounded border p-2" />
          <input name="price" type="number" placeholder="price" className="rounded border p-2" required />
          <input name="imageUrl" placeholder="image URL" className="rounded border p-2" />
          <input name="imageFile" type="file" accept="image/*" className="rounded border p-2" />
          <input name="sortOrder" type="number" defaultValue={0} className="rounded border p-2" required />
          <label className="flex items-center gap-2 p-2"><input type="checkbox" name="isAvailable" defaultChecked />Available</label>
          <label className="flex items-center gap-2 p-2"><input type="checkbox" name="isFeatured" />Featured</label>
          <button className="rounded bg-zinc-900 px-4 py-2 text-white md:col-span-3">Save item</button>
        </form>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-xl font-semibold">Categories</h2>
          <div className="mt-3 space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded border p-2">
                <span>{category.nameAr} / {category.nameEn}</span>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <button className="rounded bg-red-600 px-3 py-1 text-white">Delete</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-xl font-semibold">Menu items</h2>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded border p-2">
                <span>{item.nameAr} / {item.nameEn}</span>
                <form action={deleteMenuItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="rounded bg-red-600 px-3 py-1 text-white">Delete</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
