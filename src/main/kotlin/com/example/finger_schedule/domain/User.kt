package com.example.finger_schedule.domain  // 👈 이 부분이 중요합니다!

import jakarta.persistence.*

@Entity
@Table(name = "users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, unique = true)
    val email: String,

    @Column(nullable = false)
    val password: String,

    @Column(nullable = false)
    val nickname: String,

    // ✨ 아래 3줄을 추가하세요 (null 허용으로 시작하는 게 가입 시 편합니다)
    var university: String? = null,
    var department: String? = null,
    var grade: Int? = null
)