"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type Lenis from "lenis";
import { ArrowLeft, ArrowUpRight, Check, Copy } from "lucide-react";
import { CertificateFrame3D } from "@/components/CertificateFrame3D";
import { StylizedText } from "@/components/StylizedText";
import { siteConfig } from "@/data/site";

export function CertificatesArchiveView() {
  const { certificates } = siteConfig.certificatesSection;
  const totalPadded = String(certificates.length).padStart(2, "0");

  const categories = useMemo(() => {
    const unique = Array.from(new Set(certificates.map((c) => c.category)));
    return ["ALL", ...unique];
  }, [certificates]);

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleCertificates = useMemo(() => {
    if (selectedCategory === "ALL") return certificates;
    return certificates.filter((c) => c.category === selectedCategory);
  }, [certificates, selectedCategory]);

  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#/, "").trim();
    if (!rawHash) return;

    const match = certificates.some((c) => c.id === rawHash);
    if (!match) return;

    // Wait two frames so parent SmoothExperience finishes mounting Lenis and reset
    let timer = 0;
    const raf1 = window.requestAnimationFrame(() => {
      timer = window.setTimeout(() => {
        const target = document.getElementById(rawHash);
        if (!target) return;
        const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
        if (lenis) {
          lenis.scrollTo(target, { offset: -96, duration: 1.0 });
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 60);
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.clearTimeout(timer);
    };
  }, [certificates]);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/certificates#${id}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#e7e1d7]">
      {/* Floating Minimalist Glass Header */}
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-4 pb-8 md:px-6 md:pt-5 md:pb-10 flex items-center justify-between pointer-events-none bg-gradient-to-b from-[#0b0b0b] via-[#0b0b0b]/75 to-transparent">
        <Link
          href="/"
          className="voy-glass group pointer-events-auto inline-flex h-[44px] md:h-[50px] items-center gap-3 rounded-[14px] px-4 md:px-5 text-[12.5px] md:text-[13.5px] uppercase tracking-[0.04em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-all duration-200"
        >
          <ArrowLeft
            className="h-4 w-4 text-[#f34213] transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span className="font-medium tracking-[0.04em]">
            AE<span className="text-[#f34213]">.S</span>
          </span>
          <span className="hidden sm:inline text-[#e7e1d7]/40">·</span>
          <span className="text-[#e7e1d7]/85">Back to Studio</span>
        </Link>

        <Link
          href="/#contact"
          className="voy-glass pointer-events-auto inline-flex h-[44px] md:h-[50px] items-center gap-2 rounded-[14px] px-4 md:px-5 text-[12px] md:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-colors"
        >
          <span>Connect</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#f34213]" aria-hidden="true" />
        </Link>
      </header>

      <main className="px-4 sm:px-6 pt-28 sm:pt-36 pb-20 sm:pb-28 max-w-[1440px] mx-auto">
        {/* Clean Editorial Hero */}
        <section aria-label="Certificates archive header" className="pb-12 sm:pb-16">
          <h1 className="text-[clamp(2.8rem,8.5vw,7.4rem)] leading-[0.88] tracking-[-0.04em] font-normal uppercase text-[#e7e1d7]">
            <StylizedText text="CERTIFICATES" />
          </h1>

          {/* Category Filter Pills */}
          <div
            role="tablist"
            aria-label="Filter certificates by category"
            className="mt-8 sm:mt-10 flex flex-wrap items-center gap-2.5"
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-9 sm:h-10 rounded-full px-4 sm:px-5 text-[11.5px] sm:text-[12px] uppercase tracking-[0.07em] transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-[#f34213] text-[#0b0b0b] font-medium shadow-[0_0_20px_rgba(243,66,19,0.28)]"
                      : "voy-glass text-[#e7e1d7]/75 hover:text-white hover:border-white/25"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Spacious Per-Certificate Editorial Stages */}
        <div>
          {visibleCertificates.map((cert) => {
            const isCopied = copiedId === cert.id;
            return (
              <article
                key={cert.id}
                id={cert.id}
                className="scroll-mt-24 py-16 sm:py-24 border-t border-[#e7e1d7]/15 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
              >
                {/* Left 7 Cols: Borderless Floating 3D Wooden & Glass Frame */}
                <div className="lg:col-span-7">
                  <CertificateFrame3D
                    certificate={cert}
                    allowWideOrbit
                    className="h-[340px] sm:h-[430px] lg:h-[480px] w-full"
                  />
                </div>

                {/* Right 5 Cols: Complete Story, Metadata & How Visitors Can Earn It */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Index, Category & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] uppercase tracking-[0.08em]">
                    <span className="tabular-nums text-[#f34213]">
                      {cert.number} / {totalPadded}
                    </span>
                    <span className="text-[#e7e1d7]/55">
                      {cert.category} · {cert.issuedDate}
                    </span>
                  </div>

                  {/* Title & Issuer */}
                  <div>
                    <h2 className="text-[24px] sm:text-[30px] xl:text-[32px] leading-[1.08] tracking-[-0.025em] font-normal uppercase text-[#e7e1d7]">
                      {cert.title.split(" ").map((word, wIdx) => (
                        <React.Fragment key={wIdx}>
                          {wIdx > 0 ? " " : null}
                          <span className="inline-block whitespace-nowrap">
                            <StylizedText text={word} />
                          </span>
                        </React.Fragment>
                      ))}
                    </h2>
                    <p className="mt-2 text-[14px] uppercase tracking-[0.05em] text-[#e7e1d7]/60">
                      {cert.issuer} · {cert.platform}
                    </p>
                  </div>

                  {/* How I Earned It */}
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.12em] text-[#e7e1d7]/45">
                      HOW I EARNED IT
                    </h3>
                    <p className="mt-2 text-[15px] sm:text-[16px] leading-[1.65] text-[#e7e1d7]/85">
                      {cert.howEarned}
                    </p>
                  </div>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-2">
                    {cert.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-[#e7e1d7]/15 bg-white/[0.03] px-3 py-1 text-[11.5px] tracking-[0.02em] text-[#e7e1d7]/80"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Architectural Metadata Rows */}
                  <div className="border-t border-[#e7e1d7]/15 text-[12.5px] uppercase tracking-[0.05em]">
                    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-[#e7e1d7]/15">
                      <span className="text-[#e7e1d7]/45 shrink-0">
                        ISSUED BY
                      </span>
                      <span className="text-right text-[#e7e1d7]">
                        {cert.issuer} ({cert.platform})
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-[#e7e1d7]/15">
                      <span className="text-[#e7e1d7]/45 shrink-0">
                        DURATION
                      </span>
                      <span className="text-right text-[#e7e1d7]">
                        {cert.duration}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-[#e7e1d7]/15">
                      <span className="text-[#e7e1d7]/45 shrink-0">
                        CREDENTIAL ID
                      </span>
                      <span className="text-right text-[#e7e1d7] tabular-nums">
                        {cert.credentialId}
                      </span>
                    </div>
                  </div>

                  {/* Borderless Editorial How-to-Earn Note */}
                  <div className="border-l border-[#f34213]/50 pl-4">
                    <p className="text-[11px] uppercase tracking-[0.11em] text-[#f34213]">
                      HOW TO EARN THIS
                    </p>
                    <p className="mt-1.5 text-[13.5px] sm:text-[14px] leading-[1.6] text-[#e7e1d7]/75">
                      {cert.howToEarn}
                    </p>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {cert.verifyUrl ? (
                      <a
                        href={cert.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#f34213] px-5 text-[12px] font-medium uppercase tracking-[0.06em] text-[#0b0b0b] hover:bg-[#ff5629] transition-colors"
                      >
                        <span>Verify Certificate</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : null}

                    <a
                      href={cert.programUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="voy-glass inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-[12px] uppercase tracking-[0.06em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-colors"
                    >
                      <span>Take Same Program</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(cert.id)}
                      className="voy-glass inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[12px] uppercase tracking-[0.06em] text-[#e7e1d7]/80 hover:text-white hover:border-white/25 cursor-pointer transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#f34213]" aria-hidden="true" />
                          <span className="text-[#f34213]">COPIED!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Closing Navigation Strip */}
        <footer className="mt-8 pt-12 border-t border-[#e7e1d7]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-[#e7e1d7]/45">
              ABDULLAHELAWADY.STUDIO
            </p>
            <p className="mt-1 text-[16px] text-[#e7e1d7]/80">
              Want to see these skills applied to real shipped products?
            </p>
          </div>

          <Link
            href="/"
            className="voy-glass group inline-flex h-12 items-center gap-3 rounded-full px-6 text-[13px] uppercase tracking-[0.06em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-all"
          >
            <ArrowLeft
              className="h-4 w-4 text-[#f34213] transition-transform duration-200 group-hover:-translate-x-1"
              aria-hidden="true"
            />
            <span>Back to Portfolio</span>
          </Link>
        </footer>
      </main>
    </div>
  );
}
