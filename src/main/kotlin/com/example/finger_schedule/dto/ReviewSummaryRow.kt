package com.example.finger_schedule.dto

data class ReviewSummaryRow(
    val lectureId: String,
    val count: Long,
    val averageRating: Double
)