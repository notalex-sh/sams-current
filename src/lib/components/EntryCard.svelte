<script>
  import { createEventDispatcher } from 'svelte';
  import { deleteEntry, updateEntry } from '$lib/stores/database';
  import RegeneratePasswordModal from './RegeneratePasswordModal.svelte';
  import TotpDisplay from './TotpDisplay.svelte';
  import { differenceInDays, addDays } from 'date-fns';

  const dispatch = createEventDispatcher();

  export let entry;

  let showPassword = false;
  let showEditPassword = false;
  let isEditing = false;
  let editData = {};
  let showRegenerateModal = false;
  let showTotpSecret = false;

  $: expiryStatus = calculateExpiryStatus(entry);
  $: hasTotpSecret = !!entry.totpSecret;

  /*
   * Prepends https:// to URLs that don't have a protocol.
   */
  function normalizeUrl(url) {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://' + url;
  }

  /*
   * Computes password expiry status (ok, expiring, expired, never).
   * Returns days/weeks remaining and status for UI display.
   */
  function calculateExpiryStatus(currentEntry) {
    if (!currentEntry.hasPassword || !currentEntry.passwordSetDate) return null;
    if (currentEntry.expiryDays === 0) {
      return { status: 'never', days: null, weeks: null, remainingDays: null };
    }

    const now = new Date();
    const passwordDate = new Date(currentEntry.passwordSetDate);
    const expiryDate = addDays(passwordDate, currentEntry.expiryDays ?? 90);
    const daysUntilExpiry = differenceInDays(expiryDate, now);

    const weeks = Math.floor(daysUntilExpiry / 7);
    const remainingDays = daysUntilExpiry % 7;

    if (daysUntilExpiry < 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiry), weeks: null, remainingDays: null };
    } else if (daysUntilExpiry <= 14) {
      return { status: 'expiring', days: daysUntilExpiry, weeks, remainingDays };
    }
    return { status: 'ok', days: daysUntilExpiry, weeks, remainingDays };
  }

  /*
   * Copies text to clipboard and shows a notification.
   */
  function copyToClipboard(text, type) {
    navigator.clipboard.writeText(text);
    dispatch('notify', `${type} copied`);
  }

  /*
   * Prompts for confirmation and deletes the entry.
   */
  function handleDelete() {
    if (confirm(`Delete "${entry.title}"?`)) {
      deleteEntry(entry.id);
      dispatch('notify', 'Entry deleted');
    }
  }

  /*
   * Initializes edit mode with current entry data.
   */
  function startEdit() {
    editData = {
      ...entry,
      _neverExpire: entry.expiryDays === 0,
      _editExpiryWeeks: Math.floor((entry.expiryDays || 0) / 7),
      _editExpiryDays: (entry.expiryDays || 0) % 7,
      _tagsString: entry.tags ? entry.tags.join(', ') : '',
    };
    isEditing = true;
    showEditPassword = false;
    showTotpSecret = false;
  }

  /*
   * Saves edited entry data and exits edit mode.
   */
  function saveEdit() {
    const {
      _neverExpire,
      _editExpiryWeeks,
      _editExpiryDays,
      _tagsString,
      ...dataToSave
    } = editData;

    const newExpiryDays = _neverExpire ? 0 : (_editExpiryWeeks || 0) * 7 + (_editExpiryDays || 0);
    const parsedTags = _tagsString ? _tagsString.split(',').map(t => t.trim()).filter(t => t) : [];

    if (dataToSave.totpSecret) {
      dataToSave.totpSecret = dataToSave.totpSecret.replace(/\s+/g, '').toUpperCase();
    }

    updateEntry(entry.id, {
      ...dataToSave,
      tags: parsedTags,
      expiryDays: newExpiryDays
    });
    isEditing = false;
    dispatch('notify', 'Entry updated');
  }

  /*
   * Discards changes and exits edit mode.
   */
  function cancelEdit() {
    isEditing = false;
    showEditPassword = false;
    showTotpSecret = false;
  }
</script>

<div class="entry-card group">
  {#if !isEditing}
    <!-- Action Buttons -->
    <div class="action-buttons">
      <button class="action-btn edit" on:click={startEdit}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="action-btn delete" on:click={handleDelete}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>

    <div class="entry-content">
      <!-- Header -->
      <div class="entry-header">
        <h3 class="entry-title">
          {#if entry.url}
            <a href={normalizeUrl(entry.url)} target="_blank" rel="noopener noreferrer" class="title-link">
              {entry.title}
              <svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          {:else}
            {entry.title}
          {/if}
        </h3>

        {#if entry.url}
          <div class="entry-url">{entry.url}</div>
        {/if}
      </div>

      <!-- Tags -->
      {#if entry.tags && entry.tags.length > 0}
        <div class="tags-container">
          {#each entry.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}

      <!-- Notes -->
      {#if entry.notes}
        <div class="entry-notes">{entry.notes}</div>
      {/if}

      <!-- Docs Link -->
      {#if entry.docsUrl}
        <a href={normalizeUrl(entry.docsUrl)} target="_blank" rel="noopener noreferrer" class="docs-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Documentation
        </a>
      {/if}

      <!-- Credentials Section -->
      {#if entry.hasPassword}
        <div class="credentials-section">
          <!-- Expiry Status -->
          {#if expiryStatus}
            <div class="expiry-bar">
              {#if expiryStatus.status === 'expired'}
                <div class="expiry-status expired">
                  <span class="status-dot"></span>
                  <span>Expired {expiryStatus.days}d ago</span>
                </div>
                <button class="regen-btn danger" on:click={() => showRegenerateModal = true}>
                  Regenerate
                </button>
              {:else if expiryStatus.status === 'expiring'}
                <div class="expiry-status warning">
                  <span class="status-dot"></span>
                  <span>Expires in {expiryStatus.days}d</span>
                </div>
                <button class="regen-btn warning" on:click={() => showRegenerateModal = true}>
                  Update
                </button>
              {:else if expiryStatus.status === 'ok'}
                <div class="expiry-status ok">
                  <span>Expires in {expiryStatus.weeks}w {expiryStatus.remainingDays}d</span>
                </div>
                <button class="regen-btn subtle" on:click={() => showRegenerateModal = true}>
                  Regen
                </button>
              {:else if expiryStatus.status === 'never'}
                <div class="expiry-status never">
                  <span>Never expires</span>
                </div>
                <button class="regen-btn subtle" on:click={() => showRegenerateModal = true}>
                  Regen
                </button>
              {/if}
            </div>
          {/if}

          <!-- Username -->
          <div class="credential-row">
            <span class="credential-label">USER</span>
            <span class="credential-value">{entry.username || '—'}</span>
            {#if entry.username}
              <button class="copy-btn" on:click={() => copyToClipboard(entry.username, 'Username')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            {/if}
          </div>

          <!-- Password -->
          <div class="credential-row">
            <span class="credential-label">PASS</span>
            <div class="password-field">
              {#if showPassword}
                <input type="text" value={entry.password || ''} readonly class="password-input" />
              {:else}
                <input type="password" value={entry.password || ''} readonly class="password-input" />
              {/if}
            </div>
            <button class="toggle-btn" on:click={() => showPassword = !showPassword}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
            {#if entry.password}
              <button class="copy-btn" on:click={() => copyToClipboard(entry.password, 'Password')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            {/if}
          </div>

          <!-- TOTP Display -->
          {#if hasTotpSecret}
            <TotpDisplay secret={entry.totpSecret} on:notify={(e) => dispatch('notify', e.detail)} />
          {/if}
        </div>
      {/if}

      <!-- Metadata -->
      <div class="entry-meta">
        <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
        {#if entry.passwordSetDate}
          <span class="meta-separator">|</span>
          <span>Password: {new Date(entry.passwordSetDate).toLocaleDateString()}</span>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Edit Mode -->
    <div class="edit-form">
      <input type="text" bind:value={editData.title} placeholder="Title" class="edit-input" />
      <input type="url" bind:value={editData.url} placeholder="URL" class="edit-input" />
      <input type="text" bind:value={editData.username} placeholder="Username" class="edit-input" />

      <div class="password-edit-row">
        {#if showEditPassword}
          <input
            type="text"
            bind:value={editData.password}
            placeholder="Password"
            class="edit-input flex-1"
          />
        {:else}
          <input
            type="password"
            bind:value={editData.password}
            placeholder="Password"
            class="edit-input flex-1"
          />
        {/if}
        <button type="button" class="toggle-btn" on:click={() => showEditPassword = !showEditPassword}>
          {showEditPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      <!-- TOTP Secret -->
      <div class="totp-edit-section">
        <div class="totp-edit-row">
          {#if showTotpSecret}
            <input
              type="text"
              bind:value={editData.totpSecret}
              placeholder="TOTP Secret (Base32)"
              class="edit-input flex-1"
            />
          {:else}
            <input
              type="password"
              bind:value={editData.totpSecret}
              placeholder="TOTP Secret (Base32)"
              class="edit-input flex-1"
            />
          {/if}
          <button type="button" class="toggle-btn" on:click={() => showTotpSecret = !showTotpSecret}>
            {showTotpSecret ? 'Hide' : 'Show'}
          </button>
        </div>
        <p class="totp-hint">Enter the Base32 secret from your authenticator setup</p>
      </div>

      <div class="expiry-edit">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={editData._neverExpire} class="mono-checkbox" />
          <span>Never expire</span>
        </label>
        {#if !editData._neverExpire}
          <div class="expiry-inputs">
            <input type="number" bind:value={editData._editExpiryWeeks} min="0" class="expiry-number" />
            <span class="expiry-unit">weeks</span>
            <input type="number" bind:value={editData._editExpiryDays} min="0" max="6" class="expiry-number" />
            <span class="expiry-unit">days</span>
          </div>
        {/if}
      </div>

      <input type="url" bind:value={editData.docsUrl} placeholder="Documentation URL" class="edit-input" />
      <input type="text" bind:value={editData._tagsString} placeholder="Tags (comma separated)" class="edit-input" />
      <textarea bind:value={editData.notes} placeholder="Notes" rows="2" class="edit-input resize-none" />

      <div class="edit-actions">
        <button class="save-btn" on:click={saveEdit}>Save</button>
        <button class="cancel-btn" on:click={cancelEdit}>Cancel</button>
      </div>
    </div>
  {/if}
</div>

{#if showRegenerateModal}
  <RegeneratePasswordModal {entry} on:close={() => showRegenerateModal = false} on:notify={(e) => dispatch('notify', e.detail)} />
{/if}

<style>
  .entry-card {
    background: rgba(24, 24, 27, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 20px;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .entry-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(24, 24, 27, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }

  .action-buttons {
    position: absolute;
    right: 16px;
    top: 16px;
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .entry-card:hover .action-buttons {
    opacity: 1;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn.edit:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .action-btn.delete:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }

  .entry-content {
    padding-right: 80px;
  }

  .entry-header {
    margin-bottom: 12px;
  }

  .entry-title {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  .title-link {
    color: white;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s ease;
  }

  .title-link:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  .external-icon {
    opacity: 0.4;
  }

  .entry-url {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .tag {
    font-size: 11px;
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.7);
  }

  .entry-notes {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 12px;
    line-height: 1.5;
  }

  .docs-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    text-decoration: none;
    margin-bottom: 12px;
    transition: color 0.2s ease;
  }

  .docs-link:hover {
    color: white;
  }

  .credentials-section {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 16px;
    margin-top: 16px;
  }

  .expiry-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .expiry-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  .expiry-status.expired { color: #ef4444; }
  .expiry-status.expired .status-dot { background: #ef4444; }

  .expiry-status.warning { color: #f59e0b; }
  .expiry-status.warning .status-dot { background: #f59e0b; }

  .expiry-status.ok { color: rgba(255, 255, 255, 0.4); }
  .expiry-status.never { color: rgba(255, 255, 255, 0.4); }

  .regen-btn {
    font-size: 11px;
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .regen-btn.danger {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.4);
  }

  .regen-btn.danger:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .regen-btn.warning {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.4);
  }

  .regen-btn.warning:hover {
    background: rgba(245, 158, 11, 0.15);
  }

  .regen-btn.subtle {
    color: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.1);
    opacity: 0.5;
  }

  .regen-btn.subtle:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.05);
  }

  .credential-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .credential-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.3);
    width: 40px;
    flex-shrink: 0;
  }

  .credential-value {
    flex: 1;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }

  .password-field {
    flex: 1;
  }

  .password-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }

  .toggle-btn {
    font-size: 11px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .copy-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .copy-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .entry-meta {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.2);
    margin-top: 16px;
  }

  .meta-separator {
    margin: 0 8px;
  }

  /* Edit Mode Styles */
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .edit-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    color: white;
    transition: all 0.2s ease;
  }

  .edit-input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
  }

  .edit-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .password-edit-row,
  .totp-edit-row {
    display: flex;
    gap: 8px;
  }

  .totp-edit-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .totp-hint {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    margin: 0;
  }

  .expiry-edit {
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
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
  }

  .expiry-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .expiry-number {
    width: 60px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    color: white;
    text-align: center;
  }

  .expiry-unit {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  .edit-actions {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }

  .save-btn,
  .cancel-btn {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-btn {
    background: white;
    color: black;
    border: none;
  }

  .save-btn:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }

  .cancel-btn {
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .cancel-btn:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
