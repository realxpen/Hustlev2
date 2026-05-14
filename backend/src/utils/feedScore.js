export function calculateRankingScore({
  likeCount = 0,
  commentCount = 0,
  repostCount = 0,
  saveCount = 0,
}) {
  return likeCount * 1 + commentCount * 2 + repostCount * 3 + saveCount * 1.5;
}
