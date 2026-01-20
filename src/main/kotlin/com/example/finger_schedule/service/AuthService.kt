package com.example.finger_schedule.service

import com.example.finger_schedule.domain.User
import com.example.finger_schedule.dto.LoginRequest
import com.example.finger_schedule.dto.LoginResponse
import com.example.finger_schedule.dto.SignupRequest
import com.example.finger_schedule.repository.UserRepository
import com.example.finger_schedule.security.JwtTokenProvider
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import com.example.finger_schedule.dto.OnboardingRequest

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider
) {

    // 📝 회원가입
    @Transactional
    fun signup(request: SignupRequest) {
        if (userRepository.existsByEmail(request.email)) {
            throw IllegalArgumentException("이미 가입된 이메일입니다.")
        }

        val encryptedPassword = passwordEncoder.encode(request.password)!!

        val user = User(
            email = request.email,
            password = encryptedPassword,
            nickname = request.nickname
        )
        userRepository.save(user)
    }

    // 🔑 로그인
    fun login(request: LoginRequest): LoginResponse {
        // 👇 [수정됨] .orElseThrow -> ?: throw
        val user = userRepository.findByEmail(request.email)
            ?: throw IllegalArgumentException("가입되지 않은 이메일입니다.")

        if (!passwordEncoder.matches(request.password, user.password)) {
            throw IllegalArgumentException("비밀번호가 틀렸습니다.")
        }

        val token = jwtTokenProvider.createToken(user.email)
        return LoginResponse(
            token = token,
            email = user.email,
            nickname = user.nickname,
            university = user.university,
            department = user.department,
            grade = user.grade
        )
    }

    // 🚀 온보딩 정보 업데이트
    @Transactional
    fun updateOnboarding(email: String, request: OnboardingRequest) {
        // 👇 [수정됨] .orElseThrow -> ?: throw
        val user = userRepository.findByEmail(email)
            ?: throw IllegalArgumentException("사용자를 찾을 수 없습니다.")

        user.university = request.university
        user.department = request.department
        user.grade = request.grade
    }
}