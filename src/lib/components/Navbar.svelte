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

<nav class="border-b border-white/10 bg-black/90 backdrop-blur-sm sticky top-0 z-30 navbar-load">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-14">
      <!-- Left Actions -->
      <div class="flex items-center gap-2">
        <button
          class="navbar-item {$isDirty ? 'mono-button-success' : 'text-white/40'}"
          on:click={handleSave}
          disabled={!$isDirty}
        >
          <span class="flex items-center gap-2">
            Save
            {#if $isDirty}
              <span class="w-1.5 h-1.5 bg-white unsaved-indicator"></span>
            {/if}
          </span>
        </button>

        <button
          class="navbar-item text-white/60 hover:text-white"
          on:click={() => dispatch('action', { action: 'export' })}
        >
          Export
        </button>

        <button
          class="navbar-item text-white/60 hover:text-white"
          on:click={() => window.location.reload()}
        >
          Switch DB
        </button>
      </div>

      <!-- Right Actions -->
      <div class="flex items-center gap-3">
        <div class="text-xs text-white/30 mr-2 hidden sm:block">
          <kbd class="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/40">Ctrl</kbd>
          <span class="mx-1">+</span>
          <kbd class="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/40">S</kbd>
          <span class="ml-2 text-white/30">to save</span>
        </div>

        <button
          class="mono-button-danger px-3 py-1.5"
          on:click={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  </div>
</nav>
