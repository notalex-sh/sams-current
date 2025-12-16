<script>
  import { createEventDispatcher } from 'svelte';
  import { deleteEntry, updateEntry } from '$lib/stores/database';
  import RegeneratePasswordModal from './RegeneratePasswordModal.svelte';
  import { differenceInDays, addDays } from 'date-fns';

  const dispatch = createEventDispatcher();

  export let entry;

  let showPassword = false;
  let showEditPassword = false;
  let isEditing = false;
  let editData = {};
  let showRegenerateModal = false;

  $: expiryStatus = calculateExpiryStatus(entry);

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

  function copyToClipboard(text, type) {
    navigator.clipboard.writeText(text);
    dispatch('notify', `${type} copied`);
  }

  function handleDelete() {
    if (confirm(`Delete "${entry.title}"?`)) {
      deleteEntry(entry.id);
      dispatch('notify', 'Entry deleted');
    }
  }

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
  }

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

    updateEntry(entry.id, {
      ...dataToSave,
      tags: parsedTags,
      expiryDays: newExpiryDays
    });
    isEditing = false;
    dispatch('notify', 'Entry updated');
  }

  function cancelEdit() {
    isEditing = false;
    showEditPassword = false;
  }
</script>

<div class="cyber-border p-4 relative group">
  {#if !isEditing}
    <!-- Action Buttons -->
    <div class="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="mono-button-secondary px-2 py-1 text-xs" on:click={startEdit}>
        Edit
      </button>
      <button class="mono-button-danger px-2 py-1 text-xs" on:click={handleDelete}>
        Del
      </button>
    </div>

    <div class="pr-20">
      <!-- Title -->
      <h3 class="text-base font-medium text-white">
        {#if entry.url}
          <a href={entry.url} target="_blank" rel="noopener noreferrer" class="hover:text-white/70 transition-colors">
            {entry.title}
            <span class="text-xs text-white/30 ml-1">↗</span>
          </a>
        {:else}
          {entry.title}
        {/if}
      </h3>

      <!-- URL -->
      {#if entry.url}
        <div class="mt-1 text-xs text-white/30 truncate">
          {entry.url}
        </div>
      {/if}

      <!-- Docs Link -->
      {#if entry.docsUrl}
        <a href={entry.docsUrl} target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-xs text-white/40 hover:text-white transition-colors">
          [DOCS]
        </a>
      {/if}

      <!-- Tags -->
      {#if entry.tags && entry.tags.length > 0}
        <div class="mt-2 flex flex-wrap gap-1">
          {#each entry.tags as tag}
            <span class="mono-badge text-xs">{tag}</span>
          {/each}
        </div>
      {/if}

      <!-- Notes -->
      {#if entry.notes}
        <div class="mt-2 text-sm text-white/50">
          {entry.notes}
        </div>
      {/if}

      <!-- Password Section -->
      {#if entry.hasPassword}
        <div class="mt-4 pt-4 border-t border-white/10">
          {#if expiryStatus}
            <div class="mb-3">
              {#if expiryStatus.status === 'expired'}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-red-400 unsaved-indicator">
                    EXPIRED: {expiryStatus.days}d ago
                  </span>
                  <button class="mono-button-danger px-2 py-1 text-xs" on:click={() => showRegenerateModal = true}>
                    Regenerate
                  </button>
                </div>
              {:else if expiryStatus.status === 'expiring'}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-yellow-400">
                    EXPIRES: {expiryStatus.days}d
                  </span>
                  <button class="mono-button-secondary px-2 py-1 text-xs" on:click={() => showRegenerateModal = true}>
                    Update
                  </button>
                </div>
              {:else if expiryStatus.status === 'ok'}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-white/30">
                    Expires in {expiryStatus.weeks}w {expiryStatus.remainingDays}d
                  </span>
                  <button class="mono-button-secondary px-2 py-0.5 text-xs opacity-50 hover:opacity-100" on:click={() => showRegenerateModal = true}>
                    Regen
                  </button>
                </div>
              {:else if expiryStatus.status === 'never'}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-white/30">
                    Never expires
                  </span>
                  <button class="mono-button-secondary px-2 py-0.5 text-xs opacity-50 hover:opacity-100" on:click={() => showRegenerateModal = true}>
                    Regen
                  </button>
                </div>
              {/if}
            </div>
          {/if}

          <div class="space-y-2">
            <!-- Username -->
            <div class="flex items-center gap-2">
              <span class="text-xs uppercase text-white/30 w-14">User:</span>
              <span class="text-sm text-white/70 flex-1">{entry.username || '—'}</span>
              {#if entry.username}
                <button class="mono-button-secondary px-2 py-0.5 text-xs" on:click={() => copyToClipboard(entry.username, 'Username')}>
                  Copy
                </button>
              {/if}
            </div>

            <!-- Password -->
            <div class="flex items-center gap-2">
              <span class="text-xs uppercase text-white/30 w-14">Pass:</span>
              {#if showPassword}
                <input type="text" value={entry.password || ''} readonly class="flex-1 bg-black border border-white/10 px-2 py-1 text-sm text-white/70" />
              {:else}
                <input type="password" value={entry.password || ''} readonly class="flex-1 bg-black border border-white/10 px-2 py-1 text-sm text-white/70" />
              {/if}
              <button class="mono-button-secondary px-2 py-0.5 text-xs" on:click={() => showPassword = !showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
              {#if entry.password}
                <button class="mono-button-secondary px-2 py-0.5 text-xs" on:click={() => copyToClipboard(entry.password, 'Password')}>
                  Copy
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Metadata -->
      <div class="mt-3 text-xs text-white/20">
        {new Date(entry.createdAt).toISOString().split('T')[0]}
        {#if entry.passwordSetDate}
          | PWD: {new Date(entry.passwordSetDate).toISOString().split('T')[0]}
        {/if}
      </div>
    </div>
  {:else}
    <!-- Edit Mode -->
    <div class="space-y-2">
      <input type="text" bind:value={editData.title} placeholder="TITLE" class="mono-input text-sm" />
      <input type="url" bind:value={editData.url} placeholder="URL" class="mono-input text-sm" />
      <input type="text" bind:value={editData.username} placeholder="USERNAME" class="mono-input text-sm" />

      <div class="relative">
        {#if showEditPassword}
          <input
            type="text"
            bind:value={editData.password}
            placeholder="PASSWORD"
            class="mono-input text-sm pr-16"
          />
        {:else}
          <input
            type="password"
            bind:value={editData.password}
            placeholder="PASSWORD"
            class="mono-input text-sm pr-16"
          />
        {/if}
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white transition-colors px-2"
          on:click={() => showEditPassword = !showEditPassword}
        >
          {showEditPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <label class="flex items-center gap-2 text-xs text-white/60 hover:text-white cursor-pointer transition-colors">
          <input type="checkbox" bind:checked={editData._neverExpire} class="mono-checkbox" />
          <span>Never expire</span>
        </label>
        {#if !editData._neverExpire}
          <div class="flex items-center gap-2">
            <input type="number" bind:value={editData._editExpiryWeeks} min="0" class="mono-input w-14 py-1 text-center" />
            <span class="text-xs text-white/40">weeks</span>
            <input type="number" bind:value={editData._editExpiryDays} min="0" max="6" class="mono-input w-14 py-1 text-center" />
            <span class="text-xs text-white/40">days</span>
          </div>
        {/if}
      </div>

      <input type="url" bind:value={editData.docsUrl} placeholder="DOCS URL" class="mono-input text-sm" />
      <input type="text" bind:value={editData._tagsString} placeholder="TAGS (COMMA SEPARATED)" class="mono-input text-sm" />
      <textarea bind:value={editData.notes} placeholder="NOTES" rows="2" class="mono-input text-sm resize-none" />

      <div class="flex gap-2">
        <button class="mono-button flex-1 text-xs py-1.5" on:click={saveEdit}>
          Save
        </button>
        <button class="mono-button-secondary flex-1 text-xs py-1.5" on:click={cancelEdit}>
          Cancel
        </button>
      </div>
    </div>
  {/if}
</div>

{#if showRegenerateModal}
  <RegeneratePasswordModal {entry} on:close={() => showRegenerateModal = false} on:notify={(e) => dispatch('notify', e.detail)} />
{/if}
