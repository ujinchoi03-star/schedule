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

        // 👇 [핵심 수정]
        // 1. 'rawPassword =' 글자를 지우세요. (이게 범인입니다!)
        // 2. 끝에 '!!'를 붙여서 "이건 무조건 문자열이야"라고 확정 지어주세요.
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
        val user = userRepository.findByEmail(request.email)
            .orElseThrow { IllegalArgumentException("가입되지 않은 이메일입니다.") }

        if (!passwordEncoder.matches(request.password, user.password)) {
            throw IllegalArgumentException("비밀번호가 틀렸습니다.")
        }

        val token = jwtTokenProvider.createToken(user.email)
        return LoginResponse(token = token, nickname = user.nickname)
    }
}