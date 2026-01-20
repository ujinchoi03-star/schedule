package com.example.finger_schedule.repository

import com.example.finger_schedule.dto.ReviewScrap
import org.springframework.data.jpa.repository.JpaRepository

interface ReviewScrapRepository : JpaRepository<ReviewScrap, Long> {
    fun findByReviewIdAndUserId(reviewId: Long, userId: String): List<ReviewScrap>
    fun findByUserId(userId: String): List<ReviewScrap>
    fun deleteByReviewId(reviewId: Long)
}
