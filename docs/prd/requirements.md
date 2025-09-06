# Requirements

## Functional

1. **FR1:** The system shall accept task input via text interface with voice input support for maximum convenience
2. **FR2:** The system shall use GPT-4 API to break down any user task into 5-7 micro-steps within 3 seconds
3. **FR3:** Each AI-generated breakdown shall include psychological rationale for step ordering and friction reduction
4. **FR4:** The system shall present micro-steps in a simple todo list format with interactive checkboxes
5. **FR5:** The system shall track user progress through each micro-step with real-time completion status
6. **FR6:** The system shall provide a pixel-art coach character with 3 states: idle, encouraging, and celebrating
7. **FR7:** The system shall maintain streak counters for consecutive days of task completion
8. **FR8:** The system shall implement magic link authentication via Supabase for frictionless login
9. **FR9:** The system shall synchronize user tasks, progress, and streaks across devices
10. **FR10:** The system shall function offline with local data persistence and sync when online
11. **FR11:** The system shall install as a PWA on iPhone with native-like experience
12. **FR12:** The system shall provide fallback responses if OpenAI API is unavailable

## Non-Functional

1. **NFR1:** API response time for AI task breakdown should target under 3 seconds for good user experience
2. **NFR2:** App should load efficiently on mobile devices with reasonable performance
3. **NFR3:** The system should handle errors gracefully without crashing
4. **NFR4:** The system should achieve good Lighthouse performance scores as a learning exercise
5. **NFR5:** Animations should be smooth and not impact usability
6. **NFR6:** API costs should be monitored and kept reasonable for a learning project
7. **NFR7:** The system should support offline functionality for core task completion workflows
8. **NFR8:** The system should be optimized for iPhone Safari 14+ and iOS 14+ devices
9. **NFR9:** User data should be handled securely following basic security practices
10. **NFR10:** The system should handle API rate limiting gracefully with user feedback
