import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { JWT } from "google-auth-library";
import type { CourseData } from "./course";
import { log } from "./log";

export class GSheetService {
  private readonly doc: GoogleSpreadsheet;

  constructor(private readonly spreadsheetId: string) {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
  }

  public async update(courses: CourseData[]) {
    const headerRow = [
      "Numer kursu",
      "Tytuł kursu",
      "Data rozpoczęcia",
      "Data zakończenia",
      "Miejscowość",
      "Kurs EU",
      "Czy kurs rozpoczęty?",
      "Program specjalizacji",
      "Płatność",
      "Status kursu",
      "Status terminu",
      "Formularz zgłoszenia",
    ];
    await this.doc.loadInfo();
    log(`Updating Google Sheet ${this.doc.title} (${this.doc.spreadsheetId})`);
    await this.doc.updateProperties({
      title: `SMK Kursy Ortopedia (${new Date().toLocaleString()})`,
    });
    const sheet = this.doc.sheetsByIndex[0];

    await sheet.clear();
    await sheet.setHeaderRow(headerRow);

    const rows = courses.map((course) => [
      course.numerKursu,
      course.tytulKursu,
      course.dataRozpoczecia,
      course.dataZakonczenia,
      course.miejscowosc,
      course.kursEU,
      course.czyKursRozpoczety,
      course.programSpecjalizacji,
      course.platnosc,
      course.statusKursu,
      course.statusTerminu,
      course.formularzZgloszenia,
    ]);

    await sheet.addRows(rows);
    log(`Added ${rows.length} rows to the sheet`);
    await sheet.resize({
      columnCount: headerRow.length,
      rowCount: rows.length + 1,
    });

    await this.formatHeaderRow(sheet);
  }

  private async formatHeaderRow(sheet: GoogleSpreadsheetWorksheet) {
    await sheet.loadCells("A1:L1");
    for (let col = 0; col < 12; col++) {
      const cell = sheet.getCell(0, col);
      cell.textFormat = { bold: true };
    }

    await sheet.saveUpdatedCells();
  }
}
