# TOBI XP — Website Text Management Console

This portfolio includes a private, authenticated **Admin Console** powered by **Google Firebase Firestore** to manage all website text in real time without touching code or redeploying the repository.

---

## 1. Accessing the Admin Console

Navigate to:
```
/admin
```
or click the **Studio / Admin** touchpoint from the site navigation menu.

### Authentication & Permissions
- **Provider:** Google Authentication (Firebase Auth).
- **Authorized Administrators:** `tobyson707@gmail.com`, `jh204222@gmail.com`.
- **Security:** Writes to Firestore are restricted strictly to authorized site owners enforced by Cloud Firestore Security Rules (`firestore.rules`). Unauthenticated writes are rejected at the database layer. No service account keys are exposed to the client.

---

## 2. Editable Website Text

The Admin Console manages website text across the following sections:

| Section | Firestore Path | Editable Content |
| :--- | :--- | :--- |
| **Hero Copy** | `/site/hero` | Name/title, professional role, discipline line, availability status, intro statement, top & left bio microcopy. |
| **About Narrative** | `/site/about` | Eyebrow, heading, narrative story, personality note, CTA button label, skills list. |
| **Work Section Headings & Labels** | `/site/worksConfig` | Works section heading, Explore button label, Close/Back label, scroll hint text, Awards section label, Visit link label, detail placeholder text. |
| **Categories & Sections** | `/categories/{id}` | Section numbers (`01`, `02`, etc.), headings, subtitles/taglines, descriptions, tools lists, awards/recognition items, footer notes. |
| **Works & Projects** | `/works/{id}` | Work titles, slugs, category/group assignments, timeline year, tags, right-side meta notes, tools, client, project type, external URLs, markdown case studies, and **gallery image captions/titles**. |
| **Work Groups / Subsections** | `/workGroups/{id}` | Subcategory headings, slugs, discipline notes, descriptions. |
| **Résumé Timeline** | `/site/resume` | Section title and timeline entries (period, place/organization, role, bullet points, social links, visibility, order). |
| **Editorial Stats** | `/site/stats` | Editorial metric numbers, labels, descriptions, and statement narrative. |
| **Contact Section** | `/site/contact` | Card number, section title, tagline/intro text, input field labels (Name, Email, Message), submit button label, recipient email. |
| **Social Touchpoints** | `/site/social` | Instagram handle/link, direct contact email, guestbook button label. |

---

## 3. Image & Media Asset Policy

- **Bundled Static WebP Assets:** Portfolio images (section covers, work graphics, and gallery previews) are optimized WebP files bundled directly with the website in `/works/covers/` and `/images/`.
- **Text-Only Management:** The Admin Console manages text, headings, captions, and metadata. Editing text preserves all bundled image paths and gallery media without risking accidental image deletions or broken links.

---

## 4. Real-time Sync & Local Fallback

- **Live Public Updates:** When you click **Save Changes** or **Save Work**, updates are written to Cloud Firestore and instantly broadcast to visitors via Firestore real-time listeners.
- **Offline / Local Fallback:** If Firebase is temporarily unreachable or during offline development, the public portfolio gracefully displays bundled fallback defaults (`src/data/site.json` and `src/data/works.json`).
- **Feedback & States:** The Admin Console provides clear loading spinners, save-success confirmation toasts, and informative error messages.
