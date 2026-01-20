package com.example.finger_schedule.controller

import com.example.finger_schedule.domain.RegistrationTip
import com.example.finger_schedule.domain.RegistrationTipComment
import com.example.finger_schedule.domain.RegistrationTipLike
import com.example.finger_schedule.dto.CreateRegistrationTipRequest
import com.example.finger_schedule.dto.CreateTipCommentRequest
import com.example.finger_schedule.dto.RegistrationTipResponse
import com.example.finger_schedule.repository.RegistrationTipCommentRepository
import com.example.finger_schedule.repository.RegistrationTipLikeRepository
import com.example.finger_schedule.repository.RegistrationTipRepository
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.transaction.annotation.Transactional

@RestController
@RequestMapping("/api/tips")
@CrossOrigin(origins = ["http://localhost:5173"])
class RegistrationTipController(
    private val tipRepository: RegistrationTipRepository,
    private val likeRepository: RegistrationTipLikeRepository,
    private val commentRepository: RegistrationTipCommentRepository,
    private val scrapRepository: com.example.finger_schedule.repository.RegistrationTipScrapRepository
) {

    // 1. 팁 목록 조회 (검색, 필터, 정렬 포함)
    @GetMapping
    fun getTips(
        @RequestParam university: String,
        @RequestParam(defaultValue = "all") category: String,
        @RequestParam(defaultValue = "") search: String,
        @RequestParam(defaultValue = "latest") sort: String,
        @RequestParam(required = false) userId: String?
    ): ResponseEntity<List<RegistrationTipResponse>> {
        
        // 정렬 기준 설정
        val sortObj = when (sort) {
            "likes-desc" -> Sort.by(Sort.Direction.DESC, "likesCount")
            "likes-asc" -> Sort.by(Sort.Direction.ASC, "likesCount")
            else -> Sort.by(Sort.Direction.DESC, "createdAt") // latest
        }

        val tips = if (search.isNotBlank()) {
            // 검색어가 있을 때 (JPA 메서드 이름이 너무 길어서 분리하거나 @Query 사용 권장하지만, 일단 메서드 사용 시도)
             tipRepository.findByUniversityAndTitleContainingOrContentContainingOrUserNameContaining(
                university, search, search, search, sortObj
            ).filter { it.university == university } // 대학 필터링 강화
        } else if (category != "all") {
            tipRepository.findByUniversityAndCategory(university, category, sortObj)
        } else {
            tipRepository.findByUniversity(university, sortObj)
        }

        // DTO 변환 (likedByUser 체크 포함)
        val response = tips.map { tip ->
            val isLiked = if (userId != null) {
                likeRepository.findByTipIdAndUserId(tip.id!!, userId).isNotEmpty()
            } else {
                false
            }
            RegistrationTipResponse(
                id = tip.id!!,
                university = tip.university,
                userId = tip.userId,
                userName = tip.userName,
                department = if (tip.isAnonymous == true) "" else tip.department,
                category = tip.category,
                title = tip.title,
                content = tip.content,
                likesCount = tip.likesCount,
                commentsCount = tip.commentsCount,
                createdAt = tip.createdAt,
                likedByUser = isLiked,
                scrapedByUser = if (userId != null) {
                    scrapRepository.findByTipIdAndUserId(tip.id!!, userId).isNotEmpty()
                } else false,
                isAnonymous = tip.isAnonymous ?: false
            )
        }

        return ResponseEntity.ok(response)
    }

    // 2. 팁 작성
    @PostMapping
    fun createTip(@RequestBody req: CreateRegistrationTipRequest): ResponseEntity<Any> {
        println("팁 작성 요청: $req")
        return try {
            val tip = RegistrationTip(
                university = req.university,
                userId = req.userId,
                userName = if (req.isAnonymous) "익명" else req.userName,
                department = req.department,
                category = req.category,
                title = req.title,
                content = req.content,
                isAnonymous = req.isAnonymous
            )
            val saved = tipRepository.save(tip)
            println("팁 저장 성공: $saved")
            ResponseEntity.ok(saved)
        } catch (e: Exception) {
            e.printStackTrace()
            println("팁 저장 실패: ${e.message}")
            ResponseEntity.status(500).body(mapOf("error" to e.message))
        }
    }

    // 3. 좋아요 토글
    @PostMapping("/{tipId}/like")
    @Transactional
    fun toggleLike(
        @PathVariable tipId: Long,
        @RequestParam userId: String
    ): ResponseEntity<Any> {
        val tip = tipRepository.findById(tipId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        val existing = likeRepository.findByTipIdAndUserId(tipId, userId)
        
        val liked = if (existing.isNotEmpty()) {
            likeRepository.deleteAll(existing)
            likeRepository.flush()
            false
        } else {
            likeRepository.save(RegistrationTipLike(tipId = tipId, userId = userId))
            likeRepository.flush()
            true
        }

        // 개수 업데이트
        val cnt = likeRepository.countByTipId(tipId)
        tip.likesCount = cnt
        tipRepository.save(tip)

        return ResponseEntity.ok(mapOf("liked" to liked, "likesCount" to cnt))
    }

    // 4. 댓글 목록 조회
    @GetMapping("/{tipId}/comments")
    fun getComments(@PathVariable tipId: Long): ResponseEntity<List<RegistrationTipComment>> {
        return ResponseEntity.ok(commentRepository.findByTipId(tipId))
    }

    // 5. 댓글 작성
    @PostMapping("/{tipId}/comments")
    @Transactional
    fun createComment(
        @PathVariable tipId: Long,
        @RequestBody req: CreateTipCommentRequest
    ): ResponseEntity<RegistrationTipComment> {
        val comment = RegistrationTipComment(
            tipId = tipId,
            userId = req.userId,
            userName = req.userName,
            content = req.content
        )
        val saved = commentRepository.save(comment)
        
        // 댓글 수 업데이트
        val tip = tipRepository.findById(tipId).orElse(null)
        if (tip != null) {
            val cnt = commentRepository.countByTipId(tipId)
            tip.commentsCount = cnt
            tipRepository.save(tip)
        }


        return ResponseEntity.ok(saved)
    }

    // 6. 스크랩 토글
    @PostMapping("/{tipId}/scrap")
    @Transactional
    fun toggleScrap(
        @PathVariable tipId: Long,
        @RequestParam userId: String
    ): ResponseEntity<Any> {
        val existing = scrapRepository.findByTipIdAndUserId(tipId, userId)
        val scraped = if (existing.isNotEmpty()) {
            scrapRepository.deleteAll(existing)
            false
        } else {
            scrapRepository.save(com.example.finger_schedule.domain.RegistrationTipScrap(tipId = tipId, userId = userId))
            true
        }
        return ResponseEntity.ok(mapOf("scraped" to scraped))
    }

    // 7. 스크랩한 팁 목록 (마이페이지용)
    @GetMapping("/scraped")
    fun getScrapedTips(@RequestParam userId: String): ResponseEntity<List<RegistrationTipResponse>> {
        val scraps = scrapRepository.findByUserId(userId)
        val tipIds = scraps.map { it.tipId }
        val tips = tipRepository.findAllById(tipIds)

        val response = tips.map { tip ->
            RegistrationTipResponse(
                id = tip.id!!,
                university = tip.university,
                userId = tip.userId,
                userName = tip.userName,
                department = tip.department,
                category = tip.category,
                title = tip.title,
                content = tip.content,
                likesCount = tip.likesCount,
                commentsCount = tip.commentsCount,
                createdAt = tip.createdAt,
                likedByUser = likeRepository.findByTipIdAndUserId(tip.id!!, userId).isNotEmpty(),
                scrapedByUser = true,
                isAnonymous = tip.isAnonymous ?: false
            )
        }
        return ResponseEntity.ok(response)
    }

    // 8. 내가 쓴 팁 목록
    @GetMapping("/my")
    fun getMyTips(@RequestParam userId: String): ResponseEntity<List<RegistrationTipResponse>> {
        val tips = tipRepository.findByUserId(userId, Sort.by(Sort.Direction.DESC, "createdAt"))
        
        val response = tips.map { tip ->
            RegistrationTipResponse(
                id = tip.id!!,
                university = tip.university,
                userId = tip.userId,
                userName = tip.userName,
                department = tip.department,
                category = tip.category,
                title = tip.title,
                content = tip.content,
                likesCount = tip.likesCount,
                commentsCount = tip.commentsCount,
                createdAt = tip.createdAt,
                likedByUser = likeRepository.findByTipIdAndUserId(tip.id!!, userId).isNotEmpty(),
                scrapedByUser = scrapRepository.findByTipIdAndUserId(tip.id!!, userId).isNotEmpty(),
                isAnonymous = tip.isAnonymous ?: false
            )
        }
        return ResponseEntity.ok(response)
    }

    // 9. 팁 삭제
    @DeleteMapping("/{tipId}")
    @Transactional
    fun deleteTip(
        @PathVariable tipId: Long,
        @RequestParam userId: String
    ): ResponseEntity<Any> {
        val tip = tipRepository.findById(tipId).orElse(null) ?: return ResponseEntity.notFound().build()
        
        if (tip.userId != userId) {
            return ResponseEntity.status(403).body(mapOf("error" to "Unauthorized"))
        }

        // 연관 데이터 삭제 (좋아요, 스크랩, 댓글)
        likeRepository.deleteByTipId(tipId)
        commentRepository.deleteByTipId(tipId)
        scrapRepository.deleteByTipId(tipId)
        
        tipRepository.delete(tip)
        return ResponseEntity.ok(mapOf("deleted" to true))
    }

    // 10. 팁 수정
    @PutMapping("/{tipId}")
    @Transactional
    fun updateTip(
        @PathVariable tipId: Long,
        @RequestBody req: CreateRegistrationTipRequest // 재사용
    ): ResponseEntity<Any> {
        val tip = tipRepository.findById(tipId).orElse(null) ?: return ResponseEntity.notFound().build()

        if (tip.userId != req.userId) {
            return ResponseEntity.status(403).body(mapOf("error" to "Unauthorized"))
        }

        tip.title = req.title
        tip.content = req.content
        tip.category = req.category
        // timestamp 업데이트는 선택 사항

        return ResponseEntity.ok(tipRepository.save(tip))
    }
}
