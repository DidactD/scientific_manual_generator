import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { GroundingChunk, ManualData, DetailLevel } from '../types';

function getPrompt(topic: string, language: string, detailLevel: DetailLevel): string {
    let detailInstruction = '';
    switch (detailLevel) {
        case 'Concise':
            detailInstruction = 'The output should be a concise summary, focusing only on the most critical points for each section. Keep it brief and to the point.';
            break;
        case 'Detailed':
            detailInstruction = 'The output must be extremely detailed and exhaustive. For each section, provide in-depth explanations, cite specific evidence, discuss nuances, and explore related concepts. The manual should be comprehensive enough for a specialist.';
            break;
        case 'Standard':
        default:
            detailInstruction = 'The output should be a well-balanced and comprehensive manual, suitable for daily clinical practice.';
            break;
    }

    return `
Initialization: You are a virtual assistant with advanced expertise in medical and scientific research. You can perform web searches to find recently published guidelines and articles.

Context: I am a medical professional and I need to prepare a didactic manual applicable to daily clinical practice on this topic: "${topic}".

Objective: To produce an exhaustive text, based on the most up-to-date scientific evidence, usable in daily clinical practice.

**Detail Level**: ${detailLevel}. ${detailInstruction}

Output language: ${language}.

Required sources:
- Guidelines from national and international scientific societies
- Systematic reviews / meta-analyses
- Randomized controlled trials
- Other authoritative recommendations
The sources should preferably have been published in the last 5-10 years, unless they are fundamental studies or still universally accepted guidelines.

Mandatory structure (typical of specialized texts):
1.  **Title**: Clear, concise, and specific to the topic.
2.  **Introduction**:
    -   **Definition**: Precise and complete description of the topic.
    -   **Epidemiology**: Data on incidence and prevalence.
    -   **Anatomy**: Description of relevant anatomical structures.
3.  **Etiology and Pathogenesis**:
    -   **Etiology**: Causes or triggering factors.
    -   **Pathogenesis**: Mechanisms through which the causes act.
4.  **Clinical Picture**:
    -   **Signs and Symptoms**: Clinical manifestations.
    -   **Natural History**: Evolution of the phenomenon without intervention.
    -   **Classifications**: Categorization systems.
5.  **Diagnosis**:
    -   **Anamnesis**: Information gathering.
    -   **Physical Examination**: Physical assessment.
    -   **Laboratory Tests**: Biological analyses.
    -   **Imaging**: Description of diagnostic imaging techniques and typical findings.
6.  **Surgical Treatment**: Detailed description of procedures.
7.  **Conservative Treatment**: Non-surgical therapies.
8.  **Follow-up**: Post-treatment monitoring plan.
9.  **Prognosis and Outcome**: Prediction of evolution.
10. **Decision-making Algorithms**: Flowcharts for clinical decisions.
11. **Future Developments**: Overview of new research and technologies.

Additional instruction: The format must be a cascading outline, using markdown for formatting (## for main headings, ### for subheadings, * for bullet points, **text** for bold).

Tone / Style: Formal and didactic; concise sentences.

Handling evidence gaps: If information is insufficient, state it explicitly.

Operational flow:
1.  Perform the necessary web searches.
2.  Draft the text following the indicated structure.
3.  At the end of the text, insert a dedicated section called "Bibliography" that lists the scientific sources consulted and cited in the text.
4.  Citations in the text must use a numerical format (e.g., [1], [2]) and the bibliography must correspond. Example: "Conservative treatment is indicated [3]." and in the bibliography "3. Vaccaro AR, et al. ...".

The "Bibliography" section must be unique and at the end of the document.
`;
}


export async function generateManual(topic: string, language: string, detailLevel: DetailLevel, apiKey: string): Promise<ManualData> {
  if (!topic || topic.trim() === '') {
    throw new Error("Topic cannot be empty.");
  }
  if (!language || language.trim() === '') {
    throw new Error("Language cannot be empty.");
  }
  if (!apiKey) {
    throw new Error("Google Gemini API key is not configured. Please add it on the Models page.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = getPrompt(topic, language, detailLevel);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const content = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources: GroundingChunk[] =
      groundingMetadata?.groundingChunks
        ?.filter(
          (chunk) => chunk.web?.uri && chunk.web.title
        )
        .map((chunk) => ({
          web: {
            uri: chunk.web!.uri!,
            title: chunk.web!.title!,
          },
        })) ?? [];

    if (!content) {
        throw new Error("Failed to generate content. The response was empty.");
    }
    
    return { content, sources };
  } catch (error) {
    console.error("Error generating manual:", error);
    if (error instanceof Error) {
        // More specific error for API key issues
        if (error.message.includes('API key not valid')) {
            throw new Error('The provided Google Gemini API key is invalid. Please check it in the Models settings.');
        }
        throw new Error(`An error occurred while communicating with the API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the manual.");
  }
}
