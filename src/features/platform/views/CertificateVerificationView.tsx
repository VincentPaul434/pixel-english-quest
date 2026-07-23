import { useEffect, useState } from 'react';
import { PixelIcon } from '../../../shared-components/PixelIcon';
import { verifyCertificate } from '../models/api';
import type { VerifiedCertificate } from '../models/types';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character] || character));
}

function downloadCertificate(certificate: VerifiedCertificate) {
  const issued = new Date(certificate.issuedAt).toLocaleDateString(undefined, { dateStyle: 'long' });
  const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Certificate — ${escapeHtml(certificate.courseTitle)}</title><style>body{font-family:Georgia,serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#13214b;background:#f4efd9}.certificate{width:min(850px,85vw);padding:64px;text-align:center;border:12px double #b78b2e;background:#fffdf4}.eyebrow{letter-spacing:.18em;text-transform:uppercase;color:#80611c}h1{font-size:52px;margin:18px}h2{font-size:34px;color:#543d0e}.code{font-family:monospace}</style></head><body><main class="certificate"><p class="eyebrow">English Pixel Academy</p><h1>Certificate of Completion</h1><p>This certifies that</p><h2>${escapeHtml(certificate.studentName)}</h2><p>successfully completed</p><h2>${escapeHtml(certificate.courseTitle)}</h2><p>Instructor: ${escapeHtml(certificate.teacherName)} · Issued ${escapeHtml(issued)}</p><p class="code">Verification code: ${escapeHtml(certificate.verificationCode)}</p></main></body></html>`;
  const url = URL.createObjectURL(new Blob([documentHtml], { type: 'text/html;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `certificate-${certificate.verificationCode}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CertificateVerificationView({ code, homePath }: { code: string; homePath: string }) {
  const [certificate, setCertificate] = useState<VerifiedCertificate | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setCertificate(null);
    setError('');
    void verifyCertificate(code, controller.signal).then(setCertificate).catch((reason) => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      setError(reason instanceof Error ? reason.message : 'Could not verify this certificate.');
    });
    return () => controller.abort();
  }, [code]);

  return (
    <main className="certificate-screen">
      <a className="certificate-brand" href={homePath}><PixelIcon name="academy" /> English Pixel Academy</a>
      {!certificate && !error && <section className="certificate-status panel" role="status"><PixelIcon className="loading-rune" name="sparkle" size={46} /><h1>Verifying certificate...</h1></section>}
      {error && <section className="certificate-status panel" role="alert"><PixelIcon name="close" size={46} /><h1>Certificate not verified</h1><p>{error}</p><a className="secondary-button" href={homePath}>Return to the academy</a></section>}
      {certificate && (
        <>
          <section className="public-certificate panel" aria-labelledby="certificate-title">
            <div className="certificate-seal"><PixelIcon name="trophy" size={58} /></div>
            <p className="overline">Verified · English Pixel Academy</p>
            <h1 id="certificate-title">Certificate of Completion</h1>
            <p>This certifies that</p>
            <h2>{certificate.studentName}</h2>
            <p>successfully completed</p>
            <h3>{certificate.courseTitle}</h3>
            <div className="certificate-details">
              <span><small>Instructor</small><strong>{certificate.teacherName}</strong></span>
              <span><small>Issued</small><strong>{new Date(certificate.issuedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</strong></span>
            </div>
            <p className="certificate-code">Verification code <strong>{certificate.verificationCode}</strong></p>
          </section>
          <div className="certificate-actions">
            <button className="secondary-button" onClick={() => window.print()}><PixelIcon name="scroll" /> Print or save PDF</button>
            <button className="primary-button" onClick={() => downloadCertificate(certificate)}><PixelIcon name="scroll" /> Download certificate</button>
          </div>
        </>
      )}
    </main>
  );
}
