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

  function handleFileSelect(event) {
    selectedFile = event.target.files[0];
    isCreatingNew = false;
    password = '';
  }

  function startNewDatabase() {
    isCreatingNew = true;
    selectedFile = null;
    password = '';
    confirmPassword = '';
  }

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
      <div class="logo">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          <circle cx="12" cy="16" r="1"/>
        </svg>
      </div>
      <h1 class="app-title">S.A.M.S.</h1>
      <p class="app-subtitle">Secure Access Management System</p>
    </div>

    <div class="login-body">
      {#if !isCreatingNew}
        <!-- Open Database -->
        <div class="section">
          <label class="section-label">Open Existing Database</label>
          <div class="file-input-wrapper">
            <div class="file-display">
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
          <span>or</span>
        </div>

        <button class="create-btn" on:click={startNewDatabase}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create New Database
        </button>
      {/if}

      {#if selectedFile || isCreatingNew}
        <div class="auth-section">
          <div class="section">
            <label class="section-label">
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
              <label class="section-label">Confirm Password</label>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  {#if password.length >= 8}
                    <polyline points="20 6 9 17 4 12"/>
                  {:else}
                    <circle cx="12" cy="12" r="10"/>
                  {/if}
                </svg>
                <span>Minimum 8 characters</span>
              </div>
              <div class="req-item" class:met={password && password === confirmPassword}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  {#if password && password === confirmPassword}
                    <polyline points="20 6 9 17 4 12"/>
                  {:else}
                    <circle cx="12" cy="12" r="10"/>
                  {/if}
                </svg>
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
                {isCreatingNew ? 'Create Database' : 'Unlock'}
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>AES-256-GCM</span>
        </div>
        <div class="badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Argon2id</span>
        </div>
        <div class="badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span>Local Only</span>
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
    max-width: 420px;
    background: rgba(24, 24, 27, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    overflow: hidden;
    animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .login-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 32px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .logo {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 20px;
    margin-bottom: 20px;
    color: white;
  }

  .app-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: white;
    margin: 0;
  }

  .app-subtitle {
    font-size: 12px;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.4);
    margin: 8px 0 0 0;
  }

  .login-body {
    padding: 32px;
  }

  .section {
    margin-bottom: 20px;
  }

  .section-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 10px;
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
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
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
    color: rgba(255, 255, 255, 0.3);
  }

  .browse-btn {
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .browse-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .hidden-input {
    display: none;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 24px 0;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
  }

  .divider span {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .create-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 24px;
    background: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: black;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .create-btn:hover {
    background: rgba(255, 255, 255, 0.9);
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
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    font-size: 14px;
    color: white;
    transition: all 0.2s ease;
  }

  .password-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .password-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .show-btn {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s ease;
  }

  .show-btn:hover {
    color: white;
  }

  .requirements {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .req-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    transition: color 0.2s ease;
  }

  .req-item.met {
    color: #22c55e;
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
    background: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: black;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.9);
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
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
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
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.2);
  }

  .security-badges {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
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
</style>
