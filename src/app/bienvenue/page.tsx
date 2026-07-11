/**
 * /bienvenue, onboarding premiere ouverture (3 ecrans, compte propose).
 */
import type { Metadata } from "next";
import Onboarding from "@/features/onboarding/Onboarding";

export const metadata: Metadata = {
  title: "Bienvenue | Festayre",
};

export default function BienvenuePage() {
  return <Onboarding />;
}
