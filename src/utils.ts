import Webhooks from "@octokit/webhooks";
import { Context } from "probot";

export async function getConfig(
  owner: string,
  repo: string,
  context: Context<Webhooks.WebhookPayloadPullRequest>
) {
  const configFile = await context.github.repos.getContents({
    owner: owner,
    repo: repo,
    path: "langapiconfig.json",
    ref: context.payload.pull_request.head.ref
  });

  const content = Buffer.from(configFile.data.content, "base64").toString();
  const config = JSON.parse(content);

  // TODO: Figure out how to throw errors
  if (!config.apiKey) {
    return {};
  }

  return config;
}
