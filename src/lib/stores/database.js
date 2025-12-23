import { writable, derived, get } from 'svelte/store';
import { encryptData, decryptData } from '$lib/utils/encryption';
import { addDays, differenceInDays, isAfter } from 'date-fns';

export const isAuthenticated = writable(false);
export const currentDatabase = writable(null);
export const masterPassword = writable(null);
export const isDirty = writable(false);
export const entries = writable([]);
export const searchQuery = writable('');
export const selectedTag = writable('');
export const activeTab = writable('all');
export const sortBy = writable('newest');
export const isProcessing = writable(false);
export const processingMessage = writable('');

export const config = writable({
  dbFilename: 'sams_database.sams',
  passwordExpiryDays: 90,
  expiryWarningDays: 14,
  autoSave: false
});

/*
 * Derived store that filters and sorts entries based on current UI state.
 * Applies tab filter, search query, tag filter, and sort order.
 */
export const filteredEntries = derived(
  [entries, searchQuery, selectedTag, activeTab, sortBy],
  ([$entries, $searchQuery, $selectedTag, $activeTab, $sortBy]) => {
    let filtered = [...$entries];

    if ($activeTab === 'logins') {
      filtered = filtered.filter(e => e.hasPassword);
    } else if ($activeTab === 'bookmarks') {
      filtered = filtered.filter(e => !e.hasPassword);
    } else if ($activeTab === 'expiring') {
      const now = new Date();
      filtered = filtered.filter(e => {
        if (!e.hasPassword || !e.passwordSetDate) return false;
        if (e.expiryDays === 0) return false;
        const expiryDate = addDays(new Date(e.passwordSetDate), e.expiryDays ?? 90);
        const daysUntilExpiry = differenceInDays(expiryDate, now);
        return daysUntilExpiry <= 14 && daysUntilExpiry >= 0;
      });
    }

    if ($searchQuery) {
      const query = $searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(query) ||
        (entry.url && entry.url.toLowerCase().includes(query)) ||
        (entry.username && entry.username.toLowerCase().includes(query)) ||
        (entry.notes && entry.notes.toLowerCase().includes(query)) ||
        (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    if ($selectedTag) {
      filtered = filtered.filter(entry =>
        entry.tags && entry.tags.includes($selectedTag)
      );
    }

    const now = new Date();
    return filtered.sort((a, b) => {
      switch ($sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'expiry':
          const getExpiryDays = (entry) => {
            if (!entry.hasPassword || !entry.passwordSetDate || entry.expiryDays === 0) return Infinity;
            const expiryDate = addDays(new Date(entry.passwordSetDate), entry.expiryDays ?? 90);
            return differenceInDays(expiryDate, now);
          };
          return getExpiryDays(a) - getExpiryDays(b);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }
);

/*
 * Derived store that extracts all unique tags from entries, sorted alphabetically.
 */
export const allTags = derived(entries, ($entries) => {
  const tags = new Set();
  $entries.forEach(entry => {
    if (entry.tags) {
      entry.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
});

/*
 * Derived store that computes summary statistics for the dashboard.
 * Returns counts for total, logins, bookmarks, expiring, and expired entries.
 */
export const stats = derived(entries, ($entries) => {
  const total = $entries.length;
  const logins = $entries.filter(e => e.hasPassword).length;
  const bookmarks = $entries.filter(e => !e.hasPassword).length;

  const now = new Date();
  const expiring = $entries.filter(e => {
    if (!e.hasPassword || !e.passwordSetDate) return false;
    if (e.expiryDays === 0) return false;
    const expiryDate = addDays(new Date(e.passwordSetDate), e.expiryDays ?? 90);
    const daysUntilExpiry = differenceInDays(expiryDate, now);
    return daysUntilExpiry <= 14 && daysUntilExpiry >= 0;
  }).length;

  const expired = $entries.filter(e => {
    if (!e.hasPassword || !e.passwordSetDate) return false;
    if (e.expiryDays === 0) return false;
    const expiryDate = addDays(new Date(e.passwordSetDate), e.expiryDays ?? 90);
    return isAfter(now, expiryDate);
  }).length;

  return { total, logins, bookmarks, expiring, expired };
});

/*
 * Adds a new entry to the database with generated metadata.
 * Sets creation timestamp, password date, and marks database as dirty.
 */
export function addEntry(entry) {
  entries.update(items => {
    const newEntry = {
      ...entry,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      passwordSetDate: entry.password ? new Date().toISOString() : null,
      expiryDays: entry.expiryDays ?? 0,
      hasPassword: !!(entry.username || entry.password),
      totpSecret: entry.totpSecret || null
    };
    isDirty.set(true);
    return [...items, newEntry];
  });
}

/*
 * Updates an existing entry by ID.
 * Resets password date if password changed, marks database as dirty.
 */
export function updateEntry(id, updates) {
  entries.update(items => {
    const index = items.findIndex(e => e.id === id);
    if (index !== -1) {
      const currentItem = items[index];
      if (updates.password && updates.password !== currentItem.password) {
        updates.passwordSetDate = new Date().toISOString();
      }
      items[index] = {
        ...currentItem,
        ...updates,
        hasPassword: !!(updates.username || updates.password || currentItem.username || currentItem.password)
      };
      isDirty.set(true);
    }
    return items;
  });
}

/*
 * Removes an entry from the database by ID.
 */
export function deleteEntry(id) {
  entries.update(items => {
    isDirty.set(true);
    return items.filter(e => e.id !== id);
  });
}

/*
 * Updates an entry's password and resets its expiry timer.
 */
export function regeneratePassword(id, newPassword) {
  updateEntry(id, {
    password: newPassword,
    passwordSetDate: new Date().toISOString()
  });
}

/*
 * Encrypts all entries and triggers a file download.
 * Uses the master password for encryption.
 */
export async function saveDatabase() {
  const pwd = get(masterPassword);
  if (!pwd) throw new Error('No master password set');

  isProcessing.set(true);
  processingMessage.set('Encrypting database...');

  try {
    const entriesData = get(entries);
    const encryptedBlob = await encryptData(entriesData, pwd);
    const blob = new Blob([encryptedBlob], { type: 'application/octet-stream' });
    const configData = get(config);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = get(currentDatabase) || configData.dbFilename;
    a.click();
    URL.revokeObjectURL(url);

    isDirty.set(false);
  } finally {
    isProcessing.set(false);
    processingMessage.set('');
  }
}

/*
 * Decrypts and loads entries from an encrypted database file.
 * Normalizes entry fields for backwards compatibility.
 */
export async function loadDatabase(file, password) {
  isProcessing.set(true);
  processingMessage.set('Decrypting database...');

  try {
    const encryptedBlob = await file.arrayBuffer();
    const decrypted = await decryptData(encryptedBlob, password);

    const normalizedEntries = decrypted.map(entry => ({
      ...entry,
      tags: entry.tags || [],
      notes: entry.notes || '',
      docsUrl: entry.docsUrl || '',
      createdAt: entry.createdAt || new Date().toISOString(),
      passwordSetDate: entry.passwordSetDate || (entry.password ? entry.createdAt : null),
      expiryDays: entry.expiryDays ?? 90,
      hasPassword: !!(entry.username || entry.password),
      totpSecret: entry.totpSecret || null
    }));

    entries.set(normalizedEntries);
    currentDatabase.set(file.name);
    masterPassword.set(password);
    isAuthenticated.set(true);
    isDirty.set(false);
  } finally {
    isProcessing.set(false);
    processingMessage.set('');
  }
}

/*
 * Initializes an empty database with a new master password.
 */
export async function createNewDatabase(password) {
  isProcessing.set(true);
  processingMessage.set('Initializing database...');

  try {
    entries.set([]);
    currentDatabase.set(null);
    masterPassword.set(password);
    isAuthenticated.set(true);
    isDirty.set(true);
  } finally {
    isProcessing.set(false);
    processingMessage.set('');
  }
}

/*
 * Clears all state and returns to the login screen.
 */
export function logout() {
  entries.set([]);
  currentDatabase.set(null);
  masterPassword.set(null);
  isAuthenticated.set(false);
  isDirty.set(false);
  searchQuery.set('');
  selectedTag.set('');
  activeTab.set('all');
  sortBy.set('newest');
  isProcessing.set(false);
  processingMessage.set('');
}

/*
 * Checks for potential duplicate entries by URL hostname or title+username.
 * Returns an array of matches with reason strings.
 */
export function findDuplicates(title, url, username) {
  const currentEntries = get(entries);
  const duplicates = [];

  for (const entry of currentEntries) {
    if (url && entry.url) {
      try {
        const newUrl = new URL(url).hostname.toLowerCase();
        const existingUrl = new URL(entry.url).hostname.toLowerCase();
        if (newUrl === existingUrl) {
          duplicates.push({ entry, reason: 'Same URL' });
          continue;
        }
      } catch {
      }
    }

    if (title && entry.title.toLowerCase() === title.toLowerCase()) {
      if (username && entry.username && entry.username.toLowerCase() === username.toLowerCase()) {
        duplicates.push({ entry, reason: 'Same title and username' });
      } else if (!username && !entry.username) {
        duplicates.push({ entry, reason: 'Same title' });
      }
    }
  }

  return duplicates;
}
