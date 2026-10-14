// 1. Paste the web-app settings from your Holiday Maker's Market Firebase project:
//    Firebase console > Project settings > General > Your apps > (web app) > Config.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAaXx4Xd-Cgu5gJMUZAzsZlymfoIYwxUeM",
  authDomain: "makers-market-schedule-e9da9.firebaseapp.com",
  projectId: "makers-market-schedule-e9da9",
  storageBucket: "makers-market-schedule-e9da9.firebasestorage.app",
  messagingSenderId: "720077173556",
  appId: "1:720077173556:web:875a58d591cbef5f382b61"
};
// 2. The email of the manager account you create in Firebase > Authentication > Users.
//    The manager page only asks for that account's password.
//    Use the same email in firestore.rules.
window.MANAGER_EMAIL = "manager-email@example.com";
