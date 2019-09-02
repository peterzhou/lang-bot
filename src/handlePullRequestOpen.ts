import https from "https";
import { Context } from "probot";
import Webhooks = require("@octokit/webhooks");

export async function handlePullRequestOpen(
  context: Context<Webhooks.WebhookPayloadPullRequest>
) {
  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;
  const pullRequestNumber = context.payload.pull_request.number;

  const fileList = await context.github.pulls.listFiles({
    owner: owner,
    repo: repo,
    pull_number: pullRequestNumber
  });

  if (fileList.status !== 200) {
    return;
  }

  console.log(fileList.data);

  const sourceCodeList = await Promise.all(
    fileList.data
      .filter(file => {
        return file.status !== "deleted";
      })
      .map(async file => {
        return getFileContents(file.raw_url);
      })
  );

  // Do something with raw files
  sourceCodeList.forEach(sourceCode => {
    console.log(sourceCode);
  });

  await context.github.repos.createOrUpdateFile({
    owner: owner,
    repo: repo,
    path: "./src/langapi/translations.json",
    content: "Hello world!",
    message: "New translations",
    author: {
      name: "Lang",
      email: "support@langapi.co"
    }
  });
  return;
}

async function getFileContents(url: string) {
  return new Promise((resolve, reject) => {
    let sourceCode = "";
    const request = https.get(url, response => {
      response.on("data", chunk => {
        sourceCode += chunk;
      });
      response.on("end", () => {
        resolve(sourceCode);
      });
    });
  });
}
