package com.example.finger_schedule.dto

data class CreateReviewRequest(
    val lectureId: String,
    val university: String,
    val userId: String,
    val userName: String,
    val rating: Int,
    val semester: String,
    val content: String,
    val assignmentAmount: String? = null,
    val teamProject: String? = null,
    val grading: String? = null,
    val attendance: String? = null,
    val examCount: Int? = null,
    val isAnonymous: Boolean = false
)

data class ReviewSummaryResponse(
    val lectureId: String,
    val count: Long,
    val averageRating: Double
)
