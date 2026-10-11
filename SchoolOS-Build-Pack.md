# SchoolOS Build Pack

A complete reference set for SchoolOS — a Nigeria-first, global-ready digital school operating platform. Product vision, engineering architecture, data model, UI/UX specs, subscription/billing model, pricing strategy, and delivery plan. Compiled for implementation handoff (Claude Code).

**Status: all decisions required before Milestone 0 are resolved.** Doc 17 is the current decisions log — check it first for what's confirmed vs. genuinely still open (a short list, all non-blocking). Docs 23–26 are authoritative wherever they touch earlier sections; see each doc's own notes for specifics.

## Table of Contents

1. Product Vision, Positioning & Problem Statement
2. Competitive Landscape & Differentiation
3. Engineering Architecture & Stack Decision
4. MVP Scope — V1 vs V2 Boundaries (see Doc 26 §7 for attachment addition)
5. User Roles & Personas
6. Permission Matrix — Admin, Teacher, Family
7. Student Identity & Enrollment Model
8. Notification & Communication Model
9. Fee & Payment Model (see update: V2 gateway confirmed as Stripe + Paystack, school's choice)
10. Database Schema / Entity Relationship Doc (see Doc 23 §7 and Doc 26 §3 for superseded/added elements)
11. Multi-Tenancy & Data Isolation Principles
12. Onboarding Flow (see Doc 23 §2 for identity-matching amendment; Doc 24 §2 for subscription wrapper; activation expiry confirmed at 7 days)
13. Core User Journeys (see Doc 26 §4 for attachment steps)
14. Screen-Level Wireframes & Design System Strategy
15. MVP Feature List (Checklist Form) (see Doc 26 §7 for attachment items)
16. Milestone / Phase Breakdown (see Doc 23 §9 and Doc 24 §6 for updated scope)
17. Open Questions & Decisions Log (START HERE for current status)
18. UI Specification (see Doc 26 §4 for attachment UI)
19. UX Specification (see Doc 23 §3 for offline-scope correction; Doc 26 §5 for upload states)
20. Technical Architecture — Deep (see Doc 23 §4 for background job correction; Doc 26 §6 for storage pattern)
21. Frontend Architecture (see Doc 23 §3 for offline-queue correction; Doc 26 §6 for compression)
22. Engineering Standards
23. Architecture Freeze Review (AUTHORITATIVE — resolves cross-document gaps)
24. Platform Subscription, Billing & Self-Serve Onboarding Model (AUTHORITATIVE — tier enforcement, upgrade mechanics, retry cadence, and gateway choice all confirmed)
25. Pricing & Free Plan Matrix (AUTHORITATIVE — confirmed pricing; confirmed free-plan model)
26. Assignment Attachment Specification (AUTHORITATIVE — image/PDF attachment, size limits, upload/preview UI)

---

# Doc 1: Product Vision, Positioning & Problem Statement

## Product Name
Working title — TBD

## One-Line Description
A digital school operating platform for Nigerian nursery and primary schools, connecting administrators, teachers, families, and students through one persistent, role-based system.

## Vision
The platform is not another school management ERP. It is a digital operating layer underneath a school's daily academic life — reducing repetitive administrative work for teachers, giving parents continuous visibility into their children's academic activity, and preserving a student's academic identity as a persistent record that outlives any single school enrollment.

## Target Market
- Private Nigerian nursery and primary schools
- Initial target size: ~100–800 students per school
- Architecture designed to scale to thousands of schools (multi-tenant from day one)

## Core Problem
Teachers in nursery/primary schools repeatedly write or communicate the same assignment to many pupils by hand — a time-consuming, low-leverage task. Parents often lack visibility into:
- What assignment was given and when it's due
- Whether their child missed something
- Ongoing academic performance and attendance
- What's happening at school day-to-day

## Core Wedge (Primary Differentiator)
Assignment distribution and teacher workflow. A teacher creates an assignment once — selecting class, subject, instructions, and a scheduled availability window — and the system automatically distributes it to every enrolled student in that class. No manual per-student selection, no repetitive writing.

Crucially, the product does not force young children to type answers into the app — the physical workbook remains part of the workflow. The platform's role is distribution, visibility, and tracking, not replacing paper-based learning for young pupils.

## Positioning
**Avoid:** "School management software" — a crowded Nigerian category (SchoolBase, MySCL, DasticOS, SaidByte, eSchool.ng, SkoolDrive, Schos, Klas, SchoolKit, Pennup, LogosClass) offering similar surface-level feature sets.

**Adopt:** "Digital School Platform" / "School Operating Platform" — positioning built on:
- A clear workflow advantage (the assignment wedge), not a generic feature checklist
- A stronger underlying data architecture: persistent student identity, decoupled from any single school enrollment
- Nigerian-market-specific design: low-data, mobile-first, intermittent-connectivity tolerant, Android-first

## What Makes This Defensible
1. **Persistent Platform Student ID** — academic identity independent of enrollment at any one school, enabling controlled, auditable transfer of academic records between schools.
2. **Visibility ≠ Ownership** — teachers see/enter data but don't own it; schools control their own academic records; the platform provides infrastructure, not control.
3. **Workflow-first wedge** — proving value through one sharp use case before expanding breadth.

## Business Model (Direction, Not Final)
Schools pay a subscription (likely tiered by student count/feature set). Parents/families use the core platform without a separate subscription. Future revenue: fee/payment processing, premium modules, communication services.

## Deliberately Not Building in V1
AI tutor/teacher, in-house video conferencing, social network, open marketplace, complex accounting system, advanced CBT exam system, large analytics suite, parent community/social features.

## Engineering Priority (Confirmed)
Quality over speed. The product must feel premium from first interaction — exceptional UI/UX, reliable under concurrent load, secure by design for sensitive children's data. See Doc 3 for full engineering rationale.
-e 

---


# Doc 2: Competitive Landscape & Differentiation

## Context
Named Nigerian competitors identified during research: SchoolBase, MySCL, DasticOS, SaidByte, eSchool.ng, SkoolDrive, Schos, Klas, SchoolKit, Pennup, LogosClass.

These platforms, in aggregate, already offer: admin dashboards, teacher portals, parent/student portals, assignments, attendance, results, timetables, fees, communication.

> Note: competitor details reflect early-stage research captured during product discussions, not independently verified pricing/feature audits. Recommend a verification pass before using this doc externally (investors, partners).

## Core Competitive Insight
"Teacher + Parent + Admin dashboards" is table stakes, not a differentiator, in this market. Feature breadth alone will not win adoption.

## Where This Product Differentiates

**1. Workflow-first wedge, not feature-breadth-first**
Leads with depth on one pain point — eliminating repetitive assignment-writing — rather than breadth across many modules at once.

**2. Persistent student identity independent of school enrollment**
Platform Student ID persists across a child's education; school enrollment is a time-bound relationship to that identity. Enables controlled, auditable academic record transfer — largely unaddressed in the current competitive set, and compounds in value as more schools join (network effect).

**3. Explicit data-governance model ("Visibility ≠ Ownership")**
Teachers view/enter data without owning it; schools control their own records; platform provides infrastructure, not control. A trust-building architecture decision, not just a technical one.

**4. Nigerian-market-specific UX discipline**
Android-heavy, low-end devices, expensive data, intermittent connectivity — treated as first-class design constraints. WhatsApp scoped narrowly (activation only), keeping the platform itself the authoritative source of record.

**5. Deliberately narrow V1 scope**
Avoids AI tutoring, in-house video, social features, advanced analytics in V1 — differentiation by restraint: faster to build, clearer to sell, lower risk of becoming "another bloated ERP."

## Competitive Risk Areas to Watch
- **Incumbent fee/payment features**: several competitors already offer integrated online fee payment; this product's V1 is manual fee tracking, gateway deferred to V2 — a real gap for schools already using a competitor specifically for this.
- **Switching costs**: schools with existing historical data (attendance, results, fees) locked in a competitor's system face migration friction. CSV import is a partial answer, not a full solution.
- **Brand trust and local market presence**: named competitors likely have existing reputation/sales relationships. Architecture differentiation alone won't overcome a cold start — go-to-market and design partner schools matter as much as the product.

## Differentiation Summary (Pitch-Ready)
"Where existing platforms are administrative software with a parent view bolted on, this is a workflow-first platform built around one proven pain point — teacher assignment distribution — backed by a student-identity architecture that treats a child's academic record as portable and permanent, not locked to a single school's database."
-e 

---


# Doc 3: Engineering Architecture & Stack Decision

## Guiding Priority
Quality over speed. Premium, reliable, highly responsive product — engineering and UI quality associated with top-tier engineering teams. Sequencing within that priority: **schema + RLS + auth correctness first, core journeys functional second, design-system polish third.** Security and data integrity are not negotiable for speed; polish is layered on top of a correct foundation, not a substitute for one.

Implementation will be carried out by Claude Code against these specs — docs in this set must be precise enough to serve as direct implementation references, not just discussion notes.

## 1. Final Stack

**Frontend:** Next.js (App Router) + TypeScript (strict mode) + Tailwind CSS + shadcn/ui as a styled starting skeleton, restyled against a custom design-token system (see Doc 14/15 for design system detail). PWA delivery (installable, offline-shell capable) rather than native/React Native, prioritizing one codebase and low install friction for the Nigerian market, with engineering discipline applied to perceived performance to close the native-feel gap.

**Backend:** Hybrid architecture —
- **Supabase/Postgres** as system of record, with Row-Level Security (RLS) enforcing tenant isolation at the database layer (not just application-layer checks).
- **Supabase Auth** with custom JWT claims (role, school_id, teacher_id) that RLS policies key off.
- **Dedicated application/business-logic layer** (Next.js Server Actions/API routes, with option to extract to NestJS later if complexity demands) for process logic that doesn't belong as database triggers: assignment fan-out, transfer approval workflow, fee recomputation, notification orchestration.

**Background jobs/queue:** Real queue (pg_boss/pg_cron initially, or Redis-backed BullMQ if volume demands) for assignment availability triggers, notification fan-out, bulk CSV import processing, WhatsApp activation dispatch. Not handled synchronously in request handlers.

**Hosting:** Vercel (frontend) + Supabase (managed Postgres) for launch through low-thousands-of-schools scale.

**Storage:** Supabase Storage (S3-backed) for profile photos, report card exports, uploaded documents.

**Notifications:** WhatsApp Cloud API (direct from Meta) for one-time activation link only. All other notifications via in-app notification table, delivered through Supabase Realtime with a polling fallback for low-connectivity clients.

## 2. Why This Stack (Trade-off Summary)

| Decision | Chosen Because | Rejected Alternative Because |
|---|---|---|
| Next.js PWA over React Native | One codebase, SSR/PWA fit for low-data markets, faster to build without splitting team skillset | Native has a higher UI polish ceiling but costs build speed and codebase unity |
| Supabase + RLS over pure custom backend | DB-enforced tenant isolation is a stronger security guarantee than app-layer-only checks; faster to build correctly | Pure custom backend (NestJS from day one) is slower and more likely to have early security gaps reimplementing what Postgres RLS already solves |
| Hybrid (Supabase + app-layer business logic) over pure Supabase (all logic in DB functions/triggers) | Business logic (fan-out, transfer workflow) needs testability and transactional control that's unmaintainable as PL/pgSQL | Pure Supabase becomes hard to debug/test once logic exceeds simple CRUD |
| Real background queue over synchronous request handling | Fan-out to hundreds of students/families will time out or fail silently otherwise | Synchronous "works for now" risks silent failures under real class sizes |

## 3. Application Architecture

```
Next.js App (PWA)
 - Server Components for data-heavy views
 - Client Components for interactive UI
 - Service Worker: offline shell + cache
        |
        v (Server Actions / API routes)
Application/Business Logic Layer
 - Assignment distribution logic
 - Transfer approval workflow
 - Fee recomputation
 - Notification fan-out orchestration
        |
   -----------------------------
   |                           |
Supabase                   Job Queue
 - Postgres + RLS            - Bulk notifications
 - Auth                      - CSV import jobs
 - Storage                   - Scheduled triggers
 - Realtime
        |
WhatsApp Cloud API (activation only)
```

**Tenant isolation, concretely:** every school-scoped table carries `school_id`; RLS policies check `auth.jwt() → school_id` against each row. Enforced in the database — an application bug cannot cross tenant boundaries.

## 4. Main Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Cross-tenant data leak | RLS at DB layer; automated tenant-isolation test suite asserting School A's token never reads School B's rows |
| Duplicate payment/activation requests | Idempotency keys on mutating endpoints; unique constraints at DB level as last-resort guard |
| Assignment fan-out timing out for large classes | Background job, not synchronous request; batch inserts |
| Low-end device / slow network degrading UX | Code-splitting, skeleton states, optimistic UI for common actions, offline write queueing |
| Supabase vendor lock-in | Keep business logic app-layer where possible, not deep in PL/pgSQL — keeps future migration realistic, not a rewrite |
| Concurrent writes corrupting sensitive records | Optimistic locking (version column) on mutable records (e.g., FeeRecord); transactions on multi-step writes |
| Children's data security | Encryption at rest (Supabase default); least-privilege RLS per role; audit logging; defined data retention/deletion policy before launch |

## 5. Initial Architecture vs. At-Scale Changes

**Now (launch → low thousands of schools):** the stack above is sufficient. No distributed system, no pre-sharding, no microservices.

**Trigger-based changes at scale:**
- Read replicas when dashboard/reporting query latency measurably degrades
- Dedicated backend service (NestJS) extraction if business logic complexity/testability demands it, or team growth requires it
- CDN/edge caching for read-heavy, low-change-frequency content (announcements, published results)
- Multi-region only if expanding beyond Nigeria

All additive layers on the existing architecture — not replacements.

## 6. Performance, Security & Testing Strategy

**Performance targets (to validate under load testing, not assumed met):**
- LCP < 2.5s on simulated mid-tier Android, 3G throttling
- Time to Interactive for core flows (create assignment, mark attendance) < 3s under same conditions
- DB query p95 (dashboard load) < 200ms
- API mutation p95 (create assignment, record attendance) < 500ms including DB write

**Security:**
- RLS policies covered by automated tenant-isolation tests
- Rate limiting on auth endpoints and bulk operations (CSV import, activation dispatch)
- Structured logging + error tracking (e.g., Sentry) from day one
- Staging environment with reviewed, reversible migrations

**Testing:**
- Unit tests for business logic (fee recomputation, transfer approval state machine)
- Integration tests specifically for RLS policies — highest-risk area for silent failure
- E2E tests (Playwright) for core journeys (teacher assignment creation, parent dashboard, admin onboarding)
- Automated accessibility checks (axe-core in CI) as baseline

## 7. Cost Considerations by Phase

**Phase 1 — Development (pre-launch):** ~$0/mo infra (Supabase free tier, Vercel hobby tier for dev only, WhatsApp free tier). Real cost is engineering time and Claude usage, not infrastructure.

**Phase 2 — Launch, ~5-20 pilot schools (~10-15k accounts):**
| Item | Est. Cost |
|---|---|
| Supabase Pro | $25/mo base |
| Storage/bandwidth overage | $5-30/mo |
| Vercel Pro (required for commercial use) | $20/mo/seat |
| WhatsApp Cloud API (activation-only) | $10-50/mo |
| Error tracking | $0-26/mo |
| Background job infra | $0-10/mo |
| **Total** | **~$60-150/mo** |

**Phase 3 — Growth, hundreds of schools:** Cost scales roughly linearly with usage (not a step-function re-platforming cost) given the chosen architecture, but exact figures require real load-testing data and usage patterns once available — not estimated here. Watch: Supabase tier upgrades, Vercel function execution time, WhatsApp conversation volume, storage growth from photos/exports, logging volume.

**Key point:** at near-term pilot scale, infrastructure cost is not the constraint — engineering time to get the foundation (RLS, schema, core journeys) right is. Infra cost should not drive architecture decisions at this stage.
-e 

---


# Doc 4: MVP Scope — V1 vs V2 Boundaries

## V1 — Build Now

**School Admin**
- School registration/profile
- Academic session/terms setup
- Classes & subjects
- Teacher, student, family creation — manual + CSV bulk import
- Activation link generation + WhatsApp dispatch (activation only)
- Two-admin support per school
- Basic timetable (admin-configured, teacher view-only)
- Attendance oversight (read-only roll-up)
- Fee status entry per term (manual, post offline-payment confirmation)
- Fee reminder dispatch (via in-app notification, not WhatsApp)
- Announcements (school-wide)
- Transfer request approval workflow
- Audit log

**Teacher**
- Dashboard (today's classes, quick actions, my work list)
- Assignment creation/scheduling (class + subject scoped, with availability/due windows)
- Assignment retraction (not hard delete)
- Attendance entry (same-day edit window)
- Score/assessment entry
- Class-scoped announcements
- Daily notes to parents (one-way, free-form)
- Timetable (view-only)

**Family**
- Single school-scoped login (multiple children per login if same school)
- Family dashboard (per-child summary cards)
- Notification Box with bell icon + unread badge
- Student profile per child: assignments, attendance, results, fee status (view-only), daily notes
- Assignment acknowledgment

**Student Identity**
- Persistent Platform Student ID
- Enrollment history
- Transfer capability (request/approval/audit trail)

## V2 — Explicitly Deferred

- Platform payment gateway integration (automated fee payment, replacing manual admin entry)
- Virtual class / video lecture infrastructure
- Advanced analytics suite
- AI tutor/teacher features
- Parent community/social features
- Complex accounting system
- Advanced CBT (computer-based testing) system
- Configurable transfer policy engine (V1 uses admin judgment per transfer; V2 may formalize field-level transfer rules)
- Multi-admin role differentiation (V1: two equal-privilege admins; V2 may introduce hierarchy, e.g., bursar-restricted role)

## Rationale
V1 scope proves the core wedge (assignment workflow) and the supporting trust architecture (student identity, data isolation, fee visibility) without overbuilding. Every V1 feature maps directly to a decision already made in this project's discovery phase — nothing here is speculative.
-e 

---


# Doc 5: User Roles & Personas

## Role Hierarchy
```
PLATFORM
  └── SCHOOL (tenant)
        ├── ADMIN (×2 per school, equal privilege in V1)
        ├── TEACHER (scoped to assigned classes/subjects)
        └── FAMILY (scoped to own children at this school)
              └── STUDENT (persistent identity, no direct login in V1)
```

## School Administrator
**Who:** School owner, principal, or designated school office staff.
**Goals:** Set up and run the school's digital presence with minimal friction; onboard staff/students quickly; maintain oversight without micromanaging teachers; track fee collection status.
**Key tasks:** Register school, configure academic structure, create/manage teacher & family accounts (manually or via bulk CSV), approve transfers, monitor fee status, send school-wide announcements.
**Constraints:** Not necessarily technical — onboarding flow must be simple; may be managing this alongside other administrative duties.

## Teacher
**Who:** Classroom teacher, typically assigned to one or more classes and subjects.
**Goals:** Spend less time on repetitive assignment-writing; manage attendance/scores quickly; keep parents informed without extra admin overhead.
**Key tasks:** Create/schedule assignments, take attendance, enter scores, send daily notes, view class-scoped performance.
**Constraints:** May be using an older Android device; needs fast, low-friction daily workflow — "My Work" list and quick actions matter more to this persona than deep configuration.

## Parent/Family
**Who:** Parent or guardian, often managing more than one child, possibly at the same school.
**Goals:** Stay informed about assignments, attendance, performance, and fees without needing to visit the school or chase teachers; help young children complete physical homework using the digital assignment as the source of truth.
**Key tasks:** View per-child dashboards, check notifications (bell icon), view fee status, acknowledge assignments, read daily notes.
**Constraints:** Heavy WhatsApp user generally, but the product deliberately keeps non-activation notifications in-app to remain the authoritative record; may have limited data/older phone — low-data, fast-loading UI is essential.

## Student (Persistent Identity, Not a Direct User in V1)
**Who:** The nursery/primary pupil — the subject of academic records, not an active platform user.
**Why no login:** Young children generally can't/shouldn't independently manage credentials; physical workbook remains core to their actual learning workflow.
**What exists for them:** Platform Student ID, enrollment history, academic records, attendance, assignments (visible via family account), transfer history.

## Platform Administrator (Anthropic-internal note: this is Alana's own role, not a school-facing persona)
**Who:** You/your team, operating the platform itself.
**Goals:** Onboard new schools, monitor platform health, manage subscriptions, support schools with technical issues.
**Note:** A dedicated platform-admin interface/role is not yet scoped in detail — worth flagging as an open item (see Doc 17) if it's needed distinctly from school-level admin tooling.
-e 

---


# Doc 6: Permission Matrix — Admin, Teacher, Family

## School Administrator

| Action | Admin Can | Notes |
|---|---|---|
| Create/edit school profile | ✅ | — |
| Configure academic sessions/terms | ✅ | — |
| Create/edit classes & subjects | ✅ | — |
| Create/edit/remove teacher accounts | ✅ | Both admins equal privilege in V1 |
| Create/edit/remove student & family accounts | ✅ | Manual or CSV bulk import |
| Assign teachers to classes/subjects | ✅ | — |
| Generate & dispatch activation links | ✅ | WhatsApp dispatch, activation only |
| Configure timetable | ✅ | Teachers view-only |
| View all attendance (school-wide) | ✅ | Read-only roll-up from teacher-entered data |
| Override attendance after same-day lock | ✅ | Required for corrections past teacher's edit window |
| View all scores/results (school-wide) | ✅ | — |
| Configure grading rules | ✅ | — |
| Enter/update fee status per student/term | ✅ | Manual in V1 |
| Send fee reminders | ✅ | Via in-app notification, not WhatsApp |
| Send school-wide announcements | ✅ | — |
| View/approve/deny transfer requests | ✅ | Both incoming and outgoing |
| View audit log | ✅ | — |
| View internal admin notes | ✅ | — |
| Add/remove second admin | ✅ | Max 2 per school (V1) |

## Teacher

| Action | Teacher Can | Scope/Restriction |
|---|---|---|
| View assigned classes | ✅ | Only classes/subjects they're assigned to |
| View students in assigned classes | ✅ | Only within assigned classes |
| View full student academic history | ❌ | Only current-term data for their subject/class |
| Create/schedule assignments | ✅ | Only for assigned class + subject |
| Edit own assignment | ✅ | — |
| Delete own assignment | ❌ (hard delete) | Retract instead — audit-logged, status set to Retracted |
| Edit another teacher's assignment | ❌ | — |
| Take attendance | ✅ | Only assigned classes |
| Edit past attendance | ✅ (same day only) | Locked after midnight; requires admin override after |
| Enter scores/assessments | ✅ | Only their subject within assigned class |
| Edit grading configuration | ❌ | Admin-controlled |
| View class-wide performance (their subject) | ✅ | — |
| View school-wide performance | ❌ | — |
| Publish class-scoped announcement | ✅ | Scoped to their class only |
| Publish school-wide announcement | ❌ | Admin-controlled |
| Send free-form "daily note" to parent | ✅ | One-way, no edit/delete once sent; scoped to assigned class |
| View/edit timetable | View only | Admin controls config |
| View fee status | ❌ | Admin/family only |
| Create/edit teacher, student, or family accounts | ❌ | Admin-only |
| Access students outside assigned classes | ❌ | — |
| View internal admin notes | ❌ | — |

## Family

| Action | Family Can | Scope/Restriction |
|---|---|---|
| Log in | ✅ | Single login, school-scoped; separate login per school if children attend different schools |
| View own children's profiles | ✅ | Only linked children (FamilyStudentRelationship) |
| View assignments | ✅ | Only within availability window (available_at ≤ now) |
| Acknowledge assignment | ✅ | — |
| Edit/submit assignment content | ❌ | Physical workbook remains the completion medium in V1 |
| View attendance | ✅ | Own children only |
| View scores/results | ✅ | Own children only, current + historical for their enrollment |
| View fee status | ✅ (view-only) | Own children only; cannot edit |
| Make fee payment in-app | ❌ (V1) | Deferred to V2 gateway integration |
| View notifications (bell icon) | ✅ | Own children + school-wide announcements |
| Read daily notes from teachers | ✅ | Own children only |
| Reply to daily notes | ❌ | One-way in V1 |
| View other students' data | ❌ | — |
| Self-register into a school | ❌ | School-controlled membership only |

## Cross-Role Principle (Carried from Discovery Phase)
**Visibility ≠ Ownership.** A role seeing or entering data does not grant it control over that data's governance. Schools own their academic records; the platform provides infrastructure; teachers and families operate within scoped visibility, not ownership.
-e 

---


# Doc 7: Student Identity & Enrollment Model

## Core Principle
A student's platform identity and their school enrollment are separate concepts. One persistent student identity can have multiple school enrollments over time. The platform does not "move" a student's profile between schools — it preserves enrollment history alongside a permanent identity.

## Platform Student ID
Every student receives a permanent Platform Student ID (e.g., `STU-7F82K4M9`) on first creation (by a school admin). This ID:
- Does not change when the student changes schools
- Is distinct from any school's own internal student ID (e.g., `OAK/PRI3/024`)
- Anchors the student's persistent academic profile: identity, DOB, photo, family relationship, academic history, classes attended, subjects, assignments, attendance, scores, teacher comments, report cards, enrollment history, transfer history

## No Direct Student Login (V1)
Nursery/primary students generally don't need or benefit from independent platform access. The student record exists and is fully tracked independently of any login — accessed via the linked Family account.

## Enrollment vs. Class Membership
- **Enrollment** = student belongs to a school (time-bound: start_date, end_date, status).
- **Class Membership** = student is currently in a specific class within that enrollment (e.g., Primary 3A), tied to a specific academic session.

These are intentionally separate: a student's enrollment can span years and multiple class memberships as they progress through grades.

## Example
```
David — Platform Student ID: STU-7F82K4M9

Enrollment: Oakridge Academy
  2026–2028, Primary 1–3, Status: Transferred

Enrollment: Greenfield Academy
  2028–2030, Primary 4–5, Status: Active
```

## Transfers
Transfers are explicit and controlled — never automatic, never a full database copy.

**Flow:**
1. New school submits a Transfer Request for a given Platform Student ID.
2. Old school reviews and determines which authorized records to release.
3. System generates a controlled Transfer Package (a manifest of included record types/IDs).
4. Audit trail logs: requesting school, sending school, approving admin, records transferred, date/time, status.

**Record categories for transfer decisions:**

| Category | Examples | Transfers? |
|---|---|---|
| Platform Identity Data | Platform Student ID, basic identity, DOB, photo, family relationship | Always persists with student |
| Transferable Academic Record | Completed classes, subjects, term results, exam results, attendance summaries, appropriate teacher comments, report cards, certificates, enrollment history | Potentially transferable — old school decides per request |
| School-Internal Records | Internal teacher notes, internal admin notes, staff evaluations, accounting/financial records, internal communications | Generally remain with old school, not transferred |

V1 relies on admin judgment per transfer request rather than a fully configurable field-level transfer policy engine — that formalization is a V2 consideration (see Doc 4, Doc 17).

## Family Relationship to Student Identity
A Family account (school-scoped) links to one or more Platform Student records via a FamilyStudentRelationship. The family account is an access layer, not the student's academic identity — the school establishes the parent/guardian relationship; parents do not self-claim a child by entering a name.
-e 

---


# Doc 8: Notification & Communication Model

## Core Principle
WhatsApp is used for exactly one purpose: the one-time account activation link. Every other notification — assignments, attendance, announcements, fee reminders, daily notes — flows through an in-platform Notification Box, so the platform remains the single authoritative source of record rather than splitting truth across channels.

## Channels

| Channel | Used For | Not Used For |
|---|---|---|
| WhatsApp Cloud API | One-time activation link only | Assignments, fee reminders, daily notes, announcements |
| In-app Notification Box | All other notifications | — |

## In-App Notification Box (Family-Facing)

**Entry point:** Bell icon in top nav, visible from every screen in the family app. Shows unread count badge.

**Behavior:** Opening the Notification Box list marks its items read (mark-as-read-on-open, chosen for V1 simplicity over per-item read tracking).

**Notification types surfaced here:**
- Fee reminder (admin-triggered, Owing/Partial status)
- Assignment published (system-triggered, auto-fires when a teacher schedules an assignment)
- Announcement (school-wide, admin-triggered; class-scoped, teacher-triggered)
- Daily note (teacher-triggered, free-form, one-way)

**Display:** Each notification tagged by type/icon (e.g., fee, assignment, announcement, daily note) with timestamp and source.

## Daily Notes (Teacher → Parent)
A distinct notification subtype, not a messaging thread:
- Free-form text from a teacher about a specific student (health, behavior, academic, or general observation)
- One-way — no reply thread in V1 (deliberately, to avoid the product drifting into open messaging/moderation territory, which is out of scope per Doc 4)
- Immutable once sent — corrections are new notes, not edits, to preserve audit trail integrity

## Notification Delivery Architecture
- Notifications are generated by the application/business-logic layer (see Doc 3) in response to triggering events (assignment scheduled, fee status updated, admin sends reminder/announcement, teacher sends daily note).
- Delivered to the Notification Box via Supabase Realtime where connectivity allows, with a polling fallback for low-connectivity clients — delivery must degrade gracefully, not assume a persistent live connection.
- Bulk notification fan-out (e.g., notifying all families in a class when an assignment publishes) is handled via the background job queue, not synchronously in the request path (see Doc 3, Risk table).

## Admin Visibility
Admins have a Notification Log — a record of what was sent, to whom, and whether read — useful for support/dispute resolution (e.g., a parent disputes receiving a fee reminder).

## Explicitly Out of Scope for V1
- Two-way messaging/chat between any roles
- Push notifications requiring native app infrastructure (PWA + Realtime/polling is the V1 approach)
- WhatsApp as a channel for anything beyond activation
-e 

---


# Doc 9: Fee & Payment Model

## V1: Manual, Admin-Entered Fee Tracking

**Tracking granularity:** Per term (not per session) — matches Nigerian school billing cycles and gives families a clear, current picture without overloading admin data entry.

**Workflow:**
1. Parent pays school fees through the school's existing offline/traditional method (bank transfer, cash, etc.) — outside the platform in V1.
2. School admin confirms payment received and enters/updates the fee record for that student/term.
3. Status badge updates automatically based on entered amounts (see below).

**Fee status badge (shown on student dashboard/profile):**
- 🟢 **Paid** — amount_paid ≥ amount_expected
- 🟡 **Partial** — 0 < amount_paid < amount_expected
- 🔴 **Owing** — amount_paid = 0

**Status storage approach:** `status` is a stored column, recomputed on every write to `amount_paid`/`amount_expected` (not computed live on read). This keeps dashboard queries cheap while avoiding drift between stored status and underlying amounts, since recomputation happens at the single point of mutation.

## Admin Fee Management Screen (V1)
- Table view: student, class, expected amount, paid amount, status — filterable by class/status
- "Record Payment" action per student: opens a form (term, amount received, method, date, notes) → writes to FeeRecord, triggers status recompute
- "Send Reminder" action: generates an in-app Notification Box entry for families with Owing/Partial status for that term (not WhatsApp — see Doc 8)
- CSV export of fee status table

## Family-Facing Fee View (V1)
- View-only, per child, per term: expected, paid, status badge
- No payment action available in-app in V1 — purely informational, reducing parent uncertainty without requiring a payment gateway integration before launch

## V2: Platform Payment Gateway Integration (Gateway Choice Confirmed)
- **Stripe and Paystack**, same pair confirmed for platform subscription billing (Doc 24 §4) — parent chooses whichever is convenient at payment time, rather than the platform assigning one by region. This mirrors the subscription-billing gateway architecture exactly: SchoolOS's own logic (fee amount, recompute, idempotency) stays authoritative; the gateway is just the payment-execution mechanism underneath.
- `FeeRecord.payment_method` field already reserves space for a gateway reference in V1's schema, so this is additive, not a schema rewrite.
- Gateway webhook writes/updates `FeeRecord.amount_paid` directly, triggering the same status recompute logic already built for manual entry — the computation logic doesn't change, only the write source does.
- Idempotency handling for payment webhooks is a hard requirement (see Doc 3, Risk table) — duplicate payment confirmations must not double-count.
- Flutterwave remains a plausible future addition, not committed for V2 launch.

## Explicitly Out of Scope for V1
- Automated payment reconciliation
- Partial payment plans/installment scheduling as a first-class feature (can be approximated manually via repeated "Record Payment" entries in V1)
- Refunds/credits workflow
-e 

---


# Doc 10: Database Schema / Entity Relationship Doc

All tables assume PostgreSQL via Supabase. Every school-scoped table carries a `school_id` foreign key used by Row-Level Security policies (see Doc 11). Primary keys use UUIDs unless otherwise noted.

## 1. Platform-Level

```
School
- school_id (PK)
- name, type, address, contact_info
- subscription_status, tier
- created_at

SchoolAdmin
- admin_id (PK)
- school_id (FK -> School)
- name, contact_info
- auth_credentials (managed via Supabase Auth)
- created_at, last_active
-- max 2 per school enforced at application level in V1

AuditLog
- log_id (PK)
- school_id (FK)
- actor_id, actor_role (admin/teacher/system)
- action_type, target_entity, target_id
- timestamp, details (JSONB)
```

## 2. Student Identity (Platform-Level, Persists Across Schools)

```
PlatformStudent
- platform_student_id (PK) -- e.g. STU-7F82K4M9
- name, dob, profile_photo
- created_at
-- NOT school-scoped; this is the persistent identity table

SchoolEnrollment
- enrollment_id (PK)
- platform_student_id (FK)
- school_id (FK)
- school_student_id (school's own internal ID, e.g. OAK/PRI3/024)
- start_date, end_date
- status (Active / Transferred / Completed)

ClassMembership
- membership_id (PK)
- enrollment_id (FK) -- ties to a specific school enrollment
- class_id (FK)
- academic_session_id (FK)
- start_date, end_date
```

## 3. School Structure

```
AcademicSession
- session_id (PK)
- school_id (FK)
- name (e.g. "2026/2027"), start_date, end_date

Term
- term_id (PK)
- session_id (FK)
- name (Term 1/2/3), start_date, end_date

Class
- class_id (PK)
- school_id (FK)
- name (e.g. "Primary 3A")

Subject
- subject_id (PK)
- school_id (FK)
- name
```

## 4. People — Teachers & Families

```
Teacher
- teacher_id (PK)
- school_id (FK)
- name, staff_id, profile_photo, contact_info
- employment_status, date_joined
- activation_status (Pending/Active)
-- auth via Supabase Auth, role claim = 'teacher'

TeacherClassAssignment
- assignment_id (PK)
- teacher_id (FK)
- class_id (FK)
- subject_id (FK)
- session_id (FK)

Family
- family_id (PK)
- school_id (FK) -- family login is school-scoped; a parent with
  children at different schools has a separate Family record/login per school
- name, contact_info
- activation_status
-- auth via Supabase Auth, role claim = 'family'

Guardian
- guardian_id (PK)
- family_id (FK)
- name, relationship, contact_info

FamilyStudentRelationship
- relationship_id (PK)
- family_id (FK)
- platform_student_id (FK)
- relationship_type (parent/guardian)
```

## 5. Academic Activity

```
Assignment
- assignment_id (PK)
- class_id (FK), subject_id (FK), teacher_id (FK), school_id (FK)
- title, instructions
- available_at, due_at
- status (Published / Retracted)
- created_at

StudentAssignmentStatus
- id (PK)
- assignment_id (FK)
- enrollment_id (FK)
- status (Viewed/Acknowledged/Completed/Checked)
- updated_at

Attendance
- attendance_id (PK)
- class_id (FK), subject_id (FK, nullable), teacher_id (FK), school_id (FK)
- enrollment_id (FK)
- date, status (Present/Absent/Late)
- editable_until (= date + 1 day; enforced at application level)

Assessment
- assessment_id (PK)
- class_id (FK), subject_id (FK), term_id (FK), school_id (FK)
- name (e.g. "Test 1", "Exam")

Score
- score_id (PK)
- assessment_id (FK)
- enrollment_id (FK)
- value, entered_by (teacher_id), entered_at
```

## 6. Fees

```
FeeRecord
- fee_record_id (PK)
- enrollment_id (FK)
- term_id (FK)
- amount_expected
- amount_paid
- status (Paid/Partial/Owing) -- stored, recomputed on write (see Doc 9)
- last_updated_by (admin_id), last_updated_at
- payment_method (manual in V1; gateway reference field reserved for V2)
- version (for optimistic locking on concurrent admin edits)
```

## 7. Notifications & Daily Notes

```
Notification
- notification_id (PK)
- family_id (FK)
- source_type (system/admin/teacher)
- category (assignment/attendance/fee/announcement/daily_note)
- related_entity_id (nullable FK, e.g. assignment_id or fee_record_id)
- message_text
- read_status, created_at

DailyNote
- note_id (PK)
- enrollment_id (FK)
- teacher_id (FK)
- category (health/behavior/academic/general)
- note_text
- date, created_at
-- immutable: no update/delete at application level
```

## 8. Transfers

```
TransferRequest
- request_id (PK)
- platform_student_id (FK)
- from_school_id, to_school_id (FK)
- requested_by, approved_by
- status (Pending/Approved/Denied)
- created_at, resolved_at

TransferPackage
- package_id (PK)
- request_id (FK)
- included_records (JSONB manifest -- which record types/IDs were released)
- created_at
```

## Open Schema Decisions (see Doc 17)
- Platform-admin-facing tables (subscription billing detail, cross-school analytics) not yet modeled — deferred until platform-admin role is scoped.
- Indexing strategy (beyond obvious FK indexes) to be finalized against real query patterns during implementation, not guessed upfront.
-e 

---


# Doc 11: Multi-Tenancy & Data Isolation Principles

## Core Principle
One platform hosts many schools (tenants). School A must never be able to access School B's students, teachers, assignments, or financial records — enforced at the database layer, not only in application code.

## Enforcement Mechanism: Row-Level Security (RLS)
Every school-scoped table carries a `school_id` column. Postgres RLS policies restrict row access based on the authenticated user's JWT claims (`school_id`, `role`), so that:
- A query from a Teacher or Admin token automatically returns only rows matching their own `school_id` — even if application code has a bug, the database itself refuses cross-tenant rows.
- This is a materially stronger guarantee than application-layer-only `WHERE school_id = ?` checks, which can be bypassed by a coding mistake.

## What Is NOT School-Scoped
`PlatformStudent` is deliberately platform-level, not school-scoped — this is the one entity designed to persist across tenant boundaries, by design, to support the transfer model (Doc 7). Access to a `PlatformStudent` record is mediated through `SchoolEnrollment` (school-scoped) and `FamilyStudentRelationship` (family/school-scoped), not direct unrestricted access.

## Role-Based Access Control (Layered on Top of Tenancy)
Tenancy answers "which school's data can this user see at all." RBAC (per Doc 6's permission matrix) answers "within their own school, what can this specific role see/do." Both layers are enforced via RLS policies keyed on JWT claims — `school_id` for tenancy, `role` (+ `teacher_id`/`family_id` where relevant) for RBAC granularity (e.g., a teacher's RLS policy also restricts to their assigned classes via `TeacherClassAssignment`).

## Required Infrastructure (Per Original Product Doc, Reconfirmed)
- Tenant-aware database design (every school-scoped table, `school_id` FK)
- Role-based access control (RLS policies per role)
- Strong authorization checks (tested, not assumed)
- Audit logging (AuditLog table, Doc 10)
- Secure authentication (Supabase Auth)
- Proper data isolation (RLS, not app-layer-only)
- Backups (Supabase managed backups)
- Controlled data export (CSV export scoped to admin's own school only)

## Testing Requirement
Tenant isolation is the single highest-risk area for a silent, catastrophic failure. It must be covered by an automated test suite that explicitly asserts: a School A token can never read, write, or enumerate School B's rows, across every school-scoped table — not verified manually, and not assumed correct because RLS is "turned on."

## Scaling Note
RLS-based isolation scales without requiring schema changes as school count grows into the thousands — the mechanism is per-row policy evaluation, not per-tenant database/schema provisioning. Revisit only if query performance at scale demands partitioning strategies (see Doc 3, Initial Architecture vs. At-Scale Changes) — not a V1 concern.
-e 

---


# Doc 12: Onboarding Flow

## School → Admin → People Setup → Activation

```
Step 1: School Registration
- School name, type, address, Admin 1 contact info
- [Register] -> subscription/trial starts

Step 2: Academic Setup (required before people can be added)
- Create Academic Session (e.g. "2026/2027")
- Add Terms (Term 1, 2, 3 + dates)
- Create Classes (e.g. Primary 3A)
- Create Subjects
- [Save & Continue]

Step 3: Add Second Admin (optional, can be done later)
- Name, contact info -> generates activation code

Step 4: People Setup -- tabbed (Teachers / Students / Families)
- Each tab: [+ Add Manually] or [Bulk Import CSV]
- Bulk Import: download template -> upload -> preview/validate
  (flag errors/warnings per row) -> confirm
- On confirm: activation codes generated per person
- Student CSV import maps to Classes if a class column is included

Step 5: Distribute Activation
- List of pending activations
- [Send via WhatsApp] (per person or batch) or [Copy Link] for
  manual distribution
- WhatsApp dispatch uses Meta's WhatsApp Cloud API with a
  pre-approved message template (activation only)

Step 6: Dashboard (landing state going forward)
- Snapshot: enrolled count, pending activations, fee status
  summary, recent activity
```

## Teacher Activation (Triggered from Step 4/5)
```
1. Teacher receives activation link (WhatsApp or manual distribution)
2. Opens link -> confirms identity
3. Creates password/PIN
4. Lands on Teacher Dashboard
```

## Family Activation (Triggered from Step 4/5)
```
1. Family receives activation link
2. Opens link -> confirms identity (relationship to student
   already established by admin -- parent does not self-claim a child)
3. Creates password/PIN
4. Lands on Family Dashboard
```

## Validation Rules for Bulk CSV Import
- Required fields per entity type enforced before confirm step (template defines these)
- Duplicate detection (e.g., matching existing staff_id or student identity) flagged as error, not silently skipped
- Missing referenced entities (e.g., a class name in the CSV that doesn't exist yet) flagged as warning with inline resolution option
- Partial success is not allowed silently -- admin sees a full preview and confirms before any records are created

## Activation Code Lifecycle
- Temporary, single-use
- Expires **7 days** after generation (confirmed)
- Revocable/regenerable by admin if lost, compromised, or expired
-e 

---


# Doc 13: Core User Journeys

## 1. Teacher — Assignment Creation
```
Screen 1: Teacher Dashboard
  "Today's Classes" + "Quick Actions" -> tap [New Assignment]

Screen 2: New Assignment Form
  - Select Class (only classes assigned to this teacher)
  - Select Subject (only subjects assigned for that class)
  - Title
  - Instructions
  - Available date/time
  - Due date/time
  - Optional: repeat for multiple days
  - [Schedule Assignment]

Screen 3: Confirmation
  "Assignment scheduled for Primary 3A -- Mathematics --
   visible Oct 12, 8:00 AM"
  Auto-triggers Notification to all families with children
  in that class/enrollment (via background job, see Doc 3/8)

Screen 4: My Assignments (list/manage view)
  - Status per assignment: Published / Retracted
  - Tap to view per-student status
    (Viewed/Acknowledged/Completed/Checked)
  - [Retract] option (not delete) -- confirmation required,
    logs to audit
```

## 2. Teacher — Attendance
```
Screen 1: Attendance -> Primary 3A
  Student list appears

Screen 2: Mark Attendance
  Each student: Present / Absent / Late
  [Submit Attendance]

Screen 3: Confirmation
  Admin can see attendance across the school (read-only roll-up)
  Editable same-day only; locked after midnight (admin override
  required past that window)
```

## 3. Teacher — Scores/Assessments
```
Screen 1: Select Class -> Subject -> Assessment

Screen 2: Student Grid
  Student | Test 1 | Test 2 | Exam
  (grading rules/weighting controlled by admin, not teacher)

Screen 3: Save
  Scores recorded per enrollment, entered_by + entered_at logged
```

## 4. Parent/Family — Dashboard & Notifications
```
Screen 1: Login
  Single family login (school-scoped)

Screen 2: Family Dashboard (if multiple children)
  "Your Children" -- card per child: name, class, quick status
  Bell icon (top nav, unread badge) visible from every screen

Screen 3: Tap Bell -> Notification Box
  List: fee reminders, assignment published, announcements,
  daily notes -- tagged by type/icon
  Opening the list marks items read

Screen 4: Tap a Child -> Student Profile
  Overview: current class, latest assignments, attendance
  summary, fee status badge
  Tabs: Assignments / Attendance / Results / Daily Notes /
  Academic History

Screen 5: Assignments Tab (per child)
  List filtered to "available" window (available_at <= now)
  Tap -> full instructions, [Acknowledge] action

Screen 6: Fee Status Tab
  Per term: expected, paid, status badge (view-only in V1)
```

## 5. Admin — Fee Management
```
Screen 1: Fee Overview
  Filter: Class / Status
  Table: Student | Class | Expected | Paid | Status
  [Export CSV]  [Send Reminder]

Screen 2: Record Payment (per student)
  Term, amount received, method, date, notes
  -> writes to FeeRecord, triggers status recompute

Screen 3: Send Reminder
  Generates in-app Notification Box entries for
  Owing/Partial families for the selected term
```

## 6. Admin — Onboarding
See Doc 12 for full detail; summarized sequence:
School registration -> Academic setup -> Add second admin
(optional) -> People setup (manual/CSV) -> Activation dispatch
-> Dashboard landing state.

## 7. Admin — Transfer Approval
```
Screen 1: Transfer Requests (Pending)
  List: student, requesting school, date requested

Screen 2: Review Request
  Shows requested record categories
  (Platform Identity / Transferable Academic / School-Internal)
  Admin selects which Transferable Academic records to release

Screen 3: Approve/Deny
  On approve: TransferPackage generated, audit trail recorded
  On deny: request closed, reason optional
```
-e 

---


# Doc 14: Screen-Level Wireframes & Design System Strategy

> Note: this doc captures layout-level wireframes (text/structural form) and the design-system principles to apply when building actual high-fidelity screens. Pixel-level visual design (exact colors, type scale values, component states) should be produced as a dedicated Figma/design-tool artifact before implementation begins, using the principles below as the brief.

## Teacher Dashboard (Wireframe)
```
Good afternoon, Mrs. Adeyemi

Today's Classes
- Primary 3A -- Mathematics -- 9:00 AM
- Primary 4B -- English -- 11:00 AM

Today's Work (My Work list)
[X] Attendance -- Primary 3A
[X] Assignment -- Mathematics
[!] Grade 21 submissions
[ ] Attendance -- Primary 4B

Quick Actions
[New Assignment] [Take Attendance] [Enter Scores]

Notifications
- Assignment deadline
- Admin announcement
- Timetable update

Nav: Dashboard | My Classes | Assignments | Attendance |
     Assessments | Timetable | Notifications | My Profile
```

## Admin Dashboard Home (Wireframe)
```
Good morning, Admin [Name] -- Oakridge Academy

Today's Snapshot
- 312 students enrolled | 14 teachers active
- 3 pending activations
- 9 students marked "Owing" this term

Quick Actions
[+ Add Teacher] [+ Add Student] [+ Add Family] [Bulk Import]

Pending Approvals
- Transfer request -- Oakridge -> Greenfield (David A.)
- 2 activation codes expiring in 24h

Recent Activity
- Mrs. Adeyemi published Assignment -- P3A Math
- Admin 2 updated fee status -- Sarah O. -> Paid
```

## Family Dashboard (Wireframe)
```
Good afternoon, Mrs. Adewale                    [bell: 3]

Your Children
David -- Primary 3
  3 assignments | Attendance: Good | Latest result available
Sarah -- Primary 5
  2 assignments | 1 new announcement
Michael -- Nursery 2
  1 activity
```

## Notification Box (Wireframe)
```
Notifications -- Mrs. Adewale

[red]   Fee reminder -- Michael T. (Nursery 2) -- Owing, Term 1
[amber] Assignment published -- David A., P3A -- Mathematics
[green] Announcement -- Oakridge Academy -- Mid-term break Oct 20-24
```

## Design System Strategy (How "Premium" Gets Built, Not Assumed)

**1. Design tokens first.** Define a type scale, spacing scale, and semantic color system (success/warning/danger tied directly to fee status, assignment status, attendance status) before any screen is built in code. shadcn/ui components are restyled against these tokens -- never shipped with Tailwind/shadcn defaults.

**2. One distinctive visual signature.** A consistent accent color, a deliberate (non-system-default) font pairing, consistent corner-radius and shadow language across the entire app. This is what separates "feels custom" from "feels like a template."

**3. Motion with restraint.** Short, purposeful transitions (150-250ms) on meaningful state changes (assignment published, notification marked read) via Framer Motion. No decorative animation that adds perceived latency.

**4. State completeness as a requirement, not a polish pass.** Every list/dashboard view needs designed loading, empty, error, and offline states specified before it ships -- not a generic spinner retrofitted later.

**5. Perceived performance over raw speed.** Optimistic UI updates for common teacher actions (attendance, score entry) so the interface never feels like it's waiting on the network, even on a slow connection.

**6. Mobile-first, then tablet/desktop.** Given the primary user base (parents and teachers on Android phones, often older/lower-end), every layout is designed mobile-first and scaled up -- not designed desktop-first and squeezed down.

## Recommendation
Treat this doc as a brief, not a finished design spec. Before implementation, produce a dedicated visual design-system artifact (Figma or equivalent) covering: full color palette with semantic mappings, type scale with real font choices, spacing/sizing scale, component states (default/hover/active/disabled/loading) for every shadcn/ui component in use, and at least one fully realized high-fidelity screen per role (Teacher Dashboard, Admin Dashboard, Family Dashboard) as the quality bar for everything built after.
-e 

---


# Doc 15: MVP Feature List (Checklist Form)

## Platform / Infrastructure
- [ ] Multi-tenant schema with school_id on all school-scoped tables
- [ ] RLS policies for tenant isolation (automated test suite included)
- [ ] Supabase Auth with role-based JWT claims (admin/teacher/family)
- [ ] Background job queue (notification fan-out, CSV import, activation dispatch)
- [ ] Audit logging across sensitive actions
- [ ] Structured logging + error tracking (Sentry or equivalent)
- [ ] Staging environment + reviewed migration process

## School Admin
- [ ] School registration & profile setup
- [ ] Academic session/term configuration
- [ ] Classes & subjects CRUD
- [ ] Teacher creation (manual + CSV bulk import)
- [ ] Student creation (manual + CSV bulk import)
- [ ] Family creation (manual + CSV bulk import)
- [ ] Activation code generation + WhatsApp dispatch
- [ ] Second admin support (max 2 per school)
- [ ] Timetable configuration
- [ ] Attendance oversight (read-only roll-up)
- [ ] Fee record entry per student/term
- [ ] Fee status badge computation (Paid/Partial/Owing)
- [ ] Fee reminder dispatch (in-app notification)
- [ ] School-wide announcements
- [ ] Transfer request review & approval workflow
- [ ] Audit log viewer

## Teacher
- [ ] Teacher dashboard (today's classes, my work list, quick actions)
- [ ] Assignment creation with scheduled availability/due windows
- [ ] Assignment retraction (audit-logged, not hard delete)
- [ ] Attendance entry (same-day edit window)
- [ ] Score/assessment entry
- [ ] Class-scoped announcements
- [ ] Daily notes to parents (one-way, free-form)
- [ ] Timetable (view-only)

## Family
- [ ] Single school-scoped login (multi-child support)
- [ ] Family dashboard with per-child cards
- [ ] Bell icon + unread notification badge
- [ ] Notification Box (assignments, fee, announcements, daily notes)
- [ ] Student profile per child (assignments, attendance, results, fee status, daily notes)
- [ ] Assignment acknowledgment action

## Student Identity
- [ ] Persistent Platform Student ID generation
- [ ] SchoolEnrollment + ClassMembership tracking
- [ ] Transfer request/approval/audit trail

## Explicitly Excluded from V1
- [ ] Platform payment gateway (V2)
- [ ] Virtual classes/video lectures (V2)
- [ ] Advanced analytics (V2)
- [ ] Two-way messaging (out of scope)
- [ ] AI tutor/teacher features (out of scope)
-e 

---


# Doc 16: Milestone / Phase Breakdown

## Milestone 0 — Foundation (Schema, Auth, Isolation)
**Goal:** Correct, secure foundation before any UI polish.
- Full database schema implemented (Doc 10)
- RLS policies implemented and covered by automated tenant-isolation tests (Doc 11)
- Supabase Auth with role-based JWT claims
- Audit log infrastructure
- Staging environment + migration process
**Exit criteria:** A School A token cannot read/write School B's data, verified by automated tests. All core tables exist and pass schema review.

## Milestone 1 — Admin Onboarding & People Setup
- School registration flow
- Academic session/term/class/subject setup
- Teacher/Student/Family manual creation
- CSV bulk import (all three entity types) with validation/preview
- Activation code generation + WhatsApp dispatch (activation only)
- Second admin support
**Exit criteria:** A school admin can fully onboard a school (session through activated teacher/family accounts) end to end without engineering intervention.

## Milestone 2 — Core Teacher Workflow (The Wedge)
- Teacher dashboard
- Assignment creation/scheduling with availability windows
- Assignment retraction + audit logging
- Attendance entry (same-day edit window)
- Score/assessment entry
- Background job: notification fan-out on assignment publish
**Exit criteria:** A teacher can create an assignment once and it correctly, automatically reaches every enrolled family's Notification Box within the defined availability window.

## Milestone 3 — Family Experience
- Family dashboard (multi-child support)
- Bell icon + Notification Box
- Student profile (assignments, attendance, results tabs)
- Assignment acknowledgment
- Daily notes (teacher -> parent, one-way)
**Exit criteria:** A parent can log in, see all children, view a published assignment, acknowledge it, and receive/read a daily note — all reflected correctly and promptly.

## Milestone 4 — Fees (V1 Manual Model)
- FeeRecord schema + status recompute logic
- Admin fee entry + fee overview screen
- Family fee status view (read-only)
- Fee reminder dispatch (in-app)
**Exit criteria:** Admin can record a payment, status updates correctly, and the family sees the updated badge without delay.

## Milestone 5 — Transfers
- TransferRequest/TransferPackage schema
- Admin review/approve/deny workflow
- Audit trail for transfer decisions
**Exit criteria:** A transfer request between two schools on the platform can be submitted, reviewed, partially approved (selected record categories), and completed with a full audit trail.

## Milestone 6 — Design System & Polish Pass
- Design tokens finalized and applied across all existing screens
- Loading/empty/error/offline states added to every list/dashboard view
- Motion/transition pass
- Mobile performance validation (Doc 3 targets) on real low-end Android devices
**Exit criteria:** Core journeys (Milestones 1-5) meet the performance targets defined in Doc 3, validated by load/device testing, not assumption.

## Milestone 7 — Pilot Launch Readiness
- Error tracking/monitoring live
- Rate limiting on auth + bulk operations
- Backup verification
- 1-3 pilot schools onboarded as real test cases
**Exit criteria:** Platform is live with real schools, real data, and monitoring in place to catch issues before they compound.

## Deferred to Post-V1 (See Doc 4)
Payment gateway integration, virtual classes, advanced analytics, platform-admin-facing tooling, configurable transfer policy engine.

## Sequencing Note
This order deliberately puts security/schema correctness (Milestone 0) before any visible feature, and the core wedge (Milestone 2) before fees or transfers — reflecting the "quality over speed, foundation before polish" principle established in Doc 3.
-e 

---


# Doc 17: Open Questions & Decisions Log

## Decisions Log (Confirmed, for Reference)

| Decision | Resolution |
|---|---|
| School membership model | School-controlled; no self-registration by students/families directly (school owner self-registers the school itself, globally, per Doc 24) |
| Family account model | One account per family, multiple children, school-scoped login (Person/FamilyMembership split in schema for future cross-school login, Doc 23 §1) |
| Student identity | Persistent Platform Student ID, separate from school enrollment; identity-matching/duplicate resolution workflow (Doc 23 §2) |
| Admin count per school | Two admins, equal privilege (V1); full Platform Admin override authority confirmed (Doc 24 §8) |
| Teacher/Student/Family creation | Manual + CSV bulk import |
| WhatsApp usage | Activation link only; all else via in-app notification |
| Notification UI | Bell icon with unread badge; mark-as-read on list open |
| Fee tracking granularity | Per term |
| Fee status computation | Stored column, recomputed on write |
| Fee payment in V1 | Manual admin entry after offline payment confirmation |
| Fee payment in V2 | Stripe + Paystack, parent's choice at payment time (Doc 9) |
| Teacher attendance edit window | Same day only; admin override after |
| Teacher assignment deletion | Retraction only (audit-logged), never hard delete |
| Teacher-to-parent messaging | One-way "daily notes," no reply thread |
| Assignment attachments | Optional image/PDF, max 3 files, client-side compressed, size-limited (Doc 26) |
| Offline support scope | Allowlisted to attendance + acknowledgment only, with conflict resolution and encrypted queue (Doc 23 §3) |
| Background job execution | Supabase Edge Functions + pg_cron/Database Webhooks, not a persistent worker (Doc 23 §4) |
| Frontend stack | Next.js + TypeScript + Tailwind + shadcn/ui, PWA delivery |
| Backend stack | Supabase/Postgres + RLS, hybrid with app-layer business logic |
| Hosting | Vercel + Supabase |
| Engineering priority | Quality over speed; foundation (schema/RLS/auth) before UI polish |
| Product name | SchoolOS |
| Global onboarding | Nigeria-first launch, global-ready architecture; any school owner can self-register anywhere (Doc 24 §1) |
| Platform Admin role | Confirmed pre-launch requirement; full override authority (Doc 24 §6, §8) |
| Subscription tiers & pricing | Tier 1 <100 (₦90,000/$150/yr), Tier 2 100-500 (₦150,000/$250/yr), Tier 3 >500 (₦220,000/$350/yr) (Doc 25) |
| Tier overage enforcement | Hard block; upgrade required, prorated charge, renewal date unchanged (Doc 24 §3) |
| Trial/billing lifecycle | 31-day trial, day-31 first charge, 14-day retry (5 attempts, every 3 days), 12-month rolling cycle, 30-day renewal grace (Doc 24 §5) |
| Subscription gateway choice | Stripe + Paystack, school's own choice at checkout (Doc 24 §4) |
| Activation code expiry | 7 days (Doc 12) |
| Free plan model | Full admin capability, zero teacher capability, static family view (Doc 25) |
| Code implementation | Claude Code will write the implementation against these docs |

## Open Questions (Not Yet Resolved)

1. **Downgrade mechanics** — upgrade mechanics are fully specified (Doc 24 §3); a tier downgrade path has not been requested or designed. Low priority — add if/when a real school asks.

2. **Flutterwave or additional regional gateways** — Stripe + Paystack confirmed as the V1/V2 pair for both subscription billing and fee payment. Flutterwave remains a plausible future addition, not committed.

3. **Transfer policy configurability** — V1 relies on admin judgment per transfer request for which academic records release. A configurable field-level transfer policy engine is a V2 idea, not yet designed in detail.

4. **Admin hierarchy differentiation** — confirmed as two equal-privilege admins for V1. A future differentiated role (e.g., a bursar-only restricted admin) is a V2 idea, not yet specified.

5. **Competitive landscape verification** — Doc 2's named competitors (SchoolBase, MySCL, etc.) reflect early research, not independently verified current features/pricing. Recommend a verification pass before using Doc 2 externally (investor conversations, partner discussions).

6. **Indexing strategy** — beyond obvious foreign-key indexes, specific query-pattern-driven indexing (Doc 10) is deferred to implementation, once real query patterns are observable — intentionally not guessed upfront.

7. **Visual design system formalization** — real screens now exist (mockup canvas, built from Doc 18's tokens), but a fully formalized Design System artifact (every component state, full palette documentation) could still be built out as implementation proceeds, rather than being a blocker beforehand.

## How to Use This Doc
Review before each new milestone kickoff (Doc 16) to confirm whether any open question has become a blocker for that milestone's scope, and update this log as decisions are made rather than letting resolved questions linger here.
-e 

---


# Doc 18: UI Specification

This doc defines the concrete visual system — the actual values, not just principles (Doc 14 covers principles; this covers numbers). Claude Code should treat this as the literal design-token source of truth.

## 1. Design Tokens

### Color System
```
-- Brand
--color-primary: #2563EB        (deep blue — trust, education, calm)
--color-primary-dark: #1E40AF
--color-primary-light: #DBEAFE
--color-accent: #F59E0B         (warm amber — used sparingly, CTAs/highlights)

-- Semantic (status)
--color-success: #16A34A        (Paid, Present, Published)
--color-warning: #D97706        (Partial, Late, Pending)
--color-danger: #DC2626         (Owing, Absent, Retracted)
--color-info: #0891B2           (Announcements, general notices)

-- Neutrals
--color-bg: #FAFAFA
--color-surface: #FFFFFF
--color-border: #E5E7EB
--color-text-primary: #111827
--color-text-secondary: #6B7280
--color-text-disabled: #9CA3AF

-- Dark mode (if in scope — flagged as open decision, see Doc 17 addendum below)
--color-bg-dark: #0F172A
--color-surface-dark: #1E293B
```

### Typography
```
Font family: "Inter" (UI text) + "Lexend" (headings — chosen for readability research
in educational contexts; both via Google Fonts self-hosted for offline reliability)

Type scale (mobile-first base 16px):
--text-xs:   12px / line-height 16px
--text-sm:   14px / line-height 20px
--text-base: 16px / line-height 24px   (body default)
--text-lg:   18px / line-height 28px
--text-xl:   20px / line-height 28px   (card titles)
--text-2xl:  24px / line-height 32px   (screen titles)
--text-3xl:  30px / line-height 36px   (dashboard greeting, rare use)

Font weights: 400 (body), 500 (emphasis/labels), 600 (headings), 700 (rare, strong emphasis)
```

### Spacing Scale
```
--space-1: 4px   --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 20px  --space-6: 24px  --space-8: 32px  --space-10: 40px
--space-12: 48px --space-16: 64px
```

### Radius & Elevation
```
--radius-sm: 6px   (inputs, small buttons)
--radius-md: 10px  (cards)
--radius-lg: 16px  (modals, sheets)
--radius-full: 9999px (badges, avatars)

--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
--shadow-md: 0 4px 6px rgba(0,0,0,0.07)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.10)
```

### Motion
```
--duration-fast: 150ms    (hover, focus states)
--duration-base: 200ms    (transitions, state changes)
--duration-slow: 300ms    (modal/sheet open, page transitions)
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)
```

## 2. Component Specifications

### Button
- Primary: `--color-primary` bg, white text, `--radius-sm`, `--space-3` vertical / `--space-5` horizontal padding
- Secondary: white bg, `--color-primary` border + text
- Destructive (e.g., Retract Assignment): `--color-danger` text, outlined, requires confirmation dialog before action fires
- Disabled state: `--color-text-disabled` text, `--color-border` bg, no hover effect
- Min touch target: 44×44px (mobile accessibility baseline)

### Status Badge (Fee status, Assignment status, Attendance status)
- Pill shape (`--radius-full`), `--space-1` vertical / `--space-3` horizontal padding
- Color-coded per semantic token above, with an icon (not color alone, for accessibility — colorblind users must be able to distinguish status)
- `--text-sm`, weight 500

### Card
- `--color-surface` bg, `--radius-md`, `--shadow-sm` default / `--shadow-md` on hover (desktop only — no hover state on touch)
- Padding: `--space-4`
- Used for: child summary cards, class cards, notification items

### Notification Bell Icon
- Fixed top-right in nav, badge overlay top-right of icon
- Badge: `--color-danger` bg, white text, `--radius-full`, shows count up to 9, then "9+"
- Tap target 44×44px minimum even though icon itself is smaller

### Form Inputs
- Height 44px minimum (touch target + readability)
- `--radius-sm`, `--color-border` default border, `--color-primary` border on focus (2px, with visible focus ring for keyboard nav)
- Label above input, `--text-sm`, `--color-text-secondary`
- Error state: `--color-danger` border + helper text below in `--color-danger`

### Bottom Navigation (mobile, Family & Teacher apps)
- Fixed bottom bar, `--color-surface` bg, `--shadow-lg` (shadow faces upward)
- 4-5 items max, icon + label, active item in `--color-primary`
- Safe-area-inset padding for notched devices

## 3. Iconography
- Single consistent icon set (Lucide icons — pairs with shadcn/ui, open-source, consistent stroke weight)
- Stroke width: 1.5px–2px consistently across all icons
- Icons never used as the sole indicator of status — always paired with text/color per accessibility requirement above

## 4. Accessibility Baseline
- Color contrast: minimum WCAG AA (4.5:1 for body text, 3:1 for large text) — verified against the token palette above before implementation, not assumed
- All interactive elements keyboard-navigable with visible focus states
- All icons have accompanying text labels or aria-labels
- Status conveyed by color + icon + text, never color alone

## 5. Dark Mode — Open Decision
Not yet confirmed as in-scope for V1. Tokens above include a placeholder dark-mode palette, but this should be explicitly confirmed or deferred before implementation — added to Doc 17's open questions.
-e 

---


# Doc 19: UX Specification

Covers interaction patterns, state handling, and usability rules that apply across the whole product — the behavioral layer on top of Doc 18's visual layer and Doc 13's journey-specific flows.

## 1. Required States for Every Data View
Every list, dashboard, or detail screen that loads data must explicitly design for all five:

| State | Requirement |
|---|---|
| Loading | Skeleton screens matching the final layout's shape (not a generic spinner) — reduces perceived wait and layout shift |
| Empty | A specific, friendly message + relevant next action (e.g., "No assignments yet" + nothing to do if teacher hasn't published, vs. admin's empty-class state showing "+ Add Student") — never a blank screen |
| Error | Human-readable message (not a raw error code), with a retry action where applicable; errors logged to monitoring (Doc 20) regardless of what's shown to the user |
| Success | Confirmation feedback for actions that aren't immediately visually obvious (e.g., toast/snackbar for "Assignment scheduled", "Payment recorded") |
| Offline | Explicit offline indicator (not a silent failure) when the device has no connectivity; queued actions (see §4) show a distinct "pending sync" state |

## 2. Navigation Principles
- **Admin**: sidebar/tab navigation (desktop-capable, more screens, more configuration depth)
- **Teacher**: bottom nav on mobile (Dashboard, My Classes, Assignments, Attendance, More), optimized for one-handed daily use between classes
- **Family**: bottom nav on mobile (Dashboard, Notifications, Profile/Children, More) — notification bell always visible regardless of which tab is active
- **Depth rule**: no core action (create assignment, mark attendance, record payment) should require more than 3 taps from its role's dashboard home

## 3. Friction-Minimization Rules (Per Original Product Requirement)
- Teachers must be able to create an assignment, mark attendance, or enter scores without navigating through unnecessary intermediate screens — each of these is a single-purpose flow, not buried inside a general-purpose "manage class" screen
- Default to the most recently used class/subject context when a teacher re-enters a flow (e.g., if they just took attendance for Primary 3A, "Enter Scores" defaults to Primary 3A, not a blank selector)
- Bulk operations (CSV import, batch activation dispatch) always show a preview/confirmation step before committing — no silent bulk writes

## 4. Offline & Low-Connectivity Behavior
- **Reads**: last-successfully-fetched data remains visible (cached) when connectivity drops, clearly marked as "last updated [time]" rather than silently showing stale data as if current
- **Writes made while offline** (e.g., teacher marks attendance with no signal): queued locally, shown with a distinct pending-sync visual state, auto-submitted when connectivity returns; user is never blocked from completing the action locally
- **Conflict handling**: if a queued write conflicts with a server-side change (e.g., admin already edited the same attendance record), the user is shown the conflict explicitly and asked to resolve it — never silently overwritten in either direction
- **Data-usage discipline**: no auto-playing media, no eagerly-loaded images beyond the visible viewport, pagination/infinite-scroll over large "load everything" lists

## 5. Form & Input Behavior
- Inline validation on blur (not only on submit) for required fields, with specific error messages (not generic "invalid input")
- Destructive or hard-to-reverse actions (retract assignment, delete a draft, deny a transfer) always require an explicit confirmation step
- Long forms (e.g., New Assignment with optional repeat scheduling) preserve entered data if the user navigates away accidentally and returns — no silent data loss

## 6. Notification & Badge Behavior (Cross-Reference Doc 8)
- Unread badge count updates in real time where connectivity allows; falls back to update-on-next-load for low-connectivity sessions
- Opening the Notification Box marks all visible items read (confirmed V1 behavior, Doc 8) — this should be visually obvious (e.g., a brief fade/checkmark transition) so the user understands what just happened, not a silent state change

## 7. Error Messaging Tone
- Plain language, no technical jargon or stack traces surfaced to end users
- Always paired with a next step ("Couldn't save — check your connection and try again," not just "Request failed")
- Admin-facing errors can be slightly more technical (e.g., CSV validation row/column references) since that audience is handling structured data entry

## 8. Usability Testing Priorities (Pre-Launch)
Given the user base (teachers and parents, varying tech literacy, low-end Android devices), prioritize usability validation on:
1. Teacher assignment creation flow — must be completable in under a minute by a non-technical teacher on first use
2. Parent navigation to find a specific child's assignment/fee status — must be discoverable without instruction
3. Admin CSV bulk import — error recovery flow (fixing a flagged row) must be clear without external documentation
-e 

---


# Doc 20: Technical Architecture (Deep)

Doc 3 covers stack decisions and rationale. This doc covers the concrete technical shape Claude Code should implement against — request flow, module boundaries, and infrastructure specifics.

## 1. Repository Structure (Monorepo)
```
/apps
  /web                -- Next.js app (all roles, route-grouped)
    /app
      /(admin)/...
      /(teacher)/...
      /(family)/...
      /api/...         -- Server Action / route handler endpoints
/packages
  /ui                  -- shared component library (shadcn/ui-based, Doc 18 tokens)
  /db                  -- Supabase client, generated types, RLS policy SQL
  /jobs                -- background job definitions (notification fan-out, CSV import, etc.)
  /shared              -- shared types/utilities (e.g., FeeStatus enum, permission constants)
/supabase
  /migrations          -- versioned SQL migrations
  /policies            -- RLS policy definitions, version-controlled separately for review
```

Rationale: route-grouping by role (`(admin)`, `(teacher)`, `(family)`) keeps permission boundaries visually obvious in the codebase itself, reducing the chance of a route accidentally rendering the wrong role's data.

## 2. Request Flow (Typical Mutation)
```
1. Client (Next.js Client Component) submits form
2. Server Action invoked (co-located with the route, typed input via shared schema)
3. Server Action validates input (zod schema) BEFORE touching the database
4. Server Action calls Supabase client with the user's session (RLS-scoped) for
   direct data operations
5. For multi-step/process logic (e.g., assignment creation -> fan-out), Server
   Action writes the primary record, then enqueues a background job rather than
   performing fan-out inline
6. Response returned to client; optimistic UI already updated before step 5
   completes (see Doc 19 §3 friction rules)
```

## 3. Background Job Architecture
- **Queue:** pg_boss (Postgres-backed job queue) for V1 — avoids introducing Redis as a separate infrastructure dependency before it's needed; migrate to Redis-backed BullMQ only if volume/latency demands it (trigger-based, per Doc 3 §5)
- **Job types (V1):**
  - `notify-assignment-published` — fan-out to all families in a class
  - `process-csv-import` — validate + create records from an uploaded CSV
  - `dispatch-whatsapp-activation` — send activation link via WhatsApp Cloud API
  - `recompute-fee-status` — triggered on FeeRecord write (could also be a DB trigger; application-layer chosen for testability per Doc 3's hybrid rationale)
- **Retry policy:** exponential backoff, max 3 retries, failed jobs logged to a dead-letter table for manual review — a silently-dropped notification is a product failure, not an acceptable edge case

## 4. Authentication & Session Flow
```
1. User submits credentials (or activation code + new password on first login)
2. Supabase Auth issues JWT with custom claims: { role, school_id, teacher_id?,
   family_id? } via a Postgres function hooked into Supabase Auth's custom
   claims mechanism
3. JWT stored in httpOnly cookie (not localStorage — XSS mitigation)
4. Every Supabase query from the client/server carries this JWT; RLS policies
   evaluate claims per Doc 11
5. Session refresh handled by Supabase Auth's standard refresh-token flow
```

## 5. RLS Policy Pattern (Representative Example)
```sql
-- Example: Assignment table, teacher read/write scoped to their own
-- TeacherClassAssignment rows; family read scoped to their enrolled children

create policy "teachers_manage_own_assignments"
on "Assignment"
for all
using (
  school_id = (auth.jwt() ->> 'school_id')::uuid
  and teacher_id = (auth.jwt() ->> 'teacher_id')::uuid
);

create policy "families_view_class_assignments"
on "Assignment"
for select
using (
  school_id = (auth.jwt() ->> 'school_id')::uuid
  and class_id in (
    select cm.class_id from "ClassMembership" cm
    join "FamilyStudentRelationship" fsr
      on fsr.platform_student_id = cm.platform_student_id
    where fsr.family_id = (auth.jwt() ->> 'family_id')::uuid
  )
);
```
All policies version-controlled in `/supabase/policies`, reviewed as carefully as application code — not treated as a one-time setup task.

## 6. CSV Import Processing Pipeline
```
1. Admin uploads CSV -> stored temporarily in Supabase Storage
2. process-csv-import job parses + validates each row against entity schema
3. Validation results (errors/warnings per row) returned to admin UI as a
   preview -- no DB writes yet
4. Admin confirms -> job performs batch insert in a single transaction per
   entity type (all rows succeed or the batch fails atomically, avoiding
   partial-import states)
5. On success: activation codes generated per created person, logged to
   AuditLog
```

## 7. Monitoring & Observability
- **Error tracking:** Sentry, capturing both client and server errors, with user role/school_id attached as context (never PII beyond what's necessary for debugging)
- **Structured logging:** JSON logs for all Server Actions and background jobs, including: actor, action, school_id, duration, outcome
- **Key metrics to dashboard from day one:** job queue depth/failure rate, RLS policy denial rate (a spike here likely indicates either an attack or a bug), API p95 latency per endpoint, notification delivery success rate

## 8. Environments
```
local (dev)  ->  staging (Supabase branch/project)  ->  production
```
- Staging mirrors production schema via migration replay, not manual recreation
- All migrations reviewed before production apply; no direct production schema edits outside the migration pipeline

## 9. Explicit Non-Goals for V1 Architecture
- No microservices split
- No multi-region deployment
- No custom-built queue infrastructure beyond pg_boss
- No GraphQL layer (REST/Server Actions sufficient for current API surface)
-e 

---


# Doc 21: Frontend Architecture

Covers how the Next.js frontend is organized, state is managed, and components are structured — implementation-level detail Doc 18 (visual spec) and Doc 20 (system-level architecture) don't cover.

## 1. Rendering Strategy
- **Server Components by default** for data-heavy, mostly-static views (dashboards, lists, profile pages) — fetch data server-side, ship less JS to low-end devices
- **Client Components only where interactivity requires it**: forms, optimistic-update actions (mark attendance, acknowledge assignment), the notification bell's live badge
- Rationale: minimizing client-side JS is a direct performance lever on the low-end-Android/slow-network constraint from Doc 1/Doc 3 — this is a deliberate default, not an afterthought

## 2. State Management
- **Server state** (data from Supabase): fetched via Server Components where possible; client-side fetches use a thin data layer (e.g., SWR or TanStack Query) for caching, revalidation, and offline-aware refetching — not raw `fetch` calls scattered through components
- **Client-only UI state** (form inputs, modal open/closed, active tab): local component state (`useState`) — no global state library needed for this; avoid introducing Redux/Zustand unless a genuine cross-tree state need emerges
- **Optimistic updates**: for the specific friction-sensitive actions named in Doc 19 (attendance, score entry, assignment acknowledgment) — update UI immediately, reconcile with server response, roll back with a clear message on failure

## 3. Component Structure
```
/packages/ui
  /primitives        -- shadcn/ui-derived base components, restyled to Doc 18 tokens
    Button, Input, Badge, Card, Dialog, Toast...
  /composite          -- product-specific composed components
    StudentCard, FeeStatusBadge, NotificationItem, AssignmentForm...
  /layout
    BottomNav, Sidebar, TopBar (with bell icon)...
```
Rule: a `composite` component may compose `primitives` but never duplicate what a primitive already does — if a new pattern repeats twice, it graduates to `composite`.

## 4. Form Handling
- React Hook Form + Zod schema validation, with the same Zod schemas shared between client-side validation and Server Action input validation (Doc 20 §2) — one source of truth for "what's a valid Assignment," not duplicated validation logic
- Multi-step forms (e.g., New Assignment with optional repeat scheduling) manage step state locally, submit as one payload on final confirmation — not partial submissions per step

## 5. Routing & Role Separation
- Route groups per role: `(admin)`, `(teacher)`, `(family)` under `/app`, matching Doc 20's repo structure
- Middleware checks the user's JWT role claim before rendering any route in a given group — a teacher hitting an admin route is redirected, not shown a broken/empty admin UI
- Shared layout per role (persistent nav, bell icon) via Next.js nested layouts, so navigation doesn't re-render on every page transition

## 6. PWA Implementation
- Service worker caches the app shell (static assets, core routes) for offline load capability
- `manifest.json` configured for installability (add-to-homescreen), with icons/splash screens matching Doc 18's visual identity
- Offline write queue (Doc 19 §4) implemented via IndexedDB (browser-native, no extra dependency), synced on reconnect via a background sync event where supported, with a manual "retry sync" fallback for browsers/devices without background sync support

## 7. Performance Practices
- Code-splitting per route group (admin bundle never loads for a family session, and vice versa)
- Image optimization via Next.js `<Image>` for all photos (profile photos, any uploaded assets), with explicit width/height to prevent layout shift
- Font loading: self-hosted Inter/Lexend (Doc 18) with `font-display: swap` to avoid blocking render
- Bundle size budget: tracked in CI (e.g., via `next build` output analysis) with a defined ceiling per route group — flagged as a concrete target to set once a baseline exists, not guessed upfront

## 8. Testing (Frontend-Specific, Complementing Doc 20 §7/Doc 3 §6)
- Component tests (Vitest/React Testing Library) for composite components with meaningful logic (e.g., FeeStatusBadge's color/icon mapping, AssignmentForm's validation states)
- Visual regression testing deferred unless the team has capacity — not a V1 hard requirement, but flagged as valuable given the "premium UI" priority
- E2E (Playwright, per Doc 3) remains the primary guarantee that role-based routing and core journeys work end to end
-e 

---


# Doc 22: Engineering Standards

Baseline standards Claude Code should hold itself to throughout implementation, independent of any single feature's spec. Written partly in response to real failure patterns documented from a prior project (Project PKB / The ShankStar) — see §7.

## 1. Code Quality
- TypeScript strict mode, no `any` without an explicit inline comment justifying why
- No commented-out code committed — delete it; version control preserves history
- Functions/components do one thing; a Server Action that both validates input and performs three unrelated side effects should be split
- Shared types (e.g., `FeeStatus`, `AssignmentStatus`, role enums) live in `/packages/shared` — never redefined per-file

## 2. Naming & Consistency
- Database table/column names: PascalCase for tables, snake_case for columns (matches Doc 10's existing convention — consistency with the schema doc matters more than any abstract "best practice")
- API/Server Action naming: verb-first, role-scoped where relevant (`createAssignment`, `approveTransferRequest`)
- Consistent terminology between docs and code: if Doc 10 calls it `enrollment_id`, code must not introduce a parallel `enrollmentId` concept with different semantics

## 3. Git & Version Control Discipline
- All source code committed to version control — chat-context-only code is not considered "done" (direct lesson from PKB's early-phase code loss, §7)
- Meaningful commit messages tied to milestone/feature, not "fix" or "update"
- No direct commits to a production branch; changes flow through review even in a small/solo team, at minimum via a self-review diff pass before merge

## 4. Documentation-Reality Parity
- A document must never reference a file, script, or feature as existing unless it has actually been created and verified — this was a specific, repeated failure in PKB (API.md and CHANGELOG.md referenced before they existed)
- At each milestone closeout (Doc 16), verify: does the code on disk actually match what the milestone's exit criteria claims? Don't trust the doc; check the repo.

## 5. Security Practices (Non-Negotiable, Not Aspirational)
- **No sensitive data in logs or audit trails**: passwords, auth tokens, and any future financial account details must never appear in logs — PKB's real audit found password hashes leaking into logs via unfiltered query results; use explicit `select` field lists on every query that touches sensitive tables, never `select *` on User/Auth-adjacent tables
- **Rate limiting on auth endpoints** from day one, not retrofitted after an incident (PKB's audit found this missing)
- **No sequential/guessable identifiers for anything used in a lookup URL or support flow** (Platform Student ID's format, e.g., `STU-7F82K4M9`, already avoids this — maintain that discipline for any future ID scheme, e.g., transfer request IDs)
- **Input sanitization on any field that can end up in a CSV export** — CSV formula injection (a cell starting with `=`, `+`, `-`, `@` being interpreted as a formula by Excel) is a real, previously-encountered vulnerability class; sanitize before export, not just on import
- **RLS policies are tested, not assumed** — every new school-scoped table requires a corresponding tenant-isolation test before the feature touching it is considered complete

## 6. Testing Discipline
- A feature is not "done" when it works for the happy path — it needs: the relevant RLS/permission test (Doc 11, Doc 6), at least one edge case (empty state, invalid input), and verification against its milestone's exit criteria (Doc 16)
- Unit tests are inspected for actual assertions, not just "runs without throwing" — a test that doesn't assert a specific outcome isn't verifying anything

## 7. Lessons Carried Forward From Project PKB
These are specific, previously real failure modes — not generic advice — and should be actively guarded against:
- Source code existing only in a chat session and being lost between sessions — always verify code is saved to disk/committed before ending a work session
- A living "freeze" document (schema state, architectural decisions) going stale relative to the actual database — if this project adopts an equivalent living doc, check it against reality at every phase closeout, not just update it reactively
- Import/seed order dependencies causing silent failures (e.g., a bulk import assuming referenced entities already exist) — Doc 12 already flags this for CSV import; treat any future bulk operation with the same suspicion
- Platform/infrastructure dependencies with free-tier limits expiring unexpectedly and taking down production (PKB's Railway free-tier expiry took down its live API) — track paid-tier requirements and renewal dates for every production dependency, don't discover them via an outage

## 8. Definition of Done (Per Feature)
A feature is complete when:
1. Code is committed, not just demonstrated in a session
2. Relevant RLS/permission tests pass
3. All five UX states (Doc 19 §1) are implemented, not just the happy path
4. It meets its milestone's exit criteria (Doc 16) — verified against the running system, not assumed from the spec
-e 

---


# Doc 23: Architecture Freeze Review

Purpose: resolve cross-document contradictions and underspecified areas identified in external review, before Milestone 0 implementation begins. This doc is the single source of truth where it overrides or clarifies anything in Docs 1–22. Where a prior doc is superseded, that doc should be treated as historical context, not current spec.

---

## 1. Family Authentication Model — Decision Record (Not a Bug Fix)

**Clarification:** the school-scoped family login (Doc 10/12) was a deliberate, explicit decision — a parent with children at two different schools gets two separate logins, one per school. This is not a contradiction with persistent student identity; `PlatformStudent` was always designed to persist independent of *enrollment*, not independent of *family access*. Those are different axes.

**Decision for V1 (reaffirmed):** Keep the simple model — `Family` is school-scoped, one login per school.

**Forward-looking refinement adopted for the data model (not V1 UX, but now built into the schema so V2 doesn't require a rewrite):**
Separate the *authenticated person* from the *school-specific membership*, even though V1 only exposes one membership per login path.

```
Person (NEW)
- person_id (PK)
- name, contact_info (phone/email used for auth)
- auth_credentials (Supabase Auth identity)
- created_at

FamilyMembership (REPLACES bare Family.school_id FK pattern)
- membership_id (PK)
- person_id (FK -> Person)
- school_id (FK -> School)
- status (Active/Inactive)
- created_at
```

`FamilyStudentRelationship` now references `membership_id` instead of `family_id` directly, scoping a guardian-child link to one specific school membership.

**V1 behavior:** when a parent registers at a second school, the system creates a **new `Person` record** (not a shared one) in V1, preserving the "separate login per school" simplicity the product decision calls for. **V2 option, enabled by this model without a schema rewrite:** detect an existing `Person` by contact info at registration time and offer to link a new `FamilyMembership` to the same `Person`, giving one login across schools if/when that UX is desired. This is explicitly deferred — not built in V1 — but the data model no longer blocks it.

**Action:** Doc 10 updated to reflect `Person` + `FamiliyMembership` instead of a flat `Family` table. (See §7, superseded tables.)

---

## 2. Student Identity Matching & Duplicate Resolution

**Problem confirmed as real:** A CSV import or manual entry cannot assume a new student record is a new `PlatformStudent` just because no exact name match exists, nor can it assume a name match means the same child. Needed: a deliberate workflow, not silent auto-creation.

**Design: Identity Resolution Workflow**

```
On new student creation (manual OR via CSV import):

1. Candidate matching runs against existing PlatformStudent records
   using a defined match-key set:
   - Full name (fuzzy match, not exact-string)
   - Date of birth (exact)
   - Guardian contact info overlap (phone/email already linked to
     another PlatformStudent via FamilyStudentRelationship)

2. Match confidence tiers:
   - HIGH confidence (DOB exact + name close match + guardian contact
     overlap): system suggests "this looks like an existing student —
     confirm or create new" — never auto-merges silently
   - MEDIUM confidence (DOB exact + name match, no guardian overlap,
     e.g. a transfer where the new school doesn't yet have guardian
     data): flagged for admin review, same prompt
   - LOW/no match: new PlatformStudent created automatically (the
     common case — most new students are genuinely new)

3. Admin resolution screen (for HIGH/MEDIUM matches):
   Shows minimal distinguishing info only (name, DOB, prior/other
   school name if available) -- NOT full academic history or
   sensitive records, to avoid exposing another school's student
   data during matching (per review's privacy concern)

4. Admin chooses:
   - "Same student" -> creates a new SchoolEnrollment against the
     EXISTING platform_student_id
   - "Different student" -> creates a NEW PlatformStudent record
     (system logs this decision to AuditLog either way)
```

**Permanent Platform Student ID is generated only when:**
- A genuinely new identity is created (no match or admin confirms "different student"), OR
- An admin confirms a match, in which case the *existing* ID is reused — a new ID is never generated for a confirmed match

**CSV import specifically:** the bulk import pipeline (Doc 20 §6) now includes this resolution step as part of the "preview" stage — matches requiring admin review are surfaced in the CSV preview UI alongside validation errors/warnings (Doc 12), not processed silently in the batch insert.

**Action:** Doc 10 gains no new table for this (logic lives in the application layer + AuditLog), but Doc 12's CSV flow and Doc 20 §6 are both amended to include this step explicitly.

---

## 3. Offline Writes — Scope, Conflict Resolution, and Security

**Correction to Docs 19/21:** "offline support" was described too broadly. This section narrows it to a defined, safe subset.

**V1 Offline-Capable Actions (Allowlist — nothing else queues offline):**
- Attendance marking (same-day only, matching the existing same-day edit window)
- Assignment acknowledgment (family-side)

**Explicitly NOT offline-capable in V1** (always require a live connection):
- Score/assessment entry
- Assignment creation/retraction
- Fee record entry
- Any admin action (account creation, approvals)

Rationale: the allowlisted actions are low-conflict-risk (attendance is typically written once by one teacher; acknowledgment is a one-way family action with no competing writer) and high-value for connectivity gaps. Everything else either has higher conflict risk or low enough frequency that requiring connectivity is an acceptable trade-off for V1.

**Conflict Resolution:**
```
On reconnect, before a queued write is submitted:
1. Client fetches current server-side state of the target record
2. If server state's last-updated timestamp is AFTER the queued
   write's local timestamp -> conflict detected
3. Conflict is surfaced to the user explicitly: "This attendance
   record was already updated. Keep your version / Use server
   version / View both" -- never silently overwritten either direction
4. Resolution choice is logged to AuditLog
```

**Re-authentication:** if the queued write's auth session has expired by the time connectivity returns, the user is prompted to re-authenticate before the queued action submits — the write is held locally (still encrypted, see below) until that happens, never submitted with a stale/invalid session.

**Protecting Queued Data on Shared Devices:**
- Offline queue stored in IndexedDB, encrypted at the application layer using a key derived from the current session (not a static app-wide key) — so queued data is not plainly readable if the device is shared or lost
- Queue is cleared on logout — a shared-device logout removes any pending offline writes, with a warning shown if unsynced data would be lost ("You have unsynced attendance — sync before logging out?")

**Action:** Doc 19 §4 and Doc 21 §6 are both superseded by this section for anything beyond the two allowlisted actions.

---

## 4. Background Jobs on Serverless Hosting — Corrected Deployment Design

**Problem confirmed as real and significant:** pg_boss (Doc 20 §3) assumes a persistent polling worker. Vercel serverless functions do not run persistently between invocations — a pg_boss worker loop would not survive.

**Corrected design:**

```
Job triggering mechanism: Supabase Edge Functions + pg_cron
(NOT a persistent Vercel-hosted worker)

- pg_cron (runs inside Supabase's Postgres instance) triggers
  scheduled checks (e.g., "any assignments becoming available in
  the next minute?") on a short interval
- Time-sensitive, event-driven jobs (e.g., "assignment just
  published, notify families now") are triggered directly via a
  Supabase Database Webhook firing a Supabase Edge Function on
  INSERT/UPDATE of the relevant table -- not polled
- Edge Functions perform the actual work (fan-out, CSV processing,
  WhatsApp dispatch) and ARE suited to serverless/short-lived
  execution, unlike a pg_boss worker loop
- Job state (pending/processing/complete/failed) still tracked in
  a Postgres table (reusing the shape from Doc 20 §3) so retries
  and dead-letter review work the same way -- only the EXECUTION
  mechanism changes, not the tracking model
```

**Idempotency & Atomicity (assignment write + notification consistency):**
```
1. Assignment INSERT and its "pending notification" record are
   written in a SINGLE DATABASE TRANSACTION (both succeed or
   both roll back -- this is the outbox pattern)
2. The Database Webhook fires only on successful commit of that
   transaction, triggering the Edge Function
3. The Edge Function fan-out job is idempotent: it checks the
   notification's status before sending, and uses an idempotency
   key per (assignment_id, family_id) pair so a retried job
   cannot double-notify the same family
4. If the Edge Function fails partway through fan-out (e.g., after
   notifying 50 of 100 families), job status tracks per-recipient
   completion so a retry only processes remaining recipients, not
   the whole batch again
```

**Retry policy:** unchanged in principle from Doc 20 §3 (exponential backoff, max 3 retries, dead-letter table on exhaustion) — only the execution substrate changes.

**Action:** Doc 20 §3 is superseded by this section. "pg_boss" references throughout the build pack should be read as "Postgres-backed job tracking table + Supabase Edge Functions + pg_cron/Database Webhooks for execution."

---

## 5. Academic Records — Enrollment/Session/Term Attachment (Confirmed, Not Redesigned)

**Review of existing schema (Doc 10) confirms this is already correctly modeled:**
- `Score` → `assessment_id` → `Assessment.term_id` (term-scoped)
- `Attendance` → `enrollment_id` (enrollment-scoped, which is itself school + time-bound)
- `ClassMembership` → `enrollment_id` + `academic_session_id` (session-scoped)
- `StudentAssignmentStatus` → `enrollment_id` (enrollment-scoped)

None of these attach directly to `platform_student_id` — they all route through `enrollment_id`, which is the correct design per the review's concern. **No schema change required here.**

**One clarification added as a result of this review:** when a `TransferPackage` is generated (Doc 7), the transferred academic records retain their original `enrollment_id` references (read-only, historical) rather than being re-attached to the new school's enrollment — the new school sees them as *imported history*, not as live records they can edit. This wasn't fully explicit before and is now confirmed as the rule.

**Action:** Doc 7 gains this one clarifying sentence; Doc 10 requires no structural change.

---

## 6. Authorization Matrix (Consolidated, Cross-Referencing Doc 6)

This section exists to satisfy the review's request for a single consolidated matrix rather than scattered role sections. It does not change Doc 6's content — it restates it keyed by *sensitive operation* rather than by *role*, to make gaps easier to spot.

| Sensitive Operation | Platform Admin | School Admin | Teacher | Family |
|---|---|---|---|---|
| Create/delete school | ✅ (not yet scoped, see Doc 17 #1) | ❌ | ❌ | ❌ |
| Create/edit teacher accounts | — | ✅ | ❌ | ❌ |
| Create/edit student/family accounts | — | ✅ | ❌ | ❌ |
| Resolve identity-match conflicts (§2 above) | — | ✅ | ❌ | ❌ |
| Enter/edit fee records | — | ✅ | ❌ | ❌ (view-only) |
| Enter attendance | — | override only, post-lock | ✅ (same-day) | ❌ |
| Enter scores | — | ❌ | ✅ (own subject/class) | ❌ |
| Create/retract assignments | — | ❌ | ✅ (own class/subject) | ❌ |
| Approve/deny transfer requests | — | ✅ | ❌ | ❌ |
| View audit log | ✅ | ✅ (own school only) | ❌ | ❌ |
| Send daily notes | — | ❌ | ✅ (own class) | ❌ (read-only) |
| View another school's data | ❌ (unless explicit platform-admin support context) | ❌ | ❌ | ❌ |

**Gap surfaced by building this matrix:** Platform Admin's own operational scope (school creation, billing, support access, audit visibility) is still not formally specified — this is Doc 17's open question #1, now explicitly flagged as a Milestone 0 blocker if platform-admin tooling is needed before pilot schools onboard, or safely deferrable if Alana/the Orivex team will provision schools manually via direct database access for the first pilot cohort.

---

## 7. Database Schema — Superseded Elements (Diff Against Doc 10)

| Doc 10 Original | Replaced With | Reason |
|---|---|---|
| `Family` (school_id FK directly) | `Person` + `FamilyMembership` | §1 — separates authenticated identity from school-specific membership |
| `FamilyStudentRelationship.family_id` | `FamilyStudentRelationship.membership_id` | §1 — follows from above |
| No identity-matching mechanism | Application-layer resolution workflow + AuditLog entries | §2 |
| pg_boss as execution engine | Postgres job-tracking table + Supabase Edge Functions + pg_cron/Webhooks | §4 |

All other Doc 10 tables remain valid as specified.

---

## 8. Resolved Contradictions & Explicitly Deferred Decisions

**Resolved:**
- Family login scoping vs. persistent identity — not a contradiction; clarified as two different axes (§1)
- Academic record attachment — confirmed already correct (§5)
- Background job execution model — corrected to fit serverless hosting reality (§4)

**Newly specified (previously underspecified, not contradictory, just incomplete):**
- Student identity matching/duplicate resolution (§2)
- Offline write scope, conflict resolution, and queue security (§3)
- Consolidated authorization matrix (§6)

**Explicitly deferred (not blockers for Milestone 0):**
- Cross-school single login for one person (V2 option, schema now supports it — §1)
- Platform Admin's own tooling/scope (Doc 17 #1, flagged in §6 as a conditional blocker depending on pilot provisioning approach — resolve before scaling past manual provisioning)
- Payment gateway selection, transfer policy configurability, activation code expiry window — unchanged from Doc 17, still open, still non-blocking for Milestone 0

---

## 9. Milestone Sequence — Reaffirmed

This review changes schema/architecture detail but does not change the milestone order in Doc 16. Security and schema correctness (Milestone 0) still comes first, incorporating the corrections in this doc (§1, §2, §4 specifically affect Milestone 0's scope), followed by onboarding, then the teacher assignment workflow — preserving the product's core value proposition at the center of the build sequence.

**Milestone 0 exit criteria, updated:** in addition to the original tenant-isolation test requirement, Milestone 0 now must also demonstrate: (a) the identity-matching workflow correctly distinguishes a new student from a HIGH-confidence match in a test scenario, (b) the assignment-write + notification transaction cannot leave an inconsistent state under a simulated mid-transaction failure, (c) RLS policies correctly scope access under the new `Person`/`FamilyMembership` model.
-e 

---


# Doc 24: Platform Subscription, Billing & Self-Serve Onboarding Model

## 1. Global Positioning (Confirmed)
**Nigeria-first launch, global-ready architecture.** The product launches and markets to Nigerian schools first, but nothing in the data model, currency handling, or onboarding flow assumes Nigeria-only. A school owner anywhere in the world can self-register with no direct assistance from the Orivex team, guided by a setup walkthrough video rather than a sales call.

**Architectural implications this confirms:**
- Multi-currency support at the `School`/subscription level (currency stored per school, not assumed)
- Timezone-aware scheduling (assignment availability, attendance dates) per school, not a single global timezone
- Stripe as the primary global payment rail (see §4), with region-specific gateways as additive options
- Platform Admin dashboard is now a **confirmed pre-launch requirement** (see §6) — self-serve global registration means Orivex needs visibility/control tooling from day one, not deferred

## 2. Self-Serve Onboarding Flow (Updated)
```
1. School owner lands on SchoolOS marketing site
2. Watches setup walkthrough video
3. Registers school (name, address, country, currency auto-detected
   or selected)
4. Selects subscription tier (see §3)
5. Adds payment method, selects preferred gateway if multiple
   available for their region (see §4)
6. 31-day free trial begins -- full platform access, no charge yet
7. Proceeds directly into existing Doc 12 flow: academic setup ->
   people setup (manual/CSV) -> activation dispatch
8. Day 31: first charge attempts automatically (see §5)
9. School continues operating on a 12-month cycle from signup date
   (rolling, not calendar-year-aligned)
```
No change to the underlying academic onboarding steps (Doc 12) — this section only adds the subscription/billing wrapper around it.

## 3. Subscription Tiers
Modeled on student count, confirmed:

| Tier | Student Count | Notes |
|---|---|---|
| Tier 1 | < 100 students | Entry tier for small schools |
| Tier 2 | 100–500 students | Mid-size schools |
| Tier 3 | > 500 students | Large schools |

**Pricing confirmed — see Doc 25.**

**Tier enforcement (confirmed):** student count is checked against the school's active `SchoolEnrollment` count at the moment a new student is added. If adding a student would exceed the current tier's threshold, the action is **hard-blocked** — the admin cannot add the student until the school upgrades. There is no soft-warning grace; the block is the upgrade prompt itself ("You've reached your plan's student limit — upgrade to Tier 2 to add more students").

**Mid-cycle upgrade mechanics (confirmed):**
```
1. Admin triggers upgrade (prompted by the hard block, or voluntarily)
2. System calculates a prorated charge: the difference between the
   current tier's price and the new tier's price, prorated for the
   remaining days in the current 12-month cycle
   (remaining_days / 365 * (new_tier_price - current_tier_price))
3. Prorated charge is collected immediately via the school's
   existing payment method/gateway
4. Subscription.tier updates immediately -- the new student can now
   be added
5. current_period_end DOES NOT change -- the subscription still
   renews 12 months from the ORIGINAL signup/activation date, not
   from the upgrade date
6. At the next annual renewal, the school is billed the full new
   tier's price going forward
```
This means upgrading is purely additive mid-cycle — a school never loses their original renewal date by upgrading, and never pays for a full new 12-month term just to add students partway through an existing one. A downgrade (if ever supported) would follow the inverse logic but is not specified here, as it wasn't requested — flagged as a gap only if downgrades are needed later.

## 4. Payment Gateway Architecture

**Principle:** subscription logic (trial tracking, charge timing, 12-month cycles, grace periods, access restriction) lives entirely in SchoolOS's own database and application layer — never inside a specific gateway's billing engine. Each gateway is a pluggable payment-execution mechanism underneath that shared logic, not an independent source of truth. This is required specifically because you want multiple gateways with consistent grace-period behavior, and no single gateway's native subscription product guarantees that behavior identically across providers.

```
Subscription (SchoolOS-owned table)
- subscription_id (PK)
- school_id (FK)
- tier
- status (Trialing / Active / PastDue / Restricted / Cancelled)
- trial_started_at, trial_ends_at (= started + 31 days)
- current_period_start, current_period_end (12-month cycle)
- next_charge_at
- gateway_provider (stripe / paystack / flutterwave / ...)
- gateway_customer_ref (opaque ID from the chosen provider)
- grace_period_started_at (nullable)
- created_at, updated_at
```

**Gateway selection — confirmed as school's own choice, not auto-assigned by region:**
- **Stripe** — offered to every school globally, primary rail, native support for delayed-first-charge trials and annual billing
- **Paystack** — offered alongside Stripe where available (Nigeria at launch), for schools preferring local payment methods (bank transfer, local cards, mobile money)
- At checkout (onboarding flow §2, step 5), the school selects whichever gateway is convenient for them from whatever's available in their region — the system doesn't force a region-based default, it presents the options and lets the school pick. Both gateways sit beneath the same SchoolOS-owned subscription logic (trial, grace, retries) as described above, so the choice has zero effect on billing behavior — only on how the school actually pays.
- Flutterwave remains a plausible future addition but is not committed for V1; Stripe + Paystack is the confirmed V1 pair.

**How grace/retry logic works identically regardless of gateway:**
```
1. SchoolOS's own scheduler (not the gateway) tracks next_charge_at
2. On due date, SchoolOS calls the selected gateway's charge API
3. Gateway response (success/failure) updates Subscription.status
   in SchoolOS's own table
4. All retry counting, grace period duration, and access
   restriction timing (see §5) are computed and enforced by
   SchoolOS -- the gateway only executes individual charge attempts
   when told to
```
This keeps the business logic identical across gateways and avoids rebuilding grace-period rules per provider.

## 5. Billing Lifecycle (Fully Specified)

```
Day 0:        School registers, trial begins, full access granted
Day 31:       First charge attempted
  -> SUCCESS: subscription becomes Active, 12-month cycle begins
     from this date (current_period_end = day 31 + 12 months)
  -> FAILURE: retry begins (see below)

Card failure at Day 31:
  -> Retry cadence (confirmed): attempts on day 31, then every 3
     days through day 44 (approx. 5 attempts total: ~day 31, 34,
     37, 40, 43) -- frequent enough to catch a resolved card quickly,
     spaced enough to avoid spamming a declined card or triggering
     gateway fraud flags for repeated rapid charges
  -> If resolved within 14 days: subscription becomes Active,
     12-month cycle begins from the day it was actually resolved
  -> If unresolved after 14 days: access restricted (see §7 for
     what remains available)

Renewal (12 months from Active start):
  -> Charge attempted automatically
  -> SUCCESS: cycle renews for another 12 months
  -> FAILURE or no action taken: 30-day grace/warning period begins
     -- school retains full access, repeated reminders sent via
     Notification Box + email to admin
  -> If unresolved after 30 days: access restricted (see §7)

Cancellation during trial (before Day 31):
  -> No charge, immediate or end-of-trial deactivation, no penalty

Cancellation after trial (Active subscription):
  -> No refund for the current paid period
  -> School retains access through current_period_end, then
     subscription ends (does not restrict immediately on
     cancellation request -- they paid for the full period)
```

## 6. Platform Admin Dashboard (Now a Confirmed Pre-Launch Requirement)

Self-serve global onboarding means Orivex needs its own operational visibility from day one. Minimum V1 scope:

- **Schools list**: all registered schools, country, tier, subscription status, trial/billing dates
- **Subscription management**: view/manually adjust a school's subscription state (e.g., manual grace extension for a genuine payment issue, support override)
- **Support actions**: ability to view (not necessarily edit) a school's basic account state to assist with support queries, without exposing full student academic data gratuitously — platform admin access to sensitive student data should itself be scoped and audit-logged, consistent with Doc 11's isolation principles extended to the platform-admin layer
- **Audit log, platform-wide**: cross-school audit visibility for support/compliance purposes
- **Billing/revenue overview**: basic aggregate view (active subscriptions by tier, upcoming renewals, schools in grace period) for Orivex's own business tracking

**This becomes part of Milestone 0/1 scope** (previously conditionally deferrable; your answer to global self-serve onboarding removes the option to defer it).

## 7. Restricted Access Matrix — What Still Works When a School Is "Restricted"

Restriction is a billing-enforcement state, not a data-deletion event. The principle: **never lock a school out of actions needed to resolve the restriction itself or to preserve data integrity**, while blocking the features that represent ongoing platform value.

| Feature/Action | Available While Restricted? | Rationale |
|---|---|---|
| Admin login | ✅ | Must be able to resolve billing issue |
| View subscription/billing status, update payment method, retry charge | ✅ | This is the resolution path |
| CSV bulk import (teachers/students/families) | ✅ | Data entry/migration shouldn't be held hostage — a school fixing their billing shouldn't also lose onboarding progress |
| Manual teacher/student/family creation | ✅ | Same rationale as above |
| Academic session/class/subject setup | ✅ | Structural setup, not ongoing platform value delivery |
| View existing academic records (read-only) | ✅ | Data access/export shouldn't be blocked — this is the school's own data |
| Export data (CSV export, report cards) | ✅ | A restricted school should be able to retrieve its own data regardless |
| Create new assignments | ❌ | Core ongoing value — gated |
| Take new attendance | ❌ | Core ongoing value — gated |
| Enter new scores | ❌ | Core ongoing value — gated |
| Send notifications/announcements | ❌ | Core ongoing value — gated |
| Family login / family-facing features | ❌ | The paying customer (school) is restricted; family access is part of what's being paid for |
| Teacher login for new data entry | ❌ (read-only access only, if any) | Consistent with above |
| Transfer request initiation (as sending OR receiving school) | ❌ | Requires active platform relationship on both sides |
| Daily notes (teacher → parent) | ❌ | Ongoing engagement feature — gated |

**Design rationale:** this matrix draws the restriction line at "can the school leave gracefully or fix their billing" vs. "can they keep extracting ongoing platform value without paying" — admin-side setup/data access stays open; teacher/family-facing ongoing engagement features are gated. This also directly protects you from a support disaster scenario (a school losing access to their own data because of a billing lapse) while still creating real pressure to resolve payment.

## 8. Platform Admin Override Authority (Confirmed)
Platform Admin holds **full override authority** over every billing/access state defined in this doc — this is not a narrow exception workflow but a general principle: Platform Admin can manually set/clear a school's `Subscription.status` (Trialing/Active/PastDue/Restricted/Cancelled), extend or waive a grace period, adjust `next_charge_at`, or override tier enforcement, for any reason (goodwill, support resolution, manual provisioning, dispute handling). Every override action is written to the platform-wide `AuditLog` (actor = platform admin, action_type = subscription override, target = school_id, details = what changed and why) — unrestricted authority, fully audited, not unrestricted *and* untracked. This authority sits above every rule in §5 and §7; those sections describe default automated behavior, not a ceiling on what Platform Admin can manually do.

## 9. Open Items — Status

All items previously listed here are now resolved:
- Tier pricing: confirmed, Doc 25
- Retry cadence: confirmed, §5 above
- Tier-overage enforcement: confirmed hard-block, §3 above
- Free plan limits: confirmed, Doc 25
- Gateway choice: confirmed as school's own selection (Stripe + Paystack), §4 above

**Remaining genuinely open (non-blocking, V2-horizon):**
- Downgrade mechanics (not specified, not yet requested)
- Flutterwave or additional regional gateways beyond Stripe/Paystack
- V2 parent-facing fee-payment gateway selection (separate from this platform-subscription gateway — see Doc 9)
-e 

---


# Doc 25: Pricing Suggestion & Free Plan Matrix

## 1. Pricing — Confirmed

| Tier | Student Count | Nigeria | Global/International |
|---|---|---|---|
| Tier 1 | < 100 | ₦90,000/year | $150/year |
| Tier 2 | 100–500 | ₦150,000/year | $250/year |
| Tier 3 | > 500 | ₦220,000/year | $350/year |

Flat annual pricing per tier, no per-student add-on beyond the tier bands above. Matches the annual billing model locked in Doc 24 §5.

---

## 2. Free Plan Matrix — Confirmed

**Strategic model (confirmed, superseding the earlier draft in this doc):** the free plan is a "full setup, zero live operation" model, not a "full feature, capped scale" model. School Admin gets complete, unrestricted setup capability — the free plan should feel like a genuinely capable administrative tool. Teacher capability is reduced to login-only, with zero functional ability. This cascades directly to Family: parents can log in and view their children's static profile/enrollment, but receive no live updates of any kind, because nothing that generates a parent-facing update (assignments, attendance, scores, daily notes) can be created while teacher capability is locked.

| Role | Free Plan Access | Detail |
|---|---|---|
| **School Admin** | ✅ Full, unrestricted | All admin capabilities available with no caps: academic session/term/class/subject setup, teacher/student/family creation (manual AND CSV bulk import), activation code generation + WhatsApp dispatch, timetable configuration, fee record entry, fee reminder dispatch, announcements, transfer request handling, audit log — identical to a paid tier |
| **Teacher** | ❌ Login-only, zero functional capability | Teacher can authenticate and land on their dashboard, but every action is disabled: cannot create/schedule assignments, cannot take attendance, cannot enter scores, cannot send daily notes, cannot publish class announcements. Dashboard renders as a locked/empty shell — functionally a preview of "what this would look like," not a working tool |
| **Family** | ✅ Can log in; ❌ no live updates | Parent can log in, see the family dashboard, and open each child's static profile (identity, current class/enrollment, fee status if admin has entered it). No assignments, attendance records, scores, or daily notes ever appear, since none can be created upstream. Notification Box will only ever show admin-triggered items (fee reminders, school-wide announcements) — never anything assignment/attendance/daily-note related, since those all originate from a locked-out teacher role |

**What this means concretely for each previously-listed feature:**

| Feature | Free Plan | Note |
|---|---|---|
| CSV bulk import (all entity types) | ✅ Full access | Admin capability — unrestricted per above |
| Student/teacher/family count | No cap | Admin capability — unrestricted per above |
| Admin account count | 2 (same as paid) | Admin capability — unrestricted per above |
| Timetable configuration | ✅ Full access | Admin capability — unrestricted per above |
| Fee tracking (admin entry + family view) | ✅ Full access | Admin-entered, so unaffected by teacher lockout |
| Transfers | ✅ Full access (admin-controlled workflow) | Admin capability — unrestricted per above |
| WhatsApp activation dispatch | ✅ Full access, no cap | Admin capability — unrestricted per above |
| Assignment creation/scheduling | ❌ Teacher locked out | Zero teacher capability |
| Attendance entry | ❌ Teacher locked out | Zero teacher capability |
| Score/assessment entry | ❌ Teacher locked out | Zero teacher capability |
| Daily notes | ❌ Teacher locked out | Zero teacher capability |
| Class-scoped announcements (teacher-originated) | ❌ Teacher locked out | School-wide announcements (admin-originated) remain available |
| Data export (CSV/report cards) | ✅ Full access | Never withheld, consistent with the principle already applied to restricted/billing-lapsed accounts (Doc 24 §7) |
| Platform Admin override | ✅ Available | Platform Admin can manually lift any free-plan restriction for a specific school (e.g., demo/pilot purposes), per Doc 24 §8's general override authority |

## 3. Upgrade Trigger (Single, Clear Mechanism)
There is effectively one upgrade trigger under this model, and it should be surfaced clearly rather than discovered by accident: the moment a teacher attempts any locked action, show a direct message — e.g., "Assignment creation is part of a paid SchoolOS plan. Upgrade to activate this for your teachers." The same applies on the family side if a parent asks why nothing is updating: the Notification Box or child profile should carry a visible explanation ("Your school hasn't activated full updates yet") rather than silently showing nothing, so the gap is understood as a plan limitation, not a product bug.

## 4. Open Note
Given the strategic shift flagged above — no user ever experiences the core assignment-distribution wedge under free — the conversion story now rests entirely on the school admin's own setup investment creating pressure to upgrade, rather than parent/teacher attachment to the product. Worth keeping in mind when evaluating early conversion data: if free-plan schools aren't converting, the likely lever to revisit is this mechanism, not pricing (Doc 25 §1).
-e 

---


# Doc 26: Assignment Attachment Specification

Adds optional image/PDF attachment to teacher-created assignments. This doc amends Docs 4, 10, 13, 15, 18, 19, 20, and 21 — each amendment noted inline below rather than rewriting those docs wholesale.

## 1. Scope (V1, Confirmed)
- Teacher may optionally attach **up to 3 files** per assignment
- Supported formats: **JPG, PNG, PDF only** — no video, no other document types, keeping scope tight and bandwidth-conscious
- Attachments are view-only for families — no re-upload, no annotation, no submission-via-attachment (physical workbook remains the completion medium, per Doc 1's original design philosophy; attachments supplement the instructions, they don't change the completion workflow)

## 2. File Size Limits (Protecting Low-Data Users)

| File Type | Max Upload Size (Raw) | Processing Before Storage |
|---|---|---|
| Image (JPG/PNG) | 5MB raw selected file | **Client-side compressed before upload**: resized to max 1600px on the longest edge, re-encoded as JPEG at ~70-75% quality, targeting a final size under 1MB. This happens in-browser before the upload request is sent — protecting the teacher's own data usage at upload time, not just the family's at download time |
| PDF | 5MB | No compression applied (PDFs aren't safely re-compressible client-side without a library); hard size cap enforced, upload rejected with a clear message if exceeded |

**Rationale for compress-before-upload (not just after):** teachers are as likely to be on a constrained connection as parents — compressing on the teacher's device before the upload request means the teacher also isn't burning excessive data sending a 5MB phone photo. The family-side view then downloads an already-small file.

**Total per-assignment cap:** 3 files × ~1MB average (images, post-compression) or up to 5MB each if PDFs ≈ a reasonable worst case per assignment; no additional aggregate cap needed beyond the per-file limits and the 3-file count limit.

## 3. Database Schema Amendment (Supersedes Relevant Part of Doc 10 §5)

```
AssignmentAttachment
- attachment_id (PK)
- assignment_id (FK -> Assignment)
- school_id (FK) -- for RLS scoping, consistent with Doc 11
- file_type (image / pdf)
- storage_path (Supabase Storage object reference)
- file_size_bytes
- original_filename
- uploaded_at
```
A separate table (not columns on `Assignment`) because an assignment can have 0-3 attachments — a one-to-many relationship, not a single optional field. RLS policy mirrors the parent `Assignment` policy (Doc 23 §6 pattern): teachers can manage attachments on their own assignments; families can read attachments for assignments visible to their enrolled children.

## 4. UI Specification Amendment (Adds to Doc 18 §2)

### Attachment Upload Control (Teacher — New Assignment Form)
- Positioned below the Instructions text field in the New Assignment form (Doc 13 journey #1, Screen 2)
- "Add Photo or PDF" button (secondary button style, Doc 18), opens device file picker/camera
- On selection: **inline compression + upload progress indicator** shown immediately (not a silent wait) — a small thumbnail with a progress ring for images, a filename + progress bar for PDFs
- Once uploaded: thumbnail preview (images) or a file-icon + filename chip (PDFs), with a small "✕" remove control on each
- Error states (per Doc 19 §1 required-states rule): file exceeds size limit ("This file is too large — max 5MB"), unsupported format ("Only JPG, PNG, and PDF files are supported"), upload failed due to connectivity ("Couldn't upload — check your connection and try again")
- Max-3 enforcement: "Add Photo or PDF" button disables/hides once 3 attachments are present, with a small note ("Maximum 3 attachments")

### Attachment Display (Family — Assignment Detail View, Doc 13 journey #4, Screen 5)
- Thumbnails shown below the assignment instructions text, in upload order
- Tapping an image thumbnail opens a full-screen lightbox view (pinch-to-zoom supported)
- Tapping a PDF chip opens it in-browser (native PDF viewer) or triggers a download, depending on device capability — not forced into an in-app custom PDF renderer, to avoid unnecessary complexity
- Images lazy-load (per Doc 21 §7 image optimization practice) — not fetched until the family actually opens that assignment's detail view, protecting data usage for assignments never opened

## 5. UX State Handling Amendment (Adds to Doc 19 §1)
Upload-specific states added to the required-states checklist for the New Assignment screen specifically:
- **Uploading**: progress indicator per file, teacher can continue filling other form fields while upload completes in the background (non-blocking)
- **Upload failed**: file shows a retry affordance, does not block saving the rest of the assignment — teacher can choose to remove the failed attachment and publish without it, or retry
- **Offline during attachment upload**: per Doc 23 §3, attachment upload is **not** an offline-capable action (it's not on the allowlist) — if connectivity drops mid-upload, the teacher sees a clear "Upload paused — reconnect to continue" state, and the assignment cannot be published with a pending/failed upload still attached unresolved (must remove or retry first)

## 6. Technical/Frontend Architecture Amendment (Adds to Doc 20 §6 pattern, Doc 21 §7)
- Client-side image compression library (e.g., `browser-image-compression` or equivalent) runs in the browser before the upload request — not server-side, to avoid uploading the large original at all
- Upload target: Supabase Storage, same bucket pattern as other media (Doc 3/Doc 20), with `school_id`-scoped storage paths consistent with tenant isolation (Doc 11) — a storage path convention like `/{school_id}/assignments/{assignment_id}/{attachment_id}.{ext}` keeps this consistent with the RLS-everywhere principle even though Storage access control works slightly differently from table RLS (Supabase Storage policies, not Postgres RLS directly, but same `school_id`-scoping logic applied)
- PDF and image files served via signed URLs with reasonable expiry, not public buckets — consistent with the "children's data security is foundational" principle (Doc 3 §6, Doc 11)

## 7. MVP Scope Amendment (Adds to Doc 4, Doc 15)
Optional image/PDF attachment on assignment creation is now part of **V1 scope** (not deferred) — added to Doc 15's Teacher feature checklist as:
- [ ] Assignment attachment upload (image/PDF, max 3 files, size-limited, client-side compressed)
- [ ] Attachment preview/lightbox on family-side assignment view

## 8. Explicitly Out of Scope (Even With This Addition)
- No video attachments
- No in-app annotation/markup on attachments
- No attachment-based assignment submission (workbook remains the completion medium)
- No attachment editing after publish — removing/replacing requires retracting and recreating the assignment (consistent with the existing retract-not-edit-after-view caution from Doc 6, applied here by extension)
-e 

---


