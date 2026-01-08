"use client";
// OpenAI Compatible API client for custom endpoints
import {
  OpenaiPath,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import {
  useAccessStore,
  useAppConfig,
  useChatStore,
  usePluginStore,
  ChatMessageTool,
} from "@/app/store";
import {
  preProcessImageContent,
  streamWithThink,
} from "@/app/utils/chat";
import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  SpeechOptions,
} from "../api";
import {
  getMessageTextContent,
  isVisionModel,
  getTimeoutMSByModel,
} from "@/app/utils";
import { fetch } from "@/app/utils/stream";

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root?: string;
  }>;
}

export interface RequestPayload {
  messages: {
    role: "system" | "user" | "assistant";
    content: string | any[];
  }[];
  stream?: boolean;
  model: string;
  temperature: number;
  presence_penalty: number;
  frequency_penalty: number;
  top_p: number;
  max_tokens?: number;
}

export class OpenAICompatibleApi implements LLMApi {
  private disableListModels = false;

  path(path: string): string {
    const accessStore = useAccessStore.getState();
    let baseUrl = accessStore.openaiCompatibleUrl || "";

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http")) {
      baseUrl = "https://" + baseUrl;
    }

    console.log("[OpenAI Compatible] Endpoint: ", baseUrl, path);
    return [baseUrl, path].join("/");
  }

  getHeaders(): Record<string, string> {
    const accessStore = useAccessStore.getState();
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessStore.openaiCompatibleApiKey}`,
    };
  }

  async extractMessage(res: any) {
    if (res.error) {
      return "```\n" + JSON.stringify(res, null, 4) + "\n```";
    }
    return res.choices?.at(0)?.message?.content ?? res;
  }

  async speech(options: SpeechOptions): Promise<ArrayBuffer> {
    const requestPayload = {
      model: options.model,
      input: options.input,
      voice: options.voice,
      response_format: options.response_format,
      speed: options.speed,
    };

    console.log("[Request] OpenAI Compatible speech payload: ", requestPayload);

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const speechPath = this.path(OpenaiPath.SpeechPath);
      const speechPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: this.getHeaders(),
      };

      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      const res = await fetch(speechPath, speechPayload);
      clearTimeout(requestTimeoutId);
      return await res.arrayBuffer();
    } catch (e) {
      console.log("[Request] failed to make a speech request", e);
      throw e;
    }
  }

  async chat(options: ChatOptions) {
    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        providerName: options.config.providerName,
      },
    };

    const visionModel = isVisionModel(options.config.model);
    const messages: ChatOptions["messages"] = [];
    for (const v of options.messages) {
      const content = visionModel
        ? await preProcessImageContent(v.content)
        : getMessageTextContent(v);
      messages.push({ role: v.role, content });
    }

    const requestPayload: RequestPayload = {
      messages,
      stream: options.config.stream,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      presence_penalty: modelConfig.presence_penalty,
      frequency_penalty: modelConfig.frequency_penalty,
      top_p: modelConfig.top_p,
    };

    // add max_tokens to vision model
    if (visionModel) {
      requestPayload["max_tokens"] = Math.max(modelConfig.max_tokens, 4000);
    }

    console.log("[Request] OpenAI Compatible payload: ", requestPayload);

    const shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(OpenaiPath.ChatPath);

      if (shouldStream) {
        let index = -1;
        const [tools, funcs] = usePluginStore
          .getState()
          .getAsTools(
            useChatStore.getState().currentSession().mask?.plugin || [],
          );

        streamWithThink(
          chatPath,
          requestPayload,
          this.getHeaders(),
          tools as any,
          funcs,
          controller,
          // parseSSE
          (text: string, runTools: ChatMessageTool[]) => {
            const json = JSON.parse(text);
            const choices = json.choices as Array<{
              delta: {
                content: string;
                tool_calls: ChatMessageTool[];
                reasoning_content: string | null;
              };
            }>;

            if (!choices?.length) return { isThinking: false, content: "" };

            const tool_calls = choices[0]?.delta?.tool_calls;
            if (tool_calls?.length > 0) {
              const id = tool_calls[0]?.id;
              const args = tool_calls[0]?.function?.arguments;
              if (id) {
                index += 1;
                runTools.push({
                  id,
                  type: tool_calls[0]?.type,
                  function: {
                    name: tool_calls[0]?.function?.name as string,
                    arguments: args,
                  },
                });
              } else {
                // @ts-ignore
                runTools[index]["function"]["arguments"] += args;
              }
            }

            const reasoning = choices[0]?.delta?.reasoning_content;
            const content = choices[0]?.delta?.content;

            if (
              (!reasoning || reasoning.length === 0) &&
              (!content || content.length === 0)
            ) {
              return {
                isThinking: false,
                content: "",
              };
            }

            if (reasoning && reasoning.length > 0) {
              return {
                isThinking: true,
                content: reasoning,
              };
            } else if (content && content.length > 0) {
              return {
                isThinking: false,
                content: content,
              };
            }

            return {
              isThinking: false,
              content: "",
            };
          },
          // processToolMessage
          (
            requestPayload: RequestPayload,
            toolCallMessage: any,
            toolCallResult: any[],
          ) => {
            index = -1;
            // @ts-ignore
            requestPayload?.messages?.splice(
              // @ts-ignore
              requestPayload?.messages?.length,
              0,
              toolCallMessage,
              ...toolCallResult,
            );
          },
          options,
        );
      } else {
        const chatPayload = {
          method: "POST",
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
          headers: this.getHeaders(),
        };

        const requestTimeoutId = setTimeout(
          () => controller.abort(),
          getTimeoutMSByModel(options.config.model),
        );

        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = await this.extractMessage(resJson);
        options.onFinish(message, res);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }

  async usage() {
    return {
      used: 0,
      total: 0,
    };
  }

  async models(): Promise<LLMModel[]> {
    const accessStore = useAccessStore.getState();

    if (this.disableListModels || !accessStore.openaiCompatibleUrl || !accessStore.openaiCompatibleApiKey) {
      return [];
    }

    try {
      const res = await fetch(this.path(OpenaiPath.ListModelPath), {
        method: "GET",
        headers: this.getHeaders(),
      });

      const resJson = (await res.json()) as OpenAIListModelResponse;
      const chatModels = resJson.data?.filter((m) => m.id);

      console.log("[OpenAI Compatible Models]", chatModels);

      if (!chatModels) {
        return [];
      }

      const providerName = accessStore.openaiCompatibleProviderName || "Custom";
      let seq = 2000;
      return chatModels.map((m) => ({
        name: m.id,
        available: true,
        sorted: seq++,
        provider: {
          id: "openai-compatible",
          providerName: providerName,
          providerType: "openai-compatible",
          sorted: 16,
        },
      }));
    } catch (e) {
      console.error("[OpenAI Compatible] Failed to fetch models", e);
      return [];
    }
  }
}
