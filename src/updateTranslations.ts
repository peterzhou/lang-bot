import { Request, Response } from "express";
import { Base64 } from "js-base64";
import { Application } from "probot";

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

  console.log(owner);
  console.log(installation);
  console.log(repo);
  console.log(filepath);
  const realFilepath = "langapi/translations.json";
  console.log(JSON.stringify(json));

  const githubAPI = await app.auth(installation);

  const originalTranslationsFile = await githubAPI.repos.getContents({
    owner: owner,
    repo: repo,
    path: realFilepath,
    ref: branch
  });

  // TODO: Credential problem????
  const response = await githubAPI.repos.createOrUpdateFile({
    owner: owner,
    repo: repo,
    path: realFilepath,
    message: "[Lang] Updated translations.json",
    content: Base64.encode(JSON.stringify(json)),
    sha: originalTranslationsFile.data.sha,
    branch: branch
  });

  res.send("OK");
}
