-- Complete schema baseline. Existing databases must pass prepare-migrations.cjs before adoption.
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderCategory" AS ENUM ('SHOES', 'TEXTILE', 'MEDICINE', 'WATER', 'TOBACCO', 'BEER', 'OILS', 'DIETARY_SUPPLEMENTS', 'JEWELRY', 'SAIGA', 'OTHER');

-- CreateEnum
CREATE TYPE "TariffType" AS ENUM ('DIGITAL', 'PRINT', 'STANDARD', 'PRO');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PROCESSING', 'PRINTING', 'STICKERING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'PARTIAL', 'REFUNDED');

-- CreateEnum
CREATE TYPE "StickerApprovalStatus" AS ENUM ('IN_DESIGN', 'WAITING_APPROVAL', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "CodeItemStatus" AS ENUM ('NEW', 'PRINTED', 'REPRINTED', 'DEFECTIVE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MarkirovkaEnvironment" AS ENUM ('TEST', 'PROD');

-- CreateEnum
CREATE TYPE "MarkirovkaAccountStatus" AS ENUM ('ACTIVE', 'AUTH_ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "MarkirovkaOrderStatus" AS ENUM ('PENDING', 'READY', 'FETCHING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MarkirovkaReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MarkirovkaOperationType" AS ENUM ('IMPORT_NOTIFICATION', 'UTILISATION', 'AGGREGATION', 'RETIREMENT', 'VALIDATION', 'CORRECTION', 'DISAGGREGATION', 'RETURN_TO_TURNOVER');

-- CreateEnum
CREATE TYPE "MarkirovkaOperationStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OnlinePaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OnlinePaymentType" AS ENUM ('ORDER', 'INVOICE', 'STICKER_LAYOUT', 'BALANCE');

-- CreateEnum
CREATE TYPE "MarkirovkaCardStatus" AS ENUM ('DRAFT', 'PENDING_MODERATION', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "binIin" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    "telegramChatId" TEXT,
    "telegramUsername" TEXT,
    "telegramAuthToken" TEXT,
    "telegramAuthTokenExpiresAt" TIMESTAMP(3),
    "telegramLinkedAt" TIMESTAMP(3),
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "OrderCategory" NOT NULL,
    "tariffType" "TariffType" NOT NULL,
    "itemsCount" INTEGER NOT NULL,
    "pricePerItem" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "extraServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ssccNeeded" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "codesFileUrl" TEXT,
    "codesFileName" TEXT,
    "stickerLayout" JSONB,
    "stickerApprovalStatus" "StickerApprovalStatus" NOT NULL DEFAULT 'IN_DESIGN',
    "stickerApprovalNotes" TEXT,
    "stickerSentAt" TIMESTAMP(3),
    "templateId" TEXT,
    "printAllowed" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "warehouseAddress" TEXT,
    "warehouseConditions" JSONB,
    "stickeringEstimate" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPosition" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "index" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "article" TEXT,
    "size" TEXT,
    "color" TEXT,
    "gtin" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "customData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCodeItem" (
    "orderId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "gtin" TEXT,
    "serial" TEXT,
    "status" "CodeItemStatus" NOT NULL DEFAULT 'NEW',
    "printedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderCodeItem_pkey" PRIMARY KEY ("orderId","index")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "code" "TariffType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fitFor" TEXT NOT NULL,
    "priceRetail" DECIMAL(12,2) NOT NULL DEFAULT 15.0,
    "priceWholesale" DECIMAL(12,2) NOT NULL DEFAULT 12.0,
    "priceLargeWholesale" DECIMAL(12,2) NOT NULL DEFAULT 10.0,
    "costEstimate" DECIMAL(12,2) NOT NULL DEFAULT 3.0,
    "priceMin" DECIMAL(12,2) NOT NULL,
    "priceMax" DECIMAL(12,2) NOT NULL,
    "marginEst" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'GLOBAL',
    "ssccPrice" DECIMAL(12,2) NOT NULL DEFAULT 5.0,
    "stickerLayoutPrice" DECIMAL(12,2) NOT NULL DEFAULT 5000.0,
    "selfLayoutPrice" DECIMAL(12,2) NOT NULL DEFAULT 1000.0,
    "urgentPercent" DECIMAL(12,2) NOT NULL DEFAULT 20.0,
    "expressDeliveryPrice" DECIMAL(12,2) NOT NULL DEFAULT 15000.0,
    "volumeTier1" INTEGER NOT NULL DEFAULT 20000,
    "volumeTier2" INTEGER NOT NULL DEFAULT 100000,
    "outsourcingOneTimePrice" DECIMAL(12,2) NOT NULL DEFAULT 100000.0,
    "outsourcingTier1Price" DECIMAL(12,2) NOT NULL DEFAULT 200000.0,
    "outsourcingTier2Price" DECIMAL(12,2) NOT NULL DEFAULT 300000.0,
    "outsourcingTier3Price" DECIMAL(12,2) NOT NULL DEFAULT 400000.0,
    "outsourcingTier4Price" DECIMAL(12,2) NOT NULL DEFAULT 500000.0,
    "cardNktPrice" DECIMAL(12,2) NOT NULL DEFAULT 200.0,
    "cardMptPrice" DECIMAL(12,2) NOT NULL DEFAULT 300.0,
    "cardFullPackagePrice" DECIMAL(12,2) NOT NULL DEFAULT 400.0,
    "trainingCoursePrice" DECIMAL(12,2) NOT NULL DEFAULT 100000.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceLead" (
    "id" TEXT NOT NULL,
    "serviceTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "binIin" TEXT,
    "notes" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widthMm" DOUBLE PRECISION NOT NULL,
    "heightMm" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "elements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabelTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStickerTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "OrderCategory",
    "widthMm" DOUBLE PRECISION NOT NULL DEFAULT 58,
    "heightMm" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "elements" JSONB NOT NULL DEFAULT '[]',
    "previewUrl" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "sourceOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStickerTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkirovkaAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "environment" "MarkirovkaEnvironment" NOT NULL DEFAULT 'TEST',
    "baseUrl" TEXT,
    "login" TEXT NOT NULL,
    "encryptedPassword" TEXT NOT NULL,
    "omsId" TEXT,
    "categories" "OrderCategory"[] DEFAULT ARRAY[]::"OrderCategory"[],
    "status" "MarkirovkaAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "token" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "trueApiToken" TEXT,
    "trueApiExpiresAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "nktApiKey" TEXT,
    "nktBaseUrl" TEXT DEFAULT 'https://nationalcatalog.kz/gwp',
    "nktStatus" TEXT DEFAULT 'NOT_CONFIGURED',
    "nktLastCheckedAt" TIMESTAMP(3),
    "nktLastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkirovkaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkirovkaOperation" (
    "id" TEXT NOT NULL,
    "type" "MarkirovkaOperationType" NOT NULL,
    "accountId" TEXT,
    "documentNumber" TEXT,
    "codesCount" INTEGER NOT NULL DEFAULT 0,
    "status" "MarkirovkaOperationStatus" NOT NULL DEFAULT 'PROCESSING',
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorDetails" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkirovkaOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkirovkaOrder" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "orderId" TEXT,
    "externalOrderId" TEXT,
    "category" "OrderCategory" NOT NULL,
    "gtin" TEXT NOT NULL,
    "quantityRequested" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "status" "MarkirovkaOrderStatus" NOT NULL DEFAULT 'PENDING',
    "errorDetails" TEXT,
    "codes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkirovkaOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkirovkaUtilisationReport" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "orderId" TEXT,
    "externalReportId" TEXT,
    "category" "OrderCategory" NOT NULL,
    "gtin" TEXT,
    "codesCount" INTEGER NOT NULL,
    "status" "MarkirovkaReportStatus" NOT NULL DEFAULT 'DRAFT',
    "reportData" JSONB,
    "errorDetails" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkirovkaUtilisationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "customerName" TEXT NOT NULL,
    "customerBinIin" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "customerPhone" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "index" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'шт',
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "OnlinePayment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "type" "OnlinePaymentType" NOT NULL DEFAULT 'ORDER',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KZT',
    "status" "OnlinePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "pgPaymentId" TEXT,
    "pgCardPan" TEXT,
    "pgPaymentDate" TIMESTAMP(3),
    "redirectUrl" TEXT,
    "rawResponse" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlinePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkirovkaProductCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "category" "OrderCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "nameKk" TEXT,
    "brand" TEXT,
    "article" TEXT,
    "model" TEXT,
    "tnved" TEXT,
    "country" TEXT DEFAULT 'Казахстан',
    "producerName" TEXT,
    "producerAddress" TEXT,
    "importerName" TEXT,
    "importerBin" TEXT,
    "targetGender" TEXT,
    "size" TEXT,
    "color" TEXT,
    "composition" TEXT,
    "packageType" TEXT NOT NULL DEFAULT 'UNIT',
    "gtin" TEXT,
    "gostOrTu" TEXT,
    "certificateType" TEXT,
    "certificateNumber" TEXT,
    "certificateDate" TIMESTAMP(3),
    "certificateExpiryDate" TIMESTAMP(3),
    "netWeight" TEXT,
    "grossWeight" TEXT,
    "shelfLife" TEXT,
    "status" "MarkirovkaCardStatus" NOT NULL DEFAULT 'DRAFT',
    "moderationComment" TEXT,
    "nktRequestId" TEXT,
    "mptCardId" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkirovkaProductCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramAuthToken_key" ON "User"("telegramAuthToken");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderPosition_orderId_idx" ON "OrderPosition"("orderId");

-- CreateIndex
CREATE INDEX "OrderPosition_gtin_idx" ON "OrderPosition"("gtin");

-- CreateIndex
CREATE INDEX "OrderCodeItem_orderId_code_idx" ON "OrderCodeItem"("orderId", "code");

-- CreateIndex
CREATE INDEX "OrderCodeItem_code_idx" ON "OrderCodeItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_code_key" ON "Tariff"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PricingSettings_key_key" ON "PricingSettings"("key");

-- CreateIndex
CREATE INDEX "UserStickerTemplate_userId_idx" ON "UserStickerTemplate"("userId");

-- CreateIndex
CREATE INDEX "MarkirovkaAccount_userId_idx" ON "MarkirovkaAccount"("userId");

-- CreateIndex
CREATE INDEX "MarkirovkaAccount_environment_idx" ON "MarkirovkaAccount"("environment");

-- CreateIndex
CREATE INDEX "MarkirovkaOperation_type_idx" ON "MarkirovkaOperation"("type");

-- CreateIndex
CREATE INDEX "MarkirovkaOperation_status_idx" ON "MarkirovkaOperation"("status");

-- CreateIndex
CREATE INDEX "MarkirovkaOperation_accountId_idx" ON "MarkirovkaOperation"("accountId");

-- CreateIndex
CREATE INDEX "MarkirovkaOrder_accountId_idx" ON "MarkirovkaOrder"("accountId");

-- CreateIndex
CREATE INDEX "MarkirovkaOrder_orderId_idx" ON "MarkirovkaOrder"("orderId");

-- CreateIndex
CREATE INDEX "MarkirovkaOrder_status_idx" ON "MarkirovkaOrder"("status");

-- CreateIndex
CREATE INDEX "MarkirovkaUtilisationReport_accountId_idx" ON "MarkirovkaUtilisationReport"("accountId");

-- CreateIndex
CREATE INDEX "MarkirovkaUtilisationReport_orderId_idx" ON "MarkirovkaUtilisationReport"("orderId");

-- CreateIndex
CREATE INDEX "MarkirovkaUtilisationReport_status_idx" ON "MarkirovkaUtilisationReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- CreateIndex
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_date_idx" ON "Invoice"("date");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "VerificationCode_email_idx" ON "VerificationCode"("email");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "OnlinePayment_paymentNumber_key" ON "OnlinePayment"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OnlinePayment_pgPaymentId_key" ON "OnlinePayment"("pgPaymentId");

-- CreateIndex
CREATE INDEX "OnlinePayment_userId_idx" ON "OnlinePayment"("userId");

-- CreateIndex
CREATE INDEX "OnlinePayment_orderId_idx" ON "OnlinePayment"("orderId");

-- CreateIndex
CREATE INDEX "OnlinePayment_status_idx" ON "OnlinePayment"("status");

-- CreateIndex
CREATE INDEX "OnlinePayment_createdAt_idx" ON "OnlinePayment"("createdAt");

-- CreateIndex
CREATE INDEX "MarkirovkaProductCard_userId_idx" ON "MarkirovkaProductCard"("userId");

-- CreateIndex
CREATE INDEX "MarkirovkaProductCard_accountId_idx" ON "MarkirovkaProductCard"("accountId");

-- CreateIndex
CREATE INDEX "MarkirovkaProductCard_category_idx" ON "MarkirovkaProductCard"("category");

-- CreateIndex
CREATE INDEX "MarkirovkaProductCard_status_idx" ON "MarkirovkaProductCard"("status");

-- CreateIndex
CREATE INDEX "MarkirovkaProductCard_gtin_idx" ON "MarkirovkaProductCard"("gtin");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tariffType_fkey" FOREIGN KEY ("tariffType") REFERENCES "Tariff"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "UserStickerTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPosition" ADD CONSTRAINT "OrderPosition_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCodeItem" ADD CONSTRAINT "OrderCodeItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStickerTemplate" ADD CONSTRAINT "UserStickerTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkirovkaAccount" ADD CONSTRAINT "MarkirovkaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkirovkaOperation" ADD CONSTRAINT "MarkirovkaOperation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarkirovkaAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkirovkaOrder" ADD CONSTRAINT "MarkirovkaOrder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarkirovkaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkirovkaOrder" ADD CONSTRAINT "MarkirovkaOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkirovkaUtilisationReport" ADD CONSTRAINT "MarkirovkaUtilisationReport_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarkirovkaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkirovkaUtilisationReport" ADD CONSTRAINT "MarkirovkaUtilisationReport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlinePayment" ADD CONSTRAINT "OnlinePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlinePayment" ADD CONSTRAINT "OnlinePayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkirovkaProductCard" ADD CONSTRAINT "MarkirovkaProductCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkirovkaProductCard" ADD CONSTRAINT "MarkirovkaProductCard_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarkirovkaAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
