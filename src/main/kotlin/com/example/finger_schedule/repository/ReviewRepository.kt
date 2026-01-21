package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.Review
import com.example.finger_schedule.dto.ReviewSummaryRow
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ReviewRepository : JpaRepository<Review, Long> {

    fun findAllByLectureIdOrderByCreatedAtDesc(lectureId: String): List<Review>

    fun countByLectureId(lectureId: String): Long

    fun findAllByUserIdOrderByCreatedAtDesc(userId: String): List<Review>

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.lectureId = :lectureId")
    fun avgRatingByLectureId(@Param("lectureId") lectureId: String): Double

    @Query(
        """
        select new com.example.finger_schedule.dto.ReviewSummaryRow(
            r.lectureId,
            count(r),
            coalesce(avg(r.rating), 0)
        )
        from Review r
        where r.university = :university
        group by r.lectureId
        """
    )
    fun summaryByUniversity(@Param("university") university: String): List<ReviewSummaryRow>
}
