<?php
require_once 'config.php';
require_once 'vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Gestione della richiesta pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Funzione per decodificare il token e ottenere l'ID utente
function getUserIdFromToken() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader) return null;

    list($jwt) = sscanf($authHeader, 'Bearer %s');
    if (!$jwt) return null;

    try {
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        return $decoded->user->id;
    } catch (Exception $e) {
        return null;
    }
}

$userId = getUserIdFromToken();
if (!$userId) {
    http_response_code(401);
    echo json_encode(['message' => 'Accesso non autorizzato.']);
    exit();
}

$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Ottieni tutti i manuali salvati dall'utente
        $stmt = $conn->prepare("SELECT id, topic, language, detail_level, saved_at FROM manuals WHERE user_id = ? ORDER BY saved_at DESC");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $manuals = [];
        while ($row = $result->fetch_assoc()) {
            // Leggi il contenuto del file per ogni manuale
            $filePath = MANUALS_DIR . '/' . $row['id'] . '.md';
            if (file_exists($filePath)) {
                $row['content'] = file_get_contents($filePath);
                $row['sources'] = []; // Simula una lista vuota di fonti
                $manuals[] = $row;
            }
        }
        echo json_encode($manuals);
        break;

    case 'POST':
        // Salva un nuovo manuale
        $data = json_decode(file_get_contents("php://input"));
        $filePath = MANUALS_DIR . '/' . $data->id . '.md';
        file_put_contents($filePath, $data->content);

        $stmt = $conn->prepare("INSERT INTO manuals (id, user_id, topic, language, detail_level, file_path, saved_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sisssss", $data->id, $userId, $data->topic, $data->language, $data->detailLevel, $filePath, $data->savedAt);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode($data);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Errore nel salvataggio del manuale.']);
        }
        break;

    case 'PUT':
        // Aggiorna un manuale esistente
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'ID del manuale mancante.']);
            exit();
        }

        $data = json_decode(file_get_contents("php://input"));
        $filePath = MANUALS_DIR . '/' . $id . '.md';
        file_put_contents($filePath, $data->content);

        $stmt = $conn->prepare("UPDATE manuals SET topic = ?, language = ?, detail_level = ?, saved_at = ? WHERE id = ? AND user_id = ?");
        $stmt->bind_param("sssssi", $data->topic, $data->language, $data->detailLevel, $data->savedAt, $id, $userId);

        if ($stmt->execute()) {
            echo json_encode($data);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Errore nell\'aggiornamento del manuale.']);
        }
        break;

    case 'DELETE':
        // Elimina un manuale
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'ID del manuale mancante.']);
            exit();
        }
        
        // Prima elimina il file
        $filePath = MANUALS_DIR . '/' . $id . '.md';
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $stmt = $conn->prepare("DELETE FROM manuals WHERE id = ? AND user_id = ?");
        $stmt->bind_param("si", $id, $userId);

        if ($stmt->execute()) {
            http_response_code(204); // No Content
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Errore nell\'eliminazione del manuale.']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Metodo non consentito.']);
        break;
}

$conn->close();