"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Upload,
  Settings2,
  LayoutGrid,
  List,
  Search,
  Filter,
  Phone,
  Mail,
  DollarSign,
  Clock,
  X,
  GripVertical,
  MoreVertical,
  Paperclip,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const stages = [
  { id: "new", name: "New Lead / Initial Outreach", count: 0, value: 0, color: "bg-blue-500" },
  { id: "contacted", name: "Contacted", count: 0, value: 0, color: "bg-purple-500" },
  { id: "demo-scheduled", name: "Demo Scheduled", count: 1, value: 0, color: "bg-yellow-500" },
  { id: "demo-completed", name: "Demo Completed", count: 0, value: 0, color: "bg-cyan-500" },
  { id: "account-created", name: "Account Created", count: 0, value: 0, color: "bg-indigo-500" },
  { id: "won", name: "Won", count: 0, value: 0, color: "bg-green-500" },
  { id: "lost", name: "Lost", count: 0, value: 0, color: "bg-red-500" },
]

const sampleOpportunity = {
  id: "1",
  contactName: "John Smith",
  company: "Acme Corp",
  businessName: "Enterprise Software Deal",
  value: 25000,
  stage: "demo-scheduled",
  closeDate: "2025-11-15",
  owner: "Sarah Johnson",
  source: "Website",
  lastActivity: "2 hours ago",
  priority: "high",
  phone: "+1 (555) 123-4567",
  email: "john.smith@acme.com",
}

export default function OpportunitiesPage() {
  const [viewMode, setViewMode] = useState<"board" | "list">("board")
  const [selectedPipeline, setSelectedPipeline] = useState("aeon")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<typeof sampleOpportunity | null>(null)

  return (
    <div className="text-white">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-orange-500">Opportunities</h1>
              <p className="text-sm text-neutral-400 mt-1">Manage your sales pipeline</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                <SelectTrigger className="w-48 bg-neutral-800 border-neutral-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aeon">AEON Pipeline</SelectItem>
                  <SelectItem value="sales">Sales Pipeline</SelectItem>
                  <SelectItem value="enterprise">Enterprise Pipeline</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 bg-neutral-800 rounded-lg p-1">
                <Button
                  variant={viewMode === "board" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("board")}
                  className={viewMode === "board" ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Board View
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  <List className="w-4 h-4 mr-2" />
                  List View
                </Button>
              </div>

              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Opportunity
              </Button>
              <Button variant="outline" className="border-neutral-700 bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" className="border-neutral-700 bg-transparent">
                <Settings2 className="w-4 h-4 mr-2" />
                Manage Fields
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input placeholder="Search opportunities..." className="pl-10 bg-neutral-800 border-neutral-700" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40 bg-neutral-800 border-neutral-700">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                <SelectItem value="me">Me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="border-neutral-700 bg-transparent"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Date Range</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-neutral-800 border-neutral-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Value Range</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-neutral-800 border-neutral-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Values</SelectItem>
                      <SelectItem value="0-10k">$0 - $10k</SelectItem>
                      <SelectItem value="10k-50k">$10k - $50k</SelectItem>
                      <SelectItem value="50k+">$50k+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Source</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-neutral-800 border-neutral-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="cold-call">Cold Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Priority</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-neutral-800 border-neutral-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === "board" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-80 bg-neutral-900 rounded-lg border border-neutral-800">
                <div className="p-4 border-b border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <h3 className="font-semibold text-sm">{stage.name}</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-neutral-400">
                    {stage.count} Opportunities • ${stage.value.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 space-y-3 min-h-[200px]">
                  {stage.id === "demo-scheduled" && (
                    <div
                      className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 hover:border-orange-500 transition-colors cursor-pointer group"
                      onClick={() => setSelectedOpportunity(sampleOpportunity)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-orange-500 text-white text-xs">
                              {sampleOpportunity.contactName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{sampleOpportunity.contactName}</div>
                            <div className="text-xs text-neutral-400">{sampleOpportunity.company}</div>
                          </div>
                        </div>
                        <GripVertical className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                      </div>

                      <div className="text-sm mb-3">{sampleOpportunity.businessName}</div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-green-500 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          {sampleOpportunity.value.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Phone className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Mail className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sampleOpportunity.lastActivity}
                        </div>
                        {sampleOpportunity.priority === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            High Priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-lg border border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-800">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-neutral-400">Opportunity Name</th>
                    <th className="text-left p-4 text-xs font-medium text-neutral-400">Contact Name</th>
                    <th className="text-left p-4 text-xs font-medium text-neutral-400">Stage</th>
                    <th className="text-left p-4 text-xs font-medium text-neutral-400">Value</th>
                    <th className="text-left p-4 text-xs font-medium text-neutral-400">Close Date</th>
                    <th className="text-left p-4 text-xs font-medium text-neutral-400">Owner</th>
                    <th className="text-left p-4 text-xs font-medium text-neutral-400">Source</th>
                    <th className="text-left p-4 text-xs font-medium text-neutral-400">Last Activity</th>
                    <th className="text-left p-4 text-xs font-medium text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className="border-b border-neutral-800 hover:bg-neutral-800/50 cursor-pointer"
                    onClick={() => setSelectedOpportunity(sampleOpportunity)}
                  >
                    <td className="p-4">
                      <div className="font-medium">{sampleOpportunity.businessName}</div>
                      <div className="text-xs text-neutral-400">{sampleOpportunity.company}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-orange-500 text-white text-xs">
                            {sampleOpportunity.contactName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {sampleOpportunity.contactName}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Demo Scheduled</Badge>
                    </td>
                    <td className="p-4 text-green-500 font-semibold">${sampleOpportunity.value.toLocaleString()}</td>
                    <td className="p-4 text-sm">{sampleOpportunity.closeDate}</td>
                    <td className="p-4 text-sm">{sampleOpportunity.owner}</td>
                    <td className="p-4 text-sm">{sampleOpportunity.source}</td>
                    <td className="p-4 text-sm text-neutral-400">{sampleOpportunity.lastActivity}</td>
                    <td className="p-4">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Opportunity Detail Panel */}
      {selectedOpportunity && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedOpportunity(null)} />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-neutral-900 border-l border-neutral-800 z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Opportunity Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedOpportunity(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Contact Info */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-orange-500 text-white">
                      {selectedOpportunity.contactName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{selectedOpportunity.contactName}</div>
                    <div className="text-sm text-neutral-400">{selectedOpportunity.company}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span>{selectedOpportunity.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span>{selectedOpportunity.email}</span>
                  </div>
                </div>
              </div>

              {/* Deal Info */}
              <div className="bg-neutral-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3">{selectedOpportunity.businessName}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">Value</div>
                    <div className="text-green-500 font-semibold">${selectedOpportunity.value.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">Close Date</div>
                    <div className="text-sm">{selectedOpportunity.closeDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">Owner</div>
                    <div className="text-sm">{selectedOpportunity.owner}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">Source</div>
                    <div className="text-sm">{selectedOpportunity.source}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" className="border-neutral-700 bg-transparent">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>

              {/* Stage History */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Stage History</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Demo Scheduled</div>
                      <div className="text-xs text-neutral-400">2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Contacted</div>
                      <div className="text-xs text-neutral-400">1 day ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">New Lead</div>
                      <div className="text-xs text-neutral-400">3 days ago</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Activity Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-neutral-800 rounded-lg">
                    <Phone className="w-4 h-4 text-orange-500 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm">Outbound call - 5 minutes</div>
                      <div className="text-xs text-neutral-400">2 hours ago by Sarah Johnson</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-neutral-800 rounded-lg">
                    <Mail className="w-4 h-4 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm">Email sent: Follow-up proposal</div>
                      <div className="text-xs text-neutral-400">1 day ago by Sarah Johnson</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Notes</h3>
                <div className="bg-neutral-800 rounded-lg p-3 text-sm mb-3">
                  Interested in enterprise plan. Needs demo for team of 50+ users.
                </div>
                <Button variant="outline" className="w-full border-neutral-700 bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>

              {/* Attachments */}
              <div>
                <h3 className="font-semibold mb-3">Attachments</h3>
                <Button variant="outline" className="w-full border-neutral-700 bg-transparent">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Add Attachment
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
