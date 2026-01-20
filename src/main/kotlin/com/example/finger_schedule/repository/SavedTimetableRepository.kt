package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.SavedTimetable
import org.springframework.data.jpa.repository.JpaRepository

interface SavedTimetableRepository : JpaRepository<SavedTimetable, Long>