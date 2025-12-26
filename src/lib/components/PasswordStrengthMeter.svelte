<script>
  export let strength = 0;

  const strengthLevels = [
    { label: 'VERY WEAK', width: '20%', opacity: 0.2 },
    { label: 'WEAK', width: '40%', opacity: 0.35 },
    { label: 'FAIR', width: '60%', opacity: 0.5 },
    { label: 'GOOD', width: '80%', opacity: 0.7 },
    { label: 'STRONG', width: '100%', opacity: 0.85 },
    { label: 'EXCELLENT', width: '100%', opacity: 1 }
  ];

  $: currentLevel = strengthLevels[Math.min(strength, strengthLevels.length - 1)];
</script>

<div class="strength-meter">
  <div class="strength-header">
    <span class="strength-label">Strength</span>
    <span class="strength-value" style="opacity: {currentLevel.opacity}">
      {currentLevel.label}
    </span>
  </div>
  <div class="strength-track">
    <div
      class="strength-bar"
      style="width: {currentLevel.width}; opacity: {currentLevel.opacity}"
    />
  </div>
</div>

<style>
  .strength-meter {
    margin-top: 8px;
  }

  .strength-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .strength-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.3);
  }

  .strength-value {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: white;
    transition: opacity 0.3s ease;
  }

  .strength-track {
    margin-top: 6px;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 1px;
    overflow: hidden;
  }

  .strength-bar {
    height: 100%;
    background: white;
    border-radius: 1px;
    transition: all 0.3s ease;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
</style>
