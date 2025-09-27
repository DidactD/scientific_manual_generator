<?php
ob_start();

require_once 'vendor/autoload.php';
require_once 'config.php';

use Google\GenerativeAI\GenerativeModel;
use Google\GenerativeAI\GoogleAI;
use Google\GenerativeAI\Chat\Content;
use Google\GenerativeAI\Part\FunctionCall;

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit();
}

// Funzione di sicurezza per validare il token JWT
function getUserIdFromToken() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader) return null;
    list($jwt) = sscanf($authHeader, 'Bearer %s');
    if (!$jwt) return null;
    try {
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        return $decoded->user->id;
    } catch (Exception $e) {
        error_log("Errore Decodifica JWT in generate.php: " . $e->getMessage());
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

// Ricevi i dati dalla richiesta del frontend
$requestData = json_decode(file_get_contents("php://input"));
$topic = $requestData->topic ?? '';
$language = $requestData->language ?? 'English';
$detailLevel = $requestData->detailLevel ?? 'Standard';
$activeKeys = $requestData->activeKeys ?? [];

if (empty($topic) || empty($activeKeys)) {
    http_response_code(400);
    echo json_encode(['message' => 'Argomento e almeno una chiave API attiva sono richiesti.']);
    ob_end_flush();
    exit();
}

// --- Funzioni di generazione per i vari modelli ---

/**
 * Funzione per generare il prompt per Gemini, replicando la logica del frontend.
 */
function getGeminiPrompt(string $topic, string $language, string $detailLevel, ?string $additionalContext = null): string {
    $detailInstruction = 'The output should be a well-balanced and comprehensive manual, suitable for daily clinical practice.';
    if ($detailLevel === 'Concise') {
        $detailInstruction = 'The output should be a concise summary, focusing only on the most critical points for each section. Keep it brief and to the point.';
    } elseif ($detailLevel === 'Detailed') {
        $detailInstruction = 'The output must be extremely detailed and exhaustive. For each section, provide in-depth explanations, cite specific evidence, discuss nuances, and explore related concepts. The manual should be comprehensive enough for a specialist.';
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
Output language: {$language}.
Required sources: Guidelines, systematic reviews, randomized controlled trials (preferably last 5-10 years).
{$mandatoryStructure}
{$additionalInstructions}
";
}

/**
 * Funzione per chiamare l'API di Google Gemini.
 */
function callGemini(string $apiKey, string $topic, string $language, string $detailLevel, ?string $additionalContext = null): array {
    try {
        $prompt = getGeminiPrompt($topic, $language, $detailLevel, $additionalContext);
        
        $client = GoogleAI::client($apiKey);
        $model = $client->geminiPro(); // O un altro modello come gemini-1.5-flash
        $response = $model->generateContent($prompt);

        return ['content' => $response->text(), 'sources' => []]; // La versione PHP SDK non espone facilmente le fonti di grounding come quella JS
    } catch (Exception $e) {
        error_log("Errore API Gemini: " . $e->getMessage());
        return ['content' => "## Errore Gemini\n\nImpossibile generare il manuale a causa di un errore: " . $e->getMessage(), 'sources' => []];
    }
}

/**
 * Funzioni mock per Claude e OpenAI, come nel frontend.
 */
function callClaudeMock(string $topic): array {
    return ['content' => "## Manuale su {$topic} (Generato da Anthropic Claude - Mock Backend)\n\nQuesto è un testo di prova generato dal backend.", 'sources' => []];
}

function callOpenAIMock(string $topic): array {
    return ['content' => "## Manuale su {$topic} (Generato da OpenAI ChatGPT - Mock Backend)\n\nQuesto è un testo di prova generato dal backend.", 'sources' => []];
}


// --- Logica Principale di Orchestrazione ---

$drafts = [];
$geminiKey = null;

foreach ($activeKeys as $apiKey) {
    switch ($apiKey->provider) {
        case 'Google Gemini':
            $geminiKey = $apiKey->key; // Salviamo la chiave di Gemini per la sintesi finale
            $result = callGemini($apiKey->key, $topic, $language, $detailLevel);
            $drafts[] = $result['content'];
            break;
        case 'Anthropic Claude':
            $result = callClaudeMock($topic);
            $drafts[] = $result['content'];
            break;
        case 'OpenAI ChatGPT':
            $result = callOpenAIMock($topic);
            $drafts[] = $result['content'];
            break;
    }
}

$finalContent = "";
$finalSources = [];

if (count($drafts) > 1 && $geminiKey) {
    // Se abbiamo più bozze e una chiave Gemini, usiamo Gemini per unirle.
    $combinedDrafts = implode("\n\n---\n\n", $drafts);
    $synthesisResult = callGemini($geminiKey, $topic, $language, $detailLevel, $combinedDrafts);
    $finalContent = $synthesisResult['content'];
    $finalSources = $synthesisResult['sources'];
} elseif (!empty($drafts)) {
    // Altrimenti, usiamo la prima (e unica) bozza generata.
    $finalContent = $drafts[0];
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Nessun modello è stato in grado di generare un contenuto.']);
    ob_end_flush();
    exit();
}

// Invia la risposta finale al frontend
http_response_code(200);
echo json_encode([
    'content' => $finalContent,
    'sources' => $finalSources
]);

ob_end_flush();
?>