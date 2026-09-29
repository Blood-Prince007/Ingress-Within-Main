# Ingress Within — Google Calendar & Google Meet Setup Guide

This document describes the steps required to configure and operate the Google Calendar and Google Meet integration in production and development environments for Ingress Within.

---

## Architecture Overview

- **Calendar Synchronization**: Google Calendar API v3
- **Video Meetings**: Google Meet (generated automatically by Google Calendar API using `conferenceDataVersion=1`)
- **Authority**: Ingress Within remains the source of truth for therapists, clients, care relationships, appointments, booking rules, payments, and cancellations. Google Calendar is an external integration.
- **Privacy Boundary**: Ingress Within only queries **free/busy** intervals for availability. Personal calendar event titles, descriptions, and attendees are never imported or stored.
- **Strict Invariant**: Google Meet URLs are **never fabricated** (e.g. no `meet.ingresswithin.com` or `meet.google.com/iw-...`). If Google Meet creation fails, the appointment is preserved and `google_meet_status` is recorded as `failed` with a server-side retry mechanism.

---

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** > **New Project**.
3. Set the project name (e.g. `ingress-within-production`).
4. Click **Create** and wait for project initialization.

---

## 2. Enable Google Calendar API

1. In Google Cloud Console, navigate to **APIs & Services** > **Library**.
2. Search for **Google Calendar API**.
3. Select it and click **Enable**.

---

## 3. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**.
2. Select User Type: **External** (unless restricting to an internal Google Workspace organization).
3. Fill in the App Information:
   - **App name**: `Ingress Within`
   - **User support email**: `support@ingresswithin.com`
   - **App domain**:
     - Application home page: `https://ingresswithin.com`
     - Application privacy policy link: `https://ingresswithin.com/privacy`
     - Application terms of service link: `https://ingresswithin.com/terms`
   - **Developer contact information**: `tech@ingresswithin.com`
4. Add Scopes (Strict Minimal Scopes):
   - `https://www.googleapis.com/auth/calendar.events` (Manage sessions, create Meet links, query freeBusy)
   - `https://www.googleapis.com/auth/userinfo.email` (View connected Google account email)
   *(Note: Never request `calendar.readonly` or full `calendar` administrative access).*
5. For testing, add test Google accounts if in **Testing** publishing status. Submit for verification for public production rollout.

---

## 4. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Select Application type: **Web application**.
4. Name: `Ingress Within Web Application`.
5. Add **Authorized JavaScript origins**:
   - Development: `http://localhost:3000`
   - Production: `https://ingresswithin.com`
6. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/calendar/google/callback`
   - Production: `https://ingresswithin.com/api/calendar/google/callback`
7. Click **Create**.
8. Copy the **Client ID** and **Client Secret**.

---

## 5. Configure Environment Variables

Add the credentials to your server environment (e.g. Vercel, AWS ECS, or container environment).

> **CRITICAL SECURITY REQUIREMENT**:
> Never prefix these variables with `NEXT_PUBLIC_`.
> Never expose `GOOGLE_CLIENT_SECRET` in client JavaScript, API responses, or git commits.

```env
# Google Calendar & Meet Integration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://ingresswithin.com/api/calendar/google/callback
```

For local development in `.env`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/google/callback
```

---

## 6. Restart Deployment

Restart your Next.js application / deployment to pick up the environment variables.

---

## 7. Verification & Troubleshooting

- **Check status**:
  - Therapists: Navigate to **Profile & Practice Settings** > **Google Calendar & Meetings** to connect and test synchronization.
  - Clients: Navigate to **Settings** > **Google Calendar** or **Therapy Sessions**.
- **Expired Tokens**:
  - The application automatically refreshes access tokens using offline refresh tokens.
  - If a practitioner revokes access in their Google Account security settings, Ingress Within marks `sync_status = 'revoked'` and presents a clear **Reconnect Google Calendar** action.
- **Calendar Event Failures**:
  - If Google Calendar is temporarily unreachable when a session is booked, the clinical appointment and payment remain confirmed, `calendar_sync_status` is set to `failed`, and a **Try calendar sync again** button allows instant retry via the server-side endpoint `POST /api/therapy/sessions/sync-calendar`.
