# Daily Routine Checklist With Firebase Sync

This version is a single-file web app for GitHub Pages. Your routine data syncs across devices through Firebase Authentication and Cloud Firestore.

## File To Upload

Upload this file to your GitHub repository:

- `index.html`

The older `app.js` and `styles.css` files are no longer required for this Firebase version.

## Firebase Setup

1. Go to:

   ```text
   https://console.firebase.google.com/
   ```

2. Click `Create a project`.

3. Enter a project name, for example:

   ```text
   daily-routine-checklist
   ```

4. Disable Google Analytics if you do not need it.

5. Click `Create project`.

6. In the Firebase project dashboard, click the web icon:

   ```text
   </> 
   ```

7. Register the app with a nickname, for example:

   ```text
   Daily Routine Web
   ```

8. Firebase will show a `firebaseConfig` object. Copy those values.

9. Open `index.html` and replace this block:

   ```js
   const firebaseConfig = {
     apiKey: "PASTE_YOUR_API_KEY_HERE",
     authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "PASTE_YOUR_PROJECT_ID",
     storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "PASTE_YOUR_SENDER_ID",
     appId: "PASTE_YOUR_APP_ID"
   };
   ```

   with the real config from Firebase.

10. In Firebase, open `Authentication`.

11. Click `Get started`.

12. Open the `Sign-in method` tab.

13. Enable `Email/Password`.

14. Click `Save`.

15. In Firebase, open `Firestore Database`.

16. Click `Create database`.

17. Choose `Production mode`.

18. Select the nearest database location.

19. Click `Enable`.

20. Open the `Rules` tab and paste:

   ```text
   rules_version = '2';

   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/routine/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

21. Click `Publish`.

## GitHub Pages Deployment

1. Open your GitHub repository.

2. Delete old `app.js` and `styles.css` if they exist.

3. Upload the new `index.html`.

4. Commit the change.

5. Go to repository `Settings`.

6. Click `Pages`.

7. Set:

   ```text
   Source: Deploy from a branch
   Branch: main
   Folder: /root
   ```

8. Click `Save`.

9. Open your GitHub Pages URL.

10. Create an account from the app using email and password.

After this, the same login will show the same routine data on your phone, laptop, or any browser.

## Data Storage

- GitHub Pages hosts the app UI.
- Firebase Authentication handles login.
- Cloud Firestore stores routine tasks, dropdowns, notes, and daily progress.
- Each user's data is stored under:

  ```text
  users/{userId}/routine/main
  ```
