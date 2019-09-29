import gql from "graphql-tag";

export const REQUEST_TRANSLATIONS_FROM_GITHUB = gql`
  mutation RequestTranslationsFromGitHub(
    $input: RequestTranslationsFromGitHubInput!
  ) {
    requestTranslationsFromGitHub(input: $input)
  }
`;

export const LINK_GITHUB_INSTALLATION_TO_PROJECT = gql`
  mutation LinkGitHubInstallationToProject(
    $input: LinkGitHubInstallationToProjectInput!
  ) {
    linkGitHubInstallationToProject(input: $input)
  }
`;

export const UNLINK_GITHUB_INSTALLATION_FROM_PROJECT = gql`
  mutation UnlinkGitHubInstallationFromProject(
    $input: UnlinkGitHubInstallationFromProjectInput!
  ) {
    unlinkGitHubInstallationFromProject(input: $input)
  }
`;
