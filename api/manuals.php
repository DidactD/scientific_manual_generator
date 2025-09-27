<?php
ob_start();

require_once 'vendor/autoload.php';
require_once 'config.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit();
}

// In api/manuals.php

// SOSTITUISCI LA VECCHIA FUNZIONE getUserIdFromToken CON QUESTA
function getUserIdFromToken() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader) {
        // Registra l'errore nel file di log di PHP
        error_log("Errore JWT: Intestazione Authorization mancante.");
        return null;
    }

    list($jwt) = sscanf($authHeader, 'Bearer %s');
    if (!$jwt) {
        error_log("Errore JWT: Token non trovato nell'intestazione Bearer.");
        return null;
    }

    try {
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        return $decoded->user->id;
    } catch (Exception $e) {
        // Registra il messaggio esatto dell'eccezione nel file di log di PHP
        error_log("Errore Decodifica JWT: " . $e->getMessage());
        return null;
    }
}

$userId = getUserIdFromToken();
if (!$userId) {
    http_response_code(401);
    echo json_encode(['message' => 'Accesso non autorizzato. Token non valido o mancante.']);
    ob_end_flush();
    exit();
}

$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Il resto dello script (switch case per GET, POST, etc.) rimane identico
switch ($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT id, topic, language, detail_level, saved_at FROM manuals WHERE user_id = ? ORDER BY saved_at DESC");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $manuals = [];
        while ($row = $result->fetch_assoc()) {
            $filePath = MANUALS_DIR . '/' . $row['id'] . '.md';
            if (file_exists($filePath)) {
                $row['content'] = file_get_contents($filePath);
                $row['sources'] = [];
                $manuals[] = $row;
            }
        }
        echo json_encode($manuals);
        break;

    case 'POST':
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
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'ID del manuale mancante.']);
            exit();
        }
        $filePath = MANUALS_DIR . '/' . $id . '.md';
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        $stmt = $conn->prepare("DELETE FROM manuals WHERE id = ? AND user_id = ?");
        $stmt->bind_param("si", $id, $userId);
        if ($stmt->execute()) {
            http_response_code(204);
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
ob_end_flush();
?>