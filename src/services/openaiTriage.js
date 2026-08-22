export const generateAITriage = async (symptoms, ageCategory, duration) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OpenAI API key missing. Returning default assessment.");
    return {
      urgency: "ROUTINE",
      aiAssessment: "API key missing. Defaulting to routine manual triage.",
    };
  }

  const systemPrompt = `
You are an expert NHS Triage Assistant. Evaluate patient symptom reports and assess clinical urgency.
Respond ONLY with a valid JSON object matching this exact schema:
{
  "urgency": "EMERGENCY" | "URGENT" | "ROUTINE",
  "aiAssessment": "A concise 1-2 sentence clinical summary explaining the reasoning."
}

Rules:
- "EMERGENCY": Severe symptoms like chest pain, stroke symptoms, acute shortness of breath, or loss of consciousness.
- "URGENT": High fever, severe pain, persistent vomiting, or suspected fractures.
- "ROUTINE": Mild cold/flu symptoms, mild rashes, minor aches, or general inquiries.
  `;

  const userContent = `
Patient Age Category: ${ageCategory || "Not specified"}
Symptom Duration: ${duration || "Not specified"}
Reported Symptoms: ${symptoms}
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Fast and cost-effective for JSON triage classification
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const parsedResult = JSON.parse(data.choices[0].message.content);

    return {
      urgency: parsedResult.urgency || "ROUTINE",
      aiAssessment:
        parsedResult.aiAssessment || "AI assessment processed successfully.",
    };
  } catch (error) {
    console.error("Failed to generate AI Triage:", error);
    return {
      urgency: "URGENT",
      aiAssessment:
        "Error running AI triage model. Case defaulted to URGENT for clinician safety.",
    };
  }
};
