# Demo video plan (about 2 minutes 30)

I cannot record the video for you, so here is the exact run sheet. Follow it top to bottom and
you get a clean take without editing.

## Before you hit record

1. Deploy the app first and use the live link in the video, not `localhost`. It looks far
   better and it lets you scan with a real phone.
2. Delete `attendance.db` (or use a fresh session) so the demo starts empty.
3. Have ready:
   - Laptop, browser at your deployed link, already logged out.
   - Your phone, camera app open, on the same screen recording if you can. If not, film the
     phone with a second device, or just narrate what the phone is doing.
4. Close every other tab. Nobody wants to see your bookmarks.
5. Record with OBS (free), Loom, or the Windows Game Bar (`Win + G`).

## The run sheet

### 0:00 - 0:20 | What it is

> "This is a QR attendance system. Instead of passing a paper sheet around a lecture hall, the
> lecturer puts a QR code on the screen, students scan it, and attendance is recorded
> automatically. The front end is React built with Vite, and the back end is Node and Express
> with a SQLite database."

Show the login page while you say this.

### 0:20 - 0:40 | Log in and create a session

Type the password, log in. On the dashboard, type **CSC 201 - Friday lecture** and press
**Create session and show QR**.

> "The lecturer logs in and starts a session. The app generates a random code for it and turns
> that into a QR code straight away."

### 0:40 - 1:15 | Scan and check in

The QR is now on screen. Pick up your phone, point the camera at it, tap the link.

> "A student just uses the normal phone camera. No app to install. They land on this page,
> which already knows which class it is, so they only type their name and matric number."

Fill in a name and ID on the phone. Tap **Check me in**. Show the green success message.

Now cut back to the laptop and point at the list.

> "And the list on the lecturer's screen updates on its own."

### 1:15 - 1:40 | The rules that make it useful

Try to check in with the **same ID** again on the phone.

> "If the same student ID tries again, it is refused. That is enforced by the database itself,
> not just the page, so nobody can get around it."

Then on the laptop press **Close attendance**, and try one more scan.

> "And once the lecturer closes attendance, late scans are rejected too."

### 1:40 - 2:10 | Records and export

Click **Records** in the menu. Show the full list, then use the dropdown to filter to one
session.

> "Every record is here, and I can filter to a single session."

Press **Download CSV** and open the file.

> "Export gives a CSV that opens straight in Excel, so it can be handed in or kept as a record."

### 2:10 - 2:30 | Close

Show the `/scan` page briefly, and the code in your editor for two or three seconds.

> "There is also a scanner page for laptops without a camera app. The whole thing is a React
> front end talking to an Express API, with a SQLite database of two tables behind it. Thanks
> for watching."

## Small things that make it look sharper

- Zoom the browser to about 125% so text is readable in the video.
- Pause for a second after each click before you speak, instead of talking over your own
  loading screens.
- If you fluff a line, stop, count to three, and repeat the sentence. Cut the gap later, or
  just leave it, it is fine.
- Keep it under three minutes even if you have to drop the `/scan` page bit.
