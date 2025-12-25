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
    { id: 'all', label: 'All' },
    { id: 'logins', label: 'Logins' },
    { id: 'bookmarks', label: 'Bookmarks' },
    { id: 'expiring', label: 'Expiring' }
  ];

  const sortOptions = [
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'title', label: 'Title' },
    { id: 'expiry', label: 'Expiry' }
  ];

  let entriesContainer;
</script>

<div class="dashboard">
  <!-- Stats Row -->
  <div class="stats-row">
    <div class="stat-item">
      <span class="stat-value">{$stats.total}</span>
      <span class="stat-label">Total</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">{$stats.logins}</span>
      <span class="stat-label">Logins</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">{$stats.bookmarks}</span>
      <span class="stat-label">Bookmarks</span>
    </div>
    {#if $stats.expiring > 0 || $stats.expired > 0}
      <div class="stat-divider"></div>
      <div class="stat-item warning">
        <span class="stat-value">{$stats.expiring}</span>
        <span class="stat-label">Expiring</span>
      </div>
    {/if}
    {#if $stats.expired > 0}
      <div class="stat-divider"></div>
      <div class="stat-item danger">
        <span class="stat-value pulse">{$stats.expired}</span>
        <span class="stat-label">Expired</span>
      </div>
    {/if}
  </div>

  <!-- Main Layout -->
  <div class="main-grid">
    <!-- Sidebar -->
    <aside class="sidebar">
      <EntryForm on:notify={(e) => dispatch('notify', e.detail)} />
    </aside>

    <!-- Content -->
    <main class="content">
      <!-- Tabs -->
      <nav class="tabs-nav">
        {#each tabs as tab}
          <button
            class="tab-btn"
            class:active={$activeTab === tab.id}
            on:click={() => {
              $activeTab = tab.id;
              if (entriesContainer) entriesContainer.scrollTop = 0;
            }}
          >
            <span class="tab-label">{tab.label}</span>
            {#if tab.id === 'expiring' && $stats.expiring > 0}
              <span class="tab-badge">{$stats.expiring}</span>
            {/if}
          </button>
        {/each}
      </nav>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            bind:value={$searchQuery}
            placeholder="Search entries..."
            class="search-input"
          />
        </div>

        <select bind:value={$selectedTag} class="filter-select">
          <option value="">All tags</option>
          {#each $allTags as tag}
            <option value={tag}>{tag}</option>
          {/each}
        </select>

        <select bind:value={$sortBy} class="filter-select sort">
          {#each sortOptions as opt}
            <option value={opt.id}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <!-- Entries List -->
      <div bind:this={entriesContainer} class="entries-list">
        {#if $filteredEntries.length === 0}
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8"/>
                <path d="M3 16.2V21h4.8"/>
                <path d="M21 7.8V3h-4.8"/>
                <path d="M3 3h4.8v4.8H3z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <p class="empty-text">
              {$searchQuery || $selectedTag ? 'No matching entries found' : `No ${$activeTab === 'all' ? 'entries' : tabs.find(t => t.id === $activeTab)?.label.toLowerCase() || 'entries'} yet`}
            </p>
            <p class="empty-hint">
              {$searchQuery || $selectedTag ? 'Try a different search or filter' : 'Create your first entry using the form'}
            </p>
          </div>
        {:else}
          <div class="entries-grid">
            {#each $filteredEntries as entry (entry.id)}
              <EntryCard
                {entry}
                on:notify={(e) => dispatch('notify', e.detail)}
              />
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="entries-footer">
        <span class="entries-count">
          {$filteredEntries.length} {$filteredEntries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
    </main>
  </div>
</div>

<style>
  .dashboard {
    max-width: 1400px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 16px;
    animation: fadeIn 0.4s ease;
  }

  /* Stats Row */
  .stats-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 16px 24px;
    background: rgba(24, 24, 27, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    margin-bottom: 20px;
    flex-shrink: 0;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: white;
    line-height: 1;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }

  .stat-item.warning .stat-value { color: rgba(255, 255, 255, 0.7); }
  .stat-item.danger .stat-value { color: white; }

  .stat-divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.08);
  }

  .pulse {
    animation: pulse 2s ease-in-out infinite;
  }

  /* Main Grid */
  .main-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  @media (max-width: 1024px) {
    .main-grid {
      grid-template-columns: 1fr;
    }

    .sidebar {
      display: none;
    }
  }

  .sidebar {
    overflow-y: auto;
    min-height: 0;
  }

  .sidebar::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .content {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  /* Tabs */
  .tabs-nav {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: transparent;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .tab-badge {
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    color: white;
  }

  /* Filters */
  .filters-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  .search-wrapper {
    flex: 1;
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.3);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    font-size: 14px;
    color: white;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .filter-select {
    padding: 12px 36px 12px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff60' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
    background-position: right 10px center;
    background-repeat: no-repeat;
    background-size: 16px;
    transition: all 0.2s ease;
  }

  .filter-select:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .filter-select.sort {
    min-width: 110px;
  }

  /* Entries List */
  .entries-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-right: 4px;
  }

  .entries-list::-webkit-scrollbar {
    width: 6px;
  }

  .entries-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .entries-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .entries-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .entries-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 20px;
    margin-bottom: 20px;
    color: rgba(255, 255, 255, 0.15);
  }

  .empty-text {
    font-size: 15px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    margin: 0 0 8px 0;
  }

  .empty-hint {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.3);
    margin: 0;
  }

  /* Footer */
  .entries-footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 0;
    flex-shrink: 0;
  }

  .entries-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
