package com.example.finger_schedule.controller

import com.example.finger_schedule.dto.LoginRequest
import com.example.finger_schedule.dto.LoginResponse
import com.example.finger_schedule.dto.SignupRequest
import com.example.finger_schedule.service.AuthService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import com.example.finger_schedule.dto.OnboardingRequest

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = ["http://localhost:5173","http://127.0.0.1:5173"])
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

    @PatchMapping("/onboarding")
    fun onboarding(@RequestBody request: OnboardingRequest, principal: java.security.Principal): ResponseEntity<String> {
        // principal.name에는 현재 로그인한 유저의 email이 들어있습니다.
        authService.updateOnboarding(principal.name, request)
        return ResponseEntity.ok("온보딩 정보 저장 완료!")
    }
}