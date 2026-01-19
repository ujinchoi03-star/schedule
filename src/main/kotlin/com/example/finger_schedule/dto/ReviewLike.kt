package com.example.finger_schedule.dto

import jakarta.persistence.*

@Entity
@Table(name = "review_like")
class ReviewLike(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(nullable = false)
    var reviewId: Long = 0,

    @Column(nullable = false)
    var userId: String = "",
)
