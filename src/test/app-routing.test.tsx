import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";

async function renderAt(path: string) {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  // Resolve the initial route before mounting, as the app's own start-up does.
  await router.load();
  // The root route renders the full <html> document shell, which React cannot
  // mount inside a <div>. Mount into the document itself, like the real app.
  render(<RouterProvider router={router} />, { container: document });
  return { get body() { return document.body; } };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Assert only that the router mounts and paints, never page content:
// routes are rewritten as the app is built and this must keep passing.
describe("App routing", () => {
  it("renders the index route", async () => {
    const { body } = await renderAt("/");

    await waitFor(() => expect(body.textContent?.trim()).not.toBe(""), { timeout: 5000 });
  });

  it("renders the not-found route", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { body } = await renderAt("/this-route-does-not-exist");

    await waitFor(() => expect(body.textContent?.trim()).not.toBe(""), { timeout: 5000 });
  });
});
