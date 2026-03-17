"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Upload,
  Copy,
  RefreshCw,
  Info,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  CreditCard,
  User,
  Play,
  Pause,
  Volume2,
} from "lucide-react"
import Link from "next/link"

export default function BusinessSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900">
        <div className="px-3 sm:px-8 py-4 sm:py-6">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-orange-500 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
          <h1 className="text-2xl font-bold text-white">Business Profile Settings</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage your business profile information & settings</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-3 sm:p-8">
        {/* Section 1: General Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">General Information</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <Label className="text-sm text-neutral-400 mb-2 block">Business Logo</Label>
                <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center">
                  <div className="w-32 h-16 mx-auto bg-neutral-800 rounded flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-neutral-600" />
                  </div>
                  <p className="text-xs text-neutral-500 mb-4">Recommended: 350px × 180px • Max 2.5 MB</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" className="border-neutral-700 bg-transparent">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button size="sm" variant="outline" className="border-neutral-700 text-red-500 bg-transparent">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="friendlyName" className="text-sm text-neutral-400 mb-2 block">
                  Friendly Business Name
                </Label>
                <Input
                  id="friendlyName"
                  defaultValue="AEON DIALER"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="legalName" className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                  Legal Business Name
                  <Info className="w-4 h-4 text-neutral-500" />
                </Label>
                <Input
                  id="legalName"
                  defaultValue="AEON DIALER LLC"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Enter the exact legal business name, as registered with the IRS
                </p>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm text-neutral-400 mb-2 block">
                  Business Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="contact@aeondialer.com"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>

            {/* Middle Column */}
            <div className="space-y-6">
              <div>
                <Label className="text-sm text-neutral-400 mb-2 block">Location ID</Label>
                <div className="flex gap-2">
                  <Input
                    value="XchqWMQz9pdgAJtERl7lk"
                    readOnly
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                  <Button size="icon" variant="outline" className="border-neutral-700 bg-transparent">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Business Physical Address
                  <Info className="w-4 h-4 text-neutral-500" />
                </Label>
                <Input
                  placeholder="Street Address"
                  defaultValue="123 Main Street"
                  className="bg-neutral-800 border-neutral-700 text-white mb-3"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="City"
                    defaultValue="Phoenix"
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                  <Input
                    placeholder="Postal/Zip Code"
                    defaultValue="85001"
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <Select defaultValue="arizona">
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white mt-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arizona">Arizona</SelectItem>
                    <SelectItem value="california">California</SelectItem>
                    <SelectItem value="texas">Texas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <Label className="text-sm text-neutral-400 mb-2 block">Country</Label>
                <Select defaultValue="us">
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-neutral-400 mb-2 block">Time Zone</Label>
                <Select defaultValue="pst">
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pst">GMT-07:00 - America/Los_Angeles (PDT)</SelectItem>
                    <SelectItem value="mst">GMT-06:00 - America/Denver (MDT)</SelectItem>
                    <SelectItem value="cst">GMT-05:00 - America/Chicago (CDT)</SelectItem>
                    <SelectItem value="est">GMT-04:00 - America/New_York (EDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                  Platform Language
                  <Info className="w-4 h-4 text-neutral-500" />
                </Label>
                <Select defaultValue="en-us">
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-us">English (United States)</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                  Outbound Communication Language
                  <Info className="w-4 h-4 text-neutral-500" />
                </Label>
                <Select defaultValue="en-us">
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-us">English (United States)</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">Update</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Business Details */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">Business Details</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="phone" className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Business Phone
              </Label>
              <Input
                id="phone"
                defaultValue="+1 480-400-0095"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <Label className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                Branded Domain
                <Info className="w-4 h-4 text-neutral-500" />
              </Label>
              <div className="flex gap-2">
                <Input defaultValue="aeondialer.com" className="bg-neutral-800 border-neutral-700 text-white" />
                <Button variant="outline" className="border-neutral-700 bg-transparent">
                  + Add Domain
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="website" className="text-sm text-neutral-400 mb-2 block">
                Business Website
              </Label>
              <Input
                id="website"
                defaultValue="aeondialer.com"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="niche" className="text-sm text-neutral-400 mb-2 block">
                Business Niche
              </Label>
              <Input
                id="niche"
                defaultValue="Call Center Software"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <Label className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Business Currency
                <Info className="w-4 h-4 text-neutral-500" />
              </Label>
              <Select defaultValue="usd">
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD – US Dollar ($)</SelectItem>
                  <SelectItem value="eur">EUR – Euro (€)</SelectItem>
                  <SelectItem value="gbp">GBP – British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-neutral-400 mb-2 block">API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={showApiKey ? "API-key-fC1234567890abcdef" : "API-key fC•••••••••••••••••••••••••••••••990"}
                  readOnly
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="border-neutral-700 bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="border-neutral-700 bg-transparent">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">Update Information</Button>
          </div>
        </div>

        {/* Section 3: Business Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-6">Business Information</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm text-neutral-400 mb-2 block">Business Type</Label>
              <Select defaultValue="llc">
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llc">Limited Liability Company Or Sole-Proprietorship</SelectItem>
                  <SelectItem value="corp">Corporation</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="industry" className="text-sm text-neutral-400 mb-2 block">
                Business Industry
              </Label>
              <Input
                id="industry"
                defaultValue="Technology / Software"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Authorized Representative */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">Authorized Representative</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName" className="text-sm text-neutral-400 mb-2 block">
                First Name
              </Label>
              <Input id="firstName" defaultValue="John" className="bg-neutral-800 border-neutral-700 text-white" />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-sm text-neutral-400 mb-2 block">
                Last Name
              </Label>
              <Input id="lastName" defaultValue="Doe" className="bg-neutral-800 border-neutral-700 text-white" />
            </div>

            <div>
              <Label htmlFor="repEmail" className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Representative Email
              </Label>
              <Input
                id="repEmail"
                type="email"
                defaultValue="john.doe@aeondialer.com"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <Label className="text-sm text-neutral-400 mb-2 block">Job Position</Label>
              <Select defaultValue="other">
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceo">CEO</SelectItem>
                  <SelectItem value="cto">CTO</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Audio Waveform Visualization */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Volume2 className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">Voicemail Audio Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="outline"
                className="border-neutral-700 bg-transparent"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              {/* Waveform Visualization */}
              <div className="flex-1 bg-neutral-800 rounded-lg p-4 relative">
                <div className="flex items-center gap-1 h-16">
                  {/* Waveform bars */}
                  {Array.from({ length: 60 }).map((_, i) => {
                    const height = ((Math.sin(i * 0.45) + 1) / 2) * 90 + 5
                    const isActive = i < 30 // First half is "played"
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all ${
                          isActive ? "bg-orange-500" : "bg-neutral-600"
                        }`}
                        style={{
                          height: `${height}%`,
                          minHeight: "4px",
                        }}
                      />
                    )
                  })}
                </div>
                <div className="absolute top-2 right-2 text-xs text-neutral-400 font-mono">02:27</div>
              </div>

              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-neutral-500">
              Preview and manage your voicemail greeting audio. Click play to listen to the current recording.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
