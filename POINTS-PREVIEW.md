# Points and monthly wheel preview

Run npm ci, then npm run dev:points. Open the local URL shown by Vite.
The preview signs in as Demo Admin and uses fictional browser-local data for all sections.
Open Management → Points & ranking or Ticket wheel.
npm run dev keeps the existing authentication and server API.
npm run build disables the preview, including when VITE_POINTS_DEMO is true.

Points & ranking groups pending and validated events by date, for the current
and previous month in Europe/Zurich. Open a row to review the roster and roles.
Association participants and organisers earn 2 points, external participants
earn 3, and external organisers earn 4. Event points count after validation.

The monthly ranking supports +1 and −1 corrections for either displayed month.
One positive point gives one ticket. Each monthly wheel supports removing a
winner from subsequent draws and restoring them. Exclusions are saved locally
per month and affect draw eligibility. Names follow the radius of their slice.
Older activity data is retained.

The points feature is development-only until backend integration is implemented.
Production integration needs persistent event roles, validations, manual point records,
server-side scoring and shared monthly draw data.
