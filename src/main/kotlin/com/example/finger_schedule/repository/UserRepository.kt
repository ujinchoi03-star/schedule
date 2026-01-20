package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.User
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<User, String> {

    // 중복 가입 방지용
    fun existsByEmail(email: String): Boolean

    // 👇 이거 하나만 남기면 됩니다! (반환 타입을 User? 로 통일)
    fun findByEmail(email: String): User?
}