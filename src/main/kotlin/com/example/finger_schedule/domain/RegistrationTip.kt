package com.example.finger_schedule.domain

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "registration_tip")
class RegistrationTip(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val university: String,

    @Column(nullable = false)
    val userId: String,

    @Column(nullable = false)
    val userName: String,

    @Column(nullable = false)
    val department: String,

    @Column(nullable = false)
    var category: String, // strategy, technical, course, general

    @Column(nullable = false)
    var title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Column(nullable = false)
    var likesCount: Int = 0,

    @Column(nullable = false)
    var commentsCount: Int = 0,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = true)
    var isAnonymous: Boolean? = false
)
