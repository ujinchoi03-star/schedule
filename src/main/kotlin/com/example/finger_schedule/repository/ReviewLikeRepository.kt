package com.example.finger_schedule.repository

import com.example.finger_schedule.dto.ReviewLike
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ReviewLikeRepository : JpaRepository<ReviewLike, Long> {
    fun findByReviewIdAndUserId(reviewId: Long, userId: String): List<ReviewLike>

    fun deleteByReviewIdAndUserId(reviewId: Long, userId: String): Long

    @Query("select count(l) from ReviewLike l where l.reviewId = :reviewId")
    fun countByReviewId(reviewId: Long): Long

    @Query("SELECT l.reviewId FROM ReviewLike l WHERE l.userId = :userId AND l.reviewId IN (SELECT r.id FROM Review r WHERE r.lectureId = :lectureId)")
    fun findReviewIdsByUserIdAndLectureId(userId: String, lectureId: String): List<Long>
}
