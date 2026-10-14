// 1. Paste the web-app settings from Firebase console > Project settings > Your apps.
//    You can reuse the AV scheduler's Firebase project; this site keeps its data in its
//    own collections (hm_config and hm_events), so nothing overlaps.
window.FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

// 2. The email of the manager account you create in Firebase > Authentication > Users.
//    The manager page only asks for that account's password.
//    Use the same email in firestore.rules.
window.MANAGER_EMAIL = "manager-email@example.com";
