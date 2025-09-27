<?php
ob_start();

require_once 'vendor/autoload.php';
require_once 'config.php';

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
        $detailInstruction = 'The output should be a concise summary...';
    } elseif ($detailLevel === 'Detailed') {
        $detailInstruction = 'The output must be extremely detailed and exhaustive...';
    }

    $deepSearchInstruction = "";
    if ($isDeepSearch) {
        $deepSearchInstruction = "\nDEEP SEARCH MODE: You must perform a more rigorous, multi-step research process...";
    }
    
    $mandatoryStructure = "\nMandatory structure (typical of specialized texts):...";
    $additionalInstructions = "\nAdditional instruction: ...";

    if ($additionalContext) {
        return "Initialization: You are an expert medical editor...\nProvided Drafts from other models:\n{$additionalContext}\n---\nObjective: Review the drafts...{$deepSearchInstruction}\n...{$mandatoryStructure}{$additionalInstructions}";
    }
    return "Initialization: You are a virtual assistant...\nObjective: To produce an exhaustive text...{$deepSearchInstruction}\n...{$mandatoryStructure}{$additionalInstructions}";
}

function callGemini(string $apiKey, string $model, string $topic, string $language, string $detailLevel, bool $isDeepSearch, ?string $additionalContext = null): array {
    try {
        $prompt = getGeminiPrompt($topic, $language, $detailLevel, $isDeepSearch, $additionalContext);
        $client = \Gemini::client($apiKey);
        $response = $client->geminiPro()->generateContent($prompt);
        return ['content' => $response->text(), 'sources' => []];
    } catch (Exception $e) {
        return ['content' => "## Errore Gemini\n\nImpossibile generare il manuale: " . $e->getMessage(), 'sources' => []];
    }
}

function callOpenAI(string $apiKey, string $model, string $topic, string $language): array {
    try {
        $client = \OpenAI::client($apiKey);
        $prompt = "Write a brief medical manual on the topic: '{$topic}'.";
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
        $client = \Anthropic::client($apiKey);
        $prompt = "Write a brief medical manual on the topic: '{$topic}'.";
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

// Logica di Orchestrazione
$drafts = [];
$geminiKey = null;
$geminiModel = null;

foreach ($activeKeys as $apiKey) {
    switch ($apiKey->provider) {
        case 'Google Gemini':
            $geminiKey = $apiKey->key;
            $geminiModel = $apiKey->model;
            $result = callGemini($apiKey->key, $apiKey->model, $topic, $language, $detailLevel, $isDeepSearch);
            $drafts[] = $result['content'];
            break;
        case 'Anthropic Claude':
            $result = callClaude($apiKey->key, $apiKey->model, $topic, $language);
            $drafts[] = $result['content'];
            break;
        case 'OpenAI ChatGPT':
            $result = callOpenAI($apiKey->key, $apiKey->model, $topic, $language);
            $drafts[] = $result['content'];
            break;
    }
}

$finalContent = "";
$finalSources = [];

if (count($drafts) > 1 && $geminiKey) {
    $combinedDrafts = implode("\n\n---\n\n", $drafts);
    $synthesisResult = callGemini($geminiKey, $geminiModel, $topic, $language, $detailLevel, $isDeepSearch, $combinedDrafts);
    $finalContent = $synthesisResult['content'];
} elseif (!empty($drafts)) {
    $finalContent = $drafts[0];
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Nessun modello è stato in grado di generare un contenuto.']);
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