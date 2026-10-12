import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
test("새 SW는 승인 전 대기하며 편집 중 취소하면 입력 보존", async ({
  page,
  context,
}) => {
  let version = 1;
  const folder = resolve("dist");
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url || "/", "http://localhost").pathname;
      const file = resolve(folder, "." + (path === "/" ? "/index.html" : path));
      if (!file.startsWith(folder)) {
        res.writeHead(403).end();
        return;
      }
      let body = await readFile(file);
      if (path === "/sw.js")
        body = Buffer.concat([body, Buffer.from("\n// test build " + version)]);
      const mime: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".webmanifest": "application/manifest+json",
      };
      res
        .writeHead(200, {
          "Content-Type": mime[extname(file)] || "application/octet-stream",
          "Cache-Control": "no-cache",
        })
        .end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("server");
  try {
    await page.goto("http://127.0.0.1:" + address.port);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    await page.getByRole("button", { name: "+ 지출 추가" }).click();
    await page.getByLabel("금액 (원)").fill("1234");
    await context.setOffline(true);
    version = 2;
    await context.setOffline(false);
    await expect(
      page
        .getByRole("dialog")
        .getByRole("button", { name: "업데이트", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("금액 (원)")).toHaveValue("1234");
    page.once("dialog", (d) => d.dismiss());
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "업데이트", exact: true })
      .click();
    await expect(page.getByLabel("금액 (원)")).toHaveValue("1234");
    page.once("dialog", (d) => d.accept());
    const refreshed = page.waitForEvent("load");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "업데이트", exact: true })
      .click();
    await refreshed;
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("아직 지출 기록이 없어요")).toBeVisible();
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
});
