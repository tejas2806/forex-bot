import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyByOiex4PiLHpc1Lswl2AspSIyvk8xKSjo",
  authDomain: "forex-bot-3a379.firebaseapp.com",
  projectId: "forex-bot-3a379",
  storageBucket: "forex-bot-3a379.firebasestorage.app",
  messagingSenderId: "490165431076",
  appId: "1:490165431076:web:ef31d7b33dbd7f40a6a1b1",
  measurementId: "G-G27FL8M7Q8",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Avoid initializing Analytics twice (Vite HMR resets module state; use window so the guard persists).
declare global {
  interface Window {
    __alphaforgeGa?: boolean
  }
}
if (typeof window !== "undefined" && !window.__alphaforgeGa) {
  window.__alphaforgeGa = true
  getAnalytics(app)
}
