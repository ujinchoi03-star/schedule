package com.example.finger_schedule.domain // 🚀 dto에서 domain으로 변경

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