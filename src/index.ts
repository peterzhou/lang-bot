import { Application } from "probot";

export = (app: Application) => {
  app.on("issues.opened", async context => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!"
    });
    await context.github.issues.createComment(issueComment);
  });

  app.on("pull_request.opened", async context => {
    const pullRequests = await context.github.pulls.get({
      owner: "peterlzhou"
    })
};
