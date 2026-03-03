import { SYSTEM_INSTRUCTION, TOOL_DECLARATION, PATIENT_TOOL_DECLARATION } from './systemPrompt.js';
import { setScore, setPatientInfo } from './chatState.js';

let genAI = null;
let chat = null;

export async function initGemini(apiKey) {
  const { GoogleGenAI } = await import('https://esm.sh/@google/genai');
  genAI = new GoogleGenAI({ apiKey });

  // Start a new chat session
  chat = genAI.chats.create({
    model: 'gemini-flash-lite-latest',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [TOOL_DECLARATION, PATIENT_TOOL_DECLARATION] }],
    },
  });
}

// Send a message and stream the response, processing any tool calls
export async function sendMessage(text, { onChunk, onToolCall, onDone }) {
  const response = await chat.sendMessageStream({ message: text });

  let fullText = '';
  let toolCalls = [];

  for await (const chunk of response) {
    // Collect text parts
    const textPart = chunk.text;
    if (textPart) {
      fullText += textPart;
      onChunk(textPart);
    }

    // Collect function calls from this chunk
    if (chunk.candidates?.[0]?.content?.parts) {
      for (const part of chunk.candidates[0].content.parts) {
        if (part.functionCall) {
          toolCalls.push(part.functionCall);
        }
      }
    }
  }

  // Process tool calls
  if (toolCalls.length > 0) {
    const toolResponses = [];

    for (const call of toolCalls) {
      if (call.name === 'record_phq9_response') {
        const questionIndex = parseInt(call.args.questionIndex, 10);
        const score = parseInt(call.args.score, 10);
        const reasoning = call.args.reasoning;
        const idx = questionIndex - 1; // convert 1-based to 0-based
        setScore(idx, score, true);
        onToolCall(idx, score, reasoning);
        toolResponses.push({
          name: call.name,
          response: { recorded: true, questionIndex, score },
        });
      } else if (call.name === 'record_patient_info') {
        setPatientInfo(call.args);
        toolResponses.push({
          name: call.name,
          response: { recorded: true },
        });
      }
    }

    // Send tool responses back and stream the continuation
    const followUp = await chat.sendMessageStream({
      message: toolResponses.map(r => ({
        functionResponse: r,
      })),
    });

    for await (const chunk of followUp) {
      const textPart = chunk.text;
      if (textPart) {
        fullText += textPart;
        onChunk(textPart);
      }

      // Handle nested tool calls in follow-up
      if (chunk.candidates?.[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (part.functionCall?.name === 'record_phq9_response') {
            const questionIndex = parseInt(part.functionCall.args.questionIndex, 10);
            const score = parseInt(part.functionCall.args.score, 10);
            const reasoning = part.functionCall.args.reasoning;
            const idx = questionIndex - 1;
            setScore(idx, score, true);
            onToolCall(idx, score, reasoning);
          } else if (part.functionCall?.name === 'record_patient_info') {
            setPatientInfo(part.functionCall.args);
          }
        }
      }
    }
  }

  onDone(fullText);
}

// Send initial greeting (empty message triggers the system instruction)
export async function sendGreeting({ onChunk, onDone }) {
  const response = await chat.sendMessageStream({
    message: 'Hello, I\'d like to take the PHQ-9 assessment.',
  });

  let fullText = '';
  for await (const chunk of response) {
    const textPart = chunk.text;
    if (textPart) {
      fullText += textPart;
      onChunk(textPart);
    }
  }
  onDone(fullText);
}
