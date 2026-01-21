package com.example.finger_schedule.dto

// 시간표 저장 요청
data class SaveTimetableRequest(
    val userId: String,
    val name: String,
    val lectureIds: List<String> // 저장할 강의들의 학수번호 리스트 (예: ["COSE211-01", ...])
)

// 저장된 시간표 응답
data class SavedTimetableResponse(
    val id: Long,
    val name: String,
    val lectures: List<LectureSearchResponse>
)