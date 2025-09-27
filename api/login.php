<?php
require_once 'config.php';
require_once 'vendor/autoload.php'; // Se usi Composer per JWT

use \Firebase\JWT\JWT;

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Permetti richieste da qualsiasi origine
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Email e password sono obbligatori.']);
    exit();
}

$conn = getDbConnection();
$stmt = $conn->prepare("SELECT id, name, email, password FROM users WHERE email = ?");
$stmt->bind_param("s", $data->email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($data->password, $user['password'])) {
        $payload = [
            'iss' => "your-app-name", // Issuer
            'aud' => "your-app-name", // Audience
            'iat' => time(), // Issued at
            'exp' => time() + (60*60*24), // Scadenza (es. 24 ore)
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email']
            ]
        ];

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