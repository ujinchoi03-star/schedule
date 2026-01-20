package com.example.finger_schedule.controller

import com.example.finger_schedule.dto.CreateReviewRequest
import com.example.finger_schedule.dto.Review
import com.example.finger_schedule.dto.ReviewSummaryResponse
import com.example.finger_schedule.dto.ReviewSummaryRow
import com.example.finger_schedule.dto.ReviewComment
import com.example.finger_schedule.dto.ReviewLike
import com.example.finger_schedule.dto.ReviewResponse
import com.example.finger_schedule.repository.ReviewRepository
import com.example.finger_schedule.repository.ReviewCommentRepository
import com.example.finger_schedule.repository.ReviewLikeRepository
import com.example.finger_schedule.repository.ReviewScrapRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.transaction.annotation.Transactional
import kotlin.math.round
import org.slf4j.LoggerFactory

data class LikeResponse(
    val reviewId: Long,
    val liked: Boolean,
    val likesCount: Long
)

data class CreateCommentRequest(
    val reviewId: Long,
    val userId: String,
    val userName: String,
    val content: String
)

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = ["http://localhost:5173"])
class ReviewController(
    private val reviewRepository: ReviewRepository,
    private val commentRepository: ReviewCommentRepository,
    private val likeRepository: ReviewLikeRepository,
    private val scrapRepository: ReviewScrapRepository,
    private val lectureRepository: com.example.finger_schedule.repository.LectureRepository
) {
    private val logger = LoggerFactory.getLogger(ReviewController::class.java)
    // 강의별 리뷰 리스트
    @GetMapping
    fun getReviews(
        @RequestParam lectureId: String,
        @RequestParam(required = false) userId: String?
    ): ResponseEntity<List<ReviewResponse>> {
        val reviews = reviewRepository.findAllByLectureIdOrderByCreatedAtDesc(lectureId)
        // String ID로 조회
        val lecture = lectureRepository.findOneById(lectureId)
        val lName = lecture?.name
        val lProf = lecture?.professor
        
        val response = reviews.map { review ->
            val liked = if (userId != null) likeRepository.findByReviewIdAndUserId(review.id, userId).isNotEmpty() else false
            val scraped = if (userId != null) scrapRepository.findByReviewIdAndUserId(review.id, userId).isNotEmpty() else false
            
            ReviewResponse(
                id = review.id,
                lectureId = review.lectureId,
                university = review.university,
                userId = review.userId,
                userName = review.userName,
                rating = review.rating,
                semester = review.semester,
                content = review.content,
                assignmentAmount = review.assignmentAmount,
                teamProject = review.teamProject,
                grading = review.grading,
                attendance = review.attendance,
                examCount = review.examCount,
                createdAt = review.createdAt,
                likesCount = review.likesCount,
                commentsCount = review.commentsCount,
                likedByUser = liked,
                scrapedByUser = scraped,
                lectureName = lName,
                professor = lProf,
                isAnonymous = review.isAnonymous ?: false
            )
        }
        return ResponseEntity.ok(response)
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
                userName = if (req.isAnonymous) "익명" else req.userName,
                rating = req.rating,
                semester = req.semester,
                content = req.content,
                assignmentAmount = req.assignmentAmount ?: "medium",
                teamProject = req.teamProject ?: "few",
                grading = req.grading ?: "normal",
                attendance = req.attendance ?: "direct",
                examCount = req.examCount ?: 2,
                isAnonymous = req.isAnonymous
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

    // 좋아요 토글
    @PostMapping("/{reviewId}/like")
    @Transactional
    fun toggleLike(
        @PathVariable reviewId: Long,
        @RequestParam userId: String
    ): ResponseEntity<Any> {
        return try {
            logger.info("좋아요 토글 요청: reviewId=$reviewId, userId=$userId")
            
            val review = reviewRepository.findById(reviewId).orElse(null)
                ?: return ResponseEntity.notFound().build()

            val existing = likeRepository.findByReviewIdAndUserId(reviewId, userId)
            logger.info("기존 좋아요: ${existing.size}개")

            val liked = if (existing.isNotEmpty()) {
                likeRepository.deleteAll(existing)
                likeRepository.flush()
                logger.info("좋아요 삭제")
                false
            } else {
                likeRepository.save(ReviewLike(reviewId = reviewId, userId = userId))
                likeRepository.flush()
                logger.info("좋아요 저장")
                true
            }

            val cnt = likeRepository.countByReviewId(reviewId)
            logger.info("좋아요 개수: $cnt")
            review.likesCount = cnt
            reviewRepository.save(review)

            ResponseEntity.ok(LikeResponse(reviewId = reviewId, liked = liked, likesCount = cnt))
        } catch (e: Exception) {
            logger.error("좋아요 처리 에러", e)
            ResponseEntity.status(500).body(mapOf("error" to (e.message ?: "Unknown error")))
        }
    }

    // 유저가 좋아요한 리뷰 ID 목록 조회
    @GetMapping("/likes")
    fun getUserLikes(
        @RequestParam lectureId: String,
        @RequestParam userId: String
    ): ResponseEntity<List<Long>> {
        return try {
            val ids = likeRepository.findReviewIdsByUserIdAndLectureId(userId, lectureId)
            ResponseEntity.ok(ids)
        } catch (e: Exception) {
            logger.error("좋아요 목록 조회 에러", e)
            ResponseEntity.ok(emptyList())
        }
    }

    // 댓글 조회
    @GetMapping("/{reviewId}/comments")
    fun getComments(@PathVariable reviewId: Long): ResponseEntity<List<ReviewComment>> {
        try {
            logger.info("댓글 조회: reviewId=$reviewId")
            val comments = commentRepository.findAllByReviewIdOrderByCreatedAtAsc(reviewId)
            logger.info("댓글 개수: ${comments.size}")
            return ResponseEntity.ok(comments)
        } catch (e: Exception) {
            logger.error("댓글 조회 에러", e)
            return ResponseEntity.ok(emptyList())
        }
    }

    // 댓글 작성
    @PostMapping("/{reviewId}/comments")
    @Transactional
    fun createComment(
        @PathVariable reviewId: Long,
        @RequestBody req: CreateCommentRequest
    ): ResponseEntity<Any> {
        return try {
            logger.info("댓글 저장 요청: reviewId=$reviewId, req=$req")
            
            if (req.reviewId != reviewId) {
                logger.warn("reviewId 불일치: pathId=$reviewId, reqId=${req.reviewId}")
                return ResponseEntity.badRequest().build()
            }

            val comment = ReviewComment(
                reviewId = reviewId,
                userId = req.userId,
                userName = req.userName,
                content = req.content
            )
            val saved = commentRepository.save(comment)
            // flush to ensure count sees it (though hibernate usually auto-flushes before query)
            commentRepository.flush()
            
            logger.info("댓글 저장 성공: ${saved.id}")

            // 댓글 개수 업데이트
            val count = commentRepository.countByReviewId(reviewId)
            logger.info("갱신된 댓글 개수: $count")
            
            val review = reviewRepository.findById(reviewId).orElse(null)
            if (review != null) {
                review.commentsCount = count
                reviewRepository.save(review)
            }
            
            ResponseEntity.ok(saved)
        } catch (e: Exception) {
            logger.error("댓글 저장 에러", e)
            ResponseEntity.status(500).body(mapOf("error" to (e.message ?: "Unknown error")))
        }
    }

    // 스크랩 토글
    @PostMapping("/{reviewId}/scrap")
    @Transactional
    fun toggleScrap(
        @PathVariable reviewId: Long,
        @RequestParam userId: String
    ): ResponseEntity<Any> {
        return try {
            logger.info("스크랩 토글 요청: reviewId=$reviewId, userId=$userId")
            val existing = scrapRepository.findByReviewIdAndUserId(reviewId, userId)
            val scraped = if (existing.isNotEmpty()) {
                scrapRepository.deleteAll(existing)
                scrapRepository.flush()
                logger.info("스크랩 삭제 완료")
                false
            } else {
                scrapRepository.save(com.example.finger_schedule.dto.ReviewScrap(reviewId = reviewId, userId = userId))
                scrapRepository.flush()
                logger.info("스크랩 저장 완료")
                true
            }
            ResponseEntity.ok(mapOf("scraped" to scraped))
        } catch (e: Exception) {
            logger.error("스크랩 토글 에러", e)
            ResponseEntity.status(500).body(mapOf("error" to e.message))
        }
    }

    // 스크랩한 리뷰 목록
    @GetMapping("/scraped")
    fun getScrapedReviews(@RequestParam userId: String): ResponseEntity<List<ReviewResponse>> {
        val scraps = scrapRepository.findByUserId(userId)
        val reviewIds = scraps.map { it.reviewId }
        val reviews = reviewRepository.findAllById(reviewIds)

        // 강의 정보 조회 (bulk)
        val lectureIds = reviews.map { it.lectureId }.distinct()
        val lectures = lectureRepository.findByIdIn(lectureIds)
         val lectureMap = lectures.associateBy { it.id }

        val response = reviews.map { review ->
            val lecture = lectureMap[review.lectureId]
            ReviewResponse(
                id = review.id,
                lectureId = review.lectureId,
                university = review.university,
                userId = review.userId,
                userName = review.userName,
                rating = review.rating,
                semester = review.semester,
                content = review.content,
                assignmentAmount = review.assignmentAmount,
                teamProject = review.teamProject,
                grading = review.grading,
                attendance = review.attendance,
                examCount = review.examCount,
                createdAt = review.createdAt,
                likesCount = review.likesCount,
                commentsCount = review.commentsCount,
                likedByUser = likeRepository.findByReviewIdAndUserId(review.id, userId).isNotEmpty(),
                scrapedByUser = true,
                lectureName = lecture?.name,
                professor = lecture?.professor,
                isAnonymous = review.isAnonymous ?: false
            )
        }
        return ResponseEntity.ok(response)
    }

    // 내가 쓴 리뷰 목록
    @GetMapping("/my")
    fun getMyReviews(@RequestParam userId: String): ResponseEntity<List<ReviewResponse>> {
        val reviews = reviewRepository.findAllByUserIdOrderByCreatedAtDesc(userId)

        // 강의 정보 조회 (bulk)
        val lectureIds = reviews.map { it.lectureId }.distinct()
        val lectures = lectureRepository.findByIdIn(lectureIds)
        val lectureMap = lectures.associateBy { it.id }

        val response = reviews.map { review ->
            val lecture = lectureMap[review.lectureId]
            ReviewResponse(
                id = review.id,
                lectureId = review.lectureId,
                university = review.university,
                userId = review.userId,
                userName = review.userName,
                rating = review.rating,
                semester = review.semester,
                content = review.content,
                assignmentAmount = review.assignmentAmount,
                teamProject = review.teamProject,
                grading = review.grading,
                attendance = review.attendance,
                examCount = review.examCount,
                createdAt = review.createdAt,
                likesCount = review.likesCount,
                commentsCount = review.commentsCount,
                likedByUser = likeRepository.findByReviewIdAndUserId(review.id, userId).isNotEmpty(),
                scrapedByUser = scrapRepository.findByReviewIdAndUserId(review.id, userId).isNotEmpty(),
                lectureName = lecture?.name,
                professor = lecture?.professor,
                isAnonymous = review.isAnonymous ?: false
            )
        }
        return ResponseEntity.ok(response)
    }

    // 리뷰 삭제
    @DeleteMapping("/{reviewId}")
    @Transactional
    fun deleteReview(@PathVariable reviewId: Long): ResponseEntity<Any> {
        return try {
            val review = reviewRepository.findById(reviewId).orElse(null)
                ?: return ResponseEntity.notFound().build()
            
            // 연관 데이터 삭제 (좋아요, 스크랩, 댓글)
            likeRepository.deleteByReviewId(reviewId)
            scrapRepository.deleteByReviewId(reviewId)
            commentRepository.deleteByReviewId(reviewId)
            
            reviewRepository.delete(review)
            ResponseEntity.ok().build()
        } catch (e: Exception) {
            logger.error("리뷰 삭제 에러", e)
            ResponseEntity.status(500).body(mapOf("error" to e.message))
        }
    }
}
