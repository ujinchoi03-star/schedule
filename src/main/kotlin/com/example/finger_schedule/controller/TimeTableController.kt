package com.example.finger_schedule.controller

import com.example.finger_schedule.domain.Lecture
import com.example.finger_schedule.dto.* // 🚀 이 줄을 추가하면 모든 DTO를 인식합니다.
import com.example.finger_schedule.service.TimeTableService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/timetable")
class TimeTableController(
    private val timeTableService: TimeTableService
) {

    @PostMapping("/generate")
    fun generateTimeTable(@RequestBody request: TimeTableRequest): List<List<Lecture>> {
        return timeTableService.generate(request)
    }

    @GetMapping("/unique-lectures")
    fun getUniqueLectures(@RequestParam university: String?): List<LectureSearchResponse> {
        // ✅ 이제 LectureSearchResponse가 정상적으로 인식됩니다.
        return timeTableService.getSearchLectures(university,null)
    }
}