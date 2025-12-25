<script>
  import { createEventDispatcher } from 'svelte';
  import { addEntry, findDuplicates } from '$lib/stores/database';
  import { generatePassword, calculatePasswordStrength } from '$lib/utils/encryption';
  import { parseOtpAuthUri } from '$lib/utils/totp';
  import PasswordStrengthMeter from './PasswordStrengthMeter.svelte';

  const dispatch = createEventDispatcher();

  let title = '';
  let url = '';
  let username = '';
  let password = '';
  let totpSecret = '';
  let docsUrl = '';
  let tags = '';
  let notes = '';
  let expiryWeeks = 0;
  let expiryDaysInput = 0;
  let neverExpire = true;
  let showPasswordInput = false;
  let showTotpInput = false;

  $: expiryDays = neverExpire ? 0 : (expiryWeeks || 0) * 7 + (expiryDaysInput || 0);

  let passLength = 16;
  let useUpper = true;
  let useLower = true;
  let useNumbers = true;
  let useSymbols = true;

  let showPasswordPreview = false;
  let generatedPassword = '';

  $: passwordStrength = calculatePasswordStrength(password);
  $: duplicates = (title || url || username) ? findDuplicates(title, url, username) : [];
  let showDuplicateWarning = false;

  /*
   * Generates a new password using current settings and shows preview.
   */
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

  /*
   * Applies the generated password to the form field.
   */
  function useGeneratedPassword() {
    password = generatedPassword;
    showPasswordPreview = false;
    dispatch('notify', 'Password applied');
  }

  /*
   * Handles TOTP input, extracting secret from otpauth:// URIs if present.
   */
  function handleTotpInput(e) {
    const value = e.target.value;

    if (value.startsWith('otpauth://')) {
      const parsed = parseOtpAuthUri(value);
      if (parsed && parsed.secret) {
        totpSecret = parsed.secret;
        dispatch('notify', 'TOTP secret extracted from URI');
        return;
      }
    }

    totpSecret = value.replace(/\s+/g, '').toUpperCase();
  }

  /*
   * Validates form data and creates a new entry.
   * Shows duplicate warning if potential duplicates exist.
   */
  function handleSubmit() {
    if (!title) {
      dispatch('notify', 'Title required');
      return;
    }

    if (duplicates.length > 0 && !showDuplicateWarning) {
      showDuplicateWarning = true;
      return;
    }

    const entry = {
      title,
      url,
      username,
      password,
      totpSecret: totpSecret || null,
      docsUrl,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      notes,
      expiryDays
    };

    addEntry(entry);

    title = '';
    url = '';
    username = '';
    password = '';
    totpSecret = '';
    docsUrl = '';
    tags = '';
    notes = '';
    expiryWeeks = 0;
    expiryDaysInput = 0;
    neverExpire = true;
    generatedPassword = '';
    showPasswordPreview = false;
    showPasswordInput = false;
    showTotpInput = false;
    showDuplicateWarning = false;

    dispatch('notify', 'Entry created');
  }

  /*
   * Hides the duplicate warning dialog.
   */
  function dismissDuplicateWarning() {
    showDuplicateWarning = false;
  }
</script>

<div class="form-card">
  <div class="form-header">
    <h3 class="form-title">New Entry</h3>
    <div class="form-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
  </div>

  <div class="form-body">
    <!-- Basic Info -->
    <div class="form-section">
      <input
        type="text"
        bind:value={title}
        placeholder="Title *"
        class="form-input"
      />

      <input
        type="url"
        bind:value={url}
        placeholder="URL"
        class="form-input"
      />

      <input
        type="text"
        bind:value={username}
        placeholder="Username"
        class="form-input"
      />
    </div>

    <!-- Duplicate Warning -->
    {#if duplicates.length > 0}
      <div class="warning-box">
        <div class="warning-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Possible duplicate{duplicates.length > 1 ? 's' : ''}</span>
        </div>
        {#each duplicates.slice(0, 2) as dup}
          <div class="warning-item">{dup.entry.title} <span class="warning-reason">({dup.reason})</span></div>
        {/each}
        {#if duplicates.length > 2}
          <div class="warning-more">...and {duplicates.length - 2} more</div>
        {/if}
      </div>
    {/if}

    <!-- Password Section -->
    <div class="form-section">
      <label class="section-label">Password</label>

      <div class="password-row">
        {#if showPasswordInput}
          <input
            type="text"
            bind:value={password}
            placeholder="Password"
            class="form-input flex-1"
          />
        {:else}
          <input
            type="password"
            bind:value={password}
            placeholder="Password"
            class="form-input flex-1"
          />
        {/if}
        <button
          type="button"
          class="toggle-btn"
          on:click={() => showPasswordInput = !showPasswordInput}
        >
          {showPasswordInput ? 'Hide' : 'Show'}
        </button>
      </div>

      {#if password}
        <PasswordStrengthMeter strength={passwordStrength} />
      {/if}

      <div class="generator-section">
        <div class="generator-header">
          <span class="generator-label">Generator</span>
          <div class="length-control">
            <input
              type="number"
              bind:value={passLength}
              min="8"
              max="64"
              class="length-input"
            />
            <span class="length-unit">chars</span>
          </div>
        </div>

        <div class="char-options">
          <label class="char-option">
            <input type="checkbox" bind:checked={useUpper} class="option-checkbox" />
            <span>A-Z</span>
          </label>
          <label class="char-option">
            <input type="checkbox" bind:checked={useLower} class="option-checkbox" />
            <span>a-z</span>
          </label>
          <label class="char-option">
            <input type="checkbox" bind:checked={useNumbers} class="option-checkbox" />
            <span>0-9</span>
          </label>
          <label class="char-option">
            <input type="checkbox" bind:checked={useSymbols} class="option-checkbox" />
            <span>!@#</span>
          </label>
        </div>

        <button class="generate-btn" on:click={handleGeneratePassword}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Generate
        </button>

        {#if showPasswordPreview && generatedPassword}
          <div class="preview-box">
            <div class="preview-label">Preview</div>
            <div class="preview-value">{generatedPassword}</div>
            <div class="preview-actions">
              <button class="preview-btn primary" on:click={useGeneratedPassword}>Use</button>
              <button class="preview-btn" on:click={handleGeneratePassword}>New</button>
              <button class="preview-btn" on:click={() => { navigator.clipboard.writeText(generatedPassword); dispatch('notify', 'Copied'); }}>Copy</button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- TOTP Section -->
    <div class="form-section">
      <label class="section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        2FA / TOTP
      </label>

      <div class="totp-row">
        {#if showTotpInput}
          <input
            type="text"
            value={totpSecret}
            on:input={handleTotpInput}
            placeholder="TOTP Secret or otpauth:// URI"
            class="form-input flex-1"
          />
        {:else}
          <input
            type="password"
            value={totpSecret}
            on:input={handleTotpInput}
            placeholder="TOTP Secret or otpauth:// URI"
            class="form-input flex-1"
          />
        {/if}
        <button
          type="button"
          class="toggle-btn"
          on:click={() => showTotpInput = !showTotpInput}
        >
          {showTotpInput ? 'Hide' : 'Show'}
        </button>
      </div>

      <p class="totp-hint">Paste the setup key or scan QR code URI from your authenticator</p>
    </div>

    <!-- Expiry Section -->
    <div class="form-section">
      <label class="section-label">Password Expiry</label>

      <div class="expiry-controls">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={neverExpire} class="option-checkbox" />
          <span>Never expire</span>
        </label>

        {#if !neverExpire}
          <div class="expiry-inputs">
            <input type="number" bind:value={expiryWeeks} min="0" class="expiry-number" />
            <span class="expiry-unit">w</span>
            <input type="number" bind:value={expiryDaysInput} min="0" max="6" class="expiry-number" />
            <span class="expiry-unit">d</span>
          </div>
        {/if}
      </div>

      {#if !neverExpire}
        <div class="expiry-presets">
          <button type="button" class="preset-btn" on:click={() => { expiryWeeks = 4; expiryDaysInput = 2; }}>30d</button>
          <button type="button" class="preset-btn" on:click={() => { expiryWeeks = 12; expiryDaysInput = 6; }}>90d</button>
          <button type="button" class="preset-btn" on:click={() => { expiryWeeks = 26; expiryDaysInput = 0; }}>6mo</button>
          <button type="button" class="preset-btn" on:click={() => { expiryWeeks = 52; expiryDaysInput = 0; }}>1yr</button>
        </div>
      {/if}
    </div>

    <!-- Additional Info -->
    <div class="form-section">
      <input
        type="url"
        bind:value={docsUrl}
        placeholder="Documentation URL"
        class="form-input"
      />

      <input
        type="text"
        bind:value={tags}
        placeholder="Tags (comma separated)"
        class="form-input"
      />

      <textarea
        bind:value={notes}
        placeholder="Notes"
        rows="2"
        class="form-input resize-none"
      />
    </div>

    <!-- Submit -->
    {#if showDuplicateWarning && duplicates.length > 0}
      <div class="confirm-box">
        <div class="confirm-text">Create entry anyway?</div>
        <div class="confirm-actions">
          <button class="confirm-btn primary" on:click={handleSubmit}>Yes, Create</button>
          <button class="confirm-btn" on:click={dismissDuplicateWarning}>Cancel</button>
        </div>
      </div>
    {:else}
      <button class="submit-btn" on:click={handleSubmit}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Create Entry
      </button>
    {/if}
  </div>
</div>

<style>
  .form-card {
    background: rgba(24, 24, 27, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    overflow: hidden;
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .form-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: white;
    margin: 0;
    text-transform: uppercase;
  }

  .form-badge {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.4);
  }

  .form-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }

  .form-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 14px;
    color: white;
    transition: all 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .form-input::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  /* Warning Box */
  .warning-box {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    padding: 12px 16px;
  }

  .warning-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }

  .warning-item {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    padding-left: 22px;
  }

  .warning-reason {
    color: rgba(255, 255, 255, 0.3);
  }

  .warning-more {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    padding-left: 22px;
    margin-top: 4px;
  }

  /* Password Row */
  .password-row,
  .totp-row {
    display: flex;
    gap: 8px;
  }

  .toggle-btn {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .toggle-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  /* Generator */
  .generator-section {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 14px;
  }

  .generator-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .generator-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }

  .length-control {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .length-input {
    width: 50px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    color: white;
    text-align: center;
  }

  .length-unit {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
  }

  .char-options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 12px;
  }

  .char-option {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: 6px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .char-option:hover {
    background: rgba(255, 255, 255, 0.06);
    color: white;
  }

  .option-checkbox {
    width: 14px;
    height: 14px;
    accent-color: white;
  }

  .generate-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .generate-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .preview-box {
    margin-top: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    animation: fadeIn 0.2s ease;
  }

  .preview-label {
    font-size: 10px;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .preview-value {
    font-size: 13px;
    font-weight: 500;
    color: white;
    word-break: break-all;
    margin-bottom: 10px;
  }

  .preview-actions {
    display: flex;
    gap: 6px;
  }

  .preview-btn {
    flex: 1;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preview-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .preview-btn.primary {
    background: white;
    border-color: white;
    color: black;
  }

  .preview-btn.primary:hover {
    background: rgba(255, 255, 255, 0.9);
  }

  /* TOTP */
  .totp-hint {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    margin: 0;
  }

  /* Expiry */
  .expiry-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
  }

  .expiry-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .expiry-number {
    width: 50px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    color: white;
    text-align: center;
  }

  .expiry-unit {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
  }

  .expiry-presets {
    display: flex;
    gap: 6px;
  }

  .preset-btn {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preset-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    color: white;
  }

  /* Confirm Box */
  .confirm-box {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    animation: fadeIn 0.2s ease;
  }

  .confirm-text {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 12px;
  }

  .confirm-actions {
    display: flex;
    gap: 8px;
  }

  .confirm-btn {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
  }

  .confirm-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .confirm-btn.primary {
    background: white;
    border-color: white;
    color: black;
  }

  /* Submit Button */
  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px 20px;
    background: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: black;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .submit-btn:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
  }

  .submit-btn:active {
    transform: translateY(0);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
