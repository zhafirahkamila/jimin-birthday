import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsTqCHnOg2jFEOLMFUCsZ0NHBEDVBl6rU",
  authDomain: "jimin-website.firebaseapp.com",
  projectId: "jimin-website",
  storageBucket: "jimin-website.firebasestorage.app",
  messagingSenderId: "959415353334",
  appId: "1:959415353334:web:5d0a646f7aa2f6678651d7",
  measurementId: "G-4Y4RG3YG2F"
};

export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
