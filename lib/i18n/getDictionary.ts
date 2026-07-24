import en from "./dictionaries/en.json";
import ar from "./dictionaries/ar.json";
import { Locale } from "./config";

const dictionaries = { en, ar };

export type Dictionary = typeof en;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
