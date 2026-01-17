package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface UserRepository : JpaRepository<User, Long> {
    // 이메일로 로그인하니까 이메일로 찾는 기능 필수!
    fun findByEmail(email: String): Optional<User>

    // 중복 가입 방지용
    fun existsByEmail(email: String): Boolean
}