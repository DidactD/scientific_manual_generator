import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { GroundingChunk, ManualData, DetailLevel } from '../types';

function getPrompt(topic: string, language: string, detailLevel: DetailLevel, additionalContext?: string): string {
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

    const mandatoryStructure = `
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
`;

    const additionalInstructions = `
Additional instruction: The format must be a cascading outline, using markdown for formatting (## for main headings, ### for subheadings, * for bullet points, **text** for bold).

Tone / Style: Formal and didactic; concise sentences.

Handling evidence gaps: If information is insufficient, state it explicitly.

Operational flow:
1.  Perform the necessary web searches.
2.  Draft the text following the indicated structure.
3.  **Citations and Bibliography (Vancouver Style)**:
    -   In-text citations must be numerical, enclosed in square brackets (e.g., [1], [2], [3]).
    -   A "Bibliography" section must be the final section of the document.
    -   List all cited sources numerically in the order they first appear in the text.
    -   Format each entry strictly according to the Vancouver style. Examples:
        -   **Journal Article**: Author(s). Title of article. Abbreviated Title of Journal. Year;volume(issue):pages.
            *Example*: 1. Halpern SD, Ubel PA, Caplan AL. Solid-organ transplantation in HIV-infected patients. N Engl J Med. 2002;347(4):284-7.
        -   **Book**: Author(s). Title of book. Edition. Place of publication: Publisher; Year.
            *Example*: 2. Murray PR, Rosenthal KS, Pfaller MA. Medical microbiology. 4th ed. St. Louis: Mosby; 2002.
        -   **Website**: Author(s) (if available). Title of the specific page [Internet]. Place of publication (if available): Publisher; Date of publication [cited YYYY Mon DD]. Available from: URL.
            *Example*: 3. World Health Organization. Global status report on noncommunicable diseases 2014 [Internet]. Geneva: WHO; 2014 [cited 2024 Oct 26]. Available from: http://www.who.int/nmh/publications/ncd-status-report-2014/en/
`;
    
    if (additionalContext) {
        return `
Initialization: You are an expert medical editor and researcher. You synthesize information from multiple sources to create the most accurate and comprehensive documents.

Context: I am a medical professional. I have asked multiple AI assistants to draft a manual on "${topic}". I need you to act as the final editor, taking their drafts, verifying the information with your own web search, and producing a single, superior manual.

Provided Drafts from other models:
${additionalContext}
---

Objective: Review the provided drafts, perform your own up-to-date web searches, and then write the definitive manual on the topic. The final output must follow the mandatory structure below and be a coherent, single document, not a critique of the drafts. Integrate the best information from the drafts and your own research.

**Detail Level**: ${detailLevel}. ${detailInstruction}

Output language: ${language}.

Required sources:
- Guidelines from national and international scientific societies
- Systematic reviews / meta-analyses
- Randomized controlled trials
- Other authoritative recommendations
The sources should preferably have been published in the last 5-10 years, unless they are fundamental studies or still universally accepted guidelines.

${mandatoryStructure}
${additionalInstructions}
`;
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

${mandatoryStructure}
${additionalInstructions}
`;
}


export async function generateManual(topic: string, language: string, detailLevel: DetailLevel, apiKey: string, additionalContext?: string): Promise<ManualData> {
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
    const prompt = getPrompt(topic, language, detailLevel, additionalContext);

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
        if (error.message.includes('API key not valid')) {
            throw new Error('The provided Google Gemini API key is invalid. Please check it in the Models settings.');
        }
        if (error.message.includes('Rpc failed') || error.message.includes('xhr error')) {
            throw new Error('A network error occurred while communicating with the Gemini API. This could be due to a temporary issue, a browser extension blocking the request, or a network firewall. Please check your connection and try again.');
        }
        throw new Error(`An error occurred while communicating with the API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the manual.");
  }
}