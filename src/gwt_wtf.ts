import type { CourseData } from "./course";
import { log } from "./log";

interface MapaParametrow {
  idDziedzinyMedycyny: string;
  kodDziedziny: string;
  czyOtwartaRekrutacja: string;
  czyKursyArchiwalne: string;
  czyPrzyciskSzukaj: string;
  staryProgram: string;
  nowyProgram: string;
}

interface MapaUstawien {
  nadawca_z_filtrow: string;
  oczekiwany_tryb_Zwrotny: string;
}

interface RequestPayload {
  F: string;
  I: Array<{
    O: string;
    P: [{ R: string; C: number; T: string }, number, number];
  }>;
  O: Array<{
    O: string;
    R: string;
    C: number;
    T: string;
    P: {
      pielegniarki: null;
      polozne: null;
      login: null;
      dataDo: null;
      dataOd: null;
      grupaZawodowa: null;
      imie: null;
      nazwa: null;
      nazwaSpecjalizacji: null;
      nazwisko: null;
      programKsztalcenia: null;
      specjalizacja: null;
      status: null;
      typKsztalcenia: null;
      mapaParametrow: MapaParametrow;
      mapaUstawien: MapaUstawien;
      rodzajeModulowSzkolenSpecjalizacyjnychEnum: null;
    };
  }>;
}

async function fetchCourses(
  jsessionId: string,
  limit: number = 200
): Promise<Response> {
  const payload: RequestPayload = {
    F: "pl.relayonit.smk.web.gwt.model.AppRequestFactory",
    I: [
      {
        O: "5Y$dEuD4rw2hmj4MJ$ELEH2zqqI=",
        P: [
          {
            R: "1",
            C: 89,
            T: "A$jzotzRLbx1IfvBz48MUgiCzFs=",
          },
          limit,
          0,
        ],
      },
    ],
    O: [
      {
        O: "PERSIST",
        R: "1",
        C: 89,
        T: "A$jzotzRLbx1IfvBz48MUgiCzFs=",
        P: {
          pielegniarki: null,
          polozne: null,
          login: null,
          dataDo: null,
          dataOd: null,
          grupaZawodowa: null,
          imie: null,
          nazwa: null,
          nazwaSpecjalizacji: null,
          nazwisko: null,
          programKsztalcenia: null,
          specjalizacja: null,
          status: null,
          typKsztalcenia: null,
          mapaParametrow: {
            idDziedzinyMedycyny: "8905",
            kodDziedziny: "0720",
            czyOtwartaRekrutacja: "TAK",
            czyKursyArchiwalne: "false",
            czyPrzyciskSzukaj: "false",
            staryProgram: "true",
            nowyProgram: "false",
          },
          mapaUstawien: {
            nadawca_z_filtrow: "SLOWNIKIREJESTRY_DZIEDZINYMEDYCYNY",
            oczekiwany_tryb_Zwrotny: "SZCZEGOLY",
          },
          rodzajeModulowSzkolenSpecjalizacyjnychEnum: null,
        },
      },
    ],
  };

  return fetch("https://smk.ezdrowie.gov.pl/gwtRequest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Cookie: `wersja-smk=2.10.0; JSESSIONID=${jsessionId}`,
      Origin: "https://smk.ezdrowie.gov.pl",
      Referer: "https://smk.ezdrowie.gov.pl/index.html?locale=pl",
    },
    body: JSON.stringify(payload),
  });
}

function transformCourseData(response: any): CourseData[] {
  const courses = response.O || [];

  return courses
    .map((course: any) => {
      const map = course.P?.map || {};

      return {
        numerKursu: map["Numer kursu"] || "",
        tytulKursu: map["Tytuł kursu"] || "",
        dataRozpoczecia: map["Data rozpoczęcia"] || "",
        dataZakonczenia: map["Data zakończenia"] || "",
        miejscowosc: map["Miejscowość"] || "",
        kursEU: map["Kurs EU"] || "",
        czyKursRozpoczety: map["Czy kurs rozpoczęty?"] || "",
        programSpecjalizacji: map["Program specjalizacji"] || "",
        platnosc: map["Płatność"] || "",
        statusKursu: map["Status kursu"] || "",
        statusTerminu: map["Status terminu"] || "",
        formularzZgloszenia: map["Formularz zgłoszenia"] || "",
      };
    })
    .filter((course: any) =>
      Object.values(course).some((value: any) => value !== "")
    );
}

export const fetchCoursesFromSmk = async (
  jsessionId: string
): Promise<CourseData[]> => {
  log(`Fetching courses with JSESSIONID: ${jsessionId}`);
  const response = await fetchCourses(jsessionId);
  log(`GWT Response: ${response.status}`);
  const courseDataArray = transformCourseData(await response.json());
  log(`Fetched ${courseDataArray.length} courses`);
  return courseDataArray;
};
