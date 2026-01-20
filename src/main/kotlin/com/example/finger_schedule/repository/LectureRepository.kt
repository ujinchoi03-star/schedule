package com.example.finger_schedule.repository

import com.example.finger_schedule.dto.Lecture
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.transaction.annotation.Transactional

interface LectureRepository : JpaRepository<Lecture, Long> {
    fun findAllByUniversity(university: String): List<Lecture>

    // String ID로 조회 (Lecture.id 컬럼 기준)
    fun findOneById(id: String): Lecture?
    
    // 여러 String ID로 조회
    fun findByIdIn(ids: List<String>): List<Lecture>

    @Modifying
    @Transactional
    @Query("delete from Lecture")
    fun deleteAllLectures()
}
