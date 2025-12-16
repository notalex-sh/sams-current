<script>
  import { onMount } from 'svelte';
  import LoginPanel from '$lib/components/LoginPanel.svelte';
  import Dashboard from '$lib/components/Dashboard.svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import NotificationToast from '$lib/components/NotificationToast.svelte';
  import ExportModal from '$lib/components/ExportModal.svelte';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import { isAuthenticated, isDirty, currentDatabase } from '$lib/stores/database';

  let showNotification = false;
  let notificationMessage = '';
  let showExportModal = false;

  function notify(message) {
    notificationMessage = message;
    showNotification = true;
  }

  function handleNavAction(event) {
    switch(event.detail.action) {
      case 'export':
        showExportModal = true;
        break;
      case 'notify':
        notify(event.detail.message);
        break;
    }
  }

  function handleBeforeUnload(event) {
    if ($isDirty && $isAuthenticated) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  onMount(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  });
</script>

<svelte:head>
  <title>
    {$isDirty ? '[*] ' : ''}S.A.M.S. - Secure Access Management System
    {$currentDatabase ? ` - ${$currentDatabase}` : ''}
  </title>
</svelte:head>

<div class="relative z-10 h-screen flex flex-col overflow-hidden">
  <!-- Header -->
  <header class="relative border-b border-white/10 bg-black/95 backdrop-blur-sm navbar-load flex-shrink-0">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-[0.3em] text-white">
              S.A.M.S
            </h1>
            <p class="text-[10px] uppercase tracking-[0.3em] text-white/30 mt-0.5">
              Secure Access Management System
            </p>
          </div>

          {#if $currentDatabase}
            <div class="text-xs text-white/50">
              <span class="text-white/20">[</span>
              {$currentDatabase}
              {#if $isDirty}
                <span class="text-yellow-400 unsaved-indicator">*</span>
              {/if}
              <span class="text-white/20">]</span>
            </div>
          {/if}
        </div>

        <div class="flex items-center gap-2 text-xs uppercase tracking-widest">
          <span class={$isAuthenticated ? 'text-white' : 'text-white/30'}>
            {$isAuthenticated ? 'AUTHENTICATED' : 'LOCKED'}
          </span>
          <div
            class="w-2 h-2 rounded-full {$isAuthenticated ? 'bg-white unsaved-indicator' : 'bg-white/30'}"
          ></div>
        </div>
      </div>
    </div>
  </header>

  {#if $isAuthenticated}
    <Navbar on:action={handleNavAction} />
  {/if}

  <main class="flex-1 container mx-auto px-4 py-4 fade-in min-h-0 overflow-hidden">
    {#if !$isAuthenticated}
      <LoginPanel on:notify={(e) => notify(e.detail)} />
    {:else}
      <Dashboard on:notify={(e) => notify(e.detail)} />
    {/if}
  </main>

  <!-- Footer -->
  <footer class="border-t border-white/10 py-2 flex-shrink-0">
    <div class="container mx-auto px-4">
      <p class="text-center text-[10px] text-white/20 uppercase tracking-wider">
        AES-256-GCM | Argon2 | Local Encryption Only
      </p>
    </div>
  </footer>

  {#if showExportModal}
    <ExportModal
      on:close={() => showExportModal = false}
      on:notify={(e) => notify(e.detail)}
    />
  {/if}

  <NotificationToast
    bind:show={showNotification}
    message={notificationMessage}
  />

  <LoadingScreen />
</div>
