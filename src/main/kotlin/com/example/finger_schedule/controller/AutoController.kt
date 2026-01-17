package com.example.finger_schedule.controller

import com.example.finger_schedule.dto.LoginRequest
import com.example.finger_schedule.dto.LoginResponse
import com.example.finger_schedule.dto.SignupRequest
import com.example.finger_schedule.service.AuthService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {

    // 회원가입 API
    @PostMapping("/signup")
    fun signup(@RequestBody request: SignupRequest): ResponseEntity<String> {
        authService.signup(request)
        return ResponseEntity.ok("회원가입 성공! 🎉")
    }

    // 로그인 API
    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest): ResponseEntity<LoginResponse> {
        val response = authService.login(request)
        return ResponseEntity.ok(response)
    }
}