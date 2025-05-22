// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCM35M8GxzdPaIYIuIKTsY2ZbPBX4Wa4Cg",
  authDomain: "mathgame-db6c5.firebaseapp.com",
  databaseURL: "https://mathgame-db6c5-default-rtdb.firebaseio.com",
  projectId: "mathgame-db6c5",
  storageBucket: "mathgame-db6c5.firebasestorage.app",
  messagingSenderId: "290697657948",
  appId: "1:290697657948:web:598d88156dc306ae01f099",
  measurementId: "G-R4X6DF60LZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);

export { db };
