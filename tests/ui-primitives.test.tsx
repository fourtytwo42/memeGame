import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Badge,
  Button,
  DegradedState,
  EmptyState,
  ErrorState,
  LoadingState,
  ModalFrame,
  Panel,
  StatBar,
  Tabs,
  ToastMessage
} from "../packages/ui/src/index";

describe("ui primitives", () => {
  it("renders durable shell primitives", () => {
    const html = renderToStaticMarkup(
      <Panel>
        <Button>Launch</Button>
        <Badge tone="good">Ready</Badge>
        <StatBar label="Growth" value={64} />
      </Panel>
    );

    expect(html).toContain("Launch");
    expect(html).toContain("Ready");
    expect(html).toContain("stat-growth");
  });

  it("renders state primitives with accessible roles", () => {
    const html = renderToStaticMarkup(
      <>
        <Tabs
          tabs={[{ id: "overview", label: "Overview", content: "Panel" }]}
        />
        <ModalFrame title="Confirm action">Check the risk.</ModalFrame>
        <ToastMessage title="Action complete" detail="Growth improved." />
        <LoadingState label="Loading launch" />
        <EmptyState title="No events" detail="Events appear after actions." />
        <ErrorState title="Could not load" detail="Try again." />
        <DegradedState service="Image worker" detail="Queue is paused." />
      </>
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('role="status"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Image worker");
  });
});
