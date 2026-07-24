import type { FormEventHandler } from 'react';
import { ModalFrame } from '../../../../shared-components/ModalFrame';
import { PixelIcon } from '../../../../shared-components/PixelIcon';
import type { InvitationPreview, PlatformData } from '../../models/types';

type JoinClassroomModalProps = {
  data: PlatformData;
  invite: InvitationPreview | null;
  inviteCode: string;
  onAccept: () => void;
  onClose: () => void;
  onInspect: FormEventHandler<HTMLFormElement>;
  onInviteCodeChange: (code: string) => void;
  onLeave: (classroomId: string) => void;
};

function Empty({ children }: { children: string }) {
  return <p className="hub-empty">{children}</p>;
}

export function JoinClassroomModal({ data, invite, inviteCode, onAccept, onClose, onInspect, onInviteCodeChange, onLeave }: JoinClassroomModalProps) {
  return <ModalFrame label="Join a classroom" onClose={onClose} wide>
    <div className="modal-heading compact"><span><PixelIcon name="profile" /></span><div><small>Classroom access</small><h2>Join a classroom</h2><p>Preview an invitation before joining your teacher's classroom.</p></div></div>
    <div className="invite-workflow hub-modal-content">
      <form onSubmit={onInspect}><h3>Invitation code</h3><div><input data-autofocus value={inviteCode} onChange={(event) => onInviteCodeChange(event.target.value.toUpperCase())} placeholder="Enter invitation code" required /><button className="secondary-button">Preview</button></div></form>
      {invite && <article className={`invite-preview ${invite.state}`}><span className={`status-pill ${invite.state}`}>{invite.state}</span><h3>{invite.classroomName}</h3><strong>{invite.teacherName}</strong><small>{invite.courseTitle}{invite.assignmentTitle ? ` · Assignment: ${invite.assignmentTitle}` : ''}</small>{invite.expiresAt && <small>Expires {new Date(invite.expiresAt).toLocaleString()}</small>}<button className="secondary-button" disabled={invite.state !== 'available'} onClick={onAccept}>{invite.approvalRequired ? 'Request access' : 'Join classroom'}</button></article>}
    </div>
    <section className="hub-modal-section"><h3><PixelIcon name="academy" /> Your classrooms</h3>{data.classrooms.map((item) => <div className="hub-row" key={item.id}><strong>{item.name}</strong><small>{item.teacherName} · {item.courseTitle}</small><button className="text-button danger-text" onClick={() => onLeave(item.id)}>Leave</button></div>)}{!data.classrooms.length && <Empty>You have not joined a classroom yet.</Empty>}</section>
    {!!data.invitationStates?.length && <section className="invitation-history hub-modal-section"><h3>Invitation activity</h3>{data.invitationStates.map((item) => { const state = item.revokedAt ? 'revoked' : item.expiresAt && new Date(item.expiresAt) <= new Date() ? 'expired' : item.status; return <div className="hub-row" key={item.id}><strong>{item.classroomName}</strong><span className={`status-pill ${state}`}>{state}</span><small>{item.teacherName} · {item.courseTitle}</small></div>; })}</section>}
  </ModalFrame>;
}
