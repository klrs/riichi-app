import { test, expect, type Page } from "@playwright/test";
import type { TileDetectionResponse } from "../src/types/api";
import { mockFullHandResponse, mockDetectionResponse } from "./mocks/handlers";

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

async function navigateToHandConfirmation(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Camera" }).click();
  await expect(page.getByRole("button", { name: "Capture" })).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Capture" }).click();
  await expect(page.getByTestId("hand-grid")).toBeVisible({ timeout: 5000 });
}

test.describe("Hand Confirmation", () => {
  test.describe("with full 14-tile detection", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockFullHandResponse);
    });

    test("displays all 14 detected tiles in the hand grid", async ({ page }) => {
      await navigateToHandConfirmation(page);

      const grid = page.getByTestId("hand-grid");
      const slots = grid.locator(".hand-slot");
      await expect(slots).toHaveCount(14);

      // All slots should have tiles (no empty "?" slots)
      const emptySlots = grid.locator(".hand-slot--empty");
      await expect(emptySlots).toHaveCount(0);
    });

    test("confirm button is enabled when all 14 slots are filled", async ({ page }) => {
      await navigateToHandConfirmation(page);

      await expect(page.getByRole("button", { name: "Confirm Hand" })).toBeEnabled();
    });

    test("confirm button transitions to scoring screen", async ({ page }) => {
      await navigateToHandConfirmation(page);

      await page.getByRole("button", { name: "Confirm Hand" }).click();

      // Should show the scoring screen, not idle
      await expect(page.getByText("Win type")).toBeVisible();
      await expect(page.getByRole("button", { name: "Calculate" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    });

    test("can select a slot and replace its tile", async ({ page }) => {
      await navigateToHandConfirmation(page);

      // Click first slot to select it
      const grid = page.getByTestId("hand-grid");
      const firstSlot = grid.locator(".hand-slot").first();
      await firstSlot.click();
      await expect(firstSlot).toHaveClass(/hand-slot--selected/);

      // Pick a different tile from the picker
      await page.getByRole("button", { name: "Pick 9m" }).click();

      // Slot should now show the new tile
      await expect(firstSlot.getByAltText("9m")).toBeVisible();
    });

    test("shows clear button when a filled slot is selected", async ({ page }) => {
      await navigateToHandConfirmation(page);

      // Select a filled slot
      const grid = page.getByTestId("hand-grid");
      await grid.locator(".hand-slot").first().click();

      // Clear button should appear
      await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
    });

    test("can drag a tile to reorder by shifting tiles", async ({ page }) => {
      await navigateToHandConfirmation(page);

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

    test("clearing a tile makes the slot empty", async ({ page }) => {
      await navigateToHandConfirmation(page);

      // Select first slot and clear it
      const grid = page.getByTestId("hand-grid");
      const firstSlot = grid.locator(".hand-slot").first();
      await firstSlot.click();
      await page.getByRole("button", { name: "Clear" }).click();

      // Slot should now be empty
      await expect(firstSlot).toHaveClass(/hand-slot--empty/);

      // Confirm should be disabled now
      await expect(page.getByRole("button", { name: "Confirm Hand" })).toBeDisabled();
    });
  });

  test.describe("with partial detection (3 tiles)", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockDetectionResponse);
    });

    test("displays 3 filled slots and 11 empty slots", async ({ page }) => {
      await navigateToHandConfirmation(page);

      const grid = page.getByTestId("hand-grid");
      const slots = grid.locator(".hand-slot");
      await expect(slots).toHaveCount(14);

      const emptySlots = grid.locator(".hand-slot--empty");
      await expect(emptySlots).toHaveCount(11);
    });

    test("first empty slot is auto-selected on mount", async ({ page }) => {
      await navigateToHandConfirmation(page);

      const grid = page.getByTestId("hand-grid");
      // Slots 0-2 are filled (3 tiles), slot 3 should be selected (first empty)
      const fourthSlot = grid.locator(".hand-slot").nth(3);
      await expect(fourthSlot).toHaveClass(/hand-slot--selected/);
    });

    test("picking a tile fills the empty slot and advances to next empty", async ({ page }) => {
      await navigateToHandConfirmation(page);

      const grid = page.getByTestId("hand-grid");

      // Slot 3 is selected (first empty). Pick a tile.
      await page.getByRole("button", { name: "Pick 1z" }).click();

      // Slot 3 should now be filled
      const fourthSlot = grid.locator(".hand-slot").nth(3);
      await expect(fourthSlot).not.toHaveClass(/hand-slot--empty/);

      // Slot 4 should now be selected (next empty)
      const fifthSlot = grid.locator(".hand-slot").nth(4);
      await expect(fifthSlot).toHaveClass(/hand-slot--selected/);
    });

    test("does not show clear button when empty slot is selected", async ({ page }) => {
      await navigateToHandConfirmation(page);

      // First empty slot (index 3) is auto-selected
      await expect(page.getByRole("button", { name: "Clear" })).not.toBeVisible();
    });

    test("confirm button is disabled with partial hand", async ({ page }) => {
      await navigateToHandConfirmation(page);

      await expect(page.getByRole("button", { name: "Confirm Hand" })).toBeDisabled();
    });
  });

  test.describe("tile picker", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockDetectionResponse);
    });

    test("displays all four suit sections", async ({ page }) => {
      await navigateToHandConfirmation(page);

      const picker = page.getByTestId("tile-picker");
      await expect(picker.getByText("Man")).toBeVisible();
      await expect(picker.getByText("Pin")).toBeVisible();
      await expect(picker.getByText("Sou")).toBeVisible();
      await expect(picker.getByText("Honors")).toBeVisible();
    });

    test("has 37 pickable tiles (10+10+10+7)", async ({ page }) => {
      await navigateToHandConfirmation(page);

      const picker = page.getByTestId("tile-picker");
      const buttons = picker.locator(".tile-picker-btn");
      await expect(buttons).toHaveCount(37);
    });
  });

  test.describe("retake flow", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockDetectionResponse);
    });

    test("retake button returns to idle state", async ({ page }) => {
      await navigateToHandConfirmation(page);

      await page.getByRole("button", { name: "Retake" }).click();

      await expect(page.getByRole("button", { name: "Open Camera" })).toBeVisible();
      await expect(page.getByTestId("hand-grid")).not.toBeVisible();
    });
  });
});
