# Project Brief: Routiny

## Executive Summary

**Routiny** is an AI-powered Progressive Web App that breaks down overwhelming tasks into tiny, manageable micro-steps to eliminate procrastination. The app leverages psychological principles and gamification to help users complete tasks by making the first step trivial and building momentum through dopamine-driven rewards. Targeting iPhone users initially, Routiny addresses the core problem that 87% of people waste 3.2 hours daily on procrastination by providing instant, actionable micro-steps in under 3 seconds. This is a full-stack learning project focused on building comprehensive development skills while creating a potentially viable product.

## Problem Statement

**Current State:** The vast majority of people struggle with procrastination, with research showing that 87% waste approximately 3.2 hours daily avoiding tasks. The primary psychological barrier is that tasks feel overwhelming when viewed as single large chunks, creating friction that prevents people from starting.

**Impact:** This procrastination epidemic leads to:

- Decreased productivity and goal achievement
- Increased stress and anxiety around unfinished tasks
- Reduced sense of accomplishment and self-efficacy
- Wasted time that could be used productively

**Why Existing Solutions Fall Short:**

- Task management apps focus on organization, not execution psychology
- Most solutions don't address the psychological friction of starting
- Generic productivity apps lack personalized, intelligent task breakdown
- Complex interfaces add friction rather than removing it

**Urgency:** With mobile-first behavior and demand for instant solutions, there's an opportunity to create a frictionless tool that leverages AI to provide immediate, personalized task breakdown.

## Proposed Solution

**Core Concept:** Routiny uses AI (GPT-4) to instantly break down any user-inputted task into 5-7 micro-steps, with the first step always designed to reduce friction (e.g., environmental setup, gathering materials). Each step is psychologically crafted to feel impossible to fail.

**Key Differentiators:**

- **Instant AI breakdown** in under 3 seconds with psychological rationale for each step
- **Mobile-first PWA** that feels native without app store friction
- **Gamified experience** with pixel-art coach character, streaks, and celebrations
- **Offline-first architecture** ensuring functionality without internet connection
- **Voice input support** for maximum convenience

**Why This Will Succeed:**

- Addresses the core psychological barrier (getting started) rather than just organization
- Leverages proven psychological principles (small wins, environmental cues)
- Combines modern AI capabilities with mobile-native experience
- Focuses on dopamine-driven rewards to build sustainable habits

## Target Users

### Primary User Segment: Procrastination-Prone Individuals

**Demographics:**

- Age: 18-35 years old
- Tech-savvy iPhone users
- Students, professionals, and entrepreneurs
- Income: $30k-$100k annually

**Current Behaviors:**

- Use multiple productivity apps but struggle with consistency
- Frequently delay starting important tasks
- Spend significant time on social media/entertainment when avoiding work
- Experience guilt and stress about incomplete tasks

**Specific Needs:**

- Need immediate motivation to start tasks
- Require psychological support and encouragement
- Want simple, friction-free tools
- Value progress tracking and achievement recognition

**Goals:**

- Complete important tasks without overwhelming anxiety
- Build sustainable productivity habits
- Feel sense of accomplishment and progress
- Reduce procrastination-related stress

### Secondary User Segment: Productivity Enthusiasts

**Demographics:**

- Age: 25-45 years old
- Already use various productivity tools
- Often in leadership or self-directed roles

**Needs:**

- More sophisticated task breakdown capabilities
- Integration with existing workflows
- Advanced analytics and insights
- Ability to share methodologies with others

## Goals & Success Metrics

### Business Objectives

- **Learning Goal:** Successfully complete first full-stack application with modern tech stack
- **Product Validation:** Achieve 500+ installs within first month
- **User Engagement:** Maintain 40% Day-7 retention rate
- **Technical Excellence:** Achieve 95+ Lighthouse performance score
- **Revenue Proof-of-Concept:** Generate $100+ MRR by month 3

### User Success Metrics

- **Task Completion Rate:** 65% of created tasks completed
- **Daily Active Usage:** Users return 30% of days in a month
- **Step Progression:** Average 4.2 steps completed per task
- **Streak Achievement:** 25% of users achieve 7+ day streaks
- **User Satisfaction:** 4.5+ star rating from beta users

### Key Performance Indicators (KPIs)

- **API Response Time:** <500ms for AI task breakdown
- **App Load Time:** <1.5 seconds on 3G
- **Crash-Free Rate:** 99.5% stability
- **Conversion Rate:** 5% free-to-pro conversion
- **Cost Per User:** <$0.50 monthly (primarily OpenAI costs)

## MVP Scope

### Core Features (Must Have)

- **Task Input with Voice Support:** Simple text input for any task with immediate AI processing
- **AI-Powered Task Breakdown:** GPT-4 integration that converts tasks into 5-7 micro-steps with psychological rationale
- **Step-by-Step Completion:** Simple todo list format with checkboxes for each micro-step and progress tracking
- **Basic Gamification:** Pixel-art coach character with 3 states (idle, encouraging, celebrating) and streak counter
- **PWA Installation:** Full Progressive Web App functionality with offline support and native iPhone experience
- **User Authentication:** Simple magic link authentication via Supabase
- **Data Persistence:** User tasks, progress, and streaks saved and synchronized
  s

### Out of Scope for MVP

- Advanced analytics dashboard
- Team/social features
- Calendar integration
- Multiple character options
- Voice input and output/text-to-speech
- Push notifications
- Advanced customization options
- Export functionality

### MVP Success Criteria

- PWA successfully installs on iPhone with native feel
- AI breakdown generates usable micro-steps in <3 seconds
- Users can complete full task flow (input → breakdown → completion) offline
- Core gamification elements (character, streaks) motivate continued usage
- 10 beta users complete at least 5 tasks each within first week

## Post-MVP Vision

### Phase 2 Features

- **Smart Notifications:** Intelligent reminders based on user patterns and preferences
- **Voice Integration:** Text-to-speech for step reading and voice-only interaction
- **Advanced Gamification:** Achievement system, character customization, and social sharing
- **Analytics Dashboard:** Personal productivity insights and completion patterns
- **Template System:** Pre-built task breakdowns for common activities

### Long-term Vision

Within 1-2 years, Routiny becomes the go-to AI productivity companion that understands individual user psychology and preferences. The app evolves into a comprehensive habit-building platform that can handle complex project management while maintaining its core simplicity. Integration with calendar systems, smart home devices, and other productivity tools creates a seamless productivity ecosystem.

### Expansion Opportunities

- **Platform Expansion:** Android optimization and desktop PWA support
- **Enterprise Solutions:** Team productivity features and corporate packages
- **Developer Platform:** API access for third-party integrations
- **Content Marketplace:** User-generated task templates and coaching methodologies
- **International Markets:** Multi-language support and cultural adaptation

## Technical Considerations

### Platform Requirements

- **Target Platforms:** iPhone (primary), with progressive enhancement for other mobile devices
- **Browser/OS Support:** Safari 14+, Chrome 90+, iOS 14+ optimized
- **Performance Requirements:** <1.5s load time, <500ms API responses, 60fps animations

### Technology Preferences

- **Frontend:** Next.js 14 with App Router, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, Supabase (PostgreSQL + Auth), OpenAI GPT-4 API
- **Database:** PostgreSQL via Supabase with optimized schema for personal use scaling
- **Hosting/Infrastructure:** Vercel deployment with Upstash Redis caching

### Architecture Considerations

- **Repository Structure:** Monorepo with clear separation of concerns, component-driven architecture
- **Service Architecture:** API-first design with caching layer, offline-first data strategy
- **Integration Requirements:** OpenAI API with fallback responses, Supabase real-time subscriptions
- **Security/Compliance:** Environment variable management, API rate limiting, user data protection

## Constraints & Assumptions

### Constraints

- **Budget:** $50-100/month operational costs (primarily OpenAI API usage)
- **Timeline:** Flexible development timeline focused on learning over speed
- **Resources:** Solo developer project, no external team or funding
- **Technical:** First full-stack project, learning curve for PWA implementation and AI integration

### Key Assumptions

- Users will find AI-generated micro-steps more actionable than self-created task lists
- PWA installation experience on iPhone will be acceptable to target users
- OpenAI API costs will remain predictable and scalable with user growth
- Gamification elements will provide sufficient motivation for sustained usage
- Offline functionality is crucial for mobile productivity app success
- Simple magic link authentication will meet user security expectations

## Risks & Open Questions

### Key Risks

- **AI Response Quality:** OpenAI may generate unusable or inappropriate task breakdowns for certain inputs
- **Cost Scalability:** API costs could become prohibitive if user adoption exceeds revenue generation
- **PWA Limitations:** iOS PWA restrictions might impact user experience compared to native apps
- **User Retention:** Gamification might not provide lasting motivation beyond initial novelty period
- **Technical Complexity:** First full-stack project may encounter unexpected implementation challenges

### Open Questions

- What's the optimal balance between AI creativity and consistency in task breakdowns?
- How can we ensure AI responses remain helpful across diverse task types and user contexts?
- What offline functionality is truly essential vs. nice-to-have?
- How do we measure and optimize for the psychological effectiveness of micro-steps?
- What's the minimum viable gamification that drives behavior change?

### Areas Needing Further Research

- User testing of AI-generated task breakdowns for effectiveness
- PWA performance benchmarking on various iPhone models and iOS versions
- Competitive analysis of similar AI-powered productivity tools
- Cost modeling for different user growth scenarios
- Accessibility requirements for broader user adoption

## Appendices

### A. Research Summary

Based on the comprehensive planning document, key research findings include:

- 87% of people waste 3.2 hours daily on procrastination (cited statistic)
- First step environmental setup increases task completion by 70%
- Mobile-first PWA approach reduces friction compared to app store distribution
- Gamification with character-based motivation shows higher engagement rates
- Offline-first architecture is essential for productivity applications

### B. Stakeholder Input

Primary stakeholder: Developer (learning-focused)

- Priority on comprehensive full-stack learning experience
- Interest in modern tech stack implementation
- Focus on building deployable, functional product
- Flexible timeline allowing for learning and iteration

### C. References

- Next.js PWA implementation guides and best practices
- OpenAI API documentation and usage optimization
- iOS PWA limitations and workaround strategies
- Supabase authentication and database management
- Psychological research on task completion and habit formation

## Next Steps

### Immediate Actions

1. **Repository Setup:** Initialize Next.js project with TypeScript and required dependencies
2. **Environment Configuration:** Set up Supabase project and OpenAI API access
3. **Basic PWA Structure:** Implement manifest.json and service worker foundation
4. **Authentication Flow:** Create magic link login system with Supabase
5. **Database Schema:** Implement core tables for users, goals, and micro-steps
6. **AI Integration:** Build task breakdown API endpoint with OpenAI integration
7. **Core UI Components:** Develop task input, step cards, and basic character interface
8. **Testing Framework:** Set up testing environment for both frontend and API

### PM Handoff

This Project Brief provides the full context for **Routiny**. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.
