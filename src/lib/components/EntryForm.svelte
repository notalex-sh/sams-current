<script>
  import { createEventDispatcher } from 'svelte';
  import { addEntry, findDuplicates } from '$lib/stores/database';
  import { generatePassword, calculatePasswordStrength } from '$lib/utils/encryption';
  import PasswordStrengthMeter from './PasswordStrengthMeter.svelte';

  const dispatch = createEventDispatcher();

  let title = '';
  let url = '';
  let username = '';
  let password = '';
  let docsUrl = '';
  let tags = '';
  let notes = '';
  let expiryWeeks = 0;
  let expiryDaysInput = 0;
  let neverExpire = true;
  let showPasswordInput = false;

  $: expiryDays = neverExpire ? 0 : (expiryWeeks || 0) * 7 + (expiryDaysInput || 0);

  let passLength = 16;
  let useUpper = true;
  let useLower = true;
  let useNumbers = true;
  let useSymbols = true;

  let showPasswordPreview = false;
  let generatedPassword = '';

  $: passwordStrength = calculatePasswordStrength(password);

  // Duplicate detection
  $: duplicates = (title || url || username) ? findDuplicates(title, url, username) : [];
  let showDuplicateWarning = false;

  function handleGeneratePassword() {
    generatedPassword = generatePassword({
      length: passLength,
      uppercase: useUpper,
      lowercase: useLower,
      numbers: useNumbers,
      symbols: useSymbols
    });
    showPasswordPreview = true;
  }

  function useGeneratedPassword() {
    password = generatedPassword;
    showPasswordPreview = false;
    dispatch('notify', 'Password applied');
  }

  function handleSubmit() {
    if (!title) {
      dispatch('notify', 'Title required');
      return;
    }

    // Check for duplicates
    if (duplicates.length > 0 && !showDuplicateWarning) {
      showDuplicateWarning = true;
      return;
    }

    const entry = {
      title,
      url,
      username,
      password,
      docsUrl,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      notes,
      expiryDays
    };

    addEntry(entry);

    // Reset form
    title = '';
    url = '';
    username = '';
    password = '';
    docsUrl = '';
    tags = '';
    notes = '';
    expiryWeeks = 0;
    expiryDaysInput = 0;
    neverExpire = true;
    generatedPassword = '';
    showPasswordPreview = false;
    showPasswordInput = false;
    showDuplicateWarning = false;

    dispatch('notify', 'Entry created');
  }

  function dismissDuplicateWarning() {
    showDuplicateWarning = false;
  }
</script>

<div class="cyber-border p-4">
  <h3 class="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-white">
    New Entry
  </h3>

  <div class="space-y-2">
    <input
      type="text"
      bind:value={title}
      placeholder="TITLE *"
      class="mono-input text-sm"
    />

    <input
      type="url"
      bind:value={url}
      placeholder="URL"
      class="mono-input text-sm"
    />

    <input
      type="text"
      bind:value={username}
      placeholder="USERNAME"
      class="mono-input text-sm"
    />

    <!-- Duplicate Warning -->
    {#if duplicates.length > 0}
      <div class="border border-yellow-400/30 bg-yellow-400/5 p-2 text-xs">
        <div class="text-yellow-400 font-medium mb-1">Possible duplicate{duplicates.length > 1 ? 's' : ''}:</div>
        {#each duplicates.slice(0, 2) as dup}
          <div class="text-white/60">• {dup.entry.title} <span class="text-white/30">({dup.reason})</span></div>
        {/each}
        {#if duplicates.length > 2}
          <div class="text-white/30">...and {duplicates.length - 2} more</div>
        {/if}
      </div>
    {/if}

    <div>
      <div class="relative">
        {#if showPasswordInput}
          <input
            type="text"
            bind:value={password}
            placeholder="PASSWORD"
            class="mono-input text-sm pr-14"
          />
        {:else}
          <input
            type="password"
            bind:value={password}
            placeholder="PASSWORD"
            class="mono-input text-sm pr-14"
          />
        {/if}
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/40 hover:text-white transition-colors px-1"
          on:click={() => showPasswordInput = !showPasswordInput}
        >
          {showPasswordInput ? 'HIDE' : 'SHOW'}
        </button>
      </div>
      {#if password}
        <PasswordStrengthMeter strength={passwordStrength} />
      {/if}
    </div>

    <div class="border-t border-white/10 pt-3 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-[10px] uppercase tracking-wider text-white/40">Length</span>
        <div class="flex items-center gap-1">
          <input
            type="number"
            bind:value={passLength}
            min="8"
            max="64"
            class="mono-input w-14 py-1 text-xs text-center"
          />
          <span class="text-[10px] text-white/40">chars</span>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-1 text-xs">
        <label class="flex items-center gap-1 text-white/60 hover:text-white cursor-pointer">
          <input type="checkbox" bind:checked={useUpper} class="mono-checkbox w-3 h-3" />
          <span>A-Z</span>
        </label>
        <label class="flex items-center gap-1 text-white/60 hover:text-white cursor-pointer">
          <input type="checkbox" bind:checked={useLower} class="mono-checkbox w-3 h-3" />
          <span>a-z</span>
        </label>
        <label class="flex items-center gap-1 text-white/60 hover:text-white cursor-pointer">
          <input type="checkbox" bind:checked={useNumbers} class="mono-checkbox w-3 h-3" />
          <span>0-9</span>
        </label>
        <label class="flex items-center gap-1 text-white/60 hover:text-white cursor-pointer">
          <input type="checkbox" bind:checked={useSymbols} class="mono-checkbox w-3 h-3" />
          <span>!@#</span>
        </label>
      </div>

      <button
        class="mono-button-secondary w-full py-1.5 text-xs"
        on:click={handleGeneratePassword}
      >
        Generate
      </button>

      {#if showPasswordPreview && generatedPassword}
        <div class="border border-white/20 bg-black p-2 fade-in">
          <div class="text-[10px] uppercase tracking-wider text-white/40 mb-1">Preview</div>
          <div class="break-all text-xs text-white font-medium">{generatedPassword}</div>
          <div class="mt-2 flex gap-1">
            <button class="mono-button flex-1 text-[10px] py-1" on:click={useGeneratedPassword}>Use</button>
            <button class="mono-button-secondary flex-1 text-[10px] py-1" on:click={handleGeneratePassword}>New</button>
            <button class="mono-button-secondary flex-1 text-[10px] py-1" on:click={() => { navigator.clipboard.writeText(generatedPassword); dispatch('notify', 'Copied'); }}>Copy</button>
          </div>
        </div>
      {/if}
    </div>

    <div class="border-t border-white/10 pt-3 space-y-2">
      <div class="flex items-center gap-2 flex-wrap">
        <label class="flex items-center gap-1 text-xs text-white/60 hover:text-white cursor-pointer">
          <input type="checkbox" bind:checked={neverExpire} class="mono-checkbox w-3 h-3" />
          <span>Never expire</span>
        </label>
        {#if !neverExpire}
          <input type="number" bind:value={expiryWeeks} min="0" class="mono-input w-12 text-center py-1 text-xs" />
          <span class="text-[10px] text-white/40">w</span>
          <input type="number" bind:value={expiryDaysInput} min="0" max="6" class="mono-input w-12 text-center py-1 text-xs" />
          <span class="text-[10px] text-white/40">d</span>
        {/if}
      </div>
      {#if !neverExpire}
        <div class="flex gap-1">
          <button type="button" class="flex-1 text-[10px] py-1 border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-all" on:click={() => { expiryWeeks = 4; expiryDaysInput = 2; }}>30d</button>
          <button type="button" class="flex-1 text-[10px] py-1 border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-all" on:click={() => { expiryWeeks = 12; expiryDaysInput = 6; }}>90d</button>
          <button type="button" class="flex-1 text-[10px] py-1 border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-all" on:click={() => { expiryWeeks = 26; expiryDaysInput = 0; }}>6mo</button>
          <button type="button" class="flex-1 text-[10px] py-1 border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-all" on:click={() => { expiryWeeks = 52; expiryDaysInput = 0; }}>1yr</button>
        </div>
      {/if}
    </div>

    <input
      type="url"
      bind:value={docsUrl}
      placeholder="DOCUMENTATION URL"
      class="mono-input text-sm"
    />

    <input
      type="text"
      bind:value={tags}
      placeholder="TAGS (COMMA SEPARATED)"
      class="mono-input text-sm"
    />

    <textarea
      bind:value={notes}
      placeholder="NOTES"
      rows="2"
      class="mono-input text-sm resize-none"
    />

    {#if showDuplicateWarning && duplicates.length > 0}
      <div class="border border-yellow-400/50 bg-yellow-400/10 p-2 text-xs fade-in">
        <div class="text-yellow-400 font-medium mb-2">Create anyway?</div>
        <div class="flex gap-2">
          <button class="mono-button flex-1 py-1 text-[10px]" on:click={handleSubmit}>Yes, Create</button>
          <button class="mono-button-secondary flex-1 py-1 text-[10px]" on:click={dismissDuplicateWarning}>Cancel</button>
        </div>
      </div>
    {:else}
      <button
        class="mono-button w-full text-sm"
        on:click={handleSubmit}
      >
        Create Entry
      </button>
    {/if}
  </div>
</div>
