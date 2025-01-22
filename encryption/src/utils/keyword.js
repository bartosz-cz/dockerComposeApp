export default function keywordGen(length = 8) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let keyword = "";
  for (let i = 0; i < length; i++) {
    keyword += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  console.log(keyword);
  return keyword;
}
