import confetti from 'canvas-confetti';

export function fireComicConfetti(originY: number = 0.6) {
  try {
    // 1. Center Halftone Dot Explosion
    confetti({
      particleCount: 65,
      spread: 90,
      startVelocity: 45,
      origin: { y: originY, x: 0.5 },
      colors: ['#39FF14', '#00FFFF', '#FF00FF', '#FFE600', '#FFFFFF'],
      shapes: ['circle', 'square'],
      scalar: 1.2,
      ticks: 180,
      disableForReducedMotion: true
    });

    // 2. Left and Right Comic Flank Bursts
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0.15, y: originY + 0.1 },
        colors: ['#39FF14', '#00FFFF', '#FF00FF', '#FFE600'],
        shapes: ['circle'],
        scalar: 1.4,
        ticks: 160
      });

      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 0.85, y: originY + 0.1 },
        colors: ['#39FF14', '#00FFFF', '#FF00FF', '#FFE600'],
        shapes: ['circle'],
        scalar: 1.4,
        ticks: 160
      });
    }, 150);
  } catch (e) {
    // Fallback if canvas is unavailable
  }
}

export function fireBigScreenCelebration() {
  try {
    const end = Date.now() + 1500;
    const colors = ['#39FF14', '#00FFFF', '#FF00FF', '#FFE600', '#FFFFFF'];

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        shapes: ['circle', 'star'] as any,
        scalar: 1.5
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        shapes: ['circle', 'star'] as any,
        scalar: 1.5
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (e) {
    // ignore
  }
}
