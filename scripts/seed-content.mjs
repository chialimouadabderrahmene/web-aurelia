import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/index.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const faqItems = [
  {
    questionEn: "Do you offer Cash on Delivery?",
    questionAr: "هل تقدمون الدفع عند الاستلام؟",
    answerEn: "Yes — COD is available on every order, across all 58 wilayas in Algeria.",
    answerAr: "نعم — الدفع عند الاستلام متاح لكل طلب، في جميع الولايات الـ58 في الجزائر.",
  },
  {
    questionEn: "How long does delivery take?",
    questionAr: "كم يستغرق التوصيل؟",
    answerEn: "2–5 business days depending on your wilaya. You'll receive a call to confirm before dispatch.",
    answerAr: "من 2 إلى 5 أيام عمل حسب ولايتك. ستصلك مكالمة للتأكيد قبل الشحن.",
  },
  {
    questionEn: "What materials are used?",
    questionAr: "ما هي الخامات المستخدمة؟",
    answerEn: "All AURELIA bags use premium vegan leather with brushed or polished hardware, chosen for durability and a soft hand-feel.",
    answerAr: "تستخدم جميع حقائب AURELIA جلدًا نباتيًا فاخرًا مع تفاصيل معدنية مصقولة أو مطفأة، مختارة لمتانتها وملمسها الناعم.",
  },
  {
    questionEn: "Can I return or exchange my order?",
    questionAr: "هل يمكنني إرجاع أو استبدال طلبي؟",
    answerEn: "Yes, within 7 days of delivery, provided the item is unused and in original packaging.",
    answerAr: "نعم، خلال 7 أيام من الاستلام، بشرط أن تكون القطعة غير مستخدمة وفي تغليفها الأصلي.",
  },
  {
    questionEn: "How do I track my order?",
    questionAr: "كيف أتتبع طلبي؟",
    answerEn: "Visit the Order Tracking page and enter your order number, sent to you via SMS after confirmation.",
    answerAr: "زوري صفحة تتبع الطلب وأدخلي رقم طلبك، الذي يصلك عبر رسالة نصية بعد التأكيد.",
  },
];

const reviews = [
  { authorName: "Amina K.", rating: 5, text: "The quality shocked me — feels like a bag three times the price. Delivery to Oran took two days.", product: "La Baguette" },
  { authorName: "Yasmine B.", rating: 5, text: "So minimal and elegant. I get compliments every time I wear it. Packaging alone felt premium.", product: "Le Petit Tote" },
  { authorName: "Nour S.", rating: 4, text: "Beautiful structure, holds its shape all day. Wish the strap was slightly longer but still love it.", product: "Le Mini Sac" },
  { authorName: "Sarah M.", rating: 5, text: "COD made it so easy to trust the purchase. The bag exceeded what I saw in photos.", product: "Le Cabas" },
];

const existingFaq = await prisma.faqItem.count();
if (existingFaq === 0) {
  for (let i = 0; i < faqItems.length; i++) {
    await prisma.faqItem.create({ data: { ...faqItems[i], sortOrder: i } });
  }
  console.log(`Seeded ${faqItems.length} FAQ items`);
} else {
  console.log("FAQ items already exist, skipping");
}

const existingReviews = await prisma.review.count();
if (existingReviews === 0) {
  for (let i = 0; i < reviews.length; i++) {
    await prisma.review.create({ data: { ...reviews[i], sortOrder: i } });
  }
  console.log(`Seeded ${reviews.length} reviews`);
} else {
  console.log("Reviews already exist, skipping");
}

await prisma.siteContent.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
console.log("SiteContent singleton ensured");

process.exit(0);
