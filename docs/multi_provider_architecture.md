# Architecture Analysis: Multi-Provider Expansion

**Objective**: Scale **Sothis Therapeutic Massage** from a solo practice (Nancy) to a multi-therapist clinic.

## 1. Executive Summary
The current architecture creates `time_slots` globally. To support multiple providers, we must scope Availability and Slots to specific Providers. This is a feasible migration with medium complexity.

---

## 2. Database Schema Changes

### A. New Table: `providers`
We need a dedicated table for staff members.
```sql
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id), -- Optional: if they need login access
  name TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[], -- e.g. ['Deep Tissue', 'Sports']
  color_code TEXT, -- For calendar UI (e.g., #FF5733)
  is_active BOOLEAN DEFAULT true
);
```

### B. Update: `availability_templates`
Templates must belong to a person, not the system.
```sql
ALTER TABLE availability_templates 
ADD COLUMN provider_id UUID REFERENCES providers(id);
-- Migration: Assign existing templates to Nancy's provider_id
```

### C. Update: `time_slots`
A slot at 9:00 AM can now exist twice (once for Nancy, once for New Hire).
```sql
ALTER TABLE time_slots
ADD COLUMN provider_id UUID REFERENCES providers(id);

-- CONSTRAINT UPDATE:
-- Old: UNIQUE(date, start_time)
-- New: UNIQUE(date, start_time, provider_id)
```

---

## 3. UI/UX Workflow Changes

### client Booking Flow
Current: `Select Service` -> `Select Time` -> `Details`.
New: `Select Service` -> **`Select Provider`** (Optional "Any Provider") -> `Select Time` -> `Details`.

*   **"Any Provider" Logic**: If user selects "Any", show union of all available slots.

### Admin Dashboard
*   **Calendar View**: Needs a "Filter by Provider" dropdown.
*   **Color Coding**: Each booking should show the provider's color.

---

## 4. AI & Chatbot Implications ("Nancy" as Receptionist)
The RAG system currently assumes one answer for "When are you open?".

**Client-Facing "Receptionist" Role**:
The AI will act as a smart front-desk agent for clients.
*   **Context Awareness**: It will know which providers perform which services.
*   **Availability Queries**: 
    *   *User*: "Do you have anyone for deep tissue on Sunday?"
    *   *AI Logic*: Query `providers` for `specialties @> 'Deep Tissue'`, then check their `time_slots`.
    *   *AI Response*: "Yes, Sarah is available at 10am for Deep Tissue. Nancy is off that day."
*   **Booking Assistance**: It can guide the client to the specific booking link for that provider/slot.

---

## 5. Security & Roles (RBAC)
1.  **Super Admin (Owner)**: Full system access, can manage other providers.
2.  **Admin Assistant**: Can manage bookings and view all calendars, but limited system settings.
3.  **Provider (LMT)**: 
    *   Can view/manage their *own* schedule.
    *   Can view their *own* bookings.
    *   Cannot modify other providers' slots.
4.  **Client (User)**:
    *   Can search availability (Public).
    *   Can view/manage their *own* profile and booking history.
    *   No access to internal admin/provider dashboards.

---

## 7. Concurrency Control (Double Booking Prevention)

**Good News: No Logic Changes Required.**

The Concurrency Fix we recently implemented relies on a Unique Index on `time_slot_id`:
```sql
CREATE UNIQUE INDEX idx_unique_active_booking ON bookings(time_slot_id) ...
```

In the Multi-Provider world, `time_slot_id` effectively becomes "Provider Specific":
*   **Slot A** = Nancy @ 9:00 AM
*   **Slot B** = Sarah @ 9:00 AM

If two clients try to book Nancy (Slot A), the index blocks one.
If one client books Nancy (Slot A) and another books Sarah (Slot B), the index allows both.

**Conclusion**: The current database-level locking strategy effectively scales to unlimited providers without modification.

---

## 6. Migration Strategy
1.  **Create Provider**: Create "Nancy" as the first provider.
2.  **Backfill**: Update all existing `time_slots` and `bookings` to link to Nancy's ID.
3.  **Switch**: Update the API to require `provider_id` for availability checks.
