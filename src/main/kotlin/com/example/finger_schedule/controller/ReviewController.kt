package com.example.finger_schedule.controller

import com.example.finger_schedule.dto.CreateReviewRequest
import com.example.finger_schedule.dto.Review
import com.example.finger_schedule.dto.ReviewSummaryResponse
import com.example.finger_schedule.dto.ReviewSummaryRow
import com.example.finger_schedule.repository.ReviewRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import kotlin.math.round
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = ["http://localhost:5173"])
class ReviewController(
    private val reviewRepository: ReviewRepository
) {
    private val logger = LoggerFactory.getLogger(ReviewController::class.java)
    // 강의별 리뷰 리스트
    @GetMapping
    fun getReviews(@RequestParam lectureId: String): ResponseEntity<List<Review>> {
        return ResponseEntity.ok(
            reviewRepository.findAllByLectureIdOrderByCreatedAtDesc(lectureId)
        )
    }

    // 강의별 요약(평균/개수)
    @GetMapping("/summary")
    fun getSummary(@RequestParam lectureId: String): ResponseEntity<ReviewSummaryResponse> {
        val count = reviewRepository.countByLectureId(lectureId)
        val avg = reviewRepository.avgRatingByLectureId(lectureId)
        return ResponseEntity.ok(
            ReviewSummaryResponse(
                lectureId = lectureId,
                count = count,
                averageRating = round(avg * 10) / 10.0
            )
        )
    }

    // 학교별 모든 강의 요약
    @GetMapping("/summary/all")
    fun getAllSummary(@RequestParam university: String): ResponseEntity<List<ReviewSummaryRow>> {
        logger.info("학교별 요약 조회: $university")
        val summaries = reviewRepository.summaryByUniversity(university)
        return ResponseEntity.ok(summaries)
    }

    // 리뷰 작성
    @PostMapping
    fun createReview(@RequestBody req: CreateReviewRequest): ResponseEntity<Any> {
        try {
            logger.info("리뷰 작성 요청: $req")
            
            val review = Review(
                lectureId = req.lectureId,
                university = req.university,
                userId = req.userId,
                userName = req.userName,
                rating = req.rating,
                semester = req.semester,
                content = req.content,
                assignmentAmount = req.assignmentAmount ?: "medium",
                teamProject = req.teamProject ?: "few",
                grading = req.grading ?: "normal",
                attendance = req.attendance ?: "direct",
                examCount = req.examCount ?: 2
            )
            
            logger.info("저장할 Review 객체: $review")
            val saved = reviewRepository.save(review)
            logger.info("저장 성공: ${saved.id}")
            
            return ResponseEntity.ok(saved)
        } catch (e: Exception) {
            logger.error("리뷰 저장 중 오류 발생", e)
            return ResponseEntity.status(500).body(mapOf(
                "error" to e.message,
                "details" to e.stackTraceToString()
            ))
        }
    }
}
