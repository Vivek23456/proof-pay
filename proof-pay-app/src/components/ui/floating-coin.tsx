/**
 * A USDC coin that floats around the viewport on a slow wandering path
 * (~28 s per loop) while spinning on its vertical axis (~5 s per spin).
 *
 * Implementation:
 *  - Outer `.floating-coin` handles the orbit (translate keyframes in vw/vh).
 *  - Inner `.coin-spin` handles 3D rotation (rotateY 0 → 360°).
 *  - Two faces (`coin-front`, `coin-back`) with `backface-visibility: hidden`
 *    create a real 3D coin illusion as it spins.
 *
 * Pure CSS — zero JS, GPU-friendly transforms only. All keyframes live in
 * globals.css alongside the static styles.
 */
export function FloatingCoin() {
  return (
    <div aria-hidden className="floating-coin">
      <div className="coin-spin">
        <div className="coin-face coin-front">USDC</div>
        <div className="coin-face coin-back" />
      </div>
    </div>
  );
}
