<script>
  import { createEventDispatcher } from 'svelte';
  import { loadDatabase, createNewDatabase } from '$lib/stores/database';

  const dispatch = createEventDispatcher();

  let selectedFile = null;
  let password = '';
  let isCreatingNew = false;
  let confirmPassword = '';
  let loading = false;
  let showPassword = false;

  /*
   * Stores the selected database file and resets form state.
   */
  function handleFileSelect(event) {
    selectedFile = event.target.files[0];
    isCreatingNew = false;
    password = '';
  }

  /*
   * Switches to new database creation mode.
   */
  function startNewDatabase() {
    isCreatingNew = true;
    selectedFile = null;
    password = '';
    confirmPassword = '';
  }

  /*
   * Validates input and either creates a new database or loads an existing one.
   */
  async function handleSubmit() {
    if (!password) {
      dispatch('notify', 'Password required');
      return;
    }

    if (isCreatingNew) {
      if (password !== confirmPassword) {
        dispatch('notify', 'Passwords do not match');
        return;
      }
      if (password.length < 8) {
        dispatch('notify', 'Minimum 8 characters required');
        return;
      }

      loading = true;
      try {
        await createNewDatabase(password);
        dispatch('notify', 'Database initialized. Save to create file.');
      } catch (error) {
        dispatch('notify', 'Initialization failed: ' + error.message);
      } finally {
        loading = false;
      }
    } else if (selectedFile) {
      loading = true;
      try {
        await loadDatabase(selectedFile, password);
        dispatch('notify', 'Access granted');
      } catch (error) {
        dispatch('notify', 'Authentication failed');
      } finally {
        loading = false;
      }
    } else {
      dispatch('notify', 'Select database or create new');
    }
  }

  /*
   * Submits form on Enter key press.
   */
  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <!-- Logo & Header -->
    <div class="login-header">
      <div class="logo-glow"></div>
      <div class="logo">
        <img src="/logo.png" alt="SAMS" class="logo-image" />
      </div>
      <h1 class="app-title">S.A.M.S.</h1>
      <p class="app-subtitle">Secure Access Management System</p>
      <div class="header-line"></div>
    </div>

    <div class="login-body">
      {#if !isCreatingNew}
        <!-- Open Database -->
        <div class="section">
          <label class="section-label">
            <span class="label-icon">&gt;</span>
            Open Existing Database
          </label>
          <div class="file-input-wrapper">
            <div class="file-display" class:has-file={selectedFile}>
              {#if selectedFile}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span class="file-name">{selectedFile.name}</span>
              {:else}
                <span class="file-placeholder">No file selected</span>
              {/if}
            </div>
            <label class="browse-btn">
              Browse
              <input
                type="file"
                accept=".sams"
                class="hidden-input"
                on:change={handleFileSelect}
              />
            </label>
          </div>
        </div>

        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">OR</span>
          <span class="divider-line"></span>
        </div>

        <button class="create-btn" on:click={startNewDatabase}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Initialize New Database
        </button>
      {/if}

      {#if selectedFile || isCreatingNew}
        <div class="auth-section">
          <div class="section">
            <label class="section-label">
              <span class="label-icon">&gt;</span>
              {isCreatingNew ? 'Master Password' : 'Password'}
            </label>
            <div class="password-wrapper">
              {#if showPassword}
                <input
                  type="text"
                  bind:value={password}
                  placeholder="Enter password"
                  class="password-input"
                  on:keydown={handleKeyDown}
                />
              {:else}
                <input
                  type="password"
                  bind:value={password}
                  placeholder="Enter password"
                  class="password-input"
                  on:keydown={handleKeyDown}
                />
              {/if}
              <button type="button" class="show-btn" on:click={() => showPassword = !showPassword}>
                {#if showPassword}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                {:else}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                {/if}
              </button>
            </div>
          </div>

          {#if isCreatingNew}
            <div class="section">
              <label class="section-label">
                <span class="label-icon">&gt;</span>
                Confirm Password
              </label>
              {#if showPassword}
                <input
                  type="text"
                  bind:value={confirmPassword}
                  placeholder="Confirm password"
                  class="password-input"
                  on:keydown={handleKeyDown}
                />
              {:else}
                <input
                  type="password"
                  bind:value={confirmPassword}
                  placeholder="Confirm password"
                  class="password-input"
                  on:keydown={handleKeyDown}
                />
              {/if}
            </div>

            <div class="requirements">
              <div class="req-item" class:met={password.length >= 8}>
                <div class="req-indicator"></div>
                <span>Minimum 8 characters</span>
              </div>
              <div class="req-item" class:met={password && password === confirmPassword}>
                <div class="req-indicator"></div>
                <span>Passwords match</span>
              </div>
            </div>
          {/if}

          <div class="action-buttons">
            <button
              class="submit-btn"
              on:click={handleSubmit}
              disabled={loading}
            >
              {#if loading}
                <div class="spinner"></div>
                Processing...
              {:else}
                {isCreatingNew ? 'Initialize' : 'Decrypt & Access'}
              {/if}
            </button>

            {#if isCreatingNew}
              <button
                class="cancel-btn"
                on:click={() => {
                  isCreatingNew = false;
                  password = '';
                  confirmPassword = '';
                }}
              >
                Cancel
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Security Footer -->
    <div class="security-footer">
      <div class="security-badges">
        <div class="badge">
          <div class="badge-dot"></div>
          <span>AES-256-GCM</span>
        </div>
        <div class="badge">
          <div class="badge-dot"></div>
          <span>ARGON2ID</span>
        </div>
        <div class="badge">
          <div class="badge-dot"></div>
          <span>LOCAL ONLY</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .login-container {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .login-card {
    width: 100%;
    max-width: 440px;
    background: rgba(10, 10, 12, 0.95);
    border: 1px solid rgba(6, 182, 212, 0.15);
    border-radius: 20px;
    overflow: hidden;
    animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow:
      0 0 60px rgba(6, 182, 212, 0.1),
      0 0 100px rgba(6, 182, 212, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .login-header {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 32px 32px;
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, transparent 100%);
  }

  .logo-glow {
    position: absolute;
    top: 30px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
    filter: blur(30px);
    pointer-events: none;
  }

  .logo {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.5));
    animation: float 4s ease-in-out infinite;
  }

  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .app-title {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: white;
    margin: 0;
    text-shadow: 0 0 30px rgba(6, 182, 212, 0.4);
  }

  .app-subtitle {
    font-size: 11px;
    letter-spacing: 0.15em;
    color: rgba(6, 182, 212, 0.6);
    margin: 10px 0 0 0;
    text-transform: uppercase;
  }

  .header-line {
    position: absolute;
    bottom: 0;
    left: 32px;
    right: 32px;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(6, 182, 212, 0.4) 30%,
      rgba(6, 182, 212, 0.4) 70%,
      transparent
    );
  }

  .login-body {
    padding: 32px;
  }

  .section {
    margin-bottom: 20px;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: rgba(6, 182, 212, 0.7);
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  .label-icon {
    color: rgba(6, 182, 212, 0.5);
  }

  .file-input-wrapper {
    display: flex;
    gap: 10px;
  }

  .file-display {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: rgba(6, 182, 212, 0.03);
    border: 1px solid rgba(6, 182, 212, 0.1);
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .file-display.has-file {
    border-color: rgba(6, 182, 212, 0.3);
    background: rgba(6, 182, 212, 0.05);
  }

  .file-display.has-file svg {
    color: rgba(6, 182, 212, 0.8);
  }

  .file-name {
    font-size: 13px;
    color: white;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-placeholder {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.25);
  }

  .browse-btn {
    padding: 14px 20px;
    background: rgba(6, 182, 212, 0.1);
    border: 1px solid rgba(6, 182, 212, 0.25);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(6, 182, 212, 0.9);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .browse-btn:hover {
    background: rgba(6, 182, 212, 0.15);
    border-color: rgba(6, 182, 212, 0.4);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
  }

  .hidden-input {
    display: none;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 28px 0;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.2), transparent);
  }

  .divider-text {
    font-size: 10px;
    color: rgba(6, 182, 212, 0.4);
    letter-spacing: 0.2em;
  }

  .create-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 24px;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(6, 182, 212, 0.95);
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.05em;
  }

  .create-btn:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%);
    border-color: rgba(6, 182, 212, 0.5);
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
    transform: translateY(-1px);
  }

  .auth-section {
    animation: fadeIn 0.3s ease;
  }

  .password-wrapper {
    position: relative;
  }

  .password-input {
    width: 100%;
    padding: 14px 50px 14px 16px;
    background: rgba(6, 182, 212, 0.03);
    border: 1px solid rgba(6, 182, 212, 0.15);
    border-radius: 10px;
    font-size: 14px;
    color: white;
    transition: all 0.2s ease;
  }

  .password-input:focus {
    outline: none;
    background: rgba(6, 182, 212, 0.05);
    border-color: rgba(6, 182, 212, 0.4);
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
  }

  .password-input::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  .show-btn {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: rgba(6, 182, 212, 0.4);
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s ease;
  }

  .show-btn:hover {
    color: rgba(6, 182, 212, 0.8);
  }

  .requirements {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    background: rgba(6, 182, 212, 0.03);
    border: 1px solid rgba(6, 182, 212, 0.1);
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .req-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.35);
    transition: color 0.2s ease;
  }

  .req-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;
  }

  .req-item.met {
    color: rgba(6, 182, 212, 0.9);
  }

  .req-item.met .req-indicator {
    background: #06b6d4;
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.6);
  }

  .action-buttons {
    display: flex;
    gap: 10px;
  }

  .submit-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 24px;
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: black;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.05em;
  }

  .submit-btn:hover:not(:disabled) {
    box-shadow: 0 0 25px rgba(6, 182, 212, 0.5);
    transform: translateY(-1px);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cancel-btn {
    padding: 16px 24px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: black;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .security-footer {
    padding: 20px 32px;
    border-top: 1px solid rgba(6, 182, 212, 0.1);
    background: rgba(0, 0, 0, 0.3);
  }

  .security-badges {
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: rgba(6, 182, 212, 0.5);
  }

  .badge-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(6, 182, 212, 0.6);
    box-shadow: 0 0 6px rgba(6, 182, 212, 0.4);
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
</style>
