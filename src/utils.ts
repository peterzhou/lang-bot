import ApolloClient from "apollo-boost";
import { ErrorResponse } from "apollo-link-error";
import { config } from "dotenv";
import parser from "intl-messageformat-parser";
import fetch from "isomorphic-unfetch";
import { Context } from "probot";
import { GitHubAPI } from "probot/lib/github";
import {
  BatchTranslationRequest,
  ConfigFile,
  TranslateFunctionCall
} from "./types";

export const PLACEHOLDER_INSTALLATION_ID = 2002131;
export const PLACEHOLDER_SENDER_ID = 13922597;

export async function getConfig(
  owner: string,
  repo: string,
  github: GitHubAPI,
  context?: Context
): Promise<ConfigFile> {
  const configFile = await github.repos.getContents({
    owner: owner,
    repo: repo,
    path: "langapiconfig.json",
    ref:
      context && context.payload.pull_request
        ? context.payload.pull_request.head.ref
        : "master"
  });

  const content = Buffer.from(configFile.data.content, "base64").toString();
  const config = JSON.parse(content);

  return config;
}

export function createClient() {
  return new ApolloClient({
    uri: getBackendUrl(),
    fetch: fetch as any,
    onError: (e: ErrorResponse) => {
      const { graphQLErrors, networkError } = e;
      if (graphQLErrors) {
        graphQLErrors.forEach(err => {
          console.error(err);
        });
      }
      if (networkError) {
        console.error(networkError);
      }
    }
  });
}

export function getBackendUrl() {
  const isDevelopment = loadLangInternalDevelopmentKey() === "development";
  return isDevelopment
    ? "http://localhost:4000"
    : "https://lang-backend.herokuapp.com/";
}

export function loadLangInternalDevelopmentKey() {
  config();

  if (process.env.LANG_INTERNAL_DEVELOPMENT_KEY) {
    return process.env.LANG_INTERNAL_DEVELOPMENT_KEY;
  }

  return null;
}

export function getValidTranslationRequests(
  translateCalls: TranslateFunctionCall[],
  config: any
): {
  batchedTranslationRequests: BatchTranslationRequest[];
  validTranslationCalls: TranslateFunctionCall[];
  invalidTranslationCalls: TranslateFunctionCall[];
} {
  const validTranslationCalls: TranslateFunctionCall[] = [];
  const invalidTranslationCalls: TranslateFunctionCall[] = [];

  translateCalls.forEach(translateCall => {
    if (
      translateCall.text &&
      // TODO fix logic, why is it invalid if it has variables??
      doesNotContainVariables(translateCall) &&
      isNotJustVariablesAndParameters(translateCall) &&
      canBeParsedByMessageFormat(translateCall)
    ) {
      // TODO figure out languages
      validTranslationCalls.push(translateCall);
    } else {
      invalidTranslationCalls.push(translateCall);
    }
  });

  const batchedTranslationRequests: BatchTranslationRequest[] = batchTranslationRequests(
    validTranslationCalls,
    config
  );

  return {
    batchedTranslationRequests,
    validTranslationCalls,
    invalidTranslationCalls
  };
}

function batchTranslationRequests(
  translateCalls: TranslateFunctionCall[],
  config: any
): BatchTranslationRequest[] {
  const batchTranslationRequests: BatchTranslationRequest[] = [];

  // hold groups
  const translationFunctionCallMap = new Map<string, TranslateFunctionCall[]>();

  for (const translateCall of translateCalls) {
    if (!translateCall.newLang) {
      // no newLang so languages will come from config.
      batchTranslationRequests.push({
        originalText: translateCall.text,
        originalLang: config.originalLanguage,
        description: translateCall.description,
        languages: config.targetLanguages,
        tags: config.tags || []
      });
    } else {
      // new lang so languages come from text
      const key = translateCall.text;
      const collection = translationFunctionCallMap.get(key);
      if (!collection) {
        translationFunctionCallMap.set(key, [translateCall]);
      } else {
        collection.push(translateCall);
      }
    }
  }

  for (const translationFunctionCallList of translationFunctionCallMap.values()) {
    batchTranslationRequests.push({
      originalText: translationFunctionCallList[0].text,
      originalLang: config.originalLanguage,
      description: translationFunctionCallList[0].description,
      languages: translationFunctionCallList
        .map(translationFunctionCall => {
          return translationFunctionCall.newLang
            ? translationFunctionCall.newLang
            : null;
        })
        .filter(language => {
          return language != null;
        }) as string[],
      tags: config.tags || []
    });
  }

  return batchTranslationRequests;
}

function isNotJustVariablesAndParameters(translateCall: TranslateFunctionCall) {
  let strippedText = translateCall.text;
  translateCall.variables.forEach(variable => {
    strippedText = strippedText.replace(markVariable(variable), "");
  });
  strippedText = normalizeSpaces(strippedText).trim();
  if (strippedText) {
    return true;
  }

  return false;
}

function doesNotContainVariables(translateCall: TranslateFunctionCall) {
  return !translateCall.variables.length;
}

function canBeParsedByMessageFormat(translateCall: TranslateFunctionCall) {
  try {
    parser.parse(translateCall.text);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

function markVariable(variable: string) {
  return `{${variable}}`;
}

function normalizeSpaces(value: string, options?: any): string {
  if (options && options.preserveWhitespace) {
    return value;
  }
  return value.replace(/\s+/g, " ");
}
