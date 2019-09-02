import { Application } from "probot";
import { handlePullRequestOpen } from "./handlePullRequestOpen";

export = (app: Application) => {
  app.on("issues.opened", async context => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!"
    });
    console.log(context);
    await context.github.issues.createComment(issueComment);
  });

  app.on("pull_request.opened", handlePullRequestOpen);

  app.on("pull_request.closed", async context => {
    await dummyFunction();
  });
};

const dummyFunction = () => {
  return true;
};
