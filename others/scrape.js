import puppeteer from 'puppeteer-core';
import fs from 'fs';

const xpath = (selector) => `::-p-xpath(${selector})`;

const wait = (s) => new Promise(resolve => setTimeout(resolve, s * 1000));

const log = (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
};

const parseRowToObjects = (row) => {
    const getTextContent = (element) => (element ? element.textContent.trim() : '');

    // Select all cells (`div` within `td`) in the row
    const cells = row.querySelectorAll('td > div');

    // Map the cells to a meaningful object structure
    return {
        numerKursu: getTextContent(cells[0]), // Numer kursu
        tytulKursu: getTextContent(cells[1]), // Tytuł kursu
        dataRozpoczecia: getTextContent(cells[2]), // Data rozpoczęcia
        dataZakonczenia: getTextContent(cells[3]), // Data zakończenia
        miejscowosc: getTextContent(cells[4]), // Miejscowość
        nrZgloszenia: getTextContent(cells[5]), // Nr zgłoszenia
        dziedzinaSpecjalizacji: getTextContent(cells[6]), // Dziedzina specjalizacji
        dataZgloszenia: getTextContent(cells[7]), // Data zgłoszenia
        statusZgloszenia: getTextContent(cells[8]), // Status zgłoszenia
        powodOdrzuceniaZgloszenia: getTextContent(cells[9]), // Powód odrzucenia zgłoszenia
        nrZaswiadczenia: getTextContent(cells[10]), // Nr zaświadczenia o ukończeniu kursu
    };
}


(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        defaultViewport: null,
        // defaultViewport: { width: 1920, height: 1080 },
        headless: true,
        // devtools: false,
        args: [
            '--lang=pl-PL',
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--disable-setuid-sandbox",
            "--no-sandbox"
        ]
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'pl-PL'
    });

    // Go to the login page
    log('Going to the login page');
    await page.goto('https://smk.ezdrowie.gov.pl/index.html?locale=pl', {
        waitUntil: 'networkidle0',
    });

    // Click "Zaloguj się"
    log('Clicking "Zaloguj się"');
    await page.waitForSelector('text=Zaloguj się', { visible: true });
    await Promise.all([
        page.click('text=Zaloguj się'),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Fill in the username and password
    log('Filling in the username and password');
    await page.locator('#username').fill('angelina.pajchert@gmail.com');
    await page.locator('#password').fill('gavviq-hikSiq-cibbo5');

    // Click the login submit button
    log('Clicking the login submit button');
    await Promise.all([
        page.locator('button[name="login"]').click(),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Wait for and click "Przejdź do poprzedniej wersji" button
    log('Clicking "Przejdź do poprzedniej wersji" button');
    await Promise.all([
        page.click('text=Przejdź do poprzedniej wersji'),
        page.waitForNavigation({ waitUntil: 'load' })
    ]);

    // Wait for and click "Kursy" button
    log('Clicking "Kursy" button');
    await page.locator('button.E3[id="1003"]').click();

    // Wait for and click "Wybierz" button
    log('Clicking "Wybierz" button');
    await Promise.all([
        page.locator('button.JBB.COC[id="1030"]').click(),
        // page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    // Fill in "Ortopedia" in the search field
    const courseInputxPath = '//*[@id="1001"]';
    log('Filling in "Ortopedia" in the search field');
    await page.locator(xpath(courseInputxPath)).fill('Ortopedia');

    // Click the "Szukaj" (Search) button
    await wait(1);
    log('Clicking "Szukaj" button');
    await page.click('text=Szukaj', { visible: true });

    // Wait for the table to load and find the row with Kod = 0720
    await page.waitForSelector('table[role="grid"] tbody tr[role="row"]');

    // Click the button in the last column of the row where Kod = 0720
    const courseRowXPath = '//table[@role="grid"]//tr[td[2]/div[text()="0720"]]';
    log('Clicking the button in the last column of the row where Kod = 0720');
    await page.locator(xpath(courseRowXPath + '//button')).click();

    // Select the given course
    await wait(1);
    log('Clicking "Wybierz" button');
    await page.click('text=Wybierz', { visible: true });

    // Wait for and click "Zgłoszenia na kursy" button
    log('Clicking "Zgłoszenia na kursy" button');
    await page.locator('button.E3[id="508"]').click();

    await wait(1);

    let lastPageReached = false;
    const data = [];

    while (!lastPageReached) {
        log('Scraping page');
        const rows = await page.$$(`table[role="grid"] tbody tr[role="row"]`);
        const parsedRows = await Promise.all(rows.map(async (row) => {
            return await row.evaluate(parseRowToObjects);
        }));

        data.push(...parsedRows);

        // Check if the "Następna strona" button is disabled
        const nextButton = await page.$('button[aria-label="Następna strona"]');
        const isDisabled = await nextButton.evaluate(button => button.hasAttribute('disabled'));

        if (isDisabled) {
            lastPageReached = true;
        } else {
            // Click next page if not disabled
            log('Clicking "Następna strona" button');
            await nextButton.click();
            await wait(1); // Wait for the new page to load
        }
    }

    await browser.close();
    await fs.promises.writeFile('course_data.json', JSON.stringify(data, null, 2));

    log(`Finished scraping ${data.length} rows`);
})();
