import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";
import { StylizedText, StylizedWords } from "@/components/ui/StylizedText";
import type { CaseStudyDetail, CaseStudyLiveLink } from "@/data/caseStudies";

function LiveLinkBadge({ link }: { link: CaseStudyLiveLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f34213] px-5 text-[12px] font-medium uppercase tracking-[0.06em] text-[#0b0b0b] transition-colors hover:bg-[#ff5629]"
    >
      <span>{link.label}</span>
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="lg:col-span-4 flex items-baseline gap-3">
      <span className="text-[12px] tabular-nums tracking-[0.08em] text-[#f34213]">
        {number}
      </span>
      <h2 className="text-[14px] uppercase tracking-[0.06em] text-[#e7e1d7]/85">
        <StylizedText text={title} />
      </h2>
    </div>
  );
}

export function CaseStudyView({
  study,
  nextStudy,
}: {
  study: CaseStudyDetail;
  nextStudy: CaseStudyDetail;
}) {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#e7e1d7]">
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-4 pb-8 md:px-6 md:pt-5 md:pb-10 flex items-center justify-between gap-2 pointer-events-none bg-gradient-to-b from-[#0b0b0b] via-[#0b0b0b]/80 to-transparent">
        <Link
          href="/"
          className="voy-glass group pointer-events-auto inline-flex h-[44px] md:h-[50px] items-center gap-2.5 rounded-[14px] px-4 md:px-5 text-[12px] md:text-[13.5px] uppercase tracking-[0.04em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-all duration-200"
        >
          <ArrowLeft
            className="h-4 w-4 text-[#f34213] transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span>Back to Portfolio</span>
        </Link>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/#work"
            className="voy-glass hidden sm:inline-flex h-[44px] md:h-[50px] items-center gap-2 rounded-[14px] px-4 md:px-5 text-[12px] md:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7]/80 hover:text-white hover:border-white/25 transition-colors"
          >
            <span>All Case Studies</span>
          </Link>
          <Link
            href="/#contact"
            className="voy-glass inline-flex h-[44px] md:h-[50px] items-center gap-2 rounded-[14px] px-4 md:px-5 text-[12px] md:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-colors"
          >
            <span>Connect</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#f34213]" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="px-4 sm:px-6 pt-28 sm:pt-36 pb-20 sm:pb-28 max-w-[1320px] mx-auto">
        {/* Hero Block */}
        <section aria-label={`${study.title} overview`} className="pb-12 sm:pb-16">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] uppercase tracking-[0.08em]">
            <span className="tabular-nums text-[#f34213]">
              CASE STUDY · {study.number}
            </span>
            <span className="text-[#e7e1d7]/30">/</span>
            <span className="text-[#e7e1d7]/65">{study.domain}</span>
          </div>

          <h1 className="mt-5 text-[clamp(2.8rem,8.5vw,6.8rem)] leading-[0.88] tracking-[-0.04em] font-normal uppercase text-[#e7e1d7]">
            <StylizedText text={study.title} />
          </h1>

          <p className="mt-6 max-w-[840px] text-[19px] sm:text-[24px] leading-[1.45] font-normal text-[#e7e1d7]/85">
            {study.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {study.liveLinks.map((link) => (
              <LiveLinkBadge key={link.href} link={link} />
            ))}
            <a
              href="#explorations"
              className="voy-glass inline-flex h-10 items-center gap-2 rounded-full px-5 text-[12px] uppercase tracking-[0.06em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-colors"
            >
              <span>Jump to Trade-offs</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#f34213]" aria-hidden="true" />
            </a>
          </div>

          {/* 4-Column Metadata Strip */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-[#e7e1d7]/15">
            <div className="py-5 sm:pr-6 border-b sm:border-b lg:border-b-0 lg:border-r border-[#e7e1d7]/15">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/45">
                ROLE
              </p>
              <p className="mt-2 text-[14px] leading-[1.5] text-[#e7e1d7]">
                {study.role}
              </p>
            </div>
            <div className="py-5 sm:pl-6 lg:px-6 border-b sm:border-b lg:border-b-0 lg:border-r border-[#e7e1d7]/15">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/45">
                PLATFORM & MARKET
              </p>
              <p className="mt-2 text-[14px] leading-[1.5] text-[#e7e1d7]">
                {study.platform} · {study.market}
              </p>
            </div>
            <div className="py-5 sm:pr-6 lg:px-6 border-b sm:border-b-0 lg:border-r border-[#e7e1d7]/15">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/45">
                STATUS
              </p>
              <p className="mt-2 text-[14px] leading-[1.5] text-[#e7e1d7]">
                {study.status}
              </p>
            </div>
            <div className="py-5 sm:pl-6">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/45">
                CORE FOCUS
              </p>
              <p className="mt-2 text-[14px] leading-[1.5] text-[#e7e1d7]">
                {study.timeline}
              </p>
            </div>
          </div>

          {/* 4-Column Executive TL;DR Strip */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-5">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#f34213]">
                TL;DR · PROBLEM
              </p>
              <p className="mt-2.5 text-[14px] leading-[1.6] text-[#e7e1d7]/80">
                {study.summary.problemBrief}
              </p>
            </div>
            <div className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-5">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#f34213]">
                TL;DR · OWNERSHIP
              </p>
              <p className="mt-2.5 text-[14px] leading-[1.6] text-[#e7e1d7]/80">
                {study.summary.roleScope}
              </p>
            </div>
            <div className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-5">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#f34213]">
                TL;DR · OUTCOME
              </p>
              <p className="mt-2.5 text-[14px] leading-[1.6] text-[#e7e1d7]/80">
                {study.summary.keyOutcome}
              </p>
            </div>
            <div className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-5">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#f34213]">
                TL;DR · DELIVERABLES
              </p>
              <p className="mt-2.5 text-[14px] leading-[1.6] text-[#e7e1d7]/80">
                {study.summary.deliverables}
              </p>
            </div>
          </div>
        </section>

        {/* Visual Product Showcase */}
        <section aria-label="Product showcase" className="pb-14 sm:pb-20">
          <div
            style={{ backgroundColor: study.stageBg }}
            className="relative overflow-hidden rounded-[22px] border border-[#e7e1d7]/12 p-5 sm:p-10 lg:p-12"
          >
            <Image
              src={study.media.bgImage}
              alt=""
              fill
              sizes="(max-width: 1320px) 100vw, 1320px"
              className="object-cover opacity-35 pointer-events-none select-none"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0b0b]/75 via-[#0b0b0b]/25 to-[#0b0b0b]/55"
            />

            <div className="relative z-10">
              {study.media.layout === "mobile" && study.media.mobileScreens ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-center justify-items-center max-w-[980px] mx-auto">
                  {study.media.mobileScreens.map((src, idx) => (
                    <div
                      key={src}
                      className="w-full max-w-[260px] aspect-[462/978] relative rounded-[28px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
                    >
                      <Image
                        src={src}
                        alt={`${study.title} mobile interface screen ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 260px, 28vw"
                        className="object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-[1040px] mx-auto overflow-hidden rounded-2xl border border-[#e7e1d7]/15 bg-[#0b0b0b] shadow-[0_28px_72px_rgba(0,0,0,0.72)]">
                  <div className="relative aspect-[1280/784] w-full">
                    {study.media.videoSrc ? (
                      <video
                        src={study.media.videoSrc}
                        poster={study.media.posterSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : study.media.posterSrc ? (
                      <Image
                        src={study.media.posterSrc}
                        alt={`${study.title} product showcase`}
                        fill
                        sizes="(max-width: 1040px) 100vw, 1040px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 01 Context & Problem */}
        <section className="py-12 sm:py-16 border-t border-[#e7e1d7]/15 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <SectionHeading number="01" title="CONTEXT & PROBLEM" />
          <div className="lg:col-span-8 space-y-6">
            <p className="text-[16px] sm:text-[18px] leading-[1.7] text-[#e7e1d7]/80">
              {study.context}
            </p>
            <div className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-6 sm:p-7 space-y-4">
              <h3 className="text-[20px] sm:text-[24px] leading-[1.3] font-normal text-[#e7e1d7]">
                {study.problem.headline}
              </h3>
              <p className="text-[15px] sm:text-[16px] leading-[1.7] text-[#e7e1d7]/75">
                {study.problem.body}
              </p>
              <ul className="pt-2 space-y-2.5">
                {study.problem.painPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-[14.5px] sm:text-[15px] leading-[1.6] text-[#e7e1d7]/85"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f34213]"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 02 Why It Mattered */}
        <section className="py-12 sm:py-16 border-t border-[#e7e1d7]/15 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <SectionHeading number="02" title="WHY IT MATTERED" />
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-6">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/45">
                USER IMPACT
              </p>
              <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.65] text-[#e7e1d7]/85">
                {study.whyItMattered.userImpact}
              </p>
            </div>
            <div className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-6">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/45">
                BUSINESS STAKES
              </p>
              <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.65] text-[#e7e1d7]/85">
                {study.whyItMattered.businessStakes}
              </p>
            </div>
          </div>
        </section>

        {/* 03 Constraints & Discovery */}
        <section className="py-12 sm:py-16 border-t border-[#e7e1d7]/15 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <SectionHeading number="03" title="CONSTRAINTS & DISCOVERY" />
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {study.constraints.map((constraint, idx) => (
                <div
                  key={constraint}
                  className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-5"
                >
                  <span className="text-[11px] tabular-nums tracking-[0.08em] text-[#f34213]">
                    CONSTRAINT 0{idx + 1}
                  </span>
                  <p className="mt-2 text-[14.5px] sm:text-[15px] leading-[1.6] text-[#e7e1d7]/85">
                    {constraint}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 Explorations & Trade-offs */}
        <section
          id="explorations"
          className="scroll-mt-24 py-12 sm:py-16 border-t border-[#e7e1d7]/15 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
        >
          <SectionHeading number="04" title="EXPLORATIONS & TRADE-OFFS" />
          <div className="lg:col-span-8 space-y-4">
            {study.explorations.map((exp) => {
              const isChosen = exp.verdict === "Chosen";
              return (
                <div
                  key={exp.label}
                  className={`rounded-2xl border p-6 transition-colors ${
                    isChosen
                      ? "border-[#f34213]/45 bg-[#191210]"
                      : "border-[#e7e1d7]/12 bg-[#121110]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-[16px] sm:text-[18px] font-medium text-[#e7e1d7]">
                      {exp.label}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.07em] font-medium ${
                        isChosen
                          ? "bg-[#f34213] text-[#0b0b0b]"
                          : "bg-white/[0.06] text-[#e7e1d7]/65"
                      }`}
                    >
                      {isChosen ? (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {exp.verdict}
                    </span>
                  </div>
                  <p className="mt-3 text-[14.5px] sm:text-[15px] leading-[1.6] text-[#e7e1d7]/70">
                    <span className="text-[#e7e1d7] font-medium">Approach: </span>
                    {exp.approach}
                  </p>
                  <p className="mt-2 text-[14.5px] sm:text-[15px] leading-[1.6] text-[#e7e1d7]/85">
                    <span className="text-[#e7e1d7] font-medium">Trade-off: </span>
                    {exp.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 05 Key Design Decisions */}
        <section className="py-12 sm:py-16 border-t border-[#e7e1d7]/15 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <SectionHeading number="05" title="KEY DESIGN DECISIONS" />
          <div className="lg:col-span-8 space-y-5">
            {study.designDecisions.map((decision, idx) => (
              <div
                key={decision.title}
                className="border-b border-[#e7e1d7]/12 pb-5 last:border-b-0 last:pb-0"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-[12px] tabular-nums text-[#f34213]">
                    0{idx + 1}
                  </span>
                  <h3 className="text-[17px] sm:text-[19px] font-medium text-[#e7e1d7]">
                    {decision.title}
                  </h3>
                </div>
                <p className="mt-2 pl-7 text-[15px] sm:text-[16px] leading-[1.65] text-[#e7e1d7]/75">
                  {decision.rationale}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 06 Systems & Engineering Handoff */}
        <section className="py-12 sm:py-16 border-t border-[#e7e1d7]/15 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <SectionHeading number="06" title="SYSTEMS & HANDOFF" />
          <div className="lg:col-span-8 space-y-5">
            <h3 className="text-[20px] sm:text-[23px] font-normal text-[#e7e1d7]">
              {study.systemsAndHandoff.headline}
            </h3>
            <p className="text-[15px] sm:text-[16px] leading-[1.7] text-[#e7e1d7]/80">
              {study.systemsAndHandoff.body}
            </p>
            <ul className="space-y-2.5 pt-1">
              {study.systemsAndHandoff.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[14.5px] sm:text-[15px] leading-[1.6] text-[#e7e1d7]/85"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f34213]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 07 Shipped Outcome & Next Iterations */}
        <section className="py-12 sm:py-16 border-t border-[#e7e1d7]/15 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <SectionHeading number="07" title="OUTCOME & NEXT STEPS" />
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-6 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#f34213]">
                SHIPPED REALITY
              </p>
              <ul className="space-y-3">
                {study.outcomeAndNextSteps.shippedReality.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14.5px] leading-[1.6] text-[#e7e1d7]/85"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#f34213]"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-6 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/55">
                V2 METRICS TO INSTRUMENT
              </p>
              <ul className="space-y-3">
                {study.outcomeAndNextSteps.nextMetricsToTrack.map((metric) => (
                  <li
                    key={metric}
                    className="flex items-start gap-2.5 text-[14.5px] leading-[1.6] text-[#e7e1d7]/80"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e7e1d7]/50"
                    />
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Next Case Study Footer Navigation */}
        <section
          aria-label="Next case study"
          className="pt-12 sm:pt-16 border-t border-[#e7e1d7]/15 space-y-8"
        >
          <Link
            href={`/work/${nextStudy.slug}`}
            className="group block rounded-[22px] border border-[#e7e1d7]/15 bg-[#121110] p-6 sm:p-10 transition-colors hover:border-[#f34213]/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] uppercase tracking-[0.08em] text-[#e7e1d7]/55">
              <span>NEXT CASE STUDY · {nextStudy.number}</span>
              <span className="inline-flex items-center gap-1.5 text-[#f34213]">
                Explore <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
            <h2 className="mt-3 text-[clamp(1.85rem,4.4vw,3.6rem)] leading-[0.98] tracking-[-0.03em] font-normal uppercase text-[#e7e1d7]">
              <StylizedWords text={nextStudy.title} />
            </h2>
            <p className="mt-3 max-w-[720px] text-[15px] sm:text-[17px] leading-[1.6] text-[#e7e1d7]/70">
              {nextStudy.subtitle}
            </p>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/#work"
              className="voy-glass inline-flex h-11 items-center gap-2 rounded-full px-6 text-[12.5px] uppercase tracking-[0.05em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[#f34213]" aria-hidden="true" />
              <span>Back to All Work</span>
            </Link>

            <Link
              href="/#contact"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f34213] px-6 text-[12.5px] font-medium uppercase tracking-[0.05em] text-[#0b0b0b] hover:bg-[#ff5629] transition-colors"
            >
              <span>Book an Intro Call</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
