"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CertificateFrame3D } from "@/components/certificates/CertificateFrame3D";
import { CertificateSeriesControls } from "@/components/certificates/CertificateSeriesControls";
import { StylizedText, StylizedWords } from "@/components/ui/StylizedText";
import { siteConfig, type CertificateItem } from "@/data/site";
import { useMagneticHover } from "@/hooks/useMagneticHover";
import { useRevealOnView } from "@/hooks/useRevealOnView";

const CERT_REVEAL_OPTS = { threshold: 0.14 };

export function CertificatesSection() {
  const { heading, ctaLabel, ctaHref, certificates } =
    siteConfig.certificatesSection;

  const featuredList = useMemo(() => {
    const flagged = certificates.filter((c) => c.featured);
    return (flagged.length > 0 ? flagged : certificates).slice(0, 3);
  }, [certificates]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [activeSeriesIdx, setActiveSeriesIdx] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const magnetic = useMagneticHover<HTMLAnchorElement>({
    xFactor: 0.14,
    yFactor: 0.18,
  });

  useRevealOnView(sectionRef, CERT_REVEAL_OPTS);

  const activeCert = featuredList[activeIdx] || featuredList[0];
  if (!activeCert) return null;

  const series = activeCert.series;
  const hasSeries = Boolean(series && series.length > 1);
  const activeLevel =
    hasSeries && series ? (series[activeSeriesIdx] ?? series[0]) : undefined;

  const displayCert: CertificateItem = activeLevel
    ? {
        ...activeCert,
        id: activeLevel.id,
        imageSrc: activeLevel.imageSrc,
        frameFormat: activeLevel.frameFormat ?? activeCert.frameFormat,
      }
    : activeCert;

  const anyFeaturedHasSeries = featuredList.some(
    (c) => c.series && c.series.length > 1
  );

  const selectCertificate = (idx: number) => {
    if (idx === activeIdx) return;
    setActiveIdx(idx);
    setActiveSeriesIdx(0);
  };

  return (
    <section
      id="certificates"
      ref={sectionRef}
      className="relative z-10 w-full bg-[#0b0b0b] px-4 sm:px-6 pt-24 sm:pt-32 pb-20 sm:pb-28"
    >
      <div className="cert-reveal-line h-px w-full bg-[#e7e1d7]/20" />

      <div
        style={{ "--cert-delay": "80ms" } as React.CSSProperties}
        className="cert-reveal-item pt-8 sm:pt-10"
      >
        <h2 className="text-[clamp(2.35rem,5.2vw,4.75rem)] leading-[0.94] tracking-[-0.03em] font-normal uppercase text-[#e7e1d7]">
          <StylizedText text={heading} />
        </h2>
      </div>

      <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-5 flex flex-col">
          <div className="border-b border-[#e7e1d7]/15">
            {featuredList.map((cert, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={cert.id}
                  type="button"
                  onMouseEnter={() => selectCertificate(idx)}
                  onFocus={() => selectCertificate(idx)}
                  onClick={() => selectCertificate(idx)}
                  style={
                    { "--cert-delay": `${140 + idx * 70}ms` } as React.CSSProperties
                  }
                  className="cert-reveal-item group w-full text-left border-t border-[#e7e1d7]/15 py-5 sm:py-6 flex items-center justify-between gap-4 transition-colors cursor-pointer focus:outline-none"
                >
                  <div className="flex items-baseline gap-4 sm:gap-5 min-w-0">
                    <span
                      className={`text-[12px] tabular-nums tracking-[0.08em] transition-colors ${
                        isActive ? "text-[#f34213]" : "text-[#e7e1d7]/40"
                      }`}
                    >
                      {cert.number}
                    </span>
                    <div className="min-w-0">
                      <h3
                        className={`text-[18px] sm:text-[21px] leading-[1.15] tracking-[-0.02em] font-normal uppercase transition-all duration-300 ${
                          isActive
                            ? "text-[#e7e1d7] translate-x-1"
                            : "text-[#e7e1d7]/55 group-hover:text-[#e7e1d7]/85"
                        }`}
                      >
                        <StylizedWords text={cert.title} />
                      </h3>
                      <p className="mt-1 text-[12px] uppercase tracking-[0.06em] text-[#e7e1d7]/45">
                        {cert.issuer} · {cert.issuedDate}
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-[#f34213] scale-100 shadow-[0_0_10px_rgba(243,66,19,0.75)]"
                        : "bg-[#e7e1d7]/15 scale-75 group-hover:bg-[#e7e1d7]/40"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div
            style={{ "--cert-delay": "360ms" } as React.CSSProperties}
            className="cert-reveal-item mt-9"
          >
            <Link
              href={ctaHref}
              onMouseEnter={magnetic.onMouseEnter}
              onMouseMove={magnetic.onMouseMove}
              onMouseLeave={magnetic.onMouseLeave}
              className="group relative inline-flex h-[52px] items-center gap-3 overflow-hidden rounded-full border border-[#e7e1d7]/25 bg-white/[0.04] px-7 text-[13px] font-normal uppercase tracking-[0.06em] text-[#e7e1d7] backdrop-blur-xs transition-transform duration-200 ease-out"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 translate-y-full bg-[#f34213] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
              />
              <span className="relative z-10 transition-colors duration-200 group-hover:text-[#0b0b0b] group-hover:font-medium">
                <StylizedText text={ctaLabel} />
              </span>
              <span
                aria-hidden="true"
                className="relative z-10 h-1.5 w-1.5 rounded-full bg-[#f34213] transition-all duration-300 group-hover:scale-125 group-hover:bg-[#0b0b0b]"
              />
            </Link>
          </div>
        </div>

        <div
          style={{ "--cert-delay": "200ms" } as React.CSSProperties}
          className="cert-reveal-item lg:col-span-7"
        >
          <CertificateFrame3D
            certificate={displayCert}
            className="h-[340px] sm:h-[420px] lg:h-[480px] w-full"
          />

          {anyFeaturedHasSeries ? (
            <div className="mt-3 h-9 flex items-center justify-center">
              {hasSeries && series ? (
                <CertificateSeriesControls
                  series={series}
                  activeIndex={activeSeriesIdx}
                  onSelect={setActiveSeriesIdx}
                  ariaLabel={`${activeCert.title} certificates`}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
