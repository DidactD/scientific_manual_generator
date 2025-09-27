<?php
ob_start();

require_once 'vendor/autoload.php';
require_once 'config.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// --- Gestione della Richiesta e Sicurezza (Invariata) ---
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit();
}

function getUserIdFromToken() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader) return null;
    list($jwt) = sscanf($authHeader, 'Bearer %s');
    if (!$jwt) return null;
    try {
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        return $decoded->user->id;
    } catch (Exception $e) {
        error_log("Errore Decodifica JWT: " . $e->getMessage());
        return null;
    }
}

$userId = getUserIdFromToken();
if (!$userId) {
    http_response_code(401);
    echo json_encode(['message' => 'Accesso non autorizzato.']);
    ob_end_flush();
    exit();
}

$requestData = json_decode(file_get_contents("php://input"));
$topic = $requestData->topic ?? '';
$language = $requestData->language ?? 'English';
$detailLevel = $requestData->detailLevel ?? 'Standard';
$activeKeys = $requestData->activeKeys ?? [];
$isDeepSearch = true;

if (empty($topic) || empty($activeKeys)) {
    http_response_code(400);
    echo json_encode(['message' => 'Argomento e almeno una chiave API attiva sono richiesti.']);
    ob_end_flush();
    exit();
}

function getGeminiPrompt(string $topic, string $language, string $detailLevel, bool $isDeepSearch, ?string $additionalContext = null): string {
    $detailInstruction = 'The output should be a well-balanced and comprehensive manual, suitable for daily clinical practice.';
    if ($detailLevel === 'Concise') {
        $detailInstruction = 'The output should be a concise summary, focusing only on the most critical points for each section. Keep it brief and to the point.';
    } elseif ($detailLevel === 'Detailed') {
        $detailInstruction = 'The output must be extremely detailed and exhaustive. For each section, provide in-depth explanations, cite specific evidence, discuss nuances, and explore related concepts. The manual should be comprehensive enough for a specialist.';
    }

    $deepSearchInstruction = "";
    if ($isDeepSearch) {
        $deepSearchInstruction = "
DEEP SEARCH MODE: You must perform a more rigorous, multi-step research process.
1. First, formulate a series of precise, academic search queries related to the topic's pathophysiology, diagnosis, and treatment.
2. Metaphorically, execute these searches, prioritizing information from systematic reviews, meta-analyses, and international guidelines published in the last 5 years.
3. Synthesize the findings from this deep search into the final manual, ensuring the highest level of detail and accuracy. Explicitly state where evidence is conflicting or limited.
";
    }
    
    $mandatoryStructure = "
Mandatory structure (typical of specialized texts):
1.  **Title**: Clear, concise, and specific to the topic.
2.  **Introduction**: Definition, Epidemiology, Anatomy.
3.  **Etiology and Pathogenesis**: Etiology, Pathogenesis.
4.  **Clinical Picture**: Signs and Symptoms, Natural History, Classifications.
5.  **Diagnosis**: Anamnesis, Physical Examination, Laboratory Tests, Imaging.
6.  **Surgical Treatment**: Detailed description of procedures.
7.  **Conservative Treatment**: Non-surgical therapies.
8.  **Follow-up**: Post-treatment monitoring plan.
9.  **Prognosis and Outcome**: Prediction of evolution.
10. **Decision-making Algorithms**: Flowcharts for clinical decisions.
11. **Future Developments**: Overview of new research and technologies.
12. **Bibliography (Vancouver Style)**: A final section with numbered sources.
";
    $additionalInstructions = "
Additional instruction: The format must be a cascading outline, using markdown for formatting (## for main headings, ### for subheadings, * for bullet points, **text** for bold).
Tone / Style: Formal and didactic; concise sentences.
Handling evidence gaps: If information is insufficient, state it explicitly.
Citations: In-text citations must be numerical, in square brackets (e.g., [1], [2]). The 'Bibliography' section must list all sources numerically.
";
    if ($additionalContext) {
        return "
Initialization: You are an expert medical editor and researcher.
Context: I have asked multiple AI assistants to draft a manual on \"{$topic}\". I need you to act as the final editor, taking their drafts, verifying the information with your own web search, and producing a single, superior manual.
Provided Drafts from other models:
{$additionalContext}
---
Objective: Review the drafts, perform your own searches, and write the definitive manual. The final output must follow the mandatory structure below and be a coherent, single document.
**Detail Level**: {$detailLevel}. {$detailInstruction}
{$deepSearchInstruction}
Output language: {$language}.
Required sources: Guidelines, systematic reviews, randomized controlled trials (preferably last 5-10 years).
{$mandatoryStructure}
{$additionalInstructions}
";
    }
    return "
Initialization: You are a virtual assistant with expertise in medical research.
Context: I am a medical professional and I need a didactic manual on this topic: \"{$topic}\".
Objective: To produce an exhaustive text based on up-to-date scientific evidence.
**Detail Level**: {$detailLevel}. {$detailInstruction}
{$deepSearchInstruction}
Output language: {$language}.
Required sources: Guidelines, systematic reviews, randomized controlled trials (preferably last 5-10 years).
{$mandatoryStructure}
{$additionalInstructions}
";
}


function callGemini(string $apiKey, string $model, string $topic, string $language, string $detailLevel, bool $isDeepSearch, ?string $additionalContext = null): array {
    try {
        $prompt = getGeminiPrompt($topic, $language, $detailLevel, $isDeepSearch, $additionalContext);
        $client = \Gemini::factory()->withApiKey($apiKey)->make();
        
        // CORREZIONE: Usiamo un modello più recente e supportato
        $response = $client->generativeModel($model ?: 'gemini-1.5-flash')->generateContent($prompt);

        return ['content' => $response->text(), 'sources' => []];
    } catch (Exception $e) {
        return ['content' => "## Errore Gemini\n\nImpossibile generare il manuale: " . $e->getMessage(), 'sources' => []];
    }
}

function callOpenAI(string $apiKey, string $model, string $topic, string $language): array {
    try {
        $client = \OpenAI::factory()->withApiKey($apiKey)->make();
        $prompt = "Write a brief medical manual on the topic: '{$topic}'. The manual should be structured with clear headings. The output language must be {$language}.";
        $response = $client->chat()->create([
            'model' => $model,
            'messages' => [['role' => 'user', 'content' => $prompt]],
        ]);
        return ['content' => $response->choices[0]->message->content, 'sources' => []];
    } catch (Exception $e) {
        return ['content' => "## Errore OpenAI\n\nImpossibile generare il manuale: " . $e->getMessage(), 'sources' => []];
    }
}

function callClaude(string $apiKey, string $model, string $topic, string $language): array {
    try {
        $client = \Anthropic::factory()->withApiKey($apiKey)->make();
        $prompt = "Write a brief medical manual on the topic: '{$topic}'. The manual should be structured with clear headings. The output language must be {$language}.";
        $response = $client->messages()->create([
            'model' => $model,
            'max_tokens' => 2048,
            'messages' => [['role' => 'user', 'content' => $prompt]],
        ]);
        return ['content' => $response->content[0]->text, 'sources' => []];
    } catch (Exception $e) {
        return ['content' => "## Errore Claude\n\nImpossibile generare il manuale: " . $e->getMessage(), 'sources' => []];
    }
}

// --- Logica di Orchestrazione con Gestione Errori Migliorata ---
$drafts = [];
$geminiKey = null;
$geminiModel = null;
$successful_calls = 0;
$error_messages = [];

foreach ($activeKeys as $apiKey) {
    $result = null;
    switch ($apiKey->provider) {
        case 'Google Gemini':
            $geminiKey = $apiKey->key;
            $geminiModel = $apiKey->model;
            $result = callGemini($apiKey->key, $apiKey->model, $topic, $language, $detailLevel, $isDeepSearch);
            break;
        case 'Anthropic Claude':
            $result = callClaude($apiKey->key, $apiKey->model, $topic, $language);
            break;
        case 'OpenAI ChatGPT':
            $result = callOpenAI($apiKey->key, $apiKey->model, $topic, $language);
            break;
    }

    if ($result && !str_starts_with($result['content'], '## Errore')) {
        $drafts[] = $result['content'];
        $successful_calls++;
    } elseif ($result) {
        $error_messages[] = $result['content'];
    }
}

$finalContent = "";
$finalSources = [];

if ($successful_calls === 0) {
    $finalContent = "All AI models failed to generate a response.\n\n" . implode("\n\n---\n\n", $error_messages);
} elseif (count($drafts) > 1 && $geminiKey) {
    $combinedDrafts = implode("\n\n---\n\n", $drafts);
    $synthesisResult = callGemini($geminiKey, $geminiModel, $topic, $language, $detailLevel, $isDeepSearch, $combinedDrafts);
    $finalContent = $synthesisResult['content'];
} else {
    $finalContent = $drafts[0];
}

if (empty(trim($finalContent))) {
    http_response_code(500);
    $errorMessage = "An unexpected error occurred: The final content is empty after processing. Please check the model permissions and API keys.";
    if (!empty($error_messages)) {
        $errorMessage .= "\n\nCaptured errors:\n" . implode("\n", $error_messages);
    }
    echo json_encode(['message' => $errorMessage]);
    ob_end_flush();
    exit();
}

http_response_code(200);
echo json_encode([
    'content' => $finalContent,
    'sources' => $finalSources
]);

ob_end_flush();
?>