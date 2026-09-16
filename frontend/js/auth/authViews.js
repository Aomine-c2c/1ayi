/**
 * Authentication and Farmer Onboarding Flow Views
 * Implements:
 * - Login (Email/username, password, remember me, show/hide password, forgot password link,
 *   login loading state, invalid credentials state, account disabled state, account locked state)
 * - Forgot Password (Email input, submission loading, success confirmation, error states)
 * - Reset Password (New password, confirm password, password strength indicator, validation, success state)
 * - First-Time User Experience (Complete profile onboarding prompt after first login)
 * - User Profile Management (Personal details, contact info, role, profile image/avatar,
 *   notification preferences, password & security section)
 * - Farmer-Specific 6-Step Onboarding Wizard with Interactive Map Selection UI:
 *   Step 1: Personal information (Full name, national ID / producer ID, phone, county)
 *   Step 2: Farm information (Farm name, farm size, unit: Ha/Acres, description)
 *   Step 3: Farm location (Province/district, ward, interactive canvas map picker, WGS84 coordinates)
 *   Step 4: Farm area & zoning (Parcel breakdown, soil type, irrigation infrastructure)
 *   Step 5: Primary farming activities (Primary crop, rotation crop, livestock, farming system)
 *   Step 6: Confirmation & Review (Spatial validation summary, submit to MySQL 8 / backend)
 */
import { authService, farmService } from '../services/index.js';
import { ROLE_CONFIG } from '../domain/models.js';
import { geoComponents } from '../components/geoComponents.js';

export const authViews = {
  // =========================================================================
  // 1. LOGIN MODAL & WORKFLOW
  // =========================================================================
  showLoginModal(onSuccess) {
    let overlay = document.getElementById('globalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const renderLoginForm = (errorMsg = '', alertType = 'critical', isSubmitting = false) => {
      overlay.innerHTML = `
        <div class="modal-window" role="dialog" aria-modal="true" style="max-width: 440px;">
          <div class="modal-header">
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 1.2rem;">🌱</span>
                <span class="badge badge-green" style="font-size: 0.7rem;">AYIS INTELLIGENCE</span>
              </div>
              <h3 class="modal-title" style="margin-top: 6px; font-size: 1.25rem;">Sign In to Account</h3>
            </div>
            <button class="modal-close-btn" id="loginCloseBtn" aria-label="Close dialog">&times;</button>
          </div>
          
          <form id="loginForm" class="modal-body" style="padding-top: 16px;">
            ${errorMsg ? `
              <div role="alert" style="background: ${alertType === 'warning' ? 'var(--accent-amber-light)' : 'var(--accent-rose-light)'}; border: 1px solid ${alertType === 'warning' ? '#fcd34d' : '#fda4af'}; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 16px; font-size: 0.8125rem; color: ${alertType === 'warning' ? 'var(--accent-amber)' : 'var(--accent-rose)'}; display: flex; align-items: flex-start; gap: 8px;">
                <span style="font-size: 1.1rem; line-height: 1;">${alertType === 'warning' ? '⚠️' : '🚨'}</span>
                <div>${errorMsg}</div>
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label" for="loginInputUser">Email Address or Username</label>
              <input 
                class="form-input" 
                id="loginInputUser" 
                name="emailOrUsername" 
                type="text" 
                placeholder="e.g. sarah.mwangi@ayis.org or farmer" 
                value="sarah.mwangi@ayis.org"
                required
                ${isSubmitting ? 'disabled' : ''}
              >
              <span class="form-hint">Tip: test 'disabled@ayis.org' for disabled state or 'locked@ayis.org' for locked state.</span>
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="form-label" for="loginInputPass" style="margin-bottom: 0;">Password</label>
                <button type="button" id="btnForgotPassLink" style="background: transparent; border: none; font-size: 0.75rem; font-weight: 700; color: var(--primary-dark); cursor: pointer; text-decoration: underline;">
                  Forgot Password?
                </button>
              </div>
              <div style="position: relative;">
                <input 
                  class="form-input" 
                  id="loginInputPass" 
                  name="password" 
                  type="password" 
                  value="Password123!" 
                  style="padding-right: 44px;"
                  required
                  ${isSubmitting ? 'disabled' : ''}
                >
                <button 
                  type="button" 
                  id="btnToggleLoginPass" 
                  style="position: absolute; right: 10px; top: 10px; background: transparent; border: none; cursor: pointer; color: var(--text-muted); font-size: 1rem;" 
                  aria-label="Toggle password visibility"
                >
                  👁️
                </button>
              </div>
              <span class="form-hint">Tip: test password 'wrong' to trigger invalid credentials state.</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 16px 0 8px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.8125rem; color: var(--text-secondary);">
                <input type="checkbox" id="loginRememberMe" name="rememberMe" checked ${isSubmitting ? 'disabled' : ''}>
                Remember this device
              </label>
            </div>

            <div style="margin-top: 24px;">
              <button 
                type="submit" 
                class="btn btn-primary" 
                id="btnSubmitLogin" 
                style="width: 100%; justify-content: center; padding: 11px 16px; font-size: 0.95rem;"
                ${isSubmitting ? 'disabled' : ''}
              >
                ${isSubmitting ? `
                  <span style="display: inline-flex; align-items: center; gap: 8px;">
                    <span class="status-dot" style="animation: pulse 0.8s infinite;"></span>
                    Verifying Credentials...
                  </span>
                ` : 'Sign In to AYIS'}
              </button>
            </div>
          </form>

          <div style="padding: 12px 24px 18px; border-top: 1px solid var(--border-subtle); background: var(--bg-primary); text-align: center; font-size: 0.8125rem; color: var(--text-muted);">
            New farmer or producer? 
            <button type="button" id="btnLaunchOnboardFromLogin" style="background: transparent; border: none; color: var(--primary-dark); font-weight: 800; cursor: pointer; margin-left: 4px;">
              Start Farmer Registration →
            </button>
          </div>
        </div>
      `;

      overlay.classList.add('active');

      // Bind interactions
      overlay.querySelector('#loginCloseBtn').onclick = () => overlay.classList.remove('active');
      
      const togglePassBtn = overlay.querySelector('#btnToggleLoginPass');
      const passInput = overlay.querySelector('#loginInputPass');
      togglePassBtn?.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.textContent = isPass ? '🙈' : '👁️';
      });

      overlay.querySelector('#btnForgotPassLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        authViews.showForgotPasswordModal();
      });

      overlay.querySelector('#btnLaunchOnboardFromLogin')?.addEventListener('click', () => {
        overlay.classList.remove('active');
        authViews.showFarmerOnboardingWizard(onSuccess);
      });

      // Submit handler
      const form = overlay.querySelector('#loginForm');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const userInput = form.querySelector('#loginInputUser').value;
        const passVal = passInput.value;
        const rememberVal = form.querySelector('#loginRememberMe').checked;

        // Render loading state
        renderLoginForm('', '', true);

        const result = await authService.login({
          emailOrUsername: userInput,
          password: passVal,
          rememberMe: rememberVal
        });

        if (result.success) {
          overlay.classList.remove('active');
          // Update sidebar navigation and active role UI
          const activeRoleSelect = document.getElementById('activeRoleSelect');
          if (activeRoleSelect) activeRoleSelect.value = result.role;

          // Check if first-time user login
          if (result.isFirstLogin) {
            authViews.showFirstTimeUserModal(result.user, () => {
              if (onSuccess) onSuccess();
              window.location.hash = '#dashboard';
            });
          } else {
            if (onSuccess) onSuccess();
            window.location.hash = '#dashboard';
          }
        } else {
          // Render specific error states (Disabled, Locked, Invalid)
          const isWarning = result.status === 'LOCKED';
          renderLoginForm(result.message, isWarning ? 'warning' : 'critical', false);
        }
      };
    };

    renderLoginForm();
  },

  // =========================================================================
  // 2. FORGOT PASSWORD WORKFLOW
  // =========================================================================
  showForgotPasswordModal() {
    let overlay = document.getElementById('globalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const renderForgotForm = (errorMsg = '', successMsg = '', isSubmitting = false) => {
      overlay.innerHTML = `
        <div class="modal-window" role="dialog" aria-modal="true" style="max-width: 440px;">
          <div class="modal-header">
            <div>
              <span class="badge badge-amber" style="font-size: 0.7rem;">ACCOUNT RECOVERY</span>
              <h3 class="modal-title" style="margin-top: 6px;">Forgot Password</h3>
            </div>
            <button class="modal-close-btn" id="forgotCloseBtn">&times;</button>
          </div>

          <div class="modal-body">
            ${successMsg ? `
              <div role="alert" style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 16px; margin-bottom: 20px; text-align: center;">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">📩</div>
                <strong style="display: block; color: var(--primary-dark); font-size: 0.95rem; margin-bottom: 4px;">Reset Link Dispatched</strong>
                <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.4;">${successMsg}</p>
              </div>
              <div style="display: flex; gap: 10px;">
                <button class="btn btn-outline" id="btnOpenResetDirect" style="flex: 1;">Test Reset Password Link</button>
                <button class="btn btn-primary" id="btnForgotBackToLogin" style="flex: 1;">Back to Sign In</button>
              </div>
            ` : `
              <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 16px;">
                Enter your registered agricultural email address or account email. We will send a secure password reset link and SMS code.
              </p>

              ${errorMsg ? `
                <div role="alert" style="background: var(--accent-rose-light); border: 1px solid #fda4af; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 16px; font-size: 0.8125rem; color: var(--accent-rose);">
                  🚨 ${errorMsg}
                </div>
              ` : ''}

              <form id="forgotPassForm">
                <div class="form-group">
                  <label class="form-label" for="forgotEmailInput">Registered Email Address</label>
                  <input 
                    class="form-input" 
                    id="forgotEmailInput" 
                    type="email" 
                    placeholder="e.g. john.kamau@farms.ke"
                    value="john.kamau@farms.ke"
                    required
                    ${isSubmitting ? 'disabled' : ''}
                  >
                  <span class="form-hint">Tip: test 'notfound@ayis.org' to trigger account not found error state.</span>
                </div>

                <div style="margin-top: 24px; display: flex; gap: 10px;">
                  <button type="button" class="btn btn-outline" id="btnCancelForgot" style="flex: 1;" ${isSubmitting ? 'disabled' : ''}>Cancel</button>
                  <button type="submit" class="btn btn-primary" style="flex: 2; justify-content: center;" ${isSubmitting ? 'disabled' : ''}>
                    ${isSubmitting ? 'Sending Request...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            `}
          </div>
        </div>
      `;

      overlay.classList.add('active');

      overlay.querySelector('#forgotCloseBtn').onclick = () => overlay.classList.remove('active');
      overlay.querySelector('#btnCancelForgot')?.addEventListener('click', () => overlay.classList.remove('active'));
      overlay.querySelector('#btnForgotBackToLogin')?.addEventListener('click', () => {
        authViews.showLoginModal();
      });
      overlay.querySelector('#btnOpenResetDirect')?.addEventListener('click', () => {
        authViews.showResetPasswordModal('token_demo_123');
      });

      const form = overlay.querySelector('#forgotPassForm');
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          const emailVal = form.querySelector('#forgotEmailInput').value;
          renderForgotForm('', '', true);

          const result = await authService.forgotPassword(emailVal);
          if (result.success) {
            renderForgotForm('', result.message, false);
          } else {
            renderForgotForm(result.message, '', false);
          }
        };
      }
    };

    renderForgotForm();
  },

  // =========================================================================
  // 3. RESET PASSWORD WORKFLOW
  // =========================================================================
  showResetPasswordModal(token = 'valid_token') {
    let overlay = document.getElementById('globalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const checkPasswordStrength = (pass) => {
      let score = 0;
      if (!pass) return { score: 0, label: 'None', cls: '' };
      if (pass.length >= 8) score++;
      if (/[A-Z]/.test(pass)) score++;
      if (/[0-9]/.test(pass)) score++;
      if (/[^A-Za-z0-9]/.test(pass)) score++;

      if (score <= 1) return { score: 1, label: 'Weak', cls: 'weak' };
      if (score === 2 || score === 3) return { score: 2, label: 'Fair', cls: 'fair' };
      return { score: 3, label: 'Strong (Meets Agricultural Security Policy)', cls: 'strong' };
    };

    const renderResetForm = (errorMsg = '', success = false, isSubmitting = false) => {
      overlay.innerHTML = `
        <div class="modal-window" role="dialog" aria-modal="true" style="max-width: 440px;">
          <div class="modal-header">
            <div>
              <span class="badge badge-green" style="font-size: 0.7rem;">PASSWORD SECURITY</span>
              <h3 class="modal-title" style="margin-top: 6px;">Create New Password</h3>
            </div>
            <button class="modal-close-btn" id="resetCloseBtn">&times;</button>
          </div>

          <div class="modal-body">
            ${success ? `
              <div role="alert" style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 18px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 2.4rem; margin-bottom: 8px;">✅</div>
                <strong style="display: block; color: var(--primary-dark); font-size: 1rem; margin-bottom: 4px;">Password Updated Successfully</strong>
                <p style="font-size: 0.85rem; color: var(--text-secondary);">Your new credentials are now active on MySQL 8 security matrix. Please sign in to proceed.</p>
              </div>
              <button class="btn btn-primary" id="btnResetGoToLogin" style="width: 100%; justify-content: center;">Sign In With New Password</button>
            ` : `
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
                Enter a strong password with at least 8 characters, including letters, numbers, and symbols.
              </p>

              ${errorMsg ? `
                <div role="alert" style="background: var(--accent-rose-light); border: 1px solid #fda4af; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 16px; font-size: 0.8125rem; color: var(--accent-rose);">
                  🚨 ${errorMsg}
                </div>
              ` : ''}

              <form id="resetPassForm">
                <div class="form-group">
                  <label class="form-label" for="resetNewPass">New Password</label>
                  <div style="position: relative;">
                    <input 
                      class="form-input" 
                      id="resetNewPass" 
                      type="password" 
                      placeholder="Minimum 8 characters"
                      required
                      ${isSubmitting ? 'disabled' : ''}
                    >
                    <button type="button" id="btnToggleResetPass1" style="position: absolute; right: 10px; top: 10px; background: transparent; border: none; cursor: pointer; color: var(--text-muted);">👁️</button>
                  </div>
                  <!-- Password Strength Meter -->
                  <div class="password-strength-bar">
                    <div class="password-strength-fill" id="strengthFill"></div>
                  </div>
                  <span class="form-hint" id="strengthLabel" style="font-weight: 700;">Strength: Not evaluated</span>
                </div>

                <div class="form-group">
                  <label class="form-label" for="resetConfirmPass">Confirm New Password</label>
                  <div style="position: relative;">
                    <input 
                      class="form-input" 
                      id="resetConfirmPass" 
                      type="password" 
                      placeholder="Re-enter password"
                      required
                      ${isSubmitting ? 'disabled' : ''}
                    >
                    <button type="button" id="btnToggleResetPass2" style="position: absolute; right: 10px; top: 10px; background: transparent; border: none; cursor: pointer; color: var(--text-muted);">👁️</button>
                  </div>
                </div>

                <div style="margin-top: 24px;">
                  <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;" ${isSubmitting ? 'disabled' : ''}>
                    ${isSubmitting ? 'Updating Password...' : 'Save New Password & Continue'}
                  </button>
                </div>
              </form>
            `}
          </div>
        </div>
      `;

      overlay.classList.add('active');

      overlay.querySelector('#resetCloseBtn').onclick = () => overlay.classList.remove('active');
      overlay.querySelector('#btnResetGoToLogin')?.addEventListener('click', () => {
        authViews.showLoginModal();
      });

      const passInput1 = overlay.querySelector('#resetNewPass');
      const passInput2 = overlay.querySelector('#resetConfirmPass');
      const toggle1 = overlay.querySelector('#btnToggleResetPass1');
      const toggle2 = overlay.querySelector('#btnToggleResetPass2');
      const strengthFill = overlay.querySelector('#strengthFill');
      const strengthLabel = overlay.querySelector('#strengthLabel');

      toggle1?.addEventListener('click', () => {
        passInput1.type = passInput1.type === 'password' ? 'text' : 'password';
      });
      toggle2?.addEventListener('click', () => {
        passInput2.type = passInput2.type === 'password' ? 'text' : 'password';
      });

      passInput1?.addEventListener('input', (e) => {
        const str = checkPasswordStrength(e.target.value);
        if (strengthFill) {
          strengthFill.className = 'password-strength-fill ' + str.cls;
        }
        if (strengthLabel) {
          strengthLabel.textContent = `Strength: ${str.label}`;
          strengthLabel.style.color = str.cls === 'strong' ? 'var(--primary-dark)' : (str.cls === 'fair' ? 'var(--accent-amber)' : 'var(--accent-rose)');
        }
      });

      const form = overlay.querySelector('#resetPassForm');
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          const p1 = passInput1.value;
          const p2 = passInput2.value;

          if (p1 !== p2) {
            renderResetForm('Passwords do not match. Please ensure both fields are identical.', false, false);
            return;
          }

          renderResetForm('', false, true);
          const result = await authService.resetPassword({ token, newPassword: p1, confirmPassword: p2 });
          if (result.success) {
            renderResetForm('', true, false);
          } else {
            renderResetForm(result.message, false, false);
          }
        };
      }
    };

    renderResetForm();
  },

  // =========================================================================
  // 4. FIRST-TIME USER EXPERIENCE (FTUE) MODAL
  // =========================================================================
  showFirstTimeUserModal(user, onComplete) {
    let overlay = document.getElementById('globalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-window" role="dialog" aria-modal="true" style="max-width: 520px;">
        <div class="modal-header" style="background: linear-gradient(to right, #ecfdf5, #ffffff);">
          <div>
            <span class="badge badge-green" style="font-size: 0.7rem;">WELCOME TO AYIS</span>
            <h3 class="modal-title" style="margin-top: 4px; font-size: 1.25rem;">Complete Your Agricultural Profile</h3>
          </div>
          <button class="modal-close-btn" id="ftueCloseBtn">&times;</button>
        </div>

        <form id="ftueForm" class="modal-body">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 18px;">
            Karibu, <strong>${user.firstName}</strong>! To personalize your agronomic recommendations and alert notifications, please confirm your contact details and preferred channels.
          </p>

          <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label class="form-label">Phone Number (for Agromet SMS)</label>
              <input class="form-input" id="ftuePhone" value="${user.phone || '+254 712 000 000'}" required>
            </div>
            <div>
              <label class="form-label">Organization / Ward</label>
              <input class="form-input" id="ftueOrg" value="${user.organization || 'Nakuru District'}" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Agricultural Specialization / Bio</label>
            <textarea class="form-input" id="ftueBio" rows="2">${user.bio || 'Primary crop producer and soil health manager.'}</textarea>
          </div>

          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 18px;">
            <label class="form-label" style="margin-bottom: 8px;">Advisory Notification Channels</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.8125rem;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="ftueSms" checked> Urgent SMS Alerts
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="ftueEmail" checked> Weekly Email Digests
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="ftueWeather" checked> Diurnal Rain Warnings
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="ftueRecs" checked> Crop Stage Recommendations
              </label>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-outline" id="btnSkipFtue">Skip for now</button>
            <button type="submit" class="btn btn-primary" id="btnSaveFtue">Save & Access Dashboard →</button>
          </div>
        </form>
      </div>
    `;

    overlay.classList.add('active');

    overlay.querySelector('#ftueCloseBtn').onclick = () => overlay.classList.remove('active');
    overlay.querySelector('#btnSkipFtue').onclick = () => {
      authService.setProfileCompleted(true);
      overlay.classList.remove('active');
      if (onComplete) onComplete();
    };

    const form = overlay.querySelector('#ftueForm');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const updated = {
        ...user,
        phone: form.querySelector('#ftuePhone').value,
        organization: form.querySelector('#ftueOrg').value,
        bio: form.querySelector('#ftueBio').value,
        notifications: {
          sms: form.querySelector('#ftueSms').checked,
          email: form.querySelector('#ftueEmail').checked,
          weatherAlerts: form.querySelector('#ftueWeather').checked,
          advisoryUpdates: form.querySelector('#ftueRecs').checked
        }
      };

      const btn = form.querySelector('#btnSaveFtue');
      btn.textContent = 'Saving Profile...';
      btn.disabled = true;

      await authService.updateUserProfile(updated);
      overlay.classList.remove('active');
      if (onComplete) onComplete();
    };
  },

  // =========================================================================
  // 5. USER PROFILE MODAL & MANAGEMENT
  // =========================================================================
  showUserProfileModal() {
    let overlay = document.getElementById('globalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const user = authService.getCurrentUser();
    const currentRole = authService.getCurrentRole();
    const roleConfig = ROLE_CONFIG[currentRole] || ROLE_CONFIG.super_admin;
    let activeTab = 'personal';

    const renderProfileUI = (noticeMsg = '') => {
      overlay.innerHTML = `
        <div class="modal-window" role="dialog" aria-modal="true" style="max-width: 620px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div class="avatar" style="width: 48px; height: 48px; font-size: 1.4rem;">${user.avatar || '🌱'}</div>
              <div>
                <h3 class="modal-title">${user.firstName} ${user.lastName}</h3>
                <span class="badge badge-green" style="font-size: 0.7rem;">${roleConfig.name}</span>
              </div>
            </div>
            <button class="modal-close-btn" id="profileCloseBtn">&times;</button>
          </div>

          <!-- Profile Tabs -->
          <div style="display: flex; border-bottom: 1px solid var(--border-color); background: var(--bg-primary); padding: 0 16px;">
            <button class="profile-tab-btn" data-tab="personal" style="padding: 10px 14px; font-size: 0.8125rem; font-weight: 700; background: transparent; border: none; border-bottom: 3px solid ${activeTab === 'personal' ? 'var(--primary)' : 'transparent'}; color: ${activeTab === 'personal' ? 'var(--primary-dark)' : 'var(--text-muted)'}; cursor: pointer;">
              Personal Details
            </button>
            <button class="profile-tab-btn" data-tab="notifications" style="padding: 10px 14px; font-size: 0.8125rem; font-weight: 700; background: transparent; border: none; border-bottom: 3px solid ${activeTab === 'notifications' ? 'var(--primary)' : 'transparent'}; color: ${activeTab === 'notifications' ? 'var(--primary-dark)' : 'var(--text-muted)'}; cursor: pointer;">
              Notifications
            </button>
            <button class="profile-tab-btn" data-tab="security" style="padding: 10px 14px; font-size: 0.8125rem; font-weight: 700; background: transparent; border: none; border-bottom: 3px solid ${activeTab === 'security' ? 'var(--primary)' : 'transparent'}; color: ${activeTab === 'security' ? 'var(--primary-dark)' : 'var(--text-muted)'}; cursor: pointer;">
              Password & Security
            </button>
          </div>

          <div class="modal-body" style="padding: 20px;">
            ${noticeMsg ? `
              <div role="alert" style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: 16px; font-size: 0.8125rem; color: var(--primary-dark);">
                ✅ ${noticeMsg}
              </div>
            ` : ''}

            ${activeTab === 'personal' ? `
              <form id="profilePersonalForm">
                <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <div>
                    <label class="form-label">First Name</label>
                    <input class="form-input" id="profFirst" value="${user.firstName}">
                  </div>
                  <div>
                    <label class="form-label">Last Name</label>
                    <input class="form-input" id="profLast" value="${user.lastName}">
                  </div>
                </div>

                <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <div>
                    <label class="form-label">Email Address</label>
                    <input class="form-input" id="profEmail" value="${user.email}" readonly style="background: #f1f5f9;">
                  </div>
                  <div>
                    <label class="form-label">Contact Phone</label>
                    <input class="form-input" id="profPhone" value="${user.phone || ''}">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Organization / Jurisdiction</label>
                  <input class="form-input" id="profOrg" value="${user.organization || ''}">
                </div>

                <div class="form-group">
                  <label class="form-label">Avatar Emoji / Icon</label>
                  <div style="display: flex; gap: 8px;">
                    ${['🌱', '🌾', '🚜', '👥', '🔐', '📡', '📋', '🔍'].map(ico => `
                      <button type="button" class="btn-avatar-select ${user.avatar === ico ? 'active' : ''}" data-icon="${ico}" style="width: 36px; height: 36px; border: 1px solid ${user.avatar === ico ? 'var(--primary)' : 'var(--border-color)'}; background: ${user.avatar === ico ? 'var(--primary-light)' : 'var(--bg-secondary)'}; border-radius: var(--radius-xs); cursor: pointer; font-size: 1.1rem;">
                        ${ico}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                  <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
              </form>
            ` : ''}

            ${activeTab === 'notifications' ? `
              <form id="profileNotifsForm">
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                  Manage which agricultural dispatches and synoptic climate alerts are delivered to your devices.
                </p>

                <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.85rem;">
                  <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer;">
                    <div>
                      <strong>SMS Weather Advisories</strong>
                      <div style="color: var(--text-muted); font-size: 0.75rem;">Immediate alerts for rainfall > 30mm or severe frost</div>
                    </div>
                    <input type="checkbox" id="notifSms" ${user.notifications?.sms ? 'checked' : ''}>
                  </label>

                  <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer;">
                    <div>
                      <strong>Email Agronomic Digests</strong>
                      <div style="color: var(--text-muted); font-size: 0.75rem;">Weekly summaries of crop stage progressions and NDVI vigor</div>
                    </div>
                    <input type="checkbox" id="notifEmail" ${user.notifications?.email ? 'checked' : ''}>
                  </label>

                  <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer;">
                    <div>
                      <strong>Real-time Spray Window Alerts</strong>
                      <div style="color: var(--text-muted); font-size: 0.75rem;">Notifications when wind speed < 8km/h and RH is optimal</div>
                    </div>
                    <input type="checkbox" id="notifWeather" ${user.notifications?.weatherAlerts ? 'checked' : ''}>
                  </label>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                  <button type="submit" class="btn btn-primary">Update Preferences</button>
                </div>
              </form>
            ` : ''}

            ${activeTab === 'security' ? `
              <div>
                <h4 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 12px;">Authentication & Encryption Credentials</h4>
                <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px; font-size: 0.8125rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <strong>Password:</strong>
                    <span style="color: var(--text-muted);">Last updated 14 days ago</span>
                  </div>
                  <button class="btn btn-outline" id="btnLaunchChangePassword" style="padding: 6px 12px; font-size: 0.75rem;">
                    Change Account Password
                  </button>
                </div>

                <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px; font-size: 0.8125rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>Two-Factor Authentication (2FA)</strong>
                      <div style="color: var(--text-muted); font-size: 0.75rem;">SMS and Authenticator App verification</div>
                    </div>
                    <span class="badge ${user.twoFactorEnabled ? 'badge-green' : 'badge-amber'}">
                      ${user.twoFactorEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                </div>

                <div style="border-top: 1px solid var(--border-subtle); padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.8125rem; color: var(--accent-rose); font-weight: 700;">Active Session: C# JWT Bearer</span>
                  <button class="btn btn-outline" id="btnLogoutBtn" style="color: var(--accent-rose); border-color: var(--accent-rose);">
                    Sign Out
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      overlay.classList.add('active');

      // Bind events
      overlay.querySelector('#profileCloseBtn').onclick = () => overlay.classList.remove('active');

      overlay.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.onclick = () => {
          activeTab = btn.getAttribute('data-tab');
          renderProfileUI();
        };
      });

      overlay.querySelectorAll('.btn-avatar-select').forEach(btn => {
        btn.onclick = () => {
          user.avatar = btn.getAttribute('data-icon');
          renderProfileUI();
        };
      });

      overlay.querySelector('#btnLaunchChangePassword')?.addEventListener('click', () => {
        authViews.showResetPasswordModal();
      });

      overlay.querySelector('#btnLogoutBtn')?.addEventListener('click', () => {
        authService.logout();
        overlay.classList.remove('active');
        window.location.reload();
      });

      const personalForm = overlay.querySelector('#profilePersonalForm');
      if (personalForm) {
        personalForm.onsubmit = async (e) => {
          e.preventDefault();
          user.firstName = personalForm.querySelector('#profFirst').value;
          user.lastName = personalForm.querySelector('#profLast').value;
          user.phone = personalForm.querySelector('#profPhone').value;
          user.organization = personalForm.querySelector('#profOrg').value;
          await authService.updateUserProfile(user);
          renderProfileUI('Profile details updated successfully.');
        };
      }

      const notifsForm = overlay.querySelector('#profileNotifsForm');
      if (notifsForm) {
        notifsForm.onsubmit = async (e) => {
          e.preventDefault();
          user.notifications = {
            sms: notifsForm.querySelector('#notifSms').checked,
            email: notifsForm.querySelector('#notifEmail').checked,
            weatherAlerts: notifsForm.querySelector('#notifWeather').checked
          };
          await authService.updateUserProfile(user);
          renderProfileUI('Notification settings updated.');
        };
      }
    };

    renderProfileUI();
  },

  // =========================================================================
  // 6. FARMER-SPECIFIC 6-STEP ONBOARDING WIZARD WITH INTERACTIVE MAP
  // =========================================================================
  showFarmerOnboardingWizard(onComplete) {
    let currentStep = 1;
    const totalSteps = 6;
    let isSubmitting = false;

    const wizardData = {
      personal: { 
        name: 'Peter Kiprono', 
        phone: '+254 712 345 678', 
        nationalId: 'ID-28491022',
        county: 'Nakuru County' 
      },
      farm: { 
        name: 'Kiprono Family Orchard & Maize', 
        size: '8.5', 
        unit: 'Hectares',
        description: 'Commercial maize holding with rotational dry beans and drip irrigation.' 
      },
      location: { 
        provinceDistrict: 'Rift Valley / Rongai Sub-county', 
        ward: 'Solai Ward',
        latitude: -0.3031, 
        longitude: 36.0800 
      },
      area: { 
        fieldsCount: 2, 
        soilType: 'Volcanic Loam (pH 6.4)',
        irrigation: 'Rainfed + Supplemental Drip',
        topography: 'Gentle Slope (2-5%)'
      },
      activities: { 
        primaryCrop: 'Maize (Zea mays - Highland Hybrid H614D)', 
        rotationCrop: 'Dry Beans (Rosecoco GLP-2)', 
        livestock: 'Dairy Cattle (4 head)',
        farmingSystem: 'Integrated Crop-Livestock'
      }
    };

    let overlay = document.getElementById('globalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    // Interactive Canvas Map Picker initialization
    const initMapPicker = (canvasId, latInputId, lonInputId) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement.clientWidth || 500;
      canvas.height = 180;

      const drawMap = (lat, lon) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Agricultural base grid
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw farm parcels
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        const gridSize = 25;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Surrounding parcel contours
        ctx.fillStyle = 'rgba(5, 150, 105, 0.12)';
        ctx.fillRect(40, 20, 120, 80);
        ctx.strokeStyle = '#059669';
        ctx.strokeRect(40, 20, 120, 80);

        ctx.fillStyle = 'rgba(3, 105, 161, 0.12)';
        ctx.fillRect(220, 50, 160, 90);
        ctx.strokeStyle = '#0369a1';
        ctx.strokeRect(220, 50, 160, 90);

        // Centered pinpoint marker
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.fillStyle = '#be123c';
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 6, cy - 8);
        ctx.lineTo(cx + 6, cy - 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GPS Centroid: ${lat.toFixed(4)}, ${lon.toFixed(4)}`, cx, cy + 22);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('Click anywhere on map to reposition coordinates', cx, cy + 36);
      };

      drawMap(wizardData.location.latitude, wizardData.location.longitude);

      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Calculate offset delta
        const deltaLat = (clickY - canvas.height / 2) * -0.0005;
        const deltaLon = (clickX - canvas.width / 2) * 0.0005;

        wizardData.location.latitude = parseFloat((wizardData.location.latitude + deltaLat).toFixed(4));
        wizardData.location.longitude = parseFloat((wizardData.location.longitude + deltaLon).toFixed(4));

        const latInput = document.getElementById(latInputId);
        const lonInput = document.getElementById(lonInputId);
        if (latInput) latInput.value = wizardData.location.latitude;
        if (lonInput) lonInput.value = wizardData.location.longitude;

        drawMap(wizardData.location.latitude, wizardData.location.longitude);
      });
    };

    const renderStep = (step) => {
      switch (step) {
        // STEP 1: Personal Information
        case 1:
          return `
            <div style="margin-bottom: 16px;">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                Step 1: Farmer & Producer Information
              </h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                Provide the primary contact details for agronomic extension dispatches and SMS advisories.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizName">Farmer Full Name *</label>
              <input class="form-input" id="wizName" value="${wizardData.personal.name}" required>
            </div>

            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label class="form-label" for="wizPhone">Mobile Number (M-Pesa / SMS) *</label>
                <input class="form-input" id="wizPhone" value="${wizardData.personal.phone}" required>
              </div>
              <div>
                <label class="form-label" for="wizId">National ID / Producer ID</label>
                <input class="form-input" id="wizId" value="${wizardData.personal.nationalId}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizCounty">County / Jurisdiction</label>
              <select class="form-input" id="wizCounty">
                <option value="Nakuru County" selected>Nakuru County</option>
                <option value="Uasin Gishu County">Uasin Gishu County</option>
                <option value="Trans-Nzoia County">Trans-Nzoia County</option>
                <option value="Narok County">Narok County</option>
              </select>
            </div>
          `;

        // STEP 2: Farm Information
        case 2:
          return `
            <div style="margin-bottom: 16px;">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                Step 2: Farm Enterprise Profile
              </h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                Define the farm enterprise name, land holding size, and operational overview.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizFarmName">Farm Name / Holding Title *</label>
              <input class="form-input" id="wizFarmName" value="${wizardData.farm.name}" required>
            </div>

            <div class="form-group" style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
              <div>
                <label class="form-label" for="wizFarmSize">Total Farm Size *</label>
                <input class="form-input" id="wizFarmSize" type="number" step="0.1" value="${wizardData.farm.size}" required>
              </div>
              <div>
                <label class="form-label" for="wizUnit">Unit</label>
                <select class="form-input" id="wizUnit">
                  <option value="Hectares" ${wizardData.farm.unit === 'Hectares' ? 'selected' : ''}>Hectares</option>
                  <option value="Acres" ${wizardData.farm.unit === 'Acres' ? 'selected' : ''}>Acres</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizDesc">Optional Description</label>
              <textarea class="form-input" id="wizDesc" rows="2" placeholder="Brief notes on topography, soil history, or farm setup...">${wizardData.farm.description}</textarea>
            </div>
          `;

        // STEP 3: Farm Location & Interactive Map
        case 3:
          return `
            <div style="margin-bottom: 16px;">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                Step 3: Geographic Coordinates & Map Selection
              </h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                Set the centroid location for hyper-local agrometeorological station linkage.
              </p>
            </div>

            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label class="form-label" for="wizDistrict">Province / District / Sub-county</label>
                <input class="form-input" id="wizDistrict" value="${wizardData.location.provinceDistrict}">
              </div>
              <div>
                <label class="form-label" for="wizWard">Ward / Sub-location</label>
                <input class="form-input" id="wizWard" value="${wizardData.location.ward}">
              </div>
            </div>

            <!-- Map Picker Container -->
            <div class="form-group">
              <label class="form-label">Interactive Location & Boundary Pinpoint</label>
              <div class="interactive-map-picker">
                <canvas id="onboardingMapCanvas"></canvas>
              </div>
            </div>

            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label class="form-label" for="wizLat">Latitude (WGS84 POINT)</label>
                <input class="form-input" id="wizLat" type="number" step="0.0001" value="${wizardData.location.latitude}">
              </div>
              <div>
                <label class="form-label" for="wizLon">Longitude (WGS84 POINT)</label>
                <input class="form-input" id="wizLon" type="number" step="0.0001" value="${wizardData.location.longitude}">
              </div>
            </div>
          `;

        // STEP 4: Farm Area & Zoning
        case 4:
          return `
            <div style="margin-bottom: 16px;">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                Step 4: Farm Area, Zoning & Soil Parameters
              </h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                Specify how many individual parcels exist and your predominant soil conditions.
              </p>
            </div>

            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label class="form-label" for="wizPlots">Individual Fields / Plots</label>
                <input class="form-input" id="wizPlots" type="number" min="1" value="${wizardData.area.fieldsCount}">
              </div>
              <div>
                <label class="form-label" for="wizSoil">Dominant Soil Type</label>
                <select class="form-input" id="wizSoil">
                  <option selected>Volcanic Loam (pH 6.4)</option>
                  <option>Clay Loam (pH 5.8)</option>
                  <option>Sandy Loam (pH 6.2)</option>
                  <option>Black Cotton Vertisol (pH 7.1)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizIrrig">Irrigation & Water Access</label>
              <select class="form-input" id="wizIrrig">
                <option>Rainfed Only (Seasonal precipitation dependent)</option>
                <option selected>Rainfed + Supplemental Drip</option>
                <option>Furrow / River Abstraction</option>
                <option>Borehole Pressurized Sprinkler</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizTopog">Parcel Topography</label>
              <select class="form-input" id="wizTopog">
                <option selected>Gentle Slope (2-5%)</option>
                <option>Flat Plain (<2%)</option>
                <option>Moderate Terraced Slopes (6-12%)</option>
              </select>
            </div>
          `;

        // STEP 5: Primary Farming Activities
        case 5:
          return `
            <div style="margin-bottom: 16px;">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                Step 5: Primary Farming Activities & Crops
              </h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                Indicate current crops and production systems for phenological cycle tracking.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizPrimaryCrop">Primary Staple Crop *</label>
              <select class="form-input" id="wizPrimaryCrop">
                <option selected>Maize (Zea mays - Highland Hybrid H614D)</option>
                <option>Wheat (Triticum aestivum - Kenya Tayari)</option>
                <option>Irish Potato (Solanum tuberosum - Shangi)</option>
                <option>Coffee (Coffea arabica - SL28)</option>
                <option>Sorghum (Sorghum bicolor - Gadam)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizRotationCrop">Rotational Legume / Secondary Crop</label>
              <input class="form-input" id="wizRotationCrop" value="${wizardData.activities.rotationCrop}">
            </div>

            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label class="form-label" for="wizLivestock">Livestock / Mixed Farming</label>
                <input class="form-input" id="wizLivestock" value="${wizardData.activities.livestock}">
              </div>
              <div>
                <label class="form-label" for="wizSystem">Farming System</label>
                <select class="form-input" id="wizSystem">
                  <option selected>Integrated Crop-Livestock</option>
                  <option>Commercial Monoculture</option>
                  <option>Subsistence Diversified</option>
                  <option>Organic Conservation Agriculture</option>
                </select>
              </div>
            </div>
          `;

        // STEP 6: Confirmation & Review
        case 6:
          return `
            <div style="margin-bottom: 16px;">
              <span class="badge badge-green" style="margin-bottom: 6px;">READY FOR SYNCHRONIZATION</span>
              <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
                Step 6: Registration Review & Verification
              </h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                Confirm all details before committing the farm parcel into MySQL 8 spatial index.
              </p>
            </div>

            <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 16px; font-size: 0.825rem; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div><strong style="color: var(--text-muted);">Producer:</strong> ${wizardData.personal.name}</div>
              <div><strong style="color: var(--text-muted);">Mobile:</strong> ${wizardData.personal.phone}</div>
              <div><strong style="color: var(--text-muted);">Farm Title:</strong> ${wizardData.farm.name}</div>
              <div><strong style="color: var(--text-muted);">Area:</strong> ${wizardData.farm.size} ${wizardData.farm.unit}</div>
              <div><strong style="color: var(--text-muted);">Jurisdiction:</strong> ${wizardData.location.provinceDistrict}</div>
              <div><strong style="color: var(--text-muted);">Ward:</strong> ${wizardData.location.ward}</div>
              <div style="grid-column: span 2;">
                <strong style="color: var(--text-muted);">GPS Centroid:</strong> POINT(${wizardData.location.longitude} ${wizardData.location.latitude}) [SRID 4326]
              </div>
              <div><strong style="color: var(--text-muted);">Primary Crop:</strong> ${wizardData.activities.primaryCrop}</div>
              <div><strong style="color: var(--text-muted);">Water Infrastructure:</strong> ${wizardData.area.irrigation}</div>
            </div>

            <div style="padding: 12px; background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); font-size: 0.8125rem; color: var(--primary-dark); margin-bottom: 12px;">
              ✅ Spatial coordinates verified: Ready to ingest agromet observations from <strong>Nakuru Agromet [NKU-01]</strong>.
            </div>
          `;
      }
    };

    const updateWizardUI = () => {
      overlay.innerHTML = `
        <div class="modal-window" role="dialog" aria-modal="true" style="max-width: 600px;">
          <div class="modal-header">
            <div>
              <span class="badge badge-green" style="font-size: 0.7rem;">PRODUCER REGISTRATION</span>
              <h3 class="modal-title" style="margin-top: 4px;">Farmer Onboarding (${currentStep} of ${totalSteps})</h3>
            </div>
            <button class="modal-close-btn" id="wizCloseBtn">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Progress Indicator -->
            <div style="width: 100%; height: 6px; background: var(--border-subtle); border-radius: var(--radius-full); margin-bottom: 20px; overflow: hidden;">
              <div style="height: 100%; width: ${(currentStep / totalSteps) * 100}%; background: var(--primary); transition: width 0.3s ease;"></div>
            </div>

            <div id="wizStepContent">
              ${renderStep(currentStep)}
            </div>
          </div>

          <div class="modal-footer">
            ${currentStep > 1 ? '<button class="btn btn-outline" id="wizBackBtn">← Previous Step</button>' : ''}
            <button class="btn btn-primary" id="wizNextBtn" ${isSubmitting ? 'disabled' : ''}>
              ${isSubmitting ? 'Registering Farm Parcel...' : (currentStep === totalSteps ? 'Complete Registration' : 'Next Step →')}
            </button>
          </div>
        </div>
      `;

      overlay.classList.add('active');

      // Initialize map on step 3
      if (currentStep === 3) {
        setTimeout(() => {
          initMapPicker('onboardingMapCanvas', 'wizLat', 'wizLon');
        }, 50);
      }

      // Handlers
      overlay.querySelector('#wizCloseBtn').onclick = () => overlay.classList.remove('active');

      const backBtn = overlay.querySelector('#wizBackBtn');
      if (backBtn) {
        backBtn.onclick = () => {
          if (currentStep > 1) {
            saveCurrentStepValues(currentStep);
            currentStep--;
            updateWizardUI();
          }
        };
      }

      overlay.querySelector('#wizNextBtn').onclick = async () => {
        saveCurrentStepValues(currentStep);

        if (currentStep < totalSteps) {
          currentStep++;
          updateWizardUI();
        } else {
          // Final submission
          isSubmitting = true;
          updateWizardUI();

          const result = await authService.registerFarmerOnboarding(wizardData);
          isSubmitting = false;

          overlay.classList.remove('active');
          alert(`🎉 ${result.message}\nFarm ID: ${result.farmId}`);
          if (onComplete) onComplete(wizardData);
        }
      };
    };

    const saveCurrentStepValues = (step) => {
      switch (step) {
        case 1:
          const nameEl = document.getElementById('wizName');
          const phoneEl = document.getElementById('wizPhone');
          const idEl = document.getElementById('wizId');
          const countyEl = document.getElementById('wizCounty');
          if (nameEl) wizardData.personal.name = nameEl.value;
          if (phoneEl) wizardData.personal.phone = phoneEl.value;
          if (idEl) wizardData.personal.nationalId = idEl.value;
          if (countyEl) wizardData.personal.county = countyEl.value;
          break;
        case 2:
          const farmNameEl = document.getElementById('wizFarmName');
          const farmSizeEl = document.getElementById('wizFarmSize');
          const unitEl = document.getElementById('wizUnit');
          const descEl = document.getElementById('wizDesc');
          if (farmNameEl) wizardData.farm.name = farmNameEl.value;
          if (farmSizeEl) wizardData.farm.size = farmSizeEl.value;
          if (unitEl) wizardData.farm.unit = unitEl.value;
          if (descEl) wizardData.farm.description = descEl.value;
          break;
        case 3:
          const distEl = document.getElementById('wizDistrict');
          const wardEl = document.getElementById('wizWard');
          const latEl = document.getElementById('wizLat');
          const lonEl = document.getElementById('wizLon');
          if (distEl) wizardData.location.provinceDistrict = distEl.value;
          if (wardEl) wizardData.location.ward = wardEl.value;
          if (latEl) wizardData.location.latitude = parseFloat(latEl.value) || wizardData.location.latitude;
          if (lonEl) wizardData.location.longitude = parseFloat(lonEl.value) || wizardData.location.longitude;
          break;
        case 4:
          const plotsEl = document.getElementById('wizPlots');
          const soilEl = document.getElementById('wizSoil');
          const irrigEl = document.getElementById('wizIrrig');
          const topogEl = document.getElementById('wizTopog');
          if (plotsEl) wizardData.area.fieldsCount = parseInt(plotsEl.value) || 2;
          if (soilEl) wizardData.area.soilType = soilEl.value;
          if (irrigEl) wizardData.area.irrigation = irrigEl.value;
          if (topogEl) wizardData.area.topography = topogEl.value;
          break;
        case 5:
          const cropEl = document.getElementById('wizPrimaryCrop');
          const rotEl = document.getElementById('wizRotationCrop');
          const liveEl = document.getElementById('wizLivestock');
          const sysEl = document.getElementById('wizSystem');
          if (cropEl) wizardData.activities.primaryCrop = cropEl.value;
          if (rotEl) wizardData.activities.rotationCrop = rotEl.value;
          if (liveEl) wizardData.activities.livestock = liveEl.value;
          if (sysEl) wizardData.activities.farmingSystem = sysEl.value;
          break;
      }
    };

    updateWizardUI();
  }
};
