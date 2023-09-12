export const randomSort = (array: any[]) => {
  // 配列のコピーを作成
  const shuffledArray = array.slice();

  // Fisher-Yates シャッフルアルゴリズムを使用してランダムに並び替える
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return shuffledArray;
};
