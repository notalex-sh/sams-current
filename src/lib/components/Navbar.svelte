<script>
  import { createEventDispatcher } from 'svelte';
  import { isDirty, saveDatabase, logout } from '$lib/stores/database';

  const dispatch = createEventDispatcher();

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
      </div>

      <!-- Right Actions -->
      <div class="nav-right">
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

<style>
  .cyber-navbar {
    background: rgba(0, 0, 0, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 30;
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
    color: rgba(255, 255, 255, 0.45);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-btn:hover:not(:disabled) {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .nav-btn.save-active {
    color: rgba(255, 255, 255, 0.95);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .nav-btn.save-active:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
  }

  .save-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
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
    color: rgba(255, 255, 255, 0.25);
  }

  @media (min-width: 640px) {
    .keyboard-hint {
      display: flex;
    }
  }

  .keyboard-hint kbd {
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.03);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
