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
    if ($isDirty && !confirm('Unsaved changes. Logout anyway?')) return;
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

<nav class="bg-zinc-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-12">
      <div class="flex items-center gap-1">
        <button
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all {$isDirty ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'text-white/30 cursor-not-allowed'}"
          on:click={handleSave}
          disabled={!$isDirty}
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save
          {#if $isDirty}<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>{/if}
        </button>

        <button
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
          on:click={() => dispatch('action', { action: 'export' })}
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Export
        </button>

        <button
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
          on:click={() => window.location.reload()}
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Switch
        </button>
      </div>

      <div class="flex items-center gap-3">
        <div class="hidden sm:flex items-center gap-1 text-[10px] text-white/25 font-mono">
          <kbd class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">⌘S</kbd>
          <span>save</span>
        </div>

        <button
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all"
          on:click={handleLogout}
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  </div>
</nav>
