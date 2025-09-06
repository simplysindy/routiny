# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Routiny API
  version: 1.0.0
  description: Simple REST API for task breakdown and management
servers:
  - url: https://routiny.vercel.app/api
    description: Production API

paths:
  /tasks:
    post:
      summary: Create new task with AI breakdown
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                  description: User's task description
      responses:
        201:
          description: Task created with AI breakdown
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Task"
    get:
      summary: Get user's tasks
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, in_progress, completed]
      responses:
        200:
          description: List of tasks
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Task"

  /tasks/{id}/steps/{stepId}/complete:
    post:
      summary: Mark task step as complete
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
        - name: stepId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Step marked complete
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TaskStep"

  /user/stats:
    get:
      summary: Get user streak and completion statistics
      responses:
        200:
          description: User statistics
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserStats"

  /analytics/langfuse:
    get:
      summary: Get AI/LLM usage analytics and insights
      parameters:
        - name: timeframe
          in: query
          schema:
            type: string
            enum: [1d, 7d, 30d, 90d]
            default: 7d
      responses:
        200:
          description: Langfuse analytics data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LangfuseAnalytics"

components:
  schemas:
    Task:
      type: object
      properties:
        id:
          type: string
        user_id:
          type: string
        title:
          type: string
        ai_breakdown:
          type: array
          items:
            type: string
        status:
          type: string
          enum: [pending, in_progress, completed]
        completed_at:
          type: string
          format: date-time
          nullable: true
        created_at:
          type: string
          format: date-time

    TaskStep:
      type: object
      properties:
        id:
          type: string
        task_id:
          type: string
        step_text:
          type: string
        order_index:
          type: number
        completed:
          type: boolean
        completed_at:
          type: string
          format: date-time
          nullable: true

    UserStats:
      type: object
      properties:
        streak_count:
          type: number
        total_tasks_completed:
          type: number
        tasks_this_week:
          type: number

    LangfuseAnalytics:
      type: object
      properties:
        totalTraces:
          type: number
        totalGenerations:
          type: number
        averageTokensPerTask:
          type: number
        totalCost:
          type: number
          format: float
        averageLatency:
          type: number
          format: float
        modelPerformance:
          type: array
          items:
            type: object
            properties:
              model:
                type: string
              successRate:
                type: number
                format: float
              averageLatency:
                type: number
              totalTokens:
                type: number
              cost:
                type: number
                format: float
        userEngagement:
          type: object
          properties:
            averageCompletionRate:
              type: number
              format: float
            averageTimeToComplete:
              type: number
            mostEffectiveBreakdownLength:
              type: number
```
