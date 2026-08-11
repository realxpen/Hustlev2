import { LearningRepository } from "../repositories/learningRepository";
import { 
  Lesson, 
  SkillPath, 
  UserProgress, 
  LessonRecommendation, 
  PathCompletionRate 
} from "../types/learning";

export class LearningService {
  private repository: LearningRepository;

  constructor() {
    this.repository = LearningRepository.getInstance();
  }

  /**
   * Records that a user has finalized a lesson. 
   * Awards path XP, updates completed maps, and yields tracking metrics.
   */
  public async recordProgress(userId: string, lessonId: string): Promise<{ progress: UserProgress; xpEarned: number; newlyCompletedPath?: boolean }> {
    const lesson = this.repository.getLessonById(lessonId);
    if (!lesson) {
      throw new Error(`Lesson with ID ${lessonId} does not exist`);
    }

    const existingProgress = this.repository.getProgressForUserAndLesson(userId, lessonId);
    if (existingProgress && existingProgress.completed) {
      return { 
        progress: existingProgress, 
        xpEarned: 0 
      };
    }

    // Capture standard system progress
    const progress: UserProgress = {
      id: `prog-${userId}-${lessonId}`,
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString()
    };

    const saved = this.repository.saveProgress(progress);

    // Auto-follow learning path to enhance dashboard usability
    this.repository.followPathForUser(userId, lesson.skill_path_id);

    // Check if path is newly 100% completed
    const pathLessons = this.repository.getLessonsByPathId(lesson.skill_path_id);
    const completedRecords = this.repository.getProgressForUser(userId);
    const completedInPath = pathLessons.filter(l => 
      completedRecords.some(r => r.lesson_id === l.id && r.completed)
    );

    const newlyCompletedPath = completedInPath.length === pathLessons.length && 
      (!existingProgress || !existingProgress.completed);

    return {
      progress: saved,
      xpEarned: lesson.xp_reward,
      newlyCompletedPath
    };
  }

  /**
   * Returns skill paths, enriched with specific curriculum stages & completion calculations.
   */
  public async getSkillPathsWithMetrics(userId: string): Promise<(SkillPath & { metrics: PathCompletionRate })[]> {
    const paths = this.repository.getAllPaths();
    const completedRecords = this.repository.getProgressForUser(userId);

    return paths.map(path => {
      const lessons = this.repository.getLessonsByPathId(path.id);
      const totalLessons = lessons.length;
      
      const completedInPath = lessons.filter(l => 
        completedRecords.some(r => r.lesson_id === l.id && r.completed)
      ).length;

      const progressPercentage = totalLessons > 0 
        ? Math.round((completedInPath / totalLessons) * 100) 
        : 0;

      return {
        ...path,
        lessons,
        metrics: {
          pathId: path.id,
          pathTitle: path.title,
          totalLessons,
          completedLessons: completedInPath,
          progressPercentage
        }
      };
    });
  }

  /**
   * Brainstorms smart recommendations for student workflows:
   * Heuristic rules:
   * 1. Prioritize unfinished lessons in followed paths.
   * 2. Recommend in step order of absolute leveling (Beginner → Intermediate → Advanced). One should not do Advanced without completing Beginner!
   * 3. Promote introductory lessons for unexplored skill streams so they can branch out.
   */
  public async getRecommendations(userId: string): Promise<LessonRecommendation[]> {
    const followedPaths = this.repository.getFollowedPathIdsOfUser(userId);
    const completedRecords = this.repository.getProgressForUser(userId);
    const completedIds = new Set(completedRecords.filter(r => r.completed).map(r => r.lesson_id));
    const allPaths = this.repository.getAllPaths();

    const recommendations: LessonRecommendation[] = [];

    // Rule 1 & 2: Active curriculum progression in followed streams
    for (const pathId of followedPaths) {
      const path = this.repository.getPathById(pathId);
      if (!path) continue;

      const pathLessons = this.repository.getLessonsByPathId(pathId);
      
      // Sort in levels order so dynamic sequential pacing holds
      const beginner = pathLessons.filter(l => l.level === "beginner");
      const intermediate = pathLessons.filter(l => l.level === "intermediate");
      const advanced = pathLessons.filter(l => l.level === "advanced");

      const orderedLessons = [...beginner, ...intermediate, ...advanced];

      // Identify the first unfinished sequential milestone
      const nextLesson = orderedLessons.find(l => !completedIds.has(l.id));
      if (nextLesson) {
        let reason = `Progress your curriculum in "${path.title}"`;
        if (nextLesson.level === "intermediate") {
          reason = `Step up: Try intermediate concepts in "${path.title}"`;
        } else if (nextLesson.level === "advanced") {
          reason = `Masterclass: Final challenge stage of "${path.title}"`;
        }

        recommendations.push({
          lesson: nextLesson,
          reason,
          difficultyScale: this.getDifficultyColor(nextLesson.level)
        });
      }
    }

    // Rule 3: Cross-functional branch pathways (recommend rookie beginner levels of unexplored paths)
    for (const path of allPaths) {
      if (followedPaths.includes(path.id)) continue; // skip already tracked pathways

      const beginnersInPath = this.repository.getLessonsByPathId(path.id).filter(l => l.level === "beginner");
      const uncompletedBeginner = beginnersInPath.find(l => !completedIds.has(l.id));

      if (uncompletedBeginner) {
        recommendations.push({
          lesson: uncompletedBeginner,
          reason: `Branch out: Learn foundational elements of "${path.title}"`,
          difficultyScale: "green"
        });
      }
    }

    // Fallback: If everything followed is 100% completed and no other unexplored rookies, list any pending lessons
    if (recommendations.length === 0) {
      const allLessons = this.repository.getAllLessons();
      const anyUncompleted = allLessons.filter(l => !completedIds.has(l.id));

      anyUncompleted.slice(0, 3).forEach(l => {
        const path = this.repository.getPathById(l.skill_path_id);
        recommendations.push({
          lesson: l,
          reason: `Recommended next step in "${path?.title || 'Academy'}"`,
          difficultyScale: this.getDifficultyColor(l.level)
        });
      });
    }

    return recommendations.slice(0, 4); // return top 4 clean recommendations
  }

  private getDifficultyColor(level: 'beginner' | 'intermediate' | 'advanced'): 'green' | 'amber' | 'red' {
    if (level === "beginner") return "green";
    if (level === "intermediate") return "amber";
    return "red";
  }

  public async getDashboardSummary(userId: string): Promise<{ totalXp: number; completedCount: number; pathMetrics: PathCompletionRate[] }> {
    const completedRecords = this.repository.getProgressForUser(userId).filter(r => r.completed);
    
    // Accumulate total points
    let totalXp = 0;
    completedRecords.forEach(r => {
      const lesson = this.repository.getLessonById(r.lesson_id);
      if (lesson) {
        totalXp += lesson.xp_reward;
      }
    });

    const pathMetricsEnriched = await this.getSkillPathsWithMetrics(userId);
    const pathMetrics = pathMetricsEnriched.map(p => p.metrics);

    return {
      totalXp,
      completedCount: completedRecords.length,
      pathMetrics
    };
  }

  /**
   * Explicit path subscription helper
   */
  public async subscribeToPath(userId: string, pathId: string): Promise<string[]> {
    return this.repository.followPathForUser(userId, pathId);
  }

  /**
   * Explicit path unsubscribe helper
   */
  public async unsubscribeFromPath(userId: string, pathId: string): Promise<string[]> {
    return this.repository.unfollowPathForUser(userId, pathId);
  }
}
