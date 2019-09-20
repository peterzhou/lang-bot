import axios from "axios";

const GITHUB_USER_API_URL = "";

export async function getGitHubUserWithAccessToken(accessToken: string) {
  return new Promise<any>((resolve, reject) => {
    axios
      .get(GITHUB_USER_API_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error);
      });
  });
}
