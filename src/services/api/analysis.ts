import OpenAI from "openai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { prompt } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um analista comercial estratégico especializado em varejo de alta performance.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
    });

    return res.status(200).json({
      result: response.choices[0]?.message?.content,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao processar análise estratégica." });
  }
}
