import { Request, Response } from "express";
import { Base64 } from "js-base64";
import { Application } from "probot";
import { GitHubAPI } from "probot/lib/github";
import { createYamlFile } from "./createFileUtils";
import { ConfigFile, FILE_TYPES } from "./types";
import { getConfig } from "./utils";

export async function updateTranslations(
  req: Request,
  res: Response,
  app: Application
) {
  const {
    owner,
    installation,
    repo,
    filepath,
    json,
    sender,
    branch
  } = req.body;

  const realFilepath = "langapi/translations.json";

  const githubAPI = await app.auth(installation);

  const originalTranslationsFile = await githubAPI.repos.getContents({
    owner: owner,
    repo: repo,
    path: realFilepath,
    ref: branch
  });

  const config = await getConfig(owner, repo, githubAPI);
  if (config.filetype === FILE_TYPES.YAML) {
    await updateTranslationsForYaml(
      json,
      owner,
      repo,
      filepath,
      branch,
      config,
      githubAPI
    );
  } else {
    const response = await githubAPI.repos.createOrUpdateFile({
      owner: owner,
      repo: repo,
      path: realFilepath,
      message: "[Lang] Updated translations",
      content: Base64.encode(JSON.stringify(json)),
      sha: originalTranslationsFile.data.sha,
      branch: branch
    });
  }

  res.send("OK");
}

export async function updateTranslationsForYaml(
  translations: any,
  owner: string,
  repo: string,
  path: string,
  branch: string,
  config: ConfigFile,
  githubAPI: GitHubAPI
) {
  const originalTranslationsFile = await githubAPI.repos.getContents({
    owner,
    repo,
    path,
    ref: branch
  });

  await Promise.all(
    config.targetLanguages.map(async targetLanguage => {
      const targetTranslationFile = await githubAPI.repos.getContents({
        owner,
        repo,
        path: `${targetLanguage}.yaml`,
        ref: branch
      });

      const sha =
        targetTranslationFile &&
        targetTranslationFile.data &&
        targetTranslationFile.data.sha
          ? targetTranslationFile.data.sha
          : undefined;

      const newYamlFile = createYamlFile(
        originalFileContents,
        targetLanguage,
        translations
      );

      const response = await githubAPI.repos.createOrUpdateFile({
        owner,
        repo,
        path: `${targetLanguage}.yaml`,
        message: "[Lang] Updated translations",
        content: Base64.encode(newYamlFile),
        sha,
        branch
      });

      return "";
    })
  );

  return;
}
