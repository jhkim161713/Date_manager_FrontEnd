import { useState } from "react"
import { SectionTitle } from "../components/SectionTitle"
import { HScroll } from "../components/HScroll"
import { ContentCard } from "../components/ContentCard"
import { Badge } from "../components/Badge"
import Calendar from "react-calendar"
//
export function CalendarTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">📅 데이트 캘린더</h2>
      	<Calendar />
    )
    </div>
  )
}