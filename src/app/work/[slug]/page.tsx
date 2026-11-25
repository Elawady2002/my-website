import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SmoothExperience } from "@/components/layout/SmoothExperience";
import { CaseStudyView } from "@/components/work/CaseStudyView";
import {
  CASE_STUDY_SLUGS,
  getCaseStudyBySlug,
  getNextCaseStudy,
} from "@/data/caseStudies";

export function generateStaticParams() {
  return CASE_STUDY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) {
    return {
      title: "Case Study Not Found — Abdullah Elawady",
    };
  }
  return {
    title: `${study.title} Case Study — Abdullah Elawady`,
    description: study.subtitle,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) {
    notFound();
  }
  const nextStudy = getNextCaseStudy(study.slug);

  return (
    <SmoothExperience>
      <CaseStudyView study={study} nextStudy={nextStudy} />
    </SmoothExperience>
  );
}
