"use client";
import BorderGlow from "@/components/BorderGlow";

export default function GlowCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <BorderGlow
        edgeSensitivity={30}
        glowColor="40 80 80"
        backgroundColor="#0b0b0f"
        borderRadius={20}
        glowRadius={40}
        glowIntensity={1}
        coneSpread={25}
        animated={false}
        colors={["#c084fc", "#f472b6", "#38bdf8"]}
      >
        <div className="p-5">{children}</div>
      </BorderGlow>
    </div>
  );
}