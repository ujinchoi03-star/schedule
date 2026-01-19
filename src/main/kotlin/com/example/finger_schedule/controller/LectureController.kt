package com.example.finger_schedule.controller

import com.example.finger_schedule.dto.Lecture
import com.example.finger_schedule.repository.LectureRepository
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lectures")
@CrossOrigin(origins = ["http://localhost:5173"])
class LectureController(
    private val lectureRepository: LectureRepository
) {
    @GetMapping("/count")
    fun count(): Long = lectureRepository.count()

    @GetMapping("/all")
    fun all(): List<Lecture> = lectureRepository.findAll()

    @GetMapping
    fun byUniversity(@RequestParam university: String): List<Lecture> =
        lectureRepository.findAllByUniversity(university)
}
