/**
 * Accessible Modal Dialog Component
 * Replaces browser alert() popups with accessible keyboard-navigable dialogs
 * Supports both object signature ({ title, contentHtml, confirmText, onConfirm, maxWidth, hideFooter })
 * and legacy positional arguments (title, contentHtml, onConfirm)
 */

export function showModal(param1, param2, param3) {
  let config = {};
  if (typeof param1 === 'object' && param1 !== null) {
    config = param1;
  } else {
    config = {
      title: param1,
      contentHtml: param2,
      onConfirm: param3
    };
  }

  const {
    title = 'Information',
    contentHtml = '',
    confirmText = 'Save',
    cancelText = 'Cancel',
    onConfirm = null,
    onCancel = null,
    maxWidth = '580px',
    hideFooter = false
  } = config;

  let modalOverlay = document.getElementById('globalModalOverlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'globalModalOverlay';
    modalOverlay.className = 'modal-overlay';
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div class="modal-window" role="dialog" aria-modal="true" aria-labelledby="modalTitle" style="max-width: ${maxWidth}; width: 95%;">
      <div class="modal-header">
        <h3 id="modalTitle" class="modal-title">${title}</h3>
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="Close dialog">&times;</button>
      </div>
      <div class="modal-body">
        ${contentHtml}
      </div>
      ${!hideFooter ? `
        <div class="modal-footer">
          <button class="btn btn-outline" id="modalCancelBtn">${cancelText}</button>
          <button class="btn btn-primary" id="modalConfirmBtn">${confirmText}</button>
        </div>
      ` : ''}
    </div>
  `;

  modalOverlay.classList.add('active');

  const close = () => {
    modalOverlay.classList.remove('active');
  };

  modalOverlay.querySelector('#modalCloseBtn').onclick = close;
  
  const cancelBtn = modalOverlay.querySelector('#modalCancelBtn');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (onCancel) onCancel();
      close();
    };
  }

  const confirmBtn = modalOverlay.querySelector('#modalConfirmBtn');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      if (onConfirm) {
        const inputs = modalOverlay.querySelectorAll('input, select, textarea');
        const formData = {};
        inputs.forEach(input => {
          if (input.name) formData[input.name] = input.value;
        });
        onConfirm(formData);
      }
      close();
    };
  }

  // Close on backdrop click or ESC key
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) close();
  };

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      close();
      window.removeEventListener('keydown', escHandler);
    }
  };
  window.addEventListener('keydown', escHandler);

  return {
    close,
    element: modalOverlay.querySelector('.modal-window')
  };
}

/**
 * Accessible confirmation dialog
 */
export function confirmAction({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', isDanger = false, onConfirm, onCancel }) {
  showModal({
    title,
    maxWidth: '440px',
    contentHtml: `
      <div style="display: flex; gap: 14px; align-items: flex-start; padding: 6px 0;">
        <span style="font-size: 1.8rem; line-height: 1;">${isDanger ? '⚠️' : '❓'}</span>
        <div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">${message}</p>
        </div>
      </div>
    `,
    confirmText,
    onConfirm
  });
}
