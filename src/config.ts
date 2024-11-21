import { Api } from "./lib/utils.ts";
import config from './app.config.json'

export const backend = new Api(config["local"]);


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBFgQtar5JC-19YxPmkOvGi4PAD7IKuU-U",
  authDomain: "nursind-ea273.firebaseapp.com",
  projectId: "nursind-ea273",
  storageBucket: "nursind-ea273.appspot.com",
  messagingSenderId: "1032431065744",
  appId: "1:1032431065744:web:174a97c7ec21813d035615",
  measurementId: "G-DS5BYRQB3B"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const Operations = ["Policlinico", "Cannizzaro", "Pisa"]

