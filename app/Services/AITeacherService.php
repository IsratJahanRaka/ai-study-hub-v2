<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;

class AITeacherService
{
    public function askTeacher($userMessage, $context)
    {
        // চ্যাটবটকে টিচার হিসেবে রোল দেওয়া হচ্ছে
        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o',
            'messages' => [
                [
                    'role' => 'system', 
                    'content' => "You are a professional teacher. Help the student understand the following material: " . $context
                ],
                ['role' => 'user', 'content' => $userMessage]
            ],
        ]);

        return $response->choices[0]->message->content;
    }
}