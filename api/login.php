<?php
ob_start();

// Includiamo la libreria installata da Composer
require_once 'vendor/autoload.php';
require_once 'config.php';

// Usiamo la classe JWT
use \Firebase\JWT\JWT;

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit();
}

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
        // --- SEZIONE JWT (JSON Web Token) ---
        // Ora generiamo un VERO token
        $payload = [
            'iss' => "your-app-name", // Chi ha emesso il token
            'iat' => time(), // Quando è stato emesso
            'exp' => time() + (60 * 60 * 24), // Scadenza (es. 24 ore)
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email']
            ]
        ];

        // Codifichiamo il token usando la chiave segreta definita in config.php
        $jwt = JWT::encode($payload, JWT_SECRET, 'HS256');

        http_response_code(200);
        echo json_encode([
            'token' => $jwt,
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
ob_end_flush();
?>