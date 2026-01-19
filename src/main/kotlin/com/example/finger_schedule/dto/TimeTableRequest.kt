package com.example.finger_schedule.dto

data class TimeTableRequest(
    // 🏫 학교 정보 (필수!)
    val university: String, // "KOREA" or "HANYANG"

    // 📅 기본 학기 정보
    val year: Int,
    val semester: Int,

    // 🎓 학점 조건
    val targetCredit: Int,      // 목표 학점 (예: 18)
    val minMajorCredit: Int,    // 최소 전공 학점 (예: 12)

    // 🔢 필수 과목 개수 조건
    val minMustHaveMajorCount: Int,   // 최소 필수 전공 개수
    val minMustHaveGeneralCount: Int, // 최소 필수 교양 개수

    // 📌 필수 포함 과목 ID 리스트
    val mustHaveMajorIds: List<String> = emptyList(),   // 꼭 들어야 할 전공 ID들
    val mustHaveGeneralIds: List<String> = emptyList(), // 꼭 들어야 할 교양 ID들

    // 🚫 피하고 싶은 키워드 (예: ["영어전용"])
    val avoidKeywords: List<String> = emptyList(),

    // ⏰ 절대 안 되는 시간대 (알바, 종교활동 등)
    val blockedTimes: List<BlockedTimeDto> = emptyList(),

    // 🏖️ 공강 만들고 싶은 요일 (예: ["Fri"])
    val wantedDayOffs: List<String> = emptyList(),

    // ⭐ 최소 평점 (이 점수 이상만 추천)
    val minRating: Double = 0.0,

    // 🎛️ 기타 옵션
    val onlyMajor: Boolean = false,      // 전공만 채울까요?
    val excludeNoTime: Boolean = true    // 시간 없는 강의(사이버 등) 제외할까요?
)

// 시간 차단용 내부 클래스
data class BlockedTimeDto(
    val day: String,       // "Mon"
    val startTime: String, // "09:00"
    val endTime: String    // "12:00"
)