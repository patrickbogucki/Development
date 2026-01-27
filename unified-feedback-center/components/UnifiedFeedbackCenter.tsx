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
import { Upload, Check, Loader2, ThumbsUp, ArrowUp, ArrowDown, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"

type FeedbackType = "select" | "idea" | "feedback" | "broken"

export function UnifiedFeedbackCenter() {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<FeedbackType>("select")

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
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setOpen(true)}
                    className="rounded-full shadow-lg gap-2 h-14 pl-4 pr-6"
                >
                    <MessageSquarePlus className="h-5 w-5" />
                    <span className="text-lg font-medium">Feedback</span>
                </Button>
            </div>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                    {/* Header Area */}
                    <div className="p-6 pb-2">
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                {mode !== "select" && (
                                    <Button variant="ghost" size="icon" onClick={() => setMode("select")} className="-ml-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                )}
                                <DialogTitle className="text-2xl font-semibold">
                                    {mode === "select" ? "Feedback Center" :
                                        mode === "idea" ? "Submit an Idea" :
                                            mode === "feedback" ? "Share Feedback" : "Report Issue"}
                                </DialogTitle>
                            </div>
                            <DialogDescription>
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
                                    className="px-6 border-b overflow-hidden"
                                >
                                    <TabsList className="grid w-full grid-cols-3 mb-4">
                                        <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
                                        <TabsTrigger value="history">My History</TabsTrigger>
                                        <TabsTrigger value="community">Community Ideas</TabsTrigger>
                                    </TabsList>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-900/50">
                            <TabsContent value="submit" className="mt-0 h-full relative">
                                <AnimatePresence mode="wait">
                                    {mode === "select" ? (
                                        <motion.div
                                            key="select"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col gap-4 h-full justify-center max-w-md mx-auto pb-20"
                                        >
                                            {selectionOptions.map((option) => (
                                                <div key={option.id} onClick={() => setMode(option.id as FeedbackType)}>
                                                    <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-zinc-200 dark:border-zinc-800">
                                                        <CardContent className="flex items-center text-left p-4 gap-4">
                                                            <div className={`p-3 rounded-full shrink-0 ${option.bg} ${option.color}`}>
                                                                <option.icon className="h-6 w-6" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h3 className="font-semibold text-lg">{option.title}</h3>
                                                                <p className="text-sm text-muted-foreground leading-snug">
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
                                                <div className="space-y-6 py-4 px-1">
                                                    {/* Idea Form */}
                                                    {mode === "idea" && (
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                                                                <Select
                                                                    value={ideaForm.category}
                                                                    onValueChange={(val) => setIdeaForm({ ...ideaForm, category: val })}
                                                                >
                                                                    <SelectTrigger>
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
                                                                <div className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                                                                    {emojis.map((emoji) => (
                                                                        <button
                                                                            key={emoji.level}
                                                                            onClick={() => setFeedbackForm({ ...feedbackForm, rating: emoji.level })}
                                                                            className={`flex flex-col items-center gap-1 transition-all hover:scale-110 ${feedbackForm.rating === emoji.level ? "text-primary scale-110 font-bold" : "text-muted-foreground opacity-70"}`}
                                                                        >
                                                                            <span className="text-3xl">{emoji.icon}</span>
                                                                            <span className="text-xs">{emoji.displayName}</span>
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
                                    <div className="p-6 space-y-4">
                                        <h3 className="text-lg font-semibold mb-4">Your Recent Submissions</h3>
                                        {history.map((item) => (
                                            <Card key={item.id} className="overflow-hidden">
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="space-y-1 w-full">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.statusColor}`}>
                                                                    {item.status}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">{item.date}</span>
                                                            </div>
                                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.type}</span>
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
                                    <div className="px-6 py-4 border-b flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="flex gap-1 bg-background p-1 rounded-md border">
                                            <Button
                                                variant={communityFilter === "all" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => setCommunityFilter("all")}
                                            >
                                                All
                                            </Button>
                                            <Button
                                                variant={communityFilter === "mine" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => setCommunityFilter("mine")}
                                            >
                                                My Ideas
                                            </Button>
                                        </div>
                                        <div className="flex gap-1 bg-background p-1 rounded-md border">
                                            <Button
                                                variant={communitySort === "newest" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => setCommunitySort("newest")}
                                            >
                                                Newest
                                            </Button>
                                            <Button
                                                variant={communitySort === "high" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => setCommunitySort("high")}
                                            >
                                                High Votes
                                            </Button>
                                            <Button
                                                variant={communitySort === "low" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => setCommunitySort("low")}
                                            >
                                                Low Votes
                                            </Button>
                                        </div>
                                    </div>

                                    <ScrollArea className="flex-1 p-0">
                                        <div className="p-6 space-y-4">
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
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className="font-semibold leading-snug">{idea.title}</h4>
                                                                    {idea.isMine && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">YOU</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
        </>
    )
}
