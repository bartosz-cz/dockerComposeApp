export default function decipher(encryptedText, selectedCiphers) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let resultText = encryptedText;

  const ciphersArray = Object.values(selectedCiphers).sort(
    (a, b) => b.id - a.id
  );

  for (const cipherSpec of ciphersArray) {
    const { key, tabula } = cipherSpec;
    const keyword = key;
    const keywordLength = keyword.length;
    const tabulaRecta = cipherSpec.tabula;
    const textUpper = resultText.toUpperCase();
    const keywordUpper = keyword.toUpperCase();

    let keywordIndex = 0;
    const newResult = [];

    for (let i = 0; i < textUpper.length; i++) {
      const cipherChar = textUpper[i];
      if (alphabet.includes(cipherChar)) {
        const rowLetter = keywordUpper[keywordIndex % keywordLength];
        const rowAlphabet = tabulaRecta[rowLetter];

        if (!rowAlphabet) {
          console.error(`Row alphabet for letter '${rowLetter}' is missing.`);
          newResult.push(cipherChar);
        } else {
          const charIndex = rowAlphabet.indexOf(cipherChar);
          if (charIndex === -1) {
            console.error(
              `Character '${cipherChar}' not found in row alphabet for '${rowLetter}'.`
            );
            newResult.push(cipherChar);
          } else {
            const plainChar = alphabet[charIndex];
            newResult.push(plainChar);
          }
        }

        keywordIndex++;
      } else {
        newResult.push(cipherChar);
      }
    }

    resultText = newResult.join("");
  }

  return resultText;
}
