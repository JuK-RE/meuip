import type { Locale } from "../config";
import en from "./en";
import es from "./es";
import fr from "./fr";
import pt, { type Dict } from "./pt";

export type { Dict };

const dictionaries: Record<Locale, Dict> = { pt, en, es, fr };

export const getDict = (locale: Locale): Dict => dictionaries[locale];
