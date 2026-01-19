package com.example.finger_schedule.controller

import com.example.finger_schedule.dto.Lecture
import com.example.finger_schedule.dto.TimeTableRequest
import com.example.finger_schedule.service.TimeTableService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/timetable")
class TimeTableController(
    private val timeTableService: TimeTableService
) {

    // POST http://localhost:8080/api/timetable/generate
    @PostMapping("/generate")
    fun generateTimeTable(@RequestBody request: TimeTableRequest): List<List<Lecture>> {
        return timeTableService.generate(request)
    }
}