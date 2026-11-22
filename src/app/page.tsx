import { BottomNav } from "@/components/layout/BottomNav";
import { PreloaderIntro } from "@/components/layout/PreloaderIntro";
import { SmoothExperience } from "@/components/layout/SmoothExperience";
import { AboutSection } from "@/components/sections/AboutSection";
import { CertificatesSection } from "@/components/sections/CertificatesSection";
import { FooterSection } from "@/components/sections/FooterSection";
import { HeaderStage } from "@/components/sections/HeaderStage";
import { WorkSection } from "@/components/sections/WorkSection";

export default function HomePage() {
  return (
    <SmoothExperience>
      <PreloaderIntro />
      <div className="bg-[#0b0b0b] text-[#e7e1d7]">
        <main>
          <HeaderStage />
          <AboutSection />
          <WorkSection />
          <CertificatesSection />
        </main>
        <FooterSection />
        <BottomNav />
      </div>
    </SmoothExperience>
  );
}
