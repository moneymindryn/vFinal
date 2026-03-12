import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB-of3UVG84OyImqbm-1XWxMTebaS0BgrY",
  authDomain: "pixi-mart.firebaseapp.com",
  projectId: "pixi-mart",
  storageBucket: "pixi-mart.firebasestorage.app",
  messagingSenderId: "890277623240",
  appId: "1:890277623240:web:6b31af94fb2dfaef3f3cfd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
