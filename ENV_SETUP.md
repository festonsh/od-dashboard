# Si të lidhni Environment Variables në Vercel

## 1. Krijoni një databazë Postgres

- **Vercel:** Në projektin tuaj Vercel → **Storage** → **Create Database** → zgjidhni **Postgres**. Pas krijimit, Vercel ju jep një **connection string** (dhe mund të shtojë automatikisht variablat në Environment Variables).
- **Ose** përdorni [Neon](https://neon.tech), [Supabase](https://supabase.com) ose [Railway](https://railway.app): krijoni një projekt Postgres dhe kopjoni **connection string** (duket si `postgresql://user:password@host/database?sslmode=require`).

## 2. Në Vercel: Add Environment Variable

1. Hapni **Project** → **Settings** → **Environment Variables**.
2. Klikoni **Add Environment Variable** (ose **Import .env** nëse keni një skedar `.env` gati).

### Mënyra A – Shtim manual

- **Key:** `DATABASE_URL`
- **Value:** connection string i Postgres (p.sh. `postgresql://user:password@host:5432/database?sslmode=require`)
- **Environments:** zgjidhni të paktën **Production** (dhe **Preview** nëse doni).
- Klikoni **Save**.

### Mënyra B – Import .env

1. Klikoni **Import .env** në modalin “Add Environment Variable”.
2. Hapni skedarin `.env.example` nga projekti, zëvendësoni vlerën e `DATABASE_URL` me connection string **të vërtetë** nga hapi 1 (mbajeni formatin `DATABASE_URL="postgresql://..."`).
3. Kopjoni tërë përmbajtjen dhe ngjiteni aty ku Vercel kërkon (ose ngarkoni skedarin).
4. Ruani dhe zgjidhni **Environments** (Production / Preview).

## 3. Sinkronizoni tabelat (një herë)

Pas shtimit të `DATABASE_URL`, duhet të krijohen tabelat në databazën e re. Në terminal (me projektin e hapur):

```bash
npx prisma db push
```

Para ekzekutimit, vendosni `DATABASE_URL` në mjedisin tuaj (p.sh. kopjojeni në `.env` lokal ose ekzekutoni):

```bash
DATABASE_URL="postgresql://..." npx prisma db push
```

(Përdorni të njëjtin connection string që shtuat në Vercel.)

## 4. Redeploy

Në Vercel, bëni **Redeploy** të deployment-it (Deployments → ... → Redeploy). Pas kësaj, ruajtja e përdoruesve duhet të funksionojë.

---

**Shënim:** Lokalisht projekti tani pret një **Postgres** (përmes `DATABASE_URL`). Për dev lokal, shtoni në `.env` një `DATABASE_URL` që tregon te një Postgres lokal ose te një instance falas (Neon, Supabase, etj.).

---

## Email (opsional) – njoftim për assign

Kur admini assignon një punonjës (një ditë ose bulk), mund të dërgohet email tek puntori. Aplikacioni përdor **Resend** (https://resend.com). Nëse nuk vendosni `RESEND_API_KEY`, assignimet ruhen normalisht por nuk dërgohet email.

Në **Vercel** (ose në `.env` lokal) shtoni:

- `RESEND_API_KEY` – API key nga Resend (Dashboard → API Keys)
- `RESEND_FROM` (opsional) – adresa “From”; për testim përdoret `onboarding@resend.dev`; për prodhim verifiko një domen në Resend dhe përdor p.sh. `OD Scheduler <noreply@domeni juaj.com>`

Pa `RESEND_API_KEY`, dërgoja e emailit nuk aktivizohet dhe nuk jep gabim.
