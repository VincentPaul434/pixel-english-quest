import { useState } from 'react';
import { ModalFrame } from '../../../../shared-components/ModalFrame';
import { PixelIcon } from '../../../../shared-components/PixelIcon';
import type { CalendarEvent } from '../../models/types';

export function CalendarModal({ events, onClose }: { events: CalendarEvent[]; onClose: () => void }) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  if (selectedEvent) {
    return <ModalFrame label={`${selectedEvent.title} event details`} onClose={onClose} wide>
      <button className="text-button hub-modal-back" onClick={() => setSelectedEvent(null)}>‹ Back to calendar</button>
      <div className="modal-heading compact"><span><PixelIcon name="clock" /></span><div><small>{selectedEvent.eventType} · {selectedEvent.classroomName || selectedEvent.courseTitle || 'Academy event'}</small><h2>{selectedEvent.title}</h2><p>{new Date(selectedEvent.startsAt).toLocaleString()}{selectedEvent.endsAt ? ` – ${new Date(selectedEvent.endsAt).toLocaleString()}` : ''}</p></div></div>
      {selectedEvent.description && <p className="event-description">{selectedEvent.description}</p>}
    </ModalFrame>;
  }

  return <ModalFrame label="Learning calendar" onClose={onClose} wide>
    <div className="modal-heading compact"><span><PixelIcon name="clock" /></span><div><small>Schedule</small><h2>Calendar</h2><p>Upcoming classroom events and course due dates.</p></div></div>
    <section className="hub-modal-section">{events.map((item) => <button type="button" className="hub-row calendar-event-button" key={item.id} onClick={() => setSelectedEvent(item)}><strong>{item.title}</strong><small>{new Date(item.startsAt).toLocaleString()} {item.classroomName || item.courseTitle ? `· ${item.classroomName || item.courseTitle}` : ''}</small></button>)}{!events.length && <p className="hub-empty">No upcoming events.</p>}</section>
  </ModalFrame>;
}
