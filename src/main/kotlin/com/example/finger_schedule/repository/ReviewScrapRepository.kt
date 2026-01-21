package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.ReviewScrap // 🚀 domain 패키지로 변경
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ReviewScrapRepository : JpaRepository<ReviewScrap, Long> {
    fun findByReviewIdAndUserId(reviewId: Long, userId: String): List<ReviewScrap>
    fun findByUserId(userId: String): List<ReviewScrap>
    fun deleteByReviewId(reviewId: Long)
}