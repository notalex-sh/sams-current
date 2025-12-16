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
    activeTab
  } from '$lib/stores/database';

  const dispatch = createEventDispatcher();

  const tabs = [
    { id: 'all', label: 'ALL' },
    { id: 'logins', label: 'LOGINS' },
    { id: 'bookmarks', label: 'BOOKMARKS' },
    { id: 'expiring', label: 'EXPIRING', highlight: true }
  ];

  let entriesContainer;
  let sidebarContainer;
  let sidebarHeight = 0;

  function updateSidebarHeight() {
    if (sidebarContainer) {
      sidebarHeight = sidebarContainer.offsetHeight;
    }
  }
</script>

<svelte:window on:resize={updateSidebarHeight} />

<div class="max-w-7xl mx-auto content-load">
  <!-- Stats Grid -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
    <div class="stat-card">
      <div class="text-2xl font-bold text-white">{$stats.total}</div>
      <div class="text-xs uppercase tracking-wider text-white/40 mt-1">Total</div>
    </div>
    <div class="stat-card">
      <div class="text-2xl font-bold text-white">{$stats.logins}</div>
      <div class="text-xs uppercase tracking-wider text-white/40 mt-1">Logins</div>
    </div>
    <div class="stat-card">
      <div class="text-2xl font-bold text-white">{$stats.bookmarks}</div>
      <div class="text-xs uppercase tracking-wider text-white/40 mt-1">Bookmarks</div>
    </div>
    <div class="stat-card">
      <div class="text-2xl font-bold text-yellow-400">{$stats.expiring}</div>
      <div class="text-xs uppercase tracking-wider text-white/40 mt-1">Expiring</div>
    </div>
    {#if $stats.expired > 0}
      <div class="stat-card" style="border-color: rgba(255, 68, 68, 0.3);">
        <div class="text-2xl font-bold text-red-400 unsaved-indicator">{$stats.expired}</div>
        <div class="text-xs uppercase tracking-wider text-white/40 mt-1">Expired</div>
      </div>
    {/if}
  </div>

  <!-- Main Content Grid -->
  <div class="grid lg:grid-cols-3 gap-6">
    <!-- Sidebar - Entry Form -->
    <div class="lg:col-span-1" bind:this={sidebarContainer}>
      <EntryForm on:notify={(e) => dispatch('notify', e.detail)} on:mounted={updateSidebarHeight} />
    </div>

    <!-- Entries List -->
    <div class="lg:col-span-2 flex flex-col">
      <!-- Tabs -->
      <div class="flex border-b border-white/10 mb-4 overflow-x-auto">
        {#each tabs as tab}
          <button
            class="px-4 py-3 text-xs uppercase tracking-wider transition-all whitespace-nowrap relative {$activeTab === tab.id ? 'tab-active text-white' : 'text-white/40 hover:text-white/70'}"
            on:click={() => {
              $activeTab = tab.id;
              if (entriesContainer) entriesContainer.scrollTop = 0;
            }}
          >
            {tab.label}
            {#if tab.id === 'expiring' && $stats.expiring > 0}
              <span class="ml-2 px-1.5 py-0.5 text-[10px] bg-white/10 border border-white/20">
                {$stats.expiring}
              </span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Search & Filter -->
      <div class="flex gap-3 mb-4">
        <input
          type="text"
          bind:value={$searchQuery}
          placeholder="SEARCH..."
          class="mono-input flex-1"
        />
        <select
          bind:value={$selectedTag}
          class="mono-input w-36"
        >
          <option value="">ALL TAGS</option>
          {#each $allTags as tag}
            <option value={tag}>{tag}</option>
          {/each}
        </select>
      </div>

      <!-- Scrollable Entries Container -->
      <div
        bind:this={entriesContainer}
        class="space-y-3 custom-scrollbar flex-1 overflow-y-auto pr-1"
        style="max-height: calc(100vh - 320px); min-height: 400px;">
        {#if $filteredEntries.length === 0}
          <div class="cyber-border text-center py-16 px-4">
            <p class="text-white/40 text-sm uppercase tracking-wider">
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
    </div>
  </div>
</div>
