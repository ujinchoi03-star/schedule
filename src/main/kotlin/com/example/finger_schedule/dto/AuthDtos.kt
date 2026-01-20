package com.example.finger_schedule.dto

// 🌟 물음표(?) 절대 금지!
data class SignupRequest(
    val email: String,
    val password: String,
    val nickname: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val nickname: String,
    val email: String,
    val university: String? = null,
    val department: String? = null,
    val grade: Int? = null
)

data class OnboardingRequest(
    val university: String,
    val department: String,
    val grade: Int
)