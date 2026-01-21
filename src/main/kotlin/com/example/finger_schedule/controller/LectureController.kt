package com.example.finger_schedule.controller

import com.example.finger_schedule.domain.Lecture
import com.example.finger_schedule.dto.LectureSearchResponse
import com.example.finger_schedule.repository.LectureRepository
import com.example.finger_schedule.service.TimeTableService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lectures")
@CrossOrigin(origins = ["http://localhost:5173"]) // 동료가 추가한 CORS 유지
class LectureController(
    private val timeTableService: TimeTableService,   // [내 꺼] 검색용 서비스
    private val lectureRepository: LectureRepository  // [동료 꺼] 단순 조회용 레포지토리
) {

    // 1. [동료 기능] 전체 강의 개수 조회
    @GetMapping("/count")
    fun count(): Long = lectureRepository.count()

    // 2. [동료 기능] 모든 강의 조회 (테스트용)
    @GetMapping("/all")
    fun all(): List<Lecture> = lectureRepository.findAll()

    // -------------------------------------------------------------------------
    // 🚨 여기가 핵심입니다! (주소가 같은 두 기능을 합치는 마법)
    // -------------------------------------------------------------------------

    // 3. [내 기능] "검색어(keyword)"가 있을 때는 이 함수가 실행됩니다.
    // params = ["keyword"] : URL에 keyword 파라미터가 있으면 무조건 이게 실행됨
    @GetMapping(params = ["keyword"])
    fun searchLectures(
        @RequestParam university: String,
        @RequestParam keyword: String,
        @RequestParam(required = false) type: String?
    ): List<LectureSearchResponse> {

        println("📡 검색 요청: 학교='$university', 검색어='$keyword', 타입='$type'")

        // 서비스에서 데이터 가져오기 (내 로직 유지)
        val groupedLectures = timeTableService.getSearchLectures(university, keyword)

        // 타입 필터링 로직 (내 로직 유지)
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

    // 4. [동료 기능] "검색어" 없이 "학교(university)"만 있으면 이 함수가 실행됩니다.
    // (예: 강의평 페이지에서 전체 목록 불러올 때)
    @GetMapping(params = ["!keyword"]) // keyword가 없을 때만 실행
    fun byUniversity(@RequestParam university: String): List<Lecture> {
        return lectureRepository.findAllByUniversity(university)
    }
}