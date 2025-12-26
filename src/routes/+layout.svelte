<script>
  import '../app.css';
  import { theme } from '$lib/stores/database';
</script>

<div class="min-h-screen cyber-grid" class:light-mode={$theme === 'light'} class:dark-mode={$theme === 'dark'}>
  <slot />
</div>

<style>
  .dark-mode {
    --bg-primary: #000000;
    --bg-secondary: rgba(24, 24, 27, 0.8);
    --bg-tertiary: rgba(24, 24, 27, 0.95);
    --bg-input: rgba(0, 0, 0, 0.3);
    --bg-hover: rgba(255, 255, 255, 0.06);
    --text-primary: #ffffff;
    --text-secondary: rgba(255, 255, 255, 0.7);
    --text-muted: rgba(255, 255, 255, 0.4);
    --border-primary: rgba(255, 255, 255, 0.1);
    --border-secondary: rgba(255, 255, 255, 0.06);
    --accent: #ffffff;
    --accent-muted: rgba(255, 255, 255, 0.8);
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .light-mode {
    --bg-primary: #f5f5f5;
    --bg-secondary: rgba(255, 255, 255, 0.95);
    --bg-tertiary: #ffffff;
    --bg-input: rgba(0, 0, 0, 0.05);
    --bg-hover: rgba(0, 0, 0, 0.04);
    --text-primary: #1a1a1a;
    --text-secondary: rgba(0, 0, 0, 0.7);
    --text-muted: rgba(0, 0, 0, 0.4);
    --border-primary: rgba(0, 0, 0, 0.1);
    --border-secondary: rgba(0, 0, 0, 0.06);
    --accent: #1a1a1a;
    --accent-muted: rgba(0, 0, 0, 0.8);
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .light-mode :global(.cyber-grid) {
    background-image:
      linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  }
</style>
