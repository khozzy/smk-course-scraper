import { launch, Browser, Page } from "puppeteer-core";
import { log } from "./log";
import type { CourseData } from "./course";

export class SmkService {
  private browser: Browser | null = null;

  constructor(
    readonly url: string,
    readonly username: string,
    readonly password: string,
    readonly headless: boolean = true
  ) {}

  public async init() {
    this.browser = await launch({
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      defaultViewport: this.headless ? null : { width: 1920, height: 1080 },
      headless: this.headless,
      devtools: false,
      args: [
        "--remote-debugging-port=9222",
        "--remote-debugging-address=0.0.0.0",
      ],
    });
  }

  async obtainSessionId(): Promise<string | undefined> {
    const page = await this.browser!.newPage();

    await page.setExtraHTTPHeaders({
      "Accept-Language": "pl-PL",
    });

    // Go to the login page
    log("Going to the login page");
    await page.goto(`${this.url}/index.html?locale=pl`, {
      waitUntil: "networkidle0",
    });

    // Click "Zaloguj się"
    log('Clicking "Zaloguj się"');
    await page.waitForSelector("text=Zaloguj się", { visible: true });
    await Promise.all([
      page.click("text=Zaloguj się"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Fill in the username and password
    log("Filling in the username and password");
    await page.locator("#username").fill(this.username);
    await page.locator("#password").fill(this.password);

    // Click the login submit button
    log("Clicking the login submit button");
    await Promise.all([
      page.locator('button[name="login"]').click(),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Wait for and click "Przejdź do poprzedniej wersji" button
    log('Clicking "Przejdź do poprzedniej wersji" button');
    await Promise.all([
      page.click("text=Przejdź do poprzedniej wersji"),
      page.waitForNavigation({ waitUntil: "load" }),
    ]);

    // Wait for and click "Kursy" button
    log('Clicking "Kursy" button');
    await page.locator('button.E3[id="1003"]').click();

    await this.wait(3);

    const cookies = await page.cookies();
    const sessionId = cookies.find((cookie) => cookie.name === "JSESSIONID");
    log(`Session ID: ${sessionId?.value}`);

    if (this.browser) {
      await this.browser.close();
    }

    return sessionId?.value;
  }

  async scrape(): Promise<CourseData[]> {
    const page = await this.browser!.newPage();

    await page.setExtraHTTPHeaders({
      "Accept-Language": "pl-PL",
    });

    // Go to the login page
    log("Going to the login page");
    await page.goto(`${this.url}/index.html?locale=pl`, {
      waitUntil: "networkidle0",
    });

    // Click "Zaloguj się"
    log('Clicking "Zaloguj się"');
    await page.waitForSelector("text=Zaloguj się", { visible: true });
    await Promise.all([
      page.click("text=Zaloguj się"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Fill in the username and password
    log("Filling in the username and password");
    await page.locator("#username").fill(this.username);
    await page.locator("#password").fill(this.password);

    // Click the login submit button
    log("Clicking the login submit button");
    await Promise.all([
      page.locator('button[name="login"]').click(),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Wait for and click "Przejdź do poprzedniej wersji" button
    log('Clicking "Przejdź do poprzedniej wersji" button');
    await Promise.all([
      page.click("text=Przejdź do poprzedniej wersji"),
      page.waitForNavigation({ waitUntil: "load" }),
    ]);

    // Wait for and click "Kursy" button
    log('Clicking "Kursy" button');
    await page.locator('button.E3[id="1003"]').click();

    await this.prayForCourseList2(page);
    await this.wait(3);

    // ----------------------------------------------------

    await this.wait(60);
    // log('Clicking "Szukaj" button');
    // await page.click("text=Szukaj");

    // console.log("Waiting for search results");
    // await page.waitForNavigation({ waitUntil: "networkidle0" });
    // console.log("Search results loaded");

    // await this.wait(60);
    // ----------------------------------------------------

    // Wait for and click "Zgłoszenia na kursy" button
    log('Clicking "Zgłoszenia na kursy" button');
    await page.locator('button.E3[id="508"]').click();

    await this.wait(1);

    let lastPageReached = false;
    const data: CourseData[] = [];

    while (!lastPageReached) {
      log("Scraping page");
      const rows = await page.$$(`table[role="grid"] tbody tr[role="row"]`);
      const parsedRows = await Promise.all(
        rows.map(async (row) => {
          return await row.evaluate(this.parseRowToObjects);
        })
      );

      data.push(...parsedRows);

      // Check if the "Następna strona" button is disabled
      const nextButton = await page.$('button[aria-label="Następna strona"]');
      const isDisabled = await nextButton?.evaluate((button) =>
        button.hasAttribute("disabled")
      );

      if (isDisabled) {
        lastPageReached = true;
      } else {
        // Click next page if not disabled
        log('Clicking "Następna strona" button');
        await nextButton?.click();
        await this.wait(2);
      }
    }

    await this.browser?.close();

    log(`Finished scraping ${data.length} rows`);
    return data;
  }

  private async prayForCourseList(page: Page) {
    // Wait for and click "Wybierz" button
    log('Clicking "Wybierz" button');
    await page.waitForSelector('button.JBB.COC[id="1030"]', { visible: true });
    await page.locator('button.JBB.COC[id="1030"]').click();

    // Fill in "Ortopedia" in the search field
    log('Filling in "Ortopedia" in the search field');
    await page.waitForSelector('input[id="1002"]', { visible: true });
    await page.type('input[id="1002"]', "0720");

    // Click the "Szukaj" (Search) button
    await this.wait(1);
    log('Clicking "Szukaj" button');
    await page.click("text=Szukaj");

    // Wait for the table to load and find the row with Kod = 0720
    await page.waitForSelector('table[role="grid"] tbody tr[role="row"]');

    // Click the button in the last column of the row where Kod = 0720
    log("Clicking the button in the last column of the row where Kod = 0720");
    const rows = await page.$$('table[role="grid"] tr');
    for (const row of rows) {
      const textContent = await row.evaluate((el) => el.innerText);
      if (textContent.includes("0720")) {
        console.log("Clicking row");
        await row.click();

        // Print row contents for debugging
        const rowText = await row.evaluate((el) => {
          const cells = Array.from(el.querySelectorAll("td"));
          return cells.map((cell) => cell.textContent?.trim()).join(" | ");
        });
        console.log("Row contents:", rowText);

        await this.wait(2);
        console.log("Looking for 'Wybierz' button");
        const button = await row.$("button");
        if (button) {
          console.log("Found 'Wybierz' button");
          await button.click();
          break;
        }
      }
    }

    // await page.waitForSelector("text=Wybierz", { visible: true });
    // await page.click("text=Wybierz");
  }

  private async prayForCourseList2(page: Page) {
    // Wait for and click "Wybierz" button
    log('Clicking "Wybierz" button');
    await page.waitForSelector('button.JBB.COC[id="1030"]', { visible: true });
    await page.locator('button.JBB.COC[id="1030"]').click();

    // Fill in "Ortopedia" in the search field
    log('Filling in "Ortopedia" in the search field');
    await page.waitForSelector('input[id="1002"]', { visible: true });
    await page.type('input[id="1002"]', "0720");

    // Click the "Szukaj" (Search) button
    await this.wait(1);
    log('Clicking "Szukaj" button');
    await page.click("text=Szukaj");

    // Wait for the table to load and find the row with Kod = 0720
    const rowSelector = 'tr.JCB[role="row"]';
    await page.waitForSelector(rowSelector);
    await page.click(rowSelector);

    await this.wait(1);
    await page.waitForSelector(`button[id="1500"]`, {
      visible: true,
    });
    await page.click(`button[id="1500"]`);
  }

  private parseRowToObjects = (row: Element): CourseData => {
    const getTextContent = (element: Element | null): string =>
      element ? element.textContent?.trim() || "" : "";

    const cells = row.querySelectorAll("td > div");

    return {
      numerKursu: getTextContent(cells[0]),
      tytulKursu: getTextContent(cells[1]),
      dataRozpoczecia: getTextContent(cells[2]),
      dataZakonczenia: getTextContent(cells[3]),
      miejscowosc: getTextContent(cells[4]),
      nrZgloszenia: getTextContent(cells[5]),
      dziedzinaSpecjalizacji: getTextContent(cells[6]),
      dataZgloszenia: getTextContent(cells[7]),
      statusZgloszenia: getTextContent(cells[8]),
      powodOdrzuceniaZgloszenia: getTextContent(cells[9]),
      nrZaswiadczenia: getTextContent(cells[10]),
    };
  };

  private wait(s: number) {
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
  }
}
