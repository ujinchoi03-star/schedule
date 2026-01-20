package com.example.finger_schedule.controller

import com.example.finger_schedule.domain.Lecture
import com.example.finger_schedule.dto.*
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
        return timeTableService.getSearchLectures(university, null)
    }

    // 🚀 [수정] 클래스 내부로 통합됨

    @PostMapping("/save")
    fun saveTimetable(@RequestBody request: SaveTimetableRequest): Long {
        return timeTableService.saveTimetable(request)
    }

    @DeleteMapping("/saved/{id}")
    fun deleteSavedTimetable(@PathVariable id: Long) {
        timeTableService.deleteSavedTimetable(id)
    }

    @GetMapping("/saved/{userId}")
    fun getSavedTimetables(@PathVariable userId: String): List<SavedTimetableResponse> {
        return timeTableService.getSavedTimetables(userId)
    }
}