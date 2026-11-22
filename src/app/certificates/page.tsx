import type { Metadata } from "next";
import { CertificatesArchiveView } from "@/components/CertificatesArchiveView";
import { SmoothExperience } from "@/components/SmoothExperience";

export const metadata: Metadata = {
  title: "Certificates — Abdullah Elawady Studio",
  description:
    "Verified UI/UX design, design systems, and Flutter engineering certificates framed in interactive 3D walnut & glass — including stories and program links.",
};

export default function CertificatesPage() {
  return (
    <SmoothExperience>
      <CertificatesArchiveView />
    </SmoothExperience>
  );
}
