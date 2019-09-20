import * as bodyParser from "body-parser";
import { Application } from "probot";
import { handlePullRequestOpen } from "./handlePullRequestOpen";
import { linkInstallationUserToLangProject } from "./installation";
import { updateTranslations } from "./updateTranslations";

export = (app: Application) => {
  /*
   * GITHUB WEBHOOKS
   */
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

  app.on("installation.created", linkInstallationUserToLangProject);

  /*
   * LANG WEBHOOKS
   */
  app.route("/lang").use(bodyParser.json({ limit: "50mb" }));

  app
    .route("/lang")
    .use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

  app.route("/lang").post("/", async (req, res) => {
    await updateTranslations(req, res, app);
  });

  app.route("/lang").get("/", (req, res) => {
    res.send("Hello");
  });
};

const dummyFunction = () => {
  return true;
};
