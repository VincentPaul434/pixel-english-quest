import { ModalFrame } from '../../../../shared-components/ModalFrame';
import { PixelIcon } from '../../../../shared-components/PixelIcon';
import type { Certificate } from '../../models/types';

export function CertificatesModal({ certificates = [], onClose }: { certificates?: Certificate[]; onClose: () => void }) {
  return <ModalFrame label="Your certificates" onClose={onClose}>
    <div className="modal-heading compact"><span><PixelIcon name="trophy" /></span><div><small>Achievements</small><h2>Certificates</h2><p>Open and verify certificates you have earned.</p></div></div>
    <section className="hub-modal-section">{certificates.map((item) => <a className="hub-row" href={`/certificates/${encodeURIComponent(item.verificationCode)}`} target="_blank" rel="noreferrer" key={item.id}><strong>{item.courseTitle}</strong><small>Issued {new Date(item.issuedAt).toLocaleDateString()} · {item.verificationCode}</small></a>)}{!certificates.length && <p className="hub-empty">Complete a course to earn a verified certificate.</p>}</section>
  </ModalFrame>;
}
