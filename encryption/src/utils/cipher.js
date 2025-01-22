export default function cipher(text, selectedCiphers) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let resultText = text;

  const ciphersArray = Object.values(selectedCiphers).sort(
    (a, b) => a.id - b.id
  );

  ciphersArray.forEach((cipherSpec) => {
    const keyword = cipherSpec.key;
    const keywordLength = keyword.length;
    const tabulaRecta = cipherSpec.tabula;
    const textUpper = resultText.toUpperCase();
    const keywordUpper = keyword.toUpperCase();

    let keywordIndex = 0;
    const newResult = [];

    for (let i = 0; i < textUpper.length; i++) {
      const char = textUpper[i];
      if (alphabet.includes(char)) {
        const rowLetter = keywordUpper[keywordIndex % keywordLength];
        const rowAlphabet = tabulaRecta[rowLetter];

        const charIndex = alphabet.indexOf(char);
        const cipherChar = rowAlphabet[charIndex];

        newResult.push(cipherChar);

        keywordIndex++;
      } else {
        newResult.push(char);
      }
    }

    resultText = newResult.join("");
  });

  return resultText;
}
