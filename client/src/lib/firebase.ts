// client/src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

function must(name: string, value: string | undefined) {
  if (!value || !String(value).trim()) throw new Error(`Missing env: ${name}`);
  return value;
}

const firebaseConfig = {
  apiKey: "AIzaSyCTQgL-uQxbtyFt_qBWZZNI8hUNy6LxfM0",
  authDomain: "recipe-cost-manager-d00ed.firebaseapp.com",
  projectId: "recipe-cost-manager-d00ed",
  storageBucket: "recipe-cost-manager-d00ed.firebasestorage.app",
  messagingSenderId: "330796360670",
  appId: "1:330796360670:web:1276200e28d3039d8e334f",
  measurementId: "G-CR0C16LGHP"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);