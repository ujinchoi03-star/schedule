package com.example.finger_schedule.dto

import java.time.LocalDateTime

data class RegistrationTipResponse(
    val id: Long,
    val university: String,
    val userId: String,
    val userName: String,
    val department: String,
    val category: String,
    val title: String,
    val content: String,
    val likesCount: Int,
    val commentsCount: Int,
    val createdAt: LocalDateTime,
    val likedByUser: Boolean = false, // 내가 좋아요 눌렀는지 여부
    val scrapedByUser: Boolean = false, // 내가 스크랩 했는지 여부
    val isAnonymous: Boolean = false // 익명 여부
)

data class CreateRegistrationTipRequest(
    val title: String,
    val content: String,
    val category: String,
    val university: String,
    val userId: String,
    val userName: String,
    val department: String,
    val isAnonymous: Boolean = false
)

data class CreateTipCommentRequest(
    val content: String,
    val userId: String,
    val userName: String
)
