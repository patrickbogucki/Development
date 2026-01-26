"use client"

import { useState } from "react"
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

    const handleSubmit = async () => {
        if (!isFormValid()) return

        setIsSubmitting(true)

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        const baseData = {
            timestamp: new Date().toISOString(),
            attachment: attachment ? attachment.name : null
        }

        let payload = {}
        if (mode === "idea") {
            payload = { target_table: "idea", ...ideaForm, ...baseData }
        } else if (mode === "feedback") {
            payload = { target_table: "feedback", ...feedbackForm, ...baseData }
        } else if (mode === "broken") {
            payload = { target_table: "incident", ...brokenForm, ...baseData }
        }

        console.log("Form Submitted:", JSON.stringify(payload, null, 2))

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
    }

    const emojis = [
        { level: 1, label: "Terrible", icon: "😠", displayName: "Terrible" },
        { level: 2, label: "Bad", icon: "🙁", displayName: "Bad" },
        { level: 3, label: "Neutral", icon: "😐", displayName: "Neutral" },
        { level: 4, label: "Good", icon: "🙂", displayName: "Good" },
        { level: 5, label: "Great", icon: "😍", displayName: "Great" },
    ]

    const [communitySort, setCommunitySort] = useState<"newest" | "high" | "low">("newest")

    const historyData = [
        { id: 1, title: "Add Dark Mode support", type: "Idea", status: "Under Review", date: "2 days ago", statusColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
        { id: 2, title: "Login button not working on Safari", type: "Incident", status: "Resolved", date: "1 week ago", statusColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
        { id: 3, title: "Great UX on the new dashboard", type: "Feedback", status: "New", date: "2 weeks ago", statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" }
    ]

    const [communityIdeas, setCommunityIdeas] = useState([
        { id: 101, title: "Allow exporting reports to PDF", votes: 124, author: "Sarah M.", time: "2h ago", avatar: "SM" },
        { id: 102, title: "Integrate with Slack", votes: 89, author: "Mike T.", time: "5h ago", avatar: "MT" },
        { id: 103, title: "Keyboard shortcuts for navigation", votes: 45, author: "Alex R.", time: "1d ago", avatar: "AR" },
        { id: 104, title: "Customizable dashboard widgets", votes: 230, author: "Jessica L.", time: "3d ago", avatar: "JL" },
    ])

    const handleVote = (id: number) => {
        setCommunityIdeas(prev => prev.map(idea =>
            idea.id === id ? { ...idea, votes: idea.votes + 1 } : idea
        ))
    }

    const sortedIdeas = [...communityIdeas].sort((a, b) => {
        if (communitySort === "high") return b.votes - a.votes
        if (communitySort === "low") return a.votes - b.votes
        return 0 // Default original order (mock newest)
    })

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
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full content-center pb-20"
                                        >
                                            {selectionOptions.map((option) => (
                                                <div key={option.id} onClick={() => setMode(option.id as FeedbackType)}>
                                                    <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 h-full border-zinc-200 dark:border-zinc-800">
                                                        <CardContent className="flex flex-col items-center text-center p-6 gap-4 pt-10">
                                                            <div className={`p-4 rounded-full ${option.bg} ${option.color}`}>
                                                                <option.icon className="h-8 w-8" />
                                                            </div>
                                                            <div className="space-y-2">
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
                                        {historyData.map((item) => (
                                            <Card key={item.id} className="overflow-hidden">
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.statusColor}`}>
                                                                {item.status}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">{item.date}</span>
                                                        </div>
                                                        <p className="font-medium">{item.title}</p>
                                                        <p className="text-xs text-muted-foreground">Type: {item.type}</p>
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
                                        <h3 className="text-sm font-semibold text-muted-foreground">Community Ideas</h3>
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
                                            {sortedIdeas.map((idea) => (
                                                <div key={idea.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                                                    <div className="flex flex-col items-center gap-1 min-w-[50px]">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                                            onClick={() => handleVote(idea.id)}
                                                        >
                                                            <ThumbsUp className="h-4 w-4" />
                                                        </Button>
                                                        <span className="text-sm font-bold">{idea.votes}</span>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <h4 className="font-semibold leading-none">{idea.title}</h4>
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
                                            ))}
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
