<?php
// Mostra tutti gli errori per il debug (da rimuovere in produzione)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Impostazioni del Database
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Sostituisci con il tuo utente del database
define('DB_PASS', 'Locilocorum1996'); // Sostituisci con la tua password
define('DB_NAME', 'manual_generator_db');

// Chiave segreta per il JWT (JSON Web Token)
// Cambia questa stringa con una tua stringa segreta e casuale
define('JWT_SECRET', 'LA_TUA_CHIAVE_SEGRETA_SUPER_CASUALE_E_LUNGA');

// Cartella dove salvare i manuali in formato Markdown
define('MANUALS_DIR', __DIR__ . '/../manuals_storage');

// Funzione di connessione al database
function getDbConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode(['message' => 'Errore di connessione al database: ' . $conn->connect_error]));
    }
    return $conn;
}

// Crea la directory per i manuali se non esiste
if (!is_dir(MANUALS_DIR)) {
    mkdir(MANUALS_DIR, 0777, true);
}