"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CertificateFrame3D } from "@/components/certificates/CertificateFrame3D";
import { StylizedText, StylizedWords } from "@/components/ui/StylizedText";
import { siteConfig } from "@/data/site";
import { getLenis } from "@/lib/dom";

export function CertificatesArchiveView() {
  const { certificates } = siteConfig.certificatesSection;
  const totalPadded = String(certificates.length).padStart(2, "0");

  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#/, "").trim();
    if (!rawHash || !certificates.some((c) => c.id === rawHash)) return;

    let timer = 0;
    const raf1 = window.requestAnimationFrame(() => {
      timer = window.setTimeout(() => {
        const target = document.getElementById(rawHash);
        if (!target) return;
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(target, { offset: -96, duration: 1.0 });
        else target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.clearTimeout(timer);
    };
  }, [certificates]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#e7e1d7]">
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-4 pb-8 md:px-6 md:pt-5 md:pb-10 flex items-center justify-between pointer-events-none bg-gradient-to-b from-[#0b0b0b] via-[#0b0b0b]/75 to-transparent">
        <Link
          href="/"
          className="voy-glass group pointer-events-auto inline-flex h-[44px] md:h-[50px] items-center gap-2.5 rounded-[14px] px-4 md:px-5 text-[12.5px] md:text-[13.5px] uppercase tracking-[0.04em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-all duration-200"
        >
          <ArrowLeft
            className="h-4 w-4 text-[#f34213] transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span>Back to Studio</span>
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
        <section
          aria-label="Certificates archive header"
          className="pb-10 sm:pb-14"
        >
          <h1 className="text-[clamp(2.8rem,8.5vw,7.4rem)] leading-[0.88] tracking-[-0.04em] font-normal uppercase text-[#e7e1d7]">
            <StylizedText text="CERTIFICATES" />
          </h1>
        </section>

        <div>
          {certificates.map((cert) => (
            <article
              key={cert.id}
              id={cert.id}
              className="scroll-mt-24 py-14 sm:py-20 border-t border-[#e7e1d7]/15 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
            >
              <div className="lg:col-span-7">
                <CertificateFrame3D
                  certificate={cert}
                  allowWideOrbit
                  className={
                    cert.frameFormat === "portrait"
                      ? "h-[420px] sm:h-[520px] lg:h-[580px] w-full"
                      : "h-[340px] sm:h-[430px] lg:h-[480px] w-full"
                  }
                />
              </div>

              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="flex items-center justify-between gap-2 text-[12px] uppercase tracking-[0.08em]">
                  <span className="tabular-nums text-[#f34213]">
                    {cert.number} / {totalPadded}
                  </span>
                  <span className="text-[#e7e1d7]/55">{cert.issuedDate}</span>
                </div>

                <div>
                  <h2 className="text-[24px] sm:text-[30px] xl:text-[34px] leading-[1.08] tracking-[-0.025em] font-normal uppercase text-[#e7e1d7]">
                    <StylizedWords text={cert.title} />
                  </h2>
                  <p className="mt-2 text-[13.5px] uppercase tracking-[0.05em] text-[#e7e1d7]/55">
                    {cert.issuer}
                  </p>
                </div>

                <p className="text-[15px] sm:text-[16px] leading-[1.65] text-[#e7e1d7]/80">
                  {cert.description}
                </p>

                <div className="border-t border-[#e7e1d7]/15 text-[12.5px] uppercase tracking-[0.05em]">
                  <div className="flex items-baseline justify-between gap-4 py-3 border-b border-[#e7e1d7]/15">
                    <span className="text-[#e7e1d7]/45 shrink-0">
                      ISSUED BY
                    </span>
                    <span className="text-right text-[#e7e1d7]">
                      {cert.issuer}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 py-3 border-b border-[#e7e1d7]/15">
                    <span className="text-[#e7e1d7]/45 shrink-0">DETAILS</span>
                    <span className="text-right text-[#e7e1d7]">
                      {cert.details}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {cert.verifyUrl ? (
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#f34213] px-5 text-[12px] font-medium uppercase tracking-[0.06em] text-[#0b0b0b] hover:bg-[#ff5629] transition-colors"
                    >
                      <span>Verify</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : null}

                  <a
                    href={cert.programUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="voy-glass inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-[12px] uppercase tracking-[0.06em] text-[#e7e1d7] hover:text-white hover:border-white/25 transition-colors"
                  >
                    <span>{cert.programLabel}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
