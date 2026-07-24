import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/index.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const careEn = "Wipe clean with a soft, dry cloth. Avoid prolonged exposure to direct sunlight and moisture.";
const careAr = "امسحي بقطعة قماش ناعمة وجافة. تجنبي التعرض الطويل لأشعة الشمس المباشرة والرطوبة.";
const materialsEn = "Vegan leather, gold-tone hardware, cotton lining.";
const materialsAr = "جلد نباتي، تفاصيل معدنية بلون ذهبي، بطانة قطنية.";

const products = [
  {
    slug: "le-bandouliere-rose",
    sku: "AUR-BAN-101",
    nameEn: "Le Bandoulière — Rose Bébé",
    nameAr: "لو باندوليير — وردي فاتح",
    descriptionEn: "A structured shoulder bag with a sculpted curved handle, in a soft baby pink. Compact, versatile, quietly elegant.",
    descriptionAr: "حقيبة كتف مهيكلة بمقبض منحني، بلون وردي فاتح ناعم. مدمجة، متعددة الاستخدامات، وأنيقة بهدوء.",
    dimensions: "28 x 16 x 9 cm",
    category: "SHOULDER_BAG",
    price: 16500,
    originCountry: "Turkey",
    stockQty: 10,
    isPublished: true,
    colorNameEn: "Rose Bébé",
    colorNameAr: "وردي فاتح",
    colorHex: "#E9C8CB",
    imageUrl: "https://jfoxyvsxsguz29h1.public.blob.vercel-storage.com/products/le-bandouliere-rose/main.png",
  },
  {
    slug: "le-bandouliere-beige",
    sku: "AUR-BAN-102",
    nameEn: "Le Bandoulière — Beige",
    nameAr: "لو باندوليير — بيج",
    descriptionEn: "A structured shoulder bag with a sculpted curved handle, in warm beige. Compact, versatile, quietly elegant.",
    descriptionAr: "حقيبة كتف مهيكلة بمقبض منحني، بلون بيج دافئ. مدمجة، متعددة الاستخدامات، وأنيقة بهدوء.",
    dimensions: "28 x 16 x 9 cm",
    category: "SHOULDER_BAG",
    price: 16500,
    originCountry: "Turkey",
    stockQty: 10,
    isPublished: true,
    colorNameEn: "Beige",
    colorNameAr: "بيج",
    colorHex: "#D9C6A5",
    imageUrl: "https://jfoxyvsxsguz29h1.public.blob.vercel-storage.com/products/le-bandouliere-beige/main.png",
  },
  {
    slug: "le-bandouliere-chocolat",
    sku: "AUR-BAN-103",
    nameEn: "Le Bandoulière — Chocolat",
    nameAr: "لو باندوليير — بني شوكولاتة",
    descriptionEn: "A structured shoulder bag with a sculpted curved handle, in rich chocolate brown. Compact, versatile, quietly elegant.",
    descriptionAr: "حقيبة كتف مهيكلة بمقبض منحني، بلون بني شوكولاتة غني. مدمجة، متعددة الاستخدامات، وأنيقة بهدوء.",
    dimensions: "28 x 16 x 9 cm",
    category: "SHOULDER_BAG",
    price: 16500,
    originCountry: "Turkey",
    stockQty: 10,
    isPublished: true,
    colorNameEn: "Chocolat",
    colorNameAr: "بني شوكولاتة",
    colorHex: "#5C4634",
    imageUrl: "https://jfoxyvsxsguz29h1.public.blob.vercel-storage.com/products/le-bandouliere-chocolat/main.png",
  },
  {
    slug: "le-cabas-beige",
    sku: "AUR-CAB-104",
    nameEn: "Le Cabas — Beige",
    nameAr: "لو كابا — بيج",
    descriptionEn: "A pebbled leather tote with dual shoulder straps, a fold-over flap, and a braided tassel charm. Everyday elegance, in beige.",
    descriptionAr: "حقيبة توتباغ من الجلد المرقط بحزامين للكتف، غطاء علوي، وحلية جلدية مضفرة. أناقة يومية، بلون بيج.",
    dimensions: "35 x 24 x 14 cm",
    category: "TOTE",
    price: 18900,
    originCountry: "Turkey",
    stockQty: 8,
    isPublished: true,
    colorNameEn: "Beige",
    colorNameAr: "بيج",
    colorHex: "#D9C6A5",
    imageUrl: "https://jfoxyvsxsguz29h1.public.blob.vercel-storage.com/products/le-cabas-beige/main.png",
  },
  {
    slug: "le-cabas-chocolat",
    sku: "AUR-CAB-105",
    nameEn: "Le Cabas — Chocolat",
    nameAr: "لو كابا — بني شوكولاتة",
    descriptionEn: "A pebbled leather tote with dual shoulder straps, a fold-over flap, and a braided tassel charm. Everyday elegance, in chocolate brown.",
    descriptionAr: "حقيبة توتباغ من الجلد المرقط بحزامين للكتف، غطاء علوي، وحلية جلدية مضفرة. أناقة يومية، بلون بني شوكولاتة.",
    dimensions: "35 x 24 x 14 cm",
    category: "TOTE",
    price: 18900,
    originCountry: "Turkey",
    stockQty: 8,
    isPublished: true,
    colorNameEn: "Chocolat",
    colorNameAr: "بني شوكولاتة",
    colorHex: "#5C4634",
    imageUrl: "https://jfoxyvsxsguz29h1.public.blob.vercel-storage.com/products/le-cabas-chocolat/main.png",
  },
];

for (const p of products) {
  const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
  if (existing) {
    console.log(`Skipping ${p.slug}, already exists`);
    continue;
  }
  const materialCost = 4000;
  const created = await prisma.product.create({
    data: {
      slug: p.slug,
      sku: p.sku,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      descriptionEn: p.descriptionEn,
      descriptionAr: p.descriptionAr,
      materialsEn,
      materialsAr,
      dimensions: p.dimensions,
      careEn,
      careAr,
      category: p.category,
      price: p.price,
      costPrice: materialCost,
      materialCost,
      originCountry: p.originCountry,
      stockQty: p.stockQty,
      isPublished: p.isPublished,
      colors: { create: [{ nameEn: p.colorNameEn, nameAr: p.colorNameAr, hex: p.colorHex, sortOrder: 0 }] },
      images: { create: [{ url: p.imageUrl, sortOrder: 0 }] },
    },
  });
  console.log(`Created ${created.nameEn} (${created.sku})`);
}

await prisma.$disconnect();
