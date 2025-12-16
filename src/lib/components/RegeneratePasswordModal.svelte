<script>
  import { createEventDispatcher } from 'svelte';
  import { generatePassword } from '$lib/utils/encryption';
  import { updateEntry } from '$lib/stores/database';

  const dispatch = createEventDispatcher();

  export let entry;

  let newPassword = '';
  let expiryOption = entry.expiryDays === 0 ? 'never' : 'custom';
  let customWeeks = Math.floor((entry.expiryDays || 0) / 7);
  let customDays = (entry.expiryDays || 0) % 7;
  let copied = false;

  $: if (!newPassword) {
    newPassword = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true
    });
  }

  function getExpiryDays() {
    switch(expiryOption) {
      case 'never': return 0;
      case 'custom': return (customWeeks || 0) * 7 + (customDays || 0);
      default: return 0;
    }
  }

  function handleRegenerate() {
    newPassword = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true
    });
    copied = false;
  }

  function handleCopy() {
    navigator.clipboard.writeText(newPassword);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function handleApply() {
    updateEntry(entry.id, {
      password: newPassword,
      passwordSetDate: new Date().toISOString(),
      expiryDays: getExpiryDays()
    });
    dispatch('notify', 'Password updated and expiry reset');
    dispatch('close');
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      dispatch('close');
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="modal-backdrop" on:click={handleBackdropClick}>
  <div class="modal-content">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold uppercase tracking-[0.15em] text-white">
        Regenerate Password
      </h2>
      <button
        class="text-white/40 hover:text-white transition-colors text-xl"
        on:click={() => dispatch('close')}
      >
        ×
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-xs uppercase tracking-wider text-white/40 mb-2">
          Entry
        </label>
        <div class="text-sm text-white">
          {entry.title}
        </div>
      </div>

      <div>
        <label class="block text-xs uppercase tracking-wider text-white/40 mb-2">
          New Password
        </label>
        <div class="bg-black border border-white/20 p-3 text-sm text-white break-all font-medium">
          {newPassword}
        </div>
        <div class="flex gap-2 mt-2">
          <button
            class="mono-button-secondary flex-1 py-1.5"
            on:click={handleRegenerate}
          >
            Regenerate
          </button>
          <button
            class="flex-1 py-1.5"
            class:mono-button-success={copied}
            class:mono-button-secondary={!copied}
            on:click={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-xs uppercase tracking-wider text-white/40 mb-2">
          Password Expiry
        </label>
        <div class="space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" bind:group={expiryOption} value="never" class="mono-checkbox rounded-full" />
            <span class="text-sm text-white/80">Never expire</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer flex-wrap">
            <input type="radio" bind:group={expiryOption} value="custom" class="mono-checkbox rounded-full" />
            <span class="text-sm text-white/80">Custom:</span>
            {#if expiryOption === 'custom'}
              <input
                type="number"
                bind:value={customWeeks}
                min="0"
                class="mono-input w-16 py-1 text-center"
              />
              <span class="text-sm text-white/40">weeks</span>
              <input
                type="number"
                bind:value={customDays}
                min="0"
                max="6"
                class="mono-input w-16 py-1 text-center"
              />
              <span class="text-sm text-white/40">days</span>
            {/if}
          </label>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
        <button
          class="mono-button"
          on:click={handleApply}
        >
          Apply Password
        </button>

        <button
          class="mono-button-secondary"
          on:click={() => dispatch('close')}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
