package com.example.finger_schedule.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
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

    @Column(nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    var commentsCount: Long = 0,

    @Column(nullable = true)
    var isAnonymous: Boolean? = false,

    // 🚀 [추가] 교수님별 분리를 위한 필드
    // 🚀 [추가] 교수님별 분리를 위한 필드
    @Column(nullable = false, columnDefinition = "VARCHAR(255) DEFAULT ''")
    var professor: String = ""
)