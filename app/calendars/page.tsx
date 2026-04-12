"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Search,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

const users = [
  { id: 1, name: "John Smith", color: "bg-blue-500" },
  { id: 2, name: "Sarah Johnson", color: "bg-green-500" },
  { id: 3, name: "Mike Davis", color: "bg-purple-500" },
  { id: 4, name: "Emily Brown", color: "bg-pink-500" },
]

const appointmentTypes = [
  { id: 1, name: "Office", color: "bg-red-500" },
  { id: 2, name: "IDR MOVING CALL", color: "bg-blue-500" },
  { id: 3, name: "Sales Meeting", color: "bg-pink-500" },
  { id: 4, name: "Demo", color: "bg-blue-400" },
  { id: 5, name: "Chamber Meeting", color: "bg-indigo-500" },
]

const appointments = [
  {
    id: 1,
    title: "Office",
    type: "Office",
    contact: "All Day Event",
    date: "2025-10-15",
    startTime: "00:00",
    endTime: "23:59",
    allDay: true,
    color: "bg-red-500",
    assignedTo: "John Smith",
  },
  {
    id: 2,
    title: "IDR MOVING CALL",
    type: "IDR MOVING CALL",
    contact: "Mike Johnson",
    date: "2025-10-20",
    startTime: "10:00",
    endTime: "11:00",
    color: "bg-blue-500",
    assignedTo: "Sarah Johnson",
  },
  {
    id: 3,
    title: "Sales Meeting",
    type: "Sales Meeting",
    contact: "ABC Corp",
    date: "2025-10-22",
    startTime: "14:00",
    endTime: "15:30",
    color: "bg-pink-500",
    assignedTo: "Mike Davis",
  },
  {
    id: 4,
    title: "Refacekit Demo",
    type: "Demo",
    contact: "Jane Doe",
    date: "2025-10-25",
    startTime: "11:00",
    endTime: "12:00",
    color: "bg-blue-400",
    assignedTo: "Emily Brown",
  },
  {
    id: 5,
    title: "Chamber meeting",
    type: "Chamber Meeting",
    contact: "Local Chamber",
    date: "2025-10-28",
    startTime: "09:00",
    endTime: "10:30",
    color: "bg-indigo-500",
    assignedTo: "John Smith",
  },
]

export default function CalendarsPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)) // October 2025
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const [activeTab, setActiveTab] = useState("calendar")
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [visibleUsers, setVisibleUsers] = useState<number[]>(users.map((u) => u.id))
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return appointments.filter((apt) => apt.date === dateStr)
  }

  const toggleUserVisibility = (userId: number) => {
    setVisibleUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const today = new Date()
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
  const selectedDayAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : []

  return (
    <div className="h-full" style={{ background: 'var(--cyber-bg-darkest)', color: 'var(--cyber-text-primary)' }}>
      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid var(--cyber-border)', background: 'var(--cyber-bg-dark)' }}>
        <div className="flex items-center gap-4 px-4 py-2">
          <button
            onClick={() => setActiveTab("calendar")}
            style={{
              fontFamily: '"Orbitron", sans-serif',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              paddingBottom: '8px',
              borderBottom: activeTab === 'calendar' ? '2px solid var(--cyber-cyan)' : '2px solid transparent',
              color: activeTab === 'calendar' ? 'var(--cyber-cyan)' : 'var(--cyber-text-muted)',
            }}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab("list")}
            style={{
              fontFamily: '"Orbitron", sans-serif',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              paddingBottom: '8px',
              borderBottom: activeTab === 'list' ? '2px solid var(--cyber-cyan)' : '2px solid transparent',
              color: activeTab === 'list' ? 'var(--cyber-cyan)' : 'var(--cyber-text-muted)',
            }}
          >
            List
          </button>
          <button
            className="ml-auto p-2"
            style={{ color: 'var(--cyber-text-muted)' }}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-8rem)]">
        {/* Sidebar — desktop only */}
        <div className="hidden lg:block w-64 border-r p-4 overflow-y-auto" style={{ borderColor: 'var(--cyber-border)', background: 'var(--cyber-bg-dark)' }}>
          {/* Mini Calendar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <button onClick={previousMonth} className="p-1 rounded" style={{ color: 'var(--cyber-text-secondary)' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--cyber-text-primary)' }}>{monthName}</span>
              <button onClick={nextMonth} className="p-1 rounded" style={{ color: 'var(--cyber-text-secondary)' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="text-center" style={{ fontFamily: '"Orbitron", sans-serif', color: 'var(--cyber-cyan)', fontSize: '0.6rem' }}>
                  {day}
                </div>
              ))}
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className={`text-center py-1 rounded cursor-pointer`}
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.7rem',
                    color: day === today.getDate() && isCurrentMonth ? 'var(--cyber-bg-darkest)' : 'var(--cyber-text-secondary)',
                    background: day === today.getDate() && isCurrentMonth ? 'var(--cyber-cyan)' : 'transparent',
                  }}
                >
                  {day || ""}
                </div>
              ))}
            </div>
          </div>

          {/* Users Filter */}
          <div className="mb-6">
            <h3 style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cyber-text-muted)', marginBottom: '12px' }}>
              <span style={{ color: 'var(--cyber-cyan)' }}>// </span>Users
            </h3>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={visibleUsers.includes(user.id)}
                    onCheckedChange={() => toggleUserVisibility(user.id)}
                  />
                  <div className={`w-3 h-3 rounded-full ${user.color}`}></div>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--cyber-text-secondary)' }}>{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendars Filter */}
          <div>
            <h3 style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cyber-text-muted)', marginBottom: '12px' }}>
              <span style={{ color: 'var(--cyber-cyan)' }}>// </span>Calendars
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked />
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--cyber-text-secondary)' }}>Team Calendar</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked />
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--cyber-text-secondary)' }}>Personal</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox />
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--cyber-text-secondary)' }}>External</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "calendar" ? (
            <div className="h-full flex flex-col">
              {/* Calendar Controls */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--cyber-border)' }}>
                <div className="flex items-center gap-2">
                  <button onClick={previousMonth} className="p-2 rounded" style={{ color: 'var(--cyber-text-secondary)' }}>
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cyber-text-primary)' }}>{monthName}</h2>
                  <button onClick={nextMonth} className="p-2 rounded" style={{ color: 'var(--cyber-text-secondary)' }}>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goToToday}
                    className="hidden sm:block px-3 py-1 text-xs rounded"
                    style={{
                      fontFamily: '"Orbitron", sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: '1px solid var(--cyber-border)',
                      color: 'var(--cyber-cyan)',
                      background: 'transparent',
                    }}
                  >
                    Today
                  </button>
                  <div className="hidden sm:flex items-center gap-1 p-1 rounded" style={{ background: 'var(--cyber-surface)' }}>
                    {(["month", "week", "day"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className="px-3 py-1 rounded"
                        style={{
                          fontFamily: '"Orbitron", sans-serif',
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          background: view === v ? 'rgba(0,240,255,0.15)' : 'transparent',
                          color: view === v ? 'var(--cyber-cyan)' : 'var(--cyber-text-muted)',
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="h-8 px-3"
                    style={{ background: 'var(--cyber-cyan)', color: 'var(--cyber-bg-darkest)', fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">New</span>
                  </Button>
                </div>
              </div>

              {/* Calendar Grid — 7-column, works at 375px */}
              <div className="flex-1 overflow-y-auto px-1 sm:px-4 py-2">
                {/* Day headers */}
                <div className="grid grid-cols-7">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div
                      key={i}
                      className="text-center py-2"
                      style={{
                        fontFamily: '"Orbitron", sans-serif',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        color: 'var(--cyber-cyan)',
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Date cells */}
                <div className="grid grid-cols-7" style={{ border: '1px solid var(--cyber-border)' }}>
                  {days.map((day, idx) => {
                    const dayAppointments = day ? getAppointmentsForDay(day) : []
                    const isToday = day === today.getDate() && isCurrentMonth
                    const isSelected = day === selectedDay

                    return (
                      <div
                        key={idx}
                        onClick={() => day && setSelectedDay(day)}
                        className={day ? "cursor-pointer" : ""}
                        style={{
                          height: '48px',
                          padding: '2px 4px',
                          borderRight: '1px solid var(--cyber-border)',
                          borderBottom: '1px solid var(--cyber-border)',
                          background: isSelected
                            ? 'rgba(0,240,255,0.1)'
                            : day
                              ? 'transparent'
                              : 'rgba(0,0,0,0.3)',
                          position: 'relative',
                          boxShadow: isToday ? 'inset 0 0 0 1px var(--cyber-cyan)' : 'none',
                        }}
                      >
                        {day && (
                          <>
                            <span
                              style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '0.7rem',
                                color: isToday
                                  ? 'var(--cyber-cyan)'
                                  : 'var(--cyber-text-primary)',
                              }}
                            >
                              {day}
                            </span>
                            {dayAppointments.length > 0 && (
                              <div className="flex gap-0.5 mt-0.5 overflow-hidden">
                                {dayAppointments.slice(0, 2).map((apt) => (
                                  <div
                                    key={apt.id}
                                    className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${apt.color}`}
                                  />
                                ))}
                                {dayAppointments.length > 2 && (
                                  <span style={{ fontSize: '0.5rem', color: 'var(--cyber-text-muted)' }}>+{dayAppointments.length - 2}</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Selected day appointments */}
                {selectedDay && (
                  <div className="mt-4 px-1">
                    <p
                      className="mb-2"
                      style={{
                        fontFamily: '"Orbitron", sans-serif',
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--cyber-text-muted)',
                      }}
                    >
                      <span style={{ color: 'var(--cyber-cyan)' }}>// </span>
                      {currentDate.toLocaleDateString("en-US", { month: "long" })} {selectedDay}
                    </p>

                    {selectedDayAppointments.length === 0 ? (
                      <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--cyber-text-muted)', padding: '12px 0' }}>
                        No appointments
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayAppointments.map((apt) => (
                          <button
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded transition-colors"
                            style={{
                              background: 'var(--cyber-surface)',
                              border: '1px solid var(--cyber-border)',
                              minHeight: '44px',
                            }}
                          >
                            <div className={`w-2 h-8 rounded-sm flex-shrink-0 ${apt.color}`} />
                            <div className="min-w-0 flex-1">
                              <p style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyber-text-primary)' }} className="truncate">
                                {apt.title}
                              </p>
                              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', color: 'var(--cyber-text-muted)' }}>
                                {apt.allDay ? "All day" : `${apt.startTime} – ${apt.endTime}`} · {apt.contact}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // List View
            <div className="h-full flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--cyber-border)' }}>
                <h2 style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cyber-text-primary)' }}>Appointments</h2>
                <div className="flex items-center gap-2">
                  <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--cyber-text-muted)' }} />
                    <Input placeholder="Search..." className="pl-9" style={{ background: 'var(--cyber-bg-dark)', borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-primary)' }} />
                  </div>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="h-8 px-3"
                    style={{ background: 'var(--cyber-cyan)', color: 'var(--cyber-bg-darkest)', fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase' }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    New
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {/* Mobile list */}
                <div className="sm:hidden divide-y" style={{ borderColor: 'var(--cyber-border)' }}>
                  {appointments.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors"
                      style={{ borderBottom: '1px solid var(--cyber-border)', minHeight: '44px' }}
                    >
                      <div className={`w-2 h-8 rounded-sm flex-shrink-0 ${apt.color}`} />
                      <div className="min-w-0 flex-1">
                        <p style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyber-text-primary)' }} className="truncate">{apt.title}</p>
                        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', color: 'var(--cyber-text-muted)' }}>
                          {apt.date} · {apt.allDay ? "All day" : `${apt.startTime} – ${apt.endTime}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Desktop table */}
                <table className="w-full hidden sm:table">
                  <thead className="sticky top-0" style={{ background: 'var(--cyber-bg-dark)' }}>
                    <tr>
                      {["Date & Time", "Contact", "Type", "Assigned", "Duration", "Status", ""].map((h) => (
                        <th key={h} className="text-left p-4" style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cyber-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr
                        key={apt.id}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: '1px solid var(--cyber-border)' }}
                        onClick={() => setSelectedAppointment(apt)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,240,255,0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="p-4">
                          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--cyber-text-primary)' }}>{apt.date}</div>
                          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: 'var(--cyber-text-muted)' }}>{apt.startTime} - {apt.endTime}</div>
                        </td>
                        <td className="p-4" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--cyber-text-secondary)' }}>{apt.contact}</td>
                        <td className="p-4"><Badge className={`${apt.color} border-0 text-white`}>{apt.type}</Badge></td>
                        <td className="p-4" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--cyber-text-secondary)' }}>{apt.assignedTo}</td>
                        <td className="p-4" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--cyber-text-secondary)' }}>{apt.allDay ? "All Day" : "1h"}</td>
                        <td className="p-4"><Badge variant="outline" style={{ borderColor: 'var(--cyber-cyan)', color: 'var(--cyber-cyan)' }}>Scheduled</Badge></td>
                        <td className="p-4"><Button variant="ghost" size="sm" style={{ color: 'var(--cyber-text-muted)' }}><MoreVertical className="w-4 h-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl" style={{ background: 'var(--cyber-bg-dark)', border: '1px solid var(--cyber-border)', color: 'var(--cyber-text-primary)' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: '"Orbitron", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selectedAppointment?.title}</DialogTitle>
            <DialogDescription style={{ color: 'var(--cyber-text-muted)' }}>Appointment Details</DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--cyber-text-secondary)' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--cyber-text-muted)' }} />
                <span>{selectedAppointment.date} · {selectedAppointment.startTime} - {selectedAppointment.endTime}</span>
              </div>
              <div className="flex items-center gap-3" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--cyber-text-secondary)' }}>
                <Users className="w-4 h-4" style={{ color: 'var(--cyber-text-muted)' }} />
                <span>{selectedAppointment.contact}</span>
              </div>
              <div className="flex items-center gap-3" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--cyber-text-secondary)' }}>
                <MapPin className="w-4 h-4" style={{ color: 'var(--cyber-text-muted)' }} />
                <span>Virtual Meeting</span>
              </div>
              <div className="pt-4" style={{ borderTop: '1px solid var(--cyber-border)' }}>
                <h4 style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)', marginBottom: '8px' }}>Assigned To</h4>
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--cyber-text-secondary)' }}>{selectedAppointment.assignedTo}</p>
              </div>
              <div className="pt-4" style={{ borderTop: '1px solid var(--cyber-border)' }}>
                <h4 style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)', marginBottom: '8px' }}>Type</h4>
                <Badge className={`${selectedAppointment.color} border-0 text-white`}>{selectedAppointment.type}</Badge>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" style={{ background: 'var(--cyber-cyan)', color: 'var(--cyber-bg-darkest)' }}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" className="flex-1" style={{ borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-secondary)', background: 'transparent' }}>
                  Reschedule
                </Button>
                <Button variant="outline" style={{ borderColor: '#ef4444', color: '#ef4444', background: 'transparent' }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Appointment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl" style={{ background: 'var(--cyber-bg-dark)', border: '1px solid var(--cyber-border)', color: 'var(--cyber-text-primary)' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: '"Orbitron", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create Appointment</DialogTitle>
            <DialogDescription style={{ color: 'var(--cyber-text-muted)' }}>Schedule a new appointment</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)' }} className="mb-2 block">Contact</label>
              <Input placeholder="Search or select contact..." style={{ background: 'var(--cyber-bg-darkest)', borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-primary)' }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)' }} className="mb-2 block">Date</label>
                <Input type="date" style={{ background: 'var(--cyber-bg-darkest)', borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-primary)' }} />
              </div>
              <div>
                <label style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)' }} className="mb-2 block">Time</label>
                <Input type="time" style={{ background: 'var(--cyber-bg-darkest)', borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-primary)' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)' }} className="mb-2 block">Duration</label>
                <Select>
                  <SelectTrigger style={{ background: 'var(--cyber-bg-darkest)', borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-primary)' }}>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--cyber-bg-dark)', borderColor: 'var(--cyber-border)' }}>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)' }} className="mb-2 block">Type</label>
                <Select>
                  <SelectTrigger style={{ background: 'var(--cyber-bg-darkest)', borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-primary)' }}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--cyber-bg-dark)', borderColor: 'var(--cyber-border)' }}>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)' }} className="mb-2 block">Assigned To</label>
              <Select>
                <SelectTrigger style={{ background: 'var(--cyber-bg-darkest)', borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-primary)' }}>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent style={{ background: 'var(--cyber-bg-dark)', borderColor: 'var(--cyber-border)' }}>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)' }} className="mb-2 block">Location / Meeting Link</label>
              <Input placeholder="Enter location or meeting URL..." style={{ background: 'var(--cyber-bg-darkest)', borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-primary)' }} />
            </div>
            <div>
              <label style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-text-muted)' }} className="mb-2 block">Notes</label>
              <Textarea placeholder="Add notes..." className="min-h-[100px]" style={{ background: 'var(--cyber-bg-darkest)', borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-primary)' }} />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowCreateModal(false)} variant="outline" className="flex-1" style={{ borderColor: 'var(--cyber-border)', color: 'var(--cyber-text-secondary)', background: 'transparent' }}>
                Cancel
              </Button>
              <Button className="flex-1" style={{ background: 'var(--cyber-cyan)', color: 'var(--cyber-bg-darkest)' }}>
                <Plus className="w-4 h-4 mr-2" /> Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
