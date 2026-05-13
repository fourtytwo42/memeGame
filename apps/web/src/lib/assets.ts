export function narrativeImage(slugOrName: string | null | undefined) {
  const key = (slugOrName ?? "").toLowerCase();
  if (key.includes("ai")) return "/assets/game/narratives/ai-agents.png";
  if (key.includes("frog")) return "/assets/game/narratives/frogs.png";
  if (key.includes("dog")) return "/assets/game/narratives/dogs.png";
  if (key.includes("cat")) return "/assets/game/narratives/cats.png";
  if (key.includes("food") || key.includes("snack"))
    return "/assets/game/narratives/food.png";
  if (key.includes("space") || key.includes("robot"))
    return "/assets/game/narratives/robots.png";
  if (key.includes("wizard")) return "/assets/game/narratives/wizard.png";
  if (key.includes("retro"))
    return "/assets/game/narratives/retro-internet.png";
  if (key.includes("community") || key.includes("crew"))
    return "/assets/game/narratives/community.png";
  return "/assets/game/narratives/absurdist.png";
}

export function tokenImage(
  token:
    | {
        cardImageUrl?: string | null;
        placeholderImageUrl?: string | null;
      }
    | null
    | undefined
) {
  return (
    token?.cardImageUrl ??
    token?.placeholderImageUrl ??
    "/assets/game/tokens/default-token-mascot.png"
  );
}
