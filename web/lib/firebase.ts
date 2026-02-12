import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyACZSbfiLolGa1gKF19uCnzu77mVSIXEI0",
    authDomain: "cloud-engenheiros.firebaseapp.com",
    projectId: "cloud-engenheiros",
    storageBucket: "cloud-engenheiros.firebasestorage.app",
    messagingSenderId: "923596482018",
    appId: "1:923596482018:web:d633acb36c1b3b319b05bb",
    measurementId: "G-JYVV5ZVS8Z"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
