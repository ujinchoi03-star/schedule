package com.example.finger_schedule.dto

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "review")
class Review(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(nullable = false)
    var lectureId: String = "",

    @Column(nullable = false)
    var university: String = "",

    @Column(nullable = false)
    var userId: String = "",

    @Column(nullable = false)
    var userName: String = "",

    @Column(nullable = false)
    var rating: Int = 5,

    @Column(nullable = false)
    var semester: String = "",

    @Column(columnDefinition = "TEXT", nullable = false)
    var content: String = "",

    @Column(nullable = false)
    var assignmentAmount: String = "medium", // low/medium/high

    @Column(nullable = false)
    var teamProject: String = "few", // none/few/many

    @Column(nullable = false)
    var grading: String = "normal", // generous/normal/strict

    @Column(nullable = false)
    var attendance: String = "direct", // none/direct/electronic/assignment

    @Column(nullable = false)
    var examCount: Int = 2,

    @Column(nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    var likesCount: Long = 0,
)
