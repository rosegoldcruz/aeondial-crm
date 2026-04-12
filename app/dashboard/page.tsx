"use client"

import type React from "react"

import { useState } from "react"
import { LayoutDashboard, Calendar, MoreVertical, ArrowRight, ArrowUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"

export default function AnalyticsDashboard() {
  const [startDate, setStartDate] = useState("2025-09-29")
  const [endDate, setEndDate] = useState("2025-10-29")

  // Opportunity Status data
  const opportunityStatusData = [{ name: "Open", value: 1, color: "#3B82F6" }]

  // Opportunity Value data
  const opportunityValueData = [
    { month: "Sep", value: 0 },
    { month: "Oct", value: 0 },
  ]

  // Funnel data
  const funnelData = [
    { stage: "New Lead / Initial Outreach", value: 0, width: 100 },
    { stage: "Contacted", value: 0, width: 80 },
    { stage: "Demo Scheduled", value: 1, width: 60 },
    { stage: "Demo Completed", value: 0, width: 40 },
    { stage: "Account Created", value: 0, width: 20 },
  ]

  // Stage Distribution data
  const stageDistributionData = [
    { name: "New Lead / Initial Outreach", value: 0, color: "#3B82F6", cumulative: "100.00%", conversion: "100.00%" },
    { name: "Contacted", value: 0, color: "#60A5FA", cumulative: "100.00%", conversion: "100.00%" },
    { name: "Demo Scheduled", value: 1, color: "#A855F7", cumulative: "100.00%", conversion: "100.00%" },
    { name: "Demo Completed", value: 0, color: "#EC4899", cumulative: "0.00%", conversion: "0.00%" },
    { name: "Account Created", value: 0, color: "#06B6D4", cumulative: "0.00%", conversion: "0.00%" },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  }

  const ParallaxCard = ({
    children,
  }: {
    children: React.ReactNode
    depth: number
    index: number
  }) => {
    return <div className="relative">{children}</div>
  }

  return (
    <div className="min-h-screen bg-black p-3 sm:p-6 space-y-4 sm:space-y-6 perspective-1000">
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-1">
            <LayoutDashboard className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-orange-500">Dashboard</h1>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3 sm:gap-4">
          {/* Date Range Selector */}
          <div className="flex flex-1 sm:flex-none items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 sm:px-4 py-2 hover:border-orange-500/50 transition-colors">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-xs sm:text-sm border-none outline-none min-w-0"
            />
            <span className="text-neutral-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-xs sm:text-sm border-none outline-none min-w-0"
            />
            <Calendar className="w-4 h-4 text-neutral-400" />
          </div>

          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Card 1: Opportunity Status - Depth 3 (furthest) */}
        <motion.div variants={cardVariants}>
          <ParallaxCard depth={3} index={0}>
            <div className="relative">
              <Card className="relative bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-white text-lg">Opportunity Status</CardTitle>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full sm:w-[140px] bg-neutral-800 border-neutral-700 text-white hover:border-orange-500/50 transition-colors">
                        <SelectValue placeholder="All Pipelines" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pipelines</SelectItem>
                        <SelectItem value="aeon">AEON Pipeline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <motion.div
                      className="text-4xl font-bold text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      1
                    </motion.div>
                    <div className="flex items-center gap-1 text-sm text-green-500">
                      <ArrowUp className="w-4 h-4" />
                      <span>100% vs Last 31 Days</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={opportunityStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={0}
                            dataKey="value"
                          >
                            {opportunityStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">1</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-neutral-400">Open - 1</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ParallaxCard>
        </motion.div>

        {/* Card 2: Opportunity Value - Depth 2 (middle) */}
        <motion.div variants={cardVariants}>
          <ParallaxCard depth={2} index={1}>
            <div className="relative">
              <Card className="relative bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-white text-lg">Opportunity Value</CardTitle>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full sm:w-[140px] bg-neutral-800 border-neutral-700 text-white hover:border-orange-500/50 transition-colors">
                        <SelectValue placeholder="All Pipelines" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pipelines</SelectItem>
                        <SelectItem value="aeon">AEON Pipeline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <motion.div
                      className="text-4xl font-bold text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    >
                      $0
                    </motion.div>
                    <div className="flex items-center gap-1 text-sm text-neutral-400">
                      <ArrowRight className="w-4 h-4" />
                      <span>0% vs Last 31 Days</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={opportunityValueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="month" stroke="#737373" />
                        <YAxis stroke="#737373" />
                        <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-sm text-neutral-400">
                    Total revenue <span className="text-white font-medium">$0</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ParallaxCard>
        </motion.div>

        {/* Card 3: Conversion - Depth 1 (closest) */}
        <motion.div variants={cardVariants}>
          <ParallaxCard depth={1} index={2}>
            <div className="relative">
              <Card className="relative bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-white text-lg">Conversion</CardTitle>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full sm:w-[140px] bg-neutral-800 border-neutral-700 text-white hover:border-orange-500/50 transition-colors">
                        <SelectValue placeholder="All Pipelines" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pipelines</SelectItem>
                        <SelectItem value="aeon">AEON Pipeline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <motion.div
                      className="text-4xl font-bold text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                    >
                      $0
                    </motion.div>
                    <div className="flex items-center gap-1 text-sm text-green-500">
                      <ArrowUp className="w-4 h-4" />
                      <span>0% vs Last 31 Days</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="60" stroke="#262626" strokeWidth="12" fill="none" />
                        <circle
                          cx="80"
                          cy="80"
                          r="60"
                          stroke="#3B82F6"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${0 * 3.77} ${377 - 0 * 3.77}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">0%</span>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-neutral-400">
                      Won revenue <span className="text-white font-medium">$0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ParallaxCard>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Card 4: Funnel - Depth 2 */}
        <motion.div variants={cardVariants}>
          <ParallaxCard depth={2} index={3}>
            <div className="relative">
              <Card className="relative bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-white text-lg">Funnel</CardTitle>
                    <Select defaultValue="aeon">
                      <SelectTrigger className="w-full sm:w-[140px] bg-neutral-800 border-neutral-700 text-white hover:border-orange-500/50 transition-colors">
                        <SelectValue placeholder="AEON Pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aeon">AEON Pipeline</SelectItem>
                        <SelectItem value="all">All Pipelines</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <motion.div
                      className="text-4xl font-bold text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    >
                      $0
                    </motion.div>
                    <div className="flex items-center gap-1 text-sm text-green-500">
                      <ArrowUp className="w-4 h-4" />
                      <span>0% vs Last 31 Days</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funnelData.map((stage, index) => (
                      <motion.div
                        key={index}
                        className="space-y-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + index * 0.1 }}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-400">{stage.stage}</span>
                          <span className="text-white">${stage.value}</span>
                        </div>
                        <div className="h-8 bg-neutral-800 rounded overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.width}%` }}
                            transition={{ delay: 1 + index * 0.1, duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ParallaxCard>
        </motion.div>

        {/* Card 5: Stage Distribution - Depth 1 */}
        <motion.div variants={cardVariants}>
          <ParallaxCard depth={1} index={4}>
            <div className="relative">
              <Card className="relative bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-white text-lg">Stage Distribution</CardTitle>
                    <Select defaultValue="aeon">
                      <SelectTrigger className="w-full sm:w-[140px] bg-neutral-800 border-neutral-700 text-white hover:border-orange-500/50 transition-colors">
                        <SelectValue placeholder="AEON Pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aeon">AEON Pipeline</SelectItem>
                        <SelectItem value="all">All Pipelines</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <motion.div
                      className="text-4xl font-bold text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                    >
                      1
                    </motion.div>
                    <div className="flex items-center gap-1 text-sm text-green-500">
                      <ArrowUp className="w-4 h-4" />
                      <span>100% vs Last 31 Days</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-neutral-400 pb-2 border-b border-neutral-800">
                        <span>Cumulative</span>
                        <span>Next Step</span>
                      </div>
                      {stageDistributionData.map((stage, index) => (
                        <div key={index} className="space-y-1">
                          <div className="text-xs text-neutral-400 truncate">{stage.name}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-white">
                            <span>{stage.cumulative}</span>
                            <span>{stage.conversion}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-32 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stageDistributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {stageDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">1</span>
                        </div>
                      </div>
                      <div className="mt-4 space-y-1">
                        {stageDistributionData.map((stage, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }}></div>
                            <span className="text-neutral-400 truncate max-w-[120px]">{stage.name}</span>
                            <span className="text-white">{stage.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ParallaxCard>
        </motion.div>
      </motion.div>
    </div>
  )
}
