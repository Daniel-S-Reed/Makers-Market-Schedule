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
| `firestore.rules` | **You paste this into Firebase:** who can read and change what (the whole file) |

## Setup (about 15 minutes)

This site uses its own Firebase project, separate from anything else you run. The free Spark plan is plenty.

1. **Create the project.** Go to [console.firebase.google.com](https://console.firebase.google.com), click **Add project** (or **Create a project**) and name it something like `makers-market-schedule`. Google Analytics isn't needed, so you can turn it off.
2. **Add a web app.** On the project overview, click the **</>** (Web) icon, give it a nickname (for example `sign-up site`), leave Firebase Hosting unchecked (GitHub Pages hosts the site), and click **Register app**. Copy the `firebaseConfig` values it shows into `firebase-config.js`.
3. **Create the database.** Go to **Build → Firestore Database → Create database**. Pick a location near you (for example `us-east1`) and start in **production mode**.
4. **Paste the rules.** In **Firestore Database → Rules**, replace everything with the contents of `firestore.rules`, put your manager email where it says `MANAGER_EMAIL_HERE`, and click **Publish**.
5. **Turn on sign-in.** Go to **Build → Authentication → Get started → Sign-in method** and enable **Anonymous** (volunteers sign in invisibly) and **Email/Password** (the manager).
6. **Create the manager account.** Go to **Authentication → Users → Add user**. Use an email you control and a strong password. That password is the manager page password, so share it only with people who should manage the schedule. Put the same email in `MANAGER_EMAIL` in `firebase-config.js`.
7. **Allow your site's address.** Go to **Authentication → Settings → Authorized domains → Add domain** and add `daniel-s-reed.github.io`.
8. **Publish the config.** Commit the filled-in `firebase-config.js` to the repo. It's fine for these keys to be public, but never put the password in the repo.
9. **Set up the event.** Open `manager.html`, enter the password, go to **Years** and click **Set up from the original schedule**. Then, in **Set up**, enter the date and location and click **Save**.

To change the password later: Firebase console → Authentication → Users → the manager account → Reset password.

## How the protection works

The password isn't checked by the page itself, since anyone can read a website's code. It signs in to the Firebase manager account, and the database rules only let that account change the setup or read the history. Volunteers can sign up, remove names and add history entries, but they can't read the history or edit the schedule.

## Next year

Manager page → **Years** → **Start next year**. Check the name and date, then click **Create next year**. Every shift, position, time and vendor window is copied with no names. Adjust anything in **Set up**. Last year stays under **Years** with its sign-ups and history. Use the **Year / event** menu at the top to look back at it.
