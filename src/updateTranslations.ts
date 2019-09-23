import { Request, Response } from "express";
import { Application } from "probot";

export async function updateTranslations(
  req: Request,
  res: Response,
  app: Application
) {
  const { owner, installationId, repo, filepath, json } = req.body;

  console.log(installationId);

  const githubAPI = await app.auth(installationId);

  const originalTranslationsFile = await githubAPI.repos.getContents({
    owner: owner,
    repo: repo,
    path: filepath
  });

  // TODO: Credential problem????
  const response = await githubAPI.repos.createOrUpdateFile({
    owner: owner,
    repo: repo,
    path: filepath,
    message: "[Lang] Updated translations.json",
    content: Base64.encode(json),
    sha: originalTranslationsFile.data.sha,
    branch: "master"
  });

  res.send("OK");
}
