package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.Lecture
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.transaction.annotation.Transactional

interface LectureRepository : JpaRepository<Lecture, Long> {

    fun findAllByUniversity(university: String): List<Lecture>

    fun findByUniversityAndNameContaining(university: String, keyword: String): List<Lecture>

    fun findByIdIn(ids: List<String>): List<Lecture>

    // 🚀 [수정] findOneById 대신 findFirstById를 사용하세요.
    // 학수번호가 겹치더라도 에러를 내지 않고 첫 번째 강의 정보를 가져옵니다.
    fun findFirstById(id: String): Lecture?

    @Modifying
    @Transactional
    @Query("delete from Lecture")
    fun deleteAllLectures()
}