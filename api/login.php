<?php
// Mettiamo questo all'inizio per assicurarci che nessun output venga inviato prematuramente
ob_start();

// Header per gestire il CORS - Assicuriamoci che siano la prima cosa in assoluto
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Gestione della richiesta pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    // Puliamo il buffer e terminiamo lo script
    ob_end_flush();
    exit();
}

// Includiamo la configurazione DOPO aver gestito la richiesta OPTIONS
require_once 'config.php';

// Testiamo subito la connessione al DB per trovare eventuali errori
$conn = getDbConnection();
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['message' => 'Errore critico di connessione al database: ' . $conn->connect_error]);
    ob_end_flush();
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Email e password sono obbligatori.']);
    ob_end_flush();
    exit();
}

$stmt = $conn->prepare("SELECT id, name, email, password FROM users WHERE email = ?");
$stmt->bind_param("s", $data->email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($data->password, $user['password'])) {
        http_response_code(200);
        echo json_encode([
            'token' => 'un_token_fittizio_per_il_test',
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['message' => 'Credenziali non valide.']);
    }
} else {
    http_response_code(401);
    echo json_encode(['message' => 'Credenziali non valide.']);
}

$stmt->close();
$conn->close();

// Inviamo l'output finale
ob_end_flush();
?>