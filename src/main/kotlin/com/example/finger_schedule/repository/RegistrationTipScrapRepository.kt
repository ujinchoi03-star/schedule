package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.RegistrationTipScrap
import org.springframework.data.jpa.repository.JpaRepository

interface RegistrationTipScrapRepository : JpaRepository<RegistrationTipScrap, Long> {
    fun findByTipIdAndUserId(tipId: Long, userId: String): List<RegistrationTipScrap>
    fun findByUserId(userId: String): List<RegistrationTipScrap>
    fun deleteByTipId(tipId: Long)
}
