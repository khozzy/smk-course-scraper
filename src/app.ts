import type { CourseData } from "./course";
import { SmkService } from "./smk.service";
import { GSheetService } from "./gsheet.service";
import { fetchCoursesFromSmk } from "./gwt_wtf";
import { log } from "./log";

const url = process.env.SMK_URL as string;
const username = process.env.SMK_USERNAME as string;
const password = process.env.SMK_PASSWORD as string;

const smkService = new SmkService(url, username, password, true);
const gsheet = new GSheetService(process.env.GOOGLE_SPREADSHEET_ID!);

const updateGoogleSheet = async (courses: CourseData[]) => {
  await gsheet.update(courses);
};

async function main() {
  try {
    await smkService.init();
    const sessionId = await smkService.obtainSessionId();
    if (!sessionId) {
      throw new Error("Failed to obtain session ID");
    }
    const courses = await fetchCoursesFromSmk(sessionId);
    if (courses.length > 0) {
      await updateGoogleSheet(courses);
    } else {
      log("No courses found");
    }
  } catch (error) {
    console.error(error);
  }
}

main().catch(console.error);
