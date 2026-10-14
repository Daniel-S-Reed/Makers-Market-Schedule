# Holiday Maker's Market sign-up site

Two pages for GitHub Pages, with Firebase behind them:

- **`index.html`: the sign-up page.** Volunteers type their name and tap **Sign up**. They never log in. Anyone can also remove a name.
- **`manager.html`: the manager page,** locked with a password. It has four tabs:
  - **Changes:** every sign-up and removal, who removed each name, and who replaced them (or whether the slot is still open)
  - **Coverage:** open slots by area, plus the Everyone's assignments PDF
  - **Set up:** edit the event name, date and location, areas, shifts, times, positions, vendor windows, agenda and footnote
  - **Years:** start next year by copying this year's setup (no names), switch which year is live, and look back at past years

If you open the pages before filling in `firebase-config.js`, they run in **preview mode**. Everything works and is saved only in that browser, and any password unlocks the manager page.

## Files

| File | What it is |
|---|---|
| `index.html` | Sign-up page |
| `manager.html` | Manager page |
| `shared.js` | Schedule logic, PDFs, calendar file, Firebase connection |
| `styles.css` | Look of both pages |
| `firebase-config.js` | **You fill this in:** Firebase keys and the manager email |
| `firestore.rules` | **You paste this into Firebase:** who can read and change what |

## Setup (about 15 minutes)

You can reuse the AV scheduler's Firebase project. This site keeps its data in its own collections (`hm_config`, `hm_events`), so the two never touch.

1. **Firebase console → Authentication → Sign-in method:** turn on **Anonymous** (volunteers, invisible to them) and **Email/Password** (the manager).
2. **Authentication → Users → Add user:** create the manager account. Use any email you control and a strong password. That password is the manager page password. Share it only with people who should manage the schedule.
3. **Authentication → Settings → Authorized domains:** make sure your GitHub Pages domain (`yourname.github.io`) is listed.
4. **Firestore → Rules:** paste the contents of `firestore.rules` *inside* your existing `match /databases/{database}/documents { … }` block, next to the AV rules (don't replace them). Put the manager email where it says `MANAGER_EMAIL_HERE`. Publish.
5. **Project settings → Your apps → Web app:** copy the config values into `firebase-config.js` and set `MANAGER_EMAIL` to the same email.
6. Upload all six files to a GitHub repo (or a folder in one) and turn on **Settings → Pages**.
7. Open `manager.html`, enter the password, go to **Years** and click **Set up from the original schedule**. Then, in **Set up**, enter the date and location and click **Save**.

To change the password later: Firebase console → Authentication → Users → the manager account → Reset password.

## How the protection works

The password isn't checked by the page itself, since anyone can read a website's code. It signs in to the Firebase manager account, and the database rules only let that account change the setup or read the history. Volunteers can sign up, remove names and add history entries, but they can't read the history or edit the schedule.

## Next year

Manager page → **Years** → **Start next year**. Check the name and date, then click **Create next year**. Every shift, position, time and vendor window is copied with no names. Adjust anything in **Set up**. Last year stays under **Years** with its sign-ups and history. Use the **Year / event** menu at the top to look back at it.
