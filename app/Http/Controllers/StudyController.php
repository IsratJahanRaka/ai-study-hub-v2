<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AITeacherService;

class StudyController extends Controller
{
    protected $aiTeacher;

    public function __construct(AITeacherService $aiTeacher)
    {
        // সার্ভিসটি সরাসরি .env থেকে API Key সংগ্রহ করবে
        $this->aiTeacher = $aiTeacher;
    }

    public function upload(Request $request)
    {
        // এখানে ফাইল আপলোড হ্যান্ডেল করা যায়। আপাতত ডেমো রেসপন্স পাঠানো হচ্ছে
        return response()->json([
            'status' => 'success',
            'data' => [
                'summary' => 'এটি একটি আপলোড করা ডকুমেন্টের সামারি।',
                'topics' => ['Topic 1', 'Topic 2', 'Topic 3']
            ]
        ]);
    }

    public function chat(Request $request)
    {
        // ইউজারের মেসেজ প্রসেস করা হচ্ছে
        $reply = $this->aiTeacher->askTeacher($request->message, $request->context);
        
        return response()->json([
            'status' => 'success',
            'reply' => $reply
        ]);
    }
}