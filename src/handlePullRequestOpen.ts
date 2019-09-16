import { PullsListFilesResponseItem } from "@octokit/rest";
import { extractTrFromFiles } from "langapi";
import { Context } from "probot";
import { File } from "./types";
import Webhooks = require("@octokit/webhooks");

export async function handlePullRequestOpen(
  context: Context<Webhooks.WebhookPayloadPullRequest>
) {
  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;
  const pullRequestNumber = context.payload.pull_request.number;

  console.log("WHAAAA");

  const fileList = await context.github.pulls.listFiles({
    owner: owner,
    repo: repo,
    pull_number: pullRequestNumber
  });

  if (fileList.status !== 200) {
    console.log("ERROR");
    return;
  }

  // const config = await getConfig(owner, repo, context);

  console.log("GOT CONFIG");

  const sourceFileList: File[] = await Promise.all(
    fileList.data
      .filter(file => {
        return file.status !== "deleted";
      })
      .map(async file => {
        const sourceCode = await getFileContents(file, owner, repo, context);
        return {
          filename: file.filename,
          sourceCode: sourceCode
        };
      })
  );

  console.log("SOURCE FILES");

  const trCalls = extractTrFromFiles(sourceFileList);
  console.log("DONE");
  console.log(trCalls);

  // TODO Figure out how to do coverage

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
