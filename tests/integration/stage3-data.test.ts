import { describe, expect, it } from "vitest";
import {
  prisma,
  findUserByIdentifier,
  roleForEmail
} from "../../packages/db/src/index";

describe("stage 3 data and auth foundation", () => {
  it("seeds active game data and required users", async () => {
    const [season, narratives, tokens, founder, admin] = await Promise.all([
      prisma.season.findFirst({ where: { status: "active" } }),
      prisma.narrativeMeta.count(),
      prisma.launchToken.count(),
      findUserByIdentifier("founder@example.com"),
      findUserByIdentifier("spiderman.1983@gmail.com")
    ]);

    expect(season?.slug).toBe("genesis-season");
    expect(narratives).toBeGreaterThanOrEqual(8);
    expect(tokens).toBeGreaterThanOrEqual(6);
    expect(founder?.passwordHash).toBeTruthy();
    expect(admin?.role).toBe("admin");
  });

  it("maps configured admin emails server-side", () => {
    expect(roleForEmail("spiderman.1983@gmail.com")).toBe("admin");
    expect(roleForEmail("founder@example.com")).toBe("user");
  });
});
