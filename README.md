# Daily Routine Checklist

A static web app for tracking checklist-based daily routines. It runs fully in the browser and can be hosted for free with GitHub Pages.

## Features

- 4 digit PIN lock with default PIN `0000`
- PIN change screen with browser storage persistence
- Add, edit, and remove daily routine tasks
- Choose which dropdowns appear for each task
- Create, edit, and delete reusable dropdowns
- Optional dropdown defaults while adding or editing tasks
- Per-task daily completion tracking
- Daily notes
- Calendar button with day, week, month, and year views
- Calendar colour modes:
  - all goals achieved vs not achieved
  - completion gradient based on number of goals achieved
- Excel-compatible `.xls` export with formatted rows, frozen header, dynamic dropdown columns, and completion colouring

## Files

- `index.html` - app structure
- `styles.css` - responsive visual design
- `app.js` - app logic and Excel export

## How To Make It Live On GitHub Pages

1. Create a new public repository in your GitHub account.

2. Upload these files to the repository root:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`

3. Commit the files.

4. Open the repository on GitHub.

5. Go to `Settings`.

6. In the left menu, click `Pages`.

7. Under `Build and deployment`, set:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`

8. Click `Save`.

9. Wait for GitHub Pages to finish publishing. GitHub will show your live URL, usually:

   ```text
   https://your-username.github.io/your-repository-name/
   ```

10. Open the URL. The first PIN is:

   ```text
   0000
   ```

## Important Notes

- This version stores data in the same browser using `localStorage`.
- Your tasks, PIN, dropdowns, notes, and checklist history remain saved after closing the website on the same device and browser.
- If you open the app on another phone, computer, or browser, it will start fresh because there is no online database.
- The PIN protects the UI from casual access on the same browser, but it is not server-grade security.

## Suggested Next Upgrade

If you later want the same data to sync across multiple devices, add a backend such as Firebase, Supabase, or a small Node.js API with authentication.
