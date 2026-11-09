# Points and monthly wheel preview

Run npm ci, then npm run dev:points. Open the local URL shown by Vite.
The preview signs in as Demo Admin and uses fictional browser-local data for all sections.
Open Management → Points & ranking or Ticket wheel.
npm run dev keeps the existing authentication and server API.
npm run build disables the preview, including when VITE_POINTS_DEMO is true.

Each event has one role per person. Participant +2. Association organiser +1,
or +2 with four participants. External organiser +3 with four participants, otherwise 0.
Validated points and manual additions feed the ranking.
Event dates determine monthly tickets in Europe/Zurich.
The wheel shows the current and previous month. One point gives one ticket.
Manual additions require a person, a month, an integer and a reason.
A new month starts its own tickets automatically. Older data is retained.

The points feature is development-only until backend integration is implemented.
Production integration needs persistent event roles, validations, manual point records,
server-side scoring and shared monthly draw data.

## Using a staging API

Set VITE_POINTS_ENABLED=true and VITE_API_URL to the staging API URL, then
restart Vite or rebuild the frontend. The backend must include the admin points
routes and have the points migration applied. Sign in as an admin to access the
connected pages. The fictional preview remains available with npm run dev:points.
