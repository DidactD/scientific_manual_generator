<?php
// Questo file non ha dipendenze esterne. Serve solo a testare la connessione.

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Gestione della richiesta pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Se la richiesta non è OPTIONS, invia una risposta di successo.
http_response_code(200);
echo json_encode(['status' => 'success', 'message' => 'Il server di test CORS funziona!']);
?>