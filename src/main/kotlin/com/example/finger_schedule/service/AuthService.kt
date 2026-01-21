package com.example.finger_schedule.service

import com.example.finger_schedule.domain.User
import com.example.finger_schedule.dto.LoginRequest
import com.example.finger_schedule.dto.LoginResponse
import com.example.finger_schedule.dto.OnboardingRequest
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

    // 👇 [추가] 한글 학교명을 영어 코드로 바꿔주는 마법의 함수
    private fun convertToUniversityCode(input: String?): String {
        return when (input) {
            "한양대학교", "한양대", "HANYANG" -> "HANYANG"
            "고려대학교", "고려대", "KOREA" -> "KOREA"
            else -> "KOREA" // 기본값 (혹은 에러 처리)
        }
    }

    // 📝 회원가입
    @Transactional
    fun signup(request: SignupRequest) {
        if (userRepository.existsByEmail(request.email)) {
            throw IllegalArgumentException("이미 가입된 이메일입니다.")
        }

        val encryptedPassword = passwordEncoder.encode(request.password)!!

        val finalUniversity = request.university?.let { convertToUniversityCode(it) }

        val user = User(
            email = request.email,
            password = encryptedPassword,
            nickname = request.nickname,

            university = finalUniversity
        )
        userRepository.save(user)
    }

    // 🔑 로그인
    fun login(request: LoginRequest): LoginResponse {
        // [내 코드 방식 유지] 코틀린스러운 null 처리 (?: throw)
        val user = userRepository.findByEmail(request.email)
            ?: throw IllegalArgumentException("가입되지 않은 이메일입니다.")

        if (!passwordEncoder.matches(request.password, user.password)) {
            throw IllegalArgumentException("비밀번호가 틀렸습니다.")
        }

        val token = jwtTokenProvider.createToken(user.email)

        // 🌟 [중요] 내 기능(email) + 동료 기능(id) 합체!
        return LoginResponse(
            token = token,
            email = user.email,       // 프론트엔드 localStorage 저장용 (필수)
            nickname = user.nickname,
            university = user.university,
            department = user.department,
            grade = user.grade,
            id = user.id!!            // 리뷰/팁 작성 시 식별용 (동료 코드 반영)
        )
    }

    // 🚀 온보딩 정보 업데이트
    @Transactional
    fun updateOnboarding(email: String, request: OnboardingRequest) {
        // [내 코드 방식 유지]
        val user = userRepository.findByEmail(email)
            ?: throw IllegalArgumentException("사용자를 찾을 수 없습니다.")

        user.university = convertToUniversityCode(request.university)
        user.university = request.university
        user.department = request.department
        user.grade = request.grade
    }
}