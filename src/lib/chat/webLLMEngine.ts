import * as webllm from "@mlc-ai/web-llm";
import type { DynamicChatContext, ChatResponse, ConversationMessage } from './types';
import { buildSystemPrompt, getStarterQuestions } from './promptBuilder';

export interface InitProgress {
  progress: number;
  timeElapsed: number;
  text: string;
}

function extractMentionedStates(query: string, availableStates: string[]): string[] {
  const queryLower = query.toLowerCase();
  const mentioned: string[] = [];

  for (const state of availableStates) {
    const stateLower = state.toLowerCase();
    if (queryLower.includes(stateLower)) {
      mentioned.push(state);
    }
  }

  return mentioned;
}

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trimStart();
}

export class WebLLMEngine {
  private engine: webllm.MLCEngine | null = null;
  private isInitializing = false;
  private isReady = false;
  private selectedModel: string;

  constructor(modelId: string = "Qwen3-4B-q4f16_1-MLC") {
    this.selectedModel = modelId;
  }

  async initialize(
    onProgress?: (progress: InitProgress) => void
  ): Promise<void> {
    if (this.isReady) {
      console.log('WebLLM already initialized');
      return;
    }

    if (this.isInitializing) {
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
      await this.engine.resetChat();

      const mentionedStates = extractMentionedStates(userQuery, context.geoMetadata.stateList);
      const contextWithMentions: DynamicChatContext = { ...context, mentionedStates };
      const systemPrompt = buildSystemPrompt(contextWithMentions);

      const messages: webllm.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt }
      ];

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

      const completion = await this.engine.chat.completions.create({
        messages,
        temperature: 0,
        max_tokens: 512,
      });

      const raw = completion.choices[0].message.content || "No response generated";
      const answer = stripThinkTags(raw);
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

  async streamQuery(
    userQuery: string,
    context: DynamicChatContext,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (!this.isReady || !this.engine) {
      throw new Error("WebLLM not initialized. Call initialize() first.");
    }

    if (!context) {
      throw new Error("context is not defined");
    }

    if (!context.currentView || !context.geoMetadata || !context.userData) {
      throw new Error("context structure is invalid");
    }

    try {
      await this.engine.resetChat();

      const mentionedStates = extractMentionedStates(userQuery, context.geoMetadata.stateList);

      const contextWithMentions: DynamicChatContext = {
        ...context,
        mentionedStates
      };

      const systemPrompt = buildSystemPrompt(contextWithMentions);

      const messages: webllm.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt }
      ];

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
        temperature: 0,
        max_tokens: 512,
        stream: true
      });

      let insideThink = false;
      let pendingBuffer = '';

      for await (const chunk of asyncChunkGenerator) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (!delta) continue;

        pendingBuffer += delta;

        while (pendingBuffer.length > 0) {
          if (insideThink) {
            const closeIdx = pendingBuffer.indexOf('</think>');
            if (closeIdx === -1) {
              pendingBuffer = '';
              break;
            }
            pendingBuffer = pendingBuffer.slice(closeIdx + 8);
            insideThink = false;
          } else {
            const openIdx = pendingBuffer.indexOf('<think>');
            if (openIdx === -1) {
              if (pendingBuffer.length > 7) {
                const safe = pendingBuffer.slice(0, -7);
                if (safe) onChunk(safe);
                pendingBuffer = pendingBuffer.slice(-7);
              }
              break;
            }
            if (openIdx > 0) {
              onChunk(pendingBuffer.slice(0, openIdx));
            }
            pendingBuffer = pendingBuffer.slice(openIdx + 7);
            insideThink = true;
          }
        }
      }

      if (pendingBuffer && !insideThink) {
        onChunk(pendingBuffer.trimStart());
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

  async generateDataQuestions(context: DynamicChatContext): Promise<string[]> {
    if (!this.isReady || !this.engine) return [];

    try {
      await this.engine.resetChat();
      const systemPrompt = buildSystemPrompt(context);
      const completion = await this.engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Suggest exactly 4 short questions (max 12 words each) a user might ask about this data. Output ONLY the questions, one per line, no numbering or bullets." }
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const raw = stripThinkTags(completion.choices[0].message.content || '');
      const questions = raw
        .split('\n')
        .map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/^[-•*]\s*/, '').trim())
        .filter(l => l.length > 10 && l.length < 120);

      await this.engine.resetChat();
      return questions.slice(0, 4);
    } catch (error) {
      console.error("Failed to generate data questions:", error);
      try { await this.engine?.resetChat(); } catch (_) {}
      return [];
    }
  }

  private generateSuggestions(context: DynamicChatContext, lastQuery: string): string[] {
    const questions = getStarterQuestions(context);
    const queryLower = lastQuery.toLowerCase();
    return questions
      .filter(q => !queryLower.includes(q.toLowerCase().slice(0, 20)))
      .slice(0, 3);
  }

  isInitialized(): boolean {
    return this.isReady;
  }

  async resetChat(): Promise<void> {
    if (this.engine) {
      await this.engine.resetChat();
      console.log('Chat history reset');
    }
  }

  getRuntimeStats(): string {
    if (this.engine) {
      return this.engine.runtimeStatsText();
    }
    return "Engine not initialized";
  }

  async interrupt(): Promise<void> {
    if (this.engine) {
      await this.engine.interruptGenerate();
    }
  }

  async unload(): Promise<void> {
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
      this.isReady = false;
      console.log('WebLLM engine unloaded');
    }
  }

  getModelId(): string {
    return this.selectedModel;
  }
}
