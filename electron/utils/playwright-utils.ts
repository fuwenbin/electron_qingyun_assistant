
export async function waitForRandomTimeout(page: any, base: number, range: number = 5000) {
  const randomTime = Math.round(Math.random() * range) + base;
  await page.waitForTimeout(randomTime);
}