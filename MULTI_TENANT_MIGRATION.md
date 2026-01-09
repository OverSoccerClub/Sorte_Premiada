# Multi-Tenant Database Migration Guide

## Overview

This document provides step-by-step instructions for migrating your existing single-tenant database to a multi-tenant architecture.

## Prerequisites

- ✅ Backup your database
- ✅ Stop all running applications
- ✅ Have database admin access

## Migration Steps

### Step 1: Create Default Company

Run this SQL to create the default company if it doesn't exist:

```sql
DO $$
DECLARE
    default_company_id UUID;
BEGIN
    SELECT id INTO default_company_id
    FROM "CompanySettings"
    WHERE slug = 'default';

    IF default_company_id IS NULL THEN
        INSERT INTO "CompanySettings" (
            id, slug, "companyName", slogan, "primaryColor", "createdAt", "updatedAt"
        )
        VALUES (
            gen_random_uuid(), 'default', 'A Perseverança', 'Cambista Edition', '#50C878', NOW(), NOW()
        )
        RETURNING id INTO default_company_id;
        
        RAISE NOTICE 'Created default company with ID: %', default_company_id;
    END IF;
END $$;
```

### Step 2: Migrate Existing Data

Associate all existing data with the default company:

```sql
DO $$
DECLARE
    default_company_id UUID;
BEGIN
    SELECT id INTO default_company_id FROM "CompanySettings" WHERE slug = 'default';

    UPDATE "User" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "Area" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "Game" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "Draw" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "Ticket" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "Transaction" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "DailyClose" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "PosTerminal" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "NotificationLog" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "Announcement" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "AuditLog" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "SecurityLog" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "ExtractionSeries" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
    UPDATE "SecondChanceDraw" SET "companyId" = default_company_id WHERE "companyId" IS NULL;
END $$;
```

### Step 3: Add Performance Indexes

```sql
-- User indexes
CREATE INDEX IF NOT EXISTS "User_companyId_role_idx" ON "User"("companyId", "role");
CREATE INDEX IF NOT EXISTS "User_companyId_areaId_idx" ON "User"("companyId", "areaId");

-- Ticket indexes (most critical)
CREATE INDEX IF NOT EXISTS "Ticket_companyId_status_idx" ON "Ticket"("companyId", "status");
CREATE INDEX IF NOT EXISTS "Ticket_companyId_userId_idx" ON "Ticket"("companyId", "userId");
CREATE INDEX IF NOT EXISTS "Ticket_companyId_gameId_idx" ON "Ticket"("companyId", "gameId");
CREATE INDEX IF NOT EXISTS "Ticket_companyId_createdAt_idx" ON "Ticket"("companyId", "createdAt");

-- Transaction indexes
CREATE INDEX IF NOT EXISTS "Transaction_companyId_userId_idx" ON "Transaction"("companyId", "userId");
CREATE INDEX IF NOT EXISTS "Transaction_companyId_createdAt_idx" ON "Transaction"("companyId", "createdAt");

-- Other indexes
CREATE INDEX IF NOT EXISTS "DailyClose_companyId_date_idx" ON "DailyClose"("companyId", "date");
CREATE INDEX IF NOT EXISTS "Draw_companyId_gameId_idx" ON "Draw"("companyId", "gameId");
CREATE INDEX IF NOT EXISTS "Game_companyId_isActive_idx" ON "Game"("companyId", "isActive");
CREATE INDEX IF NOT EXISTS "Area_companyId_name_idx" ON "Area"("companyId", "name");
CREATE INDEX IF NOT EXISTS "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "SecurityLog_companyId_createdAt_idx" ON "SecurityLog"("companyId", "createdAt");
```

### Step 4: Verify Migration

```sql
-- Check for orphaned records
SELECT 'Users' as table_name, COUNT(*) as orphan_count FROM "User" WHERE "companyId" IS NULL
UNION ALL
SELECT 'Tickets', COUNT(*) FROM "Ticket" WHERE "companyId" IS NULL
UNION ALL
SELECT 'Transactions', COUNT(*) FROM "Transaction" WHERE "companyId" IS NULL;
```

### Step 5: Deploy Updated Application

1. Deploy the new API with multi-tenant infrastructure
2. Test with default company
3. Create additional companies as needed

## Rollback (if needed)

```sql
-- Set all companyId to NULL
UPDATE "User" SET "companyId" = NULL;
UPDATE "Ticket" SET "companyId" = NULL;
-- ... (repeat for all tables)

-- Drop indexes
DROP INDEX IF EXISTS "User_companyId_role_idx";
DROP INDEX IF EXISTS "Ticket_companyId_status_idx";
-- ... (repeat for all indexes)
```

## Post-Migration

- ✅ Test data isolation between companies
- ✅ Verify performance with indexes
- ✅ Update documentation
- ✅ Train team on multi-tenant features
