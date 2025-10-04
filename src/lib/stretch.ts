// src/lib/stretch.ts
export type Stretch = {
  key: string;
  name: string;
  when: "warmup" | "cooldown" | "rest";
  seconds?: number;
  howTo?: string;
  image?: string; // 画像URL（あとで差し替えOK）
};

export function getStretches(kind: "warmup" | "cooldown" | "rest"): Stretch[] {
  const all: Stretch[] = [
    // ウォームアップ（軽めダイナミック）
    { key: "hip_circle", name: "ヒップサークル", when: "warmup", seconds: 30, howTo: "股関節を大きく回す" },
    { key: "arm_circle", name: "アームサークル", when: "warmup", seconds: 30, howTo: "肩関節を前後に回す" },
    { key: "inchworm",   name: "インチワーム",   when: "warmup", seconds: 30, howTo: "前屈→歩手→戻るを繰り返し" },

    // クールダウン（静的）
    { key: "hamstring",  name: "ハムストリングストレッチ", when: "cooldown", seconds: 40, howTo: "前屈で太もも裏を伸ばす" },
    { key: "quad",       name: "クワッドストレッチ",      when: "cooldown", seconds: 40, howTo: "立位で片足を持ち太もも前" },
    { key: "pec_door",   name: "ドアストレッチ（胸）",     when: "cooldown", seconds: 40, howTo: "腕を柱につけ胸をひらく" },

    // 休息日（全身リカバリ）
    { key: "cat_cow",    name: "キャット&カウ",   when: "rest", seconds: 60, howTo: "背中を丸めて反らすを繰返し" },
    { key: "child_pose", name: "チャイルドポーズ", when: "rest", seconds: 60, howTo: "お尻を踵に、腕前方へ" },
    { key: "glute_pir",  name: "梨状筋ストレッチ", when: "rest", seconds: 60, howTo: "仰向けで足をかけ膝を引き寄せ" },
  ];
  return all.filter(s => s.when === kind);
}