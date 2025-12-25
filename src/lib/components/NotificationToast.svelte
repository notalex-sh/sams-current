<script>
  import { onMount } from 'svelte';

  export let show = false;
  export let message = '';
  export let duration = 3000;

  let timeout;

  $: if (show) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      show = false;
    }, duration);
  }

  onMount(() => {
    return () => clearTimeout(timeout);
  });
</script>

{#if show}
  <div class="toast-container">
    <div class="toast">
      <div class="toast-indicator"></div>
      <p class="toast-message">{message}</p>
    </div>
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    top: 80px;
    right: 16px;
    z-index: 50;
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    background: rgba(10, 10, 12, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    box-shadow:
      0 0 30px rgba(255, 255, 255, 0.05),
      0 4px 20px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
  }

  .toast-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    animation: pulse 2s ease-in-out infinite;
  }

  .toast-message {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
