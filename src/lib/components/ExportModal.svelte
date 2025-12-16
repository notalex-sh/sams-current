<script>
  import { createEventDispatcher } from 'svelte';
  import { entries } from '$lib/stores/database';
  import { downloadCSV } from '$lib/utils/export';

  const dispatch = createEventDispatcher();

  let includePasswords = false;
  let filename = 'sams_export_' + new Date().toISOString().split('T')[0] + '.csv';

  function handleExportCSV() {
    const exportEntries = $entries.map(entry => {
      if (!includePasswords) {
        return { ...entry, password: '[REDACTED]' };
      }
      return entry;
    });

    downloadCSV(exportEntries, filename);
    dispatch('notify', `Exported ${exportEntries.length} entries`);
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
        Export Database
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
          Export Filename
        </label>
        <input
          type="text"
          bind:value={filename}
          class="mono-input"
        />
      </div>

      <div class="border-t border-white/10 pt-4">
        <label class="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            bind:checked={includePasswords}
            class="mono-checkbox"
          />
          <div>
            <span class="text-sm text-white/80 group-hover:text-white transition-colors">
              Include passwords
            </span>
            <p class="text-xs text-white/30 mt-1">
              Warning: CSV exports are unencrypted plain text
            </p>
          </div>
        </label>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-4">
        <button
          class="mono-button"
          on:click={handleExportCSV}
        >
          Export CSV
        </button>

        <button
          class="mono-button-secondary"
          on:click={() => dispatch('close')}
        >
          Cancel
        </button>
      </div>

      <div class="border-t border-white/10 pt-4">
        <p class="text-xs text-white/30">
          Note: For encrypted backups, use the Save function.<br>
          CSV exports are for data portability only.
        </p>
      </div>
    </div>
  </div>
</div>
