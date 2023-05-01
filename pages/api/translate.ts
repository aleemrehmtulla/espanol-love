import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
});

const openai = new OpenAIApi(configuration);

export default async function translate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { text } = req.body;

  const translatedText = await askOpenAI(text);

  const TRIAL_URL = "https://api.elevenlabs.io";
  const API_PATH = `/v1/text-to-speech/${process.env.ELEVENLABS_MODEL}`;
  const API_KEY = process.env.ELEVENLABS_KEY as string;

  const OPTIONS = {
    method: "POST",
    body: JSON.stringify({
      text: translatedText,
      model_id: "eleven_monolingual_v1",
    }),
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      accept: "audio/mpeg",
    },
  };

  const response = await fetch(TRIAL_URL + API_PATH, OPTIONS);

  const audioData = await response.arrayBuffer();
  const audioDataBase64 = Buffer.from(audioData).toString("base64");

  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ audioDataBase64, translatedText }));
}

async function askOpenAI(text: string) {
  const request = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Translate from English to Spanish like a local: ${text}`,
      },
    ],
  });

  return request.data.choices[0].message?.content;
}
