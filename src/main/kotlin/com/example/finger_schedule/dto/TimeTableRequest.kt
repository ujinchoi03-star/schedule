package com.example.finger_schedule.dto

// 1. 시간표 생성 요청용
data class TimeTableRequest(
    val university: String,
    val year: Int,
    val semester: Int,
    val minCredit: Int,
    val maxCredit: Int,
    val minMajorCredit: Int,
    val minMustHaveMajorCount: Int,
    val minMustHaveGeneralCount: Int,
    val mustHaveMajorIds: List<String> = emptyList(),
    val mustHaveGeneralIds: List<String> = emptyList(),
    // 🚀 [변경] ID 리스트 삭제 -> 강의명 포함 키워드 리스트 추가
    val avoidNameKeywords: List<String> = emptyList(),
    val avoidKeywords: List<String> = emptyList(),
    val preferredKeywords: List<String> = emptyList(),
    val blockedTimes: List<BlockedTimeDto> = emptyList(),
    val wantedDayOffs: List<String> = emptyList(),
    val minRating: Double = 0.0,
    val onlyMajor: Boolean = false,
    val excludeNoTime: Boolean = true
)

// 2. 제외 시간용
data class BlockedTimeDto(
    val day: String,
    val startTime: String,
    val endTime: String
)

// 3. 🚀 [여기에 정의] 강의 검색 결과용
data class LectureSearchResponse(
    val id: String,
    val name: String,
    val professor: String,
    val credit: Double,
    val rating: Double,
    val category: String,
    val details: String,
    val department: String,
    val timeRoom: String,
    val university: String,
    val timeSlots: List<SearchTimeSlot>
)

data class SearchTimeSlot(
    val day: String,
    val startTime: Int,
    val endTime: Int
)