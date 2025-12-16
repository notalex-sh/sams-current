<script>
  import { onMount } from 'svelte';

  export let show = false;
  export let message = '';
  export let duration = 3000;

  let timeout;

  $: if (show) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      show = false;
    }, duration);
  }

  onMount(() => {
    return () => clearTimeout(timeout);
  });
</script>

{#if show}
  <div class="fixed top-20 right-4 z-50 animate-slide-in-right">
    <div class="bg-black border border-white/30 px-6 py-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
      <p class="text-xs uppercase tracking-widest text-white">
        {message}
      </p>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.2s ease-out;
  }
</style>
