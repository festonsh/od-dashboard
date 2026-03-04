# Odetaa Dashboard

This is a simple **Next.js (React)** internal scheduling dashboard deployed on Vercel.  
<!-- branch deploy -->

## Scripts

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up the database and create the admin user:
   ```bash
   npm run db:push
   npm run db:seed
   ```
3. Start the dev server: `npm run dev`
4. Open the printed local URL and sign in with the admin account (see `prisma/seed.js` for the default admin email).

## Access (roles)

- **Admin / Management**: Dashboard, Schedule (week grid, assign employees), Projects, Users (add/edit users and set role). Can view all schedules.
- **Employee**: Only “My schedule” (week + day detail, project location and notes). No access to management pages.

Create users from **Users** in the sidebar; set role to **Employee** or **Admin / Management** to control what they see.

For production on Vercel, the main branch is built with `npm run build`. Run the seed on your production DB once to create the admin user.

