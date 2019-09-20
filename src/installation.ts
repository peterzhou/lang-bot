import Webhooks from "@octokit/webhooks";
import { Context } from "probot";
import { LINK_GITHUB_INSTALLATION_TO_PROJECT } from "./graphql/mutations";
import { createClient, getConfig } from "./utils";

export async function linkInstallationUserToLangProject(
  context: Context<Webhooks.WebhookPayloadInstallation>
) {
  const owner = context.payload.sender.login;
  const installationId = context.payload.installation.id;
  const repositories = context.payload.repositories;
  const config = await getConfig(owner, repositories[0].name, context);
  const apolloClient = createClient();
  apolloClient.mutate({
    mutation: LINK_GITHUB_INSTALLATION_TO_PROJECT,
    variables: {
      gitHubUserId: context.payload.sender.id,
      owner: owner,
      repo: repositories[0].name,
      installation: installationId,
      filepath: config.src + "/langapi/translations.json"
    }
  });
}
