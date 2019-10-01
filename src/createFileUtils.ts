import yaml from "js-yaml";
import LangClient from "langapi-client";

export function createYamlFile(
  originalFileContents: string,
  targetLanguage: string,
  translations: any
) {
  const originalFileJson = yaml.safeLoad(originalFileContents);

  const langClient = LangClient("none", translations);

  const translatedFileJson = traverseAndReplaceJSON(
    originalFileJson,
    "none",
    targetLanguage,
    langClient
  );

  return yaml.safeDump(translatedFileJson);
}

function traverseAndReplaceJSON(
  originalTranslations: any,
  currentKey: string,
  targetLanguage: string,
  translations: any
): any {
  if (originalTranslations && typeof originalTranslations === "object") {
    const subJsons = Object.keys(originalTranslations).map(entry => {
      const subJson: any = {};
      const currentSubJson = traverseAndReplaceJSON(
        (originalTranslations as any)[entry],
        entry,
        targetLanguage,
        translations
      );
      subJson[entry] = currentSubJson;
      return subJson;
    });

    return Object.assign({}, ...subJsons);
  } else if (typeof originalTranslations === "string") {
    // TODO: Might return a human and a machine translation
    return todoLookup();
  }

  return originalTranslations;
}
