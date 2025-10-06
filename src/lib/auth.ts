// src/lib/auth.ts
import { signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

export async function anonymousLogin() {
  try {
    const result = await signInAnonymously(auth);
    console.log("ログイン成功:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("ログイン失敗:", error);
    return null;
  }
}