<script>
  import { createEventDispatcher } from 'svelte';
  import EntryForm from './EntryForm.svelte';
  import EntryCard from './EntryCard.svelte';
  import {
    filteredEntries,
    stats,
    allTags,
    searchQuery,
    selectedTag,
    activeTab,
    sortBy
  } from '$lib/stores/database';

  const dispatch = createEventDispatcher();

  const tabs = [
    { id: 'all', label: 'ALL' },
    { id: 'logins', label: 'LOGINS' },
    { id: 'bookmarks', label: 'BOOKMARKS' },
    { id: 'expiring', label: 'EXPIRING', highlight: true }
  ];

  const sortOptions = [
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'title', label: 'Title' },
    { id: 'expiry', label: 'Expiry' }
  ];

  let entriesContainer;
</script>

<div class="max-w-6xl mx-auto content-load h-full flex flex-col overflow-hidden">
  <!-- Stats Grid -->
  <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 mb-4 flex-shrink-0">
    <div class="stat-card py-2">
      <div class="text-lg font-bold text-white">{$stats.total}</div>
      <div class="text-[9px] uppercase tracking-wider text-white/40">Total</div>
    </div>
    <div class="stat-card py-2">
      <div class="text-lg font-bold text-white">{$stats.logins}</div>
      <div class="text-[9px] uppercase tracking-wider text-white/40">Logins</div>
    </div>
    <div class="stat-card py-2">
      <div class="text-lg font-bold text-white">{$stats.bookmarks}</div>
      <div class="text-[9px] uppercase tracking-wider text-white/40">Bookmarks</div>
    </div>
    <div class="stat-card py-2">
      <div class="text-lg font-bold text-yellow-400">{$stats.expiring}</div>
      <div class="text-[9px] uppercase tracking-wider text-white/40">Expiring</div>
    </div>
    {#if $stats.expired > 0}
      <div class="stat-card py-2" style="border-color: rgba(255, 68, 68, 0.3);">
        <div class="text-lg font-bold text-red-400 unsaved-indicator">{$stats.expired}</div>
        <div class="text-[9px] uppercase tracking-wider text-white/40">Expired</div>
      </div>
    {/if}
  </div>

  <!-- Main Content Grid -->
  <div class="grid lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
    <!-- Sidebar - Entry Form -->
    <div class="lg:col-span-1 overflow-y-auto custom-scrollbar min-h-0">
      <EntryForm on:notify={(e) => dispatch('notify', e.detail)} />
    </div>

    <!-- Entries List -->
    <div class="lg:col-span-2 flex flex-col min-h-0 overflow-hidden">
      <!-- Tabs -->
      <div class="flex border-b border-white/10 mb-2 overflow-x-auto flex-shrink-0">
        {#each tabs as tab}
          <button
            class="px-3 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap relative {$activeTab === tab.id ? 'tab-active text-white' : 'text-white/40 hover:text-white/70'}"
            on:click={() => {
              $activeTab = tab.id;
              if (entriesContainer) entriesContainer.scrollTop = 0;
            }}
          >
            {tab.label}
            {#if tab.id === 'expiring' && $stats.expiring > 0}
              <span class="ml-1 px-1 py-0.5 text-[10px] bg-white/10 border border-white/20">
                {$stats.expiring}
              </span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Search, Filter & Sort -->
      <div class="flex gap-2 mb-2 flex-shrink-0 flex-wrap">
        <input
          type="text"
          bind:value={$searchQuery}
          placeholder="SEARCH..."
          class="mono-input flex-1 min-w-[120px]"
        />
        <select
          bind:value={$selectedTag}
          class="mono-input w-28"
        >
          <option value="">ALL TAGS</option>
          {#each $allTags as tag}
            <option value={tag}>{tag}</option>
          {/each}
        </select>
        <select
          bind:value={$sortBy}
          class="mono-input w-24"
        >
          {#each sortOptions as opt}
            <option value={opt.id}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <!-- Scrollable Entries Container -->
      <div
        bind:this={entriesContainer}
        class="space-y-2 custom-scrollbar flex-1 overflow-y-auto pr-1 min-h-0"
      >
        {#if $filteredEntries.length === 0}
          <div class="cyber-border text-center py-8 px-4">
            <p class="text-white/40 text-xs uppercase tracking-wider">
              {$searchQuery || $selectedTag ? 'No matches found' : `No ${tabs.find(t => t.id === $activeTab)?.label.toLowerCase() || 'entries'}`}
            </p>
          </div>
        {:else}
          {#each $filteredEntries as entry (entry.id)}
            <EntryCard
              {entry}
              on:notify={(e) => dispatch('notify', e.detail)}
            />
          {/each}
        {/if}
      </div>

      <!-- Entry Count -->
      <div class="text-[10px] text-white/30 uppercase tracking-wider mt-2 text-right flex-shrink-0">
        {$filteredEntries.length} {$filteredEntries.length === 1 ? 'entry' : 'entries'}
      </div>
    </div>
  </div>
</div>
