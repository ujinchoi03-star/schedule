package com.example.finger_schedule.dto

data class ReviewSummaryRow(
    val lectureId: String,
    val count: Long,
    val averageRating: Double,
    val professor: String // 🚀 [추가] 교수님별 통계 분리
)