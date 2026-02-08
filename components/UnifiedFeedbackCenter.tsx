"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, MessageSquare, AlertTriangle, MessageSquarePlus, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Check, Loader2, ThumbsUp, ArrowUp, ArrowDown, Clock, User, Pencil, X, Save, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"

type FeedbackType = "select" | "idea" | "feedback" | "broken"

interface UserProfile {
    name: string
    email: string
    title: string
    store_number: string
}

export function UnifiedFeedbackCenter() {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<FeedbackType>("select")

    // Profile State
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [showProfileCancelConfirm, setShowProfileCancelConfirm] = useState(false)
    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: "",
        email: "",
        title: "",
        store_number: ""
    })
    const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // Form States
    const [ideaForm, setIdeaForm] = useState({ description: "", category: "" })
    const [feedbackForm, setFeedbackForm] = useState({ rating: 3, text: "" })
    const [brokenForm, setBrokenForm] = useState({ description: "", isUrgent: false })
    const [attachment, setAttachment] = useState<File | null>(null)

    const isFormValid = () => {
        if (mode === "idea") {
            return ideaForm.category !== "" && ideaForm.description.trim().length > 0
        }
        if (mode === "feedback") {
            return feedbackForm.text.trim().length > 0
        }
        if (mode === "broken") {
            return brokenForm.description.trim().length > 0
        }
        return false
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            // Reset logic could go here
            setTimeout(() => {
                setMode("select")
                setIsSuccess(false) // Ensure success state is reset on dialog close
                setAttachment(null)
                setIdeaForm({ description: "", category: "" })
                setFeedbackForm({ rating: 3, text: "" })
                setBrokenForm({ description: "", isUrgent: false })
            }, 300)
        }
    }

    const [communitySort, setCommunitySort] = useState<"newest" | "high" | "low">("newest")
    const [communityFilter, setCommunityFilter] = useState<"all" | "mine">("all")

    type HistoryItem = {
        id: number
        title: string
        type: string
        status: string
        date: string // created_at mapped to relative time or filtered
        statusColor: string
        rating?: number
        feedbackText?: string
        votes: number
        author: string
        avatar: string
        isMine: boolean
        time: string // Display time
    }

    const [history, setHistory] = useState<HistoryItem[]>([])
    const [communityIdeas, setCommunityIdeas] = useState<HistoryItem[]>([])

    // Fetch data on mount
    const fetchData = async () => {
        try {
            const res = await fetch('/api/feedback')
            const data = await res.json()

            // Transform DB data to UI model
            const uiData = data.map((item: any) => ({
                id: item.id,
                title: item.title,
                type: item.type,
                status: "Received", // DB doesn't track status yet, default to Received
                date: new Date(item.created_at).toLocaleDateString(),
                statusColor: item.type === "Idea" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" :
                    item.type === "Feedback" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                rating: item.rating,
                feedbackText: item.feedback_text,
                votes: item.votes || 0,
                author: item.author || "Anonymous",
                avatar: (item.author || "AN").substring(0, 2).toUpperCase(),
                isMine: item.is_mine || false,
                time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))

            setHistory(uiData.filter((i: any) => i.isMine))
            setCommunityIdeas(uiData.filter((i: any) => i.type === "Idea"))

            // Fetch Profile
            const profileRes = await fetch('/api/profile')
            const profileData = await profileRes.json()
            if (profileData && !profileData.error) {
                setUserProfile(profileData)
            }

        } catch (error) {
            console.error("Failed to fetch data", error)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const [userVotes, setUserVotes] = useState<Set<number>>(new Set())

    const handleVote = async (id: number) => {
        // Optimistic update
        setCommunityIdeas(prev => prev.map(idea => {
            if (idea.id === id) {
                const isVoted = userVotes.has(id)
                return { ...idea, votes: isVoted ? idea.votes - 1 : idea.votes + 1 }
            }
            return idea
        }))

        // Toggle vote state locally
        let increment = 1
        setUserVotes(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
                increment = -1
            } else {
                next.add(id)
            }
            return next
        })

        // API call
        try {
            await fetch('/api/feedback/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, increment })
            })
        } catch (error) {
            console.error("Vote failed", error)
            // Could revert optimistic update here
        }
    }

    const handleSubmit = async () => {
        if (!isFormValid()) return

        setIsSubmitting(true)

        // Construct payload
        const baseData = {
            author: "You", // Hardcoded user
            is_urgent: mode === "broken" ? brokenForm.isUrgent : false
        }

        let payload: any = {}
        if (mode === "idea") {
            payload = {
                type: "Idea",
                category: ideaForm.category,
                description: ideaForm.description,
                title: ideaForm.description.substring(0, 50) + (ideaForm.description.length > 50 ? "..." : ""), // Use desc as title
                ...baseData
            }
        } else if (mode === "feedback") {
            payload = {
                type: "Feedback",
                rating: feedbackForm.rating,
                feedback_text: feedbackForm.text,
                title: "User Feedback",
                ...baseData
            }
        } else if (mode === "broken") {
            payload = {
                type: "Incident",
                description: brokenForm.description,
                title: brokenForm.description,
                ...baseData
            }
        }

        console.log("Submitting:", payload);

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            // Refresh data
            await fetchData()

            setIsSubmitting(false)
            setIsSuccess(true)

            // Reset after success
            setTimeout(() => {
                setIsSuccess(false)
                setMode("select")
                setAttachment(null)
                setIdeaForm({ description: "", category: "" })
                setFeedbackForm({ rating: 3, text: "" })
                setBrokenForm({ description: "", isUrgent: false })
            }, 2000)

        } catch (error) {
            console.error("Submission failed", error)
            setIsSubmitting(false)
        }
    }

    const sortedIdeas = [...communityIdeas]
        .filter(idea => communityFilter === "all" || (communityFilter === "mine" && idea.isMine))
        .sort((a, b) => {
            if (communitySort === "high") return b.votes - a.votes
            if (communitySort === "low") return a.votes - b.votes
            return 0 // Default original order (mock newest)
        })

    const emojis = [
        { level: 1, label: "Terrible", icon: "😠", displayName: "Terrible" },
        { level: 2, label: "Bad", icon: "🙁", displayName: "Bad" },
        { level: 3, label: "Neutral", icon: "😐", displayName: "Neutral" },
        { level: 4, label: "Good", icon: "🙂", displayName: "Good" },
        { level: 5, label: "Great", icon: "😍", displayName: "Great" },
    ]

    const selectionOptions = [
        {
            id: "idea",
            title: "I have an idea",
            icon: Lightbulb,
            color: "text-yellow-500",
            bg: "bg-yellow-50 dark:bg-yellow-950/30",
            description: "Suggest a new feature or improvement."
        },
        {
            id: "feedback",
            title: "Share a thought",
            icon: MessageSquare,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            description: "Tell us about your experience."
        },
        {
            id: "broken",
            title: "Something is broken",
            icon: AlertTriangle,
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-950/30",
            description: "Report a bug or performance issue."
        }
    ]

    return (
        <>
            {/* Feedback Trigger - hidden when open */}
            {!open && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button
                        onClick={() => setOpen(true)}
                        className="rounded-full shadow-lg gap-2 h-14 pl-4 pr-6"
                    >
                        <MessageSquarePlus className="h-5 w-5" />
                        <span className="text-lg font-medium">Feedback</span>
                    </Button>
                </div>
            )}

            {/* Profile Icon Header - hidden when open */}
            {!open && (
                <div className="fixed top-6 right-6 z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-sm hover:shadow-md bg-white dark:bg-zinc-900"
                        onClick={() => setIsProfileOpen(true)}
                    >
                        <Avatar className="h-full w-full">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {userProfile.name ? userProfile.name.substring(0, 2).toUpperCase() : "GU"}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </div>
            )}

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="w-[95vw] sm:max-w-[700px] h-[85vh] sm:h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                    {/* Header Area */}
                    <div className="p-4 sm:p-6 pb-2">
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                {mode !== "select" && (
                                    <Button variant="ghost" size="icon" onClick={() => setMode("select")} className="-ml-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                )}
                                <DialogTitle className="text-xl sm:text-2xl font-semibold">
                                    {mode === "select" ? "Feedback Center" :
                                        mode === "idea" ? "Submit an Idea" :
                                            mode === "feedback" ? "Share Feedback" : "Report Issue"}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-sm">
                                {mode === "select" ? "Help us improve by sharing your ideas, feedback, or reporting issues." :
                                    mode === "idea" ? "We'd love to hear your innovative ideas." :
                                        mode === "feedback" ? "Your thoughts help us create better experiences." : "Let us know what's not working correctly."}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Tabs Area */}
                    <Tabs defaultValue="submit" className="flex-1 flex flex-col w-full h-full overflow-hidden">
                        <AnimatePresence>
                            {mode === "select" && (
                                <motion.div
                                    initial={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-4 sm:px-6 border-b overflow-hidden"
                                >
                                    <TabsList className="grid w-full grid-cols-3 mb-4 h-auto py-1">
                                        <TabsTrigger value="submit" className="px-1 text-xs sm:text-sm whitespace-normal text-center h-full">Submit <span className="hidden sm:inline ml-1">Feedback</span></TabsTrigger>
                                        <TabsTrigger value="history" className="px-1 text-xs sm:text-sm whitespace-normal text-center h-full">My History</TabsTrigger>
                                        <TabsTrigger value="community" className="px-1 text-xs sm:text-sm whitespace-normal text-center h-full">Community <span className="hidden sm:inline ml-1">Ideas</span></TabsTrigger>
                                    </TabsList>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900/50">
                            <TabsContent value="submit" className="mt-0 h-full relative">
                                <AnimatePresence mode="wait">
                                    {mode === "select" ? (
                                        <motion.div
                                            key="select"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col gap-3 sm:gap-4 h-full pt-4 sm:justify-center max-w-md mx-auto pb-20"
                                        >
                                            {selectionOptions.map((option) => (
                                                <div key={option.id} onClick={() => setMode(option.id as FeedbackType)}>
                                                    <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-zinc-200 dark:border-zinc-800">
                                                        <CardContent className="flex items-center text-left p-4 gap-3 sm:gap-4">
                                                            <div className={`p-2 sm:p-3 rounded-full shrink-0 ${option.bg} ${option.color}`}>
                                                                <option.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h3 className="font-semibold text-base sm:text-lg">{option.title}</h3>
                                                                <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                                                                    {option.description}
                                                                </p>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="form"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                            className="h-full flex flex-col max-w-2xl mx-auto"
                                        >
                                            {isSuccess ? (
                                                <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                                                    <div className="h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                        <Check className="h-12 w-12 text-green-600 dark:text-green-500" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-center">Thank you!</h3>
                                                    <p className="text-muted-foreground text-center">
                                                        Your submission has been received.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6 py-2 px-1">
                                                    {/* Idea Form */}
                                                    {mode === "idea" && (
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                                                                <Select
                                                                    value={ideaForm.category}
                                                                    onValueChange={(val) => setIdeaForm({ ...ideaForm, category: val })}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Select a category" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="clothing">Clothing</SelectItem>
                                                                        <SelectItem value="technology">Technology</SelectItem>
                                                                        <SelectItem value="operations">Operations</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="desc">Description <span className="text-red-500">*</span></Label>
                                                                <Textarea
                                                                    id="desc"
                                                                    placeholder="Describe your idea in detail..."
                                                                    className="min-h-[100px]"
                                                                    value={ideaForm.description}
                                                                    onChange={(e) => setIdeaForm({ ...ideaForm, description: e.target.value })}
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Feedback Form */}
                                                    {mode === "feedback" && (
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                                            <div className="space-y-4">
                                                                <Label>How was your experience?</Label>
                                                                <div className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-800 p-2 sm:p-4 rounded-lg overflow-x-auto">
                                                                    {emojis.map((emoji) => (
                                                                        <button
                                                                            key={emoji.level}
                                                                            onClick={() => setFeedbackForm({ ...feedbackForm, rating: emoji.level })}
                                                                            className={`flex flex-col items-center gap-1 transition-all p-1 sm:p-0 hover:scale-110 ${feedbackForm.rating === emoji.level ? "text-primary scale-110 font-bold" : "text-muted-foreground opacity-70"}`}
                                                                        >
                                                                            <span className="text-2xl sm:text-3xl">{emoji.icon}</span>
                                                                            <span className="text-[10px] sm:text-xs whitespace-nowrap">{emoji.displayName}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="feedback-text">What can we do better? <span className="text-red-500">*</span></Label>
                                                                <Textarea
                                                                    id="feedback-text"
                                                                    placeholder="We value your honest feedback..."
                                                                    className="min-h-[120px]"
                                                                    value={feedbackForm.text}
                                                                    onChange={(e) => setFeedbackForm({ ...feedbackForm, text: e.target.value })}
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Broken Form */}
                                                    {mode === "broken" && (
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="broken-desc">Short Description <span className="text-red-500">*</span></Label>
                                                                <Input
                                                                    id="broken-desc"
                                                                    placeholder="What isn't working?"
                                                                    value={brokenForm.description}
                                                                    onChange={(e) => setBrokenForm({ ...brokenForm, description: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between p-4 border rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50">
                                                                <div className="space-y-0.5">
                                                                    <Label className="text-base">High Urgency</Label>
                                                                    <p className="text-sm text-muted-foreground">Is this blocking your work?</p>
                                                                </div>
                                                                <Switch
                                                                    checked={brokenForm.isUrgent}
                                                                    onCheckedChange={(checked) => setBrokenForm({ ...brokenForm, isUrgent: checked })}
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Attachment (Common) */}
                                                    <div className="space-y-2 pt-2">
                                                        <Label htmlFor="attachment">Attachment (Optional)</Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="attachment"
                                                                type="file"
                                                                className="pl-10 cursor-pointer text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                                                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                                            />
                                                            <Upload className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                        </div>
                                                    </div>

                                                    <Button
                                                        className="w-full h-11 text-base mt-2"
                                                        onClick={handleSubmit}
                                                        disabled={isSubmitting || !isFormValid()}
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Submitting...
                                                            </>
                                                        ) : "Submit Feedback"}
                                                    </Button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </TabsContent>

                            <TabsContent value="history" className="mt-0 h-full">
                                <ScrollArea className="h-full">
                                    <div className="p-1 sm:p-6 space-y-4">
                                        <h3 className="text-lg font-semibold mb-4 px-1">Your Recent Submissions</h3>
                                        {history.map((item) => (
                                            <Card key={item.id} className="overflow-hidden">
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="space-y-1 w-full">
                                                        <div className="flex items-center justify-between mb-2 gap-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.statusColor}`}>
                                                                    {item.status}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.date}</span>
                                                            </div>
                                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">{item.type}</span>
                                                        </div>

                                                        {item.type === "Feedback" && item.rating ? (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xl">{emojis[item.rating - 1]?.icon}</span>
                                                                    <span className="font-medium text-sm">{emojis[item.rating - 1]?.label}</span>
                                                                </div>
                                                                <p className="text-sm text-foreground bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md border italic">
                                                                    "{item.feedbackText || item.title}"
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="font-medium">{item.title}</p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="community" className="mt-0 h-full">
                                <div className="flex flex-col h-full">
                                    <div className="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="flex gap-1 bg-background p-1 rounded-md border w-full sm:w-auto overflow-x-auto">
                                            <Button
                                                variant={communityFilter === "all" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs flex-1 sm:flex-none"
                                                onClick={() => setCommunityFilter("all")}
                                            >
                                                All
                                            </Button>
                                            <Button
                                                variant={communityFilter === "mine" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs flex-1 sm:flex-none whitespace-nowrap"
                                                onClick={() => setCommunityFilter("mine")}
                                            >
                                                My Ideas
                                            </Button>
                                        </div>
                                        <div className="flex gap-1 bg-background p-1 rounded-md border w-full sm:w-auto overflow-x-auto">
                                            <Button
                                                variant={communitySort === "newest" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs flex-1 sm:flex-none"
                                                onClick={() => setCommunitySort("newest")}
                                            >
                                                Newest
                                            </Button>
                                            <Button
                                                variant={communitySort === "high" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs flex-1 sm:flex-none whitespace-nowrap"
                                                onClick={() => setCommunitySort("high")}
                                            >
                                                High Votes
                                            </Button>
                                            <Button
                                                variant={communitySort === "low" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs flex-1 sm:flex-none whitespace-nowrap"
                                                onClick={() => setCommunitySort("low")}
                                            >
                                                Low Votes
                                            </Button>
                                        </div>
                                    </div>

                                    <ScrollArea className="flex-1 p-0">
                                        <div className="p-4 sm:p-6 space-y-4">
                                            {sortedIdeas.length === 0 ? (
                                                <div className="text-center text-muted-foreground py-10">
                                                    No ideas found.
                                                </div>
                                            ) : (
                                                sortedIdeas.map((idea) => {
                                                    const isVoted = userVotes.has(idea.id)
                                                    return (
                                                        <div key={idea.id} className={`flex items-start gap-4 p-4 rounded-xl border shadow-sm ${idea.isMine ? "bg-primary/5 border-primary/20" : "bg-card text-card-foreground"}`}>
                                                            <div className="flex flex-col items-center gap-1 min-w-[50px]">
                                                                <Button
                                                                    variant={isVoted ? "default" : "outline"}
                                                                    size="icon"
                                                                    className={`h-8 w-8 rounded-full ${!isVoted && !idea.isMine && "hover:bg-primary/10 hover:text-primary hover:border-primary/50"}`}
                                                                    onClick={() => handleVote(idea.id)}
                                                                    disabled={idea.isMine}
                                                                >
                                                                    <ThumbsUp className={`h-4 w-4 ${isVoted ? "fill-current" : ""}`} />
                                                                </Button>
                                                                <span className={`text-sm font-bold ${isVoted ? "text-primary" : ""}`}>{idea.votes}</span>
                                                            </div>
                                                            <div className="flex-1 space-y-2 min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <h4 className="font-semibold leading-snug break-words">{idea.title}</h4>
                                                                    {idea.isMine && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">YOU</span>}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                    <Avatar className="h-5 w-5">
                                                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{idea.avatar}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{idea.author}</span>
                                                                    <span>•</span>
                                                                    <span>{idea.time}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Profile Dialog */}
            <Dialog open={isProfileOpen} onOpenChange={(val) => {
                if (!val && isEditingProfile) {
                    // Try to close while editing
                    if (JSON.stringify(userProfile) !== JSON.stringify(editedProfile)) {
                        setShowProfileCancelConfirm(true)
                        return
                    }
                }
                setIsProfileOpen(val)
                if (!val) {
                    setIsEditingProfile(false)
                    setShowProfileCancelConfirm(false)
                    setEditedProfile(null)
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>User Profile</DialogTitle>
                        <DialogDescription>Manage your personal information.</DialogDescription>
                    </DialogHeader>

                    {showProfileCancelConfirm ? (
                        <div className="py-6 space-y-4 animate-in fade-in zoom-in duration-200">
                            <div className="flex flex-col items-center justify-center text-center space-y-2">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
                                    <AlertTriangle className="h-8 w-8" />
                                </div>
                                <h3 className="font-semibold text-lg">Discard Changes?</h3>
                                <p className="text-muted-foreground">You have unsaved changes. Are you sure you want to discard them?</p>
                            </div>
                            <div className="flex gap-2 justify-center pt-2">
                                <Button variant="outline" onClick={() => setShowProfileCancelConfirm(false)}>
                                    Keep Editing
                                </Button>
                                <Button variant="destructive" onClick={() => {
                                    setIsEditingProfile(false)
                                    setShowProfileCancelConfirm(false)
                                    setEditedProfile(null)
                                }}>
                                    Yes, Discard
                                </Button>
                            </div>
                        </div>
                    ) : isEditingProfile && editedProfile ? (
                        <div className="space-y-4 py-2">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-name">Full Name</Label>
                                    <Input
                                        id="p-name"
                                        value={editedProfile.name}
                                        onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-email">Email</Label>
                                    <Input
                                        id="p-email"
                                        value={editedProfile.email}
                                        onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="p-title">Job Title</Label>
                                        <Input
                                            id="p-title"
                                            value={editedProfile.title}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, title: e.target.value })}
                                            placeholder="store_associate"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="p-store">Store #</Label>
                                        <Input
                                            id="p-store"
                                            value={editedProfile.store_number}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, store_number: e.target.value })}
                                            placeholder="001"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <Button variant="ghost" onClick={() => {
                                    if (JSON.stringify(userProfile) !== JSON.stringify(editedProfile)) {
                                        setShowProfileCancelConfirm(true)
                                    } else {
                                        setIsEditingProfile(false)
                                    }
                                }}>
                                    Cancel
                                </Button>
                                <Button onClick={async () => {
                                    try {
                                        const res = await fetch('/api/profile', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(editedProfile)
                                        })
                                        const updated = await res.json()
                                        if (!updated.error) {
                                            setUserProfile(updated)
                                            setIsEditingProfile(false)
                                            setEditedProfile(null)
                                        }
                                    } catch (e) {
                                        console.error("Failed to save profile", e)
                                    }
                                }}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 py-2">
                            <div className="flex flex-col items-center justify-center space-y-2 pb-4 border-b">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                        {userProfile.name ? userProfile.name.substring(0, 2).toUpperCase() : "GU"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold">{userProfile.name}</h3>
                                    <p className="text-muted-foreground text-sm">{userProfile.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Job Title</p>
                                    <p className="font-medium">{userProfile.title || "Not Set"}</p>
                                </div>
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Store ID</p>
                                    <p className="font-medium">{userProfile.store_number || "Not Set"}</p>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button variant="outline" className="w-full" onClick={() => {
                                    setEditedProfile({ ...userProfile })
                                    setIsEditingProfile(true)
                                }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
