package com.example.finger_schedule.repository

import com.example.finger_schedule.dto.ReviewComment
import org.springframework.data.jpa.repository.JpaRepository

interface ReviewCommentRepository : JpaRepository<ReviewComment, Long> {
    fun findAllByReviewIdOrderByCreatedAtAsc(reviewId: Long): List<ReviewComment>

    fun countByReviewId(reviewId: Long): Long
}
