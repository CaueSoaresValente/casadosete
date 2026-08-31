import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin12345", 12);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@casado7.com.br" },
    update: {},
    create: {
      name: "Admin Casa do 7",
      email: "admin@casado7.com.br",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);

  // Clean up unused categories/subcategories so only the 6 main ones remain
  const allowedSlugs = [
    "velas",
    "imagens",
    "roupas",
    "guias-colares",
    "incensos",
    "ervas-banhos",
  ];

  await prisma.category.deleteMany({
    where: { slug: { notIn: allowedSlugs } },
  });

  // Create/update initial 6 categories
  const categories = [
    { name: "Velas", slug: "velas", imageUrl: "/assets/imgvelas.jpg", sortOrder: 1 },
    { name: "Imagens", slug: "imagens", imageUrl: "/assets/img_estatuas.jpg", sortOrder: 2 },
    { name: "Roupas", slug: "roupas", imageUrl: "/assets/img_roupa.jpg", sortOrder: 3 },
    { name: "Guias & Colares", slug: "guias-colares", imageUrl: "/assets/img_guias.jpg", sortOrder: 4 },
    { name: "Incensos & Defumadores", slug: "incensos", imageUrl: "/assets/img_incensos.jpg", sortOrder: 5 },
    { name: "Ervas & Banhos", slug: "ervas-banhos", imageUrl: "/assets/img_ervas.jpg", sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, imageUrl: cat.imageUrl, sortOrder: cat.sortOrder, parentId: null },
      create: cat,
    });
  }

  console.log(`✅ ${categories.length} main categories configured!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
