# QR Attendance

An attendance app where the lecturer puts a QR code on the screen and students scan it with
their phones to sign in.

I built this because attendance in a big class is painful. The sheet takes half the lecture to
go round, and people just sign for their friends who are not even in the building. If the code
is only on the screen for a few minutes, you have to actually be there.

- Live demo: _put your link here once you deploy it_
- Demo video: _put your video link here_
- Password for the demo: `admin123`

## What you can do with it

- Create a session and it gives you a QR code straight away
- Students scan with the normal phone camera, there is no app to download
- They type their name and matric number, and that is it
- Names show up on the lecturer's screen while people are still scanning
- The same matric number cannot sign in twice for one session
- Close attendance when the lecture starts so latecomers cannot scan
- Download the whole thing as a CSV

## What I used

- React with Vite for the front end, and React Router for moving between pages
- Express for the API
- SQLite for the database, through `better-sqlite3`
- `qrcode` to make the QR codes, and `html5-qrcode` to read them with a camera

No Redux and no TypeScript. It is all `useState`, `useEffect` and `fetch`, which was already
enough new stuff for me to be learning at once.

## Running it

You need Node 20.19 or newer.

```bash
npm install
npm run build
npm start
```

Then go to http://localhost:3000 and log in with `admin123`.

`npm run build` is the one that installs and builds the React side. If you skip it the site
just tells you to run it, which happened to me enough times that I made it say so properly.

The database file `attendance.db` makes itself the first time you run the app. Delete it if you
want to start from nothing again.

### If you are actually editing the React code

Rebuilding after every change gets old fast. Open two terminals:

```bash
npm run dev          # the API
npm run dev:client   # React, reloads as you type
```

Then use http://localhost:5173 instead of 3000. Vite passes the `/api` calls through to Express
so both halves still talk to each other. Run `npm run build` when you are finished so port 3000
is up to date again.

### The thing that confused me for ages

Your phone cannot open `localhost`, that address means "this device". So scanning the QR off
your own laptop screen will just fail and it looks like the app is broken.

Easiest fix while testing is to copy the link printed under the QR code and paste it into a new
tab. That does exactly what scanning does. If you want to test with a real phone, find your
laptop IP with `ipconfig` and start it like this:

```bash
BASE_URL=http://192.168.1.5:3000 npm start
```

Both devices have to be on the same wifi. Once it is deployed none of this matters, because
then the QR holds a real address.

## How it fits together

```
server.js     the API, and it also hands out the built React app
db.js         makes the database and the two tables
client/src    the React app
  App.jsx       the list of pages and the login check
  api.js        fetch helpers so the pages are not all repeating themselves
  pages/        Login, Dashboard, SessionPage, Records, Scan, CheckIn
  components/   just the menu bar so far
```

There are two tables. `sessions` holds the title, the 8 letter code that goes in the QR, and
whether it is still open. `attendance` holds one row per student per session.

The bit I am happiest with is that `session_id` and `student_id` are marked UNIQUE together in
the database, so double sign in is blocked by SQLite itself. Even if somebody messes with the
page in dev tools they still cannot get two rows in. The API catches that error and turns it
into a normal "you already checked in" message.

Only the login page and `/s/<code>` are open to everyone. Every other API route checks the
cookie and returns 401 if you are not logged in, so hiding a page in React is not the only
thing keeping it private.

## Putting it online (I used Render, free plan)

1. Push it to GitHub
2. On Render, New > Web Service, and pick the repo
3. Build command is `npm install && npm run build`, start command is `npm start`
4. Under Environment, set `ADMIN_PASSWORD` to something that is not `admin123`, and
   `SESSION_SECRET` to any long random string

There is a `render.yaml` in here so it should pick most of that up on its own.

One catch on the free plan: the disk gets wiped whenever the app redeploys or goes to sleep, so
old records disappear. Fine for showing it off, not fine for real use. To fix it properly you
add a Render disk on a paid plan and set `DB_PATH=/data/attendance.db`, which is why that
setting exists.

The camera scanner page only works on https, but Render gives you that for free. Scanning with
a phone camera works either way since it is only opening a link.

