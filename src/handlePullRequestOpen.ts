import { PullsListFilesResponseItem } from "@octokit/rest";
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

  console.log("FILE LIST");

  if (fileList.status !== 200) {
    console.log("ERROR");
    return;
  }
  console.log("FILE LIST DATA");
  console.log(fileList.data);

  const sourceCodeList = await Promise.all(
    fileList.data
      .filter(file => {
        return file.status !== "deleted";
      })
      .map(async file => {
        return await getFileContents(file, owner, repo, context);
      })
  );

  sourceCodeList.forEach(sourceCode => {
    console.log(sourceCode);
  });

  // await context.github.repos.createOrUpdateFile({
  //   owner: owner,
  //   repo: repo,
  //   path: "./src/langapi/translations.json",
  //   content: "Hello world!",
  //   message: "New translations",
  //   author: {
  //     name: "Lang",
  //     email: "support@langapi.co"
  //   }
  // });
  return;
}

function isMergingIntoMaster(
  context: Context<Webhooks.WebhookPayloadPullRequest>
) {
  return (
    context.payload.pull_request.head.ref !== "master" &&
    context.payload.pull_request.base.ref === "master"
  );
}

async function getFileContents(
  file: PullsListFilesResponseItem,
  owner: string,
  repo: string,
  context: Context<Webhooks.WebhookPayloadPullRequest>
) {
  const rawFile = await context.github.repos.getContents({
    owner: owner,
    repo: repo,
    path: file.filename,
    ref: context.payload.pull_request.head.ref
  });

  const content = Buffer.from(rawFile.data.content, "base64").toString();
  console.log(content);
  return content;
  // return new Promise((resolve, reject) => {
  //   let sourceCode = "";
  //   const request = https.get(url, response => {
  //     response.on("data", chunk => {
  //       sourceCode += chunk;
  //     });
  //     response.on("end", () => {
  //       resolve(sourceCode);
  //     });
  //   });
  // });
}
