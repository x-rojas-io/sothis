# Sothis Utility Scripts

This directory contains various utility scripts used for development, verification, and maintenance of the Sothis application. We keep these scripts to help debug issues and verify system integrity.

## 🧪 Verification & Testing
These scripts are used to **test** that features are working correctly. They do not modify data unless specified.

- **`verify-concurrency.ts`**: Tests the booking system to ensure double-bookings are prevented (race conditions).
- **`verify-providers.ts`**: Verifies that provider accounts are correctly linked to user accounts.
- **`verify-keys.ts`**: Checks that environment variables (API keys) are loaded check.
- **`verify-service-key.ts`**: Specifically verifies the Supabase Service Role key.
- **`verify-hardcoded.js`**: (Legacy) Checked for hardcoded values in previous builds.
- **`check-provider-link.js`**: **(Key)** Verifies the integrity of the User <-> Provider relationship in the database.
- **`check-slots.js`**: Checks the status of time slots.
- **`test-admin-queries.js`**: Tests admin-level database queries for permissions.

## 🐞 Debugging
These scripts help investigate issues when something goes wrong.

- **`debug_login.js`**: Helper to debug login/auth failures.
- **`debug-client-name.js`**: Investigates issues with client name display.
- **`check-empty-names.js`**: Finds client records with missing names.
- **`check-users-names.js`**: Finds user records with missing names.

## 🛠 Maintenance & Setup
Scripts used for setting up the database or fixing data.

- **`seed-knowledge.ts`**: Seeds the knowledge base (if applicable).
- **`migration_helper.ts`**: 
- **`sync_users_to_clients.ts`**: Syncs Auth Users to the Clients table.
- **`reset_nancy.ts`**: Resets specific provider data (Use with caution).
- **`check_tables.js` / `check_schema.js`**: Inspects database structure.

## How to Run
Most scripts can be run with `bun` or `node`:
```bash
bun scripts/verify-concurrency.ts
# or
node scripts/check-provider-link.js
```
