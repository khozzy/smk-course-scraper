import type { CourseData } from "./course";
import { SmkService } from "./smk.service";
import { GSheetService } from "./gsheet.service";
import { retryAsync } from "ts-retry";

const url = process.env.SMK_URL as string;
const username = process.env.SMK_USERNAME as string;
const password = process.env.SMK_PASSWORD as string;

const smkService = new SmkService(url, username, password);
const gsheet = new GSheetService(process.env.GOOGLE_SPREADSHEET_ID!);

const scrapeCourses = async (): Promise<CourseData[]> => {
  await smkService.init();
  return await smkService.scrape();
};

const updateGoogleSheet = async (courses: CourseData[]) => {
  await gsheet.update(courses);
};

async function main() {
  try {
    const courses = await retryAsync(scrapeCourses, {
      maxTry: 3,
      delay: 1000,
    });
    await updateGoogleSheet(courses);
  } catch (error) {
    console.error(error);
  }
}

main().catch(console.error);
