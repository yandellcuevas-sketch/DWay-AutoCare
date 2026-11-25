-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "termsAcceptedAt" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "resetTokenHash" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "companyId" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "mileage" INTEGER NOT NULL,
    "lastMaintenanceDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "reference" TEXT,
    "additionalInstructions" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageZone" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "travelTimeMinutes" INTEGER NOT NULL DEFAULT 30,
    "surchargeFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverageZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "homePrice" DECIMAL(65,30),
    "estimatedDuration" INTEGER NOT NULL,
    "isAvailableWorkshop" BOOLEAN NOT NULL DEFAULT true,
    "isAvailableHome" BOOLEAN NOT NULL DEFAULT false,
    "requiresLift" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "iconName" TEXT,
    "conditions" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technician" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specializations" TEXT NOT NULL,
    "canDriveMobileUnit" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopResource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkshopResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "equipmentNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedSlot" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT,
    "resourceId" TEXT,
    "mobileUnitId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "addressId" TEXT,
    "companyId" TEXT,
    "mode" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "notes" TEXT,
    "technicianId" TEXT,
    "resourceId" TEXT,
    "mobileUnitId" TEXT,
    "subscriptionId" TEXT,
    "membershipBenefitUsed" TEXT,
    "promotionCode" TEXT,
    "subtotalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "travelFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentService" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "usedMembershipBenefit" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatusHistory" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "AppointmentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "mileageAtService" INTEGER NOT NULL,
    "servicesPerformed" TEXT NOT NULL,
    "productsUsed" TEXT,
    "checklistJson" TEXT,
    "totalCost" DECIMAL(65,30) NOT NULL,
    "observations" TEXT,
    "recommendations" TEXT,
    "nextServiceDate" TIMESTAMP(3),
    "nextServiceMileage" INTEGER,
    "warrantyExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(65,30) NOT NULL,
    "annualPrice" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "targetMode" TEXT NOT NULL,
    "includedReviews" INTEGER NOT NULL DEFAULT 0,
    "includedBatteryTests" INTEGER NOT NULL DEFAULT 0,
    "includedDiagnostics" INTEGER NOT NULL DEFAULT 0,
    "includedOilChanges" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "benefits" TEXT NOT NULL,
    "restrictions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "planId" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "reviewsUsed" INTEGER NOT NULL DEFAULT 0,
    "batteryTestsUsed" INTEGER NOT NULL DEFAULT 0,
    "diagnosticsUsed" INTEGER NOT NULL DEFAULT 0,
    "oilChangesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rnc" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "vehicleCount" INTEGER,
    "vehicleTypes" TEXT,
    "servicesRequired" TEXT,
    "estimatedFrequency" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateContract" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractCode" TEXT NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'Flota B├ísica',
    "monthlyFeePerVehicle" DECIMAL(65,30) NOT NULL DEFAULT 1500,
    "vehicleCount" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 10,
    "includedVisitsPerYear" INTEGER NOT NULL DEFAULT 4,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "appointmentId" TEXT,
    "corporateContractId" TEXT,
    "clientId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "reference" TEXT,
    "isDemoPayment" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'INTERNAL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'DELIVERED',
    "providerResponse" TEXT,
    "dedupeKey" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE INDEX "Vehicle_clientId_idx" ON "Vehicle"("clientId");

-- CreateIndex
CREATE INDEX "Vehicle_companyId_idx" ON "Vehicle"("companyId");

-- CreateIndex
CREATE INDEX "Vehicle_plate_idx" ON "Vehicle"("plate");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "CoverageZone_isActive_idx" ON "CoverageZone"("isActive");

-- CreateIndex
CREATE INDEX "CoverageZone_sector_idx" ON "CoverageZone"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "CoverageZone_province_municipality_sector_key" ON "CoverageZone"("province", "municipality", "sector");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "Service_isAvailableWorkshop_idx" ON "Service"("isAvailableWorkshop");

-- CreateIndex
CREATE INDEX "Service_isAvailableHome_idx" ON "Service"("isAvailableHome");

-- CreateIndex
CREATE INDEX "Service_sortOrder_idx" ON "Service"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Technician_userId_key" ON "Technician"("userId");

-- CreateIndex
CREATE INDEX "Technician_isActive_idx" ON "Technician"("isActive");

-- CreateIndex
CREATE INDEX "Technician_canDriveMobileUnit_idx" ON "Technician"("canDriveMobileUnit");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopResource_name_key" ON "WorkshopResource"("name");

-- CreateIndex
CREATE INDEX "WorkshopResource_isActive_idx" ON "WorkshopResource"("isActive");

-- CreateIndex
CREATE INDEX "WorkshopResource_type_idx" ON "WorkshopResource"("type");

-- CreateIndex
CREATE UNIQUE INDEX "MobileUnit_name_key" ON "MobileUnit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MobileUnit_plate_key" ON "MobileUnit"("plate");

-- CreateIndex
CREATE INDEX "MobileUnit_isActive_idx" ON "MobileUnit"("isActive");

-- CreateIndex
CREATE INDEX "WorkSchedule_technicianId_idx" ON "WorkSchedule"("technicianId");

-- CreateIndex
CREATE INDEX "WorkSchedule_technicianId_dayOfWeek_idx" ON "WorkSchedule"("technicianId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "BlockedSlot_technicianId_idx" ON "BlockedSlot"("technicianId");

-- CreateIndex
CREATE INDEX "BlockedSlot_resourceId_idx" ON "BlockedSlot"("resourceId");

-- CreateIndex
CREATE INDEX "BlockedSlot_mobileUnitId_idx" ON "BlockedSlot"("mobileUnitId");

-- CreateIndex
CREATE INDEX "BlockedSlot_date_idx" ON "BlockedSlot"("date");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_bookingCode_key" ON "Appointment"("bookingCode");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_vehicleId_idx" ON "Appointment"("vehicleId");

-- CreateIndex
CREATE INDEX "Appointment_technicianId_idx" ON "Appointment"("technicianId");

-- CreateIndex
CREATE INDEX "Appointment_resourceId_idx" ON "Appointment"("resourceId");

-- CreateIndex
CREATE INDEX "Appointment_mobileUnitId_idx" ON "Appointment"("mobileUnitId");

-- CreateIndex
CREATE INDEX "Appointment_addressId_idx" ON "Appointment"("addressId");

-- CreateIndex
CREATE INDEX "Appointment_companyId_idx" ON "Appointment"("companyId");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_bookingCode_idx" ON "Appointment"("bookingCode");

-- CreateIndex
CREATE INDEX "AppointmentService_appointmentId_idx" ON "AppointmentService"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentService_serviceId_idx" ON "AppointmentService"("serviceId");

-- CreateIndex
CREATE INDEX "AppointmentStatusHistory_appointmentId_idx" ON "AppointmentStatusHistory"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentStatusHistory_changedById_idx" ON "AppointmentStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "AppointmentStatusHistory_changedAt_idx" ON "AppointmentStatusHistory"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRecord_appointmentId_key" ON "MaintenanceRecord"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRecord_receiptNumber_key" ON "MaintenanceRecord"("receiptNumber");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vehicleId_idx" ON "MaintenanceRecord"("vehicleId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_clientId_idx" ON "MaintenanceRecord"("clientId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_technicianId_idx" ON "MaintenanceRecord"("technicianId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_serviceDate_idx" ON "MaintenanceRecord"("serviceDate");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_slug_key" ON "MembershipPlan"("slug");

-- CreateIndex
CREATE INDEX "MembershipPlan_isActive_idx" ON "MembershipPlan"("isActive");

-- CreateIndex
CREATE INDEX "Subscription_clientId_idx" ON "Subscription"("clientId");

-- CreateIndex
CREATE INDEX "Subscription_vehicleId_idx" ON "Subscription"("vehicleId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Company_rnc_key" ON "Company"("rnc");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Company_rnc_idx" ON "Company"("rnc");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateContract_contractCode_key" ON "CorporateContract"("contractCode");

-- CreateIndex
CREATE INDEX "CorporateContract_companyId_idx" ON "CorporateContract"("companyId");

-- CreateIndex
CREATE INDEX "CorporateContract_status_idx" ON "CorporateContract"("status");

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");

-- CreateIndex
CREATE INDEX "Payment_appointmentId_idx" ON "Payment"("appointmentId");

-- CreateIndex
CREATE INDEX "Payment_corporateContractId_idx" ON "Payment"("corporateContractId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE INDEX "Promotion_code_idx" ON "Promotion"("code");

-- CreateIndex
CREATE INDEX "Promotion_isActive_idx" ON "Promotion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_channel_idx" ON "Notification"("channel");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "SystemConfig_key_idx" ON "SystemConfig"("key");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technician" ADD CONSTRAINT "Technician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedSlot" ADD CONSTRAINT "BlockedSlot_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedSlot" ADD CONSTRAINT "BlockedSlot_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "WorkshopResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedSlot" ADD CONSTRAINT "BlockedSlot_mobileUnitId_fkey" FOREIGN KEY ("mobileUnitId") REFERENCES "MobileUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "WorkshopResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_mobileUnitId_fkey" FOREIGN KEY ("mobileUnitId") REFERENCES "MobileUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateContract" ADD CONSTRAINT "CorporateContract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_corporateContractId_fkey" FOREIGN KEY ("corporateContractId") REFERENCES "CorporateContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
