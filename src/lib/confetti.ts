import confetti from 'canvas-confetti';

export function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#58a6ff', '#3fb950', '#f0883e', '#d2a8ff', '#ffa198'],
  });

  // Second burst slightly delayed
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { x: 0.2, y: 0.7 },
      colors: ['#58a6ff', '#3fb950'],
    });
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { x: 0.8, y: 0.7 },
      colors: ['#d2a8ff', '#ffa198'],
    });
  }, 150);
}