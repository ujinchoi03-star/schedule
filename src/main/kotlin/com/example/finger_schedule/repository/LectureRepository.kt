package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.Lecture
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.transaction.annotation.Transactional

interface LectureRepository : JpaRepository<Lecture, Long> {

    // 1. 학교별 모든 강의 찾기
    fun findAllByUniversity(university: String): List<Lecture>

    // 2. ❌ 기존의 findByIdIn(빨간 줄)은 삭제하세요.
    // 3. ✅ 아래 함수가 학수번호(String) 리스트로 강의들을 찾는 올바른 함수입니다.
    fun findAllByIdIn(ids: List<String>): List<Lecture>

    // 4. 단건 조회용
    fun findFirstById(id: String): Lecture?
}