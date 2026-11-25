import type { Metadata } from "next";
import { SmoothExperience } from "@/components/layout/SmoothExperience";
import { ResumeView } from "@/components/resume/ResumeView";

export const metadata: Metadata = {
  title: "Resume / CV — Abdullah Elawady",
  description:
    "ATS-friendly resume and shipped product design track record for Abdullah Elawady — Senior Product Designer.",
};

export default function ResumePage() {
  return (
    <SmoothExperience>
      <ResumeView />
    </SmoothExperience>
  );
}
