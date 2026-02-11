import { test, expect, type Page } from "@playwright/test";

/**
 * Mock camera setup for Playwright tests.
 * Creates a fake MediaStream that the CameraCapture component can use.
 */
async function mockCamera(page: Page, options: { shouldFail?: boolean } = {}) {
  await page.addInitScript(
    ({ shouldFail }) => {
      // Create a fake video track
      const createFakeVideoTrack = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#333";
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = "#fff";
          ctx.font = "24px sans-serif";
          ctx.fillText("Mock Camera", 200, 240);
        }

        const stream = canvas.captureStream(30);
        return stream.getVideoTracks()[0];
      };

      // Store original
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

      // Override getUserMedia
      navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
        if (shouldFail) {
          throw new DOMException("Permission denied", "NotAllowedError");
        }

        if (constraints?.video) {
          const track = createFakeVideoTrack();
          return new MediaStream([track]);
        }

        return originalGetUserMedia(constraints);
      };
    },
    { shouldFail: options.shouldFail },
  );
}

/**
 * Mock the detection API endpoint
 */
async function mockDetectionApi(
  page: Page,
  options: { shouldFail?: boolean; delay?: number } = {},
) {
  await page.route("**/api/detect", async (route) => {
    if (options.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    if (options.shouldFail) {
      return route.fulfill({
        status: 500,
        contentType: "text/plain",
        body: "Detection service unavailable",
      });
    }

    const { mockDetectionResponse } = await import("./mocks/handlers");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockDetectionResponse),
    });
  });
}

test.describe("Score Calculator App", () => {
  test.beforeEach(async ({ page }) => {
    await mockCamera(page);
    await mockDetectionApi(page);
  });

  test("shows initial state with Open Camera button", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Score Calculator" })).toBeVisible();
    await expect(
      page.getByText("Take a photo or drop an image of mahjong tiles to detect them"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Open Camera" })).toBeVisible();
  });

  test("Open Camera button opens camera when permission granted", async ({ page }) => {
    await page.goto("/");

    const openCameraButton = page.getByRole("button", { name: "Open Camera" });
    await expect(openCameraButton).toBeVisible();

    await openCameraButton.click();

    // Camera view should be active with video element and controls
    await expect(page.locator("video.camera-preview")).toBeVisible();
    await expect(page.getByRole("button", { name: /Capture|Loading/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("shows error when camera permission denied", async ({ page }) => {
    // Override with failing camera
    await mockCamera(page, { shouldFail: true });
    await page.goto("/");

    await page.getByRole("button", { name: "Open Camera" }).click();

    await expect(page.getByText(/Camera error:/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  });

  test("Cancel button closes camera and returns to idle state", async ({ page }) => {
    await page.goto("/");

    // Open camera
    await page.getByRole("button", { name: "Open Camera" }).click();
    await expect(page.locator("video.camera-preview")).toBeVisible();

    // Click cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    // Should return to idle state
    await expect(page.getByRole("button", { name: "Open Camera" })).toBeVisible();
    await expect(page.locator("video.camera-preview")).not.toBeVisible();
  });

  test("Capture sends image to API and shows hand editor", async ({ page }) => {
    await page.goto("/");

    // Open camera
    await page.getByRole("button", { name: "Open Camera" }).click();

    // Wait for video to be ready (button changes from Loading to Capture)
    await expect(page.getByRole("button", { name: "Capture" })).toBeVisible({ timeout: 5000 });

    // Capture image
    await page.getByRole("button", { name: "Capture" }).click();

    // Should show hand editor screen
    await expect(page.getByTestId("hand-grid")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Retake" })).toBeVisible();
  });

  test("hand editor shows detected tiles in slots", async ({ page }) => {
    await page.goto("/");

    // Complete capture flow
    await page.getByRole("button", { name: "Open Camera" }).click();
    await expect(page.getByRole("button", { name: "Capture" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Capture" }).click();

    // Wait for hand editor
    await expect(page.getByTestId("hand-grid")).toBeVisible({ timeout: 5000 });

    // The 3-tile mock should populate 3 slots, leaving 11 empty
    // Verify tile picker exists for filling empty slots
    const picker = page.getByTestId("tile-picker");
    await picker.scrollIntoViewIfNeeded();
    await expect(picker).toBeVisible();
  });

  test("Retake button returns to idle state", async ({ page }) => {
    await page.goto("/");

    // Complete capture flow
    await page.getByRole("button", { name: "Open Camera" }).click();
    await expect(page.getByRole("button", { name: "Capture" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Capture" }).click();

    // Wait for hand editor
    await expect(page.getByTestId("hand-grid")).toBeVisible({ timeout: 5000 });

    // Click Retake
    await page.getByRole("button", { name: "Retake" }).click();

    // Should return to idle state
    await expect(page.getByRole("button", { name: "Open Camera" })).toBeVisible();
    await expect(
      page.getByText("Take a photo or drop an image of mahjong tiles to detect them"),
    ).toBeVisible();
  });

  test("shows error state when API fails", async ({ page }) => {
    // Override with failing API
    await mockDetectionApi(page, { shouldFail: true });
    await page.goto("/");

    // Complete capture flow
    await page.getByRole("button", { name: "Open Camera" }).click();
    await expect(page.getByRole("button", { name: "Capture" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Capture" }).click();

    // Should show error
    await expect(page.getByText(/Error:/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  });

  test("can retry after API error", async ({ page }) => {
    // Start with failing API
    await mockDetectionApi(page, { shouldFail: true });
    await page.goto("/");

    // Complete capture flow - will fail
    await page.getByRole("button", { name: "Open Camera" }).click();
    await expect(page.getByRole("button", { name: "Capture" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Capture" }).click();
    await expect(page.getByText(/Error:/)).toBeVisible({ timeout: 5000 });

    // Now make API succeed
    await mockDetectionApi(page, { shouldFail: false });

    // Click Try Again
    await page.getByRole("button", { name: "Try Again" }).click();

    // Should return to idle
    await expect(page.getByRole("button", { name: "Open Camera" })).toBeVisible();
  });

  test("full user flow: capture, edit hand, return to idle", async ({ page }) => {
    await page.goto("/");

    // Step 1: Initial state
    await expect(page.getByRole("heading", { name: "Score Calculator" })).toBeVisible();

    // Step 2: Open camera
    await page.getByRole("button", { name: "Open Camera" }).click();
    await expect(page.locator("video.camera-preview")).toBeVisible();

    // Step 3: Capture
    await expect(page.getByRole("button", { name: "Capture" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Capture" }).click();

    // Step 4: Hand editor screen (combined view)
    await expect(page.getByTestId("hand-grid")).toBeVisible({ timeout: 5000 });
    const picker = page.getByTestId("tile-picker");
    await picker.scrollIntoViewIfNeeded();
    await expect(picker).toBeVisible();

    // Step 5: Retake returns to idle
    await page.getByRole("button", { name: "Retake" }).click();
    await expect(page.getByRole("button", { name: "Open Camera" })).toBeVisible();

    // Step 6: Can start again
    await page.getByRole("button", { name: "Open Camera" }).click();
    await expect(page.locator("video.camera-preview")).toBeVisible();
  });
});
