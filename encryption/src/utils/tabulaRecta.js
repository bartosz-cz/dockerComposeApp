export default function tabulaRectaGen() {
  const tabulaRecta = {};
  const shifts = {};
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < alphabet.length; i++) {
    const rowLetter = alphabet[i];
    const shift = Math.floor(Math.random() * 26);
    shifts[rowLetter] = shift;
    const shiftedAlphabet = alphabet.slice(shift) + alphabet.slice(0, shift);
    tabulaRecta[rowLetter] = shiftedAlphabet;
  }

  return { tabulaRecta, shifts };
}
export function generateTabulaRectaFromShifts(shifts) {
  const tabulaRecta = {};
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (const letter in shifts) {
    const shift = shifts[letter];
    const shiftedAlphabet = alphabet.slice(shift) + alphabet.slice(0, shift);
    tabulaRecta[letter] = shiftedAlphabet;
  }

  return tabulaRecta;
}
