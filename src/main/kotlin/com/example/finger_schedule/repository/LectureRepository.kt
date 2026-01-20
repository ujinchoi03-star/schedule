package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.Lecture
import org.springframework.data.jpa.repository.JpaRepository

// <다룰 객체, ID의 타입>
interface LectureRepository : JpaRepository<Lecture, String> {
    fun findAllByUniversity(university: String): List<Lecture>
    // 아무것도 안 적어도 findAll(), save() 같은 기능을 공짜로 줍니다!
    fun findByUniversityAndNameContaining(university: String, keyword: String): List<Lecture>
}