package com.example.finger_schedule.controller

import com.example.finger_schedule.dto.Lecture
import com.example.finger_schedule.dto.TimeTableRequest
import com.example.finger_schedule.service.TimeTableService
import org.springframework.web.bind.annotation.GetMapping // 👈 이거 추가해야 함!
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController
class TimeTableController(
    private val timeTableService: TimeTableService
) {

    // 1. 시간표 생성 (POST)
    @PostMapping("/api/timetable/generate")
    fun generateTimeTable(@RequestBody request: TimeTableRequest): List<List<Lecture>> {
        return timeTableService.generate(request)
    }

    // 2. 전체 강의 목록 조회 (GET) - 🌟 클래스 안으로 들어와야 함!
    // 주소도 통일성 있게 /api/timetable/courses 로 맞추면 더 좋습니다.
    @GetMapping("/api/timetable/courses")
    fun getAllCourses(): List<Lecture> {
        return timeTableService.getAllLectures()
    }

} // 👈 클래스 끝나는 괄호는 여기 있어야 합니다!