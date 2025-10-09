// src/lib/firestore.ts
import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// 型（必要に応じて調整OK）
export type ProfilePayload = {
  ageGroup?: string;
  weight?: string;
  height?: string;
  experience?: string;
  goals?: string[];
  barriers?: string[];
  targetAreas?: string[];
  frequency?: string;
  schedule?: string[];
  duration?: string;
  motivation?: string;
};

// プロフィール保存（merge:true で上書き保存に対応）
export async function saveProfile(uid: string, data: ProfilePayload) {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      ...data,
      goals: data.goals ?? [],
      barriers: data.barriers ?? [],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(), // 初回は同値、2回目以降は上書きされてもOKならこのままで
    },
    { merge: true }
  );
}

// ワークアウト履歴の追加
export async function appendWorkoutLog(
  uid: string,
  entry: {
    date: string; // "YYYY-MM-DD"
    items: Array<{
      exercise: string;
      reps: number | string;
      weight?: number | string;
      completed?: boolean;
    }>;
  }
) {
  const colRef = collection(db, "users", uid, "workouts");
  await addDoc(colRef, {
    ...entry,
    createdAt: serverTimestamp(),
  });
}