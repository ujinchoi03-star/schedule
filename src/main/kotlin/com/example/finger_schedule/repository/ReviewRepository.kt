package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.Review
import com.example.finger_schedule.dto.ReviewSummaryRow
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ReviewRepository : JpaRepository<Review, Long> {

    fun findAllByLectureIdOrderByCreatedAtDesc(lectureId: String): List<Review>

    // 🚀 [추가] 학수번호 + 교수님 이름으로 리뷰 찾기
    fun findAllByLectureIdAndProfessorOrderByCreatedAtDesc(lectureId: String, professor: String): List<Review>

    fun countByLectureId(lectureId: String): Long

    // 🚀 [추가] 교수님별 개수 조회
    fun countByLectureIdAndProfessor(lectureId: String, professor: String): Long

    fun findAllByUserIdOrderByCreatedAtDesc(userId: String): List<Review>

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.lectureId = :lectureId")
    fun avgRatingByLectureId(@Param("lectureId") lectureId: String): Double

    // 🚀 [추가] 교수님별 평점 조회
    @Query("select coalesce(avg(r.rating), 0) from Review r where r.lectureId = :lectureId and r.professor = :professor")
    fun avgRatingByLectureIdAndProfessor(@Param("lectureId") lectureId: String, @Param("professor") professor: String): Double

    @Query(
        """
        select new com.example.finger_schedule.dto.ReviewSummaryRow(
            r.lectureId,
            count(r),
            coalesce(avg(r.rating), 0),
            r.professor
        )
        from Review r
        where r.university = :university
        group by r.lectureId, r.professor
        """
    )
    fun summaryByUniversity(@Param("university") university: String): List<ReviewSummaryRow>
}
