package com.example.finger_schedule.controller

import com.example.finger_schedule.domain.Review
import com.example.finger_schedule.dto.*
import com.example.finger_schedule.repository.*
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.transaction.annotation.Transactional
import kotlin.math.round
import org.slf4j.LoggerFactory

// 🚀 요청/응답용 DTO 클래스 정의
data class LikeResponse(val reviewId: Long, val liked: Boolean, val likesCount: Long)
data class CreateCommentRequest(val reviewId: Long, val userId: String, val userName: String, val content: String)

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = ["http://localhost:5173", "http://127.0.0.1:5173"])
class ReviewController(
    private val reviewRepository: ReviewRepository,
    private val commentRepository: ReviewCommentRepository,
    private val likeRepository: ReviewLikeRepository,
    private val scrapRepository: ReviewScrapRepository,
    private val lectureRepository: com.example.finger_schedule.repository.LectureRepository
) {
    private val logger = LoggerFactory.getLogger(ReviewController::class.java)

    private fun getBaseId(fullId: String): String = fullId.split("-")[0]

    // 1. 리뷰 조회
    @GetMapping
    fun getReviews(
        @RequestParam lectureId: String,
        @RequestParam(required = false) userId: String?
    ): ResponseEntity<List<ReviewResponse>> {
        val baseId = getBaseId(lectureId)
        val lecture = lectureRepository.findFirstById(lectureId) ?: lectureRepository.findFirstById(baseId)
        
        // 🚀 [수정] 교수님 이름까지 일치하는 리뷰만 가져오기
        val reviews = if (lecture != null) {
            reviewRepository.findAllByLectureIdAndProfessorOrderByCreatedAtDesc(baseId, lecture.professor)
        } else {
            // 강의 정보를 못 찾으면 기존처럼 전체 가져오기 (예외 처리)
            reviewRepository.findAllByLectureIdOrderByCreatedAtDesc(baseId)
        }

        val response = reviews.map { review ->
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
                likedByUser = if (userId != null) likeRepository.findByReviewIdAndUserId(review.id, userId)
                    .isNotEmpty() else false,
                scrapedByUser = if (userId != null) scrapRepository.findByReviewIdAndUserId(review.id, userId)
                    .isNotEmpty() else false,
                lectureName = lecture?.name,
                professor = review.professor, // 🚀 저장된 교수님 이름 사용
                isAnonymous = review.isAnonymous ?: false
            )
        }
        return ResponseEntity.ok(response)
    }

    // 2. 리뷰 작성
    @PostMapping
    fun createReview(@RequestBody req: CreateReviewRequest): ResponseEntity<Any> {
        // 🚀 [추가] 강의 ID로 교수님 정보 찾기
        val lecture = lectureRepository.findFirstById(req.lectureId)
        val professorName = lecture?.professor ?: ""

        val review = Review(
            lectureId = getBaseId(req.lectureId),
            university = req.university,
            userId = req.userId,
            userName = if (req.isAnonymous == true) "익명" else req.userName,
            rating = req.rating,
            semester = req.semester,
            content = req.content,
            assignmentAmount = req.assignmentAmount ?: "medium",
            teamProject = req.teamProject ?: "few",
            grading = req.grading ?: "normal",
            attendance = req.attendance ?: "direct",
            examCount = req.examCount ?: 2,
            isAnonymous = req.isAnonymous,
            professor = professorName // 🚀 교수님 이름 저장
        )
        val saved = reviewRepository.save(review)
        return ResponseEntity.ok(saved)
    }

    // 3. 댓글 작성 (🚀 404 해결: 경로 확인 필수!)
    @PostMapping("/{reviewId}/comments")
    @Transactional
    fun createComment(@PathVariable reviewId: Long, @RequestBody req: CreateCommentRequest): ResponseEntity<Any> {
        val comment = ReviewComment(
            reviewId = reviewId,
            userId = req.userId,
            userName = req.userName,
            content = req.content
        )
        val saved = commentRepository.save(comment)

        // 리뷰의 댓글 수 업데이트
        reviewRepository.findById(reviewId).ifPresent {
            it.commentsCount = commentRepository.countByReviewId(reviewId)
            reviewRepository.save(it)
        }
        return ResponseEntity.ok(saved)
    }

    // 3.1 댓글 조회 (🚀 405 해결)
    @GetMapping("/{reviewId}/comments")
    fun getComments(@PathVariable reviewId: Long): ResponseEntity<List<ReviewComment>> {
        val comments = commentRepository.findAllByReviewIdOrderByCreatedAtAsc(reviewId)
        return ResponseEntity.ok(comments)
    }

    // 4. 좋아요 토글
    @PostMapping("/{reviewId}/like")
    @Transactional
    fun toggleLike(@PathVariable reviewId: Long, @RequestParam userId: String): ResponseEntity<Any> {
        val review = reviewRepository.findById(reviewId).orElse(null) ?: return ResponseEntity.notFound().build()
        val existing = likeRepository.findByReviewIdAndUserId(reviewId, userId)
        val liked = if (existing.isNotEmpty()) {
            likeRepository.deleteAll(existing)
            false
        } else {
            likeRepository.save(ReviewLike(reviewId = reviewId, userId = userId))
            true
        }
        review.likesCount = likeRepository.countByReviewId(reviewId)
        reviewRepository.save(review)
        return ResponseEntity.ok(LikeResponse(reviewId, liked, review.likesCount))
    }

    // 5. 강의 요약 조회
    @GetMapping("/summary")
    fun getSummary(@RequestParam lectureId: String): ResponseEntity<ReviewSummaryResponse> {
        val baseId = getBaseId(lectureId)
        val lecture = lectureRepository.findFirstById(lectureId)
        
        // 🚀 [수정] 교수님별 통계 조회 (강의 정보가 없으면 기존처럼 전체 조회)
        // 만약 lectureId로 찾은 강의가 있다면 그 강의의 교수님으로 필터링
        val (count, avg) = if (lecture != null) {
            Pair(
                reviewRepository.countByLectureIdAndProfessor(baseId, lecture.professor),
                reviewRepository.avgRatingByLectureIdAndProfessor(baseId, lecture.professor)
            )
        } else {
            Pair(
                reviewRepository.countByLectureId(baseId),
                reviewRepository.avgRatingByLectureId(baseId)
            )
        }

        return ResponseEntity.ok(
            ReviewSummaryResponse(
                baseId,
                count,
                round(avg * 10) / 10.0
            )
        )
    }

    // 🚀 [추가 1] 왼쪽 목록 0점 방지용 (전체 요약 API)
    @GetMapping("/summary/all")
    fun getAllSummaries(@RequestParam university: String): ResponseEntity<Any> {
        // 레포지토리에 이미 만들어두신 summaryByUniversity 쿼리를 사용하여 데이터를 가져옵니다.
        val summaries = reviewRepository.summaryByUniversity(university)
        return ResponseEntity.ok(summaries)
    }

    // 🚀 [추가 2] 마이페이지 404 해결용 (내 리뷰 목록)
    @GetMapping("/my")
    fun getMyReviews(@RequestParam userId: String): ResponseEntity<List<ReviewResponse>> {
        // 에러 해결: findAllByUserId 대신 레포지토리에 있는 findAllByUserIdOrderByCreatedAtDesc를 사용합니다.
        val myReviews = reviewRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
        return ResponseEntity.ok(convertToResponse(myReviews, userId))
    }

    // 🚀 [추가 3] 에러 해결을 위한 헬퍼 함수 (Review 엔티티를 Response DTO로 변환)
    private fun convertToResponse(reviews: List<Review>, userId: String?): List<ReviewResponse> {
        return reviews.map { review ->
            val lecture = lectureRepository.findFirstById(review.lectureId)
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
                likedByUser = if (userId != null) likeRepository.findByReviewIdAndUserId(review.id, userId).isNotEmpty() else false,
                scrapedByUser = if (userId != null) scrapRepository.findByReviewIdAndUserId(review.id, userId).isNotEmpty() else false,
                lectureName = lecture?.name,
                professor = lecture?.professor,
                isAnonymous = review.isAnonymous ?: false
            )
        }
    }
    // 6. 강의평 스크랩 토글 (🚀 404 해결을 위해 추가)
    @PostMapping("/{reviewId}/scrap")
    @Transactional
    fun toggleScrap(
        @PathVariable reviewId: Long,
        @RequestParam userId: String
    ): ResponseEntity<Any> {
        // 1. 해당 유저가 이미 이 리뷰를 스크랩했는지 확인
        val existing = scrapRepository.findByReviewIdAndUserId(reviewId, userId)

        val scrapped = if (existing.isNotEmpty()) {
            // 2. 이미 존재하면 삭제 (스크랩 취소)
            scrapRepository.deleteAll(existing)
            false
        } else {
            // 3. 존재하지 않으면 새로 저장 (스크랩 추가)
            // 💡 주의: ReviewScrap 패키지 경로가 domain이어야 합니다.
            scrapRepository.save(
                com.example.finger_schedule.domain.ReviewScrap(
                    reviewId = reviewId,
                    userId = userId
                )
            )
            true
        }

        return ResponseEntity.ok(
            mapOf(
                "reviewId" to reviewId,
                "scrapped" to scrapped
            )
        )
        // 🚀 모든 함수가 클래스 닫는 중괄호 안에 있어야 합니다.
    }

    // 7. 스크랩한 강의평 목록 조회 (🚀 404 해결)
    @GetMapping("/scraped")
    fun getScrapedReviews(@RequestParam userId: String): ResponseEntity<List<ReviewResponse>> {
        val scraps = scrapRepository.findByUserId(userId)
        val reviewIds = scraps.map { it.reviewId }
        val reviews = reviewRepository.findAllById(reviewIds)

        return ResponseEntity.ok(convertToResponse(reviews, userId))
    }

    // 8. 좋아요한 리뷰 ID 목록 조회 (🚀 404 해결)
    @GetMapping("/likes")
    fun getUserLikes(
        @RequestParam userId: String,
        @RequestParam lectureId: String
    ): ResponseEntity<List<Long>> {
        val baseId = getBaseId(lectureId) // 🚀 핵심 수정: 분반 정보 제거 (예: ITE2031-01 -> ITE2031)
        
        // Repository에 정의된 쿼리: SELECT l.reviewId FROM ReviewLike l WHERE l.userId = :userId AND l.reviewId IN (SELECT r.id FROM Review r WHERE r.lectureId = :lectureId)
        val likedReviewIds = likeRepository.findReviewIdsByUserIdAndLectureId(userId, baseId)
        return ResponseEntity.ok(likedReviewIds)
    }
}