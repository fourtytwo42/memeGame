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
  if (key.includes("community") || key.includes("crew") || key.includes("cozy"))
    return "/assets/game/narratives/community.png";
  return "/assets/game/narratives/absurdist.png";
}

const defaultTokenArt = "/assets/game/tokens/default-token-mascot.png";

export function tokenVariantImage(slugOrName: string | null | undefined) {
  const key = (slugOrName ?? "").toLowerCase();
  if (key.includes("frog")) return "/assets/game/tokens/frog-token-card.png";
  if (key.includes("dog")) return "/assets/game/tokens/dog-token-card.png";
  if (key.includes("cat")) return "/assets/game/tokens/cat-token-card.png";
  if (key.includes("ai")) return "/assets/game/tokens/ai-token-card.png";
  if (key.includes("wizard"))
    return "/assets/game/tokens/wizard-token-card.png";
  if (key.includes("food") || key.includes("snack"))
    return "/assets/game/tokens/snack-token-card.png";
  if (key.includes("retro")) return "/assets/game/tokens/retro-token-card.png";
  if (key.includes("cozy")) return "/assets/game/tokens/cozy-token-card.png";
  if (key.includes("space")) return "/assets/game/tokens/space-token-card.png";
  if (key.includes("cult")) return "/assets/game/tokens/cult-token-card.png";
  if (key.includes("robot")) return "/assets/game/tokens/robot-token-card.png";
  return "/assets/game/tokens/absurd-token-card.png";
}

export function tokenImage(
  token:
    | {
        cardImageUrl?: string | null;
        name?: string | null;
        narrative?: string | null;
        placeholderImageUrl?: string | null;
        ticker?: string | null;
      }
    | null
    | undefined
) {
  const selected = token?.cardImageUrl ?? token?.placeholderImageUrl;
  if (selected && selected !== defaultTokenArt) return selected;

  return tokenVariantImage(token?.narrative ?? token?.name ?? token?.ticker);
}
