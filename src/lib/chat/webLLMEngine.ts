/**
 * WebLLM Engine Integration
 * Handles model loading, initialization, and query execution
 */

import * as webllm from "@mlc-ai/web-llm";
import type { DynamicChatContext, ChatResponse, ConversationMessage } from './types';
import { buildSystemPrompt } from './promptBuilder';

export interface InitProgress {
  progress: number;
  timeElapsed: number;
  text: string;
}

/**
 * Extract state names mentioned in the user query
 * This allows us to provide targeted context instead of all data
 */
function extractMentionedStates(query: string, availableStates: string[]): string[] {
  const queryLower = query.toLowerCase();
  const mentioned: string[] = [];

  for (const state of availableStates) {
    const stateLower = state.toLowerCase();
    // Check for exact match or partial match (e.g., "UP" for "Uttar Pradesh")
    if (queryLower.includes(stateLower)) {
      mentioned.push(state);
    }
  }

  return mentioned;
}

export class WebLLMEngine {
  private engine: webllm.MLCEngine | null = null;
  private isInitializing = false;
  private isReady = false;
  private selectedModel: string;

  constructor(modelId: string = "Llama-3.2-3B-Instruct-q4f16_1-MLC") {
    this.selectedModel = modelId;
  }

  /**
   * Initialize the WebLLM engine with progress callback
   */
  async initialize(
    onProgress?: (progress: InitProgress) => void
  ): Promise<void> {
    if (this.isReady) {
      console.log('WebLLM already initialized');
      return;
    }

    if (this.isInitializing) {
      // Wait for ongoing initialization
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isInitializing = true;

    try {
      console.log(`Initializing WebLLM with model: ${this.selectedModel}`);

      this.engine = await webllm.CreateMLCEngine(
        this.selectedModel,
        {
          initProgressCallback: (report) => {
            if (onProgress) {
              onProgress({
                progress: report.progress,
                timeElapsed: report.timeElapsed,
                text: report.text
              });
            }
          },
          logLevel: "WARN"
        }
      );

      this.isReady = true;
      console.log('WebLLM initialized successfully');
    } catch (error) {
      console.error("Failed to initialize WebLLM:", error);
      this.isReady = false;
      throw new Error(`WebLLM initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Execute a query and return complete response
   */
  async query(
    userQuery: string,
    context: DynamicChatContext
  ): Promise<ChatResponse> {
    if (!this.isReady || !this.engine) {
      throw new Error("WebLLM not initialized. Call initialize() first.");
    }

    if (!context) {
      throw new Error("context is not defined");
    }

    const startTime = performance.now();

    try {
      // Extract states mentioned in the query for targeted context
      const mentionedStates = extractMentionedStates(userQuery, context.geoMetadata.stateList);
      const contextWithMentions: DynamicChatContext = {
        ...context,
        mentionedStates
      };

      // Build system prompt from context
      const systemPrompt = buildSystemPrompt(contextWithMentions);

      // Build messages array
      const messages: webllm.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt }
      ];

      // Add conversation history (last 5 exchanges = 10 messages)
      // Filter out system messages - only the first system message is allowed
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory
          .filter(msg => msg.role !== 'system')
          .slice(-10);
        messages.push(...recentHistory.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })));
      }

      // Add current query
      messages.push({ role: "user", content: userQuery });

      // Generate completion
      const completion = await this.engine.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 512,
        top_p: 0.9
      });

      const answer = completion.choices[0].message.content || "No response generated";

      // Generate context-aware suggestions
      const suggestions = this.generateSuggestions(context, userQuery);

      const processingTime = performance.now() - startTime;

      return {
        answer,
        confidence: 0.85,
        processingTime,
        suggestions
      };

    } catch (error) {
      console.error("WebLLM query error:", error);
      return {
        answer: `❌ Error processing query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        processingTime: performance.now() - startTime,
        suggestions: ["Try rephrasing your question", "Check if the model is loaded properly"]
      };
    }
  }

  /**
   * Execute a streaming query with token-by-token callback
   */
  async streamQuery(
    userQuery: string,
    context: DynamicChatContext,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (!this.isReady || !this.engine) {
      throw new Error("WebLLM not initialized. Call initialize() first.");
    }

    console.log('webLLMEngine streamQuery - received context:', {
      contextExists: !!context,
      hasCurrentView: !!context?.currentView,
      hasGeoMetadata: !!context?.geoMetadata,
      hasUserData: !!context?.userData,
      contextKeys: context ? Object.keys(context) : []
    });

    if (!context) {
      console.error('webLLMEngine streamQuery - context is null/undefined');
      throw new Error("context is not defined");
    }

    if (!context.currentView || !context.geoMetadata || !context.userData) {
      console.error('webLLMEngine streamQuery - context structure invalid:', context);
      throw new Error("context structure is invalid");
    }

    try {
      console.log('webLLMEngine streamQuery - extracting mentioned states');
      // Extract states mentioned in the query for targeted context
      const mentionedStates = extractMentionedStates(userQuery, context.geoMetadata.stateList);
      console.log('webLLMEngine streamQuery - mentioned states:', mentionedStates);

      const contextWithMentions: DynamicChatContext = {
        ...context,
        mentionedStates
      };

      console.log('webLLMEngine streamQuery - building system prompt');
      const systemPrompt = buildSystemPrompt(contextWithMentions);
      console.log('webLLMEngine streamQuery - system prompt built successfully, length:', systemPrompt.length);

      const messages: webllm.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt }
      ];

      // Filter out system messages - only the first system message is allowed
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory
          .filter(msg => msg.role !== 'system')
          .slice(-10);
        messages.push(...recentHistory.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })));
      }

      messages.push({ role: "user", content: userQuery });

      const asyncChunkGenerator = await this.engine.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 512,
        top_p: 0.9,
        stream: true
      });

      for await (const chunk of asyncChunkGenerator) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          onChunk(delta);
        }
      }

      if (onComplete) {
        onComplete();
      }

    } catch (error) {
      console.error("WebLLM streaming error:", error);
      onChunk(`\n\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (onComplete) {
        onComplete();
      }
    }
  }

  /**
   * Generate context-aware follow-up suggestions
   */
  private generateSuggestions(context: DynamicChatContext, lastQuery: string): string[] {
    const suggestions: string[] = [];
    const { userData, currentView } = context;

    if (!userData.hasData) {
      return [
        "What geographic information is available?",
        "Tell me about the current map boundaries",
        "What can I ask once I upload data?"
      ];
    }

    // State-specific district view suggestions
    if (currentView.tab === 'state-districts' && currentView.selectedState) {
      suggestions.push(`What is the median for districts in ${currentView.selectedState}?`);

      if (userData.missingEntities.length > 0) {
        suggestions.push(`Which districts in ${currentView.selectedState} are missing data?`);
      }

      suggestions.push(`Compare ${currentView.selectedState} with neighboring states`);
    }

    // Missing data suggestions
    if (userData.missingEntities.length > 0 && !lastQuery.toLowerCase().includes('missing')) {
      suggestions.push("Which entities are missing data?");
    }

    // Regional comparison suggestions
    if (userData.regionalStats && Object.keys(userData.regionalStats).length > 1) {
      if (!lastQuery.toLowerCase().includes('region')) {
        suggestions.push("Compare regional averages");
      }
    }

    // Pattern analysis suggestions
    if (!lastQuery.toLowerCase().includes('hotspot')) {
      suggestions.push("Where are the hotspots?");
    }

    if (!lastQuery.toLowerCase().includes('interpret') && !lastQuery.toLowerCase().includes('pattern')) {
      suggestions.push("Help me interpret this pattern");
    }

    // Statistical suggestions
    if (!lastQuery.toLowerCase().includes('outlier')) {
      suggestions.push("Are there any outliers in the data?");
    }

    // Return up to 3 suggestions
    return suggestions.slice(0, 3);
  }

  /**
   * Check if engine is initialized and ready
   */
  isInitialized(): boolean {
    return this.isReady;
  }

  /**
   * Reset chat history (clears conversation context)
   */
  async resetChat(): Promise<void> {
    if (this.engine) {
      await this.engine.resetChat();
      console.log('Chat history reset');
    }
  }

  /**
   * Get runtime statistics (tokens/sec, etc.)
   */
  getRuntimeStats(): string {
    if (this.engine) {
      return this.engine.runtimeStatsText();
    }
    return "Engine not initialized";
  }

  /**
   * Interrupt ongoing generation
   */
  async interrupt(): Promise<void> {
    if (this.engine) {
      await this.engine.interruptGenerate();
    }
  }

  /**
   * Unload the model and free resources
   */
  async unload(): Promise<void> {
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
      this.isReady = false;
      console.log('WebLLM engine unloaded');
    }
  }

  /**
   * Get the selected model ID
   */
  getModelId(): string {
    return this.selectedModel;
  }
}
