import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin12345", 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@snacknasab.com" },
    update: { passwordHash },
    create: {
      email: "admin@snacknasab.com",
      passwordHash,
      role: "admin",
    },
  });

  await prisma.siteSetting.upsert({
    where: { id: "default-setting" },
    update: {
      phone: "076665462",
      welcomeTextAr: "اهلا بكم في سناك نسب",
      welcomeTextEn: "Welcome to Snack Nasab",
    },
    create: {
      id: "default-setting",
      phone: "076665462",
      welcomeTextAr: "اهلا بكم في سناك نسب",
      welcomeTextEn: "Welcome to Snack Nasab",
    },
  });

  const categories = [
    { slug: "french-bread", nameAr: "خبز فرنسي", nameEn: "French Bread", sortOrder: 1 },
    { slug: "arabic-bread", nameAr: "خبز عربي", nameEn: "Arabic Bread", sortOrder: 2 },
    { slug: "meals", nameAr: "وجبات", nameEn: "Meals", sortOrder: 3 },
    { slug: "burger", nameAr: "برغر", nameEn: "Burger", sortOrder: 4 },
    { slug: "fries", nameAr: "بطاطا", nameEn: "Fries", sortOrder: 5 },
    { slug: "toast", nameAr: "خبز تويستر", nameEn: "Twister Bread", sortOrder: 6 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const allCategories = await prisma.category.findMany();
  const bySlug = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]));
  await prisma.menuItem.deleteMany();

  const items = [
    { categorySlug: "french-bread", nameAr: "طاووق", nameEn: "Tawook", price: 250000, sortOrder: 1 },
    { categorySlug: "french-bread", nameAr: "سودة", nameEn: "Chicken Liver", price: 250000, sortOrder: 2 },
    { categorySlug: "french-bread", nameAr: "دجاج صيني", nameEn: "Chinese Chicken", price: 280000, sortOrder: 3 },
    { categorySlug: "french-bread", nameAr: "مقانق", nameEn: "Sausage", price: 250000, sortOrder: 4 },
    { categorySlug: "french-bread", nameAr: "سجق", nameEn: "Sujuk", price: 250000, sortOrder: 5 },
    { categorySlug: "french-bread", nameAr: "شورما دجاج", nameEn: "Chicken Shawarma", price: 280000, sortOrder: 6 },
    { categorySlug: "french-bread", nameAr: "كريسي", nameEn: "Crispy", price: 280000, sortOrder: 7 },
    { categorySlug: "french-bread", nameAr: "كرسبي بر", nameEn: "Crispy Wrap", price: 280000, sortOrder: 8 },
    { categorySlug: "french-bread", nameAr: "اسكالوب", nameEn: "Escalope", price: 280000, sortOrder: 9 },
    { categorySlug: "french-bread", nameAr: "كفتة", nameEn: "Kofta", price: 250000, sortOrder: 10 },
    { categorySlug: "french-bread", nameAr: "تشكن ساب", nameEn: "Chicken Sub", price: 280000, sortOrder: 11 },
    { categorySlug: "french-bread", nameAr: "فاهيتا", nameEn: "Fajita", price: 300000, sortOrder: 12 },
    { categorySlug: "french-bread", nameAr: "روستو لحمة", nameEn: "Rosto Beef", price: 300000, sortOrder: 13 },
    { categorySlug: "french-bread", nameAr: "جيش", nameEn: "Jeesh", price: 300000, sortOrder: 14 },
    { categorySlug: "french-bread", nameAr: "قورمه جبن", nameEn: "Qorma Cheese", price: 300000, sortOrder: 15 },
    { categorySlug: "french-bread", nameAr: "قورمه مع بيض", nameEn: "Qorma with Egg", price: 350000, sortOrder: 16 },
    { categorySlug: "french-bread", nameAr: "تشكن مشروم", nameEn: "Chicken Mushroom", price: 350000, sortOrder: 17 },
    { categorySlug: "french-bread", nameAr: "فلافيا", nameEn: "Flavia", price: 350000, sortOrder: 18 },
    { categorySlug: "french-bread", nameAr: "فرديس", nameEn: "Fardees", price: 400000, sortOrder: 19 },
    { categorySlug: "arabic-bread", nameAr: "طاووق", nameEn: "Tawook", price: 250000, sortOrder: 1 },
    { categorySlug: "arabic-bread", nameAr: "مقانق", nameEn: "Sausage", price: 250000, sortOrder: 2 },
    { categorySlug: "arabic-bread", nameAr: "سجق", nameEn: "Sujuk", price: 250000, sortOrder: 3 },
    { categorySlug: "arabic-bread", nameAr: "بطاطا", nameEn: "Potato", price: 150000, sortOrder: 4 },
    { categorySlug: "arabic-bread", nameAr: "شورما و صوص", nameEn: "Shawarma with Sauce", price: 350000, sortOrder: 5 },
    { categorySlug: "arabic-bread", nameAr: "شورما دجاج", nameEn: "Chicken Shawarma", price: 280000, sortOrder: 6 },
    { categorySlug: "arabic-bread", nameAr: "كفتة", nameEn: "Kofta", price: 250000, sortOrder: 7 },
    { categorySlug: "meals", nameAr: "طاووق", nameEn: "Tawook Meal", price: 550000, sortOrder: 1 },
    { categorySlug: "meals", nameAr: "فاهيتا", nameEn: "Fajita Meal", price: 550000, sortOrder: 2 },
    { categorySlug: "meals", nameAr: "تشكن ساب", nameEn: "Chicken Sub Meal", price: 550000, sortOrder: 3 },
    { categorySlug: "meals", nameAr: "اسكالوب", nameEn: "Escalope Meal", price: 550000, sortOrder: 4 },
    { categorySlug: "meals", nameAr: "كريسبي", nameEn: "Crispy Meal", price: 550000, sortOrder: 5 },
    { categorySlug: "burger", nameAr: "برغر لحمة", nameEn: "Beef Burger", price: 280000, sortOrder: 1 },
    { categorySlug: "burger", nameAr: "برغر دجاج", nameEn: "Chicken Burger", price: 280000, sortOrder: 2 },
    { categorySlug: "burger", nameAr: "باربكيو برغر", nameEn: "Barbecue Burger", price: 280000, sortOrder: 3 },
    { categorySlug: "burger", nameAr: "ماشروم برغر", nameEn: "Mushroom Burger", price: 300000, sortOrder: 4 },
    { categorySlug: "burger", nameAr: "مكسيكان برغر", nameEn: "Mexican Burger", price: 300000, sortOrder: 5 },
    { categorySlug: "burger", nameAr: "زنجر برغر", nameEn: "Zinger Burger", price: 300000, sortOrder: 6 },
    { categorySlug: "burger", nameAr: "special برغر", nameEn: "Special Burger", price: 300000, sortOrder: 7 },
    { categorySlug: "fries", nameAr: "علبة بطاطا صغيرة", nameEn: "Small Fries", price: 150000, sortOrder: 1 },
    { categorySlug: "fries", nameAr: "علبة بطاطا وسط", nameEn: "Medium Fries", price: 250000, sortOrder: 2 },
    { categorySlug: "fries", nameAr: "علبة بطاطا كبيرة", nameEn: "Large Fries", price: 350000, sortOrder: 3 },
    { categorySlug: "fries", nameAr: "بطاطا مع تشدر صغيرة", nameEn: "Fries with Cheddar (Small)", price: 250000, sortOrder: 4 },
    { categorySlug: "fries", nameAr: "بطاطا مع تشدر كبيرة", nameEn: "Fries with Cheddar (Large)", price: 550000, sortOrder: 5 },
    { categorySlug: "fries", nameAr: "بولنيس", nameEn: "Bolognese", price: 600000, sortOrder: 6 },
    { categorySlug: "toast", nameAr: "توستر", nameEn: "Twister", price: 350000, sortOrder: 1 },
    { categorySlug: "toast", nameAr: "توستر راب", nameEn: "Twister Wrap", price: 350000, sortOrder: 2 }
  ];

  for (const item of items) {
    await prisma.menuItem.create({
      data: {
        categoryId: bySlug[item.categorySlug],
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        descriptionAr: "",
        descriptionEn: "",
        price: item.price,
        sortOrder: item.sortOrder,
        isAvailable: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
