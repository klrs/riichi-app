import { test, expect, type Page } from "@playwright/test";
import type { TileDetectionResponse, HandEvaluationResponse } from "../src/types/api";
import {
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

async function navigateToScoring(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Camera" }).click();
  await expect(page.getByRole("button", { name: "Capture" })).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Capture" }).click();
  await expect(page.getByTestId("hand-grid")).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Confirm Hand" }).click();
  await expect(page.getByText("Win type")).toBeVisible({ timeout: 5000 });
}

test.describe("Hand Scoring", () => {
  test.describe("scoring screen layout", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockWinningHandResponse);
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
    });

    test("displays 14 tiles in the scoring grid", async ({ page }) => {
      await navigateToScoring(page);

      const tiles = page.locator(".scoring-tile");
      await expect(tiles).toHaveCount(14);
    });

    test("shows option controls", async ({ page }) => {
      await navigateToScoring(page);

      await expect(page.getByText("Win type")).toBeVisible();
      await expect(page.getByText("Seat Wind")).toBeVisible();
      await expect(page.getByText("Round Wind")).toBeVisible();
      await expect(page.getByText("Riichi", { exact: true })).toBeVisible();
    });

    test("shows Ron and Tsumo buttons with Ron active by default", async ({ page }) => {
      await navigateToScoring(page);

      const ronBtn = page.getByRole("button", { name: "Ron" });
      const tsumoBtn = page.getByRole("button", { name: "Tsumo" });
      await expect(ronBtn).toHaveClass(/toggle-btn--active/);
      await expect(tsumoBtn).not.toHaveClass(/toggle-btn--active/);
    });

    test("shows East as default seat and round wind", async ({ page }) => {
      await navigateToScoring(page);

      // Both wind sections should have East active
      const optionGroups = page.locator(".option-group");

      // Seat wind group (index 1)
      const seatWindGroup = optionGroups.nth(1);
      await expect(seatWindGroup.getByRole("button", { name: "East" })).toHaveClass(
        /toggle-btn--active/,
      );

      // Round wind group (index 2)
      const roundWindGroup = optionGroups.nth(2);
      await expect(roundWindGroup.getByRole("button", { name: "East" })).toHaveClass(
        /toggle-btn--active/,
      );
    });

    test("calculate button is disabled when no win tile selected", async ({ page }) => {
      await navigateToScoring(page);

      await expect(page.getByRole("button", { name: "Calculate" })).toBeDisabled();
    });

    test("shows Back and Calculate buttons", async ({ page }) => {
      await navigateToScoring(page);

      await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Calculate" })).toBeVisible();
    });
  });

  test.describe("win tile selection", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockWinningHandResponse);
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
    });

    test("clicking a tile marks it as win tile", async ({ page }) => {
      await navigateToScoring(page);

      const tiles = page.locator(".scoring-tile");
      await tiles.nth(13).click();

      await expect(tiles.nth(13)).toHaveClass(/scoring-tile--win/);
      await expect(page.getByText("Win tile: 9m")).toBeVisible();
    });

    test("calculate button is enabled after selecting a win tile", async ({ page }) => {
      await navigateToScoring(page);

      await page.locator(".scoring-tile").nth(0).click();

      await expect(page.getByRole("button", { name: "Calculate" })).toBeEnabled();
    });

    test("selecting a different tile moves the win marker", async ({ page }) => {
      await navigateToScoring(page);

      const tiles = page.locator(".scoring-tile");
      await tiles.nth(0).click();
      await expect(tiles.nth(0)).toHaveClass(/scoring-tile--win/);

      await tiles.nth(5).click();
      await expect(tiles.nth(0)).not.toHaveClass(/scoring-tile--win/);
      await expect(tiles.nth(5)).toHaveClass(/scoring-tile--win/);
    });
  });

  test.describe("option toggles", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockWinningHandResponse);
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
    });

    test("can toggle between Ron and Tsumo", async ({ page }) => {
      await navigateToScoring(page);

      const tsumoBtn = page.getByRole("button", { name: "Tsumo" });
      const ronBtn = page.getByRole("button", { name: "Ron" });

      await tsumoBtn.click();
      await expect(tsumoBtn).toHaveClass(/toggle-btn--active/);
      await expect(ronBtn).not.toHaveClass(/toggle-btn--active/);

      await ronBtn.click();
      await expect(ronBtn).toHaveClass(/toggle-btn--active/);
      await expect(tsumoBtn).not.toHaveClass(/toggle-btn--active/);
    });

    test("can toggle Riichi on and off", async ({ page }) => {
      await navigateToScoring(page);

      const riichiGroup = page.locator(".option-group").nth(3);
      const yesBtn = riichiGroup.getByRole("button", { name: "Yes" });
      const noBtn = riichiGroup.getByRole("button", { name: "No" });

      await expect(noBtn).toHaveClass(/toggle-btn--active/);

      await yesBtn.click();
      await expect(yesBtn).toHaveClass(/toggle-btn--active/);
      await expect(noBtn).not.toHaveClass(/toggle-btn--active/);
    });

    test("can change seat wind", async ({ page }) => {
      await navigateToScoring(page);

      const seatWindGroup = page.locator(".option-group").nth(1);
      const southBtn = seatWindGroup.getByRole("button", { name: "South" });

      await southBtn.click();
      await expect(southBtn).toHaveClass(/toggle-btn--active/);
      await expect(seatWindGroup.getByRole("button", { name: "East" })).not.toHaveClass(
        /toggle-btn--active/,
      );
    });
  });

  test.describe("calculation results", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockWinningHandResponse);
    });

    test("shows han, fu, and yaku after successful calculation", async ({ page }) => {
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
      await navigateToScoring(page);

      // Select win tile and calculate
      await page.locator(".scoring-tile").nth(13).click();
      await page.getByRole("button", { name: "Calculate" }).click();

      // Check results
      await expect(page.getByText("2 Han")).toBeVisible();
      await expect(page.getByText("40 Fu")).toBeVisible();
      await expect(page.getByText("3,900")).toBeVisible();
      await expect(page.getByText("Yakuhai (wind of place)")).toBeVisible();
      await expect(page.getByText("Yakuhai (wind of round)")).toBeVisible();
    });

    test("shows error when hand has no yaku", async ({ page }) => {
      await mockEvaluateApi(page, mockEvaluateNoYakuResponse);
      await navigateToScoring(page);

      await page.locator(".scoring-tile").nth(13).click();
      await page.getByRole("button", { name: "Calculate" }).click();

      await expect(page.getByText("no_yaku")).toBeVisible();
    });

    test("shows error when API request fails", async ({ page }) => {
      await page.route("**/api/hand/evaluate", async (route) => {
        return route.fulfill({
          status: 500,
          contentType: "text/plain",
          body: "Internal server error",
        });
      });
      await navigateToScoring(page);

      await page.locator(".scoring-tile").nth(13).click();
      await page.getByRole("button", { name: "Calculate" }).click();

      await expect(page.getByText(/Evaluation failed/)).toBeVisible();
    });

    test("shows pts with ron format for ron win", async ({ page }) => {
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
      await navigateToScoring(page);

      await page.locator(".scoring-tile").nth(13).click();
      await page.getByRole("button", { name: "Calculate" }).click();

      await expect(page.getByText("3,900 pts")).toBeVisible();
    });

    test("shows tsumo cost format with non-dealer split", async ({ page }) => {
      const tsumoResponse: HandEvaluationResponse = {
        han: 3,
        fu: 30,
        yaku: [
          { name: "Menzen Tsumo", han_value: 1, is_yakuman: false },
          { name: "Yakuhai (wind of place)", han_value: 1, is_yakuman: false },
          { name: "Yakuhai (wind of round)", han_value: 1, is_yakuman: false },
        ],
        cost: { main: 2000, additional: 1000 },
        error: null,
      };
      await mockEvaluateApi(page, tsumoResponse);
      await navigateToScoring(page);

      // Switch to tsumo
      await page.getByRole("button", { name: "Tsumo" }).click();
      await page.locator(".scoring-tile").nth(13).click();
      await page.getByRole("button", { name: "Calculate" }).click();

      // Non-dealer tsumo: additional / main
      await expect(page.getByText("1,000 / 2,000 pts")).toBeVisible();
    });

    test("shows tsumo cost with all format for dealer", async ({ page }) => {
      const dealerTsumoResponse: HandEvaluationResponse = {
        han: 3,
        fu: 30,
        yaku: [
          { name: "Menzen Tsumo", han_value: 1, is_yakuman: false },
          { name: "Yakuhai (wind of place)", han_value: 1, is_yakuman: false },
          { name: "Yakuhai (wind of round)", han_value: 1, is_yakuman: false },
        ],
        cost: { main: 2000, additional: 2000 },
        error: null,
      };
      await mockEvaluateApi(page, dealerTsumoResponse);
      await navigateToScoring(page);

      // Switch to tsumo (seat wind is already east = dealer)
      await page.getByRole("button", { name: "Tsumo" }).click();
      await page.locator(".scoring-tile").nth(13).click();
      await page.getByRole("button", { name: "Calculate" }).click();

      // Dealer tsumo: all pay equally
      await expect(page.getByText("2,000 pts all")).toBeVisible();
    });
  });

  test.describe("navigation", () => {
    test.beforeEach(async ({ page }) => {
      await mockCamera(page);
      await mockDetectionApi(page, mockWinningHandResponse);
      await mockEvaluateApi(page, mockEvaluateSuccessResponse);
    });

    test("back button returns to idle", async ({ page }) => {
      await navigateToScoring(page);

      await page.getByRole("button", { name: "Back" }).click();

      await expect(page.getByRole("button", { name: "Open Camera" })).toBeVisible();
      await expect(page.getByText("Win type")).not.toBeVisible();
    });

    test("can calculate, then go back and start over", async ({ page }) => {
      await navigateToScoring(page);

      // Calculate
      await page.locator(".scoring-tile").nth(13).click();
      await page.getByRole("button", { name: "Calculate" }).click();
      await expect(page.getByText("2 Han")).toBeVisible();

      // Go back
      await page.getByRole("button", { name: "Back" }).click();
      await expect(page.getByRole("button", { name: "Open Camera" })).toBeVisible();

      // Start over
      await page.getByRole("button", { name: "Open Camera" }).click();
      await expect(page.locator("video.camera-preview")).toBeVisible();
    });
  });
});
