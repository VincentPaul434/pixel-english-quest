import { useRef, type ReactNode } from 'react';
import { PixelIcon } from '../PixelIcon';
import { useDialogFocus } from './useDialogFocus';

type ModalFrameProps = {
  children: ReactNode;
  onClose: () => void;
  label: string;
  wide?: boolean;
  contentClassName?: string;
};

export function ModalFrame({ children, onClose, label, wide = false, contentClassName = 'quest-modal' }: ModalFrameProps) {
  const contentRef = useRef<HTMLElement>(null);
  useDialogFocus(contentRef, onClose);

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={label}>
      <button className="modal-scrim" onClick={onClose} aria-label={`Dismiss ${label}`} />
      <section ref={contentRef} tabIndex={-1} className={`${wide ? `${contentClassName} wide-modal` : contentClassName} panel`}>
        <button className="modal-close icon-button" onClick={onClose} aria-label={`Close ${label}`}>
          <PixelIcon name="close" />
        </button>
        {children}
      </section>
    </div>
  );
}
