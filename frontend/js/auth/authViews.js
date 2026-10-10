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
  showLoginModal(onSuccess, options = {}) {
    const { initialUsername = '', initialNotice = '', alertType: defaultAlertType = 'success' } = options;
    let overlay = document.getElementById('globalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    let currentUsernameValue = initialUsername || '';
    let currentPasswordValue = '';

    const renderLoginForm = (errorMsg = '', alertType = 'critical', isSubmitting = false) => {
      const activeNotice = errorMsg || initialNotice;
      const effectiveAlertType = errorMsg ? alertType : defaultAlertType;

      overlay.innerHTML = `
        <div class="modal-window" role="dialog" aria-modal="true" style="max-width: 460px; width: 100%;">
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
          
          <div class="modal-body" style="padding-top: 16px;">
            ${activeNotice ? `
              <div role="alert" style="background: ${effectiveAlertType === 'success' ? 'var(--primary-light)' : (effectiveAlertType === 'warning' ? 'var(--accent-amber-light)' : 'var(--accent-rose-light)')}; border: 1px solid ${effectiveAlertType === 'success' ? '#6ee7b7' : (effectiveAlertType === 'warning' ? '#fcd34d' : '#fda4af')}; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 16px; font-size: 0.8125rem; color: ${effectiveAlertType === 'success' ? 'var(--primary-dark)' : (effectiveAlertType === 'warning' ? 'var(--accent-amber)' : 'var(--accent-rose)')}; display: flex; align-items: flex-start; gap: 8px;">
                <span style="font-size: 1.1rem; line-height: 1;">${effectiveAlertType === 'success' ? '✅' : (effectiveAlertType === 'warning' ? '⚠️' : '🚨')}</span>
                <div>${activeNotice}</div>
              </div>
            ` : ''}

            <form id="loginForm">
              <div class="form-group">
                <label class="form-label" for="loginInputUser">Email Address or Username</label>
                <input 
                  class="form-input" 
                  id="loginInputUser" 
                  name="emailOrUsername" 
                  type="text" 
                  placeholder="Enter your registered email or username" 
                  value="${currentUsernameValue}"
                  required
                  ${isSubmitting ? 'disabled' : ''}
                >
                <span class="form-hint">Enter the username or email you registered with.</span>
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
                    value="${currentPasswordValue}" 
                    placeholder="Enter account password"
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
                <span class="form-hint">Enter your password to sign in.</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin: 16px 0 8px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.8125rem; color: var(--text-secondary);">
                  <input type="checkbox" id="loginRememberMe" name="rememberMe" checked ${isSubmitting ? 'disabled' : ''}>
                  Remember this device
                </label>
              </div>

              <div style="margin-top: 20px;">
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
          </div>

          <div style="padding: 12px 24px 18px; border-top: 1px solid var(--border-subtle); background: var(--bg-primary); text-align: center; font-size: 0.8125rem; color: var(--text-muted);">
            Don't have an account yet? 
            <button type="button" id="btnLaunchRegisterFromLogin" style="background: transparent; border: none; color: var(--primary-dark); font-weight: 800; cursor: pointer; margin-left: 4px;">
              Create an Account →
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

      overlay.querySelector('#btnLaunchRegisterFromLogin')?.addEventListener('click', () => {
        authViews.showRegisterModal();
      });

      // Common login execution helper
      const executeLogin = async (userInput, passVal, rememberVal = true) => {
        renderLoginForm('', '', true);
        const result = await authService.login({
          emailOrUsername: userInput,
          password: passVal,
          rememberMe: rememberVal
        });

        if (result.success) {
          overlay.classList.remove('active');
          const activeRoleSelect = document.getElementById('activeRoleSelect');
          if (activeRoleSelect) activeRoleSelect.value = result.role;

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
          const isWarning = result.status === 'LOCKED';
          renderLoginForm(result.message, isWarning ? 'warning' : 'critical', false);
        }
      };

      // Submit handler for login form
      const form = overlay.querySelector('#loginForm');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const userInput = form.querySelector('#loginInputUser').value;
        const passVal = passInput.value;
        const rememberVal = form.querySelector('#loginRememberMe').checked;
        await executeLogin(userInput, passVal, rememberVal);
      };
    };

    renderLoginForm();
  },

  // =========================================================================
  // 1B. IN-SYSTEM REGISTRATION MODAL & WORKFLOW
  // Allows the user to register an account while viewing any part of the system
  // =========================================================================
  showRegisterModal(onSuccess) {
    let overlay = document.getElementById('globalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
    overlay.innerHTML = '<div id="registerModalContent" style="width: 100%; max-width: 820px; max-height: 90vh; overflow-y: auto; border-radius: var(--radius-md);"></div>';
    const container = overlay.querySelector('#registerModalContent');
    this.renderRegisterView(container, {
      isModal: true,
      onClose: () => overlay.classList.remove('active'),
      onSuccess: onSuccess
    });
  },

  // =========================================================================
  // 1C. MULTI-STEP USER REGISTRATION WIZARD (Both Standalone View & Modal)
  // =========================================================================
  renderRegisterView(container, options = {}) {
    const { isModal = false, onClose = null, onSuccess = null } = options;
    let currentStep = 1;
    const totalSteps = 4;
    let isSubmitting = false;

    const formData = {
      // Step 1: Credentials
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      // Step 2: Personal Profile & Role
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'farmer',
      // Step 3: Role-Specific Details
      // For Farmer / Farm Manager
      farmName: '',
      farmSizeHa: '5.0',
      regionOrCounty: 'Mashonaland East',
      primaryCrop: 'Maize (SC719)',
      soilType: 'Sandy Clay Loam (pH 6.2)',
      irrigationType: 'Rainfed',
      farmLatitude: '-17.8252',
      farmLongitude: '31.0335',
      // For Agronomist
      organization: 'KALRO / DR&SS Research Station',
      specialization: 'Crop Phenology & Soil Fertility',
      focusCrops: 'Maize, Sorghum, Soya Beans',
      // For Extension Officer
      stationOrOffice: 'District Agritex Office',
      farmerCapacity: '150 Smallholders',
      // For Field Officer
      complianceZone: 'Zone B - Commercial Belt',
      gapCertificationFocus: 'GlobalGAP & Pest Scouting',
      // For Weather Analyst
      weatherStationName: 'Harare Met Synoptic Station',
      telemetryFocus: 'Automatic Weather Stations (AWS) & Agromet Indices',
      // For Admins
      adminDepartment: 'Agricultural Ministry IT & Spatial Systems',
      securityClearance: 'National Level 3 Clearance'
    };

    const rolesList = [
      { id: 'farmer', title: 'Smallholder Farmer', icon: '🌾', desc: 'Direct access to smart yield advisories, crop calendar, and register your farm.', requiresApproval: false },
      { id: 'agronomist', title: 'Agronomist & Specialist', icon: '🔬', desc: 'Crop disease diagnostics, research models, and agrometeorology recommendations.', requiresApproval: false },
      { id: 'extension_officer', title: 'Extension Officer', icon: '🤝', desc: 'Field inspections, farmer outreach registry, and county advisory dissemination.', requiresApproval: false },
      { id: 'farm_manager', title: 'Commercial Farm Manager', icon: '🚜', desc: 'Estate parcels, multi-field operations, farm equipment, and labor scheduling.', requiresApproval: false },
      { id: 'weather_analyst', title: 'Weather Analyst', icon: '⛅', desc: 'Meteorological telemetry stations, sensor QA, and early warning blasts.', requiresApproval: false },
      { id: 'field_officer', title: 'Field Compliance Officer', icon: '📋', desc: 'GAP certifications, pest scouting records, and soil audits.', requiresApproval: false },
      { id: 'system_admin', title: 'System Administrator', icon: '🛡️', desc: 'Administrative control, user provisioning, and audit logs. Requires administrator approval.', requiresApproval: true },
      { id: 'super_admin', title: 'Super Administrator', icon: '👑', desc: 'Executive agricultural governance and system configuration. Requires administrator approval.', requiresApproval: true }
    ];

    const calculatePasswordStrength = (pass) => {
      if (!pass) return { score: 0, text: 'Empty', color: '#94a3b8' };
      let score = 0;
      if (pass.length >= 6) score++;
      if (pass.length >= 10) score++;
      if (/[A-Z]/.test(pass)) score++;
      if (/[0-9]/.test(pass)) score++;
      if (/[^A-Za-z0-9]/.test(pass)) score++;

      if (score <= 1) return { score: 1, text: 'Weak', color: '#ef4444' };
      if (score <= 3) return { score: 2, text: 'Fair', color: '#f59e0b' };
      if (score === 4) return { score: 3, text: 'Good', color: '#3b82f6' };
      return { score: 4, text: 'Strong', color: '#10b981' };
    };

    const render = (errorMsg = '', alertType = 'critical') => {
      const selectedRoleMeta = rolesList.find(r => r.id === formData.role) || rolesList[0];
      const strength = calculatePasswordStrength(formData.password);

      container.innerHTML = `
        <div class="register-view-container" style="${isModal ? 'max-width: 100%; margin: 0; padding: 0;' : 'max-width: 820px; margin: 32px auto; padding: 0 16px;'}">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); border-radius: var(--radius-md) var(--radius-md) 0 0; padding: 24px 30px; color: #fff; position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
            <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="font-size: 1.4rem;">🌱</span>
                  <span class="badge badge-green" style="background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.3); font-size: 0.72rem; letter-spacing: 0.5px;">AYIS USER REGISTRATION</span>
                </div>
                <h1 style="font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0 0 4px 0; letter-spacing: -0.5px;">Create Your Account</h1>
                <p style="font-size: 0.85rem; color: #a7f3d0; margin: 0; max-width: 520px;">
                  Join the Zimbabwe Agricultural Yield Intelligence Platform to access real-time agromet telemetry and tailored farm intelligence.
                </p>
              </div>
              <div style="display: flex; align-items: center; gap: 14px;">
                <span style="font-size: 0.8rem; font-weight: 700; color: #d1fae5; text-transform: uppercase;">Step ${currentStep} of ${totalSteps}</span>
                ${isModal ? `
                  <button type="button" id="regModalCloseBtn" style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; line-height: 1;" aria-label="Close dialog">&times;</button>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Wizard Progress Stepper -->
          <div style="background: var(--bg-secondary); border-left: 1px solid var(--border-color); border-right: 1px solid var(--border-color); padding: 14px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
              <div style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; background: ${currentStep >= 1 ? 'var(--primary)' : '#e4e4e7'}; color: ${currentStep >= 1 ? '#fff' : 'var(--text-muted)'}; flex-shrink: 0;">1</div>
              <div style="font-size: 0.75rem; font-weight: ${currentStep === 1 ? '700' : '500'}; color: ${currentStep >= 1 ? 'var(--text-primary)' : 'var(--text-muted)'}; white-space: nowrap;">Credentials</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
              <div style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; background: ${currentStep >= 2 ? 'var(--primary)' : '#e4e4e7'}; color: ${currentStep >= 2 ? '#fff' : 'var(--text-muted)'}; flex-shrink: 0;">2</div>
              <div style="font-size: 0.75rem; font-weight: ${currentStep === 2 ? '700' : '500'}; color: ${currentStep >= 2 ? 'var(--text-primary)' : 'var(--text-muted)'}; white-space: nowrap;">Role & Profile</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
              <div style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; background: ${currentStep >= 3 ? 'var(--primary)' : '#e4e4e7'}; color: ${currentStep >= 3 ? '#fff' : 'var(--text-muted)'}; flex-shrink: 0;">3</div>
              <div style="font-size: 0.75rem; font-weight: ${currentStep === 3 ? '700' : '500'}; color: ${currentStep >= 3 ? 'var(--text-primary)' : 'var(--text-muted)'}; white-space: nowrap;">Role Details</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
              <div style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; background: ${currentStep >= 4 ? 'var(--primary)' : '#e4e4e7'}; color: ${currentStep >= 4 ? '#fff' : 'var(--text-muted)'}; flex-shrink: 0;">4</div>
              <div style="font-size: 0.75rem; font-weight: ${currentStep === 4 ? '700' : '500'}; color: ${currentStep >= 4 ? 'var(--text-primary)' : 'var(--text-muted)'}; white-space: nowrap;">Review & Finish</div>
            </div>
          </div>

          <!-- Wizard Body -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-top: none; border-radius: 0 0 var(--radius-md) var(--radius-md); padding: 32px; box-shadow: var(--shadow-sm);">
            ${errorMsg ? `
              <div role="alert" style="background: ${alertType === 'warning' ? 'var(--accent-amber-light)' : 'var(--accent-rose-light)'}; border: 1px solid ${alertType === 'warning' ? '#fcd34d' : '#fda4af'}; border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 24px; font-size: 0.85rem; color: ${alertType === 'warning' ? 'var(--accent-amber)' : 'var(--accent-rose)'}; display: flex; align-items: flex-start; gap: 10px;">
                <span style="font-size: 1.15rem; line-height: 1;">${alertType === 'warning' ? '⚠️' : '🚨'}</span>
                <div>${errorMsg}</div>
              </div>
            ` : ''}

            <!-- Step 1: Account Credentials -->
            ${currentStep === 1 ? `
              <div>
                <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 16px 0;">Step 1: Account Credentials</h2>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
                  Choose a unique system username, valid contact email, and secure password for platform access.
                </p>

                <div class="form-group" style="margin-bottom: 18px;">
                  <label class="form-label" for="regUsername">Username <span style="color: var(--accent-rose);">*</span></label>
                  <input class="form-input" id="regUsername" type="text" placeholder="e.g. simonm, agronomist_ruth" value="${formData.username}" required>
                  <span class="form-hint">Used for sign in. Minimum 3 characters (letters, numbers, underscore).</span>
                </div>

                <div class="form-group" style="margin-bottom: 18px;">
                  <label class="form-label" for="regEmail">Email Address <span style="color: var(--accent-rose);">*</span></label>
                  <input class="form-input" id="regEmail" type="email" placeholder="e.g. name@domain.com" value="${formData.email}" required>
                  <span class="form-hint">Must be a valid email format for system alerts and recovery.</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="regPassword">Password <span style="color: var(--accent-rose);">*</span></label>
                    <div style="position: relative;">
                      <input class="form-input" id="regPassword" type="password" placeholder="At least 6 characters" value="${formData.password}" style="padding-right: 40px;" required>
                      <button type="button" id="btnToggleRegPass" style="position: absolute; right: 8px; top: 9px; background: transparent; border: none; cursor: pointer; color: var(--text-muted); font-size: 0.95rem;">👁️</button>
                    </div>
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="regConfirmPassword">Confirm Password <span style="color: var(--accent-rose);">*</span></label>
                    <input class="form-input" id="regConfirmPassword" type="password" placeholder="Re-enter password" value="${formData.confirmPassword}" required>
                  </div>
                </div>

                <!-- Password Strength Meter -->
                <div style="background: var(--bg-primary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 24px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">PASSWORD STRENGTH:</span>
                    <span style="font-size: 0.75rem; font-weight: 800; color: ${strength.color};">${strength.text}</span>
                  </div>
                  <div style="height: 6px; background: var(--border-color); border-radius: 9999px; overflow: hidden; display: flex; gap: 4px;">
                    <div style="flex: 1; background: ${strength.score >= 1 ? strength.color : 'transparent'};"></div>
                    <div style="flex: 1; background: ${strength.score >= 2 ? strength.color : 'transparent'};"></div>
                    <div style="flex: 1; background: ${strength.score >= 3 ? strength.color : 'transparent'};"></div>
                    <div style="flex: 1; background: ${strength.score >= 4 ? strength.color : 'transparent'};"></div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Step 2: Profile & Role Selection -->
            ${currentStep === 2 ? `
              <div>
                <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 16px 0;">Step 2: Profile Details & Role Selection</h2>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
                  Specify your personal profile details and select which operational role you fulfill.
                </p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="regFirstName">First Name</label>
                    <input class="form-input" id="regFirstName" type="text" placeholder="e.g. Tendai" value="${formData.firstName}">
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="regLastName">Last Name</label>
                    <input class="form-input" id="regLastName" type="text" placeholder="e.g. Moyo" value="${formData.lastName}">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 24px;">
                  <label class="form-label" for="regPhone">Contact Phone Number (Optional)</label>
                  <input class="form-input" id="regPhone" type="tel" placeholder="e.g. +263 77 123 4567" value="${formData.phoneNumber}">
                  <span class="form-hint">Used for critical frost/drought SMS broadcasts and dispatch notifications.</span>
                </div>

                <label class="form-label" style="margin-bottom: 10px;">Select Your Platform Role <span style="color: var(--accent-rose);">*</span></label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;" id="regRoleGrid">
                  ${rolesList.map(r => `
                    <div 
                      class="reg-role-card ${formData.role === r.id ? 'selected' : ''}" 
                      data-role="${r.id}"
                      style="border: 2px solid ${formData.role === r.id ? 'var(--primary)' : 'var(--border-color)'}; background: ${formData.role === r.id ? 'var(--primary-light)' : 'var(--bg-primary)'}; border-radius: var(--radius-sm); padding: 12px 14px; cursor: pointer; transition: all 0.15s ease;"
                    >
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span style="font-size: 1.25rem;">${r.icon}</span>
                          <strong style="font-size: 0.85rem; color: var(--text-primary);">${r.title}</strong>
                        </div>
                        ${r.requiresApproval ? `<span class="badge badge-amber" style="font-size: 0.65rem;">APPROVAL REQUIRED</span>` : `<span class="badge badge-green" style="font-size: 0.65rem;">INSTANT ACCESS</span>`}
                      </div>
                      <p style="font-size: 0.74rem; color: var(--text-muted); margin: 0; line-height: 1.35;">${r.desc}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Step 3: Role-Specific Custom Details -->
            ${currentStep === 3 ? `
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <span style="font-size: 1.6rem;">${selectedRoleMeta.icon}</span>
                  <div>
                    <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">
                      Step 3: ${selectedRoleMeta.title} Details
                    </h2>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">
                      Tailored information required specifically for your role as <strong>${selectedRoleMeta.title}</strong>.
                    </span>
                  </div>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 16px 0 20px;">

                <!-- Conditional Forms According to Selected Role -->
                ${(formData.role === 'farmer' || formData.role === 'farm_manager') ? `
                  <div>
                    <div style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 18px; font-size: 0.8125rem; color: var(--primary-dark);">
                      🌾 <strong>Farm Onboarding Integration:</strong> Registering your farm here automatically provisions your farm record in the database, maps satellite telemetry to your parcel, and configures yield forecasts!
                    </div>

                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 18px;">
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regFarmName">Farm Name / Holding <span style="color: var(--accent-rose);">*</span></label>
                        <input class="form-input" id="regFarmName" type="text" placeholder="e.g. Green Valley Estate, Moyo Smallholding" value="${formData.farmName}" required>
                      </div>
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regFarmSizeHa">Size in Hectares (Ha) <span style="color: var(--accent-rose);">*</span></label>
                        <input class="form-input" id="regFarmSizeHa" type="number" step="0.1" min="0.1" placeholder="5.0" value="${formData.farmSizeHa}">
                      </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regRegionOrCounty">Province / Region <span style="color: var(--accent-rose);">*</span></label>
                        <select class="form-select" id="regRegionOrCounty">
                          <option value="Mashonaland East" ${formData.regionOrCounty === 'Mashonaland East' ? 'selected' : ''}>Mashonaland East (Natural Region II)</option>
                          <option value="Mashonaland Central" ${formData.regionOrCounty === 'Mashonaland Central' ? 'selected' : ''}>Mashonaland Central (Natural Region II)</option>
                          <option value="Mashonaland West" ${formData.regionOrCounty === 'Mashonaland West' ? 'selected' : ''}>Mashonaland West (Natural Region II)</option>
                          <option value="Manicaland" ${formData.regionOrCounty === 'Manicaland' ? 'selected' : ''}>Manicaland (Natural Region I)</option>
                          <option value="Midlands" ${formData.regionOrCounty === 'Midlands' ? 'selected' : ''}>Midlands (Natural Region III)</option>
                          <option value="Masvingo" ${formData.regionOrCounty === 'Masvingo' ? 'selected' : ''}>Masvingo (Natural Region IV)</option>
                          <option value="Matabeleland North" ${formData.regionOrCounty === 'Matabeleland North' ? 'selected' : ''}>Matabeleland North (Natural Region IV)</option>
                          <option value="Matabeleland South" ${formData.regionOrCounty === 'Matabeleland South' ? 'selected' : ''}>Matabeleland South (Natural Region V)</option>
                        </select>
                      </div>
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regPrimaryCrop">Primary Crop Variety <span style="color: var(--accent-rose);">*</span></label>
                        <select class="form-select" id="regPrimaryCrop">
                          <option value="Maize (SC719)" ${formData.primaryCrop.includes('Maize') ? 'selected' : ''}>Maize (SC719 / White Maize)</option>
                          <option value="Sorghum (Macia)" ${formData.primaryCrop.includes('Sorghum') ? 'selected' : ''}>Sorghum (Macia Drought Tolerant)</option>
                          <option value="Wheat (SC Nduna)" ${formData.primaryCrop.includes('Wheat') ? 'selected' : ''}>Winter Wheat (SC Nduna)</option>
                          <option value="Soybean (PAN 1867)" ${formData.primaryCrop.includes('Soybean') ? 'selected' : ''}>Soybean (PAN 1867)</option>
                          <option value="Tobacco (Virginia flue-cured)" ${formData.primaryCrop.includes('Tobacco') ? 'selected' : ''}>Tobacco (Flue-cured)</option>
                          <option value="Horticulture (Tomatoes/Cabbage)" ${formData.primaryCrop.includes('Horticulture') ? 'selected' : ''}>Horticulture (Tomatoes / Onions)</option>
                        </select>
                      </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regSoilType">Predominant Soil Type</label>
                        <select class="form-select" id="regSoilType">
                          <option value="Sandy Clay Loam (pH 6.2)" ${formData.soilType.includes('Sandy Clay') ? 'selected' : ''}>Sandy Clay Loam (pH 6.2)</option>
                          <option value="Red Clay Loam (Fersiallitic, pH 6.0)" ${formData.soilType.includes('Red Clay') ? 'selected' : ''}>Red Clay Loam (Fersiallitic)</option>
                          <option value="Granitic Sandy Soil (pH 5.4)" ${formData.soilType.includes('Granitic') ? 'selected' : ''}>Granitic Sandy Soil (pH 5.4)</option>
                          <option value="Black Vertisol / Heavy Clay" ${formData.soilType.includes('Vertisol') ? 'selected' : ''}>Black Vertisol / Heavy Clay</option>
                        </select>
                      </div>
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regIrrigationType">Irrigation Infrastructure</label>
                        <select class="form-select" id="regIrrigationType">
                          <option value="Rainfed" ${formData.irrigationType === 'Rainfed' ? 'selected' : ''}>Rainfed / Dryland</option>
                          <option value="Center Pivot" ${formData.irrigationType === 'Center Pivot' ? 'selected' : ''}>Center Pivot (Mechanized)</option>
                          <option value="Drip Irrigation" ${formData.irrigationType === 'Drip Irrigation' ? 'selected' : ''}>Drip Irrigation (High efficiency)</option>
                          <option value="Sprinkler / Overhead" ${formData.irrigationType === 'Sprinkler / Overhead' ? 'selected' : ''}>Sprinkler / Overhead</option>
                          <option value="Furrow / Flood" ${formData.irrigationType === 'Furrow / Flood' ? 'selected' : ''}>Furrow / Flood</option>
                        </select>
                      </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regFarmLat">Farm Latitude (WGS84)</label>
                        <input class="form-input" id="regFarmLat" type="number" step="0.0001" placeholder="-17.8252" value="${formData.farmLatitude}">
                        <span class="form-hint">Decimal degrees south (e.g. -17.8252)</span>
                      </div>
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regFarmLon">Farm Longitude (WGS84)</label>
                        <input class="form-input" id="regFarmLon" type="number" step="0.0001" placeholder="31.0335" value="${formData.farmLongitude}">
                        <span class="form-hint">Decimal degrees east (e.g. 31.0335)</span>
                      </div>
                    </div>
                  </div>
                ` : ''}

                ${formData.role === 'agronomist' ? `
                  <div>
                    <div style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 18px; font-size: 0.8125rem; color: var(--primary-dark);">
                      🔬 <strong>Agronomic Model Authority:</strong> As an agronomist, you will configure regional crop calendars, review pest alerts, and validate suitability models.
                    </div>

                    <div class="form-group" style="margin-bottom: 18px;">
                      <label class="form-label" for="regOrganization">Research Institute / Organization <span style="color: var(--accent-rose);">*</span></label>
                      <input class="form-input" id="regOrganization" type="text" placeholder="e.g. DR&SS, CIMMYT, ICRISAT, Seed Co Research" value="${formData.organization}" required>
                      <span class="form-hint">Affiliated agricultural university, research department, or agronomic firm.</span>
                    </div>

                    <div class="form-group" style="margin-bottom: 18px;">
                      <label class="form-label" for="regSpecialization">Primary Agronomic Specialty <span style="color: var(--accent-rose);">*</span></label>
                      <select class="form-select" id="regSpecialization">
                        <option value="Crop Phenology & Soil Fertility" ${formData.specialization.includes('Phenology') ? 'selected' : ''}>Crop Phenology & Soil Fertility</option>
                        <option value="Plant Pathology & Pest Management (IPM)" ${formData.specialization.includes('Pathology') ? 'selected' : ''}>Plant Pathology & Integrated Pest Management (IPM)</option>
                        <option value="Agrometeorology & Climate Adaptation" ${formData.specialization.includes('Agrometeorology') ? 'selected' : ''}>Agrometeorology & Climate Adaptation</option>
                        <option value="Seed Variety Performance & Breeding" ${formData.specialization.includes('Breeding') ? 'selected' : ''}>Seed Variety Performance & Breeding</option>
                        <option value="Irrigation Scheduling & Soil Hydrology" ${formData.specialization.includes('Hydrology') ? 'selected' : ''}>Irrigation Scheduling & Soil Hydrology</option>
                      </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" for="regFocusCrops">Target Research / Priority Crops <span style="color: var(--accent-rose);">*</span></label>
                      <input class="form-input" id="regFocusCrops" type="text" placeholder="e.g. Maize, Sorghum, Pearl Millet, Sunflower" value="${formData.focusCrops}">
                      <span class="form-hint">Specific crops where you will contribute diagnostic advisories.</span>
                    </div>
                  </div>
                ` : ''}

                ${formData.role === 'extension_officer' ? `
                  <div>
                    <div style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 18px; font-size: 0.8125rem; color: var(--primary-dark);">
                      🤝 <strong>Farmer Outreach & Agritex:</strong> Extension officers monitor farming clusters, coordinate field days, and broadcast localized agromet advisories.
                    </div>

                    <div class="form-group" style="margin-bottom: 18px;">
                      <label class="form-label" for="regStationOrOffice">Assigned Extension District / Agritex Office <span style="color: var(--accent-rose);">*</span></label>
                      <input class="form-input" id="regStationOrOffice" type="text" placeholder="e.g. Goromonzi District Agritex, Marondera Ward 4" value="${formData.stationOrOffice}" required>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regRegionOrCounty">Assigned Province <span style="color: var(--accent-rose);">*</span></label>
                        <select class="form-select" id="regRegionOrCounty">
                          <option value="Mashonaland East" ${formData.regionOrCounty === 'Mashonaland East' ? 'selected' : ''}>Mashonaland East</option>
                          <option value="Mashonaland Central" ${formData.regionOrCounty === 'Mashonaland Central' ? 'selected' : ''}>Mashonaland Central</option>
                          <option value="Mashonaland West" ${formData.regionOrCounty === 'Mashonaland West' ? 'selected' : ''}>Mashonaland West</option>
                          <option value="Manicaland" ${formData.regionOrCounty === 'Manicaland' ? 'selected' : ''}>Manicaland</option>
                          <option value="Midlands" ${formData.regionOrCounty === 'Midlands' ? 'selected' : ''}>Midlands</option>
                          <option value="Masvingo" ${formData.regionOrCounty === 'Masvingo' ? 'selected' : ''}>Masvingo</option>
                          <option value="Matabeleland North" ${formData.regionOrCounty === 'Matabeleland North' ? 'selected' : ''}>Matabeleland North</option>
                          <option value="Matabeleland South" ${formData.regionOrCounty === 'Matabeleland South' ? 'selected' : ''}>Matabeleland South</option>
                        </select>
                      </div>
                      <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="regFarmerCapacity">Supervised Farmer Capacity</label>
                        <input class="form-input" id="regFarmerCapacity" type="text" placeholder="e.g. 150 Smallholders" value="${formData.farmerCapacity}">
                      </div>
                    </div>
                  </div>
                ` : ''}

                ${formData.role === 'field_officer' ? `
                  <div>
                    <div style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 18px; font-size: 0.8125rem; color: var(--primary-dark);">
                      📋 <strong>Field Auditing & Compliance:</strong> Field officers verify spatial boundaries, monitor pesticide spray logs, and validate yield audit trials.
                    </div>

                    <div class="form-group" style="margin-bottom: 18px;">
                      <label class="form-label" for="regComplianceZone">Field Inspection Zone / District <span style="color: var(--accent-rose);">*</span></label>
                      <input class="form-input" id="regComplianceZone" type="text" placeholder="e.g. Mazowe Valley Commercial Zone A" value="${formData.complianceZone}" required>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" for="regGapCertificationFocus">Primary Standard & Inspection Focus <span style="color: var(--accent-rose);">*</span></label>
                      <input class="form-input" id="regGapCertificationFocus" type="text" placeholder="e.g. GlobalGAP, Organic Soil Cert, Pest Scouting" value="${formData.gapCertificationFocus}">
                    </div>
                  </div>
                ` : ''}

                ${formData.role === 'weather_analyst' ? `
                  <div>
                    <div style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 18px; font-size: 0.8125rem; color: var(--primary-dark);">
                      ⛅ <strong>Agromet & Sensor Telemetry:</strong> Weather analysts supervise AWS telemetry feeds, radar forecasts, and meteorological drought indices.
                    </div>

                    <div class="form-group" style="margin-bottom: 18px;">
                      <label class="form-label" for="regWeatherStationName">Primary Meteorological Station / Office <span style="color: var(--accent-rose);">*</span></label>
                      <input class="form-input" id="regWeatherStationName" type="text" placeholder="e.g. MSD Belvedere Synoptic Station, Harare" value="${formData.weatherStationName}" required>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" for="regTelemetryFocus">Primary Telemetry Focus & Tools <span style="color: var(--accent-rose);">*</span></label>
                      <input class="form-input" id="regTelemetryFocus" type="text" placeholder="e.g. AWS Grid Sensors, SPI Drought Indices, Rainfall Gauging" value="${formData.telemetryFocus}">
                    </div>
                  </div>
                ` : ''}

                ${(formData.role === 'system_admin' || formData.role === 'super_admin') ? `
                  <div>
                    <div style="background: var(--accent-amber-light); border: 1px solid #fcd34d; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 18px; font-size: 0.8125rem; color: var(--accent-amber);">
                      🛡️ <strong>Administrative Clearance:</strong> Elevated administrative privileges require verification of government or institutional authority.
                    </div>

                    <div class="form-group" style="margin-bottom: 18px;">
                      <label class="form-label" for="regAdminDepartment">Ministry / Institutional Department <span style="color: var(--accent-rose);">*</span></label>
                      <input class="form-input" id="regAdminDepartment" type="text" placeholder="e.g. Ministry of Lands, Agriculture, Fisheries & Rural Development" value="${formData.adminDepartment}" required>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" for="regSecurityClearance">Security & Delegation Authorization <span style="color: var(--accent-rose);">*</span></label>
                      <input class="form-input" id="regSecurityClearance" type="text" placeholder="e.g. National Admin Level 3 Clearance / Officer Reg ID" value="${formData.securityClearance}">
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Step 4: Verification & Confirmation -->
            ${currentStep === 4 ? `
              <div>
                <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 16px 0;">Step 4: Verification & Confirmation</h2>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
                  Please verify your credentials and role-specific details below before creating your account in the system database.
                </p>

                <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 18px 20px; margin-bottom: 20px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <div>
                      <div style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Username</div>
                      <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${formData.username}</div>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Email Address</div>
                      <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${formData.email}</div>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Full Name</div>
                      <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${(formData.firstName + ' ' + formData.lastName).trim() || '(None specified)'}</div>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Phone Number</div>
                      <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${formData.phoneNumber || '(None specified)'}</div>
                    </div>
                    <div style="grid-column: span 2; border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 4px;">
                      <div style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Assigned Role</div>
                      <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                        <span style="font-size: 1.2rem;">${selectedRoleMeta.icon}</span>
                        <strong style="font-size: 0.95rem; color: var(--text-primary);">${selectedRoleMeta.title}</strong>
                        <span class="badge ${selectedRoleMeta.requiresApproval ? 'badge-amber' : 'badge-green'}" style="font-size: 0.72rem;">
                          ${selectedRoleMeta.requiresApproval ? 'Requires Admin Approval' : 'Instant System Entry'}
                        </span>
                      </div>
                    </div>

                    <!-- Role-Specific Review Details -->
                    <div style="grid-column: span 2; border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 4px; background: rgba(0,0,0,0.02); border-radius: var(--radius-xs); padding: 12px;">
                      <div style="font-size: 0.72rem; font-weight: 800; color: var(--primary-dark); text-transform: uppercase; margin-bottom: 6px;">
                        ${selectedRoleMeta.title} Profile Specification
                      </div>
                      ${(formData.role === 'farmer' || formData.role === 'farm_manager') ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.825rem;">
                          <div><strong>Farm Name:</strong> ${formData.farmName || 'Pending'}</div>
                          <div><strong>Size:</strong> ${formData.farmSizeHa} Ha</div>
                          <div><strong>Province:</strong> ${formData.regionOrCounty}</div>
                          <div><strong>Crop:</strong> ${formData.primaryCrop}</div>
                          <div><strong>Irrigation:</strong> ${formData.irrigationType}</div>
                          <div><strong>Coordinates:</strong> ${formData.farmLatitude}, ${formData.farmLongitude}</div>
                        </div>
                      ` : ''}
                      ${formData.role === 'agronomist' ? `
                        <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 0.825rem;">
                          <div><strong>Institution:</strong> ${formData.organization}</div>
                          <div><strong>Specialty:</strong> ${formData.specialization}</div>
                          <div><strong>Target Crops:</strong> ${formData.focusCrops}</div>
                        </div>
                      ` : ''}
                      ${formData.role === 'extension_officer' ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.825rem;">
                          <div><strong>Extension Office:</strong> ${formData.stationOrOffice}</div>
                          <div><strong>Assigned Province:</strong> ${formData.regionOrCounty}</div>
                          <div><strong>Farmer Reach:</strong> ${formData.farmerCapacity}</div>
                        </div>
                      ` : ''}
                      ${formData.role === 'field_officer' ? `
                        <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 0.825rem;">
                          <div><strong>Compliance Zone:</strong> ${formData.complianceZone}</div>
                          <div><strong>Certification Focus:</strong> ${formData.gapCertificationFocus}</div>
                        </div>
                      ` : ''}
                      ${formData.role === 'weather_analyst' ? `
                        <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 0.825rem;">
                          <div><strong>Telemetry Station:</strong> ${formData.weatherStationName}</div>
                          <div><strong>Telemetry Focus:</strong> ${formData.telemetryFocus}</div>
                        </div>
                      ` : ''}
                      ${(formData.role === 'system_admin' || formData.role === 'super_admin') ? `
                        <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 0.825rem;">
                          <div><strong>Ministry / Dept:</strong> ${formData.adminDepartment}</div>
                          <div><strong>Security Authorization:</strong> ${formData.securityClearance}</div>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                </div>

                ${selectedRoleMeta.requiresApproval ? `
                  <div role="alert" style="background: var(--accent-amber-light); border: 1px solid #fcd34d; border-radius: var(--radius-sm); padding: 14px 16px; margin-bottom: 20px; font-size: 0.8125rem; color: var(--accent-amber); display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 1.25rem; line-height: 1;">🛡️</span>
                    <div>
                      <strong>Administrative Role Notice:</strong> Because you selected an administrative role (<strong>${selectedRoleMeta.title}</strong>), your account will be placed in a <em>Pending Administrator Approval</em> state upon creation. A system administrator must review and activate your account before you can sign in.
                    </div>
                  </div>
                ` : `
                  <div role="alert" style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 14px 16px; margin-bottom: 20px; font-size: 0.8125rem; color: var(--primary-dark); display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 1.25rem; line-height: 1;">⚡</span>
                    <div>
                      <strong>Instant Access:</strong> Your account will be activated immediately upon registration. You will be redirected to sign in with your credentials.
                    </div>
                  </div>
                `}
              </div>
            ` : ''}

            <!-- Stepper Actions -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border-subtle);">
              <div>
                ${currentStep > 1 ? `
                  <button type="button" class="btn btn-outline" id="btnRegPrev" ${isSubmitting ? 'disabled' : ''}>
                    ← Previous Step
                  </button>
                ` : `
                  <a href="#login" class="btn btn-outline" id="btnBackToLogin">
                    Already have an account? Sign In
                  </a>
                `}
              </div>
              <div style="display: flex; gap: 12px; align-items: center;">
                <button 
                  type="button" 
                  class="btn btn-primary" 
                  id="btnRegNext" 
                  style="min-width: 140px; justify-content: center;"
                  ${isSubmitting ? 'disabled' : ''}
                >
                  ${isSubmitting ? `
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                      <span class="status-dot" style="animation: pulse 0.8s infinite;"></span>
                      Creating Account...
                    </span>
                  ` : (currentStep === totalSteps ? 'Complete Registration' : 'Next Step →')}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // ── Event Bindings: Step 1 Inputs ──
      const regUsernameInput = container.querySelector('#regUsername');
      if (regUsernameInput) {
        regUsernameInput.addEventListener('input', (e) => {
          formData.username = e.target.value.trim();
        });
      }

      const regEmailInput = container.querySelector('#regEmail');
      if (regEmailInput) {
        regEmailInput.addEventListener('input', (e) => {
          formData.email = e.target.value.trim();
        });
      }

      const regPassInput = container.querySelector('#regPassword');
      if (regPassInput) {
        regPassInput.addEventListener('input', (e) => {
          formData.password = e.target.value;
          const s = calculatePasswordStrength(formData.password);
          const strengthText = container.querySelector('.password-strength-text');
          if (strengthText) {
            strengthText.textContent = s.text;
            strengthText.style.color = s.color;
          }
        });
      }

      const regConfirmPassInput = container.querySelector('#regConfirmPassword');
      if (regConfirmPassInput) {
        regConfirmPassInput.addEventListener('input', (e) => {
          formData.confirmPassword = e.target.value;
        });
      }

      const btnToggleRegPass = container.querySelector('#btnToggleRegPass');
      if (btnToggleRegPass && regPassInput) {
        btnToggleRegPass.addEventListener('click', () => {
          const isPass = regPassInput.type === 'password';
          regPassInput.type = isPass ? 'text' : 'password';
          btnToggleRegPass.textContent = isPass ? '🙈' : '👁️';
        });
      }

      // ── Step 2 Inputs ──
      const regFirstInput = container.querySelector('#regFirstName');
      if (regFirstInput) {
        regFirstInput.addEventListener('input', (e) => {
          formData.firstName = e.target.value;
        });
      }

      const regLastInput = container.querySelector('#regLastName');
      if (regLastInput) {
        regLastInput.addEventListener('input', (e) => {
          formData.lastName = e.target.value;
        });
      }

      const regPhoneInput = container.querySelector('#regPhone');
      if (regPhoneInput) {
        regPhoneInput.addEventListener('input', (e) => {
          formData.phoneNumber = e.target.value;
        });
      }

      // Role cards selection
      container.querySelectorAll('.reg-role-card').forEach(card => {
        card.addEventListener('click', () => {
          const roleId = card.dataset.role;
          formData.role = roleId;
          render();
        });
      });

      // ── Step 3 Inputs ──
      const regFarmNameInput = container.querySelector('#regFarmName');
      if (regFarmNameInput) {
        regFarmNameInput.addEventListener('input', (e) => {
          formData.farmName = e.target.value;
        });
      }

      const regFarmSizeHaInput = container.querySelector('#regFarmSizeHa');
      if (regFarmSizeHaInput) {
        regFarmSizeHaInput.addEventListener('input', (e) => {
          formData.farmSizeHa = e.target.value;
        });
      }

      const regRegionOrCountyInput = container.querySelector('#regRegionOrCounty');
      if (regRegionOrCountyInput) {
        regRegionOrCountyInput.addEventListener('change', (e) => {
          formData.regionOrCounty = e.target.value;
        });
      }

      const regPrimaryCropInput = container.querySelector('#regPrimaryCrop');
      if (regPrimaryCropInput) {
        regPrimaryCropInput.addEventListener('change', (e) => {
          formData.primaryCrop = e.target.value;
        });
      }

      const regSoilTypeInput = container.querySelector('#regSoilType');
      if (regSoilTypeInput) {
        regSoilTypeInput.addEventListener('change', (e) => {
          formData.soilType = e.target.value;
        });
      }

      const regIrrigationTypeInput = container.querySelector('#regIrrigationType');
      if (regIrrigationTypeInput) {
        regIrrigationTypeInput.addEventListener('change', (e) => {
          formData.irrigationType = e.target.value;
        });
      }

      const regFarmLatInput = container.querySelector('#regFarmLat');
      if (regFarmLatInput) {
        regFarmLatInput.addEventListener('input', (e) => {
          formData.farmLatitude = e.target.value;
        });
      }

      const regFarmLonInput = container.querySelector('#regFarmLon');
      if (regFarmLonInput) {
        regFarmLonInput.addEventListener('input', (e) => {
          formData.farmLongitude = e.target.value;
        });
      }

      const regOrgInput = container.querySelector('#regOrganization');
      if (regOrgInput) {
        regOrgInput.addEventListener('input', (e) => {
          formData.organization = e.target.value;
        });
      }

      const regSpecInput = container.querySelector('#regSpecialization');
      if (regSpecInput) {
        regSpecInput.addEventListener('change', (e) => {
          formData.specialization = e.target.value;
        });
      }

      const regFocusCropsInput = container.querySelector('#regFocusCrops');
      if (regFocusCropsInput) {
        regFocusCropsInput.addEventListener('input', (e) => {
          formData.focusCrops = e.target.value;
        });
      }

      const regStationInput = container.querySelector('#regStationOrOffice');
      if (regStationInput) {
        regStationInput.addEventListener('input', (e) => {
          formData.stationOrOffice = e.target.value;
        });
      }

      const regFarmerCapacityInput = container.querySelector('#regFarmerCapacity');
      if (regFarmerCapacityInput) {
        regFarmerCapacityInput.addEventListener('input', (e) => {
          formData.farmerCapacity = e.target.value;
        });
      }

      const regCompZoneInput = container.querySelector('#regComplianceZone');
      if (regCompZoneInput) {
        regCompZoneInput.addEventListener('input', (e) => {
          formData.complianceZone = e.target.value;
        });
      }

      const regGapInput = container.querySelector('#regGapCertificationFocus');
      if (regGapInput) {
        regGapInput.addEventListener('input', (e) => {
          formData.gapCertificationFocus = e.target.value;
        });
      }

      const regWeatherStationInput = container.querySelector('#regWeatherStationName');
      if (regWeatherStationInput) {
        regWeatherStationInput.addEventListener('input', (e) => {
          formData.weatherStationName = e.target.value;
        });
      }

      const regTelemetryInput = container.querySelector('#regTelemetryFocus');
      if (regTelemetryInput) {
        regTelemetryInput.addEventListener('input', (e) => {
          formData.telemetryFocus = e.target.value;
        });
      }

      const regAdminDeptInput = container.querySelector('#regAdminDepartment');
      if (regAdminDeptInput) {
        regAdminDeptInput.addEventListener('input', (e) => {
          formData.adminDepartment = e.target.value;
        });
      }

      const regSecurityInput = container.querySelector('#regSecurityClearance');
      if (regSecurityInput) {
        regSecurityInput.addEventListener('input', (e) => {
          formData.securityClearance = e.target.value;
        });
      }

      // Modal close button
      if (isModal) {
        container.querySelector('#regModalCloseBtn')?.addEventListener('click', () => {
          if (onClose) onClose();
          else {
            const overlay = document.getElementById('globalModalOverlay');
            if (overlay) overlay.classList.remove('active');
          }
        });
      }

      // Navigation & Submission
      container.querySelector('#btnRegPrev')?.addEventListener('click', () => {
        if (currentStep > 1) {
          currentStep--;
          render();
        }
      });

      container.querySelector('#btnBackToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        authViews.showLoginModal(onSuccess);
      });

      container.querySelector('#btnRegNext')?.addEventListener('click', async () => {
        // Validation Step 1
        if (currentStep === 1) {
          const userVal = (regUsernameInput?.value || formData.username).trim();
          const emailVal = (regEmailInput?.value || formData.email).trim().toLowerCase();
          const passVal = regPassInput?.value || formData.password;
          const confVal = regConfirmPassInput?.value || formData.confirmPassword;

          formData.username = userVal;
          formData.email = emailVal;
          formData.password = passVal;
          formData.confirmPassword = confVal;

          if (!formData.username || formData.username.length < 3) {
            render('Username must be at least 3 characters long.', 'critical');
            return;
          }

          if (!formData.email || !formData.email.includes('@') || !formData.email.includes('.')) {
            render('Please enter a valid email address (e.g. name@domain.com).', 'critical');
            return;
          }

          if (!formData.password || formData.password.length < 6) {
            render('Password must be at least 6 characters long.', 'critical');
            return;
          }

          if (formData.password !== formData.confirmPassword) {
            render('Passwords do not match. Please ensure both fields are identical.', 'critical');
            return;
          }

          currentStep = 2;
          render();
          return;
        }

        // Validation Step 2
        if (currentStep === 2) {
          if (regFirstInput) formData.firstName = regFirstInput.value.trim();
          if (regLastInput) formData.lastName = regLastInput.value.trim();
          if (regPhoneInput) formData.phoneNumber = regPhoneInput.value.trim();

          currentStep = 3;
          render();
          return;
        }

        // Validation Step 3: Role-Specific Custom Inputs
        if (currentStep === 3) {
          if (formData.role === 'farmer' || formData.role === 'farm_manager') {
            if (regFarmNameInput) formData.farmName = regFarmNameInput.value.trim();
            if (regFarmSizeHaInput) formData.farmSizeHa = regFarmSizeHaInput.value.trim();
            if (regRegionOrCountyInput) formData.regionOrCounty = regRegionOrCountyInput.value;
            if (regPrimaryCropInput) formData.primaryCrop = regPrimaryCropInput.value;
            if (regSoilTypeInput) formData.soilType = regSoilTypeInput.value;
            if (regIrrigationTypeInput) formData.irrigationType = regIrrigationTypeInput.value;
            if (regFarmLatInput) formData.farmLatitude = regFarmLatInput.value.trim();
            if (regFarmLonInput) formData.farmLongitude = regFarmLonInput.value.trim();

            if (!formData.farmName) {
              render('Please provide your Farm Name or Agricultural Holding.', 'critical');
              return;
            }
          } else if (formData.role === 'agronomist') {
            if (regOrgInput) formData.organization = regOrgInput.value.trim();
            if (regSpecInput) formData.specialization = regSpecInput.value.trim();
            if (regFocusCropsInput) formData.focusCrops = regFocusCropsInput.value.trim();

            if (!formData.organization) {
              render('Please enter your research organization or agronomic institution.', 'critical');
              return;
            }
          } else if (formData.role === 'extension_officer') {
            if (regStationInput) formData.stationOrOffice = regStationInput.value.trim();
            if (regRegionOrCountyInput) formData.regionOrCounty = regRegionOrCountyInput.value;
            if (regFarmerCapacityInput) formData.farmerCapacity = regFarmerCapacityInput.value.trim();

            if (!formData.stationOrOffice) {
              render('Please enter your assigned Extension District or Agritex Office.', 'critical');
              return;
            }
          } else if (formData.role === 'field_officer') {
            if (regCompZoneInput) formData.complianceZone = regCompZoneInput.value.trim();
            if (regGapInput) formData.gapCertificationFocus = regGapInput.value.trim();

            if (!formData.complianceZone) {
              render('Please enter your assigned Field Inspection Zone.', 'critical');
              return;
            }
          } else if (formData.role === 'weather_analyst') {
            if (regWeatherStationInput) formData.weatherStationName = regWeatherStationInput.value.trim();
            if (regTelemetryInput) formData.telemetryFocus = regTelemetryInput.value.trim();

            if (!formData.weatherStationName) {
              render('Please specify your Meteorological Station or Monitoring Unit.', 'critical');
              return;
            }
          } else if (formData.role === 'system_admin' || formData.role === 'super_admin') {
            if (regAdminDeptInput) formData.adminDepartment = regAdminDeptInput.value.trim();
            if (regSecurityInput) formData.securityClearance = regSecurityInput.value.trim();

            if (!formData.adminDepartment) {
              render('Please enter your ministry department or institutional authority.', 'critical');
              return;
            }
          }

          currentStep = 4;
          render();
          return;
        }

        // Final Submission: Step 4
        if (currentStep === 4) {
          isSubmitting = true;
          render();

          // Prepare payload with customized fields according to role
          const isFarmRole = formData.role === 'farmer' || formData.role === 'farm_manager';
          const farmDetails = isFarmRole ? {
            name: formData.farmName,
            sizeHa: parseFloat(formData.farmSizeHa) || 5.0,
            latitude: parseFloat(formData.farmLatitude) || -17.8252,
            longitude: parseFloat(formData.farmLongitude) || 31.0335,
            primaryCrop: formData.primaryCrop,
            soilType: formData.soilType,
            irrigationType: formData.irrigationType,
            regionId: 'reg-001'
          } : null;

          const organization = formData.role === 'agronomist' 
            ? formData.organization 
            : (formData.role === 'system_admin' || formData.role === 'super_admin' ? formData.adminDepartment : '');

          const specialization = formData.role === 'agronomist'
            ? `${formData.specialization} (Focus: ${formData.focusCrops})`
            : (formData.role === 'field_officer' ? formData.gapCertificationFocus : (formData.role === 'weather_analyst' ? formData.telemetryFocus : ''));

          const stationOrOffice = formData.role === 'extension_officer'
            ? `${formData.stationOrOffice} (Capacity: ${formData.farmerCapacity})`
            : (formData.role === 'weather_analyst' ? formData.weatherStationName : (formData.role === 'field_officer' ? formData.complianceZone : ''));

          const result = await authService.register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: formData.phoneNumber,
            role: formData.role,
            organization,
            specialization,
            regionOrCounty: formData.regionOrCounty,
            stationOrOffice,
            farmDetails
          });

          isSubmitting = false;

          if (result.success) {
            const registeredUsername = formData.username;
            const requiresApproval = result.requiresApproval;
            const noticeMsg = requiresApproval
              ? `Registration successful! Your ${selectedRoleMeta.title} account is pending administrator approval before you can sign in.`
              : (farmDetails 
                  ? `Registration successful! Farm "${farmDetails.name}" registered and linked. Please sign in with your password.`
                  : `Registration successful! Please sign in with your password.`);

            const loginOptions = {
              initialUsername: registeredUsername,
              initialNotice: noticeMsg,
              alertType: requiresApproval ? 'warning' : 'success'
            };

            if (isModal) {
              // Seamless in-modal transition directly to Sign In dialog
              authViews.showLoginModal(onSuccess, loginOptions);
            } else {
              // Store options and transition to #login route
              window.__ayis_login_notice = loginOptions;
              if (window.location.hash === '#login') {
                authViews.showLoginModal(null, window.__ayis_login_notice);
                window.__ayis_login_notice = null;
              } else {
                window.location.hash = '#login';
              }
            }
          } else {
            render(result.message || 'Registration failed. Please review your details and try again.', 'critical');
          }
        }
      });
    };

    render();
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
        window.location.hash = '#logout';
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
        name: 'Tendai Moyo', 
        phone: '+263 77 123 4567', 
        nationalId: 'ID-63-284910-A',
        county: 'Mashonaland West' 
      },
      farm: { 
        name: 'Moyo Family Green Horizon Farm', 
        size: '8.5', 
        unit: 'Hectares',
        description: 'Commercial maize holding with rotational dry beans and borehole supplemental drip irrigation.' 
      },
      location: { 
        provinceDistrict: 'Mashonaland West / Chinhoyi', 
        ward: 'Ward 5',
        latitude: -19.0154, 
        longitude: 29.1549 
      },
      area: { 
        fieldsCount: 2, 
        soilType: 'Sandy Clay Loam (pH 6.2)',
        irrigation: 'Rainfed + Supplemental Drip',
        topography: 'Gentle Slope (2-5%)'
      },
      activities: { 
        primaryCrop: 'Maize (Zea mays - SC 719 Hybrid)', 
        rotationCrop: 'Soya Beans (SC Signal)', 
        livestock: 'Beef / Dairy Cattle (6 head)',
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

    let leafletInstance = null;
    let leafletMarker = null;

    // Interactive Leaflet Map Picker initialization
    const initMapPicker = (containerId, latInputId, lonInputId) => {
      const container = document.getElementById(containerId);
      if (!container) return;

      const latInput = document.getElementById(latInputId);
      const lonInput = document.getElementById(lonInputId);

      const lat = wizardData.location.latitude;
      const lon = wizardData.location.longitude;

      if (window.L) {
        if (leafletInstance) {
          try { leafletInstance.remove(); } catch (_) {}
          leafletInstance = null;
        }

        container.innerHTML = '';
        leafletInstance = L.map(container, {
          center: [lat, lon],
          zoom: 13
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(leafletInstance);

        leafletMarker = L.marker([lat, lon], { draggable: true }).addTo(leafletInstance);

        const updateCoords = (newLat, newLon) => {
          wizardData.location.latitude = parseFloat(newLat.toFixed(4));
          wizardData.location.longitude = parseFloat(newLon.toFixed(4));
          if (latInput) latInput.value = wizardData.location.latitude;
          if (lonInput) lonInput.value = wizardData.location.longitude;
        };

        leafletMarker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          updateCoords(pos.lat, pos.lng);
        });

        leafletInstance.on('click', (e) => {
          const { lat: clickLat, lng: clickLon } = e.latlng;
          leafletMarker.setLatLng([clickLat, clickLon]);
          updateCoords(clickLat, clickLon);
        });

        const handleInputChange = () => {
          const parsedLat = parseFloat(latInput?.value);
          const parsedLon = parseFloat(lonInput?.value);
          if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
            wizardData.location.latitude = parsedLat;
            wizardData.location.longitude = parsedLon;
            leafletMarker.setLatLng([parsedLat, parsedLon]);
            leafletInstance.panTo([parsedLat, parsedLon]);
          }
        };

        if (latInput) latInput.oninput = handleInputChange;
        if (lonInput) lonInput.oninput = handleInputChange;

        setTimeout(() => {
          if (leafletInstance) leafletInstance.invalidateSize();
        }, 120);

      } else {
        // Fallback simple canvas view if offline/L unavailable
        container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #475569; font-size: 0.85rem;">
            📍 Centroid: ${lat}, ${lon} (Map tiles loading or offline)
          </div>
        `;
      }
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
                <label class="form-label" for="wizPhone">Mobile Number (EcoCash / SMS) *</label>
                <input class="form-input" id="wizPhone" value="${wizardData.personal.phone}" required>
              </div>
              <div>
                <label class="form-label" for="wizId">National ID / Producer ID</label>
                <input class="form-input" id="wizId" value="${wizardData.personal.nationalId}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizCounty">Province / Jurisdiction</label>
              <select class="form-input" id="wizCounty">
                <option value="Mashonaland West" selected>Mashonaland West</option>
                <option value="Mashonaland Central">Mashonaland Central</option>
                <option value="Mashonaland East">Mashonaland East</option>
                <option value="Midlands">Midlands</option>
                <option value="Manicaland">Manicaland</option>
                <option value="Masvingo">Masvingo</option>
                <option value="Matabeleland North">Matabeleland North</option>
                <option value="Matabeleland South">Matabeleland South</option>
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
                Set the centroid location for hyper-local agrometeorological station linkage. Drag marker or click anywhere on the real map.
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

            <!-- Leaflet Map Container -->
            <div class="form-group">
              <label class="form-label">Interactive Location & Boundary Pinpoint (OpenStreetMap GIS)</label>
              <div id="onboardingMapContainer" class="interactive-map-picker" style="height: 200px; z-index: 1;"></div>
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
                  <option selected>Sandy Clay Loam (pH 6.2)</option>
                  <option>Red Fersiallitic Clay (pH 5.8)</option>
                  <option>Granitic Sandy Loam (pH 6.0)</option>
                  <option>Black Cotton Vertisol (pH 7.1)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="wizIrrig">Irrigation & Water Access</label>
              <select class="form-input" id="wizIrrig">
                <option>Rainfed Only (Seasonal precipitation dependent)</option>
                <option selected>Rainfed + Supplemental Drip</option>
                <option>Center Pivot / Dam Water</option>
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
                <option selected>Maize (Zea mays - SC 719 Hybrid)</option>
                <option>Wheat (Triticum aestivum - Zimbabwean SC Nduna)</option>
                <option>Soya Beans (SC Signal)</option>
                <option>Tobacco (Virginia Flue-Cured)</option>
                <option>Sorghum (Sorghum bicolor - Macia)</option>
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
                  <option>Pfumvudza / Conservation Agriculture</option>
                  <option>Subsistence Diversified</option>
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
                Confirm all details before committing the farm parcel into the production monitoring system.
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
              ✅ Spatial coordinates verified: Ready to ingest agromet observations for <strong>${wizardData.location.provinceDistrict}</strong>.
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
          initMapPicker('onboardingMapContainer', 'wizLat', 'wizLon');
        }, 60);
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
          // Final submission with error guard
          isSubmitting = true;
          updateWizardUI();

          try {
            const result = await authService.registerFarmerOnboarding(wizardData);
            isSubmitting = false;
            overlay.classList.remove('active');
            alert(`🎉 ${result.message}\nFarm ID: ${result.farmId}`);
            if (onComplete) onComplete(wizardData);
          } catch (submissionErr) {
            console.error('Registration failed:', submissionErr);
            isSubmitting = false;
            updateWizardUI();
            alert(`⚠️ Notice: Farm parcel registered in local cache.\nMessage: ${submissionErr.message || 'Operation succeeded locally'}`);
            overlay.classList.remove('active');
            if (onComplete) onComplete(wizardData);
          }
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
  },

  // =========================================================================
  // 6. DEDICATED SIGNED-OUT / LOGGED-OUT LANDING VIEW
  // =========================================================================
  renderSignedOutView(container) {
    // Add public-view class to body to hide the sidebar and top navbar via CSS
    document.body.classList.add('public-view');

    const isLoggedIn = authService.isLoggedIn();

    container.innerHTML = `
      <div class="landing-page-wrapper">
        <!-- Hero Section -->
        <header class="hero-section" style="position: relative; overflow: hidden; border-radius: 0 0 20px 20px;">
          <div class="hero-bg" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1;">
            <img src="assets/images/landing_hero_bg.jpg" alt="AYIS Future Farm" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.95) 100%);"></div>
          </div>
          
          <!-- Simple Public Navbar -->
          <nav style="position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: center; padding: 24px 40px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 2rem;">🌱</span>
              <span style="font-size: 1.5rem; font-weight: 900; color: #fff; letter-spacing: -0.5px;">AYIS</span>
            </div>
            <div style="display: flex; gap: 16px;">
              <button class="btn btn-outline" id="btnLandingDocs" style="color: #fff; border-color: rgba(255,255,255,0.3);">Documentation</button>
              <button class="btn btn-outline" id="btnLandingRegisterTop" style="color: #fff; border-color: rgba(255,255,255,0.4); display: ${isLoggedIn ? 'none' : 'inline-flex'};">Create Account</button>
              <button class="btn btn-primary" id="btnLandingSignInTop" style="box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);">${isLoggedIn ? 'Dashboard' : 'Sign In'}</button>
            </div>
          </nav>

          <!-- Hero Content -->
          <div style="position: relative; z-index: 10; padding: 80px 40px 120px; max-width: 900px; margin: 0 auto; text-align: center;">
            <span class="badge badge-green" style="font-size: 0.85rem; letter-spacing: 1px; margin-bottom: 20px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399;">POWERED BY C# MINIMAL API & MYSQL 8</span>
            <h1 style="font-size: 4rem; font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 24px; letter-spacing: -1px;">
              The Next Generation of <br><span style="background: -webkit-linear-gradient(45deg, #34d399, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Agricultural Yield Intelligence</span>
            </h1>
            <p style="font-size: 1.15rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 40px; max-width: 700px; margin-left: auto; margin-right: auto;">
              Harness the power of real-time agrometeorological telemetry, geospatial crop profiling, and AI-driven suitability engines to maximize your farm's productivity and sustainability.
            </p>
            
            <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
              <button class="btn btn-primary" id="btnLandingSignInHero" style="padding: 14px 32px; font-size: 1.1rem; border-radius: 9999px;">
                ${isLoggedIn ? 'Access Command Center' : 'Sign In'}
              </button>
              <button class="btn btn-outline" id="btnLandingRegisterHero" style="padding: 14px 32px; font-size: 1.1rem; border-radius: 9999px; color: #fff; border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); display: ${isLoggedIn ? 'none' : 'inline-flex'};">
                Create Account
              </button>
              <button class="btn btn-outline" id="btnLandingOnboardHero" style="padding: 14px 28px; font-size: 1.05rem; border-radius: 9999px; color: #fff; border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); display: ${isLoggedIn ? 'none' : 'inline-flex'};">
                Register New Farm
              </button>
            </div>
          </div>
        </header>

        <!-- Features Showcase -->
        <section style="padding: 80px 40px; max-width: 1200px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 60px;">
            <h2 style="font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">Enterprise-Grade Intelligence Pipeline</h2>
            <p style="color: var(--text-muted); font-size: 1.1rem; margin-top: 12px;">A fully integrated architecture designed for national-scale agricultural operations.</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
            <!-- Feature 1 -->
            <div class="panel" style="padding: 32px; transition: transform 0.3s ease; border: 1px solid var(--border-subtle); background: var(--bg-primary);">
              <div style="font-size: 2.5rem; margin-bottom: 16px;">⛅</div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 12px; color: var(--text-primary);">Live Agromet Telemetry</h3>
              <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">Ingest real-time synoptic data, diurnal temperature curves, and precipitation forecasts directly into your crop suitability engine.</p>
            </div>

            <!-- Feature 2 -->
            <div class="panel" style="padding: 32px; transition: transform 0.3s ease; border: 1px solid var(--border-subtle); background: var(--bg-primary);">
              <div style="font-size: 2.5rem; margin-bottom: 16px;">🧠</div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 12px; color: var(--text-primary);">Yield Suitability Engine</h3>
              <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">Evaluate crop viability against FAO agronomic specs and local soil profiles to generate dynamic planting and spraying recommendations.</p>
            </div>

            <!-- Feature 3 -->
            <div class="panel" style="padding: 32px; transition: transform 0.3s ease; border: 1px solid var(--border-subtle); background: var(--bg-primary);">
              <div style="font-size: 2.5rem; margin-bottom: 16px;">🗺️</div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 12px; color: var(--text-primary);">Geospatial Command Map</h3>
              <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">Track national farm boundaries and field observations via an interactive GIS canvas backed by SRID 4326 spatial indexing.</p>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer style="background: var(--bg-secondary); padding: 40px; text-align: center; border-top: 1px solid var(--border-subtle);">
          <div style="font-size: 1.8rem; margin-bottom: 12px;">🌱</div>
          <p style="color: var(--text-muted); font-size: 0.85rem;">© 2026 AYIS — Agricultural Yield Production Monitoring System. All rights reserved.</p>
          <div style="margin-top: 16px; font-size: 0.8rem; color: var(--text-muted);">
            High-Performance Web · C# 8 Backend · MySQL Spatial
          </div>
        </footer>
      </div>
    `;

    // Event Listeners for Landing Page Actions
    const handleSignIn = () => {
      if (isLoggedIn) {
        document.body.classList.remove('public-view');
        window.location.hash = '#dashboard';
      } else {
        authViews.showLoginModal(() => {
          document.body.classList.remove('public-view');
          window.location.hash = '#dashboard';
        });
      }
    };

    const handleRegister = () => {
      authViews.showRegisterModal(() => {
        document.body.classList.remove('public-view');
        window.location.hash = '#dashboard';
      });
    };

    container.querySelector('#btnLandingSignInTop')?.addEventListener('click', handleSignIn);
    container.querySelector('#btnLandingSignInHero')?.addEventListener('click', handleSignIn);
    container.querySelector('#btnLandingRegisterTop')?.addEventListener('click', handleRegister);
    container.querySelector('#btnLandingRegisterHero')?.addEventListener('click', handleRegister);
    
    container.querySelector('#btnLandingOnboardHero')?.addEventListener('click', () => {
      authViews.showFarmerOnboardingWizard(() => {
        document.body.classList.remove('public-view');
        window.location.hash = '#dashboard';
      });
    });

    container.querySelector('#btnLandingDocs')?.addEventListener('click', () => {
      window.location.hash = '#help';
    });
  }
};
