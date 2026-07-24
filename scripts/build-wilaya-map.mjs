// One-time preprocessing script. Regenerate by placing a copy of
// https://raw.githubusercontent.com/fr33dz/Algeria-geojson/master/all-wilayas.geojson
// at scripts/dz-wilayas-raw.geojson, then: node scripts/build-wilaya-map.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Official 58 wilayas: code -> { en, ar }
const OFFICIAL = {
  "01": ["Adrar", "أدرار"],
  "02": ["Chlef", "الشلف"],
  "03": ["Laghouat", "الأغواط"],
  "04": ["Oum El Bouaghi", "أم البواقي"],
  "05": ["Batna", "باتنة"],
  "06": ["Béjaïa", "بجاية"],
  "07": ["Biskra", "بسكرة"],
  "08": ["Béchar", "بشار"],
  "09": ["Blida", "البليدة"],
  "10": ["Bouira", "البويرة"],
  "11": ["Tamanrasset", "تمنراست"],
  "12": ["Tébessa", "تبسة"],
  "13": ["Tlemcen", "تلمسان"],
  "14": ["Tiaret", "تيارت"],
  "15": ["Tizi Ouzou", "تيزي وزو"],
  "16": ["Alger", "الجزائر"],
  "17": ["Djelfa", "الجلفة"],
  "18": ["Jijel", "جيجل"],
  "19": ["Sétif", "سطيف"],
  "20": ["Saïda", "سعيدة"],
  "21": ["Skikda", "سكيكدة"],
  "22": ["Sidi Bel Abbès", "سيدي بلعباس"],
  "23": ["Annaba", "عنابة"],
  "24": ["Guelma", "قالمة"],
  "25": ["Constantine", "قسنطينة"],
  "26": ["Médéa", "المدية"],
  "27": ["Mostaganem", "مستغانم"],
  "28": ["M'Sila", "المسيلة"],
  "29": ["Mascara", "معسكر"],
  "30": ["Ouargla", "ورقلة"],
  "31": ["Oran", "وهران"],
  "32": ["El Bayadh", "البيض"],
  "33": ["Illizi", "إليزي"],
  "34": ["Bordj Bou Arréridj", "برج بوعريريج"],
  "35": ["Boumerdès", "بومرداس"],
  "36": ["El Tarf", "الطارف"],
  "37": ["Tindouf", "تندوف"],
  "38": ["Tissemsilt", "تيسمسيلت"],
  "39": ["El Oued", "الوادي"],
  "40": ["Khenchela", "خنشلة"],
  "41": ["Souk Ahras", "سوق أهراس"],
  "42": ["Tipaza", "تيبازة"],
  "43": ["Mila", "ميلة"],
  "44": ["Aïn Defla", "عين الدفلى"],
  "45": ["Naâma", "النعامة"],
  "46": ["Aïn Témouchent", "عين تموشنت"],
  "47": ["Ghardaïa", "غرداية"],
  "48": ["Relizane", "غليزان"],
  "49": ["Timimoun", "تيميمون"],
  "50": ["Bordj Badji Mokhtar", "برج باجي مختار"],
  "51": ["Ouled Djellal", "أولاد جلال"],
  "52": ["Béni Abbès", "بني عباس"],
  "53": ["In Salah", "عين صالح"],
  "54": ["In Guezzam", "عين قزام"],
  "55": ["Touggourt", "تقرت"],
  "56": ["Djanet", "جانت"],
  "57": ["El M'Ghair", "المغير"],
  "58": ["El Meniaa", "المنيعة"],
};

// Normalize name for fuzzy matching between dataset and official list
function norm(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const NAME_TO_CODE = {};
for (const [code, [en]] of Object.entries(OFFICIAL)) {
  NAME_TO_CODE[norm(en)] = code;
}
// manual aliases for dataset spelling differences
const ALIASES = {
  timimoune: "49",
  insalah: "53",
  inguezzam: "54",
  eloued: "39",
  bordjbouarreridj: "34",
  bordjbadjimokhtar: "50",
  ouleddjellal: "51",
  beniabbes: "52",
  elmghair: "57",
  elmeniaa: "58",
  elmenia: "58",
  souqahras: "41",
  soukahras: "41",
  guelma: "24",
  algiers: "16",
};

function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  const [x1, y1] = points[0];
  const [x2, y2] = points[points.length - 1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const norm2 = dx * dx + dy * dy;

  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    let dist;
    if (norm2 === 0) {
      dist = Math.hypot(x0 - x1, y0 - y1);
    } else {
      const t = ((x0 - x1) * dx + (y0 - y1) * dy) / norm2;
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      dist = Math.hypot(x0 - px, y0 - py);
    }
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, index + 1), tolerance);
    const right = douglasPeucker(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function largestRing(geometry) {
  const rings =
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((poly) => poly[0]);
  let best = rings[0];
  let bestArea = ringArea(rings[0]);
  for (const r of rings) {
    const a = ringArea(r);
    if (a > bestArea) {
      best = r;
      bestArea = a;
    }
  }
  return best;
}

const raw = JSON.parse(
  fs.readFileSync(path.join(__dirname, "dz-wilayas-raw.geojson"), "utf8")
);

const results = [];
let minLon = Infinity,
  maxLon = -Infinity,
  minLat = Infinity,
  maxLat = -Infinity;

const processed = [];

for (const feature of raw.features) {
  const rawName = feature.properties.name;
  const key = norm(rawName);
  const code = NAME_TO_CODE[key] || ALIASES[key];
  if (!code) {
    console.error("UNMATCHED:", rawName);
    continue;
  }
  const ring = largestRing(feature.geometry);
  const simplified = douglasPeucker(ring, 0.015);
  simplified.forEach(([lon, lat]) => {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });
  processed.push({ code, ring: simplified });
}

console.log(`Matched ${processed.length}/58 wilayas`);
console.log("Bounds:", { minLon, maxLon, minLat, maxLat });

const VIEW_W = 720;
const VIEW_H = 720;
const PAD = 20;
const meanLat = (minLat + maxLat) / 2;
const lonScale = Math.cos((meanLat * Math.PI) / 180);

const spanX = (maxLon - minLon) * lonScale;
const spanY = maxLat - minLat;
const scale = Math.min((VIEW_W - PAD * 2) / spanX, (VIEW_H - PAD * 2) / spanY);

function project([lon, lat]) {
  const x = (lon - minLon) * lonScale * scale + PAD;
  const y = VIEW_H - ((lat - minLat) * scale + PAD);
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

for (const p of processed) {
  const projected = p.ring.map(project);
  const d =
    "M" +
    projected.map(([x, y]) => `${x},${y}`).join("L") +
    "Z";

  const cx =
    projected.reduce((sum, [x]) => sum + x, 0) / projected.length;
  const cy =
    projected.reduce((sum, [, y]) => sum + y, 0) / projected.length;

  const [nameEn, nameAr] = OFFICIAL[p.code];
  results.push({
    code: p.code,
    nameEn,
    nameAr,
    path: d,
    centroid: [Math.round(cx * 10) / 10, Math.round(cy * 10) / 10],
    points: projected.length,
  });
}

results.sort((a, b) => a.code.localeCompare(b.code));

const outPath = path.join(__dirname, "..", "lib", "geo", "algeria-wilayas.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify({ viewBox: `0 0 ${VIEW_W} ${VIEW_H}`, wilayas: results }, null, 0)
);

const totalPoints = results.reduce((n, r) => n + r.points, 0);
console.log(`Wrote ${results.length} wilayas, ${totalPoints} total points to ${outPath}`);
console.log(
  `File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`
);
