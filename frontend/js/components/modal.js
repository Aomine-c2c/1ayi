/**
 * Accessible Modal Dialog Component
 * Replaces browser alert() popups with accessible keyboard-navigable dialogs
 */

export function showModal({ title, contentHtml, confirmText = 'Save', onConfirm }) {
  let modalOverlay = document.getElementById('globalModalOverlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'globalModalOverlay';
    modalOverlay.className = 'modal-overlay';
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div class="modal-window" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-header">
        <h3 id="modalTitle" class="modal-title">${title}</h3>
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="Close dialog">&times;</button>
      </div>
      <div class="modal-body">
        ${contentHtml}
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="modalCancelBtn">Cancel</button>
        <button class="btn btn-primary" id="modalConfirmBtn">${confirmText}</button>
      </div>
    </div>
  `;

  modalOverlay.classList.add('active');

  const close = () => {
    modalOverlay.classList.remove('active');
  };

  modalOverlay.querySelector('#modalCloseBtn').onclick = close;
  modalOverlay.querySelector('#modalCancelBtn').onclick = close;

  modalOverlay.querySelector('#modalConfirmBtn').onclick = () => {
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
}
