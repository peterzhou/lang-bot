import { Request, Response } from "express";
import { Application } from "probot";

export async function updateTranslations(
  req: Request,
  res: Response,
  app: Application
) {
  const { owner, installationId, repo, path, json } = req.body;

  const githubAPI = await app.auth(installationId);

  const originalTranslationsFile = await githubAPI.repos.getContents({
    owner: owner,
    repo: repo,
    path: path
  });

  const response = await githubAPI.repos.createOrUpdateFile({
    owner: owner,
    repo: repo,
    path: path,
    message: "[Lang] Updated translations.json",
    content: Base64.encode(json),
    sha: originalTranslationsFile.data.sha,
    branch: "master"
  });

  res.send("OK");
}
