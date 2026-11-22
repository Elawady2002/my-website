import { SmoothExperience } from "@/components/SmoothExperience";
import { PreloaderIntro } from "@/components/PreloaderIntro";
import { HeaderStage } from "@/components/HeaderStage";
import { AboutSection } from "@/components/AboutSection";
import { WorkSection } from "@/components/WorkSection";
import { CertificatesSection } from "@/components/CertificatesSection";
import { FooterSection } from "@/components/FooterSection";
import { BottomNav } from "@/components/BottomNav";

export default function HomePage() {
  return (
    <SmoothExperience>
      <PreloaderIntro />
      <main className="bg-[#0b0b0b] text-[#e7e1d7]">
        <HeaderStage />
        <AboutSection />
        <WorkSection />
        <CertificatesSection />
        <FooterSection />
        <BottomNav />
      </main>
    </SmoothExperience>
  );
}
