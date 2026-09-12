import type { Metadata } from "next";

import { ComingSoon } from "@/components/game/coming-soon";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Community Wars" };

export default function Page() {
  return (
    <ComingSoon
      icon={<ShieldIcon size={38} />}
      title="Community Wars"
      tagline="Your community against another, with everyone's revision adding to the score."
      bullets={[
        "Communities matched against each other",
        "Every member's study contributes to the total",
        "Rewards shared across the winning side",
      ]}
    />
  );
}
