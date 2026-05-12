import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  alphaCoverage,
  buildMascotPrompt,
  buildNegativePrompt,
  createTokenImageSet
} from "../packages/image-pipeline/src/index";

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
  tempDirs = [];
});

describe("image pipeline", () => {
  it("builds mascot prompts without asking the model to render text", () => {
    const prompt = buildMascotPrompt({
      tokenName: "Wizard Frog",
      ticker: "WIZ",
      concept: "wizard frog",
      narrative: "Fantasy"
    });
    expect(prompt).toContain("cartoon memecoin mascot sticker");
    expect(prompt).toContain("no text");
    expect(buildNegativePrompt()).toContain("watermark");
  });

  it("creates raw mascot and app-rendered card variants locally", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "meme-image-root-"));
    const publicRoot = await mkdtemp(
      path.join(os.tmpdir(), "meme-image-public-")
    );
    tempDirs.push(root, publicRoot);
    const paths = await createTokenImageSet({
      rootDir: root,
      publicRoot,
      input: {
        tokenId: "test-token",
        version: 1,
        tokenName: "Test Token",
        ticker: "TEST",
        narrative: "AI Mascots",
        founder: "founder"
      }
    });
    await expect(alphaCoverage(paths.mascotRawPath)).resolves.toMatchObject({
      transparentRatio: expect.any(Number),
      opaqueRatio: expect.any(Number)
    });
    expect(paths.squareUrl).toContain("/generated/tokens/test-token/v1/");
  });
});
