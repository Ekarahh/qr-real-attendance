# QR Attendance

A small web app for taking attendance with QR codes. The teacher creates a session, the app
puts a QR code on the screen, students scan it with their phones and type their name and ID,
and the teacher can see the list and download it as a spreadsheet.

I built this because signing a paper attendance sheet in a big class takes forever and it is
easy to sign for a friend.

**Live demo:** _add your deployed link here after following the deploy steps below_
**Demo video:** _add your video link here_

**Login password for the demo:** `admin123`

---

## What it does

- **Create a session** - give it a name like "CSC 201 - Friday lecture" and the app makes a QR code for it.
- **Scan to check in** - a student scans with their normal phone camera, fills in name and ID, done. There is also a `/scan` page with a camera scanner for laptops.
- **No double sign in** - the same student ID cannot be recorded twice for the same session.
- **Open and close attendance** - once the teacher closes a session, late scans are refused.
- **Live list** - the session screen refreshes every 5 seconds so you can watch people come in.
- **Records page** - see everything, or filter down to one session.
- **Export to CSV** - opens straight in Excel or Google Sheets.

## Built with

| Part | What I used |
| --- | --- |
| Front end | React (built with Vite), plain CSS |
| Routing | React Router |
| Back end | Node.js with Express |
| Database | SQLite (through `better-sqlite3`) |
| QR codes | `qrcode` to make them, `html5-qrcode` to read them with a camera |
| Login | `cookie-session` with one shared teacher password |

The React app talks to the Express API with `fetch`. There is no Redux or any other state
library, just `useState` and `useEffect`.

## Running it on your computer

You need Node.js 20.19 or newer.

```bash
git clone <your-repo-url>
cd qr-attendance
npm install          # the Express server
npm run build        # installs the React app and builds it
npm start
```

Then open http://localhost:3000 and log in with `admin123`.

The database file `attendance.db` is created automatically the first time you run it. Delete
that file if you ever want to start over with empty data.

### While you are changing the React code

`npm run build` makes you rebuild after every edit, which is slow. For development, run the
two halves separately in **two terminals**:

```bash
# terminal 1 - the API
npm run dev

# terminal 2 - the React app with instant reloading
npm run dev:client
```

Now use **http://localhost:5173** (Vite), not port 3000. Vite forwards every `/api/...` call
over to Express for you, which is set up in [client/vite.config.js](client/vite.config.js).

When you are done, run `npm run build` again so the version on port 3000 is up to date.

### Testing the scan without a second phone

The QR code points at `http://localhost:3000/s/<code>`, and your phone cannot open `localhost`
on your laptop. Two easy ways around it:

1. Copy the link shown under the QR code and paste it in a new browser tab. That is exactly
   what scanning does.
2. Find your laptop's local IP (`ipconfig` on Windows, `ifconfig` on Mac/Linux) and start the
   app with that address so the QR points at it, for example:
   `BASE_URL=http://192.168.1.5:3000 npm start`. Then your phone can scan it as long as both
   devices are on the same wifi.

Once the app is deployed this is not a problem, because the QR code holds a real public link.

## How to use it

1. Log in at `/login`.
2. Type a session name and press **Create session and show QR**.
3. Put the QR code on the projector, or let students scan it off your laptop screen.
4. Watch names appear in the **Checked in** list.
5. Press **Close attendance** when the class starts, so late scans are refused.
6. Go to **Records**, pick the session, and press **Download CSV**.

## Files in this project

```
server.js              the API, and it also serves the built React app
db.js                  creates the database and the two tables
render.yaml            settings so Render knows how to build and start it

client/                the React app
  index.html
  vite.config.js       includes the proxy used during development
  src/
    main.jsx           starts React and turns on React Router
    App.jsx            the list of pages, and the login check
    api.js             small fetch helpers shared by the pages
    styles.css         all the styling
    components/
      Header.jsx       the menu bar on the teacher pages
    pages/
      Login.jsx
      Dashboard.jsx    create a session, list all sessions
      SessionPage.jsx  the QR code and the live list
      Records.jsx      all records, filter, CSV button
      Scan.jsx         camera scanner for laptops
      CheckIn.jsx      the page the QR code opens on a student's phone
```

Only `/login` and `/s/<code>` can be opened without logging in. Everything else checks with the
server first, and the API returns 401 for anyone who is not logged in, so hiding a page in
React is not the only thing protecting it.

## The database

**sessions**

| column | meaning |
| --- | --- |
| id | number for the session |
| title | what the teacher called it |
| code | the 8 letter code inside the QR, e.g. `K7P2QX9M` |
| is_open | 1 while check in is allowed, 0 once closed |
| created_at | when it was made |

**attendance**

| column | meaning |
| --- | --- |
| id | number for the record |
| session_id | which session this belongs to |
| student_id | matric number the student typed |
| student_name | name the student typed |
| checked_in_at | the exact time they scanned |

`session_id` and `student_id` together are marked UNIQUE, and that is what stops one student
being recorded twice in the same session.

## The API

| Method | Route | Who | What it does |
| --- | --- | --- | --- |
| GET | `/api/me` | anyone | says whether you are logged in |
| POST | `/api/login` | anyone | checks the password |
| POST | `/api/logout` | anyone | clears the cookie |
| POST | `/api/sessions` | teacher | create a session |
| GET | `/api/sessions` | teacher | list sessions |
| GET | `/api/sessions/:id` | teacher | one session plus its QR image |
| POST | `/api/sessions/:id/toggle` | teacher | open or close attendance |
| GET | `/api/public/sessions/:code` | anyone | session name, so the check in page can show it |
| POST | `/api/checkin` | anyone | record attendance |
| GET | `/api/records` | teacher | records, optionally `?session=<id>` |
| GET | `/export.csv` | teacher | download CSV, optionally `?session=<id>` |

Any other address gives back the React app, because React Router deals with pages like
`/records` and `/s/K7P2QX9M` inside the browser.

## Deploying it (Render, free)

1. Push this folder to a GitHub repository.
2. Make an account at https://render.com and click **New > Web Service**.
3. Pick your repository. Render reads `render.yaml`, but if it asks, the settings are:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
4. Add these environment variables under **Environment**:

   | Name | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | a password of your own, not `admin123` |
   | `SESSION_SECRET` | any long random string |

5. Deploy. Render gives you a link like `https://qr-attendance.onrender.com`.

The build step is what turns the React code into plain files in `client/dist`, which Express
then serves. If you forget it, the site shows a message telling you to run the build.

The camera scanner at `/scan` only works over https, which Render gives you for free. Phone
cameras scanning the QR code work either way, because they just open a link.

**One thing to know about the free plan:** the disk is wiped every time the app redeploys or
goes to sleep, so old attendance records will disappear. That is fine for a demo. To keep
records for real, add a Render **Disk** mounted at `/data` on a paid plan and set the
environment variable `DB_PATH=/data/attendance.db`, which is what that variable is for.

## Things I know are not perfect

I kept this to the core features on purpose, but if I kept working on it I would add:

- Real student accounts instead of typing a name each time, so nobody can check in under
  someone else's ID.
- A QR code that changes every 30 seconds, so a student cannot screenshot it and send it to a
  friend who is not in the room.
- An optional location check, to confirm the phone is actually near the classroom.
- Separate logins per teacher instead of one shared password.
- Automated tests. Right now I test by clicking through the app.
