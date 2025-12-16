<script>
  export let strength = 0;

  const strengthLevels = [
    { label: 'VERY WEAK', color: 'text-red-400', barColor: 'bg-red-400', width: '20%' },
    { label: 'WEAK', color: 'text-orange-400', barColor: 'bg-orange-400', width: '40%' },
    { label: 'FAIR', color: 'text-yellow-400', barColor: 'bg-yellow-400', width: '60%' },
    { label: 'GOOD', color: 'text-blue-400', barColor: 'bg-blue-400', width: '80%' },
    { label: 'STRONG', color: 'text-green-400', barColor: 'bg-green-400', width: '100%' },
    { label: 'EXCELLENT', color: 'text-white', barColor: 'bg-white', width: '100%' }
  ];

  $: currentLevel = strengthLevels[Math.min(strength, strengthLevels.length - 1)];
</script>

<div class="mt-2">
  <div class="flex items-center justify-between">
    <span class="text-[10px] uppercase tracking-wider text-white/30">Strength</span>
    <span class="text-[10px] uppercase tracking-wider {currentLevel.color}">
      {currentLevel.label}
    </span>
  </div>
  <div class="mt-1 h-0.5 bg-white/10">
    <div
      class="h-full transition-all duration-300 {currentLevel.barColor}"
      style="width: {currentLevel.width}; box-shadow: 0 0 10px currentColor;"
    />
  </div>
</div>
