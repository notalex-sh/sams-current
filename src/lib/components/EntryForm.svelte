<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { addEntry } from '$lib/stores/database';
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

  onMount(() => {
    dispatch('mounted');
  });

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

    dispatch('notify', 'Entry created');
  }
</script>

<div class="cyber-border p-5">
  <h3 class="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-white">
    New Entry
  </h3>

  <div class="space-y-3">
    <div>
      <input
        type="text"
        bind:value={title}
        placeholder="TITLE *"
        class="mono-input"
      />
    </div>

    <div>
      <input
        type="url"
        bind:value={url}
        placeholder="URL"
        class="mono-input"
      />
    </div>

    <div>
      <input
        type="text"
        bind:value={username}
        placeholder="USERNAME"
        class="mono-input"
      />
    </div>

    <div>
      <div class="relative">
        {#if showPasswordInput}
          <input
            type="text"
            bind:value={password}
            placeholder="PASSWORD"
            class="mono-input pr-16"
          />
        {:else}
          <input
            type="password"
            bind:value={password}
            placeholder="PASSWORD"
            class="mono-input pr-16"
          />
        {/if}
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white transition-colors px-2 py-1"
          on:click={() => showPasswordInput = !showPasswordInput}
        >
          {showPasswordInput ? 'HIDE' : 'SHOW'}
        </button>
      </div>
      {#if password}
        <PasswordStrengthMeter strength={passwordStrength} />
      {/if}
    </div>

    <div class="border-t border-white/10 pt-4 space-y-3">
      <div class="flex items-center justify-between">
        <label for="passLength" class="text-xs uppercase tracking-wider text-white/40">
          Length
        </label>
        <div class="flex items-center gap-2">
          <input
            id="passLength"
            type="number"
            bind:value={passLength}
            min="8"
            max="64"
            class="mono-input w-16 py-1 text-center"
          />
          <span class="text-xs text-white/40">chars</span>
        </div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-white/40 mb-2">Character Types</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
          <label class="flex items-center gap-2 text-white/60 hover:text-white cursor-pointer transition-colors">
            <input type="checkbox" bind:checked={useUpper} class="mono-checkbox" />
            <span>A-Z</span>
          </label>
          <label class="flex items-center gap-2 text-white/60 hover:text-white cursor-pointer transition-colors">
            <input type="checkbox" bind:checked={useLower} class="mono-checkbox" />
            <span>a-z</span>
          </label>
          <label class="flex items-center gap-2 text-white/60 hover:text-white cursor-pointer transition-colors">
            <input type="checkbox" bind:checked={useNumbers} class="mono-checkbox" />
            <span>0-9</span>
          </label>
          <label class="flex items-center gap-2 text-white/60 hover:text-white cursor-pointer transition-colors">
            <input type="checkbox" bind:checked={useSymbols} class="mono-checkbox" />
            <span>!@#</span>
          </label>
        </div>
      </div>

      <button
        class="mono-button-secondary w-full py-2"
        on:click={handleGeneratePassword}
      >
        Generate
      </button>

      {#if showPasswordPreview && generatedPassword}
        <div class="mt-3 border border-white/20 bg-black p-3 fade-in">
          <div class="mb-2 text-xs uppercase tracking-wider text-white/40">
            Preview
          </div>
          <div class="break-all text-sm text-white font-medium">
            {generatedPassword}
          </div>
          <div class="mt-3 flex gap-2">
            <button
              class="mono-button flex-1 text-xs py-1.5"
              on:click={useGeneratedPassword}
            >
              Use
            </button>
            <button
              class="mono-button-secondary flex-1 text-xs py-1.5"
              on:click={handleGeneratePassword}
            >
              New
            </button>
            <button
              class="mono-button-secondary flex-1 text-xs py-1.5"
              on:click={() => {
                navigator.clipboard.writeText(generatedPassword);
                dispatch('notify', 'Copied');
              }}
            >
              Copy
            </button>
          </div>
        </div>
      {/if}
    </div>

    <div class="border-t border-white/10 pt-4">
      <div class="flex items-center gap-3 flex-wrap">
        <label class="flex items-center gap-2 text-xs text-white/60 hover:text-white cursor-pointer transition-colors">
          <input
            type="checkbox"
            bind:checked={neverExpire}
            class="mono-checkbox"
          />
          <span>Never expire</span>
        </label>
        {#if !neverExpire}
          <div class="flex items-center gap-2">
            <input
              type="number"
              bind:value={expiryWeeks}
              min="0"
              class="mono-input w-16 text-center py-1"
            />
            <span class="text-xs text-white/40">weeks</span>
            <input
              type="number"
              bind:value={expiryDaysInput}
              min="0"
              max="6"
              class="mono-input w-16 text-center py-1"
            />
            <span class="text-xs text-white/40">days</span>
          </div>
        {/if}
      </div>
    </div>

    <div>
      <input
        type="url"
        bind:value={docsUrl}
        placeholder="DOCUMENTATION URL"
        class="mono-input"
      />
    </div>

    <div>
      <input
        type="text"
        bind:value={tags}
        placeholder="TAGS (COMMA SEPARATED)"
        class="mono-input"
      />
    </div>

    <div>
      <textarea
        bind:value={notes}
        placeholder="NOTES"
        rows="2"
        class="mono-input resize-none"
      />
    </div>

    <button
      class="mono-button w-full"
      on:click={handleSubmit}
    >
      Create Entry
    </button>
  </div>
</div>
