import type { Metadata } from "next";
import AiAppClient from "../../_components/ai/AiAppClient";

// Conversation pages are private — never indexed.
export const metadata: Metadata = {
  title: "AI Study Companion — JW Study",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://jwstudy.org/ai" },
};

export default function AiConversationPage() {
  return <AiAppClient />;
}
