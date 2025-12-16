<script>
  import { createEventDispatcher } from 'svelte';
  import { loadDatabase, createNewDatabase } from '$lib/stores/database';

  const dispatch = createEventDispatcher();

  let selectedFile = null;
  let password = '';
  let isCreatingNew = false;
  let confirmPassword = '';
  let loading = false;

  function handleFileSelect(event) {
    selectedFile = event.target.files[0];
    isCreatingNew = false;
    password = '';
  }

  function startNewDatabase() {
    isCreatingNew = true;
    selectedFile = null;
    password = '';
    confirmPassword = '';
  }

  async function handleSubmit() {
    if (!password) {
      dispatch('notify', 'Password required');
      return;
    }

    if (isCreatingNew) {
      if (password !== confirmPassword) {
        dispatch('notify', 'Passwords do not match');
        return;
      }
      if (password.length < 8) {
        dispatch('notify', 'Minimum 8 characters required');
        return;
      }

      loading = true;
      try {
        await createNewDatabase(password);
        dispatch('notify', 'Database initialized. Save to create file.');
      } catch (error) {
        dispatch('notify', 'Initialization failed: ' + error.message);
      } finally {
        loading = false;
      }
    } else if (selectedFile) {
      loading = true;
      try {
        await loadDatabase(selectedFile, password);
        dispatch('notify', 'Access granted');
      } catch (error) {
        dispatch('notify', 'Authentication failed');
      } finally {
        loading = false;
      }
    } else {
      dispatch('notify', 'Select database or create new');
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center px-4 cyber-grid">
  <div class="w-full max-w-md fade-in">
    <div class="cyber-border p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold tracking-[0.3em] text-white mb-2">S.A.M.S.</h1>
        <p class="text-xs uppercase tracking-wider text-white/40">
          {isCreatingNew ? 'Initialize Database' : 'Access Database'}
        </p>
      </div>

      {#if !isCreatingNew}
        <!-- File Selection -->
        <div class="mb-6">
          <label class="block text-xs uppercase tracking-wider text-white/40 mb-2">
            Database File
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              value={selectedFile ? selectedFile.name : 'NO FILE SELECTED'}
              class="mono-input flex-1 text-xs text-white/50"
            />
            <label class="mono-button-secondary cursor-pointer text-xs px-3">
              Open
              <input
                type="file"
                accept=".sams"
                class="hidden"
                on:change={handleFileSelect}
              />
            </label>
          </div>

          <div class="mt-4 text-center">
            <span class="text-xs text-white/20 uppercase tracking-wider">or</span>
          </div>

          <button
            class="mono-button w-full mt-4"
            on:click={startNewDatabase}
          >
            Create New Database
          </button>
        </div>
      {/if}

      {#if selectedFile || isCreatingNew}
        <div class="space-y-4 fade-in">
          <!-- Password -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-white/40 mb-2">
              {isCreatingNew ? 'Master Password' : 'Password'}
            </label>
            <input
              type="password"
              bind:value={password}
              placeholder="••••••••"
              class="mono-input"
              on:keydown={handleKeyDown}
            />
          </div>

          {#if isCreatingNew}
            <!-- Confirm Password -->
            <div>
              <label class="block text-xs uppercase tracking-wider text-white/40 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                bind:value={confirmPassword}
                placeholder="••••••••"
                class="mono-input"
                on:keydown={handleKeyDown}
              />
            </div>

            <!-- Requirements -->
            <div class="text-xs text-white/30 border-l-2 border-white/20 pl-3 py-2">
              <div class="space-y-1">
                <div>• Minimum 8 characters</div>
                <div>• Store securely</div>
                <div>• Cannot be recovered</div>
              </div>
            </div>
          {/if}

          <!-- Submit Buttons -->
          <div class="flex gap-2 pt-2">
            <button
              class="mono-button flex-1"
              on:click={handleSubmit}
              disabled={loading}
            >
              {#if loading}
                <span class="flex items-center justify-center gap-2">
                  <span class="loading-spinner w-4 h-4"></span>
                  Processing...
                </span>
              {:else}
                {isCreatingNew ? 'Initialize' : 'Authenticate'}
              {/if}
            </button>
            {#if isCreatingNew}
              <button
                class="mono-button-secondary"
                on:click={() => {
                  isCreatingNew = false;
                  password = '';
                  confirmPassword = '';
                }}
              >
                Cancel
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Security Footer -->
      <div class="mt-8 pt-6 border-t border-white/10 text-center">
        <p class="text-[10px] text-white/20 uppercase tracking-wider leading-relaxed">
          Security: AES-256-GCM | Argon2<br>
          Local Encryption | No Server Transmission
        </p>
      </div>
    </div>
  </div>
</div>
