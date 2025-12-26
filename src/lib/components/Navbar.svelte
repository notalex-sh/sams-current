<script>
  import { createEventDispatcher } from 'svelte';
  import { isDirty, saveDatabase, logout, theme } from '$lib/stores/database';
  import ChangePasswordModal from './ChangePasswordModal.svelte';

  const dispatch = createEventDispatcher();

  let showChangePassword = false;

  async function handleSave() {
    try {
      await saveDatabase();
      dispatch('action', { action: 'notify', message: 'Database saved' });
    } catch (error) {
      dispatch('action', { action: 'notify', message: 'Save failed: ' + error.message });
    }
  }

  function handleLogout() {
    if ($isDirty && !confirm('Unsaved changes. Logout anyway?')) {
      return;
    }
    logout();
    dispatch('action', { action: 'notify', message: 'Session terminated' });
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      if ($isDirty) handleSave();
    }
  }

  function handlePasswordSuccess(event) {
    dispatch('action', { action: 'notify', message: event.detail });
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<nav class="cyber-navbar">
  <div class="container mx-auto px-4">
    <div class="navbar-content">
      <!-- Left Actions -->
      <div class="nav-actions">
        <button
          class="nav-btn"
          class:save-active={$isDirty}
          on:click={handleSave}
          disabled={!$isDirty}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Save</span>
          {#if $isDirty}
            <span class="save-dot"></span>
          {/if}
        </button>

        <button
          class="nav-btn"
          on:click={() => dispatch('action', { action: 'export' })}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Export</span>
        </button>

        <button
          class="nav-btn"
          on:click={() => window.location.reload()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <span>Switch</span>
        </button>

        <button
          class="nav-btn"
          on:click={() => showChangePassword = true}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Password</span>
        </button>
      </div>

      <!-- Right Actions -->
      <div class="nav-right">
        <button class="theme-btn" on:click={theme.toggle} title="Toggle theme">
          {#if $theme === 'dark'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          {:else}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          {/if}
        </button>

        <div class="keyboard-hint">
          <kbd>Ctrl</kbd>
          <span>+</span>
          <kbd>S</kbd>
        </div>

        <button class="logout-btn" on:click={handleLogout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </div>
</nav>

<ChangePasswordModal bind:isOpen={showChangePassword} on:success={handlePasswordSuccess} />

<style>
  .cyber-navbar {
    background: var(--bg-tertiary, rgba(0, 0, 0, 0.8));
    border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 30;
  }

  .theme-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    color: var(--text-muted, rgba(255, 255, 255, 0.5));
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-btn:hover {
    background: var(--bg-secondary, rgba(255, 255, 255, 0.1));
    color: var(--text-primary, white);
    border-color: var(--border-primary, rgba(255, 255, 255, 0.2));
  }

  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted, rgba(255, 255, 255, 0.45));
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-btn:hover:not(:disabled) {
    color: var(--text-primary, rgba(255, 255, 255, 0.9));
    background: var(--bg-hover, rgba(255, 255, 255, 0.06));
    border-color: var(--border-primary, rgba(255, 255, 255, 0.1));
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .nav-btn.save-active {
    color: var(--text-primary, rgba(255, 255, 255, 0.95));
    background: var(--bg-hover, rgba(255, 255, 255, 0.08));
    border-color: var(--border-primary, rgba(255, 255, 255, 0.15));
  }

  .nav-btn.save-active:hover {
    background: var(--bg-secondary, rgba(255, 255, 255, 0.12));
    border-color: var(--border-primary, rgba(255, 255, 255, 0.2));
  }

  .save-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent, #ffffff);
    box-shadow: 0 0 8px var(--accent-muted, rgba(255, 255, 255, 0.6));
    animation: pulse 2s ease-in-out infinite;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .keyboard-hint {
    display: none;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: var(--text-muted, rgba(255, 255, 255, 0.25));
  }

  @media (min-width: 640px) {
    .keyboard-hint {
      display: flex;
    }
  }

  .keyboard-hint kbd {
    padding: 2px 6px;
    background: var(--bg-hover, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.1));
    border-radius: 4px;
    font-size: 10px;
    color: var(--text-muted, rgba(255, 255, 255, 0.4));
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--bg-hover, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted, rgba(255, 255, 255, 0.5));
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: var(--bg-secondary, rgba(255, 255, 255, 0.08));
    border-color: var(--border-primary, rgba(255, 255, 255, 0.2));
    color: var(--text-secondary, rgba(255, 255, 255, 0.8));
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
