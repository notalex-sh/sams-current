<script>
  import { createEventDispatcher } from 'svelte';
  import { masterPassword, entries, isDirty, encryptData } from '$lib/stores/database';
  import { get } from 'svelte/store';
  import { encryptData as encrypt } from '$lib/utils/encryption';

  const dispatch = createEventDispatcher();

  export let isOpen = false;

  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let showPasswords = false;
  let loading = false;
  let error = '';

  $: canSubmit = currentPassword && newPassword && newPassword === confirmPassword && newPassword.length >= 8;

  function close() {
    isOpen = false;
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    error = '';
    showPasswords = false;
  }

  /*
   * Validates the current password, encrypts data with new password, and triggers download.
   */
  async function handleSubmit() {
    error = '';

    const storedPassword = get(masterPassword);
    if (currentPassword !== storedPassword) {
      error = 'Current password is incorrect';
      return;
    }

    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (newPassword.length < 8) {
      error = 'New password must be at least 8 characters';
      return;
    }

    loading = true;
    try {
      const entriesData = get(entries);
      const encryptedBlob = await encrypt(entriesData, newPassword);
      const blob = new Blob([encryptedBlob], { type: 'application/octet-stream' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sams_database.sams';
      a.click();
      URL.revokeObjectURL(url);

      masterPassword.set(newPassword);
      isDirty.set(false);

      dispatch('success', 'Database saved with new password');
      close();
    } catch (err) {
      error = 'Failed to save: ' + err.message;
    } finally {
      loading = false;
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'Enter' && canSubmit) {
      handleSubmit();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if isOpen}
  <div class="modal-overlay" on:click={close} on:keydown={handleKeyDown} role="button" tabindex="-1">
    <div class="modal-content" on:click|stopPropagation role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>Change Master Password</h2>
        <button class="close-btn" on:click={close}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        {#if error}
          <div class="error-message">{error}</div>
        {/if}

        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            bind:value={currentPassword}
            placeholder="Enter current password"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label">New Password</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            bind:value={newPassword}
            placeholder="Enter new password"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            bind:value={confirmPassword}
            placeholder="Confirm new password"
            class="form-input"
          />
        </div>

        <label class="show-toggle">
          <input type="checkbox" bind:checked={showPasswords} />
          <span>Show passwords</span>
        </label>

        <div class="requirements">
          <div class="req-item" class:met={newPassword.length >= 8}>
            <div class="req-dot"></div>
            <span>Minimum 8 characters</span>
          </div>
          <div class="req-item" class:met={newPassword && newPassword === confirmPassword}>
            <div class="req-dot"></div>
            <span>Passwords match</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" on:click={close}>Cancel</button>
        <button
          class="submit-btn"
          on:click={handleSubmit}
          disabled={!canSubmit || loading}
        >
          {#if loading}
            <div class="spinner"></div>
            Saving...
          {:else}
            Save with New Password
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: fadeIn 0.2s ease;
  }

  .modal-content {
    width: 100%;
    max-width: 420px;
    background: var(--bg-tertiary, rgba(24, 24, 27, 0.98));
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.1));
    border-radius: 16px;
    animation: scaleIn 0.2s ease;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
  }

  .modal-header h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, white);
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--text-muted, rgba(255, 255, 255, 0.4));
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.06));
    color: var(--text-primary, white);
  }

  .modal-body {
    padding: 24px;
  }

  .error-message {
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #ef4444;
    font-size: 13px;
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--text-muted, rgba(255, 255, 255, 0.5));
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .form-input {
    width: 100%;
    padding: 12px 14px;
    background: var(--bg-input, rgba(0, 0, 0, 0.3));
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.1));
    border-radius: 8px;
    font-size: 14px;
    color: var(--text-primary, white);
    transition: all 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--border-primary, rgba(255, 255, 255, 0.3));
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
  }

  .form-input::placeholder {
    color: var(--text-muted, rgba(255, 255, 255, 0.25));
  }

  .show-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-muted, rgba(255, 255, 255, 0.5));
    cursor: pointer;
    margin-bottom: 16px;
  }

  .show-toggle input {
    accent-color: var(--accent, white);
  }

  .requirements {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--bg-hover, rgba(255, 255, 255, 0.02));
    border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
    border-radius: 8px;
  }

  .req-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--text-muted, rgba(255, 255, 255, 0.3));
    transition: color 0.2s ease;
  }

  .req-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-muted, rgba(255, 255, 255, 0.15));
    transition: all 0.2s ease;
  }

  .req-item.met {
    color: var(--text-secondary, rgba(255, 255, 255, 0.8));
  }

  .req-item.met .req-dot {
    background: var(--accent, white);
    box-shadow: 0 0 8px var(--accent-muted, rgba(255, 255, 255, 0.5));
  }

  .modal-footer {
    display: flex;
    gap: 10px;
    padding: 20px 24px;
    border-top: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
  }

  .cancel-btn {
    padding: 12px 20px;
    background: transparent;
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.15));
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted, rgba(255, 255, 255, 0.6));
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-btn:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
    border-color: var(--border-primary, rgba(255, 255, 255, 0.25));
  }

  .submit-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--accent, white);
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--bg-primary, black);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .submit-btn:hover:not(:disabled) {
    box-shadow: 0 0 20px var(--accent-muted, rgba(255, 255, 255, 0.3));
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: black;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
