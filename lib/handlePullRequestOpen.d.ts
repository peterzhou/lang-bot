import { Context } from "probot";
import Webhooks = require("@octokit/webhooks");
export declare function handlePullRequestOpen(context: Context<Webhooks.WebhookPayloadPullRequest>): Promise<void>;
