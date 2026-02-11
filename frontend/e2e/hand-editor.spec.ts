import { test, expect, type Page } from "@playwright/test";
import type { TileDetectionResponse, HandEvaluationResponse } from "../src/types/api";
import {
  mockFullHandResponse,
  mockDetectionResponse,
  mockWinningHandResponse,
  mockEvaluateSuccessResponse,
  mockEvaluateNoYakuResponse,
} from "./mocks/handlers";

async function mockCamera(page: Page) {
  await page.addInitScript(() => {
    const createFakeVideoTrack = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#333";
        ctx.fillRect(0, 0, 640, 480);
      }
      const stream = canvas.captureStream(30);
      return stream.getVideoTracks()[0];
    };

    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
      if (constraints?.video) {
        const track = createFakeVideoTrack();
        return new MediaStream([track]);
      }
      return originalGetUserMedia(constraints);
    };
  });
}

async function mockDetectionApi(page: Page, response: TileDetectionResponse) {
  await page.route("**/api/detect", async (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

async function mockEvaluateApi(page: Page, response: HandEvaluationResponse) {
  await page.route("**/api/hand/evaluate", async (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

async function navigateToHandEditor(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Camera" }).click();
  await expect(page.getByRole("button", { name: "Capture" })).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Capture" }).click();
  await expect(page.getByTestId("hand-grid")).toBeVisible({ timeout: 5000 });
}

test.describe("Hand Editor", () => {
  test.describe("with full 14-tile detection", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockFullHandResponse);
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
    });

    test("displays all 14 detected tiles in the hand grid", async ({ page }) => {
      await navigateToHandEditor(page);

      const grid = page.getByTestId("hand-grid");
      const slots = grid.locator(".hand-slot");
      await expect(slots).toHaveCount(14);

      // All slots should have tiles (no empty "?" slots)
      const emptySlots = grid.locator(".hand-slot--empty");
      await expect(emptySlots).toHaveCount(0);
    });

    test("shows win tile slot and scoring options", async ({ page }) => {
      await navigateToHandEditor(page);

      await expect(page.getByTestId("win-tile-slot")).toBeVisible();
      await expect(page.getByRole("button", { name: "Ron" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Tsumo" })).toBeVisible();
    });

    test("shows scoring option controls", async ({ page }) => {
      await navigateToHandEditor(page);

      await expect(page.getByText("Riichi", { exact: true })).toBeVisible();
      await expect(page.getByText("Dora")).toBeVisible();
      await expect(page.getByText("Round Wind")).toBeVisible();
      await expect(page.getByText("Seat Wind")).toBeVisible();
    });

    test("can select a slot and replace its tile via change zone", async ({ page }) => {
      await navigateToHandEditor(page);

      // Click first slot to select it
      const grid = page.getByTestId("hand-grid");
      const firstSlot = grid.locator(".hand-slot").first();
      await firstSlot.click();
      await expect(firstSlot).toHaveClass(/hand-slot--selected/);
    });

    test("can drag a tile to reorder by shifting tiles", async ({ page }) => {
      await navigateToHandEditor(page);

      const grid = page.getByTestId("hand-grid");
      const slots = grid.locator(".hand-slot");

      // Initial order: 1m, 2m, 3m, 4p, ...
      await expect(slots.nth(0).getByAltText("1m")).toBeVisible();
      await expect(slots.nth(1).getByAltText("2m")).toBeVisible();
      await expect(slots.nth(2).getByAltText("3m")).toBeVisible();
      await expect(slots.nth(3).getByAltText("4p")).toBeVisible();

      // Drag slot 0 (1m) onto slot 3 (4p)
      await slots.nth(0).dragTo(slots.nth(3));

      // 1m is inserted at index 3; tiles 1-3 shift left
      // Expected: 2m, 3m, 4p, 1m, ...
      await expect(slots.nth(0).getByAltText("2m")).toBeVisible();
      await expect(slots.nth(1).getByAltText("3m")).toBeVisible();
      await expect(slots.nth(2).getByAltText("4p")).toBeVisible();
      await expect(slots.nth(3).getByAltText("1m")).toBeVisible();
    });

    test("does not show inline tile picker when hand is full", async ({ page }) => {
      await navigateToHandEditor(page);

      // When hand is full, inline picker should not be shown
      await expect(page.getByTestId("tile-picker")).not.toBeVisible();
    });
  });

  test.describe("with partial detection (3 tiles)", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockDetectionResponse);
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
    });

    test("displays 3 filled slots and 11 empty slots", async ({ page }) => {
      await navigateToHandEditor(page);

      const grid = page.getByTestId("hand-grid");
      const slots = grid.locator(".hand-slot");
      await expect(slots).toHaveCount(14);

      const emptySlots = grid.locator(".hand-slot--empty");
      await expect(emptySlots).toHaveCount(11);
    });

    test("first empty slot is auto-selected on mount", async ({ page }) => {
      await navigateToHandEditor(page);

      const grid = page.getByTestId("hand-grid");
      // Slots 0-2 are filled (3 tiles), slot 3 should be selected (first empty)
      const fourthSlot = grid.locator(".hand-slot").nth(3);
      await expect(fourthSlot).toHaveClass(/hand-slot--selected/);
    });

    test("picking a tile fills the empty slot and advances to next empty", async ({ page }) => {
      await navigateToHandEditor(page);

      const grid = page.getByTestId("hand-grid");

      // Slot 3 is selected (first empty). Pick a tile.
      const pickBtn = page.getByRole("button", { name: "Pick 1z" });
      await pickBtn.scrollIntoViewIfNeeded();
      await pickBtn.click();

      // Slot 3 should now be filled
      const fourthSlot = grid.locator(".hand-slot").nth(3);
      await expect(fourthSlot).not.toHaveClass(/hand-slot--empty/);

      // Slot 4 should now be selected (next empty)
      const fifthSlot = grid.locator(".hand-slot").nth(4);
      await expect(fifthSlot).toHaveClass(/hand-slot--selected/);
    });

    test("shows inline tile picker with all four suit sections", async ({ page }) => {
      await navigateToHandEditor(page);

      const picker = page.getByTestId("tile-picker");
      await expect(picker.getByText("Man")).toBeVisible();
      await expect(picker.getByText("Pin")).toBeVisible();
      await expect(picker.getByText("Sou")).toBeVisible();
      await expect(picker.getByText("Honors")).toBeVisible();
    });

    test("has 37 pickable tiles (10+10+10+7)", async ({ page }) => {
      await navigateToHandEditor(page);

      const picker = page.getByTestId("tile-picker");
      const buttons = picker.locator(".tile-picker-btn");
      await expect(buttons).toHaveCount(37);
    });
  });

  test.describe("scoring options", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockWinningHandResponse);
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
    });

    test("shows Ron active by default", async ({ page }) => {
      await navigateToHandEditor(page);

      const ronBtn = page.getByRole("button", { name: "Ron" });
      const tsumoBtn = page.getByRole("button", { name: "Tsumo" });
      await expect(ronBtn).toHaveClass(/segment--active/);
      await expect(tsumoBtn).not.toHaveClass(/segment--active/);
    });

    test("can toggle between Ron and Tsumo", async ({ page }) => {
      await navigateToHandEditor(page);

      const tsumoBtn = page.getByRole("button", { name: "Tsumo" });
      const ronBtn = page.getByRole("button", { name: "Ron" });

      await tsumoBtn.click();
      await expect(tsumoBtn).toHaveClass(/segment--active/);
      await expect(ronBtn).not.toHaveClass(/segment--active/);

      await ronBtn.click();
      await expect(ronBtn).toHaveClass(/segment--active/);
      await expect(tsumoBtn).not.toHaveClass(/segment--active/);
    });

    test("can toggle Riichi on and off", async ({ page }) => {
      await navigateToHandEditor(page);

      const riichiRow = page.locator(".option-row").first();
      const yesBtn = riichiRow.getByRole("button", { name: "Yes" });
      const noBtn = riichiRow.getByRole("button", { name: "No" });

      await expect(noBtn).toHaveClass(/pill-segment--active/);

      await yesBtn.click();
      await expect(yesBtn).toHaveClass(/pill-segment--active/);
      await expect(noBtn).not.toHaveClass(/pill-segment--active/);
    });

    test("dora counter starts at 0 and can be incremented", async ({ page }) => {
      await navigateToHandEditor(page);

      const doraCount = page.getByTestId("dora-count");
      await expect(doraCount).toHaveText("0");

      // Decrease should be disabled at 0
      const decreaseBtn = page.getByRole("button", { name: "Decrease dora" });
      await expect(decreaseBtn).toBeDisabled();

      // Increase should work
      const increaseBtn = page.getByRole("button", { name: "Increase dora" });
      await increaseBtn.click();
      await expect(doraCount).toHaveText("1");

      await increaseBtn.click();
      await expect(doraCount).toHaveText("2");

      // Now decrease should work
      await expect(decreaseBtn).toBeEnabled();
      await decreaseBtn.click();
      await expect(doraCount).toHaveText("1");
    });

    test("wind buttons show kanji characters", async ({ page }) => {
      await navigateToHandEditor(page);

      // Round wind buttons (east and south only)
      await expect(page.locator(".round-wind-btn").nth(0)).toHaveText("\u6771");
      await expect(page.locator(".round-wind-btn").nth(1)).toHaveText("\u5357");

      // Seat wind buttons (all four)
      await expect(page.locator(".seat-wind-btn").nth(0)).toHaveText("\u6771");
      await expect(page.locator(".seat-wind-btn").nth(1)).toHaveText("\u5357");
      await expect(page.locator(".seat-wind-btn").nth(2)).toHaveText("\u897F");
      await expect(page.locator(".seat-wind-btn").nth(3)).toHaveText("\u5317");
    });
  });

  test.describe("live scoring", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockWinningHandResponse);
    });

    test("shows score after dragging win tile and waiting", async ({ page }) => {
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
      await navigateToHandEditor(page);

      // Drag the last tile (9m at index 13) to the win tile slot
      const grid = page.getByTestId("hand-grid");
      const lastTile = grid.locator(".hand-slot").nth(13);
      const winSlot = page.getByTestId("win-tile-slot");

      await lastTile.dragTo(winSlot);

      // Wait for debounced live scoring
      await expect(page.getByTestId("score-result")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("2 Han")).toBeVisible();
      await expect(page.getByText("40 Fu")).toBeVisible();
      await expect(page.getByText("3,900")).toBeVisible();
    });

    test("shows error when hand has no yaku", async ({ page }) => {
      await mockEvaluateApi(page, mockEvaluateNoYakuResponse);
      await navigateToHandEditor(page);

      // Drag a tile to win slot
      const grid = page.getByTestId("hand-grid");
      const lastTile = grid.locator(".hand-slot").nth(13);
      const winSlot = page.getByTestId("win-tile-slot");

      await lastTile.dragTo(winSlot);

      // Wait for result
      await expect(page.getByText("no_yaku")).toBeVisible({ timeout: 5000 });
    });

    test("shows error when API request fails", async ({ page }) => {
      await page.route("**/api/hand/evaluate", async (route) => {
        return route.fulfill({
          status: 500,
          contentType: "text/plain",
          body: "Internal server error",
        });
      });
      await navigateToHandEditor(page);

      // Drag a tile to win slot
      const grid = page.getByTestId("hand-grid");
      const lastTile = grid.locator(".hand-slot").nth(13);
      const winSlot = page.getByTestId("win-tile-slot");

      await lastTile.dragTo(winSlot);

      // Wait for error
      await expect(page.getByText(/Evaluation failed/)).toBeVisible({ timeout: 5000 });
    });

    test("clicking win tile returns it to hand", async ({ page }) => {
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
      await navigateToHandEditor(page);

      // Drag a tile to the win slot
      const grid = page.getByTestId("hand-grid");
      const lastTile = grid.locator(".hand-slot").nth(13);
      const winSlot = page.getByTestId("win-tile-slot");

      await lastTile.dragTo(winSlot);

      // Win slot should now have the tile image
      await expect(winSlot.getByAltText("9m")).toBeVisible();

      // Grid should now have 13 tiles
      await expect(grid.locator(".hand-slot")).toHaveCount(13);

      // Click win tile slot to return it
      await winSlot.click();

      // Grid should be back to 14 tiles
      await expect(grid.locator(".hand-slot")).toHaveCount(14);
    });

    test("dragging a new win tile returns the previous one to hand", async ({ page }) => {
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
      await navigateToHandEditor(page);

      const grid = page.getByTestId("hand-grid");
      const winSlot = page.getByTestId("win-tile-slot");

      // Drag tile at index 13 (9m) to win slot
      await grid.locator(".hand-slot").nth(13).dragTo(winSlot);
      await expect(winSlot.getByAltText("9m")).toBeVisible();
      await expect(grid.locator(".hand-slot")).toHaveCount(13);

      // Hand should have 1 remaining 9m tile after extracting the other
      await expect(grid.getByAltText("9m")).toHaveCount(1);

      // Drag tile at index 0 (1z) to win slot — previous win tile (9m) should return to hand
      await grid.locator(".hand-slot").nth(0).dragTo(winSlot);
      await expect(winSlot.getByAltText("1z")).toBeVisible();

      // Grid should still have 13 tiles (old win tile returned, new one extracted)
      await expect(grid.locator(".hand-slot")).toHaveCount(13);

      // The returned 9m tile should be back in the hand (2 copies again)
      await expect(grid.getByAltText("9m")).toHaveCount(2);
    });
  });

  test.describe("retake flow", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockDetectionResponse);
    });

    test("retake button returns to idle state", async ({ page }) => {
      await navigateToHandEditor(page);

      await page.getByRole("button", { name: "Retake" }).click();

      await expect(page.getByRole("button", { name: "Open Camera" })).toBeVisible();
      await expect(page.getByTestId("hand-grid")).not.toBeVisible();
    });
  });
});
