/**
 * Stare de mișcare pentru modul explorare: scrisă de taste (W/S/A/D/Q/E) și de
 * butoanele de pe ecran (UI), citită în scenă (useFrame) ca să miște camera.
 * Axele continue (țin apăsat = mișcă): -1, 0 sau 1.
 *   forward → W/S (înainte/înapoi)
 *   right   → D/A (dreapta/stânga)
 *   up      → Q/E (sus/jos)
 * `zoom` = impuls de la scroll-ul mouse-ului (înainte/înapoi), consumat și
 * readus la 0 la fiecare cadru.
 */
export const flyInput = { forward: 0, right: 0, up: 0, zoom: 0 }

export function resetFlyInput() {
  flyInput.forward = 0
  flyInput.right = 0
  flyInput.up = 0
  flyInput.zoom = 0
}
