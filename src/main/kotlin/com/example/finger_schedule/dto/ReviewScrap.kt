package com.example.finger_schedule.dto

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "review_scrap")
class ReviewScrap(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val reviewId: Long,

    @Column(nullable = false)
    val userId: String,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
