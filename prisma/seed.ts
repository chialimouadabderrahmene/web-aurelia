import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { WILAYAS } from "../lib/geo/wilayas-list";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const products = [
  {
    slug: "la-baguette",
    sku: "AUR-LBG-001",
    nameEn: "La Baguette",
    nameAr: "لا باغيت",
    category: "SHOULDER_BAG" as const,
    price: 14900,
    compareAtPrice: 18900,
    costPrice: 6200,
    otherCost: 6200,
    originCountry: "Spain",
    stockQty: 14,
    isBestSeller: true,
    descriptionEn:
      "A sculpted shoulder bag built for quiet mornings and long days. La Baguette carries just enough — structured, soft-touch, effortless.",
    descriptionAr:
      "حقيبة كتف منحوتة بعناية، مثالية للصباح الهادئ واليوم الطويل. لا باغيت تحمل ما يكفي فقط — بتصميم متماسك وملمس ناعم بلا تكلف.",
    materialsEn: "Vegan saffiano leather, brushed nickel hardware, cotton-twill lining.",
    materialsAr: "جلد نباتي بنسيج سافيانو، تفاصيل نيكل مصقول، بطانة قطنية.",
    dimensions: "28 × 12 × 8 cm — strap drop 22 cm.",
    careEn: "Wipe with a dry microfiber cloth. Avoid prolonged sun exposure. Store in dust bag when not in use.",
    careAr: "امسحيها بقطعة قماش ناعمة جافة. تجنبي التعرض الطويل للشمس. احفظيها في كيس القماش عند عدم الاستخدام.",
    colors: [
      { nameEn: "Ivory", nameAr: "عاجي", hex: "#F3EEE6" },
      { nameEn: "Noir", nameAr: "أسود", hex: "#1B1B1B" },
      { nameEn: "Camel", nameAr: "جملي", hex: "#B98D5E" },
    ],
  },
  {
    slug: "le-petit-tote",
    sku: "AUR-LPT-002",
    nameEn: "Le Petit Tote",
    nameAr: "لو بوتي توت",
    category: "TOTE" as const,
    price: 12900,
    costPrice: 5100,
    otherCost: 5100,
    originCountry: "Turkey",
    stockQty: 9,
    isBestSeller: true,
    isNew: true,
    descriptionEn:
      "An everyday tote scaled down to essentials. Soft structure, a whisper of hardware, room for exactly what matters.",
    descriptionAr:
      "توت باغ يومي بحجم مدروس. تركيبة ناعمة، لمسة معدنية خفيفة، ومساحة كافية لما يهمك فقط.",
    materialsEn: "Smooth vegan leather, silver-tone buckle, suede-touch interior.",
    materialsAr: "جلد نباتي ناعم، إبزيم فضي اللون، بطانة داخلية بملمس السويدي.",
    dimensions: "24 × 18 × 11 cm — handle drop 12 cm.",
    careEn: "Keep away from moisture. Condition leather every 3 months. Store upright.",
    careAr: "ابعديها عن الرطوبة. رطبي الجلد كل 3 أشهر. احفظيها في وضعية عمودية.",
    colors: [
      { nameEn: "Blush", nameAr: "وردي فاتح", hex: "#EAD3D1" },
      { nameEn: "Cream", nameAr: "كريمي", hex: "#EDE3D0" },
      { nameEn: "Noir", nameAr: "أسود", hex: "#1B1B1B" },
    ],
  },
  {
    slug: "le-mini-sac",
    sku: "AUR-LMS-003",
    nameEn: "Le Mini Sac",
    nameAr: "لو ميني ساك",
    category: "TOP_HANDLE" as const,
    price: 10900,
    costPrice: 4300,
    otherCost: 4300,
    originCountry: "Italy",
    stockQty: 0,
    descriptionEn:
      "Small in scale, exact in proportion. Le Mini Sac is the finishing touch — worn close, held light.",
    descriptionAr: "صغيرة الحجم، دقيقة التناسب. لو ميني ساك هي اللمسة الأخيرة — تُحمل قريبة وخفيفة.",
    materialsEn: "Vegan nappa leather, polished hardware, jersey lining.",
    materialsAr: "جلد نابا نباتي، تفاصيل معدنية لامعة، بطانة جيرسي.",
    dimensions: "18 × 10 × 7 cm — handle drop 9 cm.",
    careEn: "Avoid overloading. Clean spills immediately with a soft cloth.",
    careAr: "تجنبي التحميل الزائد. نظفي أي انسكاب فورًا بقطعة قماش ناعمة.",
    colors: [
      { nameEn: "Ivory", nameAr: "عاجي", hex: "#F3EEE6" },
      { nameEn: "Sage", nameAr: "أخضر ترابي", hex: "#A9AF97" },
    ],
  },
  {
    slug: "la-pochette",
    sku: "AUR-LPC-004",
    nameEn: "La Pochette",
    nameAr: "لا بوشيت",
    category: "CLUTCH" as const,
    price: 8900,
    costPrice: 3400,
    otherCost: 3400,
    originCountry: "Spain",
    stockQty: 21,
    isNew: true,
    descriptionEn:
      "An evening companion with a detachable wristlet. Minimal by design, quietly luxurious in hand.",
    descriptionAr: "رفيقة السهرة مع مقبض معصم قابل للفصل. بسيطة التصميم، فاخرة بهدوء عند الحمل.",
    materialsEn: "Vegan patent leather, satin lining, matte hardware.",
    materialsAr: "جلد لامع نباتي، بطانة ساتان، تفاصيل معدنية مطفأة.",
    dimensions: "22 × 12 × 3 cm.",
    careEn: "Store flat. Keep away from direct heat.",
    careAr: "احفظيها بشكل مسطح. ابعديها عن الحرارة المباشرة.",
    colors: [
      { nameEn: "Noir", nameAr: "أسود", hex: "#1B1B1B" },
      { nameEn: "Blush", nameAr: "وردي فاتح", hex: "#EAD3D1" },
    ],
  },
  {
    slug: "le-cabas",
    sku: "AUR-LCB-005",
    nameEn: "Le Cabas",
    nameAr: "لو كابا",
    category: "WEEKENDER" as const,
    price: 17900,
    costPrice: 7600,
    otherCost: 7600,
    originCountry: "Turkey",
    stockQty: 6,
    isBestSeller: true,
    descriptionEn:
      "For the woman who carries more, without carrying more weight. Le Cabas is spacious, structured, unhurried.",
    descriptionAr: "لكل امرأة تحمل أكثر، دون أن تشعر بالثقل. لو كابا واسعة، متماسكة، وهادئة في تصميمها.",
    materialsEn: "Full-grain vegan leather, reinforced base, canvas lining.",
    materialsAr: "جلد نباتي كامل الحبيبات، قاعدة معززة، بطانة قماشية.",
    dimensions: "38 × 26 × 14 cm — strap drop 24 cm.",
    careEn: "Support the base when full. Rotate use to preserve shape.",
    careAr: "ادعمي القاعدة عند امتلائها. ناوبي استخدامها للحفاظ على شكلها.",
    colors: [
      { nameEn: "Camel", nameAr: "جملي", hex: "#B98D5E" },
      { nameEn: "Noir", nameAr: "أسود", hex: "#1B1B1B" },
      { nameEn: "Ivory", nameAr: "عاجي", hex: "#F3EEE6" },
    ],
  },
  {
    slug: "le-bandouliere",
    sku: "AUR-LBD-006",
    nameEn: "Le Bandoulière",
    nameAr: "لو باندوليير",
    category: "CROSSBODY" as const,
    price: 9900,
    costPrice: 3900,
    otherCost: 3900,
    originCountry: "Italy",
    stockQty: 17,
    descriptionEn:
      "A crossbody built for movement. Adjustable strap, compact frame, quiet detailing throughout.",
    descriptionAr: "حقيبة كروس مصممة للحركة. حزام قابل للتعديل، هيكل مدمج، وتفاصيل هادئة في كل مكان.",
    materialsEn: "Vegan leather, adjustable webbing strap, magnetic closure.",
    materialsAr: "جلد نباتي، حزام قابل للتعديل، إغلاق مغناطيسي.",
    dimensions: "20 × 14 × 6 cm — adjustable strap 100–120 cm.",
    careEn: "Adjust strap length gently. Avoid harsh detergents.",
    careAr: "اضبطي طول الحزام بلطف. تجنبي المنظفات القاسية.",
    colors: [
      { nameEn: "Sage", nameAr: "أخضر ترابي", hex: "#A9AF97" },
      { nameEn: "Blush", nameAr: "وردي فاتح", hex: "#EAD3D1" },
      { nameEn: "Ivory", nameAr: "عاجي", hex: "#F3EEE6" },
    ],
  },
];

async function main() {
  for (const p of products) {
    const { colors, ...rest } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...rest,
        colors: { create: colors.map((c, i) => ({ ...c, sortOrder: i })) },
        images: { create: [] },
      },
    });
  }

  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@aurelia.dz";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe123!";

  await prisma.adminUser.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      name: "AURELIA Owner",
      email: ownerEmail,
      role: "OWNER",
      passwordHash: await bcrypt.hash(ownerPassword, 10),
    },
  });

  // Starter delivery prices — rough distance tiers from Algiers. Adjust per real courier rates in Admin > Finance > Delivery Prices.
  const NEAR = ["16", "09", "35", "42"]; // Alger, Blida, Boumerdès, Tipaza
  const FAR_SOUTH = ["11", "37", "33", "50", "53", "54", "56", "08", "01"]; // Tamanrasset, Tindouf, Illizi, Bordj Badji Mokhtar, In Salah, In Guezzam, Djanet, Béchar, Adrar
  for (const w of WILAYAS) {
    const price = NEAR.includes(w.code) ? 400 : FAR_SOUTH.includes(w.code) ? 900 : 600;
    await prisma.deliveryPrice.upsert({
      where: { wilayaCode: w.code },
      update: {},
      create: { wilayaCode: w.code, wilayaName: w.en, price },
    });
  }

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", confirmationCommission: 100 },
  });

  console.log(`Seeded ${products.length} products.`);
  console.log(`Owner account: ${ownerEmail} / ${ownerPassword}`);
  console.log("IMPORTANT: change this password after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
