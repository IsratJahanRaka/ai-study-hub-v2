<?php

error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable HTML output of errors

header('Content-Type: application/json');

// Catch any fatal errors and output as JSON
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        echo json_encode(['success' => false, 'error' => 'Fatal PHP Error: ' . $error['message'] . ' in ' . $error['file'] . ' on line ' . $error['line']]);
        exit;
    }
});

try {
    // Read .env file
    $envFile = __DIR__ . '/.env';
    $apiKey = '';

    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) == 2 && trim($parts[0]) === 'OPENAI_API_KEY') {
                $apiKey = trim($parts[1]);
                break;
            }
        }
    }

    if (empty($apiKey)) {
        echo json_encode(['success' => false, 'error' => 'API Key is missing from .env file']);
        exit;
    }

    $inputRaw = file_get_contents('php://input');
    $input = json_decode($inputRaw, true);

    if (!$input || !isset($input['action']) || !isset($input['fileName'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid request payload']);
        exit;
    }

    $action = $input['action'];
    $fileName = $input['fileName'];

    if ($action === 'summary') {
        $prompt = "Act as an AI study assistant. The user uploaded a document named '$fileName'. Generate a concise and structured educational summary based on the subject implied by the filename. Format beautifully using HTML (paragraphs, unordered lists with bold text). DO NOT wrap in markdown code blocks, just return raw HTML elements.";
    } else {
        $prompt = "Act as an AI study assistant. The user uploaded a document named '$fileName'. Generate a 3-question multiple-choice quiz based on the subject implied by the filename. Format beautifully using clean semantic HTML elements. DO NOT wrap in markdown code blocks, just return raw HTML.";
    }

    $postData = [
        'model' => 'gpt-4o',
        'messages' => [
            ['role' => 'system', 'content' => 'You are Study.AI Pro, a helpful, intelligent AI study assistant.'],
            ['role' => 'user', 'content' => $prompt]
        ]
    ];

    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\nAuthorization: Bearer " . $apiKey . "\r\n",
            'method'  => 'POST',
            'content' => json_encode($postData),
            'ignore_errors' => true
        ],
        'ssl' => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ]
    ];
    
    $context  = stream_context_create($options);
    $responseRaw = @file_get_contents('https://api.openai.com/v1/chat/completions', false, $context);

    if ($responseRaw === false) {
        $errorMsg = error_get_last()['message'] ?? 'Failed to connect to OpenAI API';
        echo json_encode(['success' => false, 'error' => $errorMsg]);
        exit;
    }

    $responseData = json_decode($responseRaw, true);

    if (isset($responseData['error'])) {
        echo json_encode(['success' => false, 'error' => $responseData['error']['message'] ?? 'OpenAI API Error']);
        exit;
    }

    $reply = $responseData['choices'][0]['message']['content'] ?? 'No response received.';

    // Additional cleanup
    $reply = preg_replace('/^```html\s*/i', '', $reply);
    $reply = preg_replace('/\s*```$/', '', $reply);

    echo json_encode(['success' => true, 'data' => trim($reply)]);

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => 'Server Exception: ' . $e->getMessage()]);
}
