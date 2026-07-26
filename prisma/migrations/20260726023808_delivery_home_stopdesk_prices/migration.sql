-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('HOME', 'STOPDESK');

-- AlterTable Order: record which delivery type the customer picked
ALTER TABLE "Order" ADD COLUMN "deliveryType" "DeliveryType" NOT NULL DEFAULT 'HOME';

-- AlterTable DeliveryPrice: split single price into home / stopdesk tiers
ALTER TABLE "DeliveryPrice" ADD COLUMN "homePrice" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DeliveryPrice" ADD COLUMN "stopdeskPrice" INTEGER NOT NULL DEFAULT 0;

-- Seed official EcoTrack rate card (home / stopdesk, DA) per wilaya code
UPDATE "DeliveryPrice" SET "homePrice" = 1400, "stopdeskPrice" = 1100 WHERE "wilayaCode" = '01';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '02';
UPDATE "DeliveryPrice" SET "homePrice" = 1000, "stopdeskPrice" = 700  WHERE "wilayaCode" = '03';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '04';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '05';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '06';
UPDATE "DeliveryPrice" SET "homePrice" = 950,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '07';
UPDATE "DeliveryPrice" SET "homePrice" = 1400, "stopdeskPrice" = 1100 WHERE "wilayaCode" = '08';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '09';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '10';
UPDATE "DeliveryPrice" SET "homePrice" = 1800, "stopdeskPrice" = 1400 WHERE "wilayaCode" = '11';
UPDATE "DeliveryPrice" SET "homePrice" = 950,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '12';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '13';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '14';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '15';
UPDATE "DeliveryPrice" SET "homePrice" = 700,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '16';
UPDATE "DeliveryPrice" SET "homePrice" = 900,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '17';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '18';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '19';
UPDATE "DeliveryPrice" SET "homePrice" = 900,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '20';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '21';
UPDATE "DeliveryPrice" SET "homePrice" = 500,  "stopdeskPrice" = 400  WHERE "wilayaCode" = '22';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '23';
UPDATE "DeliveryPrice" SET "homePrice" = 900,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '24';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '25';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '26';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '27';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '28';
UPDATE "DeliveryPrice" SET "homePrice" = 900,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '29';
UPDATE "DeliveryPrice" SET "homePrice" = 1100, "stopdeskPrice" = 800  WHERE "wilayaCode" = '30';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '31';
UPDATE "DeliveryPrice" SET "homePrice" = 1100, "stopdeskPrice" = 800  WHERE "wilayaCode" = '32';
UPDATE "DeliveryPrice" SET "homePrice" = 2000, "stopdeskPrice" = 1700 WHERE "wilayaCode" = '33';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '34';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '35';
UPDATE "DeliveryPrice" SET "homePrice" = 950,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '36';
UPDATE "DeliveryPrice" SET "homePrice" = 1800, "stopdeskPrice" = 1400 WHERE "wilayaCode" = '37';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '38';
UPDATE "DeliveryPrice" SET "homePrice" = 1100, "stopdeskPrice" = 800  WHERE "wilayaCode" = '39';
UPDATE "DeliveryPrice" SET "homePrice" = 900,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '40';
UPDATE "DeliveryPrice" SET "homePrice" = 900,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '41';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '42';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 500  WHERE "wilayaCode" = '43';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '44';
UPDATE "DeliveryPrice" SET "homePrice" = 1100, "stopdeskPrice" = 800  WHERE "wilayaCode" = '45';
UPDATE "DeliveryPrice" SET "homePrice" = 900,  "stopdeskPrice" = 600  WHERE "wilayaCode" = '46';
UPDATE "DeliveryPrice" SET "homePrice" = 1100, "stopdeskPrice" = 800  WHERE "wilayaCode" = '47';
UPDATE "DeliveryPrice" SET "homePrice" = 850,  "stopdeskPrice" = 450  WHERE "wilayaCode" = '48';
UPDATE "DeliveryPrice" SET "homePrice" = 1400, "stopdeskPrice" = 1100 WHERE "wilayaCode" = '49';
UPDATE "DeliveryPrice" SET "homePrice" = 1000, "stopdeskPrice" = 700  WHERE "wilayaCode" = '51';
UPDATE "DeliveryPrice" SET "homePrice" = 1400, "stopdeskPrice" = 1100 WHERE "wilayaCode" = '52';
UPDATE "DeliveryPrice" SET "homePrice" = 1400, "stopdeskPrice" = 1100 WHERE "wilayaCode" = '53';
UPDATE "DeliveryPrice" SET "homePrice" = 2000, "stopdeskPrice" = 1700 WHERE "wilayaCode" = '54';
UPDATE "DeliveryPrice" SET "homePrice" = 1100, "stopdeskPrice" = 800  WHERE "wilayaCode" = '55';
UPDATE "DeliveryPrice" SET "homePrice" = 2000, "stopdeskPrice" = 1700 WHERE "wilayaCode" = '56';
UPDATE "DeliveryPrice" SET "homePrice" = 1100, "stopdeskPrice" = 800  WHERE "wilayaCode" = '57';
UPDATE "DeliveryPrice" SET "homePrice" = 1300, "stopdeskPrice" = 1000 WHERE "wilayaCode" = '58';
-- Note: wilayaCode 50 (Bordj Badji Mokhtar) was not present in the source
-- rate card; it keeps the 0/0 default until set manually in the admin panel.

-- AlterTable DeliveryPrice: drop superseded single-tier column
ALTER TABLE "DeliveryPrice" DROP COLUMN "price";
