package com.example.finger_schedule.controller

import com.example.finger_schedule.dto.*
import com.example.finger_schedule.service.TimeTableService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lectures") // 주소 유지
class LectureController(
    private val timeTableService: TimeTableService
) {

    @GetMapping
    fun searchLectures(
        @RequestParam university: String,
        @RequestParam keyword: String,
        @RequestParam(required = false) type: String? // 'major', 'general' or null
    ): List<LectureSearchResponse> {

        println("📡 검색 요청: 학교='$university', 검색어='$keyword', 타입='$type'")

        // 1. 서비스에서 이미 이름/교수/학수번호로 데이터를 잘 찾아왔습니다.
        val groupedLectures = timeTableService.getSearchLectures(university, keyword)

        // 2. 🚀 [수정] 컨트롤러는 오직 '타입(전공/교양)'만 거릅니다.
        // (강의명으로 다시 검사하던 코드를 삭제했습니다!)

        val filteredResults = if (type != null) {
            groupedLectures.filter { lecture ->
                val isMajor = lecture.category.contains("전공")
                when (type) {
                    "major" -> isMajor
                    "general" -> !isMajor
                    else -> true
                }
            }
        } else {
            groupedLectures
        }

        println("   ✅ 반환 개수: ${filteredResults.size}")
        return filteredResults
    }
}