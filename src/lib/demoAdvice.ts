import type { Advice } from "./schemas";

type Category = "routine" | "indoor" | "sustainable";

const mk = (
  i: number,
  category: Category,
  title: string,
  step: string,
  why: string,
  metric: string,
  pct: number,
  explanation: string,
) => ({
  id: `demo${i}`,
  category,
  title,
  steps: [step],
  whyItWorks: why,
  effort: "low" as const,
  impact: {
    metric,
    estimatedReductionPercent: pct,
    explanation,
  },
});

const EN_EXPLANATION = "Indicative estimate from published ranges; actual results vary.";
const HI_EXPLANATION = "प्रकाशित अनुमानों पर आधारित संकेतक अनुमान; वास्तविक परिणाम अलग हो सकते हैं।";

export const demoAdviceEn: Advice = {
  healthAlert: "Offline guidance: on high-smog days limit outdoor activity and use an N95/FFP2 mask outdoors.",
  summary: "General guidance shown because live AI advice is temporarily unavailable.",
  actions: [
    mk(1, "routine", "Shift outdoor activity to midday", "Exercise or walk when pollution is lowest, usually in the afternoon.", "Cold morning air traps pollutants near the ground.", "outdoor PM2.5 exposure", 25, EN_EXPLANATION),
    mk(2, "indoor", "Seal gaps and run a purifier", "Close windows in peak smog hours and use door sweeps.", "Cuts infiltration of outdoor particles.", "indoor PM2.5", 40, EN_EXPLANATION),
    mk(3, "sustainable", "Switch to public transport or carpool", "Replace one solo car trip per day.", "Fewer vehicles means lower tailpipe emissions.", "commute emissions", 30, EN_EXPLANATION),
  ],
};

export const demoAdviceHi: Advice = {
  healthAlert: "ऑफ़लाइन मार्गदर्शन: अधिक स्मॉग वाले दिनों में बाहर की गतिविधि सीमित रखें और बाहर निकलते समय N95/FFP2 मास्क पहनें।",
  summary: "लाइव AI सलाह अभी उपलब्ध नहीं है, इसलिए सामान्य मार्गदर्शन दिखाया जा रहा है।",
  actions: [
    mk(1, "routine", "बाहरी गतिविधि दोपहर में करें", "जब प्रदूषण सबसे कम हो, आमतौर पर दोपहर में, तभी व्यायाम या सैर करें।", "ठंडी सुबह की हवा प्रदूषकों को ज़मीन के पास रोके रखती है।", "बाहरी PM2.5 जोखिम", 25, HI_EXPLANATION),
    mk(2, "indoor", "दरारें बंद करें और प्यूरिफ़ायर चलाएँ", "स्मॉग के चरम घंटों में खिड़कियाँ बंद रखें और दरवाज़ों के नीचे डोर स्वीप लगाएँ।", "इससे बाहर के कण घर के अंदर कम आते हैं।", "घर के अंदर PM2.5", 40, HI_EXPLANATION),
    mk(3, "sustainable", "सार्वजनिक परिवहन या कारपूल अपनाएँ", "रोज़ अकेले कार से होने वाली एक यात्रा की जगह साझा या सार्वजनिक साधन चुनें।", "कम वाहन यानी कम धुआँ और कम उत्सर्जन।", "यात्रा से होने वाला उत्सर्जन", 30, HI_EXPLANATION),
  ],
};

/** Kept for backward compatibility (English). */
export const demoAdvice: Advice = demoAdviceEn;

export function getDemoAdvice(language: "en" | "hi" = "en"): Advice {
  return language === "hi" ? demoAdviceHi : demoAdviceEn;
}