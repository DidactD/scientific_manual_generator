<?php
require_once 'config.php';
// ... (includi qui la logica di autenticazione con JWT come in manuals.php)

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));
$topic = $data->topic ?? 'argomento sconosciuto';

// In una vera implementazione, qui chiameresti le API di Gemini/Claude/OpenAI
// usando le chiavi API salvate sul server.

// Per ora, restituiamo un contenuto mock come fa il frontend.
$mockContent = "
## 1. Titolo
Manuale su {$topic} (Generato dal Backend PHP - Mock)

## 2. Introduzione
Questo è un manuale generato dal backend per dimostrare il flusso.
In un'applicazione reale, questo contenuto verrebbe dall'API di un modello di IA.
";

http_response_code(200);
echo json_encode([
    'content' => $mockContent,
    'sources' => []
]);