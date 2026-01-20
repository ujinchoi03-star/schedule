package com.example.finger_schedule.dto

import java.time.LocalDateTime

data class ReviewResponse(
    val id: Long,
    val lectureId: String,
    val university: String,
    val userId: String,
    val userName: String,
    val rating: Int,
    val semester: String,
    val content: String,
    val assignmentAmount: String,
    val teamProject: String,
    val grading: String,
    val attendance: String,
    val examCount: Int,
    val createdAt: LocalDateTime,
    val likesCount: Long,
    val commentsCount: Long,
    val likedByUser: Boolean,
    val scrapedByUser: Boolean,
    val lectureName: String? = null,
    val professor: String? = null,
    val isAnonymous: Boolean = false
)
