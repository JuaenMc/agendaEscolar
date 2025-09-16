// firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Suas informações de configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAYAvopPN46_iL-igym_Cu533hoavlGtTA",
  authDomain: "agenda-escolar-6aeab.firebaseapp.com",
  projectId: "agenda-escolar-6aeab",
  storageBucket: "agenda-escolar-6aeab.firebasestorage.app",
  messagingSenderId: "72745665061",
  appId: "1:72745665061:web:fe145e9b714a97cb87f5cc"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore
const db = getFirestore(app);

export { db };