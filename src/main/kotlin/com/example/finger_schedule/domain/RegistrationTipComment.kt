package com.example.finger_schedule.domain

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "registration_tip_comment")
class RegistrationTipComment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val tipId: Long,

    @Column(nullable = false)
    val userId: String,

    @Column(nullable = false)
    val userName: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
