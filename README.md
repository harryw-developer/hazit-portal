# HazIT Portal

A business portal for **HazIT**, a technical-support business. It has two sides:

- **Staff desktop** — a retro "Windows-style" desktop with apps for running the business.
- **Customer portal** — a clean, large-type, easy-to-use area where customers sign in to view
  invoices, raise support tickets, book appointments, approve quotes and read help guides.

Built with React + TypeScript + Vite + Tailwind, backed by [Supabase](https://supabase.com)
(Postgres, Auth, Storage and an Edge Function).

## Apps

| App | Staff | Customer |
| --- | --- | --- |
| Invoice Generator | Create, manage, print invoices; per-invoice Revolut pay link | View & pay invoices |
| Customers | Directory + create portal logins | — |
| Helpdesk | Manage & reply to tickets | Raise & follow up tickets |
| Quotes | Create/send; convert approved → invoice | Approve / decline |
| Appointments | Confirm & schedule | Request a visit/call |
| Device Register | Track customer equipment | View own devices |
| Knowledge Base | Write how-to guides | Read guides |
| Settings | Company details, branding, invoice defaults | — |

## Security

- Every table uses **Row Level Security**. Staff see everything; each customer sees only their own
  data. Anonymous access is blocked.
- Customer logins are created by staff via a Supabase **Edge Function** (`manage-users`) that runs
  with the service-role key server-side and verifies the caller is staff.
- The Supabase URL and **publishable** key are safe to ship in the browser bundle — RLS protects the
  data.

## Local development

```bash
npm install
npm run dev
```

Optionally copy `.env.example` to `.env` to point at a different Supabase project.

## Deployment

Pushing to `main` builds the app and deploys it to **GitHub Pages** via GitHub Actions
(`.github/workflows/deploy.yml`). The app uses hash-based routing so it works on static hosting.
