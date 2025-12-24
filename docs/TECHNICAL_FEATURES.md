# Sothis Booking System - Technical Feature Overview

This document outlines the core features and technical workflows of the Sothis Therapeutic Massage booking application.

## 1. Client Features & Booking Flow

The client-facing application focuses on a seamless, secure, and user-friendly experience for booking massage appointments.

### 🔐 Authentication (Passwordless)
The system uses a secure, passwordless authentication flow powered by **NextAuth.js** and **Resend (Email API)**.
- **Method**: Email + One-Time Password (OTP).
- **Flow**:
    1.  User enters email.
    2.  System checks if user exists.
    3.  **New User**: Prompts for registration details (Name, Phone, Address) -> Creates Account -> Sends OTP.
    4.  **Existing User**: Sends 6-digit OTP to email immediately.
    5.  User enters code to authenticate.
- **Security**:
    - OTPs expire in 10 minutes.
    - Rate limiting protection (implicit via Resend tiers and logic).
    - `dev_otp` provided in API response *only* in development environment for testing.

### 📅 Booking Workflow
The booking wizard guides the user through the following steps:
1.  **Auth/Registration**: User must assume identity first.
2.  **Provider Selection**:
    - Users can select a specific therapist (e.g., "Nancy").
    - **"Any Provider" Option**: Automatically shows combined availability for maximum convenience.
3.  **Slot Selection**:
    - **Calendar View**: Monthly overview with available dates highlighted.
    - **Day View**: Granular time slot selection.
    - **Real-time Logic**: Prevents booking past slots or double-booking via race-condition checks in the API.
4.  **Confirmation**:
    - Reviews details.
    - Submits booking -> Status set to `confirmed`.
    - Triggers automated confirmation emails to both **Client** and **Admin**.

### 💬 Chat Widget ("Nancy's Assistant")
- A floating chat widget available on the landing page.
- Provides a direct line of communication for quick questions.
- **Logic**: Visible to all users, but personalized if logged in.

---

## 2. Admin & Staff Features

The Admin Portal is a restricted area for managing the business operations. Access is controlled via **Role-Based Access Control (RBAC)**.

### 🛡️ Access Levels
- **Admin**: Full access to all features, settings, and all staff data.
- **Provider**: Restricted access. Can only view/manage *their own* schedule and availability.

### 📊 Dashboard
- **Stats Overview**: Quick view of Bookings (Today, Week, Month).
- **Upcoming Bookings**: List of immediate upcoming appointments.
- **Personalization**: Welcomes the user by name.

### 🗓️ Booking Management (`/admin/bookings`)
- **Unified Master Calendar**:
    - Visualizes all bookings across all providers.
    - **Color Coded**:
        - 🟢 **Green**: Available Slots.
        - ⚪ **Gray**: Confirmed Bookings.
        - 🔴 **Red**: Blocked/Unavailable.
- **Filtering**:
    - Admins can filter the view by specific providers to check individual schedules.
- **Slot Management**:
    - Click any "Available" slot to **Block** it (remove availability).
    - Click any "Blocked" slot to **Release** it (make available).
    - Click a "Booking" to view details (Client info, notes).

### ⌚ Availability & Slots (`/admin/availability`)
- **Weekly Templates**:
    - Define recurring weekly schedules (e.g., "Mondays 9 AM - 5 PM").
    - Supports multiple templates per provider.
- **Bulk Generation**:
    - "Generate Slots" tool uses templates to bulk-create availability for a selected date range.
    - Automatically adds **15-minute buffers** between slots.
    - Skips existing slots to prevent duplicates.

### 👥 Staff Management (`/admin/staff`)
- **User Directory**: Unified list of all Admins and Providers.
- **Provider Profiles**:
    - Manage display details: Bio, Specialties, Color Code (for calendar).
- **Onboarding**: Create new Staff accounts directly from the dashboard.

### 📇 Client Management (`/admin/clients`)
- **Database**: Searchable list of all registered clients.
- **History**: (Planned) View booking history per client.
- **Editing**: Update client contact info or add internal administrative notes.

---

## 3. Technical Architecture

- **Framework**: Next.js 14 (App Router).
- **Database**: Supabase (PostgreSQL).
- **Auth**: NextAuth.js (Custom Adapter for Supabase).
- **Styling**: Tailwind CSS + Custom Design System.
- **Email**: Resend API.
- **Internationalization**: `next-intl` (English/Spanish support).
