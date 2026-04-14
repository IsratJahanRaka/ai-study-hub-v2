<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudyController;

Route::post('/upload-material', [StudyController::class, 'upload']);
Route::post('/chat-with-teacher', [StudyController::class, 'chat']);