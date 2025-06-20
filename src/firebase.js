import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDaAsNKw_gqMIWZdFUNT2FcVFkzyoFQNlg",
  authDomain: "dap-an-hdv.firebaseapp.com",
  projectId: "dap-an-hdv",
  storageBucket: "dap-an-hdv.appspot.com", // Sửa lại đúng domain
  messagingSenderId: "529698541336",
  appId: "1:529698541336:web:502dfa3b84290f662e586d",
  measurementId: "G-PSJWKD6W4F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };