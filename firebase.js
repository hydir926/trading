import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxqsrggnSSwjuKh4MsV4l4WdhCGTT2NLI",
  authDomain: "trading-b780b.firebaseapp.com",
  projectId: "trading-b780b",
  storageBucket: "trading-b780b.appspot.com",
  messagingSenderId: "946655966659",
  appId: "1:946655966659:web:465e12a9c836930bc9b976",
  measurementId: "G-VTJZS831VT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);