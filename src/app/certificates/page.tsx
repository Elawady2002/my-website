import type { Metadata } from "next";
import { CertificatesArchiveView } from "@/components/certificates/CertificatesArchiveView";
import { SmoothExperience } from "@/components/layout/SmoothExperience";

export const metadata: Metadata = {
  title: "Certificates — Abdullah Elawady Studio",
  description:
    "Verified Product Engineering, design systems, and innovation certificates framed in interactive 3D walnut & glass — with course details and program links.",
};

export default function CertificatesPage() {
  return (
    <SmoothExperience>
      <CertificatesArchiveView />
    </SmoothExperience>
  );
}
