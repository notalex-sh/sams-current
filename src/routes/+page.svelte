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

<div class="cyber-bg"></div>
<div class="scanlines"></div>

<div class="relative z-10 h-screen flex flex-col overflow-hidden">
  <!-- Header -->
  <header class="header-cyber">
    <div class="header-glow"></div>
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="logo-container">
            <img src="/logo.png" alt="SAMS" class="logo-image" />
          </div>
          <div>
            <h1 class="cyber-title">S.A.M.S</h1>
            <p class="cyber-subtitle">Secure Access Management System</p>
          </div>

          {#if $currentDatabase}
            <div class="db-indicator">
              <span class="bracket">&lt;</span>
              <span class="db-name">{$currentDatabase}</span>
              {#if $isDirty}
                <span class="unsaved-dot">*</span>
              {/if}
              <span class="bracket">/&gt;</span>
            </div>
          {/if}
        </div>

        <div class="status-indicator" class:authenticated={$isAuthenticated}>
          <div class="status-dot"></div>
          <span class="status-text">
            {$isAuthenticated ? 'SECURE' : 'LOCKED'}
          </span>
        </div>
      </div>
    </div>
  </header>

  {#if $isAuthenticated}
    <Navbar on:action={handleNavAction} />
  {/if}

  <main class="flex-1 min-h-0 overflow-hidden {$isAuthenticated ? 'container mx-auto px-4 py-4' : ''} fade-in">
    {#if !$isAuthenticated}
      <LoginPanel on:notify={(e) => notify(e.detail)} />
    {:else}
      <Dashboard on:notify={(e) => notify(e.detail)} />
    {/if}
  </main>

  <!-- Footer -->
  <footer class="cyber-footer">
    <div class="container mx-auto px-4">
      <div class="footer-content">
        <div class="tech-badges">
          <span class="tech-badge">AES-256-GCM</span>
          <span class="tech-divider">//</span>
          <span class="tech-badge">ARGON2ID</span>
          <span class="tech-divider">//</span>
          <span class="tech-badge">LOCAL ONLY</span>
        </div>
      </div>
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

<style>
  /* Cyber Background */
  .cyber-bg {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 40%),
      radial-gradient(ellipse at 0% 100%, rgba(6, 182, 212, 0.05) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }

  /* Subtle Scanlines */
  .scanlines {
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    );
    pointer-events: none;
    z-index: 1;
  }

  /* Header */
  .header-cyber {
    position: relative;
    background: rgba(0, 0, 0, 0.9);
    border-bottom: 1px solid rgba(6, 182, 212, 0.2);
    backdrop-filter: blur(12px);
    animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    flex-shrink: 0;
  }

  .header-glow {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(6, 182, 212, 0.5) 20%,
      rgba(6, 182, 212, 0.8) 50%,
      rgba(6, 182, 212, 0.5) 80%,
      transparent
    );
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
  }

  /* Logo */
  .logo-container {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4));
    transition: filter 0.3s ease;
  }

  .logo-container:hover {
    filter: drop-shadow(0 0 12px rgba(6, 182, 212, 0.6));
  }

  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* Title */
  .cyber-title {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: white;
    text-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
  }

  .cyber-subtitle {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: rgba(6, 182, 212, 0.6);
    margin-top: 2px;
  }

  /* Database Indicator */
  .db-indicator {
    font-size: 11px;
    margin-left: 8px;
    padding: 4px 10px;
    background: rgba(6, 182, 212, 0.1);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 4px;
  }

  .bracket {
    color: rgba(6, 182, 212, 0.4);
  }

  .db-name {
    color: rgba(6, 182, 212, 0.8);
  }

  .unsaved-dot {
    color: #fbbf24;
    animation: pulse 2s ease-in-out infinite;
  }

  /* Status Indicator */
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .status-indicator.authenticated {
    background: rgba(6, 182, 212, 0.1);
    border-color: rgba(6, 182, 212, 0.3);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }

  .status-indicator.authenticated .status-dot {
    background: #06b6d4;
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.8);
    animation: pulse 2s ease-in-out infinite;
  }

  .status-text {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: rgba(255, 255, 255, 0.4);
    transition: color 0.3s ease;
  }

  .status-indicator.authenticated .status-text {
    color: rgba(6, 182, 212, 0.9);
  }

  /* Footer */
  .cyber-footer {
    border-top: 1px solid rgba(6, 182, 212, 0.15);
    background: rgba(0, 0, 0, 0.5);
    padding: 10px 0;
    flex-shrink: 0;
  }

  .footer-content {
    display: flex;
    justify-content: center;
  }

  .tech-badges {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tech-badge {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: rgba(6, 182, 212, 0.5);
    padding: 2px 8px;
    background: rgba(6, 182, 212, 0.05);
    border: 1px solid rgba(6, 182, 212, 0.1);
    border-radius: 3px;
  }

  .tech-divider {
    color: rgba(6, 182, 212, 0.2);
    font-size: 10px;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
