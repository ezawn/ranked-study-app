import "server-only";

import { env, usingRealAi } from "@/lib/env";
import { MockAIProvider } from "./mock";
import { AnthropicProvider } from "./anthropic";
import type { AIProvider } from "./types";

let provider: AIProvider | null = null;

/**
 * The AI provider for this process.
 *
 * Falls back to the local stand-in whenever a real provider is selected but not
 * usable, so a missing key degrades the product instead of breaking it. The UI
 * reads `isReal` and tells the user which one produced their result.
 */
export function ai(): AIProvider {
  if (provider) return provider;

  if (usingRealAi()) {
    try {
      provider = new AnthropicProvider();
      return provider;
    } catch (error) {
      console.warn(
        `[ai] Falling back to the local provider: ${(error as Error).message}`,
      );
    }
  } else if (env.ai.provider !== "mock") {
    console.warn(
      `[ai] AI_PROVIDER is "${env.ai.provider}" but no API key is set — using the local provider.`,
    );
  }

  provider = new MockAIProvider();
  return provider;
}

/** Reset between tests. */
export function resetAiProvider() {
  provider = null;
}

export * from "./types";
