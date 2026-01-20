package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.Lecture
import org.springframework.data.jpa.repository.JpaRepository

// 🌟 중요: 엔티티의 @Id가 Long이므로 여기도 Long이어야 합니다!
interface LectureRepository : JpaRepository<Lecture, Long> {

    fun findAllByUniversity(university: String): List<Lecture>

    fun findByUniversityAndNameContaining(university: String, keyword: String): List<Lecture>

    // 🚀 [추가] 학수번호(String id) 리스트로 강의들을 찾는 함수
    // "In"을 붙이면 리스트 안에 있는 걸 다 찾아줍니다. (WHERE id IN (...))
    fun findByIdIn(ids: List<String>): List<Lecture>
}