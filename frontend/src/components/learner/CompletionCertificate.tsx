import { Award, Printer } from "lucide-react";

interface CompletionCertificateProps {
  learnerName: string;
  courseTitle: string;
  /** ISO completion date from API */
  completedAtIso: string;
  onBack: () => void;
}

function formatCertDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function CompletionCertificate({
  learnerName,
  courseTitle,
  completedAtIso,
  onBack,
}: CompletionCertificateProps) {
  function printCertificate() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Certificate — ${escapeHtml(courseTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Georgia, "Times New Roman", serif;
      background: #f8fafc;
      color: #0f172a;
    }
    .sheet {
      width: 100%;
      max-width: 720px;
      padding: 3rem 2.5rem;
      border: 3px double #1d4ed8;
      background: #fff;
      text-align: center;
      box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
    }
    h1 { font-size: 1.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 0.5rem; color: #1e3a8a; }
    .sub { font-size: 0.95rem; color: #64748b; margin-bottom: 2rem; }
    .name { font-size: 1.85rem; font-weight: 700; color: #0f172a; margin: 1rem 0; }
    .course { font-size: 1.15rem; color: #334155; margin: 1.5rem 0; line-height: 1.4; }
    .date { font-size: 0.9rem; color: #64748b; margin-top: 2rem; }
    .brand { margin-top: 2rem; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; }
    @media print {
      body { background: #fff; }
      .sheet { box-shadow: none; border: 3px double #1d4ed8; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <h1>Certificate of completion</h1>
    <p class="sub">This certifies that</p>
    <p class="name">${escapeHtml(learnerName)}</p>
    <p class="sub">has successfully completed</p>
    <p class="course">${escapeHtml(courseTitle)}</p>
    <p class="date">Completed on ${escapeHtml(formatCertDate(completedAtIso))}</p>
    <p class="brand">Learnova</p>
  </div>
</body>
</html>`;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    window.setTimeout(() => {
      w.print();
    }, 200);
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border-2 border-double border-primary bg-white p-8 text-center shadow-inner">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
        <Award className="h-8 w-8" strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Certificate of completion</h2>
      <p className="mt-4 text-sm text-brand-dark-grey">This certifies that</p>
      <p className="mt-2 text-2xl font-bold text-brand-black">{learnerName}</p>
      <p className="mt-4 text-sm text-brand-dark-grey">has successfully completed</p>
      <p className="mt-2 text-lg font-semibold leading-snug text-brand-black">{courseTitle}</p>
      <p className="mt-6 text-sm text-brand-dark-grey">
        Completed on{" "}
        <span className="font-medium text-brand-black">{formatCertDate(completedAtIso)}</span>
      </p>
      <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-mid-grey">Learnova</p>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={printCertificate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-mid-grey bg-white px-4 text-sm font-semibold text-brand-black hover:bg-brand-light-grey"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Print / Save as PDF
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
