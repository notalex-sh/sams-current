<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { generateTOTP, getTimeRemaining, formatTotpCode } from '$lib/utils/totp';

  const dispatch = createEventDispatcher();

  export let secret;
  export let period = 30;

  let code = '';
  let timeRemaining = 30;
  let intervalId;
  let isGenerating = false;

  $: progress = (timeRemaining / period) * 100;
  $: isLow = timeRemaining <= 5;

  async function updateCode() {
    if (!secret || isGenerating) return;

    isGenerating = true;
    try {
      const newCode = await generateTOTP(secret, { period });
      if (newCode) {
        code = newCode;
      }
    } catch (error) {
      console.error('Failed to generate TOTP:', error);
    }
    isGenerating = false;
  }

  function updateTimer() {
    const newRemaining = getTimeRemaining(period);

    // Check if we've crossed into a new period
    if (newRemaining > timeRemaining) {
      updateCode();
    }

    timeRemaining = newRemaining;
  }

  function copyCode() {
    if (code) {
      navigator.clipboard.writeText(code);
      dispatch('notify', 'TOTP copied');
    }
  }

  onMount(() => {
    updateCode();
    updateTimer();
    intervalId = setInterval(updateTimer, 1000);
  });

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
</script>

<div class="totp-container">
  <div class="totp-header">
    <span class="totp-label">2FA CODE</span>
    <div class="totp-timer" class:low={isLow}>
      <svg class="timer-ring" viewBox="0 0 36 36">
        <circle
          class="timer-bg"
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke-width="2"
        />
        <circle
          class="timer-progress"
          class:low={isLow}
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke-width="2"
          stroke-dasharray="100"
          stroke-dashoffset={100 - progress}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span class="timer-text">{timeRemaining}</span>
    </div>
  </div>

  <button class="totp-code" on:click={copyCode} title="Click to copy">
    {#if code}
      <span class="code-digits">{formatTotpCode(code)}</span>
      <span class="copy-hint">COPY</span>
    {:else}
      <span class="code-loading">------</span>
    {/if}
  </button>
</div>

<style>
  .totp-container {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    margin-top: 12px;
  }

  .totp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .totp-label {
    font-size: 10px;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
  }

  .totp-timer {
    position: relative;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timer-ring {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .timer-bg {
    stroke: rgba(255, 255, 255, 0.1);
  }

  .timer-progress {
    stroke: rgba(139, 92, 246, 0.8);
    transition: stroke-dashoffset 0.3s ease;
  }

  .timer-progress.low {
    stroke: rgba(239, 68, 68, 0.8);
  }

  .timer-text {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }

  .totp-timer.low .timer-text {
    color: rgba(239, 68, 68, 0.9);
    animation: pulse-warning 1s ease-in-out infinite;
  }

  .totp-code {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .totp-code:hover {
    background: rgba(0, 0, 0, 0.4);
    border-color: rgba(139, 92, 246, 0.5);
  }

  .totp-code:active {
    transform: scale(0.98);
  }

  .code-digits {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #ffffff;
    font-variant-numeric: tabular-nums;
  }

  .code-loading {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: rgba(255, 255, 255, 0.3);
  }

  .copy-hint {
    font-size: 10px;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.4);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .totp-code:hover .copy-hint {
    opacity: 1;
  }

  @keyframes pulse-warning {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
