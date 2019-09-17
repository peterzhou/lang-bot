import { PullsListFilesResponseItem } from "@octokit/rest";
import gql from "graphql-tag";
import { extractTrFromFiles, TranslateFunctionCall } from "langapi";
import { Context } from "probot";
import { File } from "./types";
import {
  createClientWithToken,
  getConfig,
  getValidTranslationRequests
} from "./utils";
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

  const config = await getConfig(owner, repo, context);

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

  await sendTrCallsToServer(trCalls, config.apiKey);
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
  return content;
}

async function sendTrCallsToServer(
  translateCalls: TranslateFunctionCall[],
  config: any
) {
  console.log("SENDING");
  const apolloClient = createClientWithToken(config.apiKey);

  const { batchedTranslationRequests } = getValidTranslationRequests(
    translateCalls,
    config
  );

  const payload = await apolloClient.mutate({
    mutation: REQUEST_TRANSLATION,
    variables: {
      batchTranslationRequests: batchedTranslationRequests,
      apiKey: config.apiKey
    }
  });

  console.log("FUCK");
}

const REQUEST_TRANSLATION = gql`
  mutation RequestTranslation(
    $requests: [BatchTranslationRequestInput!]!
    $apiKey: String!
  ) {
    requestTranslations(batchTranslationRequests: $requests, apiKey: $apiKey) {
      error {
        message
        code
      }
      jobId
      translationTexts {
        originalText
        originalLang
        newLang
      }
    }
  }
`;
