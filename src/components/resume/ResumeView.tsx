"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download } from "lucide-react";
import { StylizedText } from "@/components/ui/StylizedText";
import { CASE_STUDIES, CASE_STUDY_SLUGS } from "@/data/caseStudies";
import { siteConfig } from "@/data/site";

const CORE_SKILLS = [
  "Product Design",
  "UX Architecture",
  "Design Systems (Figma Variables)",
  "Interaction & Prototyping",
  "User Flows",
  "Arabic RTL & Bilingual UX",
  "Flutter / Front-end Fluency",
  "AI-Assisted Prototyping",
] as const;

export function ResumeView() {
  const { roles, recognition } = siteConfig.experienceSection;
  const { phoneValue, phoneHref, mailValue, mailHref, socials } =
    siteConfig.contactSection;
  const linkedInSocial = socials.find((s) => s.label === "LINKEDIN");
  const githubSocial = socials.find((s) => s.label === "GITHUB");

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#e7e1d7] print:min-h-0 print:bg-white print:text-[#111111]">
      <header
        data-no-print=""
        className="fixed inset-x-0 top-0 z-50 px-3 pt-4 pb-8 md:px-6 md:pt-5 md:pb-10 flex items-center justify-between gap-2 pointer-events-none bg-gradient-to-b from-[#0b0b0b] via-[#0b0b0b]/80 to-transparent"
      >
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
            <span>Case Studies</span>
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="voy-glass inline-flex h-[44px] md:h-[50px] items-center gap-2 rounded-[14px] px-4 md:px-5 text-[12px] md:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7] hover:text-white hover:border-white/25 hover:!bg-white/[0.08] transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#f34213]" aria-hidden="true" />
            <span>Download PDF</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-4 sm:px-6 pt-28 sm:pt-36 pb-20 sm:pb-28 print:max-w-none print:px-0 print:pt-0 print:pb-0">
        {/* Header Block */}
        <section className="pb-8 border-b border-[#e7e1d7]/20 print:pb-5 print:border-black/20">
          <p className="text-[12px] uppercase tracking-[0.08em] text-[#f34213] print:text-[#111111] print:font-semibold">
            CURRICULUM VITAE
          </p>

          <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.92] tracking-[-0.035em] font-normal uppercase text-[#e7e1d7] print:text-[28pt] print:font-bold print:tracking-tight print:text-black">
            <StylizedText text="ABDULLAH ELAWADY" />
          </h1>

          <p className="mt-3 text-[15px] sm:text-[17px] text-[#e7e1d7]/80 print:mt-1.5 print:text-[11pt] print:text-[#222222]">
            Senior Product Designer · Cairo, Egypt (Open to Remote / MENA)
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#e7e1d7]/75 print:mt-3 print:gap-x-4 print:text-[9.5pt] print:text-[#333333]">
            <a
              href={mailHref}
              className="hover:text-[#f34213] transition-colors print:text-[#111111]"
            >
              {mailValue.toLowerCase()}
            </a>
            <span aria-hidden="true" className="text-[#e7e1d7]/25 print:text-black/30">
              ·
            </span>
            <a
              href={phoneHref}
              className="hover:text-[#f34213] transition-colors print:text-[#111111]"
            >
              {phoneValue}
            </a>
            {linkedInSocial ? (
              <>
                <span aria-hidden="true" className="text-[#e7e1d7]/25 print:text-black/30">
                  ·
                </span>
                <a
                  href={linkedInSocial.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#f34213] transition-colors print:text-[#111111]"
                >
                  LinkedIn
                </a>
              </>
            ) : null}
            {githubSocial ? (
              <>
                <span aria-hidden="true" className="text-[#e7e1d7]/25 print:text-black/30">
                  ·
                </span>
                <a
                  href={githubSocial.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#f34213] transition-colors print:text-[#111111]"
                >
                  GitHub
                </a>
              </>
            ) : null}
            <span aria-hidden="true" className="text-[#e7e1d7]/25 print:text-black/30">
              ·
            </span>
            <Link
              href="/"
              className="hover:text-[#f34213] transition-colors print:text-[#111111]"
            >
              my-website-neon-ten-94.vercel.app
            </Link>
          </div>
        </section>

        {/* Summary */}
        <section className="py-8 border-b border-[#e7e1d7]/15 print:py-4 print:border-black/15">
          <h2 className="text-[12px] uppercase tracking-[0.08em] text-[#e7e1d7]/50 print:text-[9pt] print:font-semibold print:text-[#444444]">
            SUMMARY
          </h2>
          <p className="mt-3 text-[15.5px] sm:text-[17px] leading-[1.65] text-[#e7e1d7]/85 print:mt-1.5 print:text-[10.2pt] print:leading-[1.5] print:text-[#111111]">
            Product Designer specializing in end-to-end mobile and web products across
            mobility, marketplaces, and consumer platforms, taking products from
            problem discovery and scalable Figma design systems through production
            launch. Hands-on fluency in Flutter, front-end code, and AI-assisted
            prototyping accelerates interactive validation and eliminates engineering
            handoff friction.
          </p>
        </section>

        {/* Experience */}
        <section className="py-8 border-b border-[#e7e1d7]/15 print:py-4 print:border-black/15">
          <h2 className="text-[12px] uppercase tracking-[0.08em] text-[#e7e1d7]/50 print:text-[9pt] print:font-semibold print:text-[#444444]">
            EXPERIENCE
          </h2>

          <div className="mt-5 space-y-8 print:mt-3 print:space-y-4">
            {roles.map((item) => (
              <article key={item.id} className="space-y-2.5 print:space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[17px] sm:text-[19px] font-medium text-[#e7e1d7] print:text-[11pt] print:font-bold print:text-black">
                    {item.role} — {item.company}
                  </h3>
                  <span className="text-[12px] uppercase tracking-[0.06em] text-[#e7e1d7]/55 print:text-[9pt] print:text-[#444444]">
                    {item.scope} · {item.location}
                  </span>
                </div>

                <p className="text-[14.5px] sm:text-[15.5px] leading-[1.6] text-[#e7e1d7]/80 print:text-[9.8pt] print:leading-[1.45] print:text-[#222222]">
                  {item.summary}
                </p>

                <ul className="space-y-1.5 pt-1 print:space-y-0.5 print:pt-0.5">
                  {item.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-2.5 text-[14px] leading-[1.55] text-[#e7e1d7]/70 print:text-[9.5pt] print:leading-[1.4] print:text-[#222222]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#f34213] print:bg-black"
                      />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Selected Shipped Products */}
        <section className="py-8 border-b border-[#e7e1d7]/15 print:py-4 print:border-black/15">
          <h2 className="text-[12px] uppercase tracking-[0.08em] text-[#e7e1d7]/50 print:text-[9pt] print:font-semibold print:text-[#444444]">
            SELECTED SHIPPED PRODUCTS & CASE STUDIES
          </h2>

          <div className="mt-4 divide-y divide-[#e7e1d7]/10 print:mt-2 print:divide-black/10">
            {CASE_STUDY_SLUGS.map((slug) => {
              const study = CASE_STUDIES[slug];
              return (
                <div
                  key={slug}
                  className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5 print:py-1.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/work/${slug}`}
                      className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#e7e1d7] hover:text-[#f34213] transition-colors print:text-[10pt] print:text-black"
                    >
                      <span>{study.title}</span>
                      <ArrowUpRight
                        data-no-print=""
                        className="h-3.5 w-3.5 text-[#f34213]"
                        aria-hidden="true"
                      />
                    </Link>
                    <span className="text-[13.5px] text-[#e7e1d7]/70 print:text-[9.3pt] print:text-[#222222]">
                      {" "}
                      — {study.domain}
                    </span>
                  </div>
                  <span className="text-[12px] uppercase tracking-[0.05em] text-[#e7e1d7]/55 shrink-0 print:text-[8.8pt] print:text-[#444444]">
                    {study.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Core Skills & Tools */}
        <section className="py-8 border-b border-[#e7e1d7]/15 print:py-4 print:border-black/15">
          <h2 className="text-[12px] uppercase tracking-[0.08em] text-[#e7e1d7]/50 print:text-[9pt] print:font-semibold print:text-[#444444]">
            CORE SKILLS & TOOLS
          </h2>

          <p className="mt-3 text-[14.5px] sm:text-[15.5px] leading-[1.7] text-[#e7e1d7]/85 print:mt-1.5 print:text-[9.8pt] print:leading-[1.45] print:text-[#111111]">
            {CORE_SKILLS.join(" · ")}
          </p>
        </section>

        {/* Recognition & Credentials */}
        <section className="py-8 print:py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[12px] uppercase tracking-[0.08em] text-[#e7e1d7]/50 print:text-[9pt] print:font-semibold print:text-[#444444]">
              RECOGNITION & CREDENTIALS
            </h2>
            <Link
              data-no-print=""
              href="/certificates"
              className="inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.06em] text-[#f34213] hover:text-[#ff5629] transition-colors"
            >
              <span>Archive</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-4 space-y-2.5 print:mt-2 print:space-y-1">
            {recognition.map((rec) => (
              <li
                key={rec.id}
                className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 text-[14px] print:text-[9.5pt]"
              >
                <span className="text-[#e7e1d7]/85 print:text-[#111111]">
                  <strong className="font-medium text-[#e7e1d7] print:font-semibold print:text-black">
                    {rec.title}
                  </strong>{" "}
                  — {rec.subtitle}
                </span>
                <span className="text-[12px] uppercase tracking-[0.05em] text-[#e7e1d7]/50 shrink-0 print:text-[8.8pt] print:text-[#444444]">
                  {rec.issuer}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
