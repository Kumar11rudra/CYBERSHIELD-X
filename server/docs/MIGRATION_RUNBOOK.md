# CyberShield X — Legacy Encryption Migration Runbook

**Target**: Production Database Operator Deployment Action  
**Phase**: Phase 19 Production Readiness  
**Script**: [`server/scripts/migrateUserEncryption.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/migrateUserEncryption.js)  

---

## Overview

This runbook details the mandatory operator steps to migrate legacy User PII records (`email`, `mobileNumber`) encrypted under `mongoose-field-encryption@7.0.1` to the Node.js 24-compatible `enc2:` AES-256-CBC format before releasing version V18.1.0+ to production.

---

## Mandatory Operator Workflow

### Step 1: Production Database Backup
Create a complete snapshot / binary backup of the production MongoDB instance.
```bash
mongodump --uri="$MONGODB_URI" --out=/backups/cybershield-pre-v18-migration
```

### Step 2: Validate Production Environment Variables
Ensure `VAULT_ENCRYPTION_KEY` is configured in the environment and matches the legacy key secret.
```bash
echo "VAULT_ENCRYPTION_KEY is set: ${#VAULT_ENCRYPTION_KEY} chars"
```

### Step 3: Run Dry-Run Inspection Mode
Execute the migration script in `--dry-run` mode to inspect affected documents without writing any changes.
```bash
node server/scripts/migrateUserEncryption.js --dry-run
```

### Step 4: Audit Dry-Run Statistics
Verify the dry-run execution report:
- `scanned`: Total User documents in database.
- `legacy`: Documents containing legacy-encrypted PII.
- `migrated`: Documents that would be re-encrypted.
- `skipped`: Documents already in `enc2:` format or unencrypted.
- `failed`: Must be `0`. If `failed > 0`, do NOT proceed. Investigate key mismatch or corrupted records.

### Step 5: Verify Application & DB Health
Confirm database connectivity and backup integrity before execution.

### Step 6: Operator-Executed Migration
Run the script with explicit `--execute` authorization flag:
```bash
node server/scripts/migrateUserEncryption.js --execute
```

### Step 7: Verify Migration Output
Confirm `failed: 0` and `migrated: <expected count>`.

### Step 8: Deploy New Application Build
Start/restart the updated CyberShield X server instance running Node.js 24+.
