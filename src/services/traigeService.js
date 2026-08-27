import { checkRedFlags } from "../hooks/useEmergencyDetection";

export const getAITriageAssessment = async (
  symptoms,
  ageCategory,
  duration,
) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const hasRedFlagMatch = checkRedFlags(symptoms);

  if (!apiKey) {
    console.warn("OpenAI API key missing. Elevating for safety.");

    return {
      urgency: hasRedFlagMatch ? "EMERGENCY" : "URGENT",
      aiAssessment:
        "API key unconfigured. Defaulted to elevated clinical review.",
      redFlagTriggered: hasRedFlagMatch,
    };
  }

  const systemPrompt = `
You are an expert NHS clinical triage AI following NHS 111 guidelines. Evaluate the patient's report.
Respond ONLY with a valid JSON object matching this exact schema:
{
  "urgency": "EMERGENCY" | "URGENT" | "ROUTINE",
  "aiAssessment": "A concise 1-2 sentence clinical summary explaining the evaluation."
}
`;

  const userPrompt = `Age Bracket: ${ageCategory}\nDuration: ${duration}\nReported Details: "${symptoms}"`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    let finalUrgency = result.urgency || "ROUTINE";

    if (hasRedFlagMatch && finalUrgency !== "EMERGENCY") {
      finalUrgency = "EMERGENCY";
    }

    return {
      urgency: finalUrgency,
      aiAssessment: result.aiAssessment || "AI triage processed.",
      redFlagTriggered: hasRedFlagMatch,
    };
  } catch (err) {
    console.error("AI Triage Error:", err);

    return {
      urgency: hasRedFlagMatch ? "EMERGENCY" : "URGENT",
      aiAssessment: "Evaluation offline. Fallback triage applied.",
      redFlagTriggered: hasRedFlagMatch,
    };
  }
};
