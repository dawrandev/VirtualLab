<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Legacy simulation route (redirect to lab1)
Route::get('/simulation', function () {
    return redirect('/labs/lab1');
});

// Labs routes
Route::prefix('labs')->group(function () {
    // Lab 1: Bacterial Smear Preparation
    Route::get('/lab1', function () {
        return view('labs.lab1-bacterial-smear.index');
    })->name('lab1');
});
