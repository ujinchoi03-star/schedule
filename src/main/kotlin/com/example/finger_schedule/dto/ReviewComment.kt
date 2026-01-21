package com.example.finger_schedule.dto

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "review_comment")
class ReviewComment(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(nullable = false)
    var reviewId: Long = 0,

    @Column(nullable = false)
    var userId: String = "",

    @Column(nullable = false)
    var userName: String = "",

    @Column(columnDefinition = "TEXT", nullable = false)
    var content: String = "",

    @Column(nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)
