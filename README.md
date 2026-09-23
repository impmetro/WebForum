# WebForum

A simple web forum application built with **HTML**, **CSS**, and **ES2015 JavaScript**, using **Firebase Authentication** and **Cloud Firestore**.

## Features

- User registration & login (email + password via Firebase Auth)
- Username stored in Firestore `users` collection
- Categories → Forums → Posts hierarchy
- Create posts (when logged in)
- Real-time data from Firestore
- Clean responsive UI

## Database Collections (Firestore)

| Collection   | Fields |
|--------------|--------|
| `users`      | `uid`, `username`, `email`, `createdAt` |
| `categories` | `name`, `description`, `createdAt` |
| `forums`     | `name`, `description`, `categoryId`, `createdAt` |
| `posts`      | `title`, `content`, `authorId`, `authorName`, `forumId`, `createdAt` |

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Create a **Cloud Firestore** database (start in test mode for development)
5. Go to Project Settings → General → Your apps → Add web app
6. Copy the Firebase config object

### 2. Configure the App

Open `js/firebase-config.js` and replace the placeholder with your Firebase config:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Firestore Security Rules (Development)

For testing you can use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    match /categories/{doc} {
      allow read: if true;
    }
    match /forums/{doc} {
      allow read: if true;
    }
    match /posts/{doc} {
      allow read: if true;
      allow create: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Important:** Tighten these rules before going to production.

### 4. Seed Sample Data (optional)

You can add sample categories and forums manually in the Firebase Console, or use the app once logged in (admin features are not included in this basic version).

Example documents:

**categories**
```json
{
  "name": "General",
  "description": "General discussion",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**forums**
```json
{
  "name": "Introductions",
  "description": "Say hello!",
  "categoryId": "<category-doc-id>",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### 5. Run Locally

Because the app uses ES modules and Firebase CDN, the easiest ways are:

- Use any static server, e.g.:
  ```bash
  npx serve .
  # or
  python -m http.server 8000
  ```
- Or deploy to Firebase Hosting / GitHub Pages / Netlify / Vercel.

Open `http://localhost:3000` (or the port your server uses).

## Project Structure

```
WebForum/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js
│   └── app.js
└── README.md
```

## Notes

- Authentication uses Firebase Auth (email/password). Username is stored separately in the `users` collection.
- No Cloud Functions are required for basic auth/token generation — Firebase Auth handles ID tokens automatically.
- The code is written in ES2015+ style (const/let, arrow functions, template literals, promises, modules).

## License

MIT
