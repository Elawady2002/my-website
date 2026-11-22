import React from "react";

const WHATSAPP_QR_PATH =
  "M0 0h7v1h-7zM11 0h3v1h-3zM15 0h1v1h-1zM18 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM9 1h2v1h-2zM12 1h1v1h-1zM15 1h2v1h-2zM18 1h1v1h-1zM24 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h1v1h-1zM11 2h1v1h-1zM15 2h1v1h-1zM18 2h1v1h-1zM20 2h3v1h-3zM24 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h2v1h-2zM11 3h1v1h-1zM14 3h1v1h-1zM18 3h1v1h-1zM20 3h3v1h-3zM24 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h3v1h-3zM13 4h1v1h-1zM15 4h2v1h-2zM18 4h1v1h-1zM20 4h3v1h-3zM24 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h3v1h-3zM13 5h1v1h-1zM18 5h1v1h-1zM24 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h7v1h-7zM8 7h1v1h-1zM13 7h3v1h-3zM0 8h1v1h-1zM2 8h5v1h-5zM9 8h2v1h-2zM13 8h4v1h-4zM18 8h5v1h-5zM0 9h2v1h-2zM5 9h1v1h-1zM8 9h2v1h-2zM19 9h1v1h-1zM23 9h1v1h-1zM1 10h1v1h-1zM3 10h4v1h-4zM12 10h4v1h-4zM18 10h4v1h-4zM23 10h2v1h-2zM0 11h6v1h-6zM7 11h1v1h-1zM10 11h2v1h-2zM15 11h1v1h-1zM17 11h3v1h-3zM24 11h1v1h-1zM0 12h2v1h-2zM5 12h2v1h-2zM9 12h1v1h-1zM11 12h6v1h-6zM18 12h3v1h-3zM22 12h3v1h-3zM0 13h1v1h-1zM2 13h1v1h-1zM4 13h1v1h-1zM8 13h1v1h-1zM10 13h1v1h-1zM15 13h1v1h-1zM19 13h1v1h-1zM21 13h1v1h-1zM23 13h1v1h-1zM0 14h1v1h-1zM3 14h2v1h-2zM6 14h1v1h-1zM9 14h4v1h-4zM15 14h3v1h-3zM19 14h3v1h-3zM23 14h2v1h-2zM0 15h1v1h-1zM2 15h1v1h-1zM5 15h1v1h-1zM9 15h3v1h-3zM16 15h1v1h-1zM19 15h2v1h-2zM24 15h1v1h-1zM0 16h1v1h-1zM3 16h1v1h-1zM5 16h3v1h-3zM9 16h1v1h-1zM11 16h1v1h-1zM16 16h5v1h-5zM22 16h1v1h-1zM8 17h1v1h-1zM12 17h2v1h-2zM15 17h2v1h-2zM20 17h2v1h-2zM0 18h7v1h-7zM9 18h1v1h-1zM13 18h2v1h-2zM16 18h1v1h-1zM18 18h1v1h-1zM20 18h1v1h-1zM22 18h3v1h-3zM0 19h1v1h-1zM6 19h1v1h-1zM8 19h2v1h-2zM12 19h2v1h-2zM15 19h2v1h-2zM20 19h2v1h-2zM0 20h1v1h-1zM2 20h3v1h-3zM6 20h1v1h-1zM8 20h1v1h-1zM10 20h1v1h-1zM12 20h1v1h-1zM14 20h7v1h-7zM22 20h2v1h-2zM0 21h1v1h-1zM2 21h3v1h-3zM6 21h1v1h-1zM8 21h1v1h-1zM10 21h1v1h-1zM17 21h2v1h-2zM20 21h3v1h-3zM24 21h1v1h-1zM0 22h1v1h-1zM2 22h3v1h-3zM6 22h1v1h-1zM8 22h2v1h-2zM11 22h2v1h-2zM21 22h2v1h-2zM24 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM11 23h1v1h-1zM14 23h4v1h-4zM19 23h3v1h-3zM24 23h1v1h-1zM0 24h7v1h-7zM8 24h4v1h-4zM17 24h8v1h-8z";

function QrMatrixSvg({ className }: { className: string }) {
  return (
    <svg
      viewBox="-2 -2 29 29"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <rect x="-2" y="-2" width="29" height="29" fill="#e7e1d7" />
      <path d={WHATSAPP_QR_PATH} fill="#0b0b0b" />
    </svg>
  );
}

export function WhatsAppQrBadge({
  href,
  className = "",
}: {
  href: string;
  className?: string;
}) {
  return (
    <div className={`group/qr relative shrink-0 ${className}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Scan or open WhatsApp chat with Abdullah Elawady"
        title="Open or scan for WhatsApp"
        className="block rounded-[10px] bg-[#e7e1d7] p-[4px] border border-[#e7e1d7]/20 transition-all duration-200 hover:border-[#f34213] hover:shadow-[0_0_20px_rgba(243,66,19,0.35)] focus-visible:outline-none focus-visible:border-[#f34213]"
      >
        <QrMatrixSvg className="block h-[44px] w-[44px] sm:h-[48px] sm:w-[48px] rounded-[6px]" />
      </a>

      <div
        aria-hidden="true"
        className="voy-popover-glass pointer-events-none hidden sm:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-[168px] flex-col items-center gap-2 rounded-[16px] p-3 opacity-0 translate-y-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/qr:opacity-100 group-hover/qr:translate-y-0 group-focus-visible/qr:opacity-100 group-focus-visible/qr:translate-y-0"
      >
        <div className="rounded-[10px] bg-[#e7e1d7] p-1.5">
          <QrMatrixSvg className="block h-[132px] w-[132px] rounded-[6px]" />
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#e7e1d7]/85">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f34213]" />
          SCAN FOR WHATSAPP
        </span>
      </div>
    </div>
  );
}
